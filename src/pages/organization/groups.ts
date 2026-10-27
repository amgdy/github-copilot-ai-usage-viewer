import { makeMeasures, type Aggregates, type Measures } from '../../lib/analytics/aggregate';
import type { Filters } from '../../lib/analytics/filters';
import { BLANK_ID } from '../../lib/analytics/prepare';
import type { RosterEntry } from '../../lib/analytics/settings';
import { buildLicenseIndex } from '../../lib/licenses';
import type { ModelTable } from '../../lib/pricing/models';
import { CATEGORIES, labelOf, type DataStore } from '../../lib/types';
import { msg, t } from '../../i18n';
import { filterPatch, firstListed, listHasTeams, type StoreDim } from './dimensions';

type Range = { start: number; end: number; length: number };

/** The group of every row: `col[i]` is the group id of row i, from 0 to `count - 1`. */
export interface GroupColumn {
  col: ArrayLike<number>;
  count: number;
}

/** The groups of a report column: the dictionary ids of that column. */
export function storeColumn(store: DataStore, dim: StoreDim): GroupColumn {
  return { col: store[dim], count: store.dicts[dim].values.length };
}

/** Token counts on the rows of a group. All 0 when the file has no token columns. */
export interface TokenCounts {
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
}

/** Everything the model was given to read: input, cache read and cache write tokens. */
export const promptTokens = (tk: TokenCounts): number => tk.input + tk.cacheRead + tk.cacheWrite;

export const totalTokens = (tk: TokenCounts): number => promptTokens(tk) + tk.output;

/** Cache read tokens as a fraction of the prompt tokens. NaN when there are no prompt tokens. */
export function cacheHitRate(tk: TokenCounts): number {
  const prompt = promptTokens(tk);
  return prompt > 0 ? tk.cacheRead / prompt : Number.NaN;
}

export interface Group extends TokenCounts {
  id: number;
  /** Dictionary string, the value a filter expects ('' for the blank group). */
  value: string;
  name: string;
  blank: boolean;
  rows: number;
  gross: number;
  discount: number;
  net: number;
  /** Distinct users with usage in the group. */
  users: number;
  /** Share of all usage in the view. */
  share: number;
  /** Usage of the last 7 days and of the 7 days before. Both are 0 when the range is shorter than 14 days. */
  recent: number;
  prior: number;
  /** The filter that narrows the whole report to this group. */
  filter: Partial<Filters>;
}

export interface GroupTrends {
  recent: Float64Array;
  prior: Float64Array;
  /** The range has two full weeks. */
  reliable: boolean;
}

/** Usage of the last 7 days of the range against the 7 days before, per group id, in one pass over the rows. */
export function computeTrends(store: DataStore, mask: Uint8Array | null, range: Range, column: GroupColumn): GroupTrends {
  const recent = new Float64Array(column.count);
  const prior = new Float64Array(column.count);
  const reliable = range.length >= 14;
  if (!reliable) return { recent, prior, reliable };
  const { col } = column;
  const { day, gross } = store;
  const recentFrom = range.end - 6;
  const priorFrom = range.end - 13;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = day[i];
    if (d < priorFrom || d > range.end) continue;
    if (d >= recentFrom) recent[col[i]] += gross[i];
    else prior[col[i]] += gross[i];
  }
  return { recent, prior, reliable };
}

function groupOf(m: Measures, id: number, total: number, trends: GroupTrends) {
  return {
    rows: m.rows[id],
    gross: m.gross[id],
    discount: m.discount[id],
    net: m.net[id],
    input: m.input[id],
    cacheRead: m.cacheRead[id],
    cacheWrite: m.cacheWrite[id],
    output: m.output[id],
    share: total > 0 ? m.gross[id] / total : 0,
    recent: trends.recent[id],
    prior: trends.prior[id],
  };
}

/** Every group of a report column with rows in the scope, largest usage first. */
export function buildGroups(store: DataStore, agg: Aggregates, dim: StoreDim, trends: GroupTrends): Group[] {
  const m = agg[dim];
  const usersIn = agg.usersIn[dim];
  const values = store.dicts[dim].values;
  const total = agg.totals.gross;
  const out: Group[] = [];
  for (let id = 0; id < m.rows.length; id++) {
    if (m.rows[id] <= 0) continue;
    out.push({
      id,
      value: values[id],
      name: labelOf(dim, values[id]),
      blank: id === BLANK_ID,
      users: usersIn[id],
      filter: filterPatch(dim, values[id]),
      ...groupOf(m, id, total, trends),
    });
  }
  return out.sort((a, b) => b.gross - a.gross);
}

/** Team group of the rows without a username. */
export const TEAM_NO_USER = 0;
/** Team group of the users who hold no seat in the license list. */
export const TEAM_NOT_LISTED = 1;
/** Team group of the seats the license list names no team for. */
export const TEAM_NO_TEAM = 2;

const TEAM_BLANK_NAMES = [msg('Not in the license list'), msg('No team in the license list')];

function teamBlankName(id: number): string {
  return id === TEAM_NO_USER ? labelOf('user', '') : t(TEAM_BLANK_NAMES[id - 1]);
}

/** The team of every row, from the license list. Ids 0 to 2 are the groups without a team, teams start at 3. */
export interface TeamColumn extends GroupColumn {
  col: Int32Array;
  /** The group id of every user id of the report. */
  byUser: Int32Array;
  /** The team names as the license list spells them, by group id. Empty for the ids below 3. */
  names: string[];
}

/**
 * Groups the rows by the team the license list names for the user. A seat with several teams counts in the first
 * one. Team names that differ only in case are one team. Null when the license list names no team.
 */
export function teamColumn(store: DataStore, roster: readonly RosterEntry[], rosterAsOf?: string): TeamColumn | null {
  if (!listHasTeams(roster)) return null;
  const index = buildLicenseIndex(roster, rosterAsOf);
  if (index === null) return null;
  const names = ['', '', ''];
  const ids = new Map<string, number>();
  const users = store.dicts.user.values;
  const byUser = new Int32Array(users.length);
  for (let u = 0; u < users.length; u++) {
    if (u === BLANK_ID) {
      byUser[u] = TEAM_NO_USER;
      continue;
    }
    const entry = index.seats.get(users[u].trim().toLowerCase());
    if (entry === undefined) {
      byUser[u] = TEAM_NOT_LISTED;
      continue;
    }
    const team = firstListed(entry.team);
    if (team === '') {
      byUser[u] = TEAM_NO_TEAM;
      continue;
    }
    const key = team.toLowerCase();
    let id = ids.get(key);
    if (id === undefined) {
      id = names.length;
      ids.set(key, id);
      names.push(team);
    }
    byUser[u] = id;
  }
  const col = new Int32Array(store.n);
  const { user } = store;
  for (let i = 0; i < store.n; i++) col[i] = byUser[user[i]];
  return { col, count: names.length, byUser, names };
}

/** Every team group with rows in the scope, largest usage first. One pass over the rows. */
export function buildTeamGroups(store: DataStore, mask: Uint8Array | null, range: Range, team: TeamColumn, trends: GroupTrends, totalGross: number): Group[] {
  const m = makeMeasures(team.count);
  const nUsers = store.dicts.user.values.length;
  const seen = new Uint8Array(nUsers);
  const members: string[][] = Array.from({ length: team.count }, () => []);
  const usersIn = new Float64Array(team.count);
  const { col } = team;
  const { user, day, gross, discount, net, input, output, cacheRead, cacheWrite } = store;
  const userValues = store.dicts.user.values;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = day[i];
    if (d < range.start || d > range.end) continue;
    const g = col[i];
    m.rows[g]++;
    m.gross[g] += gross[i];
    m.discount[g] += discount[i];
    m.net[g] += net[i];
    m.input[g] += input[i];
    m.output[g] += output[i];
    m.cacheRead[g] += cacheRead[i];
    m.cacheWrite[g] += cacheWrite[i];
    const u = user[i];
    if (seen[u] === 0) {
      seen[u] = 1;
      members[g].push(userValues[u]);
      if (u !== BLANK_ID) usersIn[g]++;
    }
  }
  const out: Group[] = [];
  for (let id = 0; id < team.count; id++) {
    if (m.rows[id] <= 0) continue;
    const blank = id <= TEAM_NO_TEAM;
    const name = blank ? teamBlankName(id) : team.names[id];
    out.push({
      id,
      value: blank ? '' : name,
      name,
      blank,
      users: usersIn[id],
      filter: { users: members[id] },
      ...groupOf(m, id, totalGross, trends),
    });
  }
  return out.sort((a, b) => b.gross - a.gross);
}

/** Usage per user in a 30.4-day month. NaN when the group has no users. */
export function perUserMonth(g: Group, perMonth: number): number {
  return g.users > 0 ? (g.gross * perMonth) / g.users : Number.NaN;
}

/** Change of the last 7 days against the 7 days before as a fraction. Null when there is nothing to compare. */
export function trendChange(g: Group): number | null {
  return g.prior > 0 ? g.recent / g.prior - 1 : null;
}

export interface Summary {
  /** Groups with a value, largest usage first. */
  named: Group[];
  /** Usage of every group without a value together. Null when there is none. */
  blank: { gross: number; share: number } | null;
  largest: Group | null;
  top3Share: number;
  /** The group (blank included) that carries the largest part of the billed overage. */
  billedLeader: Group | null;
}

export function summarize(groups: Group[]): Summary {
  const named = groups.filter((g) => !g.blank);
  let top3Share = 0;
  for (let i = 0; i < Math.min(3, named.length); i++) top3Share += named[i].share;
  let billedLeader: Group | null = null;
  let blankGross = 0;
  let blankShare = 0;
  let hasBlank = false;
  for (const g of groups) {
    if (g.net > 0.005 && (billedLeader === null || g.net > billedLeader.net)) billedLeader = g;
    if (g.blank) {
      hasBlank = true;
      blankGross += g.gross;
      blankShare += g.share;
    }
  }
  const blank = hasBlank ? { gross: blankGross, share: blankShare } : null;
  return { named, blank, largest: named[0] ?? null, top3Share, billedLeader };
}

export type BreakdownDim = 'product' | 'org' | 'costCenter';

export interface GroupDetailData {
  rows: number;
  gross: number;
  discount: number;
  net: number;
  /** Usage by the breakdown dimension, largest first. */
  by: { id: number; gross: number }[];
  /** Usage by model tier, indexed like `CATEGORIES`. */
  tiers: Float64Array;
  /** One entry per day of the range. */
  daily: Float64Array;
  dailyNet: Float64Array;
}

/** What one group is made of, in one pass over the rows. */
export function computeDetail(
  store: DataStore,
  mask: Uint8Array | null,
  range: Range,
  models: ModelTable,
  column: GroupColumn,
  id: number,
  byDim: BreakdownDim,
): GroupDetailData {
  const { col } = column;
  const byCol = store[byDim];
  const sums = new Float64Array(store.dicts[byDim].values.length);
  const tiers = new Float64Array(CATEGORIES.length);
  const daily = new Float64Array(range.length);
  const dailyNet = new Float64Array(range.length);
  const { day, gross, net, discount, model } = store;
  let rows = 0;
  let g = 0;
  let nt = 0;
  let dc = 0;
  for (let i = 0; i < store.n; i++) {
    if (col[i] !== id) continue;
    if (mask !== null && mask[i] === 0) continue;
    const d = day[i];
    if (d < range.start || d > range.end) continue;
    rows++;
    g += gross[i];
    nt += net[i];
    dc += discount[i];
    sums[byCol[i]] += gross[i];
    tiers[models.cat[model[i]]] += gross[i];
    daily[d - range.start] += gross[i];
    dailyNet[d - range.start] += net[i];
  }
  const by: { id: number; gross: number }[] = [];
  for (let k = 0; k < sums.length; k++) if (sums[k] > 0) by.push({ id: k, gross: sums[k] });
  by.sort((a, b) => b.gross - a.gross);
  return { rows, gross: g, discount: dc, net: nt, by, tiers, daily, dailyNet };
}

export interface GroupUser {
  id: number;
  gross: number;
}

/** The `limit` users with the most usage inside each of the listed groups, in one pass over the rows. */
export function topUsersByGroup(
  store: DataStore,
  mask: Uint8Array | null,
  range: Range,
  column: GroupColumn,
  groupIds: number[],
  limit: number,
): Map<number, GroupUser[]> {
  const wanted = new Uint8Array(column.count);
  for (const id of groupIds) wanted[id] = 1;
  const nUsers = store.dicts.user.values.length;
  const { col } = column;
  const { user, day, gross } = store;
  const sums = new Map<number, number>();
  for (let i = 0; i < store.n; i++) {
    const g = col[i];
    if (wanted[g] === 0) continue;
    const u = user[i];
    if (u === BLANK_ID) continue;
    if (mask !== null && mask[i] === 0) continue;
    const d = day[i];
    if (d < range.start || d > range.end) continue;
    const key = g * nUsers + u;
    sums.set(key, (sums.get(key) ?? 0) + gross[i]);
  }
  const out = new Map<number, GroupUser[]>();
  for (const [key, value] of sums) {
    const g = Math.floor(key / nUsers);
    const entry = { id: key - g * nUsers, gross: value };
    const list = out.get(g);
    if (list) list.push(entry);
    else out.set(g, [entry]);
  }
  for (const list of out.values()) {
    list.sort((a, b) => b.gross - a.gross);
    if (list.length > limit) list.length = limit;
  }
  return out;
}
