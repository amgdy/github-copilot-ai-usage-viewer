import { isIsoDay, type RosterEntry } from '../analytics/settings';
import { earlierDay, laterDay, todayIso } from './dates';
import { MAX_SEATS } from './json';
import { loginKey } from './login';
import { readPlan } from './plan';
import type { LicenseParse, LicenseSeat } from './types';

export type RosterMode = 'replace' | 'add';

const MAX_USER = 100;
const MAX_NAME = 100;
const MAX_EMAIL = 120;
const MAX_ORG = 160;
const MAX_TEAM = 160;
const MAX_SURFACE = 40;
const MAX_JOINED = 120;
const BAD_USER = /[\s,;"'<>]/;
const EMAIL = /^[^\s@]+@[^\s@]+$/;
const FIRST_DAY = '2008-01-01';
const LAST_DAY = '2100-12-31';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** A day the roster accepts: a real calendar day between 2008 and 2100. */
const isRosterDay = (value: unknown): value is string => isIsoDay(value) && value >= FIRST_DAY && value <= LAST_DAY;

/** The rule for a login in stored data. It is looser than the import rule, so rosters saved by earlier versions still load. */
function userProblem(user: string): boolean {
  return user === '' || user.length > MAX_USER || BAD_USER.test(user);
}

const text = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed.slice(0, max);
};

/** Adds the license fields that hold valid values, in a fixed order so the stored JSON is the same every time. */
function withExtras(base: RosterEntry, item: Record<string, unknown>): RosterEntry {
  const out: RosterEntry = base;
  const name = text(item.name, MAX_NAME);
  if (name !== undefined) out.name = name;
  const email = text(item.email, MAX_EMAIL);
  if (email !== undefined && EMAIL.test(email)) out.email = email;
  const org = text(item.org, MAX_ORG);
  if (org !== undefined) out.org = org;
  const team = text(item.team, MAX_TEAM);
  if (team !== undefined) out.team = team;
  if (isRosterDay(item.createdAt)) out.createdAt = item.createdAt;
  if (isRosterDay(item.lastActivityAt)) out.lastActivityAt = item.lastActivityAt;
  if (isRosterDay(item.lastAuthenticatedAt)) out.lastAuthenticatedAt = item.lastAuthenticatedAt;
  const surface = text(item.lastSurface, MAX_SURFACE);
  if (surface !== undefined) out.lastSurface = surface;
  if (isRosterDay(item.pendingCancellation)) out.pendingCancellation = item.pendingCancellation;
  if (item.source === 'api' || item.source === 'activity') out.source = item.source;
  return out;
}

export interface SanitizedRoster {
  entries: RosterEntry[];
  /** Entries without a usable username. */
  invalid: number;
  /** Entries whose username was already there (the first one is kept). */
  duplicates: number;
  /** Plan values that could not be read. Their users are kept without a plan. */
  unreadablePlans: number;
  /** The value was not a list at all. */
  notAList: boolean;
}

/**
 * Checks a roster that comes from outside the app (browser storage or a settings file) and says what was left out.
 * Each item is a username or an object with a `user`. A leading "@" is dropped, usernames are trimmed, the first
 * of two usernames that differ only in case is kept, a plan that cannot be read is dropped (the user stays), and the
 * license fields are kept only when they hold valid values, with text capped in length.
 */
export function sanitizeRosterDetailed(raw: unknown): SanitizedRoster {
  const result: SanitizedRoster = { entries: [], invalid: 0, duplicates: 0, unreadablePlans: 0, notAList: false };
  if (!Array.isArray(raw)) {
    result.notAList = true;
    return result;
  }
  const seen = new Set<string>();
  for (const item of raw) {
    const name = isObject(item) ? item.user : item;
    const user = typeof name === 'string' ? name.trim().replace(/^@/, '') : '';
    if (userProblem(user) || result.entries.length >= MAX_SEATS) {
      result.invalid++;
      continue;
    }
    const key = loginKey(user);
    if (seen.has(key)) {
      result.duplicates++;
      continue;
    }
    seen.add(key);
    const entry: RosterEntry = { user };
    if (isObject(item)) {
      const planRaw = item.plan;
      if (typeof planRaw === 'string' || typeof planRaw === 'number') {
        const plan = readPlan(String(planRaw));
        if (plan === null) result.unreadablePlans++;
        else if (plan !== undefined) entry.plan = plan;
      }
      withExtras(entry, item);
    }
    result.entries.push(entry);
  }
  return result;
}

/** The checked roster, without the counts. Use it where nothing needs to be reported. */
export const sanitizeRoster = (raw: unknown): RosterEntry[] => sanitizeRosterDetailed(raw).entries;

/** Whole items joined with ", " up to a length, with the number of items left out added at the end. */
function joinCapped(items: readonly string[]): string {
  const kept: string[] = [];
  let length = 0;
  for (const item of items) {
    const next = length + item.length + (kept.length > 0 ? 2 : 0);
    if (next > MAX_JOINED && kept.length > 0) break;
    kept.push(item);
    length = next;
  }
  const left = items.length - kept.length;
  return left > 0 ? `${kept.join(', ')} +${left}` : kept.join(', ');
}

/**
 * A small roster entry for one seat, about 220 characters of JSON with a name and an email. The sign-in day is kept
 * only when there is no activity day, for context. It does not prove that the seat was never used.
 */
export function entryFromSeat(seat: LicenseSeat): RosterEntry {
  const entry: RosterEntry = { user: seat.login };
  if (seat.plan !== undefined) entry.plan = seat.plan;
  return withExtras(entry, {
    name: seat.name,
    email: seat.email,
    org: joinCapped(seat.orgs),
    team: joinCapped(seat.teams),
    createdAt: seat.createdAt,
    lastActivityAt: seat.lastActivityAt,
    lastAuthenticatedAt: seat.lastActivityAt === undefined ? seat.lastAuthenticatedAt : undefined,
    lastSurface: seat.lastSurface,
    pendingCancellation: seat.pendingCancellation,
    source: seat.source === 'list' ? undefined : seat.source,
  });
}

/** Roster entries for the seats of an import, in the same order. */
export const rosterFromSeats = (seats: readonly LicenseSeat[]): RosterEntry[] => seats.map(entryFromSeat);

/** Roster entries for a parse result (empty when the file had no seats). */
export const rosterFromParse = (parse: LicenseParse): RosterEntry[] => rosterFromSeats(parse.seats);

function dedupe(list: readonly RosterEntry[]): RosterEntry[] {
  const seen = new Set<string>();
  const out: RosterEntry[] = [];
  for (const entry of list) {
    const key = loginKey(entry.user);
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

/**
 * One user who is in the roster and in the new import. The new data wins where it has a value. The creation date
 * stays the earlier one and the activity and sign-in dates the later one. The spelling of the login stays as it was.
 * An API export also settles the pending cancellation, because it always says whether one is scheduled.
 */
function combine(have: RosterEntry, add: RosterEntry): RosterEntry {
  const item: Record<string, unknown> = { ...have };
  for (const [key, value] of Object.entries(add)) if (value !== undefined) item[key] = value;
  item.createdAt = earlierDay(have.createdAt, add.createdAt);
  item.lastActivityAt = laterDay(have.lastActivityAt, add.lastActivityAt);
  item.lastAuthenticatedAt = laterDay(have.lastAuthenticatedAt, add.lastAuthenticatedAt);
  if (add.source === 'api') item.pendingCancellation = add.pendingCancellation;
  item.source = have.source === 'api' || add.source === 'api' ? 'api' : (add.source ?? have.source);
  const merged: RosterEntry = { user: have.user };
  if (typeof item.plan === 'string') merged.plan = item.plan;
  return withExtras(merged, item);
}

/**
 * Combines the roster in the settings with the entries of a new import. 'replace' gives the new entries. 'add' keeps
 * everyone already on the roster, adds the new users after them and updates the users in both.
 */
export function mergeRoster(existing: readonly RosterEntry[], incoming: readonly RosterEntry[], mode: RosterMode): RosterEntry[] {
  const fresh = dedupe(incoming);
  if (mode === 'replace') return fresh;
  const byKey = new Map<string, RosterEntry>();
  for (const entry of dedupe(existing)) byKey.set(loginKey(entry.user), entry);
  for (const entry of fresh) {
    const key = loginKey(entry.user);
    const have = byKey.get(key);
    byKey.set(key, have === undefined ? entry : combine(have, entry));
  }
  return [...byKey.values()];
}

export interface ImportResult {
  roster: RosterEntry[];
  /** The export date to store in `Settings.rosterAsOf`. Missing only when nothing was imported and none was set. */
  rosterAsOf: string | undefined;
  /** Users who were not on the roster before. */
  added: number;
  /** Users on the roster before whose entry changed. */
  updated: number;
  unchanged: number;
  /** Users on the old roster who are not on the new one ('replace' only). */
  removed: number;
}

const sameEntry = (a: RosterEntry, b: RosterEntry): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Applies a parsed license file to the roster in the settings and works out the export date. With timestamps in the
 * file ('replace') the date is the latest one in the file, and 'add' keeps the later of that and the stored date.
 * A plain list of logins has no timestamps: 'replace' uses today, 'add' keeps the stored date (today when none).
 * A file without seats changes nothing.
 */
export function applyLicenseImport(
  parse: LicenseParse,
  current: { roster: readonly RosterEntry[]; rosterAsOf?: string },
  mode: RosterMode,
  today: string = todayIso(),
): ImportResult {
  const before = dedupe(current.roster);
  if (parse.seats.length === 0) {
    return { roster: [...current.roster], rosterAsOf: current.rosterAsOf, added: 0, updated: 0, unchanged: before.length, removed: 0 };
  }
  const roster = mergeRoster(before, rosterFromParse(parse), mode);
  const old = new Map(before.map((entry) => [loginKey(entry.user), entry]));
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  const kept = new Set<string>();
  for (const entry of roster) {
    const key = loginKey(entry.user);
    kept.add(key);
    const had = old.get(key);
    if (had === undefined) added++;
    else if (sameEntry(had, entry)) unchanged++;
    else updated++;
  }
  const removed = before.filter((entry) => !kept.has(loginKey(entry.user))).length;

  const stored = isIsoDay(current.rosterAsOf) ? current.rosterAsOf : undefined;
  let rosterAsOf: string;
  if (parse.exportedAt !== undefined) rosterAsOf = mode === 'add' ? (laterDay(stored, parse.exportedAt) ?? parse.exportedAt) : parse.exportedAt;
  else rosterAsOf = mode === 'add' ? (stored ?? today) : today;
  return { roster, rosterAsOf, added, updated, unchanged, removed };
}
