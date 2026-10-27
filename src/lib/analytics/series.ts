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
  start(bucketIndex: number): number;
  label(bucketIndex: number): string;
}

const weekStart = (day: number) => day - dowOf(day);

export function makeBucketer(start: number, end: number, bucket: Bucket): Bucketer {
  if (bucket === 'day') {
    return {
      count: Math.max(0, end - start + 1),
      indexOf: (day) => day - start,
      start: (bucketIndex) => start + bucketIndex,
      label: (bucketIndex) => fmtDay(start + bucketIndex),
    };
  }
  if (bucket === 'week') {
    const firstWeekStart = weekStart(start);
    return {
      count: Math.max(0, Math.floor((weekStart(end) - firstWeekStart) / 7) + 1),
      indexOf: (day) => Math.floor((weekStart(day) - firstWeekStart) / 7),
      start: (bucketIndex) => Math.max(start, firstWeekStart + bucketIndex * 7),
      label: (bucketIndex) => t('Week of {date}', { date: fmtDay(Math.max(start, firstWeekStart + bucketIndex * 7)) }),
    };
  }
  const firstMonthIndex = monthIndexOf(start);
  return {
    count: Math.max(0, monthIndexOf(end) - firstMonthIndex + 1),
    indexOf: (day) => monthIndexOf(day) - firstMonthIndex,
    start: (bucketIndex) => Math.max(start, monthStartDay(firstMonthIndex + bucketIndex)),
    label: (bucketIndex) => monthLabel(firstMonthIndex + bucketIndex),
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
  dimension: DimKey,
  ids: number[],
  measure: SeriesMeasure,
  bucket: Bucket,
  names: string[],
  groupOf?: (store: DataStore, rowIndex: number) => number,
): StackedSeries {
  const bucketer = makeBucketer(range.start, range.end, bucket);
  const indexById = new Map<number, number>();
  ids.forEach((id, seriesIndex) => indexById.set(id, seriesIndex));
  const data = ids.map(() => new Float64Array(bucketer.count));
  const other = new Float64Array(bucketer.count);
  const column = store[dimension] as Int32Array;
  const sourceField = MEASURE_SOURCE[measure];
  const values = sourceField ? (store[sourceField] as Float64Array) : null;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const day = store.day[i];
    if (day < range.start || day > range.end) continue;
    const bucketIndex = bucketer.indexOf(day);
    const key = groupOf ? groupOf(store, i) : column[i];
    const seriesIndex = indexById.get(key);
    const amount = values ? values[i] : 1;
    if (seriesIndex === undefined) other[bucketIndex] += amount;
    else data[seriesIndex][bucketIndex] += amount;
  }
  return {
    bucketer: bucketer,
    labels: Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex)),
    series: ids.map((id, seriesIndex) => ({ id, name: names[seriesIndex] ?? String(id), data: data[seriesIndex] })),
    other: other.some((amount) => amount !== 0) ? other : null,
  };
}

/** Daily gross for a set of users, from one scan. */
export function userDailySeries(
  store: DataStore,
  mask: Uint8Array | null,
  range: { start: number; end: number },
  userIds: number[],
): Map<number, Float32Array> {
  const dayCount = Math.max(0, range.end - range.start + 1);
  const out = new Map<number, Float32Array>();
  for (const id of userIds) out.set(id, new Float32Array(dayCount));
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const dailyGross = out.get(store.user[i]);
    if (!dailyGross) continue;
    const day = store.day[i];
    if (day < range.start || day > range.end) continue;
    dailyGross[day - range.start] += store.gross[i];
  }
  return out;
}

export interface FacetCounts {
  rows: Float64Array;
  gross: Float64Array;
}

export type FacetKey = Extract<ListFilterKey, 'users' | 'products' | 'skus' | 'models' | 'orgs' | 'costCenters' | 'repos' | 'apps' | 'files' | 'vendors' | 'categories' | 'plans'> | 'weekdays';

const KEY_TO_DIM = Object.fromEntries((Object.entries(DIM_FILTER_KEY) as [DimKey, ListFilterKey][]).map(([dimension, filterKey]) => [filterKey, dimension])) as Record<string, DimKey>;

/**
 * Row and spend totals for every option of one filter, with all *other* filters applied.
 * Powers the counts shown next to each option in the filter panel.
 */
export function facetCounts(
  store: DataStore,
  prepared: Prepared,
  models: ModelTable,
  filters: Filters,
  key: FacetKey,
): FacetCounts {
  const mask = buildMask(store, prepared, models, filters, key);
  const dimension = KEY_TO_DIM[key];
  let size: number;
  let idOf: (rowIndex: number) => number;
  if (dimension) {
    size = store.dicts[dimension].values.length;
    const column = store[dimension] as Int32Array;
    idOf = (rowIndex) => column[rowIndex];
  } else if (key === 'vendors') {
    size = VENDORS.length;
    idOf = (rowIndex) => models.vendor[store.model[rowIndex]];
  } else if (key === 'categories') {
    size = CATEGORIES.length;
    idOf = (rowIndex) => models.cat[store.model[rowIndex]];
  } else if (key === 'plans') {
    size = Math.max(1, prepared.planLabels.length);
    idOf = (rowIndex) => prepared.planOfRow[rowIndex];
  } else {
    size = 7;
    idOf = (rowIndex) => prepared.dowOfDay[store.day[rowIndex] - store.minDay];
  }
  const rows = new Float64Array(size);
  const gross = new Float64Array(size);
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const optionId = idOf(i);
    rows[optionId]++;
    gross[optionId] += store.gross[i];
  }
  return { rows, gross };
}
