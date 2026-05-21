'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireSessionUser, getProfileById } from '@/lib/db/users';
import { createLead, deleteLead, updateLead } from '@/lib/db/leads';
import { createActivity } from '@/lib/db/activities';
import { bridgeCall } from '@/lib/services/callService';
import { sendMessage } from '@/lib/services/messageService';
import { shareWithLead } from '@/lib/services/propertyShareService';
import {
  leadCreateSchema,
  leadNoteSchema,
  leadUpdateSchema,
  type LeadCreateInput,
  type LeadNoteInput,
  type LeadUpdateInput,
} from '@/lib/validations/lead.schema';
import {
  propertyShareSchema,
  type PropertyShareInput,
} from '@/lib/validations/property.schema';
import {
  sendWhatsappTemplateSchema,
  type SendWhatsappTemplateInput,
} from '@/lib/validations/followup.schema';
import { fail, ok, type ActionResult } from '@/lib/types';
import { FOLLOWUP_TEMPLATES, isManagerial } from '@/lib/constants';
import type { LeadStatus, MessageChannel } from '@/lib/supabase/types';
import { formatINR } from '@/lib/utils';

/** Create a lead manually from inside the app. */
export async function createLeadAction(
  raw: LeadCreateInput,
): Promise<ActionResult<{ leadId: string }>> {
  const me = await requireSessionUser();
  const parsed = leadCreateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const v = parsed.data;

  const assignedAgentId = v.assignedAgentId || null;
  const lead = await createLead({
    organizationId: me.organizationId,
    fullName: v.fullName,
    phone: v.phone,
    email: v.email || null,
    source: (v.source as never) ?? 'manual',
    propertyType: (v.propertyType as never) || null,
    budgetMin: v.budgetMin ?? null,
    budgetMax: v.budgetMax ?? null,
    preferredLocation: v.preferredLocation || null,
    notes: v.notes || null,
    status: assignedAgentId ? 'contacted' : 'new',
    temperature: (v.temperature as never) ?? 'cold',
    assignedAgentId,
    isHot: v.isHot ?? false,
  });
  if (!lead) return fail('Could not create lead');

  await createActivity({
    organizationId: me.organizationId,
    leadId: lead.id,
    userId: me.id,
    type: 'lead_created',
    title: 'Lead created',
    description: `Created manually by ${me.fullName}`,
  });

  if (assignedAgentId) {
    const agent = await getProfileById(assignedAgentId);
    if (agent) {
      await createActivity({
        organizationId: me.organizationId,
        leadId: lead.id,
        userId: me.id,
        type: 'lead_assigned',
        title: `Assigned to ${agent.full_name}`,
        description: 'Manual assignment',
        metadata: { agentId: agent.id },
      });
      if (agent.id !== me.id) {
        const admin = createServiceClient();
        await admin.from('notifications').insert({
          organization_id: me.organizationId,
          user_id: agent.id,
          type: 'new_lead',
          title: 'New Lead Assigned',
          body: `${v.fullName} has been assigned to you`,
          metadata: { leadId: lead.id } as never,
        });
      }
    }
  }

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return ok({ leadId: lead.id });
}

/** Update one or more fields on a lead. */
export async function updateLeadAction(raw: LeadUpdateInput): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  const parsed = leadUpdateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const v = parsed.data;

  // Build the patch from only the fields the caller actually set.
  const patch: Parameters<typeof updateLead>[0]['patch'] = {};
  if (v.fullName !== undefined) patch.full_name = v.fullName;
  if (v.phone !== undefined) patch.phone = v.phone;
  if (v.email !== undefined) patch.email = v.email || null;
  if (v.source !== undefined) patch.source = v.source as never;
  if (v.propertyType !== undefined) patch.property_type = (v.propertyType as never) || null;
  if (v.budgetMin !== undefined) patch.budget_min = v.budgetMin;
  if (v.budgetMax !== undefined) patch.budget_max = v.budgetMax;
  if (v.preferredLocation !== undefined) patch.preferred_location = v.preferredLocation || null;
  if (v.notes !== undefined) patch.notes = v.notes || null;
  if (v.status !== undefined) patch.status = v.status as LeadStatus;
  if (v.temperature !== undefined) patch.temperature = v.temperature as never;
  if (v.assignedAgentId !== undefined) patch.assigned_agent_id = v.assignedAgentId || null;
  if (v.isHot !== undefined) patch.is_hot = v.isHot;

  if (Object.keys(patch).length === 0) return ok(true);

  // Track status changes for the activity log
  let previousStatus: LeadStatus | null = null;
  if (patch.status) {
    const supabase = await createClient();
    const { data: current } = await supabase
      .from('leads')
      .select('status')
      .eq('id', v.leadId)
      .maybeSingle();
    previousStatus = current?.status ?? null;
  }

  const updated = await updateLead({ leadId: v.leadId, patch });
  if (!updated) return fail('Could not update lead');

  if (patch.status && previousStatus && previousStatus !== patch.status) {
    await createActivity({
      organizationId: me.organizationId,
      leadId: v.leadId,
      userId: me.id,
      type: 'status_changed',
      title: `Status changed to ${patch.status}`,
      description: `Was ${previousStatus}`,
      metadata: { from: previousStatus, to: patch.status },
    });
  }

  if (patch.assigned_agent_id !== undefined && patch.assigned_agent_id) {
    const agent = await getProfileById(patch.assigned_agent_id);
    if (agent) {
      await createActivity({
        organizationId: me.organizationId,
        leadId: v.leadId,
        userId: me.id,
        type: 'lead_assigned',
        title: `Reassigned to ${agent.full_name}`,
        metadata: { agentId: agent.id },
      });
    }
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${v.leadId}`);
  return ok(true);
}

/** Add a free-form note to a lead. */
export async function addLeadNoteAction(raw: LeadNoteInput): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  const parsed = leadNoteSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  await createActivity({
    organizationId: me.organizationId,
    leadId: parsed.data.leadId,
    userId: me.id,
    type: 'note_added',
    title: 'Note added',
    description: parsed.data.body,
  });

  revalidatePath(`/leads/${parsed.data.leadId}`);
  return ok(true);
}

/** Delete a lead. Admin or sales_manager only. */
export async function deleteLeadAction(leadId: string): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  if (!isManagerial(me.role)) return fail('Only managers and admins can delete leads');
  const success = await deleteLead(leadId);
  if (!success) return fail('Could not delete lead');
  revalidatePath('/leads');
  return ok(true);
}

/** Initiate a bridge call to the lead. */
export async function callLeadAction({
  leadId,
}: {
  leadId: string;
}): Promise<ActionResult<{ callId: string; isDryRun: boolean }>> {
  const me = await requireSessionUser();

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('id, organization_id, full_name, phone, source, assigned_agent_id')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return fail('Lead not found');

  // Pick the agent who will be on the line. Default to the lead's assigned
  // agent; otherwise fall back to the caller (if they have a phone).
  const agentId = lead.assigned_agent_id ?? me.id;
  const agent = await getProfileById(agentId);
  if (!agent) return fail('Agent profile missing');
  if (!agent.phone) {
    return fail(
      agent.id === me.id
        ? 'Add a phone number to your profile before initiating bridge calls'
        : `${agent.full_name} has no phone number on file`,
    );
  }

  const result = await bridgeCall({
    agentPhone: agent.phone,
    agentId: agent.id,
    leadPhone: lead.phone,
    leadName: lead.full_name,
    leadSource: lead.source,
    leadId: lead.id,
    organizationId: lead.organization_id,
  });

  if (!result.success) return fail(result.error ?? 'Bridge call failed');

  await createActivity({
    organizationId: lead.organization_id,
    leadId: lead.id,
    userId: me.id,
    type: 'call_made',
    title: result.isDryRun ? 'Bridge call simulated (dry run)' : 'Bridge call initiated',
    description: `${agent.full_name} → ${lead.full_name}`,
    metadata: { callId: result.callId, isDryRun: result.isDryRun },
  });

  await updateLead({
    leadId: lead.id,
    patch: { last_contacted_at: new Date().toISOString() },
  });

  revalidatePath(`/leads/${lead.id}`);
  return ok({ callId: result.callId, isDryRun: result.isDryRun });
}

/** Render a WhatsApp template (substituting lead variables) and send it. */
export async function sendWhatsappTemplateAction(
  raw: SendWhatsappTemplateInput,
): Promise<ActionResult<{ messageId: string; isDryRun: boolean; body: string }>> {
  const me = await requireSessionUser();
  const parsed = sendWhatsappTemplateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('id, organization_id, full_name, phone, preferred_location, budget_max')
    .eq('id', parsed.data.leadId)
    .maybeSingle();
  if (!lead) return fail('Lead not found');
  if (!lead.phone) return fail('Lead has no phone on file');

  const template = FOLLOWUP_TEMPLATES.find((t) => t.id === parsed.data.templateId);
  if (!template) return fail('Template not found');

  const rendered =
    parsed.data.customBody && parsed.data.customBody.trim().length > 0
      ? parsed.data.customBody
      : template.body
          .replace(/{{leadName}}/g, lead.full_name)
          .replace(/{{preferredLocation}}/g, lead.preferred_location ?? 'your preferred area')
          .replace(
            /{{budgetMax}}/g,
            lead.budget_max != null ? formatINR(lead.budget_max).replace(/^₹/, '') : 'your budget',
          );

  const result = await sendMessage({
    to: lead.phone,
    body: rendered,
    channel: template.channel as MessageChannel,
    leadId: lead.id,
    agentId: me.id,
    organizationId: lead.organization_id,
  });
  if (!result.success) return fail(result.error ?? 'Could not send message');

  await createActivity({
    organizationId: lead.organization_id,
    leadId: lead.id,
    userId: me.id,
    type: 'message_sent',
    title: result.isDryRun
      ? `Template "${template.name}" sent (dry run)`
      : `Template "${template.name}" sent`,
    description: rendered,
    metadata: { templateId: template.id, channel: template.channel, isDryRun: result.isDryRun },
  });

  await updateLead({
    leadId: lead.id,
    patch: { last_contacted_at: new Date().toISOString() },
  });

  revalidatePath(`/leads/${lead.id}`);
  return ok({ messageId: result.messageId, isDryRun: result.isDryRun ?? false, body: rendered });
}

/** Share a property with the given lead via WhatsApp / SMS. */
export async function sharePropertyWithLeadAction(
  raw: PropertyShareInput,
): Promise<ActionResult<{ shareUrl: string; isDryRun: boolean }>> {
  const me = await requireSessionUser();
  const parsed = propertyShareSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const result = await shareWithLead({
    leadId: parsed.data.leadId,
    propertyId: parsed.data.propertyId,
    sharedBy: me.id,
    organizationId: me.organizationId,
    channel: parsed.data.channel,
    customMessage: parsed.data.customMessage || null,
  });
  if (!result.success) return fail(result.error ?? 'Could not share property');

  revalidatePath(`/leads/${parsed.data.leadId}`);
  return ok({ shareUrl: result.shareUrl, isDryRun: result.isDryRun ?? false });
}
