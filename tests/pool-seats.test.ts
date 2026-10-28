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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    let month = by.get(key);
    if (!month) {
      const [year, monthNumber] = key.split('-').map(Number);
      const start = dayNum(`${key}-01`);
      const length = Temporal.PlainYearMonth.from({ year, month: monthNumber }).daysInMonth;
      month = { key, label: `${MONTH_NAMES[monthNumber - 1]} ${year}`, start, end: start + length - 1, gross: 0, discount: 0, net: 0, credits: 0, daily: new Map(), quota: new Map() };
      by.set(key, month);
    }
    const gross = numOf(row, 'gross_amount');
    const discount = numOf(row, 'discount_amount');
    const net = numOf(row, 'net_amount');
    month.gross += gross;
    month.discount += discount;
    month.net += net;
    month.credits += numOf(row, 'quantity');
    const day = dayNum(row.date);
    const dayTotals = month.daily.get(day) ?? { gross: 0, discount: 0, net: 0 };
    dayTotals.gross += gross;
    dayTotals.discount += discount;
    dayTotals.net += net;
    month.daily.set(day, dayTotals);
    if (row.username) month.quota.set(row.username, Math.max(month.quota.get(row.username) ?? 0, numOf(row, 'total_monthly_quota')));
  }
  return [...by.values()].sort((a, b) => a.start - b.start);
}

/** The documented projection rules, evaluated from the raw rows of the (last) month. */
function expectedProjection(expectedMonth: NaiveMonth, poolMonth: MonthPool, rangeStart: number) {
  const asOf = Math.max(...expectedMonth.daily.keys());
  const daysElapsed = Math.max(1, asOf - expectedMonth.start + 1);
  const daysLeft = Math.max(0, expectedMonth.end - asOf);
  const rateMtd = expectedMonth.gross / daysElapsed;
  const winStart = Math.max(expectedMonth.start, asOf - 6, rangeStart);
  let windowGross = 0;
  for (let day = winStart; day <= asOf; day++) windowGross += expectedMonth.daily.get(day)?.gross ?? 0;
  const rate7 = windowGross / Math.max(1, asOf - winStart + 1);
  const low = Math.min(rateMtd, rate7);
  const midRate = (rateMtd + rate7) / 2;
  const high = Math.max(rateMtd, rate7);
  const exhausted = poolMonth.exhaustedOn !== null;
  const sizeUnknown = poolMonth.capacityExceeded && !exhausted;
  const grossAt = (rate: number): number => expectedMonth.gross + daysLeft * rate;
  const netAt = (rate: number): number => (exhausted ? expectedMonth.net + daysLeft * rate : sizeUnknown ? expectedMonth.net : Math.max(0, grossAt(rate) - poolMonth.capacity));
  let exhaustionDate: number | null = null;
  if (!exhausted && !sizeUnknown && midRate > 0 && poolMonth.capacity > 0) {
    const need = poolMonth.capacity - expectedMonth.gross;
    if (need > 0) {
      const runOutDay = asOf + Math.ceil(need / midRate);
      if (runOutDay <= expectedMonth.end) exhaustionDate = runOutDay;
    }
  }
  return {
    asOf,
    daysElapsed,
    daysLeft,
    rateMtd,
    rate7,
    mid: midRate,
    projGrossLow: grossAt(low),
    projGross: grossAt(midRate),
    projGrossHigh: grossAt(high),
    projNetLow: netAt(low),
    projNet: netAt(midRate),
    projNetHigh: netAt(high),
    exhaustionDate,
  };
}

const NAMES = ['A', 'B', 'A+B', 'demo', 'demo mid-September'] as const;
type DsName = (typeof NAMES)[number];
const data = {} as Record<DsName, { rows: NaiveRow[]; pl: Pipeline }>;

/** Last day of the demo report when it is downloaded in the middle of September, while the runaway users drain the pool. */
const MID_SEPTEMBER = '2026-09-15';

beforeAll(async () => {
  const [pipelineA, pipelineB, pipelineBoth, demo, midSeptember] = await Promise.all([
    analyzeFixtures([FIXTURE_A]),
    analyzeFixtures([FIXTURE_B]),
    analyzeFixtures([FIXTURE_A, FIXTURE_B]),
    analyzeDemo(),
    analyzeDemo({ demo: { end: MID_SEPTEMBER } }),
  ]);
  const rowsA = naiveRows(readFixture(FIXTURE_A));
  const rowsB = naiveRows(readFixture(FIXTURE_B));
  data.A = { rows: rowsA, pl: pipelineA };
  data.B = { rows: rowsB, pl: pipelineB };
  data['A+B'] = { rows: [...rowsA, ...rowsB], pl: pipelineBoth };
  data.demo = { rows: naiveRows(demo.demo.csv), pl: demo };
  data['demo mid-September'] = { rows: naiveRows(midSeptember.demo.csv), pl: midSeptember };
});

const poolWith = (pipeline: Pipeline, settings: Partial<Settings>, includeExtras = true) =>
  buildPool(pipeline.store, pipeline.prep, pipeline.analysis.agg, mergeSettings(settings), pipeline.analysis.range, includeExtras);

const parseDay = (iso: string): number => dayNum(iso);

describe.each(NAMES)('pool of %s equals an independent recomputation from the raw rows', (name) => {
  it('has one entry per calendar month with data, with matching keys, labels and bounds', () => {
    const { rows, pl: pipeline } = data[name];
    const expectedMonths = naiveMonths(rows);
    const pool = pipeline.analysis.pool;
    expect(pool.months.map((month) => month.key)).toEqual(expectedMonths.map((expectedMonth) => expectedMonth.key));
    expect(pool.months.map((month) => month.label)).toEqual(expectedMonths.map((expectedMonth) => expectedMonth.label));
    pool.months.forEach((month, index) => {
      expect(month.slot).toBe(index);
      expect(month.monthStart).toBe(expectedMonths[index].start);
      expect(month.monthEnd).toBe(expectedMonths[index].end);
      expect(month.daysInMonth).toBe(expectedMonths[index].end - expectedMonths[index].start + 1);
    });
  });

  it('month totals, observed days, users and capacity', () => {
    const { rows, pl: pipeline } = data[name];
    const expectedMonths = naiveMonths(rows);
    pipeline.analysis.pool.months.forEach((month, index) => {
      const expectedMonth = expectedMonths[index];
      expect(month.gross).toBeCloseTo(expectedMonth.gross, 6);
      expect(month.discount).toBeCloseTo(expectedMonth.discount, 6);
      expect(month.net).toBeCloseTo(expectedMonth.net, 6);
      expect(month.credits).toBeCloseTo(expectedMonth.credits, 3);
      expect(month.daysObserved).toBe(expectedMonth.daily.size);
      expect(month.firstDay).toBe(Math.min(...expectedMonth.daily.keys()));
      expect(month.lastDay).toBe(Math.max(...expectedMonth.daily.keys()));
      const quotas = [...expectedMonth.quota.values()].filter((quota) => quota > 0);
      expect(month.users).toBe(quotas.length);
      expect(month.csvCapacity).toBeCloseTo(sum(quotas) * 0.01, 9);
      expect(month.extraCapacity).toBe(0);
      expect(month.capacity).toBeCloseTo(month.csvCapacity, 9);
    });
  });

  it('gross = discount + net, per month and in total', () => {
    const pool = data[name].pl.analysis.pool;
    for (const month of pool.months) expect(month.gross).toBeCloseTo(month.discount + month.net, 6);
    expect(pool.gross).toBeCloseTo(pool.covered + pool.billed, 6);
  });

  it('capacityExceeded, utilization and headroom follow the contract', () => {
    const pool = data[name].pl.analysis.pool;
    for (const month of pool.months) {
      expect(month.capacityExceeded).toBe(month.discount > month.capacity + 0.01);
      if (month.capacityExceeded) {
        expect(month.utilization).toBeNaN();
        expect(month.headroom).toBeNaN();
      } else {
        expect(month.utilization).toBeCloseTo(month.capacity > 0 ? month.discount / month.capacity : 0, 9);
        expect(month.headroom).toBeCloseTo(Math.max(0, month.capacity - month.discount), 9);
      }
    }
    expect(pool.capacityExceeded).toBe(pool.months.some((month) => month.capacityExceeded));
  });

  it('exhaustedOn is the first day with billed spend; cumulative series are running totals of observed days', () => {
    const { rows, pl: pipeline } = data[name];
    const expectedMonths = naiveMonths(rows);
    pipeline.analysis.pool.months.forEach((month, index) => {
      const days = [...expectedMonths[index].daily.keys()].sort((a, b) => a - b);
      const first = days.find((day) => expectedMonths[index].daily.get(day)!.net > 1e-6);
      expect(month.exhaustedOn).toBe(first ?? null);
      expect(month.cumulative.map((point) => point.day)).toEqual(days);
      let runningGross = 0;
      let runningDiscount = 0;
      let runningNet = 0;
      month.cumulative.forEach((point, dayIndex) => {
        const dayTotals = expectedMonths[index].daily.get(days[dayIndex])!;
        runningGross += dayTotals.gross;
        runningDiscount += dayTotals.discount;
        runningNet += dayTotals.net;
        expect(point.gross).toBeCloseTo(runningGross, 6);
        expect(point.discount).toBeCloseTo(runningDiscount, 6);
        expect(point.net).toBeCloseTo(runningNet, 6);
      });
      const last = month.cumulative[month.cumulative.length - 1];
      expect(last.gross).toBeCloseTo(month.gross, 9);
      expect(last.net).toBeCloseTo(month.net, 9);
    });
  });

  it('summary totals are the sums of the months', () => {
    const { rows, pl: pipeline } = data[name];
    const pool = pipeline.analysis.pool;
    expect(pool.capacity).toBeCloseTo(sum(pool.months.map((month) => month.capacity)), 9);
    expect(pool.covered).toBeCloseTo(sum(pool.months.map((month) => month.discount)), 9);
    expect(pool.billed).toBeCloseTo(sum(pool.months.map((month) => month.net)), 9);
    expect(pool.gross).toBeCloseTo(sum(rows.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(pool.monthsExhausted).toBe(pool.months.filter((month) => month.exhaustedOn !== null).length);
    expect(pool.latest).toBe(pool.months[pool.months.length - 1]);
    expect(pool.capacityIsLowerBound).toBe(true);
    if (pool.capacityExceeded) expect(pool.utilization).toBeNaN();
    else expect(pool.utilization).toBeCloseTo(pool.covered / pool.capacity, 9);
    expect(pool.budget).toBeNull();
  });

  it('only the last, unfinished month of the data is projected', () => {
    const { rows, pl: pipeline } = data[name];
    const expectedMonths = naiveMonths(rows);
    const maxDay = Math.max(...rows.map((row) => dayNum(row.date)));
    pipeline.analysis.pool.months.forEach((month, index) => {
      const isLast = index === expectedMonths.length - 1;
      const complete = !(isLast && maxDay < expectedMonths[index].end);
      expect(month.complete, month.key).toBe(complete);
      expect(month.projection === null, month.key).toBe(complete);
    });
  });

  it('the projection follows the documented formulas', () => {
    const { rows, pl: pipeline } = data[name];
    const expectedMonths = naiveMonths(rows);
    pipeline.analysis.pool.months.forEach((month, index) => {
      if (!month.projection) return;
      const projection = month.projection;
      const expected = expectedProjection(expectedMonths[index], month, pipeline.analysis.range.start);
      expect(projection.asOf).toBe(expected.asOf);
      expect(projection.daysElapsed).toBe(expected.daysElapsed);
      expect(projection.daysLeft).toBe(expected.daysLeft);
      expect(projection.mtdGross).toBeCloseTo(expectedMonths[index].gross, 6);
      expect(projection.mtdNet).toBeCloseTo(expectedMonths[index].net, 6);
      expect(projection.rateMtd).toBeCloseTo(expected.rateMtd, 6);
      expect(projection.rate7).toBeCloseTo(expected.rate7, 6);
      for (const field of ['projGrossLow', 'projGross', 'projGrossHigh', 'projNetLow', 'projNet', 'projNetHigh'] as const) expect(projection[field], field).toBeCloseTo(expected[field], 5);
      expect(projection.exhaustionDate).toBe(expected.exhaustionDate);
    });
  });

  it('projection bounds are ordered and never below what is already billed', () => {
    for (const month of data[name].pl.analysis.pool.months) {
      const projection = month.projection;
      if (!projection) continue;
      expect(projection.projGrossLow).toBeLessThanOrEqual(projection.projGross + 1e-9);
      expect(projection.projGross).toBeLessThanOrEqual(projection.projGrossHigh + 1e-9);
      expect(projection.projNetLow).toBeLessThanOrEqual(projection.projNet + 1e-9);
      expect(projection.projNet).toBeLessThanOrEqual(projection.projNetHigh + 1e-9);
      expect(projection.projGrossLow).toBeGreaterThanOrEqual(month.gross - 1e-9);
      expect(projection.projNetLow).toBeGreaterThanOrEqual(month.net - 1e-9);
      expect(projection.daysElapsed + projection.daysLeft).toBeLessThanOrEqual(month.daysInMonth);
      if (projection.exhaustionDate !== null) {
        expect(projection.exhaustionDate).toBeGreaterThan(projection.asOf);
        expect(projection.exhaustionDate).toBeLessThanOrEqual(month.monthEnd);
        expect(month.exhaustedOn).toBeNull();
      }
    }
  });
});

describe('pool: known fixture facts', () => {
  it('pool-used fixture: pool of $58 (39 + 19) fully used on 2026-10-03, the rest is billed', () => {
    const pool = data.A.pl.analysis.pool;
    expect(pool.months).toHaveLength(1);
    const month = pool.months[0];
    expect(month.key).toBe('2026-10');
    expect(month.label).toBe('Oct 2026');
    expect(month.users).toBe(2);
    expect(month.capacity).toBeCloseTo(58, 9);
    expect(month.discount).toBeCloseTo(58, 6);
    expect(month.net).toBeCloseTo(93.0712, 3);
    expect(month.gross).toBeCloseTo(151.0712, 3);
    expect(month.exhaustedOn).toBe(parseDay('2026-10-03'));
    expect(month.utilization).toBeCloseTo(1, 6);
    expect(month.headroom).toBeCloseTo(0, 6);
    expect(month.capacityExceeded).toBe(false);
    expect(month.complete).toBe(false);
    expect(pool.capacity).toBeCloseTo(58, 9);
    expect(pool.covered).toBeCloseTo(58, 6);
    expect(pool.billed).toBeCloseTo(93.0712, 3);
    expect(pool.utilization).toBeCloseTo(1, 6);
    expect(pool.monthsExhausted).toBe(1);
    expect(pool.capacityExceeded).toBe(false);
    expect(pool.capacityIsLowerBound).toBe(true);
  });

  it('pool-used fixture: the October projection runs on the last day with data and bills the rest of the month', () => {
    const month = data.A.pl.analysis.pool.months[0];
    const projection = month.projection!;
    expect(projection.asOf).toBe(parseDay('2026-10-20'));
    expect(projection.daysElapsed).toBe(20);
    expect(projection.daysLeft).toBe(11);
    expect(projection.projGrossLow).toBeLessThanOrEqual(projection.projGross);
    expect(projection.projGross).toBeLessThanOrEqual(projection.projGrossHigh);
    expect(projection.projNet).toBeGreaterThanOrEqual(month.net);
    expect(projection.projNet).toBeCloseTo(month.net + 11 * ((projection.rateMtd + projection.rate7) / 2), 6);
    expect(projection.exhaustionDate).toBeNull();
  });

  it('partial-export fixture: more credits were covered than the visible seat funds, so the pool size is unknown', () => {
    const pool = data.B.pl.analysis.pool;
    const month = pool.months[0];
    expect(pool.months).toHaveLength(1);
    expect(month.capacity).toBeCloseTo(39, 9);
    expect(month.discount).toBeCloseTo(1255.54, 2);
    expect(month.net).toBe(0);
    expect(month.capacityExceeded).toBe(true);
    expect(month.utilization).toBeNaN();
    expect(month.headroom).toBeNaN();
    expect(month.exhaustedOn).toBeNull();
    expect(pool.capacityExceeded).toBe(true);
    expect(pool.utilization).toBeNaN();
    expect(pool.capacityIsLowerBound).toBe(true);
    expect(pool.monthsExhausted).toBe(0);
  });

  it('partial-export fixture: with an unknown pool size nothing is projected as billed and no exhaustion date is invented', () => {
    const month = data.B.pl.analysis.pool.months[0];
    const projection = month.projection!;
    expect(projection).not.toBeNull();
    expect(projection.asOf).toBe(parseDay('2026-10-26'));
    expect(projection.projGross).toBeGreaterThan(month.gross);
    expect(projection.projNetLow).toBe(month.net);
    expect(projection.projNet).toBe(month.net);
    expect(projection.projNetHigh).toBe(month.net);
    expect(projection.exhaustionDate).toBeNull();
  });

  it('both fixtures together: pool of the three seats, exhausted, billed overage kept', () => {
    const pool = data['A+B'].pl.analysis.pool;
    expect(pool.months).toHaveLength(1);
    expect(pool.capacity).toBeCloseTo(39 + 19 + 39, 9);
    expect(pool.months[0].users).toBe(3);
    expect(pool.billed).toBeCloseTo(93.0712, 3);
    expect(pool.months[0].exhaustedOn).toBe(parseDay('2026-10-03'));
    expect(pool.capacityExceeded).toBe(true);
  });

  it('demo: three months, August with spare credits, September complete and exhausted, October projected to stay within the pool', () => {
    const pool = data.demo.pl.analysis.pool;
    expect(pool.months.map((month) => month.key)).toEqual(['2026-08', '2026-09', '2026-10']);
    const [august, september, october] = pool.months;
    expect(august.complete).toBe(true);
    expect(august.projection).toBeNull();
    expect(august.net).toBe(0);
    expect(august.exhaustedOn).toBeNull();
    expect(august.capacityExceeded).toBe(false);
    expect(august.utilization).toBeGreaterThan(0);
    expect(august.utilization).toBeLessThan(0.5);
    expect(september.complete).toBe(true);
    expect(september.projection).toBeNull();
    expect(september.net).toBeGreaterThan(0);
    expect(september.exhaustedOn).not.toBeNull();
    expect(september.exhaustedOn!).toBeGreaterThanOrEqual(september.monthStart);
    expect(september.exhaustedOn!).toBeLessThanOrEqual(september.monthEnd);
    expect(september.capacityExceeded).toBe(false);
    expect(september.utilization).toBeCloseTo(1, 6);
    expect(october.complete).toBe(false);
    expect(october.net).toBe(0);
    expect(october.exhaustedOn).toBeNull();
    expect(october.capacityExceeded).toBe(false);
    expect(october.daysObserved).toBeLessThanOrEqual(26);
    expect(october.utilization).toBeGreaterThan(august.utilization);
    expect(october.utilization).toBeLessThan(1);
    const projection = october.projection!;
    expect(projection.asOf).toBe(parseDay('2026-10-26'));
    expect(projection.daysLeft).toBe(5);
    expect(projection.projGross).toBeGreaterThan(october.gross);
    expect(projection.projGrossHigh).toBeLessThan(october.capacity);
    expect(projection.exhaustionDate).toBeNull();
    expect(projection.projNetHigh).toBe(0);
    expect(pool.monthsExhausted).toBe(1);
    expect(pool.latest).toBe(october);
    expect(pool.capacity).toBeCloseTo(august.capacity + september.capacity + october.capacity, 9);
    expect(pool.billed).toBeCloseTo(september.net, 9);
  });

  it('demo cut in mid-September: September is still running and its pool is projected to run out', () => {
    const pool = data['demo mid-September'].pl.analysis.pool;
    expect(pool.months.map((month) => month.key)).toEqual(['2026-08', '2026-09']);
    const [august, september] = pool.months;
    expect(august.complete).toBe(true);
    expect(august.projection).toBeNull();
    expect(august.net).toBe(0);
    expect(september.complete).toBe(false);
    expect(september.net).toBe(0);
    expect(september.exhaustedOn).toBeNull();
    expect(september.capacityExceeded).toBe(false);
    const projection = september.projection!;
    expect(projection.asOf).toBe(parseDay(MID_SEPTEMBER));
    expect(projection.daysLeft).toBe(15);
    expect(projection.exhaustionDate).not.toBeNull();
    expect(projection.exhaustionDate!).toBeGreaterThan(projection.asOf);
    expect(projection.exhaustionDate!).toBeLessThanOrEqual(september.monthEnd);
    expect(projection.projGross).toBeGreaterThan(september.capacity);
    expect(projection.projNet).toBeCloseTo(projection.projGross - september.capacity, 6);
    expect(projection.projNet).toBeGreaterThan(0);
    expect(pool.monthsExhausted).toBe(0);
    expect(pool.latest).toBe(september);
    expect(pool.billed).toBe(0);
  });

  it('demo: the capacity of a month is the sum of the quotas of the users seen that month', () => {
    const { rows, pl: pipeline } = data.demo;
    const expectedMonths = naiveMonths(rows);
    pipeline.analysis.pool.months.forEach((month, index) => {
      expect(month.capacity).toBeCloseTo(sum([...expectedMonths[index].quota.values()]) * 0.01, 9);
    });
    const [august, september, october] = pipeline.analysis.pool.months;
    expect(september.users).toBeGreaterThanOrEqual(august.users);
    expect(october.users).toBeGreaterThanOrEqual(september.users);
  });
});

describe('pool over a sub-range of the data', () => {
  const rangeOf = (from: string, to: string) => ({ ...emptyFilters(), dateFrom: parseDay(from), dateTo: parseDay(to) });

  it('only counts the days inside the range and the users seen in it', () => {
    const { rows, pl: pipeline } = data.demo;
    const from = '2026-09-20';
    const to = '2026-10-05';
    const analysis = pipeline.run(rangeOf(from, to), pipeline.settings);
    const inRange = rows.filter((row) => row.date >= from && row.date <= to);
    const expectedMonths = naiveMonths(inRange);
    expect(analysis.pool.months.map((month) => month.key)).toEqual(['2026-09', '2026-10']);
    analysis.pool.months.forEach((month, index) => {
      expect(month.gross).toBeCloseTo(expectedMonths[index].gross, 6);
      expect(month.net).toBeCloseTo(expectedMonths[index].net, 6);
      expect(month.daysObserved).toBe(expectedMonths[index].daily.size);
      expect(month.capacity).toBeCloseTo(sum([...expectedMonths[index].quota.values()]) * 0.01, 9);
      expect(month.cumulative.every((point) => point.day >= parseDay(from) && point.day <= parseDay(to))).toBe(true);
    });
    expect(analysis.narrowed).toBe(false);
  });

  it('a window that ends before the last day of data is not projected', () => {
    const analysis = data.demo.pl.run(rangeOf('2026-10-01', '2026-10-10'), data.demo.pl.settings);
    expect(analysis.pool.months).toHaveLength(1);
    expect(analysis.pool.months[0].complete).toBe(true);
    expect(analysis.pool.months[0].projection).toBeNull();
  });

  it('a window outside the data has no months and a zero (not NaN) summary', () => {
    const analysis = data.demo.pl.run(rangeOf('2030-01-01', '2030-02-01'), data.demo.pl.settings);
    expect(analysis.pool.months).toEqual([]);
    expect(analysis.pool.latest).toBeNull();
    expect(analysis.pool.capacity).toBe(0);
    expect(analysis.pool.utilization).toBe(0);
    expect(analysis.pool.capacityExceeded).toBe(false);
  });

  it('an empty scope (no rows match) has an empty pool and no budget status even when a budget is set', () => {
    const filters = { ...emptyFilters(), users: ['nobody-here'] };
    const analysis = data.demo.pl.run(filters, mergeSettings({ budgetMonthlyBilled: 100 }));
    expect(analysis.pool.months).toEqual([]);
    expect(analysis.pool.budget).toBeNull();
    expect(Number.isNaN(analysis.pool.utilization)).toBe(false);
  });
});

describe('capacity tolerance (synthetic)', () => {
  const oneSeat = (discount: number) =>
    analyzeCsv(makeCsv([{ date: '2026-10-02', user: 'u1', gross: discount, discount, net: 0, quota: 1900 }, { date: '2026-10-30', user: 'u1', gross: 0.01, quota: 1900 }]));

  it('treats a one-cent rounding excess as within the pool', async () => {
    const pipeline = await oneSeat(19);
    expect(pipeline.analysis.pool.months[0].capacityExceeded).toBe(false);
    expect(pipeline.analysis.pool.months[0].utilization).toBeCloseTo(19.01 / 19, 6);
  });

  it('flags a pool that covered clearly more than the seats fund', async () => {
    const pipeline = await oneSeat(19.02);
    const month = pipeline.analysis.pool.months[0];
    expect(month.capacity).toBeCloseTo(19, 9);
    expect(month.capacityExceeded).toBe(true);
    expect(month.utilization).toBeNaN();
    expect(pipeline.analysis.pool.capacityExceeded).toBe(true);
    expect(pipeline.analysis.pool.capacityIsLowerBound).toBe(true);
  });

  it('a pool with spare credits is not exhausted and reports its headroom', async () => {
    const pipeline = await oneSeat(10);
    const month = pipeline.analysis.pool.months[0];
    expect(month.exhaustedOn).toBeNull();
    expect(month.utilization).toBeCloseTo(10.01 / 19, 6);
    expect(month.headroom).toBeCloseTo(19 - 10.01, 6);
  });
});

describe('defaultQuotaCredits', () => {
  const quotas = async (list: number[]) => {
    const specs: RowSpec[] = list.map((quota, index) => ({ date: '2026-10-01', user: `u${index}`, gross: 1, quota: quota }));
    if (list.length === 0) specs.push({ date: '2026-10-01', user: '', gross: 1, product: 'ghas', sku: 'code_security_ai_credit' });
    const pipeline = await analyzeCsv(makeCsv(specs));
    return defaultQuotaCredits(pipeline.analysis.agg);
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
    const pipeline = data.A.pl;
    const base = poolWith(pipeline, {});
    expect(base.capacity).toBeCloseTo(58, 9);
    const withRoster = poolWith(pipeline, { roster: ghosts });
    const month = withRoster.months[0];
    expect(month.csvCapacity).toBeCloseTo(58, 9);
    expect(month.extraCapacity).toBeCloseTo(19 + 39, 9);
    expect(month.capacity).toBeCloseTo(116, 9);
    expect(withRoster.capacity).toBeCloseTo(116, 9);
    expect(month.utilization).toBeCloseTo(58 / 116, 6);
    expect(month.headroom).toBeCloseTo(58, 6);
    expect(withRoster.capacityIsLowerBound).toBe(false);
    expect(base.capacityIsLowerBound).toBe(true);
  });

  it('extra seats are counted per month on a multi-month dataset', () => {
    const demo = data.demo.pl;
    const base = poolWith(demo, {});
    const withRoster = poolWith(demo, { roster: ghosts });
    expect(base.months).toHaveLength(3);
    base.months.forEach((month, index) => {
      expect(withRoster.months[index].extraCapacity).toBeCloseTo(58, 9);
      expect(withRoster.months[index].capacity).toBeCloseTo(month.capacity + 58, 9);
    });
    expect(withRoster.capacity).toBeCloseTo(base.capacity + 3 * 58, 9);
  });

  it('a roster user already in the report (any case, surrounding spaces) adds nothing', () => {
    const pipeline = data.A.pl;
    const pool = poolWith(pipeline, { roster: [{ user: '  ALEX-dev ', plan: 'Business' }, { user: 'Sam-LEE', plan: 'Enterprise' }] });
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
    const pipeline = data.B.pl;
    const pool = poolWith(pipeline, { extraSeats: { business: 0, enterprise: 100 } });
    const month = pool.months[0];
    expect(month.capacity).toBeCloseTo(39 + 3900, 6);
    expect(month.capacityExceeded).toBe(false);
    expect(month.utilization).toBeCloseTo(month.discount / month.capacity, 9);
    expect(month.headroom).toBeCloseTo(month.capacity - month.discount, 6);
    expect(pool.capacityExceeded).toBe(false);
    expect(pool.capacityIsLowerBound).toBe(false);
    expect(month.projection!.projNet).toBe(0);
    expect(month.projection!.exhaustionDate).toBeNull();
  });

  it('with a known pool size the projection forecasts exhaustion and billed overage (partial-export fixture, 35 extra Enterprise seats)', () => {
    const pool = poolWith(data.B.pl, { extraSeats: { business: 0, enterprise: 35 } });
    const month = pool.months[0];
    const projection = month.projection!;
    expect(month.capacity).toBeCloseTo(39 + 35 * 39, 6);
    expect(month.capacityExceeded).toBe(false);
    const midRate = (projection.rateMtd + projection.rate7) / 2;
    expect(projection.exhaustionDate).toBe(projection.asOf + Math.ceil((month.capacity - month.gross) / midRate));
    expect(projection.exhaustionDate).toBe(parseDay('2026-10-30'));
    expect(projection.projNet).toBeCloseTo(projection.projGross - month.capacity, 6);
    expect(projection.projNet).toBeGreaterThan(0);
  });

  it('the analysis applies roster and extra seats only when the scope is not narrowed', () => {
    const demo = data.demo.pl;
    const settings = mergeSettings({ roster: ghosts, extraSeats: { business: 1, enterprise: 0 } });
    const whole = demo.run(emptyFilters(), settings);
    const dated = demo.run({ ...emptyFilters(), dateFrom: parseDay('2026-09-10') }, settings);
    const byModel = demo.run({ ...emptyFilters(), models: ['GPT-6 Astra'] }, settings);
    const byTier = demo.run({ ...emptyFilters(), tiers: ['runaway'] }, settings);
    expect(whole.pool.months.every((month) => Math.abs(month.extraCapacity - 77) < 1e-9)).toBe(true);
    expect(dated.pool.months.every((month) => Math.abs(month.extraCapacity - 77) < 1e-9)).toBe(true);
    expect(whole.pool.capacityIsLowerBound).toBe(false);
    for (const analysis of [byModel, byTier]) {
      expect(analysis.narrowed).toBe(true);
      expect(analysis.pool.months.every((month) => month.extraCapacity === 0)).toBe(true);
      expect(analysis.pool.capacityIsLowerBound).toBe(true);
    }
  });
});

describe('budget status', () => {
  const withBudget = (name: DsName, budget: number | null, from?: string, to?: string) => {
    const pipeline = data[name].pl;
    const filters = { ...emptyFilters(), ...(from ? { dateFrom: parseDay(from) } : {}), ...(to ? { dateTo: parseDay(to) } : {}) };
    return pipeline.run(filters, mergeSettings({ budgetMonthlyBilled: budget })).pool;
  };

  it('is absent without a budget (null or zero)', () => {
    expect(withBudget('A', null).budget).toBeNull();
    expect(withBudget('A', 0).budget).toBeNull();
  });

  it('pool-used fixture, $100 budget: 93% burnt, will be passed on 2026-10-22', () => {
    const pool = withBudget('A', 100);
    const budgetStatus = pool.budget!;
    const month = pool.latest!;
    expect(budgetStatus.monthlyBudget).toBe(100);
    expect(budgetStatus.month).toBe('Oct 2026');
    expect(budgetStatus.billedToDate).toBeCloseTo(month.net, 9);
    expect(budgetStatus.billedToDate).toBeCloseTo(93.0712, 3);
    expect(budgetStatus.burn).toBeCloseTo(0.930712, 5);
    expect(budgetStatus.projectedBilled).toBeCloseTo(month.projection!.projNet, 9);
    expect(budgetStatus.projectedBurn).toBeCloseTo(month.projection!.projNet / 100, 9);
    expect(budgetStatus.projectedBurn!).toBeGreaterThan(1);
    expect(budgetStatus.hitDate).toBe(parseDay('2026-10-22'));
  });

  it('pool-used fixture: the hit date is asOf + ceil(remaining ÷ average daily rate), only if it is still in the month', () => {
    const projection = withBudget('A', 95).latest!.projection!;
    const rate = (projection.rateMtd + projection.rate7) / 2;
    const hit = (budget: number): number | null => {
      const hitDay = projection.asOf + Math.ceil((budget - projection.mtdNet) / rate);
      return hitDay <= parseDay('2026-10-31') ? hitDay : null;
    };
    expect(withBudget('A', 95).budget!.hitDate).toBe(hit(95));
    expect(withBudget('A', 95).budget!.hitDate).toBe(parseDay('2026-10-21'));
    expect(withBudget('A', 155).budget!.hitDate).toBe(hit(155));
    expect(withBudget('A', 155).budget!.hitDate).toBe(parseDay('2026-10-31'));
    expect(withBudget('A', 160).budget!.hitDate).toBe(hit(160));
    expect(withBudget('A', 160).budget!.hitDate).toBeNull();
    expect(withBudget('A', 5000).budget!.hitDate).toBeNull();
  });

  it('a budget that is already exceeded has no hit date but a burn above 100%', () => {
    const budgetStatus = withBudget('A', 50).budget!;
    expect(budgetStatus.hitDate).toBeNull();
    expect(budgetStatus.burn).toBeCloseTo(93.0712 / 50, 4);
    expect(budgetStatus.burn).toBeGreaterThan(1);
  });

  it('partial-export fixture: nothing is billed, so nothing is burnt', () => {
    const budgetStatus = withBudget('B', 100).budget!;
    expect(budgetStatus.billedToDate).toBe(0);
    expect(budgetStatus.burn).toBe(0);
    expect(budgetStatus.projectedBilled).toBe(0);
    expect(budgetStatus.projectedBurn).toBe(0);
    expect(budgetStatus.hitDate).toBeNull();
  });

  it('demo mid-September, pool not yet exhausted: the budget is hit after the pool runs out', () => {
    for (const budget of [100, 200, 260]) {
      const pool = withBudget('demo mid-September', budget);
      const september = pool.latest!;
      const projection = september.projection!;
      const budgetStatus = pool.budget!;
      expect(budgetStatus.month).toBe('Sep 2026');
      expect(budgetStatus.billedToDate).toBe(0);
      expect(budgetStatus.burn).toBe(0);
      expect(budgetStatus.projectedBilled).toBeCloseTo(projection.projNet, 9);
      expect(projection.projNet).toBeGreaterThanOrEqual(budget);
      const rate = (projection.rateMtd + projection.rate7) / 2;
      expect(budgetStatus.hitDate, `budget ${budget}`).toBe(Math.min(september.monthEnd, projection.exhaustionDate! + Math.ceil(budget / rate)));
      expect(budgetStatus.hitDate!).toBeGreaterThan(projection.exhaustionDate!);
    }
  });

  it('demo mid-September: a budget above the projected overage will not be hit', () => {
    const budgetStatus = withBudget('demo mid-September', 1000).budget!;
    expect(budgetStatus.hitDate).toBeNull();
    expect(budgetStatus.projectedBurn!).toBeLessThan(1);
    expect(budgetStatus.projectedBurn!).toBeGreaterThan(0);
  });

  it('demo October: the pool is not projected to run out, so nothing is projected as billed and no budget is hit', () => {
    for (const budget of [1, 100]) {
      const budgetStatus = withBudget('demo', budget).budget!;
      expect(budgetStatus.month).toBe('Oct 2026');
      expect(budgetStatus.billedToDate).toBe(0);
      expect(budgetStatus.burn).toBe(0);
      expect(budgetStatus.projectedBilled).toBe(0);
      expect(budgetStatus.projectedBurn).toBe(0);
      expect(budgetStatus.hitDate).toBeNull();
    }
  });

  it('a finished month has no projection, so only the billed share is reported', () => {
    const pool = withBudget('demo', 100, undefined, '2026-09-30');
    const budgetStatus = pool.budget!;
    expect(budgetStatus.month).toBe('Sep 2026');
    expect(budgetStatus.billedToDate).toBeCloseTo(pool.latest!.net, 9);
    expect(budgetStatus.billedToDate).toBeGreaterThan(100);
    expect(budgetStatus.burn).toBeCloseTo(budgetStatus.billedToDate / 100, 9);
    expect(budgetStatus.projectedBilled).toBeNull();
    expect(budgetStatus.projectedBurn).toBeNull();
    expect(budgetStatus.hitDate).toBeNull();
  });
});

function fakeUsers(profiles: Partial<UserProfile>[], inactive: { user: string; plan: string | null }[] = [], fallbackQuotaCredits = 1900): UserSet {
  const full = profiles.map((profile, index) => ({
    id: index + 1,
    name: `user-${index + 1}`,
    plan: 'Business',
    quotaCredits: 1900,
    tier: 'light',
    persona: 'steady',
    isNew: false,
    peakMonthGross: 5,
    gross: 5,
    utilization: 0.26,
    ...profile,
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
    const plan = planSeats(fakeUsers(quotas.map((quota) => ({ ...idle, quotaCredits: quota }))), settings);
    expect(plan.idle.map((seat) => seat.value)).toEqual([19, 39, 10, 25]);
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
    const enterpriseUser = { quotaCredits: 3900, plan: 'Enterprise' };
    const plan = planSeats(
      fakeUsers([
        { ...enterpriseUser, peakMonthGross: threshold - 0.01 },
        { ...enterpriseUser, peakMonthGross: threshold + 0.01 },
        { ...enterpriseUser, peakMonthGross: 0 },
        { ...enterpriseUser, peakMonthGross: 19 },
        { quotaCredits: 1900, peakMonthGross: 1 },
        { quotaCredits: 4000, peakMonthGross: 1 },
        { quotaCredits: 1000, peakMonthGross: 1 },
      ]),
      settings,
    );
    expect(plan.downgrade.map((seat) => seat.id)).toEqual([1, 3]);
    expect(plan.downgradeValue).toBe(40);
    expect(plan.downgrade.every((seat) => seat.value === PLAN_PRICE.Enterprise - PLAN_PRICE.Business)).toBe(true);
    expect(threshold).toBeCloseTo(15.2, 9);
  });

  it('new users and idle seats are never downgrade candidates', () => {
    const enterpriseUser = { quotaCredits: 3900, plan: 'Enterprise', peakMonthGross: 1 };
    const plan = planSeats(
      fakeUsers([
        { ...enterpriseUser, isNew: true, tier: 'minimal', persona: 'new' },
        { ...enterpriseUser, isNew: true, tier: 'light', persona: 'new' },
        { ...enterpriseUser, tier: 'minimal', persona: 'dormant' },
        { ...enterpriseUser, tier: 'minimal', persona: 'lapsed' },
        { ...enterpriseUser, tier: 'light', persona: 'lapsed' },
        { ...enterpriseUser, tier: 'minimal', persona: 'steady' },
      ]),
      settings,
    );
    expect(plan.idle.map((seat) => seat.id)).toEqual([3, 4]);
    expect(plan.downgrade.map((seat) => seat.id)).toEqual([5, 6]);
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
    expect(plan.unused.map((seat) => seat.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(plan.unused.map((seat) => seat.plan)).toEqual(['Business', 'enterprise', '2500', '25', '$1,900', 'Enterprise (assumed)', '', 'platinum']);
    expect(plan.unused.map((seat) => seat.value)).toEqual([19, 39, 25, 25, 19, 39, 39, 39]);
    expect(plan.unused.every((seat) => seat.id === -1 && seat.gross === 0 && seat.utilization === 0)).toBe(true);
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
  const octoberDate = (dayOfMonth: number): string => `2026-10-${String(dayOfMonth).padStart(2, '0')}`;
  const SPECS: RowSpec[] = [
    { date: octoberDate(1), user: 'anchor', gross: 10, quota: 1900 },
    { date: octoberDate(30), user: 'anchor', gross: 10, quota: 1900 },
    ...Array.from({ length: 20 }, (_, index): RowSpec => ({ date: octoberDate(index + 1), user: 'ent-low', gross: 0.5, quota: 3900 })),
    { date: octoberDate(3), user: 'ent-edge-in', gross: 15.1, quota: 3900 },
    { date: octoberDate(3), user: 'ent-edge-out', gross: 15.3, quota: 3900 },
    { date: octoberDate(3), user: 'ent-high', gross: 30, quota: 3900 },
    { date: octoberDate(2), user: 'ent-lapsed-light', gross: 5, quota: 3900 },
    { date: octoberDate(3), user: 'ent-idle', gross: 1, quota: 3900 },
    { date: octoberDate(20), user: 'ent-new', gross: 2, quota: 3900 },
    { date: octoberDate(3), user: 'biz-low', gross: 5, quota: 1900 },
    { date: octoberDate(2), user: 'biz-idle', gross: 0.5, quota: 1900 },
    { date: octoberDate(10), user: 'biz-dormant', gross: 0.1, quota: 1900 },
    { date: octoberDate(28), user: 'biz-dormant', gross: 0.1, quota: 1900 },
    { date: octoberDate(2), user: 'custom-idle', gross: 0.2, quota: 1000 },
    { date: octoberDate(2), user: 'noquota-idle', gross: 0.2, quota: 0 },
  ];
  let pipeline: Pipeline;
  const names = (candidates: { name: string }[]): string[] => candidates.map((candidate) => candidate.name).sort();
  const profile = (name: string): UserProfile => pipeline.analysis.users.profiles.find((user) => user.name === name)!;

  beforeAll(async () => {
    pipeline = await analyzeCsv(makeCsv(SPECS));
  });

  it('the scenario produces the profiles the seat rules are about', () => {
    expect(pipeline.analysis.users.fallbackQuotaCredits).toBe(3900);
    expect(defaultQuotaCredits(pipeline.analysis.agg)).toBe(3900);
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
    for (const [name, expected] of Object.entries(want)) {
      const user = profile(name);
      expect(user.tier, `${name} tier`).toBe(expected.tier);
      if (expected.persona) expect(user.persona, `${name} persona`).toBe(expected.persona);
      expect(user.isNew, `${name} isNew`).toBe(expected.isNew ?? false);
    }
  });

  it('flags the idle seats and values them by plan', () => {
    const { seats } = pipeline.analysis;
    expect(names(seats.idle)).toEqual(['biz-dormant', 'biz-idle', 'custom-idle', 'ent-idle', 'noquota-idle']);
    const value = (name: string): number => seats.idle.find((seat) => seat.name === name)!.value;
    expect(value('ent-idle')).toBe(39);
    expect(value('biz-idle')).toBe(19);
    expect(value('biz-dormant')).toBe(19);
    expect(value('custom-idle')).toBe(10);
    expect(value('noquota-idle')).toBe(39);
    expect(seats.idleValue).toBeCloseTo(126, 9);
  });

  it('flags Enterprise seats that stayed under 80% of the Business allotment, at $20 each', () => {
    const { seats } = pipeline.analysis;
    expect(names(seats.downgrade)).toEqual(['ent-edge-in', 'ent-lapsed-light', 'ent-low']);
    expect(seats.downgrade.every((seat) => seat.value === 20 && seat.plan === 'Enterprise')).toBe(true);
    expect(seats.downgradeValue).toBeCloseTo(60, 9);
    const not = ['ent-edge-out', 'ent-high', 'ent-idle', 'ent-new', 'biz-low', 'anchor'];
    for (const name of not) expect(names(seats.downgrade), name).not.toContain(name);
  });

  it('has no unused seats without a roster', () => {
    expect(pipeline.analysis.seats.unused).toEqual([]);
    expect(pipeline.analysis.seats.unusedValue).toBe(0);
  });

  it('is what planSeats returns for the analysed users', () => {
    expect(pipeline.analysis.seats).toEqual(planSeats(pipeline.analysis.users, pipeline.settings));
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
      const analysis = pipeline.run(pipeline.filters, mergeSettings({ roster }));
      expect(analysis.seats.unused).toEqual([]);
      expect(analysis.seats.unusedValue).toBe(0);
      expect(analysis.seats.idle).toEqual([]);
    });

    it('keeps seats without activity dates out of the unused list even with duplicate or blank lines', () => {
      const analysis = pipeline.run(pipeline.filters, mergeSettings({ roster: [...roster, { user: 'GHOST-BIZ', plan: 'Enterprise' }, { user: '   ', plan: 'Business' }, { user: '' }] }));
      expect(analysis.seats.unused).toEqual([]);
      expect(analysis.seats.unusedValue).toBe(0);
    });

    it('uses roster plans to size pool capacity without counting seats as unused', () => {
      const analysis = pipeline.run(pipeline.filters, mergeSettings({ roster }));
      const month = analysis.pool.months[0];
      expect(analysis.seats.unusedValue).toBe(0);
      expect(month.extraCapacity).toBeCloseTo(166, 9);
      expect(month.capacity).toBeCloseTo(month.csvCapacity + 166, 9);
    });

    it('duplicate and blank roster lines add no pool capacity', () => {
      const analysis = pipeline.run(pipeline.filters, mergeSettings({ roster: [...roster, { user: 'GHOST-BIZ', plan: 'Enterprise' }, { user: '   ', plan: 'Business' }, { user: '' }] }));
      expect(analysis.seats.unusedValue).toBe(0);
      expect(analysis.pool.months[0].extraCapacity).toBeCloseTo(166, 9);
    });

    it('the first roster line sizes pool capacity when a user is listed twice', () => {
      const first = pipeline.run(pipeline.filters, mergeSettings({ roster: [{ user: 'twice', plan: 'Business' }, { user: 'TWICE', plan: 'Enterprise' }] }));
      const second = pipeline.run(pipeline.filters, mergeSettings({ roster: [{ user: 'twice', plan: 'Enterprise' }, { user: 'TWICE', plan: 'Business' }] }));
      expect(first.seats.unused).toEqual([]);
      expect(first.pool.months[0].extraCapacity).toBeCloseTo(19, 9);
      expect(second.seats.unused).toEqual([]);
      expect(second.pool.months[0].extraCapacity).toBeCloseTo(39, 9);
    });

    it('is not offered when the scope is narrowed: no unused seats, and no idle/downgrade savings from the whole organisation', () => {
      const analysis = pipeline.run({ ...pipeline.filters, models: ['GPT-5.6 Terra'], billing: 'covered' }, mergeSettings({ roster }));
      expect(analysis.narrowed).toBe(true);
      expect(analysis.seats.unused).toEqual([]);
      expect(analysis.seats.unusedValue).toBe(0);
      expect(analysis.pool.months.every((month) => month.extraCapacity === 0)).toBe(true);
    });
  });
});

describe('seat plan: fixtures and the demo', () => {
  it('both fixtures have nothing to reclaim', () => {
    for (const name of ['A', 'B', 'A+B'] as const) {
      const seats = data[name].pl.analysis.seats;
      expect(seats.idle, name).toEqual([]);
      expect(seats.downgrade, name).toEqual([]);
      expect(seats.unused, name).toEqual([]);
      expect(seats.idleValue + seats.downgradeValue + seats.unusedValue, name).toBe(0);
    }
  });

  it('demo: idle and downgrade seats follow the rules applied to the user profiles', () => {
    const { rows, pl: pipeline } = data.demo;
    const { seats, users } = pipeline.analysis;
    const idle = users.profiles.filter((user) => user.tier === 'minimal' && (user.persona === 'dormant' || user.persona === 'lapsed'));
    const idleIds = new Set(idle.map((user) => user.id));
    expect(seats.idle.map((seat) => seat.id).sort((a, b) => a - b)).toEqual(idle.map((user) => user.id).sort((a, b) => a - b));
    expect(seats.idle.length).toBeGreaterThan(0);
    expect(seats.idleValue).toBeCloseTo(sum(idle.map((user) => seatPrice(user.quotaCredits))), 9);

    const monthly = new Map<string, Map<string, number>>();
    for (const row of rows) {
      if (!row.username) continue;
      const byMonth = monthly.get(row.username) ?? new Map<string, number>();
      byMonth.set(row.date.slice(0, 7), (byMonth.get(row.date.slice(0, 7)) ?? 0) + numOf(row, 'gross_amount'));
      monthly.set(row.username, byMonth);
    }
    const peak = (name: string): number => Math.max(...monthly.get(name)!.values());
    const down = users.profiles.filter((user) => !idleIds.has(user.id) && !user.isNew && user.quotaCredits === 3900 && peak(user.name) <= 0.8 * 19);
    expect(seats.downgrade.map((seat) => seat.id).sort((a, b) => a - b)).toEqual(down.map((user) => user.id).sort((a, b) => a - b));
    expect(seats.downgrade.length).toBeGreaterThan(0);
    expect(seats.downgradeValue).toBeCloseTo(20 * down.length, 9);
    for (const seat of seats.downgrade) expect(seat.plan).toBe('Enterprise');
  });

  it('demo: idle and downgrade seats never overlap and have no roster seats', () => {
    const { seats } = data.demo.pl.analysis;
    const ids = new Set(seats.idle.map((seat) => seat.id));
    expect(seats.downgrade.every((seat) => !ids.has(seat.id))).toBe(true);
    expect(seats.unused).toEqual([]);
  });

  it('demo: roster-only seats are excluded while visible user actions stay in scope', () => {
    const demo = data.demo.pl;
    const analysis = demo.run({ ...emptyFilters(), tiers: ['minimal'] }, mergeSettings({ roster: [{ user: 'ghost', plan: 'Business' }] }));
    expect(analysis.segmentFiltered).toBe(true);
    expect(analysis.seats.unused).toEqual([]);
    const visible = new Set(analysis.users.profiles.map((user) => user.id));
    expect(analysis.seats.idle).toEqual([]);
    for (const seat of analysis.seats.downgrade) expect(visible.has(seat.id)).toBe(true);
  });
});
