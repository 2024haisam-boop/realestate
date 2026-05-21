'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SocialPostWithAssignee } from '@/lib/db/social';

interface ContentCalendarProps {
  posts: SocialPostWithAssignee[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ContentCalendar({ posts }: ContentCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const result: Date[] = [];
    for (let i = 0; i < 42; i++) result.push(addDays(start, i));
    return result;
  }, [month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, SocialPostWithAssignee[]>();
    for (const post of posts) {
      const dateStr = post.scheduled_at?.slice(0, 10) ?? post.published_at?.slice(0, 10);
      if (!dateStr) continue;
      const arr = map.get(dateStr) ?? [];
      arr.push(post);
      map.set(dateStr, arr);
    }
    return map;
  }, [posts]);

  const monthEnd = endOfMonth(month);
  const selectedPosts = selectedDate
    ? postsByDay.get(format(selectedDate, 'yyyy-MM-dd')) ?? []
    : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text-primary">{format(month, 'MMMM yyyy')}</div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month) && day <= monthEnd;
          const key = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDay.get(key) ?? [];
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs transition-colors',
                inMonth ? 'border-border bg-surface-1 text-text-primary' : 'border-transparent text-text-muted',
                isSelected && 'border-brand-primary bg-brand-primary/10',
                !isSelected && isToday && 'ring-1 ring-brand-primary',
              )}
            >
              <span>{format(day, 'd')}</span>
              {dayPosts.length > 0 ? (
                <span className="absolute bottom-1 inline-flex items-center gap-0.5">
                  {dayPosts.slice(0, 3).map((p, i) => (
                    <span
                      key={`${p.id}-${i}`}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        p.status === 'published' ? 'bg-brand-success' : p.status === 'scheduled' ? 'bg-brand-warning' : 'bg-brand-primary',
                      )}
                    />
                  ))}
                  {dayPosts.length > 3 ? (
                    <span className="font-mono text-[9px] text-text-muted">+{dayPosts.length - 3}</span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {selectedDate ? format(selectedDate, 'EEEE, d MMMM') : 'Pick a date'}
        </p>
        {selectedPosts.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {selectedPosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/social/${p.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-1 p-2 text-sm hover:bg-surface-2"
                >
                  <span className="line-clamp-1 flex-1 text-text-primary">
                    {p.caption?.trim() || <span className="italic text-text-muted">No caption</span>}
                  </span>
                  <Badge variant="muted" className="text-[10px] uppercase">
                    {p.platform.replace('_', ' ')}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
