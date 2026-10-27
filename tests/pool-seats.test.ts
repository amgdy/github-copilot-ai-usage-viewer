import { beforeAll, describe, expect, it } from 'vitest';
import { emptyFilters } from '../src/lib/analytics/filters';
import { buildPool, defaultQuotaCredits, type MonthPool } from '../src/lib/analytics/pool';
import { DOWNGRADE_HEADROOM, planSeats } from '../src/lib/analytics/seats';
import { PLAN_PRICE, mergeSettings, seatPrice, type Settings } from '../src/lib/analytics/settings';
import { PERSONA_IDS, TIER_IDS, type UserProfile, type UserSet } from '../src/lib/analytics/users';
import {
  analyzeCsv,
  analyzeDemo,
  dayNum,
  makeCsv,
  naiveRows,
  numOf,
  sum,
  type NaiveRow,
  type Pipeline,
  type RowSpec,
} from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures, readFixture } from './fixtures';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface NaiveMonth {
  key: string;
  label: string;
  start: number;
  end: number;
  gross: number;
  discount: number;
  net: number;
  credits: number;
  daily: Map<number, { gross: number; discount: number; net: number }>;
  /** Highest monthly quota seen per named user. */
  quota: Map<string, number>;
}

function naiveMonths(rows: NaiveRow[]): NaiveMonth[] {
  const by = new Map<string, NaiveMonth>();
  for (const r of rows) {
    const key = r.date.slice(0, 7);
    let m = by.get(key);
    if (!m) {
      const [y, mo] = key.split('-').map(Number);
      const start = dayNum(`${key}-01`);
      const length = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      m = { key, label: `${MON[mo - 1]} ${y}`, start, end: start + length - 1, gross: 0, discount: 0, net: 0, credits: 0, daily: new Map(), quota: new Map() };
      by.set(key, m);
    }
    const g = numOf(r, 'gross_amount');
    const d = numOf(r, 'discount_amount');
    const n = numOf(r, 'net_amount');
    m.gross += g;
    m.discount += d;
    m.net += n;
    m.credits += numOf(r, 'quantity');
    const day = dayNum(r.date);
    const e = m.daily.get(day) ?? { gross: 0, discount: 0, net: 0 };
    e.gross += g;
    e.discount += d;
    e.net += n;
    m.daily.set(day, e);
    if (r.username) m.quota.set(r.username, Math.max(m.quota.get(r.username) ?? 0, numOf(r, 'total_monthly_quota')));
  }
  return [...by.values()].sort((a, b) => a.start - b.start);
}

/** The documented projection rules, evaluated from the raw rows of the (last) month. */
function expectedProjection(nm: NaiveMonth, pm: MonthPool, rangeStart: number) {
  const asOf = Math.max(...nm.daily.keys());
  const daysElapsed = Math.max(1, asOf - nm.start + 1);
  const daysLeft = Math.max(0, nm.end - asOf);
  const rateMtd = nm.gross / daysElapsed;
  const winStart = Math.max(nm.start, asOf - 6, rangeStart);
  let g7 = 0;
  for (let d = winStart; d <= asOf; d++) g7 += nm.daily.get(d)?.gross ?? 0;
  const rate7 = g7 / Math.max(1, asOf - winStart + 1);
  const low = Math.min(rateMtd, rate7);
  const mid = (rateMtd + rate7) / 2;
  const high = Math.max(rateMtd, rate7);
  const exhausted = pm.exhaustedOn !== null;
  const sizeUnknown = pm.capacityExceeded && !exhausted;
  const grossAt = (r: number): number => nm.gross + daysLeft * r;
  const netAt = (r: number): number => (exhausted ? nm.net + daysLeft * r : sizeUnknown ? nm.net : Math.max(0, grossAt(r) - pm.capacity));
  let exhaustionDate: number | null = null;
  if (!exhausted && !sizeUnknown && mid > 0 && pm.capacity > 0) {
    const need = pm.capacity - nm.gross;
    if (need > 0) {
      const d = asOf + Math.ceil(need / mid);
      if (d <= nm.end) exhaustionDate = d;
    }
  }
  return {
    asOf,
    daysElapsed,
    daysLeft,
    rateMtd,
    rate7,
    mid,
    projGrossLow: grossAt(low),
    projGross: grossAt(mid),
    projGrossHigh: grossAt(high),
    projNetLow: netAt(low),
    projNet: netAt(mid),
    projNetHigh: netAt(high),
    exhaustionDate,
  };
}

const NAMES = ['A', 'B', 'A+B', 'demo'] as const;
type DsName = (typeof NAMES)[number];
const data = {} as Record<DsName, { rows: NaiveRow[]; pl: Pipeline }>;

beforeAll(async () => {
  const [a, b, ab, demo] = await Promise.all([analyzeFixtures([FIXTURE_A]), analyzeFixtures([FIXTURE_B]), analyzeFixtures([FIXTURE_A, FIXTURE_B]), analyzeDemo()]);
  const rowsA = naiveRows(readFixture(FIXTURE_A));
  const rowsB = naiveRows(readFixture(FIXTURE_B));
  data.A = { rows: rowsA, pl: a };
  data.B = { rows: rowsB, pl: b };
  data['A+B'] = { rows: [...rowsA, ...rowsB], pl: ab };
  data.demo = { rows: naiveRows(demo.demo.csv), pl: demo };
});

const poolWith = (pl: Pipeline, s: Partial<Settings>, includeExtras = true) =>
  buildPool(pl.store, pl.prep, pl.analysis.agg, mergeSettings(s), pl.analysis.range, includeExtras);

const D = (iso: string): number => dayNum(iso);

describe.each(NAMES)('pool of %s equals an independent recomputation from the raw rows', (name) => {
  it('has one entry per calendar month with data, with matching keys, labels and bounds', () => {
    const { rows, pl } = data[name];
    const nm = naiveMonths(rows);
    const pool = pl.analysis.pool;
    expect(pool.months.map((m) => m.key)).toEqual(nm.map((m) => m.key));
    expect(pool.months.map((m) => m.label)).toEqual(nm.map((m) => m.label));
    pool.months.forEach((m, i) => {
      expect(m.slot).toBe(i);
      expect(m.monthStart).toBe(nm[i].start);
      expect(m.monthEnd).toBe(nm[i].end);
      expect(m.daysInMonth).toBe(nm[i].end - nm[i].start + 1);
    });
  });

  it('month totals, observed days, users and capacity', () => {
    const { rows, pl } = data[name];
    const nm = naiveMonths(rows);
    pl.analysis.pool.months.forEach((m, i) => {
      const n = nm[i];
      expect(m.gross).toBeCloseTo(n.gross, 6);
      expect(m.discount).toBeCloseTo(n.discount, 6);
      expect(m.net).toBeCloseTo(n.net, 6);
      expect(m.credits).toBeCloseTo(n.credits, 3);
      expect(m.daysObserved).toBe(n.daily.size);
      expect(m.firstDay).toBe(Math.min(...n.daily.keys()));
      expect(m.lastDay).toBe(Math.max(...n.daily.keys()));
      const quotas = [...n.quota.values()].filter((q) => q > 0);
      expect(m.users).toBe(quotas.length);
      expect(m.csvCapacity).toBeCloseTo(sum(quotas) * 0.01, 9);
      expect(m.extraCapacity).toBe(0);
      expect(m.capacity).toBeCloseTo(m.csvCapacity, 9);
    });
  });

  it('gross = discount + net, per month and in total', () => {
    const pool = data[name].pl.analysis.pool;
    for (const m of pool.months) expect(m.gross).toBeCloseTo(m.discount + m.net, 6);
    expect(pool.gross).toBeCloseTo(pool.covered + pool.billed, 6);
  });

  it('capacityExceeded, utilization and headroom follow the contract', () => {
    const pool = data[name].pl.analysis.pool;
    for (const m of pool.months) {
      expect(m.capacityExceeded).toBe(m.discount > m.capacity + 0.01);
      if (m.capacityExceeded) {
        expect(m.utilization).toBeNaN();
        expect(m.headroom).toBeNaN();
      } else {
        expect(m.utilization).toBeCloseTo(m.capacity > 0 ? m.discount / m.capacity : 0, 9);
        expect(m.headroom).toBeCloseTo(Math.max(0, m.capacity - m.discount), 9);
      }
    }
    expect(pool.capacityExceeded).toBe(pool.months.some((m) => m.capacityExceeded));
  });

  it('exhaustedOn is the first day with billed spend; cumulative series are running totals of observed days', () => {
    const { rows, pl } = data[name];
    const nm = naiveMonths(rows);
    pl.analysis.pool.months.forEach((m, i) => {
      const days = [...nm[i].daily.keys()].sort((a, b) => a - b);
      const first = days.find((d) => nm[i].daily.get(d)!.net > 1e-6);
      expect(m.exhaustedOn).toBe(first ?? null);
      expect(m.cumulative.map((c) => c.day)).toEqual(days);
      let g = 0;
      let d = 0;
      let n = 0;
      m.cumulative.forEach((c, k) => {
        const e = nm[i].daily.get(days[k])!;
        g += e.gross;
        d += e.discount;
        n += e.net;
        expect(c.gross).toBeCloseTo(g, 6);
        expect(c.discount).toBeCloseTo(d, 6);
        expect(c.net).toBeCloseTo(n, 6);
      });
      const last = m.cumulative[m.cumulative.length - 1];
      expect(last.gross).toBeCloseTo(m.gross, 9);
      expect(last.net).toBeCloseTo(m.net, 9);
    });
  });

  it('summary totals are the sums of the months', () => {
    const { rows, pl } = data[name];
    const pool = pl.analysis.pool;
    expect(pool.capacity).toBeCloseTo(sum(pool.months.map((m) => m.capacity)), 9);
    expect(pool.covered).toBeCloseTo(sum(pool.months.map((m) => m.discount)), 9);
    expect(pool.billed).toBeCloseTo(sum(pool.months.map((m) => m.net)), 9);
    expect(pool.gross).toBeCloseTo(sum(rows.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(pool.monthsExhausted).toBe(pool.months.filter((m) => m.exhaustedOn !== null).length);
    expect(pool.latest).toBe(pool.months[pool.months.length - 1]);
    expect(pool.capacityIsLowerBound).toBe(true);
    if (pool.capacityExceeded) expect(pool.utilization).toBeNaN();
    else expect(pool.utilization).toBeCloseTo(pool.covered / pool.capacity, 9);
    expect(pool.budget).toBeNull();
  });

  it('only the last, unfinished month of the data is projected', () => {
    const { rows, pl } = data[name];
    const nm = naiveMonths(rows);
    const maxDay = Math.max(...rows.map((r) => dayNum(r.date)));
    pl.analysis.pool.months.forEach((m, i) => {
      const isLast = i === nm.length - 1;
      const complete = !(isLast && maxDay < nm[i].end);
      expect(m.complete, m.key).toBe(complete);
      expect(m.projection === null, m.key).toBe(complete);
    });
  });

  it('the projection follows the documented formulas', () => {
    const { rows, pl } = data[name];
    const nm = naiveMonths(rows);
    pl.analysis.pool.months.forEach((m, i) => {
      if (!m.projection) return;
      const p = m.projection;
      const e = expectedProjection(nm[i], m, pl.analysis.range.start);
      expect(p.asOf).toBe(e.asOf);
      expect(p.daysElapsed).toBe(e.daysElapsed);
      expect(p.daysLeft).toBe(e.daysLeft);
      expect(p.mtdGross).toBeCloseTo(nm[i].gross, 6);
      expect(p.mtdNet).toBeCloseTo(nm[i].net, 6);
      expect(p.rateMtd).toBeCloseTo(e.rateMtd, 6);
      expect(p.rate7).toBeCloseTo(e.rate7, 6);
      for (const k of ['projGrossLow', 'projGross', 'projGrossHigh', 'projNetLow', 'projNet', 'projNetHigh'] as const) expect(p[k], k).toBeCloseTo(e[k], 5);
      expect(p.exhaustionDate).toBe(e.exhaustionDate);
    });
  });

  it('projection bounds are ordered and never below what is already billed', () => {
    for (const m of data[name].pl.analysis.pool.months) {
      const p = m.projection;
      if (!p) continue;
      expect(p.projGrossLow).toBeLessThanOrEqual(p.projGross + 1e-9);
      expect(p.projGross).toBeLessThanOrEqual(p.projGrossHigh + 1e-9);
      expect(p.projNetLow).toBeLessThanOrEqual(p.projNet + 1e-9);
      expect(p.projNet).toBeLessThanOrEqual(p.projNetHigh + 1e-9);
      expect(p.projGrossLow).toBeGreaterThanOrEqual(m.gross - 1e-9);
      expect(p.projNetLow).toBeGreaterThanOrEqual(m.net - 1e-9);
      expect(p.daysElapsed + p.daysLeft).toBeLessThanOrEqual(m.daysInMonth);
      if (p.exhaustionDate !== null) {
        expect(p.exhaustionDate).toBeGreaterThan(p.asOf);
        expect(p.exhaustionDate).toBeLessThanOrEqual(m.monthEnd);
        expect(m.exhaustedOn).toBeNull();
      }
    }
  });
});

describe('pool: known fixture facts', () => {
  it('pool-used fixture: pool of $58 (39 + 19) fully used on 2026-10-03, the rest is billed', () => {
    const pool = data.A.pl.analysis.pool;
    expect(pool.months).toHaveLength(1);
    const m = pool.months[0];
    expect(m.key).toBe('2026-10');
    expect(m.label).toBe('Oct 2026');
    expect(m.users).toBe(2);
    expect(m.capacity).toBeCloseTo(58, 9);
    expect(m.discount).toBeCloseTo(58, 6);
    expect(m.net).toBeCloseTo(93.0712, 3);
    expect(m.gross).toBeCloseTo(151.0712, 3);
    expect(m.exhaustedOn).toBe(D('2026-10-03'));
    expect(m.utilization).toBeCloseTo(1, 6);
    expect(m.headroom).toBeCloseTo(0, 6);
    expect(m.capacityExceeded).toBe(false);
    expect(m.complete).toBe(false);
    expect(pool.capacity).toBeCloseTo(58, 9);
    expect(pool.covered).toBeCloseTo(58, 6);
    expect(pool.billed).toBeCloseTo(93.0712, 3);
    expect(pool.utilization).toBeCloseTo(1, 6);
    expect(pool.monthsExhausted).toBe(1);
    expect(pool.capacityExceeded).toBe(false);
    expect(pool.capacityIsLowerBound).toBe(true);
  });

  it('pool-used fixture: the October projection runs on the last day with data and bills the rest of the month', () => {
    const m = data.A.pl.analysis.pool.months[0];
    const p = m.projection!;
    expect(p.asOf).toBe(D('2026-10-20'));
    expect(p.daysElapsed).toBe(20);
    expect(p.daysLeft).toBe(11);
    expect(p.projGrossLow).toBeLessThanOrEqual(p.projGross);
    expect(p.projGross).toBeLessThanOrEqual(p.projGrossHigh);
    expect(p.projNet).toBeGreaterThanOrEqual(m.net);
    expect(p.projNet).toBeCloseTo(m.net + 11 * ((p.rateMtd + p.rate7) / 2), 6);
    expect(p.exhaustionDate).toBeNull();
  });

  it('partial-export fixture: more credits were covered than the visible seat funds, so the pool size is unknown', () => {
    const pool = data.B.pl.analysis.pool;
    const m = pool.months[0];
    expect(pool.months).toHaveLength(1);
    expect(m.capacity).toBeCloseTo(39, 9);
    expect(m.discount).toBeCloseTo(1255.54, 2);
    expect(m.net).toBe(0);
    expect(m.capacityExceeded).toBe(true);
    expect(m.utilization).toBeNaN();
    expect(m.headroom).toBeNaN();
    expect(m.exhaustedOn).toBeNull();
    expect(pool.capacityExceeded).toBe(true);
    expect(pool.utilization).toBeNaN();
    expect(pool.capacityIsLowerBound).toBe(true);
    expect(pool.monthsExhausted).toBe(0);
  });

  it('partial-export fixture: with an unknown pool size nothing is projected as billed and no exhaustion date is invented', () => {
    const m = data.B.pl.analysis.pool.months[0];
    const p = m.projection!;
    expect(p).not.toBeNull();
    expect(p.asOf).toBe(D('2026-10-26'));
    expect(p.projGross).toBeGreaterThan(m.gross);
    expect(p.projNetLow).toBe(m.net);
    expect(p.projNet).toBe(m.net);
    expect(p.projNetHigh).toBe(m.net);
    expect(p.exhaustionDate).toBeNull();
  });

  it('both fixtures together: pool of the three seats, exhausted, billed overage kept', () => {
    const pool = data['A+B'].pl.analysis.pool;
    expect(pool.months).toHaveLength(1);
    expect(pool.capacity).toBeCloseTo(39 + 19 + 39, 9);
    expect(pool.months[0].users).toBe(3);
    expect(pool.billed).toBeCloseTo(93.0712, 3);
    expect(pool.months[0].exhaustedOn).toBe(D('2026-10-03'));
    expect(pool.capacityExceeded).toBe(true);
  });

  it('demo: two months, September complete and exhausted, October projected to run out', () => {
    const pool = data.demo.pl.analysis.pool;
    expect(pool.months.map((m) => m.key)).toEqual(['2026-09', '2026-10']);
    const [sep, oct] = pool.months;
    expect(sep.complete).toBe(true);
    expect(sep.projection).toBeNull();
    expect(sep.net).toBeGreaterThan(0);
    expect(sep.exhaustedOn).not.toBeNull();
    expect(sep.exhaustedOn!).toBeGreaterThanOrEqual(sep.monthStart);
    expect(sep.exhaustedOn!).toBeLessThanOrEqual(sep.monthEnd);
    expect(sep.capacityExceeded).toBe(false);
    expect(oct.complete).toBe(false);
    expect(oct.net).toBe(0);
    expect(oct.exhaustedOn).toBeNull();
    expect(oct.capacityExceeded).toBe(false);
    expect(oct.daysObserved).toBeLessThanOrEqual(26);
    const p = oct.projection!;
    expect(p.asOf).toBe(D('2026-10-26'));
    expect(p.daysLeft).toBe(5);
    expect(p.exhaustionDate).not.toBeNull();
    expect(p.exhaustionDate!).toBeGreaterThan(p.asOf);
    expect(p.exhaustionDate!).toBeLessThanOrEqual(oct.monthEnd);
    expect(p.projNet).toBeGreaterThan(0);
    expect(pool.monthsExhausted).toBe(1);
    expect(pool.latest).toBe(oct);
    expect(pool.capacity).toBeCloseTo(sep.capacity + oct.capacity, 9);
    expect(pool.billed).toBeCloseTo(sep.net, 9);
  });

  it('demo: the capacity of a month is the sum of the quotas of the users seen that month', () => {
    const { rows, pl } = data.demo;
    const nm = naiveMonths(rows);
    pl.analysis.pool.months.forEach((m, i) => {
      expect(m.capacity).toBeCloseTo(sum([...nm[i].quota.values()]) * 0.01, 9);
    });
    const [sep, oct] = pl.analysis.pool.months;
    expect(oct.users).toBeGreaterThanOrEqual(sep.users);
  });
});

describe('pool over a sub-range of the data', () => {
  const rangeOf = (from: string, to: string) => ({ ...emptyFilters(), dateFrom: D(from), dateTo: D(to) });

  it('only counts the days inside the range and the users seen in it', () => {
    const { rows, pl } = data.demo;
    const from = '2026-09-20';
    const to = '2026-10-05';
    const a = pl.run(rangeOf(from, to), pl.settings);
    const inRange = rows.filter((r) => r.date >= from && r.date <= to);
    const nm = naiveMonths(inRange);
    expect(a.pool.months.map((m) => m.key)).toEqual(['2026-09', '2026-10']);
    a.pool.months.forEach((m, i) => {
      expect(m.gross).toBeCloseTo(nm[i].gross, 6);
      expect(m.net).toBeCloseTo(nm[i].net, 6);
      expect(m.daysObserved).toBe(nm[i].daily.size);
      expect(m.capacity).toBeCloseTo(sum([...nm[i].quota.values()]) * 0.01, 9);
      expect(m.cumulative.every((c) => c.day >= D(from) && c.day <= D(to))).toBe(true);
    });
    expect(a.narrowed).toBe(false);
  });

  it('a window that ends before the last day of data is not projected', () => {
    const a = data.demo.pl.run(rangeOf('2026-10-01', '2026-10-10'), data.demo.pl.settings);
    expect(a.pool.months).toHaveLength(1);
    expect(a.pool.months[0].complete).toBe(true);
    expect(a.pool.months[0].projection).toBeNull();
  });

  it('a window outside the data has no months and a zero (not NaN) summary', () => {
    const a = data.demo.pl.run(rangeOf('2030-01-01', '2030-02-01'), data.demo.pl.settings);
    expect(a.pool.months).toEqual([]);
    expect(a.pool.latest).toBeNull();
    expect(a.pool.capacity).toBe(0);
    expect(a.pool.utilization).toBe(0);
    expect(a.pool.capacityExceeded).toBe(false);
  });

  it('an empty scope (no rows match) has an empty pool and no budget status even when a budget is set', () => {
    const f = { ...emptyFilters(), users: ['nobody-here'] };
    const a = data.demo.pl.run(f, mergeSettings({ budgetMonthlyBilled: 100 }));
    expect(a.pool.months).toEqual([]);
    expect(a.pool.budget).toBeNull();
    expect(Number.isNaN(a.pool.utilization)).toBe(false);
  });
});

describe('capacity tolerance (synthetic)', () => {
  const oneSeat = (discount: number) =>
    analyzeCsv(makeCsv([{ date: '2026-10-02', user: 'u1', gross: discount, discount, net: 0, quota: 1900 }, { date: '2026-10-30', user: 'u1', gross: 0.01, quota: 1900 }]));

  it('treats a one-cent rounding excess as within the pool', async () => {
    const pl = await oneSeat(19);
    expect(pl.analysis.pool.months[0].capacityExceeded).toBe(false);
    expect(pl.analysis.pool.months[0].utilization).toBeCloseTo(19.01 / 19, 6);
  });

  it('flags a pool that covered clearly more than the seats fund', async () => {
    const pl = await oneSeat(19.02);
    const m = pl.analysis.pool.months[0];
    expect(m.capacity).toBeCloseTo(19, 9);
    expect(m.capacityExceeded).toBe(true);
    expect(m.utilization).toBeNaN();
    expect(pl.analysis.pool.capacityExceeded).toBe(true);
    expect(pl.analysis.pool.capacityIsLowerBound).toBe(true);
  });

  it('a pool with spare credits is not exhausted and reports its headroom', async () => {
    const pl = await oneSeat(10);
    const m = pl.analysis.pool.months[0];
    expect(m.exhaustedOn).toBeNull();
    expect(m.utilization).toBeCloseTo(10.01 / 19, 6);
    expect(m.headroom).toBeCloseTo(19 - 10.01, 6);
  });
});

describe('defaultQuotaCredits', () => {
  const quotas = async (list: number[]) => {
    const specs: RowSpec[] = list.map((q, i) => ({ date: '2026-10-01', user: `u${i}`, gross: 1, quota: q }));
    if (list.length === 0) specs.push({ date: '2026-10-01', user: '', gross: 1, product: 'ghas', sku: 'code_security_ai_credit' });
    const pl = await analyzeCsv(makeCsv(specs));
    return defaultQuotaCredits(pl.analysis.agg);
  };

  it('is the most common positive quota among users with rows', async () => {
    expect(await quotas([1900, 1900, 1900, 3900])).toBe(1900);
    expect(await quotas([3900, 3900, 1900])).toBe(3900);
    expect(await quotas([1000, 1000, 1900, 3900, 3900])).toBe(1000);
  });

  it('ignores zero quotas and falls back to Business when there is nothing to count', async () => {
    expect(await quotas([0, 0, 0, 3900])).toBe(3900);
    expect(await quotas([0, 0])).toBe(1900);
    expect(await quotas([])).toBe(1900);
  });
});

describe('roster and extra seats extend the pool', () => {
  const ghosts = [
    { user: 'ghost-1', plan: 'Business' },
    { user: 'ghost-2', plan: 'Enterprise' },
  ];

  it('roster seats that never appear in the report add their plan credits to every month', () => {
    const a = data.A.pl;
    const base = poolWith(a, {});
    expect(base.capacity).toBeCloseTo(58, 9);
    const withRoster = poolWith(a, { roster: ghosts });
    const m = withRoster.months[0];
    expect(m.csvCapacity).toBeCloseTo(58, 9);
    expect(m.extraCapacity).toBeCloseTo(19 + 39, 9);
    expect(m.capacity).toBeCloseTo(116, 9);
    expect(withRoster.capacity).toBeCloseTo(116, 9);
    expect(m.utilization).toBeCloseTo(58 / 116, 6);
    expect(m.headroom).toBeCloseTo(58, 6);
    expect(withRoster.capacityIsLowerBound).toBe(false);
    expect(base.capacityIsLowerBound).toBe(true);
  });

  it('extra seats are counted per month on a multi-month dataset', () => {
    const demo = data.demo.pl;
    const base = poolWith(demo, {});
    const withRoster = poolWith(demo, { roster: ghosts });
    expect(base.months).toHaveLength(2);
    base.months.forEach((m, i) => {
      expect(withRoster.months[i].extraCapacity).toBeCloseTo(58, 9);
      expect(withRoster.months[i].capacity).toBeCloseTo(m.capacity + 58, 9);
    });
    expect(withRoster.capacity).toBeCloseTo(base.capacity + 116, 9);
  });

  it('a roster user already in the report (any case, surrounding spaces) adds nothing', () => {
    const a = data.A.pl;
    const pool = poolWith(a, { roster: [{ user: '  ALEX-dev ', plan: 'Business' }, { user: 'Sam-LEE', plan: 'Enterprise' }] });
    expect(pool.capacity).toBeCloseTo(58, 9);
    expect(pool.months[0].extraCapacity).toBe(0);
    expect(pool.capacityIsLowerBound).toBe(false);
  });

  it('extraSeats add Business (19) and Enterprise (39) seats', () => {
    const pool = poolWith(data.A.pl, { extraSeats: { business: 2, enterprise: 1 } });
    expect(pool.months[0].extraCapacity).toBeCloseTo(2 * 19 + 39, 9);
    expect(pool.capacity).toBeCloseTo(58 + 77, 9);
    expect(pool.capacityIsLowerBound).toBe(false);
  });

  it('includeExtras = false ignores roster and extra seats and keeps the capacity a lower bound', () => {
    const pool = poolWith(data.A.pl, { roster: ghosts, extraSeats: { business: 2, enterprise: 1 } }, false);
    expect(pool.capacity).toBeCloseTo(58, 9);
    expect(pool.months[0].extraCapacity).toBe(0);
    expect(pool.capacityIsLowerBound).toBe(true);
  });

  it('enough extra seats explain a covered usage that exceeded the visible seats (partial-export fixture)', () => {
    const b = data.B.pl;
    const pool = poolWith(b, { extraSeats: { business: 0, enterprise: 100 } });
    const m = pool.months[0];
    expect(m.capacity).toBeCloseTo(39 + 3900, 6);
    expect(m.capacityExceeded).toBe(false);
    expect(m.utilization).toBeCloseTo(m.discount / m.capacity, 9);
    expect(m.headroom).toBeCloseTo(m.capacity - m.discount, 6);
    expect(pool.capacityExceeded).toBe(false);
    expect(pool.capacityIsLowerBound).toBe(false);
    expect(m.projection!.projNet).toBe(0);
    expect(m.projection!.exhaustionDate).toBeNull();
  });

  it('with a known pool size the projection forecasts exhaustion and billed overage (partial-export fixture, 35 extra Enterprise seats)', () => {
    const pool = poolWith(data.B.pl, { extraSeats: { business: 0, enterprise: 35 } });
    const m = pool.months[0];
    const p = m.projection!;
    expect(m.capacity).toBeCloseTo(39 + 35 * 39, 6);
    expect(m.capacityExceeded).toBe(false);
    const mid = (p.rateMtd + p.rate7) / 2;
    expect(p.exhaustionDate).toBe(p.asOf + Math.ceil((m.capacity - m.gross) / mid));
    expect(p.exhaustionDate).toBe(D('2026-10-30'));
    expect(p.projNet).toBeCloseTo(p.projGross - m.capacity, 6);
    expect(p.projNet).toBeGreaterThan(0);
  });

  it('the analysis applies roster and extra seats only when the scope is not narrowed', () => {
    const demo = data.demo.pl;
    const s = mergeSettings({ roster: ghosts, extraSeats: { business: 1, enterprise: 0 } });
    const whole = demo.run(emptyFilters(), s);
    const dated = demo.run({ ...emptyFilters(), dateFrom: D('2026-09-10') }, s);
    const byModel = demo.run({ ...emptyFilters(), models: ['GPT-6 Astra'] }, s);
    const byTier = demo.run({ ...emptyFilters(), tiers: ['runaway'] }, s);
    expect(whole.pool.months.every((m) => Math.abs(m.extraCapacity - 77) < 1e-9)).toBe(true);
    expect(dated.pool.months.every((m) => Math.abs(m.extraCapacity - 77) < 1e-9)).toBe(true);
    expect(whole.pool.capacityIsLowerBound).toBe(false);
    for (const a of [byModel, byTier]) {
      expect(a.narrowed).toBe(true);
      expect(a.pool.months.every((m) => m.extraCapacity === 0)).toBe(true);
      expect(a.pool.capacityIsLowerBound).toBe(true);
    }
  });
});

describe('budget status', () => {
  const withBudget = (name: DsName, budget: number | null, from?: string, to?: string) => {
    const pl = data[name].pl;
    const f = { ...emptyFilters(), ...(from ? { dateFrom: D(from) } : {}), ...(to ? { dateTo: D(to) } : {}) };
    return pl.run(f, mergeSettings({ budgetMonthlyBilled: budget })).pool;
  };

  it('is absent without a budget (null or zero)', () => {
    expect(withBudget('A', null).budget).toBeNull();
    expect(withBudget('A', 0).budget).toBeNull();
  });

  it('pool-used fixture, $100 budget: 93% burnt, will be passed on 2026-10-22', () => {
    const pool = withBudget('A', 100);
    const b = pool.budget!;
    const m = pool.latest!;
    expect(b.monthlyBudget).toBe(100);
    expect(b.month).toBe('Oct 2026');
    expect(b.billedToDate).toBeCloseTo(m.net, 9);
    expect(b.billedToDate).toBeCloseTo(93.0712, 3);
    expect(b.burn).toBeCloseTo(0.930712, 5);
    expect(b.projectedBilled).toBeCloseTo(m.projection!.projNet, 9);
    expect(b.projectedBurn).toBeCloseTo(m.projection!.projNet / 100, 9);
    expect(b.projectedBurn!).toBeGreaterThan(1);
    expect(b.hitDate).toBe(D('2026-10-22'));
  });

  it('pool-used fixture: the hit date is asOf + ceil(remaining ÷ average daily rate), only if it is still in the month', () => {
    const p = withBudget('A', 95).latest!.projection!;
    const rate = (p.rateMtd + p.rate7) / 2;
    const hit = (b: number): number | null => {
      const d = p.asOf + Math.ceil((b - p.mtdNet) / rate);
      return d <= D('2026-10-31') ? d : null;
    };
    expect(withBudget('A', 95).budget!.hitDate).toBe(hit(95));
    expect(withBudget('A', 95).budget!.hitDate).toBe(D('2026-10-21'));
    expect(withBudget('A', 155).budget!.hitDate).toBe(hit(155));
    expect(withBudget('A', 155).budget!.hitDate).toBe(D('2026-10-31'));
    expect(withBudget('A', 160).budget!.hitDate).toBe(hit(160));
    expect(withBudget('A', 160).budget!.hitDate).toBeNull();
    expect(withBudget('A', 5000).budget!.hitDate).toBeNull();
  });

  it('a budget that is already exceeded has no hit date but a burn above 100%', () => {
    const b = withBudget('A', 50).budget!;
    expect(b.hitDate).toBeNull();
    expect(b.burn).toBeCloseTo(93.0712 / 50, 4);
    expect(b.burn).toBeGreaterThan(1);
  });

  it('partial-export fixture: nothing is billed, so nothing is burnt', () => {
    const b = withBudget('B', 100).budget!;
    expect(b.billedToDate).toBe(0);
    expect(b.burn).toBe(0);
    expect(b.projectedBilled).toBe(0);
    expect(b.projectedBurn).toBe(0);
    expect(b.hitDate).toBeNull();
  });

  it('demo October, pool not yet exhausted: the budget is hit after the pool runs out', () => {
    for (const budget of [100, 200, 260]) {
      const pool = withBudget('demo', budget);
      const oct = pool.latest!;
      const p = oct.projection!;
      const b = pool.budget!;
      expect(b.month).toBe('Oct 2026');
      expect(b.billedToDate).toBe(0);
      expect(b.burn).toBe(0);
      expect(b.projectedBilled).toBeCloseTo(p.projNet, 9);
      expect(p.projNet).toBeGreaterThanOrEqual(budget);
      const rate = (p.rateMtd + p.rate7) / 2;
      expect(b.hitDate, `budget ${budget}`).toBe(Math.min(oct.monthEnd, p.exhaustionDate! + Math.ceil(budget / rate)));
    }
  });

  it('demo October: a budget above the projected overage will not be hit', () => {
    const b = withBudget('demo', 1000).budget!;
    expect(b.hitDate).toBeNull();
    expect(b.projectedBurn!).toBeLessThan(1);
    expect(b.projectedBurn!).toBeGreaterThan(0);
  });

  it('a finished month has no projection, so only the billed share is reported', () => {
    const pool = withBudget('demo', 100, undefined, '2026-09-30');
    const b = pool.budget!;
    expect(b.month).toBe('Sep 2026');
    expect(b.billedToDate).toBeCloseTo(pool.latest!.net, 9);
    expect(b.billedToDate).toBeGreaterThan(100);
    expect(b.burn).toBeCloseTo(b.billedToDate / 100, 9);
    expect(b.projectedBilled).toBeNull();
    expect(b.projectedBurn).toBeNull();
    expect(b.hitDate).toBeNull();
  });
});

function fakeUsers(profiles: Partial<UserProfile>[], inactive: { user: string; plan: string | null }[] = [], fallbackQuotaCredits = 1900): UserSet {
  const full = profiles.map((p, i) => ({
    id: i + 1,
    name: `user-${i + 1}`,
    plan: 'Business',
    quotaCredits: 1900,
    tier: 'light',
    persona: 'steady',
    isNew: false,
    peakMonthGross: 5,
    gross: 5,
    utilization: 0.26,
    ...p,
  }));
  return { profiles: full, inactive, fallbackQuotaCredits } as unknown as UserSet;
}

describe('planSeats rules (hand-made profiles)', () => {
  const settings = mergeSettings({});
  const threshold = DOWNGRADE_HEADROOM * PLAN_PRICE.Business;

  it('idle seats are exactly the minimal-tier dormant or lapsed users', () => {
    for (const tier of TIER_IDS) {
      for (const persona of PERSONA_IDS) {
        const plan = planSeats(fakeUsers([{ tier, persona }]), settings);
        const idle = tier === 'minimal' && (persona === 'dormant' || persona === 'lapsed');
        expect(plan.idle.length, `${tier}/${persona}`).toBe(idle ? 1 : 0);
      }
    }
  });

  it('an idle seat is valued at the plan price: Business $19, Enterprise $39, custom quotas at $0.01 per credit', () => {
    const idle = { tier: 'minimal', persona: 'dormant' } as const;
    const quotas = [1900, 3900, 1000, 2500];
    const plan = planSeats(fakeUsers(quotas.map((q) => ({ ...idle, quotaCredits: q }))), settings);
    expect(plan.idle.map((s) => s.value)).toEqual([19, 39, 10, 25]);
    expect(plan.idleValue).toBeCloseTo(93, 9);
    expect(plan.downgrade).toEqual([]);
  });

  it('an idle seat without a quota uses the fallback plan price', () => {
    const idle = { tier: 'minimal', persona: 'lapsed', quotaCredits: 0 } as const;
    expect(planSeats(fakeUsers([idle], [], 1900), settings).idle[0].value).toBe(19);
    expect(planSeats(fakeUsers([idle], [], 3900), settings).idle[0].value).toBe(39);
    expect(planSeats(fakeUsers([idle], [], 1000), settings).idle[0].value).toBe(10);
  });

  it('downgrade candidates are Enterprise users whose best month stayed within 80% of the Business allotment', () => {
    const ent = { quotaCredits: 3900, plan: 'Enterprise' };
    const plan = planSeats(
      fakeUsers([
        { ...ent, peakMonthGross: threshold - 0.01 },
        { ...ent, peakMonthGross: threshold + 0.01 },
        { ...ent, peakMonthGross: 0 },
        { ...ent, peakMonthGross: 19 },
        { quotaCredits: 1900, peakMonthGross: 1 },
        { quotaCredits: 4000, peakMonthGross: 1 },
        { quotaCredits: 1000, peakMonthGross: 1 },
      ]),
      settings,
    );
    expect(plan.downgrade.map((s) => s.id)).toEqual([1, 3]);
    expect(plan.downgradeValue).toBe(40);
    expect(plan.downgrade.every((s) => s.value === PLAN_PRICE.Enterprise - PLAN_PRICE.Business)).toBe(true);
    expect(threshold).toBeCloseTo(15.2, 9);
  });

  it('new users and idle seats are never downgrade candidates', () => {
    const ent = { quotaCredits: 3900, plan: 'Enterprise', peakMonthGross: 1 };
    const plan = planSeats(
      fakeUsers([
        { ...ent, isNew: true, tier: 'minimal', persona: 'new' },
        { ...ent, isNew: true, tier: 'light', persona: 'new' },
        { ...ent, tier: 'minimal', persona: 'dormant' },
        { ...ent, tier: 'minimal', persona: 'lapsed' },
        { ...ent, tier: 'light', persona: 'lapsed' },
        { ...ent, tier: 'minimal', persona: 'steady' },
      ]),
      settings,
    );
    expect(plan.idle.map((s) => s.id)).toEqual([3, 4]);
    expect(plan.downgrade.map((s) => s.id)).toEqual([5, 6]);
  });

  it('candidates carry the user, plan, spend and utilization', () => {
    const plan = planSeats(fakeUsers([{ id: 42, name: 'someone', plan: 'Enterprise', quotaCredits: 3900, peakMonthGross: 2, gross: 3.5, utilization: 0.09, tier: 'minimal', persona: 'dormant' }]), settings);
    expect(plan.idle[0]).toEqual({ id: 42, name: 'someone', plan: 'Enterprise', value: 39, gross: 3.5, utilization: 0.09 });
  });

  it('unused seats come from the roster entries missing in the report and are valued by plan', () => {
    const plan = planSeats(
      fakeUsers(
        [],
        [
          { user: 'a', plan: 'Business' },
          { user: 'b', plan: 'enterprise' },
          { user: 'c', plan: '2500' },
          { user: 'd', plan: '25' },
          { user: 'e', plan: '$1,900' },
          { user: 'f', plan: null },
          { user: 'g', plan: '' },
          { user: 'h', plan: 'platinum' },
        ],
        3900,
      ),
      settings,
    );
    expect(plan.unused.map((s) => s.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(plan.unused.map((s) => s.plan)).toEqual(['Business', 'enterprise', '2500', '25', '$1,900', 'Enterprise (assumed)', '', 'platinum']);
    expect(plan.unused.map((s) => s.value)).toEqual([19, 39, 25, 25, 19, 39, 39, 39]);
    expect(plan.unused.every((s) => s.id === -1 && s.gross === 0 && s.utilization === 0)).toBe(true);
    expect(plan.unusedValue).toBeCloseTo(244, 9);
  });

  it('a roster seat without a plan says which plan it was priced as, or Unknown when the file has no quota', () => {
    const roster = [{ user: 'x', plan: null }];
    expect(planSeats(fakeUsers([], roster, 1900), settings).unused[0].plan).toBe('Business (assumed)');
    expect(planSeats(fakeUsers([], roster, 2500), settings).unused[0].plan).toBe('Custom (2,500 credits, assumed)');
    expect(planSeats(fakeUsers([], roster, 0), settings).unused[0].plan).toBe('Unknown');
  });

  it('no users: nothing to reclaim and zero values', () => {
    const plan = planSeats(fakeUsers([]), settings);
    expect(plan).toEqual({ idle: [], downgrade: [], unused: [], idleValue: 0, downgradeValue: 0, unusedValue: 0 });
  });

  it('seatPrice matches the plan prices and values other quotas at one cent per credit', () => {
    expect(seatPrice(1900)).toBe(19);
    expect(seatPrice(3900)).toBe(39);
    expect(seatPrice(1000)).toBe(10);
    expect(seatPrice(0)).toBe(0);
    expect(seatPrice(2500)).toBeCloseTo(25, 9);
  });
});

describe('seat plan on realistic data', () => {
  const OCT = (d: number): string => `2026-10-${String(d).padStart(2, '0')}`;
  const SPECS: RowSpec[] = [
    { date: OCT(1), user: 'anchor', gross: 10, quota: 1900 },
    { date: OCT(30), user: 'anchor', gross: 10, quota: 1900 },
    ...Array.from({ length: 20 }, (_, i): RowSpec => ({ date: OCT(i + 1), user: 'ent-low', gross: 0.5, quota: 3900 })),
    { date: OCT(3), user: 'ent-edge-in', gross: 15.1, quota: 3900 },
    { date: OCT(3), user: 'ent-edge-out', gross: 15.3, quota: 3900 },
    { date: OCT(3), user: 'ent-high', gross: 30, quota: 3900 },
    { date: OCT(2), user: 'ent-lapsed-light', gross: 5, quota: 3900 },
    { date: OCT(3), user: 'ent-idle', gross: 1, quota: 3900 },
    { date: OCT(20), user: 'ent-new', gross: 2, quota: 3900 },
    { date: OCT(3), user: 'biz-low', gross: 5, quota: 1900 },
    { date: OCT(2), user: 'biz-idle', gross: 0.5, quota: 1900 },
    { date: OCT(10), user: 'biz-dormant', gross: 0.1, quota: 1900 },
    { date: OCT(28), user: 'biz-dormant', gross: 0.1, quota: 1900 },
    { date: OCT(2), user: 'custom-idle', gross: 0.2, quota: 1000 },
    { date: OCT(2), user: 'noquota-idle', gross: 0.2, quota: 0 },
  ];
  let pl: Pipeline;
  const names = (xs: { name: string }[]): string[] => xs.map((x) => x.name).sort();
  const profile = (n: string): UserProfile => pl.analysis.users.profiles.find((p) => p.name === n)!;

  beforeAll(async () => {
    pl = await analyzeCsv(makeCsv(SPECS));
  });

  it('the scenario produces the profiles the seat rules are about', () => {
    expect(pl.analysis.users.fallbackQuotaCredits).toBe(3900);
    expect(defaultQuotaCredits(pl.analysis.agg)).toBe(3900);
    const want: Record<string, { tier: string; persona?: string; isNew?: boolean }> = {
      anchor: { tier: 'power' },
      'ent-low': { tier: 'light' },
      'ent-edge-in': { tier: 'light' },
      'ent-edge-out': { tier: 'light' },
      'ent-high': { tier: 'core' },
      'ent-lapsed-light': { tier: 'light', persona: 'lapsed' },
      'ent-idle': { tier: 'minimal', persona: 'lapsed' },
      'ent-new': { tier: 'minimal', persona: 'new', isNew: true },
      'biz-low': { tier: 'light' },
      'biz-idle': { tier: 'minimal', persona: 'lapsed' },
      'biz-dormant': { tier: 'minimal', persona: 'dormant' },
      'custom-idle': { tier: 'minimal', persona: 'lapsed' },
      'noquota-idle': { tier: 'minimal', persona: 'lapsed' },
    };
    for (const [n, w] of Object.entries(want)) {
      const p = profile(n);
      expect(p.tier, `${n} tier`).toBe(w.tier);
      if (w.persona) expect(p.persona, `${n} persona`).toBe(w.persona);
      expect(p.isNew, `${n} isNew`).toBe(w.isNew ?? false);
    }
  });

  it('flags the idle seats and values them by plan', () => {
    const { seats } = pl.analysis;
    expect(names(seats.idle)).toEqual(['biz-dormant', 'biz-idle', 'custom-idle', 'ent-idle', 'noquota-idle']);
    const value = (n: string): number => seats.idle.find((s) => s.name === n)!.value;
    expect(value('ent-idle')).toBe(39);
    expect(value('biz-idle')).toBe(19);
    expect(value('biz-dormant')).toBe(19);
    expect(value('custom-idle')).toBe(10);
    expect(value('noquota-idle')).toBe(39);
    expect(seats.idleValue).toBeCloseTo(126, 9);
  });

  it('flags Enterprise seats that stayed under 80% of the Business allotment, at $20 each', () => {
    const { seats } = pl.analysis;
    expect(names(seats.downgrade)).toEqual(['ent-edge-in', 'ent-lapsed-light', 'ent-low']);
    expect(seats.downgrade.every((s) => s.value === 20 && s.plan === 'Enterprise')).toBe(true);
    expect(seats.downgradeValue).toBeCloseTo(60, 9);
    const not = ['ent-edge-out', 'ent-high', 'ent-idle', 'ent-new', 'biz-low', 'anchor'];
    for (const n of not) expect(names(seats.downgrade), n).not.toContain(n);
  });

  it('has no unused seats without a roster', () => {
    expect(pl.analysis.seats.unused).toEqual([]);
    expect(pl.analysis.seats.unusedValue).toBe(0);
  });

  it('is what planSeats returns for the analysed users', () => {
    expect(pl.analysis.seats).toEqual(planSeats(pl.analysis.users, pl.settings));
  });

  describe('with a roster', () => {
    const roster = [
      { user: 'ghost-biz', plan: 'Business' },
      { user: ' Ghost-Ent ', plan: 'enterprise' },
      { user: 'ghost-credits', plan: '2500' },
      { user: 'ghost-n', plan: '25' },
      { user: 'ghost-dollar', plan: '$1,900' },
      { user: 'ghost-default' },
      { user: ' ENT-LOW ', plan: 'Business' },
      { user: 'anchor' },
    ];
    it('does not count roster seats without activity dates as unused', () => {
      const a = pl.run(pl.filters, mergeSettings({ roster }));
      expect(a.seats.unused).toEqual([]);
      expect(a.seats.unusedValue).toBe(0);
      expect(a.seats.idle).toEqual([]);
    });

    it('keeps seats without activity dates out of the unused list even with duplicate or blank lines', () => {
      const a = pl.run(pl.filters, mergeSettings({ roster: [...roster, { user: 'GHOST-BIZ', plan: 'Enterprise' }, { user: '   ', plan: 'Business' }, { user: '' }] }));
      expect(a.seats.unused).toEqual([]);
      expect(a.seats.unusedValue).toBe(0);
    });

    it('uses roster plans to size pool capacity without counting seats as unused', () => {
      const a = pl.run(pl.filters, mergeSettings({ roster }));
      const m = a.pool.months[0];
      expect(a.seats.unusedValue).toBe(0);
      expect(m.extraCapacity).toBeCloseTo(166, 9);
      expect(m.capacity).toBeCloseTo(m.csvCapacity + 166, 9);
    });

    it('duplicate and blank roster lines add no pool capacity', () => {
      const a = pl.run(pl.filters, mergeSettings({ roster: [...roster, { user: 'GHOST-BIZ', plan: 'Enterprise' }, { user: '   ', plan: 'Business' }, { user: '' }] }));
      expect(a.seats.unusedValue).toBe(0);
      expect(a.pool.months[0].extraCapacity).toBeCloseTo(166, 9);
    });

    it('the first roster line sizes pool capacity when a user is listed twice', () => {
      const first = pl.run(pl.filters, mergeSettings({ roster: [{ user: 'twice', plan: 'Business' }, { user: 'TWICE', plan: 'Enterprise' }] }));
      const second = pl.run(pl.filters, mergeSettings({ roster: [{ user: 'twice', plan: 'Enterprise' }, { user: 'TWICE', plan: 'Business' }] }));
      expect(first.seats.unused).toEqual([]);
      expect(first.pool.months[0].extraCapacity).toBeCloseTo(19, 9);
      expect(second.seats.unused).toEqual([]);
      expect(second.pool.months[0].extraCapacity).toBeCloseTo(39, 9);
    });

    it('is not offered when the scope is narrowed: no unused seats, and no idle/downgrade savings from the whole organisation', () => {
      const a = pl.run({ ...pl.filters, models: ['GPT-5.6 Terra'], billing: 'covered' }, mergeSettings({ roster }));
      expect(a.narrowed).toBe(true);
      expect(a.seats.unused).toEqual([]);
      expect(a.seats.unusedValue).toBe(0);
      expect(a.pool.months.every((m) => m.extraCapacity === 0)).toBe(true);
    });
  });
});

describe('seat plan: fixtures and the demo', () => {
  it('both fixtures have nothing to reclaim', () => {
    for (const name of ['A', 'B', 'A+B'] as const) {
      const s = data[name].pl.analysis.seats;
      expect(s.idle, name).toEqual([]);
      expect(s.downgrade, name).toEqual([]);
      expect(s.unused, name).toEqual([]);
      expect(s.idleValue + s.downgradeValue + s.unusedValue, name).toBe(0);
    }
  });

  it('demo: idle and downgrade seats follow the rules applied to the user profiles', () => {
    const { rows, pl } = data.demo;
    const { seats, users } = pl.analysis;
    const idle = users.profiles.filter((p) => p.tier === 'minimal' && (p.persona === 'dormant' || p.persona === 'lapsed'));
    const idleIds = new Set(idle.map((p) => p.id));
    expect(seats.idle.map((s) => s.id).sort((a, b) => a - b)).toEqual(idle.map((p) => p.id).sort((a, b) => a - b));
    expect(seats.idle.length).toBeGreaterThan(0);
    expect(seats.idleValue).toBeCloseTo(sum(idle.map((p) => seatPrice(p.quotaCredits))), 9);

    const monthly = new Map<string, Map<string, number>>();
    for (const r of rows) {
      if (!r.username) continue;
      const byMonth = monthly.get(r.username) ?? new Map<string, number>();
      byMonth.set(r.date.slice(0, 7), (byMonth.get(r.date.slice(0, 7)) ?? 0) + numOf(r, 'gross_amount'));
      monthly.set(r.username, byMonth);
    }
    const peak = (n: string): number => Math.max(...monthly.get(n)!.values());
    const down = users.profiles.filter((p) => !idleIds.has(p.id) && !p.isNew && p.quotaCredits === 3900 && peak(p.name) <= 0.8 * 19);
    expect(seats.downgrade.map((s) => s.id).sort((a, b) => a - b)).toEqual(down.map((p) => p.id).sort((a, b) => a - b));
    expect(seats.downgrade.length).toBeGreaterThan(0);
    expect(seats.downgradeValue).toBeCloseTo(20 * down.length, 9);
    for (const s of seats.downgrade) expect(s.plan).toBe('Enterprise');
  });

  it('demo: idle and downgrade seats never overlap and have no roster seats', () => {
    const { seats } = data.demo.pl.analysis;
    const ids = new Set(seats.idle.map((s) => s.id));
    expect(seats.downgrade.every((s) => !ids.has(s.id))).toBe(true);
    expect(seats.unused).toEqual([]);
  });

  it('demo: roster-only seats are excluded while visible user actions stay in scope', () => {
    const demo = data.demo.pl;
    const a = demo.run({ ...emptyFilters(), tiers: ['minimal'] }, mergeSettings({ roster: [{ user: 'ghost', plan: 'Business' }] }));
    expect(a.segmentFiltered).toBe(true);
    expect(a.seats.unused).toEqual([]);
    const visible = new Set(a.users.profiles.map((p) => p.id));
    expect(a.seats.idle).toEqual([]);
    for (const s of a.seats.downgrade) expect(visible.has(s.id)).toBe(true);
  });
});
