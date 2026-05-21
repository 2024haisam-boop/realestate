import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createActivity } from '@/lib/db/activities';
import type { CallStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Twilio status callback for both legs of the bridge call.
 *
 * Twilio sends form-encoded params including CallSid, CallStatus, CallDuration,
 * RecordingUrl (for the agent leg when recording=record-from-start). We update
 * the calls row by call_sid or agent_call_sid or lead_call_sid.
 */
export async function POST(request: NextRequest) {
  const form = await safeForm(request);
  const callSid = form.get('CallSid')?.toString() ?? '';
  const status = (form.get('CallStatus')?.toString() ?? '') as string;
  const duration = Number(form.get('CallDuration') ?? 0);
  const recordingUrl = form.get('RecordingUrl')?.toString() ?? null;

  if (!callSid) return NextResponse.json({ ok: true });

  const admin = createServiceClient();
  const { data: call } = await admin
    .from('calls')
    .select('*')
    .or(`call_sid.eq.${callSid},agent_call_sid.eq.${callSid},lead_call_sid.eq.${callSid}`)
    .maybeSingle();

  if (!call) return NextResponse.json({ ok: true });

  const mapped: CallStatus = mapTwilioStatus(status);
  const update: Record<string, unknown> = { status: mapped };
  if (duration > 0) update.duration_seconds = duration;
  if (recordingUrl) update.recording_url = recordingUrl;
  if (mapped === 'completed' || mapped === 'failed' || mapped === 'no_answer' || mapped === 'busy') {
    update.ended_at = new Date().toISOString();
  }

  await admin.from('calls').update(update).eq('id', call.id);

  if (mapped === 'completed' && call.lead_id) {
    await createActivity({
      organizationId: call.organization_id,
      leadId: call.lead_id,
      userId: call.agent_id,
      type: 'call_completed',
      title: 'Call completed',
      description: duration > 0 ? `Duration ${Math.floor(duration / 60)}m ${duration % 60}s` : null,
      metadata: { durationSeconds: duration, recordingUrl },
    });
  }

  return NextResponse.json({ ok: true });
}

function mapTwilioStatus(status: string): CallStatus {
  switch (status) {
    case 'initiated':
      return 'initiated';
    case 'ringing':
      return 'agent_ringing';
    case 'in-progress':
    case 'answered':
      return 'connected';
    case 'completed':
      return 'completed';
    case 'busy':
      return 'busy';
    case 'no-answer':
      return 'no_answer';
    case 'failed':
    case 'canceled':
      return 'failed';
    default:
      return 'initiated';
  }
}

async function safeForm(request: NextRequest): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    return new FormData();
  }
}
