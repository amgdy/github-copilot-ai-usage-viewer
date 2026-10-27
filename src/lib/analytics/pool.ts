import type { DataStore } from '../types';
import { CREDIT_USD } from '../types';
import { dayOf } from '../licenses/activity';
import { daysInMonth, monthEndDay, monthKey, monthLabel, monthStartDay, workdaysBetween } from '../utils/date';
import type { Aggregates } from './aggregate';
import type { Prepared } from './prepare';
import { budgetOf, PLAN_CREDITS, seatCredits, type RosterEntry, type Settings } from './settings';
import { dataCoverage } from './coverage';

/** Roster lines without blank names or repeated names (the first line wins), so a seat is never counted twice. */
export function uniqueRoster(roster: RosterEntry[]): RosterEntry[] {
  const seen = new Set<string>();
  const out: RosterEntry[] = [];
  for (const seat of roster) {
    const key = seat.user.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(seat);
  }
  return out;
}

export interface Projection {
  /** Last day that has data (the "as of" day). */
  asOf: number;
  daysElapsed: number;
  daysLeft: number;
  mtdGross: number;
  mtdNet: number;
  rateMtd: number;
  rate7: number;
  projGrossLow: number;
  projGross: number;
  projGrossHigh: number;
  projNetLow: number;
  projNet: number;
  projNetHigh: number;
  /** Projected day on which the pool runs out, when it has not yet and is expected to. */
  exhaustionDate: number | null;
}

export interface MonthPool {
  slot: number;
  month: number;
  key: string;
  label: string;
  monthStart: number;
  monthEnd: number;
  firstDay: number;
  lastDay: number;
  daysObserved: number;
  daysInMonth: number;
  complete: boolean;
  gross: number;
  discount: number;
  net: number;
  credits: number;
  users: number;
  csvCapacity: number;
  extraCapacity: number;
  capacity: number;
  /**
   * The pool size is unknown: the pool covered more than every known seat could fund (seats outside this file belong to it:
   * partial export, or files from different billing entities), or the file carries no seat sizes or no covered/billed split.
   */
  capacityExceeded: boolean;
  /** Share of the pool consumed by usage (discount / capacity). NaN when `capacityExceeded`. */
  utilization: number;
  /** Included credits left (USD). NaN when `capacityExceeded`. */
  headroom: number;
  exhaustedOn: number | null;
  cumulative: { day: number; gross: number; discount: number; net: number }[];
  projection: Projection | null;
}

export interface PoolSummary {
  months: MonthPool[];
  capacity: number;
  covered: number;
  billed: number;
  gross: number;
  /** Covered ÷ capacity. NaN when `capacityExceeded`. */
  utilization: number;
  monthsExhausted: number;
  /** True when no roster/extra seats were provided, so capacity only counts users that appear in the report. */
  capacityIsLowerBound: boolean;
  /** At least one month has an unknown pool size: more was covered than the known seats fund, or the file lacks seat sizes or the billing split. */
  capacityExceeded: boolean;
  latest: MonthPool | null;
  budget: BudgetStatus | null;
}

export interface BudgetStatus {
  monthlyBudget: number;
  month: string;
  billedToDate: number;
  projectedBilled: number | null;
  burn: number;
  projectedBurn: number | null;
  /** Day the budget is hit at the current billed rate (null when not on track to hit it). */
  hitDate: number | null;
}

export function defaultQuotaCredits(aggregates: Aggregates): number {
  const counts = new Map<number, number>();
  const quotaByUser = aggregates.userAcc.quotaMax;
  for (let user = 1; user < quotaByUser.length; user++) {
    if (aggregates.userAcc.rows[user] > 0 && quotaByUser[user] > 0) counts.set(quotaByUser[user], (counts.get(quotaByUser[user]) ?? 0) + 1);
  }
  let best = 1900;
  let max = 0;
  for (const [quota, userCount] of counts) {
    if (userCount > max) {
      max = userCount;
      best = quota;
    }
  }
  return best;
}

export function buildPool(
  store: DataStore,
  prepared: Prepared,
  aggregates: Aggregates,
  settings: Settings,
  range: { start: number; end: number },
  /** Roster/extra seats describe the whole organization, so they only apply when no row filter narrows the scope. */
  includeExtras = true,
): PoolSummary {
  const { days, monthQuota, nMonths } = aggregates;
  const userCount = store.dicts.user.values.length;
  const months: MonthPool[] = [];
  const fallbackCredits = defaultQuotaCredits(aggregates);
  const billingKnown = dataCoverage(store).billing;
  const roster = uniqueRoster(settings.roster);
  const hasRoster = roster.length > 0 || settings.extraSeats.business > 0 || settings.extraSeats.enterprise > 0;
  const lowerUsers = new Map<string, number>();
  store.dicts.user.values.forEach((login, userIndex) => lowerUsers.set(login.toLowerCase(), userIndex));

  // Per-slot aggregates from the day series
  for (let slot = 0; slot < nMonths; slot++) {
    const month = prepared.firstMonth + slot;
    const mStart = monthStartDay(month);
    const monthEnd = monthEndDay(month);
    const from = Math.max(mStart, aggregates.range.start);
    const to = Math.min(monthEnd, aggregates.range.end);
    if (to < from || aggregates.range.length === 0) continue;
    let gross = 0;
    let discount = 0;
    let net = 0;
    let credits = 0;
    let first = Number.NaN;
    let last = Number.NaN;
    let observed = 0;
    let exhaustedOn: number | null = null;
    const cumulative: MonthPool['cumulative'] = [];
    let cumulativeGross = 0;
    let cumulativeDiscount = 0;
    let cumulativeNet = 0;
    for (let day = from; day <= to; day++) {
      const dayIndex = day - aggregates.range.start;
      const rows = days.rows[dayIndex];
      if (rows === 0) continue;
      observed++;
      if (Number.isNaN(first)) first = day;
      last = day;
      gross += days.gross[dayIndex];
      discount += days.discount[dayIndex];
      net += days.net[dayIndex];
      credits += days.credits[dayIndex];
      cumulativeGross += days.gross[dayIndex];
      cumulativeDiscount += days.discount[dayIndex];
      cumulativeNet += days.net[dayIndex];
      if (exhaustedOn === null && days.net[dayIndex] > 1e-6) exhaustedOn = day;
      cumulative.push({ day: day, gross: cumulativeGross, discount: cumulativeDiscount, net: cumulativeNet });
    }
    if (observed === 0) continue;

    let csvCapacityCredits = 0;
    const present = new Set<number>();
    for (let user = 1; user < userCount; user++) {
      const quota = monthQuota[user * nMonths + slot];
      if (quota > 0) {
        csvCapacityCredits += quota;
        present.add(user);
      }
    }
    const usersInMonth = present.size;
    let extraCredits = 0;
    if (includeExtras) {
      extraCredits = settings.extraSeats.business * PLAN_CREDITS.Business + settings.extraSeats.enterprise * PLAN_CREDITS.Enterprise;
      for (const seat of roster) {
        const id = lowerUsers.get(seat.user.trim().toLowerCase());
        if (id !== undefined && present.has(id)) continue;
        // A seat that the license data says was created after this month ended did not exist yet, so it brings no credits to it.
        const created = dayOf(seat.createdAt);
        if (created !== null && created > monthEnd) continue;
        extraCredits += seatCredits(seat.plan, fallbackCredits);
      }
    }

    const csvCapacity = csvCapacityCredits * CREDIT_USD;
    const extraCapacity = extraCredits * CREDIT_USD;
    const capacity = csvCapacity + extraCapacity;
    const capacityExceeded = discount > capacity + 0.01 || !billingKnown || (capacity <= 0 && gross > 0.005);
    const isLastDatasetMonth = month === prepared.firstMonth + prepared.nMonths - 1;
    const complete = !(isLastDatasetMonth && store.maxDay < monthEnd) || range.end < store.maxDay;

    const pool: MonthPool = {
      slot,
      month,
      key: monthKey(month),
      label: monthLabel(month),
      monthStart: mStart,
      monthEnd: monthEnd,
      firstDay: first,
      lastDay: last,
      daysObserved: observed,
      daysInMonth: daysInMonth(month),
      complete,
      gross,
      discount,
      net,
      credits,
      users: usersInMonth,
      csvCapacity,
      extraCapacity,
      capacity,
      capacityExceeded,
      utilization: capacityExceeded ? Number.NaN : capacity > 0 ? discount / capacity : 0,
      headroom: capacityExceeded ? Number.NaN : Math.max(0, capacity - discount),
      exhaustedOn,
      cumulative,
      projection: null,
    };
    if (!complete) pool.projection = project(pool, days, aggregates.range.start);
    months.push(pool);
  }

  const capacity = months.reduce((total, monthPool) => total + monthPool.capacity, 0);
  const covered = months.reduce((total, monthPool) => total + monthPool.discount, 0);
  const billed = months.reduce((total, monthPool) => total + monthPool.net, 0);
  const gross = months.reduce((total, monthPool) => total + monthPool.gross, 0);
  const latest = months.length ? months[months.length - 1] : null;
  const capacityExceeded = months.some((monthPool) => monthPool.capacityExceeded);
  let budget: BudgetStatus | null = null;
  const monthlyBudget = budgetOf(settings);
  if (monthlyBudget !== null && latest) {
    const budgetLimit = monthlyBudget;
    const projection = latest.projection;
    const projectedBilled = projection ? projection.projNet : null;
    let hitDate: number | null = null;
    if (projection && latest.net < budgetLimit && projection.rateMtd > 0 && latest.exhaustedOn !== null) {
      const remaining = budgetLimit - latest.net;
      const rate = (projection.rateMtd + projection.rate7) / 2;
      const daysToHit = rate > 0 ? Math.ceil(remaining / rate) : Infinity;
      if (projection.asOf + daysToHit <= latest.monthEnd) hitDate = projection.asOf + daysToHit;
    } else if (projection && latest.net < budgetLimit && latest.exhaustedOn === null && projection.exhaustionDate !== null && projectedBilled !== null && projectedBilled >= budgetLimit) {
      const rate = (projection.rateMtd + projection.rate7) / 2;
      hitDate = rate > 0 ? Math.min(latest.monthEnd, projection.exhaustionDate + Math.ceil(budgetLimit / rate)) : null;
    }
    budget = {
      monthlyBudget: budgetLimit,
      month: latest.label,
      billedToDate: latest.net,
      projectedBilled,
      burn: latest.net / budgetLimit,
      projectedBurn: projectedBilled !== null ? projectedBilled / budgetLimit : null,
      hitDate,
    };
  }

  return {
    months,
    capacity,
    covered,
    billed,
    gross,
    utilization: capacityExceeded ? Number.NaN : capacity > 0 ? covered / capacity : 0,
    monthsExhausted: months.filter((monthPool) => monthPool.exhaustedOn !== null).length,
    capacityIsLowerBound: capacityExceeded || !(hasRoster && includeExtras),
    capacityExceeded,
    latest,
    budget,
  };
}

function project(pool: MonthPool, days: Aggregates['days'], rangeStart: number): Projection {
  const asOf = pool.lastDay;
  const daysElapsed = Math.max(1, asOf - pool.monthStart + 1);
  const daysLeft = Math.max(0, pool.monthEnd - asOf);
  const rateMtd = pool.gross / daysElapsed;
  const winStart = Math.max(pool.monthStart, asOf - 6, rangeStart);
  let lastWeekGross = 0;
  for (let day = winStart; day <= asOf; day++) lastWeekGross += days.gross[day - rangeStart] ?? 0;
  const rate7 = lastWeekGross / Math.max(1, asOf - winStart + 1);
  const lowRate = Math.min(rateMtd, rate7);
  const highRate = Math.max(rateMtd, rate7);
  const midRate = (rateMtd + rate7) / 2;
  const projGross = (dailyRate: number): number => pool.gross + daysLeft * dailyRate;
  const exhausted = pool.exhaustedOn !== null;
  // With an unknown pool size and no exhaustion yet, billed overage cannot be projected.
  const sizeUnknown = pool.capacityExceeded && !exhausted;
  const projNet = (dailyRate: number): number => (exhausted ? pool.net + daysLeft * dailyRate : sizeUnknown ? pool.net : Math.max(0, projGross(dailyRate) - pool.capacity));

  let exhaustionDate: number | null = null;
  if (!exhausted && !sizeUnknown && midRate > 0 && pool.capacity > 0) {
    const need = pool.capacity - pool.gross;
    if (need > 0) {
      const runOutDay = asOf + Math.ceil(need / midRate);
      if (runOutDay <= pool.monthEnd) exhaustionDate = runOutDay;
    }
  }
  return {
    asOf,
    daysElapsed,
    daysLeft,
    mtdGross: pool.gross,
    mtdNet: pool.net,
    rateMtd,
    rate7,
    projGrossLow: projGross(lowRate),
    projGross: projGross(midRate),
    projGrossHigh: projGross(highRate),
    projNetLow: projNet(lowRate),
    projNet: projNet(midRate),
    projNetHigh: projNet(highRate),
    exhaustionDate,
  };
}

export { workdaysBetween };
