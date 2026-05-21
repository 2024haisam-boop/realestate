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
  LEAD_SOURCE_LABEL,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_TEMPERATURES,
  LEAD_TEMPERATURE_LABEL,
} from '@/lib/constants';
import type { ProfileRow } from '@/lib/supabase/types';

interface LeadFiltersProps {
  /** Subset of org members shown in the assignment dropdown. Empty when role-restricted. */
  agents: ProfileRow[];
  /** When false, hide the agent selector (sales_agent can only see their own). */
  canFilterByAgent: boolean;
}

export function LeadFilters({ agents, canFilterByAgent }: LeadFiltersProps) {
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

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    update('q', String(data.get('q') ?? ''));
  };

  const hasFilters = ['status', 'temperature', 'source', 'agent', 'q', 'hot'].some(
    (k) => searchParams.get(k),
  );

  return (
    <div className="space-y-3">
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            name="q"
            defaultValue={searchParams.get('q') ?? ''}
            placeholder="Search name, phone, email…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" loading={isPending} className="shrink-0">
          Search
        </Button>
      </form>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
        <Select value={get('status')} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={get('temperature')} onValueChange={(v) => update('temperature', v)}>
          <SelectTrigger className="h-9 w-auto min-w-[120px] text-sm">
            <SelectValue placeholder="Temperature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any temp</SelectItem>
            {LEAD_TEMPERATURES.map((t) => (
              <SelectItem key={t} value={t}>
                {LEAD_TEMPERATURE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={get('source')} onValueChange={(v) => update('source', v)}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_SOURCE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canFilterByAgent ? (
          <Select value={get('agent')} onValueChange={(v) => update('agent', v)}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="mine">Mine</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant={searchParams.get('hot') === '1' ? 'default' : 'outline'}
          className="h-9"
          onClick={() => update('hot', searchParams.get('hot') === '1' ? null : '1')}
        >
          Hot only
        </Button>

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
