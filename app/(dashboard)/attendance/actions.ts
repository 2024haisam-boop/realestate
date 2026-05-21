'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionUser } from '@/lib/db/users';
import {
  getTodayAttendance,
  updateCheckOut,
  upsertCheckIn,
} from '@/lib/db/attendance';
import { createActivity } from '@/lib/db/activities';
import {
  classifyCheckIn,
  todayISO,
} from '@/lib/services/attendanceService';
import {
  ensurePropertyImagesBucket,
} from '@/lib/services/storageService';
import { createServiceClient } from '@/lib/supabase/server';
import {
  checkInSchema,
  checkOutSchema,
  type CheckInInput,
  type CheckOutInput,
} from '@/lib/validations/attendance.schema';
import { fail, ok, type ActionResult } from '@/lib/types';

const SELFIE_BUCKET = 'attendance-selfies';

async function uploadSelfie(userId: string, dataUrl: string): Promise<string | null> {
  // Reuse the helper to make sure storage is configured.
  await ensurePropertyImagesBucket(); // ensures storage feature is bootstrapped
  const admin = createServiceClient();

  // dataUrl format: "data:image/jpeg;base64,...."
  const match = /^data:(image\/[^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, b64] = match;
  if (!mime || !b64) return null;

  // Make sure the dedicated bucket exists (idempotent).
  const { data: existing } = await admin.storage.getBucket(SELFIE_BUCKET);
  if (!existing) {
    await admin.storage.createBucket(SELFIE_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
  }

  const buffer = Buffer.from(b64, 'base64');
  const ext = mime.split('/')[1] ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await admin.storage.from(SELFIE_BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error('[uploadSelfie]', error);
    return null;
  }
  const { data } = admin.storage.from(SELFIE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function checkInAction(raw: CheckInInput): Promise<ActionResult<{ status: string }>> {
  const me = await requireSessionUser();
  const parsed = checkInSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const today = todayISO();
  const existing = await getTodayAttendance(me.id, today);
  if (existing?.check_in_time) {
    return fail('You have already checked in today');
  }

  let selfieUrl: string | null = null;
  if (parsed.data.selfieDataUrl) {
    selfieUrl = await uploadSelfie(me.id, parsed.data.selfieDataUrl);
  }

  const status = classifyCheckIn();
  const row = await upsertCheckIn({
    organizationId: me.organizationId,
    userId: me.id,
    date: today,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    selfieUrl,
    status,
  });
  if (!row) return fail('Could not save check-in');

  await createActivity({
    organizationId: me.organizationId,
    userId: me.id,
    leadId: null,
    type: 'checkin',
    title: `Checked in (${status})`,
    description: `lat ${parsed.data.lat.toFixed(4)}, lng ${parsed.data.lng.toFixed(4)}`,
    metadata: { status, lat: parsed.data.lat, lng: parsed.data.lng },
  });

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  return ok({ status });
}

export async function checkOutAction(raw: CheckOutInput): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  const parsed = checkOutSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const today = todayISO();
  const existing = await getTodayAttendance(me.id, today);
  if (!existing || !existing.check_in_time) {
    return fail('You need to check in before checking out');
  }
  if (existing.check_out_time) {
    return fail('You have already checked out today');
  }

  const row = await updateCheckOut({
    userId: me.id,
    date: today,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
  });
  if (!row) return fail('Could not save check-out');

  await createActivity({
    organizationId: me.organizationId,
    userId: me.id,
    leadId: null,
    type: 'checkout',
    title: 'Checked out',
    description: `lat ${parsed.data.lat.toFixed(4)}, lng ${parsed.data.lng.toFixed(4)}`,
    metadata: { lat: parsed.data.lat, lng: parsed.data.lng },
  });

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  return ok(true);
}
