import Twilio from 'twilio';
import { createServiceClient } from '@/lib/supabase/server';
import type { MessageChannel } from '@/lib/supabase/types';

export interface SendMessageParams {
  to: string;
  body: string;
  channel: MessageChannel;
  leadId?: string | null;
  agentId?: string | null;
  organizationId: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  twilioSid?: string;
  isDryRun: boolean;
  error?: string;
}

/**
 * Send a WhatsApp/SMS/email message to a lead.
 *
 * - WhatsApp + SMS use Twilio's Programmable Messaging.
 * - Email is handled by emailService (added in a later phase).
 * - Always saves a row in `messages` regardless of dry-run.
 * - In dry-run, logs to console with [DRY RUN] prefix and returns a mock id.
 */
export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const admin = createServiceClient();
  const { data: settings } = await admin
    .from('integration_settings')
    .select('*')
    .eq('organization_id', params.organizationId)
    .maybeSingle();

  const dryRun =
    process.env.DRY_RUN_MODE === 'true' ||
    !settings ||
    settings.dry_run_mode ||
    !settings.twilio_account_sid ||
    !settings.twilio_auth_token ||
    (params.channel === 'whatsapp' && !settings.twilio_whatsapp_number) ||
    (params.channel === 'sms' && !settings.twilio_phone_number);

  const insertRow = {
    organization_id: params.organizationId,
    lead_id: params.leadId ?? null,
    agent_id: params.agentId ?? null,
    channel: params.channel,
    direction: 'outbound' as const,
    body: params.body,
    status: 'pending' as const,
    is_dry_run: dryRun,
  };

  if (dryRun) {
    console.log(
      `[DRY RUN] ${params.channel.toUpperCase()} -> ${params.to}: ${params.body.slice(0, 80)}${params.body.length > 80 ? '…' : ''}`,
    );
    const { data, error } = await admin
      .from('messages')
      .insert({ ...insertRow, status: 'sent' })
      .select('id')
      .single();
    if (error || !data) {
      return {
        success: false,
        messageId: '',
        isDryRun: true,
        error: error?.message ?? 'Could not log dry-run message',
      };
    }
    return { success: true, messageId: data.id, isDryRun: true };
  }

  if (params.channel === 'email') {
    // Email is delegated to emailService (Resend) — not yet wired in Phase 4.
    return { success: false, messageId: '', isDryRun: false, error: 'Email channel not yet wired' };
  }

  try {
    const client = Twilio(settings!.twilio_account_sid!, settings!.twilio_auth_token!);
    const from =
      params.channel === 'whatsapp' ? settings!.twilio_whatsapp_number! : settings!.twilio_phone_number!;
    const to = params.channel === 'whatsapp' ? `whatsapp:${params.to}` : params.to;

    const result = await client.messages.create({ to, from, body: params.body });

    const { data, error } = await admin
      .from('messages')
      .insert({ ...insertRow, status: 'sent', twilio_sid: result.sid })
      .select('id')
      .single();

    if (error || !data) {
      return {
        success: false,
        messageId: '',
        twilioSid: result.sid,
        isDryRun: false,
        error: error?.message ?? 'Could not log message',
      };
    }
    return { success: true, messageId: data.id, twilioSid: result.sid, isDryRun: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Twilio message failed';
    console.error('[messageService] Twilio error', err);
    return { success: false, messageId: '', isDryRun: false, error: message };
  }
}
