'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtime } from '@/hooks/useRealtime';

interface RealtimeRefresherProps {
  organizationId: string;
}

/**
 * Triggers a router.refresh() on every INSERT/UPDATE on activities or leads
 * for the org. The dashboard, lead list, and any other Recent-Activity surface
 * re-renders without the user having to reload.
 *
 * Filter is applied client-side to one channel per org so we don't fan out
 * subscriptions per page.
 */
export function RealtimeRefresher({ organizationId }: RealtimeRefresherProps) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  useRealtime({
    channel: `dash:activities:${organizationId}`,
    table: 'activities',
    filter: `organization_id=eq.${organizationId}`,
    onChange: refresh,
  });

  useRealtime({
    channel: `dash:leads:${organizationId}`,
    table: 'leads',
    filter: `organization_id=eq.${organizationId}`,
    onChange: refresh,
  });

  return null;
}
