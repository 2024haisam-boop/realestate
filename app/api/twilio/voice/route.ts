import { NextResponse, type NextRequest } from 'next/server';
import { escapeXml } from '@/lib/services/twilio-xml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Initial TwiML returned to Twilio when the agent leg connects.
 *
 * Plays the lead announcement, then <Gather> a single digit. On any input,
 * Twilio POSTs to /api/twilio/conference to dial the lead and bridge them in.
 *
 * Twilio fetches this URL with both GET and POST depending on flow; support
 * both. Query string carries the lead details to keep the route stateless.
 */
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

function handle(request: NextRequest) {
  const url = new URL(request.url);
  const leadName = escapeXml(url.searchParams.get('leadName') ?? 'a new lead');
  const leadSource = escapeXml(url.searchParams.get('leadSource') ?? 'a marketing source');
  const leadPhone = url.searchParams.get('leadPhone') ?? '';
  const conferenceId = url.searchParams.get('conferenceId') ?? `conf_${Date.now()}`;
  const leadId = url.searchParams.get('leadId') ?? '';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${url.protocol}//${url.host}`;
  const conferenceAction = new URL(`${baseUrl}/api/twilio/conference`);
  conferenceAction.searchParams.set('conferenceId', conferenceId);
  conferenceAction.searchParams.set('leadPhone', leadPhone);
  conferenceAction.searchParams.set('leadId', leadId);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${conferenceAction.toString()}" method="POST">
    <Say voice="Polly.Aditi" language="en-IN">
      New real estate lead from ${leadSource}. Name: ${leadName}.
      Press any key to connect with the lead now. Press star to skip.
    </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">No input received. The lead will be called by another agent.</Say>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
