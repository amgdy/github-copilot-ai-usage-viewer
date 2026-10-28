import { localizeDigits, tp } from '../../i18n/core';

const usdNoDecimals = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdTwoDecimals = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdFourDecimals = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function fmtUSDLatin(amount: number, digits: 0 | 2 | 4 | 'auto' = 'auto'): string {
  if (!Number.isFinite(amount)) return '–';
  if (digits === 0) return usdNoDecimals.format(amount);
  if (digits === 2) return usdTwoDecimals.format(amount);
  if (digits === 4) return usdFourDecimals.format(amount);
  const magnitude = Math.abs(amount);
  if (magnitude >= 10_000) return usdNoDecimals.format(amount);
  if (magnitude >= 1 || magnitude === 0) return usdTwoDecimals.format(amount);
  return usdFourDecimals.format(amount);
}

const UNITS = [
  { size: 1e3, suffix: 'K', digits: 1 },
  { size: 1e6, suffix: 'M', digits: 2 },
  { size: 1e9, suffix: 'B', digits: 2 },
  { size: 1e12, suffix: 'T', digits: 2 },
] as const;

/** A positive amount of at least 1,000 with a unit suffix. The first `unitCount` units are used. A figure that would round up to 1000 moves on to the next unit, so 999,999 reads 1.00M and not 1000.0K. */
function withUnit(amount: number, unitCount: number): string {
  let unitIndex = 0;
  while (unitIndex < unitCount - 1 && amount >= UNITS[unitIndex + 1].size) unitIndex++;
  for (;;) {
    const unit = UNITS[unitIndex];
    const text = (amount / unit.size).toFixed(unit.digits);
    if (+text < 1000 || unitIndex === unitCount - 1) return text + unit.suffix;
    unitIndex++;
  }
}

function fmtUSDCompactLatin(amount: number): string {
  if (!Number.isFinite(amount)) return '–';
  const magnitude = Math.abs(amount);
  if (magnitude === 0) return '$0';
  const sign = amount < 0 ? '-' : '';
  if (magnitude >= 1e4) return `${sign}$${withUnit(magnitude, 3)}`;
  if (magnitude >= 100) return `${sign}$${Math.round(magnitude).toLocaleString('en-US')}`;
  if (magnitude >= 1) return `${sign}$${magnitude.toFixed(2)}`;
  return `${sign}$${magnitude.toFixed(3)}`;
}

function fmtIntLatin(value: number): string {
  return Number.isFinite(value) ? integerFormat.format(value) : '–';
}

function fmtNumLatin(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '–';
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtCompactLatin(value: number): string {
  if (!Number.isFinite(value)) return '–';
  const magnitude = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (magnitude >= 999.5) return `${sign}${withUnit(magnitude, 4)}`;
  return `${sign}${magnitude >= 100 ? Math.round(magnitude) : magnitude.toFixed(magnitude >= 10 ? 1 : 2)}`;
}

function fmtPctLatin(fraction: number, digits = 1): string {
  if (!Number.isFinite(fraction)) return '–';
  return `${(fraction * 100).toFixed(digits)}%`;
}

function fmtPctAutoLatin(fraction: number): string {
  if (!Number.isFinite(fraction)) return '–';
  const percent = fraction * 100;
  if (Math.abs(percent) >= 100) return `${Math.round(percent).toLocaleString('en-US')}%`;
  return `${percent.toFixed(1)}%`;
}

export function fmtDelta(current: number, prev: number): { pct: number; text: string } | null {
  if (!Number.isFinite(current) || !Number.isFinite(prev) || prev === 0) return null;
  const pct = (current - prev) / Math.abs(prev);
  return { pct, text: localizeDigits(`${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(Math.abs(pct) >= 1 ? 0 : 1)}%`) };
}

function fmtMultipleLatin(factor: number): string {
  if (!Number.isFinite(factor)) return '–';
  return `${factor >= 10 ? factor.toFixed(0) : factor.toFixed(1)}×`;
}

// Every number the app shows goes through these, so Arabic can show Arabic-Indic digits. CSV files keep Latin digits.
export const fmtUSD = (amount: number, digits: 0 | 2 | 4 | 'auto' = 'auto'): string => localizeDigits(fmtUSDLatin(amount, digits));
export const fmtUSDCompact = (amount: number): string => localizeDigits(fmtUSDCompactLatin(amount));
export const fmtInt = (value: number): string => localizeDigits(fmtIntLatin(value));
export const fmtNum = (value: number, digits = 1): string => localizeDigits(fmtNumLatin(value, digits));
export const fmtCompact = (value: number): string => localizeDigits(fmtCompactLatin(value));
export const fmtPct = (fraction: number, digits = 1): string => localizeDigits(fmtPctLatin(fraction, digits));
/** Percent with thousands separators for very large values (e.g. 5,012%). */
export const fmtPctAuto = (fraction: number): string => localizeDigits(fmtPctAutoLatin(fraction));
export const fmtMultiple = (factor: number): string => localizeDigits(fmtMultipleLatin(factor));

/** "12 users": the count and the word, in the current language (Arabic picks the right plural form). */
export function pluralize(count: number, one: string, many?: string): string {
  return tp(count, `{n} ${one}`, `{n} ${many ?? `${one}s`}`, { n: fmtInt(count) });
}

const FORMULA_LEAD = /^[=+\-@\t\r]/;
const NUMBER_LIKE = /^[+-]?\$?\d[\d,]*(\.\d+)?(e[+-]?\d+)?%?$/i;

/** Quotes a CSV cell and defuses text that a spreadsheet would run as a formula (a leading = + - @). */
export function csvEscape(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  let text = typeof cell === 'number' ? (Number.isFinite(cell) ? String(cell) : '') : String(cell);
  if (typeof cell !== 'number' && FORMULA_LEAD.test(text) && !NUMBER_LIKE.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  return lines.join('\n');
}
