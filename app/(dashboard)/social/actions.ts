'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionUser } from '@/lib/db/users';
import {
  createSocialPost,
  deleteSocialPost,
  getSocialPostById,
  updateSocialPost,
} from '@/lib/db/social';
import { generateCaption } from '@/lib/services/aiService';
import { dispatchToZapier } from '@/lib/services/socialPostService';
import {
  generateCaptionSchema,
  socialPostCreateSchema,
  socialPostUpdateSchema,
  type GenerateCaptionInput,
  type SocialPostCreateInput,
  type SocialPostUpdateInput,
} from '@/lib/validations/social.schema';
import { fail, ok, type ActionResult } from '@/lib/types';
import { isManagerial } from '@/lib/constants';
import type { PostPlatform, PostStatus } from '@/lib/supabase/types';

export async function createSocialPostAction(
  raw: SocialPostCreateInput,
): Promise<ActionResult<{ postId: string }>> {
  const me = await requireSessionUser();
  const parsed = socialPostCreateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const v = parsed.data;

  const post = await createSocialPost({
    organizationId: me.organizationId,
    createdBy: me.id,
    platform: v.platform as PostPlatform,
    caption: v.caption || null,
    status: (v.status as PostStatus) ?? 'idea',
    scheduledAt: v.scheduledAt || null,
    assignedTo: v.assignedTo || null,
    notes: v.notes || null,
    mediaUrls: v.mediaUrls && v.mediaUrls.length > 0 ? v.mediaUrls : null,
  });
  if (!post) return fail('Could not create post');

  if (post.status === 'scheduled' && post.scheduled_at) {
    void dispatchToZapier(me.organizationId, {
      postId: post.id,
      platform: post.platform,
      caption: post.caption,
      mediaUrls: post.media_urls,
      scheduledAt: post.scheduled_at,
    });
  }

  revalidatePath('/social');
  return ok({ postId: post.id });
}

export async function updateSocialPostAction(raw: SocialPostUpdateInput): Promise<ActionResult<true>> {
  await requireSessionUser();
  const parsed = socialPostUpdateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const v = parsed.data;

  const patch: Parameters<typeof updateSocialPost>[1] = {};
  if (v.platform !== undefined) patch.platform = v.platform as PostPlatform;
  if (v.caption !== undefined) patch.caption = v.caption || null;
  if (v.status !== undefined) {
    patch.status = v.status as PostStatus;
    if (v.status === 'published') patch.published_at = new Date().toISOString();
  }
  if (v.scheduledAt !== undefined) patch.scheduled_at = v.scheduledAt || null;
  if (v.assignedTo !== undefined) patch.assigned_to = v.assignedTo || null;
  if (v.notes !== undefined) patch.notes = v.notes || null;
  if (v.mediaUrls !== undefined) patch.media_urls = v.mediaUrls && v.mediaUrls.length > 0 ? v.mediaUrls : null;

  if (Object.keys(patch).length === 0) return ok(true);
  const updated = await updateSocialPost(v.postId, patch);
  if (!updated) return fail('Could not update post');

  revalidatePath('/social');
  revalidatePath(`/social/${v.postId}`);
  return ok(true);
}

export async function deleteSocialPostAction(postId: string): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  if (!isManagerial(me.role) && me.role !== 'social_media_manager') {
    return fail('Only managers, admins, and social media managers can delete posts');
  }
  const success = await deleteSocialPost(postId);
  if (!success) return fail('Could not delete post');
  revalidatePath('/social');
  return ok(true);
}

export async function publishNowAction(postId: string): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  const existing = await getSocialPostById(postId);
  if (!existing) return fail('Post not found');

  const updated = await updateSocialPost(postId, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
  if (!updated) return fail('Could not publish');

  void dispatchToZapier(me.organizationId, {
    postId: existing.id,
    platform: existing.platform,
    caption: existing.caption,
    mediaUrls: existing.media_urls,
    scheduledAt: existing.scheduled_at,
  });

  revalidatePath('/social');
  return ok(true);
}

export async function generateCaptionAction(
  raw: GenerateCaptionInput,
): Promise<ActionResult<{ caption: string }>> {
  const me = await requireSessionUser();
  const parsed = generateCaptionSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const result = await generateCaption({
    organizationId: me.organizationId,
    platform: parsed.data.platform as PostPlatform,
    prompt: parsed.data.prompt,
  });

  if (result.unconfigured) {
    return fail('AI features require an OpenAI API key in Settings → Integrations');
  }
  if (!result.success || !result.caption) {
    return fail(result.error ?? 'AI returned no caption');
  }
  return ok({ caption: result.caption });
}
