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
const ENTERPRISE_SEAT = { quota: 3900 };

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
  ...autoRows('ent-auto', 10, 1, ENTERPRISE_SEAT),
  ...directRows('ent-direct', 20, ENTERPRISE_SEAT),
];

const csv = (rows: RowSpec[], options: { columns?: readonly string[] } = {}): string => makeCsv(rows, { pool: true, ...options });
const profile = (pipeline: Pipeline, name: string): UserProfile => {
  const found = pipeline.analysis.population.profiles.find((user) => user.name === name);
  if (!found) throw new Error(`no user "${name}"`);
  return found;
};
const sumOf = (pipeline: Pipeline, pick: (user: UserProfile) => number): number => pipeline.analysis.population.profiles.reduce((total, user) => total + pick(user), 0);

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
    const result = autoDiscountOf(9, 10, 9, 0.5);
    expect(result).toMatchObject({ billed: 9, original: 10, discount: 1, estimated: 0, measuredBilled: 9, measuredShare: 1 });
    expect(result.rate).toBeCloseTo(0.1, 12);
  });

  it('grosses unmeasured rows up at the plan rate: original = billed / (1 - rate)', () => {
    const result = autoDiscountOf(9, 0, 0, 0.1);
    expect(result.estimated).toBeCloseTo(1, 12);
    expect(result.discount).toBeCloseTo(1, 12);
    expect(result.original).toBeCloseTo(10, 12);
    expect(result.rate).toBeCloseTo(0.1, 12);
    expect(result.measuredShare).toBe(0);
  });

  it('adds the measured and the estimated part', () => {
    const result = autoDiscountOf(18, 10, 9, 0.1);
    expect(result.discount).toBeCloseTo(1 + 1, 12);
    expect(result.estimated).toBeCloseTo(1, 12);
    expect(result.original).toBeCloseTo(20, 12);
    expect(result.measuredShare).toBeCloseTo(0.5, 12);
  });

  it('never reports a negative discount for rows billed above their list price', () => {
    const result = autoDiscountOf(10, 9, 10, 0.1);
    expect(result.discount).toBe(0);
    expect(result.original).toBe(10);
    expect(result.rate).toBe(0);
  });

  it('keeps measured usage within billed usage and the rate within 0..0.9', () => {
    expect(autoDiscountOf(5, 6, 8, 0).measuredBilled).toBe(5);
    expect(autoDiscountOf(1, 0, 0, 5).estimated).toBeCloseTo(9, 9);
    expect(autoDiscountOf(1, 0, 0, -1).estimated).toBe(0);
  });
});

describe('autoUseOf', () => {
  const thresholds = { autoFirst: 0.5, lowAuto: 0.1 };

  it('splits usage into Auto first, mixed and direct at the thresholds', () => {
    expect(autoUseOf(1, thresholds)).toBe('autoFirst');
    expect(autoUseOf(0.5, thresholds)).toBe('autoFirst');
    expect(autoUseOf(0.4999, thresholds)).toBe('mixed');
    expect(autoUseOf(0.1, thresholds)).toBe('mixed');
    expect(autoUseOf(0.0999, thresholds)).toBe('direct');
    expect(autoUseOf(0, thresholds)).toBe('direct');
  });

  it('is deterministic when the thresholds overlap: Auto first wins', () => {
    expect(autoUseOf(0.3, { autoFirst: 0.2, lowAuto: 0.4 })).toBe('autoFirst');
  });
});

describe('modelAutoDiscount', () => {
  const modelExtra = { autoGross: Float64Array.of(10, 0), autoList: Float64Array.of(10, 0), autoMeasuredGross: Float64Array.of(9, 0) };

  it('reports what was measured and nothing estimated', () => {
    const result = modelAutoDiscount(modelExtra, 0);
    expect(result.billed).toBe(10);
    expect(result.discount).toBeCloseTo(1, 12);
    expect(result.rate).toBeCloseTo(0.1, 12);
    expect(result.measuredShare).toBeCloseTo(0.9, 12);
  });

  it('has no rate for a model without measured Auto rows', () => {
    const result = modelAutoDiscount(modelExtra, 1);
    expect(result.rate).toBeNaN();
    expect(result.discount).toBe(0);
    expect(result.measuredShare).toBe(0);
  });
});

describe('Auto discount per plan', () => {
  let pipeline: Pipeline;
  beforeAll(async () => {
    pipeline = await analyzeCsv(csv(PLANS_ROWS));
  });

  it('measures the rate of each plan from its own Auto rows', () => {
    const plans = pipeline.analysis.auto.plans;
    expect(plans.map((plan) => [plan.label, plan.credits, plan.users, plan.source])).toEqual([
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
    const autoSummary = pipeline.analysis.auto;
    expect(autoSummary.billed).toBeCloseTo(23.5, 9);
    expect(autoSummary.discount).toBeCloseTo(1.5, 9);
    expect(autoSummary.original).toBeCloseTo(25, 9);
    expect(autoSummary.rate).toBeCloseTo(0.06, 9);
    expect(autoSummary.measuredShare).toBeCloseTo(1, 9);
    expect(autoSummary.estimated).toBeCloseTo(0, 9);
    expect(autoSummary.total).toBeCloseTo(79.5, 9);
    expect(autoSummary.direct).toBeCloseTo(56, 9);
    expect(autoSummary.share).toBeCloseTo(23.5 / 79.5, 9);
  });

  it('counts the discount hand-picked usage missed at the rate of the user plan', () => {
    // Business: (30 + 6) x 10%. Enterprise: 20 x 0%.
    expect(pipeline.analysis.auto.missed).toBeCloseTo(3.6, 9);
    expect(profile(pipeline, 'biz-direct').autoMissed).toBeCloseTo(3, 9);
    expect(profile(pipeline, 'biz-mixed').autoMissed).toBeCloseTo(0.6, 9);
    expect(profile(pipeline, 'ent-direct').autoMissed).toBeCloseTo(0, 9);
    expect(profile(pipeline, 'biz-auto').autoMissed).toBe(0);
  });

  it('gives every user the discount of their own Auto usage', () => {
    const businessAuto = profile(pipeline, 'biz-auto');
    expect(businessAuto.auto.billed).toBeCloseTo(9, 9);
    expect(businessAuto.auto.original).toBeCloseTo(10, 9);
    expect(businessAuto.auto.discount).toBeCloseTo(1, 9);
    expect(businessAuto.auto.rate).toBeCloseTo(0.1, 9);
    expect(businessAuto.auto.measuredShare).toBeCloseTo(1, 9);
    expect(businessAuto.directBilled).toBe(0);

    const businessMixed = profile(pipeline, 'biz-mixed');
    expect(businessMixed.auto.billed).toBeCloseTo(4.5, 9);
    expect(businessMixed.auto.discount).toBeCloseTo(0.5, 9);
    expect(businessMixed.directBilled).toBeCloseTo(6, 9);

    const enterpriseAuto = profile(pipeline, 'ent-auto');
    expect(enterpriseAuto.auto.billed).toBeCloseTo(10, 9);
    expect(enterpriseAuto.auto.discount).toBeCloseTo(0, 9);
    expect(enterpriseAuto.auto.original).toBeCloseTo(10, 9);

    const businessDirect = profile(pipeline, 'biz-direct');
    expect(businessDirect.auto).toBe(profile(pipeline, 'ent-direct').auto);
    expect(businessDirect.auto.billed).toBe(0);
    expect(businessDirect.directBilled).toBeCloseTo(30, 9);
  });

  it('classifies users by their share of Auto usage', () => {
    const use = (name: string) => profile(pipeline, name).autoUse;
    expect([use('biz-auto'), use('ent-auto')]).toEqual(['autoFirst', 'autoFirst']);
    expect(use('biz-mixed')).toBe('mixed');
    expect([use('biz-direct'), use('ent-direct')]).toEqual(['direct', 'direct']);
    const autoUseGroups = pipeline.analysis.population.groups.autoUse;
    expect([autoUseGroups.autoFirst.users, autoUseGroups.mixed.users, autoUseGroups.direct.users, autoUseGroups.unknown.users]).toEqual([2, 1, 2, 0]);
  });

  it('moves the thresholds with the settings', () => {
    const strict = pipeline.run(pipeline.filters, { ...pipeline.settings, autoFirst: 0.9, lowAuto: 0.5 });
    const use = (name: string) => strict.population.profiles.find((user) => user.name === name)?.autoUse;
    expect(use('biz-mixed')).toBe('direct');
    expect(use('biz-auto')).toBe('autoFirst');
  });

  it('adds up: the discount of all users is the discount of the scope', () => {
    const autoSummary = pipeline.analysis.auto;
    expect(sumOf(pipeline, (user) => user.auto.billed)).toBeCloseTo(autoSummary.billed, 9);
    expect(sumOf(pipeline, (user) => user.auto.original)).toBeCloseTo(autoSummary.original, 9);
    expect(sumOf(pipeline, (user) => user.auto.discount)).toBeCloseTo(autoSummary.discount, 9);
    expect(sumOf(pipeline, (user) => user.autoMissed)).toBeCloseTo(autoSummary.missed, 9);
  });

  it('looks up a plan rate and falls back to the Settings rate for any other plan', () => {
    const rates = buildAutoRates(pipeline.analysis.agg, 0.2);
    expect(rateForPlan(rates, 1900)).toBeCloseTo(0.1, 9);
    expect(rateForPlan(rates, 3900)).toBeCloseTo(0, 9);
    expect(rateForPlan(rates, 9999)).toBe(0.2);
    expect(rates.assumed).toBe(0.2);
  });

  it('filters users by how they use Auto, and keeps the plan rates of everyone', () => {
    const direct = pipeline.run({ ...pipeline.filters, autoUse: ['direct'] });
    expect(direct.users.profiles.map((user) => user.name).sort()).toEqual(['biz-direct', 'ent-direct']);
    expect(direct.auto.billed).toBe(0);
    // Business hand-picked usage is still priced at the 10% that Business Auto usage shows, though this segment has no Auto usage.
    expect(direct.auto.missed).toBeCloseTo(30 * 0.1 + 20 * 0, 9);
    expect(direct.users.profiles.reduce((total, user) => total + user.autoMissed, 0)).toBeCloseTo(direct.auto.missed, 9);

    const first = pipeline.run({ ...pipeline.filters, autoUse: ['autoFirst'] });
    expect(first.users.profiles.map((user) => user.name).sort()).toEqual(['biz-auto', 'ent-auto']);
    expect(first.auto.billed).toBeCloseTo(19, 9);
    expect(first.auto.discount).toBeCloseTo(1, 9);

    const both = pipeline.run({ ...pipeline.filters, autoUse: ['direct', 'mixed'] });
    expect(both.users.profiles).toHaveLength(3);
  });

  it('feeds the Auto lever with the same estimate', () => {
    const lever = pipeline.analysis.levers.steps.find((step) => step.id === 'autoAdoption');
    expect(lever).toBeDefined();
    // Half of what hand-picked usage would have earned.
    expect(lever!.standalone).toBeCloseTo(3.6 * 0.5, 9);
  });
});

describe('Auto rows that cannot be measured', () => {
  it('are priced at the Settings rate: original = billed / (1 - rate)', async () => {
    const pipeline = await analyzeCsv(csv(bareAutoRows('bare', 9)));
    const autoSummary = pipeline.analysis.auto;
    expect(autoSummary.plans).toHaveLength(1);
    expect(autoSummary.plans[0].source).toBe('assumed');
    expect(autoSummary.plans[0].observed).toBeNaN();
    expect(autoSummary.plans[0].rate).toBeCloseTo(0.1, 12);
    expect(autoSummary.measuredShare).toBe(0);
    expect(autoSummary.estimated).toBeCloseTo(1, 9);
    expect(autoSummary.discount).toBeCloseTo(1, 9);
    expect(autoSummary.original).toBeCloseTo(10, 9);
    expect(autoSummary.rate).toBeCloseTo(0.1, 9);

    const wider = await analyzeCsv(csv(bareAutoRows('bare', 9)), { settings: { autoDiscount: 0.2 } });
    expect(wider.analysis.auto.discount).toBeCloseTo(9 * (0.2 / 0.8), 9);
    expect(wider.analysis.auto.rate).toBeCloseTo(0.2, 9);
  });

  it('are estimated at the rate that the measured rows of the same plan show', async () => {
    const pipeline = await analyzeCsv(csv([...autoRows('measured', 9, 0.9), ...bareAutoRows('bare', 9)]), { settings: { autoDiscount: 0.3 } });
    const plan = pipeline.analysis.auto.plans[0];
    expect(plan.source).toBe('measured');
    expect(plan.billed).toBeCloseTo(18, 9);
    expect(plan.measuredBilled).toBeCloseTo(9, 9);
    expect(plan.rate).toBeCloseTo(0.1, 9);
    // 1 measured + 9 x 0.1 / 0.9 estimated, and the Settings rate (30%) is not used.
    expect(pipeline.analysis.auto.discount).toBeCloseTo(2, 9);
    expect(pipeline.analysis.auto.estimated).toBeCloseTo(1, 9);
    expect(pipeline.analysis.auto.measuredShare).toBeCloseTo(0.5, 9);
  });

  it('are the long-context rows: their tier cannot be told from the file', async () => {
    const pipeline = await analyzeCsv(csv([longRow(DAYS[0], 'long-user', { costCenter: 'eng' })]));
    const plan = pipeline.analysis.auto.plans[0];
    expect(plan.measuredBilled).toBe(0);
    expect(plan.source).toBe('assumed');
    expect(pipeline.analysis.auto.measuredShare).toBe(0);
  });

  it('are the rows billed far from their list price: only 50% to 105% counts as measured', async () => {
    const rows: RowSpec[] = [
      ...autoRows('outlier', 9, 0.9),
      { date: DAYS[0], user: 'outlier', model: `Auto: ${TERRA}`, gross: 2, ...tokensFor(5, 'cached'), costCenter: 'eng' },
      { date: DAYS[1], user: 'outlier', model: `Auto: ${TERRA}`, gross: 6, ...tokensFor(5, 'cached'), costCenter: 'eng' },
    ];
    const pipeline = await analyzeCsv(csv(rows));
    const plan = pipeline.analysis.auto.plans[0];
    expect(plan.billed).toBeCloseTo(17, 9);
    expect(plan.measuredBilled).toBeCloseTo(9, 9);
    expect(plan.measuredList).toBeCloseTo(10, 9);
    expect(plan.rate).toBeCloseTo(0.1, 9);
    // 1 measured + (17 - 9) x 0.1 / 0.9 estimated.
    expect(pipeline.analysis.auto.discount).toBeCloseTo(1 + 8 / 9, 9);
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
    const pipeline = await analyzeCsv(csv(directRows('manual', 20)));
    expect(pipeline.analysis.auto.plans).toEqual([]);
    expect(pipeline.analysis.auto.billed).toBe(0);
    expect(pipeline.analysis.auto.original).toBe(0);
    expect(pipeline.analysis.auto.rate).toBe(0);
    expect(pipeline.analysis.auto.missed).toBeCloseTo(2, 9);
    expect(profile(pipeline, 'manual').autoMissed).toBeCloseTo(2, 9);
  });
});

describe('Auto usage without a user or without model names', () => {
  it('leaves usage with no user out of the discount that is missed', async () => {
    const scan: RowSpec = { date: DAYS[0], gross: 50, model: TERRA, ...tokensFor(50, 'cached'), repo: 'acme/scan' };
    const pipeline = await analyzeCsv(csv([...PLANS_ROWS, scan]));
    expect(pipeline.analysis.auto.total).toBeCloseTo(129.5, 9);
    expect(pipeline.analysis.auto.direct).toBeCloseTo(106, 9);
    expect(pipeline.analysis.auto.missed).toBeCloseTo(3.6, 9);
  });

  it('reports no Auto use and nothing missed when the file has no model column', async () => {
    const noModel = CSV_HEADER.filter((column) => column !== 'model');
    const pipeline = await analyzeCsv(csv(PLANS_ROWS, { columns: noModel }));
    expect(pipeline.analysis.coverage.models).toBe(false);
    expect(pipeline.analysis.auto.billed).toBe(0);
    expect(pipeline.analysis.auto.missed).toBe(0);
    expect(pipeline.analysis.population.profiles.every((user) => user.autoUse === 'unknown' && user.autoMissed === 0)).toBe(true);
    expect(pipeline.analysis.population.groups.autoUse.unknown.users).toBe(5);
    expect(pipeline.analysis.levers.steps.find((step) => step.id === 'autoAdoption')?.standalone).toBe(0);
  });
});

describe('Tokens by type per user', () => {
  // One Terra request: $2.00 input, $1.20 output, $1.00 cache read, $1.00 cache write = $5.20 at list price.
  const TOKENS = { input: 1_000_000, output: 100_000, cacheRead: 5_000_000, cacheWrite: 400_000 };
  let pipeline: Pipeline;
  beforeAll(async () => {
    pipeline = await analyzeCsv(
      csv([
        { date: DAYS[0], user: 'direct-tokens', model: TERRA, gross: 5.2, ...TOKENS, costCenter: 'eng' },
        { date: DAYS[0], user: 'auto-tokens', model: `Auto: ${TERRA}`, gross: 4.68, ...TOKENS, costCenter: 'eng' },
        { date: DAYS[0], user: 'half-tokens', model: TERRA, gross: 5.2, ...TOKENS, costCenter: 'eng' },
        { date: DAYS[1], user: 'half-tokens', model: TERRA, gross: 5.2, costCenter: 'eng' },
      ]),
    );
  });

  it('counts the tokens of each type and their total', () => {
    const user = profile(pipeline, 'direct-tokens');
    expect([user.input, user.output, user.cacheRead, user.cacheWrite]).toEqual([1_000_000, 100_000, 5_000_000, 400_000]);
    expect(user.tokens).toBe(6_500_000);
  });

  it('computes the cache hit rate as cache reads over all prompt tokens', () => {
    expect(profile(pipeline, 'direct-tokens').cacheHit).toBeCloseTo(5 / 6.4, 9);
  });

  it('splits what was billed over the token types by their share of the list price', () => {
    const user = profile(pipeline, 'direct-tokens');
    expect(user.costInput).toBeCloseTo(2, 9);
    expect(user.costOutput).toBeCloseTo(1.2, 9);
    expect(user.costCacheRead).toBeCloseTo(1, 9);
    expect(user.costCacheWrite).toBeCloseTo(1, 9);
    expect(user.tokenCoverage).toBeCloseTo(1, 9);
  });

  it('scales the split to the amount billed when it is below list price', () => {
    const user = profile(pipeline, 'auto-tokens');
    expect(user.costInput).toBeCloseTo(1.8, 9);
    expect(user.costOutput).toBeCloseTo(1.08, 9);
    expect(user.costCacheRead).toBeCloseTo(0.9, 9);
    expect(user.costCacheWrite).toBeCloseTo(0.9, 9);
    expect(user.costInput + user.costOutput + user.costCacheRead + user.costCacheWrite).toBeCloseTo(user.gross, 9);
    expect(user.auto.original).toBeCloseTo(5.2, 9);
    expect(user.auto.discount).toBeCloseTo(0.52, 9);
    expect(user.auto.rate).toBeCloseTo(0.1, 9);
  });

  it('says how much of the usage the split covers when some rows carry no token counts', () => {
    const user = profile(pipeline, 'half-tokens');
    expect(user.gross).toBeCloseTo(10.4, 9);
    expect(user.tokenCoverage).toBeCloseTo(0.5, 9);
    expect(user.costInput + user.costOutput + user.costCacheRead + user.costCacheWrite).toBeCloseTo(5.2, 9);
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
    const pipeline = await load();
    const autoSummary = pipeline.analysis.auto;
    expect(sumOf(pipeline, (user) => user.auto.billed)).toBeCloseTo(autoSummary.billed, 6);
    expect(sumOf(pipeline, (user) => user.auto.original)).toBeCloseTo(autoSummary.original, 6);
    expect(sumOf(pipeline, (user) => user.auto.discount)).toBeCloseTo(autoSummary.discount, 6);
    expect(sumOf(pipeline, (user) => user.autoMissed)).toBeCloseTo(autoSummary.missed, 6);
    expect(autoSummary.original).toBeGreaterThanOrEqual(autoSummary.billed);
    expect(autoSummary.rate).toBeGreaterThanOrEqual(0);
    expect(autoSummary.rate).toBeLessThan(0.9);
  });

  it('pool-used fixture: Enterprise Auto rows are billed at list price, so the report shows no discount for that plan', async () => {
    const pipeline = await analyzeFixtures([FIXTURE_A]);
    const enterprise = pipeline.analysis.auto.plans.find((plan) => plan.credits === 3900);
    expect(enterprise?.source).toBe('measured');
    expect(Math.abs(enterprise?.observed ?? 1)).toBeLessThan(0.001);
    expect(enterprise?.rate).toBeLessThan(0.001);
  });

  it('partial-export fixture: no Auto rows, so there is nothing to measure and the Settings rate prices what is missed', async () => {
    const pipeline = await analyzeFixtures([FIXTURE_B]);
    const autoSummary = pipeline.analysis.auto;
    expect(autoSummary.billed).toBe(0);
    expect(autoSummary.plans).toEqual([]);
    const licensed = sumOf(pipeline, (user) => user.gross);
    expect(autoSummary.missed).toBeCloseTo(licensed * pipeline.settings.autoDiscount, 6);
    expect(autoSummary.missed).toBeGreaterThan(0);
  });

  it('demo: Auto rows are billed 10% under the list price of their tokens, on every plan', async () => {
    const pipeline = await analyzeDemo();
    const autoSummary = pipeline.analysis.auto;
    expect(autoSummary.plans.length).toBeGreaterThan(0);
    expect(autoSummary.plans.every((plan) => plan.source === 'measured')).toBe(true);
    for (const plan of autoSummary.plans) expect(plan.rate).toBeCloseTo(0.1, 1);
    expect(autoSummary.rate).toBeGreaterThan(0.09);
    expect(autoSummary.rate).toBeLessThan(0.11);
    const totals = pipeline.analysis.agg.totals;
    expect(totals.autoMeasuredGross / totals.autoList).toBeGreaterThan(0.89);
    expect(totals.autoMeasuredGross / totals.autoList).toBeLessThan(0.91);
  });
});
