import { Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { PostCard } from '@/components/social/PostCard';
import { ContentCalendar } from '@/components/social/ContentCalendar';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireSessionUser } from '@/lib/db/users';
import { listSocialPosts } from '@/lib/db/social';

export default async function SocialPage() {
  const me = await requireSessionUser();
  const posts = await listSocialPosts({ organizationId: me.organizationId, limit: 200 });

  return (
    <div className="space-y-4">
      <SetPageTitle
        title="Social Media"
        subtitle={`${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}
      />
      <PageHeader
        title="Social Media"
        description="Plan, draft, and schedule your content."
        action={
          <Button asChild>
            <Link href="/social/new">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="grid">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto bg-surface-2 p-1 scrollbar-hide sm:w-auto">
          <TabsTrigger value="grid">All posts</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {posts.length === 0 ? (
            <Card className="mt-3">
              <CardContent className="pt-5">
                <EmptyState
                  icon={<Share2 className="h-6 w-6" />}
                  title="No posts yet"
                  description="Capture an idea or draft your first post."
                  action={
                    <Button asChild>
                      <Link href="/social/new">
                        <Plus className="h-4 w-4" />
                        New post
                      </Link>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="mt-3">
            <CardContent className="pt-5">
              <ContentCalendar posts={posts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
