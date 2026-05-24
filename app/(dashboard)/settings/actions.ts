'use server';

import { revalidatePath } from 'next/cache';
import Twilio from 'twilio';
import { requireSessionUser } from '@/lib/db/users';
import {
  rotateWebhookSecret,
  upsertIntegrationSettings,
} from '@/lib/db/integration-settings';
import {
  integrationSettingsSchema,
  type IntegrationSettingsInput,
} from '@/lib/validations/integration.schema';
import { placeAiCall, testVapiApiKey } from '@/lib/services/aiCallingService';
import { fail, ok, type ActionResult } from '@/lib/types';

export async function updateIntegrationSettingsAction(
  raw: IntegrationSettingsInput,
): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can edit integration settings');

  const parsed = integrationSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const v = parsed.data;

  const result = await upsertIntegrationSettings(me.organizationId, {
    twilio_account_sid: v.twilio_account_sid || null,
    twilio_auth_token: v.twilio_auth_token || null,
    twilio_phone_number: v.twilio_phone_number || null,
    twilio_whatsapp_number: v.twilio_whatsapp_number || null,
    resend_api_key: v.resend_api_key || null,
    openai_api_key: v.openai_api_key || null,
    openai_base_url: v.openai_base_url || null,
    zapier_webhook_url: v.zapier_webhook_url || null,
    lead_assignment_mode: v.lead_assignment_mode,
    dry_run_mode: v.dry_run_mode,
    // AI calling
    ai_provider: v.ai_provider,
    ai_api_key: v.ai_api_key || null,
    ai_assistant_id: v.ai_assistant_id || null,
    ai_assistant_id_urdu: v.ai_assistant_id_urdu || null,
    ai_calling_enabled: v.ai_calling_enabled,
    ai_auto_call_new_leads: v.ai_auto_call_new_leads,
    ai_default_language: v.ai_default_language,
    ai_calling_hours_start: v.ai_calling_hours_start,
    ai_calling_hours_end: v.ai_calling_hours_end,
    ai_max_calls_per_day: v.ai_max_calls_per_day,
  });
  if (!result) return fail('Could not save settings');

  revalidatePath('/settings');
  return ok(true);
}

/**
 * Test a Vapi API key by listing the assistants on the account.
 */
export async function testVapiCredentialsAction(input: {
  apiKey: string;
}): Promise<ActionResult<{ assistantCount: number }>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can test credentials');
  if (!input.apiKey) return fail('Paste a Vapi API key first');
  const result = await testVapiApiKey(input.apiKey);
  if (!result.ok) return fail(result.error);
  return ok({ assistantCount: result.assistantCount });
}

/**
 * Place a one-off AI test call against an arbitrary phone number — useful
 * to dry-run the entire pipeline from the settings UI without needing a
 * lead to walk in. Creates a throwaway "test" lead so the ai_calls row
 * has a valid lead_id FK.
 */
export async function placeAiTestCallAction(input: {
  phone: string;
  language?: 'english' | 'urdu' | 'roman_urdu';
}): Promise<ActionResult<{ aiCallId?: string; isDryRun?: boolean }>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can place test calls');
  if (!/^\+[1-9]\d{7,14}$/.test(input.phone)) {
    return fail('Phone must be in E.164 format, e.g. +923001234567');
  }

  const { createServiceClient } = await import('@/lib/supabase/server');
  const admin = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lead, error } = await (admin as any)
    .from('leads')
    .insert({
      organization_id: me.organizationId,
      full_name: 'Test call',
      phone: input.phone,
      source: 'manual',
      status: 'new',
      notes: 'Created automatically by the /settings AI test-call button.',
    })
    .select('id')
    .single();
  if (error || !lead) return fail(`Could not create test lead: ${error?.message ?? 'unknown'}`);

  const result = await placeAiCall({
    organizationId: me.organizationId,
    leadId: lead.id,
    leadName: 'Test call',
    leadPhone: input.phone,
    language: input.language,
  });
  if (!result.success) return fail(result.error ?? result.reason ?? 'Could not place test call');

  return ok({ aiCallId: result.aiCallId, isDryRun: result.isDryRun });
}

export async function rotateWebhookSecretAction(): Promise<ActionResult<{ secret: string }>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can rotate the webhook secret');
  const secret = await rotateWebhookSecret(me.organizationId);
  if (!secret) return fail('Could not rotate secret');
  revalidatePath('/settings');
  return ok({ secret });
}

/**
 * Test the Twilio credentials by fetching the account info.
 * Doesn't send anything — purely a connectivity sanity check.
 */
export async function testTwilioCredentialsAction(input: {
  sid: string;
  token: string;
}): Promise<ActionResult<{ accountFriendlyName: string; status: string }>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can test credentials');
  if (!input.sid || !input.token) return fail('Provide both SID and Auth Token');
  try {
    const client = Twilio(input.sid, input.token);
    const account = await client.api.accounts(input.sid).fetch();
    return ok({
      accountFriendlyName: account.friendlyName,
      status: account.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Twilio rejected the credentials';
    return fail(message);
  }
}
