import type { DataStore, DimKey } from '../types';
import type { ModelTable } from '../pricing/models';
import { VENDORS } from '../pricing/card';
import { dowOf, fmtDay, monthIndexOf, monthLabel, monthStartDay } from '../utils/date';
import { CATEGORIES } from '../types';
import { buildMask, DIM_FILTER_KEY, type Filters, type ListFilterKey } from './filters';
import type { Prepared } from './prepare';
import { t } from '../../i18n/core';

export type Bucket = 'day' | 'week' | 'month';
export type SeriesMeasure = 'gross' | 'net' | 'discount' | 'credits' | 'rows';

export interface Bucketer {
  count: number;
  indexOf(day: number): number;
  start(i: number): number;
  label(i: number): string;
}

const weekStart = (d: number) => d - dowOf(d);

export function makeBucketer(start: number, end: number, bucket: Bucket): Bucketer {
  if (bucket === 'day') {
    return {
      count: Math.max(0, end - start + 1),
      indexOf: (d) => d - start,
      start: (i) => start + i,
      label: (i) => fmtDay(start + i),
    };
  }
  if (bucket === 'week') {
    const w0 = weekStart(start);
    return {
      count: Math.max(0, Math.floor((weekStart(end) - w0) / 7) + 1),
      indexOf: (d) => Math.floor((weekStart(d) - w0) / 7),
      start: (i) => Math.max(start, w0 + i * 7),
      label: (i) => t('Week of {date}', { date: fmtDay(Math.max(start, w0 + i * 7)) }),
    };
  }
  const m0 = monthIndexOf(start);
  return {
    count: Math.max(0, monthIndexOf(end) - m0 + 1),
    indexOf: (d) => monthIndexOf(d) - m0,
    start: (i) => Math.max(start, monthStartDay(m0 + i)),
    label: (i) => monthLabel(m0 + i),
  };
}

export interface StackedSeries {
  bucketer: Bucketer;
  labels: string[];
  series: { id: number; name: string; data: Float64Array }[];
  other: Float64Array | null;
}

const MEASURE_SOURCE: Record<SeriesMeasure, 'gross' | 'net' | 'discount' | 'qty' | null> = {
  gross: 'gross',
  net: 'net',
  discount: 'discount',
  credits: 'qty',
  rows: null,
};

/**
 * One scan that builds a stacked time series for the given dimension values (`ids`);
 * everything else is collected in `other`.
 */
export function stackedSeries(
  store: DataStore,
  mask: Uint8Array | null,
  range: { start: number; end: number },
  dim: DimKey,
  ids: number[],
  measure: SeriesMeasure,
  bucket: Bucket,
  names: string[],
  groupOf?: (store: DataStore, i: number) => number,
): StackedSeries {
  const b = makeBucketer(range.start, range.end, bucket);
  const pos = new Map<number, number>();
  ids.forEach((id, k) => pos.set(id, k));
  const data = ids.map(() => new Float64Array(b.count));
  const other = new Float64Array(b.count);
  const col = store[dim] as Int32Array;
  const src = MEASURE_SOURCE[measure];
  const values = src ? (store[src] as Float64Array) : null;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = store.day[i];
    if (d < range.start || d > range.end) continue;
    const bi = b.indexOf(d);
    const key = groupOf ? groupOf(store, i) : col[i];
    const k = pos.get(key);
    const v = values ? values[i] : 1;
    if (k === undefined) other[bi] += v;
    else data[k][bi] += v;
  }
  return {
    bucketer: b,
    labels: Array.from({ length: b.count }, (_, i) => b.label(i)),
    series: ids.map((id, k) => ({ id, name: names[k] ?? String(id), data: data[k] })),
    other: other.some((x) => x !== 0) ? other : null,
  };
}

/** Daily gross for a set of users, from one scan. */
export function userDailySeries(
  store: DataStore,
  mask: Uint8Array | null,
  range: { start: number; end: number },
  userIds: number[],
): Map<number, Float32Array> {
  const n = Math.max(0, range.end - range.start + 1);
  const out = new Map<number, Float32Array>();
  for (const id of userIds) out.set(id, new Float32Array(n));
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const arr = out.get(store.user[i]);
    if (!arr) continue;
    const d = store.day[i];
    if (d < range.start || d > range.end) continue;
    arr[d - range.start] += store.gross[i];
  }
  return out;
}

export interface FacetCounts {
  rows: Float64Array;
  gross: Float64Array;
}

export type FacetKey = Extract<ListFilterKey, 'users' | 'products' | 'skus' | 'models' | 'orgs' | 'costCenters' | 'repos' | 'apps' | 'files' | 'vendors' | 'categories' | 'plans'> | 'weekdays';

const KEY_TO_DIM = Object.fromEntries((Object.entries(DIM_FILTER_KEY) as [DimKey, ListFilterKey][]).map(([d, k]) => [k, d])) as Record<string, DimKey>;

/**
 * Row and spend totals for every option of one filter, with all *other* filters applied.
 * Powers the counts shown next to each option in the filter panel.
 */
export function facetCounts(
  store: DataStore,
  prep: Prepared,
  models: ModelTable,
  filters: Filters,
  key: FacetKey,
): FacetCounts {
  const mask = buildMask(store, prep, models, filters, key);
  const dim = KEY_TO_DIM[key];
  let size: number;
  let idOf: (i: number) => number;
  if (dim) {
    size = store.dicts[dim].values.length;
    const col = store[dim] as Int32Array;
    idOf = (i) => col[i];
  } else if (key === 'vendors') {
    size = VENDORS.length;
    idOf = (i) => models.vendor[store.model[i]];
  } else if (key === 'categories') {
    size = CATEGORIES.length;
    idOf = (i) => models.cat[store.model[i]];
  } else if (key === 'plans') {
    size = Math.max(1, prep.planLabels.length);
    idOf = (i) => prep.planOfRow[i];
  } else {
    size = 7;
    idOf = (i) => prep.dowOfDay[store.day[i] - store.minDay];
  }
  const rows = new Float64Array(size);
  const gross = new Float64Array(size);
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const k = idOf(i);
    rows[k]++;
    gross[k] += store.gross[i];
  }
  return { rows, gross };
}
