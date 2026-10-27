import { beforeAll, describe, expect, it } from 'vitest';
import {
  MIN_PLAN_MEASURED_USD,
  NO_AUTO_DISCOUNT,
  autoDiscountOf,
  autoUseOf,
  buildAutoRates,
  clampAutoRate,
  modelAutoDiscount,
  rateForPlan,
} from '../src/lib/analytics/autoDiscount';
import type { UserProfile } from '../src/lib/analytics/users';
import { CSV_HEADER, analyzeCsv, analyzeDemo, makeCsv, type Pipeline, type RowSpec } from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures } from './fixtures';
import { SEP_WEEKDAYS, longRow, tokensFor } from './scenarios';

/**
 * The Auto discount. The report holds the amount after the discount, so the original price is worked out from token counts and
 * the price card. Every expectation below is computed by hand from the synthetic rows. The amounts are chosen so that the token
 * counts are whole numbers: the list price of each row is then exact.
 */

const DAYS = SEP_WEEKDAYS.slice(0, 5);
const TERRA = 'GPT-5.6 Terra';
const ENT = { quota: 3900 };

/** `billed` USD of Auto usage on Terra over five days, with tokens whose list price is `billed / factor`. */
function autoRows(user: string, billed: number, factor: number, extra: Partial<RowSpec> = {}): RowSpec[] {
  const each = billed / DAYS.length;
  return DAYS.map((date) => ({ date, user, model: `Auto: ${TERRA}`, gross: each, ...tokensFor(each / factor, 'cached'), costCenter: 'eng', ...extra }));
}

/** `total` USD of hand-picked Terra usage over five days, billed at list price. */
function directRows(user: string, total: number, extra: Partial<RowSpec> = {}): RowSpec[] {
  const each = total / DAYS.length;
  return DAYS.map((date) => ({ date, user, model: TERRA, gross: each, ...tokensFor(each, 'cached'), costCenter: 'eng', ...extra }));
}

/** Auto rows with no token counts: their original price cannot be measured. */
const bareAutoRows = (user: string, billed: number, extra: Partial<RowSpec> = {}): RowSpec[] =>
  DAYS.map((date) => ({ date, user, model: `Auto: ${TERRA}`, gross: billed / DAYS.length, costCenter: 'eng', ...extra }));

/**
 * Business (1900 credits): Auto billed 10% under list price. Enterprise (3900 credits): Auto billed at list price.
 * Business Auto: 9 + 4.5 = 13.5 billed for 15 at list. Enterprise Auto: 10 for 10.
 */
const PLANS_ROWS: RowSpec[] = [
  ...autoRows('biz-auto', 9, 0.9),
  ...autoRows('biz-mixed', 4.5, 0.9),
  ...directRows('biz-mixed', 6),
  ...directRows('biz-direct', 30),
  ...autoRows('ent-auto', 10, 1, ENT),
  ...directRows('ent-direct', 20, ENT),
];

const csv = (rows: RowSpec[], opts: { columns?: readonly string[] } = {}): string => makeCsv(rows, { pool: true, ...opts });
const profile = (p: Pipeline, name: string): UserProfile => {
  const found = p.analysis.population.profiles.find((u) => u.name === name);
  if (!found) throw new Error(`no user "${name}"`);
  return found;
};
const sumOf = (p: Pipeline, pick: (u: UserProfile) => number): number => p.analysis.population.profiles.reduce((a, u) => a + pick(u), 0);

describe('clampAutoRate', () => {
  it('holds a rate to 0..0.9 and turns anything else into 0', () => {
    expect(clampAutoRate(0.1)).toBe(0.1);
    expect(clampAutoRate(-0.2)).toBe(0);
    expect(clampAutoRate(0.95)).toBe(0.9);
    expect(clampAutoRate(Number.NaN)).toBe(0);
    expect(clampAutoRate(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('autoDiscountOf', () => {
  it('is empty without Auto usage', () => {
    expect(autoDiscountOf(0, 0, 0, 0.1)).toBe(NO_AUTO_DISCOUNT);
    expect(autoDiscountOf(-1, 5, 5, 0.1)).toBe(NO_AUTO_DISCOUNT);
  });

  it('compares billed with list price when every row was measured, and ignores the rate', () => {
    const d = autoDiscountOf(9, 10, 9, 0.5);
    expect(d).toMatchObject({ billed: 9, original: 10, discount: 1, estimated: 0, measuredBilled: 9, measuredShare: 1 });
    expect(d.rate).toBeCloseTo(0.1, 12);
  });

  it('grosses unmeasured rows up at the plan rate: original = billed / (1 - rate)', () => {
    const d = autoDiscountOf(9, 0, 0, 0.1);
    expect(d.estimated).toBeCloseTo(1, 12);
    expect(d.discount).toBeCloseTo(1, 12);
    expect(d.original).toBeCloseTo(10, 12);
    expect(d.rate).toBeCloseTo(0.1, 12);
    expect(d.measuredShare).toBe(0);
  });

  it('adds the measured and the estimated part', () => {
    const d = autoDiscountOf(18, 10, 9, 0.1);
    expect(d.discount).toBeCloseTo(1 + 1, 12);
    expect(d.estimated).toBeCloseTo(1, 12);
    expect(d.original).toBeCloseTo(20, 12);
    expect(d.measuredShare).toBeCloseTo(0.5, 12);
  });

  it('never reports a negative discount for rows billed above their list price', () => {
    const d = autoDiscountOf(10, 9, 10, 0.1);
    expect(d.discount).toBe(0);
    expect(d.original).toBe(10);
    expect(d.rate).toBe(0);
  });

  it('keeps measured usage within billed usage and the rate within 0..0.9', () => {
    expect(autoDiscountOf(5, 6, 8, 0).measuredBilled).toBe(5);
    expect(autoDiscountOf(1, 0, 0, 5).estimated).toBeCloseTo(9, 9);
    expect(autoDiscountOf(1, 0, 0, -1).estimated).toBe(0);
  });
});

describe('autoUseOf', () => {
  const s = { autoFirst: 0.5, lowAuto: 0.1 };

  it('splits usage into Auto first, mixed and direct at the thresholds', () => {
    expect(autoUseOf(1, s)).toBe('autoFirst');
    expect(autoUseOf(0.5, s)).toBe('autoFirst');
    expect(autoUseOf(0.4999, s)).toBe('mixed');
    expect(autoUseOf(0.1, s)).toBe('mixed');
    expect(autoUseOf(0.0999, s)).toBe('direct');
    expect(autoUseOf(0, s)).toBe('direct');
  });

  it('is deterministic when the thresholds overlap: Auto first wins', () => {
    expect(autoUseOf(0.3, { autoFirst: 0.2, lowAuto: 0.4 })).toBe('autoFirst');
  });
});

describe('modelAutoDiscount', () => {
  const x = { autoGross: Float64Array.of(10, 0), autoList: Float64Array.of(10, 0), autoMeasuredGross: Float64Array.of(9, 0) };

  it('reports what was measured and nothing estimated', () => {
    const m = modelAutoDiscount(x, 0);
    expect(m.billed).toBe(10);
    expect(m.discount).toBeCloseTo(1, 12);
    expect(m.rate).toBeCloseTo(0.1, 12);
    expect(m.measuredShare).toBeCloseTo(0.9, 12);
  });

  it('has no rate for a model without measured Auto rows', () => {
    const m = modelAutoDiscount(x, 1);
    expect(m.rate).toBeNaN();
    expect(m.discount).toBe(0);
    expect(m.measuredShare).toBe(0);
  });
});

describe('Auto discount per plan', () => {
  let P: Pipeline;
  beforeAll(async () => {
    P = await analyzeCsv(csv(PLANS_ROWS));
  });

  it('measures the rate of each plan from its own Auto rows', () => {
    const plans = P.analysis.auto.plans;
    expect(plans.map((p) => [p.label, p.credits, p.users, p.source])).toEqual([
      ['Business', 1900, 2, 'measured'],
      ['Enterprise', 3900, 1, 'measured'],
    ]);
    expect(plans[0].billed).toBeCloseTo(13.5, 9);
    expect(plans[0].measuredList).toBeCloseTo(15, 9);
    expect(plans[0].observed).toBeCloseTo(0.1, 9);
    expect(plans[0].rate).toBeCloseTo(0.1, 9);
    expect(plans[1].billed).toBeCloseTo(10, 9);
    expect(plans[1].observed).toBeCloseTo(0, 9);
    expect(plans[1].rate).toBeCloseTo(0, 9);
  });

  it('sums the discount at the rate of each plan', () => {
    const a = P.analysis.auto;
    expect(a.billed).toBeCloseTo(23.5, 9);
    expect(a.discount).toBeCloseTo(1.5, 9);
    expect(a.original).toBeCloseTo(25, 9);
    expect(a.rate).toBeCloseTo(0.06, 9);
    expect(a.measuredShare).toBeCloseTo(1, 9);
    expect(a.estimated).toBeCloseTo(0, 9);
    expect(a.total).toBeCloseTo(79.5, 9);
    expect(a.direct).toBeCloseTo(56, 9);
    expect(a.share).toBeCloseTo(23.5 / 79.5, 9);
  });

  it('counts the discount hand-picked usage missed at the rate of the user plan', () => {
    // Business: (30 + 6) x 10%. Enterprise: 20 x 0%.
    expect(P.analysis.auto.missed).toBeCloseTo(3.6, 9);
    expect(profile(P, 'biz-direct').autoMissed).toBeCloseTo(3, 9);
    expect(profile(P, 'biz-mixed').autoMissed).toBeCloseTo(0.6, 9);
    expect(profile(P, 'ent-direct').autoMissed).toBeCloseTo(0, 9);
    expect(profile(P, 'biz-auto').autoMissed).toBe(0);
  });

  it('gives every user the discount of their own Auto usage', () => {
    const a = profile(P, 'biz-auto');
    expect(a.auto.billed).toBeCloseTo(9, 9);
    expect(a.auto.original).toBeCloseTo(10, 9);
    expect(a.auto.discount).toBeCloseTo(1, 9);
    expect(a.auto.rate).toBeCloseTo(0.1, 9);
    expect(a.auto.measuredShare).toBeCloseTo(1, 9);
    expect(a.directBilled).toBe(0);

    const m = profile(P, 'biz-mixed');
    expect(m.auto.billed).toBeCloseTo(4.5, 9);
    expect(m.auto.discount).toBeCloseTo(0.5, 9);
    expect(m.directBilled).toBeCloseTo(6, 9);

    const e = profile(P, 'ent-auto');
    expect(e.auto.billed).toBeCloseTo(10, 9);
    expect(e.auto.discount).toBeCloseTo(0, 9);
    expect(e.auto.original).toBeCloseTo(10, 9);

    const d = profile(P, 'biz-direct');
    expect(d.auto).toBe(profile(P, 'ent-direct').auto);
    expect(d.auto.billed).toBe(0);
    expect(d.directBilled).toBeCloseTo(30, 9);
  });

  it('classifies users by their share of Auto usage', () => {
    const use = (name: string) => profile(P, name).autoUse;
    expect([use('biz-auto'), use('ent-auto')]).toEqual(['autoFirst', 'autoFirst']);
    expect(use('biz-mixed')).toBe('mixed');
    expect([use('biz-direct'), use('ent-direct')]).toEqual(['direct', 'direct']);
    const g = P.analysis.population.groups.autoUse;
    expect([g.autoFirst.users, g.mixed.users, g.direct.users, g.unknown.users]).toEqual([2, 1, 2, 0]);
  });

  it('moves the thresholds with the settings', () => {
    const strict = P.run(P.filters, { ...P.settings, autoFirst: 0.9, lowAuto: 0.5 });
    const use = (name: string) => strict.population.profiles.find((u) => u.name === name)?.autoUse;
    expect(use('biz-mixed')).toBe('direct');
    expect(use('biz-auto')).toBe('autoFirst');
  });

  it('adds up: the discount of all users is the discount of the scope', () => {
    const a = P.analysis.auto;
    expect(sumOf(P, (u) => u.auto.billed)).toBeCloseTo(a.billed, 9);
    expect(sumOf(P, (u) => u.auto.original)).toBeCloseTo(a.original, 9);
    expect(sumOf(P, (u) => u.auto.discount)).toBeCloseTo(a.discount, 9);
    expect(sumOf(P, (u) => u.autoMissed)).toBeCloseTo(a.missed, 9);
  });

  it('looks up a plan rate and falls back to the Settings rate for any other plan', () => {
    const rates = buildAutoRates(P.analysis.agg, 0.2);
    expect(rateForPlan(rates, 1900)).toBeCloseTo(0.1, 9);
    expect(rateForPlan(rates, 3900)).toBeCloseTo(0, 9);
    expect(rateForPlan(rates, 9999)).toBe(0.2);
    expect(rates.assumed).toBe(0.2);
  });

  it('filters users by how they use Auto, and keeps the plan rates of everyone', () => {
    const direct = P.run({ ...P.filters, autoUse: ['direct'] });
    expect(direct.users.profiles.map((u) => u.name).sort()).toEqual(['biz-direct', 'ent-direct']);
    expect(direct.auto.billed).toBe(0);
    // Business hand-picked usage is still priced at the 10% that Business Auto usage shows, though this segment has no Auto usage.
    expect(direct.auto.missed).toBeCloseTo(30 * 0.1 + 20 * 0, 9);
    expect(direct.users.profiles.reduce((a, u) => a + u.autoMissed, 0)).toBeCloseTo(direct.auto.missed, 9);

    const first = P.run({ ...P.filters, autoUse: ['autoFirst'] });
    expect(first.users.profiles.map((u) => u.name).sort()).toEqual(['biz-auto', 'ent-auto']);
    expect(first.auto.billed).toBeCloseTo(19, 9);
    expect(first.auto.discount).toBeCloseTo(1, 9);

    const both = P.run({ ...P.filters, autoUse: ['direct', 'mixed'] });
    expect(both.users.profiles).toHaveLength(3);
  });

  it('feeds the Auto lever with the same estimate', () => {
    const lever = P.analysis.levers.steps.find((s) => s.id === 'autoAdoption');
    expect(lever).toBeDefined();
    // Half of what hand-picked usage would have earned.
    expect(lever!.standalone).toBeCloseTo(3.6 * 0.5, 9);
  });
});

describe('Auto rows that cannot be measured', () => {
  it('are priced at the Settings rate: original = billed / (1 - rate)', async () => {
    const p = await analyzeCsv(csv(bareAutoRows('bare', 9)));
    const a = p.analysis.auto;
    expect(a.plans).toHaveLength(1);
    expect(a.plans[0].source).toBe('assumed');
    expect(a.plans[0].observed).toBeNaN();
    expect(a.plans[0].rate).toBeCloseTo(0.1, 12);
    expect(a.measuredShare).toBe(0);
    expect(a.estimated).toBeCloseTo(1, 9);
    expect(a.discount).toBeCloseTo(1, 9);
    expect(a.original).toBeCloseTo(10, 9);
    expect(a.rate).toBeCloseTo(0.1, 9);

    const wider = await analyzeCsv(csv(bareAutoRows('bare', 9)), { settings: { autoDiscount: 0.2 } });
    expect(wider.analysis.auto.discount).toBeCloseTo(9 * (0.2 / 0.8), 9);
    expect(wider.analysis.auto.rate).toBeCloseTo(0.2, 9);
  });

  it('are estimated at the rate that the measured rows of the same plan show', async () => {
    const p = await analyzeCsv(csv([...autoRows('measured', 9, 0.9), ...bareAutoRows('bare', 9)]), { settings: { autoDiscount: 0.3 } });
    const plan = p.analysis.auto.plans[0];
    expect(plan.source).toBe('measured');
    expect(plan.billed).toBeCloseTo(18, 9);
    expect(plan.measuredBilled).toBeCloseTo(9, 9);
    expect(plan.rate).toBeCloseTo(0.1, 9);
    // 1 measured + 9 x 0.1 / 0.9 estimated, and the Settings rate (30%) is not used.
    expect(p.analysis.auto.discount).toBeCloseTo(2, 9);
    expect(p.analysis.auto.estimated).toBeCloseTo(1, 9);
    expect(p.analysis.auto.measuredShare).toBeCloseTo(0.5, 9);
  });

  it('are the long-context rows: their tier cannot be told from the file', async () => {
    const p = await analyzeCsv(csv([longRow(DAYS[0], 'long-user', { costCenter: 'eng' })]));
    const plan = p.analysis.auto.plans[0];
    expect(plan.measuredBilled).toBe(0);
    expect(plan.source).toBe('assumed');
    expect(p.analysis.auto.measuredShare).toBe(0);
  });

  it('are the rows billed far from their list price: only 50% to 105% counts as measured', async () => {
    const rows: RowSpec[] = [
      ...autoRows('outlier', 9, 0.9),
      { date: DAYS[0], user: 'outlier', model: `Auto: ${TERRA}`, gross: 2, ...tokensFor(5, 'cached'), costCenter: 'eng' },
      { date: DAYS[1], user: 'outlier', model: `Auto: ${TERRA}`, gross: 6, ...tokensFor(5, 'cached'), costCenter: 'eng' },
    ];
    const p = await analyzeCsv(csv(rows));
    const plan = p.analysis.auto.plans[0];
    expect(plan.billed).toBeCloseTo(17, 9);
    expect(plan.measuredBilled).toBeCloseTo(9, 9);
    expect(plan.measuredList).toBeCloseTo(10, 9);
    expect(plan.rate).toBeCloseTo(0.1, 9);
    // 1 measured + (17 - 9) x 0.1 / 0.9 estimated.
    expect(p.analysis.auto.discount).toBeCloseTo(1 + 8 / 9, 9);
  });
});

describe('A plan with little Auto usage', () => {
  it(`uses the Settings rate until $${MIN_PLAN_MEASURED_USD} of its Auto usage was measured`, async () => {
    const small = await analyzeCsv(csv(autoRows('small', 0.45, 0.9)), { settings: { autoDiscount: 0.2 } });
    const plan = small.analysis.auto.plans[0];
    expect(plan.measuredBilled).toBeCloseTo(0.45, 9);
    expect(plan.observed).toBeCloseTo(0.1, 9);
    expect(plan.source).toBe('assumed');
    expect(plan.rate).toBeCloseTo(0.2, 12);
    // The measured rows still count at what was measured.
    expect(small.analysis.auto.discount).toBeCloseTo(0.05, 9);

    const enough = await analyzeCsv(csv(autoRows('enough', 1.35, 0.9)), { settings: { autoDiscount: 0.2 } });
    expect(enough.analysis.auto.plans[0].source).toBe('measured');
    expect(enough.analysis.auto.plans[0].rate).toBeCloseTo(0.1, 9);
  });

  it('uses the Settings rate for a plan with no Auto usage at all', async () => {
    const p = await analyzeCsv(csv(directRows('manual', 20)));
    expect(p.analysis.auto.plans).toEqual([]);
    expect(p.analysis.auto.billed).toBe(0);
    expect(p.analysis.auto.original).toBe(0);
    expect(p.analysis.auto.rate).toBe(0);
    expect(p.analysis.auto.missed).toBeCloseTo(2, 9);
    expect(profile(p, 'manual').autoMissed).toBeCloseTo(2, 9);
  });
});

describe('Auto usage without a user or without model names', () => {
  it('leaves usage with no user out of the discount that is missed', async () => {
    const scan: RowSpec = { date: DAYS[0], gross: 50, model: TERRA, ...tokensFor(50, 'cached'), repo: 'acme/scan' };
    const p = await analyzeCsv(csv([...PLANS_ROWS, scan]));
    expect(p.analysis.auto.total).toBeCloseTo(129.5, 9);
    expect(p.analysis.auto.direct).toBeCloseTo(106, 9);
    expect(p.analysis.auto.missed).toBeCloseTo(3.6, 9);
  });

  it('reports no Auto use and nothing missed when the file has no model column', async () => {
    const noModel = CSV_HEADER.filter((c) => c !== 'model');
    const p = await analyzeCsv(csv(PLANS_ROWS, { columns: noModel }));
    expect(p.analysis.coverage.models).toBe(false);
    expect(p.analysis.auto.billed).toBe(0);
    expect(p.analysis.auto.missed).toBe(0);
    expect(p.analysis.population.profiles.every((u) => u.autoUse === 'unknown' && u.autoMissed === 0)).toBe(true);
    expect(p.analysis.population.groups.autoUse.unknown.users).toBe(5);
    expect(p.analysis.levers.steps.find((s) => s.id === 'autoAdoption')?.standalone).toBe(0);
  });
});

describe('Tokens by type per user', () => {
  // One Terra request: $2.00 input, $1.20 output, $1.00 cache read, $1.00 cache write = $5.20 at list price.
  const TOKENS = { input: 1_000_000, output: 100_000, cacheRead: 5_000_000, cacheWrite: 400_000 };
  let P: Pipeline;
  beforeAll(async () => {
    P = await analyzeCsv(
      csv([
        { date: DAYS[0], user: 'direct-tokens', model: TERRA, gross: 5.2, ...TOKENS, costCenter: 'eng' },
        { date: DAYS[0], user: 'auto-tokens', model: `Auto: ${TERRA}`, gross: 4.68, ...TOKENS, costCenter: 'eng' },
        { date: DAYS[0], user: 'half-tokens', model: TERRA, gross: 5.2, ...TOKENS, costCenter: 'eng' },
        { date: DAYS[1], user: 'half-tokens', model: TERRA, gross: 5.2, costCenter: 'eng' },
      ]),
    );
  });

  it('counts the tokens of each type and their total', () => {
    const u = profile(P, 'direct-tokens');
    expect([u.input, u.output, u.cacheRead, u.cacheWrite]).toEqual([1_000_000, 100_000, 5_000_000, 400_000]);
    expect(u.tokens).toBe(6_500_000);
  });

  it('computes the cache hit rate as cache reads over all prompt tokens', () => {
    expect(profile(P, 'direct-tokens').cacheHit).toBeCloseTo(5 / 6.4, 9);
  });

  it('splits what was billed over the token types by their share of the list price', () => {
    const u = profile(P, 'direct-tokens');
    expect(u.costInput).toBeCloseTo(2, 9);
    expect(u.costOutput).toBeCloseTo(1.2, 9);
    expect(u.costCacheRead).toBeCloseTo(1, 9);
    expect(u.costCacheWrite).toBeCloseTo(1, 9);
    expect(u.tokenCoverage).toBeCloseTo(1, 9);
  });

  it('scales the split to the amount billed when it is below list price', () => {
    const u = profile(P, 'auto-tokens');
    expect(u.costInput).toBeCloseTo(1.8, 9);
    expect(u.costOutput).toBeCloseTo(1.08, 9);
    expect(u.costCacheRead).toBeCloseTo(0.9, 9);
    expect(u.costCacheWrite).toBeCloseTo(0.9, 9);
    expect(u.costInput + u.costOutput + u.costCacheRead + u.costCacheWrite).toBeCloseTo(u.gross, 9);
    expect(u.auto.original).toBeCloseTo(5.2, 9);
    expect(u.auto.discount).toBeCloseTo(0.52, 9);
    expect(u.auto.rate).toBeCloseTo(0.1, 9);
  });

  it('says how much of the usage the split covers when some rows carry no token counts', () => {
    const u = profile(P, 'half-tokens');
    expect(u.gross).toBeCloseTo(10.4, 9);
    expect(u.tokenCoverage).toBeCloseTo(0.5, 9);
    expect(u.costInput + u.costOutput + u.costCacheRead + u.costCacheWrite).toBeCloseTo(5.2, 9);
  });
});

describe('Auto discount on the fixture files and the demo', () => {
  const LOADERS: [string, () => Promise<Pipeline>][] = [
    ['pool-used fixture', () => analyzeFixtures([FIXTURE_A])],
    ['partial-export fixture', () => analyzeFixtures([FIXTURE_B])],
    ['both fixtures', () => analyzeFixtures([FIXTURE_A, FIXTURE_B])],
    ['demo', () => analyzeDemo()],
  ];

  it.each(LOADERS)('%s: the discount of all users is the discount of the scope', async (_name, load) => {
    const p = await load();
    const a = p.analysis.auto;
    expect(sumOf(p, (u) => u.auto.billed)).toBeCloseTo(a.billed, 6);
    expect(sumOf(p, (u) => u.auto.original)).toBeCloseTo(a.original, 6);
    expect(sumOf(p, (u) => u.auto.discount)).toBeCloseTo(a.discount, 6);
    expect(sumOf(p, (u) => u.autoMissed)).toBeCloseTo(a.missed, 6);
    expect(a.original).toBeGreaterThanOrEqual(a.billed);
    expect(a.rate).toBeGreaterThanOrEqual(0);
    expect(a.rate).toBeLessThan(0.9);
  });

  it('pool-used fixture: Enterprise Auto rows are billed at list price, so the report shows no discount for that plan', async () => {
    const p = await analyzeFixtures([FIXTURE_A]);
    const enterprise = p.analysis.auto.plans.find((x) => x.credits === 3900);
    expect(enterprise?.source).toBe('measured');
    expect(Math.abs(enterprise?.observed ?? 1)).toBeLessThan(0.001);
    expect(enterprise?.rate).toBeLessThan(0.001);
  });

  it('partial-export fixture: no Auto rows, so there is nothing to measure and the Settings rate prices what is missed', async () => {
    const p = await analyzeFixtures([FIXTURE_B]);
    const a = p.analysis.auto;
    expect(a.billed).toBe(0);
    expect(a.plans).toEqual([]);
    const licensed = sumOf(p, (u) => u.gross);
    expect(a.missed).toBeCloseTo(licensed * p.settings.autoDiscount, 6);
    expect(a.missed).toBeGreaterThan(0);
  });

  it('demo: Auto rows are billed 10% under the list price of their tokens, on every plan', async () => {
    const p = await analyzeDemo();
    const a = p.analysis.auto;
    expect(a.plans.length).toBeGreaterThan(0);
    expect(a.plans.every((x) => x.source === 'measured')).toBe(true);
    for (const plan of a.plans) expect(plan.rate).toBeCloseTo(0.1, 1);
    expect(a.rate).toBeGreaterThan(0.09);
    expect(a.rate).toBeLessThan(0.11);
    const t = p.analysis.agg.totals;
    expect(t.autoMeasuredGross / t.autoList).toBeGreaterThan(0.89);
    expect(t.autoMeasuredGross / t.autoList).toBeLessThan(0.91);
  });
});
