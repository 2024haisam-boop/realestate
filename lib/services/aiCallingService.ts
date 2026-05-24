import { createServiceClient } from '@/lib/supabase/server';
import { getIntegrationSettings } from '@/lib/db/integration-settings';
import type { AiLanguage, IntegrationSettingsRow } from '@/lib/supabase/types';

/**
 * Vapi.ai REST client.
 *
 * Vapi handles the whole audio pipeline (Deepgram STT + LLM + ElevenLabs TTS
 * + Twilio bridge) — we just tell it which assistant to use and which number
 * to call. The org owns the assistant in their Vapi dashboard.
 *
 * Provider is pluggable via integration_settings.ai_provider — today only
 * 'vapi' is wired; 'retell' and 'bland' return a not-implemented error so the
 * UI can degrade gracefully.
 */

const VAPI_BASE = 'https://api.vapi.ai';

export interface PlaceAiCallArgs {
  organizationId: string;
  leadId: string;
  leadName: string;
  leadPhone: string; // E.164
  language?: AiLanguage;
}

export interface PlaceAiCallResult {
  success: boolean;
  isDryRun?: boolean;
  aiCallId?: string;
  providerCallId?: string;
  reason?: string;
  error?: string;
}

const log = (...args: unknown[]) => console.log('[aiCallingService]', ...args);

/**
 * Decide if the AI agent is allowed to call a lead right now.
 * Returns { allowed: true } or { allowed: false, reason: '...' }.
 */
async function gateAiCall(
  settings: IntegrationSettingsRow,
  organizationId: string,
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  if (!settings.ai_calling_enabled) return { allowed: false, reason: 'ai_disabled' };
  if (!settings.ai_auto_call_new_leads) return { allowed: false, reason: 'auto_call_disabled' };
  if (settings.ai_provider !== 'vapi') {
    return { allowed: false, reason: `provider_not_supported:${settings.ai_provider}` };
  }
  if (!settings.ai_api_key) return { allowed: false, reason: 'no_api_key' };

  // Calling-hours window in PKT (UTC+5, no DST in Pakistan).
  const nowPkt = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const hour = nowPkt.getUTCHours();
  if (hour < settings.ai_calling_hours_start || hour >= settings.ai_calling_hours_end) {
    return { allowed: false, reason: 'outside_calling_hours' };
  }

  // Daily cap (rolling 24h).
  const admin = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('ai_calls')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', since);
  if ((count ?? 0) >= settings.ai_max_calls_per_day) {
    return { allowed: false, reason: 'daily_cap_reached' };
  }
  return { allowed: true };
}

function pickAssistantId(settings: IntegrationSettingsRow, language: AiLanguage): string | null {
  if (language === 'urdu' || language === 'roman_urdu') {
    return settings.ai_assistant_id_urdu || settings.ai_assistant_id || null;
  }
  return settings.ai_assistant_id || null;
}

/**
 * Place an outbound AI call to a lead.
 *
 * Dry-run mode (org-level): logs and returns success without touching Vapi.
 *
 * On success, inserts an `ai_calls` row (status=queued) so the Vapi webhook
 * can later update it with transcript + outcome.
 */
export async function placeAiCall(args: PlaceAiCallArgs): Promise<PlaceAiCallResult> {
  const settings = await getIntegrationSettings(args.organizationId);
  if (!settings) return { success: false, error: 'No integration settings found for organization' };

  const gate = await gateAiCall(settings, args.organizationId);
  if (!gate.allowed) {
    log('skipping AI call:', gate.reason, 'for lead', args.leadId);
    return { success: false, reason: gate.reason };
  }

  const language = args.language ?? settings.ai_default_language;
  const assistantId = pickAssistantId(settings, language);
  if (!assistantId) {
    return { success: false, reason: 'no_assistant_id_for_language' };
  }

  const admin = createServiceClient();

  // Dry-run: pretend we called Vapi but still log an ai_calls row so the UI
  // can show what would have happened.
  if (settings.dry_run_mode) {
    log(`[DRY RUN] AI CALL -> ${args.leadPhone} (assistant: ${assistantId}, lang: ${language})`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (admin as any)
      .from('ai_calls')
      .insert({
        organization_id: args.organizationId,
        lead_id: args.leadId,
        provider: settings.ai_provider,
        language,
        status: 'completed',
        summary: '[DRY RUN] Simulated AI call. Configure ai_api_key + ai_assistant_id and turn off Dry-run mode in /settings to place real calls.',
        intent: 'simulated',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 0,
      })
      .select('id')
      .single();
    return { success: true, isDryRun: true, aiCallId: row?.id };
  }

  // Live: hit Vapi.
  let providerCallId: string | undefined;
  try {
    const response = await fetch(`${VAPI_BASE}/call`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.ai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        customer: { number: args.leadPhone, name: args.leadName },
        metadata: {
          organizationId: args.organizationId,
          leadId: args.leadId,
          language,
        },
      }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      log('Vapi POST /call failed:', response.status, errText);
      return { success: false, error: `Vapi ${response.status}: ${errText.slice(0, 200)}` };
    }
    const json = (await response.json()) as { id?: string };
    providerCallId = json.id;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return { success: false, error: `Vapi request failed: ${message}` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: insertError } = await (admin as any)
    .from('ai_calls')
    .insert({
      organization_id: args.organizationId,
      lead_id: args.leadId,
      provider: settings.ai_provider,
      provider_call_id: providerCallId ?? null,
      language,
      status: 'queued',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError) {
    log('ai_calls insert error (call was placed, just not tracked):', insertError);
  }

  return { success: true, aiCallId: row?.id, providerCallId };
}

/**
 * Sanity-check a Vapi API key by listing assistants. Returns the count or an
 * error string. Used by the "Test" button on the settings page.
 */
export async function testVapiApiKey(
  apiKey: string,
): Promise<{ ok: true; assistantCount: number } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${VAPI_BASE}/assistant`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { ok: false, error: `Vapi ${response.status}: ${errText.slice(0, 200)}` };
    }
    const json = (await response.json()) as unknown[];
    return { ok: true, assistantCount: Array.isArray(json) ? json.length : 0 };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return { ok: false, error: message };
  }
}

/**
 * Pick the first Available + active sales agent for a transfer. Falls back
 * to the lead's currently-assigned agent if no one is Available.
 */
export async function pickAgentForTransfer(args: {
  organizationId: string;
  leadId: string;
}): Promise<{ agentId: string; phone: string; name: string } | null> {
  const admin = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: available } = await (admin as any)
    .from('profiles')
    .select('id, full_name, phone')
    .eq('organization_id', args.organizationId)
    .eq('role', 'sales_agent')
    .eq('is_active', true)
    .eq('is_available', true)
    .not('phone', 'is', null)
    .limit(1);

  if (available && available.length > 0) {
    const a = available[0];
    return { agentId: a.id, phone: a.phone, name: a.full_name };
  }

  // Fallback: the lead's assigned agent.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lead } = await (admin as any)
    .from('leads')
    .select('assigned_agent_id')
    .eq('id', args.leadId)
    .maybeSingle();
  if (!lead?.assigned_agent_id) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (admin as any)
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', lead.assigned_agent_id)
    .maybeSingle();
  if (!agent?.phone) return null;
  return { agentId: agent.id, phone: agent.phone, name: agent.full_name };
}
