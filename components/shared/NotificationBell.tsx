'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { data: unreadCount = 0 } = useUnreadNotificationCount(userId);

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-2"
    >
      <Bell className="h-[18px] w-[18px]" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-gradient px-1 font-mono text-[10px] font-semibold text-white ring-2 ring-surface-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
