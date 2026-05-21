import { createServiceClient } from '@/lib/supabase/server';

interface ZapierPostPayload {
  postId: string;
  platform: string;
  caption: string | null;
  mediaUrls: string[] | null;
  scheduledAt: string | null;
}

/**
 * Forward a scheduled post to a Zapier (or any HTTP) webhook so the user's
 * automation chooses how to actually publish it. The Zapier URL is configured
 * per-org via integration_settings.zapier_webhook_url.
 *
 * No-ops + returns false when no webhook is configured. Sets
 * social_posts.zapier_webhook_sent = true on success so we don't double-fire.
 */
export async function dispatchToZapier(
  organizationId: string,
  payload: ZapierPostPayload,
): Promise<boolean> {
  const admin = createServiceClient();
  const { data: settings } = await admin
    .from('integration_settings')
    .select('zapier_webhook_url')
    .eq('organization_id', organizationId)
    .maybeSingle();

  const url = settings?.zapier_webhook_url;
  if (!url) {
    console.log('[socialPostService] zapier_webhook_url not configured — skipping');
    return false;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('[socialPostService] webhook returned', res.status);
      return false;
    }
    await admin
      .from('social_posts')
      .update({ zapier_webhook_sent: true })
      .eq('id', payload.postId);
    return true;
  } catch (err) {
    console.error('[socialPostService] webhook error', err);
    return false;
  }
}
