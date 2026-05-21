import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/db/users';
import { shareWithLead } from '@/lib/services/propertyShareService';

const shareSchema = z.object({
  leadId: z.string().uuid(),
  channel: z.enum(['whatsapp', 'sms']).default('whatsapp'),
  customMessage: z.string().max(2000).optional(),
});

/**
 * POST /api/properties/[id]/share
 *
 * Auth-gated. Triggers a property share with the given lead via the
 * propertyShareService. Mirrors the sharePropertyWithLeadAction server action
 * but exposed over HTTP for integration tests + non-React clients.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await requireSessionUser();
  } catch {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { id: propertyId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body must be JSON' }, { status: 400 });
  }

  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const result = await shareWithLead({
    leadId: parsed.data.leadId,
    propertyId,
    sharedBy: me.id,
    organizationId: me.organizationId,
    channel: parsed.data.channel,
    customMessage: parsed.data.customMessage ?? null,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    shareUrl: result.shareUrl,
    messageId: result.messageId,
    isDryRun: result.isDryRun ?? false,
  });
}
