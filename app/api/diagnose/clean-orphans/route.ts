import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/diagnose/clean-orphans
 *
 * Removes auth.users rows that don't have a corresponding row in profiles.
 * Useful after failed registrations left orphans (e.g. when the migrations
 * weren't applied yet). Dev/setup only — should never be exposed in prod.
 *
 * Requires the migrations to have been applied (so the profiles table exists).
 */
export async function POST() {
  const admin = createServiceClient();

  // First confirm profiles table exists; if not, we'd delete every auth user.
  const { error: probeError } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  if (probeError) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Can't clean orphans until the migrations are applied. Paste supabase/setup.sql into the Supabase SQL Editor first.",
        details: probeError.message,
      },
      { status: 412 },
    );
  }

  // List all auth users.
  const { data: usersResp, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    return NextResponse.json({ ok: false, error: listError.message }, { status: 500 });
  }

  // Build set of users that have a profile row.
  const { data: profileRows } = await admin.from('profiles').select('id');
  const profileIds = new Set((profileRows ?? []).map((p) => p.id));

  const orphans = usersResp.users.filter((u) => !profileIds.has(u.id));
  const deleted: string[] = [];
  const failures: { id: string; email: string | null; error: string }[] = [];

  for (const u of orphans) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) failures.push({ id: u.id, email: u.email ?? null, error: error.message });
    else deleted.push(u.email ?? u.id);
  }

  return NextResponse.json({
    ok: failures.length === 0,
    deleted,
    failures,
    totalOrphans: orphans.length,
  });
}
