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
  for (let d = start; d <= end; d++) {
    const k = keyOf(d, bucket);
    if (!rank.has(k)) rank.set(k, rank.size);
  }
  return (d) => rank.get(keyOf(d, bucket)) ?? -1;
}

const maxDiff = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
};

const valueOf = (s: DataStore, i: number, m: SeriesMeasure): number =>
  m === 'gross' ? s.gross[i] : m === 'net' ? s.net[i] : m === 'discount' ? s.discount[i] : m === 'credits' ? s.qty[i] : 1;

/** Stacked series recomputed with a plain loop. */
function oracleStack(
  s: DataStore,
  range: { start: number; end: number },
  groupOfRow: (i: number) => number,
  ids: number[],
  measure: SeriesMeasure,
  bucket: Bucket,
  keep: (i: number) => boolean = () => true,
) {
  const idx = oracleIndex(range.start, range.end, bucket);
  const count = idx(range.end) + 1;
  const series = ids.map(() => new Array<number>(count).fill(0));
  const other = new Array<number>(count).fill(0);
  for (let i = 0; i < s.n; i++) {
    const d = s.day[i];
    if (d < range.start || d > range.end || !keep(i)) continue;
    const k = ids.indexOf(groupOfRow(i));
    (k < 0 ? other : series[k])[idx(d)] += valueOf(s, i, measure);
  }
  return { count, series, other };
}

describe('makeBucketer', () => {
  const start = dayNum('2026-09-01'); // a Tuesday
  const end = dayNum('2026-10-26'); // a Monday

  it('day buckets: one per day, labelled like "Sep 1"', () => {
    const b = makeBucketer(start, end, 'day');
    expect(b.count).toBe(56);
    expect(b.indexOf(start)).toBe(0);
    expect(b.indexOf(end)).toBe(55);
    expect(b.start(10)).toBe(start + 10);
    expect(b.label(0)).toBe('Sep 1');
    expect(b.label(55)).toBe('Oct 26');
  });

  it('week buckets start on Monday; the first bucket is clamped to the range start', () => {
    const b = makeBucketer(start, end, 'week');
    expect(b.count).toBe(9);
    expect(b.start(0)).toBe(start);
    expect(b.start(1)).toBe(dayNum('2026-09-07'));
    for (let i = 1; i < b.count; i++) expect(weekdayOf(isoOf(b.start(i)))).toBe(0);
    expect(b.indexOf(dayNum('2026-09-06'))).toBe(0); // Sunday ends the first week
    expect(b.indexOf(dayNum('2026-09-07'))).toBe(1); // Monday starts the next one
    expect(b.indexOf(end)).toBe(8);
    expect(Array.from({ length: b.count }, (_, i) => b.label(i))).toEqual([
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
    const b = makeBucketer(start, end, 'month');
    expect(b.count).toBe(2);
    expect([b.label(0), b.label(1)]).toEqual(['Sep 2026', 'Oct 2026']);
    expect(b.start(0)).toBe(start);
    expect(b.start(1)).toBe(dayNum('2026-10-01'));

    const s2 = dayNum('2026-11-15');
    const wide = makeBucketer(s2, dayNum('2027-02-10'), 'month');
    expect(wide.count).toBe(4);
    expect(Array.from({ length: 4 }, (_, i) => wide.label(i))).toEqual(['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027']);
    expect(wide.start(0)).toBe(s2);
    expect(wide.start(2)).toBe(dayNum('2027-01-01'));
    expect(wide.indexOf(dayNum('2026-12-31'))).toBe(1);
    expect(wide.indexOf(dayNum('2027-01-01'))).toBe(2);
  });

  it('a single day is one bucket of every kind', () => {
    for (const bucket of BUCKETS) {
      const b = makeBucketer(start, start, bucket);
      expect(b.count, bucket).toBe(1);
      expect(b.indexOf(start), bucket).toBe(0);
      expect(b.start(0), bucket).toBe(start);
    }
  });

  it('a range that ends long before it starts has no buckets', () => {
    for (const bucket of BUCKETS) expect(makeBucketer(dayNum('2026-10-26'), dayNum('2026-08-01'), bucket).count, bucket).toBe(0);
  });

  it.each(BUCKETS)('%s buckets agree with a Date-based oracle on 150 random ranges', (bucket) => {
    const rnd = mulberry32(bucket.length * 1009);
    const lo = dayNum('2024-01-01');
    const bad: string[] = [];
    for (let t = 0; t < 150; t++) {
      const s = lo + Math.floor(rnd() * 2200);
      const e = s + Math.floor(rnd() * 400);
      const b = makeBucketer(s, e, bucket);
      const idx = oracleIndex(s, e, bucket);
      const tag = `${bucket} ${isoOf(s)}..${isoOf(e)}`;
      if (b.count !== idx(e) + 1) bad.push(`${tag}: count ${b.count} want ${idx(e) + 1}`);
      const first = new Map<number, number>();
      for (let d = s; d <= e; d++) {
        const want = idx(d);
        if (b.indexOf(d) !== want) bad.push(`${tag}: ${isoOf(d)} -> ${b.indexOf(d)} want ${want}`);
        if (!first.has(want)) first.set(want, d);
      }
      for (const [i, d] of first) if (b.start(i) !== d) bad.push(`${tag}: start(${i}) ${isoOf(b.start(i))} want ${isoOf(d)}`);
      // Day and week labels carry no year, so they can only be unique within a year; month labels always are.
      const labels = new Set(Array.from({ length: b.count }, (_, i) => b.label(i)));
      if ((bucket === 'month' || e - s < 360) && labels.size !== b.count) bad.push(`${tag}: duplicate labels`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('stackedSeries', () => {
  let store: DataStore;
  let userIds: number[];
  let range: { start: number; end: number };
  const nameOf = (dim: DimKey, id: number): string => store.dicts[dim].values[id];

  beforeAll(async () => {
    ({ store } = await loadDemo());
    userIds = Array.from({ length: store.dicts.user.values.length - 1 }, (_, k) => k + 1);
    range = { start: store.minDay, end: store.maxDay };
  });

  describe.each(BUCKETS.flatMap((b) => MEASURES.map((m) => [b, m] as const)))('%s buckets, %s', (bucket, measure) => {
    it('matches a plain-loop recomputation (five named users + the rest as "other")', () => {
      const ids = userIds.slice(0, 5);
      const got = stackedSeries(store, null, range, 'user', ids, measure, bucket, ids.map((id) => nameOf('user', id)));
      const want = oracleStack(store, range, (i) => store.user[i], ids, measure, bucket);
      expect(got.bucketer.count).toBe(want.count);
      expect(got.labels).toHaveLength(want.count);
      ids.forEach((id, k) => {
        expect(got.series[k].id).toBe(id);
        expect(got.series[k].name).toBe(nameOf('user', id));
        expect(maxDiff(got.series[k].data, want.series[k])).toBeLessThan(1e-9);
      });
      expect(got.other).not.toBeNull();
      expect(maxDiff(got.other as Float64Array, want.other)).toBeLessThan(1e-9);
    });
  });

  it('every row lands somewhere: series plus other add up to the total, for every bucket size', () => {
    for (const bucket of BUCKETS) {
      for (const measure of MEASURES) {
        const got = stackedSeries(store, null, range, 'user', userIds, measure, bucket, []);
        const total = got.series.reduce((a, s) => a + sum([...s.data]), 0) + (got.other ? sum([...got.other]) : 0);
        const want = measure === 'rows' ? store.n : sum(Array.from({ length: store.n }, (_, i) => valueOf(store, i, measure)));
        expect(total, `${bucket}/${measure}`).toBeCloseTo(want, 6);
      }
    }
  });

  it('coarser buckets are sums of the daily buckets', () => {
    const ids = userIds.slice(0, 8);
    const daily = stackedSeries(store, null, range, 'user', ids, 'gross', 'day', []);
    for (const bucket of ['week', 'month'] as const) {
      const coarse = stackedSeries(store, null, range, 'user', ids, 'gross', bucket, []);
      const idx = oracleIndex(range.start, range.end, bucket);
      ids.forEach((_, k) => {
        const folded = new Array<number>(coarse.bucketer.count).fill(0);
        daily.series[k].data.forEach((v, i) => (folded[idx(range.start + i)] += v));
        expect(maxDiff(coarse.series[k].data, folded), `${bucket} #${k}`).toBeLessThan(1e-9);
      });
    }
  });

  it('falls back to the numeric id when no name is given, and supports an empty id list', () => {
    const ids = userIds.slice(0, 3);
    const named = stackedSeries(store, null, range, 'user', ids, 'gross', 'month', ['only-first']);
    expect(named.series.map((s) => s.name)).toEqual(['only-first', String(ids[1]), String(ids[2])]);
    const none = stackedSeries(store, null, range, 'user', [], 'rows', 'month', []);
    expect(none.series).toEqual([]);
    expect(sum([...(none.other as Float64Array)])).toBe(store.n);
  });

  it('ignores rows outside the requested range', () => {
    const r = { start: range.start + 10, end: range.start + 19 };
    const got = stackedSeries(store, null, r, 'user', userIds, 'gross', 'day', []);
    expect(got.labels).toHaveLength(10);
    let want = 0;
    for (let i = 0; i < store.n; i++) if (store.day[i] >= r.start && store.day[i] <= r.end) want += store.gross[i];
    const total = got.series.reduce((a, s) => a + sum([...s.data]), 0) + (got.other ? sum([...got.other]) : 0);
    expect(want).toBeGreaterThan(0);
    expect(total).toBeCloseTo(want, 9);
  });

  it('pads days outside the data with empty buckets, and a range without data gives zeros and no "other"', () => {
    const wide = { start: range.start - 5, end: range.end + 5 };
    const got = stackedSeries(store, null, wide, 'user', userIds, 'gross', 'day', []);
    expect(got.bucketer.count).toBe(range.end - range.start + 11);
    for (const s of got.series) {
      for (let i = 0; i < 5; i++) {
        expect(s.data[i]).toBe(0);
        expect(s.data[s.data.length - 1 - i]).toBe(0);
      }
    }
    const none = stackedSeries(store, null, { start: range.end + 100, end: range.end + 120 }, 'user', userIds, 'gross', 'day', []);
    expect(none.other).toBeNull();
    expect(none.series.every((s) => s.data.every((v) => v === 0))).toBe(true);
  });

  it('counts only the rows the mask lets through', () => {
    const prep = prepareStore(store);
    const models = buildModelTable(store);
    const picked = store.dicts.model.values.filter((v) => v !== '').slice(0, 2);
    const mask = buildMask(store, prep, models, { ...emptyFilters(), models: picked });
    expect(mask).not.toBeNull();
    const keep = (i: number): boolean => picked.includes(nameOf('model', store.model[i]));
    const ids = userIds.slice(0, 6);
    for (const measure of ['gross', 'rows'] as const) {
      const got = stackedSeries(store, mask, range, 'user', ids, measure, 'week', []);
      const want = oracleStack(store, range, (i) => store.user[i], ids, measure, 'week', keep);
      ids.forEach((_, k) => expect(maxDiff(got.series[k].data, want.series[k]), `${measure} #${k}`).toBeLessThan(1e-9));
      expect(maxDiff(got.other as Float64Array, want.other)).toBeLessThan(1e-9);
    }
    const unmasked = stackedSeries(store, null, range, 'user', userIds, 'rows', 'month', []);
    const masked = stackedSeries(store, mask, range, 'user', userIds, 'rows', 'month', []);
    const rowsOf = (s: typeof masked): number => s.series.reduce((a, x) => a + sum([...x.data]), 0) + (s.other ? sum([...s.other]) : 0);
    expect(rowsOf(masked)).toBeLessThan(rowsOf(unmasked));
    expect(rowsOf(masked)).toBe(Array.from({ length: store.n }, (_, i) => i).filter(keep).length);
  });

  it('can group by a custom function (weekday of the row)', () => {
    const ids = [0, 1, 2, 3, 4, 5, 6];
    const got = stackedSeries(store, null, range, 'user', ids, 'gross', 'week', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], (s, i) => dowOf(s.day[i]));
    const want = oracleStack(store, range, (i) => weekdayOf(isoOf(store.day[i])), ids, 'gross', 'week');
    ids.forEach((_, k) => expect(maxDiff(got.series[k].data, want.series[k]), `weekday ${k}`).toBeLessThan(1e-9));
    expect(got.other).toBeNull();
    expect(got.series.map((s) => s.name)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it.each(['model', 'org', 'product', 'sku'] as const)('stacks by the %s dimension without losing a row', (dim) => {
    const n = store.dicts[dim].values.length;
    const ids = Array.from({ length: n }, (_, k) => k);
    const got = stackedSeries(store, null, range, dim, ids, 'rows', 'month', ids.map((id) => nameOf(dim, id)));
    expect(got.other).toBeNull();
    const counts = new Array<number>(n).fill(0);
    for (let i = 0; i < store.n; i++) counts[(store[dim] as Int32Array)[i]]++;
    ids.forEach((id, k) => expect(sum([...got.series[k].data]), nameOf(dim, id)).toBe(counts[id]));
    expect(got.series.reduce((a, s) => a + sum([...s.data]), 0)).toBe(store.n);
  });
});

describe('userDailySeries', () => {
  let store: DataStore;
  let userIds: number[];
  let range: { start: number; end: number };

  beforeAll(async () => {
    ({ store } = await loadDemo());
    userIds = Array.from({ length: store.dicts.user.values.length - 1 }, (_, k) => k + 1);
    range = { start: store.minDay, end: store.maxDay };
  });

  function oracleDaily(r: { start: number; end: number }, keep: (i: number) => boolean = () => true): Map<number, number[]> {
    const out = new Map<number, number[]>(userIds.map((id) => [id, new Array<number>(Math.max(0, r.end - r.start + 1)).fill(0)]));
    for (let i = 0; i < store.n; i++) {
      const d = store.day[i];
      const arr = out.get(store.user[i]);
      if (arr && d >= r.start && d <= r.end && keep(i)) arr[d - r.start] += store.gross[i];
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
    const r = { start: range.start + 7, end: range.end - 7 };
    const weekdayOnly = (i: number): boolean => weekdayOf(isoOf(store.day[i])) < 5;
    const mask = new Uint8Array(store.n);
    for (let i = 0; i < store.n; i++) mask[i] = weekdayOnly(i) ? 1 : 0;
    const got = userDailySeries(store, mask, r, userIds);
    const want = oracleDaily(r, weekdayOnly);
    for (const id of userIds) expect(close(got.get(id) as Float32Array, want.get(id) as number[]), `user ${id}`).toBe(true);
    for (const id of userIds) {
      (got.get(id) as Float32Array).forEach((v, k) => {
        if (weekdayOf(isoOf(r.start + k)) >= 5) expect(v).toBe(0);
      });
    }
  });

  it('the users together add up to the gross spend of the named users in the range', () => {
    const got = userDailySeries(store, null, range, userIds);
    let want = 0;
    for (let i = 0; i < store.n; i++) if (store.user[i] !== 0) want += store.gross[i];
    let total = 0;
    for (const arr of got.values()) total += sum([...arr]);
    expect(total).toBeCloseTo(want, 1);
  });

  it('an inverted range gives empty arrays', () => {
    const got = userDailySeries(store, null, { start: range.end, end: range.start }, userIds.slice(0, 2));
    for (const arr of got.values()) expect(arr).toHaveLength(0);
  });
});
