'use client';

import { useState } from 'react';
import { Calendar, Home, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CallButton } from '@/components/calls/CallButton';
import { WhatsappTemplatePicker } from './WhatsappTemplatePicker';
import { FollowUpForm } from '@/components/followups/FollowUpForm';
import { PropertyShareSheet } from '@/components/properties/PropertyShareSheet';
import type { PropertyWithImages } from '@/lib/db/properties';

interface QuickActionsProps {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadPreferredLocation: string | null;
  leadBudgetMax: number | null;
  /** Available properties in the org that this agent can share. */
  shareableProperties: PropertyWithImages[];
  onEdit: () => void;
}

/**
 * Sticky horizontal action bar on the lead detail page.
 * - Call: bridge call via callService (dry-run aware)
 * - WhatsApp: template picker → sendMessage
 * - Send Property: picker over available org inventory → propertyShareService
 * - Follow Up: scheduler that creates a followups row + activity
 * - Edit: opens the edit lead sheet
 */
export function QuickActions({
  leadId,
  leadName,
  leadPhone,
  leadPreferredLocation,
  leadBudgetMax,
  shareableProperties,
  onEdit,
}: QuickActionsProps) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [propertyPickerOpen, setPropertyPickerOpen] = useState(false);

  return (
    <div className="sticky top-14 z-20 -mx-4 border-y border-border bg-surface-1 px-4 py-2 md:mx-0 md:rounded-xl md:border md:px-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
        <CallButton leadId={leadId} className="shrink-0" />

        <WhatsappTemplatePicker
          leadId={leadId}
          leadName={leadName}
          preferredLocation={leadPreferredLocation}
          budgetMax={leadBudgetMax}
        />

        <Sheet open={propertyPickerOpen} onOpenChange={setPropertyPickerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <Home className="h-4 w-4" />
              Send Property
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Pick a property to share</SheetTitle>
              <SheetDescription>
                The recipient gets a public link with photos and details — no sign-in needed.
              </SheetDescription>
            </SheetHeader>
            {shareableProperties.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">
                No available properties to share. Add one under Properties → New property.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {shareableProperties.slice(0, 12).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-1 p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{p.title}</p>
                      <p className="truncate text-xs text-text-secondary">
                        {p.location}
                        {p.bedrooms ? ` · ${p.bedrooms} BHK` : ''}
                      </p>
                    </div>
                    <PropertyShareSheet
                      propertyId={p.id}
                      propertyTitle={p.title}
                      defaultLeadId={leadId}
                      leads={[{ id: leadId, full_name: leadName, phone: leadPhone }]}
                      trigger={<Button size="sm">Share</Button>}
                    />
                  </li>
                ))}
              </ul>
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={followUpOpen} onOpenChange={setFollowUpOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <Calendar className="h-4 w-4" />
              Follow Up
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Schedule a follow-up</SheetTitle>
              <SheetDescription>Add a touchpoint to your follow-ups queue.</SheetDescription>
            </SheetHeader>
            <div className="pt-3">
              <FollowUpForm leadId={leadId} onSaved={() => setFollowUpOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="ghost" size="sm" className="shrink-0" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}
