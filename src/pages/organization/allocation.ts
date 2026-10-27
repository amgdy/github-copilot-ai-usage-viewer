import type { Aggregates, Measures } from '../../lib/analytics/aggregate';
import type { UserSet } from '../../lib/analytics/users';
import type { DataStore } from '../../lib/types';
import { t } from '../../i18n';

export type ShowbackDim = 'costCenter' | 'org';
export type ShowbackMethod = 'billed' | 'usage' | 'seats';

export interface ShowbackRow {
  id: number;
  name: string;
  unassigned: boolean;
  /** Users whose first cost center (or organization) is this group. */
  users: number;
  gross: number;
  /** Share of all usage. */
  share: number;
  /** Included credits of the group's users, in USD. 0 unless the method adds seat costs. */
  seat: number;
  overage: number;
  total: number;
  /** NaN when there is nothing to allocate. */
  shareOfTotal: number;
}

export interface Showback {
  rows: ShowbackRow[];
  users: number;
  gross: number;
  seat: number;
  overage: number;
  total: number;
  /** Users with usage in more than one group. Their seat cost is counted in the first group. */
  splitUsers: number;
}

const hasNamed = (m: Measures): boolean => {
  for (let id = 1; id < m.rows.length; id++) if (m.rows[id] > 0) return true;
  return false;
};

/** Cost center when the data has any, otherwise organization. Null when neither has a value. */
export function pickShowbackDim(agg: Aggregates): ShowbackDim | null {
  if (hasNamed(agg.costCenter)) return 'costCenter';
  if (hasNamed(agg.org)) return 'org';
  return null;
}

/**
 * Splits the bill between groups.
 * - billed: the overage on the group's own rows, as the report has it.
 * - usage: the total overage times the group's share of usage.
 * - seats: seat cost (included credits of the group's users) plus the `usage` overage.
 */
export function buildShowback(store: DataStore, agg: Aggregates, users: UserSet, dim: ShowbackDim, method: ShowbackMethod): Showback {
  const m = agg[dim];
  const { values, index } = store.dicts[dim];
  const seat = new Float64Array(m.rows.length);
  const people = new Int32Array(m.rows.length);
  let splitUsers = 0;
  for (const p of users.profiles) {
    const key = dim === 'costCenter' ? p.costCenter : p.org;
    const id = key === '' ? 0 : (index.get(key) ?? 0);
    seat[id] += p.allotment;
    people[id]++;
    if (id !== 0 && (dim === 'costCenter' ? p.costCenterMixed : p.orgMixed)) splitUsers++;
  }

  const totalGross = agg.totals.gross;
  const totalNet = agg.totals.net;
  const rows: ShowbackRow[] = [];
  for (let id = 0; id < m.rows.length; id++) {
    if (m.rows[id] <= 0 && people[id] === 0) continue;
    const gross = m.gross[id];
    const share = totalGross > 0 ? gross / totalGross : 0;
    const overage = method === 'billed' ? m.net[id] : totalNet * share;
    const seatCost = method === 'seats' ? seat[id] : 0;
    rows.push({
      id,
      name: id === 0 ? t('Unassigned') : values[id],
      unassigned: id === 0,
      users: people[id],
      gross,
      share,
      seat: seatCost,
      overage,
      total: seatCost + overage,
      shareOfTotal: 0,
    });
  }

  const sum = (f: (r: ShowbackRow) => number): number => rows.reduce((a, r) => a + f(r), 0);
  const total = sum((r) => r.total);
  for (const r of rows) r.shareOfTotal = total > 0 ? r.total / total : Number.NaN;
  rows.sort((a, b) => b.total - a.total || b.gross - a.gross);
  return { rows, users: sum((r) => r.users), gross: sum((r) => r.gross), seat: sum((r) => r.seat), overage: sum((r) => r.overage), total, splitUsers };
}
