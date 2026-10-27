import { getLocale, subscribeLocale } from '../../i18n/core.ts';

const MS_DAY = 86_400_000;

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const AR_DOW = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

// Kept as live arrays: their contents switch with the language, so code that indexes them always gets the current names.
const MONTHS = [...EN_MONTHS];
const DOW = [...EN_DOW];
subscribeLocale(() => {
  const ar = getLocale() === 'ar';
  MONTHS.splice(0, 12, ...(ar ? AR_MONTHS : EN_MONTHS));
  DOW.splice(0, 7, ...(ar ? AR_DOW : EN_DOW));
});

export const DOW_NAMES = DOW;
export const MONTH_NAMES = MONTHS;

/** Average month length, used to convert a period's totals into per-month figures. */
export const DAYS_PER_MONTH = 30.4375;

export function dayFromYMD(y: number, m0: number, d: number): number {
  return Math.floor(Date.UTC(y, m0, d) / MS_DAY);
}

export function dayToDate(day: number): Date {
  return new Date(day * MS_DAY);
}

export function ymd(day: number): { y: number; m0: number; d: number } {
  const dt = dayToDate(day);
  return { y: dt.getUTCFullYear(), m0: dt.getUTCMonth(), d: dt.getUTCDate() };
}

export function isoDate(day: number): string {
  const { y, m0, d } = ymd(day);
  return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseIsoDay(s: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return NaN;
  return dayFromYMD(+m[1], +m[2] - 1, +m[3]);
}

/** Monday = 0 … Sunday = 6. 1970-01-01 was a Thursday. */
export function dowOf(day: number): number {
  return (((day + 3) % 7) + 7) % 7;
}

export function monthIndexOf(day: number): number {
  const { y, m0 } = ymd(day);
  return y * 12 + m0;
}

export function monthStartDay(monthIdx: number): number {
  return dayFromYMD(Math.floor(monthIdx / 12), monthIdx % 12, 1);
}

export function monthEndDay(monthIdx: number): number {
  return monthStartDay(monthIdx + 1) - 1;
}

export function daysInMonth(monthIdx: number): number {
  return monthEndDay(monthIdx) - monthStartDay(monthIdx) + 1;
}

export function monthKey(monthIdx: number): string {
  const y = Math.floor(monthIdx / 12);
  const m = (monthIdx % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function monthLabel(monthIdx: number): string {
  return `${MONTHS[monthIdx % 12]} ${Math.floor(monthIdx / 12)}`;
}

export function fmtDay(day: number, withYear = false): string {
  const { y, m0, d } = ymd(day);
  if (getLocale() === 'ar') return withYear ? `${d} ${MONTHS[m0]} ${y}` : `${d} ${MONTHS[m0]}`;
  return withYear ? `${MONTHS[m0]} ${d}, ${y}` : `${MONTHS[m0]} ${d}`;
}

/** Number of Mon–Fri days within [a, b] inclusive. */
export function workdaysBetween(a: number, b: number): number {
  if (b < a) return 0;
  const total = b - a + 1;
  const full = Math.floor(total / 7);
  let count = full * 5;
  const rem = total - full * 7;
  const start = dowOf(a + full * 7);
  for (let i = 0; i < rem; i++) {
    if ((start + i) % 7 < 5) count++;
  }
  return count;
}
