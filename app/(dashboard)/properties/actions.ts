'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionUser } from '@/lib/db/users';
import {
  addPropertyImage,
  createProperty,
  deleteProperty,
  removePropertyImage,
  setPrimaryImage as setPrimaryImageDb,
  updateProperty,
} from '@/lib/db/properties';
import {
  deletePropertyImageObject,
  uploadPropertyImage,
} from '@/lib/services/storageService';
import {
  propertyCreateSchema,
  propertyUpdateSchema,
  type PropertyCreateInput,
  type PropertyUpdateInput,
} from '@/lib/validations/property.schema';
import { fail, ok, type ActionResult } from '@/lib/types';
import { isManagerial } from '@/lib/constants';
import type {
  FurnishingStatus,
  PropertyInterest,
  PropertyStatus,
} from '@/lib/supabase/types';

export async function createPropertyAction(
  raw: PropertyCreateInput,
): Promise<ActionResult<{ propertyId: string }>> {
  const me = await requireSessionUser();
  const parsed = propertyCreateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const v = parsed.data;
  const property = await createProperty({
    organizationId: me.organizationId,
    createdBy: me.id,
    title: v.title,
    location: v.location,
    address: v.address || null,
    propertyType: v.propertyType as PropertyInterest,
    price: v.price,
    sizeSqft: v.sizeSqft ?? null,
    bedrooms: v.bedrooms ?? null,
    bathrooms: v.bathrooms ?? null,
    floor: v.floor ?? null,
    furnishing: v.furnishing as FurnishingStatus,
    status: v.status as PropertyStatus,
    description: v.description || null,
    amenities: v.amenities && v.amenities.length > 0 ? v.amenities : null,
    developerName: v.developerName || null,
  });
  if (!property) return fail('Could not create property');

  revalidatePath('/properties');
  return ok({ propertyId: property.id });
}

export async function updatePropertyAction(raw: PropertyUpdateInput): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  const parsed = propertyUpdateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const v = parsed.data;

  const patch: Parameters<typeof updateProperty>[1] = {};
  if (v.title !== undefined) patch.title = v.title;
  if (v.location !== undefined) patch.location = v.location;
  if (v.address !== undefined) patch.address = v.address || null;
  if (v.propertyType !== undefined) patch.property_type = v.propertyType as PropertyInterest;
  if (v.price !== undefined) patch.price = v.price;
  if (v.sizeSqft !== undefined) patch.size_sqft = v.sizeSqft ?? null;
  if (v.bedrooms !== undefined) patch.bedrooms = v.bedrooms ?? null;
  if (v.bathrooms !== undefined) patch.bathrooms = v.bathrooms ?? null;
  if (v.floor !== undefined) patch.floor = v.floor ?? null;
  if (v.furnishing !== undefined) patch.furnishing = v.furnishing as FurnishingStatus;
  if (v.status !== undefined) patch.status = v.status as PropertyStatus;
  if (v.description !== undefined) patch.description = v.description || null;
  if (v.amenities !== undefined) patch.amenities = v.amenities && v.amenities.length > 0 ? v.amenities : null;
  if (v.developerName !== undefined) patch.developer_name = v.developerName || null;

  // Suppress unused-warning when only propertyId is supplied
  void me;

  if (Object.keys(patch).length === 0) return ok(true);
  const updated = await updateProperty(v.propertyId, patch);
  if (!updated) return fail('Could not update property');

  revalidatePath('/properties');
  revalidatePath(`/properties/${v.propertyId}`);
  return ok(true);
}

export async function deletePropertyAction(propertyId: string): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  if (!isManagerial(me.role)) return fail('Only managers and admins can delete properties');
  const success = await deleteProperty(propertyId);
  if (!success) return fail('Could not delete property');
  revalidatePath('/properties');
  return ok(true);
}

/**
 * Upload one or more property images. The client posts a FormData with:
 *   - propertyId
 *   - files[] (file inputs)
 *   - setFirstAsPrimary (optional 'true')
 *
 * Server side: upload each file to Supabase Storage and insert a
 * property_images row pointing at the public URL.
 */
export async function uploadPropertyImagesAction(
  formData: FormData,
): Promise<ActionResult<{ uploaded: number }>> {
  const me = await requireSessionUser();
  const propertyId = formData.get('propertyId');
  if (typeof propertyId !== 'string' || !propertyId) {
    return fail('Missing propertyId');
  }

  const files = formData.getAll('files').filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return fail('No files were attached');

  const setFirstAsPrimary = formData.get('setFirstAsPrimary') === 'true';

  let uploaded = 0;
  let firstImageId: string | null = null;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    const stored = await uploadPropertyImage(me.organizationId, propertyId, file);
    if (!stored) continue;
    const row = await addPropertyImage(propertyId, stored.storagePath, stored.publicUrl, {
      isPrimary: setFirstAsPrimary && i === 0,
      displayOrder: i,
    });
    if (row) {
      uploaded += 1;
      if (i === 0) firstImageId = row.id;
    }
  }

  if (uploaded === 0) return fail('All uploads failed — check storage configuration');
  if (setFirstAsPrimary && firstImageId) {
    await setPrimaryImageDb(propertyId, firstImageId);
  }

  revalidatePath('/properties');
  revalidatePath(`/properties/${propertyId}`);
  return ok({ uploaded });
}

export async function removePropertyImageAction(input: {
  imageId: string;
  storagePath: string;
  propertyId: string;
}): Promise<ActionResult<true>> {
  await requireSessionUser();
  await deletePropertyImageObject(input.storagePath);
  const ok1 = await removePropertyImage(input.imageId);
  if (!ok1) return fail('Could not remove image record');
  revalidatePath(`/properties/${input.propertyId}`);
  return ok(true);
}

export async function setPrimaryImageAction(input: {
  propertyId: string;
  imageId: string;
}): Promise<ActionResult<true>> {
  await requireSessionUser();
  const success = await setPrimaryImageDb(input.propertyId, input.imageId);
  if (!success) return fail('Could not set primary image');
  revalidatePath(`/properties/${input.propertyId}`);
  return ok(true);
}
