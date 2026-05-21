import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-1 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-wider text-brand-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-text-primary">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
