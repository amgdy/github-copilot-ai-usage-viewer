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

const makeFilters = (over: Partial<Filters> = {}): Filters => ({ ...emptyFilters(), ...over });
const dayOf = dayNum;

/** The default demo covers three calendar months: all of August and September, and October up to the 26th. */
const DEMO_FIRST_DAY = '2026-08-01';
const DEMO_LAST_DAY = '2026-10-26';
const DEMO_DAY_COUNT = dayNum(DEMO_LAST_DAY) - dayNum(DEMO_FIRST_DAY) + 1;
/** The longest range that ends on the last day and still has an equally long window of data before it. */
const LONGEST_COMPARABLE = Math.floor(DEMO_DAY_COUNT / 2);

const inWindow = (rows: NaiveRow[], from: number, to: number, keep: (row: NaiveRow) => boolean = () => true): NaiveRow[] =>
  rows.filter((row) => {
    const day = dayNum(row.date);
    return day >= from && day <= to && keep(row);
  });

const EMPTY_HEADLINE = { status: 'watch', title: 'No rows match the current filters', detail: 'Widen the date range or clear some filters.' };

/** An analysis with the timing removed, to compare two runs. */
const stripped = (analysis: Analysis): Omit<Analysis, 'ms'> => {
  const { ms: _ms, ...rest } = analysis;
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

let pipeline: Pipeline & { demo: DemoResult };
let rows: NaiveRow[];
let min: number;
let max: number;

beforeAll(async () => {
  pipeline = await analyzeDemo();
  rows = naiveRows(pipeline.demo.csv);
  min = pipeline.store.minDay;
  max = pipeline.store.maxDay;
});

describe('analyze: date range', () => {
  it('analyses the whole data when no date is set', () => {
    const analysis = pipeline.analysis;
    expect(analysis.range).toEqual({ start: min, end: max, length: max - min + 1 });
    expect(analysis.range).toBe(analysis.agg.range);
    expect(isoOf(min)).toBe(DEMO_FIRST_DAY);
    expect(isoOf(max)).toBe(DEMO_LAST_DAY);
    expect(analysis.range.length).toBe(DEMO_DAY_COUNT);
    expect(analysis.narrowed).toBe(false);
    expect(analysis.segmentFiltered).toBe(false);
    expect(analysis.baseMask).toBeNull();
    expect(analysis.mask).toBeNull();
    expect(analysis.users).toBe(analysis.population);
    expect(analysis.agg.totals.rows).toBe(rows.length);
  });

  it('clamps a range that is wider than the data to the data', () => {
    const clamped = pipeline.run(makeFilters({ dateFrom: min - 100, dateTo: max + 100 }));
    const whole = pipeline.analysis;
    expect(clamped.range).toEqual(whole.range);
    expect(clamped.agg.totals).toEqual(whole.agg.totals);
    expect(clamped.previous).toBeNull();
    expect(clamped.narrowed).toBe(false);
    expect(stripped(clamped).recs).toEqual(stripped(whole).recs);
    expect(pipeline.run(makeFilters({ dateFrom: min - 100 })).range).toEqual(whole.range);
    expect(pipeline.run(makeFilters({ dateTo: max + 100 })).range).toEqual(whole.range);
  });

  it('uses the first or the last day of the data for an open end', () => {
    const fromOct = pipeline.run(makeFilters({ dateFrom: dayOf('2026-10-01') }));
    expect(fromOct.range).toEqual({ start: dayOf('2026-10-01'), end: max, length: max - dayOf('2026-10-01') + 1 });
    expectTotals({ ...fromOct.agg.totals, credits: fromOct.agg.totals.credits, users: fromOct.agg.totals.users }, naiveTotals(inWindow(rows, dayOf('2026-10-01'), max)));
    const toAug = pipeline.run(makeFilters({ dateTo: dayOf('2026-08-31') }));
    expect(toAug.range).toEqual({ start: min, end: dayOf('2026-08-31'), length: 31 });
    expectTotals(toAug.agg.totals, naiveTotals(inWindow(rows, min, dayOf('2026-08-31'))));
    expect(fromOct.narrowed).toBe(false);
    expect(toAug.narrowed).toBe(false);
  });

  it('analyses exactly the days of a range inside the data, and the pool months it touches', () => {
    const from = dayOf('2026-09-25');
    const to = dayOf('2026-10-04');
    const analysis = pipeline.run(makeFilters({ dateFrom: from, dateTo: to }));
    expect(analysis.range).toEqual({ start: from, end: to, length: 10 });
    expectTotals(analysis.agg.totals, naiveTotals(inWindow(rows, from, to)));
    expect(analysis.agg.days.gross).toHaveLength(10);
    expect(sum([...analysis.agg.days.gross])).toBeCloseTo(analysis.agg.totals.gross, 6);
    expect(analysis.pool.months.map((month) => month.key)).toEqual(['2026-09', '2026-10']);
  });

  it('analyses a single day', () => {
    const day = dayOf('2026-09-11');
    const analysis = pipeline.run(makeFilters({ dateFrom: day, dateTo: day }));
    expect(analysis.range).toEqual({ start: day, end: day, length: 1 });
    expectTotals(analysis.agg.totals, naiveTotals(inWindow(rows, day, day)));
    expect(analysis.previous).toMatchObject({ from: day - 1, to: day - 1 });
    expect(analysis.trend.reliable).toBe(false);
    expect(analysisTexts(analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
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
      const analysis = pipeline.run(makeFilters(filters()));
      expect(analysis.agg.totals).toMatchObject({ rows: 0, gross: 0, discount: 0, net: 0, credits: 0 });
      expect(analysis.agg.range.length).toBe(0);
      expect(analysis.recs).toEqual([]);
      expect(analysis.headline).toEqual(EMPTY_HEADLINE);
      expect(analysis.previous).toBeNull();
      expect(analysis.pool.months).toEqual([]);
      expect(analysis.users.profiles).toEqual([]);
      expect(analysis.anomalies).toEqual([]);
      expect(analysis.trend.reliable).toBe(false);
      expect(analysis.levers.total).toBe(0);
      expect(analysis.plan.saving).toBe(0);
      expect(analysis.plan.baseCost).toBe(0);
      expect(analysisTexts(analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
    });
  }

  it('a file without data rows analyses to an empty scope', async () => {
    const header = `\uFEFF${CSV_HEADER.map((column) => `"${column}"`).join(',')}\n`;
    const emptyPipeline = await analyzeSources([{ name: 'empty.csv', data: header }]);
    expect(emptyPipeline.store.n).toBe(0);
    const analysis = emptyPipeline.analysis;
    expect(analysis.agg.totals).toMatchObject({ rows: 0, gross: 0, discount: 0, net: 0 });
    expect(analysis.recs).toEqual([]);
    expect(analysis.headline).toEqual(EMPTY_HEADLINE);
    expect(analysis.pool.months).toEqual([]);
    expect(analysis.previous).toBeNull();
    expect(analysisTexts(analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
  });
});

describe('analyze: the previous period', () => {
  // The data spans 87 days, so an equally long earlier window fits only for ranges of up to 43 days that end on the last day.
  for (const length of [1, 7, 14, 28, 30, LONGEST_COMPARABLE, LONGEST_COMPARABLE + 1, LONGEST_COMPARABLE + 2, 60, DEMO_DAY_COUNT]) {
    it(`the last ${length} days: ${length <= LONGEST_COMPARABLE ? 'the window before it is compared' : 'there is no full window before it'}`, () => {
      const start = max - length + 1;
      const analysis = pipeline.run(makeFilters({ dateFrom: start }));
      expect(analysis.range.length).toBe(length);
      if (length > LONGEST_COMPARABLE) {
        expect(analysis.previous).toBeNull();
        return;
      }
      const prev = analysis.previous!;
      expect(prev).not.toBeNull();
      expect(prev.from).toBe(start - length);
      expect(prev.to).toBe(start - 1);
      expect(prev.to - prev.from + 1).toBe(length);
      expectTotals(prev.totals, naiveTotals(inWindow(rows, prev.from, prev.to)));
      expect(prev.totals).toEqual(quickTotals(pipeline.store, null, prev.from, prev.to));
    });
  }

  it('the longest comparable range starts the previous window on the first day of the data', () => {
    // The range and the window before it split the days from the first day into two equal halves. The demo has an odd
    // number of days (87), so the range ends one day before the last day.
    const end = (max - min + 1) % 2 === 0 ? max : max - 1;
    const length = (end - min + 1) / 2;
    const analysis = pipeline.run(makeFilters({ dateFrom: end - length + 1, dateTo: end }));
    expect(analysis.range.length).toBe(length);
    expect(analysis.previous).toMatchObject({ from: min, to: end - length });
    expect(pipeline.run(makeFilters({ dateFrom: end - length, dateTo: end })).previous).toBeNull();
  });

  it('a range in the middle of the data compares with the days just before it', () => {
    const analysis = pipeline.run(makeFilters({ dateFrom: dayOf('2026-09-01'), dateTo: dayOf('2026-09-10') }));
    expect(isoOf(analysis.previous!.from)).toBe('2026-08-22');
    expect(isoOf(analysis.previous!.to)).toBe('2026-08-31');
    expectTotals(analysis.previous!.totals, naiveTotals(inWindow(rows, dayOf('2026-08-22'), dayOf('2026-08-31'))));
    // The window just before a range that starts too early is not fully covered.
    expect(pipeline.run(makeFilters({ dateFrom: dayOf('2026-08-10'), dateTo: dayOf('2026-08-31') })).previous).toBeNull();
  });

  it('is never set for the whole data, and a clamped range counts as the whole data', () => {
    expect(pipeline.analysis.previous).toBeNull();
    expect(pipeline.run(makeFilters({ dateFrom: min - 30 })).previous).toBeNull();
  });

  it('applies the row filters and ignores the date filter when it looks back', () => {
    const start = max - 13;
    const analysis = pipeline.run(makeFilters({ dateFrom: start, models: ['GPT-6 Astra'] }));
    const prev = analysis.previous!;
    const want = naiveTotals(inWindow(rows, prev.from, prev.to, (row) => modelOfRow(row) === 'GPT-6 Astra'));
    expect(want.rows).toBeGreaterThan(0);
    expectTotals(prev.totals, want);
    expect(analysis.narrowed).toBe(true);
  });

  it('applies a segment filter, keeping the users that qualify in the current range', () => {
    const start = max - 13;
    const analysis = pipeline.run(makeFilters({ dateFrom: start, tiers: ['power', 'runaway'] }));
    const names = new Set(analysis.users.profiles.map((user) => user.name));
    expect(names.size).toBeGreaterThan(0);
    expect(names.size).toBeLessThan(pipeline.analysis.users.profiles.length);
    const prev = analysis.previous!;
    expectTotals(prev.totals, naiveTotals(inWindow(rows, prev.from, prev.to, (row) => names.has(row.username))));
  });

  it('an empty current scope still compares with the earlier window, which is empty too', () => {
    const analysis = pipeline.run(makeFilters({ dateFrom: max - 13, users: ['nobody-here'] }));
    expect(analysis.agg.totals.rows).toBe(0);
    expect(analysis.previous!.totals).toMatchObject({ rows: 0, gross: 0, users: 0 });
    expect(analysis.headline).toEqual(EMPTY_HEADLINE);
    expect(analysis.recs).toEqual([]);
  });

  it('fixtures: the whole range has no previous period, a trailing week of the partial export has', async () => {
    const pipelineA = await analyzeFixtures([FIXTURE_A]);
    const pipelineB = await analyzeFixtures([FIXTURE_B]);
    expect(pipelineA.analysis.previous).toBeNull();
    expect(pipelineB.analysis.previous).toBeNull();
    const last7 = pipelineB.run(makeFilters({ dateFrom: pipelineB.store.maxDay - 6 }));
    const rowsB = naiveRows(readFixture(FIXTURE_B));
    expect(last7.range.length).toBe(7);
    expect(last7.previous).toMatchObject({ from: pipelineB.store.maxDay - 13, to: pipelineB.store.maxDay - 7 });
    expectTotals(last7.previous!.totals, naiveTotals(inWindow(rowsB, pipelineB.store.maxDay - 13, pipelineB.store.maxDay - 7)));
    expect(last7.previous!.totals.rows).toBe(12);
  });
});

describe('analyze: narrowed and segment-filtered scopes', () => {
  const flags = (filters: Partial<Filters>): { narrowed: boolean; segmentFiltered: boolean } => {
    const analysis = pipeline.run(makeFilters(filters));
    return { narrowed: analysis.narrowed, segmentFiltered: analysis.segmentFiltered };
  };

  it('a date range alone does not narrow the scope', () => {
    for (const filters of [{ dateFrom: min + 3 }, { dateTo: max - 3 }, { dateFrom: min + 3, dateTo: max - 3 }, { dateFrom: max + 5 }, { dateFrom: min - 9 }]) {
      expect(flags(filters), JSON.stringify(filters)).toEqual({ narrowed: false, segmentFiltered: false });
    }
    expect(flags({ search: '   ' })).toEqual({ narrowed: false, segmentFiltered: false });
  });

  it('every row filter narrows the scope without being a segment filter', () => {
    const user = pipeline.store.dicts.user.values.find((username) => username !== '')!;
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
      files: { files: [pipeline.store.dicts.file.values[0]] },
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
    for (const [name, filters] of Object.entries(cases)) expect(flags(filters), name).toEqual({ narrowed: true, segmentFiltered: false });
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
    for (const [name, filters] of Object.entries(cases)) expect(flags(filters), name).toEqual({ narrowed: true, segmentFiltered: true });
  });

  it('a segment filter narrows the rows but keeps the whole population for labelling', () => {
    const whole = pipeline.analysis;
    const filtered = pipeline.run(makeFilters({ tiers: ['power', 'runaway'] }));
    expect(filtered.population.profiles).toHaveLength(whole.users.profiles.length);
    expect(filtered.population.groups.tier).toEqual(whole.population.groups.tier);
    expect(filtered.users).not.toBe(filtered.population);
    expect(filtered.users.profiles.length).toBeGreaterThan(0);
    expect(filtered.users.profiles.length).toBeLessThan(filtered.population.profiles.length);
    expect(filtered.users.profiles.every((user) => user.tier === 'power' || user.tier === 'runaway')).toBe(true);
    expect(filtered.agg.totals.rows).toBeLessThan(whole.agg.totals.rows);
    // Rows without a user (repo-level) cannot belong to a segment.
    const names = new Set(filtered.users.profiles.map((user) => user.name));
    expectTotals(filtered.agg.totals, naiveTotals(rows.filter((row) => names.has(row.username))));
    expect(filtered.mask).not.toBeNull();
    expect(filtered.baseMask).toBeNull();
  });

  it('the final mask is a subset of the base mask, and equals it without a segment filter', () => {
    const withSegment = pipeline.run(makeFilters({ models: ['GPT-6 Astra'], tiers: ['power', 'runaway'] }));
    expect(withSegment.baseMask).not.toBeNull();
    expect(withSegment.mask).not.toBe(withSegment.baseMask);
    expect(withSegment.mask!.length).toBe(pipeline.store.n);
    let extra = 0;
    let kept = 0;
    for (let i = 0; i < pipeline.store.n; i++) {
      if (withSegment.mask![i] === 1) {
        kept++;
        if (withSegment.baseMask![i] === 0) extra++;
      }
    }
    expect(extra).toBe(0);
    expect(kept).toBe(withSegment.agg.totals.rows);
    const rowOnly = pipeline.run(makeFilters({ models: ['GPT-6 Astra'] }));
    expect(rowOnly.mask).toBe(rowOnly.baseMask);
    expect(rowOnly.users).toBe(rowOnly.population);
  });

  it('a segment that matches nobody leaves an empty scope but a full population', () => {
    const analysis = pipeline.run(makeFilters({ traits: ['longContext'], tiers: ['minimal'], paretoClasses: ['A'], minUserSpend: 1e9 }));
    expect(analysis.users.profiles).toEqual([]);
    expect(analysis.population.profiles.length).toBe(pipeline.analysis.users.profiles.length);
    expect(analysis.agg.totals.rows).toBe(0);
    expect(analysis.recs).toEqual([]);
    expect(analysis.headline).toEqual(EMPTY_HEADLINE);
    expect(analysisTexts(analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
  });

  it('does not treat roster seats without activity dates as unused', () => {
    const roster = [
      { user: 'ghost-business', plan: 'Business' },
      { user: 'ghost-enterprise', plan: 'Enterprise' },
    ];
    const settings = mergeSettings({ roster });
    const whole = pipeline.run(makeFilters(), settings);
    expect(whole.seats.unused).toEqual([]);
    expect(whole.seats.unusedValue).toBe(0);
    expect(whole.plan.seatValue).toBeCloseTo(whole.seats.idleValue + whole.seats.downgradeValue + whole.seats.unusedValue, 9);
    for (const filters of [makeFilters({ models: ['GPT-6 Astra'] }), makeFilters({ orgs: ['northwind-data'] }), makeFilters({ tiers: ['minimal'] })]) {
      const analysis = pipeline.run(filters, settings);
      expect(analysis.narrowed).toBe(true);
      expect(analysis.seats.unused).toEqual([]);
      expect(analysis.plan.seatValue).toBe(0);
    }
    // A date range does not narrow the scope.
    const dated = pipeline.run(makeFilters({ dateFrom: min + 10 }), settings);
    expect(dated.narrowed).toBe(false);
    expect(dated.seats.unused).toEqual([]);
  });

  it('no seat actions when the pool size is unknown (partial-export fixture), even with a roster', async () => {
    const pipelineB = await analyzeFixtures([FIXTURE_B], { settings: { roster: [{ user: 'ghost', plan: 'Business' }] } });
    const analysis = pipelineB.analysis;
    expect(analysis.pool.capacityExceeded).toBe(true);
    expect(analysis.narrowed).toBe(false);
    expect(analysis.seats.unused).toEqual([]);
    expect(analysis.plan.seatValue).toBe(0);
  });
});

describe('analyze: wiring', () => {
  it('reports the data coverage of the store', () => {
    expect(pipeline.analysis.coverage).toEqual(dataCoverage(pipeline.store));
  });

  it('computes the aggregates from its own mask and range', () => {
    for (const filters of [makeFilters(), makeFilters({ dateFrom: min + 5, dateTo: max - 5 }), makeFilters({ models: ['GPT-6 Astra'] }), makeFilters({ tiers: ['runaway'] })]) {
      const analysis = pipeline.run(filters);
      expect(analysis.agg).toEqual(aggregate(pipeline.store, pipeline.prep, pipeline.models, analysis.mask, analysis.range, { activeThreshold: pipeline.settings.activeThreshold }));
    }
  });

  it('plans the scenario with the default levers, and its lever result is the same as the plain one', () => {
    const analysis = pipeline.analysis;
    expect(analysis.plan.levers).toEqual(analysis.levers);
    expect(analysis.plan.saving).toBeGreaterThanOrEqual(0);
    expect(analysis.plan.newCost).toBeLessThanOrEqual(analysis.plan.baseCost + 1e-9);
    expect(analysis.plan.months.map((month) => month.label)).toEqual(analysis.pool.months.map((month) => month.label));
  });

  it('measures its own time', () => {
    const times = [pipeline.analysis.ms, pipeline.run().ms, pipeline.run().ms];
    for (const elapsedMs of times) {
      expect(Number.isFinite(elapsedMs)).toBe(true);
      expect(elapsedMs).toBeGreaterThanOrEqual(0);
    }
    expect(Math.min(...times)).toBeLessThan(500);
  });

  it('the exported analyze function takes the same inputs as the pipeline', () => {
    const filters = makeFilters({ dateFrom: min + 7, orgs: ['northwind-platform'] });
    const direct = analyze({ store: pipeline.store, prep: pipeline.prep, models: pipeline.models, filters: filters, settings: pipeline.settings });
    expect(stripped(direct)).toEqual(stripped(pipeline.run(filters)));
  });
});

describe('analyze: purity', () => {
  const settings = (): Settings =>
    mergeSettings({ budgetMonthlyBilled: 100, roster: [{ user: 'ghost', plan: 'Enterprise' }], extraSeats: { business: 2, enterprise: 1 }, tiers: { minimal: 0.2, light: 0.5, core: 1.5, power: 4 } });
  const filters = (): Filters => makeFilters({ dateFrom: min + 3, dateTo: max - 2, models: ['GPT-6 Astra', 'Claude Opus 5.5'], tiers: ['light', 'core', 'power', 'runaway'], weekdays: [0, 1, 2, 3, 4] });

  const fingerprint = (): string => {
    const store = pipeline.store;
    return JSON.stringify([store.n, store.minDay, store.maxDay, store.dicts.user.values, store.dicts.model.values, sum([...store.gross]), sum([...store.net]), sum([...store.day]), sum([...store.user]), sum([...store.quota])]);
  };

  it('gives the same analysis for the same input', () => {
    for (const [inputFilters, inputSettings] of [[makeFilters(), pipeline.settings], [filters(), settings()]] as [Filters, Settings][]) {
      expect(stripped(pipeline.run(inputFilters, inputSettings))).toEqual(stripped(pipeline.run(inputFilters, inputSettings)));
      expect(stripped(pipeline.run(structuredClone(inputFilters), structuredClone(inputSettings)))).toEqual(stripped(pipeline.run(inputFilters, inputSettings)));
    }
  });

  it('does not change its inputs', () => {
    const inputFilters = filters();
    const inputSettings = settings();
    const before = JSON.stringify([inputFilters, inputSettings]);
    const storeBefore = fingerprint();
    const prepFingerprint = (): string => JSON.stringify(pipeline.prep, (_k, value) => (ArrayBuffer.isView(value) ? sum(Array.from(value as unknown as ArrayLike<number>)) : value));
    const prepBefore = prepFingerprint();
    pipeline.run(inputFilters, inputSettings);
    expect(JSON.stringify([inputFilters, inputSettings])).toBe(before);
    expect(fingerprint()).toBe(storeBefore);
    expect(prepFingerprint()).toBe(prepBefore);
  });

  it('keeps no state between runs: a run in between does not change the next result', () => {
    const first = stripped(pipeline.run());
    pipeline.run(filters(), settings());
    pipeline.run(makeFilters({ users: ['nobody-here'] }));
    pipeline.run(makeFilters({ tiers: ['runaway'] }));
    expect(stripped(pipeline.run())).toEqual(first);
  });

  it('does not share arrays with the store: changing a result does not change the next one', () => {
    const first = pipeline.run();
    const gross = first.agg.totals.gross;
    first.agg.days.gross.fill(0);
    first.recs.length = 0;
    first.users.profiles.length = 0;
    const second = pipeline.run();
    expect(second.agg.totals.gross).toBeCloseTo(gross, 9);
    expect(sum([...second.agg.days.gross])).toBeCloseTo(gross, 6);
    expect(second.recs.length).toBeGreaterThan(0);
    expect(second.users.profiles.length).toBeGreaterThan(0);
  });
});

describe('analyze: settings change the analysis', () => {
  const tierCounts = (analysis: Analysis) => Object.fromEntries(Object.entries(analysis.users.groups.tier).map(([tier, group]) => [tier, group.users]));

  it('tier thresholds move users between tiers but never change the number of users', () => {
    const base = pipeline.run();
    const strict = pipeline.run(makeFilters(), mergeSettings({ tiers: { minimal: 0.02, light: 0.05, core: 0.1, power: 0.2 } }));
    const lenient = pipeline.run(makeFilters(), mergeSettings({ tiers: { minimal: 0.5, light: 1, core: 5, power: 50 } }));
    const total = (analysis: Analysis) => sum(Object.values(tierCounts(analysis)));
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
    const settings = mergeSettings({ tiers: { minimal: 0.02, light: 0.05, core: 0.1, power: 0.2 } });
    const filtered = pipeline.run(makeFilters({ tiers: ['runaway'] }), settings);
    const all = pipeline.run(makeFilters(), settings);
    expect(filtered.users.profiles.length).toBe(all.users.groups.tier.runaway.users);
    expect(filtered.users.profiles.length).toBeGreaterThan(pipeline.run(makeFilters({ tiers: ['runaway'] })).users.profiles.length);
    expect(filtered.users.profiles.every((user) => user.utilization > 0.2)).toBe(true);
  });

  it('the active-day threshold decides what counts as an active day', () => {
    const base = pipeline.run();
    const never = pipeline.run(makeFilters(), mergeSettings({ activeThreshold: 1e9 }));
    expect(sum(base.users.profiles.map((user) => user.activeDays))).toBeGreaterThan(0);
    expect(sum(never.users.profiles.map((user) => user.activeDays))).toBe(0);
    expect(never.agg.totals).toEqual(base.agg.totals);
  });

  it('a monthly budget turns on the budget status', () => {
    expect(pipeline.analysis.pool.budget).toBeNull();
    const analysis = pipeline.run(makeFilters(), mergeSettings({ budgetMonthlyBilled: 250 }));
    const budget = analysis.pool.budget;
    expect(budget).not.toBeNull();
    expect(budget!.monthlyBudget).toBe(250);
    expect(budget!.month).toBe(analysis.pool.months[analysis.pool.months.length - 1].label);
    expect(budget!.month).toBe('Oct 2026');
  });

  it('a roster adds seats that never appear in the report, and makes the pool size a lower bound no more', () => {
    expect(pipeline.analysis.pool.capacityIsLowerBound).toBe(true);
    const settings = mergeSettings({ roster: [{ user: 'ghost-a', plan: 'Business' }, { user: 'ghost-b', plan: 'Enterprise' }] });
    const withRoster = pipeline.run(makeFilters(), settings);
    expect(withRoster.pool.capacityIsLowerBound).toBe(false);
    expect(withRoster.users.inactive.map((seat) => seat.user).sort()).toEqual(['ghost-a', 'ghost-b']);
    expect(withRoster.pool.capacity).toBeGreaterThan(pipeline.analysis.pool.capacity);
    expect(withRoster.agg.totals).toEqual(pipeline.analysis.agg.totals);
  });
});
