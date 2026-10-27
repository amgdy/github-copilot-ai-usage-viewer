import { describe, expect, it } from 'vitest';
import type { Analysis } from '../src/lib/analytics/analyze';
import { DEFAULT_LEVERS } from '../src/lib/analytics/levers';
import { runScenario, type Scenario } from '../src/lib/analytics/simulator';
import { seatCashEffect, seatEconomics } from '../src/pages/recommendations/seatData';
import { cashHiddenReason, isCashKnown, isPoolKnown, monthBilled, monthNewBilled, poolUnknownReason, scenarioFigures } from '../src/pages/recommendations/scenario';
import { analyzeCsv, analyzeDemo, CSV_HEADER, makeCsv, type Pipeline, type RowSpec } from './helpers';
import { FIXTURE_B, analyzeFixtures } from './fixtures';
import { SEPTEMBER } from './scenarios';

const NO_SEATS = { reclaimIdle: false, downgrade: false, reclaimUnused: false };

function scenarioOf(p: Pipeline, a: Analysis = p.analysis): Scenario {
  return runScenario({ agg: a.agg, models: p.models, settings: p.settings }, a.pool, a.users, a.seats, { levers: DEFAULT_LEVERS, ...NO_SEATS });
}

/** One $19 Business seat that used $40 over the last 20 days of September (a complete month): `covered` dollars came from the pool, the rest was billed. */
function overCapacityCsv(covered: number): string {
  const days = SEPTEMBER.slice(10);
  let left = covered;
  const rows: RowSpec[] = days.map((date) => {
    const discount = Math.min(2, left);
    left -= discount;
    return { date, user: 'solo', model: 'Claude Sonnet 4.6', gross: 2, discount, net: 2 - discount, quota: 1900, input: 400_000, cacheWrite: 100_000 };
  });
  return makeCsv(rows);
}

describe('recommendations: cash and pool gates', () => {
  it('shows cash and the pool when the pool size is known (demo)', async () => {
    const p = await analyzeDemo();
    const a = p.analysis;
    expect(a.pool.capacityExceeded).toBe(false);
    expect(cashHiddenReason(a)).toBeNull();
    expect(poolUnknownReason(a)).toBeNull();
    const f = scenarioFigures(scenarioOf(p), 1, isCashKnown(a), isPoolKnown(a));
    expect(f.cash).toBe(true);
    expect(f.poolKnown).toBe(true);
    expect(seatEconomics(a).used).not.toBeNull();
  });

  it('hides both for a filtered view, with the same reason', async () => {
    const p = await analyzeDemo();
    const a = p.run({ ...p.filters, models: ['Claude Sonnet 4.6'] });
    expect(a.narrowed).toBe(true);
    expect(cashHiddenReason(a)).toMatch(/filter/);
    expect(poolUnknownReason(a)).toBe(cashHiddenReason(a));
  });

  it('hides cash when the file has no billing split, like the Overview and the summary export', async () => {
    const columns = CSV_HEADER.filter((c) => c !== 'discount_amount' && c !== 'net_amount');
    const p = await analyzeCsv(makeCsv([{ date: '2026-09-01', user: 'u', gross: 1 }], { columns }));
    expect(p.analysis.coverage.billing).toBe(false);
    expect(cashHiddenReason(p.analysis)).toMatch(/billed/);
    expect(isPoolKnown(p.analysis)).toBe(false);
  });

  it('shows cash but not the pool when the pool is larger than the seats in the file (partial-export fixture)', async () => {
    const p = await analyzeFixtures([FIXTURE_B]);
    const a = p.analysis;
    expect(a.pool.capacityExceeded).toBe(true);
    expect(cashHiddenReason(a)).toBeNull();
    expect(poolUnknownReason(a)).toMatch(/pool size is unknown/);
    const s = scenarioOf(p);
    const f = scenarioFigures(s, 1, isCashKnown(a), isPoolKnown(a));
    expect(f.cash).toBe(true);
    expect(f.poolKnown).toBe(false);
    // Without seat actions the saving is exactly the overage that is no longer billed.
    expect(f.saveMonth).toBeCloseTo(f.billedBefore - f.billedAfter, 9);
    expect(s.perMonth).toBeCloseTo(a.plan.perMonth, 9);
    expect(seatEconomics(a)).toMatchObject({ used: null, unused: null, overage: null });
    expect(seatCashEffect(a, 100)).toBeNull();
  });

  it('a month that ran out bills exactly what the file billed, and the saving follows from it', async () => {
    const p = await analyzeCsv(overCapacityCsv(30));
    const a = p.analysis;
    const m = a.pool.months[0];
    expect(m.capacityExceeded).toBe(true);
    expect(m.exhaustedOn).not.toBeNull();
    expect(m.projection).toBeNull();
    const s = scenarioOf(p);
    expect(monthBilled(s.months[0])).toBeCloseTo(10, 6);
    expect(monthBilled(s.months[0])).toBeCloseTo(m.net, 6);
    expect(s.fraction).toBeGreaterThan(0);
    expect(monthNewBilled(s.months[0])).toBeCloseTo(Math.max(0, 40 * (1 - s.fraction) - 30), 6);
    expect(s.months[0].saving).toBeCloseTo(monthBilled(s.months[0]) - monthNewBilled(s.months[0]), 9);
  });

  it('a month over capacity that never ran out billed nothing, so using less saves no cash', async () => {
    const p = await analyzeCsv(overCapacityCsv(40));
    const a = p.analysis;
    expect(a.pool.months[0].capacityExceeded).toBe(true);
    expect(a.pool.months[0].exhaustedOn).toBeNull();
    const f = scenarioFigures(scenarioOf(p), 1, isCashKnown(a), isPoolKnown(a));
    expect(f.cash).toBe(true);
    expect(f.billedBefore).toBe(0);
    expect(f.billedAfter).toBe(0);
    expect(f.saveMonth).toBe(0);
  });
});
