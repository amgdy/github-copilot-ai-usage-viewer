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
  values.flatMap((gross, dayIndex) => (gross > 0 ? [{ date: addDays(START, dayIndex), user: 'u', gross, ...extra }] : []));

const run = (values: number[]): Promise<Pipeline> => analyzeCsv(makeCsv(series(values)));

type Opts = { minDays?: number; z?: number; multiple?: number; limit?: number };
const found = (pipeline: Pipeline, options: Opts = {}) => findAnomalyDays(pipeline.store, pipeline.analysis.mask, pipeline.analysis.agg, options);

const medianOf = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  return count % 2 ? sorted[(count - 1) / 2] : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
};

/** The documented rule, re-implemented: robust z (median / MAD, or the mean absolute deviation when MAD is 0) and a minimum multiple of the median. */
function oracle(daily: number[], { minDays = 10, z: minZScore = 3.5, multiple = 1.5, limit = 6 }: Opts = {}) {
  const spend = daily.filter((gross) => gross > 0);
  if (spend.length < minDays) return [];
  const medianSpend = medianOf(spend);
  const absoluteDeviations = spend.map((gross) => Math.abs(gross - medianSpend));
  const medianAbsoluteDeviation = medianOf(absoluteDeviations);
  const scale = medianAbsoluteDeviation > 0 ? medianAbsoluteDeviation / 0.6745 : (sum(absoluteDeviations) / spend.length) * 1.2533;
  if (!(scale > 0) || !(medianSpend > 0)) return [];
  return daily
    .map((gross, dayIndex) => ({ i: dayIndex, gross, z: (gross - medianSpend) / scale, multiple: gross / medianSpend, baseline: medianSpend }))
    .filter((day) => day.gross > 0 && day.z >= minZScore && day.gross >= multiple * medianSpend)
    .sort((a, b) => b.gross - a.gross)
    .slice(0, limit);
}

/** Daily gross over the whole date range of the rows (zero-filled). */
function dailyOf(rows: NaiveRow[]): { start: number; gross: number[] } {
  const days = rows.map((row) => dayNum(row.date));
  const start = Math.min(...days);
  const gross = new Array<number>(Math.max(...days) - start + 1).fill(0);
  for (const row of rows) gross[dayNum(row.date) - start] += numOf(row, 'gross_amount');
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
    const input = [9, 1, 5, 3];
    median(input);
    expect(input).toEqual([9, 1, 5, 3]);
  });

  it('agrees with an independent implementation on pseudo-random lists', () => {
    let seed = 12345;
    const next = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let size = 1; size <= 40; size++) {
      const values = Array.from({ length: size }, () => Math.round(next() * 1000) / 10);
      expect(median(values), String(size)).toBeCloseTo(medianOf(values), 12);
    }
  });
});

describe('quantile', () => {
  it('is 0 for an empty list and the only value for a single element', () => {
    expect(quantile([], 0.5)).toBe(0);
    for (const fraction of [0, 0.25, 0.5, 1]) expect(quantile([4], fraction)).toBe(4);
  });

  it('returns the extremes at 0 and 1 and the median at 0.5', () => {
    const values = [1, 2, 3, 4, 5];
    expect(quantile(values, 0)).toBe(1);
    expect(quantile(values, 1)).toBe(5);
    expect(quantile(values, 0.5)).toBe(3);
  });

  it('interpolates linearly between neighbours', () => {
    const values = [1, 2, 3, 4, 5];
    expect(quantile(values, 0.25)).toBe(2);
    expect(quantile(values, 0.1)).toBeCloseTo(1.4, 12);
    expect(quantile(values, 0.9)).toBeCloseTo(4.6, 12);
    expect(quantile([10, 20], 0.5)).toBe(15);
    expect(quantile([10, 20], 0.25)).toBe(12.5);
  });

  it('is monotonic in q and bounded by the data', () => {
    const values = [0.5, 1, 1, 2, 8, 13, 40];
    let prev = -Infinity;
    for (let fraction = 0; fraction <= 1.0001; fraction += 0.05) {
      const result = quantile(values, Math.min(1, fraction));
      expect(result).toBeGreaterThanOrEqual(prev);
      expect(result).toBeGreaterThanOrEqual(values[0]);
      expect(result).toBeLessThanOrEqual(values[values.length - 1]);
      prev = result;
    }
  });
});

describe('findAnomalyDays on synthetic days', () => {
  const FLAT_WITH_SPIKE = [...Array<number>(14).fill(10), 0, 0, 0, 0, 0, 105];

  it('flags one spike on a flat baseline with the documented statistics', async () => {
    const pipeline = await run(FLAT_WITH_SPIKE);
    const [anomaly, ...rest] = found(pipeline);
    expect(rest).toEqual([]);
    expect(anomaly.gross).toBeCloseTo(105, 9);
    expect(anomaly.baseline).toBe(10);
    expect(anomaly.multiple).toBeCloseTo(10.5, 9);
    expect(isoOf(anomaly.day)).toBe(addDays(START, 19));
    // MAD is 0 here, so the scale falls back to 1.2533 x the mean absolute deviation: 95 / 15 x 1.2533.
    expect(anomaly.z).toBeCloseTo(95 / ((95 / 15) * 1.2533), 9);
    expect(anomaly.z).toBeCloseTo(oracle(FLAT_WITH_SPIKE)[0].z, 9);
  });

  it('needs at least ten days with spend (days without spend do not count)', async () => {
    // 8 baseline days + 1 spike = 9 days with spend, spread over 20 calendar days.
    const nineSpendDays = [10, 10, 0, 10, 10, 0, 0, 10, 10, 0, 10, 10, 0, 0, 0, 0, 0, 0, 0, 105];
    expect(nineSpendDays.filter((gross) => gross > 0)).toHaveLength(9);
    expect(found(await run(nineSpendDays))).toEqual([]);
    const tenSpendDays = [...nineSpendDays.slice(0, 19), 10, 105];
    expect(tenSpendDays.filter((gross) => gross > 0)).toHaveLength(10);
    expect(found(await run(tenSpendDays)).map((anomaly) => anomaly.gross)).toEqual([105]);
    expect(found(await run([10, 10, 10, 10, 10, 10, 10, 10, 10, 105])).map((anomaly) => anomaly.gross)).toEqual([105]);
    expect(found(await run([10, 10, 10, 10, 10, 10, 10, 10, 105]))).toEqual([]);
  });

  it('lets minDays be changed', async () => {
    const pipeline = await run([10, 10, 10, 10, 10, 10, 10, 105]);
    expect(found(pipeline)).toEqual([]);
    expect(found(pipeline, { minDays: 5 }).map((anomaly) => anomaly.gross)).toEqual([105]);
    expect(found(await run(FLAT_WITH_SPIKE), { minDays: 16 })).toEqual([]);
  });

  it('finds nothing in a flat series or when the median is zero', async () => {
    expect(found(await run(Array<number>(15).fill(10)))).toEqual([]);
    expect(found(await run([...Array<number>(12).fill(0.000001), 0.5]), { z: 1e9 })).toEqual([]);
  });

  it('requires both the z-score and the multiple of the median', async () => {
    // Median 100 and a tiny spread: a day at 140 has a high z-score but is only 1.4x the median.
    const values = [100, 100, 100, 100, 100, 100, 101, 99, 101, 99, 140];
    const pipeline = await run(values);
    const spikeZ = oracle(values, { multiple: 1 })[0].z;
    expect(spikeZ).toBeGreaterThan(3.5);
    expect(found(pipeline)).toEqual([]);
    expect(found(pipeline, { multiple: 1.3 }).map((anomaly) => anomaly.gross)).toEqual([140]);
    expect(found(pipeline, { multiple: 1.3, z: spikeZ + 1 })).toEqual([]);
    expect(found(pipeline, { multiple: 1.3, z: spikeZ - 0.01 }).map((anomaly) => anomaly.gross)).toEqual([140]);

    // A noisy baseline: the day is 1.45x the median but not an outlier (z about 3.03).
    const noisy = [10, 11, 9, 10, 12, 8, 10, 11, 9, 10, 14.5];
    expect(oracle(noisy, { multiple: 1, z: 0 }).find((day) => day.gross === 14.5)!.z).toBeLessThan(3.5);
    expect(found(await run(noisy))).toEqual([]);
    expect(found(await run(noisy), { z: 3, multiple: 1.4 }).map((anomaly) => anomaly.gross)).toEqual([14.5]);
  });

  it('sorts by spend, applies the limit and keeps the order of the strongest days', async () => {
    const cycle = Array.from({ length: 42 }, (_, dayIndex) => [9, 10, 11][dayIndex % 3]);
    const values = [...cycle, ...[20, 21, 22, 23, 24, 25, 26, 27]];
    const pipeline = await run(values);
    const all = found(pipeline, { limit: 20 });
    expect(all).toHaveLength(8);
    expect(all.map((anomaly) => anomaly.gross)).toEqual([27, 26, 25, 24, 23, 22, 21, 20]);
    expect(found(pipeline)).toHaveLength(6);
    expect(found(pipeline).map((anomaly) => anomaly.gross)).toEqual([27, 26, 25, 24, 23, 22]);
    expect(found(pipeline, { limit: 3 }).map((anomaly) => anomaly.gross)).toEqual([27, 26, 25]);
    expect(found(pipeline, { limit: 0 })).toEqual([]);
    const expected = oracle(values, { limit: 20 });
    expect(all.map((anomaly) => anomaly.day)).toEqual(expected.map((day) => day.i + dayNum(START)));
    all.forEach((anomaly, index) => {
      expect(anomaly.z).toBeCloseTo(expected[index].z, 9);
      expect(anomaly.multiple).toBeCloseTo(expected[index].multiple, 9);
    });
  });

  it('every flagged day satisfies the documented thresholds and none is missed (random series against the oracle)', async () => {
    let seed = 99;
    const next = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let round = 0; round < 12; round++) {
      const dayCount = 12 + Math.floor(next() * 40);
      const values = Array.from({ length: dayCount }, () => (next() < 0.1 ? 0 : Math.round((5 + next() * 20) * 100) / 100));
      for (let k = 0; k < 3; k++) values[Math.floor(next() * dayCount)] *= 2 + next() * 8;
      const rounded = values.map((gross) => Math.round(gross * 100) / 100);
      if (!rounded[0] || !rounded[dayCount - 1]) continue;
      const pipeline = await run(rounded);
      const mine = found(pipeline, { limit: 50 });
      const theirs = oracle(rounded, { limit: 50 });
      expect(mine.map((anomaly) => anomaly.day - dayNum(START)), `round ${round}`).toEqual(theirs.map((day) => day.i));
      for (const anomaly of mine) {
        expect(anomaly.z).toBeGreaterThanOrEqual(3.5);
        expect(anomaly.multiple).toBeGreaterThanOrEqual(1.5);
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
      const pipeline = await analyzeCsv(makeCsv(rows()));
      const [anomaly] = found(pipeline);
      const users = pipeline.store.dicts.user.values;
      const models = pipeline.store.dicts.model.values;
      expect(anomaly.gross).toBeCloseTo(105, 9);
      expect(anomaly.topUsers.map((user) => users[user.id])).toEqual(['a', 'b', 'c']);
      expect(anomaly.topUsers.map((user) => user.gross)).toEqual([60, 30, 10]);
      expect(anomaly.topModels.map((model) => models[model.id])).toEqual(['GPT-5.6 Terra', 'GPT-6 Astra', 'Claude Haiku 5.5']);
      expect(anomaly.topModels.map((model) => model.gross)).toEqual([51, 49, 5]);
    });

    it('respects the row mask when ranking users and models, and judges the day on the masked totals', async () => {
      const pipeline = await analyzeCsv(makeCsv(rows()), { filters: { models: ['GPT-5.6 Terra'] } });
      const [anomaly, ...rest] = found(pipeline);
      expect(rest).toEqual([]);
      expect(anomaly.gross).toBeCloseTo(51, 9);
      const users = pipeline.store.dicts.user.values;
      const models = pipeline.store.dicts.model.values;
      expect(anomaly.topUsers.map((user) => users[user.id])).toEqual(['a', 'c']);
      expect(anomaly.topUsers.map((user) => user.gross)).toEqual([41, 10]);
      expect(anomaly.topModels.map((model) => models[model.id])).toEqual(['GPT-5.6 Terra']);
      expect(pipeline.analysis.anomalies).toEqual([anomaly]);
    });
  });
});

describe('findAnomalyDays on the fixtures', () => {
  it('the pool-used fixture has fewer than ten days with spend, so nothing is flagged', async () => {
    const rows = naiveRows(readFixture(FIXTURE_A));
    expect(new Set(rows.filter((row) => numOf(row, 'gross_amount') > 0).map((row) => row.date)).size).toBeLessThan(10);
    const pipeline = await analyzeFixtures([FIXTURE_A]);
    expect(found(pipeline)).toEqual([]);
    expect(pipeline.analysis.anomalies).toEqual([]);
  });

  describe('partial-export fixture', () => {
    const rows = naiveRows(readFixture(FIXTURE_B));
    const { start, gross } = dailyOf(rows);
    const want = oracle(gross, { limit: 50 });

    it('has enough days with spend and the spikes the independent calculation finds', async () => {
      const pipeline = await analyzeFixtures([FIXTURE_B]);
      expect(gross.filter((dayGross) => dayGross > 0).length).toBeGreaterThanOrEqual(10);
      const got = found(pipeline, { limit: 50 });
      expect(got.map((anomaly) => anomaly.day)).toEqual(want.map((day) => day.i + start));
      got.forEach((anomaly, index) => {
        expect(anomaly.gross).toBeCloseTo(want[index].gross, 6);
        expect(anomaly.baseline).toBeCloseTo(want[index].baseline, 9);
        expect(anomaly.z).toBeCloseTo(want[index].z, 6);
        expect(anomaly.multiple).toBeCloseTo(want[index].multiple, 6);
        expect(anomaly.z).toBeGreaterThanOrEqual(3.5);
        expect(anomaly.multiple).toBeGreaterThanOrEqual(1.5);
      });
    });

    it('finds the 16 October spike first and the 25 October long-context day among the spikes', async () => {
      const pipeline = await analyzeFixtures([FIXTURE_B]);
      const got = found(pipeline);
      expect(got.length).toBeGreaterThanOrEqual(2);
      expect(got.length).toBeLessThanOrEqual(6);
      expect(isoOf(got[0].day)).toBe('2026-10-16');
      expect(got[0].gross).toBeCloseTo(606.84, 1);
      expect(got[0].z).toBeGreaterThan(20);
      expect(got[0].multiple).toBeGreaterThan(20);
      expect(got.map((anomaly) => isoOf(anomaly.day))).toContain('2026-10-25');
      for (let i = 1; i < got.length; i++) expect(got[i].gross).toBeLessThanOrEqual(got[i - 1].gross);
      expect(pipeline.analysis.anomalies).toEqual(got);
    });

    it('names the user and the models behind the biggest day from the raw rows', async () => {
      const pipeline = await analyzeFixtures([FIXTURE_B]);
      const [top] = found(pipeline);
      const day = rows.filter((row) => dayNum(row.date) === top.day);
      const byUser = [...groupSum(day, (row) => row.username, (row) => numOf(row, 'gross_amount')).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const byModel = [...groupSum(day, (row) => modelOfRow(row), (row) => numOf(row, 'gross_amount')).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      expect(top.topUsers.map((user) => pipeline.store.dicts.user.values[user.id])).toEqual(byUser.map(([name]) => name));
      expect(top.topUsers.map((user) => user.gross)).toHaveLength(byUser.length);
      top.topUsers.forEach((user, index) => expect(user.gross).toBeCloseTo(byUser[index][1], 6));
      expect(top.topModels.map((model) => pipeline.store.dicts.model.values[model.id])).toEqual(byModel.map(([name]) => name));
      top.topModels.forEach((model, index) => expect(model.gross).toBeCloseTo(byModel[index][1], 6));
      expect(top.topUsers.length).toBeLessThanOrEqual(3);
      expect(top.topModels.length).toBeLessThanOrEqual(3);
    });

    it('judges a narrowed scope on its own daily totals', async () => {
      const pipeline = await analyzeFixtures([FIXTURE_B], { filters: { models: ['GPT-6 Astra'] } });
      const narrow = rows.filter((row) => modelOfRow(row) === 'GPT-6 Astra');
      const daily = dailyOf(narrow);
      expect(found(pipeline, { limit: 50 }).map((anomaly) => anomaly.day)).toEqual(oracle(daily.gross, { limit: 50 }).map((day) => day.i + daily.start));
    });
  });
});

describe('weekOverWeek', () => {
  it('compares the last seven days of the range with the seven before', async () => {
    const values = Array.from({ length: 20 }, (_, dayIndex) => dayIndex + 1);
    const trend = weekOverWeek((await run(values)).analysis.agg);
    expect(trend.recent).toBe(sum(values.slice(13)));
    expect(trend.prior).toBe(sum(values.slice(6, 13)));
    expect(trend.change).toBeCloseTo(119 / 70 - 1, 12);
    expect(trend.reliable).toBe(true);
  });

  it('becomes reliable with exactly 14 days and is not before', async () => {
    const fourteen = (await run(Array<number>(14).fill(2))).analysis.agg;
    expect(fourteen.range.length).toBe(14);
    expect(weekOverWeek(fourteen)).toEqual({ recent: 14, prior: 14, change: 0, reliable: true });
    const thirteen = (await run(Array<number>(13).fill(2))).analysis.agg;
    expect(thirteen.range.length).toBe(13);
    const trend = weekOverWeek(thirteen);
    expect(trend.reliable).toBe(false);
    expect(trend.recent).toBe(14);
    expect(trend.prior).toBe(12);
    expect(trend.change).toBeCloseTo(14 / 12 - 1, 12);
  });

  it('has no change and is unreliable when the earlier week has no spend', async () => {
    const values = [5, ...Array<number>(13).fill(0), ...Array<number>(7).fill(1)];
    const trend = weekOverWeek((await run(values)).analysis.agg);
    expect(trend.recent).toBe(7);
    expect(trend.prior).toBe(0);
    expect(Number.isNaN(trend.change)).toBe(true);
    expect(trend.reliable).toBe(false);
  });

  it('counts only the days that exist in a short range', async () => {
    const trend = weekOverWeek((await run([1, 2, 3])).analysis.agg);
    expect(trend).toMatchObject({ recent: 6, prior: 0, reliable: false });
    expect(Number.isNaN(trend.change)).toBe(true);
    const tenDayTrend = weekOverWeek((await run(Array<number>(10).fill(1))).analysis.agg);
    expect(tenDayTrend.recent).toBe(7);
    expect(tenDayTrend.prior).toBe(3);
    expect(tenDayTrend.reliable).toBe(false);
  });

  it('partial-export fixture: spend fell by 54% between the last two weeks (from the raw rows)', async () => {
    const { gross } = dailyOf(naiveRows(readFixture(FIXTURE_B)));
    const recent = sum(gross.slice(-7));
    const prior = sum(gross.slice(-14, -7));
    const trend = weekOverWeek((await analyzeFixtures([FIXTURE_B])).analysis.agg);
    expect(trend.recent).toBeCloseTo(recent, 6);
    expect(trend.prior).toBeCloseTo(prior, 6);
    expect(trend.change).toBeCloseTo(recent / prior - 1, 9);
    expect(trend.change).toBeCloseTo(-0.5393, 3);
    expect(trend.reliable).toBe(true);
  });

  it('follows the date range of the filters', async () => {
    const pipeline = await analyzeFixtures([FIXTURE_B]);
    const firstDay = pipeline.store.minDay;
    const narrowed = pipeline.run({ ...pipeline.filters, dateFrom: firstDay, dateTo: firstDay + 9 });
    expect(narrowed.agg.range.length).toBe(10);
    expect(narrowed.trend.reliable).toBe(false);
    expect(narrowed.trend).toEqual(weekOverWeek(narrowed.agg));
  });
});

describe('analyze() wires the same numbers', () => {
  it('returns the anomalies and the trend computed from its own aggregate and mask', async () => {
    const demo = await analyzeDemo();
    for (const pipeline of [demo, await analyzeFixtures([FIXTURE_B]), await analyzeFixtures([FIXTURE_A, FIXTURE_B])]) {
      expect(pipeline.analysis.anomalies).toEqual(findAnomalyDays(pipeline.store, pipeline.analysis.mask, pipeline.analysis.agg));
      expect(pipeline.analysis.trend).toEqual(weekOverWeek(pipeline.analysis.agg));
    }
  });

  it('only ever reports days inside the analysed range', async () => {
    const pipeline = await analyzeDemo();
    for (const anomaly of pipeline.analysis.anomalies) {
      expect(anomaly.day).toBeGreaterThanOrEqual(pipeline.analysis.agg.range.start);
      expect(anomaly.day).toBeLessThanOrEqual(pipeline.analysis.agg.range.end);
    }
  });
});
