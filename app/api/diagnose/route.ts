import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/diagnose
 *
 * Sanity-check the Supabase connection and the migration state. Returns a
 * JSON summary indicating which tables exist, which are missing, and any
 * connection errors. Safe to expose only in dev / staging.
 */
const REQUIRED_TABLES = [
  'organizations',
  'profiles',
  'leads',
  'properties',
  'property_images',
  'property_documents',
  'calls',
  'messages',
  'followups',
  'activities',
  'attendance',
  'social_posts',
  'notifications',
  'integration_settings',
  'lead_property_shares',
] as const;

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DRY_RUN_MODE: process.env.DRY_RUN_MODE === 'true',
  };

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        env,
        error: 'One or more Supabase env vars are missing. Check .env.local.',
      },
      { status: 500 },
    );
  }

  const admin = createServiceClient();
  const tableResults: Record<string, { exists: boolean; error?: string }> = {};

  for (const table of REQUIRED_TABLES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .select('id', { count: 'exact', head: true });
    if (error) {
      tableResults[table] = { exists: false, error: error.message };
    } else {
      tableResults[table] = { exists: true };
    }
  }

  const missingTables = Object.entries(tableResults)
    .filter(([, v]) => !v.exists)
    .map(([k]) => k);

  // Also check whether auth users have matching profiles. This is the
  // single most common cause of "login succeeds but dashboard kicks me out":
  // an auth user with no row in `profiles` makes requireSessionUser redirect.
  let authProfileSummary: {
    authUserCount: number;
    profileCount: number;
    orphanedAuthUsers: { id: string; email: string | null }[];
    orphanedProfiles: { id: string }[];
  } | null = null;

  if (missingTables.length === 0) {
    try {
      const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (admin as any).from('profiles').select('id');
      const authIds = new Set((authList?.users ?? []).map((u) => u.id));
      const profileIds = new Set((profiles ?? []).map((p: { id: string }) => p.id));
      authProfileSummary = {
        authUserCount: authList?.users?.length ?? 0,
        profileCount: profiles?.length ?? 0,
        orphanedAuthUsers: (authList?.users ?? [])
          .filter((u) => !profileIds.has(u.id))
          .map((u) => ({ id: u.id, email: u.email ?? null })),
        orphanedProfiles: (profiles ?? [])
          .filter((p: { id: string }) => !authIds.has(p.id))
          .map((p: { id: string }) => ({ id: p.id })),
      };
    } catch (e) {
      console.error('[diagnose] auth/profile summary failed:', e);
    }
  }

  return NextResponse.json({
    ok: missingTables.length === 0,
    env,
    tables: tableResults,
    missingTables,
    authProfileSummary,
    nextSteps:
      missingTables.length > 0
        ? `Missing tables: ${missingTables.join(', ')}. Apply the migrations under supabase/migrations/ to your Supabase project.`
        : authProfileSummary && authProfileSummary.orphanedAuthUsers.length > 0
          ? `You have ${authProfileSummary.orphanedAuthUsers.length} auth user(s) WITHOUT a matching profile row. Logging in as one of these will succeed but the dashboard will kick you to /login. Either DELETE those auth users (visit /api/diagnose/clean-orphans) or register a fresh account.`
          : 'All required tables exist and auth users have matching profiles.',
  });
}
