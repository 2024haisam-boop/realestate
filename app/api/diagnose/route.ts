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

  return NextResponse.json({
    ok: missingTables.length === 0,
    env,
    tables: tableResults,
    missingTables,
    nextSteps:
      missingTables.length === 0
        ? 'All required tables exist. You should be able to sign up.'
        : `Missing tables: ${missingTables.join(', ')}. Apply the migrations under supabase/migrations/ to your Supabase project.`,
  });
}
