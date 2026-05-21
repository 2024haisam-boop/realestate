import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { NewPropertyFormClient } from './new-property-form-client';
import { requireSessionUser } from '@/lib/db/users';

export default async function NewPropertyPage() {
  await requireSessionUser();
  return (
    <div className="space-y-5">
      <SetPageTitle title="New property" />
      <PageHeader
        title="New property"
        description="Save the basics now. You can upload photos and tweak details after creating it."
      />
      <Card>
        <CardContent className="pt-5">
          <NewPropertyFormClient />
        </CardContent>
      </Card>
    </div>
  );
}
