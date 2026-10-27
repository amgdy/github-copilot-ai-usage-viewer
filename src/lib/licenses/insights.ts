import { seatCredits, seatPrice, planCredits, PLAN_CREDITS, type RosterEntry, type Settings } from '../analytics/settings';
import type { Prepared } from '../analytics/prepare';
import type { UserProfile, UserSet } from '../analytics/users';
import type { DataStore } from '../types';
import {
  RECENT_DAYS,
  RECLAIM_DAYS,
  buildLicenseIndex,
  isNewSeat,
  seatActivity,
  type ActivityStatus,
  type AsOfSource,
  type LicenseIndex,
} from './activity';

/** Why a seat is on the reclaim list. */
export type ReclaimReason =
  /** The last activity is 90 days or more before the as-of date. */
  | 'stale';

/** One seat on one of the lists of the license report. */
export interface LicenseFinding {
  /** The login as written in the export. */
  login: string;
  name: string;
  /** Business, Enterprise, a custom plan, or '' when the export does not say. It is an identifier and is never translated here. Translate it where it is shown. */
  plan: string;
  org: string;
  team: string;
  /** Days from the last activity to the as-of date. Null when the export has no activity date for the seat. */
  daysSinceActivity: number | null;
  lastActivityAt: string;
  lastSurface: string;
  createdAt: string;
  /** The day a scheduled cancellation takes effect, or ''. */
  pendingCancellation: string;
  /** Usage in the analysis range (the sum of gross amounts, USD). 0 when the user is not in the report. */
  usage: number;
  /** The user has rows in the report for the analysis range. */
  inReport: boolean;
  /** Monthly seat price (USD): the plan of the seat, else the seat size in the report, else the most common seat size. */
  seatPrice: number;
  /** Set on the reclaim list only. */
  reason?: ReclaimReason;
}

/** A user in the report who has no seat in the imported roster. */
export interface UnmatchedUser {
  name: string;
  org: string;
  /** The plan label of the report for this user (from the monthly quota). It is an identifier, so translate it where it is shown. */
  plan: string;
  /** Usage in the analysis range (USD). */
  usage: number;
}

export interface LicenseReport {
  /** The date days of inactivity are counted from (YYYY-MM-DD). Null when the roster carries no date at all. */
  asOf: string | null;
  /** 'settings': the stored export date. 'roster': the latest date found inside the roster. */
  asOfSource: AsOfSource | null;
  /** How many days the last day of the loaded report is after the as-of date. A value above STALE_EXPORT_DAYS means the export is old. */
  asOfBehindReport: number | null;
  /** Some seat carries activity data. When false, the activity lists are empty. */
  hasActivity: boolean;
  /**
   * A row filter (organization, cost center, model and so on) is active, so the report users cover the filtered rows only.
   * Matched, unmatched, usage and the quiet list then describe that part of the report; seats, plans, statuses and the reclaim,
   * fading, no-date, pending and new lists do not change.
   */
  scoped: boolean;
  /** Seats on the roster, one per login. */
  seats: number;
  /** Seats by plan. `other` is a custom plan or no plan. */
  byPlan: { Business: number; Enterprise: number; other: number };
  /** What the seats cost per month at the seat prices (USD). */
  seatCost: number;
  /** Distinct users in the report for the analysis range (row filters applied, segment filters not). */
  reportUsers: number;
  /** Report users who hold a seat on the roster. */
  matched: number;
  /** Roster seats whose user appears in no row of any loaded file. */
  neverSeen: number;
  /** Roster seats whose user appears in the loaded files but not in the current scope (analysis range and row filters). */
  seenOutsideScope: number;
  /** matched ÷ reportUsers. Null when the report has no users. */
  coverage: number | null;
  /** Usage of the matched users in the analysis range (USD). */
  matchedUsage: number;
  /** Report users with no seat on the roster, biggest usage first. */
  unmatched: UnmatchedUser[];
  unmatchedUsage: number;
  /** Every seat by what the license data says about its activity. The values add up to `seats`. */
  byStatus: Record<ActivityStatus, number>;
  /** Seats with a dated last activity at least 90 days ago. Not pending or new, with no newer usage in any loaded file. */
  reclaim: LicenseFinding[];
  /** Monthly seat price of the reclaim list (USD). It overlaps the idle and unused seat savings, so do not add them. */
  reclaimValue: number;
  /** Activity 30 to 89 days ago. Not pending, and no usage in any loaded file fewer than 30 days before the as-of date. */
  fading: LicenseFinding[];
  /** Seats whose activity source has no last activity date. A blank date is not proof of no use. */
  noActivityDate: LicenseFinding[];
  /** Active in the last 30 days but no usage in the report. Code completions are not in the report, so these are not idle. */
  quiet: LicenseFinding[];
  /** Seats with a scheduled cancellation. They appear on no other list but the new seats. */
  pending: LicenseFinding[];
  /** Seats created within the new-user window. */
  newSeats: LicenseFinding[];
}

interface ReportUser {
  profile: UserProfile;
  /** Usage of every spelling of the login (the logins differ only in case). */
  usage: number;
  /** The last day with usage in the analysis range, over every spelling of the login. */
  lastDay: number;
}

/**
 * The last day each login has usage in any loaded file, by lower-case login. Filters and the date range do not apply, so the
 * reclaim and fading lists stay the same whatever the view. Pass the result to `buildLicenseReport`.
 */
export function lastUsageDays(store: Pick<DataStore, 'dicts'>, prepared: Pick<Prepared, 'userLastDay'>): Map<string, number> {
  const names = store.dicts.user.values;
  const out = new Map<string, number>();
  for (let userId = 1; userId < names.length; userId++) {
    const day = prepared.userLastDay[userId];
    if (day < 0) continue;
    const key = names[userId].trim().toLowerCase();
    if (key === '') continue;
    const have = out.get(key);
    if (have === undefined || day > have) out.set(key, day);
  }
  return out;
}

const byLogin = (a: LicenseFinding, b: LicenseFinding): number => {
  const firstLogin = a.login.toLowerCase();
  const secondLogin = b.login.toLowerCase();
  return firstLogin < secondLogin ? -1 : firstLogin > secondLogin ? 1 : 0;
};

/** Largest number of days first, and seats without a date before all others. */
const daysDescNullFirst = (a: number | null, b: number | null): number => {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return b - a;
};

const emptyStatusCounts = (): Record<ActivityStatus, number> => ({ recent: 0, fading: 0, stale: 0, 'no-date': 0, unknown: 0 });

/**
 * The license facts from the seat roster and the report. `population` is the user set of the row-filtered scope
 * (not the segment-filtered one), so segment filters never change these numbers. Usage follows the analysis range.
 * `scoped` tells whether a row filter is active. `lastUsage` (see `lastUsageDays`) says when each login last had usage in any
 * loaded file; the reclaim and fading lists skip a seat with later usage, and without it only the users of `population` count.
 * Returns null when the roster is empty.
 * See the metric docs for the exact definition of each number.
 */
export function buildLicenseReport(
  population: UserSet,
  settings: Pick<Settings, 'roster' | 'rosterAsOf' | 'newUserDays'>,
  store: Pick<DataStore, 'maxDay'>,
  scoped = false,
  lastUsage?: ReadonlyMap<string, number>,
): LicenseReport | null {
  const index: LicenseIndex | null = buildLicenseIndex(settings.roster, settings.rosterAsOf);
  if (index === null) return null;

  const reportUsers = new Map<string, ReportUser>();
  for (const profile of population.profiles) {
    const key = profile.name.trim().toLowerCase();
    const have = reportUsers.get(key);
    if (have === undefined) reportUsers.set(key, { profile: profile, usage: profile.gross, lastDay: profile.lastDay });
    else {
      have.usage += profile.gross;
      if (profile.lastDay > have.lastDay) have.lastDay = profile.lastDay;
    }
  }

  const fallbackCredits = population.fallbackQuotaCredits;
  const priceOf = (entry: RosterEntry, user: ReportUser | undefined): number => {
    const own = user !== undefined && user.profile.quotaCredits > 0 ? user.profile.quotaCredits : fallbackCredits;
    return seatPrice(seatCredits(entry.plan, own));
  };

  const byPlan = { Business: 0, Enterprise: 0, other: 0 };
  const byStatus = emptyStatusCounts();
  const reclaim: LicenseFinding[] = [];
  const fading: LicenseFinding[] = [];
  const noActivityDate: LicenseFinding[] = [];
  const quiet: LicenseFinding[] = [];
  const pending: LicenseFinding[] = [];
  const newSeats: LicenseFinding[] = [];
  let seatCost = 0;
  let matched = 0;
  let matchedUsage = 0;

  for (const [key, entry] of index.seats) {
    const user = reportUsers.get(key);
    const activity = seatActivity(entry, index);
    const price = priceOf(entry, user);
    const credits = planCredits(entry.plan);
    if (credits === PLAN_CREDITS.Business) byPlan.Business++;
    else if (credits === PLAN_CREDITS.Enterprise) byPlan.Enterprise++;
    else byPlan.other++;
    seatCost += price;
    byStatus[activity.status]++;
    if (user !== undefined) {
      matched++;
      matchedUsage += user.usage;
    }

    const isPending = entry.pendingCancellation !== undefined;
    const isNew = isNewSeat(entry, index, settings.newUserDays);
    // Days from the last usage in the loaded files to the as-of date. A seat that shows usage after the export is not stale.
    const lastUsed = lastUsage !== undefined ? lastUsage.get(key) : user?.lastDay;
    const usageDays = lastUsed !== undefined && index.asOfDay !== null ? Math.max(0, index.asOfDay - lastUsed) : null;
    const make = (reason?: ReclaimReason): LicenseFinding => {
      const finding: LicenseFinding = {
        login: entry.user.trim(),
        name: entry.name ?? '',
        plan: entry.plan ?? '',
        org: entry.org ?? '',
        team: entry.team ?? '',
        daysSinceActivity: activity.days,
        lastActivityAt: entry.lastActivityAt ?? '',
        lastSurface: entry.lastSurface ?? '',
        createdAt: entry.createdAt ?? '',
        pendingCancellation: entry.pendingCancellation ?? '',
        usage: user?.usage ?? 0,
        inReport: user !== undefined,
        seatPrice: price,
      };
      if (reason !== undefined) finding.reason = reason;
      return finding;
    };

    if (isPending) pending.push(make());
    if (isNew) newSeats.push(make());
    if (activity.status === 'no-date') noActivityDate.push(make());
    if (isPending) continue;
    if (activity.status === 'stale' && !isNew) {
      if (usageDays === null || usageDays >= RECLAIM_DAYS) {
        reclaim.push(make('stale'));
      }
    } else if (activity.status === 'fading') {
      if (usageDays === null || usageDays >= RECENT_DAYS) fading.push(make());
    } else if (activity.status === 'recent' && (user === undefined || user.usage <= 0)) {
      quiet.push(make());
    }
  }

  reclaim.sort((a, b) => b.seatPrice - a.seatPrice || daysDescNullFirst(a.daysSinceActivity, b.daysSinceActivity) || byLogin(a, b));
  fading.sort((a, b) => daysDescNullFirst(a.daysSinceActivity, b.daysSinceActivity) || byLogin(a, b));
  noActivityDate.sort(byLogin);
  quiet.sort((a, b) => (a.daysSinceActivity ?? 0) - (b.daysSinceActivity ?? 0) || byLogin(a, b));
  pending.sort((a, b) => (a.pendingCancellation < b.pendingCancellation ? -1 : a.pendingCancellation > b.pendingCancellation ? 1 : byLogin(a, b)));
  newSeats.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : byLogin(a, b)));

  const unmatched: UnmatchedUser[] = [];
  let unmatchedUsage = 0;
  for (const [key, user] of reportUsers) {
    if (index.seats.has(key)) continue;
    unmatched.push({ name: user.profile.name, org: user.profile.org, plan: user.profile.plan, usage: user.usage });
    unmatchedUsage += user.usage;
  }
  unmatched.sort((a, b) => b.usage - a.usage || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));

  const neverSeen = population.inactive.length;
  const reportCount = reportUsers.size;
  return {
    asOf: index.asOf,
    asOfSource: index.asOfSource,
    asOfBehindReport: index.asOfDay === null ? null : Math.max(0, store.maxDay - index.asOfDay),
    hasActivity: index.hasActivity,
    scoped,
    seats: index.seats.size,
    byPlan,
    seatCost,
    reportUsers: reportCount,
    matched,
    neverSeen,
    seenOutsideScope: index.seats.size - matched - neverSeen,
    coverage: reportCount > 0 ? matched / reportCount : null,
    matchedUsage,
    unmatched,
    unmatchedUsage,
    byStatus,
    reclaim,
    reclaimValue: reclaim.reduce((sum, finding) => sum + finding.seatPrice, 0),
    fading,
    noActivityDate,
    quiet,
    pending,
    newSeats,
  };
}
