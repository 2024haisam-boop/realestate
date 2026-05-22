'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FOLLOWUP_TEMPLATES } from '@/lib/constants';
import { sendWhatsappTemplateAction } from '@/app/(dashboard)/leads/actions';
import { formatPKR } from '@/lib/utils';

interface WhatsappTemplatePickerProps {
  leadId: string;
  leadName: string;
  preferredLocation: string | null;
  budgetMax: number | null;
  trigger?: React.ReactNode;
}

/** Render a template body locally so the user can preview/edit before sending. */
function renderTemplate(body: string, args: {
  leadName: string;
  preferredLocation: string | null;
  budgetMax: number | null;
}): string {
  return body
    .replace(/{{leadName}}/g, args.leadName)
    .replace(/{{preferredLocation}}/g, args.preferredLocation ?? 'your preferred area')
    .replace(
      /{{budgetMax}}/g,
      args.budgetMax != null ? formatPKR(args.budgetMax).replace(/^Rs\s*/, '') : 'your budget',
    );
}

export function WhatsappTemplatePicker({
  leadId,
  leadName,
  preferredLocation,
  budgetMax,
  trigger,
}: WhatsappTemplatePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>(FOLLOWUP_TEMPLATES[0]?.id ?? 'ft1');
  const [body, setBody] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const rendered = useMemo(() => {
    const template = FOLLOWUP_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return '';
    return renderTemplate(template.body, { leadName, preferredLocation, budgetMax });
  }, [templateId, leadName, preferredLocation, budgetMax]);

  // Sync body when a template is picked, but allow free edits afterwards.
  const onTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = FOLLOWUP_TEMPLATES.find((x) => x.id === id);
    if (t) setBody(renderTemplate(t.body, { leadName, preferredLocation, budgetMax }));
  };

  const send = () => {
    startTransition(async () => {
      const r = await sendWhatsappTemplateAction({
        leadId,
        templateId,
        customBody: body || undefined,
      });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(r.data.isDryRun ? 'Sent (dry run)' : 'Message sent', {
        description: r.data.body,
      });
      setOpen(false);
      setBody('');
      router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && !body) setBody(rendered);
      }}
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Send a templated message</SheetTitle>
          <SheetDescription>
            Pick a template, tweak the wording if you want, then send via WhatsApp or SMS.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label>Template</Label>
            <RadioGroup value={templateId} onValueChange={onTemplateChange}>
              {FOLLOWUP_TEMPLATES.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-surface-1 p-2 text-sm hover:bg-surface-2"
                >
                  <RadioGroupItem value={t.id} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {t.name}{' '}
                      <span className="text-[10px] uppercase tracking-wide text-text-muted">
                        {t.channel}
                      </span>
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message-body">Message</Label>
            <Textarea
              id="message-body"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={rendered}
            />
          </div>

          <Button onClick={send} className="w-full" loading={isPending} size="lg">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
