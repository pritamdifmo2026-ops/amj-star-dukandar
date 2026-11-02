/**
 * Formatting helpers shared by the Partner Hub views.
 *
 * Kept out of `partner.ui.tsx` so that file only exports components — Vite's fast refresh
 * stops working for a module that mixes components with other exports.
 */

/** Short, readable date for table cells. */
export function shortDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Date plus time, for audit-style rows. */
export function dateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString(
    'en-IN',
    { hour: '2-digit', minute: '2-digit' }
  )}`;
}

/** Turns an id-or-populated-ref into a display name. */
export function refName(ref: unknown, fallback = '—'): string {
  if (!ref) return fallback;
  if (typeof ref === 'string') return fallback;
  const obj = ref as { name?: string; businessName?: string; fullName?: string };
  return obj.name || obj.businessName || obj.fullName || fallback;
}

/** Turns an id-or-populated-ref into its id. */
export function refId(ref: unknown): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return ref;
  return (ref as { _id?: string })._id;
}

/** Humanises the snake_case statuses the API returns. */
export function humanise(value?: string): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Today + `days`, as the yyyy-mm-dd a date input expects. */
export function isoDateIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Format currency without trailing .00 for whole numbers to prevent metric card overflow,
 * while preserving decimals when paise exist (e.g. ₹646.50).
 */
export function formatPartnerMoney(amount: number): string {
  const safe = Number(amount) || 0;
  const hasDecimals = safe % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(safe);
}

