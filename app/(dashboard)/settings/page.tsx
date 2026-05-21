import { redirect } from 'next/navigation';
import { requireSessionUser } from '@/lib/db/users';
import { getIntegrationSettings, upsertIntegrationSettings } from '@/lib/db/integration-settings';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { IntegrationSettingsForm } from './integration-settings-form';

export default async function SettingsPage() {
  const me = await requireSessionUser();
  if (me.role !== 'admin') redirect('/dashboard');

  let settings = await getIntegrationSettings(me.organizationId);
  if (!settings) {
    settings = await upsertIntegrationSettings(me.organizationId, {
      dry_run_mode: true,
      lead_assignment_mode: 'round_robin',
    });
    if (!settings) redirect('/dashboard');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhooks/leads`;

  return (
    <div className="space-y-5">
      <SetPageTitle title="Settings" subtitle="integrations" />
      <PageHeader
        eyebrow="Workspace"
        title="Integrations"
        description="Twilio, OpenAI, Zapier — everything that talks to the outside world. Saved per-organization."
      />

      <IntegrationSettingsForm settings={settings} webhookUrl={webhookUrl} />
    </div>
  );
}
