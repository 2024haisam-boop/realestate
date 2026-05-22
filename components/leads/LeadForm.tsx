'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABEL,
  LEAD_TEMPERATURES,
  LEAD_TEMPERATURE_LABEL,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABEL,
} from '@/lib/constants';
import { leadCreateSchema, type LeadCreateInput } from '@/lib/validations/lead.schema';
import type { ProfileRow } from '@/lib/supabase/types';

export type LeadFormDefaults = Partial<LeadCreateInput>;

interface LeadFormProps {
  defaultValues?: LeadFormDefaults;
  agents: ProfileRow[];
  isPending: boolean;
  submitLabel?: string;
  onSubmit: (values: LeadCreateInput) => void;
}

export function LeadForm({
  defaultValues,
  agents,
  isPending,
  submitLabel = 'Save lead',
  onSubmit,
}: LeadFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadCreateInput>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      source: defaultValues?.source ?? 'manual',
      propertyType: defaultValues?.propertyType ?? '',
      budgetMin: defaultValues?.budgetMin ?? undefined,
      budgetMax: defaultValues?.budgetMax ?? undefined,
      preferredLocation: defaultValues?.preferredLocation ?? '',
      notes: defaultValues?.notes ?? '',
      assignedAgentId: defaultValues?.assignedAgentId ?? '',
      temperature: defaultValues?.temperature ?? 'cold',
      isHot: defaultValues?.isHot ?? false,
    },
  });

  const source = watch('source');
  const propertyType = watch('propertyType');
  const assignedAgentId = watch('assignedAgentId');
  const temperature = watch('temperature');
  const isHot = watch('isHot');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register('fullName')} />
          {errors.fullName ? <p className="text-xs text-brand-danger">{errors.fullName.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+923001000003" {...register('phone')} />
          {errors.phone ? <p className="text-xs text-brand-danger">{errors.phone.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email ? <p className="text-xs text-brand-danger">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredLocation">Preferred location</Label>
          <Input id="preferredLocation" placeholder="Gurgaon, Powai…" {...register('preferredLocation')} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select
            value={source}
            onValueChange={(v) => setValue('source', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_SOURCE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Property type</Label>
          <Select
            value={propertyType || ''}
            onValueChange={(v) => setValue('propertyType', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROPERTY_TYPE_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Temperature</Label>
          <Select
            value={temperature}
            onValueChange={(v) => setValue('temperature', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_TEMPERATURES.map((t) => (
                <SelectItem key={t} value={t}>
                  {LEAD_TEMPERATURE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="budgetMin">Budget min (₹)</Label>
          <Input id="budgetMin" type="number" inputMode="numeric" {...register('budgetMin')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budgetMax">Budget max (₹)</Label>
          <Input id="budgetMax" type="number" inputMode="numeric" {...register('budgetMax')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Assign to</Label>
        <Select
          value={assignedAgentId || ''}
          onValueChange={(v) => setValue('assignedAgentId', v, { shouldValidate: true })}
        >
          <SelectTrigger><SelectValue placeholder="Unassigned (round-robin will handle webhooks)" /></SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} placeholder="Anything the team should know…" {...register('notes')} />
      </div>

      <label className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-text-primary">Mark as Hot Lead</p>
          <p className="text-xs text-text-secondary">High intent — surfaced on the dashboard.</p>
        </div>
        <Switch checked={isHot} onCheckedChange={(v) => setValue('isHot', v)} />
      </label>

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
