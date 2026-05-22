import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  CalendarClock,
  ExternalLink,
  Layers,
  MapPin,
  Maximize,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { PropertyImageUploader } from '@/components/properties/PropertyImageUploader';
import { PropertyShareSheet } from '@/components/properties/PropertyShareSheet';
import { DeletePropertyButton } from './delete-property-button';
import { requireSessionUser } from '@/lib/db/users';
import { getPropertyById } from '@/lib/db/properties';
import { listLeads } from '@/lib/db/leads';
import {
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  isManagerial,
} from '@/lib/constants';
import { formatPKR } from '@/lib/utils';
import type { PropertyStatus } from '@/lib/supabase/types';

const STATUS_TONE: Record<PropertyStatus, 'success' | 'warning' | 'muted' | 'info'> = {
  available: 'success',
  hold: 'warning',
  sold: 'muted',
  rented: 'info',
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireSessionUser();
  const property = await getPropertyById(id);
  if (!property || property.organization_id !== me.organizationId) notFound();

  const [leads] = await Promise.all([
    listLeads({
      organizationId: me.organizationId,
      currentUserId: me.id,
      filters: { assignedAgentId: isManagerial(me.role) ? 'all' : 'mine' },
      limit: 200,
    }),
  ]);
  const leadOptions = leads.map((l) => ({ id: l.id, full_name: l.full_name, phone: l.phone }));
  const publicShareUrl = `/property/${property.share_token}`;

  return (
    <div className="space-y-5">
      <SetPageTitle title={property.title} subtitle={property.location} />

      <Button variant="ghost" size="sm" asChild className="w-fit text-text-secondary">
        <Link href="/properties">
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
      </Button>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-text-primary">{property.title}</h2>
            <p className="inline-flex items-center gap-1 text-sm text-text-secondary">
              <MapPin className="h-3.5 w-3.5" />
              {property.location}
              {property.address ? ` · ${property.address}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-lg font-semibold text-brand-primary">
              {formatPKR(property.price)}
            </p>
            {property.size_sqft ? (
              <p className="font-mono text-[11px] text-text-muted">
                ₹{Math.round(property.price / property.size_sqft).toLocaleString('en-IN')}/sqft
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_TONE[property.status]}>{PROPERTY_STATUS_LABEL[property.status]}</Badge>
          <Badge variant="muted">{PROPERTY_TYPE_LABEL[property.property_type]}</Badge>
          {property.developer_name ? (
            <Badge variant="outline">{property.developer_name}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <PropertyShareSheet
            propertyId={property.id}
            propertyTitle={property.title}
            leads={leadOptions}
          />
          <Button variant="outline" size="sm" asChild>
            <a href={publicShareUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open public page
            </a>
          </Button>
          {isManagerial(me.role) ? <DeletePropertyButton propertyId={property.id} /> : null}
        </div>
      </div>

      <PropertyGallery images={property.images} title={property.title} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage photos</CardTitle>
          <CardDescription>Upload, reorder, pick a primary photo, or remove.</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyImageUploader propertyId={property.id} images={property.images} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {property.bedrooms ? (
            <InfoRow icon={<Bed className="h-3.5 w-3.5" />} label="Bedrooms" value={`${property.bedrooms}`} />
          ) : null}
          {property.bathrooms ? (
            <InfoRow icon={<Bath className="h-3.5 w-3.5" />} label="Bathrooms" value={`${property.bathrooms}`} />
          ) : null}
          {property.size_sqft ? (
            <InfoRow icon={<Maximize className="h-3.5 w-3.5" />} label="Carpet area" value={`${property.size_sqft} sqft`} />
          ) : null}
          {property.floor != null ? (
            <InfoRow icon={<Layers className="h-3.5 w-3.5" />} label="Floor" value={`${property.floor}`} />
          ) : null}
          <InfoRow
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Furnishing"
            value={property.furnishing.replace('_', ' ')}
          />
          <InfoRow
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            label="Listed"
            value={new Date(property.created_at).toLocaleDateString('en-IN')}
          />
        </CardContent>
      </Card>

      {property.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About this property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-text-secondary">{property.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {property.amenities && property.amenities.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.map((a) => (
                <Badge key={a} variant="muted">
                  {a}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public share link</CardTitle>
          <CardDescription>Anyone with this link can view the property — no sign-in needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <code className="block break-all rounded-md bg-surface-2 px-3 py-2 font-mono text-xs">
            {process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
            {publicShareUrl}
          </code>
          <Separator />
          <p className="text-xs text-text-muted">
            Use the &quot;Share with lead&quot; button at the top to send this link via WhatsApp or SMS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {icon}
        {label}
      </p>
      <p className="text-sm text-text-primary capitalize">{value}</p>
    </div>
  );
}
