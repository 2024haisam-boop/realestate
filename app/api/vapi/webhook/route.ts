import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createActivity } from '@/lib/db/activities';
import { pickAgentForTransfer } from '@/lib/services/aiCallingService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/vapi/webhook
 *
 * Vapi sends a stream of events about each AI call. We care about:
 *
 *   - end-of-call-report  → save transcript, summary, duration, cost
 *   - status-update       → update ai_calls.status
 *   - tool-calls          → if the assistant requests "transfer_to_agent",
 *                          look up an available agent and return their number
 *
 * The request includes `metadata: { organizationId, leadId, language }` which
 * we set when placing the call.
 *
 * NOTE: Vapi doesn't sign webhook requests with HMAC by default — we identify
 * the call via the provider_call_id stored in ai_calls. To harden, configure
 * a Vapi "Server Secret" and verify the `x-vapi-secret` header here.
 */

interface VapiMessage {
  type: string;
  call?: { id?: string };
  // For function calls
  functionCall?: { name?: string; parameters?: Record<string, unknown> };
  toolCalls?: { id: string; function: { name: string; arguments: string } }[];
  // For end-of-call
  endedReason?: string;
  durationSeconds?: number;
  cost?: number;
  recordingUrl?: string;
  summary?: string;
  transcript?: string;
  analysis?: { summary?: string; successEvaluation?: string };
  // For status updates
  status?: string;
}

interface VapiBody {
  message?: VapiMessage;
  metadata?: { organizationId?: string; leadId?: string; language?: string };
}

export async function POST(request: NextRequest) {
  // Optional: validate a shared secret if VAPI_WEBHOOK_SECRET is set.
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (expected) {
    const provided = request.headers.get('x-vapi-secret') ?? '';
    if (provided !== expected) {
      return NextResponse.json({ ok: false, error: 'invalid secret' }, { status: 401 });
    }
  }

  let body: VapiBody;
  try {
    body = (await request.json()) as VapiBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const message = body.message;
  if (!message) {
    return NextResponse.json({ ok: false, error: 'no message' }, { status: 400 });
  }

  const admin = createServiceClient();
  const providerCallId = message.call?.id;

  // Find the matching ai_calls row (if any) so we know the lead + org.
  let aiCall: { id: string; organization_id: string; lead_id: string } | null = null;
  if (providerCallId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('ai_calls')
      .select('id, organization_id, lead_id')
      .eq('provider_call_id', providerCallId)
      .maybeSingle();
    aiCall = data ?? null;
  }

  switch (message.type) {
    case 'status-update': {
      if (aiCall && message.status) {
        const mapped =
          message.status === 'in-progress' ? 'in_progress' :
          message.status === 'ended' ? 'completed' :
          message.status === 'forwarding' ? 'transferred' :
          'in_progress';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from('ai_calls')
          .update({ status: mapped })
          .eq('id', aiCall.id);
      }
      return NextResponse.json({ ok: true });
    }

    case 'end-of-call-report': {
      if (aiCall) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from('ai_calls')
          .update({
            status: message.endedReason === 'transferred' ? 'transferred' : 'completed',
            duration_seconds: message.durationSeconds ?? null,
            cost_usd: message.cost ?? null,
            recording_url: message.recordingUrl ?? null,
            transcript: message.transcript ?? null,
            summary: message.summary ?? message.analysis?.summary ?? null,
            sentiment: message.analysis?.successEvaluation ?? null,
            ended_reason: message.endedReason ?? null,
            ended_at: new Date().toISOString(),
          })
          .eq('id', aiCall.id);

        await createActivity({
          organizationId: aiCall.organization_id,
          leadId: aiCall.lead_id,
          userId: null,
          type: 'call_completed',
          title: 'AI agent finished call',
          description:
            message.summary ??
            message.analysis?.summary ??
            `Ended (${message.endedReason ?? 'unknown'}). ${
              message.durationSeconds ? `${message.durationSeconds}s.` : ''
            }`,
          metadata: {
            aiCallId: aiCall.id,
            provider: 'vapi',
            endedReason: message.endedReason ?? null,
            durationSeconds: message.durationSeconds ?? null,
            recordingUrl: message.recordingUrl ?? null,
          } as never,
        });
      }
      return NextResponse.json({ ok: true });
    }

    case 'function-call':
    case 'tool-calls': {
      // The assistant is asking us to transfer to a human agent.
      // Look up an available agent and return their number; Vapi will then
      // forward the call via its built-in transfer mechanism.
      const calls = message.toolCalls ?? [];
      const callsToHandle =
        calls.length > 0
          ? calls
          : message.functionCall
            ? [{ id: 'fc', function: { name: message.functionCall.name ?? '', arguments: '{}' } }]
            : [];

      const results: { toolCallId?: string; result: unknown }[] = [];
      for (const tc of callsToHandle) {
        const name = tc.function?.name;
        if (name === 'transfer_to_agent') {
          if (!aiCall) {
            results.push({ toolCallId: tc.id, result: { error: 'call_not_tracked' } });
            continue;
          }
          const agent = await pickAgentForTransfer({
            organizationId: aiCall.organization_id,
            leadId: aiCall.lead_id,
          });
          if (!agent) {
            results.push({ toolCallId: tc.id, result: { error: 'no_agent_available' } });
            continue;
          }
          // Mark the AI call as transferred and log the activity.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from('ai_calls')
            .update({ transferred_to_agent_id: agent.agentId, status: 'transferred' })
            .eq('id', aiCall.id);

          await createActivity({
            organizationId: aiCall.organization_id,
            leadId: aiCall.lead_id,
            userId: agent.agentId,
            type: 'call_made',
            title: `AI agent transferred to ${agent.name}`,
            description: 'Lead asked to speak with a human; bridged via Twilio.',
            metadata: { aiCallId: aiCall.id, agentId: agent.agentId } as never,
          });

          results.push({
            toolCallId: tc.id,
            result: {
              destination: { type: 'number', number: agent.phone },
              message: `Connecting you to ${agent.name}, one moment please.`,
            },
          });
        } else {
          results.push({ toolCallId: tc.id, result: { error: `unknown_tool:${name}` } });
        }
      }
      return NextResponse.json({ results });
    }

    default:
      return NextResponse.json({ ok: true, ignored: message.type });
  }
}
