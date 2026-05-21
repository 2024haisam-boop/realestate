import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { DateRangeFilter } from './date-range-filter';
import {
  AgentPerformanceTable,
  FollowupCompletionChart,
  LeadsBySourceChart,
  LeadsByStatusChart,
  PropertiesSharedChart,
  WonLostFunnelChart,
} from '@/components/reports/charts';
import { requireSessionUser } from '@/lib/db/users';
import {
  agentPerformance,
  followupCompletionByDay,
  leadsBySource,
  leadsByStatus,
  presetRange,
  propertiesShared,
  wonLostFunnel,
} from '@/lib/db/reports';

type SP = Record<string, string | string[] | undefined>;

const VALID_PRESETS = ['7d', '30d', '90d', 'month', 'custom'] as const;
type Preset = (typeof VALID_PRESETS)[number];

function read(sp: SP, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const me = await requireSessionUser();
  const sp = await searchParams;
  const rawPreset = (read(sp, 'preset') ?? '30d') as Preset;
  const preset: Preset = (VALID_PRESETS as readonly string[]).includes(rawPreset) ? rawPreset : '30d';
  const from = read(sp, 'from');
  const to = read(sp, 'to');
  const range = presetRange(preset, from, to);

  const [source, status, funnel, performance, completion, shared] = await Promise.all([
    leadsBySource(me.organizationId, range),
    leadsByStatus(me.organizationId, range),
    wonLostFunnel(me.organizationId, range),
    agentPerformance(me.organizationId, range),
    followupCompletionByDay(me.organizationId, range),
    propertiesShared(me.organizationId, range),
  ]);

  return (
    <div className="space-y-5">
      <SetPageTitle title="Reports" subtitle={`${preset} range`} />
      <PageHeader
        title="Reports"
        description="Pipeline performance, agent stats, and content effectiveness."
        action={<DateRangeFilter initialPreset={preset} />}
      />

      <Tabs defaultValue="source">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto bg-surface-2 p-1 scrollbar-hide sm:w-auto">
          <TabsTrigger value="source">Source</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="shares">Shares</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="source">
          <ReportCard title="Leads by source" description="Where your pipeline is coming from.">
            <LeadsBySourceChart data={source} />
          </ReportCard>
        </TabsContent>
        <TabsContent value="status">
          <ReportCard title="Leads by status" description="Mix of pipeline stages over the range.">
            <LeadsByStatusChart data={status} />
          </ReportCard>
        </TabsContent>
        <TabsContent value="agents">
          <ReportCard title="Agent performance" description="Volume and conversion per sales agent.">
            <AgentPerformanceTable data={performance} />
          </ReportCard>
        </TabsContent>
        <TabsContent value="followups">
          <ReportCard
            title="Follow-up completion rate"
            description="Percentage of follow-ups marked completed per day."
          >
            <FollowupCompletionChart data={completion} />
          </ReportCard>
        </TabsContent>
        <TabsContent value="shares">
          <ReportCard
            title="Properties shared"
            description="Top properties sent to leads in this range."
          >
            <PropertiesSharedChart data={shared} />
          </ReportCard>
        </TabsContent>
        <TabsContent value="funnel">
          <ReportCard
            title="Won / Lost funnel"
            description="How leads stack across the pipeline stages."
          >
            <WonLostFunnelChart data={funnel} />
          </ReportCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ReportCard({ title, description, children }: ReportCardProps) {
  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
