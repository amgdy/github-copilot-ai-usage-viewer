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

const arrSum = (a: ArrayLike<number>): number => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s;
};

const planOfQuota = (q: number): string => (q <= 0 ? 'No quota' : q === 1900 ? 'Business' : q === 3900 ? 'Enterprise' : `Custom (${q.toLocaleString('en-US')} credits)`);

const inRange = (r: NaiveRow, start: number, end: number): boolean => {
  const d = dayNum(r.date);
  return d >= start && d <= end;
};

const cases = [
  { label: 'pool-used fixture', names: [FIXTURE_A] },
  { label: 'partial-export fixture', names: [FIXTURE_B] },
  { label: 'both fixtures', names: [FIXTURE_A, FIXTURE_B] },
];

describe.each(cases)('aggregate vs naive recomputation: $label', ({ names }) => {
  let p: Pipeline;
  let rows: NaiveRow[];
  let agg: Aggregates;

  beforeAll(async () => {
    p = await analyzeFixtures(names);
    rows = names.flatMap((n) => naiveRows(readFixture(n)));
    agg = p.analysis.agg;
  });

  it('totals equal an independent sum over the raw CSV rows', () => {
    const t = agg.totals;
    const n = naiveTotals(rows);
    expect(agg.rowsIncluded).toBe(n.rows);
    expect(t.rows).toBe(n.rows);
    expect(t.gross).toBeCloseTo(n.gross, 6);
    expect(t.discount).toBeCloseTo(n.discount, 6);
    expect(t.net).toBeCloseTo(n.net, 6);
    expect(t.credits).toBeCloseTo(n.credits, 4);
    expect(t.users).toBe(n.users);
    expect(t.input).toBe(sum(rows.map((r) => numOf(r, 'input'))));
    expect(t.output).toBe(sum(rows.map((r) => numOf(r, 'output'))));
    expect(t.cacheRead).toBe(sum(rows.map((r) => numOf(r, 'cache_read'))));
    expect(t.cacheWrite).toBe(sum(rows.map((r) => numOf(r, 'cache_write'))));
  });

  it('gross = discount + net overall, and credits = gross / 0.01', () => {
    const t = agg.totals;
    expect(t.gross).toBeCloseTo(t.discount + t.net, 6);
    expect(t.credits * 0.01).toBeCloseTo(t.gross, 4);
    expect(t.attributedGross + t.unattributedGross).toBeCloseTo(t.gross, 6);
    expect(t.pricedGross + t.unpricedGross).toBeCloseTo(t.gross, 6);
    expect(t.longPremium).toBeLessThanOrEqual(t.gross);
    expect(t.autoGross).toBeLessThanOrEqual(t.gross + 1e-9);
  });

  it('every per-dimension measure (and the day series) sums to the totals', () => {
    for (const m of MEASURES) {
      for (const k of MEASURE_KEYS) {
        const total = agg.totals[TOTAL_OF[k]];
        const got = arrSum(agg[m][k]);
        expect(got, `${m}.${k}`).toBeCloseTo(total, k === 'rows' ? 0 : 5);
      }
    }
  });

  it('gross = discount + net holds in every bucket of every measure', () => {
    for (const m of MEASURES) {
      const t = agg[m];
      for (let i = 0; i < t.gross.length; i++) {
        expect(Math.abs(t.gross[i] - t.discount[i] - t.net[i]), `${m}[${i}]`).toBeLessThan(1e-6);
      }
    }
  });

  it.each([
    ['user', (r: NaiveRow) => r.username],
    ['product', (r: NaiveRow) => r.product],
    ['sku', (r: NaiveRow) => r.sku],
    ['model', (r: NaiveRow) => modelOfRow(r)],
    ['org', (r: NaiveRow) => r.organization],
    ['costCenter', (r: NaiveRow) => r.cost_center_name],
    ['repo', (r: NaiveRow) => r.repository],
    ['app', (r: NaiveRow) => r.app_client_id],
  ] as [DimKey, (r: NaiveRow) => string][])('per-%s measures match naive group sums', (dim, key) => {
    const meas = agg[dim];
    const values = p.store.dicts[dim].values;
    const grossBy = groupSum(rows, key, (r) => numOf(r, 'gross_amount'));
    const netBy = groupSum(rows, key, (r) => numOf(r, 'net_amount'));
    const discBy = groupSum(rows, key, (r) => numOf(r, 'discount_amount'));
    const countBy = groupSum(rows, key, () => 1);
    for (const k of grossBy.keys()) expect(values, `dictionary lacks "${k}"`).toContain(k);
    values.forEach((v, i) => {
      expect(meas.rows[i], `${dim}:${v} rows`).toBe(countBy.get(v) ?? 0);
      expect(meas.gross[i], `${dim}:${v} gross`).toBeCloseTo(grossBy.get(v) ?? 0, 6);
      expect(meas.net[i], `${dim}:${v} net`).toBeCloseTo(netBy.get(v) ?? 0, 6);
      expect(meas.discount[i], `${dim}:${v} discount`).toBeCloseTo(discBy.get(v) ?? 0, 6);
    });
  });

  it('the day series matches naive per-day sums and distinct-user counts', () => {
    const { start, end, length } = agg.range;
    expect(start).toBe(Math.min(...rows.map((r) => dayNum(r.date))));
    expect(end).toBe(Math.max(...rows.map((r) => dayNum(r.date))));
    expect(length).toBe(end - start + 1);
    expect(agg.days.gross.length).toBe(length);
    const byDay = new Map<number, NaiveRow[]>();
    for (const r of rows) byDay.set(dayNum(r.date), [...(byDay.get(dayNum(r.date)) ?? []), r]);
    for (let d = start; d <= end; d++) {
      const rs = byDay.get(d) ?? [];
      const i = d - start;
      expect(agg.days.rows[i]).toBe(rs.length);
      expect(agg.days.gross[i]).toBeCloseTo(sum(rs.map((r) => numOf(r, 'gross_amount'))), 6);
      expect(agg.days.net[i]).toBeCloseTo(sum(rs.map((r) => numOf(r, 'net_amount'))), 6);
      const perUser = groupSum(
        rs.filter((r) => r.username),
        (r) => r.username,
        (r) => numOf(r, 'gross_amount'),
      );
      expect(agg.days.anyUsers[i]).toBe(perUser.size);
      expect(agg.days.activeUsers[i]).toBe([...perUser.values()].filter((g) => g >= p.settings.activeThreshold).length);
    }
  });

  it('selection, plan, weekday and file measures match naive groupings', () => {
    const auto = rows.filter(isAutoRow);
    expect(agg.selection.rows[1]).toBe(auto.length);
    expect(agg.selection.rows[0]).toBe(rows.length - auto.length);
    expect(agg.selection.gross[1]).toBeCloseTo(sum(auto.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(agg.totals.autoGross).toBeCloseTo(sum(auto.map((r) => numOf(r, 'gross_amount'))), 6);

    const planGross = groupSum(rows, (r) => planOfQuota(numOf(r, 'total_monthly_quota')), (r) => numOf(r, 'gross_amount'));
    p.prep.planLabels.forEach((label, i) => expect(agg.plan.gross[i], label).toBeCloseTo(planGross.get(label) ?? 0, 6));
    expect(new Set(p.prep.planLabels)).toEqual(new Set(planGross.keys()));

    const dowGross = groupSum(rows, (r) => String(weekdayOf(r.date)), (r) => numOf(r, 'gross_amount'));
    for (let d = 0; d < 7; d++) expect(agg.dow.gross[d], `dow ${d}`).toBeCloseTo(dowGross.get(String(d)) ?? 0, 6);

    names.forEach((name, i) => {
      const fileId = p.store.dicts.file.index.get(name);
      expect(fileId, name).toBeDefined();
      expect(agg.file.rows[fileId!]).toBe(naiveRows(readFixture(names[i])).length);
    });
  });

  it('per-user accumulators (first/last day, quota, active days, peak, 7-day windows, tokens) match naive values', () => {
    const { start, end } = agg.range;
    const ua = agg.userAcc;
    const thr = p.settings.activeThreshold;
    const named = rows.filter((r) => r.username);
    const users = new Set(named.map((r) => r.username));
    for (const name of users) {
      const id = p.store.dicts.user.index.get(name)!;
      const mine = named.filter((r) => r.username === name);
      const days = groupSum(mine, (r) => String(dayNum(r.date)), (r) => numOf(r, 'gross_amount'));
      const dayList = [...days.keys()].map(Number);
      expect(ua.firstDay[id], `${name} firstDay`).toBe(Math.min(...dayList));
      expect(ua.lastDay[id], `${name} lastDay`).toBe(Math.max(...dayList));
      expect(ua.quotaMax[id], `${name} quota`).toBe(Math.max(...mine.map((r) => numOf(r, 'total_monthly_quota'))));
      expect(ua.activeDays[id], `${name} activeDays`).toBe([...days.values()].filter((g) => g >= thr).length);
      expect(ua.peakDay[id], `${name} peakDay`).toBeCloseTo(Math.max(...days.values()), 6);
      expect(ua.recent[id], `${name} recent`).toBeCloseTo(
        sum(mine.filter((r) => dayNum(r.date) >= end - 6).map((r) => numOf(r, 'gross_amount'))),
        6,
      );
      expect(ua.prior[id], `${name} prior`).toBeCloseTo(
        sum(mine.filter((r) => dayNum(r.date) >= end - 13 && dayNum(r.date) < end - 6).map((r) => numOf(r, 'gross_amount'))),
        6,
      );
      expect(ua.autoGross[id], `${name} autoGross`).toBeCloseTo(sum(mine.filter(isAutoRow).map((r) => numOf(r, 'gross_amount'))), 6);
      expect(ua.cacheRead[id]).toBe(sum(mine.map((r) => numOf(r, 'cache_read'))));
      expect(ua.input[id]).toBe(sum(mine.map((r) => numOf(r, 'input'))));
      expect(start).toBeLessThanOrEqual(ua.firstDay[id]);
    }
  });

  it('per-user month grids hold the gross and the largest quota seen in each month', () => {
    const named = rows.filter((r) => r.username);
    const monthOf = (r: NaiveRow): number => {
      const [y, m] = r.date.split('-').map(Number);
      return y * 12 + (m - 1) - p.prep.firstMonth;
    };
    expect(agg.nMonths).toBe(p.prep.nMonths);
    for (const name of new Set(named.map((r) => r.username))) {
      const id = p.store.dicts.user.index.get(name)!;
      for (let slot = 0; slot < agg.nMonths; slot++) {
        const mine = named.filter((r) => r.username === name && monthOf(r) === slot);
        expect(agg.userMonthGross[id * agg.nMonths + slot], `${name} month ${slot} gross`).toBeCloseTo(sum(mine.map((r) => numOf(r, 'gross_amount'))), 6);
        const q = mine.length ? Math.max(...mine.map((r) => numOf(r, 'total_monthly_quota'))) : 0;
        expect(agg.monthQuota[id * agg.nMonths + slot], `${name} month ${slot} quota`).toBe(q);
      }
    }
  });

  it('distinct-user counts per model/product/org/cost center match naive sets', () => {
    const named = rows.filter((r) => r.username);
    const check = (dim: 'model' | 'product' | 'org' | 'costCenter' | 'repo' | 'app', key: (r: NaiveRow) => string) => {
      const sets = new Map<string, Set<string>>();
      for (const r of named) sets.set(key(r), (sets.get(key(r)) ?? new Set()).add(r.username));
      p.store.dicts[dim].values.forEach((v, i) => expect(agg.usersIn[dim][i], `${dim}:${v}`).toBe(sets.get(v)?.size ?? 0));
    };
    check('model', modelOfRow);
    check('product', (r) => r.product);
    check('org', (r) => r.organization);
    check('costCenter', (r) => r.cost_center_name);
    check('repo', (r) => r.repository);
    check('app', (r) => r.app_client_id);
  });

  it('category and vendor roll-ups reproduce the totals', () => {
    const byCat = rollupByCategory(p.models, agg.model);
    expect(arrSum(byCat.gross)).toBeCloseTo(agg.totals.gross, 6);
    expect(byCat.gross.length).toBe(CATEGORIES.length);
    CATEGORIES.forEach((_c, i) => expect(byCat.gross[i]).toBeCloseTo(agg.totals.tierGross[i], 6));
    const byVendor = rollupByVendor(p.models, agg.model);
    expect(arrSum(byVendor.gross)).toBeCloseTo(agg.totals.gross, 6);
    expect(byVendor.gross.length).toBe(VENDORS.length);
    expect(arrSum(byVendor.rows)).toBe(agg.totals.rows);
  });

  it('vendor roll-up agrees with the published price card', () => {
    const vendorOf = (model: string): string => PRICE_CARD.find((c) => c.name === model)?.vendor ?? 'Other';
    const naive = groupSum(rows, (r) => vendorOf(modelOfRow(r)), (r) => numOf(r, 'gross_amount'));
    const byVendor = rollupByVendor(p.models, agg.model);
    VENDORS.forEach((v, i) => expect(byVendor.gross[i], v).toBeCloseTo(naive.get(v) ?? 0, 6));
  });
});

describe('known constants of the fixture files', () => {
  it('pool-used fixture: 19 rows, discount is exactly the 58 USD pool, the rest is billed', async () => {
    const { analysis } = await analyzeFixtures([FIXTURE_A]);
    const t = analysis.agg.totals;
    expect(t.rows).toBe(19);
    expect(t.users).toBe(2);
    expect(t.gross).toBeCloseTo(151.0712, 6);
    expect(t.discount).toBeCloseTo(58, 6);
    expect(t.net).toBeCloseTo(93.0712, 6);
    expect(t.unattributedGross).toBe(0);
    expect(t.longPremium).toBe(0);
    expect(t.autoGross).toBeCloseTo(151.067, 5);
    expect(analysis.agg.range.length).toBe(19);
  });

  it('partial-export fixture: everything covered, unattributed repo-level spend, long-context premium', async () => {
    const { analysis, store, prep, models } = await analyzeFixtures([FIXTURE_B]);
    const agg = analysis.agg;
    const t = agg.totals;
    expect(t.rows).toBe(45);
    expect(t.users).toBe(1);
    expect(t.gross).toBeCloseTo(1255.5399965, 5);
    expect(t.net).toBe(0);
    expect(t.discount).toBeCloseTo(t.gross, 9);
    expect(t.unattributedGross).toBeCloseTo(0.33, 5);
    expect(t.attributedGross).toBeCloseTo(t.gross - t.unattributedGross, 9);
    expect(t.autoGross).toBe(0);
    expect(t.longPremium).toBeGreaterThan(100);
    expect(t.longPremiumRows).toBeGreaterThan(0);

    const astra = store.dicts.model.index.get('GPT-6 Astra')!;
    expect(astra).toBeDefined();
    expect(agg.modelExtra.longPremium[astra]).toBeGreaterThan(100);
    expect(agg.modelExtra.longPremium[astra]).toBeLessThanOrEqual(t.longPremium + 1e-9);
    expect(arrSum(agg.modelExtra.longPremium)).toBeCloseTo(t.longPremium, 9);

    const day = dayNum('2026-10-25');
    const only = aggregate(store, prep, models, null, { start: day, end: day }, { activeThreshold: 0.05 });
    expect(only.totals.longPremium).toBeGreaterThan(100);
  });
});

describe('aggregate scope handling', () => {
  let p: Pipeline;
  let rows: NaiveRow[];
  const opts = { activeThreshold: 0.05 };

  beforeAll(async () => {
    p = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
    rows = [...naiveRows(readFixture(FIXTURE_A)), ...naiveRows(readFixture(FIXTURE_B))];
  });

  it('a sub-range only counts rows inside it and reports the first/last day with rows', () => {
    const start = dayNum('2026-10-03');
    const end = dayNum('2026-10-10');
    const a = aggregate(p.store, p.prep, p.models, null, { start, end }, opts);
    const mine = rows.filter((r) => inRange(r, start, end));
    expect(a.range).toEqual({ start, end, length: 8 });
    expect(a.rowsIncluded).toBe(mine.length);
    expect(a.totals.gross).toBeCloseTo(sum(mine.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(a.totals.net).toBeCloseTo(sum(mine.map((r) => numOf(r, 'net_amount'))), 6);
    expect(a.firstDay).toBe(Math.min(...mine.map((r) => dayNum(r.date))));
    expect(a.lastDay).toBe(Math.max(...mine.map((r) => dayNum(r.date))));
    expect(a.days.gross.length).toBe(8);
  });

  it('clamps a range that exceeds the data to the data', () => {
    const all = aggregate(p.store, p.prep, p.models, null, { start: p.store.minDay, end: p.store.maxDay }, opts);
    const wide = aggregate(p.store, p.prep, p.models, null, { start: p.store.minDay - 400, end: p.store.maxDay + 400 }, opts);
    expect(wide.range).toEqual(all.range);
    expect(wide.range.start).toBe(p.store.minDay);
    expect(wide.range.end).toBe(p.store.maxDay);
    expect(wide.totals.gross).toBe(all.totals.gross);
    expect(wide.rowsIncluded).toBe(p.store.n);
  });

  it('a range entirely outside the data yields an empty, NaN-free aggregate', () => {
    const after = aggregate(p.store, p.prep, p.models, null, { start: p.store.maxDay + 5, end: p.store.maxDay + 30 }, opts);
    expect(after.rowsIncluded).toBe(0);
    expect(after.range.length).toBe(0);
    expect(after.days.gross.length).toBe(0);
    expect(after.firstDay).toBeNaN();
    expect(after.lastDay).toBeNaN();
    for (const v of Object.values(after.totals)) {
      if (typeof v === 'number') expect(v).toBe(0);
    }
    const before = aggregate(p.store, p.prep, p.models, null, { start: p.store.minDay - 30, end: p.store.minDay - 5 }, opts);
    expect(before.rowsIncluded).toBe(0);
    const inverted = aggregate(p.store, p.prep, p.models, null, { start: p.store.maxDay, end: p.store.minDay }, opts);
    expect(inverted.rowsIncluded).toBe(0);
    expect(inverted.range.length).toBe(0);
  });

  it('an all-zero mask gives zeros everywhere and no NaN or Infinity', () => {
    const mask = new Uint8Array(p.store.n);
    const a = aggregate(p.store, p.prep, p.models, mask, { start: p.store.minDay, end: p.store.maxDay }, opts);
    expect(a.rowsIncluded).toBe(0);
    expect(a.firstDay).toBeNaN();
    expect(a.lastDay).toBeNaN();
    const t = a.totals;
    for (const [k, v] of Object.entries(t)) {
      if (typeof v === 'number') expect(v, k).toBe(0);
    }
    expect(Array.from(t.tierGross)).toEqual([0, 0, 0, 0]);
    expect(t.est).toEqual({ input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });
    for (const m of MEASURES) {
      for (const k of MEASURE_KEYS) expect(arrSum(a[m][k]), `${m}.${k}`).toBe(0);
    }
    for (const arr of [a.userAcc.gross, a.userAcc.net, a.userAcc.recent, a.userAcc.prior, a.userAcc.listCost, a.userAcc.longPremium, a.userAcc.autoGross, a.userAcc.peakDay]) {
      expect(Array.from(arr).every((x) => x === 0)).toBe(true);
    }
    expect(Array.from(a.userAcc.activeDays).every((x) => x === 0)).toBe(true);
    expect(Array.from(a.usersIn.model).every((x) => x === 0)).toBe(true);
  });

  it('a mask restricts the aggregate to the selected rows', () => {
    const f = { ...emptyFilters(), models: ['GPT-6 Astra'] };
    const mask = buildMask(p.store, p.prep, p.models, f);
    const a = aggregate(p.store, p.prep, p.models, mask, { start: p.store.minDay, end: p.store.maxDay }, opts);
    const mine = rows.filter((r) => modelOfRow(r) === 'GPT-6 Astra');
    expect(a.rowsIncluded).toBe(mine.length);
    expect(a.totals.gross).toBeCloseTo(sum(mine.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(a.totals.users).toBe(new Set(mine.map((r) => r.username).filter(Boolean)).size);
    const astra = p.store.dicts.model.index.get('GPT-6 Astra')!;
    expect(a.model.gross[astra]).toBeCloseTo(a.totals.gross, 9);
  });

  it('the active-day threshold decides which days count as active', () => {
    const range = { start: p.store.minDay, end: p.store.maxDay };
    const strict = aggregate(p.store, p.prep, p.models, null, range, { activeThreshold: 50 });
    const loose = aggregate(p.store, p.prep, p.models, null, range, { activeThreshold: 0 });
    expect(arrSum(loose.userAcc.activeDays)).toBeGreaterThan(arrSum(strict.userAcc.activeDays));
    expect(arrSum(strict.days.activeUsers)).toBeLessThanOrEqual(arrSum(loose.days.activeUsers));
    expect(arrSum(loose.days.activeUsers)).toBe(arrSum(loose.days.anyUsers));
    // The threshold never changes the money.
    expect(strict.totals.gross).toBe(loose.totals.gross);
  });

  it('quickTotals matches aggregate for the same scope', () => {
    const scopes: [Uint8Array | null, number, number][] = [
      [null, p.store.minDay, p.store.maxDay],
      [null, dayNum('2026-10-05'), dayNum('2026-10-18')],
      [buildMask(p.store, p.prep, p.models, { ...emptyFilters(), orgs: ['contoso'] }), p.store.minDay, p.store.maxDay],
      [buildMask(p.store, p.prep, p.models, { ...emptyFilters(), attribution: 'attributed', billing: 'billed' }), dayNum('2026-10-02'), dayNum('2026-10-12')],
      [null, p.store.maxDay + 1, p.store.maxDay + 9],
    ];
    for (const [mask, from, to] of scopes) {
      const q = quickTotals(p.store, mask, from, to);
      const a = aggregate(p.store, p.prep, p.models, mask, { start: from, end: to }, opts).totals;
      expect(q.rows).toBe(a.rows);
      expect(q.gross).toBeCloseTo(a.gross, 9);
      expect(q.net).toBeCloseTo(a.net, 9);
      expect(q.discount).toBeCloseTo(a.discount, 9);
      expect(q.credits).toBeCloseTo(a.credits, 6);
      expect(q.users).toBe(a.users);
    }
  });
});

describe('combining files', () => {
  it('A+B totals equal the sum of the two files and each file keeps its own slice', async () => {
    const a = (await analyzeFixtures([FIXTURE_A])).analysis.agg.totals;
    const b = (await analyzeFixtures([FIXTURE_B])).analysis.agg.totals;
    const both = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
    const t = both.analysis.agg.totals;
    expect(t.rows).toBe(a.rows + b.rows);
    expect(t.gross).toBeCloseTo(a.gross + b.gross, 6);
    expect(t.discount).toBeCloseTo(a.discount + b.discount, 6);
    expect(t.net).toBeCloseTo(a.net + b.net, 6);
    expect(t.unattributedGross).toBeCloseTo(a.unattributedGross + b.unattributedGross, 9);
    expect(t.users).toBe(3);
    const fa = both.store.dicts.file.index.get(FIXTURE_A)!;
    const fb = both.store.dicts.file.index.get(FIXTURE_B)!;
    expect(both.analysis.agg.file.gross[fa]).toBeCloseTo(a.gross, 6);
    expect(both.analysis.agg.file.gross[fb]).toBeCloseTo(b.gross, 6);
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
    const t = emptyTotals();
    for (const [k, v] of Object.entries(t)) {
      if (typeof v === 'number') expect(v, k).toBe(0);
    }
    expect(t.tierGross.length).toBe(CATEGORIES.length);
    expect(Array.from(t.tierGross)).toEqual([0, 0, 0, 0]);
  });
});
