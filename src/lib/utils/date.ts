import { getLocale, localizeDigits, subscribeLocale } from '../../i18n/core.ts';

const MS_DAY = 86_400_000;

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const AR_WEEKDAYS = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

// Kept as live arrays: their contents switch with the language, so code that indexes them always gets the current names.
const MONTHS = [...EN_MONTHS];
const WEEKDAYS = [...EN_WEEKDAYS];
subscribeLocale(() => {
  const isArabic = getLocale() === 'ar';
  MONTHS.splice(0, 12, ...(isArabic ? AR_MONTHS : EN_MONTHS));
  WEEKDAYS.splice(0, 7, ...(isArabic ? AR_WEEKDAYS : EN_WEEKDAYS));
});

export const WEEKDAY_NAMES = WEEKDAYS;
export const MONTH_NAMES = MONTHS;

/** Average month length, used to convert a period's totals into per-month figures. */
export const DAYS_PER_MONTH = 30.4375;

export function dayFromYMD(year: number, zeroBasedMonth: number, dayOfMonth: number): number {
  return Math.floor(Date.UTC(year, zeroBasedMonth, dayOfMonth) / MS_DAY);
}

export function dayToDate(day: number): Date {
  return new Date(day * MS_DAY);
}

export function dateParts(day: number): { y: number; m0: number; d: number } {
  const date = dayToDate(day);
  return { y: date.getUTCFullYear(), m0: date.getUTCMonth(), d: date.getUTCDate() };
}

export function isoDate(day: number): string {
  const { y: year, m0: zeroBasedMonth, d: dayOfMonth } = dateParts(day);
  return `${year}-${String(zeroBasedMonth + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
}

export function parseIsoDay(text: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) return NaN;
  return dayFromYMD(+match[1], +match[2] - 1, +match[3]);
}

/** Monday = 0 … Sunday = 6. 1970-01-01 was a Thursday. */
export function dowOf(day: number): number {
  return (((day + 3) % 7) + 7) % 7;
}

export function monthIndexOf(day: number): number {
  const { y: year, m0: zeroBasedMonth } = dateParts(day);
  return year * 12 + zeroBasedMonth;
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
  const year = Math.floor(monthIdx / 12);
  const month = (monthIdx % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function monthLabel(monthIdx: number): string {
  return localizeDigits(`${MONTHS[monthIdx % 12]} ${Math.floor(monthIdx / 12)}`);
}

export function fmtDay(day: number, withYear = false): string {
  const { y: year, m0: zeroBasedMonth, d: dayOfMonth } = dateParts(day);
  if (getLocale() === 'ar') return localizeDigits(withYear ? `${dayOfMonth} ${MONTHS[zeroBasedMonth]} ${year}` : `${dayOfMonth} ${MONTHS[zeroBasedMonth]}`);
  return withYear ? `${MONTHS[zeroBasedMonth]} ${dayOfMonth}, ${year}` : `${MONTHS[zeroBasedMonth]} ${dayOfMonth}`;
}

/** Number of Mon–Fri days within [a, b] inclusive. */
export function workdaysBetween(a: number, b: number): number {
  if (b < a) return 0;
  const total = b - a + 1;
  const full = Math.floor(total / 7);
  let count = full * 5;
  const extraDays = total - full * 7;
  const start = dowOf(a + full * 7);
  for (let i = 0; i < extraDays; i++) {
    if ((start + i) % 7 < 5) count++;
  }
  return count;
}
