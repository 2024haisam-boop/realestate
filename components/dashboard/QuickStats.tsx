import {
  UserPlus,
  Phone,
  Bell,
  Flame,
  Calendar,
  Building2,
  UserCheck,
  Trophy,
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { DashboardMetrics } from '@/lib/db/dashboard';

interface QuickStatsProps {
  metrics: DashboardMetrics;
}

export function QuickStats({ metrics }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard
        label="New Leads Today"
        value={metrics.newLeadsToday}
        icon={UserPlus}
        tone="info"
        href="/leads"
      />
      <MetricCard
        label="Calls Made Today"
        value={metrics.callsMadeToday}
        icon={Phone}
        tone="info"
      />
      <MetricCard
        label="Follow-ups Due"
        value={metrics.followupsDue}
        icon={Bell}
        tone={metrics.followupsDue > 0 ? 'warning' : 'neutral'}
        href="/followups"
      />
      <MetricCard
        label="Hot Leads"
        value={metrics.hotLeads}
        icon={Flame}
        tone="danger"
        href="/leads?filter=hot"
      />
      <MetricCard
        label="Site Visits Today"
        value={metrics.siteVisitsToday}
        icon={Calendar}
        tone="warning"
      />
      <MetricCard
        label="Available Properties"
        value={metrics.availableProperties}
        icon={Building2}
        tone="neutral"
        href="/properties"
      />
      <MetricCard
        label="Team Online"
        value={metrics.teamOnline}
        icon={UserCheck}
        tone="success"
        href="/attendance"
      />
      <MetricCard
        label="Won This Month"
        value={metrics.wonThisMonth}
        icon={Trophy}
        tone="success"
      />
    </div>
  );
}
