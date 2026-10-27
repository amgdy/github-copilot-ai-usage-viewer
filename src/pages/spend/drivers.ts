import { msg, t } from '../../i18n';
import { rollupByCategory, rollupByVendor, type Aggregates, type Measures } from '../../lib/analytics/aggregate';
import type { Filters } from '../../lib/analytics/filters';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { VENDORS } from '../../lib/pricing/card';
import type { ModelTable } from '../../lib/pricing/models';
import { CATEGORIES, labelOf, type Category, type DataStore } from '../../lib/types';
import { fmtInt } from '../../lib/utils/format';

export type Driver = 'product' | 'sku' | 'tier' | 'vendor';
export type DriverMetric = 'gross' | 'net';

/** English labels; show them through t(). */
export const DRIVER_LABELS: Record<Driver, string> = { product: msg('Product'), sku: msg('SKU'), tier: msg('Model tier'), vendor: msg('Vendor') };

export interface DriverRow {
  /** The translated name to show. */
  name: string;
  /** The value to filter on, or null for the grouped remainder, which has no filter. */
  filter: string | null;
  gross: number;
  covered: number;
  billed: number;
  color?: string;
}

/** The filter that keeps only the rows of one product, SKU, model tier or vendor. */
export function filterPatch(driver: Driver, value: string): Partial<Filters> {
  switch (driver) {
    case 'product':
      return { products: [value] };
    case 'sku':
      return { skus: [value] };
    case 'tier':
      return { categories: [value] };
    case 'vendor':
      return { vendors: [value] };
  }
}

/** Every product, SKU, model tier or vendor with usage, largest first by the chosen metric. */
export function driverRows(driver: Driver, metric: DriverMetric, agg: Aggregates, store: DataStore, models: ModelTable): DriverRow[] {
  let m: Measures;
  let name: (i: number) => string;
  let filter: (i: number) => string;
  let color: ((i: number) => string | undefined) | undefined;
  if (driver === 'product' || driver === 'sku') {
    m = agg[driver];
    name = (i) => labelOf(driver, store.dicts[driver].values[i]);
    filter = (i) => store.dicts[driver].values[i];
  } else if (driver === 'tier') {
    m = rollupByCategory(models, agg.model);
    name = (i) => t(CATEGORIES[i]);
    filter = (i) => CATEGORIES[i];
    color = (i) => CATEGORY_COLORS[CATEGORIES[i] as Category];
  } else {
    m = rollupByVendor(models, agg.model);
    name = (i) => (VENDORS[i] === 'Other' ? t('Other') : VENDORS[i]);
    filter = (i) => VENDORS[i];
  }
  const rows: DriverRow[] = [];
  for (let i = 0; i < m.gross.length; i++) {
    if (!(m.gross[i] > 0 || m.net[i] > 0)) continue;
    rows.push({ name: name(i), filter: filter(i), gross: m.gross[i], covered: m.discount[i], billed: m.net[i], color: color?.(i) });
  }
  const key = metric === 'gross' ? 'gross' : 'billed';
  return rows.filter((r) => r[key] > 0.005).sort((a, b) => b[key] - a[key]);
}

/** Keeps the largest rows and folds the rest into one "Other" row. */
export function withOther(rows: DriverRow[], keep: number): DriverRow[] {
  if (rows.length <= keep + 1) return rows;
  const head = rows.slice(0, keep);
  const rest = rows.slice(keep);
  const sum = (f: (r: DriverRow) => number) => rest.reduce((a, r) => a + f(r), 0);
  return [
    ...head,
    { name: t('Other ({n})', { n: fmtInt(rest.length) }), filter: null, gross: sum((r) => r.gross), covered: sum((r) => r.covered), billed: sum((r) => r.billed) },
  ];
}
