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
  });
  if (!result) return fail('Could not save settings');

  revalidatePath('/settings');
  return ok(true);
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
