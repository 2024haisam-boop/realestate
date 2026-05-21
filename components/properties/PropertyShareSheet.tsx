'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { sharePropertyWithLeadAction } from '@/app/(dashboard)/leads/actions';

interface LeadOption {
  id: string;
  full_name: string;
  phone: string;
}

interface PropertyShareSheetProps {
  propertyId: string;
  propertyTitle: string;
  leads: LeadOption[];
  /** Pre-selected lead id when invoked from the lead detail page. */
  defaultLeadId?: string;
  trigger?: React.ReactNode;
}

export function PropertyShareSheet({
  propertyId,
  propertyTitle,
  leads,
  defaultLeadId,
  trigger,
}: PropertyShareSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState(defaultLeadId ?? '');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [customMessage, setCustomMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const onShare = () => {
    if (!leadId) {
      toast.error('Pick a lead first');
      return;
    }
    startTransition(async () => {
      const result = await sharePropertyWithLeadAction({
        propertyId,
        leadId,
        channel,
        customMessage: customMessage || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.data.isDryRun ? 'Share simulated (dry run)' : 'Property shared', {
        description: result.data.shareUrl,
      });
      setOpen(false);
      setCustomMessage('');
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="default" size="sm">
            <Share2 className="h-4 w-4" />
            Share with lead
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Share with a lead</SheetTitle>
          <SheetDescription>
            Send <span className="font-medium">{propertyTitle}</span> directly to a lead. They&apos;ll
            get a public link with photos and details.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label>Lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.length === 0 ? (
                  <div className="p-3 text-sm text-text-muted">No leads available.</div>
                ) : (
                  leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name} · {l.phone}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as 'whatsapp' | 'sms')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Custom message (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Leave blank to use the default share template."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>

          <Button onClick={onShare} className="w-full" loading={isPending} size="lg">
            <MessageSquare className="h-4 w-4" />
            Send share link
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
