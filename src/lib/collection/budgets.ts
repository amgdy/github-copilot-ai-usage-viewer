import type { DataStore } from '../types';
import { BLANK } from '../types';
import { daysInMonth, monthEndDay, monthIndexOf, monthStartDay, parseIsoDay } from '../utils/date';
import { sourceComplete } from './derive';
import type { AuditEvent, Collection, GitHubBudget } from './types';

/** How full a budget is: used up (100% or more), near the limit (80% to 100%), half used (50% to 80%) or low (under 50%). */
export type BudgetLevel = 'low' | 'half' | 'near' | 'used-up';

/** The levels from positive to negative. */
export const BUDGET_LEVELS: BudgetLevel[] = ['low', 'half', 'near', 'used-up'];

export const NEAR_SHARE = 0.8;
export const HALF_SHARE = 0.5;
/** The projection rate is the average billed per day over at most this many of the last days. */
export const PACE_DAYS = 7;

export function budgetLevel(share: number): BudgetLevel {
  if (share >= 1) return 'used-up';
  if (share >= NEAR_SHARE) return 'near';
  if (share >= HALF_SHARE) return 'half';
  return 'low';
}

/** A budget for GitHub Copilot that is not for a single user, with the share of it used. */
export interface BudgetRow {
  budget: GitHubBudget;
  /** Amount used ÷ budget. Null when GitHub gave no amount used or the budget is 0. */
  share: number | null;
  level: BudgetLevel | null;
}

/** One user held to a budget: a user of a shared budget, or a budget for that user alone. */
export interface BudgetUserRow {
  login: string;
  consumed: number;
  limit: number;
  share: number;
  level: BudgetLevel;
  budgetId: string;
}

/** An organization or cost center with billed usage in the budget month and no budget of its own. */
export interface UnbudgetedScope {
  scope: 'organization' | 'cost_center';
  name: string;
  billed: number;
}

/** How a budget fills up during the month the data was collected. */
export interface BudgetPace {
  /** YYYY-MM */
  month: string;
  monthDays: number;
  /** Day of the month the data was collected. */
  collectedDay: number;
  /** report: from the billed amounts of the usage report. github: from the amount used that GitHub showed. */
  basis: 'report' | 'github';
  /** Billed so far at the end of each day of the month, from day 1 to `lastDay`. Empty for the github basis. */
  cumulative: number[];
  /** Day of the month of the last known amount. */
  lastDay: number;
  /** Amount used at the end of `lastDay`. */
  used: number;
  /** Average billed per day used for the projection. */
  dailyRate: number;
  /** Expected amount used at the end of the month. */
  projected: number;
  /** Day of the month on which the amount reaches the budget. Null when it does not reach it this month. */
  runOutDay: number | null;
  /** The budget was already used up on `lastDay`. */
  usedUp: boolean;
}

export interface BudgetOverview {
  /** YYYY-MM month of the day the data was collected. */
  month: string;
  /** Every budget for GitHub Copilot. */
  total: number;
  /** Budgets for GitHub Copilot that stop usage when used up, and those that only send alerts. */
  stopping: number;
  alerting: number;
  /** The budgets for GitHub Copilot of the enterprise, organizations, cost centers and repositories, fullest first. Budgets for users are in `users`. */
  budgets: BudgetRow[];
  usedUp: number;
  near: number;
  /** Budgets expected to be used up before the month ends, not counting those already used up. */
  projectedOut: BudgetRow[];
  users: BudgetUserRow[];
  /** User counts by level, in the order of BUDGET_LEVELS. */
  userLevels: Record<BudgetLevel, number>;
  /** Null when the budgets were not read in full, so a missing budget cannot be told apart from a failed read. */
  unbudgeted: UnbudgetedScope[] | null;
  /** True when a budget for the whole enterprise covers usage that has no budget of its own. */
  enterpriseBudget: boolean;
  changes: AuditEvent[];
}

const shareOf = (consumed: number | null, amount: number): number | null => (consumed === null || amount <= 0 ? null : consumed / amount);
const lower = (value: string) => value.toLowerCase();

/** The month the data was collected in, as a month index. */
export function collectionMonth(collection: Collection): number {
  return monthIndexOf(parseIsoDay(collection.header.day));
}

/** The dictionary ids of the report that a budget covers, or a function over rows. Null when the budget cannot be matched to the report. */
function scopeFilter(store: DataStore, collection: Collection, budget: GitHubBudget): ((row: number) => boolean) | null {
  const idsMatching = (values: readonly string[], wanted: Set<string>): Uint8Array => {
    const flags = new Uint8Array(values.length);
    values.forEach((value, id) => {
      if (wanted.has(lower(value))) flags[id] = 1;
    });
    return flags;
  };
  const entity = lower(budget.entity);
  switch (budget.scope) {
    case 'enterprise':
      return collection.header.scope === 'enterprise' ? () => true : null;
    case 'organization': {
      const flags = idsMatching(store.dicts.org.values, new Set([entity]));
      return (row) => flags[store.org[row]] === 1;
    }
    case 'cost_center': {
      const flags = idsMatching(store.dicts.costCenter.values, new Set([entity]));
      return (row) => flags[store.costCenter[row]] === 1;
    }
    case 'repository': {
      const name = entity.includes('/') ? entity.slice(entity.indexOf('/') + 1) : entity;
      const flags = idsMatching(store.dicts.repo.values, new Set([entity, name]));
      return (row) => flags[store.repo[row]] === 1;
    }
    case 'user': {
      const flags = idsMatching(store.dicts.user.values, new Set([lower(budget.user ?? budget.entity)]));
      return (row) => flags[store.user[row]] === 1;
    }
    default: {
      // Budgets for a group of users: the users GitHub listed for the budget.
      const logins = new Set(collection.budgetUsers.filter((state) => state.budgetId === budget.id).map((state) => lower(state.login)));
      if (logins.size === 0) return null;
      const flags = idsMatching(store.dicts.user.values, logins);
      return (row) => flags[store.user[row]] === 1;
    }
  }
}

/** Rows of the report in a month. */
function rowsInMonth(store: DataStore, monthIndex: number): number[] {
  const start = monthStartDay(monthIndex);
  const end = monthEndDay(monthIndex);
  const rows: number[] = [];
  if (store.n === 0 || store.maxDay < start || store.minDay > end) return rows;
  for (let i = 0; i < store.n; i++) if (store.day[i] >= start && store.day[i] <= end) rows.push(i);
  return rows;
}

function runOut(amount: number, used: number, lastDay: number, dailyRate: number, monthDays: number): number | null {
  if (amount <= 0) return null;
  if (used >= amount) return lastDay;
  if (dailyRate <= 0) return null;
  const day = lastDay + Math.ceil((amount - used) / dailyRate);
  return day <= monthDays ? day : null;
}

function paceFromGitHub(budget: GitHubBudget, month: string, monthDays: number, collectedDay: number): BudgetPace | null {
  if (budget.consumed === null) return null;
  const elapsed = Math.max(1, collectedDay - 1);
  const dailyRate = budget.consumed / elapsed;
  return {
    month,
    monthDays,
    collectedDay,
    basis: 'github',
    cumulative: [],
    lastDay: elapsed,
    used: budget.consumed,
    dailyRate,
    projected: budget.consumed + dailyRate * (monthDays - elapsed),
    runOutDay: runOut(budget.amount, budget.consumed, elapsed, dailyRate, monthDays),
    usedUp: budget.amount > 0 && budget.consumed >= budget.amount,
  };
}

/**
 * How a budget fills up in the month the data was collected. It adds up the billed amount of the report rows that
 * the budget covers, day by day, and projects the rest of the month from the average billed per day since billing
 * started, over at most the last 7 days. When the report does not cover the month, or the budget also counts seat
 * charges, it uses the amount GitHub showed and spreads it evenly over the days so far.
 */
export function budgetPace(collection: Collection, store: DataStore, budget: GitHubBudget, monthRows?: readonly number[]): BudgetPace | null {
  const monthIndex = collectionMonth(collection);
  const month = collection.header.day.slice(0, 7);
  const monthDays = daysInMonth(monthIndex);
  const collectedDay = Number(collection.header.day.slice(8, 10));
  const start = monthStartDay(monthIndex);
  const rows = monthRows ?? rowsInMonth(store, monthIndex);
  const filter = budget.aiCredits ? scopeFilter(store, collection, budget) : null;
  if (filter === null || rows.length === 0) return paceFromGitHub(budget, month, monthDays, collectedDay);
  // The report can end before the day of collection; it cannot know later days.
  const lastDay = Math.min(monthDays, collectedDay, Math.max(1, store.maxDay - start + 1));
  const daily = new Array<number>(lastDay).fill(0);
  for (const row of rows) {
    const dayOfMonth = store.day[row] - start + 1;
    if (dayOfMonth > lastDay || !filter(row)) continue;
    daily[dayOfMonth - 1] += store.net[row];
  }
  const cumulative: number[] = [];
  let total = 0;
  for (const amount of daily) cumulative.push((total += amount));
  const firstBilled = daily.findIndex((amount) => amount > 0) + 1;
  let dailyRate = 0;
  if (firstBilled > 0) {
    const windowStart = Math.max(firstBilled, lastDay - PACE_DAYS + 1);
    let windowTotal = 0;
    for (let day = windowStart; day <= lastDay; day++) windowTotal += daily[day - 1];
    dailyRate = windowTotal / (lastDay - windowStart + 1);
  }
  return {
    month,
    monthDays,
    collectedDay,
    basis: 'report',
    cumulative,
    lastDay,
    used: total,
    dailyRate,
    projected: total + dailyRate * (monthDays - lastDay),
    runOutDay: runOut(budget.amount, total, lastDay, dailyRate, monthDays),
    usedUp: budget.amount > 0 && total >= budget.amount,
  };
}

/** Every user held to a budget for GitHub Copilot, one line per login with the fullest budget. */
export function budgetUsers(collection: Collection): BudgetUserRow[] {
  const budgets = new Map(collection.budgets.map((budget) => [budget.id, budget]));
  const byLogin = new Map<string, BudgetUserRow>();
  const keep = (login: string, consumed: number, limit: number, budgetId: string): void => {
    if (login === '' || limit <= 0) return;
    const share = consumed / limit;
    const key = lower(login);
    const had = byLogin.get(key);
    if (had === undefined || share > had.share) byLogin.set(key, { login, consumed, limit, share, level: budgetLevel(share), budgetId });
  };
  for (const state of collection.budgetUsers) {
    const budget = budgets.get(state.budgetId);
    if (budget !== undefined && !budget.copilot) continue;
    keep(state.login, state.consumed, state.limit, state.budgetId);
  }
  for (const budget of collection.budgets) {
    if (budget.scope !== 'user' || !budget.copilot || budget.consumed === null) continue;
    keep(budget.user ?? budget.entity, budget.consumed, budget.amount, budget.id);
  }
  return [...byLogin.values()].sort((a, b) => b.share - a.share || a.login.localeCompare(b.login));
}

/** Organizations and cost centers with billed usage in the month and no budget of their own, most billed first. */
function unbudgetedScopes(store: DataStore, collection: Collection, rows: readonly number[]): UnbudgetedScope[] {
  const hasBudget = (scope: string, name: string) => collection.budgets.some((budget) => budget.copilot && budget.scope === scope && lower(budget.entity) === lower(name));
  const billedBy = (ids: Int32Array, values: readonly string[]): Map<string, number> => {
    const totals = new Map<string, number>();
    for (const row of rows) {
      const name = values[ids[row]];
      if (name === undefined || name === BLANK || store.net[row] <= 0) continue;
      totals.set(name, (totals.get(name) ?? 0) + store.net[row]);
    }
    return totals;
  };
  const out: UnbudgetedScope[] = [];
  for (const [name, billed] of billedBy(store.org, store.dicts.org.values)) if (!hasBudget('organization', name)) out.push({ scope: 'organization', name, billed });
  for (const [name, billed] of billedBy(store.costCenter, store.dicts.costCenter.values)) if (!hasBudget('cost_center', name)) out.push({ scope: 'cost_center', name, billed });
  return out.sort((a, b) => b.billed - a.billed || a.name.localeCompare(b.name));
}

/** Everything the Budgets page shows from a GitHub data file and the usage report. */
export function budgetOverview(collection: Collection, store: DataStore): BudgetOverview {
  const monthIndex = collectionMonth(collection);
  const rows = rowsInMonth(store, monthIndex);
  const copilot = collection.budgets.filter((budget) => budget.copilot);
  const budgets = copilot
    .filter((budget) => budget.scope !== 'user' && !budget.scope.startsWith('multi_user'))
    .map((budget): BudgetRow => {
      const share = shareOf(budget.consumed, budget.amount);
      return { budget, share, level: share === null ? null : budgetLevel(share) };
    })
    .sort((a, b) => (b.share ?? -1) - (a.share ?? -1) || a.budget.entity.localeCompare(b.budget.entity));
  const projectedOut = budgets.filter((row) => {
    if (row.level === 'used-up') return false;
    const pace = budgetPace(collection, store, row.budget, rows);
    return pace !== null && pace.runOutDay !== null && !pace.usedUp;
  });
  const users = budgetUsers(collection);
  const userLevels: Record<BudgetLevel, number> = { low: 0, half: 0, near: 0, 'used-up': 0 };
  for (const user of users) userLevels[user.level]++;
  const changes = collection.audit.filter((event) => event.kind === 'budget').sort((a, b) => (b.day ?? '').localeCompare(a.day ?? ''));
  return {
    month: collection.header.day.slice(0, 7),
    total: copilot.length,
    stopping: copilot.filter((budget) => budget.stopsUsage).length,
    alerting: copilot.filter((budget) => !budget.stopsUsage).length,
    budgets,
    usedUp: budgets.filter((row) => row.level === 'used-up').length,
    near: budgets.filter((row) => row.level === 'near').length,
    projectedOut,
    users,
    userLevels,
    unbudgeted: sourceComplete(collection.sources, 'budgets') ? unbudgetedScopes(store, collection, rows) : null,
    enterpriseBudget: collection.budgets.some((budget) => budget.copilot && budget.scope === 'enterprise'),
    changes,
  };
}
