import { getLocale, msg, t } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD, fmtUSDCompact } from '../../lib/utils/format';

export function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '–';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[unitIndex]}`;
}

const DELIMITERS: Record<string, string> = { ',': msg('comma'), ';': msg('semicolon'), '\t': msg('tab'), '|': msg('pipe') };

export const delimiterName = (delimiter: string): string => (DELIMITERS[delimiter] ? t(DELIMITERS[delimiter]) : delimiter ? `"${delimiter}"` : '–');

/** "a, b, c and 4 more" */
export function listNames(names: string[], max = 3): string {
  const separator = getLocale() === 'ar' ? '، ' : ', ';
  if (names.length <= max) return names.join(separator);
  return t('{names} and {n} more', { names: names.slice(0, max).join(separator), n: fmtInt(names.length - max) });
}

/** A share as a percentage that never shows a non-zero share as 0.0%. */
export function fmtShare(share: number): string {
  if (!Number.isFinite(share)) return '–';
  return share > 0 && share < 0.001 ? '<0.1%' : fmtPct(share);
}

/** Full dollars up to $10M, compact above, so large totals fit a KPI tile. */
export const fmtMoney = (amount: number): string => (Math.abs(amount) >= 1e7 ? fmtUSDCompact(amount) : fmtUSD(amount));
