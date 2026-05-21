'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Clock, Share2, UserCheck, BarChart2, Settings, Plug, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { logoutAction } from '@/app/(auth)/actions';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ITEMS = [
  { href: '/attendance', icon: Clock, label: 'Attendance' },
  { href: '/social', icon: Share2, label: 'Social Media' },
  { href: '/team', icon: UserCheck, label: 'Team' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/settings#integrations', icon: Plug, label: 'Integrations' },
];

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetDescription>Everything else lives here.</SheetDescription>
        </SheetHeader>
        <ul className="mt-2 divide-y divide-border">
          {ITEMS.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 py-3 text-base font-medium text-text-primary hover:text-brand-primary"
              >
                <Icon className="h-5 w-5 text-text-secondary" />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await logoutAction(); })}
              className="flex w-full items-center gap-3 py-3 text-left text-base font-medium text-brand-danger disabled:opacity-60"
            >
              <LogOut className="h-5 w-5" />
              {isPending ? 'Signing out…' : 'Sign Out'}
            </button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
}
