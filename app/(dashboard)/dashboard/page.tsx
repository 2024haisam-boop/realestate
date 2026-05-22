import Link from 'next/link';
import { ArrowRight, Flame, Bell as BellIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { RealtimeRefresher } from '@/components/dashboard/RealtimeRefresher';
import { requireSessionUser } from '@/lib/db/users';
import { getDashboardMetrics, getHotLeads, getFollowupsDueToday } from '@/lib/db/dashboard';
import { listRecentActivities } from '@/lib/db/activities';
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, LEAD_SOURCE_LABEL } from '@/lib/constants';
import { formatPKRRange } from '@/lib/utils';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const greeting = user.fullName.split(' ')[0] ?? user.fullName;

  const [metrics, activities, hotLeads, followupsDueToday] = await Promise.all([
    getDashboardMetrics(user.organizationId),
    listRecentActivities(user.organizationId, 20),
    getHotLeads(user.organizationId, 5),
    getFollowupsDueToday(user.organizationId, 5),
  ]);

  return (
    <div className="space-y-5">
      <SetPageTitle title="Dashboard" subtitle={format(new Date(), "EEEE, d MMM")} />
      <RealtimeRefresher organizationId={user.organizationId} />

      <PageHeader
        title={`Hi ${greeting}`}
        description="Here's what's happening in your pipeline today."
      />

      <QuickStats metrics={metrics} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Hot Leads</CardTitle>
              <CardDescription>Highest-intent prospects in flight.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-text-secondary">
              <Link href="/leads?filter=hot">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {hotLeads.length === 0 ? (
              <EmptyState
                icon={<Flame className="h-6 w-6" />}
                title="No hot leads"
                description="Mark a lead as hot to surface it here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {hotLeads.map((lead) => (
                  <li key={lead.id} className="py-2.5">
                    <Link href={`/leads/${lead.id}`} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {lead.full_name}
                        </p>
                        <p className="truncate text-xs text-text-secondary">
                          {LEAD_SOURCE_LABEL[lead.source]} ·{' '}
                          {formatPKRRange(lead.budget_min, lead.budget_max)}
                        </p>
                      </div>
                      <Badge variant={LEAD_STATUS_TONE[lead.status]}>
                        {LEAD_STATUS_LABEL[lead.status]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Follow-ups Due</CardTitle>
              <CardDescription>Pending touchpoints scheduled for today.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-text-secondary">
              <Link href="/followups">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {followupsDueToday.length === 0 ? (
              <EmptyState
                icon={<BellIcon className="h-6 w-6" />}
                title="All clear for today"
                description="No follow-ups currently due."
              />
            ) : (
              <ul className="divide-y divide-border">
                {followupsDueToday.map((f) => (
                  <li key={f.id} className="py-2.5">
                    <Link href={`/leads/${f.lead_id}`} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary capitalize">
                          {f.type.replace('_', ' ')}
                          {f.template_used ? ` · ${f.template_used}` : ''}
                        </p>
                        <p className="font-mono text-xs text-text-muted">
                          {format(new Date(f.scheduled_at), 'h:mm a')}
                        </p>
                      </div>
                      <Badge variant="warning">Due</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>The last 20 events across your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
