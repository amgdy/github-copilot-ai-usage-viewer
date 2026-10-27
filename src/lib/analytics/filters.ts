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

export function hasPostFilters(f: Filters): boolean {
  return POST_LIST_KEYS.some((k) => f[k].length > 0) || f.minUserSpend !== null || f.maxUserSpend !== null;
}

export function activeBaseFilterCount(f: Filters): number {
  let n = 0;
  if (f.dateFrom !== null || f.dateTo !== null) n++;
  for (const k of ['users', 'products', 'skus', 'models', 'vendors', 'categories', 'orgs', 'costCenters', 'repos', 'apps', 'files', 'plans', 'weekdays'] as const) {
    if (f[k].length) n++;
  }
  if (f.selection !== 'all') n++;
  if (f.billing !== 'all') n++;
  if (f.attribution !== 'all') n++;
  if (f.minRow !== null || f.maxRow !== null) n++;
  if (f.search.trim()) n++;
  return n;
}

export function activeFilterCount(f: Filters): number {
  return (
    activeBaseFilterCount(f) +
    POST_LIST_KEYS.reduce((n, k) => n + (f[k].length ? 1 : 0), 0) +
    (f.minUserSpend !== null || f.maxUserSpend !== null ? 1 : 0)
  );
}

function allowSet(store: DataStore, dim: DimKey, values: string[]): Uint8Array | null {
  if (!values.length) return null;
  const d = store.dicts[dim];
  const a = new Uint8Array(d.values.length);
  for (const v of values) {
    const id = d.index.get(v);
    if (id !== undefined) a[id] = 1;
  }
  return a;
}

export type SkipKey = keyof Filters | null;

/**
 * Compiles the base (row-level) filters into a row mask. Returns `null` when nothing is filtered.
 * `skip` leaves one filter out, which powers faceted counts ("what would I get if I changed this filter").
 */
export function buildMask(
  store: DataStore,
  prep: Prepared,
  models: ModelTable,
  f: Filters,
  skip: SkipKey = null,
): Uint8Array | null {
  const use = <K extends keyof Filters>(k: K): boolean => skip !== k;
  const from = use('dateFrom') && f.dateFrom !== null ? f.dateFrom : null;
  const to = use('dateTo') && f.dateTo !== null ? f.dateTo : null;
  const userA = use('users') ? allowSet(store, 'user', f.users) : null;
  const productA = use('products') ? allowSet(store, 'product', f.products) : null;
  const skuA = use('skus') ? allowSet(store, 'sku', f.skus) : null;
  const orgA = use('orgs') ? allowSet(store, 'org', f.orgs) : null;
  const ccA = use('costCenters') ? allowSet(store, 'costCenter', f.costCenters) : null;
  const repoA = use('repos') ? allowSet(store, 'repo', f.repos) : null;
  const appA = use('apps') ? allowSet(store, 'app', f.apps) : null;
  const fileA = use('files') ? allowSet(store, 'file', f.files) : null;

  let modelA = use('models') ? allowSet(store, 'model', f.models) : null;
  const vendorSel = use('vendors') ? f.vendors : [];
  const catSel = use('categories') ? f.categories : [];
  if (vendorSel.length || catSel.length) {
    const vset = new Set(vendorSel.map((v) => VENDORS.indexOf(v as (typeof VENDORS)[number])));
    const cset = new Set(catSel.map((c) => CATEGORIES.indexOf(c as (typeof CATEGORIES)[number])));
    const next = new Uint8Array(models.meta.length);
    for (let m = 0; m < next.length; m++) {
      const ok = (!vendorSel.length || vset.has(models.vendor[m])) && (!catSel.length || cset.has(models.cat[m]));
      next[m] = ok && (!modelA || modelA[m]) ? 1 : 0;
    }
    modelA = next;
  }

  let planA: Uint8Array | null = null;
  if (use('plans') && f.plans.length) {
    planA = new Uint8Array(prep.planLabels.length);
    prep.planLabels.forEach((l, i) => {
      if (f.plans.includes(l)) planA![i] = 1;
    });
  }
  let dowA: Uint8Array | null = null;
  if (use('weekdays') && f.weekdays.length) {
    dowA = new Uint8Array(7);
    for (const d of f.weekdays) dowA[d] = 1;
  }
  const selection = use('selection') ? f.selection : 'all';
  const billing = use('billing') ? f.billing : 'all';
  const attribution = use('attribution') ? f.attribution : 'all';
  const minRow = use('minRow') ? f.minRow : null;
  const maxRow = use('maxRow') ? f.maxRow : null;

  // Free-text search: every whitespace-separated token must match one of the row's text dimensions.
  const tokens = use('search')
    ? f.search
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    : [];
  const searchDims: DimKey[] = ['user', 'model', 'org', 'costCenter', 'repo', 'product'];
  const searchMatch: Partial<Record<DimKey, Uint8Array[]>> = {};
  if (tokens.length) {
    for (const dk of searchDims) {
      searchMatch[dk] = tokens.map((t) => {
        const vals = store.dicts[dk].values;
        const a = new Uint8Array(vals.length);
        for (let i = 0; i < vals.length; i++) if (vals[i].toLowerCase().includes(t)) a[i] = 1;
        return a;
      });
    }
  }

  const needsMask =
    from !== null ||
    to !== null ||
    userA ||
    productA ||
    skuA ||
    orgA ||
    ccA ||
    repoA ||
    appA ||
    fileA ||
    modelA ||
    planA ||
    dowA ||
    selection !== 'all' ||
    billing !== 'all' ||
    attribution !== 'all' ||
    minRow !== null ||
    maxRow !== null ||
    tokens.length > 0;
  if (!needsMask) return null;

  const n = store.n;
  const mask = new Uint8Array(n);
  const { day, user, product, sku, model, org, app, repo, costCenter, file, auto, gross, net } = store;
  const lo = from ?? Number.NEGATIVE_INFINITY;
  const hi = to ?? Number.POSITIVE_INFINITY;
  const minDay = store.minDay;
  for (let i = 0; i < n; i++) {
    const d = day[i];
    if (d < lo || d > hi) continue;
    if (userA && !userA[user[i]]) continue;
    if (modelA && !modelA[model[i]]) continue;
    if (productA && !productA[product[i]]) continue;
    if (skuA && !skuA[sku[i]]) continue;
    if (orgA && !orgA[org[i]]) continue;
    if (ccA && !ccA[costCenter[i]]) continue;
    if (repoA && !repoA[repo[i]]) continue;
    if (appA && !appA[app[i]]) continue;
    if (fileA && !fileA[file[i]]) continue;
    if (planA && !planA[prep.planOfRow[i]]) continue;
    if (dowA && !dowA[prep.dowOfDay[d - minDay]]) continue;
    if (selection !== 'all' && (selection === 'auto') !== (auto[i] === 1)) continue;
    if (billing !== 'all' && (billing === 'billed') !== (net[i] > 1e-9)) continue;
    if (attribution !== 'all' && (attribution === 'attributed') !== (user[i] !== BLANK_ID)) continue;
    const g = gross[i];
    if (minRow !== null && g < minRow) continue;
    if (maxRow !== null && g > maxRow) continue;
    if (tokens.length) {
      let ok = true;
      for (let t = 0; t < tokens.length && ok; t++) {
        ok =
          searchMatch.user![t][user[i]] === 1 ||
          searchMatch.model![t][model[i]] === 1 ||
          searchMatch.org![t][org[i]] === 1 ||
          searchMatch.costCenter![t][costCenter[i]] === 1 ||
          searchMatch.repo![t][repo[i]] === 1 ||
          searchMatch.product![t][product[i]] === 1;
      }
      if (!ok) continue;
    }
    mask[i] = 1;
  }
  return mask;
}

export function maskCount(mask: Uint8Array | null, n: number): number {
  if (!mask) return n;
  let c = 0;
  for (let i = 0; i < mask.length; i++) c += mask[i];
  return c;
}

export function andMasks(a: Uint8Array | null, userAllowed: Uint8Array | null, user: Int32Array): Uint8Array | null {
  if (!userAllowed) return a;
  const n = user.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if ((a === null || a[i]) && userAllowed[user[i]]) out[i] = 1;
  }
  return out;
}

export { DIM_KEYS };
