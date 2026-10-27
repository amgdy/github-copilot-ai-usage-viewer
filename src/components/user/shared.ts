import { t } from '../../i18n';
import type { TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtCompact, fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';

/** Included credits are known only for users whose seat size appears in the file. */
export const hasQuota = (p: UserProfile): boolean => p.quotaCredits > 0;

export const quotaKnown = (profiles: readonly UserProfile[]): boolean => profiles.some(hasQuota);

/** Token counts: whole numbers below 1,000 and a unit (K, M, B, T) above. */
export const fmtCount = (v: number): string => (Math.abs(v) >= 1000 ? fmtCompact(v) : fmtInt(v));

/** "+$12.00" or "−$3.50" (with the real minus sign). An en dash when the value is not a number. */
export function signedUsd(v: number, digits: 0 | 2 = 2): string {
  if (!Number.isFinite(v)) return '–';
  if (Math.abs(v) < 0.005) return fmtUSD(0, digits);
  return `${v > 0 ? '+' : '−'}${fmtUSD(Math.abs(v), digits)}`;
}

/** Whole dollars for big amounts, cents for small ones. */
export const money = (v: number): string => fmtUSD(v, Math.abs(v) >= 100 ? 0 : 2);

/** "Engineering and others" when the user appears under more than one value. */
export const withOthers = (value: string, mixed: boolean): string => (value && mixed ? t('{value} and others', { value }) : value);

/** "Engineering · CC-100 · Business". Blank parts are left out. */
export function userSubtitle(p: UserProfile): string {
  const plan = hasQuota(p) ? p.plan : '';
  return [withOthers(p.org, p.orgMixed), withOthers(p.costCenter, p.costCenterMixed), plan].filter(Boolean).join(' · ');
}

/** Middle value, ignoring numbers that are not finite. NaN when nothing is left. */
export function median(values: readonly number[]): number {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return Number.NaN;
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/**
 * One sentence on how much of an Auto discount is measured from token counts. `scope` says whose Auto usage:
 * everyone in the view ('all') or one user ('user').
 */
export function autoBasisNote(measuredShare: number, scope: 'all' | 'user'): string {
  if (measuredShare >= 0.995) return t('Measured: the original price comes from the token counts and the price card.');
  const share = fmtPct(measuredShare, 0);
  if (scope === 'user') {
    if (measuredShare <= 0.005) return t('An estimate: the Auto usage of this user has no token counts, so the original price uses the discount rate of the plan.');
    return t('{share} of the Auto usage of this user is measured from token counts. For the rest, the discount is an estimate based on the discount rate of the plan.', { share });
  }
  if (measuredShare <= 0.005) return t('An estimate: the Auto usage has no token counts, so the original price uses the discount rate of the plan.');
  return t('{share} of the Auto usage is measured from token counts. For the rest, the discount is an estimate based on the discount rate of the plan.', { share });
}

/** "Minimal (<10%)" becomes "Minimal", for chips and narrow table cells. */
export const shortLabel = (label: string): string => label.replace(/\s*\(.*\)$/, '');

export function shortItem<T extends string>(item: TaxonomyItem<T> | undefined): TaxonomyItem<T> | undefined {
  return item ? { ...item, label: shortLabel(item.label) } : undefined;
}
