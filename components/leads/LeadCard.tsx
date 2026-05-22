import Link from 'next/link';
import { Phone, Flame, MapPin, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LeadStatusBadge } from './LeadStatusBadge';
import { cn, formatPKRRange, initialsFromName, shortRelative } from '@/lib/utils';
import { LEAD_SOURCE_LABEL } from '@/lib/constants';
import type { LeadWithAgent } from '@/lib/db/leads';

interface LeadCardProps {
  lead: LeadWithAgent;
}

export function LeadCard({ lead }: LeadCardProps) {
  const isHot = lead.is_hot;
  return (
    <Link href={`/leads/${lead.id}`} className="group block">
      <div
        className={cn(
          'relative space-y-2.5 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200',
          'hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md',
          isHot && 'ring-1 ring-brand-accent/30',
        )}
      >
        {isHot ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-accent-gradient opacity-15 blur-2xl"
          />
        ) : null}

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {isHot ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
                  <Flame className="h-3 w-3" />
                </span>
              ) : null}
              <p className="truncate text-sm font-semibold text-text-primary">{lead.full_name}</p>
            </div>
            <p className="font-mono text-xs text-text-muted">{lead.phone}</p>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>

        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <Badge variant="muted" className="px-1.5 py-0 text-[10px] uppercase">
            {LEAD_SOURCE_LABEL[lead.source]}
          </Badge>
          {lead.preferred_location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {lead.preferred_location}
            </span>
          ) : null}
          <span className="font-mono text-text-primary">{formatPKRRange(lead.budget_min, lead.budget_max)}</span>
        </div>

        <div className="relative flex items-center justify-between gap-2 text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            {lead.agent ? (
              <>
                <Avatar className="h-5 w-5 ring-1 ring-surface-1">
                  <AvatarFallback className="bg-brand-gradient text-[9px] font-semibold text-white">
                    {initialsFromName(lead.agent.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span>{lead.agent.full_name}</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-brand-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-warning" />
                Unassigned
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {shortRelative(lead.created_at)}
            <ChevronRight className="h-3 w-3 text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </span>
        </div>
      </div>
    </Link>
  );
}
