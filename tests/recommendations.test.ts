import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { RecommendationCard } from '../src/components/RecommendationCard';
import type { Analysis } from '../src/lib/analytics/analyze';
import { emptyFilters, type Filters } from '../src/lib/analytics/filters';
import { DEFAULT_LEVERS } from '../src/lib/analytics/levers';
import {
  buildHeadline,
  buildRecommendations,
  DOCS,
  recDocId,
  recValue,
  SEVERITY_ORDER,
  type RecContext,
  type Recommendation,
  type Severity,
} from '../src/lib/analytics/recommendations';
import { cashSaving, monthInputs } from '../src/lib/analytics/simulator';
import { userTips } from '../src/lib/analytics/tips';
import { ENGAGEMENT_IDS, LIFECYCLE_IDS, PARETO_IDS, PERSONA_IDS, PROFILE_IDS, TIER_IDS, TRAIT_IDS, type UserProfile } from '../src/lib/analytics/users';
import { metricDoc } from '../src/lib/metrics/registry';
import { PlaybookTab } from '../src/pages/recommendations/PlaybookTab';
import { sortRecs } from '../src/pages/recommendations/recFilters';
import { DEFAULT_SEAT_FLAGS, LEVER_DOC, SEAT_DOC, cashHiddenReason, poolUnknownReason } from '../src/pages/recommendations/scenario';
import { SeatsTab } from '../src/pages/recommendations/SeatsTab';
import { SimulatorTab } from '../src/pages/recommendations/SimulatorTab';
import { AnalysisProvider } from '../src/state/analysis';
import { CATEGORIES } from '../src/lib/types';
import { analyzeFixtures, FIXTURE_A, FIXTURE_B, readFixture } from './fixtures';
import {
  analysisTexts,
  analyzeCsv,
  analyzeDemo,
  BAD_TEXT,
  dayNum,
  groupSum,
  isAutoRow,
  makeCsv,
  naiveRows,
  numOf,
  pipelineOf,
  sum,
  type NaiveRow,
  type Pipeline,
  type RowSpec,
} from './helpers';
import { agreementCsv, longRow, sep, SEP_WEEKDAYS, spread, terra } from './scenarios';

const CASES = [
  'fixture A',
  'fixture B',
  'A + B',
  'demo',
  'demo last 20 days',
  'demo one model',
  'demo one org',
  'demo runaway segment',
  'demo with roster and budget',
  'A with $100 budget',
] as const;
type CaseName = (typeof CASES)[number];

const P = {} as Record<CaseName, Pipeline>;
let demoCsv = '';

beforeAll(async () => {
  P['fixture A'] = await analyzeFixtures([FIXTURE_A]);
  P['fixture B'] = await analyzeFixtures([FIXTURE_B]);
  P['A + B'] = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
  const demo = await analyzeDemo();
  demoCsv = demo.demo.csv;
  P.demo = demo;
  const { store } = demo;
  P['demo last 20 days'] = pipelineOf(store, { filters: { dateFrom: store.maxDay - 19 } });
  P['demo one model'] = pipelineOf(store, { filters: { models: ['GPT-6 Astra'] } });
  P['demo one org'] = pipelineOf(store, { filters: { orgs: ['northwind-data'] } });
  P['demo runaway segment'] = pipelineOf(store, { filters: { tiers: ['runaway'] } });
  P['demo with roster and budget'] = pipelineOf(store, {
    settings: { budgetMonthlyBilled: 120, roster: [{ user: 'seat-without-usage', plan: 'Enterprise' }] },
  });
  P['A with $100 budget'] = await analyzeFixtures([FIXTURE_A], { settings: { budgetMonthlyBilled: 100 } });
});

const SEVERITIES = Object.keys(SEVERITY_ORDER) as Severity[];
const THEMES = ['cost', 'pool', 'efficiency', 'adoption', 'governance', 'data'];
const AUDIENCES = ['management', 'admin', 'user'];
const CONFIDENCES = ['high', 'medium', 'low'];
const PAGES = ['overview', 'spend', 'users', 'segments', 'models', 'efficiency', 'organization', 'patterns', 'recommendations', 'data', 'settings'];
const POOL_RECS = ['pool-exhaustion', 'pool-underuse', 'idle-seats', 'downgrade', 'healthy'];
const DISCLAIMER = 'The report covers AI-credit usage only. Code completions and next edit suggestions are not included.';

const VALID_VALUES: Record<string, readonly string[]> = {
  segments: PERSONA_IDS,
  tiers: TIER_IDS,
  engagement: [...ENGAGEMENT_IDS, ...LIFECYCLE_IDS],
  profiles: PROFILE_IDS,
  traits: TRAIT_IDS,
  paretoClasses: PARETO_IDS,
  categories: CATEGORIES,
  selection: ['all', 'auto', 'manual'],
  billing: ['all', 'covered', 'billed'],
  attribution: ['all', 'attributed', 'unattributed'],
};

const ids = (a: Analysis): string[] => a.recs.map((r) => r.id);
const rec = (a: Analysis, id: string): Recommendation => {
  const r = a.recs.find((x) => x.id === id);
  if (!r) throw new Error(`no "${id}" recommendation; got ${ids(a).join(', ')}`);
  return r;
};
const usd0 = (x: number): string => `$${Math.round(x).toLocaleString('en-US')}`;
const plural = (n: number, one: string): string => `${n} ${n === 1 ? one : `${one}s`}`;

const ctxOf = (p: Pipeline, over: Partial<RecContext> = {}): RecContext => {
  const a = p.analysis;
  return {
    store: p.store,
    models: p.models,
    agg: a.agg,
    mask: a.mask,
    users: a.users,
    pool: a.pool,
    seats: a.seats,
    levers: a.levers,
    anomalies: a.anomalies,
    trend: a.trend,
    settings: p.settings,
    narrowed: a.narrowed,
    coverage: a.coverage,
    auto: a.auto,
    ...over,
  };
};

/** Expected title of the count-based recommendations, written without the library's pluralize/verb helpers. */
const COUNT_TITLES: Record<string, (n: number) => string> = {
  runaway: (n) => `${plural(n, 'user')} used at least 3× their included credits`,
  lapsed: (n) => `${plural(n, 'user')} stopped using AI credits`,
  'new-users': (n) => `${plural(n, 'new user')} started in the last 14 days`,
  champions: (n) => `${plural(n, 'champion')} ${n === 1 ? 'uses' : 'use'} GitHub Copilot often and heavily`,
  spiky: (n) => `${plural(n, 'user')} ${n === 1 ? 'concentrates' : 'concentrate'} their usage on a single day`,
  'multi-org': (n) => `${plural(n, 'user')} ${n === 1 ? 'bills' : 'bill'} to more than one organization`,
  'cost-center-coverage': (n) => `${plural(n, 'user')} ${n === 1 ? 'is' : 'are'} not assigned to a cost center`,
  downgrade: (n) => `${plural(n, 'Enterprise user')} never needed more than the Business allotment`,
};

describe.each(CASES)('recommendation invariants: %s', (name) => {
  const pipe = (): Pipeline => P[name];
  const an = (): Analysis => P[name].analysis;

  it('has unique ids and exactly one data-notes entry', () => {
    const recs = an().recs;
    expect(recs.length).toBeGreaterThan(0);
    expect(new Set(recs.map((r) => r.id)).size).toBe(recs.length);
    expect(recs.filter((r) => r.id === 'data-notes')).toHaveLength(1);
  });

  it('every recommendation is complete and uses the allowed vocabularies', () => {
    for (const r of an().recs) {
      expect(r.id, 'id').toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(r.title.trim(), `${r.id} title`).not.toBe('');
      expect(r.summary.trim(), `${r.id} summary`).not.toBe('');
      if (r.id !== 'data-notes') expect(r.actions.length, `${r.id} actions`).toBeGreaterThan(0);
      for (const s of [...r.evidence, ...r.actions]) expect(s.trim(), `${r.id} line`).not.toBe('');
      expect(SEVERITIES, `${r.id} severity`).toContain(r.severity);
      expect(THEMES, `${r.id} theme`).toContain(r.theme);
      expect(r.audience.length, `${r.id} audience`).toBeGreaterThan(0);
      for (const au of r.audience) expect(AUDIENCES, `${r.id} audience`).toContain(au);
      expect(CONFIDENCES, `${r.id} confidence`).toContain(r.confidence);
      expect(typeof r.cashLowerBound, `${r.id} cashLowerBound`).toBe('boolean');
    }
  });

  it('impact and cash are finite and non-negative, and cash never exceeds impact', () => {
    for (const r of an().recs) {
      expect(Number.isFinite(r.impactUsd), `${r.id} impact`).toBe(true);
      expect(Number.isFinite(r.cashUsd), `${r.id} cash`).toBe(true);
      expect(r.impactUsd, `${r.id} impact`).toBeGreaterThanOrEqual(0);
      expect(r.cashUsd, `${r.id} cash`).toBeGreaterThanOrEqual(0);
      expect(r.cashUsd, `${r.id} cash vs impact`).toBeLessThanOrEqual(r.impactUsd + 1e-6);
      expect(Number.isInteger(r.affectedCount) && r.affectedCount >= 0, `${r.id} affectedCount`).toBe(true);
    }
  });

  it('is sorted by monthly value, largest first, then by severity', () => {
    const recs = an().recs;
    for (let i = 1; i < recs.length; i++) {
      const prev = recs[i - 1];
      const next = recs[i];
      expect(recValue(prev), `${prev.id} before ${next.id}`).toBeGreaterThanOrEqual(recValue(next));
      if (recValue(prev) === recValue(next)) expect(SEVERITY_ORDER[prev.severity], `${prev.id} before ${next.id}`).toBeLessThanOrEqual(SEVERITY_ORDER[next.severity]);
    }
    expect(sortRecs(recs, 'value').map((r) => r.id)).toEqual(recs.map((r) => r.id));
  });

  it('never shows NaN, undefined, Infinity or [object] to the user', () => {
    for (const t of analysisTexts(an())) expect(t).not.toMatch(BAD_TEXT);
  });

  it('has a headline that agrees with the severities', () => {
    const a = an();
    const sev = a.recs.map((r) => r.severity);
    const urgent = sev.filter((s) => s === 'critical' || s === 'high').length;
    const watch = sev.filter((s) => s === 'medium').length;
    const net = a.agg.totals.net;
    const h = a.headline;
    if (urgent > 0) {
      expect(h.status).toBe('action');
      const actions = `${urgent} high-priority action${urgent === 1 ? '' : 's'}`;
      expect(h.title).toBe(net > 0.005 ? `${usd0(net)} billed overage and ${actions}` : actions);
    } else if (watch > 0) {
      expect(h.status).toBe('watch');
      expect(h.title).toBe(`No urgent issues, ${watch} item${watch === 1 ? '' : 's'} worth a look`);
    } else {
      expect(h.status).toBe('healthy');
      expect(h.title).toBe('Usage looks healthy');
    }
    const n = a.users.profiles.length;
    const poolPart = !a.narrowed && !a.pool.capacityExceeded ? 'Pool utilization \\d+% · ' : '';
    expect(h.detail).toMatch(new RegExp(`^${poolPart}Auto \\d+% of usage · ${n} active users?$`));
    expect(h.detail.endsWith(n === 1 ? '1 active user' : `${n} active users`)).toBe(true);
  });

  it('lists affected users that exist in the analysed scope', () => {
    const a = an();
    for (const r of a.recs) {
      expect(r.affected.length, `${r.id} affected`).toBeLessThanOrEqual(12);
      expect(new Set(r.affected.map((x) => x.id)).size, `${r.id} affected ids`).toBe(r.affected.length);
      for (const x of r.affected) {
        const p = a.users.byId.get(x.id);
        expect(p, `${r.id}: affected user ${x.name}`).toBeDefined();
        expect(p!.name).toBe(x.name);
      }
    }
  });

  it('links only to official GitHub Copilot documentation', () => {
    const known = new Set(Object.values(DOCS).map((d) => `${d.label}|${d.url}`));
    for (const r of an().recs) {
      for (const d of r.docs ?? []) {
        expect(d.url, `${r.id} docs`).toMatch(/^https:\/\/docs\.github\.com\/en\/copilot\//);
        expect(known.has(`${d.label}|${d.url}`), `${r.id}: ${d.label}`).toBe(true);
      }
    }
  });

  it('data-notes is informational, has no actions and carries the AI-credit disclaimer', () => {
    const r = rec(an(), 'data-notes');
    expect(r.severity).toBe('info');
    expect(r.theme).toBe('data');
    expect(r.actions).toEqual([]);
    expect(r.evidence).toContain(DISCLAIMER);
    expect(r.jump?.page).toBe('data');
  });

  it('jump targets are valid pages and valid filter patches', () => {
    const empty = emptyFilters() as unknown as Record<string, unknown>;
    for (const r of an().recs) {
      if (!r.jump) continue;
      expect(PAGES, `${r.id} page`).toContain(r.jump.page);
      expect(r.jump.label.trim(), `${r.id} jump label`).not.toBe('');
      for (const [k, v] of Object.entries(r.jump.filters ?? {})) {
        expect(Object.keys(empty), `${r.id}: unknown filter "${k}"`).toContain(k);
        const base = empty[k];
        const allowed = VALID_VALUES[k];
        if (Array.isArray(base)) {
          expect(Array.isArray(v), `${r.id}.${k}`).toBe(true);
          expect((v as unknown[]).length, `${r.id}.${k}`).toBeGreaterThan(0);
          if (allowed) for (const x of v as string[]) expect(allowed, `${r.id}.${k}`).toContain(x);
        } else if (base === null) {
          expect(typeof v, `${r.id}.${k}`).toBe('number');
          expect(Number.isFinite(v as number), `${r.id}.${k}`).toBe(true);
        } else {
          expect(typeof v, `${r.id}.${k}`).toBe(typeof base);
          if (allowed) expect(allowed, `${r.id}.${k}`).toContain(v as string);
        }
      }
    }
  });

  it('every jump filter patch can be analysed and still finds rows', () => {
    for (const r of an().recs) {
      if (!r.jump?.filters) continue;
      const res = pipe().run({ ...emptyFilters(), ...r.jump.filters });
      expect(res.agg.totals.rows, `${r.id}: "${r.jump.label}" finds nothing`).toBeGreaterThan(0);
    }
  });

  it('count-based titles agree with the number of users and use the right verb form', () => {
    for (const r of an().recs) {
      const expected = COUNT_TITLES[r.id];
      if (expected) expect(r.title, r.id).toBe(expected(r.affectedCount));
    }
  });

  it('can be rebuilt from the analysis context and is deterministic', () => {
    const p = pipe();
    const a = an();
    const recs = buildRecommendations(ctxOf(p));
    expect(recs).toEqual(a.recs);
    expect(buildHeadline(ctxOf(p), recs)).toEqual(a.headline);
    expect(p.run().recs).toEqual(a.recs);
  });

  it('marks cash as a lower bound exactly when the scope is narrowed or has no pool months', () => {
    const a = an();
    const poolWhole = !a.narrowed && monthInputs(a.pool).length > 0;
    for (const r of a.recs) expect(r.cashLowerBound, r.id).toBe(!poolWhole);
  });
});

describe('pool-used fixture: a drained pool and one runaway user', () => {
  const a = (): Analysis => P['fixture A'].analysis;

  it('contains the rules that apply and none that do not', () => {
    const sev = Object.fromEntries(a().recs.map((r) => [r.id, r.severity]));
    expect(sev).toMatchObject({
      overage: 'high',
      'pool-exhaustion': 'high',
      runaway: 'high',
      'model-rightsizing': 'medium',
      'new-users': 'positive',
      'data-notes': 'info',
    });
    for (const id of ['trend-up', 'trend-down', 'pool-underuse', 'idle-seats', 'downgrade', 'healthy', 'budgets', 'unattributed', 'multi-org']) {
      expect(ids(a()), id).not.toContain(id);
    }
  });

  it('describes the billed overage from independent numbers', () => {
    const rows = naiveRows(readFixture(FIXTURE_A));
    const col = (name: string, who?: string): number => sum(rows.filter((x) => !who || x.username === who).map((x) => numOf(x, name)));
    const [gross, covered, billed] = [col('gross_amount'), col('discount_amount'), col('net_amount')];
    const r = rec(a(), 'overage');
    expect(r.title).toBe(`${usd0(billed)} was billed beyond included credits`);
    expect(r.summary).toMatch(new RegExp(`^${Math.round((100 * billed) / gross)}% of usage was billed as overage`));
    expect(r.evidence[0]).toBe(`Usage ${usd0(gross)}: ${usd0(covered)} covered by the pool, ${usd0(billed)} billed.`);
    expect(r.evidence[1]).toBe(`alex-dev: ${usd0(col('net_amount', 'alex-dev'))} billed (100% of all overage), ${Math.round((100 * col('gross_amount', 'alex-dev')) / 39)}% of their own allotment.`);
    expect(r.impactUsd).toBe(0);
    expect(r.cashUsd).toBe(0);
  });

  it('counts the users with a billed amount from the raw CSV, largest first', () => {
    const rows = naiveRows(readFixture(FIXTURE_A));
    const billed = [...groupSum(rows, (r) => r.username, (r) => numOf(r, 'net_amount')).entries()].filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
    const r = rec(a(), 'overage');
    expect(r.affectedCount).toBe(billed.length);
    expect(r.affected.map((x) => x.name)).toEqual(billed.map(([u]) => u));
  });

  it('dates the pool exhaustion and projects the overage with an ordered range', () => {
    const r = rec(a(), 'pool-exhaustion');
    expect(r.title).toBe('The shared pool runs out before month end');
    expect(r.evidence).toContain('Oct 2026: pool used up on Oct 3 (day 3 of 31).');
    const line = r.evidence.find((l) => l.includes('projected billed overage'))!;
    const m = /^Oct 2026: projected billed overage \$([\d,]+) \(range \$([\d,]+) to \$([\d,]+)\)\.$/.exec(line);
    expect(m, line).not.toBeNull();
    const [mid, lo, hi] = [m![1], m![2], m![3]].map((s) => Number(s.replace(/,/g, '')));
    expect(mid).toBe(158);
    expect(lo).toBeLessThanOrEqual(mid);
    expect(hi).toBeGreaterThanOrEqual(mid);
    expect(r.impactUsd).toBe(0);
  });

  it('flags the runaway user and the new user', () => {
    const run = rec(a(), 'runaway');
    expect(run.title).toBe('1 user used at least 3× their included credits');
    expect(run.affected.map((x) => x.name)).toEqual(['alex-dev']);
    expect(run.cashUsd).toBeGreaterThan(0);
    const fresh = rec(a(), 'new-users');
    expect(fresh.title).toBe('1 new user started in the last 14 days');
    expect(fresh.affected.map((x) => x.name)).toEqual(['sam-lee']);
  });

  it('puts the powerful-model share and the headline in plain numbers', () => {
    const t = a().agg.totals;
    const share = t.tierGross[CATEGORIES.indexOf('Powerful')] / t.gross;
    expect(rec(a(), 'model-rightsizing').title).toBe(`${Math.round(share * 100)}% of usage runs on Powerful models`);
    expect(a().headline).toMatchObject({ status: 'action', title: '$93 billed overage and 3 high-priority actions' });
    expect(a().headline.detail).toMatch(/^Pool utilization 100% · Auto \d+% of usage · 2 active users$/);
  });

  it('notes that the included credits are a lower bound', () => {
    expect(rec(a(), 'data-notes').evidence[0]).toMatch(/^The current estimate only includes users in this report\./);
  });
});

describe('partial-export fixture: everything covered by a pool larger than the visible seat', () => {
  const a = (): Analysis => P['fixture B'].analysis;

  it('has an unknown pool size and therefore no pool statements', () => {
    expect(a().pool.capacityExceeded).toBe(true);
    expect(a().pool.utilization).toBeNaN();
    for (const id of [...POOL_RECS, 'overage', 'budgets', 'trend-up']) expect(ids(a()), id).not.toContain(id);
    for (const t of analysisTexts(a())) expect(t).not.toMatch(/Pool utilization|NaN|undefined|Infinity/);
  });

  it('recommends the efficiency rules that apply', () => {
    const sev = Object.fromEntries(a().recs.map((r) => [r.id, r.severity]));
    expect(sev).toMatchObject({
      runaway: 'medium',
      'model-rightsizing': 'medium',
      'auto-adoption': 'medium',
      'long-context': 'medium',
      anomalies: 'medium',
      context: 'low',
      spiky: 'low',
      'trend-down': 'info',
      'data-notes': 'info',
    });
  });

  it('values every saving at zero cash, because nothing is billed', () => {
    for (const r of a().recs) expect(r.cashUsd, r.id).toBeLessThan(0.01);
    expect(a().agg.totals.net).toBe(0);
  });

  it('quotes the long-context surcharge, the Auto share and the spikes', () => {
    const t = a().agg.totals;
    expect(rec(a(), 'long-context').title).toBe(`Long-context surcharges cost at least ${usd0(t.longPremium)}`);
    expect(rec(a(), 'long-context').evidence[0]).toBe('4 requests were billed at the long-context rate.');
    expect(rec(a(), 'long-context').evidence[1]).toMatch(/^Mostly on GPT-6 Astra \(\$123\)/);
    expect(rec(a(), 'auto-adoption').title).toBe('Only 0% of usage goes through Auto model selection');
    expect(rec(a(), 'anomalies').title).toBe('3 days with unusually high usage');
    expect(rec(a(), 'anomalies').summary).toBe('The biggest, Oct 16, 2026, reached 25× a typical day.');
    expect(rec(a(), 'trend-down').title).toBe('Usage dropped 54% week over week');
  });

  it('has a watch headline without a pool part, and explains why the pool is hidden', () => {
    const covered = sum(naiveRows(readFixture(FIXTURE_B)).map((r) => numOf(r, 'discount_amount')));
    expect(a().headline).toEqual({ status: 'watch', title: 'No urgent issues, 5 items worth a look', detail: 'Auto 0% of usage · 1 active user' });
    expect(rec(a(), 'data-notes').evidence[0]).toMatch(new RegExp(`^The pool covered \\${usd0(covered)}, more than the \\$39 that the seats in this file fund\\.`));
  });
});

describe('both fixtures (two billing entities in one scope)', () => {
  const a = (): Analysis => P['A + B'].analysis;

  it('reports the real billed overage and hides the pool size', () => {
    const rows = [...naiveRows(readFixture(FIXTURE_A)), ...naiveRows(readFixture(FIXTURE_B))];
    const billed = sum(rows.map((r) => numOf(r, 'net_amount')));
    const covered = sum(rows.map((r) => numOf(r, 'discount_amount')));
    expect(a().pool.capacityExceeded).toBe(true);
    expect(rec(a(), 'overage').title).toBe(`${usd0(billed)} was billed beyond included credits`);
    expect(rec(a(), 'overage').severity).toBe('medium');
    for (const id of ['pool-underuse', 'idle-seats', 'downgrade', 'healthy']) expect(ids(a()), id).not.toContain(id);
    expect(a().headline.detail).not.toMatch(/Pool utilization/);
    expect(rec(a(), 'data-notes').evidence[0]).toMatch(new RegExp(`^The pool covered \\${usd0(covered)}, more than the \\$97 that the seats in this file fund\\.`));
  });

  it('still recommends what does not depend on the pool size', () => {
    expect(ids(a())).toEqual(expect.arrayContaining(['runaway', 'model-rightsizing', 'long-context', 'anomalies', 'group-balance']));
  });
});

describe('demo dataset: the designed story', () => {
  const a = (): Analysis => P.demo.analysis;

  it('contains every rule the demo is built to show', () => {
    expect(ids(a())).toEqual(
      expect.arrayContaining([
        'runaway',
        'overage',
        'pool-exhaustion',
        'budgets',
        'idle-seats',
        'downgrade',
        'cost-center-coverage',
        'model-rightsizing',
        'auto-adoption',
        'long-context',
        'multi-org',
        'lapsed',
        'new-users',
        'champions',
        'spiky',
        'anomalies',
        'cache',
        'context',
        'data-notes',
      ]),
    );
    for (const id of ['healthy', 'pool-underuse', 'unattributed', 'trend-up']) expect(ids(a()), id).not.toContain(id);
  });

  it('assigns the expected severities', () => {
    const sev = Object.fromEntries(a().recs.map((r) => [r.id, r.severity]));
    expect(sev).toMatchObject({
      runaway: 'high',
      overage: 'high',
      'pool-exhaustion': 'high',
      budgets: 'high',
      'model-rightsizing': 'medium',
      'auto-adoption': 'medium',
      'long-context': 'medium',
      downgrade: 'low',
      'idle-seats': 'low',
      'cost-center-coverage': 'low',
      'new-users': 'positive',
      champions: 'positive',
    });
    expect(a().headline).toMatchObject({ status: 'action', title: '$123 billed overage and 4 high-priority actions' });
  });

  it('counts the cost-center gap from the raw CSV', () => {
    const centers = new Map<string, Set<string>>();
    for (const r of naiveRows(demoCsv)) {
      if (!r.username) continue;
      const set = centers.get(r.username) ?? new Set<string>();
      set.add(r.cost_center_name);
      centers.set(r.username, set);
    }
    const without = [...centers.values()].filter((s) => [...s].every((c) => c === '')).length;
    expect(without).toBeGreaterThan(0);
    expect(rec(a(), 'cost-center-coverage').affectedCount).toBe(without);
  });

  it('derives the Auto share from the raw CSV', () => {
    const rows = naiveRows(demoCsv);
    const gross = sum(rows.map((r) => numOf(r, 'gross_amount')));
    const auto = sum(rows.filter(isAutoRow).map((r) => numOf(r, 'gross_amount')));
    expect(rec(a(), 'auto-adoption').title).toBe(`Only ${Math.round((auto / gross) * 100)}% of usage goes through Auto model selection`);
  });

  it('values the usage savings with the pool-covers-first rule', () => {
    const months = monthInputs(a().pool);
    const avgGross = sum(months.map((m) => m.gross)) / months.length;
    const gross = a().agg.totals.gross;
    const fraction = (id: string): number => Math.min(1, a().levers.steps.find((s) => s.id === id)!.savings / gross);
    for (const [recId, lever] of [
      ['runaway', 'capRunaway'],
      ['model-rightsizing', 'modelShift'],
      ['auto-adoption', 'autoAdoption'],
    ] as const) {
      const r = rec(a(), recId);
      expect(r.impactUsd, `${recId} impact`).toBeCloseTo(avgGross * fraction(lever), 6);
      expect(r.cashUsd, `${recId} cash`).toBeCloseTo(cashSaving(months, fraction(lever), 0) / months.length, 6);
      expect(r.cashLowerBound).toBe(false);
    }
  });

  it('values the seat actions with the slack of the pool', () => {
    const months = monthInputs(a().pool);
    const idle = rec(a(), 'idle-seats');
    const seats = a().seats;
    expect(idle.impactUsd).toBeCloseTo(seats.idleValue + seats.unusedValue, 9);
    expect(idle.cashUsd).toBeCloseTo(cashSaving(months, 0, seats.idleValue + seats.unusedValue) / months.length, 6);
    expect(idle.affectedCount).toBe(seats.idle.length + seats.unused.length);
    const down = rec(a(), 'downgrade');
    expect(down.title).toBe('6 Enterprise users never needed more than the Business allotment');
    expect(down.impactUsd).toBeCloseTo(seats.downgrade.length * 20, 9);
    expect(down.cashUsd).toBeCloseTo(cashSaving(months, 0, seats.downgradeValue) / months.length, 6);
  });

  it('chooses the idle-seats title from how much cash the removal frees', () => {
    const idle = rec(a(), 'idle-seats');
    expect(idle.cashUsd).toBeLessThan(0.5);
    expect(idle.title).toBe('5 idle seats currently fund the pool for heavier users');
  });

  it('flags the budget gap only while no budget is configured', () => {
    expect(rec(a(), 'budgets').jump?.page).toBe('settings');
    expect(ids(P['demo with roster and budget'].analysis)).not.toContain('budgets');
  });

  it('treats a budget of zero like no budget, in the pool and in the recommendations', () => {
    const store = P.demo.store;
    const zero = pipelineOf(store, { settings: { budgetMonthlyBilled: 0 } }).analysis;
    expect(zero.pool.budget).toBeNull();
    expect(ids(zero)).toContain('budgets');
    const set = pipelineOf(store, { settings: { budgetMonthlyBilled: 100 } }).analysis;
    expect(set.pool.budget).not.toBeNull();
    expect(ids(set)).not.toContain('budgets');
  });

  it('sends each count-based recommendation to a link that selects exactly those users', () => {
    const pick = (id: string): number => {
      const r = rec(a(), id);
      const res = P.demo.run({ ...emptyFilters(), ...r.jump!.filters });
      expect(res.segmentFiltered, id).toBe(true);
      return res.users.profiles.length;
    };
    expect(pick('runaway')).toBe(rec(a(), 'runaway').affectedCount);
    expect(pick('lapsed')).toBe(rec(a(), 'lapsed').affectedCount);
    expect(pick('new-users')).toBe(rec(a(), 'new-users').affectedCount);
    expect(pick('champions')).toBe(rec(a(), 'champions').affectedCount);
    expect(pick('spiky')).toBe(rec(a(), 'spiky').affectedCount);
    expect(pick('cost-center-coverage')).toBe(rec(a(), 'cost-center-coverage').affectedCount);
  });

  it('lets the idle-seats link select exactly the idle seats', () => {
    const r = rec(a(), 'idle-seats');
    const res = P.demo.run({ ...emptyFilters(), ...r.jump!.filters });
    expect(res.users.profiles.map((p) => p.id).sort()).toEqual(a().seats.idle.map((s) => s.id).sort());
  });

  it('lets the other links reproduce the numbers in the recommendation', () => {
    const t = a().agg.totals;
    const manual = P.demo.run({ ...emptyFilters(), ...rec(a(), 'auto-adoption').jump!.filters });
    expect(manual.agg.totals.gross).toBeCloseTo(t.gross - t.autoGross, 6);
    const powerful = P.demo.run({ ...emptyFilters(), ...rec(a(), 'model-rightsizing').jump!.filters });
    expect(powerful.agg.totals.gross).toBeCloseTo(t.tierGross[CATEGORIES.indexOf('Powerful')], 6);
    const day = P.demo.run({ ...emptyFilters(), ...rec(a(), 'anomalies').jump!.filters });
    expect(day.agg.totals.gross).toBeCloseTo(a().anomalies[0].gross, 6);
  });
});

describe('budget handling', () => {
  it('escalates the overage and the pool exhaustion when the projected bill breaks the budget', () => {
    const a = P['A with $100 budget'].analysis;
    expect(rec(a, 'overage').severity).toBe('critical');
    expect(rec(a, 'pool-exhaustion').severity).toBe('critical');
    expect(ids(a)).not.toContain('budgets');
    const line = rec(a, 'pool-exhaustion').evidence.find((l) => l.startsWith('Budget'))!;
    expect(line).toMatch(/^Budget \$100 for .+: 93% used so far, 158% projected, limit reached around Oct 22\.$/);
    expect(a.headline.status).toBe('action');
    expect(a.recs.filter((r) => r.severity === 'critical').map((r) => r.id)).toEqual(expect.arrayContaining(['overage', 'pool-exhaustion']));
    expect(recValue(a.recs[0])).toBe(Math.max(...a.recs.map(recValue)));
  });

  it('keeps the severities when the budget is large enough for the projected bill', () => {
    const a = pipelineOf(P['fixture A'].store, { settings: { budgetMonthlyBilled: 200 } }).analysis;
    expect(rec(a, 'overage').severity).toBe('high');
    expect(rec(a, 'pool-exhaustion').severity).toBe('high');
    const line = rec(a, 'pool-exhaustion').evidence.find((l) => l.startsWith('Budget'))!;
    expect(line).toMatch(/^Budget \$200 for .+: 47% used so far, 79% projected\.$/);
  });

  it('mentions a budget only when one is configured', () => {
    const none = rec(P['fixture A'].analysis, 'pool-exhaustion').evidence;
    expect(none.some((l) => l.startsWith('Budget'))).toBe(false);
  });
});

describe('narrowed scopes drop organization-wide statements', () => {
  const firstNamed = (p: Pipeline, dim: 'user' | 'costCenter'): string => p.store.dicts[dim].values.find((v) => v !== '')!;
  const NARROWING: { name: string; filters: (p: Pipeline) => Partial<Filters> }[] = [
    { name: 'models', filters: () => ({ models: ['GPT-6 Astra'] }) },
    { name: 'orgs', filters: () => ({ orgs: ['northwind-data'] }) },
    { name: 'users', filters: (p) => ({ users: [firstNamed(p, 'user')] }) },
    { name: 'products', filters: () => ({ products: ['copilot'] }) },
    { name: 'costCenters', filters: (p) => ({ costCenters: [firstNamed(p, 'costCenter')] }) },
    { name: 'plans', filters: () => ({ plans: ['Enterprise'] }) },
    { name: 'categories', filters: () => ({ categories: ['Powerful'] }) },
    { name: 'selection', filters: () => ({ selection: 'manual' }) },
    { name: 'billing', filters: () => ({ billing: 'billed' }) },
    { name: 'attribution', filters: () => ({ attribution: 'attributed' }) },
    { name: 'weekdays', filters: () => ({ weekdays: [0, 1, 2, 3, 4] }) },
    { name: 'tiers', filters: () => ({ tiers: ['power', 'runaway'] }) },
    { name: 'segments', filters: () => ({ segments: ['champion'] }) },
    { name: 'traits', filters: () => ({ traits: ['spiky'] }) },
    { name: 'paretoClasses', filters: () => ({ paretoClasses: ['A'] }) },
    { name: 'minUserSpend', filters: () => ({ minUserSpend: 20 }) },
  ];

  it.each(NARROWING)('$name: no pool, seat or healthy statements and cash is a lower bound', ({ filters }) => {
    const p = pipelineOf(P.demo.store, { filters: filters(P.demo) });
    const a = p.analysis;
    expect(a.narrowed).toBe(true);
    expect(a.agg.totals.rows).toBeGreaterThan(0);
    for (const id of POOL_RECS) expect(ids(a), id).not.toContain(id);
    for (const r of a.recs) expect(r.cashLowerBound, r.id).toBe(true);
    const notes = rec(a, 'data-notes').evidence.join(' ');
    expect(notes).not.toMatch(/The pool covered|Included credits only count/);
    expect(a.headline.detail).not.toMatch(/Pool utilization/);
    for (const t of analysisTexts(a)) expect(t).not.toMatch(BAD_TEXT);
  });

  it('a date-only filter keeps the organization-wide statements', () => {
    const a = P['demo last 20 days'].analysis;
    expect(a.narrowed).toBe(false);
    expect(ids(a)).toContain('data-notes');
    expect(a.headline.detail).toMatch(/^Pool utilization/);
  });

  it('forcing narrowed on an unfiltered context removes the pool and seat rules', () => {
    const base = buildRecommendations(ctxOf(P.demo));
    const forced = buildRecommendations(ctxOf(P.demo, { narrowed: true }));
    expect(base.map((r) => r.id)).toEqual(expect.arrayContaining(['pool-exhaustion', 'idle-seats', 'downgrade']));
    for (const id of POOL_RECS) expect(forced.map((r) => r.id), id).not.toContain(id);
  });

  it('values a narrowed scope per month from what was already billed in that scope', () => {
    const a = P['demo one model'].analysis;
    const t = a.agg.totals;
    const perMonth = 30.4375 / a.agg.range.length;
    for (const r of a.recs) expect(r.cashUsd, r.id).toBeLessThanOrEqual(t.net * perMonth + 1e-6);
  });
});

describe('empty scopes', () => {
  const EMPTY: { name: string; filters: (p: Pipeline) => Partial<Filters> }[] = [
    { name: 'a user that does not exist', filters: () => ({ users: ['nobody-here'] }) },
    { name: 'contradicting filters', filters: () => ({ models: ['GPT-6 Astra'], products: ['code_quality'] }) },
    { name: 'a minimum row amount above every row', filters: () => ({ minRow: 1e9 }) },
    { name: 'a text search without a match', filters: () => ({ search: 'zzz-no-such-text' }) },
  ];

  it.each(EMPTY)('$name: no recommendations and a clear headline', ({ filters }) => {
    const a = pipelineOf(P.demo.store, { filters: filters(P.demo) }).analysis;
    expect(a.agg.totals.rows).toBe(0);
    expect(a.recs).toEqual([]);
    expect(a.headline).toEqual({ status: 'watch', title: 'No rows match the current filters', detail: 'Widen the date range or clear some filters.' });
    for (const t of analysisTexts(a)) expect(t).not.toMatch(BAD_TEXT);
  });

  it('buildRecommendations returns nothing for an empty aggregate', () => {
    const a = pipelineOf(P.demo.store, { filters: { users: ['nobody-here'] } });
    expect(buildRecommendations(ctxOf(a))).toEqual([]);
  });
});

// Links that select users ----------------------------------------------------------------------------------------------------

describe('links that select users', () => {
  const WHOLE_SCOPE: CaseName[] = ['fixture A', 'fixture B', 'A + B', 'demo', 'demo with roster and budget', 'A with $100 budget'];
  // `concentration` counts the whole Pareto class A but lists only its top three.
  const COUNTED_BY_LINK = ['runaway', 'concentration', 'cache', 'cost-center-coverage', 'lapsed', 'new-users', 'champions', 'spiky', 'long-context'];
  const LISTS_THE_SAME_USERS = COUNTED_BY_LINK.filter((id) => id !== 'concentration');
  const USER_FILTER_KEYS = ['segments', 'tiers', 'engagement', 'profiles', 'traits', 'paretoClasses'];
  const follow = (p: Pipeline, r: Recommendation): Analysis => p.run({ ...emptyFilters(), ...r.jump!.filters });

  const checkLinks = (name: string, p: Pipeline): number => {
    let checked = 0;
    for (const r of p.analysis.recs) {
      if (!COUNTED_BY_LINK.includes(r.id) || !r.jump?.filters) continue;
      const where = `${name}: ${r.id} "${r.jump.label}"`;
      expect(Object.keys(r.jump.filters).some((k) => USER_FILTER_KEYS.includes(k)), where).toBe(true);
      const res = follow(p, r);
      expect(res.segmentFiltered, where).toBe(true);
      expect(res.users.profiles.length, where).toBe(r.affectedCount);
      if (LISTS_THE_SAME_USERS.includes(r.id)) {
        const selected = new Set(res.users.profiles.map((u) => u.name));
        for (const x of r.affected) expect(selected.has(x.name), `${where}: ${x.name}`).toBe(true);
        if (r.affectedCount <= 12) expect(r.affected.length, where).toBe(r.affectedCount);
      }
      checked++;
    }
    return checked;
  };

  it.each(WHOLE_SCOPE)('%s: every link that filters users selects exactly the users the recommendation counted', (name) => {
    expect(checkLinks(name, P[name])).toBeGreaterThan(0);
  });

  it('holds for synthetic data with several users per behaviour', async () => {
    for (const n of [1, 2, 3]) expect(checkLinks(`agreement ${n}`, await analyzeCsv(agreementCsv(n)))).toBeGreaterThanOrEqual(6);
  });

  describe('lapsed and new users are matched by flag, whatever their persona', () => {
    /** First/last day per user from the raw rows and the documented rules (lapsed after 7 quiet days, new within 14 days of the first row). */
    const lifecycle = (rows: NaiveRow[], lapsedDays = 7, newUserDays = 14): { fresh: string[]; lapsed: string[] } => {
      const days = rows.map((r) => dayNum(r.date));
      const minDay = Math.min(...days);
      const maxDay = Math.max(...days);
      const first = new Map<string, number>();
      const last = new Map<string, number>();
      for (const r of rows) {
        if (!r.username) continue;
        const d = dayNum(r.date);
        first.set(r.username, Math.min(first.get(r.username) ?? Infinity, d));
        last.set(r.username, Math.max(last.get(r.username) ?? -Infinity, d));
      }
      const fresh: string[] = [];
      const lapsed: string[] = [];
      for (const [user, f] of first) {
        if (maxDay - f + 1 <= newUserDays && f - minDay >= newUserDays) fresh.push(user);
        else if (maxDay - last.get(user)! >= lapsedDays) lapsed.push(user);
      }
      return { fresh: fresh.sort(), lapsed: lapsed.sort() };
    };
    const names = (a: Analysis): string[] => a.users.profiles.map((u) => u.name).sort();

    it('the links filter on the lifecycle flags', () => {
      expect(rec(P.demo.analysis, 'lapsed').jump?.filters).toEqual({ engagement: ['lapsed'] });
      for (const name of ['fixture A', 'demo'] as const) {
        expect(rec(P[name].analysis, 'new-users').jump?.filters, name).toEqual({ engagement: ['new'] });
      }
    });

    it('pool-used fixture: only sam-lee is new, nobody has lapsed, and the link finds the new user', () => {
      const p = P['fixture A'];
      const oracle = lifecycle(naiveRows(readFixture(FIXTURE_A)));
      expect(oracle).toEqual({ fresh: ['sam-lee'], lapsed: [] });
      expect(ids(p.analysis)).not.toContain('lapsed');
      const fresh = rec(p.analysis, 'new-users');
      expect(fresh.affected.map((x) => x.name)).toEqual(['sam-lee']);
      expect(names(follow(p, fresh))).toEqual(['sam-lee']);
    });

    it('a user who has lapsed and is also past three times their allotment is counted and found', async () => {
      const rows: RowSpec[] = SEP_WEEKDAYS.map((date) => terra({ date, user: 'veteran', gross: 1, costCenter: 'eng' }));
      for (const d of [1, 2, 3]) rows.push(terra({ date: sep(d), user: 'gone-runaway', gross: 30, costCenter: 'eng' }));
      const p = await analyzeCsv(makeCsv(rows, { pool: true }));
      const gone = p.analysis.users.profiles.find((u) => u.name === 'gone-runaway')!;
      expect([gone.lapsed, gone.persona]).toEqual([true, 'runaway']);
      const lapsed = rec(p.analysis, 'lapsed');
      expect(lapsed.affected.map((x) => x.name)).toEqual(['gone-runaway']);
      expect(lapsed.jump?.filters).toEqual({ engagement: ['lapsed'] });
      expect(names(follow(p, lapsed))).toEqual(['gone-runaway']);
      expect(rec(p.analysis, 'runaway').affected.map((x) => x.name)).toEqual(['gone-runaway']);
    });

    it('the demo: both links select the users that the rules find in the raw rows', () => {
      const p = P.demo;
      const oracle = lifecycle(naiveRows(demoCsv));
      expect(oracle.lapsed.length).toBeGreaterThan(0);
      expect(oracle.fresh.length).toBeGreaterThan(0);
      const lapsed = rec(p.analysis, 'lapsed');
      const fresh = rec(p.analysis, 'new-users');
      expect(lapsed.affectedCount).toBe(oracle.lapsed.length);
      expect(fresh.affectedCount).toBe(oracle.fresh.length);
      expect(names(follow(p, lapsed))).toEqual(oracle.lapsed);
      expect(names(follow(p, fresh))).toEqual(oracle.fresh);
    });

    it('a user who is new and also past three times their allotment is counted and found', async () => {
      const rows: RowSpec[] = SEP_WEEKDAYS.map((date) => terra({ date, user: 'veteran', gross: 1, costCenter: 'eng' }));
      for (const d of [24, 25, 28]) rows.push(terra({ date: sep(d), user: 'fast-newbie', gross: 30, costCenter: 'eng' }));
      const p = await analyzeCsv(makeCsv(rows, { pool: true }));
      const fast = p.analysis.users.profiles.find((u) => u.name === 'fast-newbie')!;
      expect([fast.isNew, fast.persona]).toEqual([true, 'runaway']);
      const fresh = rec(p.analysis, 'new-users');
      expect(fresh.affected.map((x) => x.name)).toEqual(['fast-newbie']);
      expect(fresh.jump?.filters).toEqual({ engagement: ['new'] });
      expect(names(follow(p, fresh))).toEqual(['fast-newbie']);
      expect(rec(p.analysis, 'runaway').affected.map((x) => x.name)).toEqual(['fast-newbie']);
    });
  });

  describe('long-context', () => {
    const lcNames = (a: Analysis): string[] => a.users.profiles.map((u) => u.name).sort();

    it.each(['fixture B', 'A + B'] as const)('%s: the one user with long-context rows holds the trait, and the link selects exactly them', (name) => {
      const p = P[name];
      const r = rec(p.analysis, 'long-context');
      const user = p.analysis.users.profiles.find((u) => u.name === 'pat-ops')!;
      expect(user.longShare).toBeGreaterThanOrEqual(p.settings.longContextShare);
      expect(user.traits).toContain('longContext');
      expect(r.affectedCount).toBe(1);
      expect(r.affected.map((x) => x.name)).toEqual(['pat-ops']);
      expect(lcNames(follow(p, r))).toEqual(['pat-ops']);
      expect(r.evidence).toContain('Most affected users: pat-ops.');
    });

    it('when nobody reaches the trait threshold, the link has no filters while the evidence still names the most affected user', async () => {
      const cc = { costCenter: 'eng' };
      const rows: RowSpec[] = [
        ...spread('light', 30, SEP_WEEKDAYS.slice(-15), cc),
        longRow(SEP_WEEKDAYS[2], 'light', cc),
        ...spread('none', 20, SEP_WEEKDAYS.slice(-10), cc),
      ];
      const p = await analyzeCsv(makeCsv(rows, { pool: true }));
      const r = rec(p.analysis, 'long-context');
      expect(p.analysis.users.profiles.some((u) => u.traits.includes('longContext'))).toBe(false);
      const user = p.analysis.users.profiles.find((u) => u.name === 'light')!;
      expect(user.longShare).toBeGreaterThan(0);
      expect(user.longShare).toBeLessThan(p.settings.longContextShare);
      expect(r.affectedCount).toBe(0);
      expect(r.affected).toEqual([]);
      expect(r.jump).toEqual({ page: 'efficiency', label: 'Open Efficiency' });
      expect(r.evidence).toContain('Most affected users: light.');
    });

    it('with a trait holder the link selects exactly the holders, while the evidence also lists users below the trait threshold', async () => {
      const cc = { costCenter: 'eng' };
      const rows: RowSpec[] = [
        ...spread('heavy', 15, SEP_WEEKDAYS.slice(-15), cc),
        longRow(SEP_WEEKDAYS[0], 'heavy', cc),
        longRow(SEP_WEEKDAYS[1], 'heavy', cc),
        ...spread('light', 30, SEP_WEEKDAYS.slice(-15), cc),
        longRow(SEP_WEEKDAYS[2], 'light', cc),
        ...spread('none', 20, SEP_WEEKDAYS.slice(-10), cc),
      ];
      const p = await analyzeCsv(makeCsv(rows, { pool: true }));
      const by = new Map(p.analysis.users.profiles.map((u) => [u.name, u]));
      expect(by.get('heavy')!.longShare).toBeCloseTo(6 / 27, 6);
      expect(by.get('light')!.longShare).toBeCloseTo(3 / 36, 6);
      expect(by.get('none')!.longShare).toBe(0);
      const r = rec(p.analysis, 'long-context');
      expect(r.title).toBe('Long-context surcharges cost at least $9');
      expect(r.evidence).toContain('Most affected users: heavy, light.');
      expect(r.affectedCount).toBe(1);
      expect(r.affected.map((x) => x.name)).toEqual(['heavy']);
      expect(r.jump).toEqual({ page: 'efficiency', label: 'Show long-context users', filters: { traits: ['longContext'] } });
      expect(lcNames(follow(p, r))).toEqual(['heavy']);
    });
  });
});

describe('buildHeadline', () => {
  const craft = (severity: Severity): Recommendation => ({ ...P.demo.analysis.recs[0], severity });

  it('turns critical or high recommendations into an action headline with the billed overage', () => {
    const ctx = ctxOf(P.demo);
    expect(buildHeadline(ctx, [craft('critical')])).toMatchObject({ status: 'action', title: '$123 billed overage and 1 high-priority action' });
    expect(buildHeadline(ctx, [craft('high'), craft('critical'), craft('medium')])).toMatchObject({
      status: 'action',
      title: '$123 billed overage and 2 high-priority actions',
    });
  });

  it('leaves out the overage when nothing was billed', () => {
    expect(buildHeadline(ctxOf(P['fixture B']), [craft('high')]).title).toBe('1 high-priority action');
  });

  it('is a watch headline for medium items only and healthy otherwise', () => {
    const ctx = ctxOf(P.demo);
    expect(buildHeadline(ctx, [craft('medium')])).toMatchObject({ status: 'watch', title: 'No urgent issues, 1 item worth a look' });
    expect(buildHeadline(ctx, [craft('medium'), craft('medium'), craft('low')])).toMatchObject({ status: 'watch', title: 'No urgent issues, 2 items worth a look' });
    expect(buildHeadline(ctx, [craft('low'), craft('info'), craft('positive')])).toMatchObject({ status: 'healthy', title: 'Usage looks healthy' });
    expect(buildHeadline(ctx, [])).toMatchObject({ status: 'healthy', title: 'Usage looks healthy' });
  });

  it('shows the pool utilization only for an organization-wide scope with a known pool', () => {
    expect(buildHeadline(ctxOf(P.demo), []).detail).toMatch(/^Pool utilization \d+% · Auto 21% of usage · 60 active users$/);
    expect(buildHeadline(ctxOf(P.demo, { narrowed: true }), []).detail).toBe('Auto 21% of usage · 60 active users');
    expect(buildHeadline(ctxOf(P['fixture B']), []).detail).toBe('Auto 0% of usage · 1 active user');
  });

  it('is described, part by part and in the same order, by the status banner doc', () => {
    const second = metricDoc('headline-status')?.steps?.at(-1) ?? '';
    const at = [/pool utilization/i, /share of usage that went through Auto/i, /number of active users/i].map((re) => second.search(re));
    expect(at.every((i) => i >= 0), second).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });
});

// How each number is calculated ----------------------------------------------------------------------------------------

const RULES_SOURCE = readFileSync(fileURLToPath(new URL('../src/lib/analytics/recommendations.ts', import.meta.url)), 'utf8');
const RULE_IDS = [...RULES_SOURCE.matchAll(/^\s+id: '([a-z]+(?:-[a-z]+)*)',$/gm)].map((m) => m[1]);

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const calcLabel = (...ids: string[]): string => `How this is calculated: ${ids.map((id) => escapeHtml(metricDoc(id)?.title ?? `missing ${id}`)).join(', ')}`;
const labelsIn = (html: string): string[] => [...html.matchAll(/aria-label="(How this is calculated: [^"]*)"/g)].map((m) => m[1]);
const renderIn = (p: Pipeline, el: ReactElement): string =>
  renderToStaticMarkup(
    createElement(AnalysisProvider, {
      dataset: { store: p.store, prep: p.prep, label: 'synthetic.csv', loadedAt: 0 },
      children: el,
    }),
  );

describe('calculation docs', () => {
  let poolUnknown: Pipeline;
  let noBilling: Pipeline;

  beforeAll(async () => {
    // Covered usage above what the seats of the file fund: the pool size is unknown, but the billed split is there.
    poolUnknown = await analyzeCsv(makeCsv([terra({ date: sep(10), user: 'a', gross: 30, discount: 30 }), terra({ date: sep(20), user: 'a', gross: 5, discount: 5 })]));
    noBilling = await analyzeCsv(makeCsv([terra({ date: sep(10), user: 'a', gross: 30 }), terra({ date: sep(20), user: 'a', gross: 5 })], { columns: ['date', 'username', 'gross_amount', 'model'] }));
  });

  it('finds every rule of the engine in its source', () => {
    expect(RULE_IDS.length).toBeGreaterThanOrEqual(27);
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  it('has one doc for every rule, named after it', () => {
    for (const id of RULE_IDS) {
      expect(recDocId(id), id).toBe(`rec-${id}`);
      const doc = metricDoc(recDocId(id));
      expect(doc, `no doc for the rule "${id}"`).toBeDefined();
      expect(doc?.area, id).toBe('Recommendations');
    }
  });

  it.each(CASES)('every recommendation of %s carries the doc of its rule', (name) => {
    for (const r of P[name].analysis.recs) {
      expect(r.calc, r.id).toBe(recDocId(r.id));
      expect(metricDoc(r.calc ?? ''), r.id).toBeDefined();
    }
  });

  it('points the seat actions and the simulator levers at existing docs', () => {
    expect(Object.keys(SEAT_DOC).sort()).toEqual(['downgrade', 'reclaimIdle', 'reclaimUnused']);
    expect(Object.keys(LEVER_DOC).sort()).toEqual(['autoAdoption', 'cacheDiscipline', 'capRunaway', 'contextHygiene', 'longContext', 'modelShift']);
    for (const id of [...Object.values(SEAT_DOC), ...Object.values(LEVER_DOC)]) expect(metricDoc(id), id).toBeDefined();
  });

  it('opens the doc of its rule from every card, and the confidence doc from an open card', () => {
    for (const r of P.demo.analysis.recs) {
      const closed = labelsIn(renderToStaticMarkup(createElement(RecommendationCard, { rec: r })));
      expect(closed, r.id).toEqual([calcLabel(recDocId(r.id))]);
    }
    const first = P.demo.analysis.recs[0];
    const open = labelsIn(renderToStaticMarkup(createElement(RecommendationCard, { rec: first, defaultOpen: true })));
    expect(open).toEqual([calcLabel(recDocId(first.id)), calcLabel('rec-confidence')]);
  });

  it('explains the figures of the seat economics and the three seat lists', () => {
    const labels = labelsIn(renderIn(P.demo, createElement(SeatsTab)));
    for (const id of ['rec-seats-in-report', 'rec-seat-value', 'rec-pool-share-used', 'rec-pool-unused', 'rec-seat-lists-value']) {
      expect(labels, id).toContain(calcLabel(id));
    }
    for (const id of Object.values(SEAT_DOC)) expect(labels.some((l) => l.includes(escapeHtml(metricDoc(id)!.title))), id).toBe(true);
  });

  it.each([
    ['a known pool', () => P.demo, ['rec-sim-reduction', 'rec-sim-cash-month', 'rec-sim-cash-year', 'rec-sim-cost', 'rec-sim-unused', 'rec-sim-seat-value']],
    ['an unknown pool size', () => poolUnknown, ['rec-sim-reduction', 'rec-sim-cash-month', 'rec-sim-cash-year', 'rec-sim-billed', 'rec-sim-usage-after']],
    ['a file without the billed split', () => noBilling, ['rec-sim-reduction', 'rec-sim-usage-after']],
  ])('explains every result of the simulator for %s', (_name, pipe, expected) => {
    const p = pipe();
    const html = renderIn(p, createElement(SimulatorTab, { levers: DEFAULT_LEVERS, onLevers: () => undefined, seatFlags: DEFAULT_SEAT_FLAGS, onSeatFlags: () => undefined }));
    const labels = labelsIn(html);
    for (const id of expected) expect(labels, id).toContain(calcLabel(id));
    expect(html).not.toMatch(BAD_TEXT);
  });

  it('puts the three result sets under the right conditions', () => {
    expect(cashHiddenReason(P.demo.analysis)).toBeNull();
    expect(poolUnknownReason(P.demo.analysis)).toBeNull();
    expect(cashHiddenReason(poolUnknown.analysis)).toBeNull();
    expect(poolUnknownReason(poolUnknown.analysis)).not.toBeNull();
    expect(cashHiddenReason(noBilling.analysis)).not.toBeNull();
  });

  it('explains the presets, each lever, each seat switch, the waterfall and the month table', () => {
    const html = renderIn(
      P.demo,
      createElement(SimulatorTab, { levers: DEFAULT_LEVERS, onLevers: () => undefined, seatFlags: DEFAULT_SEAT_FLAGS, onSeatFlags: () => undefined }),
    );
    const labels = labelsIn(html);
    for (const id of ['rec-sim-presets', 'rec-sim-waterfall', 'rec-sim-months']) expect(labels, id).toContain(calcLabel(id));
    for (const id of Object.values(LEVER_DOC)) expect(labels, id).toContain(calcLabel(id, 'rec-sim-levers'));
    for (const id of Object.values(SEAT_DOC)) expect(labels, id).toContain(calcLabel(id));
  });

  it('explains the saving of every playbook item', () => {
    const html = renderIn(P.demo, createElement(PlaybookTab));
    expect(labelsIn(html)).toContain(calcLabel('rec-playbook-saving'));
    expect(html).not.toMatch(BAD_TEXT);
  });
});

// Personal tips -------------------------------------------------------------------------------------------------------------

describe('personal tips: the largest saving comes first, equal savings go by severity', () => {
  const TIP_RANK = { high: 0, medium: 1, low: 2, positive: 3 } as const;
  const ZERO_BY = { modelShift: 0, autoAdoption: 0, cacheDiscipline: 0, contextHygiene: 0, longContext: 0, capRunaway: 0 };
  /** A user with nothing to say; each test switches on the traits it needs. */
  const neutral = (over: Partial<UserProfile> = {}, by: Partial<UserProfile['potentialBy']> = {}): UserProfile => ({
    ...P.demo.analysis.population.profiles[0],
    gross: 10,
    utilization: 0.7,
    tier: 'core',
    persona: 'steady',
    profile: 'balanced',
    isNew: false,
    lapsed: false,
    traits: [],
    powerfulShare: 0,
    autoShare: 1,
    cacheHit: 0.9,
    ...over,
    potentialBy: { ...ZERO_BY, ...by },
  });
  const tipIds = (p: UserProfile, limit = 100): string[] => userTips(p, P.demo.settings, limit).map((x) => x.id);

  it('shows a $0.49 a month tip before a $0.10 a month tip, although the smaller one has the higher severity', () => {
    const p = neutral({ traits: ['lowCache'] }, { cacheDiscipline: 0.1, contextHygiene: 0.49 });
    const tips = userTips(p, P.demo.settings);
    expect(tips.map((x) => [x.id, x.severity, x.savingsUsd])).toEqual([
      ['context', 'low', 0.49],
      ['cache', 'medium', 0.1],
    ]);
  });

  it('puts tips with the same saving in severity order, and keeps the written order for equal severities', () => {
    const p = neutral({ tier: 'runaway', isNew: true, traits: ['spiky', 'multiModel', 'noCostCenter'] });
    const tips = userTips(p, P.demo.settings, 100);
    expect(tips.every((x) => x.savingsUsd === 0)).toBe(true);
    expect(tips.map((x) => x.id)).toEqual(['runaway', 'spiky', 'multi-model', 'cost-center', 'new']);
    expect(tips.map((x) => x.severity)).toEqual(['high', 'low', 'low', 'low', 'positive']);
  });

  it('values a tip by its saving only: a high severity tip that saves nothing follows the ones that save something', () => {
    const p = neutral({ tier: 'runaway', traits: ['lowAuto', 'lowCache'], autoShare: 0, cacheHit: 0.1 }, { autoAdoption: 0.2, cacheDiscipline: 0.6 });
    expect(tipIds(p)).toEqual(['cache', 'auto', 'runaway']);
  });

  it('keeps the biggest saving when the list is cut', () => {
    const p = neutral(
      { tier: 'runaway', powerfulShare: 0.9, profile: 'frontier', traits: ['lowAuto', 'lowCache', 'longContext'], autoShare: 0, cacheHit: 0.1, longShare: 0.3 },
      { modelShift: 2, autoAdoption: 1, cacheDiscipline: 0.5, contextHygiene: 0.4, longContext: 0.3, capRunaway: 3 },
    );
    expect(tipIds(p)).toEqual(['runaway', 'model', 'auto', 'cache', 'context', 'long-context']);
    expect(tipIds(p, 1)).toEqual(['runaway']);
    expect(tipIds(p, 3)).toEqual(['runaway', 'model', 'auto']);
  });

  it('holds for every user of the demo: saving never goes up from one tip to the next, and ties follow severity', () => {
    for (const p of P.demo.analysis.population.profiles) {
      const all = userTips(p, P.demo.settings, 100);
      expect(userTips(p, P.demo.settings)).toEqual(all.slice(0, 6));
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1];
        const b = all[i];
        const ok = a.savingsUsd > b.savingsUsd || (a.savingsUsd === b.savingsUsd && TIP_RANK[a.severity] <= TIP_RANK[b.severity]);
        expect(ok, `${p.name}: ${a.id} ($${a.savingsUsd}) before ${b.id} ($${b.savingsUsd})`).toBe(true);
      }
    }
  });
});
