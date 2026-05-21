import { LATE_THRESHOLD_HOUR, LATE_THRESHOLD_MINUTE } from '@/lib/constants';
import type { AttendanceStatus } from '@/lib/supabase/types';

/**
 * Compute attendance status from a check-in time.
 * Before 9:30 AM (configurable) → present.
 * After  9:30 AM → late.
 *
 * Uses the local server time in India by default; if you deploy to Vercel,
 * set TZ=Asia/Kolkata on the project for correct rounding.
 */
export function classifyCheckIn(date: Date = new Date()): AttendanceStatus {
  const h = date.getHours();
  const m = date.getMinutes();
  const minutesSinceMidnight = h * 60 + m;
  const threshold = LATE_THRESHOLD_HOUR * 60 + LATE_THRESHOLD_MINUTE;
  return minutesSinceMidnight <= threshold ? 'present' : 'late';
}

/** ISO yyyy-MM-dd, local. */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Haversine distance in meters — useful for "outside the office?" checks. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
