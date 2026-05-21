'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  UserPlus,
  Phone,
  PhoneMissed,
  Calendar,
  Home,
  Clock,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtime } from '@/hooks/useRealtime';
import { markNotificationReadAction } from './actions';
import { shortRelative, cn } from '@/lib/utils';
import type { NotificationRow, NotificationType } from '@/lib/supabase/types';

interface NotificationListProps {
  items: NotificationRow[];
  userId: string;
}

const ICON: Record<NotificationType, typeof Bell> = {
  new_lead: UserPlus,
  lead_assigned: UserPlus,
  missed_call: PhoneMissed,
  followup_due: Calendar,
  site_visit: Calendar,
  property_shared: Home,
  attendance_issue: Clock,
  social_post_due: Share2,
};

interface LinkInfo {
  href: string | null;
  text: string | null;
}

function linkFor(n: NotificationRow): LinkInfo {
  const meta = n.metadata as Record<string, string> | null;
  const leadId = meta?.leadId;
  const propertyId = meta?.propertyId;
  const postId = meta?.postId;
  if (leadId) return { href: `/leads/${leadId}`, text: 'Open lead' };
  if (propertyId) return { href: `/properties/${propertyId}`, text: 'Open property' };
  if (postId) return { href: `/social/${postId}`, text: 'Open post' };
  return { href: null, text: null };
}

export function NotificationList({ items, userId }: NotificationListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [rows, setRows] = useState(items);

  // Keep local state in sync if a server refresh hands us new data.
  useEffect(() => {
    setRows(items);
  }, [items]);

  // Live-update when new notifications arrive.
  useRealtime({
    channel: `notifications:list:${userId}`,
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onChange: () => router.refresh(),
  });

  const onMarkRead = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
    startTransition(async () => {
      const r = await markNotificationReadAction(id);
      if (!r.success) toast.error(r.error);
    });
  };

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {rows.map((n) => {
          const Icon = ICON[n.type];
          const link = linkFor(n);
          return (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                !n.is_read && 'bg-brand-primary/5',
              )}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-secondary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{n.title}</p>
                  {!n.is_read ? (
                    <Badge variant="info" className="text-[10px] uppercase">New</Badge>
                  ) : null}
                </div>
                {n.body ? (
                  <p className="line-clamp-2 text-xs text-text-secondary">{n.body}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-text-muted">{shortRelative(n.created_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {link.href ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={link.href}>{link.text}</Link>
                  </Button>
                ) : null}
                {!n.is_read ? (
                  <Button variant="ghost" size="sm" onClick={() => onMarkRead(n.id)}>
                    Mark read
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
