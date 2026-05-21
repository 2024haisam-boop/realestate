'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LeadForm } from '@/components/leads/LeadForm';
import { createLeadAction } from '../actions';
import type { ProfileRow } from '@/lib/supabase/types';
import type { LeadCreateInput } from '@/lib/validations/lead.schema';

interface NewLeadFormClientProps {
  agents: ProfileRow[];
}

export function NewLeadFormClient({ agents }: NewLeadFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: LeadCreateInput) => {
    startTransition(async () => {
      const result = await createLeadAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Lead created');
      router.push(`/leads/${result.data.leadId}`);
      router.refresh();
    });
  };

  return <LeadForm agents={agents} onSubmit={onSubmit} isPending={isPending} submitLabel="Create lead" />;
}
