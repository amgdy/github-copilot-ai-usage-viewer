import { dayFromYMD, isoDate } from '../utils/date';

const EMPTY = new Set(['', 'null', 'none', 'never', 'n/a', 'na', '-', '--', 'undefined']);
// A date, optionally followed by a time and a UTC offset: 2025-03-05, 2025-03-05T23:30:00-06:00, 2025-03-05 10:30:00 UTC.
const STAMP = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:$|[T\s]+(?:(\d{1,2}):(\d{2})(?::\d{2}(?:[.,]\d+)?)?)?\s*(z|utc|gmt|[+-]\d{1,2}(?::?\d{2})?)?)/i;
const OFFSET = /^([+-])(\d{1,2})(?::?(\d{2}))?$/;
const MIN_YEAR = 2008;
const MAX_YEAR = 2100;
const DAY_MINUTES = 1440;

/** Minutes the time of day moves when it is converted to UTC. Zero for a time without an offset or one that cannot be read. */
function utcShiftMinutes(hours: string | undefined, minutes: string | undefined, zone: string | undefined): number {
  if (hours === undefined || minutes === undefined || zone === undefined) return 0;
  const hour = +hours;
  const min = +minutes;
  if (hour > 23 || min > 59) return 0;
  const offsetMatch = OFFSET.exec(zone);
  const offset = offsetMatch === null ? 0 : (offsetMatch[1] === '-' ? -1 : 1) * (+offsetMatch[2] * 60 + +(offsetMatch[3] ?? 0));
  if (Math.abs(offset) > DAY_MINUTES) return 0;
  return hour * 60 + min - offset;
}

/**
 * Reads a date from an export as a UTC calendar day. A date alone is taken as written. A timestamp with a UTC offset
 * is converted, so 2025-03-05T23:30:00-06:00 is the day 2025-03-06. A time without an offset counts as UTC.
 * Returns undefined when the value is empty ("", null, "never", "N/A"), null when it is there but cannot be read.
 */
export function readDay(raw: unknown): string | null | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw !== 'string') return null;
  const text = raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
  if (EMPTY.has(text.toLowerCase())) return undefined;
  const match = STAMP.exec(text);
  if (!match) return null;
  const year = +match[1];
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  const day = dayFromYMD(year, +match[2] - 1, +match[3]);
  if (isoDate(day) !== `${match[1]}-${match[2]}-${match[3]}`) return null;
  return isoDate(day + Math.floor(utcShiftMinutes(match[4], match[5], match[6]?.toLowerCase()) / DAY_MINUTES));
}

/** The later of two days (YYYY-MM-DD compares as text). */
export function laterDay(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a >= b ? a : b;
}

/** The earlier of two days. */
export function earlierDay(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a <= b ? a : b;
}

/** The current UTC calendar day. */
export function todayIso(now: number = Date.now()): string {
  return isoDate(Math.floor(now / 86_400_000));
}
