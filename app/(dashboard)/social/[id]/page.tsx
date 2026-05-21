import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { EditPostClient } from './edit-post-client';
import { requireSessionUser, listOrgMembers } from '@/lib/db/users';
import { getSocialPostById } from '@/lib/db/social';
import { POST_PLATFORM_LABEL } from '@/lib/constants';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireSessionUser();
  const post = await getSocialPostById(id);
  if (!post || post.organization_id !== me.organizationId) notFound();

  const members = await listOrgMembers(me.organizationId);
  const assignable = members.filter(
    (m) => m.is_active && (m.role === 'social_media_manager' || m.role === 'admin' || m.role === 'sales_manager'),
  );

  return (
    <div className="space-y-5">
      <SetPageTitle title="Edit post" subtitle={POST_PLATFORM_LABEL[post.platform]} />
      <Button variant="ghost" size="sm" asChild className="w-fit text-text-secondary">
        <Link href="/social">
          <ArrowLeft className="h-4 w-4" />
          Back to social
        </Link>
      </Button>

      <PageHeader title={POST_PLATFORM_LABEL[post.platform]} description={`Status: ${post.status}`} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit post</CardTitle>
          <CardDescription>Tweak the post details, then save.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditPostClient post={post} members={assignable} />
        </CardContent>
      </Card>
    </div>
  );
}
