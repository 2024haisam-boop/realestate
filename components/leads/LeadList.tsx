import { Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LeadCard } from './LeadCard';
import type { LeadWithAgent } from '@/lib/db/leads';

interface LeadListProps {
  leads: LeadWithAgent[];
}

export function LeadList({ leads }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="No leads match your filters"
        description="Adjust the filter chips above or add a lead manually."
      />
    );
  }
  return (
    <ul className="space-y-3">
      {leads.map((lead) => (
        <li key={lead.id}>
          <LeadCard lead={lead} />
        </li>
      ))}
    </ul>
  );
}
