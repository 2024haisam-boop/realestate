import { createServiceClient } from '@/lib/supabase/server';

export const PROPERTY_IMAGES_BUCKET = 'property-images';

/**
 * Make sure the property-images bucket exists and is publicly readable.
 * Called on first upload so users don't have to configure Supabase Storage
 * by hand.
 */
export async function ensurePropertyImagesBucket(): Promise<void> {
  const admin = createServiceClient();
  const { data: existing } = await admin.storage.getBucket(PROPERTY_IMAGES_BUCKET);
  if (existing) return;
  await admin.storage.createBucket(PROPERTY_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });
}

export interface UploadedImage {
  storagePath: string;
  publicUrl: string;
}

/**
 * Upload a single file into the property-images bucket under
 *   {organizationId}/{propertyId}/{timestamp-filename}
 * Uses the service-role client so this works from a server action even
 * before any RLS storage policies are written.
 */
export async function uploadPropertyImage(
  organizationId: string,
  propertyId: string,
  file: File,
): Promise<UploadedImage | null> {
  await ensurePropertyImagesBucket();
  const admin = createServiceClient();

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .slice(0, 60);
  const path = `${organizationId}/${propertyId}/${Date.now()}-${safeName || `upload.${ext}`}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(PROPERTY_IMAGES_BUCKET).upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    console.error('[storageService] upload failed', error);
    return null;
  }

  const { data: publicUrl } = admin.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);
  return { storagePath: path, publicUrl: publicUrl.publicUrl };
}

export async function deletePropertyImageObject(storagePath: string): Promise<boolean> {
  const admin = createServiceClient();
  const { error } = await admin.storage.from(PROPERTY_IMAGES_BUCKET).remove([storagePath]);
  if (error) console.error('[storageService] delete failed', error);
  return !error;
}
