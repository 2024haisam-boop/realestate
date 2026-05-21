import { createClient } from '@/lib/supabase/server';
import type { ActivityRow, ActivityType } from '@/lib/supabase/types';

export interface ActivityWithActor extends ActivityRow {
  user: { id: string; full_name: string; avatar_url: string | null } | null;
}

export async function listRecentActivities(
  organizationId: string,
  limit = 20,
): Promise<ActivityWithActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activities')
    .select(
      'id, organization_id, lead_id, user_id, type, title, description, metadata, created_at, user:profiles(id, full_name, avatar_url)',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    organization_id: row.organization_id,
    lead_id: row.lead_id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description,
    metadata: row.metadata,
    created_at: row.created_at,
    user: Array.isArray(row.user) ? (row.user[0] ?? null) : row.user,
  }));
}

interface CreateActivityInput {
  organizationId: string;
  leadId?: string | null;
  userId?: string | null;
  type: ActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createActivity(input: CreateActivityInput): Promise<void> {
  const supabase = await createClient();
  await supabase.from('activities').insert({
    organization_id: input.organizationId,
    lead_id: input.leadId ?? null,
    user_id: input.userId ?? null,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    metadata: (input.metadata ?? {}) as never,
  });
}
