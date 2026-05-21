'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABEL,
} from '@/lib/constants';

export function PropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = (key: string) => searchParams.get(key) ?? 'all';

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === 'all') next.delete(key);
      else next.set(key, value);
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  const onLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    update('location', String(data.get('location') ?? ''));
  };

  const hasFilters = ['status', 'type', 'location'].some((k) => searchParams.get(k));

  return (
    <div className="space-y-3">
      <form onSubmit={onLocationSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            name="location"
            defaultValue={searchParams.get('location') ?? ''}
            placeholder="Filter by location…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" loading={isPending} className="shrink-0">
          Apply
        </Button>
      </form>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
        <Select value={get('status')} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROPERTY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PROPERTY_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={get('type')} onValueChange={(v) => update('type', v)}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {PROPERTY_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 text-text-secondary"
            onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
