'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  /** Stable channel name. Should be unique per subscription site. */
  channel: string;
  table: string;
  /** Optional PostgREST-style filter, e.g. `user_id=eq.${userId}` */
  filter?: string | undefined;
  event?: RealtimeEvent | undefined;
  enabled?: boolean | undefined;
  /** Called on every payload. Keep handler stable (useCallback) to avoid resubscribe storms. */
  onChange: (payload: unknown) => void;
}

/**
 * Subscribe to Supabase Postgres changes for a single table.
 * Re-subscribes when channel/table/filter/event change.
 */
export function useRealtime({
  channel,
  table,
  filter,
  event = '*',
  enabled = true,
  onChange,
}: UseRealtimeOptions) {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const subscription = supabase
      .channel(channel)
      .on(
        // @ts-expect-error supabase-js's realtime overloads aren't friendly to generic table strings
        'postgres_changes',
        { event, schema: 'public', table, filter },
        (payload: unknown) => handlerRef.current(payload),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [channel, table, filter, event, enabled]);
}
