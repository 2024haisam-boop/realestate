'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Bell,
  Clock,
  Share2,
  UserCheck,
  BarChart2,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Pipeline',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/leads', icon: Users, label: 'Leads' },
      { href: '/properties', icon: Building2, label: 'Properties' },
      { href: '/followups', icon: Bell, label: 'Follow-ups' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/attendance', icon: Clock, label: 'Attendance' },
      { href: '/social', icon: Share2, label: 'Social Media' },
      { href: '/reports', icon: BarChart2, label: 'Reports' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/team', icon: UserCheck, label: 'Team' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface-1 md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5"
          aria-label="EstateFlow home"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-brand">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">
            EstateFlow
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              {group.label}
            </p>
            {group.items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-primary/[0.08] text-brand-primary'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                  )}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-primary" />
                  ) : null}
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      active
                        ? 'text-brand-primary'
                        : 'text-text-muted group-hover:text-text-secondary',
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl bg-brand-gradient p-3 text-white shadow-brand">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
            Dry-run mode
          </p>
          <p className="mt-1 text-xs text-white/90">
            Twilio calls + messages are simulated. Flip{' '}
            <code className="font-mono">dry_run_mode</code> off in Settings → Integrations to go live.
          </p>
        </div>
      </div>
    </aside>
  );
}
