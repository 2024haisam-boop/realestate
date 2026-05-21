import { createClient } from '@/lib/supabase/server';
import type { AttendanceRow, AttendanceStatus } from '@/lib/supabase/types';

export interface AttendanceWithUser extends AttendanceRow {
  user: { id: string; full_name: string; avatar_url: string | null } | null;
}

export async function getTodayAttendance(userId: string, dateISO: string): Promise<AttendanceRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateISO)
    .maybeSingle();
  return data;
}

interface UpsertCheckInInput {
  organizationId: string;
  userId: string;
  date: string;
  lat: number;
  lng: number;
  status: AttendanceStatus;
  selfieUrl?: string | null;
}

export async function upsertCheckIn(input: UpsertCheckInInput): Promise<AttendanceRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .upsert(
      {
        organization_id: input.organizationId,
        user_id: input.userId,
        date: input.date,
        check_in_time: new Date().toISOString(),
        check_in_lat: input.lat,
        check_in_lng: input.lng,
        check_in_selfie_url: input.selfieUrl ?? null,
        status: input.status,
      },
      { onConflict: 'user_id,date' },
    )
    .select('*')
    .single();
  if (error) {
    console.error('[attendance.upsertCheckIn]', error);
    return null;
  }
  return data;
}

interface UpdateCheckOutInput {
  userId: string;
  date: string;
  lat: number;
  lng: number;
}

export async function updateCheckOut(input: UpdateCheckOutInput): Promise<AttendanceRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_time: new Date().toISOString(),
      check_out_lat: input.lat,
      check_out_lng: input.lng,
    })
    .eq('user_id', input.userId)
    .eq('date', input.date)
    .select('*')
    .single();
  if (error) {
    console.error('[attendance.updateCheckOut]', error);
    return null;
  }
  return data;
}

export async function listUserAttendance(userId: string, limit = 30): Promise<AttendanceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listOrgAttendanceForDate(
  organizationId: string,
  dateISO: string,
): Promise<AttendanceWithUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance')
    .select(
      'id, organization_id, user_id, date, check_in_time, check_out_time, check_in_lat, check_in_lng, check_out_lat, check_out_lng, check_in_selfie_url, status, notes, created_at, updated_at, user:profiles(id, full_name, avatar_url)',
    )
    .eq('organization_id', organizationId)
    .eq('date', dateISO)
    .order('check_in_time', { ascending: true });

  if (!data) return [];
  return data.map((row) => ({
    ...row,
    user: Array.isArray(row.user) ? (row.user[0] ?? null) : row.user,
  })) as AttendanceWithUser[];
}
