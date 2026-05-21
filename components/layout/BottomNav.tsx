'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Bell,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MoreSheet } from './MoreSheet';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  match: (p: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home', match: (p) => p === '/dashboard' },
  { href: '/leads', icon: Users, label: 'Leads', match: (p) => p.startsWith('/leads') },
  {
    href: '/properties',
    icon: Building2,
    label: 'Properties',
    match: (p) => p.startsWith('/properties'),
  },
  { href: '/followups', icon: Bell, label: 'Tasks', match: (p) => p.startsWith('/followups') },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="glass fixed inset-x-0 bottom-0 z-30 flex h-[64px] items-center justify-around border-t border-border/70 px-2 pb-safe-bottom md:hidden"
        aria-label="Primary"
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex h-full min-w-[60px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium transition-colors',
                active ? 'text-brand-primary' : 'text-text-muted hover:text-text-secondary',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={cn(
                  'relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
                  active && 'bg-brand-primary/10',
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] transition-transform duration-200',
                    active ? 'scale-110' : 'group-active:scale-95',
                  )}
                />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="group flex h-full min-w-[60px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium text-text-muted transition-colors hover:text-text-secondary"
        >
          <span className="relative flex h-8 w-12 items-center justify-center rounded-full">
            <MoreHorizontal className="h-[18px] w-[18px] group-active:scale-95" />
          </span>
          <span>More</span>
        </button>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
