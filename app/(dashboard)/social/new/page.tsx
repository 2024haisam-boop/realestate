import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { NewPostFormClient } from './new-post-form-client';
import { requireSessionUser, listOrgMembers } from '@/lib/db/users';

export default async function NewPostPage() {
  const me = await requireSessionUser();
  const members = await listOrgMembers(me.organizationId);
  const assignableMembers = members.filter(
    (m) => m.is_active && (m.role === 'social_media_manager' || m.role === 'admin' || m.role === 'sales_manager'),
  );

  return (
    <div className="space-y-5">
      <SetPageTitle title="New post" />
      <PageHeader
        title="New post"
        description="Sketch out an idea, draft a caption, or schedule it for publishing."
      />
      <Card>
        <CardContent className="pt-5">
          <NewPostFormClient members={assignableMembers} />
        </CardContent>
      </Card>
    </div>
  );
}
