import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border bg-surface-1 p-10 text-center',
        className,
      )}
    >
      {/* Decorative glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-2xl"
      />

      {icon ? (
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand">
          {icon}
        </div>
      ) : null}
      <div className="relative max-w-md space-y-1.5">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description ? (
          <p className="text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="relative mt-1">{action}</div> : null}
    </div>
  );
}
