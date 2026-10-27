import type { DataStore } from '../types';
import type { Aggregates } from './aggregate';

export interface AnomalyDay {
  day: number;
  gross: number;
  /** Median daily usage of the scope. */
  baseline: number;
  /** Robust z-score (median/MAD based). */
  z: number;
  multiple: number;
  topUsers: { id: number; gross: number }[];
  topModels: { id: number; gross: number }[];
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Percentile with linear interpolation; `q` in [0, 1]. */
export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Days whose usage is far above the typical day: robust z ≥ 3.5 (median / MAD) and at least 1.5× the median.
 * Needs ≥ 10 days with usage so one busy day cannot define "normal".
 */
export function findAnomalyDays(
  store: DataStore,
  mask: Uint8Array | null,
  agg: Aggregates,
  opts: { minDays?: number; z?: number; multiple?: number; limit?: number } = {},
): AnomalyDay[] {
  const { minDays = 10, z: zCut = 3.5, multiple = 1.5, limit = 6 } = opts;
  const g = agg.days.gross;
  const spend: number[] = [];
  for (let i = 0; i < g.length; i++) if (g[i] > 0) spend.push(g[i]);
  if (spend.length < minDays) return [];
  const med = median(spend);
  const mad = median(spend.map((x) => Math.abs(x - med)));
  const meanAbs = spend.reduce((a, x) => a + Math.abs(x - med), 0) / spend.length;
  const scale = mad > 0 ? mad / 0.6745 : meanAbs > 0 ? meanAbs * 1.2533 : 0;
  if (scale <= 0 || med <= 0) return [];

  const flagged: AnomalyDay[] = [];
  for (let i = 0; i < g.length; i++) {
    if (g[i] <= 0) continue;
    const z = (g[i] - med) / scale;
    if (z >= zCut && g[i] >= multiple * med) {
      flagged.push({ day: agg.range.start + i, gross: g[i], baseline: med, z, multiple: g[i] / med, topUsers: [], topModels: [] });
    }
  }
  flagged.sort((a, b) => b.gross - a.gross);
  const top = flagged.slice(0, limit);
  if (!top.length) return top;

  const byDay = new Map(top.map((a) => [a.day, { users: new Map<number, number>(), models: new Map<number, number>() }]));
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const slot = byDay.get(store.day[i]);
    if (!slot) continue;
    slot.users.set(store.user[i], (slot.users.get(store.user[i]) ?? 0) + store.gross[i]);
    slot.models.set(store.model[i], (slot.models.get(store.model[i]) ?? 0) + store.gross[i]);
  }
  const rank = (m: Map<number, number>) =>
    [...m.entries()]
      .map(([id, gross]) => ({ id, gross }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 3);
  for (const a of top) {
    const slot = byDay.get(a.day)!;
    a.topUsers = rank(slot.users);
    a.topModels = rank(slot.models);
  }
  return top;
}

export interface Trend {
  recent: number;
  prior: number;
  change: number;
  reliable: boolean;
}

/** Last 7 days of the scope versus the 7 days before (needs at least 14 days). */
export function weekOverWeek(agg: Aggregates): Trend {
  const g = agg.days.gross;
  const n = g.length;
  let recent = 0;
  let prior = 0;
  for (let i = Math.max(0, n - 7); i < n; i++) recent += g[i];
  for (let i = Math.max(0, n - 14); i < n - 7; i++) prior += g[i];
  return { recent, prior, change: prior > 0 ? recent / prior - 1 : Number.NaN, reliable: n >= 14 && prior > 0 };
}
