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
export function storeColumn(store: DataStore, dimension: StoreDim): GroupColumn {
  return { col: store[dimension], count: store.dicts[dimension].values.length };
}

/** Token counts on the rows of a group. All 0 when the file has no token columns. */
export interface TokenCounts {
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
}

/** Everything the model was given to read: input, cache read and cache write tokens. */
export const promptTokens = (tokens: TokenCounts): number => tokens.input + tokens.cacheRead + tokens.cacheWrite;

export const totalTokens = (tokens: TokenCounts): number => promptTokens(tokens) + tokens.output;

/** Cache read tokens as a fraction of the prompt tokens. NaN when there are no prompt tokens. */
export function cacheHitRate(tokens: TokenCounts): number {
  const prompt = promptTokens(tokens);
  return prompt > 0 ? tokens.cacheRead / prompt : Number.NaN;
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
  const { col: groupByRow } = column;
  const { day, gross } = store;
  const recentFrom = range.end - 6;
  const priorFrom = range.end - 13;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const rowDay = day[i];
    if (rowDay < priorFrom || rowDay > range.end) continue;
    if (rowDay >= recentFrom) recent[groupByRow[i]] += gross[i];
    else prior[groupByRow[i]] += gross[i];
  }
  return { recent, prior, reliable };
}

function groupOf(measures: Measures, id: number, total: number, trends: GroupTrends) {
  return {
    rows: measures.rows[id],
    gross: measures.gross[id],
    discount: measures.discount[id],
    net: measures.net[id],
    input: measures.input[id],
    cacheRead: measures.cacheRead[id],
    cacheWrite: measures.cacheWrite[id],
    output: measures.output[id],
    share: total > 0 ? measures.gross[id] / total : 0,
    recent: trends.recent[id],
    prior: trends.prior[id],
  };
}

/** Every group of a report column with rows in the scope, largest usage first. */
export function buildGroups(store: DataStore, aggregates: Aggregates, dimension: StoreDim, trends: GroupTrends): Group[] {
  const measures = aggregates[dimension];
  const usersIn = aggregates.usersIn[dimension];
  const values = store.dicts[dimension].values;
  const total = aggregates.totals.gross;
  const out: Group[] = [];
  for (let id = 0; id < measures.rows.length; id++) {
    if (measures.rows[id] <= 0) continue;
    out.push({
      id,
      value: values[id],
      name: labelOf(dimension, values[id]),
      blank: id === BLANK_ID,
      users: usersIn[id],
      filter: filterPatch(dimension, values[id]),
      ...groupOf(measures, id, total, trends),
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
  for (let userId = 0; userId < users.length; userId++) {
    if (userId === BLANK_ID) {
      byUser[userId] = TEAM_NO_USER;
      continue;
    }
    const entry = index.seats.get(users[userId].trim().toLowerCase());
    if (entry === undefined) {
      byUser[userId] = TEAM_NOT_LISTED;
      continue;
    }
    const team = firstListed(entry.team);
    if (team === '') {
      byUser[userId] = TEAM_NO_TEAM;
      continue;
    }
    const key = team.toLowerCase();
    let id = ids.get(key);
    if (id === undefined) {
      id = names.length;
      ids.set(key, id);
      names.push(team);
    }
    byUser[userId] = id;
  }
  const groupByRow = new Int32Array(store.n);
  const { user } = store;
  for (let i = 0; i < store.n; i++) groupByRow[i] = byUser[user[i]];
  return { col: groupByRow, count: names.length, byUser, names };
}

/** Every team group with rows in the scope, largest usage first. One pass over the rows. */
export function buildTeamGroups(store: DataStore, mask: Uint8Array | null, range: Range, team: TeamColumn, trends: GroupTrends, totalGross: number): Group[] {
  const measures = makeMeasures(team.count);
  const nUsers = store.dicts.user.values.length;
  const seen = new Uint8Array(nUsers);
  const members: string[][] = Array.from({ length: team.count }, () => []);
  const usersIn = new Float64Array(team.count);
  const { col: groupByRow } = team;
  const { user, day, gross, discount, net, input, output, cacheRead, cacheWrite } = store;
  const userValues = store.dicts.user.values;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const rowDay = day[i];
    if (rowDay < range.start || rowDay > range.end) continue;
    const groupId = groupByRow[i];
    measures.rows[groupId]++;
    measures.gross[groupId] += gross[i];
    measures.discount[groupId] += discount[i];
    measures.net[groupId] += net[i];
    measures.input[groupId] += input[i];
    measures.output[groupId] += output[i];
    measures.cacheRead[groupId] += cacheRead[i];
    measures.cacheWrite[groupId] += cacheWrite[i];
    const userId = user[i];
    if (seen[userId] === 0) {
      seen[userId] = 1;
      members[groupId].push(userValues[userId]);
      if (userId !== BLANK_ID) usersIn[groupId]++;
    }
  }
  const out: Group[] = [];
  for (let id = 0; id < team.count; id++) {
    if (measures.rows[id] <= 0) continue;
    const blank = id <= TEAM_NO_TEAM;
    const name = blank ? teamBlankName(id) : team.names[id];
    out.push({
      id,
      value: blank ? '' : name,
      name,
      blank,
      users: usersIn[id],
      filter: { users: members[id] },
      ...groupOf(measures, id, totalGross, trends),
    });
  }
  return out.sort((a, b) => b.gross - a.gross);
}

/** Usage per user in a 30.4-day month. NaN when the group has no users. */
export function perUserMonth(group: Group, perMonth: number): number {
  return group.users > 0 ? (group.gross * perMonth) / group.users : Number.NaN;
}

/** Change of the last 7 days against the 7 days before as a fraction. Null when there is nothing to compare. */
export function trendChange(group: Group): number | null {
  return group.prior > 0 ? group.recent / group.prior - 1 : null;
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
  const named = groups.filter((group) => !group.blank);
  let top3Share = 0;
  for (let i = 0; i < Math.min(3, named.length); i++) top3Share += named[i].share;
  let billedLeader: Group | null = null;
  let blankGross = 0;
  let blankShare = 0;
  let hasBlank = false;
  for (const group of groups) {
    if (group.net > 0.005 && (billedLeader === null || group.net > billedLeader.net)) billedLeader = group;
    if (group.blank) {
      hasBlank = true;
      blankGross += group.gross;
      blankShare += group.share;
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
  const { col: groupByRow } = column;
  const byCol = store[byDim];
  const sums = new Float64Array(store.dicts[byDim].values.length);
  const tiers = new Float64Array(CATEGORIES.length);
  const daily = new Float64Array(range.length);
  const dailyNet = new Float64Array(range.length);
  const { day, gross, net, discount, model } = store;
  let rows = 0;
  let totalGross = 0;
  let totalNet = 0;
  let totalDiscount = 0;
  for (let i = 0; i < store.n; i++) {
    if (groupByRow[i] !== id) continue;
    if (mask !== null && mask[i] === 0) continue;
    const rowDay = day[i];
    if (rowDay < range.start || rowDay > range.end) continue;
    rows++;
    totalGross += gross[i];
    totalNet += net[i];
    totalDiscount += discount[i];
    sums[byCol[i]] += gross[i];
    tiers[models.cat[model[i]]] += gross[i];
    daily[rowDay - range.start] += gross[i];
    dailyNet[rowDay - range.start] += net[i];
  }
  const by: { id: number; gross: number }[] = [];
  for (let k = 0; k < sums.length; k++) if (sums[k] > 0) by.push({ id: k, gross: sums[k] });
  by.sort((a, b) => b.gross - a.gross);
  return { rows, gross: totalGross, discount: totalDiscount, net: totalNet, by, tiers, daily, dailyNet };
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
  const { col: groupByRow } = column;
  const { user, day, gross } = store;
  const sums = new Map<number, number>();
  for (let i = 0; i < store.n; i++) {
    const groupId = groupByRow[i];
    if (wanted[groupId] === 0) continue;
    const userId = user[i];
    if (userId === BLANK_ID) continue;
    if (mask !== null && mask[i] === 0) continue;
    const rowDay = day[i];
    if (rowDay < range.start || rowDay > range.end) continue;
    const key = groupId * nUsers + userId;
    sums.set(key, (sums.get(key) ?? 0) + gross[i]);
  }
  const out = new Map<number, GroupUser[]>();
  for (const [key, value] of sums) {
    const groupId = Math.floor(key / nUsers);
    const entry = { id: key - groupId * nUsers, gross: value };
    const list = out.get(groupId);
    if (list) list.push(entry);
    else out.set(groupId, [entry]);
  }
  for (const list of out.values()) {
    list.sort((a, b) => b.gross - a.gross);
    if (list.length > limit) list.length = limit;
  }
  return out;
}
