import { createClient, createServiceClient } from '@/lib/supabase/server';
import type {
  FurnishingStatus,
  PropertyImageRow,
  PropertyInterest,
  PropertyRow,
  PropertyStatus,
} from '@/lib/supabase/types';

export interface PropertyWithImages extends PropertyRow {
  primary_image_url: string | null;
  image_count: number;
}

export interface PropertyDetail extends PropertyRow {
  images: PropertyImageRow[];
}

interface ListOptions {
  status?: PropertyStatus | 'all';
  propertyType?: PropertyInterest | 'all';
  location?: string;
  limit?: number;
}

export async function listProperties(
  organizationId: string,
  opts: ListOptions = {},
): Promise<PropertyWithImages[]> {
  const supabase = await createClient();
  let query = supabase
    .from('properties')
    .select(
      'id, organization_id, title, location, address, property_type, price, size_sqft, bedrooms, bathrooms, floor, furnishing, status, description, amenities, developer_name, share_token, created_by, created_at, updated_at, property_images(public_url, is_primary, display_order)',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);
  if (opts.propertyType && opts.propertyType !== 'all') query = query.eq('property_type', opts.propertyType);
  if (opts.location && opts.location.trim()) query = query.ilike('location', `%${opts.location.trim()}%`);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const images = (row.property_images ?? []) as Array<{
      public_url: string;
      is_primary: boolean;
      display_order: number;
    }>;
    const primary =
      images.find((img) => img.is_primary) ??
      [...images].sort((a, b) => a.display_order - b.display_order)[0];
    return {
      ...row,
      property_images: undefined,
      primary_image_url: primary?.public_url ?? null,
      image_count: images.length,
    } as unknown as PropertyWithImages;
  });
}

export async function getPropertyById(propertyId: string): Promise<PropertyDetail | null> {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle();
  if (!property) return null;

  const { data: images } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('display_order', { ascending: true });

  return { ...property, images: images ?? [] };
}

/**
 * Public-access fetch — used by the share page (no auth).
 * Uses the service-role client to bypass RLS; the share_token is the credential.
 */
export async function getPublicPropertyByToken(shareToken: string): Promise<PropertyDetail | null> {
  const admin = createServiceClient();
  const { data: property } = await admin
    .from('properties')
    .select('*')
    .eq('share_token', shareToken)
    .maybeSingle();
  if (!property) return null;

  const { data: images } = await admin
    .from('property_images')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order', { ascending: true });

  return { ...property, images: images ?? [] };
}

interface CreatePropertyInput {
  organizationId: string;
  createdBy: string;
  title: string;
  location: string;
  address?: string | null;
  propertyType: PropertyInterest;
  price: number;
  sizeSqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  furnishing?: FurnishingStatus;
  status?: PropertyStatus;
  description?: string | null;
  amenities?: string[] | null;
  developerName?: string | null;
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .insert({
      organization_id: input.organizationId,
      created_by: input.createdBy,
      title: input.title,
      location: input.location,
      address: input.address ?? null,
      property_type: input.propertyType,
      price: input.price,
      size_sqft: input.sizeSqft ?? null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      floor: input.floor ?? null,
      furnishing: input.furnishing ?? 'unfurnished',
      status: input.status ?? 'available',
      description: input.description ?? null,
      amenities: input.amenities ?? null,
      developer_name: input.developerName ?? null,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[properties.createProperty]', error);
    return null;
  }
  return data;
}

export async function updateProperty(
  propertyId: string,
  patch: Partial<{
    title: string;
    location: string;
    address: string | null;
    property_type: PropertyInterest;
    price: number;
    size_sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    floor: number | null;
    furnishing: FurnishingStatus;
    status: PropertyStatus;
    description: string | null;
    amenities: string[] | null;
    developer_name: string | null;
  }>,
): Promise<PropertyRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .update(patch)
    .eq('id', propertyId)
    .select('*')
    .single();
  if (error) {
    console.error('[properties.updateProperty]', error);
    return null;
  }
  return data;
}

export async function deleteProperty(propertyId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('properties').delete().eq('id', propertyId);
  return !error;
}

export async function addPropertyImage(
  propertyId: string,
  storagePath: string,
  publicUrl: string,
  opts: { isPrimary?: boolean; displayOrder?: number } = {},
): Promise<PropertyImageRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('property_images')
    .insert({
      property_id: propertyId,
      storage_path: storagePath,
      public_url: publicUrl,
      is_primary: opts.isPrimary ?? false,
      display_order: opts.displayOrder ?? 0,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[properties.addPropertyImage]', error);
    return null;
  }
  return data;
}

export async function removePropertyImage(imageId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('property_images').delete().eq('id', imageId);
  return !error;
}

export async function setPrimaryImage(propertyId: string, imageId: string): Promise<boolean> {
  const supabase = await createClient();
  await supabase
    .from('property_images')
    .update({ is_primary: false })
    .eq('property_id', propertyId)
    .eq('is_primary', true);
  const { error } = await supabase
    .from('property_images')
    .update({ is_primary: true })
    .eq('id', imageId);
  return !error;
}

export async function listPropertyImages(propertyId: string): Promise<PropertyImageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('display_order', { ascending: true });
  return data ?? [];
}
