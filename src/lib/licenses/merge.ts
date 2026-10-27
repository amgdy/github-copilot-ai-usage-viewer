import { earlierDay, laterDay } from './dates';
import { loginKey } from './login';
import { higherPlan } from './plan';
import type { LicenseSeat, SeatSource } from './types';

const SOURCE_RANK: Record<SeatSource, number> = { api: 2, activity: 1, list: 0 };

/** Adds the values that are not there yet, ignoring case. Keeps the first spelling and the first-seen order. */
function addMissing(target: string[], extra: readonly string[]): void {
  for (const value of extra) {
    const key = value.toLowerCase();
    if (!target.some((existing) => existing.toLowerCase() === key)) target.push(value);
  }
}

/** Folds `next` into `acc` (both describe the same login). */
function foldSeat(merged: LicenseSeat, next: LicenseSeat): void {
  if (merged.name === undefined && next.name !== undefined) merged.name = next.name;
  if (merged.email === undefined && next.email !== undefined) merged.email = next.email;
  const plan = higherPlan(merged.plan, next.plan);
  if (plan !== undefined) merged.plan = plan;
  addMissing(merged.orgs, next.orgs);
  addMissing(merged.teams, next.teams);
  const createdAt = earlierDay(merged.createdAt, next.createdAt);
  if (createdAt !== undefined) merged.createdAt = createdAt;
  const lastAuthenticatedAt = laterDay(merged.lastAuthenticatedAt, next.lastAuthenticatedAt);
  if (lastAuthenticatedAt !== undefined) merged.lastAuthenticatedAt = lastAuthenticatedAt;
  const pendingCancellation = earlierDay(merged.pendingCancellation, next.pendingCancellation);
  if (pendingCancellation !== undefined) merged.pendingCancellation = pendingCancellation;

  const nextIsLater =
    next.lastActivityAt !== undefined && (merged.lastActivityAt === undefined || next.lastActivityAt > merged.lastActivityAt);
  if (nextIsLater) {
    merged.lastActivityAt = next.lastActivityAt;
    if (next.lastSurface !== undefined) merged.lastSurface = next.lastSurface;
  } else if (merged.lastSurface === undefined && next.lastSurface !== undefined) {
    merged.lastSurface = next.lastSurface;
  }
  if (SOURCE_RANK[next.source] > SOURCE_RANK[merged.source]) merged.source = next.source;
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
  for (const seat of seats) {
    latest = laterDay(latest, seat.lastActivityAt);
    latest = laterDay(latest, seat.lastAuthenticatedAt);
    latest = laterDay(latest, seat.createdAt);
  }
  return latest;
}
