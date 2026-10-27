import { getLocale, t } from '../../i18n';
import type { DaySeries, Measures } from '../../lib/analytics/aggregate';
import { makeBucketer } from '../../lib/analytics/series';
import { daysInMonth, dowOf, fmtDay, monthIndexOf, monthLabel, dateParts } from '../../lib/utils/date';
import { fmtInt, fmtPct } from '../../lib/utils/format';

export interface DayRange {
  start: number;
  end: number;
  length: number;
}

/** A weekday name in the current language, from the browser (Monday = 0). 2024-01-01 was a Monday. */
function weekdayText(dayOfWeek: number, width: 'long' | 'short' | 'narrow'): string {
  const locale = getLocale() === 'ar' ? 'ar' : 'en-US';
  return new Intl.DateTimeFormat(locale, { weekday: width, timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + dayOfWeek)));
}

/** "Monday" (Monday = 0). */
export const weekdayName = (dayOfWeek: number): string => weekdayText(dayOfWeek, 'long');

/** "Mon" in English and one letter in Arabic, for tight spots such as calendar day labels. */
export const weekdayShort = (dayOfWeek: number): string => weekdayText(dayOfWeek, getLocale() === 'ar' ? 'narrow' : 'short');

export const isWeekend = (day: number): boolean => dowOf(day) >= 5;

export interface DayStats {
  usageDays: number;
  total: number;
  avgActive: number;
  maxActive: number;
  peakIdx: number;
  peakGross: number;
}

/** A day "has usage" when its usage (the sum of gross_amount) is above zero. */
export function dayStats(days: DaySeries): DayStats {
  let usageDays = 0;
  let total = 0;
  let activeSum = 0;
  let maxActive = 0;
  let peakIdx = -1;
  let peakGross = 0;
  for (let i = 0; i < days.gross.length; i++) {
    const gross = days.gross[i];
    if (!(gross > 0)) continue;
    usageDays++;
    total += gross;
    const activeUsers = days.activeUsers[i];
    activeSum += activeUsers;
    if (activeUsers > maxActive) maxActive = activeUsers;
    if (gross > peakGross) {
      peakGross = gross;
      peakIdx = i;
    }
  }
  return { usageDays, total, avgActive: usageDays > 0 ? activeSum / usageDays : Number.NaN, maxActive, peakIdx, peakGross };
}

export interface WeekdayStat {
  dow: number;
  occurrences: number;
  usageDays: number;
  gross: number;
  perOccurrence: number;
  share: number;
  activeUsers: number;
}

export function weekdayStats(range: DayRange, days: DaySeries, weekdayMeasures: Measures): WeekdayStat[] {
  const occurrences = new Array<number>(7).fill(0);
  const usageDays = new Array<number>(7).fill(0);
  const active = new Array<number>(7).fill(0);
  const dayCount = Math.min(range.length, days.gross.length);
  for (let i = 0; i < dayCount; i++) {
    const dayOfWeek = dowOf(range.start + i);
    occurrences[dayOfWeek]++;
    if (days.gross[i] > 0) usageDays[dayOfWeek]++;
    active[dayOfWeek] += days.activeUsers[i];
  }
  let total = 0;
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) total += weekdayMeasures.gross[dayOfWeek];
  return occurrences.map((occurrenceCount, dayOfWeek) => ({
    dow: dayOfWeek,
    occurrences: occurrenceCount,
    usageDays: usageDays[dayOfWeek],
    gross: weekdayMeasures.gross[dayOfWeek],
    perOccurrence: occurrenceCount > 0 ? weekdayMeasures.gross[dayOfWeek] / occurrenceCount : Number.NaN,
    share: total > 0 ? weekdayMeasures.gross[dayOfWeek] / total : 0,
    activeUsers: occurrenceCount > 0 ? active[dayOfWeek] / occurrenceCount : Number.NaN,
  }));
}

/** The weekday with the highest usage per occurrence, among weekdays that occur and have usage. */
export function busiestWeekday(stats: WeekdayStat[]): WeekdayStat | null {
  let best: WeekdayStat | null = null;
  for (const stat of stats) {
    if (stat.occurrences === 0 || !(stat.gross > 0)) continue;
    if (best === null || stat.perOccurrence > best.perOccurrence) best = stat;
  }
  return best;
}

export const MIN_WEEKDAY_DAYS = 14;
const FLAT_BAND = 0.05;

export function weekdayInsight(stats: WeekdayStat[], rangeLength: number, weekdayFilterOn: boolean): string {
  if (weekdayFilterOn) return t('A weekday filter is on, so only the selected weekdays have usage to compare.');
  if (rangeLength < MIN_WEEKDAY_DAYS) {
    return t('Too little history to compare weekdays. It needs at least {need} days, and this range has {days}.', {
      need: fmtInt(MIN_WEEKDAY_DAYS),
      days: fmtInt(rangeLength),
    });
  }
  const work = stats.slice(0, 5).filter((stat) => stat.occurrences > 0);
  let gross = 0;
  let occurrences = 0;
  for (const stat of work) {
    gross += stat.gross;
    occurrences += stat.occurrences;
  }
  if (work.length === 0 || !(gross > 0)) return t('There is no usage from Monday to Friday in this range.');
  const average = gross / occurrences;
  let low = work[0];
  let high = work[0];
  for (const stat of work) {
    if (stat.perOccurrence < low.perOccurrence) low = stat;
    if (stat.perOccurrence > high.perOccurrence) high = stat;
  }
  const lowDiff = low.perOccurrence / average - 1;
  const highDiff = high.perOccurrence / average - 1;
  const pct = (diff: number) => fmtPct(Math.abs(diff), 0);
  const hasLow = lowDiff <= -FLAT_BAND;
  const hasHigh = highDiff >= FLAT_BAND;
  if (hasLow && hasHigh) {
    return t('{low} usage runs {lowPct} below the Monday to Friday average, and {high} usage runs {highPct} above it.', {
      low: weekdayName(low.dow),
      lowPct: pct(lowDiff),
      high: weekdayName(high.dow),
      highPct: pct(highDiff),
    });
  }
  if (hasLow) return t('{weekday} usage runs {pct} below the Monday to Friday average.', { weekday: weekdayName(low.dow), pct: pct(lowDiff) });
  if (hasHigh) return t('{weekday} usage runs {pct} above the Monday to Friday average.', { weekday: weekdayName(high.dow), pct: pct(highDiff) });
  return t('Usage is spread evenly from Monday to Friday. No weekday is more than {pct} away from the average.', { pct: fmtPct(FLAT_BAND, 0) });
}

export type Granularity = 'day' | 'week';

export interface DailyBuckets {
  granularity: Granularity;
  count: number;
  startDay: number[];
  endDay: number[];
  span: number[];
  labels: string[];
  gross: number[];
  avgActive: number[];
  average: (number | null)[];
  partial: boolean[];
  indexOfDay: (day: number) => number;
}

/** Days beyond which the daily chart opens on weeks and, in day view, on the latest stretch only. */
export const LONG_RANGE_DAYS = 400;
export const LATEST_DAYS = 120;

/**
 * Usage per day or per Monday to Sunday week. The line is a trailing average (7 days, or 4 weeks scaled by the days
 * each week covers, so a partial first or last week does not pull it down).
 */
export function dailyBuckets(range: DayRange, days: DaySeries, granularity: Granularity): DailyBuckets {
  const bucketer = makeBucketer(range.start, range.end, granularity);
  const bucketCount = bucketer.count;
  const gross = new Array<number>(bucketCount).fill(0);
  const span = new Array<number>(bucketCount).fill(0);
  const usageDays = new Array<number>(bucketCount).fill(0);
  const activeSum = new Array<number>(bucketCount).fill(0);
  const dayCount = Math.min(range.length, days.gross.length);
  for (let i = 0; i < dayCount; i++) {
    const bucketIndex = bucketer.indexOf(range.start + i);
    span[bucketIndex]++;
    const dayGross = days.gross[i];
    gross[bucketIndex] += dayGross;
    if (dayGross > 0) {
      usageDays[bucketIndex]++;
      activeSum[bucketIndex] += days.activeUsers[i];
    }
  }
  const startDay: number[] = [];
  const endDay: number[] = [];
  for (let k = 0; k < bucketCount; k++) {
    startDay.push(bucketer.start(k));
    endDay.push(k + 1 < bucketCount ? bucketer.start(k + 1) - 1 : range.end);
  }
  const withYear = dateParts(range.start).y !== dateParts(range.end).y;
  const window = granularity === 'day' ? 7 : 4;
  const unit = granularity === 'day' ? 1 : 7;
  const average: (number | null)[] = [];
  let sumGross = 0;
  let sumSpan = 0;
  for (let k = 0; k < bucketCount; k++) {
    sumGross += gross[k];
    sumSpan += span[k];
    if (k >= window) {
      sumGross -= gross[k - window];
      sumSpan -= span[k - window];
    }
    average.push(k >= window - 1 && sumSpan > 0 ? (unit * sumGross) / sumSpan : null);
  }
  return {
    granularity,
    count: bucketCount,
    startDay,
    endDay,
    span,
    labels: startDay.map((day) => fmtDay(day, withYear)),
    gross,
    avgActive: activeSum.map((activeTotal, bucketIndex) => (usageDays[bucketIndex] > 0 ? activeTotal / usageDays[bucketIndex] : 0)),
    average,
    partial: span.map((coveredDays) => granularity === 'week' && coveredDays < 7),
    indexOfDay: (day) => bucketer.indexOf(day),
  };
}

export interface ZoomSpec {
  slider: boolean;
  from: number;
  to: number;
  narrowed: boolean;
}

export function zoomSpec(granularity: Granularity, count: number, rangeLength: number): ZoomSpec {
  const last = Math.max(0, count - 1);
  if (granularity === 'day' && rangeLength > LONG_RANGE_DAYS) {
    return { slider: true, from: Math.max(0, count - LATEST_DAYS), to: last, narrowed: true };
  }
  return { slider: count > 28, from: 0, to: last, narrowed: false };
}

export interface MonthRow {
  monthIdx: number;
  label: string;
  coveredDays: number;
  monthDays: number;
  partial: boolean;
  usage: number;
  usageDays: number;
  perUsageDay: number;
  avgActive: number;
  newUsers: number;
  activeUsers: number;
}

export interface MonthInput {
  range: DayRange;
  days: DaySeries;
  /** nU x nMonths gross per user and month, as in `Aggregates.userMonthGross`. */
  userMonthGross: Float64Array;
  nMonths: number;
  firstMonth: number;
  /** First day seen in the data of every user that counts as new in the range. */
  newFirstDays: ArrayLike<number>;
}

export function monthRows({ range, days, userMonthGross, nMonths, firstMonth, newFirstDays }: MonthInput): MonthRow[] {
  const startMonth = monthIndexOf(range.start);
  const endMonth = monthIndexOf(range.end);
  const rows: MonthRow[] = [];
  for (let month = startMonth; month <= endMonth; month++) {
    rows.push({
      monthIdx: month,
      label: monthLabel(month),
      coveredDays: 0,
      monthDays: daysInMonth(month),
      partial: false,
      usage: 0,
      usageDays: 0,
      perUsageDay: Number.NaN,
      avgActive: Number.NaN,
      newUsers: 0,
      activeUsers: 0,
    });
  }
  const activeSum = new Array<number>(rows.length).fill(0);
  const dayCount = Math.min(range.length, days.gross.length);
  for (let i = 0; i < dayCount; i++) {
    const rowIndex = monthIndexOf(range.start + i) - startMonth;
    const row = rows[rowIndex];
    row.coveredDays++;
    const gross = days.gross[i];
    if (gross > 0) {
      row.usage += gross;
      row.usageDays++;
      activeSum[rowIndex] += days.activeUsers[i];
    }
  }
  for (let i = 0; i < newFirstDays.length; i++) {
    const rowIndex = monthIndexOf(newFirstDays[i]) - startMonth;
    if (rowIndex >= 0 && rowIndex < rows.length) rows[rowIndex].newUsers++;
  }
  const userCount = nMonths > 0 ? Math.floor(userMonthGross.length / nMonths) : 0;
  for (let userId = 1; userId < userCount; userId++) {
    const base = userId * nMonths;
    for (const row of rows) {
      const slot = row.monthIdx - firstMonth;
      if (slot >= 0 && slot < nMonths && userMonthGross[base + slot] > 0) row.activeUsers++;
    }
  }
  rows.forEach((row, rowIndex) => {
    row.partial = row.coveredDays < row.monthDays;
    row.perUsageDay = row.usageDays > 0 ? row.usage / row.usageDays : Number.NaN;
    row.avgActive = row.usageDays > 0 ? activeSum[rowIndex] / row.usageDays : Number.NaN;
  });
  return rows;
}
