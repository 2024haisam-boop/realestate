'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createFollowupAction } from '@/app/(dashboard)/followups/actions';
import { FOLLOWUP_TEMPLATES } from '@/lib/constants';
import type { FollowupType } from '@/lib/supabase/types';

interface FollowUpFormProps {
  leadId: string;
  defaultType?: FollowupType;
  onSaved?: () => void;
}

const TYPE_OPTIONS: { value: FollowupType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'other', label: 'Other' },
];

export function FollowUpForm({ leadId, defaultType = 'call', onSaved }: FollowUpFormProps) {
  const router = useRouter();
  const [type, setType] = useState<FollowupType>(defaultType);
  const [templateId, setTemplateId] = useState<string>('none');
  const [notes, setNotes] = useState('');
  const defaultDate = useMemo(() => {
    const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  }, []);
  const [scheduledAt, setScheduledAt] = useState(defaultDate);
  const [isPending, startTransition] = useTransition();

  const applicableTemplates = FOLLOWUP_TEMPLATES.filter((t) => t.channel === type);

  const save = () => {
    startTransition(async () => {
      const r = await createFollowupAction({
        leadId,
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes,
        templateUsed: templateId === 'none' ? '' : templateId,
      });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success('Follow-up scheduled');
      onSaved?.();
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as FollowupType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="when">When</Label>
          <Input
            id="when"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
      </div>

      {applicableTemplates.length > 0 ? (
        <div className="space-y-1.5">
          <Label>Template (optional)</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No template</SelectItem>
              {applicableTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-muted">
            Templates are referenced only — sending happens via the WhatsApp quick action on the lead.
          </p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's the point of this touchpoint?"
        />
      </div>

      <Button size="lg" className="w-full" onClick={save} loading={isPending}>
        <Calendar className="h-4 w-4" />
        Schedule follow-up
      </Button>
    </div>
  );
}
