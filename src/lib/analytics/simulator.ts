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
  return pool.months.map((m) => {
    const gross = m.projection ? m.projection.projGross : m.gross;
    // When seats outside the file belong to the pool, use the smallest pool consistent with the data:
    // an exhausted pool equals what it covered; a pool that never ran out is assumed to cover everything projected.
    const capacity = !m.capacityExceeded ? m.capacity : m.exhaustedOn !== null ? Math.max(m.capacity, m.discount) : Math.max(m.capacity, gross);
    return { label: m.label, projected: m.projection !== null, capacity, gross };
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
  return months.map((m) => {
    const newCapacity = Math.max(0, m.capacity - Math.min(seatValue, m.capacity));
    const newGross = m.gross * (1 - fraction);
    const baseCost = monthCost(m.capacity, m.gross);
    const newCost = monthCost(newCapacity, newGross);
    return {
      ...m,
      baseCost,
      baseWaste: Math.max(0, m.capacity - m.gross),
      newCapacity,
      newGross,
      newCost,
      newWaste: Math.max(0, newCapacity - newGross),
      saving: baseCost - newCost,
    };
  });
}

export function allotmentArray(users: UserSet, nUsers: number): Float64Array {
  const a = new Float64Array(nUsers);
  for (const p of users.profiles) a[p.id] = p.allotment;
  return a;
}

export function runScenario(
  ctx: LeverContext,
  pool: PoolSummary,
  users: UserSet,
  seats: SeatPlan,
  input: ScenarioInput,
): Scenario {
  const nUsers = ctx.agg.userAcc.gross.length;
  const levers = computeLevers(ctx, input.levers, allotmentArray(users, nUsers));
  const fraction = levers.baseline > 0 ? Math.min(1, levers.total / levers.baseline) : 0;
  const seatValue = seatValueFor(seats, input);
  const months = evaluateMonths(monthInputs(pool), fraction, seatValue);
  const sum = (f: (m: ScenarioMonth) => number) => months.reduce((a, m) => a + f(m), 0);
  const baseCost = sum((m) => m.baseCost);
  const newCost = sum((m) => m.newCost);
  return {
    levers,
    fraction,
    seatValue,
    months,
    baseCost,
    newCost,
    saving: baseCost - newCost,
    perMonth: months.length ? (baseCost - newCost) / months.length : 0,
    baseWaste: sum((m) => m.baseWaste),
    newWaste: sum((m) => m.newWaste),
  };
}

/** Cash saving for a usage reduction fraction and/or seat removal, per the cost model. */
export function cashSaving(months: MonthInput[], fraction: number, seatValue: number): number {
  return evaluateMonths(months, fraction, seatValue).reduce((a, m) => a + m.saving, 0);
}
