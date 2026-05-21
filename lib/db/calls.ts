import { createClient } from '@/lib/supabase/server';
import type { CallRow } from '@/lib/supabase/types';

export interface CallWithAgent extends CallRow {
  agent: { id: string; full_name: string; avatar_url: string | null } | null;
}

export async function listCallsForLead(leadId: string): Promise<CallWithAgent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calls')
    .select(
      'id, organization_id, lead_id, agent_id, call_sid, conference_sid, agent_call_sid, lead_call_sid, status, outcome, duration_seconds, recording_url, is_dry_run, notes, started_at, ended_at, created_at, updated_at, agent:profiles(id, full_name, avatar_url)',
    )
    .eq('lead_id', leadId)
    .order('started_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    ...row,
    agent: Array.isArray(row.agent) ? (row.agent[0] ?? null) : row.agent,
  })) as CallWithAgent[];
}

export async function getCallByConferenceSid(conferenceSid: string): Promise<CallRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('calls')
    .select('*')
    .eq('conference_sid', conferenceSid)
    .maybeSingle();
  return data;
}

export async function getCallByCallSid(callSid: string): Promise<CallRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('calls').select('*').eq('call_sid', callSid).maybeSingle();
  return data;
}
