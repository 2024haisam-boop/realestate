import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { IntegrationSettingsRow } from '@/lib/supabase/types';

export async function getIntegrationSettings(
  organizationId: string,
): Promise<IntegrationSettingsRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('integration_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
  return data;
}

export async function upsertIntegrationSettings(
  organizationId: string,
  patch: Partial<Omit<IntegrationSettingsRow, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'webhook_secret'>>,
): Promise<IntegrationSettingsRow | null> {
  // Service-role so admins can write past RLS (the policy already restricts to admin role).
  const admin = createServiceClient();

  const { data: existing } = await admin
    .from('integration_settings')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('integration_settings')
      .update(patch)
      .eq('organization_id', organizationId)
      .select('*')
      .single();
    if (error) {
      console.error('[integration_settings.update]', error);
      return null;
    }
    return data;
  }

  const { data, error } = await admin
    .from('integration_settings')
    .insert({ organization_id: organizationId, ...patch })
    .select('*')
    .single();
  if (error) {
    console.error('[integration_settings.insert]', error);
    return null;
  }
  return data;
}

export async function rotateWebhookSecret(organizationId: string): Promise<string | null> {
  const admin = createServiceClient();
  const secret = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const { data, error } = await admin
    .from('integration_settings')
    .update({ webhook_secret: secret })
    .eq('organization_id', organizationId)
    .select('webhook_secret')
    .single();
  if (error) return null;
  return data.webhook_secret;
}
