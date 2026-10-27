import { beforeAll, describe, expect, it } from 'vitest';
import { aggregate, emptyTotals, quickTotals, rollupByCategory, rollupByVendor, type Aggregates } from '../src/lib/analytics/aggregate';
import { buildMask, emptyFilters } from '../src/lib/analytics/filters';
import { PRICE_CARD, VENDORS } from '../src/lib/pricing/card';
import { CATEGORIES, type DimKey } from '../src/lib/types';
import {
  dayNum,
  groupSum,
  isAutoRow,
  modelOfRow,
  naiveRows,
  naiveTotals,
  numOf,
  sum,
  weekdayOf,
  type NaiveRow,
  type Pipeline,
} from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures, fixtureSource, readFixture } from './fixtures';
import { buildStore } from '../src/lib/csv/ingest';

const MEASURE_KEYS = ['rows', 'gross', 'discount', 'net', 'credits', 'input', 'output', 'cacheRead', 'cacheWrite'] as const;
const MEASURES = ['user', 'product', 'sku', 'model', 'org', 'app', 'repo', 'costCenter', 'file', 'selection', 'plan', 'dow', 'days'] as const;
const TOTAL_OF = { rows: 'rows', gross: 'gross', discount: 'discount', net: 'net', credits: 'credits', input: 'input', output: 'output', cacheRead: 'cacheRead', cacheWrite: 'cacheWrite' } as const;

const arrSum = (values: ArrayLike<number>): number => {
  let total = 0;
  for (let i = 0; i < values.length; i++) total += values[i];
  return total;
};

const planOfQuota = (quota: number): string => (quota <= 0 ? 'No quota' : quota === 1900 ? 'Business' : quota === 3900 ? 'Enterprise' : `Custom (${quota.toLocaleString('en-US')} credits)`);

const inRange = (row: NaiveRow, start: number, end: number): boolean => {
  const day = dayNum(row.date);
  return day >= start && day <= end;
};

const cases = [
  { label: 'pool-used fixture', names: [FIXTURE_A] },
  { label: 'partial-export fixture', names: [FIXTURE_B] },
  { label: 'both fixtures', names: [FIXTURE_A, FIXTURE_B] },
];

describe.each(cases)('aggregate vs naive recomputation: $label', ({ names }) => {
  let pipeline: Pipeline;
  let rows: NaiveRow[];
  let aggregates: Aggregates;

  beforeAll(async () => {
    pipeline = await analyzeFixtures(names);
    rows = names.flatMap((fixtureName) => naiveRows(readFixture(fixtureName)));
    aggregates = pipeline.analysis.agg;
  });

  it('totals equal an independent sum over the raw CSV rows', () => {
    const totals = aggregates.totals;
    const expected = naiveTotals(rows);
    expect(aggregates.rowsIncluded).toBe(expected.rows);
    expect(totals.rows).toBe(expected.rows);
    expect(totals.gross).toBeCloseTo(expected.gross, 6);
    expect(totals.discount).toBeCloseTo(expected.discount, 6);
    expect(totals.net).toBeCloseTo(expected.net, 6);
    expect(totals.credits).toBeCloseTo(expected.credits, 4);
    expect(totals.users).toBe(expected.users);
    expect(totals.input).toBe(sum(rows.map((row) => numOf(row, 'input'))));
    expect(totals.output).toBe(sum(rows.map((row) => numOf(row, 'output'))));
    expect(totals.cacheRead).toBe(sum(rows.map((row) => numOf(row, 'cache_read'))));
    expect(totals.cacheWrite).toBe(sum(rows.map((row) => numOf(row, 'cache_write'))));
  });

  it('gross = discount + net overall, and credits = gross / 0.01', () => {
    const totals = aggregates.totals;
    expect(totals.gross).toBeCloseTo(totals.discount + totals.net, 6);
    expect(totals.credits * 0.01).toBeCloseTo(totals.gross, 4);
    expect(totals.attributedGross + totals.unattributedGross).toBeCloseTo(totals.gross, 6);
    expect(totals.pricedGross + totals.unpricedGross).toBeCloseTo(totals.gross, 6);
    expect(totals.longPremium).toBeLessThanOrEqual(totals.gross);
    expect(totals.autoGross).toBeLessThanOrEqual(totals.gross + 1e-9);
  });

  it('every per-dimension measure (and the day series) sums to the totals', () => {
    for (const dimension of MEASURES) {
      for (const measure of MEASURE_KEYS) {
        const total = aggregates.totals[TOTAL_OF[measure]];
        const got = arrSum(aggregates[dimension][measure]);
        expect(got, `${dimension}.${measure}`).toBeCloseTo(total, measure === 'rows' ? 0 : 5);
      }
    }
  });

  it('gross = discount + net holds in every bucket of every measure', () => {
    for (const dimension of MEASURES) {
      const measures = aggregates[dimension];
      for (let i = 0; i < measures.gross.length; i++) {
        expect(Math.abs(measures.gross[i] - measures.discount[i] - measures.net[i]), `${dimension}[${i}]`).toBeLessThan(1e-6);
      }
    }
  });

  it.each([
    ['user', (row: NaiveRow) => row.username],
    ['product', (row: NaiveRow) => row.product],
    ['sku', (row: NaiveRow) => row.sku],
    ['model', (row: NaiveRow) => modelOfRow(row)],
    ['org', (row: NaiveRow) => row.organization],
    ['costCenter', (row: NaiveRow) => row.cost_center_name],
    ['repo', (row: NaiveRow) => row.repository],
    ['app', (row: NaiveRow) => row.app_client_id],
  ] as [DimKey, (row: NaiveRow) => string][])('per-%s measures match naive group sums', (dimension, key) => {
    const measures = aggregates[dimension];
    const values = pipeline.store.dicts[dimension].values;
    const grossBy = groupSum(rows, key, (row) => numOf(row, 'gross_amount'));
    const netBy = groupSum(rows, key, (row) => numOf(row, 'net_amount'));
    const discBy = groupSum(rows, key, (row) => numOf(row, 'discount_amount'));
    const countBy = groupSum(rows, key, () => 1);
    for (const groupKey of grossBy.keys()) expect(values, `dictionary lacks "${groupKey}"`).toContain(groupKey);
    values.forEach((groupKey, index) => {
      expect(measures.rows[index], `${dimension}:${groupKey} rows`).toBe(countBy.get(groupKey) ?? 0);
      expect(measures.gross[index], `${dimension}:${groupKey} gross`).toBeCloseTo(grossBy.get(groupKey) ?? 0, 6);
      expect(measures.net[index], `${dimension}:${groupKey} net`).toBeCloseTo(netBy.get(groupKey) ?? 0, 6);
      expect(measures.discount[index], `${dimension}:${groupKey} discount`).toBeCloseTo(discBy.get(groupKey) ?? 0, 6);
    });
  });

  it('the day series matches naive per-day sums and distinct-user counts', () => {
    const { start, end, length } = aggregates.range;
    expect(start).toBe(Math.min(...rows.map((row) => dayNum(row.date))));
    expect(end).toBe(Math.max(...rows.map((row) => dayNum(row.date))));
    expect(length).toBe(end - start + 1);
    expect(aggregates.days.gross.length).toBe(length);
    const byDay = new Map<number, NaiveRow[]>();
    for (const row of rows) byDay.set(dayNum(row.date), [...(byDay.get(dayNum(row.date)) ?? []), row]);
    for (let day = start; day <= end; day++) {
      const dayRows = byDay.get(day) ?? [];
      const dayIndex = day - start;
      expect(aggregates.days.rows[dayIndex]).toBe(dayRows.length);
      expect(aggregates.days.gross[dayIndex]).toBeCloseTo(sum(dayRows.map((row) => numOf(row, 'gross_amount'))), 6);
      expect(aggregates.days.net[dayIndex]).toBeCloseTo(sum(dayRows.map((row) => numOf(row, 'net_amount'))), 6);
      const perUser = groupSum(
        dayRows.filter((row) => row.username),
        (row) => row.username,
        (row) => numOf(row, 'gross_amount'),
      );
      expect(aggregates.days.anyUsers[dayIndex]).toBe(perUser.size);
      expect(aggregates.days.activeUsers[dayIndex]).toBe([...perUser.values()].filter((gross) => gross >= pipeline.settings.activeThreshold).length);
    }
  });

  it('selection, plan, weekday and file measures match naive groupings', () => {
    const auto = rows.filter(isAutoRow);
    expect(aggregates.selection.rows[1]).toBe(auto.length);
    expect(aggregates.selection.rows[0]).toBe(rows.length - auto.length);
    expect(aggregates.selection.gross[1]).toBeCloseTo(sum(auto.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(aggregates.totals.autoGross).toBeCloseTo(sum(auto.map((row) => numOf(row, 'gross_amount'))), 6);

    const planGross = groupSum(rows, (row) => planOfQuota(numOf(row, 'total_monthly_quota')), (row) => numOf(row, 'gross_amount'));
    pipeline.prep.planLabels.forEach((label, index) => expect(aggregates.plan.gross[index], label).toBeCloseTo(planGross.get(label) ?? 0, 6));
    expect(new Set(pipeline.prep.planLabels)).toEqual(new Set(planGross.keys()));

    const dowGross = groupSum(rows, (row) => String(weekdayOf(row.date)), (row) => numOf(row, 'gross_amount'));
    for (let weekday = 0; weekday < 7; weekday++) expect(aggregates.dow.gross[weekday], `dow ${weekday}`).toBeCloseTo(dowGross.get(String(weekday)) ?? 0, 6);

    names.forEach((name, index) => {
      const fileId = pipeline.store.dicts.file.index.get(name);
      expect(fileId, name).toBeDefined();
      expect(aggregates.file.rows[fileId!]).toBe(naiveRows(readFixture(names[index])).length);
    });
  });

  it('per-user accumulators (first/last day, quota, active days, peak, 7-day windows, tokens) match naive values', () => {
    const { start, end } = aggregates.range;
    const userAccumulators = aggregates.userAcc;
    const activeThreshold = pipeline.settings.activeThreshold;
    const named = rows.filter((row) => row.username);
    const users = new Set(named.map((row) => row.username));
    for (const name of users) {
      const id = pipeline.store.dicts.user.index.get(name)!;
      const mine = named.filter((row) => row.username === name);
      const days = groupSum(mine, (row) => String(dayNum(row.date)), (row) => numOf(row, 'gross_amount'));
      const dayList = [...days.keys()].map(Number);
      expect(userAccumulators.firstDay[id], `${name} firstDay`).toBe(Math.min(...dayList));
      expect(userAccumulators.lastDay[id], `${name} lastDay`).toBe(Math.max(...dayList));
      expect(userAccumulators.quotaMax[id], `${name} quota`).toBe(Math.max(...mine.map((row) => numOf(row, 'total_monthly_quota'))));
      expect(userAccumulators.activeDays[id], `${name} activeDays`).toBe([...days.values()].filter((gross) => gross >= activeThreshold).length);
      expect(userAccumulators.peakDay[id], `${name} peakDay`).toBeCloseTo(Math.max(...days.values()), 6);
      expect(userAccumulators.recent[id], `${name} recent`).toBeCloseTo(
        sum(mine.filter((row) => dayNum(row.date) >= end - 6).map((row) => numOf(row, 'gross_amount'))),
        6,
      );
      expect(userAccumulators.prior[id], `${name} prior`).toBeCloseTo(
        sum(mine.filter((row) => dayNum(row.date) >= end - 13 && dayNum(row.date) < end - 6).map((row) => numOf(row, 'gross_amount'))),
        6,
      );
      expect(userAccumulators.autoGross[id], `${name} autoGross`).toBeCloseTo(sum(mine.filter(isAutoRow).map((row) => numOf(row, 'gross_amount'))), 6);
      expect(userAccumulators.cacheRead[id]).toBe(sum(mine.map((row) => numOf(row, 'cache_read'))));
      expect(userAccumulators.input[id]).toBe(sum(mine.map((row) => numOf(row, 'input'))));
      expect(start).toBeLessThanOrEqual(userAccumulators.firstDay[id]);
    }
  });

  it('per-user month grids hold the gross and the largest quota seen in each month', () => {
    const named = rows.filter((row) => row.username);
    const monthOf = (row: NaiveRow): number => {
      const [year, month] = row.date.split('-').map(Number);
      return year * 12 + (month - 1) - pipeline.prep.firstMonth;
    };
    expect(aggregates.nMonths).toBe(pipeline.prep.nMonths);
    for (const name of new Set(named.map((row) => row.username))) {
      const id = pipeline.store.dicts.user.index.get(name)!;
      for (let slot = 0; slot < aggregates.nMonths; slot++) {
        const mine = named.filter((row) => row.username === name && monthOf(row) === slot);
        expect(aggregates.userMonthGross[id * aggregates.nMonths + slot], `${name} month ${slot} gross`).toBeCloseTo(sum(mine.map((row) => numOf(row, 'gross_amount'))), 6);
        const maxQuota = mine.length ? Math.max(...mine.map((row) => numOf(row, 'total_monthly_quota'))) : 0;
        expect(aggregates.monthQuota[id * aggregates.nMonths + slot], `${name} month ${slot} quota`).toBe(maxQuota);
      }
    }
  });

  it('distinct-user counts per model/product/org/cost center match naive sets', () => {
    const named = rows.filter((row) => row.username);
    const check = (dimension: 'model' | 'product' | 'org' | 'costCenter' | 'repo' | 'app', key: (row: NaiveRow) => string) => {
      const sets = new Map<string, Set<string>>();
      for (const row of named) sets.set(key(row), (sets.get(key(row)) ?? new Set()).add(row.username));
      pipeline.store.dicts[dimension].values.forEach((groupKey, index) => expect(aggregates.usersIn[dimension][index], `${dimension}:${groupKey}`).toBe(sets.get(groupKey)?.size ?? 0));
    };
    check('model', modelOfRow);
    check('product', (row) => row.product);
    check('org', (row) => row.organization);
    check('costCenter', (row) => row.cost_center_name);
    check('repo', (row) => row.repository);
    check('app', (row) => row.app_client_id);
  });

  it('category and vendor roll-ups reproduce the totals', () => {
    const byCat = rollupByCategory(pipeline.models, aggregates.model);
    expect(arrSum(byCat.gross)).toBeCloseTo(aggregates.totals.gross, 6);
    expect(byCat.gross.length).toBe(CATEGORIES.length);
    CATEGORIES.forEach((_c, index) => expect(byCat.gross[index]).toBeCloseTo(aggregates.totals.tierGross[index], 6));
    const byVendor = rollupByVendor(pipeline.models, aggregates.model);
    expect(arrSum(byVendor.gross)).toBeCloseTo(aggregates.totals.gross, 6);
    expect(byVendor.gross.length).toBe(VENDORS.length);
    expect(arrSum(byVendor.rows)).toBe(aggregates.totals.rows);
  });

  it('vendor roll-up agrees with the published price card', () => {
    const vendorOf = (model: string): string => PRICE_CARD.find((cardEntry) => cardEntry.name === model)?.vendor ?? 'Other';
    const naive = groupSum(rows, (row) => vendorOf(modelOfRow(row)), (row) => numOf(row, 'gross_amount'));
    const byVendor = rollupByVendor(pipeline.models, aggregates.model);
    VENDORS.forEach((vendor, index) => expect(byVendor.gross[index], vendor).toBeCloseTo(naive.get(vendor) ?? 0, 6));
  });
});

describe('known constants of the fixture files', () => {
  it('pool-used fixture: 19 rows, discount is exactly the 58 USD pool, the rest is billed', async () => {
    const { analysis } = await analyzeFixtures([FIXTURE_A]);
    const totals = analysis.agg.totals;
    expect(totals.rows).toBe(19);
    expect(totals.users).toBe(2);
    expect(totals.gross).toBeCloseTo(151.0712, 6);
    expect(totals.discount).toBeCloseTo(58, 6);
    expect(totals.net).toBeCloseTo(93.0712, 6);
    expect(totals.unattributedGross).toBe(0);
    expect(totals.longPremium).toBe(0);
    expect(totals.autoGross).toBeCloseTo(151.067, 5);
    expect(analysis.agg.range.length).toBe(19);
  });

  it('partial-export fixture: everything covered, unattributed repo-level spend, long-context premium', async () => {
    const { analysis, store, prep: prepared, models } = await analyzeFixtures([FIXTURE_B]);
    const aggregates = analysis.agg;
    const totals = aggregates.totals;
    expect(totals.rows).toBe(45);
    expect(totals.users).toBe(1);
    expect(totals.gross).toBeCloseTo(1255.5399965, 5);
    expect(totals.net).toBe(0);
    expect(totals.discount).toBeCloseTo(totals.gross, 9);
    expect(totals.unattributedGross).toBeCloseTo(0.33, 5);
    expect(totals.attributedGross).toBeCloseTo(totals.gross - totals.unattributedGross, 9);
    expect(totals.autoGross).toBe(0);
    expect(totals.longPremium).toBeGreaterThan(100);
    expect(totals.longPremiumRows).toBeGreaterThan(0);

    const astra = store.dicts.model.index.get('GPT-6 Astra')!;
    expect(astra).toBeDefined();
    expect(aggregates.modelExtra.longPremium[astra]).toBeGreaterThan(100);
    expect(aggregates.modelExtra.longPremium[astra]).toBeLessThanOrEqual(totals.longPremium + 1e-9);
    expect(arrSum(aggregates.modelExtra.longPremium)).toBeCloseTo(totals.longPremium, 9);

    const day = dayNum('2026-10-25');
    const only = aggregate(store, prepared, models, null, { start: day, end: day }, { activeThreshold: 0.05 });
    expect(only.totals.longPremium).toBeGreaterThan(100);
  });
});

describe('aggregate scope handling', () => {
  let pipeline: Pipeline;
  let rows: NaiveRow[];
  const options = { activeThreshold: 0.05 };

  beforeAll(async () => {
    pipeline = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
    rows = [...naiveRows(readFixture(FIXTURE_A)), ...naiveRows(readFixture(FIXTURE_B))];
  });

  it('a sub-range only counts rows inside it and reports the first/last day with rows', () => {
    const start = dayNum('2026-10-03');
    const end = dayNum('2026-10-10');
    const result = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, { start, end }, options);
    const mine = rows.filter((row) => inRange(row, start, end));
    expect(result.range).toEqual({ start, end, length: 8 });
    expect(result.rowsIncluded).toBe(mine.length);
    expect(result.totals.gross).toBeCloseTo(sum(mine.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(result.totals.net).toBeCloseTo(sum(mine.map((row) => numOf(row, 'net_amount'))), 6);
    expect(result.firstDay).toBe(Math.min(...mine.map((row) => dayNum(row.date))));
    expect(result.lastDay).toBe(Math.max(...mine.map((row) => dayNum(row.date))));
    expect(result.days.gross.length).toBe(8);
  });

  it('clamps a range that exceeds the data to the data', () => {
    const all = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, { start: pipeline.store.minDay, end: pipeline.store.maxDay }, options);
    const wide = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, { start: pipeline.store.minDay - 400, end: pipeline.store.maxDay + 400 }, options);
    expect(wide.range).toEqual(all.range);
    expect(wide.range.start).toBe(pipeline.store.minDay);
    expect(wide.range.end).toBe(pipeline.store.maxDay);
    expect(wide.totals.gross).toBe(all.totals.gross);
    expect(wide.rowsIncluded).toBe(pipeline.store.n);
  });

  it('a range entirely outside the data yields an empty, NaN-free aggregate', () => {
    const after = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, { start: pipeline.store.maxDay + 5, end: pipeline.store.maxDay + 30 }, options);
    expect(after.rowsIncluded).toBe(0);
    expect(after.range.length).toBe(0);
    expect(after.days.gross.length).toBe(0);
    expect(after.firstDay).toBeNaN();
    expect(after.lastDay).toBeNaN();
    for (const value of Object.values(after.totals)) {
      if (typeof value === 'number') expect(value).toBe(0);
    }
    const before = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, { start: pipeline.store.minDay - 30, end: pipeline.store.minDay - 5 }, options);
    expect(before.rowsIncluded).toBe(0);
    const inverted = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, { start: pipeline.store.maxDay, end: pipeline.store.minDay }, options);
    expect(inverted.rowsIncluded).toBe(0);
    expect(inverted.range.length).toBe(0);
  });

  it('an all-zero mask gives zeros everywhere and no NaN or Infinity', () => {
    const mask = new Uint8Array(pipeline.store.n);
    const result = aggregate(pipeline.store, pipeline.prep, pipeline.models, mask, { start: pipeline.store.minDay, end: pipeline.store.maxDay }, options);
    expect(result.rowsIncluded).toBe(0);
    expect(result.firstDay).toBeNaN();
    expect(result.lastDay).toBeNaN();
    const totals = result.totals;
    for (const [field, value] of Object.entries(totals)) {
      if (typeof value === 'number') expect(value, field).toBe(0);
    }
    expect(Array.from(totals.tierGross)).toEqual([0, 0, 0, 0]);
    expect(totals.est).toEqual({ input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });
    for (const dimension of MEASURES) {
      for (const measure of MEASURE_KEYS) expect(arrSum(result[dimension][measure]), `${dimension}.${measure}`).toBe(0);
    }
    for (const userValues of [result.userAcc.gross, result.userAcc.net, result.userAcc.recent, result.userAcc.prior, result.userAcc.listCost, result.userAcc.longPremium, result.userAcc.autoGross, result.userAcc.peakDay]) {
      expect(Array.from(userValues).every((value) => value === 0)).toBe(true);
    }
    expect(Array.from(result.userAcc.activeDays).every((dayCount) => dayCount === 0)).toBe(true);
    expect(Array.from(result.usersIn.model).every((userCount) => userCount === 0)).toBe(true);
  });

  it('a mask restricts the aggregate to the selected rows', () => {
    const filters = { ...emptyFilters(), models: ['GPT-6 Astra'] };
    const mask = buildMask(pipeline.store, pipeline.prep, pipeline.models, filters);
    const result = aggregate(pipeline.store, pipeline.prep, pipeline.models, mask, { start: pipeline.store.minDay, end: pipeline.store.maxDay }, options);
    const mine = rows.filter((row) => modelOfRow(row) === 'GPT-6 Astra');
    expect(result.rowsIncluded).toBe(mine.length);
    expect(result.totals.gross).toBeCloseTo(sum(mine.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(result.totals.users).toBe(new Set(mine.map((row) => row.username).filter(Boolean)).size);
    const astra = pipeline.store.dicts.model.index.get('GPT-6 Astra')!;
    expect(result.model.gross[astra]).toBeCloseTo(result.totals.gross, 9);
  });

  it('the active-day threshold decides which days count as active', () => {
    const range = { start: pipeline.store.minDay, end: pipeline.store.maxDay };
    const strict = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, range, { activeThreshold: 50 });
    const loose = aggregate(pipeline.store, pipeline.prep, pipeline.models, null, range, { activeThreshold: 0 });
    expect(arrSum(loose.userAcc.activeDays)).toBeGreaterThan(arrSum(strict.userAcc.activeDays));
    expect(arrSum(strict.days.activeUsers)).toBeLessThanOrEqual(arrSum(loose.days.activeUsers));
    expect(arrSum(loose.days.activeUsers)).toBe(arrSum(loose.days.anyUsers));
    // The threshold never changes the money.
    expect(strict.totals.gross).toBe(loose.totals.gross);
  });

  it('quickTotals matches aggregate for the same scope', () => {
    const scopes: [Uint8Array | null, number, number][] = [
      [null, pipeline.store.minDay, pipeline.store.maxDay],
      [null, dayNum('2026-10-05'), dayNum('2026-10-18')],
      [buildMask(pipeline.store, pipeline.prep, pipeline.models, { ...emptyFilters(), orgs: ['contoso'] }), pipeline.store.minDay, pipeline.store.maxDay],
      [buildMask(pipeline.store, pipeline.prep, pipeline.models, { ...emptyFilters(), attribution: 'attributed', billing: 'billed' }), dayNum('2026-10-02'), dayNum('2026-10-12')],
      [null, pipeline.store.maxDay + 1, pipeline.store.maxDay + 9],
    ];
    for (const [mask, from, to] of scopes) {
      const quick = quickTotals(pipeline.store, mask, from, to);
      const aggregated = aggregate(pipeline.store, pipeline.prep, pipeline.models, mask, { start: from, end: to }, options).totals;
      expect(quick.rows).toBe(aggregated.rows);
      expect(quick.gross).toBeCloseTo(aggregated.gross, 9);
      expect(quick.net).toBeCloseTo(aggregated.net, 9);
      expect(quick.discount).toBeCloseTo(aggregated.discount, 9);
      expect(quick.credits).toBeCloseTo(aggregated.credits, 6);
      expect(quick.users).toBe(aggregated.users);
    }
  });
});

describe('combining files', () => {
  it('A+B totals equal the sum of the two files and each file keeps its own slice', async () => {
    const totalsA = (await analyzeFixtures([FIXTURE_A])).analysis.agg.totals;
    const totalsB = (await analyzeFixtures([FIXTURE_B])).analysis.agg.totals;
    const both = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
    const combinedTotals = both.analysis.agg.totals;
    expect(combinedTotals.rows).toBe(totalsA.rows + totalsB.rows);
    expect(combinedTotals.gross).toBeCloseTo(totalsA.gross + totalsB.gross, 6);
    expect(combinedTotals.discount).toBeCloseTo(totalsA.discount + totalsB.discount, 6);
    expect(combinedTotals.net).toBeCloseTo(totalsA.net + totalsB.net, 6);
    expect(combinedTotals.unattributedGross).toBeCloseTo(totalsA.unattributedGross + totalsB.unattributedGross, 9);
    expect(combinedTotals.users).toBe(3);
    const fileIdA = both.store.dicts.file.index.get(FIXTURE_A)!;
    const fileIdB = both.store.dicts.file.index.get(FIXTURE_B)!;
    expect(both.analysis.agg.file.gross[fileIdA]).toBeCloseTo(totalsA.gross, 6);
    expect(both.analysis.agg.file.gross[fileIdB]).toBeCloseTo(totalsB.gross, 6);
    expect(both.analysis.agg.range.start).toBe(dayNum('2026-10-01'));
    expect(both.analysis.agg.range.end).toBe(dayNum('2026-10-26'));
  });

  it('identical rows in two different files are counted once (dedupe is on by default)', async () => {
    const text = readFixture(FIXTURE_A);
    const single = await buildStore([{ name: 'one.csv', data: text }]);
    const twice = await buildStore([
      { name: 'one.csv', data: text },
      { name: 'two.csv', data: text },
    ]);
    expect(twice.n).toBe(single.n);
    expect(twice.files[1].duplicatesDropped).toBe(single.n);
    const kept = await buildStore(
      [
        { name: 'one.csv', data: text },
        { name: 'two.csv', data: text },
      ],
      { dedupe: false },
    );
    expect(kept.n).toBe(single.n * 2);
  });

  it('rows that differ in any billed field survive deduplication', async () => {
    const text = readFixture(FIXTURE_A);
    const tweaked = text.replace('"13.270004","13.270004","0"', '"13.270004","13.270003","0.000001"');
    expect(tweaked).not.toBe(text);
    const store = await buildStore([
      { name: 'one.csv', data: text },
      { name: 'two.csv', data: tweaked },
    ]);
    expect(store.files[1].duplicatesDropped).toBe(18);
    expect(store.n).toBe(20);
  });

  it('the fixture source helper round-trips the file name', () => {
    expect(fixtureSource(FIXTURE_A).name).toBe(FIXTURE_A);
  });
});

describe('emptyTotals', () => {
  it('is all zeros with one tier bucket per category', () => {
    const totals = emptyTotals();
    for (const [field, value] of Object.entries(totals)) {
      if (typeof value === 'number') expect(value, field).toBe(0);
    }
    expect(totals.tierGross.length).toBe(CATEGORIES.length);
    expect(Array.from(totals.tierGross)).toEqual([0, 0, 0, 0]);
  });
});
