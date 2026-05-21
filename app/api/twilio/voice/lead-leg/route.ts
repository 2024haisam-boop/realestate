import { NextResponse, type NextRequest } from 'next/server';
import { escapeXml } from '@/lib/services/twilio-xml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** TwiML returned to Twilio for the *lead* leg of the bridge call. */
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

function handle(request: NextRequest) {
  const url = new URL(request.url);
  const conferenceId = escapeXml(url.searchParams.get('conferenceId') ?? '');
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Hello, you have a real estate enquiry call. Please hold while we connect you.</Say>
  <Dial>
    <Conference waitUrl="https://twimlets.com/holdmusic?Bucket=com.twilio.music.classical"
                startConferenceOnEnter="true"
                endConferenceOnExit="true">${conferenceId}</Conference>
  </Dial>
</Response>`;
  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
