import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { LeadList } from '@/components/leads/LeadList';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { requireSessionUser, listOrgMembers } from '@/lib/db/users';
import { listLeads, type LeadListFilters } from '@/lib/db/leads';
import { isManagerial } from '@/lib/constants';
import type {
  LeadSource,
  LeadStatus,
  LeadTemperature,
} from '@/lib/supabase/types';

type SearchParamValue = string | string[] | undefined;

function read(sp: Record<string, SearchParamValue>, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const me = await requireSessionUser();
  const sp = await searchParams;
  const canManage = isManagerial(me.role);

  const members = canManage ? await listOrgMembers(me.organizationId) : [];
  const agents = members.filter((m) => m.role === 'sales_agent' && m.is_active);

  const filters: LeadListFilters = {
    status: (read(sp, 'status') as LeadStatus | undefined) ?? 'all',
    temperature: (read(sp, 'temperature') as LeadTemperature | undefined) ?? 'all',
    source: (read(sp, 'source') as LeadSource | undefined) ?? 'all',
    assignedAgentId: (read(sp, 'agent') as never) ?? (canManage ? 'all' : 'mine'),
    isHot: read(sp, 'hot') === '1',
    search: read(sp, 'q') ?? '',
  };

  const leads = await listLeads({
    organizationId: me.organizationId,
    currentUserId: me.id,
    filters,
    limit: 200,
  });

  return (
    <div className="space-y-4">
      <SetPageTitle
        title="Leads"
        subtitle={`${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
      />

      <PageHeader
        title="Leads"
        description={canManage ? 'All leads in your organization.' : 'Leads assigned to you.'}
        action={
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="h-4 w-4" />
              New lead
            </Link>
          </Button>
        }
      />

      <LeadFilters agents={agents} canFilterByAgent={canManage} />

      <LeadList leads={leads} />
    </div>
  );
}
