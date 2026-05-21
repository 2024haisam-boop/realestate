import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Bed, Bath, Maximize, Layers, MapPin, MessageCircle, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { getPublicPropertyByToken } from '@/lib/db/properties';
import { createServiceClient } from '@/lib/supabase/server';
import { formatINR } from '@/lib/utils';
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from '@/lib/constants';
import type { PropertyStatus } from '@/lib/supabase/types';
import type { Metadata } from 'next';

const STATUS_TONE: Record<PropertyStatus, 'success' | 'warning' | 'muted' | 'info'> = {
  available: 'success',
  hold: 'warning',
  sold: 'muted',
  rented: 'info',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}): Promise<Metadata> {
  const { shareToken } = await params;
  const property = await getPublicPropertyByToken(shareToken);
  if (!property) return { title: 'Property not found · EstateFlow' };
  return {
    title: `${property.title} · ${property.location}`,
    description: property.description ?? `${property.title} in ${property.location}.`,
  };
}

export default async function PublicPropertyPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const property = await getPublicPropertyByToken(shareToken);
  if (!property) notFound();

  // Fetch org + integration settings for branding + WhatsApp CTA, via service role.
  const admin = createServiceClient();
  const [{ data: org }, { data: settings }] = await Promise.all([
    admin
      .from('organizations')
      .select('name, logo_url')
      .eq('id', property.organization_id)
      .maybeSingle(),
    admin
      .from('integration_settings')
      .select('twilio_whatsapp_number, twilio_phone_number')
      .eq('organization_id', property.organization_id)
      .maybeSingle(),
  ]);

  // Build the WhatsApp deep-link if the org has a number configured.
  const whatsAppNumber =
    settings?.twilio_whatsapp_number?.replace(/^whatsapp:/, '').replace(/[^\d+]/g, '') ?? '';
  const visitMessage = encodeURIComponent(
    `Hi, I'm interested in ${property.title} (${property.location}). Could we schedule a visit?`,
  );
  const whatsAppCTA = whatsAppNumber
    ? `https://wa.me/${whatsAppNumber.replace(/^\+/, '')}?text=${visitMessage}`
    : null;

  return (
    <div className="min-h-dvh bg-surface-2">
      <header className="border-b border-border bg-surface-1">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 md:max-w-5xl md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-primary">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{org?.name ?? 'EstateFlow'}</span>
          </Link>
          {whatsAppCTA ? (
            <Button asChild size="sm">
              <a href={whatsAppCTA} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                Schedule a Visit
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5 md:max-w-5xl md:px-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_TONE[property.status]}>{PROPERTY_STATUS_LABEL[property.status]}</Badge>
            <Badge variant="muted">{PROPERTY_TYPE_LABEL[property.property_type]}</Badge>
            {property.developer_name ? <Badge variant="outline">{property.developer_name}</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{property.title}</h1>
          <p className="inline-flex items-center gap-1 text-sm text-text-secondary">
            <MapPin className="h-4 w-4" />
            {property.location}
            {property.address ? ` · ${property.address}` : ''}
          </p>
          <p className="font-mono text-2xl font-semibold text-brand-primary">
            {formatINR(property.price)}
          </p>
        </div>

        <PropertyGallery images={property.images} title={property.title} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick facts</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.bedrooms ? <Quick icon={<Bed className="h-4 w-4" />} label="Bedrooms" value={`${property.bedrooms}`} /> : null}
            {property.bathrooms ? <Quick icon={<Bath className="h-4 w-4" />} label="Bathrooms" value={`${property.bathrooms}`} /> : null}
            {property.size_sqft ? <Quick icon={<Maximize className="h-4 w-4" />} label="Carpet area" value={`${property.size_sqft} sqft`} /> : null}
            {property.floor != null ? <Quick icon={<Layers className="h-4 w-4" />} label="Floor" value={`${property.floor}`} /> : null}
            <Quick icon={<Building2 className="h-4 w-4" />} label="Furnishing" value={property.furnishing.replace('_', ' ')} />
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

        {whatsAppCTA ? (
          <div className="sticky bottom-4 z-10 mx-auto w-full">
            <Button asChild size="lg" className="w-full">
              <a href={whatsAppCTA} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" />
                Schedule a Visit on WhatsApp
              </a>
            </Button>
          </div>
        ) : null}

        <footer className="pt-4 text-center text-xs text-text-muted">
          Listed by {org?.name ?? 'an EstateFlow workspace'}
        </footer>
      </main>
    </div>
  );
}

interface QuickProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function Quick({ icon, label, value }: QuickProps) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium capitalize text-text-primary">{value}</p>
    </div>
  );
}
