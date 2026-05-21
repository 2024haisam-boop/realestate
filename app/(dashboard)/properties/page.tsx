import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyFilters } from './property-filters';
import { requireSessionUser } from '@/lib/db/users';
import { listProperties } from '@/lib/db/properties';
import type { PropertyInterest, PropertyStatus } from '@/lib/supabase/types';

type SearchParamValue = string | string[] | undefined;

function read(sp: Record<string, SearchParamValue>, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const me = await requireSessionUser();
  const sp = await searchParams;

  const filters = {
    status: (read(sp, 'status') as PropertyStatus | 'all' | undefined) ?? 'all',
    propertyType: (read(sp, 'type') as PropertyInterest | 'all' | undefined) ?? 'all',
    location: read(sp, 'location') ?? '',
  };

  const properties = await listProperties(me.organizationId, filters);

  return (
    <div className="space-y-4">
      <SetPageTitle
        title="Properties"
        subtitle={`${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
      />

      <PageHeader
        title="Properties"
        description="Your inventory of homes, plots, and commercial spaces."
        action={
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="h-4 w-4" />
              New property
            </Link>
          </Button>
        }
      />

      <PropertyFilters />

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No properties yet"
          description="Add your first property to start sharing it with leads."
          action={
            <Button asChild>
              <Link href="/properties/new">
                <Plus className="h-4 w-4" />
                Add property
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <li key={p.id}>
              <PropertyCard property={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
