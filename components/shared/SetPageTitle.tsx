'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';

interface SetPageTitleProps {
  title: string;
  subtitle?: string;
}

/**
 * Render this near the top of a server-rendered page to drive the TopBar
 * title from the route's content. It writes to the global UI store on mount
 * and resets to the default on unmount.
 */
export function SetPageTitle({ title, subtitle }: SetPageTitleProps) {
  const setPageTitle = useUIStore((s) => s.setPageTitle);
  const resetPageTitle = useUIStore((s) => s.resetPageTitle);

  useEffect(() => {
    setPageTitle(title, subtitle ?? null);
    return () => {
      resetPageTitle();
    };
  }, [title, subtitle, setPageTitle, resetPageTitle]);

  return null;
}
