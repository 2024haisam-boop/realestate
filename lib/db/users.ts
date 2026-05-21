import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/types';
import type { SessionUser } from '@/lib/types';

/**
 * Resolve the current authenticated user + their profile.
 * Returns null when there is no session or the profile row is missing.
 * Wrapped in React.cache so multiple server-component reads in one request
 * deduplicate to a single Supabase round-trip.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile || !profile.organization_id) return null;

  return {
    id: profile.id,
    email: user.email ?? '',
    fullName: profile.full_name,
    organizationId: profile.organization_id,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    isActive: profile.is_active,
    isAvailable: profile.is_available,
  };
});

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function listOrgMembers(organizationId: string): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProfileById(id: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data ?? null;
}
