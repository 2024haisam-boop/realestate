'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionUser } from '@/lib/db/users';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/db/notifications';
import { ok, type ActionResult } from '@/lib/types';

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  await markNotificationRead(notificationId, me.id);
  revalidatePath('/notifications');
  return ok(true);
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<true>> {
  const me = await requireSessionUser();
  await markAllNotificationsRead(me.id);
  revalidatePath('/notifications');
  return ok(true);
}
