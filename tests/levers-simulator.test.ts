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

const ctxOf = (P: Pipeline): LeverContext => ({ agg: P.analysis.agg, models: P.models, settings: P.settings });
const allotOf = (P: Pipeline): Float64Array => allotmentArray(P.analysis.users, P.analysis.agg.userAcc.gross.length);
const leversOf = (P: Pipeline, over: Partial<LeverParams> = {}): LeverResult =>
  computeLevers(ctxOf(P), { ...DEFAULT_LEVERS, ...over }, allotOf(P));

const ZERO: LeverParams = { ...DEFAULT_LEVERS, modelShift: 0, autoAdoption: 0, cacheDiscipline: 0, contextHygiene: 0, longContext: 0, capRunaway: 0 };
const ONES: LeverParams = { ...ZERO, modelShift: 1, autoAdoption: 1, cacheDiscipline: 1, contextHygiene: 1, longContext: 1, capRunaway: 1 };
const solo = (id: LeverId, strength: number, over: Partial<LeverParams> = {}): LeverParams => ({ ...ZERO, ...over, [id]: strength });
const STRENGTHS = [0, 0.25, 0.5, 0.75, 1];
const IDS: LeverId[] = ['modelShift', 'autoAdoption', 'cacheDiscipline', 'contextHygiene', 'longContext', 'capRunaway'];

const stepOf = (r: LeverResult, id: LeverId): LeverStep => r.steps.find((s) => s.id === id)!;

// ---------------------------------------------------------------------------------------------
// Independent recomputation of the levers from the raw CSV rows and the public price card
// ---------------------------------------------------------------------------------------------

const cardOf = (name: string): CardEntry | undefined => PRICE_CARD.find((e) => e.name === name);
const tokenCost = (rt: Rates, t: { input: number; cr: number; cw: number; out: number }): number =>
  (t.input * rt.input + t.cr * rt.cachedInput + t.cw * rt.cacheWrite + t.out * rt.output) / 1e6;

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
  for (const r of rows) {
    if (!r.username) continue;
    const key = `${r.username}|${r.date.slice(0, 7)}`;
    perMonth.set(key, Math.max(perMonth.get(key) ?? 0, numOf(r, 'total_monthly_quota')));
  }
  const out = new Map<string, number>();
  for (const [k, q] of perMonth) {
    const user = k.slice(0, k.lastIndexOf('|'));
    out.set(user, (out.get(user) ?? 0) + q * 0.01);
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
  const est = { input: 0, cr: 0, cw: 0 };
  for (const r of rows) {
    const g = numOf(r, 'gross_amount');
    const name = modelOfRow(r);
    const m = byModel.get(name) ?? { name, gross: 0, input: 0, cr: 0, cw: 0, out: 0, list: 0, pricedGross: 0 };
    byModel.set(name, m);
    const t = { input: numOf(r, 'input'), cr: numOf(r, 'cache_read'), cw: numOf(r, 'cache_write'), out: numOf(r, 'output') };
    m.gross += g;
    m.input += t.input;
    m.cr += t.cr;
    m.cw += t.cw;
    m.out += t.out;
    baseline += g;
    if (isAutoRow(r)) autoGross += g;
    if (r.username) {
      userGross.set(r.username, (userGross.get(r.username) ?? 0) + g);
      userQuota.set(r.username, Math.max(userQuota.get(r.username) ?? 0, numOf(r, 'total_monthly_quota')));
      if (isAutoRow(r)) userAuto.set(r.username, (userAuto.get(r.username) ?? 0) + g);
    }
    const card = cardOf(name);
    if (!card) continue;
    const D = tokenCost(card.base, t);
    if (D <= 0) continue;
    const ratio = g / D;
    m.list += D;
    m.pricedGross += g;
    est.input += (t.input * card.base.input * ratio) / 1e6;
    est.cr += (t.cr * card.base.cachedInput * ratio) / 1e6;
    est.cw += (t.cw * card.base.cacheWrite * ratio) / 1e6;
    let premium = 0;
    if (card.long && ratio > 1.02 && t.input + t.cr + t.cw > (card.longThreshold ?? 272_000)) {
      premium = Math.max(0, Math.min(g, tokenCost(card.long, t)) - D);
      longPremium += premium;
    }
    // An Auto row shows its original price only when its tokens price it unambiguously: a standard-tier request that bills within reach of list.
    if (isAutoRow(r) && r.username && premium === 0 && ratio >= 0.5 && ratio <= 1.05) {
      const acc = userMeasured.get(r.username) ?? { billed: 0, list: 0 };
      acc.billed += g;
      acc.list += D;
      userMeasured.set(r.username, acc);
    }
  }

  // Auto rate of a plan (users with the same largest quota): what its measured Auto rows show once they add up to $1, else the Settings rate.
  const plans = new Map<number, { billed: number; list: number }>();
  for (const [user, acc] of userMeasured) {
    const quota = userQuota.get(user) ?? 0;
    const p = plans.get(quota) ?? { billed: 0, list: 0 };
    p.billed += acc.billed;
    p.list += acc.list;
    plans.set(quota, p);
  }
  const planRate = (quota: number): number => {
    const p = plans.get(quota);
    if (p && p.billed >= 1 && p.list > 0) return Math.min(0.9, Math.max(0, 1 - p.billed / p.list));
    return Math.min(0.9, Math.max(0, autoDiscount));
  };
  let autoMissed = 0;
  for (const [user, g] of userGross) autoMissed += Math.max(0, g - (userAuto.get(user) ?? 0)) * planRate(userQuota.get(user) ?? 0);

  let shiftFull = 0;
  for (const m of byModel.values()) {
    const card = cardOf(m.name);
    if (!card || card.category !== 'Powerful' || m.gross <= 0) continue;
    const target = cardOf(params.target === 'same-vendor' ? DEFAULT_TARGETS[card.vendor] : params.target);
    if (!target || target.name === card.name) continue;
    const src = tokenCost(card.base, m);
    const dst = tokenCost(target.base, m);
    if (src <= 0 || dst <= 0) continue;
    const ratio = dst / src;
    if (ratio < 1) shiftFull += m.gross * (1 - ratio);
  }

  let cacheFull = 0;
  for (const m of byModel.values()) {
    const card = cardOf(m.name);
    if (!card || m.list <= 0) continue;
    const perToken = (card.base.cacheWrite - card.base.cachedInput) / 1e6;
    if (perToken > 0) cacheFull += m.cw * perToken * (m.pricedGross / m.list);
  }

  const allot = allotmentsOf(rows);
  let capped = 0;
  for (const [u, g] of userGross) {
    const a = allot.get(u) ?? 0;
    if (a > 0 && g > params.capUtil * a) capped += g - params.capUtil * a;
  }

  const standalone: Record<LeverId, number> = {
    modelShift: shiftFull * params.modelShift,
    autoAdoption: autoMissed * params.autoAdoption,
    cacheDiscipline: cacheFull * params.cacheDiscipline,
    contextHygiene: (est.input + est.cr + est.cw) * params.contextHygiene,
    longContext: longPremium * params.longContext,
    capRunaway: capped * params.capRunaway,
  };
  let remaining = baseline;
  const savings = {} as Record<LeverId, number>;
  for (const id of LEVER_ORDER) {
    const scale = baseline > 0 ? remaining / baseline : 0;
    const s = Math.max(0, standalone[id] * scale);
    savings[id] = s;
    remaining -= s;
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

let D: Data;

beforeAll(async () => {
  const [A, B, AB, demo] = await Promise.all([
    analyzeFixtures([FIXTURE_A]),
    analyzeFixtures([FIXTURE_B]),
    analyzeFixtures([FIXTURE_A, FIXTURE_B]),
    analyzeDemo(),
  ]);
  const leverCsv = makeCsv(LEVER_ROWS, { pool: true });
  const lever = await analyzeCsv(leverCsv);
  const seats = await analyzeCsv(makeCsv(SEAT_ROWS, { pool: true }));
  const a = naiveRows(readFixture(FIXTURE_A));
  const b = naiveRows(readFixture(FIXTURE_B));
  D = { A, B, AB, demo, lever, seats, rows: { A: a, B: b, AB: [...a, ...b], demo: naiveRows(demo.demo.csv), lever: naiveRows(leverCsv) } };
});

const realDatasets = (): [string, Pipeline, NaiveRow[]][] => [
  ['pool-used fixture', D.A, D.rows.A],
  ['partial-export fixture', D.B, D.rows.B],
  ['both fixtures', D.AB, D.rows.AB],
  ['demo', D.demo, D.rows.demo],
];

const finiteDeep = (o: unknown, path = 'value'): void => {
  if (typeof o === 'number') expect(Number.isFinite(o), `${path} is finite`).toBe(true);
  else if (Array.isArray(o)) o.forEach((x, i) => finiteDeep(x, `${path}[${i}]`));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) finiteDeep(v, `${path}.${k}`);
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
    for (const v of VENDORS) expect(cardOf(DEFAULT_TARGETS[v]), `${v} → ${DEFAULT_TARGETS[v]}`).toBeDefined();
  });

  it('lists the Versatile models of the card as explicit targets', () => {
    expect(VERSATILE_TARGETS.length).toBeGreaterThan(3);
    expect(VERSATILE_TARGETS).toEqual(PRICE_CARD.filter((e) => e.category === 'Versatile').map((e) => e.name));
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
    const r = applyLevers(100, { ...none, modelShift: 50, autoAdoption: 50 }, LEVER_META, LEVER_ORDER);
    expect(r.steps.map((s) => s.savings)).toEqual([50, 25, 0, 0, 0, 0]);
    expect(r.total).toBe(75);
    expect(r.steps.map((s) => s.standalone)).toEqual([50, 50, 0, 0, 0, 0]);
  });

  it('a single lever saves exactly its standalone value', () => {
    for (const id of IDS) {
      const r = applyLevers(200, { ...none, [id]: 37.5 }, LEVER_META, LEVER_ORDER);
      expect(r.total).toBe(37.5);
      expect(r.steps.find((s) => s.id === id)!.savings).toBe(37.5);
    }
  });

  it('keeps the order, the labels and the descriptions of the metadata', () => {
    const r = applyLevers(10, none, LEVER_META, LEVER_ORDER);
    expect(r.steps.map((s) => s.id)).toEqual(LEVER_ORDER);
    for (const s of r.steps) {
      expect(s.label).toBe(LEVER_META[s.id].label);
      expect(s.description).toBe(LEVER_META[s.id].description);
    }
    const reversed = applyLevers(100, { ...none, modelShift: 50, autoAdoption: 50 }, LEVER_META, [...LEVER_ORDER].reverse());
    expect(reversed.steps.map((s) => s.id)).toEqual([...LEVER_ORDER].reverse());
    // the first step of the sequence always sees the whole baseline
    expect(reversed.steps.find((s) => s.id === 'autoAdoption')!.savings).toBe(50);
    expect(reversed.steps.find((s) => s.id === 'modelShift')!.savings).toBe(25);
  });

  it('levers that together exceed the baseline never save more than the baseline', () => {
    const r = applyLevers(100, { modelShift: 100, autoAdoption: 100, cacheDiscipline: 100, contextHygiene: 100, longContext: 100, capRunaway: 100 }, LEVER_META, LEVER_ORDER);
    expect(r.total).toBeCloseTo(100, 9);
    expect(r.steps[0].savings).toBe(100);
    for (const s of r.steps.slice(1)) expect(s.savings).toBeCloseTo(0, 9);
  });

  it('negative standalone values are clamped to zero and a zero baseline saves nothing', () => {
    const neg = applyLevers(100, { ...none, modelShift: -30, autoAdoption: 10 }, LEVER_META, LEVER_ORDER);
    expect(neg.steps[0].savings).toBe(0);
    expect(neg.steps[0].standalone).toBe(-30);
    expect(neg.steps[1].savings).toBe(10);
    expect(neg.total).toBe(10);
    const zero = applyLevers(0, { ...none, modelShift: 5, capRunaway: 7 }, LEVER_META, LEVER_ORDER);
    expect(zero.total).toBe(0);
    for (const s of zero.steps) expect(s.savings).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// computeLevers on a dataset that can be derived by hand
// ---------------------------------------------------------------------------------------------

describe('computeLevers on a hand-built dataset', () => {
  // standalone values at the default strengths, derived on paper (see LEVER_ROWS)
  const HAND = { modelShift: 5.595, autoAdoption: 6.494, cacheDiscipline: 1.016, contextHygiene: 2.255, longContext: 0.198, capRunaway: 21.5 };

  it('has the baseline, the Auto share and the long-context premium that the rows imply', () => {
    const a = D.lever.analysis;
    expect(a.agg.totals.gross).toBeCloseTo(131.32, 9);
    expect(a.agg.totals.autoGross).toBeCloseTo(1.44, 9);
    expect(a.agg.totals.longPremium).toBeCloseTo(0.66, 9);
    expect(a.agg.totals.longPremiumRows).toBe(1);
    expect(a.agg.totals.est.input + a.agg.totals.est.cacheRead + a.agg.totals.est.cacheWrite).toBeCloseTo(22.55, 9);
  });

  it('values every lever on its own as derived by hand', () => {
    const r = leversOf(D.lever);
    expect(r.baseline).toBeCloseTo(131.32, 9);
    for (const id of IDS) expect(stepOf(r, id).standalone, id).toBeCloseTo(HAND[id], 9);
  });

  it('combines them sequentially: each step sees what the previous steps left', () => {
    const r = leversOf(D.lever);
    let remaining = 131.32;
    for (const id of LEVER_ORDER) {
      const expected = HAND[id] * (remaining / 131.32);
      expect(stepOf(r, id).savings, id).toBeCloseTo(expected, 9);
      remaining -= expected;
    }
    expect(r.total).toBeCloseTo(131.32 - remaining, 9);
    expect(r.final).toBeCloseTo(remaining, 9);
    const standaloneSum = Object.values(HAND).reduce((a, b) => a + b, 0);
    expect(r.total).toBeLessThan(standaloneSum - 1);
    expect(r.total).toBeGreaterThan(Math.max(...Object.values(HAND)));
  });

  it('a lever used alone saves exactly strength × its full value', () => {
    // Hand-picked usage of every user (129.88) times the Auto rate of their plan, which the Auto row shows: 1 − 1.44 / 1.60 = 10%.
    const full: Record<LeverId, number> = { modelShift: 18.65, autoAdoption: 129.88 * 0.1, cacheDiscipline: 5.08, contextHygiene: 22.55, longContext: 0.66, capRunaway: 43 };
    for (const id of IDS) {
      for (const s of STRENGTHS) {
        const r = leversOf(D.lever, solo(id, s));
        expect(r.total, `${id} @ ${s}`).toBeCloseTo(full[id] * s, 9);
        for (const other of IDS) if (other !== id) expect(stepOf(r, other).savings).toBe(0);
      }
    }
  });

  it('caps runaway users above capUtil × their included credits, and a higher cap saves less', () => {
    const at = (capUtil: number) => leversOf(D.lever, solo('capRunaway', 1, { capUtil })).total;
    expect(at(1)).toBeCloseTo(85.44, 9); // carol 100 − 19, alice 23.44 − 19
    expect(at(3)).toBeCloseTo(43, 9);
    expect(at(5)).toBeCloseTo(5, 9);
    expect(at(6)).toBe(0);
    const caps = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 10];
    const totals = caps.map(at);
    for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeLessThanOrEqual(totals[i - 1] + 1e-9);
  });

  it('right-sizes Powerful models to the cheapest list-price equivalent of the same token mix', () => {
    const { ratio, rows } = modelShiftRatios(ctxOf(D.lever), 'same-vendor');
    expect(rows.map((r) => r.model)).toEqual(['GPT-6 Astra', 'Claude Opus 5.5']);
    expect(rows.map((r) => r.target)).toEqual(['GPT-5.6 Terra', 'Claude Sonnet 5.5']);
    expect(rows[0].gross).toBeCloseTo(22, 9);
    expect(rows[0].ratio).toBeCloseTo(4.6 / 22, 9);
    expect(rows[0].savingsAtFull).toBeCloseTo(17.4, 9);
    expect(rows[1].gross).toBeCloseTo(2.5, 9);
    expect(rows[1].ratio).toBeCloseTo(0.5, 9);
    expect(rows[1].savingsAtFull).toBeCloseTo(1.25, 9);
    // the ratio table is indexed by model id; only Powerful models have one
    expect(ratio[rows[0].modelId]).toBe(rows[0].ratio);
    expect(ratio[rows[1].modelId]).toBe(rows[1].ratio);
    const defined = [...ratio].filter((x) => !Number.isNaN(x));
    expect(defined.length).toBe(2);
  });

  it('honours an explicit target model', () => {
    const toSonnet = modelShiftRatios(ctxOf(D.lever), 'Claude Sonnet 5.5');
    expect(toSonnet.rows.map((r) => r.target)).toEqual(['Claude Sonnet 5.5', 'Claude Sonnet 5.5']);
    expect(toSonnet.rows[0].savingsAtFull).toBeCloseTo(17.8, 9);
    expect(toSonnet.rows[1].savingsAtFull).toBeCloseTo(1.25, 9);
    expect(leversOf(D.lever, solo('modelShift', 1, { target: 'Claude Sonnet 5.5' })).total).toBeCloseTo(19.05, 9);
  });

  it('skips a model that is its own target and lists a dearer target with zero savings', () => {
    const { rows } = modelShiftRatios(ctxOf(D.lever), 'GPT-6 Astra');
    expect(rows.map((r) => r.model)).toEqual(['Claude Opus 5.5']);
    expect(rows[0].ratio).toBeCloseTo(6.75 / 2.5, 9);
    expect(rows[0].savingsAtFull).toBe(0);
    expect(leversOf(D.lever, solo('modelShift', 1, { target: 'GPT-6 Astra' })).total).toBe(0);
  });

  it('an unknown target model offers nothing', () => {
    const { rows, ratio } = modelShiftRatios(ctxOf(D.lever), 'No Such Model 9');
    expect(rows).toEqual([]);
    expect([...ratio].every((x) => Number.isNaN(x))).toBe(true);
    expect(leversOf(D.lever, solo('modelShift', 1, { target: 'No Such Model 9' })).total).toBe(0);
  });

  it('resolves the target like the rest of the app: card, vendor default, then overrides', () => {
    const s = D.lever.settings;
    expect(targetMeta('same-vendor', 'OpenAI', s).name).toBe('GPT-5.6 Terra');
    expect(targetMeta('same-vendor', 'Anthropic', s).name).toBe('Claude Sonnet 5.5');
    expect(targetMeta('Gemini 3.8 Flash', 'OpenAI', s).name).toBe('Gemini 3.8 Flash');
    expect(targetMeta('Not A Model', 'OpenAI', s).priced).toBe(false);
  });

  it('price overrides flow into the right-sizing estimate', async () => {
    const cheaper = { input: 1, cachedInput: 0.1, cacheWrite: 1.25, output: 6 };
    const P = await analyzeCsv(makeCsv(LEVER_ROWS, { pool: true }), { settings: { modelOverrides: { 'GPT-5.6 Terra': { base: cheaper } } } });
    const { rows } = modelShiftRatios(ctxOf(P), 'same-vendor');
    expect(rows[0].model).toBe('GPT-6 Astra');
    expect(rows[0].ratio).toBeCloseTo(2.3 / 22, 9);
    expect(rows[0].savingsAtFull).toBeCloseTo(22 - 2.3, 9);
    // a model re-classified as Versatile is no longer right-sized
    const reclass = await analyzeCsv(makeCsv(LEVER_ROWS, { pool: true }), { settings: { modelOverrides: { 'GPT-6 Astra': { category: 'Versatile' } } } });
    expect(modelShiftRatios(ctxOf(reclass), 'same-vendor').rows.map((r) => r.model)).toEqual(['Claude Opus 5.5']);
  });

  it('estimates cache discipline from cache-write tokens priced above cache reads', () => {
    expect(cacheSavingsStandalone(ctxOf(D.lever), 1)).toBeCloseTo(5.08, 9);
    expect(cacheSavingsStandalone(ctxOf(D.lever), 0.2)).toBeCloseTo(1.016, 9);
    expect(cacheSavingsStandalone(ctxOf(D.lever), 0)).toBe(0);
  });

  it('the analysis levers and the plan levers are the default levers of the same scope', () => {
    const a = D.lever.analysis;
    expect(a.levers).toEqual(leversOf(D.lever));
    expect(a.plan.levers).toEqual(a.levers);
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

  for (const [dsName, getP, getRows] of [
    ['pool-used fixture', () => D.A, () => D.rows.A],
    ['partial-export fixture', () => D.B, () => D.rows.B],
    ['both fixtures', () => D.AB, () => D.rows.AB],
    ['demo', () => D.demo, () => D.rows.demo],
    ['hand-built month', () => D.lever, () => D.rows.lever],
  ] as [string, () => Pipeline, () => NaiveRow[]][]) {
    it.each(PARAM_SETS)(`${dsName}: %s`, (_label, params) => {
      const P = getP();
      const want = leverOracle(getRows(), params, P.settings.autoDiscount);
      const got = leversOf(P, params);
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
    expect(leverOracle(D.rows.B, DEFAULT_LEVERS).shiftFull).toBeGreaterThan(100);
    expect(leverOracle(D.rows.B, DEFAULT_LEVERS).longPremium).toBeGreaterThan(100);
    expect(leverOracle(D.rows.B, DEFAULT_LEVERS).autoGross).toBe(0);
    expect(leverOracle(D.rows.demo, DEFAULT_LEVERS).autoGross).toBeGreaterThan(500);
    expect(leverOracle(D.rows.demo, DEFAULT_LEVERS).shiftFull).toBeGreaterThan(100);
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

  for (const [name, P] of [['pool-used fixture', () => D.A], ['partial-export fixture', () => D.B], ['both fixtures', () => D.AB], ['demo', () => D.demo], ['hand-built month', () => D.lever]] as [string, () => Pipeline][]) {
    describe(name, () => {
      it('every step saves a non-negative amount that never exceeds its standalone value', () => {
        for (const params of PARAMS) {
          const r = leversOf(P(), params);
          expect(r.steps.map((s) => s.id)).toEqual(LEVER_ORDER);
          for (const s of r.steps) {
            expect(s.savings, s.id).toBeGreaterThanOrEqual(0);
            expect(s.savings, s.id).toBeLessThanOrEqual(s.standalone + 1e-9);
            expect(s.standalone, s.id).toBeGreaterThanOrEqual(0);
          }
        }
      });

      it('the steps add up to the total, which never exceeds the baseline, and final = baseline − total', () => {
        for (const params of PARAMS) {
          const r = leversOf(P(), params);
          const sumSteps = r.steps.reduce((a, s) => a + s.savings, 0);
          expect(r.total).toBeCloseTo(sumSteps, 9);
          expect(r.total).toBeLessThanOrEqual(r.baseline + 1e-9);
          expect(r.final).toBeCloseTo(r.baseline - r.total, 9);
          expect(r.final).toBeGreaterThanOrEqual(-1e-9);
          expect(r.baseline).toBeCloseTo(P().analysis.agg.totals.gross, 9);
          finiteDeep(r.steps.map((s) => [s.savings, s.standalone]));
        }
      });

      it('never double counts: total is at most the sum and at least the largest of the standalone values', () => {
        for (const params of PARAMS) {
          const r = leversOf(P(), params);
          const standalone = r.steps.map((s) => s.standalone);
          expect(r.total).toBeLessThanOrEqual(standalone.reduce((a, b) => a + b, 0) + 1e-9);
          expect(r.total).toBeGreaterThanOrEqual(Math.max(...standalone) - 1e-9);
        }
      });

      it('with every lever at zero nothing is saved', () => {
        const r = leversOf(P(), ZERO);
        expect(r.total).toBe(0);
        expect(r.final).toBeCloseTo(r.baseline, 9);
        for (const s of r.steps) {
          expect(s.savings).toBe(0);
          expect(s.standalone).toBe(0);
        }
      });

      it('a lever alone saves linearly in its strength', () => {
        for (const id of IDS) {
          const full = leversOf(P(), solo(id, 1)).total;
          for (const s of STRENGTHS) expect(leversOf(P(), solo(id, s)).total, `${id} @ ${s}`).toBeCloseTo(full * s, 9);
        }
      });

      it('turning up any one lever never lowers the total saving', () => {
        for (const id of IDS) {
          const totals = STRENGTHS.map((s) => leversOf(P(), { [id]: s }).total);
          for (let i = 1; i < totals.length; i++) expect(totals[i], `${id}`).toBeGreaterThanOrEqual(totals[i - 1] - 1e-9);
        }
      });

      it('a higher cap multiple never saves more', () => {
        const totals = [0.5, 1, 2, 3, 5, 8, 20].map((capUtil) => leversOf(P(), solo('capRunaway', 1, { capUtil })).total);
        for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeLessThanOrEqual(totals[i - 1] + 1e-9);
      });

      it('a lever can never save more than the part of the spend it applies to', () => {
        const a = P().analysis;
        const r = leversOf(P(), ONES);
        expect(stepOf(r, 'longContext').standalone).toBeLessThanOrEqual(a.agg.totals.longPremium + 1e-9);
        const topRate = Math.max(P().settings.autoDiscount, ...a.auto.plans.map((plan) => plan.rate));
        expect(stepOf(r, 'autoAdoption').standalone).toBeLessThanOrEqual((a.agg.totals.gross - a.agg.totals.autoGross) * topRate + 1e-9);
        expect(stepOf(r, 'modelShift').standalone).toBeLessThanOrEqual(a.agg.totals.tierGross[0] + 1e-9);
        expect(stepOf(r, 'cacheDiscipline').standalone).toBeLessThanOrEqual(a.agg.totals.pricedGross + 1e-9);
        const input = a.agg.totals.est.input + a.agg.totals.est.cacheRead + a.agg.totals.est.cacheWrite;
        expect(stepOf(r, 'contextHygiene').standalone).toBeLessThanOrEqual(input + 1e-9);
        expect(stepOf(r, 'capRunaway').standalone).toBeLessThanOrEqual(a.agg.totals.attributedGross + 1e-9);
      });
    });
  }

  it('a report with no Auto usage to measure takes the Auto rate from Settings, so a higher rate makes the Auto lever worth proportionally more', () => {
    expect(D.B.analysis.auto.plans).toEqual([]);
    const base = leversOf(D.B, solo('autoAdoption', 1)).total;
    const settings = { ...D.B.settings, autoDiscount: D.B.settings.autoDiscount * 2 };
    const doubled = computeLevers({ ...ctxOf(D.B), settings }, solo('autoAdoption', 1), allotOf(D.B)).total;
    expect(base).toBeGreaterThan(0);
    expect(doubled).toBeCloseTo(base * 2, 9);
  });

  it('a report that shows the Auto discount ignores the Settings rate: the measured rate of each plan is used', () => {
    expect(D.demo.analysis.auto.plans.length).toBeGreaterThan(0);
    for (const plan of D.demo.analysis.auto.plans) expect(plan.source).toBe('measured');
    const base = leversOf(D.demo, solo('autoAdoption', 1)).total;
    const settings = { ...D.demo.settings, autoDiscount: D.demo.settings.autoDiscount * 2 };
    const doubled = computeLevers({ ...ctxOf(D.demo), settings }, solo('autoAdoption', 1), allotOf(D.demo)).total;
    expect(base).toBeGreaterThan(0);
    expect(doubled).toBeCloseTo(base, 9);
  });

  it('an empty scope has nothing to save and produces no NaN', () => {
    const empty = D.demo.run({ ...emptyFilters(), users: ['nobody-here'] });
    expect(empty.agg.totals.rows).toBe(0);
    expect(empty.levers.baseline).toBe(0);
    expect(empty.levers.total).toBe(0);
    expect(empty.levers.final).toBe(0);
    finiteDeep(empty.levers.steps.map((s) => [s.savings, s.standalone]));
    expect(empty.plan.levers.total).toBe(0);
    expect(empty.plan.fraction).toBe(0);
    expect(Number.isFinite(empty.plan.saving)).toBe(true);
    expect(empty.plan.saving).toBeCloseTo(0, 9);
  });

  it('the levers follow the filtered scope (one model → at most that model)', () => {
    const one = D.demo.run({ ...emptyFilters(), models: ['GPT-6 Astra'] });
    expect(one.levers.baseline).toBeCloseTo(one.agg.totals.gross, 9);
    expect(one.levers.baseline).toBeLessThan(D.demo.analysis.levers.baseline);
    expect(one.levers.total).toBeLessThanOrEqual(one.levers.baseline + 1e-9);
    expect(one.agg.totals.longPremium).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Right-sizing on the fixtures and the demo
// ---------------------------------------------------------------------------------------------

describe('model right-sizing on report data', () => {
  it('partial-export fixture: GPT-6 Astra → GPT-5.6 Terra, valued with the token mix of the file', () => {
    const rows = D.rows.B.filter((r) => modelOfRow(r) === 'GPT-6 Astra');
    const tokens = {
      input: rows.reduce((a, r) => a + numOf(r, 'input'), 0),
      cr: rows.reduce((a, r) => a + numOf(r, 'cache_read'), 0),
      cw: rows.reduce((a, r) => a + numOf(r, 'cache_write'), 0),
      out: rows.reduce((a, r) => a + numOf(r, 'output'), 0),
    };
    const gross = rows.reduce((a, r) => a + numOf(r, 'gross_amount'), 0);
    const src = tokenCost(cardOf('GPT-6 Astra')!.base, tokens);
    const dst = tokenCost(cardOf('GPT-5.6 Terra')!.base, tokens);
    const { rows: shift } = modelShiftRatios(ctxOf(D.B), 'same-vendor');
    const astra = shift.find((r) => r.model === 'GPT-6 Astra')!;
    expect(astra).toBeDefined();
    expect(astra.target).toBe('GPT-5.6 Terra');
    expect(astra.gross).toBeCloseTo(gross, 6);
    expect(astra.ratio).toBeCloseTo(dst / src, 9);
    expect(astra.savingsAtFull).toBeCloseTo(gross * (1 - dst / src), 6);
    expect(astra.ratio).toBeLessThan(1);
  });

  it('rows are sorted by the saving at full strength and never negative', () => {
    for (const [name, P] of realDatasets()) {
      const { rows } = modelShiftRatios(ctxOf(P), 'same-vendor');
      for (let i = 1; i < rows.length; i++) expect(rows[i].savingsAtFull, name).toBeLessThanOrEqual(rows[i - 1].savingsAtFull);
      for (const r of rows) {
        expect(r.savingsAtFull).toBeGreaterThanOrEqual(0);
        expect(r.savingsAtFull).toBeLessThanOrEqual(r.gross + 1e-9);
        expect(r.target).not.toBe(r.model);
      }
    }
  });

  it('only Powerful, priced models with spend appear, and the ratio table matches the rows', () => {
    for (const [name, P] of realDatasets()) {
      const { ratio, rows } = modelShiftRatios(ctxOf(P), 'same-vendor');
      const ids = new Set(rows.map((r) => r.modelId));
      for (let m = 0; m < ratio.length; m++) {
        const meta = P.models.meta[m];
        if (ids.has(m)) {
          expect(meta.category, `${name}: ${meta.name}`).toBe('Powerful');
          expect(meta.priced).toBe(true);
          expect(Number.isNaN(ratio[m])).toBe(false);
        } else {
          expect(Number.isNaN(ratio[m]), `${name}: ${meta.name}`).toBe(true);
        }
      }
      expect(P.analysis.levers.shiftRows).toEqual(rows);
    }
  });

  it('pool-used fixture: only Powerful models are listed and they add up to the independent estimate', () => {
    const { rows } = modelShiftRatios(ctxOf(D.A), 'same-vendor');
    for (const r of rows) expect(cardOf(r.model)!.category).toBe('Powerful');
    const want = leverOracle(D.rows.A, DEFAULT_LEVERS).shiftFull;
    expect(rows.reduce((a, r) => a + r.savingsAtFull, 0)).toBeCloseTo(want, 6);
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
        const c = monthCost(cap, gross);
        expect(c).toBeGreaterThanOrEqual(gross);
        expect(c).toBeGreaterThanOrEqual(cap);
        expect(c).toBeGreaterThanOrEqual(prev);
        prev = c;
      }
    }
  });

  it('less usage never costs more', () => {
    for (const cap of [0, 19, 57, 200]) {
      let prev = Infinity;
      for (const gross of [500, 200, 100, 57, 30, 0]) {
        const c = monthCost(cap, gross);
        expect(c).toBeLessThanOrEqual(prev);
        prev = c;
      }
    }
  });
});

describe('evaluateMonths', () => {
  const MONTHS: MonthInput[] = [month(100, 40), month(100, 100), month(100, 160), month(0, 50), month(0, 0), month(250, 0), month(57, 56.99), month(57, 57.01), month(76, 30.5)];
  const FRACTIONS = [0, 0.1, 0.25, 0.5, 0.9, 1];
  const SEATS = [0, 5, 19, 20, 39, 60, 100, 1e6];

  it('changes nothing with no usage reduction and no seat removal', () => {
    for (const r of evaluateMonths(MONTHS, 0, 0)) {
      expect(r.saving).toBe(0);
      expect(r.newCost).toBe(r.baseCost);
      expect(r.newCapacity).toBe(r.capacity);
      expect(r.newGross).toBe(r.gross);
      expect(r.newWaste).toBe(r.baseWaste);
    }
  });

  it('keeps the label, the order and the projected flag of every month', () => {
    const input = [month(10, 5, { label: 'Sep 2026' }), month(20, 30, { label: 'Oct 2026', projected: true }), month(5, 1, { label: 'Nov 2026' })];
    const out = evaluateMonths(input, 0.2, 3);
    expect(out.map((m) => m.label)).toEqual(['Sep 2026', 'Oct 2026', 'Nov 2026']);
    expect(out.map((m) => m.projected)).toEqual([false, true, false]);
    expect(out.map((m) => m.capacity)).toEqual([10, 20, 5]);
    expect(out.map((m) => m.gross)).toEqual([5, 30, 1]);
    expect(evaluateMonths([], 0.5, 10)).toEqual([]);
    expect(cashSaving([], 0.5, 10)).toBe(0);
  });

  it('removes seat value from the pool without going below zero and scales the usage by (1 − fraction)', () => {
    for (const m of MONTHS) {
      for (const f of FRACTIONS) {
        for (const s of SEATS) {
          const r = evaluateMonths([m], f, s)[0];
          expect(r.newCapacity).toBeCloseTo(Math.max(0, m.capacity - s), 9);
          expect(r.newCapacity).toBeGreaterThanOrEqual(0);
          expect(r.newCapacity).toBeLessThanOrEqual(m.capacity);
          expect(r.newGross).toBeCloseTo(m.gross * (1 - f), 9);
          expect(r.baseCost).toBe(monthCost(m.capacity, m.gross));
          expect(r.newCost).toBe(monthCost(r.newCapacity, r.newGross));
          expect(r.saving).toBeCloseTo(r.baseCost - r.newCost, 9);
          expect(r.baseWaste).toBeCloseTo(Math.max(0, m.capacity - m.gross), 9);
          expect(r.newWaste).toBeCloseTo(Math.max(0, r.newCapacity - r.newGross), 9);
        }
      }
    }
  });

  it('never saves a negative amount, never more than the month cost, never more than the larger of the two reductions', () => {
    for (const m of MONTHS) {
      for (const f of FRACTIONS) {
        for (const s of SEATS) {
          const r = evaluateMonths([m], f, s)[0];
          expect(r.saving, `${m.capacity}/${m.gross} f=${f} s=${s}`).toBeGreaterThanOrEqual(-1e-9);
          expect(r.saving).toBeLessThanOrEqual(r.baseCost + 1e-9);
          expect(r.saving).toBeLessThanOrEqual(Math.max(Math.min(s, m.capacity), m.gross * f) + 1e-9);
          expect(r.newCost).toBeGreaterThanOrEqual(-1e-9);
        }
      }
    }
  });

  it('a usage reduction only saves cash down to the pool size: min(reduction, overage)', () => {
    for (const m of MONTHS) {
      for (const f of FRACTIONS) {
        const r = evaluateMonths([m], f, 0)[0];
        const overage = Math.max(0, m.gross - m.capacity);
        expect(r.saving, `${m.capacity}/${m.gross} f=${f}`).toBeCloseTo(Math.min(m.gross * f, overage), 9);
        expect(r.saving).toBeLessThanOrEqual(overage + 1e-9);
        expect(r.saving).toBeLessThanOrEqual(m.gross * f + 1e-9);
      }
    }
  });

  it('removing seats saves nothing when usage already reaches the pool, and never more than the slack otherwise', () => {
    for (const m of MONTHS) {
      for (const s of SEATS) {
        const r = evaluateMonths([m], 0, s)[0];
        const slack = Math.max(0, m.capacity - m.gross);
        expect(r.saving, `${m.capacity}/${m.gross} s=${s}`).toBeCloseTo(Math.min(s, slack), 9);
        if (m.gross >= m.capacity) expect(r.saving).toBeCloseTo(0, 9);
        expect(r.saving).toBeLessThanOrEqual(slack + 1e-9);
      }
    }
  });

  it('removing all the seats of a month saves exactly its unused credits', () => {
    for (const m of MONTHS) {
      const r = evaluateMonths([m], 0, 1e9)[0];
      expect(r.newCapacity).toBe(0);
      expect(r.saving).toBeCloseTo(Math.max(0, m.capacity - m.gross), 9);
    }
  });

  it('cutting usage below the pool wastes more included credits, it does not save cash', () => {
    const r = evaluateMonths([month(100, 40)], 0.5, 0)[0];
    expect(r.saving).toBe(0);
    expect(r.baseWaste).toBe(60);
    expect(r.newWaste).toBe(80);
  });

  it('more usage reduction or more seats removed never saves less', () => {
    for (const m of MONTHS) {
      for (const s of SEATS) {
        let prev = -1;
        for (const f of FRACTIONS) {
          const v = evaluateMonths([m], f, s)[0].saving;
          expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
          prev = v;
        }
      }
      for (const f of FRACTIONS) {
        let prev = -1;
        for (const s of SEATS) {
          const v = evaluateMonths([m], f, s)[0].saving;
          expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
          prev = v;
        }
      }
    }
  });

  it('combining both is never worse than either alone, and never saves more than the larger reduction', () => {
    for (const m of MONTHS) {
      for (const f of FRACTIONS) {
        for (const s of SEATS) {
          const both = evaluateMonths([m], f, s)[0].saving;
          expect(both).toBeGreaterThanOrEqual(evaluateMonths([m], f, 0)[0].saving - 1e-9);
          expect(both).toBeGreaterThanOrEqual(evaluateMonths([m], 0, s)[0].saving - 1e-9);
        }
      }
    }
  });

  it('a usage reduction can open up room for seat removal that neither achieves alone', () => {
    const m = month(100, 130);
    expect(cashSaving([m], 0, 40)).toBeCloseTo(0, 9); // over the pool: no seat can go
    expect(cashSaving([m], 0.5, 0)).toBeCloseTo(30, 9); // only the overage is saved
    expect(cashSaving([m], 0.5, 40)).toBeCloseTo(65, 9); // 65 of usage left, a 60 pool: pay 65 instead of 130
  });

  it('cashSaving is the sum of the monthly savings', () => {
    for (const f of FRACTIONS) {
      for (const s of SEATS) {
        const sum = evaluateMonths(MONTHS, f, s).reduce((a, r) => a + r.saving, 0);
        expect(cashSaving(MONTHS, f, s)).toBeCloseTo(sum, 9);
      }
    }
  });

  it('months are independent of each other', () => {
    const total = cashSaving(MONTHS, 0.3, 19);
    const parts = MONTHS.reduce((a, m) => a + cashSaving([m], 0.3, 19), 0);
    expect(total).toBeCloseTo(parts, 9);
  });
});

describe('seatValueFor adds the seat actions that are switched on', () => {
  const plan = { idleValue: 19, downgradeValue: 20, unusedValue: 39 } as SeatPlan;
  it('sums only the enabled actions', () => {
    const v = (reclaimIdle: boolean, downgrade: boolean, reclaimUnused: boolean) => seatValueFor(plan, { reclaimIdle, downgrade, reclaimUnused });
    expect(v(false, false, false)).toBe(0);
    expect(v(true, false, false)).toBe(19);
    expect(v(false, true, false)).toBe(20);
    expect(v(false, false, true)).toBe(39);
    expect(v(true, true, false)).toBe(39);
    expect(v(true, false, true)).toBe(58);
    expect(v(true, true, true)).toBe(78);
  });
});

describe('allotmentArray', () => {
  it('holds the included credits of every profile at the id of the user, and nothing for the blank user', () => {
    const a = D.demo.analysis;
    const arr = allotmentArray(a.users, a.agg.userAcc.gross.length);
    expect(arr.length).toBe(a.agg.userAcc.gross.length);
    expect(arr[0]).toBe(0);
    for (const p of a.users.profiles) expect(arr[p.id]).toBe(p.allotment);
    const filled = [...arr].filter((x) => x > 0).length;
    expect(filled).toBe(a.users.profiles.filter((p) => p.allotment > 0).length);
  });
});

// ---------------------------------------------------------------------------------------------
// monthInputs on real pools
// ---------------------------------------------------------------------------------------------

describe('monthInputs turns the pool into the months of the cost model', () => {
  it('one input per month, same labels, projected months use the projected gross', () => {
    for (const [name, P] of realDatasets()) {
      const { months } = P.analysis.pool;
      const inputs = monthInputs(P.analysis.pool);
      expect(inputs.length, name).toBe(months.length);
      inputs.forEach((m, i) => {
        expect(m.label).toBe(months[i].label);
        expect(m.projected).toBe(months[i].projection !== null);
        expect(m.gross).toBe(months[i].projection ? months[i].projection!.projGross : months[i].gross);
        expect(m.capacity).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('keeps the known pool capacity when the seats of the file fund all covered usage (pool-used fixture, demo, hand-built)', () => {
    for (const P of [D.A, D.demo, D.seats]) {
      const inputs = monthInputs(P.analysis.pool);
      P.analysis.pool.months.forEach((m, i) => {
        expect(m.capacityExceeded).toBe(false);
        expect(inputs[i].capacity).toBe(m.capacity);
      });
    }
  });

  it('pool-used fixture: October is projected to its end and the pool is the two seats', () => {
    const [m] = D.A.analysis.pool.months;
    expect(m.projection).not.toBeNull();
    const [inp] = monthInputs(D.A.analysis.pool);
    expect(inp.projected).toBe(true);
    expect(inp.capacity).toBeCloseTo(58, 9);
    expect(inp.gross).toBeCloseTo(m.projection!.projGross, 9);
    expect(inp.gross).toBeGreaterThan(m.gross);
  });

  it('demo: September is complete (observed), October is projected', () => {
    const [sep, oct] = monthInputs(D.demo.analysis.pool);
    expect(sep.projected).toBe(false);
    expect(oct.projected).toBe(true);
    expect(sep.gross).toBeCloseTo(D.demo.analysis.pool.months[0].gross, 9);
    expect(oct.gross).toBeGreaterThan(D.demo.analysis.pool.months[1].gross);
  });

  it('seats outside the file: a pool that never ran out is assumed to cover everything projected (partial-export fixture)', () => {
    const m = D.B.analysis.pool.months[0];
    expect(m.capacityExceeded).toBe(true);
    expect(m.exhaustedOn).toBeNull();
    const [inp] = monthInputs(D.B.analysis.pool);
    expect(inp.capacity).toBeCloseTo(Math.max(m.capacity, m.projection ? m.projection.projGross : m.gross), 9);
    expect(inp.capacity).toBeGreaterThan(m.capacity);
    expect(inp.capacity).toBeCloseTo(inp.gross, 9);
  });

  it('seats outside the file: an exhausted pool is at least what it covered (both fixtures)', () => {
    const m = D.AB.analysis.pool.months[0];
    expect(m.capacityExceeded).toBe(true);
    expect(m.exhaustedOn).not.toBeNull();
    const [inp] = monthInputs(D.AB.analysis.pool);
    expect(inp.capacity).toBeCloseTo(Math.max(m.capacity, m.discount), 9);
    expect(inp.capacity).toBeGreaterThan(m.capacity);
  });
});

// ---------------------------------------------------------------------------------------------
// runScenario
// ---------------------------------------------------------------------------------------------

const scenarioOf = (P: Pipeline, input: Partial<ScenarioInput> = {}, a = P.analysis) =>
  runScenario({ agg: a.agg, models: P.models, settings: P.settings, autoRates: a.autoRates }, a.pool, a.users, a.seats, {
    levers: DEFAULT_LEVERS,
    reclaimIdle: true,
    downgrade: true,
    reclaimUnused: true,
    ...input,
  });

describe('runScenario', () => {
  it('is exactly what the analysis reports as its combined plan (demo and fixtures)', () => {
    for (const [name, P] of realDatasets()) expect(scenarioOf(P), name).toEqual(P.analysis.plan);
  });

  it('is exactly the analysis plan when the scope is narrowed: no seat action applies', () => {
    const narrowed = D.demo.run({ ...emptyFilters(), models: ['GPT-6 Astra'] });
    expect(narrowed.narrowed).toBe(true);
    expect(scenarioOf(D.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false }, narrowed)).toEqual(narrowed.plan);
    expect(narrowed.plan.seatValue).toBe(0);
    const segment = D.demo.run({ ...emptyFilters(), tiers: ['runaway'] });
    expect(segment.plan.seatValue).toBe(0);
    expect(scenarioOf(D.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false }, segment)).toEqual(segment.plan);
  });

  it('adds up: months sum to the totals and saving = base − new', () => {
    for (const [name, P] of realDatasets()) {
      const s = P.analysis.plan;
      expect(s.months.length, name).toBe(P.analysis.pool.months.length);
      expect(s.baseCost).toBeCloseTo(s.months.reduce((a, m) => a + m.baseCost, 0), 9);
      expect(s.newCost).toBeCloseTo(s.months.reduce((a, m) => a + m.newCost, 0), 9);
      expect(s.saving).toBeCloseTo(s.baseCost - s.newCost, 9);
      expect(s.saving).toBeCloseTo(s.months.reduce((a, m) => a + m.saving, 0), 9);
      expect(s.perMonth).toBeCloseTo(s.months.length ? s.saving / s.months.length : 0, 9);
      expect(s.baseWaste).toBeCloseTo(s.months.reduce((a, m) => a + m.baseWaste, 0), 9);
      expect(s.newWaste).toBeCloseTo(s.months.reduce((a, m) => a + m.newWaste, 0), 9);
    }
  });

  it('saving is between zero and the base cost, and no month saves a negative amount', () => {
    for (const [name, P] of realDatasets()) {
      const s = P.analysis.plan;
      expect(s.saving, name).toBeGreaterThanOrEqual(-1e-9);
      expect(s.saving).toBeLessThanOrEqual(s.baseCost + 1e-9);
      expect(s.newCost).toBeGreaterThanOrEqual(-1e-9);
      for (const m of s.months) {
        expect(m.saving).toBeGreaterThanOrEqual(-1e-9);
        expect(m.saving).toBeLessThanOrEqual(m.baseCost + 1e-9);
      }
      finiteDeep([s.baseCost, s.newCost, s.saving, s.perMonth, s.baseWaste, s.newWaste, s.fraction, s.seatValue], `${name}.plan`);
    }
  });

  it('the usage reduction is the share of the baseline that the levers save, capped at 100%', () => {
    for (const [name, P] of realDatasets()) {
      const s = P.analysis.plan;
      expect(s.fraction, name).toBeCloseTo(Math.min(1, s.levers.total / s.levers.baseline), 9);
      expect(s.fraction).toBeGreaterThanOrEqual(0);
      expect(s.fraction).toBeLessThanOrEqual(1);
    }
    const all = scenarioOf(D.demo, { levers: { ...ONES, capUtil: 0.01 } });
    expect(all.fraction).toBeLessThanOrEqual(1);
    expect(all.fraction).toBeGreaterThan(0.9);
  });

  it('the seat value is the sum of the enabled seat actions', () => {
    for (const [name, P] of realDatasets()) {
      const seats = P.analysis.seats;
      expect(P.analysis.plan.seatValue, name).toBeCloseTo(seats.idleValue + seats.downgradeValue + seats.unusedValue, 9);
    }
    const seats = D.demo.analysis.seats;
    expect(seats.idleValue + seats.downgradeValue).toBeGreaterThan(0);
    expect(scenarioOf(D.demo, { reclaimIdle: true, downgrade: false, reclaimUnused: false }).seatValue).toBeCloseTo(seats.idleValue, 9);
    expect(scenarioOf(D.demo, { reclaimIdle: false, downgrade: true, reclaimUnused: false }).seatValue).toBeCloseTo(seats.downgradeValue, 9);
    expect(scenarioOf(D.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false }).seatValue).toBe(0);
  });

  it('demo: the base cost is what the two months cost (the pool or the usage, whichever is larger)', () => {
    const { months } = D.demo.analysis.pool;
    const sepGross = D.rows.demo.filter((r) => r.date.startsWith('2026-09')).reduce((a, r) => a + numOf(r, 'gross_amount'), 0);
    const octProjected = months[1].projection!.projGross;
    const expected = Math.max(months[0].capacity, sepGross) + Math.max(months[1].capacity, octProjected);
    expect(D.demo.analysis.plan.baseCost).toBeCloseTo(expected, 6);
    expect(D.demo.analysis.plan.newCost).toBeLessThan(D.demo.analysis.plan.baseCost);
    expect(D.demo.analysis.plan.saving).toBeGreaterThan(0);
  });

  it('demo: the levers alone (no seats) save less than the levers and the seat actions together', () => {
    const levers = scenarioOf(D.demo, { reclaimIdle: false, downgrade: false, reclaimUnused: false });
    const seatsOnly = scenarioOf(D.demo, { levers: ZERO });
    const both = scenarioOf(D.demo);
    expect(levers.saving).toBeGreaterThan(0);
    expect(both.saving).toBeGreaterThanOrEqual(levers.saving - 1e-9);
    expect(both.saving).toBeGreaterThanOrEqual(seatsOnly.saving - 1e-9);
    // usage above the pool in every month, so seat removal alone cannot save anything
    expect(seatsOnly.saving).toBeCloseTo(0, 9);
  });

  it('zero levers and no seat action change nothing', () => {
    for (const [name, P] of realDatasets()) {
      const s = scenarioOf(P, { levers: ZERO, reclaimIdle: false, downgrade: false, reclaimUnused: false });
      expect(s.fraction, name).toBe(0);
      expect(s.seatValue).toBe(0);
      expect(s.saving).toBeCloseTo(0, 9);
      expect(s.newCost).toBeCloseTo(s.baseCost, 9);
    }
  });

  it('stronger levers never save less', () => {
    for (const [name, P] of realDatasets()) {
      const savings = STRENGTHS.map((x) => scenarioOf(P, { levers: { ...ZERO, modelShift: x, autoAdoption: x, cacheDiscipline: x, contextHygiene: x, longContext: x, capRunaway: x } }).saving);
      for (let i = 1; i < savings.length; i++) expect(savings[i], name).toBeGreaterThanOrEqual(savings[i - 1] - 1e-9);
    }
  });

  it('partial-export fixture (pool bigger than the seats of the file): cutting usage saves no cash, because the pool is assumed to cover it all', () => {
    const months = monthInputs(D.B.analysis.pool);
    for (const f of [0.1, 0.5, 1]) expect(cashSaving(months, f, 0), `f=${f}`).toBeCloseTo(0, 9);
    const plan = D.B.analysis.plan;
    expect(plan.seatValue).toBe(0);
    expect(plan.saving).toBeCloseTo(0, 9);
    expect(plan.newCost).toBeCloseTo(plan.baseCost, 9);
    expect(plan.levers.total).toBeGreaterThan(0);
  });

  it('both fixtures: usage above the exhausted pool saves cash, but never more than the overage', () => {
    const months = monthInputs(D.AB.analysis.pool);
    for (const f of [0.1, 0.5, 1]) {
      const saved = cashSaving(months, f, 0);
      const overage = months.reduce((a, m) => a + Math.max(0, m.gross - m.capacity), 0);
      expect(saved).toBeGreaterThan(0);
      expect(saved).toBeLessThanOrEqual(overage + 1e-9);
      expect(saved).toBeLessThanOrEqual(months.reduce((a, m) => a + m.gross * f, 0) + 1e-9);
    }
  });

  it('pool-used fixture: the plan saves cash only because usage is above the pool', () => {
    const plan = D.A.analysis.plan;
    const [m] = plan.months;
    expect(m.gross).toBeGreaterThan(m.capacity);
    expect(plan.saving).toBeGreaterThan(0);
    expect(plan.saving).toBeLessThanOrEqual(m.gross - m.capacity + plan.seatValue + 1e-9);
  });
});

describe('runScenario with seat actions on a hand-built organisation', () => {
  it('has four seats, a pool of $96 and $32.20 of usage: nothing is billed', () => {
    const a = D.seats.analysis;
    expect(a.pool.months.length).toBe(1);
    const m = a.pool.months[0];
    expect(m.complete).toBe(true);
    expect(m.projection).toBeNull();
    expect(m.capacity).toBeCloseTo(96, 9);
    expect(m.gross).toBeCloseTo(32.2, 9);
    expect(m.net).toBeCloseTo(0, 9);
    expect(m.capacityExceeded).toBe(false);
  });

  it('finds one idle seat and one downgrade candidate', () => {
    const { seats } = D.seats.analysis;
    expect(seats.idle.map((s) => s.name)).toEqual(['ghost']);
    expect(seats.downgrade.map((s) => s.name)).toEqual(['ent']);
    expect(seats.unused).toEqual([]);
    expect(seats.idleValue).toBe(19);
    expect(seats.downgradeValue).toBe(20);
    expect(seats.unusedValue).toBe(0);
  });

  it('removing them takes $39 off the pool and saves exactly $39 in cash', () => {
    const plan = D.seats.analysis.plan;
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
    const P = D.seats;
    const run = (input: Partial<ScenarioInput>) => scenarioOf(P, { levers: ZERO, ...input });
    expect(run({ reclaimIdle: true, downgrade: false, reclaimUnused: false }).saving).toBeCloseTo(19, 9);
    expect(run({ reclaimIdle: false, downgrade: true, reclaimUnused: false }).saving).toBeCloseTo(20, 9);
    expect(run({ reclaimIdle: true, downgrade: true, reclaimUnused: false }).saving).toBeCloseTo(39, 9);
    expect(run({ reclaimIdle: false, downgrade: false, reclaimUnused: true }).saving).toBeCloseTo(0, 9);
    expect(run({ reclaimIdle: false, downgrade: false, reclaimUnused: false }).saving).toBe(0);
  });

  it('a roster seat without activity dates adds to pool capacity but is not a reclaim candidate', async () => {
    const P = await analyzeCsv(makeCsv(SEAT_ROWS, { pool: true }), { settings: { roster: [{ user: 'x-never-seen', plan: 'Business' }] } });
    const a = P.analysis;
    expect(a.pool.months[0].capacity).toBeCloseTo(96 + 19, 9);
    expect(a.seats.unused).toEqual([]);
    expect(a.seats.unusedValue).toBe(0);
    expect(a.plan.seatValue).toBe(20);
    expect(a.plan.baseCost).toBeCloseTo(115, 9);
    expect(a.plan.saving).toBeCloseTo(20, 9);
  });

  it('seat removal saves at most the slack of the pool: usage that stays above the smaller pool is still paid', async () => {
    // a heavy user fills most of the pool: 5 seats = $115 of credits, $92.20 of usage, so only $22.80 is slack
    const rows: RowSpec[] = [...SEAT_ROWS, { date: '2026-10-12', user: 'heavy', gross: 30 }, { date: '2026-10-20', user: 'heavy', gross: 30 }];
    const P = await analyzeCsv(makeCsv(rows, { pool: true }));
    const a = P.analysis;
    expect(a.seats.idleValue + a.seats.downgradeValue).toBe(39);
    const m = a.pool.months[0];
    expect(m.capacity).toBeCloseTo(115, 9);
    expect(m.gross).toBeCloseTo(92.2, 9);
    const plan = scenarioOf(P, { levers: ZERO });
    expect(plan.seatValue).toBe(39);
    expect(plan.months[0].newCapacity).toBeCloseTo(76, 9);
    expect(plan.saving).toBeCloseTo(22.8, 9);
    expect(plan.newCost).toBeCloseTo(92.2, 9);
    expect(plan.saving).toBeLessThan(plan.seatValue);
  });
});
