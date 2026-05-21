import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { createClient } from '@/lib/supabase/server';
import type { ActivityWithActor } from '@/lib/db/activities';

interface LeadTimelineProps {
  leadId: string;
}

/** Server component: fetches activity rows for a single lead and renders them. */
export async function LeadTimeline({ leadId }: LeadTimelineProps) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('activities')
    .select(
      'id, organization_id, lead_id, user_id, type, title, description, metadata, created_at, user:profiles(id, full_name, avatar_url)',
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(100);

  const activities: ActivityWithActor[] = (data ?? []).map((row) => ({
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

  return <ActivityFeed activities={activities} />;
}
