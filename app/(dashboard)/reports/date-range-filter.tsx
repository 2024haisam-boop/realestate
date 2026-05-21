'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangeFilterProps {
  initialPreset: '7d' | '30d' | '90d' | 'month' | 'custom';
}

const OPTIONS: Array<{ value: DateRangeFilterProps['initialPreset']; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'month', label: 'This month' },
];

export function DateRangeFilter({ initialPreset }: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const change = (preset: string) => {
    startTransition(() => router.replace(`${pathname}?preset=${preset}`, { scroll: false }));
  };

  return (
    <Select defaultValue={initialPreset} onValueChange={change} disabled={isPending}>
      <SelectTrigger className="h-9 w-44 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
