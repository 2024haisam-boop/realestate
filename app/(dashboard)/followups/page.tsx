import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { FollowUpCard } from '@/components/followups/FollowUpCard';
import { requireSessionUser } from '@/lib/db/users';
import { listFollowups, type FollowupWithLead } from '@/lib/db/followups';
import { isManagerial } from '@/lib/constants';

export default async function FollowupsPage() {
  const me = await requireSessionUser();
  const scope = isManagerial(me.role) ? 'all' : 'mine';

  const [due, upcoming, completed, missed] = await Promise.all([
    listFollowups({ organizationId: me.organizationId, currentUserId: me.id, scope, bucket: 'due', limit: 100 }),
    listFollowups({ organizationId: me.organizationId, currentUserId: me.id, scope, bucket: 'upcoming', limit: 100 }),
    listFollowups({ organizationId: me.organizationId, currentUserId: me.id, scope, bucket: 'completed', limit: 50 }),
    listFollowups({ organizationId: me.organizationId, currentUserId: me.id, scope, bucket: 'missed', limit: 50 }),
  ]);

  return (
    <div className="space-y-4">
      <SetPageTitle
        title="Follow-ups"
        subtitle={due.length > 0 ? `${due.length} due now` : 'all clear'}
      />

      <PageHeader
        title="Follow-ups"
        description={
          isManagerial(me.role)
            ? 'All follow-ups across your team.'
            : 'Touchpoints scheduled for your leads.'
        }
      />

      <Tabs defaultValue="due">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto bg-surface-2 p-1 scrollbar-hide sm:w-auto">
          <TabsTrigger value="due">Due ({due.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="missed">Missed ({missed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="due">
          <FollowupList items={due} emptyTitle="All clear for now" emptyDescription="Nothing is due. Schedule a follow-up from any lead." />
        </TabsContent>
        <TabsContent value="upcoming">
          <FollowupList items={upcoming} emptyTitle="No upcoming follow-ups" emptyDescription="Plan one from a lead detail page." />
        </TabsContent>
        <TabsContent value="completed">
          <FollowupList items={completed} emptyTitle="No completed follow-ups yet" emptyDescription="Mark a touchpoint done and it'll show up here." />
        </TabsContent>
        <TabsContent value="missed">
          <FollowupList items={missed} emptyTitle="No missed follow-ups" emptyDescription="When a pending touchpoint is marked missed, it lives here." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FollowupListProps {
  items: FollowupWithLead[];
  emptyTitle: string;
  emptyDescription: string;
}

function FollowupList({ items, emptyTitle, emptyDescription }: FollowupListProps) {
  if (items.length === 0) {
    return (
      <Card className="mt-3">
        <CardContent className="pt-5">
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <ul className="space-y-3 pt-3">
      {items.map((f) => (
        <li key={f.id}>
          <FollowUpCard followup={f} />
        </li>
      ))}
    </ul>
  );
}
