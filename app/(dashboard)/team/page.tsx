import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { listOrgMembers, requireSessionUser } from '@/lib/db/users';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { TeamList } from './team-list';
import { InviteMemberButton } from './invite-member-button';

export default async function TeamPage() {
  const me = await requireSessionUser();
  if (!['admin', 'sales_manager'].includes(me.role)) {
    redirect('/dashboard');
  }

  const members = await listOrgMembers(me.organizationId);
  const isAdmin = me.role === 'admin';

  return (
    <div className="space-y-5">
      <SetPageTitle title="Team" subtitle={`${members.length} member${members.length === 1 ? '' : 's'}`} />
      <PageHeader
        title="Team"
        description="Manage who has access to this workspace."
        action={isAdmin ? <InviteMemberButton /> : null}
      />

      {members.length === 0 ? (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No team members yet"
              description="Invite your first colleague to start collaborating."
            />
          </CardContent>
        </Card>
      ) : (
        <TeamList members={members} currentUserId={me.id} canManage={isAdmin} />
      )}
    </div>
  );
}
