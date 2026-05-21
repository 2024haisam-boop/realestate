'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/lib/validations/user.schema';
import { fail, ok, type ActionResult } from '@/lib/types';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function friendlySupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('schema cache') || (m.includes('does not exist') && m.includes('relation'))) {
    return 'Database tables not found. Open supabase/setup.sql, paste it into the Supabase SQL Editor, and click Run — then try again.';
  }
  if (
    m.includes('user already registered') ||
    m.includes('already exists') ||
    m.includes('email_exists')
  ) {
    return 'An account with this email already exists. Try signing in instead, or use a different email.';
  }
  if (m.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (m.includes('email not confirmed')) {
    return 'Email confirmation is required. Disable "Confirm email" in Supabase → Authentication → Providers, or use a different email.';
  }
  return message;
}

export async function loginAction(raw: LoginInput): Promise<ActionResult<{ userId: string }>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    console.error('[loginAction] sign-in failed:', error);
    return fail(friendlySupabaseError(error?.message ?? 'Sign-in failed'));
  }
  return ok({ userId: data.user.id });
}

/**
 * Self-serve org registration.
 *
 * Uses the service-role client to:
 *   1. Create the auth user with email_confirm: true (skips email gate — better DX).
 *   2. Insert organization + profile + integration_settings.
 *   3. Sign the user in with the regular client so the cookie gets set.
 *
 * If any step fails, we attempt to clean up the partially created auth user so
 * the next attempt doesn't bail with "User already registered".
 */
export async function registerAction(
  raw: RegisterInput,
): Promise<ActionResult<{ organizationId: string; userId: string }>> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const { organizationName, fullName, email, password } = parsed.data;
  const admin = createServiceClient();

  // 1. Create the auth user (admin path — auto-confirmed, no email needed).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    console.error('[registerAction] admin.createUser failed:', createError);
    return fail(friendlySupabaseError(createError?.message ?? 'Could not create account'));
  }

  const userId = created.user.id;
  // Centralised cleanup if any subsequent step fails.
  const cleanup = async (reason: string, raw?: unknown) => {
    console.error(`[registerAction] ${reason}`, raw);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };

  // 2. Build a unique slug.
  let slug = slugify(organizationName);
  if (!slug) {
    await cleanup('empty slug from org name');
    return fail('Organization name must contain at least one alphanumeric character');
  }
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing, error: slugError } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (slugError) {
      await cleanup('slug-lookup failed', slugError);
      return fail(friendlySupabaseError(slugError.message));
    }
    if (!existing) break;
    suffix += 1;
    slug = `${slugify(organizationName)}-${suffix}`;
    if (suffix > 50) {
      await cleanup('slug exhausted');
      return fail('Could not generate a unique organization slug');
    }
  }

  // 3. Create the organization.
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: organizationName, slug, plan: 'free' })
    .select('id')
    .single();
  if (orgError || !org) {
    await cleanup('org insert failed', orgError);
    return fail(friendlySupabaseError(orgError?.message ?? 'Could not create organization'));
  }

  // 4. Create the profile (role = admin for the first user).
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    organization_id: org.id,
    full_name: fullName,
    role: 'admin',
    is_active: true,
    is_available: true,
  });
  if (profileError) {
    // Roll back the org so the slug doesn't get squatted.
    await admin.from('organizations').delete().eq('id', org.id);
    await cleanup('profile insert failed', profileError);
    return fail(friendlySupabaseError(profileError.message));
  }

  // 5. Default integration settings (dry-run on by default).
  const { error: settingsError } = await admin
    .from('integration_settings')
    .insert({ organization_id: org.id, dry_run_mode: true, lead_assignment_mode: 'round_robin' });
  if (settingsError) {
    // Not fatal — log it but continue. The org can run without settings.
    console.warn('[registerAction] integration_settings insert failed (non-fatal):', settingsError);
  }

  // 6. Sign the user in via the regular client so the session cookie is set.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('[registerAction] auto sign-in after register failed:', signInError);
    // The account is fully created; the user just needs to log in manually.
    return fail(
      `Account created but auto sign-in failed: ${signInError.message}. Try the login page.`,
    );
  }

  return ok({ organizationId: org.id, userId });
}

export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
