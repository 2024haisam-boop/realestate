import Link from 'next/link';
import Image from 'next/image';
import { Bed, Bath, Maximize, MapPin, ImageIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatPKR } from '@/lib/utils';
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from '@/lib/constants';
import type { PropertyStatus } from '@/lib/supabase/types';
import type { PropertyWithImages } from '@/lib/db/properties';

interface PropertyCardProps {
  property: PropertyWithImages;
}

const STATUS_TONE: Record<PropertyStatus, 'success' | 'warning' | 'muted' | 'info'> = {
  available: 'success',
  hold: 'warning',
  sold: 'muted',
  rented: 'info',
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-card transition-all duration-200',
          'hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md',
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-3">
          {property.primary_image_url ? (
            <Image
              src={property.primary_image_url}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}

          {/* Gradient sheen overlay for legibility */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge variant={STATUS_TONE[property.status]} className="text-[10px] uppercase">
              {PROPERTY_STATUS_LABEL[property.status]}
            </Badge>
            <Badge variant="muted" className="text-[10px] uppercase">
              {PROPERTY_TYPE_LABEL[property.property_type]}
            </Badge>
          </div>
          {property.image_count > 1 ? (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">
              <ImageIcon className="h-3 w-3" />
              {property.image_count}
            </div>
          ) : null}
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{property.title}</h3>
            <span className="shrink-0 font-mono text-sm font-semibold text-brand-primary">
              {formatPKR(property.price)}
            </span>
          </div>

          <p className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <MapPin className="h-3.5 w-3.5" />
            {property.location}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            {property.bedrooms ? (
              <span className="inline-flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {property.bedrooms} BHK
              </span>
            ) : null}
            {property.bathrooms ? (
              <span className="inline-flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {property.bathrooms} bath
              </span>
            ) : null}
            {property.size_sqft ? (
              <span className="inline-flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                {property.size_sqft} sqft
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-end pt-1">
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View details
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
