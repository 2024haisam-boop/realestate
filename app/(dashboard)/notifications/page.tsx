import { Bell } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { NotificationList } from './notification-list';
import { MarkAllReadButton } from './mark-all-read-button';
import { requireSessionUser } from '@/lib/db/users';
import { listNotifications } from '@/lib/db/notifications';

export default async function NotificationsPage() {
  const me = await requireSessionUser();
  const notifications = await listNotifications(me.id, 100);
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <SetPageTitle title="Notifications" subtitle={unread > 0 ? `${unread} unread` : 'all read'} />
      <PageHeader
        title="Notifications"
        description="Realtime alerts about your leads, calls, follow-ups, and team."
        action={unread > 0 ? <MarkAllReadButton /> : null}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications yet"
          description="When leads, calls, or follow-ups need your attention, they'll show up here."
        />
      ) : (
        <NotificationList items={notifications} userId={me.id} />
      )}
    </div>
  );
}
