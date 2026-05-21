import { createClient } from '@/lib/supabase/server';
import type {
  PostPlatform,
  PostStatus,
  SocialPostRow,
} from '@/lib/supabase/types';

export interface SocialPostWithAssignee extends SocialPostRow {
  assignee: { id: string; full_name: string; avatar_url: string | null } | null;
}

interface ListOptions {
  organizationId: string;
  status?: PostStatus | 'all';
  platform?: PostPlatform | 'all';
  /** Inclusive start of date window (yyyy-MM-dd or ISO). */
  from?: string;
  to?: string;
  limit?: number;
}

export async function listSocialPosts(opts: ListOptions): Promise<SocialPostWithAssignee[]> {
  const supabase = await createClient();
  let query = supabase
    .from('social_posts')
    .select(
      'id, organization_id, created_by, assigned_to, platform, caption, media_urls, status, scheduled_at, published_at, notes, zapier_webhook_sent, created_at, updated_at, assignee:profiles!social_posts_assigned_to_fkey(id, full_name, avatar_url)',
    )
    .eq('organization_id', opts.organizationId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);
  if (opts.platform && opts.platform !== 'all') query = query.eq('platform', opts.platform);
  if (opts.from) query = query.gte('scheduled_at', opts.from);
  if (opts.to) query = query.lte('scheduled_at', opts.to);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    ...row,
    assignee: Array.isArray(row.assignee) ? (row.assignee[0] ?? null) : row.assignee,
  })) as SocialPostWithAssignee[];
}

export async function getSocialPostById(postId: string): Promise<SocialPostRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('social_posts').select('*').eq('id', postId).maybeSingle();
  return data;
}

interface CreateInput {
  organizationId: string;
  createdBy: string;
  platform: PostPlatform;
  caption?: string | null;
  status?: PostStatus;
  scheduledAt?: string | null;
  assignedTo?: string | null;
  notes?: string | null;
  mediaUrls?: string[] | null;
}

export async function createSocialPost(input: CreateInput): Promise<SocialPostRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      organization_id: input.organizationId,
      created_by: input.createdBy,
      platform: input.platform,
      caption: input.caption ?? null,
      status: input.status ?? 'idea',
      scheduled_at: input.scheduledAt ?? null,
      assigned_to: input.assignedTo ?? null,
      notes: input.notes ?? null,
      media_urls: input.mediaUrls ?? null,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[social.createSocialPost]', error);
    return null;
  }
  return data;
}

export async function updateSocialPost(
  postId: string,
  patch: Partial<{
    platform: PostPlatform;
    caption: string | null;
    status: PostStatus;
    scheduled_at: string | null;
    published_at: string | null;
    assigned_to: string | null;
    notes: string | null;
    media_urls: string[] | null;
  }>,
): Promise<SocialPostRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('social_posts')
    .update(patch)
    .eq('id', postId)
    .select('*')
    .single();
  if (error) {
    console.error('[social.updateSocialPost]', error);
    return null;
  }
  return data;
}

export async function deleteSocialPost(postId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('social_posts').delete().eq('id', postId);
  return !error;
}
