'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { markAllNotificationsReadAction } from './actions';

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const r = await markAllNotificationsReadAction();
      if (!r.success) toast.error(r.error);
      else {
        toast.success('All notifications marked as read');
        router.refresh();
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} loading={isPending}>
      <CheckCheck className="h-4 w-4" />
      Mark all read
    </Button>
  );
}
