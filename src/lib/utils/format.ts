import { tp } from '../../i18n/core';

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd4 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function fmtUSD(v: number, digits: 0 | 2 | 4 | 'auto' = 'auto'): string {
  if (!Number.isFinite(v)) return '–';
  if (digits === 0) return usd0.format(v);
  if (digits === 2) return usd2.format(v);
  if (digits === 4) return usd4.format(v);
  const a = Math.abs(v);
  if (a >= 10_000) return usd0.format(v);
  if (a >= 1 || a === 0) return usd2.format(v);
  return usd4.format(v);
}

const UNITS = [
  { size: 1e3, suffix: 'K', digits: 1 },
  { size: 1e6, suffix: 'M', digits: 2 },
  { size: 1e9, suffix: 'B', digits: 2 },
  { size: 1e12, suffix: 'T', digits: 2 },
] as const;

/** A positive amount of at least 1,000 with a unit suffix. The first `unitCount` units are used. A figure that would round up to 1000 moves on to the next unit, so 999,999 reads 1.00M and not 1000.0K. */
function withUnit(a: number, unitCount: number): string {
  let i = 0;
  while (i < unitCount - 1 && a >= UNITS[i + 1].size) i++;
  for (;;) {
    const u = UNITS[i];
    const text = (a / u.size).toFixed(u.digits);
    if (+text < 1000 || i === unitCount - 1) return text + u.suffix;
    i++;
  }
}

export function fmtUSDCompact(v: number): string {
  if (!Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  if (a === 0) return '$0';
  const sign = v < 0 ? '-' : '';
  if (a >= 1e4) return `${sign}$${withUnit(a, 3)}`;
  if (a >= 100) return `${sign}$${Math.round(a).toLocaleString('en-US')}`;
  if (a >= 1) return `${sign}$${a.toFixed(2)}`;
  return `${sign}$${a.toFixed(3)}`;
}

export function fmtInt(v: number): string {
  return Number.isFinite(v) ? int.format(v) : '–';
}

export function fmtNum(v: number, digits = 1): string {
  if (!Number.isFinite(v)) return '–';
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtCompact(v: number): string {
  if (!Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a >= 999.5) return `${sign}${withUnit(a, 4)}`;
  return `${sign}${a >= 100 ? Math.round(a) : a.toFixed(a >= 10 ? 1 : 2)}`;
}

export function fmtPct(v: number, digits = 1): string {
  if (!Number.isFinite(v)) return '–';
  return `${(v * 100).toFixed(digits)}%`;
}

/** Percent with thousands separators for very large values (e.g. 5,012%). */
export function fmtPctAuto(v: number): string {
  if (!Number.isFinite(v)) return '–';
  const p = v * 100;
  if (Math.abs(p) >= 100) return `${Math.round(p).toLocaleString('en-US')}%`;
  return `${p.toFixed(1)}%`;
}

export function fmtDelta(cur: number, prev: number): { pct: number; text: string } | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return null;
  const pct = (cur - prev) / Math.abs(prev);
  return { pct, text: `${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(Math.abs(pct) >= 1 ? 0 : 1)}%` };
}

export function fmtMultiple(v: number): string {
  if (!Number.isFinite(v)) return '–';
  return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}×`;
}

/** "12 users": the count and the word, in the current language (Arabic picks the right plural form). */
export function pluralize(n: number, one: string, many?: string): string {
  return tp(n, `{n} ${one}`, `{n} ${many ?? `${one}s`}`, { n: fmtInt(n) });
}

const FORMULA_LEAD = /^[=+\-@\t\r]/;
const NUMBER_LIKE = /^[+-]?\$?\d[\d,]*(\.\d+)?(e[+-]?\d+)?%?$/i;

/** Quotes a CSV cell and defuses text that a spreadsheet would run as a formula (a leading = + - @). */
export function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '') : String(v);
  if (typeof v !== 'number' && FORMULA_LEAD.test(s) && !NUMBER_LIKE.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(r.map(csvEscape).join(','));
  return lines.join('\n');
}
