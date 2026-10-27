import { beforeAll, describe, expect, it } from 'vitest';
import {
  DIM_FILTER_KEY,
  POST_LIST_KEYS,
  activeBaseFilterCount,
  activeFilterCount,
  andMasks,
  buildMask,
  emptyFilters,
  hasPostFilters,
  maskCount,
  type Filters,
} from '../src/lib/analytics/filters';
import { facetCounts, type FacetKey } from '../src/lib/analytics/series';
import { buildStore } from '../src/lib/csv/ingest';
import { generateDemo } from '../src/lib/demo/generate';
import { PRICE_CARD, VENDORS } from '../src/lib/pricing/card';
import { CATEGORIES, DIM_KEYS } from '../src/lib/types';
import {
  analyzeCsv,
  dayNum,
  groupSum,
  isAutoRow,
  makeCsv,
  modelOfRow,
  naiveRows,
  numOf,
  pipelineOf,
  sum,
  weekdayOf,
  type NaiveRow,
  type Pipeline,
} from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures, readFixture } from './fixtures';

const demo = generateDemo();
const rows = naiveRows(demo.csv);

const vendorOf = (model: string): string => PRICE_CARD.find((c) => c.name === model)?.vendor ?? 'Other';
const categoryOf = (model: string): string => PRICE_CARD.find((c) => c.name === model)?.category ?? 'Unknown';
const planOfQuota = (q: number): string => (q <= 0 ? 'No quota' : q === 1900 ? 'Business' : q === 3900 ? 'Enterprise' : `Custom (${q.toLocaleString('en-US')} credits)`);
const uniq = (xs: string[]): string[] => [...new Set(xs)].sort();

const userNames = uniq(rows.map((r) => r.username).filter(Boolean));
const modelNames = uniq(rows.map(modelOfRow));
const orgNames = uniq(rows.map((r) => r.organization).filter(Boolean));
const ccNames = uniq(rows.map((r) => r.cost_center_name).filter(Boolean));
const repoNames = uniq(rows.map((r) => r.repository).filter(Boolean));
const D = (iso: string): number => dayNum(iso);

/** Independent implementation of the filter contract, used as the oracle for every test below. */
function predOf(f: Partial<Filters>): (r: NaiveRow) => boolean {
  const tokens = (f.search ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return (r) => {
    const day = dayNum(r.date);
    const model = modelOfRow(r);
    const gross = numOf(r, 'gross_amount');
    const billed = numOf(r, 'net_amount') > 1e-9;
    if (f.dateFrom != null && day < f.dateFrom) return false;
    if (f.dateTo != null && day > f.dateTo) return false;
    if (f.users?.length && !f.users.includes(r.username)) return false;
    if (f.products?.length && !f.products.includes(r.product)) return false;
    if (f.skus?.length && !f.skus.includes(r.sku)) return false;
    if (f.models?.length && !f.models.includes(model)) return false;
    if (f.vendors?.length && !f.vendors.includes(vendorOf(model))) return false;
    if (f.categories?.length && !f.categories.includes(categoryOf(model))) return false;
    if (f.orgs?.length && !f.orgs.includes(r.organization)) return false;
    if (f.costCenters?.length && !f.costCenters.includes(r.cost_center_name)) return false;
    if (f.repos?.length && !f.repos.includes(r.repository)) return false;
    if (f.apps?.length && !f.apps.includes(r.app_client_id)) return false;
    if (f.plans?.length && !f.plans.includes(planOfQuota(numOf(r, 'total_monthly_quota')))) return false;
    if (f.weekdays?.length && !f.weekdays.includes(weekdayOf(r.date))) return false;
    if (f.selection === 'auto' && !isAutoRow(r)) return false;
    if (f.selection === 'manual' && isAutoRow(r)) return false;
    if (f.billing === 'billed' && !billed) return false;
    if (f.billing === 'covered' && billed) return false;
    if (f.attribution === 'attributed' && !r.username) return false;
    if (f.attribution === 'unattributed' && r.username) return false;
    if (f.minRow != null && gross < f.minRow) return false;
    if (f.maxRow != null && gross > f.maxRow) return false;
    if (tokens.length) {
      const hay = [r.username, model, r.organization, r.cost_center_name, r.repository, r.product].map((s) => s.toLowerCase());
      if (!tokens.every((t) => hay.some((h) => h.includes(t)))) return false;
    }
    return true;
  };
}

let p: Pipeline;

beforeAll(async () => {
  p = pipelineOf(await buildStore([{ name: 'demo.csv', data: demo.csv }]));
});

const maskOf = (f: Partial<Filters>): Uint8Array | null => buildMask(p.store, p.prep, p.models, { ...emptyFilters(), ...f });

function scope(f: Partial<Filters>): { count: number; gross: number } {
  const mask = maskOf(f);
  let count = 0;
  let gross = 0;
  for (let i = 0; i < p.store.n; i++) {
    if (mask === null || mask[i] === 1) {
      count++;
      gross += p.store.gross[i];
    }
  }
  return { count, gross };
}

const expected = (f: Partial<Filters>): { count: number; gross: number } => {
  const rs = rows.filter(predOf(f));
  return { count: rs.length, gross: sum(rs.map((r) => numOf(r, 'gross_amount'))) };
};

interface Case {
  name: string;
  f: Partial<Filters>;
  /** The filter legitimately selects nothing. */
  empty?: boolean;
}

const CASES: Case[] = [
  { name: 'one user', f: { users: [userNames[3]] } },
  { name: 'several users', f: { users: [userNames[0], userNames[10], userNames[30]] } },
  { name: 'blank user (repo-level rows)', f: { users: [''] } },
  { name: 'one product', f: { products: ['code_quality'] } },
  { name: 'two products', f: { products: ['code_quality', 'ghas'] } },
  { name: 'sku', f: { skus: ['code_security_ai_credit'] } },
  { name: 'model (manual and Auto rows)', f: { models: [modelNames[0]] } },
  { name: 'two models', f: { models: [modelNames[1], modelNames[2]] } },
  { name: 'vendor', f: { vendors: ['Anthropic'] } },
  { name: 'two vendors', f: { vendors: ['Anthropic', 'Google'] } },
  { name: 'category Powerful', f: { categories: ['Powerful'] } },
  { name: 'category Lightweight', f: { categories: ['Lightweight'] } },
  { name: 'vendor AND category', f: { vendors: ['Anthropic'], categories: ['Powerful'] } },
  { name: 'vendor AND a model of another vendor', f: { vendors: ['Anthropic'], models: ['GPT-6 Astra'] }, empty: true },
  { name: 'vendor AND a model of that vendor', f: { vendors: ['OpenAI'], models: ['GPT-6 Astra'] } },
  { name: 'organisation', f: { orgs: [orgNames[0]] } },
  { name: 'two organisations', f: { orgs: [orgNames[0], orgNames[2]] } },
  { name: 'cost center', f: { costCenters: [ccNames[0]] } },
  { name: 'repository', f: { repos: [repoNames[0]] } },
  { name: 'plan Business', f: { plans: ['Business'] } },
  { name: 'plan Enterprise', f: { plans: ['Enterprise'] } },
  { name: 'plan No quota (repo-level rows)', f: { plans: ['No quota'] } },
  { name: 'weekdays Mon+Tue', f: { weekdays: [0, 1] } },
  { name: 'weekend', f: { weekdays: [5, 6] } },
  { name: 'out-of-range weekday numbers', f: { weekdays: [7, -1] }, empty: true },
  { name: 'selection auto', f: { selection: 'auto' } },
  { name: 'selection manual', f: { selection: 'manual' } },
  { name: 'billing billed', f: { billing: 'billed' } },
  { name: 'billing covered', f: { billing: 'covered' } },
  { name: 'attribution attributed', f: { attribution: 'attributed' } },
  { name: 'attribution unattributed', f: { attribution: 'unattributed' } },
  { name: 'minRow', f: { minRow: 5 } },
  { name: 'maxRow', f: { maxRow: 0.5 } },
  { name: 'minRow and maxRow', f: { minRow: 1, maxRow: 10 } },
  { name: 'minRow above every row', f: { minRow: 1e9 }, empty: true },
  { name: 'search by user (case-insensitive substring)', f: { search: userNames[2].slice(1, 6).toUpperCase() } },
  { name: 'search by model', f: { search: 'opus' } },
  { name: 'search by organisation', f: { search: 'NORTHWIND-DATA' } },
  { name: 'search by product', f: { search: 'ghas' } },
  { name: 'search by cost center', f: { search: ccNames[0].slice(0, 4) } },
  { name: 'search by repository', f: { search: repoNames[0].slice(0, 4) } },
  { name: 'search with two tokens (AND across dimensions)', f: { search: 'opus northwind-data' } },
  { name: 'search that matches nothing', f: { search: 'zzz-not-there' }, empty: true },
  { name: 'dateFrom', f: { dateFrom: D('2026-10-10') } },
  { name: 'dateTo', f: { dateTo: D('2026-09-20') } },
  { name: 'date range', f: { dateFrom: D('2026-09-15'), dateTo: D('2026-10-05') } },
  { name: 'a single day', f: { dateFrom: D('2026-10-13'), dateTo: D('2026-10-13') } },
  { name: 'inverted range', f: { dateFrom: D('2026-10-10'), dateTo: D('2026-10-01') }, empty: true },
  { name: 'range outside the data', f: { dateFrom: D('2027-01-01'), dateTo: D('2027-02-01') }, empty: true },
  { name: 'unknown user', f: { users: ['no-such-user'] }, empty: true },
  { name: 'unknown vendor', f: { vendors: ['Nope'] }, empty: true },
  { name: 'unknown plan', f: { plans: ['Platinum'] }, empty: true },
  {
    name: 'combination: user + model + dates + billing',
    f: { users: [userNames[0], userNames[1], userNames[2], userNames[3], userNames[4], userNames[5]], vendors: ['Anthropic', 'OpenAI'], dateFrom: D('2026-09-10'), dateTo: D('2026-10-20'), billing: 'covered' },
  },
  {
    name: 'combination: org + plan + weekdays + selection + minRow',
    f: { orgs: [orgNames[0], orgNames[1]], plans: ['Enterprise', 'Business'], weekdays: [0, 1, 2, 3, 4], selection: 'manual', minRow: 0.5 },
  },
  { name: 'combination: attribution + search + category', f: { attribution: 'attributed', search: 'northwind', categories: ['Powerful', 'Versatile'] } },
];

describe('buildMask on the demo dataset', () => {
  it.each(CASES)('$name selects exactly the rows (and gross) the naive filter selects', ({ f, empty }) => {
    const got = scope(f);
    const want = expected(f);
    expect(got.count).toBe(want.count);
    expect(got.gross).toBeCloseTo(want.gross, 6);
    if (empty) {
      expect(got.count).toBe(0);
      expect(maskOf(f)).not.toBeNull();
    } else {
      expect(got.count).toBeGreaterThan(0);
      expect(got.count).toBeLessThan(rows.length);
    }
  });

  it('filters combine with AND: the result is the intersection of the single-filter results', () => {
    const a = maskOf({ orgs: [orgNames[0]] })!;
    const b = maskOf({ billing: 'covered' })!;
    const c = maskOf({ weekdays: [0, 1, 2, 3, 4] })!;
    const both = maskOf({ orgs: [orgNames[0]], billing: 'covered', weekdays: [0, 1, 2, 3, 4] })!;
    for (let i = 0; i < p.store.n; i++) expect(both[i]).toBe(a[i] & b[i] & c[i]);
    expect(maskCount(both, p.store.n)).toBeLessThan(maskCount(a, p.store.n));
  });

  it('is null when no row filter is active (post filters, blank search and "all" modes do not count)', () => {
    expect(maskOf({})).toBeNull();
    expect(maskOf({ search: '   \t ' })).toBeNull();
    expect(maskOf({ selection: 'all', billing: 'all', attribution: 'all' })).toBeNull();
    expect(maskOf({ tiers: ['runaway'], segments: ['champion'], traits: ['spiky'], paretoClasses: ['A'], minUserSpend: 5, maxUserSpend: 500 })).toBeNull();
  });

  it('is not null as soon as one row filter is active, even an empty-looking one', () => {
    expect(maskOf({ dateTo: p.store.maxDay })).not.toBeNull();
    expect(maskOf({ minRow: 0 })).not.toBeNull();
    expect(maskOf({ maxRow: 1e12 })).not.toBeNull();
    expect(maskOf({ users: ['no-such-user'] })).not.toBeNull();
  });

  it('inclusive row-spend bounds keep rows exactly at the bound', () => {
    const g = Array.from(p.store.gross).sort((x, y) => x - y);
    const mid = g[Math.floor(g.length / 2)];
    const ge = g.filter((x) => x >= mid).length;
    const le = g.filter((x) => x <= mid).length;
    expect(scope({ minRow: mid }).count).toBe(ge);
    expect(scope({ maxRow: mid }).count).toBe(le);
    expect(scope({ minRow: mid, maxRow: mid }).count).toBe(g.filter((x) => x === mid).length);
  });

  it('a blank user selection is the same set as attribution = unattributed', () => {
    expect(maskOf({ users: [''] })).toEqual(maskOf({ attribution: 'unattributed' }));
  });

  it('skip leaves exactly one filter out', () => {
    const f = { ...emptyFilters(), users: [userNames[0]], models: [modelNames[0]], dateFrom: D('2026-09-15'), dateTo: D('2026-10-05') };
    const mine = (skip: keyof Filters | null): number => maskCount(buildMask(p.store, p.prep, p.models, f, skip), p.store.n);
    expect(mine('users')).toBe(expected({ models: f.models, dateFrom: f.dateFrom, dateTo: f.dateTo }).count);
    expect(mine('models')).toBe(expected({ users: f.users, dateFrom: f.dateFrom, dateTo: f.dateTo }).count);
    expect(mine('dateFrom')).toBe(expected({ users: f.users, models: f.models, dateTo: f.dateTo }).count);
    expect(mine('dateTo')).toBe(expected({ users: f.users, models: f.models, dateFrom: f.dateFrom }).count);
    expect(mine(null)).toBe(expected(f).count);
  });
});

describe('buildMask: custom plans and app ids (synthetic data)', () => {
  let s: Pipeline;
  beforeAll(async () => {
    s = await analyzeCsv(
      makeCsv([
        { date: '2026-10-01', user: 'u1', gross: 1, app: 'app-1', quota: 1000 },
        { date: '2026-10-02', user: 'u2', gross: 2, app: 'app-2', quota: 1900 },
        { date: '2026-10-03', user: 'u3', gross: 3, quota: 3900 },
        { date: '2026-10-04', user: '', gross: 4, product: 'ghas', sku: 'code_security_ai_credit', repo: 'org/repo-x' },
      ]),
    );
  });
  const count = (f: Partial<Filters>): number => maskCount(buildMask(s.store, s.prep, s.models, { ...emptyFilters(), ...f }), s.store.n);

  it('plans: Business, Enterprise, No quota and Custom (n credits) labels', () => {
    expect([...s.prep.planLabels].sort()).toEqual(['Business', 'Custom (1,000 credits)', 'Enterprise', 'No quota']);
    expect(count({ plans: ['Business'] })).toBe(1);
    expect(count({ plans: ['Enterprise'] })).toBe(1);
    expect(count({ plans: ['No quota'] })).toBe(1);
    expect(count({ plans: ['Custom (1,000 credits)'] })).toBe(1);
    expect(count({ plans: ['Business', 'Enterprise', 'No quota', 'Custom (1,000 credits)'] })).toBe(4);
  });

  it('apps: selects by app client id, and blank selects rows without one', () => {
    expect(count({ apps: ['app-1'] })).toBe(1);
    expect(count({ apps: ['app-1', 'app-2'] })).toBe(2);
    expect(count({ apps: [''] })).toBe(2);
    expect(count({ apps: ['app-3'] })).toBe(0);
  });

  it('repos and products work on repo-level rows', () => {
    expect(count({ repos: ['org/repo-x'] })).toBe(1);
    expect(count({ products: ['ghas'] })).toBe(1);
    expect(count({ products: ['ghas'], attribution: 'attributed' })).toBe(0);
  });
});

describe('buildMask: source files (both fixtures)', () => {
  it('selects the rows of one file, several files, or none', async () => {
    const ab = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
    const nA = naiveRows(readFixture(FIXTURE_A)).length;
    const nB = naiveRows(readFixture(FIXTURE_B)).length;
    const count = (f: Partial<Filters>): number => maskCount(buildMask(ab.store, ab.prep, ab.models, { ...emptyFilters(), ...f }), ab.store.n);
    expect(count({ files: [FIXTURE_A] })).toBe(nA);
    expect(count({ files: [FIXTURE_B] })).toBe(nB);
    expect(count({ files: [FIXTURE_A, FIXTURE_B] })).toBe(nA + nB);
    expect(count({ files: ['other.csv'] })).toBe(0);
    expect(count({ files: [FIXTURE_B], attribution: 'unattributed' })).toBeGreaterThan(0);
    expect(count({ files: [FIXTURE_A], attribution: 'unattributed' })).toBe(0);
    const f = facetCounts(ab.store, ab.prep, ab.models, { ...emptyFilters(), files: [FIXTURE_A] }, 'files');
    const idA = ab.store.dicts.file.index.get(FIXTURE_A)!;
    const idB = ab.store.dicts.file.index.get(FIXTURE_B)!;
    expect(f.rows[idA]).toBe(nA);
    expect(f.rows[idB]).toBe(nB);
  });
});

describe('maskCount and andMasks', () => {
  it('maskCount of null is the row count, otherwise the number of ones', () => {
    expect(maskCount(null, 17)).toBe(17);
    expect(maskCount(new Uint8Array([1, 0, 1, 1, 0]), 5)).toBe(3);
    expect(maskCount(new Uint8Array(0), 0)).toBe(0);
  });

  it('andMasks passes the mask through when no user restriction is given', () => {
    const user = new Int32Array([0, 1, 2, 1]);
    expect(andMasks(null, null, user)).toBeNull();
    const m = new Uint8Array([1, 0, 1, 1]);
    expect(andMasks(m, null, user)).toBe(m);
  });

  it('andMasks intersects the row mask with the allowed users', () => {
    const user = new Int32Array([0, 1, 2, 1, 2]);
    const allowed = new Uint8Array([0, 1, 0]);
    expect(Array.from(andMasks(null, allowed, user)!)).toEqual([0, 1, 0, 1, 0]);
    const m = new Uint8Array([1, 0, 1, 1, 1]);
    expect(Array.from(andMasks(m, allowed, user)!)).toEqual([0, 0, 0, 1, 0]);
  });

  it('on real data the combined mask equals the naive intersection', () => {
    const base = maskOf({ billing: 'covered' })!;
    const id = p.store.dicts.user.index.get(userNames[0])!;
    const allowed = new Uint8Array(p.store.dicts.user.values.length);
    allowed[id] = 1;
    const both = andMasks(base, allowed, p.store.user)!;
    expect(maskCount(both, p.store.n)).toBe(expected({ billing: 'covered', users: [userNames[0]] }).count);
  });
});

describe('active filter counting', () => {
  it('counts nothing for the empty filter set', () => {
    const f = emptyFilters();
    expect(activeBaseFilterCount(f)).toBe(0);
    expect(activeFilterCount(f)).toBe(0);
    expect(hasPostFilters(f)).toBe(false);
  });

  it('counts the date range once, however many ends are set', () => {
    expect(activeBaseFilterCount({ ...emptyFilters(), dateFrom: 5 })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), dateTo: 5 })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), dateFrom: 5, dateTo: 9 })).toBe(1);
  });

  it('counts each list filter once regardless of how many values it holds', () => {
    for (const k of ['users', 'products', 'skus', 'models', 'vendors', 'categories', 'orgs', 'costCenters', 'repos', 'apps', 'files', 'plans'] as const) {
      expect(activeBaseFilterCount({ ...emptyFilters(), [k]: ['a', 'b', 'c'] }), k).toBe(1);
    }
    expect(activeBaseFilterCount({ ...emptyFilters(), weekdays: [0, 1, 2] })).toBe(1);
  });

  it('counts each non-default mode and the row-spend bounds as one', () => {
    expect(activeBaseFilterCount({ ...emptyFilters(), selection: 'auto' })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), billing: 'billed' })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), attribution: 'attributed' })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), minRow: 1 })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), minRow: 1, maxRow: 2 })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), search: '  ' })).toBe(0);
    expect(activeBaseFilterCount({ ...emptyFilters(), search: ' x ' })).toBe(1);
  });

  it('post filters are counted separately and flag hasPostFilters', () => {
    for (const k of POST_LIST_KEYS) {
      const f = { ...emptyFilters(), [k]: ['x'] };
      expect(hasPostFilters(f), k).toBe(true);
      expect(activeBaseFilterCount(f), k).toBe(0);
      expect(activeFilterCount(f), k).toBe(1);
    }
    const spend = { ...emptyFilters(), minUserSpend: 1, maxUserSpend: 9 };
    expect(hasPostFilters(spend)).toBe(true);
    expect(activeFilterCount(spend)).toBe(1);
    expect(hasPostFilters({ ...emptyFilters(), maxUserSpend: 0 })).toBe(true);
  });

  it('adds everything up', () => {
    const f: Filters = {
      ...emptyFilters(),
      dateFrom: 1,
      users: ['a'],
      models: ['m'],
      weekdays: [1],
      selection: 'manual',
      billing: 'covered',
      attribution: 'attributed',
      minRow: 1,
      search: 'q',
      tiers: ['light'],
      traits: ['spiky'],
      maxUserSpend: 4,
    };
    expect(activeBaseFilterCount(f)).toBe(9);
    expect(activeFilterCount(f)).toBe(12);
  });
});

describe('filter key tables', () => {
  it('DIM_FILTER_KEY maps every dimension to a list filter that exists', () => {
    const empty = emptyFilters();
    expect(Object.keys(DIM_FILTER_KEY).sort()).toEqual([...DIM_KEYS].sort());
    for (const key of Object.values(DIM_FILTER_KEY)) expect(Array.isArray(empty[key]), key).toBe(true);
  });

  it('emptyFilters returns fresh objects each time', () => {
    const a = emptyFilters();
    const b = emptyFilters();
    a.users.push('x');
    expect(b.users).toEqual([]);
    expect(a).not.toBe(b);
  });
});

describe('facetCounts', () => {
  interface Facet {
    key: FacetKey;
    label: (r: NaiveRow) => string;
    names: () => string[];
  }
  const FACETS: Facet[] = [
    { key: 'users', label: (r) => r.username, names: () => p.store.dicts.user.values },
    { key: 'products', label: (r) => r.product, names: () => p.store.dicts.product.values },
    { key: 'skus', label: (r) => r.sku, names: () => p.store.dicts.sku.values },
    { key: 'models', label: modelOfRow, names: () => p.store.dicts.model.values },
    { key: 'orgs', label: (r) => r.organization, names: () => p.store.dicts.org.values },
    { key: 'costCenters', label: (r) => r.cost_center_name, names: () => p.store.dicts.costCenter.values },
    { key: 'repos', label: (r) => r.repository, names: () => p.store.dicts.repo.values },
    { key: 'apps', label: (r) => r.app_client_id, names: () => p.store.dicts.app.values },
    { key: 'files', label: () => 'demo.csv', names: () => p.store.dicts.file.values },
    { key: 'vendors', label: (r) => vendorOf(modelOfRow(r)), names: () => [...VENDORS] },
    { key: 'categories', label: (r) => categoryOf(modelOfRow(r)), names: () => [...CATEGORIES] },
    { key: 'plans', label: (r) => planOfQuota(numOf(r, 'total_monthly_quota')), names: () => p.prep.planLabels },
    { key: 'weekdays', label: (r) => String(weekdayOf(r.date)), names: () => ['0', '1', '2', '3', '4', '5', '6'] },
  ];

  const SCENARIOS: [string, Partial<Filters>][] = [
    ['no filters', {}],
    ['only the facet’s own dimension filtered', { models: [modelNames[0]], users: [userNames[0]], orgs: [orgNames[0]], costCenters: [ccNames[0]], plans: ['Business'], weekdays: [0, 1], vendors: ['Anthropic'], categories: ['Powerful'], products: ['copilot'], skus: ['copilot_ai_credit'], repos: [repoNames[0]] }],
    ['two dimensions', { models: [modelNames[0], modelNames[1]], orgs: [orgNames[0]] }],
    ['dates and weekdays', { dateFrom: D('2026-09-10'), dateTo: D('2026-10-10'), weekdays: [0, 1, 2, 3, 4] }],
    ['modes and search', { billing: 'billed', selection: 'auto', search: 'a' }],
    ['vendor and plan', { vendors: ['OpenAI', 'Anthropic'], plans: ['Enterprise'], attribution: 'attributed' }],
  ];

  describe.each(FACETS)('$key', (spec) => {
    it.each(SCENARIOS)('%s: rows and gross per option match the naive grouping that ignores this filter', (_name, f) => {
      const full = { ...emptyFilters(), ...f };
      const fc = facetCounts(p.store, p.prep, p.models, full, spec.key);
      const without = { ...f };
      delete without[spec.key];
      const rs = rows.filter(predOf(without));
      const rowsBy = groupSum(rs, spec.label, () => 1);
      const grossBy = groupSum(rs, spec.label, (r) => numOf(r, 'gross_amount'));
      const names = spec.names();
      expect(fc.rows.length).toBe(Math.max(1, names.length));
      expect(fc.gross.length).toBe(fc.rows.length);
      names.forEach((n, i) => {
        expect(fc.rows[i], `${spec.key}:${n} rows`).toBe(rowsBy.get(n) ?? 0);
        expect(fc.gross[i], `${spec.key}:${n} gross`).toBeCloseTo(grossBy.get(n) ?? 0, 6);
      });
      expect(sum(Array.from(fc.rows))).toBe(rs.length);
    });
  });

  it('with no filters every facet partitions the whole store', () => {
    for (const spec of FACETS) {
      const fc = facetCounts(p.store, p.prep, p.models, emptyFilters(), spec.key);
      expect(sum(Array.from(fc.rows)), spec.key).toBe(p.store.n);
      expect(sum(Array.from(fc.gross)), spec.key).toBeCloseTo(sum(Array.from(p.store.gross)), 6);
    }
  });

  it('a facet ignores its own filter: setting it changes nothing', () => {
    const base = { ...emptyFilters(), orgs: [orgNames[0]], dateFrom: D('2026-09-20') };
    for (const spec of FACETS) {
      const own = spec.key === 'weekdays' ? ([0, 1] as number[]) : ['x'];
      const withOwn = { ...base, [spec.key]: own } as Filters;
      const a = facetCounts(p.store, p.prep, p.models, base, spec.key);
      const b = facetCounts(p.store, p.prep, p.models, withOwn, spec.key);
      if (spec.key !== 'orgs') {
        expect(Array.from(b.rows), spec.key).toEqual(Array.from(a.rows));
        expect(Array.from(b.gross), spec.key).toEqual(Array.from(a.gross));
      }
    }
  });

  it('with a single active dimension the other facets add up to that filter’s row count, and its own facet to the whole date scope', () => {
    const f = { ...emptyFilters(), models: [modelNames[0]] };
    const filtered = maskCount(buildMask(p.store, p.prep, p.models, f), p.store.n);
    expect(filtered).toBeGreaterThan(0);
    for (const spec of FACETS) {
      const fc = facetCounts(p.store, p.prep, p.models, f, spec.key);
      const total = sum(Array.from(fc.rows));
      expect(total, spec.key).toBe(spec.key === 'models' ? p.store.n : filtered);
    }
  });

  it('date filters apply to every facet', () => {
    const f = { ...emptyFilters(), dateFrom: D('2026-10-01'), dateTo: D('2026-10-07') };
    const inRange = rows.filter(predOf(f)).length;
    for (const spec of FACETS) expect(sum(Array.from(facetCounts(p.store, p.prep, p.models, f, spec.key).rows)), spec.key).toBe(inRange);
  });

  it('plan facet has one slot even when the data has no plan labels', async () => {
    const empty = await analyzeCsv(makeCsv([], {}));
    expect(empty.store.n).toBe(0);
    const fc = facetCounts(empty.store, empty.prep, empty.models, emptyFilters(), 'plans');
    expect(fc.rows.length).toBe(1);
    expect(fc.rows[0]).toBe(0);
  });
});
