import {
  UserPlus,
  Phone,
  PhoneCall,
  MessageSquare,
  Home,
  FileText,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { initialsFromName, shortRelative, cn } from '@/lib/utils';
import type { ActivityType } from '@/lib/supabase/types';
import type { ActivityWithActor } from '@/lib/db/activities';

interface ActivityFeedProps {
  activities: ActivityWithActor[];
}

interface IconConfig {
  Icon: LucideIcon;
  bg: string;
  text: string;
}

const ICONS: Record<ActivityType, IconConfig> = {
  lead_created:       { Icon: UserPlus,     bg: 'bg-brand-success/15', text: 'text-brand-success' },
  lead_assigned:      { Icon: UserPlus,     bg: 'bg-brand-primary/10', text: 'text-brand-primary' },
  call_made:          { Icon: Phone,        bg: 'bg-brand-primary/10', text: 'text-brand-primary' },
  call_completed:     { Icon: PhoneCall,    bg: 'bg-brand-primary/10', text: 'text-brand-primary' },
  message_sent:       { Icon: MessageSquare, bg: 'bg-brand-success/15', text: 'text-brand-success' },
  property_shared:    { Icon: Home,         bg: 'bg-brand-accent/15',  text: 'text-brand-accent' },
  note_added:         { Icon: FileText,     bg: 'bg-surface-3',        text: 'text-text-secondary' },
  followup_scheduled: { Icon: Calendar,     bg: 'bg-brand-warning/15', text: 'text-brand-warning' },
  followup_completed: { Icon: CheckCircle2, bg: 'bg-brand-success/15', text: 'text-brand-success' },
  status_changed:     { Icon: RefreshCw,    bg: 'bg-brand-warning/15', text: 'text-brand-warning' },
  checkin:            { Icon: LogIn,        bg: 'bg-brand-success/15', text: 'text-brand-success' },
  checkout:           { Icon: LogOut,       bg: 'bg-surface-3',        text: 'text-text-secondary' },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-6 w-6" />}
        title="No activity yet"
        description="Lead actions, calls, and follow-ups will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => {
        const config = ICONS[activity.type];
        const actor = activity.user;
        return (
          <li key={activity.id} className="flex items-start gap-3">
            <span
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                config.bg,
                config.text,
              )}
            >
              <config.Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-text-primary">{activity.title}</p>
              {activity.description ? (
                <p className="line-clamp-2 text-xs text-text-secondary">{activity.description}</p>
              ) : null}
              <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                {actor ? (
                  <>
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {initialsFromName(actor.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{actor.full_name}</span>
                    <span>·</span>
                  </>
                ) : null}
                <span>{shortRelative(activity.created_at)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
