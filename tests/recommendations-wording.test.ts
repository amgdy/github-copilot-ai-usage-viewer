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
import { agreementCsv, autoDiscounted, healthyCsv, idleSeatCsv, longContextCsv, lowCacheCsv, sep, SEP_WEEKDAYS, spread, terra } from './scenarios';

/** Wording and number agreement of the recommendation texts, checked on small synthetic datasets with exactly known facts. */

const S: Record<string, Pipeline> = {};

const pooled = (rows: RowSpec[], columns?: readonly string[]): string => makeCsv(rows, { pool: true, columns });
const rec = (p: Pipeline, id: string): Recommendation => {
  const r = p.analysis.recs.find((x) => x.id === id);
  if (!r) throw new Error(`no "${id}" recommendation; have ${p.analysis.recs.map((x) => x.id).join(', ')}`);
  return r;
};
const has = (p: Pipeline, id: string): boolean => p.analysis.recs.some((r) => r.id === id);
const plural = (n: number, one: string): string => `${n} ${n === 1 ? one : `${one}s`}`;
const numbered = (prefix: string, n: number): string => Array.from({ length: n }, (_, i) => `${prefix}-${i + 1}`).join(', ');
const note = (p: Pipeline): string[] => rec(p, 'data-notes').evidence;

/** `manualCsv` with the Auto rows billed at their original price: the report then shows no Auto discount. */
const manualAtListCsv = (n: number): string =>
  pooled([
    ...spread('auto-user', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng' }),
    ...Array.from({ length: n }, (_, i) => spread(`manual-${i + 1}`, 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' })).flat(),
  ]);

const manualCsv = (n: number): string =>
  pooled(
    autoDiscounted([
      ...spread('auto-user', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng' }),
      ...Array.from({ length: n }, (_, i) => spread(`manual-${i + 1}`, 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' })).flat(),
    ]),
  );

const rosterBase = (): RowSpec[] => [...spread('u1', 17, [sep(10), sep(20), sep(30)]), ...spread('u2', 17, [sep(10), sep(20), sep(30)])];

/** One regular user plus two repository-level rows (no username) of `each` dollars. */
const unattributedCsv = (each: number, main = 20): string =>
  pooled([
    ...spread('a', main, [sep(5), sep(12), sep(19), sep(26)], { costCenter: 'eng' }),
    { date: sep(6), product: 'code_quality', sku: 'code_quality_ai_credit', model: 'GPT-5.6 Terra', gross: each, repo: 'acme/api', org: 'acme' },
    { date: sep(13), product: 'ghas', sku: 'ghas_ai_credit', model: 'GPT-5.6 Terra', gross: each, repo: 'acme/web', org: 'acme' },
  ]);

beforeAll(async () => {
  S.A = await analyzeFixtures([FIXTURE_A]);
  S.B = await analyzeFixtures([FIXTURE_B]);
  S.AB = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
  S.demo = await analyzeDemo();
  for (const n of [1, 2, 3, 13]) S[`agree${n}`] = await analyzeCsv(agreementCsv(n));
  S.idleSlack = await analyzeCsv(idleSeatCsv(10, 8.5));
  S.idlePartial = await analyzeCsv(idleSeatCsv(26, 26.5));
  S.idleFunding = await analyzeCsv(idleSeatCsv(60, 4.5));
  S.rosterOnly = await analyzeCsv(pooled(rosterBase()), { settings: { roster: [{ user: 'never-seen', plan: 'Business' }] } });
  S.rosterOnly2 = await analyzeCsv(pooled(rosterBase()), {
    settings: { roster: [{ user: 'never-seen', plan: 'Business' }, { user: 'never-2', plan: 'Enterprise' }] },
  });
  S.lc1 = await analyzeCsv(longContextCsv(1));
  S.lc2 = await analyzeCsv(longContextCsv(2));
  S.cache1 = await analyzeCsv(lowCacheCsv(1));
  S.cache2 = await analyzeCsv(lowCacheCsv(2));
  S.manual1 = await analyzeCsv(manualCsv(1));
  S.manual2 = await analyzeCsv(manualCsv(2));
  S.manualAtList = await analyzeCsv(manualAtListCsv(2));
  S.manualOnly = await analyzeCsv(
    pooled(Array.from({ length: 2 }, (_, i) => spread(`manual-${i + 1}`, 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' })).flat()),
  );
  S.twoPlans = await analyzeCsv(
    pooled([
      ...autoDiscounted(spread('biz-auto', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng' }), 0.9),
      ...autoDiscounted(spread('ent-auto', 10, SEP_WEEKDAYS.slice(0, 5), { costCenter: 'eng', quota: 3900 }), 0.8),
      ...spread('manual-biz', 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', model: 'GPT-5.6 Terra' }),
      ...spread('manual-ent', 30, SEP_WEEKDAYS.slice(0, 6), { costCenter: 'eng', quota: 3900, model: 'GPT-5.6 Terra' }),
    ]),
  );
  S.healthy = await analyzeCsv(healthyCsv());
  const five = [sep(14), sep(15), sep(16), sep(17), sep(18)];
  S.oneDay = await analyzeCsv(pooled([terra({ date: sep(15), user: 'a', gross: 5 }), terra({ date: sep(15), user: 'b', gross: 3 })]));
  S.fiveDays = await analyzeCsv(pooled(spread('a', 5, five)));
  S.noTokens = await analyzeCsv(pooled(spread('a', 5, five), ['date', 'username', 'gross_amount']));
  const mystery: RowSpec = { date: sep(16), user: 'a', gross: 5, model: 'Mystery Model 9', input: 1000, output: 1000 };
  const tokenless: RowSpec = { date: sep(17), user: 'a', gross: 4, model: 'GPT-5.6 Terra' };
  S.unknownModel = await analyzeCsv(pooled([...spread('a', 5, five), mystery]));
  S.noTokenLines = await analyzeCsv(pooled([...spread('a', 5, five), tokenless]));
  S.unknownAndNoTokens = await analyzeCsv(pooled([...spread('a', 5, five), mystery, tokenless]));
  const one = pooled([terra({ date: sep(10), user: 'a', gross: 5 })]);
  const two = pooled([terra({ date: sep(10), user: 'a', gross: 5 }), terra({ date: sep(11), user: 'a', gross: 5 })]);
  S.dup1 = await analyzeSources([{ name: 'a.csv', data: one }, { name: 'b.csv', data: one }]);
  S.dup2 = await analyzeSources([{ name: 'a.csv', data: two }, { name: 'b.csv', data: two }]);
  const corrupt = (n: number): string =>
    pooled([terra({ date: sep(10), user: 'a', gross: 5 }), ...Array.from({ length: n }, () => terra({ date: 'not-a-date', user: 'a', gross: 5 }))]);
  S.bad1 = await analyzeCsv(corrupt(1));
  S.bad2 = await analyzeCsv(corrupt(2));
  S.zero = await analyzeCsv(pooled([terra({ date: sep(10), user: 'a', gross: 0 }), terra({ date: sep(11), user: 'a', gross: 0 })]));
  S.unattrLow = await analyzeCsv(unattributedCsv(1.5));
  S.unattrHigh = await analyzeCsv(unattributedCsv(5));
  S.unattrTiny = await analyzeCsv(unattributedCsv(0.4));
  S.unattrOnePct = await analyzeCsv(unattributedCsv(0.5, 200));
});

// Titles that count users ------------------------------------------------------------------------------------------

const TITLES: Record<string, (n: number) => string> = {
  runaway: (n) => `${plural(n, 'user')} used at least 3× their included credits`,
  downgrade: (n) => `${plural(n, 'Enterprise user')} never needed more than the Business allotment`,
  'idle-seats': (n) => `Reclaim ${plural(n, 'idle seat')} to save about $${19 * n}/month`,
  'cost-center-coverage': (n) => `${plural(n, 'user')} ${n === 1 ? 'is' : 'are'} not assigned to a cost center`,
  'multi-org': (n) => `${plural(n, 'user')} ${n === 1 ? 'bills' : 'bill'} to more than one organization`,
  lapsed: (n) => `${plural(n, 'user')} stopped using AI credits`,
  spiky: (n) => `${plural(n, 'user')} ${n === 1 ? 'concentrates' : 'concentrate'} their usage on a single day`,
  'new-users': (n) => `${plural(n, 'new user')} started in the last 14 days`,
  champions: (n) => `${plural(n, 'champion')} ${n === 1 ? 'uses' : 'use'} GitHub Copilot often and heavily`,
};

describe.each([1, 2, 3])('counted recommendations with %i user(s) per behaviour', (n) => {
  const p = (): Pipeline => S[`agree${n}`];

  for (const [id, title] of Object.entries(TITLES)) {
    it(`${id}: "${title(n)}"`, () => {
      const r = rec(p(), id);
      expect(r.title).toBe(title(n));
      expect(r.affectedCount).toBe(n);
      expect(r.affected?.length).toBe(n);
    });
  }

  it('uses the right verb in every counted title', () => {
    for (const id of Object.keys(TITLES)) {
      const title = rec(p(), id).title;
      if (n === 1) expect(title, id).not.toMatch(/\b1 (?:[A-Za-z-]+ )?(?:users|seats|champions)\b/);
      else expect(title, id).not.toMatch(/\b[2-9] (?:[A-Za-z-]+ )?(?:user|seat|champion)\b(?!-)/);
    }
  });

  it('lists the affected users by name, in the evidence of the behaviours it counts', () => {
    expect(rec(p(), 'cost-center-coverage').evidence).toEqual([`Without a cost center: ${numbered('nocc', n)}.`]);
    expect(rec(p(), 'multi-org').evidence).toEqual([`Users: ${numbered('multi', n)}.`]);
    expect(rec(p(), 'new-users').evidence).toEqual([`New users: ${numbered('newbie', n)}.`]);
    expect(rec(p(), 'champions').evidence).toEqual([`Champions: ${numbered('champ', n)}.`]);
    expect(rec(p(), 'lapsed').evidence[0]).toMatch(new RegExp(`: ${numbered('ghost', n)}\\.$`));
    expect(rec(p(), 'downgrade').evidence[0]).toBe(`Peak monthly usage stayed at or below 80% of the $19 Business allotment: ${numbered('ent', n)}.`);
  });

  it('runaway evidence quotes each user usage against the allotment', () => {
    const r = rec(p(), 'runaway');
    for (let i = 1; i <= n; i++) expect(r.evidence[i - 1]).toBe(`run-${i}: $60 = 316% of allotment; top model GPT-5.6 Terra; Auto 100%.`);
    expect(r.evidence[n]).toMatch(new RegExp(`^Usage above 3× allotment: \\$${3 * n}\\. The plan assumes 50% of it can be avoided`));
  });

  it('values idle seats at the plan price and downgrades at the price difference', () => {
    const idle = rec(p(), 'idle-seats');
    expect(idle.impactUsd).toBeCloseTo(19 * n, 6);
    expect(idle.cashUsd).toBeCloseTo(19 * n, 6);
    expect(idle.summary).toBe(`Seats are worth $${19 * n}/month. Removing them shrinks the pool, so only the unused part of the pool ($${19 * n}) turns into cash.`);
    const down = rec(p(), 'downgrade');
    expect(down.evidence[1]).toMatch(new RegExp(`^Cash impact after pool slack: \\$${20 * n}/month`));
  });

  it('idle seat evidence counts the users in the report with the right noun', () => {
    expect(rec(p(), 'idle-seats').evidence).toEqual([
      `${plural(n, 'user')} in the report with minimal use and little activity (seat value $${19 * n}/month): ${numbered('ghost', n)}.`,
    ]);
  });
});

describe('long lists are shortened and capped', () => {
  const p = (): Pipeline => S.agree13;

  it('names five users and counts the rest', () => {
    for (const id of ['downgrade', 'cost-center-coverage', 'multi-org', 'new-users', 'champions']) {
      expect(rec(p(), id).evidence[0], id).toMatch(/(?:[\w-]+, ){4}[\w-]+ and 8 more\.$/);
    }
    expect(rec(p(), 'idle-seats').evidence[0]).toMatch(/\(seat value \$247\/month\): (?:[\w-]+, ){4}[\w-]+ and 8 more\.$/);
  });

  it('keeps the full count but returns at most 12 names', () => {
    for (const id of Object.keys(TITLES)) {
      const r = rec(p(), id);
      expect(r.affectedCount, id).toBe(13);
      expect(r.affected?.length, id).toBe(12);
    }
  });

  it('counts exactly 13 users in the titles', () => {
    for (const [id, title] of Object.entries(TITLES)) expect(rec(p(), id).title, id).toBe(title(13));
  });

  it('does not use a name twice in one list', () => {
    for (const id of Object.keys(TITLES)) {
      const names = rec(p(), id).affected?.map((a) => a.name) ?? [];
      expect(new Set(names).size, id).toBe(names.length);
    }
  });
});

// Idle seats: which sentence is chosen ---------------------------------------------------------------------------------

describe('idle seat titles by how much cash can be recovered', () => {
  it('the whole seat value is cash when the pool has slack', () => {
    const r = rec(S.idleSlack, 'idle-seats');
    expect(r.title).toBe('Reclaim 1 idle seat to save about $19/month');
    expect(r.impactUsd).toBeCloseTo(19, 6);
    expect(r.cashUsd).toBeCloseTo(19, 6);
    expect(r.severity).toBe('low');
  });

  it('only the unused part of the pool is cash when it is almost used', () => {
    const r = rec(S.idlePartial, 'idle-seats');
    expect(r.title).toBe('1 idle seat, but only $4/month is recoverable');
    expect(r.impactUsd).toBeCloseTo(19, 6);
    const pool = S.idlePartial.analysis.pool.months[0];
    expect(r.cashUsd).toBeCloseTo(pool.capacity - pool.gross, 6);
    expect(pool.net).toBe(0);
  });

  it('nothing is recoverable when the pool is exhausted', () => {
    const r = rec(S.idleFunding, 'idle-seats');
    expect(r.cashUsd).toBe(0);
    expect(r.impactUsd).toBeCloseTo(19, 6);
    expect(r.title).toBe('1 idle seat currently funds the pool for heavier users');
    expect(S.idleFunding.analysis.pool.months[0].net).toBeGreaterThan(0);
  });

  it('does not recommend reclaiming roster-only seats without activity dates', () => {
    expect(has(S.rosterOnly, 'idle-seats')).toBe(false);
    expect(has(S.rosterOnly2, 'idle-seats')).toBe(false);
  });

  it('does not recommend reclaiming seats without activity dates alongside low-usage users', async () => {
    const p = await analyzeCsv(agreementCsv(1), { settings: { roster: [{ user: 'never-seen', plan: 'Business' }] } });
    expect(has(p, 'idle-seats')).toBe(false);
  });

  it('is absent when every seat is in use', () => {
    expect(has(S.healthy, 'idle-seats')).toBe(false);
    expect(has(S.fiveDays, 'idle-seats')).toBe(false);
  });
});

// Long context -----------------------------------------------------------------------------------------------------

describe('long-context recommendation', () => {
  it.each([1, 2])('counts %i long-context request(s) and prices them from the premium', (n) => {
    const p = S[`lc${n}`];
    const t = p.analysis.agg.totals;
    expect(t.longPremiumRows).toBe(n);
    expect(t.longPremium).toBeCloseTo(3 * n, 6);
    const r = rec(p, 'long-context');
    expect(r.title).toBe(`Long-context surcharges cost at least $${3 * n}`);
    expect(r.evidence[1]).toBe(`Mostly on GPT-6 Astra ($${3 * n}).`);
    expect(r.evidence[2]).toBe('Most affected users: lc.');
    expect(r.severity).toBe('medium');
    expect(r.jump).toMatchObject({ page: 'efficiency', filters: { traits: ['longContext'] } });
  });

  it('the count sentence agrees with the number for one and two requests', () => {
    expect(rec(S.lc1, 'long-context').evidence[0]).toBe('1 request was billed at the long-context rate.');
    expect(rec(S.lc2, 'long-context').evidence[0]).toBe('2 requests were billed at the long-context rate.');
  });

  it('calls the surcharge a share of usage, not the usage that came from those requests', () => {
    for (const n of [1, 2]) {
      const t = S[`lc${n}`].analysis.agg.totals;
      const share = ((t.longPremium / t.gross) * 100).toFixed(1);
      expect(rec(S[`lc${n}`], 'long-context').summary).toBe(`${share}% of usage is the surcharge on requests whose prompts crossed a model's long-context threshold.`);
    }
  });

  it('is absent when nothing was billed at the long-context rate', () => {
    expect(has(S.healthy, 'long-context')).toBe(false);
    expect(has(S.cache2, 'long-context')).toBe(false);
  });
});

// Cache reuse -----------------------------------------------------------------------------------------------------------

describe('cache recommendation', () => {
  it.each([1, 2])('uses the right form for %i user(s) with a poor cache hit', (n) => {
    const p = S[`cache${n}`];
    const r = rec(p, 'cache');
    expect(r.title).toBe(`${plural(n, 'user')} ${n === 1 ? 'reuses' : 'reuse'} the prompt cache poorly`);
    expect(r.affectedCount).toBe(n);
    expect(r.severity).toBe('low');
    expect(r.jump).toMatchObject({ filters: { traits: ['lowCache'] } });
  });

  it.each([1, 2])('quotes the overall hit rate from the token totals (%i)', (n) => {
    const p = S[`cache${n}`];
    const t = p.analysis.agg.totals;
    const hit = t.cacheRead / (t.input + t.cacheRead + t.cacheWrite);
    const r = rec(p, 'cache');
    expect(r.evidence[0]).toBe(`Overall cache hit rate is ${Math.round(hit * 100)}% of prompt tokens.`);
    expect(r.evidence[1]).toMatch(/^Cache writes cost \d+% of priced usage; cache reads \d+%\.$/);
    expect(r.evidence[r.evidence.length - 1]).toMatch(/^Turning 20% of cache writes into reads would reduce usage by about \$\d+ per month\.$/);
  });

  it('names the users below the cache-hit threshold with the verb that agrees with the count', () => {
    expect(rec(S.cache1, 'cache').evidence).toContain('1 user is below 50% cache hit: bad-1.');
    expect(rec(S.cache2, 'cache').evidence).toContain('2 users are below 50% cache hit: bad-1, bad-2.');
  });

  it('is absent when every user reuses the cache', () => {
    expect(has(S.healthy, 'cache')).toBe(false);
    expect(has(S.agree1, 'cache')).toBe(false);
  });
});

// Auto model selection -----------------------------------------------------------------------------------------------

describe('auto model selection recommendation', () => {
  it.each([1, 2])('quotes the manual share (%i manual user[s])', (n) => {
    const p = S[`manual${n}`];
    const t = p.analysis.agg.totals;
    const share = t.autoGross / t.gross;
    const r = rec(p, 'auto-adoption');
    expect(r.title).toBe(`Only ${Math.round(share * 100)}% of usage goes through Auto model selection`);
    expect(r.evidence[0]).toBe(`Hand-picked usage: $${Math.round(t.gross - t.autoGross)} of $${Math.round(t.gross)}.`);
    expect(r.affectedCount).toBe(n);
  });

  it('uses the noun that agrees with the count of users who rarely use Auto', () => {
    expect(rec(S.manual1, 'auto-adoption').evidence[1]).toBe('1 user used Auto for less than 10% of their usage: manual-1.');
    expect(rec(S.manual2, 'auto-adoption').evidence[1]).toBe('2 users used Auto for less than 10% of their usage: manual-1, manual-2.');
  });

  it('is absent when Auto is the default', () => {
    expect(has(S.healthy, 'auto-adoption')).toBe(false);
    expect(has(S.agree3, 'auto-adoption')).toBe(false);
  });

  it('quotes the discount the report shows for Auto usage as measured', () => {
    const p = S.manual2;
    const a = p.analysis.auto;
    expect(a.plans).toHaveLength(1);
    expect(a.plans[0].source).toBe('measured');
    expect(a.plans[0].rate).toBeCloseTo(0.1, 3);
    expect(a.measuredShare).toBeCloseTo(1, 6);
    const r = rec(p, 'auto-adoption');
    expect(r.summary).toBe('Auto usage in this report received a discount of 10% off its original price. 100% of it was priced from token counts.');
    expect(r.caveat).toContain('Plan rates: Business 10% (measured).');
    expect(r.summary).not.toMatch(/documents|assumed|list price/i);
  });

  it('says the rate is assumed when the report has no Auto usage to measure it from', () => {
    const p = S.manualOnly;
    expect(p.analysis.auto.plans).toEqual([]);
    const r = rec(p, 'auto-adoption');
    expect(r.title).toBe('Only 0% of usage goes through Auto model selection');
    expect(r.summary).toBe('This report has no measured Auto discount, so the estimate uses the assumed rate of 10% from Settings.');
    expect(r.caveat).toContain('No plan has measured Auto usage, so every plan uses 10% (assumed, from Settings).');
    expect(r.caveat).not.toContain('(measured)');
    expect(r.impactUsd).toBeGreaterThan(0);
  });

  it('lists the measured rate of each plan and names no reason for the difference', () => {
    const p = S.twoPlans;
    const a = p.analysis.auto;
    expect(a.plans.map((x) => [x.label, x.source])).toEqual([['Business', 'measured'], ['Enterprise', 'measured']]);
    expect(a.plans[0].rate).toBeCloseTo(0.1, 3);
    expect(a.plans[1].rate).toBeCloseTo(0.2, 3);
    const r = rec(p, 'auto-adoption');
    expect(r.summary).toBe(`Auto usage in this report received a discount of ${Math.round(a.rate * 100)}% off its original price. 100% of it was priced from token counts.`);
    expect(r.caveat).toContain('Plan rates: Business 10% (measured), Enterprise 20% (measured).');
    const text = [r.title, r.summary, ...r.evidence, ...r.actions, r.caveat ?? ''].join(' ');
    expect(text).not.toMatch(/\b(?:because|due to|caused|reason|owing|thanks to|explains?)\b/i);
  });

  it('does not promise savings when Auto usage in the report is billed at its original price', () => {
    const p = S.manualAtList;
    expect(p.analysis.auto.plans[0].rate).toBeCloseTo(0, 3);
    expect(p.analysis.auto.missed).toBe(0);
    expect(has(p, 'auto-adoption')).toBe(false);
  });

  it('prices a filtered group of users at the Auto rates of the whole filtered population', () => {
    const p = pipelineOf(S.manual2.store, { filters: { traits: ['lowAuto'] }, settings: { autoDiscount: 0.3 } });
    const a = p.analysis;
    expect(a.segmentFiltered).toBe(true);
    expect(a.users.profiles.map((u) => u.name).sort()).toEqual(['manual-1', 'manual-2']);
    expect(a.autoRates.plans.map((x) => [x.label, x.source])).toEqual([['Business', 'measured']]);
    expect(a.autoRates.plans[0].rate).toBeCloseTo(0.1, 3);

    const input = { levers: DEFAULT_LEVERS, reclaimIdle: false, downgrade: false, reclaimUnused: false };
    const ctx = leverContext(a, p.models, p.settings);
    expect(ctx.autoRates).toBe(a.autoRates);
    expect(runScenario(ctx, a.pool, a.users, a.seats, input)).toEqual(a.plan);

    // The group itself has no Auto usage, so measured on its own it would fall back to the assumed 30%.
    const autoSaving = (s: typeof a.plan): number => s.levers.steps.find((x) => x.id === 'autoAdoption')!.savings;
    const alone = runScenario({ agg: a.agg, models: p.models, settings: p.settings }, a.pool, a.users, a.seats, input);
    expect(autoSaving(alone)).toBeGreaterThan(autoSaving(a.plan) * 2.5);
  });
});

// Unattributed usage ---------------------------------------------------------------------------------------------------

describe('unattributed usage recommendation', () => {
  it('is low severity below 15% of gross', () => {
    const p = S.unattrLow;
    const t = p.analysis.agg.totals;
    expect(t.unattributedGross).toBeCloseTo(3, 9);
    expect(t.unattributedGross / t.gross).toBeLessThan(0.15);
    const r = rec(p, 'unattributed');
    expect(r.severity).toBe('low');
    expect(r.title).toBe('$3 is not tied to a user');
    expect(r.evidence).toEqual(['Products: code_quality ($2), ghas ($2).', 'Repositories: acme/api ($2), acme/web ($2).']);
    expect(r.impactUsd).toBe(0);
    expect(r.cashUsd).toBe(0);
  });

  it('is medium severity from 15% of gross', () => {
    const p = S.unattrHigh;
    const t = p.analysis.agg.totals;
    expect(t.unattributedGross / t.gross).toBeGreaterThanOrEqual(0.15);
    const r = rec(p, 'unattributed');
    expect(r.severity).toBe('medium');
    expect(r.title).toBe('$10 is not tied to a user');
  });

  it('needs at least $1 ...', () => {
    expect(S.unattrTiny.analysis.agg.totals.unattributedGross).toBeCloseTo(0.8, 9);
    expect(has(S.unattrTiny, 'unattributed')).toBe(false);
  });

  it('... and at least 1% of gross', () => {
    const t = S.unattrOnePct.analysis.agg.totals;
    expect(t.unattributedGross).toBeCloseTo(1, 9);
    expect(t.unattributedGross / t.gross).toBeLessThan(0.01);
    expect(has(S.unattrOnePct, 'unattributed')).toBe(false);
  });

  it('links to the unattributed rows and the link finds exactly those', () => {
    const p = S.unattrHigh;
    const r = rec(p, 'unattributed');
    expect(r.jump).toEqual({ page: 'spend', label: 'Show unattributed usage', filters: { attribution: 'unattributed' } });
    const scoped = p.run({ ...emptyFilters(), ...r.jump?.filters });
    expect(scoped.agg.totals.rows).toBe(2);
    expect(scoped.agg.totals.gross).toBeCloseTo(10, 9);
  });

  it('is absent when everything has a username', () => {
    expect(has(S.agree2, 'unattributed')).toBe(false);
    expect(has(S.healthy, 'unattributed')).toBe(false);
  });
});

// Healthy ----------------------------------------------------------------------------------------------------------------

describe('healthy pool', () => {
  it('says so when the pool is well used, covered and nothing needs attention', () => {
    const a = S.healthy.analysis;
    expect(a.headline).toEqual({ status: 'healthy', title: 'Usage looks healthy', detail: 'Pool utilization 89% · Auto 100% of usage · 4 active users' });
    const r = rec(S.healthy, 'healthy');
    expect(r.severity).toBe('positive');
    expect(r.title).toBe('The pool is well used and fully covered');
    expect(r.summary).toBe('Utilization is about 89% with no billed overage.');
    expect(r.evidence).toEqual(['Usage $68 against $76 of included credits.']);
    expect(a.recs.every((x) => x.severity === 'positive' || x.severity === 'info' || x.severity === 'low')).toBe(true);
  });

  it('adds the roster caveat while the pool size is only a lower bound, and drops it once the roster is known', async () => {
    expect(S.healthy.analysis.pool.capacityIsLowerBound).toBe(true);
    expect(rec(S.healthy, 'healthy').caveat).toBe(
      'Only users in this report fund the current estimate. Add a complete license list in Settings for a better estimate; past months may still differ.',
    );
    const roster = [1, 2, 3, 4].map((u) => ({ user: `steady-${u}`, plan: 'Business' as const }));
    const known = await analyzeCsv(healthyCsv(), { settings: { roster } });
    expect(known.analysis.pool.capacityIsLowerBound).toBe(false);
    expect(rec(known, 'healthy').caveat).toBeUndefined();
  });

  it('is not claimed once anything is billed or the pool is mostly idle', () => {
    expect(has(S.idleFunding, 'healthy')).toBe(false);
    expect(has(S.agree1, 'healthy')).toBe(false);
    expect(has(S.fiveDays, 'healthy')).toBe(true);
  });
});

// Data notes ----------------------------------------------------------------------------------------------------------------

describe('data notes', () => {
  it('is always present when there is usage, informational and has no actions', () => {
    for (const [name, p] of Object.entries(S)) {
      if (name === 'zero') continue;
      const r = rec(p, 'data-notes');
      expect(r.severity, name).toBe('info');
      expect(r.actions, name).toEqual([]);
      expect(r.evidence.length, name).toBeGreaterThan(0);
      expect(r.evidence, name).toContain('The report covers AI-credit usage only. Code completions and next edit suggestions are not included.');
    }
  });

  it('is skipped entirely when the files hold no usage', () => {
    expect(S.zero.analysis.agg.totals.rows).toBe(2);
    expect(S.zero.analysis.agg.totals.gross).toBe(0);
    expect(S.zero.analysis.recs).toEqual([]);
  });

  it('is sorted last among the non-positive recommendations by severity', () => {
    const recs = S.agree2.analysis.recs;
    const last = recs.filter((r) => r.severity !== 'positive' && r.severity !== 'info');
    expect(recs.indexOf(rec(S.agree2, 'data-notes'))).toBeGreaterThan(recs.indexOf(last[last.length - 1]));
  });

  it('warns about short data with the right noun', () => {
    expect(note(S.oneDay)).toContain('Only 1 day of data: projections and trends are indicative.');
    expect(note(S.fiveDays)).toContain('Only 5 days of data: projections and trends are indicative.');
  });

  it('does not warn about short data for two weeks or more', () => {
    expect(note(S.A).some((l) => l.startsWith('Only '))).toBe(false);
    expect(note(S.B).some((l) => l.startsWith('Only '))).toBe(false);
    expect(note(S.demo).some((l) => l.startsWith('Only '))).toBe(false);
  });

  it('explains that the included credits only count users in the report when there is no roster', () => {
    expect(note(S.agree1)).toContain(
      'The current estimate only includes users in this report. Add a complete license list in Settings to improve included-credit and seat-activity estimates.',
    );
    const withRoster = S.rosterOnly.analysis;
    expect(note(S.rosterOnly).some((l) => l.startsWith('The current estimate only includes users'))).toBe(false);
    expect(withRoster.pool.capacityIsLowerBound).toBe(false);
  });

  it('reports dropped duplicates and failed rows with the exact counts and nouns', () => {
    expect(S.dup1.store.files.reduce((a, f) => a + f.duplicatesDropped, 0)).toBe(1);
    expect(S.dup2.store.files.reduce((a, f) => a + f.duplicatesDropped, 0)).toBe(2);
    expect(note(S.dup1)).toContain('1 duplicate row was dropped while merging files.');
    expect(note(S.dup2)).toContain('2 duplicate rows were dropped while merging files.');
    expect(note(S.bad1)).toContain('1 row or cell failed validation (see Data).');
    expect(note(S.bad2)).toContain('2 rows or cells failed validation (see Data).');
    expect(note(S.bad2).some((l) => /duplicate/.test(l))).toBe(false);
    expect(note(S.agree1).some((l) => /duplicate|failed validation/.test(l))).toBe(false);
  });

  it('mentions models that are not in the price card, with the dollars that sit on them', () => {
    const p = S.unknownModel;
    expect(p.analysis.agg.totals.unpricedGross).toBeCloseTo(5, 9);
    expect(note(p)).toContain('$5 is on models that are not in the built-in price card. What-if savings exclude them; add overrides in Settings.');
    expect(note(p).some((l) => /without token counts/.test(l))).toBe(false);
  });

  it('says usage lines without token counts are not a model problem', () => {
    const p = S.noTokenLines;
    expect(p.analysis.agg.totals.unpricedGross).toBeCloseTo(4, 9);
    expect(note(p)).toContain('$4 is on usage lines without token counts or a model name, so price card estimates and what-if savings exclude it.');
    expect(note(p).some((l) => /not in the built-in price card/.test(l))).toBe(false);
  });

  it('reports both causes separately when both are present', () => {
    const p = S.unknownAndNoTokens;
    expect(note(p).filter((l) => /price card|without token counts/.test(l))).toEqual([
      '$5 is on models that are not in the built-in price card. What-if savings exclude them; add overrides in Settings.',
      '$4 is on usage lines without token counts or a model name, so price card estimates and what-if savings exclude it.',
    ]);
  });

  it('does not blame the price card when the file has no model or token columns', () => {
    expect(S.noTokens.analysis.agg.totals.unpricedGross).toBeGreaterThan(0);
    expect(note(S.noTokens).some((l) => /not in the built-in price card|without token counts/.test(l))).toBe(false);
  });
});

// A file without token or billing columns ------------------------------------------------------------------------------

describe('a file that only has date, username and gross_amount', () => {
  it('does not say what was billed, so the headline says so and billing findings are hidden', () => {
    const a = S.noTokens.analysis;
    expect(a.headline.status).toBe('watch');
    expect(a.headline.title).toBe('This file does not say what was billed');
    const ids = a.recs.map((r) => r.id);
    for (const hidden of ['overage', 'pool-exhaustion', 'pool-underuse', 'idle-seats', 'downgrade', 'healthy', 'budgets']) expect(ids, hidden).not.toContain(hidden);
    expect(ids).toContain('data-coverage');
  });

  it('explains every missing column in the coverage recommendation', () => {
    const r = rec(S.noTokens, 'data-coverage');
    expect(r.severity).toBe('medium');
    expect(r.title).toBe('The file is missing columns the analysis relies on');
    expect(r.evidence).toHaveLength(2);
    expect(r.evidence[0]).toMatch(/^The file does not say what was billed\. /);
    expect(r.evidence[1]).toMatch(/^The file has no seat sizes\. /);
  });

  it('keeps the numbers readable', () => {
    for (const t of analysisTexts(S.noTokens.analysis)) expect(t).not.toMatch(BAD_TEXT);
  });

  it('does not claim an Auto share for a file without a model column (the share is unknowable)', () => {
    expect(S.noTokens.analysis.agg.totals.autoGross).toBe(0);
    expect(has(S.noTokens, 'auto-adoption')).toBe(false);
  });
});

// Typography and leaks ------------------------------------------------------------------------------------------------

const labelled = (): { name: string; kind: string; text: string }[] => {
  const out: { name: string; kind: string; text: string }[] = [];
  for (const [name, p] of Object.entries(S)) {
    const a = p.analysis;
    out.push({ name, kind: 'headline title', text: a.headline.title }, { name, kind: 'headline detail', text: a.headline.detail });
    for (const r of a.recs) {
      out.push({ name, kind: `${r.id} title`, text: r.title }, { name, kind: `${r.id} summary`, text: r.summary });
      for (const e of r.evidence) out.push({ name, kind: `${r.id} evidence`, text: e });
      for (const x of r.actions) out.push({ name, kind: `${r.id} action`, text: x });
      if (r.caveat) out.push({ name, kind: `${r.id} caveat`, text: r.caveat });
    }
  }
  return out;
};

describe('typography of every text on every scenario', () => {
  it('has no placeholder or non-finite leaks', () => {
    for (const x of labelled()) expect(x.text, `${x.name}: ${x.kind}`).not.toMatch(BAD_TEXT);
  });

  it('has no stray whitespace or spaces before punctuation', () => {
    for (const x of labelled()) {
      const where = `${x.name}: ${x.kind}`;
      expect(x.text, where).toBe(x.text.trim());
      expect(x.text, where).not.toMatch(/ {2}/);
      expect(x.text, where).not.toMatch(/ [.,;:!?](?:\s|$)/);
      expect(x.text, where).not.toMatch(/\$ |\$-|-\$ /);
    }
  });

  it('writes titles without a final period and sentences with one', () => {
    for (const x of labelled()) {
      const where = `${x.name}: ${x.kind}`;
      if (x.kind.endsWith(' title') || x.kind === 'headline title') expect(x.text, where).not.toMatch(/\.$/);
      if (/ (summary|evidence|action|caveat)$/.test(x.kind)) expect(x.text, where).toMatch(/[.)]$/);
    }
  });

  it('does not repeat the title in the summary', () => {
    for (const [name, p] of Object.entries(S)) for (const r of p.analysis.recs) expect(r.summary, `${name}: ${r.id}`).not.toBe(r.title);
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
    const flagged = (t: string): boolean => AGREEMENT.some((re) => re.test(t));
    for (const bad of ['1 users are here', '2 user are here', '1 new users', '3 seat left', '1 idle seat currently fund it', '2 users is', '1 champion use GitHub Copilot', '0 user']) {
      expect(flagged(bad), bad).toBe(true);
    }
    for (const ok of ['1 user is here', '2 users are here', '1 champion uses GitHub Copilot', '12 users bill', '1,234 users', '$1 users', '8 user-months', '1 of 8 user-months', '1.5 users', '10 days']) {
      expect(flagged(ok), ok).toBe(false);
    }
  });

  it('holds in every text of every scenario', () => {
    const offenders = labelled()
      .filter((x) => AGREEMENT.some((re) => re.test(x.text)) || /(?<![\d.,$])0 (?:[A-Za-z-]+ )?(?:users|seats|requests)\b/.test(x.text))
      .map((x) => `${x.name}: ${x.kind}: ${x.text}`);
    expect(offenders).toEqual([]);
  });
});

// Dates in evidence -------------------------------------------------------------------------------------------------------

describe('spiky recommendation', () => {
  it('names the calendar day of the peak, not the peak amount', () => {
    expect(rec(S.agree1, 'spiky').evidence).toEqual(['spike-1: 84% of $10 on Sep 3.']);
  });
});
