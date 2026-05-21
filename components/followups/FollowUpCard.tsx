'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  completeFollowupAction,
  snoozeFollowupAction,
} from '@/app/(dashboard)/followups/actions';
import type { FollowupType, FollowupStatus } from '@/lib/supabase/types';
import type { FollowupWithLead } from '@/lib/db/followups';

const TYPE_ICON: Record<FollowupType, typeof Phone> = {
  call: Phone,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  email: Mail,
  site_visit: MapPin,
  other: Calendar,
};

const STATUS_VARIANT: Record<FollowupStatus, 'warning' | 'success' | 'muted' | 'danger'> = {
  pending: 'warning',
  completed: 'success',
  snoozed: 'muted',
  missed: 'danger',
};

interface FollowUpCardProps {
  followup: FollowupWithLead;
}

export function FollowUpCard({ followup }: FollowUpCardProps) {
  const router = useRouter();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const Icon = TYPE_ICON[followup.type];

  const scheduled = new Date(followup.scheduled_at);
  const dueLabel = format(scheduled, "EEE d MMM 'at' h:mm a");
  const isOverdue = followup.status === 'pending' && scheduled.getTime() < Date.now();

  return (
    <>
      <Card className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-secondary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-text-primary">
                {followup.lead ? (
                  <Link href={`/leads/${followup.lead.id}`} className="hover:text-brand-primary">
                    {followup.lead.full_name}
                  </Link>
                ) : (
                  'Lead removed'
                )}
              </p>
              <Badge variant={STATUS_VARIANT[followup.status]} className="text-[10px] uppercase">
                {followup.status}
              </Badge>
              {isOverdue ? (
                <Badge variant="danger" className="text-[10px] uppercase">Overdue</Badge>
              ) : null}
            </div>
            <p className="capitalize text-xs text-text-secondary">
              {followup.type.replace('_', ' ')}
              {followup.template_used ? ` · ${followup.template_used}` : ''}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-text-muted">
              <Clock className="h-3 w-3" />
              {dueLabel}
            </p>
            {followup.notes ? (
              <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{followup.notes}</p>
            ) : null}
          </div>
        </div>

        {followup.status === 'pending' ? (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="default" onClick={() => setCompleteOpen(true)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark done
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSnoozeOpen(true)}>
              <Clock className="h-3.5 w-3.5" />
              Snooze
            </Button>
          </div>
        ) : null}
      </Card>

      <CompleteSheet
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        followupId={followup.id}
        onSaved={() => router.refresh()}
      />
      <SnoozeSheet
        open={snoozeOpen}
        onOpenChange={setSnoozeOpen}
        followupId={followup.id}
        currentScheduledAt={followup.scheduled_at}
        onSaved={() => router.refresh()}
      />
    </>
  );
}

interface CompleteSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  followupId: string;
  onSaved: () => void;
}

function CompleteSheet({ open, onOpenChange, followupId, onSaved }: CompleteSheetProps) {
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const r = await completeFollowupAction({ followupId, notes });
      if (!r.success) toast.error(r.error);
      else {
        toast.success('Follow-up completed');
        onOpenChange(false);
        setNotes('');
        onSaved();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Mark follow-up done</SheetTitle>
          <SheetDescription>Optional: capture what happened during the touchpoint.</SheetDescription>
        </SheetHeader>
        <div className="mt-3 space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Outcome notes (optional)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={save} loading={isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface SnoozeSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  followupId: string;
  currentScheduledAt: string;
  onSaved: () => void;
}

function SnoozeSheet({ open, onOpenChange, followupId, currentScheduledAt, onSaved }: SnoozeSheetProps) {
  // Default to +24h from the current scheduled time.
  const defaultDate = new Date(new Date(currentScheduledAt).getTime() + 24 * 60 * 60 * 1000);
  const defaultValue = format(defaultDate, "yyyy-MM-dd'T'HH:mm");
  const [newScheduledAt, setNewScheduledAt] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const r = await snoozeFollowupAction({
        followupId,
        newScheduledAt: new Date(newScheduledAt).toISOString(),
      });
      if (!r.success) toast.error(r.error);
      else {
        toast.success('Follow-up snoozed');
        onOpenChange(false);
        onSaved();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Snooze follow-up</SheetTitle>
          <SheetDescription>Reschedule this touchpoint for later.</SheetDescription>
        </SheetHeader>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="snooze-when">New time</Label>
            <Input
              id="snooze-when"
              type="datetime-local"
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={save} loading={isPending}>
              Snooze
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
