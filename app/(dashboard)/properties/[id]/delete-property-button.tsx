'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { deletePropertyAction } from '../actions';

interface DeletePropertyButtonProps {
  propertyId: string;
}

export function DeletePropertyButton({ propertyId }: DeletePropertyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const r = await deletePropertyAction(propertyId);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success('Property deleted');
      router.push('/properties');
      router.refresh();
    });
  };

  return (
    <ConfirmDialog
      title="Delete this property?"
      description="This removes the listing, all photos, and the share link. This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onDelete}
      trigger={
        <Button variant="outline" size="sm" className="text-brand-danger" disabled={isPending}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      }
    />
  );
}
