import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a Pakistani Rupee amount (stored as bigint rupees) for display.
 * Pakistan uses the Lakh / Crore numbering system, identical in scale to
 * India's, but with the "Rs" prefix instead of "₹".
 *
 * 10000000 -> "Rs 1.00 Cr"   100000 -> "Rs 1.00 Lakh"   1000 -> "Rs 1.0K"
 */
export function formatPKR(amount: number): string {
  if (amount >= 10000000) return `Rs ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(2)} Lakh`;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}K`;
  return `Rs ${amount.toLocaleString('en-PK')}`;
}

export function formatPKRRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `${formatPKR(min)} – ${formatPKR(max)}`;
  if (min != null) return `${formatPKR(min)}+`;
  return `up to ${formatPKR(max!)}`;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/**
 * Validate E.164 phone format. Permissive enough for Pakistani +92 numbers
 * while rejecting obvious garbage.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

/**
 * Render a relative time like "2h ago", "3d ago". Caller is expected to wrap
 * with date-fns formatDistanceToNow for more precise UI labels.
 */
export function shortRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-IN');
}
