import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  href?: string;
  hint?: string;
  className?: string;
}

const TONE_STYLES: Record<
  NonNullable<MetricCardProps['tone']>,
  { iconBg: string; iconText: string; ring: string }
> = {
  neutral: {
    iconBg: 'bg-surface-3',
    iconText: 'text-text-secondary',
    ring: 'group-hover:ring-border-strong',
  },
  info: {
    iconBg: 'bg-brand-primary/10',
    iconText: 'text-brand-primary',
    ring: 'group-hover:ring-brand-primary/30',
  },
  success: {
    iconBg: 'bg-brand-success/15',
    iconText: 'text-brand-success',
    ring: 'group-hover:ring-brand-success/30',
  },
  warning: {
    iconBg: 'bg-brand-warning/15',
    iconText: 'text-brand-warning',
    ring: 'group-hover:ring-brand-warning/30',
  },
  danger: {
    iconBg: 'bg-brand-danger/15',
    iconText: 'text-brand-danger',
    ring: 'group-hover:ring-brand-danger/30',
  },
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  href,
  hint,
  className,
}: MetricCardProps) {
  const styles = TONE_STYLES[tone];
  const body = (
    <div
      className={cn(
        'group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 ring-1 ring-transparent transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        styles.ring,
        className,
      )}
    >
      {/* Soft gradient blob in the background */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
          tone === 'info' && 'bg-brand-primary/20',
          tone === 'success' && 'bg-brand-success/20',
          tone === 'warning' && 'bg-brand-warning/20',
          tone === 'danger' && 'bg-brand-danger/20',
          tone === 'neutral' && 'bg-surface-3',
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg',
            styles.iconBg,
            styles.iconText,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {href ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors group-hover:bg-surface-2 group-hover:text-text-secondary">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="relative space-y-0.5">
        <p className="font-mono text-[26px] font-semibold leading-none tracking-tight text-text-primary">
          {value}
        </p>
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{body}</Link>;
  return body;
}
