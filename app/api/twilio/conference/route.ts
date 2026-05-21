import { NextResponse, type NextRequest } from 'next/server';
import Twilio from 'twilio';
import { createServiceClient } from '@/lib/supabase/server';
import { escapeXml } from '@/lib/services/twilio-xml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Called when the agent presses a key on the Gather step.
 *
 * We:
 *  1. Place an outbound call to the lead, which joins the same conference.
 *  2. Return TwiML for the agent leg that places them in the conference.
 *
 * The leadPhone + conferenceId are passed in via the query string and signed
 * implicitly by Twilio (signature validation TODO when going to production).
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const conferenceId = url.searchParams.get('conferenceId');
  const leadPhone = url.searchParams.get('leadPhone');
  const leadId = url.searchParams.get('leadId');
  const digit = (await safeForm(request)).get('Digits');

  if (!conferenceId || !leadPhone) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Missing conference details. Hanging up.</Say>
  <Hangup/>
</Response>`,
      { status: 400, headers: { 'Content-Type': 'text/xml; charset=utf-8' } },
    );
  }

  if (digit === '*') {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Skipped. The lead will be called by another agent.</Say>
  <Hangup/>
</Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } },
    );
  }

  // Dial the lead leg in the background. The agent's leg keeps the request
  // open while we kick off the lead call. If Twilio creds aren't available we
  // still respond with the conference TwiML so the agent isn't stranded.
  const admin = createServiceClient();
  const { data: call } = await admin
    .from('calls')
    .select('organization_id')
    .eq('conference_sid', conferenceId)
    .maybeSingle();

  if (call?.organization_id) {
    const { data: settings } = await admin
      .from('integration_settings')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('organization_id', call.organization_id)
      .maybeSingle();

    if (settings?.twilio_account_sid && settings.twilio_auth_token && settings.twilio_phone_number) {
      try {
        const client = Twilio(settings.twilio_account_sid, settings.twilio_auth_token);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${url.protocol}//${url.host}`;
        const leadTwimlUrl = new URL(`${baseUrl}/api/twilio/voice/lead-leg`);
        leadTwimlUrl.searchParams.set('conferenceId', conferenceId);

        const leadCall = await client.calls.create({
          to: leadPhone,
          from: settings.twilio_phone_number,
          url: leadTwimlUrl.toString(),
          statusCallback: `${baseUrl}/api/twilio/status`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        });
        await admin
          .from('calls')
          .update({ lead_call_sid: leadCall.sid, status: 'lead_ringing' })
          .eq('conference_sid', conferenceId);
      } catch (err) {
        console.error('[twilio/conference] failed to dial lead leg', err);
      }
    }
  }

  const conferenceLabel = escapeXml(conferenceId);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Connecting you to the lead now. Please hold.</Say>
  <Dial>
    <Conference waitUrl="https://twimlets.com/holdmusic?Bucket=com.twilio.music.classical"
                startConferenceOnEnter="true"
                endConferenceOnExit="true"
                record="record-from-start">${conferenceLabel}</Conference>
  </Dial>
</Response>`;

  // Side-effect: mark the call connected when the agent is being patched in.
  if (leadId) {
    await admin.from('calls').update({ status: 'connected' }).eq('conference_sid', conferenceId);
  }

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

async function safeForm(request: NextRequest): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    return new FormData();
  }
}
