import { beforeAll, describe, expect, it } from 'vitest';
import { emptyFilters } from '../src/lib/analytics/filters';
import { DEFAULT_LEVERS } from '../src/lib/analytics/levers';
import type { Recommendation } from '../src/lib/analytics/recommendations';
import { runScenario } from '../src/lib/analytics/simulator';
import { leverContext } from '../src/pages/recommendations/scenario';
import { analyzeFixtures, FIXTURE_A, FIXTURE_B } from './fixtures';
import {
  analysisTexts,
  analyzeCsv,
  analyzeDemo,
  analyzeSources,
  BAD_TEXT,
  makeCsv,
  pipelineOf,
  type Pipeline,
  type RowSpec,
} from './helpers';
import { agreementCsv, autoDiscounted, healthyCsv, idleSeatCsv, longContextCsv, lowCacheCsv, septemberDate, SEP_WEEKDAYS, spread, terra } from './scenarios';

/** Wording and number agreement of the recommendation texts, checked on small synthetic datasets with exactly known facts. */

const scenarios: Record<string, Pipeline> = {};

const pooled = (rows: RowSpec[], columns?: readonly string[]): string => makeCsv(rows, { pool: true, columns });
const findRecommendation = (pipeline: Pipeline, id: string): Recommendation => {
  const recommendation = pipeline.analysis.recs.find((candidate) => candidate.id === id);
  if (!recommendation) throw new Error(`no "${id}" recommendation; have ${pipeline.analysis.recs.map((candidate) => candidate.id).join(', ')}`);
  return recommendation;
};
const has = (pipeline: Pipeline, id: string): boolean => pipeline.analysis.recs.some((recommendation) => recommendation.id === id);
const plural = (count: number, one: string): string => `${count} ${count === 1 ? one : `${one}s`}`;
const numbered = (prefix: string, count: number): string => Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`).join(', ');
const note = (pipeline: Pipeline): string[] => findRecommendation(pipeline, 'data-notes').evidence;

/** `manualCsv` with the Auto rows billed at their original price: the report then shows no Auto discount. */
const manualAtListCsv = (manualUserCount: number): string =>
  pooled([
    ...spread('auto-user', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng' }),
    ...Array.from({ length: manualUserCount }, (_, index) => spread(`manual-${index + 1}`, 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' })).flat(),
  ]);

const manualCsv = (manualUserCount: number): string =>
  pooled(
    autoDiscounted([
      ...spread('auto-user', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng' }),
      ...Array.from({ length: manualUserCount }, (_, index) => spread(`manual-${index + 1}`, 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' })).flat(),
    ]),
  );

const rosterBase = (): RowSpec[] => [...spread('u1', 17, [septemberDate(10), septemberDate(20), septemberDate(30)]), ...spread('u2', 17, [septemberDate(10), septemberDate(20), septemberDate(30)])];

/** One regular user plus two repository-level rows (no username) of `each` dollars. */
const unattributedCsv = (each: number, main = 20): string =>
  pooled([
    ...spread('a', main, [septemberDate(5), septemberDate(12), septemberDate(19), septemberDate(26)], { costCenter: 'eng' }),
    { date: septemberDate(6), product: 'code_quality', sku: 'code_quality_ai_credit', model: 'GPT-5.6 Terra', gross: each, repo: 'acme/api', org: 'acme' },
    { date: septemberDate(13), product: 'ghas', sku: 'ghas_ai_credit', model: 'GPT-5.6 Terra', gross: each, repo: 'acme/web', org: 'acme' },
  ]);

beforeAll(async () => {
  scenarios.A = await analyzeFixtures([FIXTURE_A]);
  scenarios.B = await analyzeFixtures([FIXTURE_B]);
  scenarios.AB = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
  scenarios.demo = await analyzeDemo();
  for (const userCount of [1, 2, 3, 13]) scenarios[`agree${userCount}`] = await analyzeCsv(agreementCsv(userCount));
  scenarios.idleSlack = await analyzeCsv(idleSeatCsv(10, 8.5));
  scenarios.idlePartial = await analyzeCsv(idleSeatCsv(26, 26.5));
  scenarios.idleFunding = await analyzeCsv(idleSeatCsv(60, 4.5));
  scenarios.rosterOnly = await analyzeCsv(pooled(rosterBase()), { settings: { roster: [{ user: 'never-seen', plan: 'Business' }] } });
  scenarios.rosterOnly2 = await analyzeCsv(pooled(rosterBase()), {
    settings: { roster: [{ user: 'never-seen', plan: 'Business' }, { user: 'never-2', plan: 'Enterprise' }] },
  });
  scenarios.lc1 = await analyzeCsv(longContextCsv(1));
  scenarios.lc2 = await analyzeCsv(longContextCsv(2));
  scenarios.cache1 = await analyzeCsv(lowCacheCsv(1));
  scenarios.cache2 = await analyzeCsv(lowCacheCsv(2));
  scenarios.manual1 = await analyzeCsv(manualCsv(1));
  scenarios.manual2 = await analyzeCsv(manualCsv(2));
  scenarios.manualAtList = await analyzeCsv(manualAtListCsv(2));
  scenarios.manualOnly = await analyzeCsv(
    pooled(Array.from({ length: 2 }, (_, index) => spread(`manual-${index + 1}`, 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' })).flat()),
  );
  scenarios.twoPlans = await analyzeCsv(
    pooled([
      ...autoDiscounted(spread('biz-auto', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng' }), 0.9),
      ...autoDiscounted(spread('ent-auto', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng', quota: 3900 }), 0.8),
      ...spread('manual-biz', 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' }),
      ...spread('manual-ent', 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', quota: 3900, model: 'GPT-5.6 Terra' }),
    ]),
  );
  scenarios.healthy = await analyzeCsv(healthyCsv());
  const fiveDates = [septemberDate(14), septemberDate(15), septemberDate(16), septemberDate(17), septemberDate(18)];
  scenarios.oneDay = await analyzeCsv(pooled([terra({ date: septemberDate(15), user: 'a', gross: 5 }), terra({ date: septemberDate(15), user: 'b', gross: 3 })]));
  scenarios.fiveDays = await analyzeCsv(pooled(spread('a', 5, fiveDates)));
  scenarios.noTokens = await analyzeCsv(pooled(spread('a', 5, fiveDates), ['date', 'username', 'gross_amount']));
  const mystery: RowSpec = { date: septemberDate(16), user: 'a', gross: 5, model: 'Mystery Model 9', input: 1000, output: 1000 };
  const tokenless: RowSpec = { date: septemberDate(17), user: 'a', gross: 4, model: 'GPT-5.6 Terra' };
  scenarios.unknownModel = await analyzeCsv(pooled([...spread('a', 5, fiveDates), mystery]));
  scenarios.noTokenLines = await analyzeCsv(pooled([...spread('a', 5, fiveDates), tokenless]));
  scenarios.unknownAndNoTokens = await analyzeCsv(pooled([...spread('a', 5, fiveDates), mystery, tokenless]));
  const one = pooled([terra({ date: septemberDate(10), user: 'a', gross: 5 })]);
  const two = pooled([terra({ date: septemberDate(10), user: 'a', gross: 5 }), terra({ date: septemberDate(11), user: 'a', gross: 5 })]);
  scenarios.dup1 = await analyzeSources([{ name: 'a.csv', data: one }, { name: 'b.csv', data: one }]);
  scenarios.dup2 = await analyzeSources([{ name: 'a.csv', data: two }, { name: 'b.csv', data: two }]);
  const corrupt = (badRowCount: number): string =>
    pooled([terra({ date: septemberDate(10), user: 'a', gross: 5 }), ...Array.from({ length: badRowCount }, () => terra({ date: 'not-a-date', user: 'a', gross: 5 }))]);
  scenarios.bad1 = await analyzeCsv(corrupt(1));
  scenarios.bad2 = await analyzeCsv(corrupt(2));
  scenarios.zero = await analyzeCsv(pooled([terra({ date: septemberDate(10), user: 'a', gross: 0 }), terra({ date: septemberDate(11), user: 'a', gross: 0 })]));
  scenarios.unattrLow = await analyzeCsv(unattributedCsv(1.5));
  scenarios.unattrHigh = await analyzeCsv(unattributedCsv(5));
  scenarios.unattrTiny = await analyzeCsv(unattributedCsv(0.4));
  scenarios.unattrOnePct = await analyzeCsv(unattributedCsv(0.5, 200));
});

// Titles that count users ------------------------------------------------------------------------------------------

const TITLES: Record<string, (count: number) => string> = {
  runaway: (count) => `${plural(count, 'user')} used at least 3× their included credits`,
  downgrade: (count) => `${plural(count, 'Enterprise user')} never needed more than the Business allotment`,
  'idle-seats': (count) => `Reclaim ${plural(count, 'idle seat')} to save about $${19 * count}/month`,
  'cost-center-coverage': (count) => `${plural(count, 'user')} ${count === 1 ? 'is' : 'are'} not assigned to a cost center`,
  'multi-org': (count) => `${plural(count, 'user')} ${count === 1 ? 'bills' : 'bill'} to more than one organization`,
  lapsed: (count) => `${plural(count, 'user')} stopped using AI credits`,
  spiky: (count) => `${plural(count, 'user')} ${count === 1 ? 'concentrates' : 'concentrate'} their usage on a single day`,
  'new-users': (count) => `${plural(count, 'new user')} started in the last 14 days`,
  champions: (count) => `${plural(count, 'champion')} ${count === 1 ? 'uses' : 'use'} GitHub Copilot often and heavily`,
};

describe.each([1, 2, 3])('counted recommendations with %i user(s) per behaviour', (userCount) => {
  const pipeline = (): Pipeline => scenarios[`agree${userCount}`];

  for (const [id, title] of Object.entries(TITLES)) {
    it(`${id}: "${title(userCount)}"`, () => {
      const recommendation = findRecommendation(pipeline(), id);
      expect(recommendation.title).toBe(title(userCount));
      expect(recommendation.affectedCount).toBe(userCount);
      expect(recommendation.affected?.length).toBe(userCount);
    });
  }

  it('uses the right verb in every counted title', () => {
    for (const id of Object.keys(TITLES)) {
      const title = findRecommendation(pipeline(), id).title;
      if (userCount === 1) expect(title, id).not.toMatch(/\b1 (?:[A-Za-z-]+ )?(?:users|seats|champions)\b/);
      else expect(title, id).not.toMatch(/\b[2-9] (?:[A-Za-z-]+ )?(?:user|seat|champion)\b(?!-)/);
    }
  });

  it('lists the affected users by name, in the evidence of the behaviours it counts', () => {
    expect(findRecommendation(pipeline(), 'cost-center-coverage').evidence).toEqual([`Without a cost center: ${numbered('nocc', userCount)}.`]);
    expect(findRecommendation(pipeline(), 'multi-org').evidence).toEqual([`Users: ${numbered('multi', userCount)}.`]);
    expect(findRecommendation(pipeline(), 'new-users').evidence).toEqual([`New users: ${numbered('newbie', userCount)}.`]);
    expect(findRecommendation(pipeline(), 'champions').evidence).toEqual([`Champions: ${numbered('champ', userCount)}.`]);
    expect(findRecommendation(pipeline(), 'lapsed').evidence[0]).toMatch(new RegExp(`: ${numbered('ghost', userCount)}\\.$`));
    expect(findRecommendation(pipeline(), 'downgrade').evidence[0]).toBe(`Peak monthly usage stayed at or below 80% of the $19 Business allotment: ${numbered('ent', userCount)}.`);
  });

  it('runaway evidence quotes each user usage against the allotment', () => {
    const recommendation = findRecommendation(pipeline(), 'runaway');
    for (let i = 1; i <= userCount; i++) expect(recommendation.evidence[i - 1]).toBe(`run-${i}: $60 = 316% of allotment; top model GPT-5.6 Terra; Auto 100%.`);
    expect(recommendation.evidence[userCount]).toMatch(new RegExp(`^Usage above 3× allotment: \\$${3 * userCount}\\. The plan assumes 50% of it can be avoided`));
  });

  it('values idle seats at the plan price and downgrades at the price difference', () => {
    const idle = findRecommendation(pipeline(), 'idle-seats');
    expect(idle.impactUsd).toBeCloseTo(19 * userCount, 6);
    expect(idle.cashUsd).toBeCloseTo(19 * userCount, 6);
    expect(idle.summary).toBe(`Seats are worth $${19 * userCount}/month. Removing them shrinks the pool, so only the unused part of the pool ($${19 * userCount}) turns into cash.`);
    const down = findRecommendation(pipeline(), 'downgrade');
    expect(down.evidence[1]).toMatch(new RegExp(`^Cash impact after pool slack: \\$${20 * userCount}/month`));
  });

  it('idle seat evidence counts the users in the report with the right noun', () => {
    expect(findRecommendation(pipeline(), 'idle-seats').evidence).toEqual([
      `${plural(userCount, 'user')} in the report with minimal use and little activity (seat value $${19 * userCount}/month): ${numbered('ghost', userCount)}.`,
    ]);
  });
});

describe('long lists are shortened and capped', () => {
  const pipeline = (): Pipeline => scenarios.agree13;

  it('names five users and counts the rest', () => {
    for (const id of ['downgrade', 'cost-center-coverage', 'multi-org', 'new-users', 'champions']) {
      expect(findRecommendation(pipeline(), id).evidence[0], id).toMatch(/(?:[\w-]+, ){4}[\w-]+ and 8 more\.$/);
    }
    expect(findRecommendation(pipeline(), 'idle-seats').evidence[0]).toMatch(/\(seat value \$247\/month\): (?:[\w-]+, ){4}[\w-]+ and 8 more\.$/);
  });

  it('keeps the full count but returns at most 12 names', () => {
    for (const id of Object.keys(TITLES)) {
      const recommendation = findRecommendation(pipeline(), id);
      expect(recommendation.affectedCount, id).toBe(13);
      expect(recommendation.affected?.length, id).toBe(12);
    }
  });

  it('counts exactly 13 users in the titles', () => {
    for (const [id, title] of Object.entries(TITLES)) expect(findRecommendation(pipeline(), id).title, id).toBe(title(13));
  });

  it('does not use a name twice in one list', () => {
    for (const id of Object.keys(TITLES)) {
      const names = findRecommendation(pipeline(), id).affected?.map((user) => user.name) ?? [];
      expect(new Set(names).size, id).toBe(names.length);
    }
  });
});

// Idle seats: which sentence is chosen ---------------------------------------------------------------------------------

describe('idle seat titles by how much cash can be recovered', () => {
  it('the whole seat value is cash when the pool has slack', () => {
    const recommendation = findRecommendation(scenarios.idleSlack, 'idle-seats');
    expect(recommendation.title).toBe('Reclaim 1 idle seat to save about $19/month');
    expect(recommendation.impactUsd).toBeCloseTo(19, 6);
    expect(recommendation.cashUsd).toBeCloseTo(19, 6);
    expect(recommendation.severity).toBe('low');
  });

  it('only the unused part of the pool is cash when it is almost used', () => {
    const recommendation = findRecommendation(scenarios.idlePartial, 'idle-seats');
    expect(recommendation.title).toBe('1 idle seat, but only $4/month is recoverable');
    expect(recommendation.impactUsd).toBeCloseTo(19, 6);
    const pool = scenarios.idlePartial.analysis.pool.months[0];
    expect(recommendation.cashUsd).toBeCloseTo(pool.capacity - pool.gross, 6);
    expect(pool.net).toBe(0);
  });

  it('nothing is recoverable when the pool is exhausted', () => {
    const recommendation = findRecommendation(scenarios.idleFunding, 'idle-seats');
    expect(recommendation.cashUsd).toBe(0);
    expect(recommendation.impactUsd).toBeCloseTo(19, 6);
    expect(recommendation.title).toBe('1 idle seat currently funds the pool for heavier users');
    expect(scenarios.idleFunding.analysis.pool.months[0].net).toBeGreaterThan(0);
  });

  it('does not recommend reclaiming roster-only seats without activity dates', () => {
    expect(has(scenarios.rosterOnly, 'idle-seats')).toBe(false);
    expect(has(scenarios.rosterOnly2, 'idle-seats')).toBe(false);
  });

  it('does not recommend reclaiming seats without activity dates alongside low-usage users', async () => {
    const pipeline = await analyzeCsv(agreementCsv(1), { settings: { roster: [{ user: 'never-seen', plan: 'Business' }] } });
    expect(has(pipeline, 'idle-seats')).toBe(false);
  });

  it('is absent when every seat is in use', () => {
    expect(has(scenarios.healthy, 'idle-seats')).toBe(false);
    expect(has(scenarios.fiveDays, 'idle-seats')).toBe(false);
  });
});

// Long context -----------------------------------------------------------------------------------------------------

describe('long-context recommendation', () => {
  it.each([1, 2])('counts %i long-context request(s) and prices them from the premium', (requestCount) => {
    const pipeline = scenarios[`lc${requestCount}`];
    const totals = pipeline.analysis.agg.totals;
    expect(totals.longPremiumRows).toBe(requestCount);
    expect(totals.longPremium).toBeCloseTo(3 * requestCount, 6);
    const recommendation = findRecommendation(pipeline, 'long-context');
    expect(recommendation.title).toBe(`Long-context surcharges cost at least $${3 * requestCount}`);
    expect(recommendation.evidence[1]).toBe(`Mostly on GPT-6 Astra ($${3 * requestCount}).`);
    expect(recommendation.evidence[2]).toBe('Most affected users: lc.');
    expect(recommendation.severity).toBe('medium');
    expect(recommendation.jump).toMatchObject({ page: 'efficiency', filters: { traits: ['longContext'] } });
  });

  it('the count sentence agrees with the number for one and two requests', () => {
    expect(findRecommendation(scenarios.lc1, 'long-context').evidence[0]).toBe('1 request was billed at the long-context rate.');
    expect(findRecommendation(scenarios.lc2, 'long-context').evidence[0]).toBe('2 requests were billed at the long-context rate.');
  });

  it('calls the surcharge a share of usage, not the usage that came from those requests', () => {
    for (const requestCount of [1, 2]) {
      const totals = scenarios[`lc${requestCount}`].analysis.agg.totals;
      const share = ((totals.longPremium / totals.gross) * 100).toFixed(1);
      expect(findRecommendation(scenarios[`lc${requestCount}`], 'long-context').summary).toBe(`${share}% of usage is the surcharge on requests whose prompts crossed a model's long-context threshold.`);
    }
  });

  it('is absent when nothing was billed at the long-context rate', () => {
    expect(has(scenarios.healthy, 'long-context')).toBe(false);
    expect(has(scenarios.cache2, 'long-context')).toBe(false);
  });
});

// Cache reuse -----------------------------------------------------------------------------------------------------------

describe('cache recommendation', () => {
  it.each([1, 2])('uses the right form for %i user(s) with a poor cache hit', (userCount) => {
    const pipeline = scenarios[`cache${userCount}`];
    const recommendation = findRecommendation(pipeline, 'cache');
    expect(recommendation.title).toBe(`${plural(userCount, 'user')} ${userCount === 1 ? 'reuses' : 'reuse'} the prompt cache poorly`);
    expect(recommendation.affectedCount).toBe(userCount);
    expect(recommendation.severity).toBe('low');
    expect(recommendation.jump).toMatchObject({ filters: { traits: ['lowCache'] } });
  });

  it.each([1, 2])('quotes the overall hit rate from the token totals (%i)', (userCount) => {
    const pipeline = scenarios[`cache${userCount}`];
    const totals = pipeline.analysis.agg.totals;
    const hit = totals.cacheRead / (totals.input + totals.cacheRead + totals.cacheWrite);
    const recommendation = findRecommendation(pipeline, 'cache');
    expect(recommendation.evidence[0]).toBe(`Overall cache hit rate is ${Math.round(hit * 100)}% of prompt tokens.`);
    expect(recommendation.evidence[1]).toMatch(/^Cache writes cost \d+% of priced usage; cache reads \d+%\.$/);
    expect(recommendation.evidence[recommendation.evidence.length - 1]).toMatch(/^Turning 20% of cache writes into reads would reduce usage by about \$\d+ per month\.$/);
  });

  it('names the users below the cache-hit threshold with the verb that agrees with the count', () => {
    expect(findRecommendation(scenarios.cache1, 'cache').evidence).toContain('1 user is below 50% cache hit: bad-1.');
    expect(findRecommendation(scenarios.cache2, 'cache').evidence).toContain('2 users are below 50% cache hit: bad-1, bad-2.');
  });

  it('is absent when every user reuses the cache', () => {
    expect(has(scenarios.healthy, 'cache')).toBe(false);
    expect(has(scenarios.agree1, 'cache')).toBe(false);
  });
});

// Auto model selection -----------------------------------------------------------------------------------------------

describe('auto model selection recommendation', () => {
  it.each([1, 2])('quotes the manual share (%i manual user[s])', (manualUserCount) => {
    const pipeline = scenarios[`manual${manualUserCount}`];
    const totals = pipeline.analysis.agg.totals;
    const share = totals.autoGross / totals.gross;
    const recommendation = findRecommendation(pipeline, 'auto-adoption');
    expect(recommendation.title).toBe(`Only ${Math.round(share * 100)}% of usage goes through Auto model selection`);
    expect(recommendation.evidence[0]).toBe(`Hand-picked usage: $${Math.round(totals.gross - totals.autoGross)} of $${Math.round(totals.gross)}.`);
    expect(recommendation.affectedCount).toBe(manualUserCount);
  });

  it('uses the noun that agrees with the count of users who rarely use Auto', () => {
    expect(findRecommendation(scenarios.manual1, 'auto-adoption').evidence[1]).toBe('1 user used Auto for less than 10% of their usage: manual-1.');
    expect(findRecommendation(scenarios.manual2, 'auto-adoption').evidence[1]).toBe('2 users used Auto for less than 10% of their usage: manual-1, manual-2.');
  });

  it('is absent when Auto is the default', () => {
    expect(has(scenarios.healthy, 'auto-adoption')).toBe(false);
    expect(has(scenarios.agree3, 'auto-adoption')).toBe(false);
  });

  it('quotes the discount the report shows for Auto usage as measured', () => {
    const pipeline = scenarios.manual2;
    const autoSummary = pipeline.analysis.auto;
    expect(autoSummary.plans).toHaveLength(1);
    expect(autoSummary.plans[0].source).toBe('measured');
    expect(autoSummary.plans[0].rate).toBeCloseTo(0.1, 3);
    expect(autoSummary.measuredShare).toBeCloseTo(1, 6);
    const recommendation = findRecommendation(pipeline, 'auto-adoption');
    expect(recommendation.summary).toBe('Auto usage in this report received a discount of 10% off its original price. 100% of it was priced from token counts.');
    expect(recommendation.caveat).toContain('Plan rates: Business 10% (measured).');
    expect(recommendation.summary).not.toMatch(/documents|assumed|list price/i);
  });

  it('says the rate is assumed when the report has no Auto usage to measure it from', () => {
    const pipeline = scenarios.manualOnly;
    expect(pipeline.analysis.auto.plans).toEqual([]);
    const recommendation = findRecommendation(pipeline, 'auto-adoption');
    expect(recommendation.title).toBe('Only 0% of usage goes through Auto model selection');
    expect(recommendation.summary).toBe('This report has no measured Auto discount, so the estimate uses the assumed rate of 10% from Settings.');
    expect(recommendation.caveat).toContain('No plan has measured Auto usage, so every plan uses 10% (assumed, from Settings).');
    expect(recommendation.caveat).not.toContain('(measured)');
    expect(recommendation.impactUsd).toBeGreaterThan(0);
  });

  it('lists the measured rate of each plan and names no reason for the difference', () => {
    const pipeline = scenarios.twoPlans;
    const autoSummary = pipeline.analysis.auto;
    expect(autoSummary.plans.map((plan) => [plan.label, plan.source])).toEqual([['Business', 'measured'], ['Enterprise', 'measured']]);
    expect(autoSummary.plans[0].rate).toBeCloseTo(0.1, 3);
    expect(autoSummary.plans[1].rate).toBeCloseTo(0.2, 3);
    const recommendation = findRecommendation(pipeline, 'auto-adoption');
    expect(recommendation.summary).toBe(`Auto usage in this report received a discount of ${Math.round(autoSummary.rate * 100)}% off its original price. 100% of it was priced from token counts.`);
    expect(recommendation.caveat).toContain('Plan rates: Business 10% (measured), Enterprise 20% (measured).');
    const text = [recommendation.title, recommendation.summary, ...recommendation.evidence, ...recommendation.actions, recommendation.caveat ?? ''].join(' ');
    expect(text).not.toMatch(/\b(?:because|due to|caused|reason|owing|thanks to|explains?)\b/i);
  });

  it('does not promise savings when Auto usage in the report is billed at its original price', () => {
    const pipeline = scenarios.manualAtList;
    expect(pipeline.analysis.auto.plans[0].rate).toBeCloseTo(0, 3);
    expect(pipeline.analysis.auto.missed).toBe(0);
    expect(has(pipeline, 'auto-adoption')).toBe(false);
  });

  it('prices a filtered group of users at the Auto rates of the whole filtered population', () => {
    const pipeline = pipelineOf(scenarios.manual2.store, { filters: { traits: ['lowAuto'] }, settings: { autoDiscount: 0.3 } });
    const analysis = pipeline.analysis;
    expect(analysis.segmentFiltered).toBe(true);
    expect(analysis.users.profiles.map((user) => user.name).sort()).toEqual(['manual-1', 'manual-2']);
    expect(analysis.autoRates.plans.map((plan) => [plan.label, plan.source])).toEqual([['Business', 'measured']]);
    expect(analysis.autoRates.plans[0].rate).toBeCloseTo(0.1, 3);

    const input = { levers: DEFAULT_LEVERS, reclaimIdle: false, downgrade: false, reclaimUnused: false };
    const context = leverContext(analysis, pipeline.models, pipeline.settings);
    expect(context.autoRates).toBe(analysis.autoRates);
    expect(runScenario(context, analysis.pool, analysis.users, analysis.seats, input)).toEqual(analysis.plan);

    // The group itself has no Auto usage, so measured on its own it would fall back to the assumed 30%.
    const autoSaving = (scenario: typeof analysis.plan): number => scenario.levers.steps.find((step) => step.id === 'autoAdoption')!.savings;
    const alone = runScenario({ agg: analysis.agg, models: pipeline.models, settings: pipeline.settings }, analysis.pool, analysis.users, analysis.seats, input);
    expect(autoSaving(alone)).toBeGreaterThan(autoSaving(analysis.plan) * 2.5);
  });
});

// Unattributed usage ---------------------------------------------------------------------------------------------------

describe('unattributed usage recommendation', () => {
  it('is low severity below 15% of gross', () => {
    const pipeline = scenarios.unattrLow;
    const totals = pipeline.analysis.agg.totals;
    expect(totals.unattributedGross).toBeCloseTo(3, 9);
    expect(totals.unattributedGross / totals.gross).toBeLessThan(0.15);
    const recommendation = findRecommendation(pipeline, 'unattributed');
    expect(recommendation.severity).toBe('low');
    expect(recommendation.title).toBe('$3 is not tied to a user');
    expect(recommendation.evidence).toEqual(['Products: code_quality ($2), ghas ($2).', 'Repositories: acme/api ($2), acme/web ($2).']);
    expect(recommendation.impactUsd).toBe(0);
    expect(recommendation.cashUsd).toBe(0);
  });

  it('is medium severity from 15% of gross', () => {
    const pipeline = scenarios.unattrHigh;
    const totals = pipeline.analysis.agg.totals;
    expect(totals.unattributedGross / totals.gross).toBeGreaterThanOrEqual(0.15);
    const recommendation = findRecommendation(pipeline, 'unattributed');
    expect(recommendation.severity).toBe('medium');
    expect(recommendation.title).toBe('$10 is not tied to a user');
  });

  it('needs at least $1 ...', () => {
    expect(scenarios.unattrTiny.analysis.agg.totals.unattributedGross).toBeCloseTo(0.8, 9);
    expect(has(scenarios.unattrTiny, 'unattributed')).toBe(false);
  });

  it('... and at least 1% of gross', () => {
    const totals = scenarios.unattrOnePct.analysis.agg.totals;
    expect(totals.unattributedGross).toBeCloseTo(1, 9);
    expect(totals.unattributedGross / totals.gross).toBeLessThan(0.01);
    expect(has(scenarios.unattrOnePct, 'unattributed')).toBe(false);
  });

  it('links to the unattributed rows and the link finds exactly those', () => {
    const pipeline = scenarios.unattrHigh;
    const recommendation = findRecommendation(pipeline, 'unattributed');
    expect(recommendation.jump).toEqual({ page: 'spend', label: 'Show unattributed usage', filters: { attribution: 'unattributed' } });
    const scoped = pipeline.run({ ...emptyFilters(), ...recommendation.jump?.filters });
    expect(scoped.agg.totals.rows).toBe(2);
    expect(scoped.agg.totals.gross).toBeCloseTo(10, 9);
  });

  it('is absent when everything has a username', () => {
    expect(has(scenarios.agree2, 'unattributed')).toBe(false);
    expect(has(scenarios.healthy, 'unattributed')).toBe(false);
  });
});

// Healthy ----------------------------------------------------------------------------------------------------------------

describe('healthy pool', () => {
  it('says so when the pool is well used, covered and nothing needs attention', () => {
    const analysis = scenarios.healthy.analysis;
    expect(analysis.headline).toEqual({ status: 'healthy', title: 'Usage looks healthy', detail: 'Pool utilization 89% · Auto 100% of usage · 4 active users' });
    const healthyRecommendation = findRecommendation(scenarios.healthy, 'healthy');
    expect(healthyRecommendation.severity).toBe('positive');
    expect(healthyRecommendation.title).toBe('The pool is well used and fully covered');
    expect(healthyRecommendation.summary).toBe('Utilization is about 89% with no billed overage.');
    expect(healthyRecommendation.evidence).toEqual(['Usage $68 against $76 of included credits.']);
    expect(analysis.recs.every((recommendation) => recommendation.severity === 'positive' || recommendation.severity === 'info' || recommendation.severity === 'low')).toBe(true);
  });

  it('adds the roster caveat while the pool size is only a lower bound, and drops it once the roster is known', async () => {
    expect(scenarios.healthy.analysis.pool.capacityIsLowerBound).toBe(true);
    expect(findRecommendation(scenarios.healthy, 'healthy').caveat).toBe(
      'Only users in this report fund the current estimate. Add a complete license list in Settings for a better estimate; past months may still differ.',
    );
    const roster = [1, 2, 3, 4].map((userNumber) => ({ user: `steady-${userNumber}`, plan: 'Business' as const }));
    const known = await analyzeCsv(healthyCsv(), { settings: { roster } });
    expect(known.analysis.pool.capacityIsLowerBound).toBe(false);
    expect(findRecommendation(known, 'healthy').caveat).toBeUndefined();
  });

  it('is not claimed once anything is billed or the pool is mostly idle', () => {
    expect(has(scenarios.idleFunding, 'healthy')).toBe(false);
    expect(has(scenarios.agree1, 'healthy')).toBe(false);
    expect(has(scenarios.fiveDays, 'healthy')).toBe(true);
  });
});

// Data notes ----------------------------------------------------------------------------------------------------------------

describe('data notes', () => {
  it('is always present when there is usage, informational and has no actions', () => {
    for (const [name, pipeline] of Object.entries(scenarios)) {
      if (name === 'zero') continue;
      const recommendation = findRecommendation(pipeline, 'data-notes');
      expect(recommendation.severity, name).toBe('info');
      expect(recommendation.actions, name).toEqual([]);
      expect(recommendation.evidence.length, name).toBeGreaterThan(0);
      expect(recommendation.evidence, name).toContain('The report covers AI-credit usage only. Code completions and next edit suggestions are not included.');
    }
  });

  it('is skipped entirely when the files hold no usage', () => {
    expect(scenarios.zero.analysis.agg.totals.rows).toBe(2);
    expect(scenarios.zero.analysis.agg.totals.gross).toBe(0);
    expect(scenarios.zero.analysis.recs).toEqual([]);
  });

  it('is sorted last among the non-positive recommendations by severity', () => {
    const recommendations = scenarios.agree2.analysis.recs;
    const last = recommendations.filter((recommendation) => recommendation.severity !== 'positive' && recommendation.severity !== 'info');
    expect(recommendations.indexOf(findRecommendation(scenarios.agree2, 'data-notes'))).toBeGreaterThan(recommendations.indexOf(last[last.length - 1]));
  });

  it('warns about short data with the right noun', () => {
    expect(note(scenarios.oneDay)).toContain('Only 1 day of data: projections and trends are indicative.');
    expect(note(scenarios.fiveDays)).toContain('Only 5 days of data: projections and trends are indicative.');
  });

  it('does not warn about short data for two weeks or more', () => {
    expect(note(scenarios.A).some((line) => line.startsWith('Only '))).toBe(false);
    expect(note(scenarios.B).some((line) => line.startsWith('Only '))).toBe(false);
    expect(note(scenarios.demo).some((line) => line.startsWith('Only '))).toBe(false);
  });

  it('explains that the included credits only count users in the report when there is no roster', () => {
    expect(note(scenarios.agree1)).toContain(
      'The current estimate only includes users in this report. Add a complete license list in Settings to improve included-credit and seat-activity estimates.',
    );
    const withRoster = scenarios.rosterOnly.analysis;
    expect(note(scenarios.rosterOnly).some((line) => line.startsWith('The current estimate only includes users'))).toBe(false);
    expect(withRoster.pool.capacityIsLowerBound).toBe(false);
  });

  it('reports dropped duplicates and failed rows with the exact counts and nouns', () => {
    expect(scenarios.dup1.store.files.reduce((total, file) => total + file.duplicatesDropped, 0)).toBe(1);
    expect(scenarios.dup2.store.files.reduce((total, file) => total + file.duplicatesDropped, 0)).toBe(2);
    expect(note(scenarios.dup1)).toContain('1 duplicate row was dropped while merging files.');
    expect(note(scenarios.dup2)).toContain('2 duplicate rows were dropped while merging files.');
    expect(note(scenarios.bad1)).toContain('1 row or cell failed validation (see Data).');
    expect(note(scenarios.bad2)).toContain('2 rows or cells failed validation (see Data).');
    expect(note(scenarios.bad2).some((line) => /duplicate/.test(line))).toBe(false);
    expect(note(scenarios.agree1).some((line) => /duplicate|failed validation/.test(line))).toBe(false);
  });

  it('mentions models that are not in the price card, with the dollars that sit on them', () => {
    const pipeline = scenarios.unknownModel;
    expect(pipeline.analysis.agg.totals.unpricedGross).toBeCloseTo(5, 9);
    expect(note(pipeline)).toContain('$5 is on models that are not in the built-in price card. What-if savings exclude them; add overrides in Settings.');
    expect(note(pipeline).some((line) => /without token counts/.test(line))).toBe(false);
  });

  it('says usage lines without token counts are not a model problem', () => {
    const pipeline = scenarios.noTokenLines;
    expect(pipeline.analysis.agg.totals.unpricedGross).toBeCloseTo(4, 9);
    expect(note(pipeline)).toContain('$4 is on usage lines without token counts or a model name, so price card estimates and what-if savings exclude it.');
    expect(note(pipeline).some((line) => /not in the built-in price card/.test(line))).toBe(false);
  });

  it('reports both causes separately when both are present', () => {
    const pipeline = scenarios.unknownAndNoTokens;
    expect(note(pipeline).filter((line) => /price card|without token counts/.test(line))).toEqual([
      '$5 is on models that are not in the built-in price card. What-if savings exclude them; add overrides in Settings.',
      '$4 is on usage lines without token counts or a model name, so price card estimates and what-if savings exclude it.',
    ]);
  });

  it('does not blame the price card when the file has no model or token columns', () => {
    expect(scenarios.noTokens.analysis.agg.totals.unpricedGross).toBeGreaterThan(0);
    expect(note(scenarios.noTokens).some((line) => /not in the built-in price card|without token counts/.test(line))).toBe(false);
  });
});

// A file without token or billing columns ------------------------------------------------------------------------------

describe('a file that only has date, username and gross_amount', () => {
  it('does not say what was billed, so the headline says so and billing findings are hidden', () => {
    const analysis = scenarios.noTokens.analysis;
    expect(analysis.headline.status).toBe('watch');
    expect(analysis.headline.title).toBe('This file does not say what was billed');
    const ids = analysis.recs.map((recommendation) => recommendation.id);
    for (const hidden of ['overage', 'pool-exhaustion', 'pool-underuse', 'idle-seats', 'downgrade', 'healthy', 'budgets']) expect(ids, hidden).not.toContain(hidden);
    expect(ids).toContain('data-coverage');
  });

  it('explains every missing column in the coverage recommendation', () => {
    const recommendation = findRecommendation(scenarios.noTokens, 'data-coverage');
    expect(recommendation.severity).toBe('medium');
    expect(recommendation.title).toBe('The file is missing columns the analysis relies on');
    expect(recommendation.evidence).toHaveLength(2);
    expect(recommendation.evidence[0]).toMatch(/^The file does not say what was billed\. /);
    expect(recommendation.evidence[1]).toMatch(/^The file has no seat sizes\. /);
  });

  it('keeps the numbers readable', () => {
    for (const text of analysisTexts(scenarios.noTokens.analysis)) expect(text).not.toMatch(BAD_TEXT);
  });

  it('does not claim an Auto share for a file without a model column (the share is unknowable)', () => {
    expect(scenarios.noTokens.analysis.agg.totals.autoGross).toBe(0);
    expect(has(scenarios.noTokens, 'auto-adoption')).toBe(false);
  });
});

// Typography and leaks ------------------------------------------------------------------------------------------------

const labelled = (): { name: string; kind: string; text: string }[] => {
  const out: { name: string; kind: string; text: string }[] = [];
  for (const [name, pipeline] of Object.entries(scenarios)) {
    const analysis = pipeline.analysis;
    out.push({ name, kind: 'headline title', text: analysis.headline.title }, { name, kind: 'headline detail', text: analysis.headline.detail });
    for (const recommendation of analysis.recs) {
      out.push({ name, kind: `${recommendation.id} title`, text: recommendation.title }, { name, kind: `${recommendation.id} summary`, text: recommendation.summary });
      for (const line of recommendation.evidence) out.push({ name, kind: `${recommendation.id} evidence`, text: line });
      for (const action of recommendation.actions) out.push({ name, kind: `${recommendation.id} action`, text: action });
      if (recommendation.caveat) out.push({ name, kind: `${recommendation.id} caveat`, text: recommendation.caveat });
    }
  }
  return out;
};

describe('typography of every text on every scenario', () => {
  it('has no placeholder or non-finite leaks', () => {
    for (const snippet of labelled()) expect(snippet.text, `${snippet.name}: ${snippet.kind}`).not.toMatch(BAD_TEXT);
  });

  it('has no stray whitespace or spaces before punctuation', () => {
    for (const snippet of labelled()) {
      const where = `${snippet.name}: ${snippet.kind}`;
      expect(snippet.text, where).toBe(snippet.text.trim());
      expect(snippet.text, where).not.toMatch(/ {2}/);
      expect(snippet.text, where).not.toMatch(/ [.,;:!?](?:\s|$)/);
      expect(snippet.text, where).not.toMatch(/\$ |\$-|-\$ /);
    }
  });

  it('writes titles without a final period and sentences with one', () => {
    for (const snippet of labelled()) {
      const where = `${snippet.name}: ${snippet.kind}`;
      if (snippet.kind.endsWith(' title') || snippet.kind === 'headline title') expect(snippet.text, where).not.toMatch(/\.$/);
      if (/ (summary|evidence|action|caveat)$/.test(snippet.kind)) expect(snippet.text, where).toMatch(/[.)]$/);
    }
  });

  it('does not repeat the title in the summary', () => {
    for (const [name, pipeline] of Object.entries(scenarios)) for (const recommendation of pipeline.analysis.recs) expect(recommendation.summary, `${name}: ${recommendation.id}`).not.toBe(recommendation.title);
  });
});

// Number agreement everywhere ----------------------------------------------------------------------------------------------

const ONE = String.raw`(?<![\d.,$])1`;
const MANY = String.raw`(?<![\d.,$])(?:0|[2-9]|[1-9]\d+)`;
const NOUNS = 'user|seat|request|row|day|item|champion|action|model|cell|organization|repository|month';
const PLURAL_AFTER_ONE = new RegExp(`${ONE} (?:[A-Za-z-]+ )?(?:${NOUNS.replace(/\|/g, 's|')}s)(?![\\w-])`);
const SINGULAR_AFTER_MANY = new RegExp(`${MANY} (?:[A-Za-z-]+ )?(?:${NOUNS})(?![\\w-])`);
const VERB_AFTER_ONE = new RegExp(`${ONE} (?:[A-Za-z-]+ )?(?:users?|seats?|requests?|champions?|rows?) (?:currently |also |often )?(?:are|were|use|reuse|bill|concentrate|have|fund|stop|start)(?![\\w-])`);
const VERB_AFTER_MANY = new RegExp(`${MANY} (?:[A-Za-z-]+ )?(?:users?|seats?|requests?|champions?|rows?) (?:currently |also |often )?(?:is|was|uses|reuses|bills|concentrates|has|funds|stops|starts)(?![\\w-])`);
const AGREEMENT = [PLURAL_AFTER_ONE, SINGULAR_AFTER_MANY, VERB_AFTER_ONE, VERB_AFTER_MANY];

describe('number agreement', () => {
  it('the detector itself flags the usual mistakes and accepts correct text', () => {
    const flagged = (text: string): boolean => AGREEMENT.some((pattern) => pattern.test(text));
    for (const bad of ['1 users are here', '2 user are here', '1 new users', '3 seat left', '1 idle seat currently fund it', '2 users is', '1 champion use GitHub Copilot', '0 user']) {
      expect(flagged(bad), bad).toBe(true);
    }
    for (const ok of ['1 user is here', '2 users are here', '1 champion uses GitHub Copilot', '12 users bill', '1,234 users', '$1 users', '8 user-months', '1 of 8 user-months', '1.5 users', '10 days']) {
      expect(flagged(ok), ok).toBe(false);
    }
  });

  it('holds in every text of every scenario', () => {
    const offenders = labelled()
      .filter((snippet) => AGREEMENT.some((pattern) => pattern.test(snippet.text)) || /(?<![\d.,$])0 (?:[A-Za-z-]+ )?(?:users|seats|requests)\b/.test(snippet.text))
      .map((snippet) => `${snippet.name}: ${snippet.kind}: ${snippet.text}`);
    expect(offenders).toEqual([]);
  });
});

// Dates in evidence -------------------------------------------------------------------------------------------------------

describe('spiky recommendation', () => {
  it('names the calendar day of the peak, not the peak amount', () => {
    expect(findRecommendation(scenarios.agree1, 'spiky').evidence).toEqual(['spike-1: 84% of $10 on Sep 3.']);
  });
});
