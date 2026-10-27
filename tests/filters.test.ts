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

const vendorOf = (model: string): string => PRICE_CARD.find((cardEntry) => cardEntry.name === model)?.vendor ?? 'Other';
const categoryOf = (model: string): string => PRICE_CARD.find((cardEntry) => cardEntry.name === model)?.category ?? 'Unknown';
const planOfQuota = (quota: number): string => (quota <= 0 ? 'No quota' : quota === 1900 ? 'Business' : quota === 3900 ? 'Enterprise' : `Custom (${quota.toLocaleString('en-US')} credits)`);
const uniqueSorted = (values: string[]): string[] => [...new Set(values)].sort();

const userNames = uniqueSorted(rows.map((row) => row.username).filter(Boolean));
const modelNames = uniqueSorted(rows.map(modelOfRow));
const orgNames = uniqueSorted(rows.map((row) => row.organization).filter(Boolean));
const ccNames = uniqueSorted(rows.map((row) => row.cost_center_name).filter(Boolean));
const repoNames = uniqueSorted(rows.map((row) => row.repository).filter(Boolean));
const dayOf = (iso: string): number => dayNum(iso);

/** Independent implementation of the filter contract, used as the oracle for every test below. */
function predOf(filters: Partial<Filters>): (row: NaiveRow) => boolean {
  const tokens = (filters.search ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return (row) => {
    const day = dayNum(row.date);
    const model = modelOfRow(row);
    const gross = numOf(row, 'gross_amount');
    const billed = numOf(row, 'net_amount') > 1e-9;
    if (filters.dateFrom != null && day < filters.dateFrom) return false;
    if (filters.dateTo != null && day > filters.dateTo) return false;
    if (filters.users?.length && !filters.users.includes(row.username)) return false;
    if (filters.products?.length && !filters.products.includes(row.product)) return false;
    if (filters.skus?.length && !filters.skus.includes(row.sku)) return false;
    if (filters.models?.length && !filters.models.includes(model)) return false;
    if (filters.vendors?.length && !filters.vendors.includes(vendorOf(model))) return false;
    if (filters.categories?.length && !filters.categories.includes(categoryOf(model))) return false;
    if (filters.orgs?.length && !filters.orgs.includes(row.organization)) return false;
    if (filters.costCenters?.length && !filters.costCenters.includes(row.cost_center_name)) return false;
    if (filters.repos?.length && !filters.repos.includes(row.repository)) return false;
    if (filters.apps?.length && !filters.apps.includes(row.app_client_id)) return false;
    if (filters.plans?.length && !filters.plans.includes(planOfQuota(numOf(row, 'total_monthly_quota')))) return false;
    if (filters.weekdays?.length && !filters.weekdays.includes(weekdayOf(row.date))) return false;
    if (filters.selection === 'auto' && !isAutoRow(row)) return false;
    if (filters.selection === 'manual' && isAutoRow(row)) return false;
    if (filters.billing === 'billed' && !billed) return false;
    if (filters.billing === 'covered' && billed) return false;
    if (filters.attribution === 'attributed' && !row.username) return false;
    if (filters.attribution === 'unattributed' && row.username) return false;
    if (filters.minRow != null && gross < filters.minRow) return false;
    if (filters.maxRow != null && gross > filters.maxRow) return false;
    if (tokens.length) {
      const searchFields = [row.username, model, row.organization, row.cost_center_name, row.repository, row.product].map((field) => field.toLowerCase());
      if (!tokens.every((token) => searchFields.some((field) => field.includes(token)))) return false;
    }
    return true;
  };
}

let pipeline: Pipeline;

beforeAll(async () => {
  pipeline = pipelineOf(await buildStore([{ name: 'demo.csv', data: demo.csv }]));
});

const maskOf = (filters: Partial<Filters>): Uint8Array | null => buildMask(pipeline.store, pipeline.prep, pipeline.models, { ...emptyFilters(), ...filters });

function scope(filters: Partial<Filters>): { count: number; gross: number } {
  const mask = maskOf(filters);
  let count = 0;
  let gross = 0;
  for (let i = 0; i < pipeline.store.n; i++) {
    if (mask === null || mask[i] === 1) {
      count++;
      gross += pipeline.store.gross[i];
    }
  }
  return { count, gross };
}

const expected = (filters: Partial<Filters>): { count: number; gross: number } => {
  const matchingRows = rows.filter(predOf(filters));
  return { count: matchingRows.length, gross: sum(matchingRows.map((row) => numOf(row, 'gross_amount'))) };
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
  { name: 'dateFrom', f: { dateFrom: dayOf('2026-10-10') } },
  { name: 'dateTo', f: { dateTo: dayOf('2026-09-20') } },
  { name: 'date range', f: { dateFrom: dayOf('2026-09-15'), dateTo: dayOf('2026-10-05') } },
  { name: 'a single day', f: { dateFrom: dayOf('2026-10-13'), dateTo: dayOf('2026-10-13') } },
  { name: 'inverted range', f: { dateFrom: dayOf('2026-10-10'), dateTo: dayOf('2026-10-01') }, empty: true },
  { name: 'range outside the data', f: { dateFrom: dayOf('2027-01-01'), dateTo: dayOf('2027-02-01') }, empty: true },
  { name: 'unknown user', f: { users: ['no-such-user'] }, empty: true },
  { name: 'unknown vendor', f: { vendors: ['Nope'] }, empty: true },
  { name: 'unknown plan', f: { plans: ['Platinum'] }, empty: true },
  {
    name: 'combination: user + model + dates + billing',
    f: { users: [userNames[0], userNames[1], userNames[2], userNames[3], userNames[4], userNames[5]], vendors: ['Anthropic', 'OpenAI'], dateFrom: dayOf('2026-09-10'), dateTo: dayOf('2026-10-20'), billing: 'covered' },
  },
  {
    name: 'combination: org + plan + weekdays + selection + minRow',
    f: { orgs: [orgNames[0], orgNames[1]], plans: ['Enterprise', 'Business'], weekdays: [0, 1, 2, 3, 4], selection: 'manual', minRow: 0.5 },
  },
  { name: 'combination: attribution + search + category', f: { attribution: 'attributed', search: 'northwind', categories: ['Powerful', 'Versatile'] } },
];

describe('buildMask on the demo dataset', () => {
  it.each(CASES)('$name selects exactly the rows (and gross) the naive filter selects', ({ f: filters, empty }) => {
    const got = scope(filters);
    const want = expected(filters);
    expect(got.count).toBe(want.count);
    expect(got.gross).toBeCloseTo(want.gross, 6);
    if (empty) {
      expect(got.count).toBe(0);
      expect(maskOf(filters)).not.toBeNull();
    } else {
      expect(got.count).toBeGreaterThan(0);
      expect(got.count).toBeLessThan(rows.length);
    }
  });

  it('filters combine with AND: the result is the intersection of the single-filter results', () => {
    const orgMask = maskOf({ orgs: [orgNames[0]] })!;
    const coveredMask = maskOf({ billing: 'covered' })!;
    const weekdayMask = maskOf({ weekdays: [0, 1, 2, 3, 4] })!;
    const both = maskOf({ orgs: [orgNames[0]], billing: 'covered', weekdays: [0, 1, 2, 3, 4] })!;
    for (let i = 0; i < pipeline.store.n; i++) expect(both[i]).toBe(orgMask[i] & coveredMask[i] & weekdayMask[i]);
    expect(maskCount(both, pipeline.store.n)).toBeLessThan(maskCount(orgMask, pipeline.store.n));
  });

  it('is null when no row filter is active (post filters, blank search and "all" modes do not count)', () => {
    expect(maskOf({})).toBeNull();
    expect(maskOf({ search: '   \t ' })).toBeNull();
    expect(maskOf({ selection: 'all', billing: 'all', attribution: 'all' })).toBeNull();
    expect(maskOf({ tiers: ['runaway'], segments: ['champion'], traits: ['spiky'], paretoClasses: ['A'], minUserSpend: 5, maxUserSpend: 500 })).toBeNull();
  });

  it('is not null as soon as one row filter is active, even an empty-looking one', () => {
    expect(maskOf({ dateTo: pipeline.store.maxDay })).not.toBeNull();
    expect(maskOf({ minRow: 0 })).not.toBeNull();
    expect(maskOf({ maxRow: 1e12 })).not.toBeNull();
    expect(maskOf({ users: ['no-such-user'] })).not.toBeNull();
  });

  it('inclusive row-spend bounds keep rows exactly at the bound', () => {
    const sortedGross = Array.from(pipeline.store.gross).sort((left, right) => left - right);
    const median = sortedGross[Math.floor(sortedGross.length / 2)];
    const atOrAboveMedian = sortedGross.filter((gross) => gross >= median).length;
    const atOrBelowMedian = sortedGross.filter((gross) => gross <= median).length;
    expect(scope({ minRow: median }).count).toBe(atOrAboveMedian);
    expect(scope({ maxRow: median }).count).toBe(atOrBelowMedian);
    expect(scope({ minRow: median, maxRow: median }).count).toBe(sortedGross.filter((gross) => gross === median).length);
  });

  it('a blank user selection is the same set as attribution = unattributed', () => {
    expect(maskOf({ users: [''] })).toEqual(maskOf({ attribution: 'unattributed' }));
  });

  it('skip leaves exactly one filter out', () => {
    const filters = { ...emptyFilters(), users: [userNames[0]], models: [modelNames[0]], dateFrom: dayOf('2026-09-15'), dateTo: dayOf('2026-10-05') };
    const mine = (skip: keyof Filters | null): number => maskCount(buildMask(pipeline.store, pipeline.prep, pipeline.models, filters, skip), pipeline.store.n);
    expect(mine('users')).toBe(expected({ models: filters.models, dateFrom: filters.dateFrom, dateTo: filters.dateTo }).count);
    expect(mine('models')).toBe(expected({ users: filters.users, dateFrom: filters.dateFrom, dateTo: filters.dateTo }).count);
    expect(mine('dateFrom')).toBe(expected({ users: filters.users, models: filters.models, dateTo: filters.dateTo }).count);
    expect(mine('dateTo')).toBe(expected({ users: filters.users, models: filters.models, dateFrom: filters.dateFrom }).count);
    expect(mine(null)).toBe(expected(filters).count);
  });
});

describe('buildMask: custom plans and app ids (synthetic data)', () => {
  let syntheticPipeline: Pipeline;
  beforeAll(async () => {
    syntheticPipeline = await analyzeCsv(
      makeCsv([
        { date: '2026-10-01', user: 'u1', gross: 1, app: 'app-1', quota: 1000 },
        { date: '2026-10-02', user: 'u2', gross: 2, app: 'app-2', quota: 1900 },
        { date: '2026-10-03', user: 'u3', gross: 3, quota: 3900 },
        { date: '2026-10-04', user: '', gross: 4, product: 'ghas', sku: 'code_security_ai_credit', repo: 'org/repo-x' },
      ]),
    );
  });
  const count = (filters: Partial<Filters>): number => maskCount(buildMask(syntheticPipeline.store, syntheticPipeline.prep, syntheticPipeline.models, { ...emptyFilters(), ...filters }), syntheticPipeline.store.n);

  it('plans: Business, Enterprise, No quota and Custom (n credits) labels', () => {
    expect([...syntheticPipeline.prep.planLabels].sort()).toEqual(['Business', 'Custom (1,000 credits)', 'Enterprise', 'No quota']);
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
    const bothFixtures = await analyzeFixtures([FIXTURE_A, FIXTURE_B]);
    const rowCountA = naiveRows(readFixture(FIXTURE_A)).length;
    const fixtureBRowCount = naiveRows(readFixture(FIXTURE_B)).length;
    const count = (filters: Partial<Filters>): number => maskCount(buildMask(bothFixtures.store, bothFixtures.prep, bothFixtures.models, { ...emptyFilters(), ...filters }), bothFixtures.store.n);
    expect(count({ files: [FIXTURE_A] })).toBe(rowCountA);
    expect(count({ files: [FIXTURE_B] })).toBe(fixtureBRowCount);
    expect(count({ files: [FIXTURE_A, FIXTURE_B] })).toBe(rowCountA + fixtureBRowCount);
    expect(count({ files: ['other.csv'] })).toBe(0);
    expect(count({ files: [FIXTURE_B], attribution: 'unattributed' })).toBeGreaterThan(0);
    expect(count({ files: [FIXTURE_A], attribution: 'unattributed' })).toBe(0);
    const fileCounts = facetCounts(bothFixtures.store, bothFixtures.prep, bothFixtures.models, { ...emptyFilters(), files: [FIXTURE_A] }, 'files');
    const fixtureAFileId = bothFixtures.store.dicts.file.index.get(FIXTURE_A)!;
    const fixtureBFileId = bothFixtures.store.dicts.file.index.get(FIXTURE_B)!;
    expect(fileCounts.rows[fixtureAFileId]).toBe(rowCountA);
    expect(fileCounts.rows[fixtureBFileId]).toBe(fixtureBRowCount);
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
    const mask = new Uint8Array([1, 0, 1, 1]);
    expect(andMasks(mask, null, user)).toBe(mask);
  });

  it('andMasks intersects the row mask with the allowed users', () => {
    const user = new Int32Array([0, 1, 2, 1, 2]);
    const allowed = new Uint8Array([0, 1, 0]);
    expect(Array.from(andMasks(null, allowed, user)!)).toEqual([0, 1, 0, 1, 0]);
    const mask = new Uint8Array([1, 0, 1, 1, 1]);
    expect(Array.from(andMasks(mask, allowed, user)!)).toEqual([0, 0, 0, 1, 0]);
  });

  it('on real data the combined mask equals the naive intersection', () => {
    const base = maskOf({ billing: 'covered' })!;
    const id = pipeline.store.dicts.user.index.get(userNames[0])!;
    const allowed = new Uint8Array(pipeline.store.dicts.user.values.length);
    allowed[id] = 1;
    const both = andMasks(base, allowed, pipeline.store.user)!;
    expect(maskCount(both, pipeline.store.n)).toBe(expected({ billing: 'covered', users: [userNames[0]] }).count);
  });
});

describe('active filter counting', () => {
  it('counts nothing for the empty filter set', () => {
    const filters = emptyFilters();
    expect(activeBaseFilterCount(filters)).toBe(0);
    expect(activeFilterCount(filters)).toBe(0);
    expect(hasPostFilters(filters)).toBe(false);
  });

  it('counts the date range once, however many ends are set', () => {
    expect(activeBaseFilterCount({ ...emptyFilters(), dateFrom: 5 })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), dateTo: 5 })).toBe(1);
    expect(activeBaseFilterCount({ ...emptyFilters(), dateFrom: 5, dateTo: 9 })).toBe(1);
  });

  it('counts each list filter once regardless of how many values it holds', () => {
    for (const filterKey of ['users', 'products', 'skus', 'models', 'vendors', 'categories', 'orgs', 'costCenters', 'repos', 'apps', 'files', 'plans'] as const) {
      expect(activeBaseFilterCount({ ...emptyFilters(), [filterKey]: ['a', 'b', 'c'] }), filterKey).toBe(1);
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
    for (const filterKey of POST_LIST_KEYS) {
      const filters = { ...emptyFilters(), [filterKey]: ['x'] };
      expect(hasPostFilters(filters), filterKey).toBe(true);
      expect(activeBaseFilterCount(filters), filterKey).toBe(0);
      expect(activeFilterCount(filters), filterKey).toBe(1);
    }
    const spend = { ...emptyFilters(), minUserSpend: 1, maxUserSpend: 9 };
    expect(hasPostFilters(spend)).toBe(true);
    expect(activeFilterCount(spend)).toBe(1);
    expect(hasPostFilters({ ...emptyFilters(), maxUserSpend: 0 })).toBe(true);
  });

  it('adds everything up', () => {
    const filters: Filters = {
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
    expect(activeBaseFilterCount(filters)).toBe(9);
    expect(activeFilterCount(filters)).toBe(12);
  });
});

describe('filter key tables', () => {
  it('DIM_FILTER_KEY maps every dimension to a list filter that exists', () => {
    const empty = emptyFilters();
    expect(Object.keys(DIM_FILTER_KEY).sort()).toEqual([...DIM_KEYS].sort());
    for (const key of Object.values(DIM_FILTER_KEY)) expect(Array.isArray(empty[key]), key).toBe(true);
  });

  it('emptyFilters returns fresh objects each time', () => {
    const firstFilters = emptyFilters();
    const secondFilters = emptyFilters();
    firstFilters.users.push('x');
    expect(secondFilters.users).toEqual([]);
    expect(firstFilters).not.toBe(secondFilters);
  });
});

describe('facetCounts', () => {
  interface Facet {
    key: FacetKey;
    label: (row: NaiveRow) => string;
    names: () => string[];
  }
  const FACETS: Facet[] = [
    { key: 'users', label: (row) => row.username, names: () => pipeline.store.dicts.user.values },
    { key: 'products', label: (row) => row.product, names: () => pipeline.store.dicts.product.values },
    { key: 'skus', label: (row) => row.sku, names: () => pipeline.store.dicts.sku.values },
    { key: 'models', label: modelOfRow, names: () => pipeline.store.dicts.model.values },
    { key: 'orgs', label: (row) => row.organization, names: () => pipeline.store.dicts.org.values },
    { key: 'costCenters', label: (row) => row.cost_center_name, names: () => pipeline.store.dicts.costCenter.values },
    { key: 'repos', label: (row) => row.repository, names: () => pipeline.store.dicts.repo.values },
    { key: 'apps', label: (row) => row.app_client_id, names: () => pipeline.store.dicts.app.values },
    { key: 'files', label: () => 'demo.csv', names: () => pipeline.store.dicts.file.values },
    { key: 'vendors', label: (row) => vendorOf(modelOfRow(row)), names: () => [...VENDORS] },
    { key: 'categories', label: (row) => categoryOf(modelOfRow(row)), names: () => [...CATEGORIES] },
    { key: 'plans', label: (row) => planOfQuota(numOf(row, 'total_monthly_quota')), names: () => pipeline.prep.planLabels },
    { key: 'weekdays', label: (row) => String(weekdayOf(row.date)), names: () => ['0', '1', '2', '3', '4', '5', '6'] },
  ];

  const SCENARIOS: [string, Partial<Filters>][] = [
    ['no filters', {}],
    ['only the facet’s own dimension filtered', { models: [modelNames[0]], users: [userNames[0]], orgs: [orgNames[0]], costCenters: [ccNames[0]], plans: ['Business'], weekdays: [0, 1], vendors: ['Anthropic'], categories: ['Powerful'], products: ['copilot'], skus: ['copilot_ai_credit'], repos: [repoNames[0]] }],
    ['two dimensions', { models: [modelNames[0], modelNames[1]], orgs: [orgNames[0]] }],
    ['dates and weekdays', { dateFrom: dayOf('2026-09-10'), dateTo: dayOf('2026-10-10'), weekdays: [0, 1, 2, 3, 4] }],
    ['modes and search', { billing: 'billed', selection: 'auto', search: 'a' }],
    ['vendor and plan', { vendors: ['OpenAI', 'Anthropic'], plans: ['Enterprise'], attribution: 'attributed' }],
  ];

  describe.each(FACETS)('$key', (spec) => {
    it.each(SCENARIOS)('%s: rows and gross per option match the naive grouping that ignores this filter', (_name, filters) => {
      const full = { ...emptyFilters(), ...filters };
      const counts = facetCounts(pipeline.store, pipeline.prep, pipeline.models, full, spec.key);
      const without = { ...filters };
      delete without[spec.key];
      const matchingRows = rows.filter(predOf(without));
      const rowsBy = groupSum(matchingRows, spec.label, () => 1);
      const grossBy = groupSum(matchingRows, spec.label, (row) => numOf(row, 'gross_amount'));
      const names = spec.names();
      expect(counts.rows.length).toBe(Math.max(1, names.length));
      expect(counts.gross.length).toBe(counts.rows.length);
      names.forEach((name, index) => {
        expect(counts.rows[index], `${spec.key}:${name} rows`).toBe(rowsBy.get(name) ?? 0);
        expect(counts.gross[index], `${spec.key}:${name} gross`).toBeCloseTo(grossBy.get(name) ?? 0, 6);
      });
      expect(sum(Array.from(counts.rows))).toBe(matchingRows.length);
    });
  });

  it('with no filters every facet partitions the whole store', () => {
    for (const spec of FACETS) {
      const counts = facetCounts(pipeline.store, pipeline.prep, pipeline.models, emptyFilters(), spec.key);
      expect(sum(Array.from(counts.rows)), spec.key).toBe(pipeline.store.n);
      expect(sum(Array.from(counts.gross)), spec.key).toBeCloseTo(sum(Array.from(pipeline.store.gross)), 6);
    }
  });

  it('a facet ignores its own filter: setting it changes nothing', () => {
    const base = { ...emptyFilters(), orgs: [orgNames[0]], dateFrom: dayOf('2026-09-20') };
    for (const spec of FACETS) {
      const own = spec.key === 'weekdays' ? ([0, 1] as number[]) : ['x'];
      const withOwn = { ...base, [spec.key]: own } as Filters;
      const baseCounts = facetCounts(pipeline.store, pipeline.prep, pipeline.models, base, spec.key);
      const withOwnCounts = facetCounts(pipeline.store, pipeline.prep, pipeline.models, withOwn, spec.key);
      if (spec.key !== 'orgs') {
        expect(Array.from(withOwnCounts.rows), spec.key).toEqual(Array.from(baseCounts.rows));
        expect(Array.from(withOwnCounts.gross), spec.key).toEqual(Array.from(baseCounts.gross));
      }
    }
  });

  it('with a single active dimension the other facets add up to that filter’s row count, and its own facet to the whole date scope', () => {
    const filters = { ...emptyFilters(), models: [modelNames[0]] };
    const filtered = maskCount(buildMask(pipeline.store, pipeline.prep, pipeline.models, filters), pipeline.store.n);
    expect(filtered).toBeGreaterThan(0);
    for (const spec of FACETS) {
      const counts = facetCounts(pipeline.store, pipeline.prep, pipeline.models, filters, spec.key);
      const total = sum(Array.from(counts.rows));
      expect(total, spec.key).toBe(spec.key === 'models' ? pipeline.store.n : filtered);
    }
  });

  it('date filters apply to every facet', () => {
    const filters = { ...emptyFilters(), dateFrom: dayOf('2026-10-01'), dateTo: dayOf('2026-10-07') };
    const inRange = rows.filter(predOf(filters)).length;
    for (const spec of FACETS) expect(sum(Array.from(facetCounts(pipeline.store, pipeline.prep, pipeline.models, filters, spec.key).rows)), spec.key).toBe(inRange);
  });

  it('plan facet has one slot even when the data has no plan labels', async () => {
    const empty = await analyzeCsv(makeCsv([], {}));
    expect(empty.store.n).toBe(0);
    const counts = facetCounts(empty.store, empty.prep, empty.models, emptyFilters(), 'plans');
    expect(counts.rows.length).toBe(1);
    expect(counts.rows[0]).toBe(0);
  });
});
