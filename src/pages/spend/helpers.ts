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
export const capacityKnown = (m: MonthPool): boolean => !m.capacityExceeded && m.capacity > 0;

export type PoolGap = 'billing' | 'sizes' | 'exceeded';

/**
 * Why the pool of some months cannot be sized, so that a notice names the real reason. A file without a billing split
 * marks every month as exceeded, and a month without seat sizes does too once it has usage, so the order matters.
 */
export function poolGap(billing: boolean, months: MonthPool[]): PoolGap {
  if (!billing) return 'billing';
  return months.some((m) => m.capacity <= 0) ? 'sizes' : 'exceeded';
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
export function niceMax(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const f = v / pow;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * pow;
}

function topPositive(values: ArrayLike<number>, n: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < values.length; i++) if (values[i] > 0) ids.push(i);
  ids.sort((a, b) => values[b] - values[a]);
  return ids.length > n ? ids.slice(0, n) : ids;
}

const countPositive = (values: ArrayLike<number>): number => {
  let n = 0;
  for (let i = 0; i < values.length; i++) if (values[i] > 0) n++;
  return n;
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
export function splitChoices(agg: Aggregates, models: ModelTable, billing: boolean): SplitBy[] {
  const distinct: Record<SplitBy, number> = {
    coverage: billing ? 2 : 0,
    total: billing ? 0 : 2,
    product: countPositive(agg.product.gross),
    sku: countPositive(agg.sku.gross),
    tier: countPositive(rollupByCategory(models, agg.model).gross),
    vendor: countPositive(rollupByVendor(models, agg.model).gross),
    costCenter: countPositive(agg.costCenter.gross),
    org: countPositive(agg.org.gross),
  };
  return SPLIT_ORDER.filter((k) => distinct[k] >= 2);
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
function sumByBucket(b: Bucketer, rangeStart: number, values: ArrayLike<number>): Float64Array {
  const out = new Float64Array(b.count);
  for (let i = 0; i < values.length; i++) {
    const k = b.indexOf(rangeStart + i);
    if (k >= 0 && k < b.count) out[k] += values[i];
  }
  return out;
}

export function buildUsageSeries(a: UsageSeriesInput): UsageSeries {
  const { store, mask, range, agg, models, bucket, split, colors } = a;
  if (split === 'total') {
    const b = makeBucketer(range.start, range.end, bucket);
    const usage = sumByBucket(b, range.start, agg.days.gross);
    return {
      bucketer: b,
      labels: Array.from({ length: b.count }, (_, i) => b.label(i)),
      series: [{ name: t('Usage'), data: usage, color: colors.accent }],
      other: null,
      totals: usage.slice(),
    };
  }
  if (split === 'coverage') {
    const b = makeBucketer(range.start, range.end, bucket);
    const covered = sumByBucket(b, range.start, agg.days.discount);
    const billed = sumByBucket(b, range.start, agg.days.net);
    const totals = new Float64Array(b.count);
    for (let k = 0; k < b.count; k++) totals[k] = covered[k] + billed[k];
    return {
      bucketer: b,
      labels: Array.from({ length: b.count }, (_, i) => b.label(i)),
      series: [
        { name: t('Covered by included credits'), data: covered, color: colors.accent },
        { name: t('Billed on top of seats'), data: billed, color: colors.warn },
      ],
      other: null,
      totals,
    };
  }

  let dim: DimKey = 'model';
  let ids: number[];
  let names: string[];
  let groupOf: ((s: DataStore, i: number) => number) | undefined;
  let paint: (name: string) => string | undefined = () => undefined;
  if (split === 'tier') {
    ids = CATEGORIES.map((_, i) => i);
    names = CATEGORIES.map((c) => t(c));
    groupOf = (s, i) => models.cat[s.model[i]];
    const colorOf = new Map(CATEGORIES.map((c, i) => [names[i], CATEGORY_COLORS[c]]));
    paint = (n) => colorOf.get(n);
  } else if (split === 'vendor') {
    ids = VENDORS.map((_, i) => i);
    // Vendor names are brand names and stay as they are; only the catch-all "Other" is a word to translate.
    names = VENDORS.map((v) => (v === 'Other' ? t('Other') : v));
    groupOf = (s, i) => models.vendor[s.model[i]];
  } else {
    dim = split;
    ids = topPositive(agg[dim].gross, a.top ?? 7);
    names = ids.map((id) => labelOf(dim, store.dicts[dim].values[id]));
  }
  const s = stackedSeries(store, mask, range, dim, ids, 'gross', bucket, names, groupOf);
  const series: TimeSeriesInput[] = s.series.filter((x) => x.data.some((v) => v !== 0)).map((x) => ({ name: x.name, data: x.data, color: paint(x.name) }));
  const totals = new Float64Array(s.bucketer.count);
  for (const x of s.series) for (let k = 0; k < totals.length; k++) totals[k] += x.data[k];
  if (s.other) for (let k = 0; k < totals.length; k++) totals[k] += s.other[k];
  return { bucketer: s.bucketer, labels: s.labels, series, other: s.other, totals };
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

export function toCumulative(u: UsageSeries): UsageSeries {
  return {
    ...u,
    series: u.series.map((s) => ({ ...s, data: cumulate(s.data) })),
    other: u.other ? cumulate(u.other) : null,
    totals: cumulate(u.totals),
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
  for (const a of anomalies) {
    const i = bucketer.indexOf(a.day);
    if (i < 0 || i >= bucketer.count) continue;
    const list = byBucket.get(i);
    if (list) list.push(a);
    else byBucket.set(i, [a]);
  }
  return [...byBucket.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([index, days]) => ({ index, value: totals[index] ?? 0, days }));
}

/** The day range of one bucket, for zooming into a clicked bar. */
export function bucketRange(b: Bucketer, i: number, rangeEnd: number): { dateFrom: number; dateTo: number } {
  return { dateFrom: b.start(i), dateTo: i + 1 < b.count ? b.start(i + 1) - 1 : rangeEnd };
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
function monthTokens(agg: Aggregates, m: MonthPool): MonthTokens {
  const sum: MonthTokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  const first = Math.max(m.monthStart, agg.range.start) - agg.range.start;
  const last = Math.min(m.monthEnd, agg.range.end) - agg.range.start;
  for (let i = first; i <= last; i++) {
    sum.input += agg.days.input[i];
    sum.cacheRead += agg.days.cacheRead[i];
    sum.cacheWrite += agg.days.cacheWrite[i];
    sum.output += agg.days.output[i];
  }
  return sum;
}

/** A token count: the whole number below 1,000 and a compact one (12.3M) above. */
export const fmtTokens = (v: number): string => (Math.abs(v) >= 1000 ? fmtCompact(v) : fmtInt(v));

export function buildMonthRows(agg: Aggregates, store: DataStore, pool: PoolSummary, narrowed: boolean): MonthRow[] {
  const nU = store.dicts.user.values.length;
  const nM = agg.nMonths;
  return pool.months.map((m) => {
    let active = 0;
    let attributed = 0;
    let takers = 0;
    let takenUsd = 0;
    for (let u = 1; u < nU; u++) {
      const g = agg.userMonthGross[u * nM + m.slot];
      if (g > 0) {
        active++;
        attributed += g;
      }
      const quota = agg.monthQuota[u * nM + m.slot];
      if (quota > 0) {
        const over = g - quota * CREDIT_USD;
        if (over > 0.005) {
          takers++;
          takenUsd += over;
        }
      }
    }
    const known = !narrowed && capacityKnown(m);
    const partial = agg.range.start > Math.max(m.monthStart, store.minDay) || (m.complete && agg.range.end < Math.min(m.monthEnd, store.maxDay));
    return {
      m,
      known,
      partial,
      activeUsers: active,
      perActiveUser: active > 0 ? attributed / active : Number.NaN,
      takers,
      takenUsd,
      cost: known ? Math.max(m.capacity, m.gross) : Number.NaN,
      tokens: monthTokens(agg, m),
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
  const ms = pool.months;
  if (!ms.length || !ms.every(capacityKnown)) return { known: false, perMonth: Number.NaN, seats: Number.NaN, overage: Number.NaN };
  let seats = 0;
  let overage = 0;
  for (const m of ms) {
    seats += m.capacity;
    overage += Math.max(0, m.gross - m.capacity);
  }
  const n = ms.length;
  return { known: true, perMonth: (seats + overage) / n, seats: seats / n, overage: overage / n };
}

/** Months between the first and last month with usage that have no usage rows at all (absolute month indexes). */
export function gapMonths(months: MonthPool[]): number[] {
  if (months.length < 2) return [];
  const have = new Set(months.map((m) => m.month));
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
export function dailyCurves(m: MonthPool, range: Range): DailyCurves {
  const n = m.daysInMonth;
  const out: DailyCurves = { gross: new Array<number | null>(n).fill(null), discount: new Array<number | null>(n).fill(null), net: new Array<number | null>(n).fill(null) };
  const from = Math.max(m.monthStart, range.start);
  const to = m.complete ? Math.min(m.monthEnd, range.end) : m.lastDay;
  let k = 0;
  let g = 0;
  let d = 0;
  let nt = 0;
  for (let day = from; day <= to; day++) {
    while (k < m.cumulative.length && m.cumulative[k].day <= day) {
      g = m.cumulative[k].gross;
      d = m.cumulative[k].discount;
      nt = m.cumulative[k].net;
      k++;
    }
    const i = day - m.monthStart;
    out.gross[i] = g;
    out.discount[i] = d;
    out.net[i] = nt;
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
export function projectionPath(m: MonthPool): ProjectionPath | null {
  const p = m.projection;
  if (!p || p.daysLeft <= 0) return null;
  const n = m.daysInMonth;
  const start = p.asOf - m.monthStart;
  if (start < 0 || start >= n) return null;
  const line = (end: number): (number | null)[] => Array.from({ length: n }, (_, i) => (i < start ? null : p.mtdGross + ((end - p.mtdGross) * (i - start)) / p.daysLeft));
  return { startIndex: start, mid: line(p.projGross), low: line(p.projGrossLow), high: line(p.projGrossHigh) };
}

/** True when the billed projection of the month is a real figure. */
export function billedProjectionKnown(m: MonthPool, narrowed: boolean): boolean {
  if (narrowed || !m.projection) return false;
  return m.exhaustedOn !== null || capacityKnown(m);
}

/** Color of a budget gauge: red once the budget is used or projected to be, amber from 80%. */
export function budgetTone(burn: number, projectedBurn: number | null): 'good' | 'warn' | 'bad' {
  const worst = Math.max(Number.isFinite(burn) ? burn : 0, projectedBurn !== null && Number.isFinite(projectedBurn) ? projectedBurn : 0);
  return worst >= 1 ? 'bad' : worst >= 0.8 ? 'warn' : 'good';
}

/** A share of the budget as a whole percent with thousands separators, so an extreme overrun stays readable. */
export function fmtBudgetPct(v: number): string {
  return Number.isFinite(v) ? `${Math.round(v * 100).toLocaleString('en-US')}%` : '–';
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
export function buildSkuRows(store: DataStore, mask: Uint8Array | null, range: Range, agg: Aggregates): SkuRow[] {
  const nS = store.dicts.sku.values.length;
  const nU = store.dicts.user.values.length;
  const products: Set<number>[] = Array.from({ length: nS }, () => new Set<number>());
  const dense = nS * nU <= 30_000_000 ? new Uint8Array(nS * nU) : null;
  const sparse = dense ? null : new Set<number>();
  const users = new Int32Array(nS);
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = store.day[i];
    if (d < range.start || d > range.end) continue;
    const s = store.sku[i];
    products[s].add(store.product[i]);
    const u = store.user[i];
    if (u === BLANK_ID) continue;
    const key = s * nU + u;
    if (dense) {
      if (dense[key] === 0) {
        dense[key] = 1;
        users[s]++;
      }
    } else if (!sparse!.has(key)) {
      sparse!.add(key);
      users[s]++;
    }
  }
  const total = agg.totals.gross;
  const rows: SkuRow[] = [];
  for (let s = 0; s < nS; s++) {
    if (agg.sku.rows[s] === 0) continue;
    const productIds = [...products[s]].map((p) => store.dicts.product.values[p]);
    rows.push({
      id: s,
      sku: labelOf('sku', store.dicts.sku.values[s]),
      products: productIds.map((p) => labelOf('product', p)).join(', '),
      productIds,
      credits: agg.sku.credits[s],
      gross: agg.sku.gross[s],
      covered: agg.sku.discount[s],
      billed: agg.sku.net[s],
      share: total > 0 ? agg.sku.gross[s] / total : 0,
      users: users[s],
    });
  }
  return rows;
}
