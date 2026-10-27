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

function topUsers(agg: Aggregates, store: DataStore): (TopUser | null)[] | null {
  const um = agg.userModel;
  const nM = agg.nModels;
  if (!um || nM === 0) return null;
  const best = new Float64Array(nM);
  const bestUser = new Int32Array(nM).fill(-1);
  const nU = Math.floor(um.length / nM);
  // User 0 is the blank (unattributed) user.
  for (let u = 1; u < nU; u++) {
    const base = u * nM;
    for (let k = 0; k < nM; k++) {
      const v = um[base + k];
      if (v > best[k]) {
        best[k] = v;
        bestUser[k] = u;
      }
    }
  }
  const names = store.dicts.user.values;
  return Array.from({ length: nM }, (_, k) => {
    const u = bestUser[k];
    const total = agg.model.gross[k];
    return u < 0 ? null : { id: u, name: names[u], share: total > 0 ? best[k] / total : 0 };
  });
}

/** One row per model that has usage in the current scope, largest usage first. */
export function buildModelRows(agg: Aggregates, models: ModelTable, store: DataStore, shift: ShiftRow[]): ModelRow[] {
  const m = agg.model;
  const extra = agg.modelExtra;
  const total = agg.totals.gross;
  const cheaper = new Map<number, ShiftRow>();
  for (const s of shift) if (s.ratio < 1) cheaper.set(s.modelId, s);
  const top = topUsers(agg, store);

  const rows: ModelRow[] = [];
  for (let id = 0; id < models.meta.length; id++) {
    if (m.rows[id] <= 0) continue;
    const meta = models.meta[id];
    const gross = m.gross[id];
    const prompt = m.input[id] + m.cacheRead[id] + m.cacheWrite[id];
    const c = cheaper.get(id);
    rows.push({
      id,
      value: meta.name,
      label: labelOf('model', meta.name),
      vendor: meta.vendor,
      tier: meta.category,
      priced: meta.priced,
      users: agg.usersIn.model[id],
      requests: m.rows[id],
      credits: m.credits[id],
      gross,
      net: m.net[id],
      share: total > 0 ? gross / total : 0,
      creditsPerRequest: m.credits[id] / m.rows[id],
      input: m.input[id],
      output: m.output[id],
      cacheRead: m.cacheRead[id],
      cacheWrite: m.cacheWrite[id],
      cacheHit: prompt > 0 ? m.cacheRead[id] / prompt : Number.NaN,
      priceIn: meta.base ? meta.base.input : Number.NaN,
      priceOut: meta.base ? meta.base.output : Number.NaN,
      autoGross: extra.autoGross[id],
      autoShare: gross > 0 ? extra.autoGross[id] / gross : Number.NaN,
      longPremium: extra.longPremium[id],
      cheaper: c ? { target: c.target, ratio: c.ratio } : null,
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
  const b = makeBucketer(range.start, range.end, bucket);
  const auto = new Float64Array(b.count);
  const manual = new Float64Array(b.count);
  const { day, gross, auto: isAuto } = store;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = day[i];
    if (d < range.start || d > range.end) continue;
    const k = b.indexOf(d);
    if (isAuto[i] === 1) auto[k] += gross[i];
    else manual[k] += gross[i];
  }
  return { bucketer: b, labels: Array.from({ length: b.count }, (_, i) => b.label(i)), auto, manual };
}

/** Date filter that zooms into bucket `i`. Null when the index is outside the series. */
export function bucketPatch(b: Bucketer, i: number, rangeEnd: number): { dateFrom: number; dateTo: number } | null {
  if (i < 0 || i >= b.count) return null;
  return { dateFrom: b.start(i), dateTo: i + 1 < b.count ? b.start(i + 1) - 1 : rangeEnd };
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
