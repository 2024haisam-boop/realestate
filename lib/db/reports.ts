import { createClient } from '@/lib/supabase/server';
import type {
  LeadRow,
  LeadSource,
  LeadStatus,
} from '@/lib/supabase/types';
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from '@/lib/constants';

export interface DateRange {
  from: string;
  to: string;
}

export interface SourceCount {
  source: LeadSource;
  label: string;
  count: number;
}

export interface StatusCount {
  status: LeadStatus;
  label: string;
  count: number;
}

export interface AgentRow {
  agentId: string;
  agentName: string;
  leadsAssigned: number;
  callsMade: number;
  callsConnected: number;
  followupsCompleted: number;
  wonLeads: number;
  conversionRate: number;
}

export interface CompletionPoint {
  date: string;
  completed: number;
  due: number;
  pct: number;
}

export interface PropertyShareCount {
  propertyId: string;
  title: string;
  count: number;
}

export interface FunnelStage {
  status: LeadStatus;
  label: string;
  count: number;
}

const FUNNEL_ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'site_visit_scheduled',
  'negotiation',
  'won',
];

async function fetchLeadsInRange(
  organizationId: string,
  range: DateRange,
): Promise<Pick<LeadRow, 'id' | 'source' | 'status' | 'assigned_agent_id' | 'created_at' | 'updated_at'>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('leads')
    .select('id, source, status, assigned_agent_id, created_at, updated_at')
    .eq('organization_id', organizationId)
    .gte('created_at', range.from)
    .lte('created_at', range.to);
  return data ?? [];
}

export async function leadsBySource(organizationId: string, range: DateRange): Promise<SourceCount[]> {
  const leads = await fetchLeadsInRange(organizationId, range);
  const counts = new Map<LeadSource, number>();
  for (const lead of leads) {
    counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, label: LEAD_SOURCE_LABEL[source], count }))
    .sort((a, b) => b.count - a.count);
}

export async function leadsByStatus(organizationId: string, range: DateRange): Promise<StatusCount[]> {
  const leads = await fetchLeadsInRange(organizationId, range);
  const counts = new Map<LeadStatus, number>();
  for (const lead of leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, label: LEAD_STATUS_LABEL[status], count }))
    .sort((a, b) => b.count - a.count);
}

export async function wonLostFunnel(
  organizationId: string,
  range: DateRange,
): Promise<FunnelStage[]> {
  const leads = await fetchLeadsInRange(organizationId, range);
  return FUNNEL_ORDER.map((status) => ({
    status,
    label: LEAD_STATUS_LABEL[status],
    count: leads.filter((l) => l.status === status).length,
  }));
}

export async function agentPerformance(
  organizationId: string,
  range: DateRange,
): Promise<AgentRow[]> {
  const supabase = await createClient();
  const [{ data: agents }, leads, { data: calls }, { data: followups }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', organizationId)
      .eq('role', 'sales_agent'),
    fetchLeadsInRange(organizationId, range),
    supabase
      .from('calls')
      .select('id, agent_id, status')
      .eq('organization_id', organizationId)
      .gte('started_at', range.from)
      .lte('started_at', range.to),
    supabase
      .from('followups')
      .select('id, agent_id, status')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('completed_at', range.from)
      .lte('completed_at', range.to),
  ]);

  const rows: AgentRow[] = (agents ?? []).map((agent) => {
    const agentLeads = leads.filter((l) => l.assigned_agent_id === agent.id);
    const agentCalls = (calls ?? []).filter((c) => c.agent_id === agent.id);
    const agentConnected = agentCalls.filter((c) => c.status === 'completed' || c.status === 'connected');
    const completed = (followups ?? []).filter((f) => f.agent_id === agent.id);
    const won = agentLeads.filter((l) => l.status === 'won').length;
    return {
      agentId: agent.id,
      agentName: agent.full_name,
      leadsAssigned: agentLeads.length,
      callsMade: agentCalls.length,
      callsConnected: agentConnected.length,
      followupsCompleted: completed.length,
      wonLeads: won,
      conversionRate: agentLeads.length === 0 ? 0 : Math.round((won / agentLeads.length) * 100),
    };
  });
  rows.sort((a, b) => b.wonLeads - a.wonLeads || b.leadsAssigned - a.leadsAssigned);
  return rows;
}

export async function followupCompletionByDay(
  organizationId: string,
  range: DateRange,
): Promise<CompletionPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('followups')
    .select('scheduled_at, status, completed_at')
    .eq('organization_id', organizationId)
    .gte('scheduled_at', range.from)
    .lte('scheduled_at', range.to);

  const dayMap = new Map<string, { due: number; completed: number }>();
  for (const f of data ?? []) {
    const day = f.scheduled_at.slice(0, 10);
    const entry = dayMap.get(day) ?? { due: 0, completed: 0 };
    entry.due += 1;
    if (f.status === 'completed') entry.completed += 1;
    dayMap.set(day, entry);
  }
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      due: v.due,
      completed: v.completed,
      pct: v.due === 0 ? 0 : Math.round((v.completed / v.due) * 100),
    }));
}

export async function propertiesShared(
  organizationId: string,
  range: DateRange,
  limit = 12,
): Promise<PropertyShareCount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lead_property_shares')
    .select('property_id, property:properties(title)')
    .eq('organization_id', organizationId)
    .gte('created_at', range.from)
    .lte('created_at', range.to);

  const counts = new Map<string, { title: string; count: number }>();
  for (const row of data ?? []) {
    if (!row.property_id) continue;
    const propRel = (row as unknown as { property: { title?: string } | { title?: string }[] | null }).property;
    const title = Array.isArray(propRel) ? (propRel[0]?.title ?? 'Property') : (propRel?.title ?? 'Property');
    const entry = counts.get(row.property_id) ?? { title, count: 0 };
    entry.count += 1;
    counts.set(row.property_id, entry);
  }
  return Array.from(counts.entries())
    .map(([propertyId, v]) => ({ propertyId, title: v.title, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function presetRange(
  preset: '7d' | '30d' | '90d' | 'month' | 'custom',
  customFrom?: string,
  customTo?: string,
): DateRange {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case '7d':
      start.setDate(start.getDate() - 6);
      break;
    case '30d':
      start.setDate(start.getDate() - 29);
      break;
    case '90d':
      start.setDate(start.getDate() - 89);
      break;
    case 'month':
      start.setDate(1);
      break;
    case 'custom': {
      const from = customFrom ? new Date(customFrom) : start;
      const to = customTo ? new Date(customTo) : end;
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return { from: from.toISOString(), to: to.toISOString() };
    }
  }
  return { from: start.toISOString(), to: end.toISOString() };
}
