import { createServiceClient } from '@/lib/supabase/server';
import type { LeadAssignmentMode, ProfileRow } from '@/lib/supabase/types';

export interface AssignmentResult {
  agentId: string | null;
  agent?: ProfileRow;
  reason?: 'no_agents_available' | 'manual_mode' | 'least_busy_unavailable';
}

/**
 * Round-robin assignment.
 *
 * Algorithm (per spec):
 *  1. Fetch active+available sales_agents in the org.
 *  2. Sort by last_assigned_at ASC, with NULL first.
 *  3. Tie-break on full_name ASC (alphabetical).
 *  4. Pick the first agent.
 *  5. Stamp last_assigned_at = now() on that agent.
 *  6. If no agents available -> return null + reason.
 *  7. Caller is expected to set lead.assigned_agent_id and create the activity.
 *
 * Uses the service-role client because webhook handlers run unauthenticated.
 */
async function assignRoundRobin(organizationId: string): Promise<AssignmentResult> {
  const admin = createServiceClient();

  const { data: agents, error } = await admin
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'sales_agent')
    .eq('is_active', true)
    .eq('is_available', true);

  if (error || !agents || agents.length === 0) {
    return { agentId: null, reason: 'no_agents_available' };
  }

  // Sort by last_assigned_at ASC nulls-first, tie-break on full_name.
  const sorted = [...agents].sort((a, b) => {
    const aNull = a.last_assigned_at == null;
    const bNull = b.last_assigned_at == null;
    if (aNull && !bNull) return -1;
    if (!aNull && bNull) return 1;
    if (!aNull && !bNull) {
      const aTime = new Date(a.last_assigned_at!).getTime();
      const bTime = new Date(b.last_assigned_at!).getTime();
      if (aTime !== bTime) return aTime - bTime;
    }
    return a.full_name.localeCompare(b.full_name);
  });

  const picked = sorted[0];
  if (!picked) return { agentId: null, reason: 'no_agents_available' };

  // Stamp the agent so the next round-robin picks the next person.
  const { error: stampError } = await admin
    .from('profiles')
    .update({ last_assigned_at: new Date().toISOString() })
    .eq('id', picked.id);

  if (stampError) {
    // If the stamp fails, the next round will still try this agent first —
    // not catastrophic, but worth logging.
    console.error('[leadAssignment] failed to stamp last_assigned_at', stampError);
  }

  return { agentId: picked.id, agent: picked };
}

/**
 * Pick an agent based on the org's configured assignment mode.
 * - round_robin: see assignRoundRobin
 * - least_busy: pick the agent with the fewest non-terminal assigned leads
 * - manual: never auto-assign
 */
export async function assignAgent(
  organizationId: string,
  mode: LeadAssignmentMode,
): Promise<AssignmentResult> {
  if (mode === 'manual') return { agentId: null, reason: 'manual_mode' };
  if (mode === 'round_robin') return assignRoundRobin(organizationId);

  // least_busy
  const admin = createServiceClient();
  const { data: agents } = await admin
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'sales_agent')
    .eq('is_active', true)
    .eq('is_available', true);

  if (!agents || agents.length === 0) {
    return { agentId: null, reason: 'least_busy_unavailable' };
  }

  const counts = await Promise.all(
    agents.map(async (agent) => {
      const { count } = await admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('assigned_agent_id', agent.id)
        .not('status', 'in', '(won,lost)');
      return { agent, count: count ?? 0 };
    }),
  );

  counts.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return a.agent.full_name.localeCompare(b.agent.full_name);
  });

  const winner = counts[0];
  if (!winner) return { agentId: null, reason: 'least_busy_unavailable' };

  await admin
    .from('profiles')
    .update({ last_assigned_at: new Date().toISOString() })
    .eq('id', winner.agent.id);

  return { agentId: winner.agent.id, agent: winner.agent };
}
