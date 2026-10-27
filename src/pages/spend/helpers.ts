import type { TimeSeriesInput } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { rollupByCategory, rollupByVendor, type Aggregates } from '../../lib/analytics/aggregate';
import type { AnomalyDay } from '../../lib/analytics/anomalies';
import type { DataCoverage } from '../../lib/analytics/coverage';
import type { MonthPool, PoolSummary } from '../../lib/analytics/pool';
import { BLANK_ID } from '../../lib/analytics/prepare';
import { makeBucketer, stackedSeries, type Bucket, type Bucketer } from '../../lib/analytics/series';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { VENDORS } from '../../lib/pricing/card';
import type { ModelTable } from '../../lib/pricing/models';
import { msg, t } from '../../i18n';
import { CATEGORIES, CREDIT_USD, labelOf, type DataStore, type DimKey } from '../../lib/types';
import { fmtCompact, fmtInt } from '../../lib/utils/format';

type Range = { start: number; end: number };

/** A pool size is only a real figure when the pool was not exceeded and at least one seat is known. */
export const capacityKnown = (month: MonthPool): boolean => !month.capacityExceeded && month.capacity > 0;

export type PoolGap = 'billing' | 'sizes' | 'exceeded';

/**
 * Why the pool of some months cannot be sized, so that a notice names the real reason. A file without a billing split
 * marks every month as exceeded, and a month without seat sizes does too once it has usage, so the order matters.
 */
export function poolGap(billing: boolean, months: MonthPool[]): PoolGap {
  if (!billing) return 'billing';
  return months.some((month) => month.capacity <= 0) ? 'sizes' : 'exceeded';
}

/** The sentence of the "Pool figures are not available" notice, shared with the Overview wording. */
export function poolColumnsText(coverage: Pick<DataCoverage, 'billing' | 'quota'>): string {
  if (!coverage.billing && !coverage.quota) {
    return t(
      'The file has no discount_amount or net_amount column and no total_monthly_quota column, so the included credits cannot be sized or tracked. Load the complete usage report to see how much of the pool was used and when it ran out.',
    );
  }
  if (!coverage.billing) {
    return t(
      'The file has no discount_amount or net_amount column, so the included credits cannot be tracked. Load the complete usage report to see how much of the pool was used and when it ran out.',
    );
  }
  return t(
    'The file has no total_monthly_quota column, so the size of the included credits is unknown. Load the complete usage report to see how much of the pool was used and when it ran out.',
  );
}

/** Rounds up to 1, 2, 2.5, 5 or 10 times a power of ten, for a tidy axis maximum. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const powerOfTen = 10 ** Math.floor(Math.log10(value));
  const scaled = value / powerOfTen;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * powerOfTen;
}

function topPositive(values: ArrayLike<number>, limit: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < values.length; i++) if (values[i] > 0) ids.push(i);
  ids.sort((a, b) => values[b] - values[a]);
  return ids.length > limit ? ids.slice(0, limit) : ids;
}

const countPositive = (values: ArrayLike<number>): number => {
  let positiveCount = 0;
  for (let i = 0; i < values.length; i++) if (values[i] > 0) positiveCount++;
  return positiveCount;
};

export function busiestDay(gross: ArrayLike<number>, start: number): { day: number; gross: number } | null {
  let best = -1;
  let max = 0;
  for (let i = 0; i < gross.length; i++) {
    if (gross[i] > max) {
      max = gross[i];
      best = i;
    }
  }
  return best < 0 ? null : { day: start + best, gross: max };
}

// Usage over time

export type SplitBy = 'coverage' | 'total' | 'product' | 'sku' | 'tier' | 'vendor' | 'costCenter' | 'org';

/** English names; show them through t(). */
export const SPLIT_LABELS: Record<SplitBy, string> = {
  coverage: msg('Covered vs billed'),
  total: msg('Total usage'),
  product: msg('Product'),
  sku: msg('SKU'),
  tier: msg('Model tier'),
  vendor: msg('Vendor'),
  costCenter: msg('Cost center'),
  org: msg('Organization'),
};

const SPLIT_ORDER: SplitBy[] = ['coverage', 'total', 'product', 'sku', 'tier', 'vendor', 'costCenter', 'org'];

/**
 * Splits that have at least two distinct values with usage. "Covered vs billed" needs the billing split, and
 * "Total usage" (one stack) stands in for it when the file does not say what was billed.
 */
export function splitChoices(aggregates: Aggregates, models: ModelTable, billing: boolean): SplitBy[] {
  const distinct: Record<SplitBy, number> = {
    coverage: billing ? 2 : 0,
    total: billing ? 0 : 2,
    product: countPositive(aggregates.product.gross),
    sku: countPositive(aggregates.sku.gross),
    tier: countPositive(rollupByCategory(models, aggregates.model).gross),
    vendor: countPositive(rollupByVendor(models, aggregates.model).gross),
    costCenter: countPositive(aggregates.costCenter.gross),
    org: countPositive(aggregates.org.gross),
  };
  return SPLIT_ORDER.filter((split) => distinct[split] >= 2);
}

export interface UsageSeries {
  bucketer: Bucketer;
  labels: string[];
  series: TimeSeriesInput[];
  other: Float64Array | null;
  /** Stack height per bucket. */
  totals: Float64Array;
}

export interface UsageSeriesInput {
  store: DataStore;
  mask: Uint8Array | null;
  range: Range;
  agg: Aggregates;
  models: ModelTable;
  bucket: Bucket;
  split: SplitBy;
  colors: ChartColors;
  /** How many values get their own color before the rest is grouped as "Other". */
  top?: number;
}

/** Adds up a per-day series into the buckets of a bucketer (day i of the series is range.start + i). */
function sumByBucket(bucketer: Bucketer, rangeStart: number, values: ArrayLike<number>): Float64Array {
  const out = new Float64Array(bucketer.count);
  for (let i = 0; i < values.length; i++) {
    const bucketIndex = bucketer.indexOf(rangeStart + i);
    if (bucketIndex >= 0 && bucketIndex < bucketer.count) out[bucketIndex] += values[i];
  }
  return out;
}

export function buildUsageSeries(input: UsageSeriesInput): UsageSeries {
  const { store, mask, range, agg: aggregates, models, bucket, split, colors } = input;
  if (split === 'total') {
    const bucketer = makeBucketer(range.start, range.end, bucket);
    const usage = sumByBucket(bucketer, range.start, aggregates.days.gross);
    return {
      bucketer: bucketer,
      labels: Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex)),
      series: [{ name: t('Usage'), data: usage, color: colors.accent }],
      other: null,
      totals: usage.slice(),
    };
  }
  if (split === 'coverage') {
    const bucketer = makeBucketer(range.start, range.end, bucket);
    const covered = sumByBucket(bucketer, range.start, aggregates.days.discount);
    const billed = sumByBucket(bucketer, range.start, aggregates.days.net);
    const totals = new Float64Array(bucketer.count);
    for (let k = 0; k < bucketer.count; k++) totals[k] = covered[k] + billed[k];
    return {
      bucketer: bucketer,
      labels: Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex)),
      series: [
        { name: t('Covered by included credits'), data: covered, color: colors.accent },
        { name: t('Billed on top of seats'), data: billed, color: colors.warn },
      ],
      other: null,
      totals,
    };
  }

  let dimension: DimKey = 'model';
  let ids: number[];
  let names: string[];
  let groupOf: ((dataStore: DataStore, rowIndex: number) => number) | undefined;
  let paint: (name: string) => string | undefined = () => undefined;
  if (split === 'tier') {
    ids = CATEGORIES.map((_, categoryIndex) => categoryIndex);
    names = CATEGORIES.map((category) => t(category));
    groupOf = (dataStore, rowIndex) => models.cat[dataStore.model[rowIndex]];
    const colorOf = new Map(CATEGORIES.map((category, categoryIndex) => [names[categoryIndex], CATEGORY_COLORS[category]]));
    paint = (name) => colorOf.get(name);
  } else if (split === 'vendor') {
    ids = VENDORS.map((_, vendorIndex) => vendorIndex);
    // Vendor names are brand names and stay as they are; only the catch-all "Other" is a word to translate.
    names = VENDORS.map((vendor) => (vendor === 'Other' ? t('Other') : vendor));
    groupOf = (dataStore, rowIndex) => models.vendor[dataStore.model[rowIndex]];
  } else {
    dimension = split;
    ids = topPositive(aggregates[dimension].gross, input.top ?? 7);
    names = ids.map((id) => labelOf(dimension, store.dicts[dimension].values[id]));
  }
  const stacked = stackedSeries(store, mask, range, dimension, ids, 'gross', bucket, names, groupOf);
  const series: TimeSeriesInput[] = stacked.series.filter((layer) => layer.data.some((value) => value !== 0)).map((layer) => ({ name: layer.name, data: layer.data, color: paint(layer.name) }));
  const totals = new Float64Array(stacked.bucketer.count);
  for (const layer of stacked.series) for (let k = 0; k < totals.length; k++) totals[k] += layer.data[k];
  if (stacked.other) for (let k = 0; k < totals.length; k++) totals[k] += stacked.other[k];
  return { bucketer: stacked.bucketer, labels: stacked.labels, series, other: stacked.other, totals };
}

export function cumulate(values: ArrayLike<number>): Float64Array {
  const out = new Float64Array(values.length);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    out[i] = sum;
  }
  return out;
}

export function toCumulative(usage: UsageSeries): UsageSeries {
  return {
    ...usage,
    series: usage.series.map((layer) => ({ ...layer, data: cumulate(layer.data) })),
    other: usage.other ? cumulate(usage.other) : null,
    totals: cumulate(usage.totals),
  };
}

export interface AnomalyMark {
  /** Bucket index. */
  index: number;
  /** Height of the stack in that bucket, where the pin sits. */
  value: number;
  days: AnomalyDay[];
}

export function anomalyMarks(anomalies: AnomalyDay[], bucketer: Bucketer, totals: ArrayLike<number>): AnomalyMark[] {
  const byBucket = new Map<number, AnomalyDay[]>();
  for (const anomaly of anomalies) {
    const bucketIndex = bucketer.indexOf(anomaly.day);
    if (bucketIndex < 0 || bucketIndex >= bucketer.count) continue;
    const list = byBucket.get(bucketIndex);
    if (list) list.push(anomaly);
    else byBucket.set(bucketIndex, [anomaly]);
  }
  return [...byBucket.entries()]
    .sort((leftEntry, rightEntry) => leftEntry[0] - rightEntry[0])
    .map(([index, days]) => ({ index, value: totals[index] ?? 0, days }));
}

/** The day range of one bucket, for zooming into a clicked bar. */
export function bucketRange(bucketer: Bucketer, bucketIndex: number, rangeEnd: number): { dateFrom: number; dateTo: number } {
  return { dateFrom: bucketer.start(bucketIndex), dateTo: bucketIndex + 1 < bucketer.count ? bucketer.start(bucketIndex + 1) - 1 : rangeEnd };
}

// Months

export interface MonthTokens {
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
}

export interface MonthRow {
  m: MonthPool;
  /** The pool size of this month is a real figure and may be shown. */
  known: boolean;
  /** The selected dates cut into this month, so its pool figures are understated. */
  partial: boolean;
  activeUsers: number;
  perActiveUser: number;
  /** Users who used more than the credits of their own seat, and by how much together (USD). */
  takers: number;
  takenUsd: number;
  /** Larger of the seat credits and usage (USD): what seats plus overage cost. NaN when the pool size is unknown. */
  cost: number;
  /** Token totals of the month inside the selected dates. All zero when the file has no token columns. */
  tokens: MonthTokens;
}

/** Token totals of one month, read from the daily series (day i of the series is agg.range.start + i). */
function monthTokens(aggregates: Aggregates, month: MonthPool): MonthTokens {
  const sum: MonthTokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  const first = Math.max(month.monthStart, aggregates.range.start) - aggregates.range.start;
  const last = Math.min(month.monthEnd, aggregates.range.end) - aggregates.range.start;
  for (let i = first; i <= last; i++) {
    sum.input += aggregates.days.input[i];
    sum.cacheRead += aggregates.days.cacheRead[i];
    sum.cacheWrite += aggregates.days.cacheWrite[i];
    sum.output += aggregates.days.output[i];
  }
  return sum;
}

/** A token count: the whole number below 1,000 and a compact one (12.3M) above. */
export const fmtTokens = (tokenCount: number): string => (Math.abs(tokenCount) >= 1000 ? fmtCompact(tokenCount) : fmtInt(tokenCount));

export function buildMonthRows(aggregates: Aggregates, store: DataStore, pool: PoolSummary, narrowed: boolean): MonthRow[] {
  const userCount = store.dicts.user.values.length;
  const monthCount = aggregates.nMonths;
  return pool.months.map((month) => {
    let active = 0;
    let attributed = 0;
    let takers = 0;
    let takenUsd = 0;
    for (let userId = 1; userId < userCount; userId++) {
      const userGross = aggregates.userMonthGross[userId * monthCount + month.slot];
      if (userGross > 0) {
        active++;
        attributed += userGross;
      }
      const quota = aggregates.monthQuota[userId * monthCount + month.slot];
      if (quota > 0) {
        const over = userGross - quota * CREDIT_USD;
        if (over > 0.005) {
          takers++;
          takenUsd += over;
        }
      }
    }
    const known = !narrowed && capacityKnown(month);
    const partial = aggregates.range.start > Math.max(month.monthStart, store.minDay) || (month.complete && aggregates.range.end < Math.min(month.monthEnd, store.maxDay));
    return {
      m: month,
      known,
      partial,
      activeUsers: active,
      perActiveUser: active > 0 ? attributed / active : Number.NaN,
      takers,
      takenUsd,
      cost: known ? Math.max(month.capacity, month.gross) : Number.NaN,
      tokens: monthTokens(aggregates, month),
    };
  });
}

export interface CostEstimate {
  known: boolean;
  perMonth: number;
  seats: number;
  overage: number;
}

/** Average monthly cost of seats plus overage: the larger of the pool and the usage, per month. */
export function estimateMonthlyCost(pool: PoolSummary): CostEstimate {
  const months = pool.months;
  if (!months.length || !months.every(capacityKnown)) return { known: false, perMonth: Number.NaN, seats: Number.NaN, overage: Number.NaN };
  let seats = 0;
  let overage = 0;
  for (const month of months) {
    seats += month.capacity;
    overage += Math.max(0, month.gross - month.capacity);
  }
  const monthCount = months.length;
  return { known: true, perMonth: (seats + overage) / monthCount, seats: seats / monthCount, overage: overage / monthCount };
}

/** Months between the first and last month with usage that have no usage rows at all (absolute month indexes). */
export function gapMonths(months: MonthPool[]): number[] {
  if (months.length < 2) return [];
  const have = new Set(months.map((month) => month.month));
  const out: number[] = [];
  for (let k = months[0].month; k <= months[months.length - 1].month; k++) if (!have.has(k)) out.push(k);
  return out;
}

// One month, day by day

export interface DailyCurves {
  gross: (number | null)[];
  discount: (number | null)[];
  net: (number | null)[];
}

/**
 * Running totals for each calendar day of the month. Days before the selected range and, for a month in progress,
 * days after the last day with data stay null.
 */
export function dailyCurves(month: MonthPool, range: Range): DailyCurves {
  const dayCount = month.daysInMonth;
  const out: DailyCurves = { gross: new Array<number | null>(dayCount).fill(null), discount: new Array<number | null>(dayCount).fill(null), net: new Array<number | null>(dayCount).fill(null) };
  const from = Math.max(month.monthStart, range.start);
  const to = month.complete ? Math.min(month.monthEnd, range.end) : month.lastDay;
  let cumulativeIndex = 0;
  let runningGross = 0;
  let runningDiscount = 0;
  let runningNet = 0;
  for (let day = from; day <= to; day++) {
    while (cumulativeIndex < month.cumulative.length && month.cumulative[cumulativeIndex].day <= day) {
      runningGross = month.cumulative[cumulativeIndex].gross;
      runningDiscount = month.cumulative[cumulativeIndex].discount;
      runningNet = month.cumulative[cumulativeIndex].net;
      cumulativeIndex++;
    }
    const dayIndex = day - month.monthStart;
    out.gross[dayIndex] = runningGross;
    out.discount[dayIndex] = runningDiscount;
    out.net[dayIndex] = runningNet;
  }
  return out;
}

export interface ProjectionPath {
  /** Index of the last day with data, where the projection starts. */
  startIndex: number;
  mid: (number | null)[];
  low: (number | null)[];
  high: (number | null)[];
}

/** Straight lines from usage so far to the projected month-end totals. */
export function projectionPath(month: MonthPool): ProjectionPath | null {
  const projection = month.projection;
  if (!projection || projection.daysLeft <= 0) return null;
  const dayCount = month.daysInMonth;
  const start = projection.asOf - month.monthStart;
  if (start < 0 || start >= dayCount) return null;
  const line = (end: number): (number | null)[] => Array.from({ length: dayCount }, (_, dayIndex) => (dayIndex < start ? null : projection.mtdGross + ((end - projection.mtdGross) * (dayIndex - start)) / projection.daysLeft));
  return { startIndex: start, mid: line(projection.projGross), low: line(projection.projGrossLow), high: line(projection.projGrossHigh) };
}

/** True when the billed projection of the month is a real figure. */
export function billedProjectionKnown(month: MonthPool, narrowed: boolean): boolean {
  if (narrowed || !month.projection) return false;
  return month.exhaustedOn !== null || capacityKnown(month);
}

/** Color of a budget gauge: red once the budget is used or projected to be, amber from 80%. */
export function budgetTone(burn: number, projectedBurn: number | null): 'good' | 'warn' | 'bad' {
  const worst = Math.max(Number.isFinite(burn) ? burn : 0, projectedBurn !== null && Number.isFinite(projectedBurn) ? projectedBurn : 0);
  return worst >= 1 ? 'bad' : worst >= 0.8 ? 'warn' : 'good';
}

/** A share of the budget as a whole percent with thousands separators, so an extreme overrun stays readable. */
export function fmtBudgetPct(share: number): string {
  return Number.isFinite(share) ? `${Math.round(share * 100).toLocaleString('en-US')}%` : '–';
}

// SKU table

export interface SkuRow {
  id: number;
  sku: string;
  products: string;
  /** Raw product values of the report (for example "copilot"), in the order they first appear, for icons. */
  productIds: string[];
  credits: number;
  gross: number;
  covered: number;
  billed: number;
  share: number;
  users: number;
}

/** One scan over the rows in scope: which products each SKU belongs to and how many distinct users it has. */
export function buildSkuRows(store: DataStore, mask: Uint8Array | null, range: Range, aggregates: Aggregates): SkuRow[] {
  const skuCount = store.dicts.sku.values.length;
  const userCount = store.dicts.user.values.length;
  const products: Set<number>[] = Array.from({ length: skuCount }, () => new Set<number>());
  const dense = skuCount * userCount <= 30_000_000 ? new Uint8Array(skuCount * userCount) : null;
  const sparse = dense ? null : new Set<number>();
  const users = new Int32Array(skuCount);
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const day = store.day[i];
    if (day < range.start || day > range.end) continue;
    const skuId = store.sku[i];
    products[skuId].add(store.product[i]);
    const userId = store.user[i];
    if (userId === BLANK_ID) continue;
    const key = skuId * userCount + userId;
    if (dense) {
      if (dense[key] === 0) {
        dense[key] = 1;
        users[skuId]++;
      }
    } else if (!sparse!.has(key)) {
      sparse!.add(key);
      users[skuId]++;
    }
  }
  const total = aggregates.totals.gross;
  const rows: SkuRow[] = [];
  for (let skuId = 0; skuId < skuCount; skuId++) {
    if (aggregates.sku.rows[skuId] === 0) continue;
    const productIds = [...products[skuId]].map((productIndex) => store.dicts.product.values[productIndex]);
    rows.push({
      id: skuId,
      sku: labelOf('sku', store.dicts.sku.values[skuId]),
      products: productIds.map((productId) => labelOf('product', productId)).join(', '),
      productIds,
      credits: aggregates.sku.credits[skuId],
      gross: aggregates.sku.gross[skuId],
      covered: aggregates.sku.discount[skuId],
      billed: aggregates.sku.net[skuId],
      share: total > 0 ? aggregates.sku.gross[skuId] / total : 0,
      users: users[skuId],
    });
  }
  return rows;
}
