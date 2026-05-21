'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { createPropertyAction } from '../actions';
import type { PropertyCreateInput } from '@/lib/validations/property.schema';

export function NewPropertyFormClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: PropertyCreateInput) => {
    startTransition(async () => {
      const result = await createPropertyAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Property created — now upload some photos');
      router.push(`/properties/${result.data.propertyId}`);
      router.refresh();
    });
  };

  return <PropertyForm isPending={isPending} onSubmit={onSubmit} submitLabel="Create property" />;
}
