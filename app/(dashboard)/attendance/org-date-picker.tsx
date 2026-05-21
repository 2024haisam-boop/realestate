'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

export function OrgDatePicker({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <Input
      type="date"
      defaultValue={defaultDate}
      disabled={isPending}
      className="h-9 w-44 text-sm"
      onChange={(e) => {
        const value = e.target.value;
        if (!value) return;
        startTransition(() => router.replace(`${pathname}?date=${value}`, { scroll: false }));
      }}
    />
  );
}
