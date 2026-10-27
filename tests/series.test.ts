import { beforeAll, describe, expect, it } from 'vitest';
import { buildMask, emptyFilters } from '../src/lib/analytics/filters';
import { prepareStore } from '../src/lib/analytics/prepare';
import { makeBucketer, stackedSeries, userDailySeries, type Bucket, type SeriesMeasure } from '../src/lib/analytics/series';
import { buildModelTable } from '../src/lib/pricing/models';
import type { DataStore, DimKey } from '../src/lib/types';
import { dowOf } from '../src/lib/utils/date';
import { addDays, dayNum, isoOf, loadDemo, mulberry32, sum, weekdayOf } from './helpers';

const BUCKETS: Bucket[] = ['day', 'week', 'month'];
const MEASURES: SeriesMeasure[] = ['gross', 'net', 'discount', 'credits', 'rows'];

/** Bucket key of a day from plain Date arithmetic (weeks start on Monday). */
function keyOf(day: number, bucket: Bucket): string {
  const iso = isoOf(day);
  if (bucket === 'day') return iso;
  if (bucket === 'month') return iso.slice(0, 7);
  return addDays(iso, -weekdayOf(iso));
}

/** A day's bucket index is the rank of its bucket among the buckets the range touches, in date order. */
function oracleIndex(start: number, end: number, bucket: Bucket): (day: number) => number {
  const rank = new Map<string, number>();
  for (let day = start; day <= end; day++) {
    const bucketKey = keyOf(day, bucket);
    rank.getOrInsert(bucketKey, rank.size);
  }
  return (day) => rank.get(keyOf(day, bucket)) ?? -1;
}

const maxDiff = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let largest = 0;
  for (let i = 0; i < a.length; i++) largest = Math.max(largest, Math.abs(a[i] - b[i]));
  return largest;
};

const valueOf = (store: DataStore, rowIndex: number, measure: SeriesMeasure): number =>
  measure === 'gross' ? store.gross[rowIndex] : measure === 'net' ? store.net[rowIndex] : measure === 'discount' ? store.discount[rowIndex] : measure === 'credits' ? store.qty[rowIndex] : 1;

/** Stacked series recomputed with a plain loop. */
function oracleStack(
  store: DataStore,
  range: { start: number; end: number },
  groupOfRow: (rowIndex: number) => number,
  ids: number[],
  measure: SeriesMeasure,
  bucket: Bucket,
  keep: (rowIndex: number) => boolean = () => true,
) {
  const bucketIndexOf = oracleIndex(range.start, range.end, bucket);
  const count = bucketIndexOf(range.end) + 1;
  const series = ids.map(() => new Array<number>(count).fill(0));
  const other = new Array<number>(count).fill(0);
  for (let i = 0; i < store.n; i++) {
    const day = store.day[i];
    if (day < range.start || day > range.end || !keep(i)) continue;
    const seriesIndex = ids.indexOf(groupOfRow(i));
    (seriesIndex < 0 ? other : series[seriesIndex])[bucketIndexOf(day)] += valueOf(store, i, measure);
  }
  return { count, series, other };
}

describe('makeBucketer', () => {
  const start = dayNum('2026-09-01'); // a Tuesday
  const end = dayNum('2026-10-26'); // a Monday

  it('day buckets: one per day, labelled like "Sep 1"', () => {
    const bucketer = makeBucketer(start, end, 'day');
    expect(bucketer.count).toBe(56);
    expect(bucketer.indexOf(start)).toBe(0);
    expect(bucketer.indexOf(end)).toBe(55);
    expect(bucketer.start(10)).toBe(start + 10);
    expect(bucketer.label(0)).toBe('Sep 1');
    expect(bucketer.label(55)).toBe('Oct 26');
  });

  it('week buckets start on Monday; the first bucket is clamped to the range start', () => {
    const bucketer = makeBucketer(start, end, 'week');
    expect(bucketer.count).toBe(9);
    expect(bucketer.start(0)).toBe(start);
    expect(bucketer.start(1)).toBe(dayNum('2026-09-07'));
    for (let i = 1; i < bucketer.count; i++) expect(weekdayOf(isoOf(bucketer.start(i)))).toBe(0);
    expect(bucketer.indexOf(dayNum('2026-09-06'))).toBe(0); // Sunday ends the first week
    expect(bucketer.indexOf(dayNum('2026-09-07'))).toBe(1); // Monday starts the next one
    expect(bucketer.indexOf(end)).toBe(8);
    expect(Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex))).toEqual([
      'Week of Sep 1',
      'Week of Sep 7',
      'Week of Sep 14',
      'Week of Sep 21',
      'Week of Sep 28',
      'Week of Oct 5',
      'Week of Oct 12',
      'Week of Oct 19',
      'Week of Oct 26',
    ]);
  });

  it('month buckets are calendar months labelled like "Sep 2026", also across a year end', () => {
    const bucketer = makeBucketer(start, end, 'month');
    expect(bucketer.count).toBe(2);
    expect([bucketer.label(0), bucketer.label(1)]).toEqual(['Sep 2026', 'Oct 2026']);
    expect(bucketer.start(0)).toBe(start);
    expect(bucketer.start(1)).toBe(dayNum('2026-10-01'));

    const wideStart = dayNum('2026-11-15');
    const wide = makeBucketer(wideStart, dayNum('2027-02-10'), 'month');
    expect(wide.count).toBe(4);
    expect(Array.from({ length: 4 }, (_, bucketIndex) => wide.label(bucketIndex))).toEqual(['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027']);
    expect(wide.start(0)).toBe(wideStart);
    expect(wide.start(2)).toBe(dayNum('2027-01-01'));
    expect(wide.indexOf(dayNum('2026-12-31'))).toBe(1);
    expect(wide.indexOf(dayNum('2027-01-01'))).toBe(2);
  });

  it('a single day is one bucket of every kind', () => {
    for (const bucket of BUCKETS) {
      const bucketer = makeBucketer(start, start, bucket);
      expect(bucketer.count, bucket).toBe(1);
      expect(bucketer.indexOf(start), bucket).toBe(0);
      expect(bucketer.start(0), bucket).toBe(start);
    }
  });

  it('a range that ends long before it starts has no buckets', () => {
    for (const bucket of BUCKETS) expect(makeBucketer(dayNum('2026-10-26'), dayNum('2026-08-01'), bucket).count, bucket).toBe(0);
  });

  it.each(BUCKETS)('%s buckets agree with a Date-based oracle on 150 random ranges', (bucket) => {
    const random = mulberry32(bucket.length * 1009);
    const earliestStart = dayNum('2024-01-01');
    const bad: string[] = [];
    for (let trial = 0; trial < 150; trial++) {
      const rangeStart = earliestStart + Math.floor(random() * 2200);
      const rangeEnd = rangeStart + Math.floor(random() * 400);
      const bucketer = makeBucketer(rangeStart, rangeEnd, bucket);
      const bucketIndexOf = oracleIndex(rangeStart, rangeEnd, bucket);
      const tag = `${bucket} ${isoOf(rangeStart)}..${isoOf(rangeEnd)}`;
      if (bucketer.count !== bucketIndexOf(rangeEnd) + 1) bad.push(`${tag}: count ${bucketer.count} want ${bucketIndexOf(rangeEnd) + 1}`);
      const first = new Map<number, number>();
      for (let day = rangeStart; day <= rangeEnd; day++) {
        const want = bucketIndexOf(day);
        if (bucketer.indexOf(day) !== want) bad.push(`${tag}: ${isoOf(day)} -> ${bucketer.indexOf(day)} want ${want}`);
        first.getOrInsert(want, day);
      }
      for (const [bucketIndex, firstDay] of first) if (bucketer.start(bucketIndex) !== firstDay) bad.push(`${tag}: start(${bucketIndex}) ${isoOf(bucketer.start(bucketIndex))} want ${isoOf(firstDay)}`);
      // Day and week labels carry no year, so they can only be unique within a year; month labels always are.
      const labels = new Set(Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex)));
      if ((bucket === 'month' || rangeEnd - rangeStart < 360) && labels.size !== bucketer.count) bad.push(`${tag}: duplicate labels`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('stackedSeries', () => {
  let store: DataStore;
  let userIds: number[];
  let range: { start: number; end: number };
  const nameOf = (dimension: DimKey, id: number): string => store.dicts[dimension].values[id];

  beforeAll(async () => {
    ({ store } = await loadDemo());
    userIds = Array.from({ length: store.dicts.user.values.length - 1 }, (_, index) => index + 1);
    range = { start: store.minDay, end: store.maxDay };
  });

  describe.each(BUCKETS.flatMap((bucket) => MEASURES.map((measure) => [bucket, measure] as const)))('%s buckets, %s', (bucket, measure) => {
    it('matches a plain-loop recomputation (five named users + the rest as "other")', () => {
      const ids = userIds.slice(0, 5);
      const got = stackedSeries(store, null, range, 'user', ids, measure, bucket, ids.map((id) => nameOf('user', id)));
      const want = oracleStack(store, range, (rowIndex) => store.user[rowIndex], ids, measure, bucket);
      expect(got.bucketer.count).toBe(want.count);
      expect(got.labels).toHaveLength(want.count);
      ids.forEach((id, seriesIndex) => {
        expect(got.series[seriesIndex].id).toBe(id);
        expect(got.series[seriesIndex].name).toBe(nameOf('user', id));
        expect(maxDiff(got.series[seriesIndex].data, want.series[seriesIndex])).toBeLessThan(1e-9);
      });
      expect(got.other).not.toBeNull();
      expect(maxDiff(got.other as Float64Array, want.other)).toBeLessThan(1e-9);
    });
  });

  it('every row lands somewhere: series plus other add up to the total, for every bucket size', () => {
    for (const bucket of BUCKETS) {
      for (const measure of MEASURES) {
        const got = stackedSeries(store, null, range, 'user', userIds, measure, bucket, []);
        const total = got.series.reduce((runningTotal, series) => runningTotal + sum([...series.data]), 0) + (got.other ? sum([...got.other]) : 0);
        const want = measure === 'rows' ? store.n : sum(Array.from({ length: store.n }, (_, rowIndex) => valueOf(store, rowIndex, measure)));
        expect(total, `${bucket}/${measure}`).toBeCloseTo(want, 6);
      }
    }
  });

  it('coarser buckets are sums of the daily buckets', () => {
    const ids = userIds.slice(0, 8);
    const daily = stackedSeries(store, null, range, 'user', ids, 'gross', 'day', []);
    for (const bucket of ['week', 'month'] as const) {
      const coarse = stackedSeries(store, null, range, 'user', ids, 'gross', bucket, []);
      const bucketIndexOf = oracleIndex(range.start, range.end, bucket);
      ids.forEach((_, seriesIndex) => {
        const folded = new Array<number>(coarse.bucketer.count).fill(0);
        daily.series[seriesIndex].data.forEach((value, dayOffset) => (folded[bucketIndexOf(range.start + dayOffset)] += value));
        expect(maxDiff(coarse.series[seriesIndex].data, folded), `${bucket} #${seriesIndex}`).toBeLessThan(1e-9);
      });
    }
  });

  it('falls back to the numeric id when no name is given, and supports an empty id list', () => {
    const ids = userIds.slice(0, 3);
    const named = stackedSeries(store, null, range, 'user', ids, 'gross', 'month', ['only-first']);
    expect(named.series.map((series) => series.name)).toEqual(['only-first', String(ids[1]), String(ids[2])]);
    const none = stackedSeries(store, null, range, 'user', [], 'rows', 'month', []);
    expect(none.series).toEqual([]);
    expect(sum([...(none.other as Float64Array)])).toBe(store.n);
  });

  it('ignores rows outside the requested range', () => {
    const narrowRange = { start: range.start + 10, end: range.start + 19 };
    const got = stackedSeries(store, null, narrowRange, 'user', userIds, 'gross', 'day', []);
    expect(got.labels).toHaveLength(10);
    let want = 0;
    for (let i = 0; i < store.n; i++) if (store.day[i] >= narrowRange.start && store.day[i] <= narrowRange.end) want += store.gross[i];
    const total = got.series.reduce((runningTotal, series) => runningTotal + sum([...series.data]), 0) + (got.other ? sum([...got.other]) : 0);
    expect(want).toBeGreaterThan(0);
    expect(total).toBeCloseTo(want, 9);
  });

  it('pads days outside the data with empty buckets, and a range without data gives zeros and no "other"', () => {
    const wide = { start: range.start - 5, end: range.end + 5 };
    const got = stackedSeries(store, null, wide, 'user', userIds, 'gross', 'day', []);
    expect(got.bucketer.count).toBe(range.end - range.start + 11);
    for (const series of got.series) {
      for (let i = 0; i < 5; i++) {
        expect(series.data[i]).toBe(0);
        expect(series.data[series.data.length - 1 - i]).toBe(0);
      }
    }
    const none = stackedSeries(store, null, { start: range.end + 100, end: range.end + 120 }, 'user', userIds, 'gross', 'day', []);
    expect(none.other).toBeNull();
    expect(none.series.every((series) => series.data.every((value) => value === 0))).toBe(true);
  });

  it('counts only the rows the mask lets through', () => {
    const prepared = prepareStore(store);
    const models = buildModelTable(store);
    const picked = store.dicts.model.values.filter((modelName) => modelName !== '').slice(0, 2);
    const mask = buildMask(store, prepared, models, { ...emptyFilters(), models: picked });
    expect(mask).not.toBeNull();
    const keep = (rowIndex: number): boolean => picked.includes(nameOf('model', store.model[rowIndex]));
    const ids = userIds.slice(0, 6);
    for (const measure of ['gross', 'rows'] as const) {
      const got = stackedSeries(store, mask, range, 'user', ids, measure, 'week', []);
      const want = oracleStack(store, range, (rowIndex) => store.user[rowIndex], ids, measure, 'week', keep);
      ids.forEach((_, seriesIndex) => expect(maxDiff(got.series[seriesIndex].data, want.series[seriesIndex]), `${measure} #${seriesIndex}`).toBeLessThan(1e-9));
      expect(maxDiff(got.other as Float64Array, want.other)).toBeLessThan(1e-9);
    }
    const unmasked = stackedSeries(store, null, range, 'user', userIds, 'rows', 'month', []);
    const masked = stackedSeries(store, mask, range, 'user', userIds, 'rows', 'month', []);
    const rowsOf = (stacked: typeof masked): number => stacked.series.reduce((runningTotal, series) => runningTotal + sum([...series.data]), 0) + (stacked.other ? sum([...stacked.other]) : 0);
    expect(rowsOf(masked)).toBeLessThan(rowsOf(unmasked));
    expect(rowsOf(masked)).toBe(Array.from({ length: store.n }, (_, rowIndex) => rowIndex).filter(keep).length);
  });

  it('can group by a custom function (weekday of the row)', () => {
    const ids = [0, 1, 2, 3, 4, 5, 6];
    const got = stackedSeries(store, null, range, 'user', ids, 'gross', 'week', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], (dataStore, rowIndex) => dowOf(dataStore.day[rowIndex]));
    const want = oracleStack(store, range, (rowIndex) => weekdayOf(isoOf(store.day[rowIndex])), ids, 'gross', 'week');
    ids.forEach((_, seriesIndex) => expect(maxDiff(got.series[seriesIndex].data, want.series[seriesIndex]), `weekday ${seriesIndex}`).toBeLessThan(1e-9));
    expect(got.other).toBeNull();
    expect(got.series.map((series) => series.name)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it.each(['model', 'org', 'product', 'sku'] as const)('stacks by the %s dimension without losing a row', (dimension) => {
    const valueCount = store.dicts[dimension].values.length;
    const ids = Array.from({ length: valueCount }, (_, index) => index);
    const got = stackedSeries(store, null, range, dimension, ids, 'rows', 'month', ids.map((id) => nameOf(dimension, id)));
    expect(got.other).toBeNull();
    const counts = new Array<number>(valueCount).fill(0);
    for (let i = 0; i < store.n; i++) counts[(store[dimension] as Int32Array)[i]]++;
    ids.forEach((id, seriesIndex) => expect(sum([...got.series[seriesIndex].data]), nameOf(dimension, id)).toBe(counts[id]));
    expect(got.series.reduce((runningTotal, series) => runningTotal + sum([...series.data]), 0)).toBe(store.n);
  });
});

describe('userDailySeries', () => {
  let store: DataStore;
  let userIds: number[];
  let range: { start: number; end: number };

  beforeAll(async () => {
    ({ store } = await loadDemo());
    userIds = Array.from({ length: store.dicts.user.values.length - 1 }, (_, index) => index + 1);
    range = { start: store.minDay, end: store.maxDay };
  });

  function oracleDaily(dayRange: { start: number; end: number }, keep: (rowIndex: number) => boolean = () => true): Map<number, number[]> {
    const out = new Map<number, number[]>(userIds.map((id) => [id, new Array<number>(Math.max(0, dayRange.end - dayRange.start + 1)).fill(0)]));
    for (let i = 0; i < store.n; i++) {
      const day = store.day[i];
      const dailyGross = out.get(store.user[i]);
      if (dailyGross && day >= dayRange.start && day <= dayRange.end && keep(i)) dailyGross[day - dayRange.start] += store.gross[i];
    }
    return out;
  }

  // Float32 storage: allow rounding of about 1e-3 USD on a day.
  const close = (a: ArrayLike<number>, b: ArrayLike<number>): boolean => maxDiff(a, b) < 1e-3;

  it('matches a plain loop for every user, with one value per day of the range', () => {
    const got = userDailySeries(store, null, range, userIds);
    const want = oracleDaily(range);
    expect([...got.keys()]).toEqual(userIds);
    for (const id of userIds) {
      expect(got.get(id)).toHaveLength(range.end - range.start + 1);
      expect(close(got.get(id) as Float32Array, want.get(id) as number[]), `user ${id}`).toBe(true);
    }
  });

  it('only returns the users that were asked for; ids that are not in the data stay zero', () => {
    const got = userDailySeries(store, null, range, [userIds[3], 999_999, -1]);
    expect([...got.keys()]).toEqual([userIds[3], 999_999, -1]);
    expect(sum([...(got.get(userIds[3]) as Float32Array)])).toBeGreaterThan(0);
    expect(sum([...(got.get(999_999) as Float32Array)])).toBe(0);
    expect(sum([...(got.get(-1) as Float32Array)])).toBe(0);
    expect(userDailySeries(store, null, range, []).size).toBe(0);
  });

  it('honours the mask and a narrower range', () => {
    const narrowRange = { start: range.start + 7, end: range.end - 7 };
    const weekdayOnly = (rowIndex: number): boolean => weekdayOf(isoOf(store.day[rowIndex])) < 5;
    const mask = new Uint8Array(store.n);
    for (let i = 0; i < store.n; i++) mask[i] = weekdayOnly(i) ? 1 : 0;
    const got = userDailySeries(store, mask, narrowRange, userIds);
    const want = oracleDaily(narrowRange, weekdayOnly);
    for (const id of userIds) expect(close(got.get(id) as Float32Array, want.get(id) as number[]), `user ${id}`).toBe(true);
    for (const id of userIds) {
      (got.get(id) as Float32Array).forEach((value, dayOffset) => {
        if (weekdayOf(isoOf(narrowRange.start + dayOffset)) >= 5) expect(value).toBe(0);
      });
    }
  });

  it('the users together add up to the gross spend of the named users in the range', () => {
    const got = userDailySeries(store, null, range, userIds);
    let want = 0;
    for (let i = 0; i < store.n; i++) if (store.user[i] !== 0) want += store.gross[i];
    let total = 0;
    for (const dailyGross of got.values()) total += sum([...dailyGross]);
    expect(total).toBeCloseTo(want, 1);
  });

  it('an inverted range gives empty arrays', () => {
    const got = userDailySeries(store, null, { start: range.end, end: range.start }, userIds.slice(0, 2));
    for (const dailyGross of got.values()) expect(dailyGross).toHaveLength(0);
  });
});
