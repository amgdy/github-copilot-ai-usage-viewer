import { beforeAll, describe, expect, it } from 'vitest';
import { emptyFilters } from '../src/lib/analytics/filters';
import {
  DEFAULT_LEVERS,
  DEFAULT_TARGETS,
  LEVER_META,
  LEVER_ORDER,
  VERSATILE_TARGETS,
  applyLevers,
  cacheSavingsStandalone,
  computeLevers,
  modelShiftRatios,
  targetMeta,
  type LeverContext,
  type LeverParams,
  type LeverResult,
  type LeverStep,
} from '../src/lib/analytics/levers';
import type { SeatPlan } from '../src/lib/analytics/seats';
import {
  allotmentArray,
  cashSaving,
  evaluateMonths,
  monthCost,
  monthInputs,
  runScenario,
  seatValueFor,
  type MonthInput,
  type ScenarioInput,
} from '../src/lib/analytics/simulator';
import { PRICE_CARD, VENDORS, type CardEntry, type Rates } from '../src/lib/pricing/card';
import {
  analyzeCsv,
  analyzeDemo,
  isAutoRow,
  makeCsv,
  modelOfRow,
  naiveRows,
  numOf,
  type NaiveRow,
  type Pipeline,
  type RowSpec,
} from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures, readFixture } from './fixtures';

type LeverId = LeverStep['id'];

const ctxOf = (pipeline: Pipeline): LeverContext => ({ agg: pipeline.analysis.agg, models: pipeline.models, settings: pipeline.settings });
const allotOf = (pipeline: Pipeline): Float64Array => allotmentArray(pipeline.analysis.users, pipeline.analysis.agg.userAcc.gross.length);
const leversOf = (pipeline: Pipeline, over: Partial<LeverParams> = {}): LeverResult =>
  computeLevers(ctxOf(pipeline), { ...DEFAULT_LEVERS, ...over }, allotOf(pipeline));

const ZERO: LeverParams = { ...DEFAULT_LEVERS, modelShift: 0, autoAdoption: 0, cacheDiscipline: 0, contextHygiene: 0, longContext: 0, capRunaway: 0 };
const ONES: LeverParams = { ...ZERO, modelShift: 1, autoAdoption: 1, cacheDiscipline: 1, contextHygiene: 1, longContext: 1, capRunaway: 1 };
const solo = (id: LeverId, strength: number, over: Partial<LeverParams> = {}): LeverParams => ({ ...ZERO, ...over, [id]: strength });
const STRENGTHS = [0, 0.25, 0.5, 0.75, 1];
const IDS: LeverId[] = ['modelShift', 'autoAdoption', 'cacheDiscipline', 'contextHygiene', 'longContext', 'capRunaway'];

const stepOf = (result: LeverResult, id: LeverId): LeverStep => result.steps.find((step) => step.id === id)!;

// ---------------------------------------------------------------------------------------------
// Independent recomputation of the levers from the raw CSV rows and the public price card
// ---------------------------------------------------------------------------------------------

const cardOf = (name: string): CardEntry | undefined => PRICE_CARD.find((card) => card.name === name);
const tokenCost = (rates: Rates, tokens: { input: number; cr: number; cw: number; out: number }): number =>
  (tokens.input * rates.input + tokens.cr * rates.cachedInput + tokens.cw * rates.cacheWrite + tokens.out * rates.output) / 1e6;

interface OracleModel {
  name: string;
  gross: number;
  input: number;
  cr: number;
  cw: number;
  out: number;
  list: number;
  pricedGross: number;
}

/** Included credits of every user: the largest quota seen in each month, summed over the months of the user (USD). */
function allotmentsOf(rows: NaiveRow[]): Map<string, number> {
  const perMonth = new Map<string, number>();
  for (const row of rows) {
    if (!row.username) continue;
    const key = `${row.username}|${row.date.slice(0, 7)}`;
    perMonth.set(key, Math.max(perMonth.get(key) ?? 0, numOf(row, 'total_monthly_quota')));
  }
  const out = new Map<string, number>();
  for (const [userMonth, quota] of perMonth) {
    const user = userMonth.slice(0, userMonth.lastIndexOf('|'));
    out.set(user, (out.get(user) ?? 0) + quota * 0.01);
  }
  return out;
}

function leverOracle(rows: NaiveRow[], params: LeverParams, autoDiscount = 0.1) {
  const byModel = new Map<string, OracleModel>();
  const userGross = new Map<string, number>();
  const userAuto = new Map<string, number>();
  const userQuota = new Map<string, number>();
  const userMeasured = new Map<string, { billed: number; list: number }>();
  let baseline = 0;
  let autoGross = 0;
  let longPremium = 0;
  const estimate = { input: 0, cr: 0, cw: 0 };
  for (const row of rows) {
    const gross = numOf(row, 'gross_amount');
    const name = modelOfRow(row);
    const model = byModel.get(name) ?? { name, gross: 0, input: 0, cr: 0, cw: 0, out: 0, list: 0, pricedGross: 0 };
    byModel.set(name, model);
    const tokens = { input: numOf(row, 'input'), cr: numOf(row, 'cache_read'), cw: numOf(row, 'cache_write'), out: numOf(row, 'output') };
    model.gross += gross;
    model.input += tokens.input;
    model.cr += tokens.cr;
    model.cw += tokens.cw;
    model.out += tokens.out;
    baseline += gross;
    if (isAutoRow(row)) autoGross += gross;
    if (row.username) {
      userGross.set(row.username, (userGross.get(row.username) ?? 0) + gross);
      userQuota.set(row.username, Math.max(userQuota.get(row.username) ?? 0, numOf(row, 'total_monthly_quota')));
      if (isAutoRow(row)) userAuto.set(row.username, (userAuto.get(row.username) ?? 0) + gross);
    }
    const card = cardOf(name);
    if (!card) continue;
    const cardCost = tokenCost(card.base, tokens);
    if (cardCost <= 0) continue;
    const ratio = gross / cardCost;
    model.list += cardCost;
    model.pricedGross += gross;
    estimate.input += (tokens.input * card.base.input * ratio) / 1e6;
    estimate.cr += (tokens.cr * card.base.cachedInput * ratio) / 1e6;
    estimate.cw += (tokens.cw * card.base.cacheWrite * ratio) / 1e6;
    let premium = 0;
    if (card.long && ratio > 1.02 && tokens.input + tokens.cr + tokens.cw > (card.longThreshold ?? 272_000)) {
      premium = Math.max(0, Math.min(gross, tokenCost(card.long, tokens)) - cardCost);
      longPremium += premium;
    }
    // An Auto row shows its original price only when its tokens price it unambiguously: a standard-tier request that bills within reach of list.
    if (isAutoRow(row) && row.username && premium === 0 && ratio >= 0.5 && ratio <= 1.05) {
      const measured = userMeasured.get(row.username) ?? { billed: 0, list: 0 };
      measured.billed += gross;
      measured.list += cardCost;
      userMeasured.set(row.username, measured);
    }
  }

  // Auto rate of a plan (users with the same largest quota): what its measured Auto rows show once they add up to $1, else the Settings rate.
  const plans = new Map<number, { billed: number; list: number }>();
  for (const [user, measured] of userMeasured) {
    const quota = userQuota.get(user) ?? 0;
    const plan = plans.get(quota) ?? { billed: 0, list: 0 };
    plan.billed += measured.billed;
    plan.list += measured.list;
    plans.set(quota, plan);
  }
  const planRate = (quota: number): number => {
    const plan = plans.get(quota);
    if (plan && plan.billed >= 1 && plan.list > 0) return Math.min(0.9, Math.max(0, 1 - plan.billed / plan.list));
    return Math.min(0.9, Math.max(0, autoDiscount));
  };
  let autoMissed = 0;
  for (const [user, gross] of userGross) autoMissed += Math.max(0, gross - (userAuto.get(user) ?? 0)) * planRate(userQuota.get(user) ?? 0);

  let shiftFull = 0;
  for (const model of byModel.values()) {
    const card = cardOf(model.name);
    if (!card || card.category !== 'Powerful' || model.gross <= 0) continue;
    const target = cardOf(params.target === 'same-vendor' ? DEFAULT_TARGETS[card.vendor] : params.target);
    if (!target || target.name === card.name) continue;
    const sourceCost = tokenCost(card.base, model);
    const targetCost = tokenCost(target.base, model);
    if (sourceCost <= 0 || targetCost <= 0) continue;
    const ratio = targetCost / sourceCost;
    if (ratio < 1) shiftFull += model.gross * (1 - ratio);
  }

  let cacheFull = 0;
  for (const model of byModel.values()) {
    const card = cardOf(model.name);
    if (!card || model.list <= 0) continue;
    const perToken = (card.base.cacheWrite - card.base.cachedInput) / 1e6;
    if (perToken > 0) cacheFull += model.cw * perToken * (model.pricedGross / model.list);
  }

  const allot = allotmentsOf(rows);
  let capped = 0;
  for (const [user, gross] of userGross) {
    const allotment = allot.get(user) ?? 0;
    if (allotment > 0 && gross > params.capUtil * allotment) capped += gross - params.capUtil * allotment;
  }

  const standalone: Record<LeverId, number> = {
    modelShift: shiftFull * params.modelShift,
    autoAdoption: autoMissed * params.autoAdoption,
    cacheDiscipline: cacheFull * params.cacheDiscipline,
    contextHygiene: (estimate.input + estimate.cr + estimate.cw) * params.contextHygiene,
    longContext: longPremium * params.longContext,
    capRunaway: capped * params.capRunaway,
  };
  let remaining = baseline;
  const savings = {} as Record<LeverId, number>;
  for (const id of LEVER_ORDER) {
    const scale = baseline > 0 ? remaining / baseline : 0;
    const saving = Math.max(0, standalone[id] * scale);
    savings[id] = saving;
    remaining -= saving;
  }
  return { baseline, standalone, savings, total: baseline - remaining, final: remaining, shiftFull, longPremium, autoGross };
}

// ---------------------------------------------------------------------------------------------
// Datasets
// ---------------------------------------------------------------------------------------------

/**
 * Hand-built month where every number can be derived on paper. All rows are billed at list price except the Auto row, which
 * Auto bills 10% under its list price ($1.60 → $1.44), and the long-context row, which is billed at the long tier
 * (GPT-5.6 Terra: 300k input tokens, $2 → $4 per 1M).
 */
const LEVER_ROWS: RowSpec[] = [
  { date: '2026-10-05', user: 'alice', model: 'GPT-6 Astra', gross: 22, input: 1_000_000, output: 100_000, cacheRead: 2_000_000, cacheWrite: 400_000 },
  { date: '2026-10-06', user: 'alice', model: 'Auto: GPT-5.6 Terra', gross: 1.44, input: 500_000, output: 50_000 },
  { date: '2026-10-07', user: 'bob', model: 'GPT-5.6 Terra', gross: 1.38, input: 300_000, output: 10_000 },
  { date: '2026-10-08', user: 'bob', model: 'Claude Opus 5.5', gross: 2.5, input: 200_000, output: 50_000, cacheRead: 1_000_000, cacheWrite: 100_000 },
  { date: '2026-10-09', user: 'bob', model: 'Claude Sonnet 5.5', gross: 4, input: 1_000_000, output: 200_000 },
  { date: '2026-10-10', user: 'carol', gross: 50 },
  { date: '2026-10-11', user: 'carol', gross: 50 },
];

/**
 * One complete month (October) with four seats: u1, u2 and ghost on Business, ent on Enterprise.
 * ghost is an idle seat (almost no use, last seen Oct 2) and ent is a downgrade candidate (peak $5 of $39).
 */
const SEAT_ROWS: RowSpec[] = [
  ...['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22', '2026-10-31'].map((date): RowSpec => ({ date, user: 'u1', gross: 3 })),
  ...['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24'].map((date): RowSpec => ({ date, user: 'u2', gross: 3 })),
  ...['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30'].map((date): RowSpec => ({ date, user: 'ent', gross: 1, quota: 3900 })),
  { date: '2026-10-02', user: 'ghost', gross: 0.2 },
];

interface Data {
  A: Pipeline;
  B: Pipeline;
  AB: Pipeline;
  demo: Pipeline;
  lever: Pipeline;
  seats: Pipeline;
  rows: { A: NaiveRow[]; B: NaiveRow[]; AB: NaiveRow[]; demo: NaiveRow[]; lever: NaiveRow[] };
}

let datasets: Data;

beforeAll(async () => {
  const [pipelineA, pipelineB, pipelineAB, demo] = await Promise.all([
    analyzeFixtures([FIXTURE_A]),
    analyzeFixtures([FIXTURE_B]),
    analyzeFixtures([FIXTURE_A, FIXTURE_B]),
    analyzeDemo(),
  ]);
  const leverCsv = makeCsv(LEVER_ROWS, { pool: true });
  const lever = await analyzeCsv(leverCsv);
  const seats = await analyzeCsv(makeCsv(SEAT_ROWS, { pool: true }));
  const rowsA = naiveRows(readFixture(FIXTURE_A));
  const rowsB = naiveRows(readFixture(FIXTURE_B));
  datasets = { A: pipelineA, B: pipelineB, AB: pipelineAB, demo, lever, seats, rows: { A: rowsA, B: rowsB, AB: [...rowsA, ...rowsB], demo: naiveRows(demo.demo.csv), lever: naiveRows(leverCsv) } };
});

const realDatasets = (): [string, Pipeline, NaiveRow[]][] => [
  ['pool-used fixture', datasets.A, datasets.rows.A],
  ['partial-export fixture', datasets.B, datasets.rows.B],
  ['both fixtures', datasets.AB, datasets.rows.AB],
  ['demo', datasets.demo, datasets.rows.demo],
];

const finiteDeep = (value: unknown, path = 'value'): void => {
  if (typeof value === 'number') expect(Number.isFinite(value), `${path} is finite`).toBe(true);
  else if (Array.isArray(value)) value.forEach((item, index) => finiteDeep(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) finiteDeep(child, `${path}.${key}`);
};

// ---------------------------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------------------------

describe('lever catalogue', () => {
  it('applies the levers in a fixed order and describes every one of them', () => {
    expect(LEVER_ORDER).toEqual(IDS);
    expect(new Set(LEVER_ORDER).size).toBe(6);
    expect(Object.keys(LEVER_META).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      expect(LEVER_META[id].label.trim().length).toBeGreaterThan(3);
      expect(LEVER_META[id].description.trim().length).toBeGreaterThan(20);
    }
  });

  it('default strengths are shares in [0, 1], the cap multiple is positive and the target is same-vendor', () => {
    for (const id of IDS) {
      expect(DEFAULT_LEVERS[id]).toBeGreaterThan(0);
      expect(DEFAULT_LEVERS[id]).toBeLessThanOrEqual(1);
    }
    expect(DEFAULT_LEVERS.capUtil).toBeGreaterThan(0);
    expect(DEFAULT_LEVERS.target).toBe('same-vendor');
  });

  it('every vendor has a default right-sizing target that exists on the price card', () => {
    expect(Object.keys(DEFAULT_TARGETS).sort()).toEqual([...VENDORS].sort());
    for (const vendor of VENDORS) expect(cardOf(DEFAULT_TARGETS[vendor]), `${vendor} → ${DEFAULT_TARGETS[vendor]}`).toBeDefined();
  });

  it('lists the Versatile models of the card as explicit targets', () => {
    expect(VERSATILE_TARGETS.length).toBeGreaterThan(3);
    expect(VERSATILE_TARGETS).toEqual(PRICE_CARD.filter((card) => card.category === 'Versatile').map((card) => card.name));
    expect(VERSATILE_TARGETS).toContain('GPT-5.6 Terra');
    expect(VERSATILE_TARGETS).toContain('Claude Sonnet 5.5');
  });
});

// ---------------------------------------------------------------------------------------------
// applyLevers: the sequential application
// ---------------------------------------------------------------------------------------------

describe('applyLevers applies the levers one after the other', () => {
  const none: Record<LeverId, number> = { modelShift: 0, autoAdoption: 0, cacheDiscipline: 0, contextHygiene: 0, longContext: 0, capRunaway: 0 };

  it('works on what is left: two levers worth half the baseline each save 50 and 25, not 100', () => {
    const result = applyLevers(100, { ...none, modelShift: 50, autoAdoption: 50 }, LEVER_META, LEVER_ORDER);
    expect(result.steps.map((step) => step.savings)).toEqual([50, 25, 0, 0, 0, 0]);
    expect(result.total).toBe(75);
    expect(result.steps.map((step) => step.standalone)).toEqual([50, 50, 0, 0, 0, 0]);
  });

  it('a single lever saves exactly its standalone value', () => {
    for (const id of IDS) {
      const result = applyLevers(200, { ...none, [id]: 37.5 }, LEVER_META, LEVER_ORDER);
      expect(result.total).toBe(37.5);
      expect(result.steps.find((step) => step.id === id)!.savings).toBe(37.5);
    }
  });

  it('keeps the order, the labels and the descriptions of the metadata', () => {
    const result = applyLevers(10, none, LEVER_META, LEVER_ORDER);
    expect(result.steps.map((step) => step.id)).toEqual(LEVER_ORDER);
    for (const step of result.steps) {
      expect(step.label).toBe(LEVER_META[step.id].label);
      expect(step.description).toBe(LEVER_META[step.id].description);
    }
    const reversed = applyLevers(100, { ...none, modelShift: 50, autoAdoption: 50 }, LEVER_META, [...LEVER_ORDER].reverse());
    expect(reversed.steps.map((step) => step.id)).toEqual([...LEVER_ORDER].reverse());
    // the first step of the sequence always sees the whole baseline
    expect(reversed.steps.find((step) => step.id === 'autoAdoption')!.savings).toBe(50);
    expect(reversed.steps.find((step) => step.id === 'modelShift')!.savings).toBe(25);
  });

  it('levers that together exceed the baseline never save more than the baseline', () => {
    const result = applyLevers(100, { modelShift: 100, autoAdoption: 100, cacheDiscipline: 100, contextHygiene: 100, longContext: 100, capRunaway: 100 }, LEVER_META, LEVER_ORDER);
    expect(result.total).toBeCloseTo(100, 9);
    expect(result.steps[0].savings).toBe(100);
    for (const step of result.steps.slice(1)) expect(step.savings).toBeCloseTo(0, 9);
  });

  it('negative standalone values are clamped to zero and a zero baseline saves nothing', () => {
    const negativeShift = applyLevers(100, { ...none, modelShift: -30, autoAdoption: 10 }, LEVER_META, LEVER_ORDER);
    expect(negativeShift.steps[0].savings).toBe(0);
    expect(negativeShift.steps[0].standalone).toBe(-30);
    expect(negativeShift.steps[1].savings).toBe(10);
    expect(negativeShift.total).toBe(10);
    const zero = applyLevers(0, { ...none, modelShift: 5, capRunaway: 7 }, LEVER_META, LEVER_ORDER);
    expect(zero.total).toBe(0);
    for (const step of zero.steps) expect(step.savings).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// computeLevers on a dataset that can be derived by hand
// ---------------------------------------------------------------------------------------------

describe('computeLevers on a hand-built dataset', () => {
  // standalone values at the default strengths, derived on paper (see LEVER_ROWS)
  const HAND_CALCULATED = { modelShift: 5.595, autoAdoption: 6.494, cacheDiscipline: 1.016, contextHygiene: 2.255, longContext: 0.198, capRunaway: 21.5 };

  it('has the baseline, the Auto share and the long-context premium that the rows imply', () => {
    const analysis = datasets.lever.analysis;
    expect(analysis.agg.totals.gross).toBeCloseTo(131.32, 9);
    expect(analysis.agg.totals.autoGross).toBeCloseTo(1.44, 9);
    expect(analysis.agg.totals.longPremium).toBeCloseTo(0.66, 9);
    expect(analysis.agg.totals.longPremiumRows).toBe(1);
    expect(analysis.agg.totals.est.input + analysis.agg.totals.est.cacheRead + analysis.agg.totals.est.cacheWrite).toBeCloseTo(22.55, 9);
  });

  it('values every lever on its own as derived by hand', () => {
    const result = leversOf(datasets.lever);
    expect(result.baseline).toBeCloseTo(131.32, 9);
    for (const id of IDS) expect(stepOf(result, id).standalone, id).toBeCloseTo(HAND_CALCULATED[id], 9);
  });

  it('combines them sequentially: each step sees what the previous steps left', () => {
    const result = leversOf(datasets.lever);
    let remaining = 131.32;
    for (const id of LEVER_ORDER) {
      const expected = HAND_CALCULATED[id] * (remaining / 131.32);
      expect(stepOf(result, id).savings, id).toBeCloseTo(expected, 9);
      remaining -= expected;
    }
    expect(result.total).toBeCloseTo(131.32 - remaining, 9);
    expect(result.final).toBeCloseTo(remaining, 9);
    const standaloneSum = Object.values(HAND_CALCULATED).reduce((a, b) => a + b, 0);
    expect(result.total).toBeLessThan(standaloneSum - 1);
    expect(result.total).toBeGreaterThan(Math.max(...Object.values(HAND_CALCULATED)));
  });

  it('a lever used alone saves exactly strength × its full value', () => {
    // Hand-picked usage of every user (129.88) times the Auto rate of their plan, which the Auto row shows: 1 − 1.44 / 1.60 = 10%.
    const full: Record<LeverId, number> = { modelShift: 18.65, autoAdoption: 129.88 * 0.1, cacheDiscipline: 5.08, contextHygiene: 22.55, longContext: 0.66, capRunaway: 43 };
    for (const id of IDS) {
      for (const strength of STRENGTHS) {
        const result = leversOf(datasets.lever, solo(id, strength));
        expect(result.total, `${id} @ ${strength}`).toBeCloseTo(full[id] * strength, 9);
        for (const other of IDS) if (other !== id) expect(stepOf(result, other).savings).toBe(0);
      }
    }
  });

  it('caps runaway users above capUtil × their included credits, and a higher cap saves less', () => {
    const at = (capUtil: number) => leversOf(datasets.lever, solo('capRunaway', 1, { capUtil })).total;
    expect(at(1)).toBeCloseTo(85.44, 9); // carol 100 − 19, alice 23.44 − 19
    expect(at(3)).toBeCloseTo(43, 9);
    expect(at(5)).toBeCloseTo(5, 9);
    expect(at(6)).toBe(0);
    const capValues = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 10];
    const totals = capValues.map(at);
    for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeLessThanOrEqual(totals[i - 1] + 1e-9);
  });

  it('right-sizes Powerful models to the cheapest list-price equivalent of the same token mix', () => {
    const { ratio, rows } = modelShiftRatios(ctxOf(datasets.lever), 'same-vendor');
    expect(rows.map((shiftRow) => shiftRow.model)).toEqual(['GPT-6 Astra', 'Claude Opus 5.5']);
    expect(rows.map((shiftRow) => shiftRow.target)).toEqual(['GPT-5.6 Terra', 'Claude Sonnet 5.5']);
    expect(rows[0].gross).toBeCloseTo(22, 9);
    expect(rows[0].ratio).toBeCloseTo(4.6 / 22, 9);
    expect(rows[0].savingsAtFull).toBeCloseTo(17.4, 9);
    expect(rows[1].gross).toBeCloseTo(2.5, 9);
    expect(rows[1].ratio).toBeCloseTo(0.5, 9);
    expect(rows[1].savingsAtFull).toBeCloseTo(1.25, 9);
    // the ratio table is indexed by model id; only Powerful models have one
    expect(ratio[rows[0].modelId]).toBe(rows[0].ratio);
    expect(ratio[rows[1].modelId]).toBe(rows[1].ratio);
    const defined = [...ratio].filter((modelRatio) => !Number.isNaN(modelRatio));
    expect(defined.length).toBe(2);
  });

  it('honours an explicit target model', () => {
    const toSonnet = modelShiftRatios(ctxOf(datasets.lever), 'Claude Sonnet 5.5');
    expect(toSonnet.rows.map((shiftRow) => shiftRow.target)).toEqual(['Claude Sonnet 5.5', 'Claude Sonnet 5.5']);
    expect(toSonnet.rows[0].savingsAtFull).toBeCloseTo(17.8, 9);
    expect(toSonnet.rows[1].savingsAtFull).toBeCloseTo(1.25, 9);
    expect(leversOf(datasets.lever, solo('modelShift', 1, { target: 'Claude Sonnet 5.5' })).total).toBeCloseTo(19.05, 9);
  });

  it('skips a model that is its own target and lists a dearer target with zero savings', () => {
    const { rows } = modelShiftRatios(ctxOf(datasets.lever), 'GPT-6 Astra');
    expect(rows.map((shiftRow) => shiftRow.model)).toEqual(['Claude Opus 5.5']);
    expect(rows[0].ratio).toBeCloseTo(6.75 / 2.5, 9);
    expect(rows[0].savingsAtFull).toBe(0);
    expect(leversOf(datasets.lever, solo('modelShift', 1, { target: 'GPT-6 Astra' })).total).toBe(0);
  });

  it('an unknown target model offers nothing', () => {
    const { rows, ratio } = modelShiftRatios(ctxOf(datasets.lever), 'No Such Model 9');
    expect(rows).toEqual([]);
    expect([...ratio].every((modelRatio) => Number.isNaN(modelRatio))).toBe(true);
    expect(leversOf(datasets.lever, solo('modelShift', 1, { target: 'No Such Model 9' })).total).toBe(0);
  });

  it('resolves the target like the rest of the app: card, vendor default, then overrides', () => {
    const settings = datasets.lever.settings;
    expect(targetMeta('same-vendor', 'OpenAI', settings).name).toBe('GPT-5.6 Terra');
    expect(targetMeta('same-vendor', 'Anthropic', settings).name).toBe('Claude Sonnet 5.5');
    expect(targetMeta('Gemini 3.8 Flash', 'OpenAI', settings).name).toBe('Gemini 3.8 Flash');
    expect(targetMeta('Not A Model', 'OpenAI', settings).priced).toBe(false);
  });

  it('price overrides flow into the right-sizing estimate', async () => {
    const cheaper = { input: 1, cachedInput: 0.1, cacheWrite: 1.25, output: 6 };
    const pipeline = await analyzeCsv(makeCsv(LEVER_ROWS, { pool: true }), { settings: { modelOverrides: { 'GPT-5.6 Terra': { base: cheaper } } } });
    const { rows } = modelShiftRatios(ctxOf(pipeline), 'same-vendor');
    expect(rows[0].model).toBe('GPT-6 Astra');
    expect(rows[0].ratio).toBeCloseTo(2.3 / 22, 9);
    expect(rows[0].savingsAtFull).toBeCloseTo(22 - 2.3, 9);
    // a model re-classified as Versatile is no longer right-sized
    const reclass = await analyzeCsv(makeCsv(LEVER_ROWS, { pool: true }), { settings: { modelOverrides: { 'GPT-6 Astra': { category: 'Versatile' } } } });
    expect(modelShiftRatios(ctxOf(reclass), 'same-vendor').rows.map((shiftRow) => shiftRow.model)).toEqual(['Claude Opus 5.5']);
  });

  it('estimates cache discipline from cache-write tokens priced above cache reads', () => {
    expect(cacheSavingsStandalone(ctxOf(datasets.lever), 1)).toBeCloseTo(5.08, 9);
    expect(cacheSavingsStandalone(ctxOf(datasets.lever), 0.2)).toBeCloseTo(1.016, 9);
    expect(cacheSavingsStandalone(ctxOf(datasets.lever), 0)).toBe(0);
  });

  it('the analysis levers and the plan levers are the default levers of the same scope', () => {
    const analysis = datasets.lever.analysis;
    expect(analysis.levers).toEqual(leversOf(datasets.lever));
    expect(analysis.plan.levers).toEqual(analysis.levers);
  });
});

// ---------------------------------------------------------------------------------------------
// computeLevers vs an independent recomputation, on the fixtures and the demo
// ---------------------------------------------------------------------------------------------

describe('computeLevers matches an independent recomputation from the raw rows', () => {
  const PARAM_SETS: [string, LeverParams][] = [
    ['default levers', DEFAULT_LEVERS],
    ['all levers at 100% and a 1× cap', { ...ONES, capUtil: 1 }],
    ['half strength, 0.5× cap, explicit target', { ...ZERO, modelShift: 0.5, autoAdoption: 0.5, cacheDiscipline: 0.5, contextHygiene: 0.5, longContext: 0.5, capRunaway: 0.5, capUtil: 0.5, target: 'Claude Sonnet 5.5' }],
    ['no levers', ZERO],
    ...IDS.map((id): [string, LeverParams] => [`${id} alone at 70%`, solo(id, 0.7)]),
  ];

  for (const [dsName, getPipeline, getRows] of [
    ['pool-used fixture', () => datasets.A, () => datasets.rows.A],
    ['partial-export fixture', () => datasets.B, () => datasets.rows.B],
    ['both fixtures', () => datasets.AB, () => datasets.rows.AB],
    ['demo', () => datasets.demo, () => datasets.rows.demo],
    ['hand-built month', () => datasets.lever, () => datasets.rows.lever],
  ] as [string, () => Pipeline, () => NaiveRow[]][]) {
    it.each(PARAM_SETS)(`${dsName}: %s`, (_label, params) => {
      const pipeline = getPipeline();
      const want = leverOracle(getRows(), params, pipeline.settings.autoDiscount);
      const got = leversOf(pipeline, params);
      expect(got.baseline).toBeCloseTo(want.baseline, 6);
      for (const id of IDS) {
        expect(stepOf(got, id).standalone, `${id} standalone`).toBeCloseTo(want.standalone[id], 6);
        expect(stepOf(got, id).savings, `${id} saving`).toBeCloseTo(want.savings[id], 6);
      }
      expect(got.total).toBeCloseTo(want.total, 6);
      expect(got.final).toBeCloseTo(want.final, 6);
    });
  }

  it('the oracle sees model right-sizing, long-context and Auto spend where the fixtures have them', () => {
    expect(leverOracle(datasets.rows.B, DEFAULT_LEVERS).shiftFull).toBeGreaterThan(100);
    expect(leverOracle(datasets.rows.B, DEFAULT_LEVERS).longPremium).toBeGreaterThan(100);
    expect(leverOracle(datasets.rows.B, DEFAULT_LEVERS).autoGross).toBe(0);
    expect(leverOracle(datasets.rows.demo, DEFAULT_LEVERS).autoGross).toBeGreaterThan(500);
    expect(leverOracle(datasets.rows.demo, DEFAULT_LEVERS).shiftFull).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------------------------
// Lever invariants
// ---------------------------------------------------------------------------------------------

describe('lever invariants', () => {
  const PARAMS: LeverParams[] = [
    DEFAULT_LEVERS,
    ONES,
    { ...ONES, capUtil: 0.5 },
    { ...ONES, capUtil: 10, target: 'Gemini 3.8 Flash' },
    { ...DEFAULT_LEVERS, modelShift: 0.9, capRunaway: 0.1 },
    ZERO,
  ];

  for (const [name, getPipeline] of [['pool-used fixture', () => datasets.A], ['partial-export fixture', () => datasets.B], ['both fixtures', () => datasets.AB], ['demo', () => datasets.demo], ['hand-built month', () => datasets.lever]] as [string, () => Pipeline][]) {
    describe(name, () => {
      it('every step saves a non-negative amount that never exceeds its standalone value', () => {
        for (const params of PARAMS) {
          const result = leversOf(getPipeline(), params);
          expect(result.steps.map((step) => step.id)).toEqual(LEVER_ORDER);
          for (const step of result.steps) {
            expect(step.savings, step.id).toBeGreaterThanOrEqual(0);
            expect(step.savings, step.id).toBeLessThanOrEqual(step.standalone + 1e-9);
            expect(step.standalone, step.id).toBeGreaterThanOrEqual(0);
          }
        }
      });

      it('the steps add up to the total, which never exceeds the baseline, and final = baseline − total', () => {
        for (const params of PARAMS) {
          const result = leversOf(getPipeline(), params);
          const sumSteps = result.steps.reduce((total, step) => total + step.savings, 0);
          expect(result.total).toBeCloseTo(sumSteps, 9);
          expect(result.total).toBeLessThanOrEqual(result.baseline + 1e-9);
          expect(result.final).toBeCloseTo(result.baseline - result.total, 9);
          expect(result.final).toBeGreaterThanOrEqual(-1e-9);
          expect(result.baseline).toBeCloseTo(getPipeline().analysis.agg.totals.gross, 9);
          finiteDeep(result.steps.map((step) => [step.savings, step.standalone]));
        }
      });

      it('never double counts: total is at most the sum and at least the largest of the standalone values', () => {
        for (const params of PARAMS) {
          const result = leversOf(getPipeline(), params);
          const standalone = result.steps.map((step) => step.standalone);
          expect(result.total).toBeLessThanOrEqual(standalone.reduce((a, b) => a + b, 0) + 1e-9);
          expect(result.total).toBeGreaterThanOrEqual(Math.max(...standalone) - 1e-9);
        }
      });

      it('with every lever at zero nothing is saved', () => {
        const result = leversOf(getPipeline(), ZERO);
        expect(result.total).toBe(0);
        expect(result.final).toBeCloseTo(result.baseline, 9);
        for (const step of result.steps) {
          expect(step.savings).toBe(0);
          expect(step.standalone).toBe(0);
        }
      });

      it('a lever alone saves linearly in its strength', () => {
        for (const id of IDS) {
          const full = leversOf(getPipeline(), solo(id, 1)).total;
          for (const strength of STRENGTHS) expect(leversOf(getPipeline(), solo(id, strength)).total, `${id} @ ${strength}`).toBeCloseTo(full * strength, 9);
        }
      });

      it('turning up any one lever never lowers the total saving', () => {
        for (const id of IDS) {
          const totals = STRENGTHS.map((strength) => leversOf(getPipeline(), { [id]: strength }).total);
          for (let i = 1; i < totals.length; i++) expect(totals[i], `${id}`).toBeGreaterThanOrEqual(totals[i - 1] - 1e-9);
        }
      });

      it('a higher cap multiple never saves more', () => {
        const totals = [0.5, 1, 2, 3, 5, 8, 20].map((capUtil) => leversOf(getPipeline(), solo('capRunaway', 1, { capUtil })).total);
        for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeLessThanOrEqual(totals[i - 1] + 1e-9);
      });

      it('a lever can never save more than the part of the spend it applies to', () => {
        const analysis = getPipeline().analysis;
        const result = leversOf(getPipeline(), ONES);
        expect(stepOf(result, 'longContext').standalone).toBeLessThanOrEqual(analysis.agg.totals.longPremium + 1e-9);
        const topRate = Math.max(getPipeline().settings.autoDiscount, ...analysis.auto.plans.map((plan) => plan.rate));
        expect(stepOf(result, 'autoAdoption').standalone).toBeLessThanOrEqual((analysis.agg.totals.gross - analysis.agg.totals.autoGross) * topRate + 1e-9);
        expect(stepOf(result, 'modelShift').standalone).toBeLessThanOrEqual(analysis.agg.totals.tierGross[0] + 1e-9);
        expect(stepOf(result, 'cacheDiscipline').standalone).toBeLessThanOrEqual(analysis.agg.totals.pricedGross + 1e-9);
        const input = analysis.agg.totals.est.input + analysis.agg.totals.est.cacheRead + analysis.agg.totals.est.cacheWrite;
        expect(stepOf(result, 'contextHygiene').standalone).toBeLessThanOrEqual(input + 1e-9);
        expect(stepOf(result, 'capRunaway').standalone).toBeLessThanOrEqual(analysis.agg.totals.attributedGross + 1e-9);
      });
    });
  }

  it('a report with no Auto usage to measure takes the Auto rate from Settings, so a higher rate makes the Auto lever worth proportionally more', () => {
    expect(datasets.B.analysis.auto.plans).toEqual([]);
    const base = leversOf(datasets.B, solo('autoAdoption', 1)).total;
    const settings = { ...datasets.B.settings, autoDiscount: datasets.B.settings.autoDiscount * 2 };
    const doubled = computeLevers({ ...ctxOf(datasets.B), settings }, solo('autoAdoption', 1), allotOf(datasets.B)).total;
    expect(base).toBeGreaterThan(0);
    expect(doubled).toBeCloseTo(base * 2, 9);
  });

  it('a report that shows the Auto discount ignores the Settings rate: the measured rate of each plan is used', () => {
    expect(datasets.demo.analysis.auto.plans.length).toBeGreaterThan(0);
    for (const plan of datasets.demo.analysis.auto.plans) expect(plan.source).toBe('measured');
    const base = leversOf(datasets.demo, solo('autoAdoption', 1)).total;
    const settings = { ...datasets.demo.settings, autoDiscount: datasets.demo.settings.autoDiscount * 2 };
    const doubled = computeLevers({ ...ctxOf(datasets.demo), settings }, solo('autoAdoption', 1), allotOf(datasets.demo)).total;
    expect(base).toBeGreaterThan(0);
    expect(doubled).toBeCloseTo(base, 9);
  });

  it('an empty scope has nothing to save and produces no NaN', () => {
    const empty = datasets.demo.run({ ...emptyFilters(), users: ['nobody-here'] });
    expect(empty.agg.totals.rows).toBe(0);
    expect(empty.levers.baseline).toBe(0);
    expect(empty.levers.total).toBe(0);
    expect(empty.levers.final).toBe(0);
    finiteDeep(empty.levers.steps.map((step) => [step.savings, step.standalone]));
    expect(empty.plan.levers.total).toBe(0);
    expect(empty.plan.fraction).toBe(0);
    expect(Number.isFinite(empty.plan.saving)).toBe(true);
    expect(empty.plan.saving).toBeCloseTo(0, 9);
  });

  it('the levers follow the filtered scope (one model → at most that model)', () => {
    const one = datasets.demo.run({ ...emptyFilters(), models: ['GPT-6 Astra'] });
    expect(one.levers.baseline).toBeCloseTo(one.agg.totals.gross, 9);
    expect(one.levers.baseline).toBeLessThan(datasets.demo.analysis.levers.baseline);
    expect(one.levers.total).toBeLessThanOrEqual(one.levers.baseline + 1e-9);
    expect(one.agg.totals.longPremium).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Right-sizing on the fixtures and the demo
// ---------------------------------------------------------------------------------------------

describe('model right-sizing on report data', () => {
  it('partial-export fixture: GPT-6 Astra → GPT-5.6 Terra, valued with the token mix of the file', () => {
    const rows = datasets.rows.B.filter((row) => modelOfRow(row) === 'GPT-6 Astra');
    const tokens = {
      input: rows.reduce((total, row) => total + numOf(row, 'input'), 0),
      cr: rows.reduce((total, row) => total + numOf(row, 'cache_read'), 0),
      cw: rows.reduce((total, row) => total + numOf(row, 'cache_write'), 0),
      out: rows.reduce((total, row) => total + numOf(row, 'output'), 0),
    };
    const gross = rows.reduce((total, row) => total + numOf(row, 'gross_amount'), 0);
    const sourceCost = tokenCost(cardOf('GPT-6 Astra')!.base, tokens);
    const targetCost = tokenCost(cardOf('GPT-5.6 Terra')!.base, tokens);
    const { rows: shift } = modelShiftRatios(ctxOf(datasets.B), 'same-vendor');
    const astra = shift.find((shiftRow) => shiftRow.model === 'GPT-6 Astra')!;
    expect(astra).toBeDefined();
    expect(astra.target).toBe('GPT-5.6 Terra');
    expect(astra.gross).toBeCloseTo(gross, 6);
    expect(astra.ratio).toBeCloseTo(targetCost / sourceCost, 9);
    expect(astra.savingsAtFull).toBeCloseTo(gross * (1 - targetCost / sourceCost), 6);
    expect(astra.ratio).toBeLessThan(1);
  });

  it('rows are sorted by the saving at full strength and never negative', () => {
    for (const [name, pipeline] of realDatasets()) {
      const { rows } = modelShiftRatios(ctxOf(pipeline), 'same-vendor');
      for (let i = 1; i < rows.length; i++) expect(rows[i].savingsAtFull, name).toBeLessThanOrEqual(rows[i - 1].savingsAtFull);
      for (const shiftRow of rows) {
        expect(shiftRow.savingsAtFull).toBeGreaterThanOrEqual(0);
        expect(shiftRow.savingsAtFull).toBeLessThanOrEqual(shiftRow.gross + 1e-9);
        expect(shiftRow.target).not.toBe(shiftRow.model);
      }
    }
  });

  it('only Powerful, priced models with spend appear, and the ratio table matches the rows', () => {
    for (const [name, pipeline] of realDatasets()) {
      const { ratio, rows } = modelShiftRatios(ctxOf(pipeline), 'same-vendor');
      const ids = new Set(rows.map((shiftRow) => shiftRow.modelId));
      for (let modelId = 0; modelId < ratio.length; modelId++) {
        const meta = pipeline.models.meta[modelId];
        if (ids.has(modelId)) {
          expect(meta.category, `${name}: ${meta.name}`).toBe('Powerful');
          expect(meta.priced).toBe(true);
          expect(Number.isNaN(ratio[modelId])).toBe(false);
        } else {
          expect(Number.isNaN(ratio[modelId]), `${name}: ${meta.name}`).toBe(true);
        }
      }
      expect(pipeline.analysis.levers.shiftRows).toEqual(rows);
    }
  });

  it('pool-used fixture: only Powerful models are listed and they add up to the independent estimate', () => {
    const { rows } = modelShiftRatios(ctxOf(datasets.A), 'same-vendor');
    for (const shiftRow of rows) expect(cardOf(shiftRow.model)!.category).toBe('Powerful');
    const want = leverOracle(datasets.rows.A, DEFAULT_LEVERS).shiftFull;
    expect(rows.reduce((total, shiftRow) => total + shiftRow.savingsAtFull, 0)).toBeCloseTo(want, 6);
  });
});

// ---------------------------------------------------------------------------------------------
// The cost model
// ---------------------------------------------------------------------------------------------

const month = (capacity: number, gross: number, over: Partial<MonthInput> = {}): MonthInput => ({ label: 'M', projected: false, capacity, gross, ...over });

describe('cost model: you pay the larger of the pool and the usage', () => {
  it('monthCost = max(pool capacity, gross usage)', () => {
    const cases: [number, number, number][] = [[100, 40, 100], [100, 100, 100], [100, 250.5, 250.5], [0, 12, 12], [0, 0, 0], [57, 56.99, 57], [57, 57.01, 57.01]];
    for (const [cap, gross, cost] of cases) expect(monthCost(cap, gross), `${cap}/${gross}`).toBe(cost);
  });

  it('seats are never a discount: the cost is never below the usage or the pool, and never falls when seats are added', () => {
    for (const gross of [0, 10, 57, 120, 999]) {
      let prev = -1;
      for (const cap of [0, 19, 38, 57, 76, 120, 1000]) {
        const cost = monthCost(cap, gross);
        expect(cost).toBeGreaterThanOrEqual(gross);
        expect(cost).toBeGreaterThanOrEqual(cap);
        expect(cost).toBeGreaterThanOrEqual(prev);
        prev = cost;
      }
    }
  });

  it('less usage never costs more', () => {
    for (const cap of [0, 19, 57, 200]) {
      let prev = Infinity;
      for (const gross of [500, 200, 100, 57, 30, 0]) {
        const cost = monthCost(cap, gross);
        expect(cost).toBeLessThanOrEqual(prev);
        prev = cost;
      }
    }
  });
});

describe('evaluateMonths', () => {
  const MONTHS: MonthInput[] = [month(100, 40), month(100, 100), month(100, 160), month(0, 50), month(0, 0), month(250, 0), month(57, 56.99), month(57, 57.01), month(76, 30.5)];
  const FRACTIONS = [0, 0.1, 0.25, 0.5, 0.9, 1];
  const SEATS = [0, 5, 19, 20, 39, 60, 100, 1e6];

  it('changes nothing with no usage reduction and no seat removal', () => {
    for (const monthResult of evaluateMonths(MONTHS, 0, 0)) {
      expect(monthResult.saving).toBe(0);
      expect(monthResult.newCost).toBe(monthResult.baseCost);
      expect(monthResult.newCapacity).toBe(monthResult.capacity);
      expect(monthResult.newGross).toBe(monthResult.gross);
      expect(monthResult.newWaste).toBe(monthResult.baseWaste);
    }
  });

  it('keeps the label, the order and the projected flag of every month', () => {
    const input = [month(10, 5, { label: 'Sep 2026' }), month(20, 30, { label: 'Oct 2026', projected: true }), month(5, 1, { label: 'Nov 2026' })];
    const out = evaluateMonths(input, 0.2, 3);
    expect(out.map((monthResult) => monthResult.label)).toEqual(['Sep 2026', 'Oct 2026', 'Nov 2026']);
    expect(out.map((monthResult) => monthResult.projected)).toEqual([false, true, false]);
    expect(out.map((monthResult) => monthResult.capacity)).toEqual([10, 20, 5]);
    expect(out.map((monthResult) => monthResult.gross)).toEqual([5, 30, 1]);
    expect(evaluateMonths([], 0.5, 10)).toEqual([]);
    expect(cashSaving([], 0.5, 10)).toBe(0);
  });

  it('removes seat value from the pool without going below zero and scales the usage by (1 − fraction)', () => {
    for (const monthInput of MONTHS) {
      for (const fraction of FRACTIONS) {
        for (const seatValue of SEATS) {
          const monthResult = evaluateMonths([monthInput], fraction, seatValue)[0];
          expect(monthResult.newCapacity).toBeCloseTo(Math.max(0, monthInput.capacity - seatValue), 9);
          expect(monthResult.newCapacity).toBeGreaterThanOrEqual(0);
          expect(monthResult.newCapacity).toBeLessThanOrEqual(monthInput.capacity);
          expect(monthResult.newGross).toBeCloseTo(monthInput.gross * (1 - fraction), 9);
          expect(monthResult.baseCost).toBe(monthCost(monthInput.capacity, monthInput.gross));
          expect(monthResult.newCost).toBe(monthCost(monthResult.newCapacity, monthResult.newGross));
          expect(monthResult.saving).toBeCloseTo(monthResult.baseCost - monthResult.newCost, 9);
          expect(monthResult.baseWaste).toBeCloseTo(Math.max(0, monthInput.capacity - monthInput.gross), 9);
          expect(monthResult.newWaste).toBeCloseTo(Math.max(0, monthResult.newCapacity - monthResult.newGross), 9);
        }
      }
    }
  });

  it('never saves a negative amount, never more than the month cost, never more than the larger of the two reductions', () => {
    for (const monthInput of MONTHS) {
      for (const fraction of FRACTIONS) {
        for (const seatValue of SEATS) {
          const monthResult = evaluateMonths([monthInput], fraction, seatValue)[0];
          expect(monthResult.saving, `${monthInput.capacity}/${monthInput.gross} f=${fraction} s=${seatValue}`).toBeGreaterThanOrEqual(-1e-9);
          expect(monthResult.saving).toBeLessThanOrEqual(monthResult.baseCost + 1e-9);
          expect(monthResult.saving).toBeLessThanOrEqual(Math.max(Math.min(seatValue, monthInput.capacity), monthInput.gross * fraction) + 1e-9);
          expect(monthResult.newCost).toBeGreaterThanOrEqual(-1e-9);
        }
      }
    }
  });

  it('a usage reduction only saves cash down to the pool size: min(reduction, overage)', () => {
    for (const monthInput of MONTHS) {
      for (const fraction of FRACTIONS) {
        const monthResult = evaluateMonths([monthInput], fraction, 0)[0];
        const overage = Math.max(0, monthInput.gross - monthInput.capacity);
        expect(monthResult.saving, `${monthInput.capacity}/${monthInput.gross} f=${fraction}`).toBeCloseTo(Math.min(monthInput.gross * fraction, overage), 9);
        expect(monthResult.saving).toBeLessThanOrEqual(overage + 1e-9);
        expect(monthResult.saving).toBeLessThanOrEqual(monthInput.gross * fraction + 1e-9);
      }
    }
  });

  it('removing seats saves nothing when usage already reaches the pool, and never more than the slack otherwise', () => {
    for (const monthInput of MONTHS) {
      for (const seatValue of SEATS) {
        const monthResult = evaluateMonths([monthInput], 0, seatValue)[0];
        const slack = Math.max(0, monthInput.capacity - monthInput.gross);
        expect(monthResult.saving, `${monthInput.capacity}/${monthInput.gross} s=${seatValue}`).toBeCloseTo(Math.min(seatValue, slack), 9);
        if (monthInput.gross >= monthInput.capacity) expect(monthResult.saving).toBeCloseTo(0, 9);
        expect(monthResult.saving).toBeLessThanOrEqual(slack + 1e-9);
      }
    }
  });

  it('removing all the seats of a month saves exactly its unused credits', () => {
    for (const monthInput of MONTHS) {
      const monthResult = evaluateMonths([monthInput], 0, 1e9)[0];
      expect(monthResult.newCapacity).toBe(0);
      expect(monthResult.saving).toBeCloseTo(Math.max(0, monthInput.capacity - monthInput.gross), 9);
    }
  });

  it('cutting usage below the pool wastes more included credits, it does not save cash', () => {
    const monthResult = evaluateMonths([month(100, 40)], 0.5, 0)[0];
    expect(monthResult.saving).toBe(0);
    expect(monthResult.baseWaste).toBe(60);
    expect(monthResult.newWaste).toBe(80);
  });

  it('more usage reduction or more seats removed never saves less', () => {
    for (const monthInput of MONTHS) {
      for (const seatValue of SEATS) {
        let prev = -1;
        for (const fraction of FRACTIONS) {
          const saving = evaluateMonths([monthInput], fraction, seatValue)[0].saving;
          expect(saving).toBeGreaterThanOrEqual(prev - 1e-9);
          prev = saving;
        }
      }
      for (const fraction of FRACTIONS) {
        let prev = -1;
        for (const seatValue of SEATS) {
          const saving = evaluateMonths([monthInput], fraction, seatValue)[0].saving;
          expect(saving).toBeGreaterThanOrEqual(prev - 1e-9);
          prev = saving;
        }
      }
    }
  });

  it('combining both is never worse than either alone, and never saves more than the larger reduction', () => {
    for (const monthInput of MONTHS) {
      for (const fraction of FRACTIONS) {
        for (const seatValue of SEATS) {
          const both = evaluateMonths([monthInput], fraction, seatValue)[0].saving;
          expect(both).toBeGreaterThanOrEqual(evaluateMonths([monthInput], fraction, 0)[0].saving - 1e-9);
          expect(both).toBeGreaterThanOrEqual(evaluateMonths([monthInput], 0, seatValue)[0].saving - 1e-9);
        }
      }
    }
  });

  it('a usage reduction can open up room for seat removal that neither achieves alone', () => {
    const monthInput = month(100, 130);
    expect(cashSaving([monthInput], 0, 40)).toBeCloseTo(0, 9); // over the pool: no seat can go
    expect(cashSaving([monthInput], 0.5, 0)).toBeCloseTo(30, 9); // only the overage is saved
    expect(cashSaving([monthInput], 0.5, 40)).toBeCloseTo(65, 9); // 65 of usage left, a 60 pool: pay 65 instead of 130
  });

  it('cashSaving is the sum of the monthly savings', () => {
    for (const fraction of FRACTIONS) {
      for (const seatValue of SEATS) {
        const sum = evaluateMonths(MONTHS, fraction, seatValue).reduce((total, monthResult) => total + monthResult.saving, 0);
        expect(cashSaving(MONTHS, fraction, seatValue)).toBeCloseTo(sum, 9);
      }
    }
  });

  it('months are independent of each other', () => {
    const total = cashSaving(MONTHS, 0.3, 19);
    const parts = MONTHS.reduce((sum, monthInput) => sum + cashSaving([monthInput], 0.3, 19), 0);
    expect(total).toBeCloseTo(parts, 9);
  });
});

describe('seatValueFor adds the seat actions that are switched on', () => {
  const plan = { idleValue: 19, downgradeValue: 20, unusedValue: 39 } as SeatPlan;
  it('sums only the enabled actions', () => {
    const seatValueWith = (reclaimIdle: boolean, downgrade: boolean, reclaimUnused: boolean) => seatValueFor(plan, { reclaimIdle, downgrade, reclaimUnused });
    expect(seatValueWith(false, false, false)).toBe(0);
    expect(seatValueWith(true, false, false)).toBe(19);
    expect(seatValueWith(false, true, false)).toBe(20);
    expect(seatValueWith(false, false, true)).toBe(39);
    expect(seatValueWith(true, true, false)).toBe(39);
    expect(seatValueWith(true, false, true)).toBe(58);
    expect(seatValueWith(true, true, true)).toBe(78);
  });
});

describe('allotmentArray', () => {
  it('holds the included credits of every profile at the id of the user, and nothing for the blank user', () => {
    const analysis = datasets.demo.analysis;
    const allotments = allotmentArray(analysis.users, analysis.agg.userAcc.gross.length);
    expect(allotments.length).toBe(analysis.agg.userAcc.gross.length);
    expect(allotments[0]).toBe(0);
    for (const profile of analysis.users.profiles) expect(allotments[profile.id]).toBe(profile.allotment);
    const filled = [...allotments].filter((allotment) => allotment > 0).length;
    expect(filled).toBe(analysis.users.profiles.filter((profile) => profile.allotment > 0).length);
  });
});

// ---------------------------------------------------------------------------------------------
// monthInputs on real pools
// ---------------------------------------------------------------------------------------------

describe('monthInputs turns the pool into the months of the cost model', () => {
  it('one input per month, same labels, projected months use the projected gross', () => {
    for (const [name, pipeline] of realDatasets()) {
      const { months } = pipeline.analysis.pool;
      const inputs = monthInputs(pipeline.analysis.pool);
      expect(inputs.length, name).toBe(months.length);
      inputs.forEach((monthInput, index) => {
        expect(monthInput.label).toBe(months[index].label);
        expect(monthInput.projected).toBe(months[index].projection !== null);
        expect(monthInput.gross).toBe(months[index].projection ? months[index].projection!.projGross : months[index].gross);
        expect(monthInput.capacity).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('keeps the known pool capacity when the seats of the file fund all covered usage (pool-used fixture, demo, hand-built)', () => {
    for (const pipeline of [datasets.A, datasets.demo, datasets.seats]) {
      const inputs = monthInputs(pipeline.analysis.pool);
      pipeline.analysis.pool.months.forEach((poolMonth, index) => {
        expect(poolMonth.capacityExceeded).toBe(false);
        expect(inputs[index].capacity).toBe(poolMonth.capacity);
      });
    }
  });

  it('pool-used fixture: October is projected to its end and the pool is the two seats', () => {
    const [poolMonth] = datasets.A.analysis.pool.months;
    expect(poolMonth.projection).not.toBeNull();
    const [monthInput] = monthInputs(datasets.A.analysis.pool);
    expect(monthInput.projected).toBe(true);
    expect(monthInput.capacity).toBeCloseTo(58, 9);
    expect(monthInput.gross).toBeCloseTo(poolMonth.projection!.projGross, 9);
    expect(monthInput.gross).toBeGreaterThan(poolMonth.gross);
  });

  it('demo: September is complete (observed), October is projected', () => {
    const [september, october] = monthInputs(datasets.demo.analysis.pool);
    expect(september.projected).toBe(false);
    expect(october.projected).toBe(true);
    expect(september.gross).toBeCloseTo(datasets.demo.analysis.pool.months[0].gross, 9);
    expect(october.gross).toBeGreaterThan(datasets.demo.analysis.pool.months[1].gross);
  });

  it('seats outside the file: a pool that never ran out is assumed to cover everything projected (partial-export fixture)', () => {
    const poolMonth = datasets.B.analysis.pool.months[0];
    expect(poolMonth.capacityExceeded).toBe(true);
    expect(poolMonth.exhaustedOn).toBeNull();
    const [monthInput] = monthInputs(datasets.B.analysis.pool);
    expect(monthInput.capacity).toBeCloseTo(Math.max(poolMonth.capacity, poolMonth.projection ? poolMonth.projection.projGross : poolMonth.gross), 9);
    expect(monthInput.capacity).toBeGreaterThan(poolMonth.capacity);
    expect(monthInput.capacity).toBeCloseTo(monthInput.gross, 9);
  });

  it('seats outside the file: an exhausted pool is at least what it covered (both fixtures)', () => {
    const poolMonth = datasets.AB.analysis.pool.months[0];
    expect(poolMonth.capacityExceeded).toBe(true);
    expect(poolMonth.exhaustedOn).not.toBeNull();
    const [monthInput] = monthInputs(datasets.AB.analysis.pool);
    expect(monthInput.capacity).toBeCloseTo(Math.max(poolMonth.capacity, poolMonth.discount), 9);
    expect(monthInput.capacity).toBeGreaterThan(poolMonth.capacity);
  });
});

// ---------------------------------------------------------------------------------------------
// runScenario
// ---------------------------------------------------------------------------------------------

const scenarioOf = (pipeline: Pipeline, input: Partial<ScenarioInput> = {}, analysis = pipeline.analysis) =>
  runScenario({ agg: analysis.agg, models: pipeline.models, settings: pipeline.settings, autoRates: analysis.autoRates }, analysis.pool, analysis.users, analysis.seats, {
    levers: DEFAULT_LEVERS,
    reclaimIdle: true,
    downgrade: true,
    reclaimUnused: true,
    ...input,
  });

describe('runScenario', () => {
  it('is exactly what the analysis reports as its combined plan (demo and fixtures)', () => {
    for (const [name, pipeline] of realDatasets()) expect(scenarioOf(pipeline), name).toEqual(pipeline.analysis.plan);
  });

  it('is exactly the analysis plan when the scope is narrowed: no seat action applies', () => {
    const narrowed = datasets.demo.run({ ...emptyFilters(), models: ['GPT-6 Astra'] });
    expect(narrowed.narrowed).toBe(true);
    expect(scenarioOf(datasets.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false }, narrowed)).toEqual(narrowed.plan);
    expect(narrowed.plan.seatValue).toBe(0);
    const segment = datasets.demo.run({ ...emptyFilters(), tiers: ['runaway'] });
    expect(segment.plan.seatValue).toBe(0);
    expect(scenarioOf(datasets.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false }, segment)).toEqual(segment.plan);
  });

  it('adds up: months sum to the totals and saving = base − new', () => {
    for (const [name, pipeline] of realDatasets()) {
      const plan = pipeline.analysis.plan;
      expect(plan.months.length, name).toBe(pipeline.analysis.pool.months.length);
      expect(plan.baseCost).toBeCloseTo(plan.months.reduce((total, monthResult) => total + monthResult.baseCost, 0), 9);
      expect(plan.newCost).toBeCloseTo(plan.months.reduce((total, monthResult) => total + monthResult.newCost, 0), 9);
      expect(plan.saving).toBeCloseTo(plan.baseCost - plan.newCost, 9);
      expect(plan.saving).toBeCloseTo(plan.months.reduce((total, monthResult) => total + monthResult.saving, 0), 9);
      expect(plan.perMonth).toBeCloseTo(plan.months.length ? plan.saving / plan.months.length : 0, 9);
      expect(plan.baseWaste).toBeCloseTo(plan.months.reduce((total, monthResult) => total + monthResult.baseWaste, 0), 9);
      expect(plan.newWaste).toBeCloseTo(plan.months.reduce((total, monthResult) => total + monthResult.newWaste, 0), 9);
    }
  });

  it('saving is between zero and the base cost, and no month saves a negative amount', () => {
    for (const [name, pipeline] of realDatasets()) {
      const plan = pipeline.analysis.plan;
      expect(plan.saving, name).toBeGreaterThanOrEqual(-1e-9);
      expect(plan.saving).toBeLessThanOrEqual(plan.baseCost + 1e-9);
      expect(plan.newCost).toBeGreaterThanOrEqual(-1e-9);
      for (const monthResult of plan.months) {
        expect(monthResult.saving).toBeGreaterThanOrEqual(-1e-9);
        expect(monthResult.saving).toBeLessThanOrEqual(monthResult.baseCost + 1e-9);
      }
      finiteDeep([plan.baseCost, plan.newCost, plan.saving, plan.perMonth, plan.baseWaste, plan.newWaste, plan.fraction, plan.seatValue], `${name}.plan`);
    }
  });

  it('the usage reduction is the share of the baseline that the levers save, capped at 100%', () => {
    for (const [name, pipeline] of realDatasets()) {
      const plan = pipeline.analysis.plan;
      expect(plan.fraction, name).toBeCloseTo(Math.min(1, plan.levers.total / plan.levers.baseline), 9);
      expect(plan.fraction).toBeGreaterThanOrEqual(0);
      expect(plan.fraction).toBeLessThanOrEqual(1);
    }
    const all = scenarioOf(datasets.demo, { levers: { ...ONES, capUtil: 0.01 } });
    expect(all.fraction).toBeLessThanOrEqual(1);
    expect(all.fraction).toBeGreaterThan(0.9);
  });

  it('the seat value is the sum of the enabled seat actions', () => {
    for (const [name, pipeline] of realDatasets()) {
      const seats = pipeline.analysis.seats;
      expect(pipeline.analysis.plan.seatValue, name).toBeCloseTo(seats.idleValue + seats.downgradeValue + seats.unusedValue, 9);
    }
    const seats = datasets.demo.analysis.seats;
    expect(seats.idleValue + seats.downgradeValue).toBeGreaterThan(0);
    expect(scenarioOf(datasets.demo, { reclaimIdle: true, downgrade: false, reclaimUnused: false }).seatValue).toBeCloseTo(seats.idleValue, 9);
    expect(scenarioOf(datasets.demo, { reclaimIdle: false, downgrade: true, reclaimUnused: false }).seatValue).toBeCloseTo(seats.downgradeValue, 9);
    expect(scenarioOf(datasets.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false }).seatValue).toBe(0);
  });

  it('demo: the base cost is what the two months cost (the pool or the usage, whichever is larger)', () => {
    const { months } = datasets.demo.analysis.pool;
    const sepGross = datasets.rows.demo.filter((row) => row.date.startsWith('2026-09')).reduce((total, row) => total + numOf(row, 'gross_amount'), 0);
    const octProjected = months[1].projection!.projGross;
    const expected = Math.max(months[0].capacity, sepGross) + Math.max(months[1].capacity, octProjected);
    expect(datasets.demo.analysis.plan.baseCost).toBeCloseTo(expected, 6);
    expect(datasets.demo.analysis.plan.newCost).toBeLessThan(datasets.demo.analysis.plan.baseCost);
    expect(datasets.demo.analysis.plan.saving).toBeGreaterThan(0);
  });

  it('demo: the levers alone (no seats) save less than the levers and the seat actions together', () => {
    const levers = scenarioOf(datasets.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false });
    const seatsOnly = scenarioOf(datasets.demo, { levers: ZERO });
    const both = scenarioOf(datasets.demo);
    expect(levers.saving).toBeGreaterThan(0);
    expect(both.saving).toBeGreaterThanOrEqual(levers.saving - 1e-9);
    expect(both.saving).toBeGreaterThanOrEqual(seatsOnly.saving - 1e-9);
    // usage above the pool in every month, so seat removal alone cannot save anything
    expect(seatsOnly.saving).toBeCloseTo(0, 9);
  });

  it('zero levers and no seat action change nothing', () => {
    for (const [name, pipeline] of realDatasets()) {
      const plan = scenarioOf(pipeline, { levers: ZERO, reclaimIdle: false, downgrade: false, reclaimUnused: false });
      expect(plan.fraction, name).toBe(0);
      expect(plan.seatValue).toBe(0);
      expect(plan.saving).toBeCloseTo(0, 9);
      expect(plan.newCost).toBeCloseTo(plan.baseCost, 9);
    }
  });

  it('stronger levers never save less', () => {
    for (const [name, pipeline] of realDatasets()) {
      const savings = STRENGTHS.map((strength) => scenarioOf(pipeline, { levers: { ...ZERO, modelShift: strength, autoAdoption: strength, cacheDiscipline: strength, contextHygiene: strength, longContext: strength, capRunaway: strength } }).saving);
      for (let i = 1; i < savings.length; i++) expect(savings[i], name).toBeGreaterThanOrEqual(savings[i - 1] - 1e-9);
    }
  });

  it('partial-export fixture (pool bigger than the seats of the file): cutting usage saves no cash, because the pool is assumed to cover it all', () => {
    const months = monthInputs(datasets.B.analysis.pool);
    for (const fraction of [0.1, 0.5, 1]) expect(cashSaving(months, fraction, 0), `f=${fraction}`).toBeCloseTo(0, 9);
    const plan = datasets.B.analysis.plan;
    expect(plan.seatValue).toBe(0);
    expect(plan.saving).toBeCloseTo(0, 9);
    expect(plan.newCost).toBeCloseTo(plan.baseCost, 9);
    expect(plan.levers.total).toBeGreaterThan(0);
  });

  it('both fixtures: usage above the exhausted pool saves cash, but never more than the overage', () => {
    const months = monthInputs(datasets.AB.analysis.pool);
    for (const fraction of [0.1, 0.5, 1]) {
      const saved = cashSaving(months, fraction, 0);
      const overage = months.reduce((total, monthInput) => total + Math.max(0, monthInput.gross - monthInput.capacity), 0);
      expect(saved).toBeGreaterThan(0);
      expect(saved).toBeLessThanOrEqual(overage + 1e-9);
      expect(saved).toBeLessThanOrEqual(months.reduce((total, monthInput) => total + monthInput.gross * fraction, 0) + 1e-9);
    }
  });

  it('pool-used fixture: the plan saves cash only because usage is above the pool', () => {
    const plan = datasets.A.analysis.plan;
    const [monthResult] = plan.months;
    expect(monthResult.gross).toBeGreaterThan(monthResult.capacity);
    expect(plan.saving).toBeGreaterThan(0);
    expect(plan.saving).toBeLessThanOrEqual(monthResult.gross - monthResult.capacity + plan.seatValue + 1e-9);
  });
});

describe('runScenario with seat actions on a hand-built organisation', () => {
  it('has four seats, a pool of $96 and $32.20 of usage: nothing is billed', () => {
    const analysis = datasets.seats.analysis;
    expect(analysis.pool.months.length).toBe(1);
    const poolMonth = analysis.pool.months[0];
    expect(poolMonth.complete).toBe(true);
    expect(poolMonth.projection).toBeNull();
    expect(poolMonth.capacity).toBeCloseTo(96, 9);
    expect(poolMonth.gross).toBeCloseTo(32.2, 9);
    expect(poolMonth.net).toBeCloseTo(0, 9);
    expect(poolMonth.capacityExceeded).toBe(false);
  });

  it('finds one idle seat and one downgrade candidate', () => {
    const { seats } = datasets.seats.analysis;
    expect(seats.idle.map((seat) => seat.name)).toEqual(['ghost']);
    expect(seats.downgrade.map((seat) => seat.name)).toEqual(['ent']);
    expect(seats.unused).toEqual([]);
    expect(seats.idleValue).toBe(19);
    expect(seats.downgradeValue).toBe(20);
    expect(seats.unusedValue).toBe(0);
  });

  it('removing them takes $39 off the pool and saves exactly $39 in cash', () => {
    const plan = datasets.seats.analysis.plan;
    expect(plan.seatValue).toBe(39);
    expect(plan.baseCost).toBeCloseTo(96, 9);
    expect(plan.months[0].newCapacity).toBeCloseTo(57, 9);
    expect(plan.newCost).toBeCloseTo(57, 9);
    expect(plan.saving).toBeCloseTo(39, 9);
    expect(plan.perMonth).toBeCloseTo(39, 9);
    expect(plan.baseWaste).toBeCloseTo(63.8, 9);
    // 5% of the spend is Auto-able: the usage after the levers is far below the smaller pool
    expect(plan.fraction).toBeCloseTo(0.05, 9);
    expect(plan.months[0].newGross).toBeCloseTo(32.2 * 0.95, 9);
    expect(plan.newWaste).toBeCloseTo(57 - 32.2 * 0.95, 9);
  });

  it('each seat action contributes its own value, and the plan follows the switches', () => {
    const pipeline = datasets.seats;
    const run = (input: Partial<ScenarioInput>) => scenarioOf(pipeline, { levers: ZERO, ...input });
    expect(run({ reclaimIdle: true, downgrade: false, reclaimUnused: false }).saving).toBeCloseTo(19, 9);
    expect(run({ reclaimIdle: false, downgrade: true, reclaimUnused: false }).saving).toBeCloseTo(20, 9);
    expect(run({ reclaimIdle: true, downgrade: true, reclaimUnused: false }).saving).toBeCloseTo(39, 9);
    expect(run({ reclaimIdle: false, downgrade: false, reclaimUnused: true }).saving).toBeCloseTo(0, 9);
    expect(run({ reclaimIdle: false, downgrade: false, reclaimUnused: false }).saving).toBe(0);
  });

  it('a roster seat without activity dates adds to pool capacity but is not a reclaim candidate', async () => {
    const pipeline = await analyzeCsv(makeCsv(SEAT_ROWS, { pool: true }), { settings: { roster: [{ user: 'x-never-seen', plan: 'Business' }] } });
    const analysis = pipeline.analysis;
    expect(analysis.pool.months[0].capacity).toBeCloseTo(96 + 19, 9);
    expect(analysis.seats.unused).toEqual([]);
    expect(analysis.seats.unusedValue).toBe(0);
    expect(analysis.plan.seatValue).toBe(20);
    expect(analysis.plan.baseCost).toBeCloseTo(115, 9);
    expect(analysis.plan.saving).toBeCloseTo(20, 9);
  });

  it('seat removal saves at most the slack of the pool: usage that stays above the smaller pool is still paid', async () => {
    // a heavy user fills most of the pool: 5 seats = $115 of credits, $92.20 of usage, so only $22.80 is slack
    const rows: RowSpec[] = [...SEAT_ROWS, { date: '2026-10-12', user: 'heavy', gross: 30 }, { date: '2026-10-20', user: 'heavy', gross: 30 }];
    const pipeline = await analyzeCsv(makeCsv(rows, { pool: true }));
    const analysis = pipeline.analysis;
    expect(analysis.seats.idleValue + analysis.seats.downgradeValue).toBe(39);
    const poolMonth = analysis.pool.months[0];
    expect(poolMonth.capacity).toBeCloseTo(115, 9);
    expect(poolMonth.gross).toBeCloseTo(92.2, 9);
    const plan = scenarioOf(pipeline, { levers: ZERO });
    expect(plan.seatValue).toBe(39);
    expect(plan.months[0].newCapacity).toBeCloseTo(76, 9);
    expect(plan.saving).toBeCloseTo(22.8, 9);
    expect(plan.newCost).toBeCloseTo(92.2, 9);
    expect(plan.saving).toBeLessThan(plan.seatValue);
  });
});
