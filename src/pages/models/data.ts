import type { Aggregates } from '../../lib/analytics/aggregate';
import type { Analysis } from '../../lib/analytics/analyze';
import type { ShiftRow } from '../../lib/analytics/levers';
import { makeBucketer, type Bucket, type Bucketer } from '../../lib/analytics/series';
import { cashSaving, monthInputs } from '../../lib/analytics/simulator';
import type { Vendor } from '../../lib/pricing/card';
import type { ModelTable } from '../../lib/pricing/models';
import { labelOf, type Category, type DataStore } from '../../lib/types';

export interface TopUser {
  id: number;
  name: string;
  /** Share of the model's usage that comes from this user. */
  share: number;
}

export interface ModelRow {
  id: number;
  /** The string stored in `Filters.models`. */
  value: string;
  label: string;
  vendor: Vendor;
  tier: Category;
  priced: boolean;
  users: number;
  /** Usage lines, not prompts. */
  requests: number;
  credits: number;
  gross: number;
  net: number;
  share: number;
  creditsPerRequest: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cacheHit: number;
  /** Price per 1M tokens on the price card. NaN when the model has no price. */
  priceIn: number;
  priceOut: number;
  autoGross: number;
  autoShare: number;
  longPremium: number;
  cheaper: { target: string; ratio: number } | null;
  topUser: TopUser | null;
}

function topUsers(aggregates: Aggregates, store: DataStore): (TopUser | null)[] | null {
  const grossByUserModel = aggregates.userModel;
  const modelCount = aggregates.nModels;
  if (!grossByUserModel || modelCount === 0) return null;
  const best = new Float64Array(modelCount);
  const bestUser = new Int32Array(modelCount).fill(-1);
  const userCount = Math.floor(grossByUserModel.length / modelCount);
  // User 0 is the blank (unattributed) user.
  for (let userId = 1; userId < userCount; userId++) {
    const base = userId * modelCount;
    for (let k = 0; k < modelCount; k++) {
      const userGross = grossByUserModel[base + k];
      if (userGross > best[k]) {
        best[k] = userGross;
        bestUser[k] = userId;
      }
    }
  }
  const names = store.dicts.user.values;
  return Array.from({ length: modelCount }, (_, modelId) => {
    const topUserId = bestUser[modelId];
    const total = aggregates.model.gross[modelId];
    return topUserId < 0 ? null : { id: topUserId, name: names[topUserId], share: total > 0 ? best[modelId] / total : 0 };
  });
}

/** One row per model that has usage in the current scope, largest usage first. */
export function buildModelRows(aggregates: Aggregates, models: ModelTable, store: DataStore, shift: ShiftRow[]): ModelRow[] {
  const measures = aggregates.model;
  const extra = aggregates.modelExtra;
  const total = aggregates.totals.gross;
  const cheaper = new Map<number, ShiftRow>();
  for (const shiftRow of shift) if (shiftRow.ratio < 1) cheaper.set(shiftRow.modelId, shiftRow);
  const top = topUsers(aggregates, store);

  const rows: ModelRow[] = [];
  for (let id = 0; id < models.meta.length; id++) {
    if (measures.rows[id] <= 0) continue;
    const meta = models.meta[id];
    const gross = measures.gross[id];
    const prompt = measures.input[id] + measures.cacheRead[id] + measures.cacheWrite[id];
    const shiftRow = cheaper.get(id);
    rows.push({
      id,
      value: meta.name,
      label: labelOf('model', meta.name),
      vendor: meta.vendor,
      tier: meta.category,
      priced: meta.priced,
      users: aggregates.usersIn.model[id],
      requests: measures.rows[id],
      credits: measures.credits[id],
      gross,
      net: measures.net[id],
      share: total > 0 ? gross / total : 0,
      creditsPerRequest: measures.credits[id] / measures.rows[id],
      input: measures.input[id],
      output: measures.output[id],
      cacheRead: measures.cacheRead[id],
      cacheWrite: measures.cacheWrite[id],
      cacheHit: prompt > 0 ? measures.cacheRead[id] / prompt : Number.NaN,
      priceIn: meta.base ? meta.base.input : Number.NaN,
      priceOut: meta.base ? meta.base.output : Number.NaN,
      autoGross: extra.autoGross[id],
      autoShare: gross > 0 ? extra.autoGross[id] / gross : Number.NaN,
      longPremium: extra.longPremium[id],
      cheaper: shiftRow ? { target: shiftRow.target, ratio: shiftRow.ratio } : null,
      topUser: top ? top[id] : null,
    });
  }
  rows.sort((a, b) => b.gross - a.gross);
  return rows;
}

export interface AutoSeries {
  bucketer: Bucketer;
  labels: string[];
  auto: Float64Array;
  manual: Float64Array;
}

/** Usage chosen by Auto and by hand, per bucket, from one scan of the rows in scope. */
export function autoManualSeries(store: DataStore, mask: Uint8Array | null, range: { start: number; end: number }, bucket: Bucket): AutoSeries {
  const bucketer = makeBucketer(range.start, range.end, bucket);
  const auto = new Float64Array(bucketer.count);
  const manual = new Float64Array(bucketer.count);
  const { day, gross, auto: isAuto } = store;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const rowDay = day[i];
    if (rowDay < range.start || rowDay > range.end) continue;
    const bucketIndex = bucketer.indexOf(rowDay);
    if (isAuto[i] === 1) auto[bucketIndex] += gross[i];
    else manual[bucketIndex] += gross[i];
  }
  return { bucketer: bucketer, labels: Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex)), auto, manual };
}

/** Date filter that zooms into bucket `i`. Null when the index is outside the series. */
export function bucketPatch(bucketer: Bucketer, bucketIndex: number, rangeEnd: number): { dateFrom: number; dateTo: number } | null {
  if (bucketIndex < 0 || bucketIndex >= bucketer.count) return null;
  return { dateFrom: bucketer.start(bucketIndex), dateTo: bucketIndex + 1 < bucketer.count ? bucketer.start(bucketIndex + 1) - 1 : rangeEnd };
}

/**
 * Average monthly bill reduction when usage falls by `saved` dollars over the period, using the same pool cost model as the
 * Recommendations simulator. Null when the pool cannot be judged (filtered view or no months). Zero when included credits
 * cover all usage even after the reduction.
 */
export function monthlyCash(analysis: Analysis, saved: number): number | null {
  if (analysis.narrowed) return null;
  const months = monthInputs(analysis.pool);
  const baseline = analysis.agg.totals.gross;
  if (months.length === 0 || !(baseline > 0)) return null;
  if (!(saved > 0)) return 0;
  const fraction = Math.min(1, saved / baseline);
  return cashSaving(months, fraction, 0) / months.length;
}
