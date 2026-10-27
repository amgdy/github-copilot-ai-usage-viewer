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
  return list.map((c) => ({ ...c, profile: c.id >= 0 ? (users.byId.get(c.id) ?? null) : null }));
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
const finite = (v: number): number => (Number.isFinite(v) ? v : 0);

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
export function seatEconomics(a: Analysis): SeatEconomics {
  const { pool, users, seats } = a;
  const base = {
    inReport: users.profiles.length,
    rosterOnly: seats.unused.length,
    months: pool.months.length,
    monthlyValue: finite(mean(pool.months.map((m) => m.capacity))),
    lowerBound: pool.capacityIsLowerBound,
    projected: pool.months.some((m) => m.projection !== null),
  };
  if (!isPoolKnown(a)) return { ...base, used: null, unused: null, overage: null };
  const inputs = monthInputs(pool);
  const capacity = mean(inputs.map((m) => m.capacity));
  const unused = mean(inputs.map((m) => Math.max(0, m.capacity - m.gross)));
  const overage = mean(inputs.map((m) => Math.max(0, m.gross - m.capacity)));
  return { ...base, used: capacity > 0 ? finite(1 - unused / capacity) : null, unused: finite(unused), overage: finite(overage) };
}

/** Cash saving per month of removing seats worth `value` a month, with no other change. Null when the pool size is unknown. */
export function seatCashEffect(a: Analysis, value: number): number | null {
  if (!isPoolKnown(a)) return null;
  const inputs = monthInputs(a.pool);
  return inputs.length ? finite(cashSaving(inputs, 0, value) / inputs.length) : 0;
}

/** The one rule that decides whether seat changes pay off. Translate it with t() where it is shown. */
export const SEAT_RULE = msg(
  'You pay for whichever is larger, the pool or your usage. A seat is only worth removing while the pool has unused included credits, and using less saves cash only once usage is above the pool.',
);

/** What the rule means for this report, or null when the pool size is unknown. */
export function seatAdvice(e: SeatEconomics): string | null {
  if (e.unused === null || e.overage === null) return null;
  const spare = e.unused >= MIN_EFFECT;
  const over = e.overage >= MIN_EFFECT;
  if (spare && over) {
    return t('On average {unused} of included credits go unused and {overage} is billed on top of seats each month. Months differ, so check the month table in the simulator before you change seats.', {
      unused: fmtMoney(e.unused),
      overage: fmtMoney(e.overage),
    });
  }
  if (spare) {
    return t('About {unused} of included credits go unused each month. That is the most that removing seats can save. Using less would not lower the bill while usage stays below the pool.', {
      unused: fmtMoney(e.unused),
    });
  }
  if (over) {
    return t(
      'Usage is above the pool and about {overage} a month is billed on top of seats. Using less lowers the bill directly. Removing seats would not, because the included credits they carry would turn into billed usage.',
      { overage: fmtMoney(e.overage) },
    );
  }
  return t('Usage is almost exactly the size of the pool, so fewer seats or less usage saves cash only when it is combined with the other.');
}
