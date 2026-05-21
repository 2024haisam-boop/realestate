import { Phone, PhoneCall, PhoneOff, PhoneMissed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { initialsFromName, shortRelative } from '@/lib/utils';
import type { CallStatus } from '@/lib/supabase/types';
import type { CallWithAgent } from '@/lib/db/calls';

interface CallLogProps {
  calls: CallWithAgent[];
}

const ICON: Record<CallStatus, typeof Phone> = {
  initiated: Phone,
  agent_ringing: Phone,
  agent_answered: PhoneCall,
  lead_ringing: Phone,
  connected: PhoneCall,
  completed: PhoneCall,
  failed: PhoneOff,
  no_answer: PhoneMissed,
  busy: PhoneOff,
};

const STATUS_LABEL: Record<CallStatus, string> = {
  initiated: 'Initiated',
  agent_ringing: 'Agent ringing',
  agent_answered: 'Agent answered',
  lead_ringing: 'Lead ringing',
  connected: 'Connected',
  completed: 'Completed',
  failed: 'Failed',
  no_answer: 'No answer',
  busy: 'Busy',
};

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function CallLog({ calls }: CallLogProps) {
  if (calls.length === 0) {
    return (
      <EmptyState
        icon={<Phone className="h-6 w-6" />}
        title="No calls yet"
        description="Tap the Call button to initiate a bridge call with this lead."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {calls.map((call) => {
        const Icon = ICON[call.status];
        return (
          <li key={call.id} className="flex items-start gap-3 py-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-secondary">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary">{STATUS_LABEL[call.status]}</p>
                {call.is_dry_run ? (
                  <Badge variant="muted" className="text-[10px] uppercase">
                    Dry run
                  </Badge>
                ) : null}
              </div>
              {call.notes ? (
                <p className="line-clamp-2 text-xs text-text-secondary">{call.notes}</p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                {call.agent ? (
                  <>
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {initialsFromName(call.agent.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{call.agent.full_name}</span>
                    <span>·</span>
                  </>
                ) : null}
                <span>{shortRelative(call.started_at)}</span>
                <span>·</span>
                <span className="font-mono">{formatDuration(call.duration_seconds)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
