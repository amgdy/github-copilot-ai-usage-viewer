import type { DataStore, DimKey } from '../types';
import { DIM_KEYS } from '../types';
import type { ModelTable } from '../pricing/models';
import { CATEGORIES } from '../types';
import { VENDORS } from '../pricing/card';
import type { Prepared } from './prepare';
import { BLANK_ID } from './prepare';

export type SelectionMode = 'all' | 'auto' | 'manual';
export type BillingMode = 'all' | 'covered' | 'billed';
export type AttributionMode = 'all' | 'attributed' | 'unattributed';

export interface Filters {
  dateFrom: number | null;
  dateTo: number | null;
  users: string[];
  products: string[];
  skus: string[];
  models: string[];
  vendors: string[];
  categories: string[];
  orgs: string[];
  costCenters: string[];
  repos: string[];
  apps: string[];
  files: string[];
  plans: string[];
  selection: SelectionMode;
  billing: BillingMode;
  attribution: AttributionMode;
  weekdays: number[];
  minRow: number | null;
  maxRow: number | null;
  search: string;
  // Post-filters (applied after user profiles are computed)
  segments: string[];
  tiers: string[];
  engagement: string[];
  profiles: string[];
  traits: string[];
  paretoClasses: string[];
  /** Post-filter on the user's Auto use (`autoFirst`, `mixed`, `direct`, `unknown`). Not the same as `selection`, which filters rows. */
  autoUse: string[];
  minUserSpend: number | null;
  maxUserSpend: number | null;
}

export type ListFilterKey = {
  [K in keyof Filters]: Filters[K] extends string[] ? K : never;
}[keyof Filters];

export const emptyFilters = (): Filters => ({
  dateFrom: null,
  dateTo: null,
  users: [],
  products: [],
  skus: [],
  models: [],
  vendors: [],
  categories: [],
  orgs: [],
  costCenters: [],
  repos: [],
  apps: [],
  files: [],
  plans: [],
  selection: 'all',
  billing: 'all',
  attribution: 'all',
  weekdays: [],
  minRow: null,
  maxRow: null,
  search: '',
  segments: [],
  tiers: [],
  engagement: [],
  profiles: [],
  traits: [],
  paretoClasses: [],
  autoUse: [],
  minUserSpend: null,
  maxUserSpend: null,
});

export const DIM_FILTER_KEY: Record<DimKey, ListFilterKey> = {
  user: 'users',
  product: 'products',
  sku: 'skus',
  model: 'models',
  org: 'orgs',
  app: 'apps',
  repo: 'repos',
  costCenter: 'costCenters',
  file: 'files',
};

export const POST_LIST_KEYS = ['segments', 'tiers', 'engagement', 'profiles', 'traits', 'paretoClasses', 'autoUse'] as const;

export function hasPostFilters(filters: Filters): boolean {
  return POST_LIST_KEYS.some((key) => filters[key].length > 0) || filters.minUserSpend !== null || filters.maxUserSpend !== null;
}

export function activeBaseFilterCount(filters: Filters): number {
  let count = 0;
  if (filters.dateFrom !== null || filters.dateTo !== null) count++;
  for (const key of ['users', 'products', 'skus', 'models', 'vendors', 'categories', 'orgs', 'costCenters', 'repos', 'apps', 'files', 'plans', 'weekdays'] as const) {
    if (filters[key].length) count++;
  }
  if (filters.selection !== 'all') count++;
  if (filters.billing !== 'all') count++;
  if (filters.attribution !== 'all') count++;
  if (filters.minRow !== null || filters.maxRow !== null) count++;
  if (filters.search.trim()) count++;
  return count;
}

export function activeFilterCount(filters: Filters): number {
  return (
    activeBaseFilterCount(filters) +
    POST_LIST_KEYS.reduce((count, key) => count + (filters[key].length ? 1 : 0), 0) +
    (filters.minUserSpend !== null || filters.maxUserSpend !== null ? 1 : 0)
  );
}

function allowSet(store: DataStore, dimension: DimKey, values: string[]): Uint8Array | null {
  if (!values.length) return null;
  const dictionary = store.dicts[dimension];
  const allowed = new Uint8Array(dictionary.values.length);
  for (const value of values) {
    const id = dictionary.index.get(value);
    if (id !== undefined) allowed[id] = 1;
  }
  return allowed;
}

export type SkipKey = keyof Filters | null;

/**
 * Compiles the base (row-level) filters into a row mask. Returns `null` when nothing is filtered.
 * `skip` leaves one filter out, which powers faceted counts ("what would I get if I changed this filter").
 */
export function buildMask(
  store: DataStore,
  prepared: Prepared,
  models: ModelTable,
  filters: Filters,
  skip: SkipKey = null,
): Uint8Array | null {
  const use = <K extends keyof Filters>(key: K): boolean => skip !== key;
  const from = use('dateFrom') && filters.dateFrom !== null ? filters.dateFrom : null;
  const to = use('dateTo') && filters.dateTo !== null ? filters.dateTo : null;
  const userA = use('users') ? allowSet(store, 'user', filters.users) : null;
  const productA = use('products') ? allowSet(store, 'product', filters.products) : null;
  const skuAllowed = use('skus') ? allowSet(store, 'sku', filters.skus) : null;
  const orgAllowed = use('orgs') ? allowSet(store, 'org', filters.orgs) : null;
  const costCenterAllowed = use('costCenters') ? allowSet(store, 'costCenter', filters.costCenters) : null;
  const repoA = use('repos') ? allowSet(store, 'repo', filters.repos) : null;
  const appAllowed = use('apps') ? allowSet(store, 'app', filters.apps) : null;
  const fileA = use('files') ? allowSet(store, 'file', filters.files) : null;

  let modelA = use('models') ? allowSet(store, 'model', filters.models) : null;
  const vendorSel = use('vendors') ? filters.vendors : [];
  const catSel = use('categories') ? filters.categories : [];
  if (vendorSel.length || catSel.length) {
    const vendorIndexes = new Set(vendorSel.map((vendor) => VENDORS.indexOf(vendor as (typeof VENDORS)[number])));
    const categoryIndexes = new Set(catSel.map((category) => CATEGORIES.indexOf(category as (typeof CATEGORIES)[number])));
    const next = new Uint8Array(models.meta.length);
    for (let modelId = 0; modelId < next.length; modelId++) {
      const ok = (!vendorSel.length || vendorIndexes.has(models.vendor[modelId])) && (!catSel.length || categoryIndexes.has(models.cat[modelId]));
      next[modelId] = ok && (!modelA || modelA[modelId]) ? 1 : 0;
    }
    modelA = next;
  }

  let planA: Uint8Array | null = null;
  if (use('plans') && filters.plans.length) {
    planA = new Uint8Array(prepared.planLabels.length);
    prepared.planLabels.forEach((label, index) => {
      if (filters.plans.includes(label)) planA![index] = 1;
    });
  }
  let weekdayAllowed: Uint8Array | null = null;
  if (use('weekdays') && filters.weekdays.length) {
    weekdayAllowed = new Uint8Array(7);
    for (const weekday of filters.weekdays) weekdayAllowed[weekday] = 1;
  }
  const selection = use('selection') ? filters.selection : 'all';
  const billing = use('billing') ? filters.billing : 'all';
  const attribution = use('attribution') ? filters.attribution : 'all';
  const minRow = use('minRow') ? filters.minRow : null;
  const maxRow = use('maxRow') ? filters.maxRow : null;

  // Free-text search: every whitespace-separated token must match one of the row's text dimensions.
  const tokens = use('search')
    ? filters.search
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    : [];
  const searchDims: DimKey[] = ['user', 'model', 'org', 'costCenter', 'repo', 'product'];
  const searchMatch: Partial<Record<DimKey, Uint8Array[]>> = {};
  if (tokens.length) {
    for (const dimension of searchDims) {
      searchMatch[dimension] = tokens.map((token) => {
        const dimensionValues = store.dicts[dimension].values;
        const matches = new Uint8Array(dimensionValues.length);
        for (let i = 0; i < dimensionValues.length; i++) if (dimensionValues[i].toLowerCase().includes(token)) matches[i] = 1;
        return matches;
      });
    }
  }

  const needsMask =
    from !== null ||
    to !== null ||
    userA ||
    productA ||
    skuAllowed ||
    orgAllowed ||
    costCenterAllowed ||
    repoA ||
    appAllowed ||
    fileA ||
    modelA ||
    planA ||
    weekdayAllowed ||
    selection !== 'all' ||
    billing !== 'all' ||
    attribution !== 'all' ||
    minRow !== null ||
    maxRow !== null ||
    tokens.length > 0;
  if (!needsMask) return null;

  const rowCount = store.n;
  const mask = new Uint8Array(rowCount);
  const { day, user, product, sku, model, org, app, repo, costCenter, file, auto, gross, net } = store;
  const firstDay = from ?? Number.NEGATIVE_INFINITY;
  const lastDay = to ?? Number.POSITIVE_INFINITY;
  const minDay = store.minDay;
  for (let i = 0; i < rowCount; i++) {
    const rowDay = day[i];
    if (rowDay < firstDay || rowDay > lastDay) continue;
    if (userA && !userA[user[i]]) continue;
    if (modelA && !modelA[model[i]]) continue;
    if (productA && !productA[product[i]]) continue;
    if (skuAllowed && !skuAllowed[sku[i]]) continue;
    if (orgAllowed && !orgAllowed[org[i]]) continue;
    if (costCenterAllowed && !costCenterAllowed[costCenter[i]]) continue;
    if (repoA && !repoA[repo[i]]) continue;
    if (appAllowed && !appAllowed[app[i]]) continue;
    if (fileA && !fileA[file[i]]) continue;
    if (planA && !planA[prepared.planOfRow[i]]) continue;
    if (weekdayAllowed && !weekdayAllowed[prepared.dowOfDay[rowDay - minDay]]) continue;
    if (selection !== 'all' && (selection === 'auto') !== (auto[i] === 1)) continue;
    if (billing !== 'all' && (billing === 'billed') !== (net[i] > 1e-9)) continue;
    if (attribution !== 'all' && (attribution === 'attributed') !== (user[i] !== BLANK_ID)) continue;
    const rowGross = gross[i];
    if (minRow !== null && rowGross < minRow) continue;
    if (maxRow !== null && rowGross > maxRow) continue;
    if (tokens.length) {
      let ok = true;
      for (let tokenIndex = 0; tokenIndex < tokens.length && ok; tokenIndex++) {
        ok =
          searchMatch.user![tokenIndex][user[i]] === 1 ||
          searchMatch.model![tokenIndex][model[i]] === 1 ||
          searchMatch.org![tokenIndex][org[i]] === 1 ||
          searchMatch.costCenter![tokenIndex][costCenter[i]] === 1 ||
          searchMatch.repo![tokenIndex][repo[i]] === 1 ||
          searchMatch.product![tokenIndex][product[i]] === 1;
      }
      if (!ok) continue;
    }
    mask[i] = 1;
  }
  return mask;
}

export function maskCount(mask: Uint8Array | null, rowCount: number): number {
  if (!mask) return rowCount;
  let count = 0;
  for (let i = 0; i < mask.length; i++) count += mask[i];
  return count;
}

export function andMasks(rowMask: Uint8Array | null, userAllowed: Uint8Array | null, user: Int32Array): Uint8Array | null {
  if (!userAllowed) return rowMask;
  const rowCount = user.length;
  const out = new Uint8Array(rowCount);
  for (let i = 0; i < rowCount; i++) {
    if ((rowMask === null || rowMask[i]) && userAllowed[user[i]]) out[i] = 1;
  }
  return out;
}

export { DIM_KEYS };
