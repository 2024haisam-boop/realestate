'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRealtime } from './useRealtime';

const NOTIFICATIONS_KEY = ['notifications', 'unread-count'] as const;

async function fetchUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Live unread-notification count for the given user.
 * Subscribes to realtime INSERT/UPDATE events on notifications and refetches.
 */
export function useUnreadNotificationCount(userId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, userId],
    queryFn: () => fetchUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, userId] });
  }, [queryClient, userId]);

  useRealtime({
    channel: `notifications:${userId ?? 'anon'}`,
    table: 'notifications',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onChange: refetch,
  });

  return query;
}
