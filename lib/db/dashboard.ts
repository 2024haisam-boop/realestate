import { createClient } from '@/lib/supabase/server';
import type { LeadRow, FollowupRow } from '@/lib/supabase/types';

export interface DashboardMetrics {
  newLeadsToday: number;
  callsMadeToday: number;
  followupsDue: number;
  hotLeads: number;
  siteVisitsToday: number;
  availableProperties: number;
  teamOnline: number;
  wonThisMonth: number;
}

function startOfDayISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function startOfMonthISO(date = new Date()): string {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const HEAD_COUNT = { count: 'exact', head: true } as const;

export async function getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const startToday = startOfDayISO();
  const endToday = endOfDayISO();
  const startMonth = startOfMonthISO();
  const today = todayDateString();
  const nowIso = new Date().toISOString();

  const promises = [
    supabase
      .from('leads')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .gte('created_at', startToday)
      .lte('created_at', endToday),

    supabase
      .from('calls')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .gte('started_at', startToday)
      .lte('started_at', endToday),

    supabase
      .from('followups')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .lte('scheduled_at', nowIso),

    supabase
      .from('leads')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .eq('is_hot', true)
      .not('status', 'in', '(won,lost)'),

    supabase
      .from('followups')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .eq('type', 'site_visit')
      .gte('scheduled_at', startToday)
      .lte('scheduled_at', endToday),

    supabase
      .from('properties')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .eq('status', 'available'),

    supabase
      .from('attendance')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .eq('date', today)
      .not('check_in_time', 'is', null)
      .is('check_out_time', null),

    supabase
      .from('leads')
      .select('id', HEAD_COUNT)
      .eq('organization_id', organizationId)
      .eq('status', 'won')
      .gte('updated_at', startMonth),
  ];

  const results = await Promise.all(promises);
  const counts = results.map((r) => r.count ?? 0);

  return {
    newLeadsToday: counts[0] ?? 0,
    callsMadeToday: counts[1] ?? 0,
    followupsDue: counts[2] ?? 0,
    hotLeads: counts[3] ?? 0,
    siteVisitsToday: counts[4] ?? 0,
    availableProperties: counts[5] ?? 0,
    teamOnline: counts[6] ?? 0,
    wonThisMonth: counts[7] ?? 0,
  };
}

export async function getHotLeads(organizationId: string, limit = 5): Promise<LeadRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_hot', true)
    .not('status', 'in', '(won,lost)')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function getFollowupsDueToday(
  organizationId: string,
  limit = 5,
): Promise<FollowupRow[]> {
  const supabase = await createClient();
  const endToday = endOfDayISO();
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .lte('scheduled_at', endToday)
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}
