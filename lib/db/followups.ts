import { createClient } from '@/lib/supabase/server';
import type { FollowupRow, FollowupType, FollowupStatus } from '@/lib/supabase/types';

export interface FollowupWithLead extends FollowupRow {
  lead: {
    id: string;
    full_name: string;
    phone: string;
    status: string;
  } | null;
  agent: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface ListOptions {
  organizationId: string;
  currentUserId: string;
  /** 'mine' restricts to the current user's followups regardless of role. */
  scope: 'mine' | 'all' | 'unassigned';
  /** 'due' = pending + scheduled_at <= now. 'upcoming' = pending + future. */
  bucket?: 'due' | 'upcoming' | 'completed' | 'missed' | 'all';
  leadId?: string;
  limit?: number;
}

export async function listFollowups({
  organizationId,
  currentUserId,
  scope,
  bucket = 'all',
  leadId,
  limit = 100,
}: ListOptions): Promise<FollowupWithLead[]> {
  const supabase = await createClient();
  let query = supabase
    .from('followups')
    .select(
      'id, organization_id, lead_id, agent_id, type, status, scheduled_at, completed_at, notes, template_used, created_at, updated_at, lead:leads(id, full_name, phone, status), agent:profiles(id, full_name, avatar_url)',
    )
    .eq('organization_id', organizationId)
    .limit(limit);

  if (scope === 'mine') query = query.eq('agent_id', currentUserId);
  else if (scope === 'unassigned') query = query.is('agent_id', null);
  if (leadId) query = query.eq('lead_id', leadId);

  const now = new Date().toISOString();
  if (bucket === 'due') {
    query = query.eq('status', 'pending').lte('scheduled_at', now).order('scheduled_at', { ascending: true });
  } else if (bucket === 'upcoming') {
    query = query.eq('status', 'pending').gt('scheduled_at', now).order('scheduled_at', { ascending: true });
  } else if (bucket === 'completed') {
    query = query.eq('status', 'completed').order('completed_at', { ascending: false });
  } else if (bucket === 'missed') {
    query = query.eq('status', 'missed').order('scheduled_at', { ascending: false });
  } else {
    query = query.order('scheduled_at', { ascending: true });
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    ...row,
    lead: Array.isArray(row.lead) ? (row.lead[0] ?? null) : row.lead,
    agent: Array.isArray(row.agent) ? (row.agent[0] ?? null) : row.agent,
  })) as FollowupWithLead[];
}

interface CreateFollowupInput {
  organizationId: string;
  leadId: string;
  agentId: string | null;
  type: FollowupType;
  scheduledAt: string;
  notes?: string | null;
  templateUsed?: string | null;
}

export async function createFollowup(input: CreateFollowupInput): Promise<FollowupRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('followups')
    .insert({
      organization_id: input.organizationId,
      lead_id: input.leadId,
      agent_id: input.agentId,
      type: input.type,
      scheduled_at: input.scheduledAt,
      notes: input.notes ?? null,
      template_used: input.templateUsed ?? null,
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) {
    console.error('[followups.createFollowup]', error);
    return null;
  }
  return data;
}

export async function updateFollowupStatus(
  followupId: string,
  patch: { status: FollowupStatus; completedAt?: string | null; notes?: string | null; scheduledAt?: string },
): Promise<FollowupRow | null> {
  const supabase = await createClient();
  const update: Record<string, unknown> = { status: patch.status };
  if (patch.completedAt !== undefined) update.completed_at = patch.completedAt;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.scheduledAt !== undefined) update.scheduled_at = patch.scheduledAt;

  const { data, error } = await supabase
    .from('followups')
    .update(update)
    .eq('id', followupId)
    .select('*')
    .single();
  if (error) {
    console.error('[followups.updateFollowupStatus]', error);
    return null;
  }
  return data;
}

export async function getFollowupById(followupId: string): Promise<FollowupRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('followups').select('*').eq('id', followupId).maybeSingle();
  return data;
}
