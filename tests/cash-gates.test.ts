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

function scenarioOf(pipeline: Pipeline, analysis: Analysis = pipeline.analysis): Scenario {
  return runScenario({ agg: analysis.agg, models: pipeline.models, settings: pipeline.settings }, analysis.pool, analysis.users, analysis.seats, { levers: DEFAULT_LEVERS, ...NO_SEATS });
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
    const pipeline = await analyzeDemo();
    const analysis = pipeline.analysis;
    expect(analysis.pool.capacityExceeded).toBe(false);
    expect(cashHiddenReason(analysis)).toBeNull();
    expect(poolUnknownReason(analysis)).toBeNull();
    const figures = scenarioFigures(scenarioOf(pipeline), 1, isCashKnown(analysis), isPoolKnown(analysis));
    expect(figures.cash).toBe(true);
    expect(figures.poolKnown).toBe(true);
    expect(seatEconomics(analysis).used).not.toBeNull();
  });

  it('hides both for a filtered view, with the same reason', async () => {
    const pipeline = await analyzeDemo();
    const filtered = pipeline.run({ ...pipeline.filters, models: ['Claude Sonnet 4.6'] });
    expect(filtered.narrowed).toBe(true);
    expect(cashHiddenReason(filtered)).toMatch(/filter/);
    expect(poolUnknownReason(filtered)).toBe(cashHiddenReason(filtered));
  });

  it('hides cash when the file has no billing split, like the Overview and the summary export', async () => {
    const columns = CSV_HEADER.filter((column) => column !== 'discount_amount' && column !== 'net_amount');
    const pipeline = await analyzeCsv(makeCsv([{ date: '2026-09-01', user: 'u', gross: 1 }], { columns }));
    expect(pipeline.analysis.coverage.billing).toBe(false);
    expect(cashHiddenReason(pipeline.analysis)).toMatch(/billed/);
    expect(isPoolKnown(pipeline.analysis)).toBe(false);
  });

  it('shows cash but not the pool when the pool is larger than the seats in the file (partial-export fixture)', async () => {
    const pipeline = await analyzeFixtures([FIXTURE_B]);
    const analysis = pipeline.analysis;
    expect(analysis.pool.capacityExceeded).toBe(true);
    expect(cashHiddenReason(analysis)).toBeNull();
    expect(poolUnknownReason(analysis)).toMatch(/pool size is unknown/);
    const scenario = scenarioOf(pipeline);
    const figures = scenarioFigures(scenario, 1, isCashKnown(analysis), isPoolKnown(analysis));
    expect(figures.cash).toBe(true);
    expect(figures.poolKnown).toBe(false);
    // Without seat actions the saving is exactly the overage that is no longer billed.
    expect(figures.saveMonth).toBeCloseTo(figures.billedBefore - figures.billedAfter, 9);
    expect(scenario.perMonth).toBeCloseTo(analysis.plan.perMonth, 9);
    expect(seatEconomics(analysis)).toMatchObject({ used: null, unused: null, overage: null });
    expect(seatCashEffect(analysis, 100)).toBeNull();
  });

  it('a month that ran out bills exactly what the file billed, and the saving follows from it', async () => {
    const pipeline = await analyzeCsv(overCapacityCsv(30));
    const analysis = pipeline.analysis;
    const month = analysis.pool.months[0];
    expect(month.capacityExceeded).toBe(true);
    expect(month.exhaustedOn).not.toBeNull();
    expect(month.projection).toBeNull();
    const scenario = scenarioOf(pipeline);
    expect(monthBilled(scenario.months[0])).toBeCloseTo(10, 6);
    expect(monthBilled(scenario.months[0])).toBeCloseTo(month.net, 6);
    expect(scenario.fraction).toBeGreaterThan(0);
    expect(monthNewBilled(scenario.months[0])).toBeCloseTo(Math.max(0, 40 * (1 - scenario.fraction) - 30), 6);
    expect(scenario.months[0].saving).toBeCloseTo(monthBilled(scenario.months[0]) - monthNewBilled(scenario.months[0]), 9);
  });

  it('a month over capacity that never ran out billed nothing, so using less saves no cash', async () => {
    const pipeline = await analyzeCsv(overCapacityCsv(40));
    const analysis = pipeline.analysis;
    expect(analysis.pool.months[0].capacityExceeded).toBe(true);
    expect(analysis.pool.months[0].exhaustedOn).toBeNull();
    const figures = scenarioFigures(scenarioOf(pipeline), 1, isCashKnown(analysis), isPoolKnown(analysis));
    expect(figures.cash).toBe(true);
    expect(figures.billedBefore).toBe(0);
    expect(figures.billedAfter).toBe(0);
    expect(figures.saveMonth).toBe(0);
  });
});
