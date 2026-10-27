import type { RosterEntry } from '../analytics/settings';
import { dayFromYMD, isoDate } from '../utils/date';

/** A seat whose last activity is fewer days ago than this counts as recently active. */
export const RECENT_DAYS = 30;
/** A seat with no activity for this many days or more is a reclaim candidate. Between RECENT_DAYS and this it is fading. */
export const RECLAIM_DAYS = 90;
/** The license export is called out as old when the usage report runs more than this many days past the export date. */
export const STALE_EXPORT_DAYS = 30;

/**
 * What the license data says about one seat, without looking at the usage report:
 * recent (activity fewer than 30 days before the as-of date), fading (30 to 89 days), stale (90 days or more),
 * no-date (the export has activity data but this seat has no activity date), unknown (the export carries no
 * activity data, so nothing can be said).
 */
export type ActivityStatus = 'recent' | 'fading' | 'stale' | 'no-date' | 'unknown';

export type AsOfSource = 'settings' | 'roster';

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The day number (days since 1970-01-01, UTC) of a YYYY-MM-DD text, or null when it is not a real day. */
export function dayOf(iso: string | undefined): number | null {
  if (typeof iso !== 'string') return null;
  const m = DAY.exec(iso);
  if (!m) return null;
  const day = dayFromYMD(+m[1], +m[2] - 1, +m[3]);
  return isoDate(day) === iso ? day : null;
}

/** The seats of a roster, looked up by login, with the as-of date that days of inactivity are counted from. */
export interface LicenseIndex {
  /** One entry per login (trimmed, lower case). The first entry of a login wins, as in the pool calculation. */
  seats: Map<string, RosterEntry>;
  /** The as-of date: `rosterAsOf` when it is set, else the latest date inside the roster. Null when there is none. */
  asOf: string | null;
  asOfDay: number | null;
  asOfSource: AsOfSource | null;
  /** Some seat carries activity data (an API or Activity report import), so inactivity can be judged. */
  hasActivity: boolean;
}

const bearsActivity = (e: RosterEntry): boolean => e.lastActivityAt !== undefined || e.source === 'api' || e.source === 'activity';

/**
 * Indexes the roster. Returns null when it has no usable entry. The as-of date is `rosterAsOf` when it is a valid
 * day (source "settings"); otherwise the latest activity, sign-in or creation date in the roster (source "roster");
 * without either there is no as-of date and no seat gets an activity status.
 */
export function buildLicenseIndex(roster: readonly RosterEntry[] | undefined, rosterAsOf?: string): LicenseIndex | null {
  if (!roster || roster.length === 0) return null;
  const seats = new Map<string, RosterEntry>();
  let hasActivity = false;
  let latest: number | null = null;
  for (const entry of roster) {
    if (typeof entry?.user !== 'string') continue;
    const key = entry.user.trim().toLowerCase();
    if (key === '' || seats.has(key)) continue;
    seats.set(key, entry);
    if (bearsActivity(entry)) hasActivity = true;
    for (const stamp of [entry.lastActivityAt, entry.lastAuthenticatedAt, entry.createdAt]) {
      const d = dayOf(stamp);
      if (d !== null && (latest === null || d > latest)) latest = d;
    }
  }
  if (seats.size === 0) return null;
  const declared = dayOf(rosterAsOf);
  if (declared !== null && rosterAsOf !== undefined) {
    return { seats, asOf: rosterAsOf, asOfDay: declared, asOfSource: 'settings', hasActivity };
  }
  if (latest !== null) return { seats, asOf: isoDate(latest), asOfDay: latest, asOfSource: 'roster', hasActivity };
  return { seats, asOf: null, asOfDay: null, asOfSource: null, hasActivity };
}

export interface SeatActivity {
  /** Whole days from the last activity to the as-of date, never below 0. Null without an activity date. */
  days: number | null;
  status: ActivityStatus;
}

/** The activity status of one seat. See `ActivityStatus` for the cut-offs. */
export function seatActivity(entry: RosterEntry, index: LicenseIndex): SeatActivity {
  if (index.asOfDay === null) return { days: null, status: 'unknown' };
  const last = dayOf(entry.lastActivityAt);
  if (last !== null) {
    const days = Math.max(0, index.asOfDay - last);
    return { days, status: days < RECENT_DAYS ? 'recent' : days < RECLAIM_DAYS ? 'fading' : 'stale' };
  }
  return { days: null, status: bearsActivity(entry) ? 'no-date' : 'unknown' };
}

/** A seat created fewer than `newUserDays` days before the as-of date (the same window the report uses for new users). */
export function isNewSeat(entry: RosterEntry, index: LicenseIndex, newUserDays: number): boolean {
  const created = dayOf(entry.createdAt);
  return created !== null && index.asOfDay !== null && index.asOfDay - created < newUserDays;
}

/** The license facts of one report user, or of one roster seat. Empty strings stand for "not in the export". */
export interface ProfileLicense {
  /** The user holds a seat in the imported roster. */
  seat: boolean;
  /** Business, Enterprise, a custom plan, or '' when the export does not say. It is an identifier and is never translated here. Translate it where it is shown. */
  plan: string;
  org: string;
  team: string;
  /** The day the seat was created (YYYY-MM-DD), or ''. */
  createdAt: string;
  /** The last activity day (YYYY-MM-DD), or ''. */
  lastActivityAt: string;
  /** Days from the last activity to the as-of date, or null when there is no activity date. */
  daysSinceActivity: number | null;
  lastSurface: string;
  status: ActivityStatus;
  /** The day a scheduled cancellation takes effect (YYYY-MM-DD), or '' when none is scheduled. */
  pendingCancellation: string;
  /** The seat is newer than the new-user window. */
  isNew: boolean;
}

const noSeat = (): ProfileLicense => ({
  seat: false,
  plan: '',
  org: '',
  team: '',
  createdAt: '',
  lastActivityAt: '',
  daysSinceActivity: null,
  lastSurface: '',
  status: 'unknown',
  pendingCancellation: '',
  isNew: false,
});

/** The license facts of a roster entry. */
export function entryLicense(entry: RosterEntry, index: LicenseIndex, newUserDays: number): ProfileLicense {
  const activity = seatActivity(entry, index);
  return {
    seat: true,
    plan: entry.plan ?? '',
    org: entry.org ?? '',
    team: entry.team ?? '',
    createdAt: entry.createdAt ?? '',
    lastActivityAt: entry.lastActivityAt ?? '',
    daysSinceActivity: activity.days,
    lastSurface: entry.lastSurface ?? '',
    status: activity.status,
    pendingCancellation: entry.pendingCancellation ?? '',
    isNew: isNewSeat(entry, index, newUserDays),
  };
}

/** The license facts of a report user, matched by login without regard to case. Users without a seat get `seat: false`. */
export function profileLicense(login: string, index: LicenseIndex, newUserDays: number): ProfileLicense {
  const entry = index.seats.get(login.trim().toLowerCase());
  return entry === undefined ? noSeat() : entryLicense(entry, index, newUserDays);
}
