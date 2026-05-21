import type { LeadRow, PropertyRow } from '@/lib/supabase/types';

/**
 * Match available properties against a lead's preferences.
 *
 * Budget:    property.price within ±20% of [lead.budget_min, lead.budget_max]
 * Type:      property.property_type === lead.property_type (skipped when null)
 * Location:  case-insensitive partial match either way (skipped when null)
 *
 * Returns the top N matches.
 */
export function matchProperties(
  lead: Pick<LeadRow, 'budget_min' | 'budget_max' | 'property_type' | 'preferred_location'>,
  properties: PropertyRow[],
  limit = 3,
): PropertyRow[] {
  const min = lead.budget_min != null ? lead.budget_min * 0.8 : 0;
  const max = lead.budget_max != null ? lead.budget_max * 1.2 : Number.POSITIVE_INFINITY;
  const desiredLocation = lead.preferred_location?.toLowerCase().trim();

  return properties
    .filter((p) => p.status === 'available')
    .filter((p) => p.price >= min && p.price <= max)
    .filter((p) => !lead.property_type || p.property_type === lead.property_type)
    .filter((p) => {
      if (!desiredLocation) return true;
      const here = p.location.toLowerCase();
      return here.includes(desiredLocation) || desiredLocation.includes(here);
    })
    .slice(0, limit);
}
