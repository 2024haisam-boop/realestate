import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { NewLeadFormClient } from './new-lead-form-client';
import { requireSessionUser, listOrgMembers } from '@/lib/db/users';

export default async function NewLeadPage() {
  const me = await requireSessionUser();
  const members = await listOrgMembers(me.organizationId);
  const agents = members.filter(
    (m) => m.is_active && (m.role === 'sales_agent' || m.role === 'sales_manager' || m.role === 'admin'),
  );

  return (
    <div className="space-y-5">
      <SetPageTitle title="New lead" />
      <PageHeader
        title="New lead"
        description="Capture an inbound enquiry or walk-in. Webhook intake auto-assigns; manual entries can be assigned here."
      />
      <Card>
        <CardContent className="pt-5">
          <NewLeadFormClient agents={agents} />
        </CardContent>
      </Card>
    </div>
  );
}
