'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionUser } from '@/lib/db/users';
import { createFollowup, getFollowupById, updateFollowupStatus } from '@/lib/db/followups';
import { createActivity } from '@/lib/db/activities';
import {
  followupCompleteSchema,
  followupCreateSchema,
  followupSnoozeSchema,
  type FollowupCompleteInput,
  type FollowupCreateInput,
  type FollowupSnoozeInput,
} from '@/lib/validations/followup.schema';
import { fail, ok, type ActionResult } from '@/lib/types';
import type { FollowupType, LeadStatus } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/server';

export async function createFollowupAction(
  raw: FollowupCreateInput,
): Promise<ActionResult<{ followupId: string }>> {
  const me = await requireSessionUser();
  const parsed = followupCreateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const v = parsed.data;
  const agentId = v.agentId && v.agentId.length > 0 ? v.agentId : me.id;

  const followup = await createFollowup({
    organizationId: me.organizationId,
    leadId: v.leadId,
    agentId,
    type: v.type as FollowupType,
    scheduledAt: v.scheduledAt,
    notes: v.notes || null,
    templateUsed: v.templateUsed || null,
  });
  if (!followup) return fail('Could not create follow-up');

  // Bump the lead's next_followup_at + status when relevant.
  const supabase = await createClient();
  const patch: Record<string, unknown> = { next_followup_at: v.scheduledAt };
  if (v.type === 'site_visit') patch.status = 'site_visit_scheduled' satisfies LeadStatus;
  await supabase.from('leads').update(patch).eq('id', v.leadId);

  await createActivity({
    organizationId: me.organizationId,
    leadId: v.leadId,
    userId: me.id,
    type: 'followup_scheduled',
    title: `Follow-up scheduled (${v.type.replace('_', ' ')})`,
    description: `Scheduled for ${new Date(v.scheduledAt).toLocaleString('en-IN')}`,
    metadata: { followupId: followup.id, type: v.type, templateUsed: v.templateUsed || null },
  });

  revalidatePath('/followups');
  revalidatePath(`/leads/${v.leadId}`);
  return ok({ followupId: followup.id });
}

export async function completeFollowupAction(
  raw: FollowupCompleteInput,
): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  const parsed = followupCompleteSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const existing = await getFollowupById(parsed.data.followupId);
  if (!existing) return fail('Follow-up not found');

  const updated = await updateFollowupStatus(parsed.data.followupId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    notes: parsed.data.notes || existing.notes,
  });
  if (!updated) return fail('Could not complete follow-up');

  if (existing.lead_id) {
    await createActivity({
      organizationId: me.organizationId,
      leadId: existing.lead_id,
      userId: me.id,
      type: 'followup_completed',
      title: 'Follow-up completed',
      description: parsed.data.notes || null,
      metadata: { followupId: existing.id },
    });
  }

  revalidatePath('/followups');
  if (existing.lead_id) revalidatePath(`/leads/${existing.lead_id}`);
  return ok(true);
}

export async function snoozeFollowupAction(raw: FollowupSnoozeInput): Promise<ActionResult<true>> {
  await requireSessionUser();
  const parsed = followupSnoozeSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const existing = await getFollowupById(parsed.data.followupId);
  if (!existing) return fail('Follow-up not found');

  const updated = await updateFollowupStatus(parsed.data.followupId, {
    status: 'snoozed',
    scheduledAt: parsed.data.newScheduledAt,
  });
  if (!updated) return fail('Could not snooze');

  revalidatePath('/followups');
  if (existing.lead_id) revalidatePath(`/leads/${existing.lead_id}`);
  return ok(true);
}

export async function markMissedAction(followupId: string): Promise<ActionResult<true>> {
  await requireSessionUser();
  const updated = await updateFollowupStatus(followupId, { status: 'missed' });
  if (!updated) return fail('Could not mark missed');
  revalidatePath('/followups');
  return ok(true);
}
