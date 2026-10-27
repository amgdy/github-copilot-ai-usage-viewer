import { t } from '../../i18n';
import type { DataStore } from '../../lib/types';
import { BLANK_ID } from '../../lib/analytics/prepare';
import { makeBucketer } from '../../lib/analytics/series';
import { fmtInt, fmtNum, fmtPct } from '../../lib/utils/format';
import type { DayRange } from './model';

/**
 * The first day from which a user counts as new in a range. Users first seen before it were already using
 * GitHub Copilot when the range began, or sit inside the first `newUserDays` days of the data where new and existing
 * users cannot be told apart (the same rule the user profiles use for `isNew`).
 */
export function newUserCut(rangeStart: number, storeMinDay: number, newUserDays: number): number {
  return Math.max(rangeStart, storeMinDay + newUserDays);
}

export interface Adoption {
  count: number;
  startDay: number[];
  endDay: number[];
  /** Days of the range that fall in each week. */
  days: number[];
  newUsers: number[];
  /** Users seen so far, starting from the baseline. */
  cumulative: number[];
  weeklyActive: number[];
  /** Users that were already using GitHub Copilot when the range began. */
  baseline: number;
  indexOfDay: (day: number) => number;
}

type AdoptionStore = Pick<DataStore, 'n' | 'day' | 'user' | 'gross'>;

/**
 * Distinct users with usage in each week. Rows are not sorted by day, so they are first grouped by week with a
 * counting sort; then one stamp per user counts every user once per week.
 */
function weeklyActiveUsers(
  store: AdoptionStore,
  mask: Uint8Array | null,
  range: DayRange,
  indexOfDay: (day: number) => number,
  weeks: number,
  userCount: number,
): number[] {
  const { day, user, gross } = store;
  const keep = (i: number): boolean => {
    if (mask !== null && mask[i] === 0) return false;
    const d = day[i];
    return d >= range.start && d <= range.end && user[i] !== BLANK_ID && gross[i] > 0;
  };

  const offsets = new Int32Array(weeks + 1);
  for (let i = 0; i < store.n; i++) {
    if (keep(i)) offsets[indexOfDay(day[i]) + 1]++;
  }
  for (let w = 0; w < weeks; w++) offsets[w + 1] += offsets[w];

  const order = new Int32Array(offsets[weeks]);
  const next = offsets.slice(0, weeks);
  for (let i = 0; i < store.n; i++) {
    if (keep(i)) order[next[indexOfDay(day[i])]++] = user[i];
  }

  const stamp = new Int32Array(userCount);
  const active = new Array<number>(weeks).fill(0);
  for (let w = 0; w < weeks; w++) {
    let distinct = 0;
    for (let j = offsets[w]; j < offsets[w + 1]; j++) {
      const u = order[j];
      if (stamp[u] !== w + 1) {
        stamp[u] = w + 1;
        distinct++;
      }
    }
    active[w] = distinct;
  }
  return active;
}

export function buildAdoption(
  store: AdoptionStore,
  userCount: number,
  mask: Uint8Array | null,
  range: DayRange,
  firstDays: ArrayLike<number>,
  cut: number,
): Adoption {
  const b = makeBucketer(range.start, range.end, 'week');
  const count = b.count;
  const startDay: number[] = [];
  const endDay: number[] = [];
  for (let k = 0; k < count; k++) {
    startDay.push(b.start(k));
    endDay.push(k + 1 < count ? b.start(k + 1) - 1 : range.end);
  }

  const newUsers = new Array<number>(count).fill(0);
  let baseline = 0;
  for (let i = 0; i < firstDays.length; i++) {
    const d = firstDays[i];
    if (d < cut) baseline++;
    else if (d <= range.end) newUsers[b.indexOf(d)]++;
  }
  const cumulative: number[] = [];
  let running = baseline;
  for (let k = 0; k < count; k++) {
    running += newUsers[k];
    cumulative.push(running);
  }

  return {
    count,
    startDay,
    endDay,
    days: startDay.map((s, k) => endDay[k] - s + 1),
    newUsers,
    cumulative,
    weeklyActive: weeklyActiveUsers(store, mask, range, b.indexOf, count, userCount),
    baseline,
    indexOfDay: b.indexOf,
  };
}

export type VerdictKind = 'growing' | 'flat' | 'declining' | 'unknown';

export interface AdoptionVerdict {
  kind: VerdictKind;
  /** Weeks with at least `MIN_WEEK_DAYS` days in the range. */
  weeks: number;
  recent: number;
  prior: number;
  change: number;
}

export const MIN_WEEK_DAYS = 5;
export const VERDICT_WEEKS = 4;
export const FLAT_BAND = 0.1;

/** Last 4 full-enough weeks against the 4 before them, by mean weekly active users. */
export function adoptionVerdict(a: Adoption): AdoptionVerdict {
  const counted: number[] = [];
  for (let k = 0; k < a.count; k++) {
    if (a.days[k] >= MIN_WEEK_DAYS) counted.push(a.weeklyActive[k]);
  }
  const need = VERDICT_WEEKS * 2;
  if (counted.length < need) {
    return { kind: 'unknown', weeks: counted.length, recent: Number.NaN, prior: Number.NaN, change: Number.NaN };
  }
  const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
  const recent = mean(counted.slice(-VERDICT_WEEKS));
  const prior = mean(counted.slice(-need, -VERDICT_WEEKS));
  const change = prior > 0 ? recent / prior - 1 : Number.NaN;
  let kind: VerdictKind;
  if (prior <= 0) kind = recent > 0 ? 'growing' : 'flat';
  else if (change >= FLAT_BAND) kind = 'growing';
  else if (change <= -FLAT_BAND) kind = 'declining';
  else kind = 'flat';
  return { kind, weeks: counted.length, recent, prior, change };
}

export function verdictSentence(v: AdoptionVerdict): string {
  const need = VERDICT_WEEKS * 2;
  if (v.kind === 'unknown') {
    return t('Too little history to say whether adoption is growing or fading. It needs at least {need} weeks with {days} or more days of data, and this range has {weeks}.', {
      need: fmtInt(need),
      days: fmtInt(MIN_WEEK_DAYS),
      weeks: fmtInt(v.weeks),
    });
  }
  const vars = { weeks: fmtInt(VERDICT_WEEKS), recent: fmtNum(v.recent, 1), prior: fmtNum(v.prior, 1), pct: fmtPct(Math.abs(v.change), 0) };
  if (v.prior <= 0) {
    return v.recent > 0
      ? t('Adoption is growing. The last {weeks} weeks averaged {recent} active users a week, and no one was active in the {weeks} weeks before.', vars)
      : t('No users were active in the last {weeks} weeks.', { weeks: fmtInt(need) });
  }
  if (v.kind === 'growing') {
    return t('Adoption is growing. The last {weeks} weeks averaged {recent} active users a week, {pct} more than the {weeks} weeks before ({prior}).', vars);
  }
  if (v.kind === 'declining') {
    return v.recent <= 0
      ? t('Adoption is declining. No users were active in the last {weeks} weeks, down from an average of {prior} in the {weeks} weeks before.', vars)
      : t('Adoption is declining. The last {weeks} weeks averaged {recent} active users a week, {pct} fewer than the {weeks} weeks before ({prior}).', vars);
  }
  return t('Adoption is flat. The last {weeks} weeks averaged {recent} active users a week, within {pct} of the {weeks} weeks before ({prior}).', {
    ...vars,
    pct: fmtPct(FLAT_BAND, 0),
  });
}
