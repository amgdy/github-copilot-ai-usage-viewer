import type { Analysis } from '../../lib/analytics/analyze';
import { msg, t } from '../../i18n';
import { DOWNGRADE_HEADROOM, type SeatCandidate } from '../../lib/analytics/seats';
import { PLAN_CREDITS, PLAN_PRICE } from '../../lib/analytics/settings';
import { cashSaving, monthInputs } from '../../lib/analytics/simulator';
import type { UserProfile, UserSet } from '../../lib/analytics/users';
import { CREDIT_USD } from '../../lib/types';
import { MIN_EFFECT, fmtMoney, isPoolKnown } from './scenario';

/** Included credits of one Business seat per month (USD). */
export const BUSINESS_ALLOTMENT = PLAN_CREDITS.Business * CREDIT_USD;

/** An Enterprise user must stay below this usage in every month to count as a downgrade candidate (USD). */
export const DOWNGRADE_LIMIT = DOWNGRADE_HEADROOM * BUSINESS_ALLOTMENT;

/** What one seat saves per month when it moves from Enterprise to Business (USD). */
export const DOWNGRADE_SAVING = PLAN_PRICE.Enterprise - PLAN_PRICE.Business;

export interface SeatRow extends SeatCandidate {
  /** Null for roster seats that never appear in the report. */
  profile: UserProfile | null;
}

export function seatRows(list: SeatCandidate[], users: UserSet): SeatRow[] {
  return list.map((candidate) => ({ ...candidate, profile: candidate.id >= 0 ? (users.byId.get(candidate.id) ?? null) : null }));
}

const mean = (values: number[]): number => (values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0);
const finite = (value: number): number => (Number.isFinite(value) ? value : 0);

export interface SeatEconomics {
  /** Seats whose user appears in the report. */
  inReport: number;
  /** Roster seats whose user never appears. */
  rosterOnly: number;
  months: number;
  /** Seat price per month (the same amount as the included credits they carry), averaged over the months. */
  monthlyValue: number;
  /** True when seats outside the report may also belong to the pool, so the real value is higher. */
  lowerBound: boolean;
  /** Share of the pool that usage consumes, or null when the pool size is unknown. */
  used: number | null;
  /** Included credits that are paid for but not used, per month, or null when unknown. */
  unused: number | null;
  /** Usage above the pool, billed on top of seats, per month, or null when unknown. */
  overage: number | null;
  /** The latest month is projected to its end. */
  projected: boolean;
}

/** Seat and pool figures for the economics card, built from the same monthly inputs as the simulator. */
export function seatEconomics(analysis: Analysis): SeatEconomics {
  const { pool, users, seats } = analysis;
  const base = {
    inReport: users.profiles.length,
    rosterOnly: seats.unused.length,
    months: pool.months.length,
    monthlyValue: finite(mean(pool.months.map((month) => month.capacity))),
    lowerBound: pool.capacityIsLowerBound,
    projected: pool.months.some((month) => month.projection !== null),
  };
  if (!isPoolKnown(analysis)) return { ...base, used: null, unused: null, overage: null };
  const inputs = monthInputs(pool);
  const capacity = mean(inputs.map((month) => month.capacity));
  const unused = mean(inputs.map((month) => Math.max(0, month.capacity - month.gross)));
  const overage = mean(inputs.map((month) => Math.max(0, month.gross - month.capacity)));
  return { ...base, used: capacity > 0 ? finite(1 - unused / capacity) : null, unused: finite(unused), overage: finite(overage) };
}

/** Cash saving per month of removing seats worth `value` a month, with no other change. Null when the pool size is unknown. */
export function seatCashEffect(analysis: Analysis, value: number): number | null {
  if (!isPoolKnown(analysis)) return null;
  const inputs = monthInputs(analysis.pool);
  return inputs.length ? finite(cashSaving(inputs, 0, value) / inputs.length) : 0;
}

/** The one rule that decides whether seat changes pay off. Translate it with t() where it is shown. */
export const SEAT_RULE = msg(
  'You pay for whichever is larger, the pool or your usage. A seat is only worth removing while the pool has unused included credits, and using less saves cash only once usage is above the pool.',
);

/** What the rule means for this report, or null when the pool size is unknown. */
export function seatAdvice(economics: SeatEconomics): string | null {
  if (economics.unused === null || economics.overage === null) return null;
  const spare = economics.unused >= MIN_EFFECT;
  const over = economics.overage >= MIN_EFFECT;
  if (spare && over) {
    return t('On average {unused} of included credits go unused and {overage} is billed on top of seats each month. Months differ, so check the month table in the simulator before you change seats.', {
      unused: fmtMoney(economics.unused),
      overage: fmtMoney(economics.overage),
    });
  }
  if (spare) {
    return t('About {unused} of included credits go unused each month. That is the most that removing seats can save. Using less would not lower the bill while usage stays below the pool.', {
      unused: fmtMoney(economics.unused),
    });
  }
  if (over) {
    return t(
      'Usage is above the pool and about {overage} a month is billed on top of seats. Using less lowers the bill directly. Removing seats would not, because the included credits they carry would turn into billed usage.',
      { overage: fmtMoney(economics.overage) },
    );
  }
  return t('Usage is almost exactly the size of the pool, so fewer seats or less usage saves cash only when it is combined with the other.');
}
