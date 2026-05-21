'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { useUIStore } from '@/lib/stores/ui-store';
import { initialsFromName } from '@/lib/utils';

interface TopBarProps {
  userId: string;
  userName: string;
  rightSlot?: React.ReactNode;
}

export function TopBar({ userId, userName, rightSlot }: TopBarProps) {
  const pageTitle = useUIStore((s) => s.pageTitle);
  const pageSubtitle = useUIStore((s) => s.pageSubtitle);

  return (
    <header className="glass fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 px-4 md:pl-64">
      <div className="flex min-w-0 items-center gap-3">
        {/* Brand mark visible on mobile only (desktop has the sidebar). */}
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-brand md:hidden"
          aria-label="Home"
        >
          <Building2 className="h-4.5 w-4.5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-text-primary">
            {pageTitle}
          </h1>
          {pageSubtitle ? (
            <p className="truncate text-[11px] leading-tight text-text-muted">{pageSubtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {rightSlot}
        <NotificationBell userId={userId} />
        <Link
          href="/settings"
          className="ml-1 inline-flex items-center"
          aria-label="Account"
        >
          <Avatar className="h-8 w-8 ring-2 ring-surface-1">
            <AvatarFallback className="bg-brand-gradient text-[11px] font-semibold text-white">
              {initialsFromName(userName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
