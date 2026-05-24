import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Home, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { LeadDetailClient } from './lead-detail-client';
import { LeadTimeline } from '@/components/leads/LeadTimeline';
import { CallLog } from '@/components/calls/CallLog';
import { requireSessionUser, listOrgMembers } from '@/lib/db/users';
import { getLeadById } from '@/lib/db/leads';
import { listCallsForLead } from '@/lib/db/calls';
import { listProperties } from '@/lib/db/properties';
import { matchProperties } from '@/lib/services/propertyMatchService';
import {
  LEAD_SOURCE_LABEL,
  PROPERTY_TYPE_LABEL,
} from '@/lib/constants';
import { formatPKR, formatPKRRange } from '@/lib/utils';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireSessionUser();
  const lead = await getLeadById(id);

  if (!lead || lead.organization_id !== me.organizationId) {
    notFound();
  }

  const [members, calls, allProps] = await Promise.all([
    listOrgMembers(me.organizationId),
    listCallsForLead(lead.id),
    listProperties(me.organizationId, { status: 'available', limit: 100 }),
  ]);

  const assignableAgents = members.filter(
    (m) => m.is_active && (m.role === 'sales_agent' || m.role === 'sales_manager'),
  );

  const recommendations = matchProperties(lead, allProps, 3);

  return (
    <div className="space-y-5">
      <SetPageTitle title={lead.full_name} subtitle={lead.phone} />

      <Button variant="ghost" size="sm" asChild className="w-fit text-text-secondary">
        <Link href="/leads">
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
      </Button>

      <LeadDetailClient
        lead={lead}
        agents={assignableAgents}
        myRole={me.role}
        shareableProperties={allProps}
      />

      {/* INFO CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow label="Source" value={LEAD_SOURCE_LABEL[lead.source]} />
          <InfoRow label="Email" value={lead.email ?? '—'} />
          <InfoRow
            label="Property type"
            value={lead.property_type ? PROPERTY_TYPE_LABEL[lead.property_type] : '—'}
          />
          <InfoRow
            label="Preferred location"
            value={lead.preferred_location ?? '—'}
            icon={lead.preferred_location ? <MapPin className="h-3.5 w-3.5 text-text-muted" /> : null}
          />
          <InfoRow label="Budget" value={formatPKRRange(lead.budget_min, lead.budget_max)} mono />
          <InfoRow
            label="External ID"
            value={lead.external_id ?? '—'}
            mono={!!lead.external_id}
          />
          <InfoRow
            label="Created"
            value={new Date(lead.created_at).toLocaleString('en-PK')}
          />
          <InfoRow
            label="Last contacted"
            value={lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString('en-PK') : '—'}
          />
          {lead.notes ? (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Initial notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{lead.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* RECOMMENDED PROPERTIES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended properties</CardTitle>
          <CardDescription>
            Matched against budget (±20%), property type, and preferred location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <EmptyState
              icon={<Home className="h-6 w-6" />}
              title="No matching properties"
              description="Adjust the lead's budget or location, or add more inventory."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/properties/${p.id}`}
                    className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface-1 p-3 transition-colors hover:bg-surface-2"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-text-primary">{p.title}</p>
                    <p className="text-xs text-text-secondary">
                      {p.location}
                      {p.bedrooms ? ` · ${p.bedrooms} BHK` : ''}
                      {p.size_sqft ? ` · ${p.size_sqft} sqft` : ''}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-brand-primary">
                        {formatPKR(p.price)}
                      </span>
                      <Badge variant="muted" className="text-[10px] uppercase">
                        {PROPERTY_TYPE_LABEL[p.property_type]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* CALL HISTORY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call history</CardTitle>
          <CardDescription>
            All bridge calls placed to this lead, including dry-run simulations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CallLog calls={calls} />
        </CardContent>
      </Card>

      {/* TIMELINE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
          <CardDescription>Everything that's happened with this lead, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadTimeline leadId={lead.id} />
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}

function InfoRow({ label, value, icon, mono }: InfoRowProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`flex items-center gap-1.5 text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}
