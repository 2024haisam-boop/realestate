'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { requireSessionUser } from '@/lib/db/users';
import {
  inviteMemberSchema,
  updateMemberSchema,
  type InviteMemberInput,
  type UpdateMemberInput,
} from '@/lib/validations/user.schema';
import { fail, ok, type ActionResult } from '@/lib/types';
import type { AppRole } from '@/lib/supabase/types';

export async function inviteMemberAction(
  raw: InviteMemberInput,
): Promise<ActionResult<{ memberId: string }>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can invite team members');

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const admin = createServiceClient();

  // Create the auth user with the service role (auto-confirms the email).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (createError || !created.user) {
    return fail(createError?.message ?? 'Could not create user');
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    organization_id: me.organizationId,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    role: parsed.data.role as AppRole,
    is_active: true,
    is_available: true,
  });
  if (profileError) {
    // Best-effort cleanup if profile insert fails
    await admin.auth.admin.deleteUser(created.user.id);
    return fail(profileError.message);
  }

  revalidatePath('/team');
  return ok({ memberId: created.user.id });
}

export async function updateMemberAction(raw: UpdateMemberInput): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can update team members');

  const parsed = updateMemberSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const { memberId, role, isActive, isAvailable } = parsed.data;
  if (memberId === me.id && role && role !== 'admin') {
    return fail("You cannot remove your own admin role — promote another admin first");
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive;
  if (isAvailable !== undefined) updates.is_available = isAvailable;
  if (Object.keys(updates).length === 0) return ok(true);

  const admin = createServiceClient();
  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', memberId)
    .eq('organization_id', me.organizationId);
  if (error) return fail(error.message);

  revalidatePath('/team');
  return ok(true);
}

export async function removeMemberAction(memberId: string): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  if (me.role !== 'admin') return fail('Only admins can remove team members');
  if (memberId === me.id) return fail("You can't remove yourself");

  const admin = createServiceClient();

  // Confirm the member belongs to this org before deleting the auth user.
  const { data: target } = await admin
    .from('profiles')
    .select('id, organization_id')
    .eq('id', memberId)
    .maybeSingle();
  if (!target || target.organization_id !== me.organizationId) {
    return fail('Member not found in your organization');
  }

  const { error } = await admin.auth.admin.deleteUser(memberId);
  if (error) return fail(error.message);

  revalidatePath('/team');
  return ok(true);
}
