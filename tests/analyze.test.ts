import { beforeAll, describe, expect, it } from 'vitest';
import { analyze, type Analysis } from '../src/lib/analytics/analyze';
import { aggregate, quickTotals } from '../src/lib/analytics/aggregate';
import { dataCoverage } from '../src/lib/analytics/coverage';
import { emptyFilters, type Filters } from '../src/lib/analytics/filters';
import { mergeSettings, type Settings } from '../src/lib/analytics/settings';
import type { DemoResult } from '../src/lib/demo/generate';
import { VENDORS } from '../src/lib/pricing/card';
import {
  analysisTexts,
  analyzeDemo,
  analyzeSources,
  BAD_TEXT,
  CSV_HEADER,
  dayNum,
  isoOf,
  modelOfRow,
  naiveRows,
  naiveTotals,
  sum,
  type NaiveRow,
  type Pipeline,
} from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures, readFixture } from './fixtures';

const F = (over: Partial<Filters> = {}): Filters => ({ ...emptyFilters(), ...over });
const D = dayNum;

const inWindow = (rows: NaiveRow[], from: number, to: number, keep: (r: NaiveRow) => boolean = () => true): NaiveRow[] =>
  rows.filter((r) => {
    const d = dayNum(r.date);
    return d >= from && d <= to && keep(r);
  });

const EMPTY_HEADLINE = { status: 'watch', title: 'No rows match the current filters', detail: 'Widen the date range or clear some filters.' };

/** An analysis with the timing removed, to compare two runs. */
const stripped = (a: Analysis): Omit<Analysis, 'ms'> => {
  const { ms: _ms, ...rest } = a;
  return rest;
};

function expectTotals(got: { rows: number; gross: number; discount: number; net: number; credits: number; users: number }, want: ReturnType<typeof naiveTotals>): void {
  expect(got.rows).toBe(want.rows);
  expect(got.users).toBe(want.users);
  expect(got.gross).toBeCloseTo(want.gross, 6);
  expect(got.discount).toBeCloseTo(want.discount, 6);
  expect(got.net).toBeCloseTo(want.net, 6);
  expect(got.credits).toBeCloseTo(want.credits, 4);
}

let p: Pipeline & { demo: DemoResult };
let rows: NaiveRow[];
let min: number;
let max: number;

beforeAll(async () => {
  p = await analyzeDemo();
  rows = naiveRows(p.demo.csv);
  min = p.store.minDay;
  max = p.store.maxDay;
});

describe('analyze: date range', () => {
  it('analyses the whole data when no date is set', () => {
    const a = p.analysis;
    expect(a.range).toEqual({ start: min, end: max, length: max - min + 1 });
    expect(a.range).toBe(a.agg.range);
    expect(isoOf(min)).toBe('2026-09-01');
    expect(isoOf(max)).toBe('2026-10-26');
    expect(a.narrowed).toBe(false);
    expect(a.segmentFiltered).toBe(false);
    expect(a.baseMask).toBeNull();
    expect(a.mask).toBeNull();
    expect(a.users).toBe(a.population);
    expect(a.agg.totals.rows).toBe(rows.length);
  });

  it('clamps a range that is wider than the data to the data', () => {
    const a = p.run(F({ dateFrom: min - 100, dateTo: max + 100 }));
    const whole = p.analysis;
    expect(a.range).toEqual(whole.range);
    expect(a.agg.totals).toEqual(whole.agg.totals);
    expect(a.previous).toBeNull();
    expect(a.narrowed).toBe(false);
    expect(stripped(a).recs).toEqual(stripped(whole).recs);
    expect(p.run(F({ dateFrom: min - 100 })).range).toEqual(whole.range);
    expect(p.run(F({ dateTo: max + 100 })).range).toEqual(whole.range);
  });

  it('uses the first or the last day of the data for an open end', () => {
    const fromOct = p.run(F({ dateFrom: D('2026-10-01') }));
    expect(fromOct.range).toEqual({ start: D('2026-10-01'), end: max, length: max - D('2026-10-01') + 1 });
    expectTotals({ ...fromOct.agg.totals, credits: fromOct.agg.totals.credits, users: fromOct.agg.totals.users }, naiveTotals(inWindow(rows, D('2026-10-01'), max)));
    const toSep = p.run(F({ dateTo: D('2026-09-30') }));
    expect(toSep.range).toEqual({ start: min, end: D('2026-09-30'), length: 30 });
    expectTotals(toSep.agg.totals, naiveTotals(inWindow(rows, min, D('2026-09-30'))));
    expect(fromOct.narrowed).toBe(false);
    expect(toSep.narrowed).toBe(false);
  });

  it('analyses exactly the days of a range inside the data, and the pool months it touches', () => {
    const from = D('2026-09-25');
    const to = D('2026-10-04');
    const a = p.run(F({ dateFrom: from, dateTo: to }));
    expect(a.range).toEqual({ start: from, end: to, length: 10 });
    expectTotals(a.agg.totals, naiveTotals(inWindow(rows, from, to)));
    expect(a.agg.days.gross).toHaveLength(10);
    expect(sum([...a.agg.days.gross])).toBeCloseTo(a.agg.totals.gross, 6);
    expect(a.pool.months.map((m) => m.key)).toEqual(['2026-09', '2026-10']);
  });

  it('analyses a single day', () => {
    const day = D('2026-09-11');
    const a = p.run(F({ dateFrom: day, dateTo: day }));
    expect(a.range).toEqual({ start: day, end: day, length: 1 });
    expectTotals(a.agg.totals, naiveTotals(inWindow(rows, day, day)));
    expect(a.previous).toMatchObject({ from: day - 1, to: day - 1 });
    expect(a.trend.reliable).toBe(false);
    expect(analysisTexts(a).filter((t) => BAD_TEXT.test(t))).toEqual([]);
  });

  const OUTSIDE: [string, () => Partial<Filters>][] = [
    ['after the data', () => ({ dateFrom: max + 5 })],
    ['before the data', () => ({ dateTo: min - 5 })],
    ['both dates after the data', () => ({ dateFrom: max + 3, dateTo: max + 9 })],
    ['both dates before the data', () => ({ dateFrom: min - 9, dateTo: min - 3 })],
    ['from later than to', () => ({ dateFrom: max - 3, dateTo: min + 3 })],
  ];

  for (const [name, filters] of OUTSIDE) {
    it(`a range ${name} is an empty scope, not an error`, () => {
      const a = p.run(F(filters()));
      expect(a.agg.totals).toMatchObject({ rows: 0, gross: 0, discount: 0, net: 0, credits: 0 });
      expect(a.agg.range.length).toBe(0);
      expect(a.recs).toEqual([]);
      expect(a.headline).toEqual(EMPTY_HEADLINE);
      expect(a.previous).toBeNull();
      expect(a.pool.months).toEqual([]);
      expect(a.users.profiles).toEqual([]);
      expect(a.anomalies).toEqual([]);
      expect(a.trend.reliable).toBe(false);
      expect(a.levers.total).toBe(0);
      expect(a.plan.saving).toBe(0);
      expect(a.plan.baseCost).toBe(0);
      expect(analysisTexts(a).filter((t) => BAD_TEXT.test(t))).toEqual([]);
    });
  }

  it('a file without data rows analyses to an empty scope', async () => {
    const header = `\uFEFF${CSV_HEADER.map((h) => `"${h}"`).join(',')}\n`;
    const e = await analyzeSources([{ name: 'empty.csv', data: header }]);
    expect(e.store.n).toBe(0);
    const a = e.analysis;
    expect(a.agg.totals).toMatchObject({ rows: 0, gross: 0, discount: 0, net: 0 });
    expect(a.recs).toEqual([]);
    expect(a.headline).toEqual(EMPTY_HEADLINE);
    expect(a.pool.months).toEqual([]);
    expect(a.previous).toBeNull();
    expect(analysisTexts(a).filter((t) => BAD_TEXT.test(t))).toEqual([]);
  });
});

describe('analyze: the previous period', () => {
  // The data spans 56 days, so an equally long earlier window fits only for ranges of up to 28 days that end on the last day.
  for (const length of [1, 7, 14, 20, 28, 29, 30, 40, 56]) {
    it(`the last ${length} days: ${length <= 28 ? 'the window before it is compared' : 'there is no full window before it'}`, () => {
      const start = max - length + 1;
      const a = p.run(F({ dateFrom: start }));
      expect(a.range.length).toBe(length);
      if (length > 28) {
        expect(a.previous).toBeNull();
        return;
      }
      const prev = a.previous!;
      expect(prev).not.toBeNull();
      expect(prev.from).toBe(start - length);
      expect(prev.to).toBe(start - 1);
      expect(prev.to - prev.from + 1).toBe(length);
      expectTotals(prev.totals, naiveTotals(inWindow(rows, prev.from, prev.to)));
      expect(prev.totals).toEqual(quickTotals(p.store, null, prev.from, prev.to));
    });
  }

  it('the longest comparable range starts the previous window on the first day of the data', () => {
    const a = p.run(F({ dateFrom: max - 27 }));
    expect(a.previous!.from).toBe(min);
    expect(p.run(F({ dateFrom: max - 28 })).previous).toBeNull();
  });

  it('a range in the middle of the data compares with the days just before it', () => {
    const a = p.run(F({ dateFrom: D('2026-10-01'), dateTo: D('2026-10-10') }));
    expect(isoOf(a.previous!.from)).toBe('2026-09-21');
    expect(isoOf(a.previous!.to)).toBe('2026-09-30');
    expectTotals(a.previous!.totals, naiveTotals(inWindow(rows, D('2026-09-21'), D('2026-09-30'))));
    // The window just before a range that starts too early is not fully covered.
    expect(p.run(F({ dateFrom: D('2026-09-10'), dateTo: D('2026-09-30') })).previous).toBeNull();
  });

  it('is never set for the whole data, and a clamped range counts as the whole data', () => {
    expect(p.analysis.previous).toBeNull();
    expect(p.run(F({ dateFrom: min - 30 })).previous).toBeNull();
  });

  it('applies the row filters and ignores the date filter when it looks back', () => {
    const start = max - 13;
    const a = p.run(F({ dateFrom: start, models: ['GPT-6 Astra'] }));
    const prev = a.previous!;
    const want = naiveTotals(inWindow(rows, prev.from, prev.to, (r) => modelOfRow(r) === 'GPT-6 Astra'));
    expect(want.rows).toBeGreaterThan(0);
    expectTotals(prev.totals, want);
    expect(a.narrowed).toBe(true);
  });

  it('applies a segment filter, keeping the users that qualify in the current range', () => {
    const start = max - 13;
    const a = p.run(F({ dateFrom: start, tiers: ['power', 'runaway'] }));
    const names = new Set(a.users.profiles.map((u) => u.name));
    expect(names.size).toBeGreaterThan(0);
    expect(names.size).toBeLessThan(p.analysis.users.profiles.length);
    const prev = a.previous!;
    expectTotals(prev.totals, naiveTotals(inWindow(rows, prev.from, prev.to, (r) => names.has(r.username))));
  });

  it('an empty current scope still compares with the earlier window, which is empty too', () => {
    const a = p.run(F({ dateFrom: max - 13, users: ['nobody-here'] }));
    expect(a.agg.totals.rows).toBe(0);
    expect(a.previous!.totals).toMatchObject({ rows: 0, gross: 0, users: 0 });
    expect(a.headline).toEqual(EMPTY_HEADLINE);
    expect(a.recs).toEqual([]);
  });

  it('fixtures: the whole range has no previous period, a trailing week of the partial export has', async () => {
    const a = await analyzeFixtures([FIXTURE_A]);
    const b = await analyzeFixtures([FIXTURE_B]);
    expect(a.analysis.previous).toBeNull();
    expect(b.analysis.previous).toBeNull();
    const last7 = b.run(F({ dateFrom: b.store.maxDay - 6 }));
    const braw = naiveRows(readFixture(FIXTURE_B));
    expect(last7.range.length).toBe(7);
    expect(last7.previous).toMatchObject({ from: b.store.maxDay - 13, to: b.store.maxDay - 7 });
    expectTotals(last7.previous!.totals, naiveTotals(inWindow(braw, b.store.maxDay - 13, b.store.maxDay - 7)));
    expect(last7.previous!.totals.rows).toBe(12);
  });
});

describe('analyze: narrowed and segment-filtered scopes', () => {
  const flags = (f: Partial<Filters>): { narrowed: boolean; segmentFiltered: boolean } => {
    const a = p.run(F(f));
    return { narrowed: a.narrowed, segmentFiltered: a.segmentFiltered };
  };

  it('a date range alone does not narrow the scope', () => {
    for (const f of [{ dateFrom: min + 3 }, { dateTo: max - 3 }, { dateFrom: min + 3, dateTo: max - 3 }, { dateFrom: max + 5 }, { dateFrom: min - 9 }]) {
      expect(flags(f), JSON.stringify(f)).toEqual({ narrowed: false, segmentFiltered: false });
    }
    expect(flags({ search: '   ' })).toEqual({ narrowed: false, segmentFiltered: false });
  });

  it('every row filter narrows the scope without being a segment filter', () => {
    const user = p.store.dicts.user.values.find((u) => u !== '')!;
    const cases: Record<string, Partial<Filters>> = {
      users: { users: [user] },
      products: { products: ['copilot'] },
      skus: { skus: ['copilot_ai_credit'] },
      models: { models: ['GPT-6 Astra'] },
      vendors: { vendors: [VENDORS[0]] },
      categories: { categories: ['Powerful'] },
      orgs: { orgs: ['northwind-data'] },
      costCenters: { costCenters: ['Analytics Lab'] },
      repos: { repos: ['billing-api'] },
      apps: { apps: ['no-such-app'] },
      files: { files: [p.store.dicts.file.values[0]] },
      plans: { plans: ['Enterprise'] },
      weekdays: { weekdays: [0, 1, 2, 3, 4] },
      selection: { selection: 'manual' },
      billing: { billing: 'billed' },
      attribution: { attribution: 'unattributed' },
      minRow: { minRow: 1 },
      maxRow: { maxRow: 100 },
      search: { search: 'astra' },
      'date and a model': { dateFrom: min + 2, models: ['GPT-6 Astra'] },
    };
    for (const [name, f] of Object.entries(cases)) expect(flags(f), name).toEqual({ narrowed: true, segmentFiltered: false });
  });

  it('every segment filter narrows the scope and is reported as a segment filter', () => {
    const cases: Record<string, Partial<Filters>> = {
      segments: { segments: ['champion'] },
      tiers: { tiers: ['power'] },
      engagement: { engagement: ['daily'] },
      profiles: { profiles: ['balanced'] },
      traits: { traits: ['multiModel'] },
      paretoClasses: { paretoClasses: ['A'] },
      minUserSpend: { minUserSpend: 10 },
      maxUserSpend: { maxUserSpend: 500 },
    };
    for (const [name, f] of Object.entries(cases)) expect(flags(f), name).toEqual({ narrowed: true, segmentFiltered: true });
  });

  it('a segment filter narrows the rows but keeps the whole population for labelling', () => {
    const whole = p.analysis;
    const a = p.run(F({ tiers: ['power', 'runaway'] }));
    expect(a.population.profiles).toHaveLength(whole.users.profiles.length);
    expect(a.population.groups.tier).toEqual(whole.population.groups.tier);
    expect(a.users).not.toBe(a.population);
    expect(a.users.profiles.length).toBeGreaterThan(0);
    expect(a.users.profiles.length).toBeLessThan(a.population.profiles.length);
    expect(a.users.profiles.every((u) => u.tier === 'power' || u.tier === 'runaway')).toBe(true);
    expect(a.agg.totals.rows).toBeLessThan(whole.agg.totals.rows);
    // Rows without a user (repo-level) cannot belong to a segment.
    const names = new Set(a.users.profiles.map((u) => u.name));
    expectTotals(a.agg.totals, naiveTotals(rows.filter((r) => names.has(r.username))));
    expect(a.mask).not.toBeNull();
    expect(a.baseMask).toBeNull();
  });

  it('the final mask is a subset of the base mask, and equals it without a segment filter', () => {
    const withSegment = p.run(F({ models: ['GPT-6 Astra'], tiers: ['power', 'runaway'] }));
    expect(withSegment.baseMask).not.toBeNull();
    expect(withSegment.mask).not.toBe(withSegment.baseMask);
    expect(withSegment.mask!.length).toBe(p.store.n);
    let extra = 0;
    let kept = 0;
    for (let i = 0; i < p.store.n; i++) {
      if (withSegment.mask![i] === 1) {
        kept++;
        if (withSegment.baseMask![i] === 0) extra++;
      }
    }
    expect(extra).toBe(0);
    expect(kept).toBe(withSegment.agg.totals.rows);
    const rowOnly = p.run(F({ models: ['GPT-6 Astra'] }));
    expect(rowOnly.mask).toBe(rowOnly.baseMask);
    expect(rowOnly.users).toBe(rowOnly.population);
  });

  it('a segment that matches nobody leaves an empty scope but a full population', () => {
    const a = p.run(F({ traits: ['longContext'], tiers: ['minimal'], paretoClasses: ['A'], minUserSpend: 1e9 }));
    expect(a.users.profiles).toEqual([]);
    expect(a.population.profiles.length).toBe(p.analysis.users.profiles.length);
    expect(a.agg.totals.rows).toBe(0);
    expect(a.recs).toEqual([]);
    expect(a.headline).toEqual(EMPTY_HEADLINE);
    expect(analysisTexts(a).filter((t) => BAD_TEXT.test(t))).toEqual([]);
  });

  it('does not treat roster seats without activity dates as unused', () => {
    const roster = [
      { user: 'ghost-business', plan: 'Business' },
      { user: 'ghost-enterprise', plan: 'Enterprise' },
    ];
    const s = mergeSettings({ roster });
    const whole = p.run(F(), s);
    expect(whole.seats.unused).toEqual([]);
    expect(whole.seats.unusedValue).toBe(0);
    expect(whole.plan.seatValue).toBeCloseTo(whole.seats.idleValue + whole.seats.downgradeValue + whole.seats.unusedValue, 9);
    for (const f of [F({ models: ['GPT-6 Astra'] }), F({ orgs: ['northwind-data'] }), F({ tiers: ['minimal'] })]) {
      const a = p.run(f, s);
      expect(a.narrowed).toBe(true);
      expect(a.seats.unused).toEqual([]);
      expect(a.plan.seatValue).toBe(0);
    }
    // A date range does not narrow the scope.
    const dated = p.run(F({ dateFrom: min + 10 }), s);
    expect(dated.narrowed).toBe(false);
    expect(dated.seats.unused).toEqual([]);
  });

  it('no seat actions when the pool size is unknown (partial-export fixture), even with a roster', async () => {
    const b = await analyzeFixtures([FIXTURE_B], { settings: { roster: [{ user: 'ghost', plan: 'Business' }] } });
    const a = b.analysis;
    expect(a.pool.capacityExceeded).toBe(true);
    expect(a.narrowed).toBe(false);
    expect(a.seats.unused).toEqual([]);
    expect(a.plan.seatValue).toBe(0);
  });
});

describe('analyze: wiring', () => {
  it('reports the data coverage of the store', () => {
    expect(p.analysis.coverage).toEqual(dataCoverage(p.store));
  });

  it('computes the aggregates from its own mask and range', () => {
    for (const f of [F(), F({ dateFrom: min + 5, dateTo: max - 5 }), F({ models: ['GPT-6 Astra'] }), F({ tiers: ['runaway'] })]) {
      const a = p.run(f);
      expect(a.agg).toEqual(aggregate(p.store, p.prep, p.models, a.mask, a.range, { activeThreshold: p.settings.activeThreshold }));
    }
  });

  it('plans the scenario with the default levers, and its lever result is the same as the plain one', () => {
    const a = p.analysis;
    expect(a.plan.levers).toEqual(a.levers);
    expect(a.plan.saving).toBeGreaterThanOrEqual(0);
    expect(a.plan.newCost).toBeLessThanOrEqual(a.plan.baseCost + 1e-9);
    expect(a.plan.months.map((m) => m.label)).toEqual(a.pool.months.map((m) => m.label));
  });

  it('measures its own time', () => {
    const times = [p.analysis.ms, p.run().ms, p.run().ms];
    for (const t of times) {
      expect(Number.isFinite(t)).toBe(true);
      expect(t).toBeGreaterThanOrEqual(0);
    }
    expect(Math.min(...times)).toBeLessThan(500);
  });

  it('the exported analyze function takes the same inputs as the pipeline', () => {
    const f = F({ dateFrom: min + 7, orgs: ['northwind-platform'] });
    const direct = analyze({ store: p.store, prep: p.prep, models: p.models, filters: f, settings: p.settings });
    expect(stripped(direct)).toEqual(stripped(p.run(f)));
  });
});

describe('analyze: purity', () => {
  const settings = (): Settings =>
    mergeSettings({ budgetMonthlyBilled: 100, roster: [{ user: 'ghost', plan: 'Enterprise' }], extraSeats: { business: 2, enterprise: 1 }, tiers: { minimal: 0.2, light: 0.5, core: 1.5, power: 4 } });
  const filters = (): Filters => F({ dateFrom: min + 3, dateTo: max - 2, models: ['GPT-6 Astra', 'Claude Opus 5.5'], tiers: ['light', 'core', 'power', 'runaway'], weekdays: [0, 1, 2, 3, 4] });

  const fingerprint = (): string => {
    const s = p.store;
    return JSON.stringify([s.n, s.minDay, s.maxDay, s.dicts.user.values, s.dicts.model.values, sum([...s.gross]), sum([...s.net]), sum([...s.day]), sum([...s.user]), sum([...s.quota])]);
  };

  it('gives the same analysis for the same input', () => {
    for (const [f, s] of [[F(), p.settings], [filters(), settings()]] as [Filters, Settings][]) {
      expect(stripped(p.run(f, s))).toEqual(stripped(p.run(f, s)));
      expect(stripped(p.run(structuredClone(f), structuredClone(s)))).toEqual(stripped(p.run(f, s)));
    }
  });

  it('does not change its inputs', () => {
    const f = filters();
    const s = settings();
    const before = JSON.stringify([f, s]);
    const storeBefore = fingerprint();
    const prepFingerprint = (): string => JSON.stringify(p.prep, (_k, v) => (ArrayBuffer.isView(v) ? sum(Array.from(v as unknown as ArrayLike<number>)) : v));
    const prepBefore = prepFingerprint();
    p.run(f, s);
    expect(JSON.stringify([f, s])).toBe(before);
    expect(fingerprint()).toBe(storeBefore);
    expect(prepFingerprint()).toBe(prepBefore);
  });

  it('keeps no state between runs: a run in between does not change the next result', () => {
    const first = stripped(p.run());
    p.run(filters(), settings());
    p.run(F({ users: ['nobody-here'] }));
    p.run(F({ tiers: ['runaway'] }));
    expect(stripped(p.run())).toEqual(first);
  });

  it('does not share arrays with the store: changing a result does not change the next one', () => {
    const a = p.run();
    const gross = a.agg.totals.gross;
    a.agg.days.gross.fill(0);
    a.recs.length = 0;
    a.users.profiles.length = 0;
    const b = p.run();
    expect(b.agg.totals.gross).toBeCloseTo(gross, 9);
    expect(sum([...b.agg.days.gross])).toBeCloseTo(gross, 6);
    expect(b.recs.length).toBeGreaterThan(0);
    expect(b.users.profiles.length).toBeGreaterThan(0);
  });
});

describe('analyze: settings change the analysis', () => {
  const tierCounts = (a: Analysis) => Object.fromEntries(Object.entries(a.users.groups.tier).map(([k, v]) => [k, v.users]));

  it('tier thresholds move users between tiers but never change the number of users', () => {
    const base = p.run();
    const strict = p.run(F(), mergeSettings({ tiers: { minimal: 0.02, light: 0.05, core: 0.1, power: 0.2 } }));
    const lenient = p.run(F(), mergeSettings({ tiers: { minimal: 0.5, light: 1, core: 5, power: 50 } }));
    const total = (a: Analysis) => sum(Object.values(tierCounts(a)));
    expect(total(base)).toBe(base.users.profiles.length);
    expect(total(strict)).toBe(total(base));
    expect(total(lenient)).toBe(total(base));
    expect(tierCounts(strict)).not.toEqual(tierCounts(base));
    expect(tierCounts(lenient)).not.toEqual(tierCounts(base));
    expect(strict.users.groups.tier.runaway.users).toBeGreaterThan(base.users.groups.tier.runaway.users);
    expect(lenient.users.groups.tier.runaway.users).toBeLessThan(base.users.groups.tier.runaway.users);
    expect(lenient.users.groups.tier.runaway.users).toBe(0);
    expect(strict.users.groups.tier.minimal.users).toBeLessThan(base.users.groups.tier.minimal.users);
    // The money does not depend on how users are labelled.
    expect(strict.agg.totals).toEqual(base.agg.totals);
    expect(lenient.pool.capacity).toBe(base.pool.capacity);
  });

  it('a tier filter selects the users the thresholds define', () => {
    const s = mergeSettings({ tiers: { minimal: 0.02, light: 0.05, core: 0.1, power: 0.2 } });
    const a = p.run(F({ tiers: ['runaway'] }), s);
    const all = p.run(F(), s);
    expect(a.users.profiles.length).toBe(all.users.groups.tier.runaway.users);
    expect(a.users.profiles.length).toBeGreaterThan(p.run(F({ tiers: ['runaway'] })).users.profiles.length);
    expect(a.users.profiles.every((u) => u.utilization > 0.2)).toBe(true);
  });

  it('the active-day threshold decides what counts as an active day', () => {
    const base = p.run();
    const never = p.run(F(), mergeSettings({ activeThreshold: 1e9 }));
    expect(sum(base.users.profiles.map((u) => u.activeDays))).toBeGreaterThan(0);
    expect(sum(never.users.profiles.map((u) => u.activeDays))).toBe(0);
    expect(never.agg.totals).toEqual(base.agg.totals);
  });

  it('a monthly budget turns on the budget status', () => {
    expect(p.analysis.pool.budget).toBeNull();
    const a = p.run(F(), mergeSettings({ budgetMonthlyBilled: 250 }));
    const b = a.pool.budget;
    expect(b).not.toBeNull();
    expect(b!.monthlyBudget).toBe(250);
    expect(b!.month).toBe(a.pool.months[a.pool.months.length - 1].label);
    expect(b!.month).toBe('Oct 2026');
  });

  it('a roster adds seats that never appear in the report, and makes the pool size a lower bound no more', () => {
    expect(p.analysis.pool.capacityIsLowerBound).toBe(true);
    const s = mergeSettings({ roster: [{ user: 'ghost-a', plan: 'Business' }, { user: 'ghost-b', plan: 'Enterprise' }] });
    const a = p.run(F(), s);
    expect(a.pool.capacityIsLowerBound).toBe(false);
    expect(a.users.inactive.map((i) => i.user).sort()).toEqual(['ghost-a', 'ghost-b']);
    expect(a.pool.capacity).toBeGreaterThan(p.analysis.pool.capacity);
    expect(a.agg.totals).toEqual(p.analysis.agg.totals);
  });
});
