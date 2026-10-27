import type { LeverContext, LeverParams, LeverResult } from './levers';
import { computeLevers } from './levers';
import type { PoolSummary } from './pool';
import type { SeatPlan } from './seats';
import type { UserSet } from './users';

/**
 * Cost model: seat price equals the value of the included credits, which are pooled.
 * Monthly cost = max(pool capacity, usage): you always pay for the pool, plus any usage above it.
 */
export const monthCost = (capacity: number, gross: number): number => Math.max(capacity, gross);

export interface MonthInput {
  label: string;
  projected: boolean;
  capacity: number;
  gross: number;
}

export function monthInputs(pool: PoolSummary): MonthInput[] {
  return pool.months.map((month) => {
    const gross = month.projection ? month.projection.projGross : month.gross;
    // When seats outside the file belong to the pool, use the smallest pool consistent with the data:
    // an exhausted pool equals what it covered; a pool that never ran out is assumed to cover everything projected.
    const capacity = !month.capacityExceeded ? month.capacity : month.exhaustedOn !== null ? Math.max(month.capacity, month.discount) : Math.max(month.capacity, gross);
    return { label: month.label, projected: month.projection !== null, capacity, gross };
  });
}

export interface ScenarioMonth extends MonthInput {
  baseCost: number;
  /** Included credits left unused (paid for but not consumed). */
  baseWaste: number;
  newCapacity: number;
  newGross: number;
  newCost: number;
  newWaste: number;
  saving: number;
}

export interface ScenarioInput {
  levers: LeverParams;
  reclaimIdle: boolean;
  downgrade: boolean;
  reclaimUnused: boolean;
}

export interface Scenario {
  levers: LeverResult;
  fraction: number;
  seatValue: number;
  months: ScenarioMonth[];
  baseCost: number;
  newCost: number;
  saving: number;
  /** Average saving per month in scope. */
  perMonth: number;
  baseWaste: number;
  newWaste: number;
}

export function seatValueFor(plan: SeatPlan, input: Pick<ScenarioInput, 'reclaimIdle' | 'downgrade' | 'reclaimUnused'>): number {
  return (input.reclaimIdle ? plan.idleValue : 0) + (input.downgrade ? plan.downgradeValue : 0) + (input.reclaimUnused ? plan.unusedValue : 0);
}

/** Applies a usage reduction fraction and a monthly seat-value removal to the monthly pool figures. */
export function evaluateMonths(months: MonthInput[], fraction: number, seatValue: number): ScenarioMonth[] {
  return months.map((month) => {
    const newCapacity = Math.max(0, month.capacity - Math.min(seatValue, month.capacity));
    const newGross = month.gross * (1 - fraction);
    const baseCost = monthCost(month.capacity, month.gross);
    const newCost = monthCost(newCapacity, newGross);
    return {
      ...month,
      baseCost,
      baseWaste: Math.max(0, month.capacity - month.gross),
      newCapacity,
      newGross,
      newCost,
      newWaste: Math.max(0, newCapacity - newGross),
      saving: baseCost - newCost,
    };
  });
}

export function allotmentArray(users: UserSet, nUsers: number): Float64Array {
  const allotments = new Float64Array(nUsers);
  for (const user of users.profiles) allotments[user.id] = user.allotment;
  return allotments;
}

export function runScenario(
  leverContext: LeverContext,
  pool: PoolSummary,
  users: UserSet,
  seats: SeatPlan,
  input: ScenarioInput,
): Scenario {
  const nUsers = leverContext.agg.userAcc.gross.length;
  const levers = computeLevers(leverContext, input.levers, allotmentArray(users, nUsers));
  const fraction = levers.baseline > 0 ? Math.min(1, levers.total / levers.baseline) : 0;
  const seatValue = seatValueFor(seats, input);
  const months = evaluateMonths(monthInputs(pool), fraction, seatValue);
  const sum = (amountOf: (month: ScenarioMonth) => number) => months.reduce((total, month) => total + amountOf(month), 0);
  const baseCost = sum((month) => month.baseCost);
  const newCost = sum((month) => month.newCost);
  return {
    levers,
    fraction,
    seatValue,
    months,
    baseCost,
    newCost,
    saving: baseCost - newCost,
    perMonth: months.length ? (baseCost - newCost) / months.length : 0,
    baseWaste: sum((month) => month.baseWaste),
    newWaste: sum((month) => month.newWaste),
  };
}

/** Cash saving for a usage reduction fraction and/or seat removal, per the cost model. */
export function cashSaving(months: MonthInput[], fraction: number, seatValue: number): number {
  return evaluateMonths(months, fraction, seatValue).reduce((total, month) => total + month.saving, 0);
}
