import { NextResponse, type NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { createLead, findLeadByExternalId, updateLead } from '@/lib/db/leads';
import { createActivity } from '@/lib/db/activities';
import { assignAgent } from '@/lib/services/leadAssignmentService';
import { bridgeCall } from '@/lib/services/callService';
import { placeAiCall } from '@/lib/services/aiCallingService';
import { leadWebhookSchema } from '@/lib/validations/webhook.schema';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/leads
 *
 * External lead intake endpoint. Authenticated via HMAC-SHA256 of the raw
 * request body using the LEAD_WEBHOOK_SECRET env var (or the org's
 * integration_settings.webhook_secret — env wins for simplicity).
 *
 * Header: X-Webhook-Signature: sha256=<hex>
 *
 * Side effects on success:
 *  - Create the lead
 *  - Round-robin assign (if mode = round_robin/least_busy)
 *  - Log activities: lead_created, lead_assigned
 *  - Trigger bridge call (callService respects dry_run_mode)
 *  - Create in-app notification for the assigned agent
 */
export async function POST(request: NextRequest) {
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!secret) {
    return jsonError(500, 'Webhook secret not configured');
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-webhook-signature') ?? '';
  if (!verifySignature(rawBody, signatureHeader, secret)) {
    return jsonError(401, 'Invalid signature');
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonError(400, 'Body is not valid JSON');
  }

  const parsed = leadWebhookSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid payload');
  }
  const payload = parsed.data;

  const admin = createServiceClient();
  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', payload.organizationSlug)
    .maybeSingle();

  if (!org) return jsonError(404, `Organization not found: ${payload.organizationSlug}`);

  // Idempotency: dedupe on external_id within the same org.
  if (payload.externalId) {
    const existing = await findLeadByExternalId({
      organizationId: org.id,
      externalId: payload.externalId,
    });
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          leadId: existing.id,
          assignedAgent: null,
          callTriggered: false,
          deduped: true,
        },
        { status: 200 },
      );
    }
  }

  const lead = await createLead({
    organizationId: org.id,
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email ?? null,
    source: payload.source ?? 'other',
    propertyType: payload.propertyType ?? null,
    budgetMin: payload.budgetMin ?? null,
    budgetMax: payload.budgetMax ?? null,
    preferredLocation: payload.preferredLocation ?? null,
    notes: payload.notes ?? null,
    status: 'new',
    externalId: payload.externalId ?? null,
    useServiceRole: true,
  });

  if (!lead) return jsonError(500, 'Could not create lead');

  await createActivity({
    organizationId: org.id,
    leadId: lead.id,
    userId: null,
    type: 'lead_created',
    title: 'Lead created',
    description: `Webhook intake from ${payload.source ?? 'unknown'}`,
    metadata: { source: payload.source ?? null, externalId: payload.externalId ?? null },
  });

  // Look up assignment mode + AI calling flags.
  const { data: settings } = await admin
    .from('integration_settings')
    .select('lead_assignment_mode, ai_calling_enabled, ai_auto_call_new_leads')
    .eq('organization_id', org.id)
    .maybeSingle();
  const mode = settings?.lead_assignment_mode ?? 'round_robin';
  const aiWillCall = !!(settings?.ai_calling_enabled && settings?.ai_auto_call_new_leads);

  let assignedAgentName: string | null = null;
  let callTriggered = false;

  const assignment = await assignAgent(org.id, mode);

  if (assignment.agentId && assignment.agent) {
    await updateLead({
      leadId: lead.id,
      patch: { assigned_agent_id: assignment.agentId, status: 'contacted' },
      useServiceRole: true,
    });

    assignedAgentName = assignment.agent.full_name;

    await createActivity({
      organizationId: org.id,
      leadId: lead.id,
      userId: assignment.agentId,
      type: 'lead_assigned',
      title: `Assigned to ${assignedAgentName}`,
      description: `Auto-assigned via ${mode}`,
      metadata: { agentId: assignment.agentId, mode },
    });

    await admin.from('notifications').insert({
      organization_id: org.id,
      user_id: assignment.agentId,
      type: 'new_lead',
      title: 'New Lead Assigned',
      body: `${payload.fullName} from ${payload.source ?? 'other'} has been assigned to you`,
      metadata: { leadId: lead.id } as never,
    });

    if (aiWillCall) {
      // AI agent handles first contact; the human gets the lead in their
      // pipeline and will be brought in only if the AI transfers (via the
      // Vapi webhook → /api/vapi/webhook).
      const aiResult = await placeAiCall({
        organizationId: org.id,
        leadId: lead.id,
        leadName: payload.fullName,
        leadPhone: payload.phone,
      });
      callTriggered = aiResult.success;
      if (!aiResult.success) {
        console.error('[webhooks/leads] AI call failed:', aiResult.error ?? aiResult.reason);
      }
    } else if (assignment.agent.phone) {
      // Classic flow: bridge the agent directly to the lead.
      const bridgeResult = await bridgeCall({
        agentPhone: assignment.agent.phone,
        agentId: assignment.agentId,
        leadPhone: payload.phone,
        leadName: payload.fullName,
        leadSource: payload.source ?? 'other',
        leadId: lead.id,
        organizationId: org.id,
      });
      callTriggered = bridgeResult.success;
      if (!bridgeResult.success) {
        console.error('[webhooks/leads] bridge call failed', bridgeResult.error);
      }
    } else {
      console.warn(`[webhooks/leads] agent ${assignedAgentName} has no phone number — skipping bridge call`);
    }
  } else {
    // No agent available. Flag the lead and notify sales managers.
    await updateLead({ leadId: lead.id, patch: { status: 'call_pending' }, useServiceRole: true });
    await createActivity({
      organizationId: org.id,
      leadId: lead.id,
      userId: null,
      type: 'lead_created',
      title: 'No agents available for auto-assignment',
      description: assignment.reason ?? 'unassigned',
    });

    const { data: managers } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', org.id)
      .in('role', ['sales_manager', 'admin']);
    if (managers && managers.length > 0) {
      await admin.from('notifications').insert(
        managers.map((m) => ({
          organization_id: org.id,
          user_id: m.id,
          type: 'new_lead' as const,
          title: 'Unassigned lead',
          body: `${payload.fullName} could not be auto-assigned`,
          metadata: { leadId: lead.id, reason: assignment.reason ?? null } as never,
        })),
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      leadId: lead.id,
      assignedAgent: assignedAgentName,
      callTriggered,
    },
    { status: 201 },
  );
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const provided = header.startsWith('sha256=') ? header.slice(7) : header;
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}
