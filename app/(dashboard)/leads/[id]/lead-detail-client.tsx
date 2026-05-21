'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LeadForm } from '@/components/leads/LeadForm';
import { QuickActions } from '@/components/leads/QuickActions';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import {
  addLeadNoteAction,
  deleteLeadAction,
  updateLeadAction,
} from '../actions';
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_TEMPERATURE_LABEL,
  isManagerial,
} from '@/lib/constants';
import { initialsFromName } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type {
  AppRole,
  LeadStatus,
  ProfileRow,
} from '@/lib/supabase/types';
import type { LeadWithAgent } from '@/lib/db/leads';
import type { PropertyWithImages } from '@/lib/db/properties';
import type { LeadCreateInput } from '@/lib/validations/lead.schema';

interface LeadDetailClientProps {
  lead: LeadWithAgent;
  agents: ProfileRow[];
  myRole: AppRole;
  shareableProperties: PropertyWithImages[];
}

export function LeadDetailClient({ lead, agents, myRole, shareableProperties }: LeadDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onStatusChange = (status: string) => {
    startTransition(async () => {
      const result = await updateLeadAction({ leadId: lead.id, status: status as LeadStatus });
      if (!result.success) toast.error(result.error);
      else {
        toast.success('Status updated');
        router.refresh();
      }
    });
  };

  const onAssigneeChange = (agentId: string) => {
    startTransition(async () => {
      const result = await updateLeadAction({
        leadId: lead.id,
        assignedAgentId: agentId === 'unassigned' ? null : agentId,
      });
      if (!result.success) toast.error(result.error);
      else {
        toast.success('Assignee updated');
        router.refresh();
      }
    });
  };

  const onSaveEdit = (values: LeadCreateInput) => {
    startTransition(async () => {
      const result = await updateLeadAction({
        leadId: lead.id,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        source: values.source,
        propertyType: values.propertyType,
        budgetMin: values.budgetMin,
        budgetMax: values.budgetMax,
        preferredLocation: values.preferredLocation,
        notes: values.notes,
        temperature: values.temperature,
        assignedAgentId: values.assignedAgentId || null,
        isHot: values.isHot,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Lead updated');
      setEditOpen(false);
      router.refresh();
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteLeadAction(lead.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Lead deleted');
      router.push('/leads');
      router.refresh();
    });
  };

  return (
    <>
      {/* HEADER BAR */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-text-primary">{lead.full_name}</h2>
              {lead.is_hot ? <Badge variant="danger">🔥 Hot</Badge> : null}
            </div>
            <p className="font-mono text-sm text-text-muted">{lead.phone}</p>
          </div>
          {isManagerial(myRole) ? (
            <ConfirmDialog
              title={`Delete ${lead.full_name}?`}
              description="This removes the lead and all of their activities, calls, messages and follow-ups. This cannot be undone."
              confirmLabel="Delete"
              onConfirm={onDelete}
              trigger={
                <Button variant="ghost" size="icon" className="text-brand-danger">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={lead.status} onValueChange={onStatusChange} disabled={isPending}>
            <SelectTrigger className="h-8 w-auto gap-1 border-none bg-transparent p-0 hover:bg-transparent">
              <LeadStatusBadge status={lead.status} />
              <ChevronDown className="h-3 w-3 text-text-muted" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="muted">{LEAD_TEMPERATURE_LABEL[lead.temperature]}</Badge>

          {isManagerial(myRole) ? (
            <Select
              value={lead.assigned_agent_id ?? 'unassigned'}
              onValueChange={onAssigneeChange}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-auto min-w-[140px] gap-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : lead.agent ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2 py-1 text-xs text-text-secondary">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[8px]">
                  {initialsFromName(lead.agent.full_name)}
                </AvatarFallback>
              </Avatar>
              {lead.agent.full_name}
            </div>
          ) : null}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <QuickActions
        leadId={lead.id}
        leadName={lead.full_name}
        leadPhone={lead.phone}
        leadPreferredLocation={lead.preferred_location}
        leadBudgetMax={lead.budget_max}
        shareableProperties={shareableProperties}
        onEdit={() => setEditOpen(true)}
      />

      {/* NOTE composer */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-1 p-3">
        <p className="text-sm font-medium text-text-primary">Notes</p>
        <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}>
          <Plus className="h-4 w-4" />
          Add note
        </Button>
      </div>

      {/* EDIT SHEET */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit lead</SheetTitle>
            <SheetDescription>Update lead details. Status changes via the badge above.</SheetDescription>
          </SheetHeader>
          <div className="pt-3">
            <LeadForm
              agents={agents}
              isPending={isPending}
              submitLabel="Save changes"
              defaultValues={{
                fullName: lead.full_name,
                phone: lead.phone,
                email: lead.email ?? '',
                source: lead.source,
                propertyType: lead.property_type ?? '',
                budgetMin: lead.budget_min ?? undefined,
                budgetMax: lead.budget_max ?? undefined,
                preferredLocation: lead.preferred_location ?? '',
                notes: lead.notes ?? '',
                assignedAgentId: lead.assigned_agent_id ?? '',
                temperature: lead.temperature,
                isHot: lead.is_hot,
              }}
              onSubmit={onSaveEdit}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* NOTE SHEET */}
      <NoteSheet
        leadId={lead.id}
        open={noteOpen}
        onOpenChange={setNoteOpen}
        onSaved={() => router.refresh()}
      />
    </>
  );
}

interface NoteSheetProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function NoteSheet({ leadId, open, onOpenChange, onSaved }: NoteSheetProps) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!body.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    startTransition(async () => {
      const result = await addLeadNoteAction({ leadId, body: body.trim() });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Note added');
      setBody('');
      onOpenChange(false);
      onSaved();
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Add note</SheetTitle>
          <SheetDescription>
            Notes appear on the lead timeline. Visible to everyone in your org.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-3 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="What did you learn from this lead?"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={save} loading={isPending}>
              <Pencil className="h-4 w-4" />
              Save note
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
