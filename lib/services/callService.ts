import Twilio from 'twilio';
import { createServiceClient } from '@/lib/supabase/server';
import type { IntegrationSettingsRow } from '@/lib/supabase/types';

export interface BridgeCallParams {
  agentPhone: string;
  agentId: string;
  leadPhone: string;
  leadName: string;
  leadSource: string;
  leadId: string;
  organizationId: string;
}

export interface BridgeCallResult {
  success: boolean;
  callId: string;
  agentCallSid?: string;
  conferenceId?: string;
  isDryRun: boolean;
  error?: string;
}

/** Load this org's integration settings (or null if missing). */
async function getOrgSettings(organizationId: string): Promise<IntegrationSettingsRow | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('integration_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
  return data;
}

/** Whether the global env flag forces dry-run regardless of per-org setting. */
function envForcesDryRun(): boolean {
  return process.env.DRY_RUN_MODE === 'true';
}

/**
 * Initiate an agent-first bridge call.
 *
 * Flow when real:
 *   1. Generate a conferenceId (uuid).
 *   2. Twilio.calls.create() to the agent with twiml URL =
 *      /api/twilio/voice?leadId=...&conferenceId=...&leadName=...&source=...
 *   3. /api/twilio/voice serves <Gather><Say>...</Say></Gather>. On any key,
 *      Twilio POSTs to /api/twilio/conference?conferenceId=...&leadPhone=...
 *      which dials the lead and joins both into the conference.
 *   4. /api/twilio/status receives status callbacks and updates the calls row.
 *
 * Flow when dry-run:
 *   - log to console with [DRY RUN] prefix
 *   - save call record with is_dry_run = true
 *   - return mock callId
 */
export async function bridgeCall(params: BridgeCallParams): Promise<BridgeCallResult> {
  const settings = await getOrgSettings(params.organizationId);
  const dryRun =
    envForcesDryRun() ||
    !settings ||
    settings.dry_run_mode ||
    !settings.twilio_account_sid ||
    !settings.twilio_auth_token ||
    !settings.twilio_phone_number;

  const admin = createServiceClient();

  if (dryRun) {
    const conferenceId = `conf_dryrun_${cryptoRandomHex(8)}`;
    console.log(
      `[DRY RUN] Bridge call requested: agent=${params.agentPhone} -> lead=${params.leadPhone} ("${params.leadName}", ${params.leadSource}). conferenceId=${conferenceId}`,
    );
    const { data, error } = await admin
      .from('calls')
      .insert({
        organization_id: params.organizationId,
        lead_id: params.leadId,
        agent_id: params.agentId,
        status: 'initiated',
        is_dry_run: true,
        conference_sid: conferenceId,
        notes: `[DRY RUN] simulated bridge call from ${params.agentPhone} to ${params.leadPhone}`,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      return {
        success: false,
        callId: '',
        isDryRun: true,
        error: error?.message ?? 'Could not save dry-run call record',
      };
    }
    return { success: true, callId: data.id, conferenceId, isDryRun: true };
  }

  // Real Twilio flow
  try {
    const conferenceId = `conf_${params.leadId}_${cryptoRandomHex(6)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const twiml = new URL(`${baseUrl}/api/twilio/voice`);
    twiml.searchParams.set('leadId', params.leadId);
    twiml.searchParams.set('conferenceId', conferenceId);
    twiml.searchParams.set('leadName', params.leadName);
    twiml.searchParams.set('leadSource', params.leadSource);
    twiml.searchParams.set('leadPhone', params.leadPhone);
    const statusCallback = new URL(`${baseUrl}/api/twilio/status`);

    const client = Twilio(settings!.twilio_account_sid!, settings!.twilio_auth_token!);
    const call = await client.calls.create({
      to: params.agentPhone,
      from: settings!.twilio_phone_number!,
      url: twiml.toString(),
      statusCallback: statusCallback.toString(),
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });

    const { data, error } = await admin
      .from('calls')
      .insert({
        organization_id: params.organizationId,
        lead_id: params.leadId,
        agent_id: params.agentId,
        call_sid: call.sid,
        agent_call_sid: call.sid,
        conference_sid: conferenceId,
        status: 'agent_ringing',
        is_dry_run: false,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      return {
        success: false,
        callId: '',
        agentCallSid: call.sid,
        conferenceId,
        isDryRun: false,
        error: error?.message ?? 'Could not save call record',
      };
    }

    return {
      success: true,
      callId: data.id,
      agentCallSid: call.sid,
      conferenceId,
      isDryRun: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Twilio call failed';
    console.error('[callService] Twilio error', err);
    return { success: false, callId: '', isDryRun: false, error: message };
  }
}

function cryptoRandomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}
