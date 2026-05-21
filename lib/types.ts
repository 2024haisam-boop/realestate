/**
 * App-wide TypeScript types that are not tied to the DB shape.
 * DB rows live in lib/supabase/types.ts.
 */

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { success: false, error };
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: import('./supabase/types').AppRole;
  avatarUrl: string | null;
  isActive: boolean;
  isAvailable: boolean;
}
