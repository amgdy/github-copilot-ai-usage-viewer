import { describe, expect, it } from 'vitest';
import { findAnomalyDays, median, quantile, weekOverWeek } from '../src/lib/analytics/anomalies';
import {
  addDays,
  analyzeCsv,
  analyzeDemo,
  dayNum,
  groupSum,
  isoOf,
  makeCsv,
  modelOfRow,
  naiveRows,
  numOf,
  sum,
  type NaiveRow,
  type Pipeline,
  type RowSpec,
} from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures, readFixture } from './fixtures';

const START = '2026-09-01';

/** One row per day with spend (zero days have no row, so they are zero-filled by the aggregate). */
const series = (values: number[], extra: Partial<RowSpec> = {}): RowSpec[] =>
  values.flatMap((gross, i) => (gross > 0 ? [{ date: addDays(START, i), user: 'u', gross, ...extra }] : []));

const run = (values: number[]): Promise<Pipeline> => analyzeCsv(makeCsv(series(values)));

type Opts = { minDays?: number; z?: number; multiple?: number; limit?: number };
const found = (p: Pipeline, opts: Opts = {}) => findAnomalyDays(p.store, p.analysis.mask, p.analysis.agg, opts);

const medianOf = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

/** The documented rule, re-implemented: robust z (median / MAD, or the mean absolute deviation when MAD is 0) and a minimum multiple of the median. */
function oracle(daily: number[], { minDays = 10, z = 3.5, multiple = 1.5, limit = 6 }: Opts = {}) {
  const spend = daily.filter((x) => x > 0);
  if (spend.length < minDays) return [];
  const med = medianOf(spend);
  const dev = spend.map((x) => Math.abs(x - med));
  const mad = medianOf(dev);
  const scale = mad > 0 ? mad / 0.6745 : (sum(dev) / spend.length) * 1.2533;
  if (!(scale > 0) || !(med > 0)) return [];
  return daily
    .map((gross, i) => ({ i, gross, z: (gross - med) / scale, multiple: gross / med, baseline: med }))
    .filter((d) => d.gross > 0 && d.z >= z && d.gross >= multiple * med)
    .sort((a, b) => b.gross - a.gross)
    .slice(0, limit);
}

/** Daily gross over the whole date range of the rows (zero-filled). */
function dailyOf(rows: NaiveRow[]): { start: number; gross: number[] } {
  const days = rows.map((r) => dayNum(r.date));
  const start = Math.min(...days);
  const gross = new Array<number>(Math.max(...days) - start + 1).fill(0);
  for (const r of rows) gross[dayNum(r.date) - start] += numOf(r, 'gross_amount');
  return { start, gross };
}

describe('median', () => {
  it('is 0 for an empty list and the value itself for one element', () => {
    expect(median([])).toBe(0);
    expect(median([7])).toBe(7);
  });

  it('takes the middle value, or the mean of the two middle values', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([5, 5, 5, 5])).toBe(5);
    expect(median([-3, -1, -2])).toBe(-2);
    expect(median([1, 1, 1, 100])).toBe(1);
  });

  it('does not reorder or change its input', () => {
    const xs = [9, 1, 5, 3];
    median(xs);
    expect(xs).toEqual([9, 1, 5, 3]);
  });

  it('agrees with an independent implementation on pseudo-random lists', () => {
    let seed = 12345;
    const next = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let n = 1; n <= 40; n++) {
      const xs = Array.from({ length: n }, () => Math.round(next() * 1000) / 10);
      expect(median(xs), String(n)).toBeCloseTo(medianOf(xs), 12);
    }
  });
});

describe('quantile', () => {
  it('is 0 for an empty list and the only value for a single element', () => {
    expect(quantile([], 0.5)).toBe(0);
    for (const q of [0, 0.25, 0.5, 1]) expect(quantile([4], q)).toBe(4);
  });

  it('returns the extremes at 0 and 1 and the median at 0.5', () => {
    const s = [1, 2, 3, 4, 5];
    expect(quantile(s, 0)).toBe(1);
    expect(quantile(s, 1)).toBe(5);
    expect(quantile(s, 0.5)).toBe(3);
  });

  it('interpolates linearly between neighbours', () => {
    const s = [1, 2, 3, 4, 5];
    expect(quantile(s, 0.25)).toBe(2);
    expect(quantile(s, 0.1)).toBeCloseTo(1.4, 12);
    expect(quantile(s, 0.9)).toBeCloseTo(4.6, 12);
    expect(quantile([10, 20], 0.5)).toBe(15);
    expect(quantile([10, 20], 0.25)).toBe(12.5);
  });

  it('is monotonic in q and bounded by the data', () => {
    const s = [0.5, 1, 1, 2, 8, 13, 40];
    let prev = -Infinity;
    for (let q = 0; q <= 1.0001; q += 0.05) {
      const v = quantile(s, Math.min(1, q));
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(s[0]);
      expect(v).toBeLessThanOrEqual(s[s.length - 1]);
      prev = v;
    }
  });
});

describe('findAnomalyDays on synthetic days', () => {
  const FLAT_WITH_SPIKE = [...Array<number>(14).fill(10), 0, 0, 0, 0, 0, 105];

  it('flags one spike on a flat baseline with the documented statistics', async () => {
    const p = await run(FLAT_WITH_SPIKE);
    const [a, ...rest] = found(p);
    expect(rest).toEqual([]);
    expect(a.gross).toBeCloseTo(105, 9);
    expect(a.baseline).toBe(10);
    expect(a.multiple).toBeCloseTo(10.5, 9);
    expect(isoOf(a.day)).toBe(addDays(START, 19));
    // MAD is 0 here, so the scale falls back to 1.2533 x the mean absolute deviation: 95 / 15 x 1.2533.
    expect(a.z).toBeCloseTo(95 / ((95 / 15) * 1.2533), 9);
    expect(a.z).toBeCloseTo(oracle(FLAT_WITH_SPIKE)[0].z, 9);
  });

  it('needs at least ten days with spend (days without spend do not count)', async () => {
    // 8 baseline days + 1 spike = 9 days with spend, spread over 20 calendar days.
    const nine = [10, 10, 0, 10, 10, 0, 0, 10, 10, 0, 10, 10, 0, 0, 0, 0, 0, 0, 0, 105];
    expect(nine.filter((x) => x > 0)).toHaveLength(9);
    expect(found(await run(nine))).toEqual([]);
    const ten = [...nine.slice(0, 19), 10, 105];
    expect(ten.filter((x) => x > 0)).toHaveLength(10);
    expect(found(await run(ten)).map((a) => a.gross)).toEqual([105]);
    expect(found(await run([10, 10, 10, 10, 10, 10, 10, 10, 10, 105])).map((a) => a.gross)).toEqual([105]);
    expect(found(await run([10, 10, 10, 10, 10, 10, 10, 10, 105]))).toEqual([]);
  });

  it('lets minDays be changed', async () => {
    const p = await run([10, 10, 10, 10, 10, 10, 10, 105]);
    expect(found(p)).toEqual([]);
    expect(found(p, { minDays: 5 }).map((a) => a.gross)).toEqual([105]);
    expect(found(await run(FLAT_WITH_SPIKE), { minDays: 16 })).toEqual([]);
  });

  it('finds nothing in a flat series or when the median is zero', async () => {
    expect(found(await run(Array<number>(15).fill(10)))).toEqual([]);
    expect(found(await run([...Array<number>(12).fill(0.000001), 0.5]), { z: 1e9 })).toEqual([]);
  });

  it('requires both the z-score and the multiple of the median', async () => {
    // Median 100 and a tiny spread: a day at 140 has a high z-score but is only 1.4x the median.
    const values = [100, 100, 100, 100, 100, 100, 101, 99, 101, 99, 140];
    const p = await run(values);
    const z = oracle(values, { multiple: 1 })[0].z;
    expect(z).toBeGreaterThan(3.5);
    expect(found(p)).toEqual([]);
    expect(found(p, { multiple: 1.3 }).map((a) => a.gross)).toEqual([140]);
    expect(found(p, { multiple: 1.3, z: z + 1 })).toEqual([]);
    expect(found(p, { multiple: 1.3, z: z - 0.01 }).map((a) => a.gross)).toEqual([140]);

    // A noisy baseline: the day is 1.45x the median but not an outlier (z about 3.03).
    const noisy = [10, 11, 9, 10, 12, 8, 10, 11, 9, 10, 14.5];
    expect(oracle(noisy, { multiple: 1, z: 0 }).find((d) => d.gross === 14.5)!.z).toBeLessThan(3.5);
    expect(found(await run(noisy))).toEqual([]);
    expect(found(await run(noisy), { z: 3, multiple: 1.4 }).map((a) => a.gross)).toEqual([14.5]);
  });

  it('sorts by spend, applies the limit and keeps the order of the strongest days', async () => {
    const cycle = Array.from({ length: 42 }, (_, i) => [9, 10, 11][i % 3]);
    const values = [...cycle, ...[20, 21, 22, 23, 24, 25, 26, 27]];
    const p = await run(values);
    const all = found(p, { limit: 20 });
    expect(all).toHaveLength(8);
    expect(all.map((a) => a.gross)).toEqual([27, 26, 25, 24, 23, 22, 21, 20]);
    expect(found(p)).toHaveLength(6);
    expect(found(p).map((a) => a.gross)).toEqual([27, 26, 25, 24, 23, 22]);
    expect(found(p, { limit: 3 }).map((a) => a.gross)).toEqual([27, 26, 25]);
    expect(found(p, { limit: 0 })).toEqual([]);
    const expected = oracle(values, { limit: 20 });
    expect(all.map((a) => a.day)).toEqual(expected.map((d) => d.i + dayNum(START)));
    all.forEach((a, i) => {
      expect(a.z).toBeCloseTo(expected[i].z, 9);
      expect(a.multiple).toBeCloseTo(expected[i].multiple, 9);
    });
  });

  it('every flagged day satisfies the documented thresholds and none is missed (random series against the oracle)', async () => {
    let seed = 99;
    const next = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let round = 0; round < 12; round++) {
      const n = 12 + Math.floor(next() * 40);
      const values = Array.from({ length: n }, () => (next() < 0.1 ? 0 : Math.round((5 + next() * 20) * 100) / 100));
      for (let k = 0; k < 3; k++) values[Math.floor(next() * n)] *= 2 + next() * 8;
      const rounded = values.map((v) => Math.round(v * 100) / 100);
      if (!rounded[0] || !rounded[n - 1]) continue;
      const p = await run(rounded);
      const mine = found(p, { limit: 50 });
      const theirs = oracle(rounded, { limit: 50 });
      expect(mine.map((a) => a.day - dayNum(START)), `round ${round}`).toEqual(theirs.map((d) => d.i));
      for (const a of mine) {
        expect(a.z).toBeGreaterThanOrEqual(3.5);
        expect(a.multiple).toBeGreaterThanOrEqual(1.5);
      }
    }
  });

  describe('which users and models caused the spike', () => {
    const rows = (): RowSpec[] => [
      ...series(Array<number>(14).fill(10), { model: 'GPT-5.6 Terra' }),
      { date: addDays(START, 19), user: 'a', gross: 41, model: 'GPT-5.6 Terra' },
      { date: addDays(START, 19), user: 'a', gross: 19, model: 'GPT-6 Astra' },
      { date: addDays(START, 19), user: 'b', gross: 30, model: 'GPT-6 Astra' },
      { date: addDays(START, 19), user: 'c', gross: 10, model: 'GPT-5.6 Terra' },
      { date: addDays(START, 19), user: 'd', gross: 5, model: 'Claude Haiku 5.5' },
    ];

    it('lists at most three users and three models, largest first, using only that day', async () => {
      const p = await analyzeCsv(makeCsv(rows()));
      const [a] = found(p);
      const users = p.store.dicts.user.values;
      const models = p.store.dicts.model.values;
      expect(a.gross).toBeCloseTo(105, 9);
      expect(a.topUsers.map((u) => users[u.id])).toEqual(['a', 'b', 'c']);
      expect(a.topUsers.map((u) => u.gross)).toEqual([60, 30, 10]);
      expect(a.topModels.map((m) => models[m.id])).toEqual(['GPT-5.6 Terra', 'GPT-6 Astra', 'Claude Haiku 5.5']);
      expect(a.topModels.map((m) => m.gross)).toEqual([51, 49, 5]);
    });

    it('respects the row mask when ranking users and models, and judges the day on the masked totals', async () => {
      const p = await analyzeCsv(makeCsv(rows()), { filters: { models: ['GPT-5.6 Terra'] } });
      const [a, ...rest] = found(p);
      expect(rest).toEqual([]);
      expect(a.gross).toBeCloseTo(51, 9);
      const users = p.store.dicts.user.values;
      const models = p.store.dicts.model.values;
      expect(a.topUsers.map((u) => users[u.id])).toEqual(['a', 'c']);
      expect(a.topUsers.map((u) => u.gross)).toEqual([41, 10]);
      expect(a.topModels.map((m) => models[m.id])).toEqual(['GPT-5.6 Terra']);
      expect(p.analysis.anomalies).toEqual([a]);
    });
  });
});

describe('findAnomalyDays on the fixtures', () => {
  it('the pool-used fixture has fewer than ten days with spend, so nothing is flagged', async () => {
    const rows = naiveRows(readFixture(FIXTURE_A));
    expect(new Set(rows.filter((r) => numOf(r, 'gross_amount') > 0).map((r) => r.date)).size).toBeLessThan(10);
    const p = await analyzeFixtures([FIXTURE_A]);
    expect(found(p)).toEqual([]);
    expect(p.analysis.anomalies).toEqual([]);
  });

  describe('partial-export fixture', () => {
    const rows = naiveRows(readFixture(FIXTURE_B));
    const { start, gross } = dailyOf(rows);
    const want = oracle(gross, { limit: 50 });

    it('has enough days with spend and the spikes the independent calculation finds', async () => {
      const p = await analyzeFixtures([FIXTURE_B]);
      expect(gross.filter((x) => x > 0).length).toBeGreaterThanOrEqual(10);
      const got = found(p, { limit: 50 });
      expect(got.map((a) => a.day)).toEqual(want.map((d) => d.i + start));
      got.forEach((a, i) => {
        expect(a.gross).toBeCloseTo(want[i].gross, 6);
        expect(a.baseline).toBeCloseTo(want[i].baseline, 9);
        expect(a.z).toBeCloseTo(want[i].z, 6);
        expect(a.multiple).toBeCloseTo(want[i].multiple, 6);
        expect(a.z).toBeGreaterThanOrEqual(3.5);
        expect(a.multiple).toBeGreaterThanOrEqual(1.5);
      });
    });

    it('finds the 16 October spike first and the 25 October long-context day among the spikes', async () => {
      const p = await analyzeFixtures([FIXTURE_B]);
      const got = found(p);
      expect(got.length).toBeGreaterThanOrEqual(2);
      expect(got.length).toBeLessThanOrEqual(6);
      expect(isoOf(got[0].day)).toBe('2026-10-16');
      expect(got[0].gross).toBeCloseTo(606.84, 1);
      expect(got[0].z).toBeGreaterThan(20);
      expect(got[0].multiple).toBeGreaterThan(20);
      expect(got.map((a) => isoOf(a.day))).toContain('2026-10-25');
      for (let i = 1; i < got.length; i++) expect(got[i].gross).toBeLessThanOrEqual(got[i - 1].gross);
      expect(p.analysis.anomalies).toEqual(got);
    });

    it('names the user and the models behind the biggest day from the raw rows', async () => {
      const p = await analyzeFixtures([FIXTURE_B]);
      const [top] = found(p);
      const day = rows.filter((r) => dayNum(r.date) === top.day);
      const byUser = [...groupSum(day, (r) => r.username, (r) => numOf(r, 'gross_amount')).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const byModel = [...groupSum(day, (r) => modelOfRow(r), (r) => numOf(r, 'gross_amount')).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      expect(top.topUsers.map((u) => p.store.dicts.user.values[u.id])).toEqual(byUser.map(([name]) => name));
      expect(top.topUsers.map((u) => u.gross)).toHaveLength(byUser.length);
      top.topUsers.forEach((u, i) => expect(u.gross).toBeCloseTo(byUser[i][1], 6));
      expect(top.topModels.map((m) => p.store.dicts.model.values[m.id])).toEqual(byModel.map(([name]) => name));
      top.topModels.forEach((m, i) => expect(m.gross).toBeCloseTo(byModel[i][1], 6));
      expect(top.topUsers.length).toBeLessThanOrEqual(3);
      expect(top.topModels.length).toBeLessThanOrEqual(3);
    });

    it('judges a narrowed scope on its own daily totals', async () => {
      const p = await analyzeFixtures([FIXTURE_B], { filters: { models: ['GPT-6 Astra'] } });
      const narrow = rows.filter((r) => modelOfRow(r) === 'GPT-6 Astra');
      const d = dailyOf(narrow);
      expect(found(p, { limit: 50 }).map((a) => a.day)).toEqual(oracle(d.gross, { limit: 50 }).map((x) => x.i + d.start));
    });
  });
});

describe('weekOverWeek', () => {
  it('compares the last seven days of the range with the seven before', async () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    const t = weekOverWeek((await run(values)).analysis.agg);
    expect(t.recent).toBe(sum(values.slice(13)));
    expect(t.prior).toBe(sum(values.slice(6, 13)));
    expect(t.change).toBeCloseTo(119 / 70 - 1, 12);
    expect(t.reliable).toBe(true);
  });

  it('becomes reliable with exactly 14 days and is not before', async () => {
    const fourteen = (await run(Array<number>(14).fill(2))).analysis.agg;
    expect(fourteen.range.length).toBe(14);
    expect(weekOverWeek(fourteen)).toEqual({ recent: 14, prior: 14, change: 0, reliable: true });
    const thirteen = (await run(Array<number>(13).fill(2))).analysis.agg;
    expect(thirteen.range.length).toBe(13);
    const t = weekOverWeek(thirteen);
    expect(t.reliable).toBe(false);
    expect(t.recent).toBe(14);
    expect(t.prior).toBe(12);
    expect(t.change).toBeCloseTo(14 / 12 - 1, 12);
  });

  it('has no change and is unreliable when the earlier week has no spend', async () => {
    const values = [5, ...Array<number>(13).fill(0), ...Array<number>(7).fill(1)];
    const t = weekOverWeek((await run(values)).analysis.agg);
    expect(t.recent).toBe(7);
    expect(t.prior).toBe(0);
    expect(Number.isNaN(t.change)).toBe(true);
    expect(t.reliable).toBe(false);
  });

  it('counts only the days that exist in a short range', async () => {
    const t = weekOverWeek((await run([1, 2, 3])).analysis.agg);
    expect(t).toMatchObject({ recent: 6, prior: 0, reliable: false });
    expect(Number.isNaN(t.change)).toBe(true);
    const ten = weekOverWeek((await run(Array<number>(10).fill(1))).analysis.agg);
    expect(ten.recent).toBe(7);
    expect(ten.prior).toBe(3);
    expect(ten.reliable).toBe(false);
  });

  it('partial-export fixture: spend fell by 54% between the last two weeks (from the raw rows)', async () => {
    const { gross } = dailyOf(naiveRows(readFixture(FIXTURE_B)));
    const recent = sum(gross.slice(-7));
    const prior = sum(gross.slice(-14, -7));
    const t = weekOverWeek((await analyzeFixtures([FIXTURE_B])).analysis.agg);
    expect(t.recent).toBeCloseTo(recent, 6);
    expect(t.prior).toBeCloseTo(prior, 6);
    expect(t.change).toBeCloseTo(recent / prior - 1, 9);
    expect(t.change).toBeCloseTo(-0.5393, 3);
    expect(t.reliable).toBe(true);
  });

  it('follows the date range of the filters', async () => {
    const p = await analyzeFixtures([FIXTURE_B]);
    const lo = p.store.minDay;
    const narrowed = p.run({ ...p.filters, dateFrom: lo, dateTo: lo + 9 });
    expect(narrowed.agg.range.length).toBe(10);
    expect(narrowed.trend.reliable).toBe(false);
    expect(narrowed.trend).toEqual(weekOverWeek(narrowed.agg));
  });
});

describe('analyze() wires the same numbers', () => {
  it('returns the anomalies and the trend computed from its own aggregate and mask', async () => {
    const demo = await analyzeDemo();
    for (const p of [demo, await analyzeFixtures([FIXTURE_B]), await analyzeFixtures([FIXTURE_A, FIXTURE_B])]) {
      expect(p.analysis.anomalies).toEqual(findAnomalyDays(p.store, p.analysis.mask, p.analysis.agg));
      expect(p.analysis.trend).toEqual(weekOverWeek(p.analysis.agg));
    }
  });

  it('only ever reports days inside the analysed range', async () => {
    const p = await analyzeDemo();
    for (const a of p.analysis.anomalies) {
      expect(a.day).toBeGreaterThanOrEqual(p.analysis.agg.range.start);
      expect(a.day).toBeLessThanOrEqual(p.analysis.agg.range.end);
    }
  });
});
