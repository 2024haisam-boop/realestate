import { createClient } from '@/lib/supabase/server';
import type { NotificationRow } from '@/lib/supabase/types';

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count ?? 0;
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
}
