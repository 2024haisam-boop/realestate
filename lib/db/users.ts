import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/types';
import type { SessionUser } from '@/lib/types';

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

  if (error || !profile || !profile.organization_id) {
    // Auth cookie is valid but profile is missing. loginAction self-heals
    // this on next sign-in, so don't spam logs here.
    return null;
  }

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
  if (!user) redirect('/login');
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
