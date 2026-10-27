import type { Aggregates, ExtraArrays, UserAcc } from './aggregate';
import { BLANK_ID, planLabel } from './prepare';
import type { Settings } from './settings';
import type { AutoUseId } from './taxonomy';

/**
 * Auto model selection and its discount.
 *
 * The usage report already holds the amount after the Auto discount, and it has no discount column. The original price is therefore
 * worked out from token counts and the price card, and compared with the amount billed. That is the measured discount.
 * Where a row cannot be priced from tokens (no token counts, unknown model, long-context request) its original price is estimated
 * from the discount rate of the user's plan. All amounts are USD at 1 credit = $0.01.
 */

/** The Auto discount of one stretch of Auto usage: a user, or the whole scope. */
export interface AutoDiscount {
  /** Usage billed through Auto. This is after the Auto discount. */
  billed: number;
  /** The same usage at the original (list) price. */
  original: number;
  /** `original - billed`: what the Auto discount took off. */
  discount: number;
  /** `discount / original`. 0 when there is no Auto usage. */
  rate: number;
  /** Part of `discount` that is estimated at the plan rate, because those Auto rows could not be priced from token counts. */
  estimated: number;
  /** Billed Auto usage whose original price was measured from token counts. */
  measuredBilled: number;
  /** `measuredBilled / billed`. 1 means every Auto row was measured. */
  measuredShare: number;
}

export const NO_AUTO_DISCOUNT: AutoDiscount = { billed: 0, original: 0, discount: 0, rate: 0, estimated: 0, measuredBilled: 0, measuredShare: 0 };

/** A plan needs at least this much measured Auto usage (USD) before the rate seen in the report replaces the rate from Settings. */
export const MIN_PLAN_MEASURED_USD = 1;

/** The assumed Auto rate, held to a sane range so the gross-up `1 / (1 - rate)` stays finite. */
export const clampAutoRate = (rate: number): number => (Number.isFinite(rate) ? Math.min(0.9, Math.max(0, rate)) : 0);

/**
 * Builds an `AutoDiscount` from the sums the aggregation keeps.
 * `list` and `measuredBilled` cover the Auto rows that could be priced from token counts. The rest of the billed Auto usage is
 * grossed up at `rate`: original = billed / (1 - rate).
 */
export function autoDiscountOf(billed: number, list: number, measuredBilled: number, rate: number): AutoDiscount {
  if (!(billed > 0)) return NO_AUTO_DISCOUNT;
  const clampedRate = clampAutoRate(rate);
  const measured = Math.min(Math.max(0, measuredBilled), billed);
  const estimated = (billed - measured) * (clampedRate / (1 - clampedRate));
  const discount = (measured > 0 ? Math.max(0, list - measured) : 0) + estimated;
  const original = billed + discount;
  return { billed, original, discount, rate: original > 0 ? discount / original : 0, estimated, measuredBilled: measured, measuredShare: measured / billed };
}

/** The Auto discount rate of one plan, as used for estimates. */
export interface AutoPlanRate {
  /** Included credits a month of the seat, 0 when the report has no seat size. */
  credits: number;
  /** Plan name as shown elsewhere, for example "Business". */
  label: string;
  /** Users of the plan with Auto usage. */
  users: number;
  /** Auto usage billed in the plan. */
  billed: number;
  /** Part of `billed` whose original price was measured, and that original price. */
  measuredBilled: number;
  measuredList: number;
  /** `1 - measuredBilled / measuredList`. NaN when nothing was measured. */
  observed: number;
  /** The rate estimates use for this plan: `observed` when enough was measured, else the rate from Settings. */
  rate: number;
  source: 'measured' | 'assumed';
}

export interface AutoRates {
  /** Rate from Settings: used for plans with too little measured Auto usage. */
  assumed: number;
  /** Plans that have Auto usage, by included credits. */
  plans: AutoPlanRate[];
  byCredits: Map<number, number>;
}

/** Rates per plan, measured from the Auto rows of the aggregation. */
export function buildAutoRates(aggregates: Pick<Aggregates, 'userAcc'>, assumedRate: number): AutoRates {
  const assumed = clampAutoRate(assumedRate);
  const perUser = aggregates.userAcc;
  const byPlan = new Map<number, AutoPlanRate>();
  for (let user = 0; user < perUser.autoGross.length; user++) {
    const billed = perUser.autoGross[user];
    if (!(billed > 0)) continue;
    const credits = perUser.quotaMax[user];
    let plan = byPlan.get(credits);
    if (!plan) {
      plan = { credits, label: planLabel(credits), users: 0, billed: 0, measuredBilled: 0, measuredList: 0, observed: Number.NaN, rate: assumed, source: 'assumed' };
      byPlan.set(credits, plan);
    }
    plan.users++;
    plan.billed += billed;
    plan.measuredBilled += perUser.autoMeasuredGross[user];
    plan.measuredList += perUser.autoList[user];
  }
  const plans = [...byPlan.values()].sort((a, b) => a.credits - b.credits);
  const byCredits = new Map<number, number>();
  for (const plan of plans) {
    if (plan.measuredBilled > 0 && plan.measuredList > 0) plan.observed = 1 - plan.measuredBilled / plan.measuredList;
    if (plan.measuredBilled >= MIN_PLAN_MEASURED_USD && Number.isFinite(plan.observed)) {
      plan.rate = clampAutoRate(plan.observed);
      plan.source = 'measured';
    }
    byCredits.set(plan.credits, plan.rate);
  }
  return { assumed, plans, byCredits };
}

/** The rate for a plan: what the report shows when there is enough of it, else the rate from Settings. */
export const rateForPlan = (rates: AutoRates, credits: number): number => rates.byCredits.get(credits) ?? rates.assumed;

/** The Auto discount of one user, at the rate of the user's plan. */
export function userAutoDiscount(perUser: UserAcc, user: number, rates: AutoRates): AutoDiscount {
  return autoDiscountOf(perUser.autoGross[user], perUser.autoList[user], perUser.autoMeasuredGross[user], rateForPlan(rates, perUser.quotaMax[user]));
}

/** What a user's hand-picked usage would have earned if the same requests had gone through Auto: that usage times the rate of the user's plan. */
export function userMissedDiscount(perUser: UserAcc, user: number, rates: AutoRates): number {
  return Math.max(0, perUser.gross[user] - perUser.autoGross[user]) * rateForPlan(rates, perUser.quotaMax[user]);
}

/** Auto usage of one model, as measured. No estimate: rows that could not be priced from tokens are reported in `billed` only. */
export interface AutoModelDiscount {
  billed: number;
  measuredBilled: number;
  measuredList: number;
  /** `measuredList - measuredBilled`, never below 0. */
  discount: number;
  /** `discount / measuredList`. NaN when nothing was measured. */
  rate: number;
  measuredShare: number;
}

export function modelAutoDiscount(modelExtra: Pick<ExtraArrays, 'autoGross' | 'autoList' | 'autoMeasuredGross'>, model: number): AutoModelDiscount {
  const billed = modelExtra.autoGross[model];
  const measuredBilled = modelExtra.autoMeasuredGross[model];
  const measuredList = modelExtra.autoList[model];
  const discount = measuredBilled > 0 ? Math.max(0, measuredList - measuredBilled) : 0;
  return {
    billed,
    measuredBilled,
    measuredList,
    discount,
    rate: measuredBilled > 0 && measuredList > 0 ? discount / measuredList : Number.NaN,
    measuredShare: billed > 0 ? Math.min(1, measuredBilled / billed) : 0,
  };
}

/** Where a user's usage sits between Auto and hand-picked models. */
export function autoUseOf(autoShare: number, settings: Pick<Settings, 'autoFirst' | 'lowAuto'>): Exclude<AutoUseId, 'unknown'> {
  if (autoShare >= settings.autoFirst) return 'autoFirst';
  if (autoShare < settings.lowAuto) return 'direct';
  return 'mixed';
}

export interface AutoSummary extends AutoDiscount {
  /** Billed usage that did not go through Auto. */
  direct: number;
  /** All billed usage in scope. */
  total: number;
  /** Share of billed usage that went through Auto. */
  share: number;
  /** What the hand-picked usage of licensed users would have earned through Auto: the sum over users of their hand-picked usage times their plan's rate. */
  missed: number;
  /** Auto discount rate from Settings. */
  assumedRate: number;
  /** Rates per plan with Auto usage. */
  plans: AutoPlanRate[];
}

/**
 * Auto discount for the whole scope of an aggregation, summed over its users at the rate of each user's plan.
 * Without a model column Auto cannot be told apart, so nothing is reported as missed.
 * `rates` are the plan rates to use. By default they are measured on `agg` itself. A segment filter passes the rates of the whole
 * population instead, so a segment without any Auto usage is still priced at what its plan earns.
 */
export function summarizeAuto(
  aggregates: Pick<Aggregates, 'userAcc' | 'totals'>,
  settings: Pick<Settings, 'autoDiscount'>,
  modelsKnown = true,
  rates: AutoRates = buildAutoRates(aggregates, settings.autoDiscount),
): AutoSummary {
  const perUser = aggregates.userAcc;
  let billed = 0;
  let original = 0;
  let discount = 0;
  let estimated = 0;
  let measuredBilled = 0;
  let missed = 0;
  for (let user = 0; user < perUser.gross.length; user++) {
    if (!(perUser.rows[user] > 0)) continue;
    const userDiscount = userAutoDiscount(perUser, user, rates);
    billed += userDiscount.billed;
    original += userDiscount.original;
    discount += userDiscount.discount;
    estimated += userDiscount.estimated;
    measuredBilled += userDiscount.measuredBilled;
    // Usage with no user (code quality and security scans) has no seat and no model to pick, so it has no Auto alternative.
    if (modelsKnown && user !== BLANK_ID) missed += userMissedDiscount(perUser, user, rates);
  }
  const total = aggregates.totals.gross;
  return {
    billed,
    original,
    discount,
    rate: original > 0 ? discount / original : 0,
    estimated,
    measuredBilled,
    measuredShare: billed > 0 ? measuredBilled / billed : 0,
    direct: Math.max(0, total - billed),
    total,
    share: total > 0 ? billed / total : 0,
    missed,
    assumedRate: rates.assumed,
    plans: rates.plans,
  };
}
