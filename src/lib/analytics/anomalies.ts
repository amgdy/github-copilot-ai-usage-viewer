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

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Percentile with linear interpolation; `q` in [0, 1]. */
export function quantile(sorted: number[], fraction: number): number {
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/**
 * Days whose usage is far above the typical day: robust z ≥ 3.5 (median / MAD) and at least 1.5× the median.
 * Needs ≥ 10 days with usage so one busy day cannot define "normal".
 */
export function findAnomalyDays(
  store: DataStore,
  mask: Uint8Array | null,
  aggregates: Aggregates,
  options: { minDays?: number; z?: number; multiple?: number; limit?: number } = {},
): AnomalyDay[] {
  const { minDays = 10, z: minZScore = 3.5, multiple = 1.5, limit = 6 } = options;
  const dailyGross = aggregates.days.gross;
  const spend: number[] = [];
  for (let i = 0; i < dailyGross.length; i++) if (dailyGross[i] > 0) spend.push(dailyGross[i]);
  if (spend.length < minDays) return [];
  const medianSpend = median(spend);
  const medianDeviation = median(spend.map((amount) => Math.abs(amount - medianSpend)));
  const meanAbs = spend.reduce((total, amount) => total + Math.abs(amount - medianSpend), 0) / spend.length;
  const scale = medianDeviation > 0 ? medianDeviation / 0.6745 : meanAbs > 0 ? meanAbs * 1.2533 : 0;
  if (scale <= 0 || medianSpend <= 0) return [];

  const flagged: AnomalyDay[] = [];
  for (let i = 0; i < dailyGross.length; i++) {
    if (dailyGross[i] <= 0) continue;
    const zScore = (dailyGross[i] - medianSpend) / scale;
    if (zScore >= minZScore && dailyGross[i] >= multiple * medianSpend) {
      flagged.push({ day: aggregates.range.start + i, gross: dailyGross[i], baseline: medianSpend, z: zScore, multiple: dailyGross[i] / medianSpend, topUsers: [], topModels: [] });
    }
  }
  flagged.sort((a, b) => b.gross - a.gross);
  const top = flagged.slice(0, limit);
  if (!top.length) return top;

  const byDay = new Map(top.map((anomaly) => [anomaly.day, { users: new Map<number, number>(), models: new Map<number, number>() }]));
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const slot = byDay.get(store.day[i]);
    if (!slot) continue;
    slot.users.set(store.user[i], (slot.users.get(store.user[i]) ?? 0) + store.gross[i]);
    slot.models.set(store.model[i], (slot.models.get(store.model[i]) ?? 0) + store.gross[i]);
  }
  const rank = (grossById: Map<number, number>) =>
    [...grossById.entries()]
      .map(([id, gross]) => ({ id, gross }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 3);
  for (const anomaly of top) {
    const slot = byDay.get(anomaly.day)!;
    anomaly.topUsers = rank(slot.users);
    anomaly.topModels = rank(slot.models);
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
export function weekOverWeek(aggregates: Aggregates): Trend {
  const dailyGross = aggregates.days.gross;
  const dayCount = dailyGross.length;
  let recent = 0;
  let prior = 0;
  for (let i = Math.max(0, dayCount - 7); i < dayCount; i++) recent += dailyGross[i];
  for (let i = Math.max(0, dayCount - 14); i < dayCount - 7; i++) prior += dailyGross[i];
  return { recent, prior, change: prior > 0 ? recent / prior - 1 : Number.NaN, reliable: dayCount >= 14 && prior > 0 };
}
