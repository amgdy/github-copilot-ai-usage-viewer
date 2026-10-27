import { getLocale, msg, t } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD, fmtUSDCompact } from '../../lib/utils/format';

export function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '–';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${units[u]}`;
}

const DELIMITERS: Record<string, string> = { ',': msg('comma'), ';': msg('semicolon'), '\t': msg('tab'), '|': msg('pipe') };

export const delimiterName = (d: string): string => (DELIMITERS[d] ? t(DELIMITERS[d]) : d ? `"${d}"` : '–');

/** "a, b, c and 4 more" */
export function listNames(names: string[], max = 3): string {
  const sep = getLocale() === 'ar' ? '، ' : ', ';
  if (names.length <= max) return names.join(sep);
  return t('{names} and {n} more', { names: names.slice(0, max).join(sep), n: fmtInt(names.length - max) });
}

/** A share as a percentage that never shows a non-zero share as 0.0%. */
export function fmtShare(share: number): string {
  if (!Number.isFinite(share)) return '–';
  return share > 0 && share < 0.001 ? '<0.1%' : fmtPct(share);
}

/** Full dollars up to $10M, compact above, so large totals fit a KPI tile. */
export const fmtMoney = (v: number): string => (Math.abs(v) >= 1e7 ? fmtUSDCompact(v) : fmtUSD(v));
