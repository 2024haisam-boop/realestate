/**
 * Minimal XML escaping for values inserted into TwiML. Twilio is reasonably
 * forgiving but we still don't want stray ampersands or angle brackets in
 * lead names breaking the response.
 */
export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
