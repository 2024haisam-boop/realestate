'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/lib/validations/user.schema';
import { fail, type ActionResult } from '@/lib/types';

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

/**
 * Create a fresh organization + admin profile + integration_settings for the
 * given auth user. Used by registerAction AND by the loginAction self-heal
 * path (when an orphaned auth user signs in after a DB reset).
 *
 * Returns the new organization id on success, or an error string on failure.
 */
async function provisionOrgForAuthUser(args: {
  userId: string;
  fullName: string;
  organizationName: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string }> {
  const admin = createServiceClient();

  // Build a unique slug.
  let slug = slugify(args.organizationName);
  if (!slug) slug = `org-${args.userId.slice(0, 8)}`;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: slugError } = await (admin as any)
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (slugError) return { ok: false, error: slugError.message };
    if (!existing) break;
    suffix += 1;
    slug = `${slugify(args.organizationName) || 'org'}-${suffix}`;
    if (suffix > 50) return { ok: false, error: 'Could not generate a unique organization slug' };
  }

  // Create the organization.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error: orgError } = await (admin as any)
    .from('organizations')
    .insert({ name: args.organizationName, slug, plan: 'free' })
    .select('id')
    .single();
  if (orgError || !org) return { ok: false, error: orgError?.message ?? 'org insert failed' };

  // Create the profile (admin role).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any).from('profiles').insert({
    id: args.userId,
    organization_id: org.id,
    full_name: args.fullName,
    role: 'admin',
    is_active: true,
    is_available: true,
  });
  if (profileError) {
    // Roll the org back so the slug doesn't get squatted.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('organizations').delete().eq('id', org.id);
    return { ok: false, error: profileError.message };
  }

  // Default integration settings (dry-run on by default). Non-fatal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('integration_settings')
    .insert({ organization_id: org.id, dry_run_mode: true, lead_assignment_mode: 'round_robin' })
    .then(({ error: e }: { error: unknown }) => {
      if (e) console.warn('[provisionOrgForAuthUser] integration_settings failed (non-fatal):', e);
    });

  return { ok: true, organizationId: org.id };
}

export async function loginAction(
  raw: LoginInput,
  redirectTo?: string,
): Promise<ActionResult<{ userId: string }>> {
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
  console.log('[loginAction] sign-in OK, auth user id:', data.user.id, 'email:', data.user.email);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('id, organization_id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[loginAction] profile lookup error:', profileError);
    return fail(`Signed in but profile lookup failed: ${profileError.message}`);
  }

  // Self-heal path: orphaned auth user (e.g. DB was reset after registration).
  // Auto-create a fresh org + profile so the sign-in just works.
  if (!profile || !profile.organization_id) {
    console.log('[loginAction] no profile — auto-provisioning org for orphaned auth user');
    const emailLocal = (data.user.email ?? '').split('@')[0] || 'workspace';
    const fullName =
      (data.user.user_metadata?.full_name as string | undefined) ||
      emailLocal.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
      'Admin';
    const orgName = `${fullName}'s workspace`;

    const provision = await provisionOrgForAuthUser({
      userId: data.user.id,
      fullName,
      organizationName: orgName,
    });
    if (!provision.ok) {
      console.error('[loginAction] auto-provision failed:', provision.error);
      return fail(`Signed in but could not set up your workspace: ${provision.error}`);
    }
    console.log('[loginAction] auto-provisioned org', provision.organizationId, 'for', data.user.id);
  } else {
    console.log('[loginAction] profile OK, org id:', profile.organization_id);
  }

  // Redirect from the server action so the Set-Cookie header rides the same
  // response. A client-side router.push() races middleware and bounces back
  // to /login because the new cookie isn't visible yet.
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard');
}

/**
 * Self-serve org registration.
 *
 * Creates the auth user (auto-confirmed), then provisions the org + profile +
 * integration_settings via provisionOrgForAuthUser. On any failure after the
 * auth user is created, we delete the auth user so the next attempt doesn't
 * bail with "User already registered".
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

  const provision = await provisionOrgForAuthUser({ userId, fullName, organizationName });
  if (!provision.ok) {
    console.error('[registerAction] provision failed, deleting auth user:', provision.error);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return fail(friendlySupabaseError(provision.error));
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('[registerAction] auto sign-in after register failed:', signInError);
    return fail(
      `Account created but auto sign-in failed: ${signInError.message}. Try the login page.`,
    );
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
