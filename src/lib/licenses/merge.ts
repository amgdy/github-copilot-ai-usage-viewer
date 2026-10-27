import { earlierDay, laterDay } from './dates';
import { loginKey } from './login';
import { higherPlan } from './plan';
import type { LicenseSeat, SeatSource } from './types';

const SOURCE_RANK: Record<SeatSource, number> = { api: 2, activity: 1, list: 0 };

/** Adds the values that are not there yet, ignoring case. Keeps the first spelling and the first-seen order. */
function addMissing(target: string[], extra: readonly string[]): void {
  for (const value of extra) {
    const key = value.toLowerCase();
    if (!target.some((t) => t.toLowerCase() === key)) target.push(value);
  }
}

/** Folds `next` into `acc` (both describe the same login). */
function foldSeat(acc: LicenseSeat, next: LicenseSeat): void {
  if (acc.name === undefined && next.name !== undefined) acc.name = next.name;
  if (acc.email === undefined && next.email !== undefined) acc.email = next.email;
  const plan = higherPlan(acc.plan, next.plan);
  if (plan !== undefined) acc.plan = plan;
  addMissing(acc.orgs, next.orgs);
  addMissing(acc.teams, next.teams);
  const createdAt = earlierDay(acc.createdAt, next.createdAt);
  if (createdAt !== undefined) acc.createdAt = createdAt;
  const lastAuthenticatedAt = laterDay(acc.lastAuthenticatedAt, next.lastAuthenticatedAt);
  if (lastAuthenticatedAt !== undefined) acc.lastAuthenticatedAt = lastAuthenticatedAt;
  const pendingCancellation = earlierDay(acc.pendingCancellation, next.pendingCancellation);
  if (pendingCancellation !== undefined) acc.pendingCancellation = pendingCancellation;

  const nextIsLater =
    next.lastActivityAt !== undefined && (acc.lastActivityAt === undefined || next.lastActivityAt > acc.lastActivityAt);
  if (nextIsLater) {
    acc.lastActivityAt = next.lastActivityAt;
    if (next.lastSurface !== undefined) acc.lastSurface = next.lastSurface;
  } else if (acc.lastSurface === undefined && next.lastSurface !== undefined) {
    acc.lastSurface = next.lastSurface;
  }
  if (SOURCE_RANK[next.source] > SOURCE_RANK[acc.source]) acc.source = next.source;
}

/**
 * Merges records of the same user (matched by login, ignoring case and spaces). An enterprise user appears once per
 * organization or team. The result keeps the first spelling and the first-seen order, takes the union of
 * organizations and teams, the highest plan, the latest activity and sign-in, the earliest creation date and any
 * pending cancellation. The input is not changed.
 */
export function mergeSeats(seats: readonly LicenseSeat[]): LicenseSeat[] {
  const byKey = new Map<string, LicenseSeat>();
  for (const seat of seats) {
    const key = loginKey(seat.login);
    if (key === '') continue;
    const have = byKey.get(key);
    if (have === undefined) byKey.set(key, { ...seat, orgs: [...seat.orgs], teams: [...seat.teams] });
    else foldSeat(have, seat);
  }
  return [...byKey.values()];
}

/** The latest date found among the activity, sign-in and creation dates of the seats. */
export function latestStamp(seats: readonly LicenseSeat[]): string | undefined {
  let latest: string | undefined;
  for (const s of seats) {
    latest = laterDay(latest, s.lastActivityAt);
    latest = laterDay(latest, s.lastAuthenticatedAt);
    latest = laterDay(latest, s.createdAt);
  }
  return latest;
}
