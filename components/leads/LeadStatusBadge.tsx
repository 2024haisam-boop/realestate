import { cn } from '@/lib/utils';
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from '@/lib/constants';
import type { LeadStatus } from '@/lib/supabase/types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
  pulse?: boolean;
}

const TONE_STYLE: Record<
  ReturnType<() => (typeof LEAD_STATUS_TONE)[LeadStatus]>,
  { bg: string; text: string; dot: string }
> = {
  neutral: { bg: 'bg-surface-3', text: 'text-text-secondary', dot: 'bg-text-muted' },
  info: { bg: 'bg-brand-primary/10', text: 'text-brand-primary', dot: 'bg-brand-primary' },
  success: { bg: 'bg-brand-success/15', text: 'text-brand-success', dot: 'bg-brand-success' },
  warning: { bg: 'bg-brand-warning/15', text: 'text-brand-warning', dot: 'bg-brand-warning' },
  danger: { bg: 'bg-brand-danger/15', text: 'text-brand-danger', dot: 'bg-brand-danger' },
};

export function LeadStatusBadge({ status, className, pulse }: LeadStatusBadgeProps) {
  const tone = LEAD_STATUS_TONE[status];
  const styles = TONE_STYLE[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles.bg,
        styles.text,
        className,
      )}
    >
      <span className={cn('relative h-1.5 w-1.5 rounded-full', styles.dot)}>
        {pulse ? (
          <span className={cn('absolute inset-0 animate-ping rounded-full opacity-70', styles.dot)} />
        ) : null}
      </span>
      {LEAD_STATUS_LABEL[status]}
    </span>
  );
}
