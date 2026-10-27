import { describe, expect, it } from 'vitest';
import type { ChartColors } from '../src/components/charts/theme';
import {
  budgetTone,
  buildMonthRows,
  buildSkuRows,
  buildUsageSeries,
  estimateMonthlyCost,
  fmtBudgetPct,
  gapMonths,
  poolColumnsText,
  poolGap,
  splitChoices,
} from '../src/pages/spend/helpers';
import { addDays, analyzeCsv, dayNum, sum } from './helpers';

const COLORS = { accent: '#0969da', warn: '#bf8700' } as unknown as ChartColors;
const COLUMNS = ['date', 'username', 'sku', 'model', 'quantity', 'gross_amount', 'discount_amount', 'net_amount', 'total_monthly_quota', 'input', 'output', 'cache_read', 'cache_write'];

const line = (columns: string[], cell: Record<string, string>): string => columns.map((column) => cell[column] ?? '').join(',');

/** Three named users and one row without a username on every date. Each row is $1 of usage: $0.60 covered, $0.40 billed. */
function csv(dates: string[], options: { columns?: string[]; quota?: number } = {}): string {
  const columns = options.columns ?? COLUMNS;
  const rows = [columns.join(',')];
  for (const date of dates) {
    for (let userIndex = 0; userIndex < 4; userIndex++) {
      const named = userIndex < 3;
      const cell: Record<string, string> = {
        date,
        username: named ? `user${userIndex}` : '',
        sku: userIndex < 2 ? 'sku_a' : 'sku_b',
        model: 'Claude Sonnet 4.6',
        quantity: '100',
        gross_amount: '1.00',
        discount_amount: '0.60',
        net_amount: '0.40',
        total_monthly_quota: named ? String(options.quota ?? 1900) : '',
        input: '1000',
        output: '100',
        cache_read: '500',
        cache_write: '50',
      };
      rows.push(line(columns, cell));
    }
  }
  return rows.join('\n');
}

const span = (from: string, dayCount: number): string[] => Array.from({ length: dayCount }, (_, offset) => addDays(from, offset));

/** Seven days of August and ten days of September: August is complete, September is in progress. */
const TWO_MONTHS = span('2026-08-25', 17);

describe('a file that does not say what was billed', () => {
  const columns = ['date', 'username', 'sku', 'gross_amount'];
  const dates = span('2026-09-01', 10);

  it('names the billing split as the reason the pool is missing', async () => {
    const { analysis } = await analyzeCsv(csv(dates, { columns }));
    expect(analysis.coverage.billing).toBe(false);
    expect(poolGap(analysis.coverage.billing, analysis.pool.months)).toBe('billing');
    expect(poolColumnsText(analysis.coverage)).toContain('no discount_amount or net_amount column and no total_monthly_quota column');
  });

  it('offers Total usage instead of Covered vs billed', async () => {
    const pipeline = await analyzeCsv(csv(dates, { columns }));
    const choices = splitChoices(pipeline.analysis.agg, pipeline.models, false);
    expect(choices).toContain('total');
    expect(choices).not.toContain('coverage');
  });

  it('draws usage as one stack that adds up to the total', async () => {
    const pipeline = await analyzeCsv(csv(dates, { columns }));
    const { agg: aggregates, mask, range } = pipeline.analysis;
    const usage = buildUsageSeries({ store: pipeline.store, mask, range, agg: aggregates, models: pipeline.models, bucket: 'week', split: 'total', colors: COLORS });
    expect(aggregates.totals.gross).toBeGreaterThan(0);
    expect(usage.series.map((series) => series.name)).toEqual(['Usage']);
    expect(sum([...usage.totals])).toBeCloseTo(aggregates.totals.gross, 6);
  });
});

describe('a file with the billing split', () => {
  it('offers Covered vs billed and stacks covered and billed', async () => {
    const pipeline = await analyzeCsv(csv(TWO_MONTHS));
    const { agg: aggregates, mask, range } = pipeline.analysis;
    const choices = splitChoices(aggregates, pipeline.models, true);
    expect(choices).toContain('coverage');
    expect(choices).not.toContain('total');
    const usage = buildUsageSeries({ store: pipeline.store, mask, range, agg: aggregates, models: pipeline.models, bucket: 'month', split: 'coverage', colors: COLORS });
    expect(usage.series).toHaveLength(2);
    expect(sum([...usage.totals])).toBeCloseTo(aggregates.totals.discount + aggregates.totals.net, 6);
  });

  it('adds up the tokens of each month from the daily series', async () => {
    const pipeline = await analyzeCsv(csv(TWO_MONTHS));
    const { agg: aggregates, pool, narrowed } = pipeline.analysis;
    const rows = buildMonthRows(aggregates, pipeline.store, pool, narrowed);
    // Four rows a day: 28 rows in August and 40 in September.
    expect(rows.map((monthRow) => monthRow.tokens.input)).toEqual([28_000, 40_000]);
    expect(rows.map((monthRow) => monthRow.tokens.cacheRead)).toEqual([14_000, 20_000]);
    expect(rows.map((monthRow) => monthRow.tokens.cacheWrite)).toEqual([1_400, 2_000]);
    expect(rows.map((monthRow) => monthRow.tokens.output)).toEqual([2_800, 4_000]);
  });

  it('counts only the days inside the selected dates in a month the dates cut into', async () => {
    const pipeline = await analyzeCsv(csv(TWO_MONTHS));
    const analysis = pipeline.run({ ...pipeline.filters, dateFrom: dayNum('2026-08-28') });
    const rows = buildMonthRows(analysis.agg, pipeline.store, analysis.pool, analysis.narrowed);
    expect(rows.map((monthRow) => monthRow.partial)).toEqual([true, false]);
    expect(rows[0].tokens.input).toBe(16_000);
    expect(rows[1].tokens.input).toBe(40_000);
  });

  it('shows no tokens for a file without token columns', async () => {
    const columns = COLUMNS.filter((column) => !['input', 'output', 'cache_read', 'cache_write'].includes(column));
    const pipeline = await analyzeCsv(csv(TWO_MONTHS, { columns }));
    expect(pipeline.analysis.coverage.tokens).toBe(false);
    const rows = buildMonthRows(pipeline.analysis.agg, pipeline.store, pipeline.analysis.pool, pipeline.analysis.narrowed);
    for (const monthRow of rows) expect(monthRow.tokens).toEqual({ input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });
  });

  it('divides by the named users only, so unattributed usage stays out of Usage per user', async () => {
    const pipeline = await analyzeCsv(csv(TWO_MONTHS));
    const rows = buildMonthRows(pipeline.analysis.agg, pipeline.store, pipeline.analysis.pool, pipeline.analysis.narrowed);
    expect(rows[0].activeUsers).toBe(3);
    expect(rows[0].m.gross).toBeCloseTo(28, 6);
    expect(rows[0].perActiveUser).toBeCloseTo(7, 6);
  });

  it('lists each SKU once and counts its distinct named users', async () => {
    const pipeline = await analyzeCsv(csv(TWO_MONTHS));
    const { agg: aggregates, mask, range } = pipeline.analysis;
    const rows = buildSkuRows(pipeline.store, mask, range, aggregates);
    const bySku = new Map(rows.map((skuRow) => [skuRow.sku, skuRow]));
    expect(bySku.get('sku_a')?.users).toBe(2);
    // The row without a username has usage under sku_b but is not a user.
    expect(bySku.get('sku_b')?.users).toBe(1);
    expect(sum(rows.map((skuRow) => skuRow.share))).toBeCloseTo(1, 6);
    expect(sum(rows.map((skuRow) => skuRow.credits))).toBe(aggregates.totals.credits);
  });

  it('leaves out a SKU without rows in the selected dates', async () => {
    const early = line(COLUMNS, { date: '2026-08-01', username: 'user0', sku: 'sku_old', quantity: '100', gross_amount: '1.00', discount_amount: '0.00', net_amount: '1.00' });
    const pipeline = await analyzeCsv([csv(TWO_MONTHS), early].join('\n'));
    const all = buildSkuRows(pipeline.store, pipeline.analysis.mask, pipeline.analysis.range, pipeline.analysis.agg);
    expect(all.map((skuRow) => skuRow.sku)).toContain('sku_old');
    const analysis = pipeline.run({ ...pipeline.filters, dateFrom: dayNum('2026-08-25') });
    expect(buildSkuRows(pipeline.store, analysis.mask, analysis.range, analysis.agg).map((skuRow) => skuRow.sku).sort()).toEqual(['sku_a', 'sku_b']);
  });
});

describe('the pool in a file without a complete pool size', () => {
  it('says the seat sizes are missing when the file has no total_monthly_quota', async () => {
    const columns = COLUMNS.filter((column) => column !== 'total_monthly_quota');
    const { analysis } = await analyzeCsv(csv(TWO_MONTHS, { columns }));
    expect(analysis.coverage).toMatchObject({ billing: true, quota: false });
    expect(poolGap(analysis.coverage.billing, analysis.pool.months)).toBe('sizes');
  });

  it('says the pool is bigger than the file shows when covered usage is above the seats', async () => {
    // Three seats of 100 credits fund $3 a month, and about $17 was covered in August.
    const { analysis } = await analyzeCsv(csv(TWO_MONTHS, { quota: 100 }));
    expect(analysis.pool.capacityExceeded).toBe(true);
    expect(poolGap(analysis.coverage.billing, analysis.pool.months)).toBe('exceeded');
  });

  it('averages the larger of the pool and the usage for the estimated monthly cost', async () => {
    // Three seats of 1,000 credits are a $30 pool. Usage is $28 in August and $40 in September.
    const { analysis } = await analyzeCsv(csv(TWO_MONTHS, { quota: 1000 }));
    const cost = estimateMonthlyCost(analysis.pool);
    expect(cost.known).toBe(true);
    expect(cost.seats).toBeCloseTo(30, 6);
    expect(cost.overage).toBeCloseTo(5, 6);
    expect(cost.perMonth).toBeCloseTo(35, 6);
  });

  it('lists the months without rows between two months with usage', async () => {
    const { analysis } = await analyzeCsv(csv(['2026-07-30', '2026-07-31', '2026-09-01', '2026-09-02']));
    const months = analysis.pool.months;
    expect(months).toHaveLength(2);
    expect(gapMonths(months)).toEqual([months[0].month + 1]);
  });
});

describe('budget helpers', () => {
  it('colors the gauge by the worse of the share used and the share projected', () => {
    expect(budgetTone(0.5, null)).toBe('good');
    expect(budgetTone(0.79, 0.5)).toBe('good');
    expect(budgetTone(0.8, null)).toBe('warn');
    expect(budgetTone(0.5, 1)).toBe('bad');
    expect(budgetTone(Number.NaN, 0.85)).toBe('warn');
  });

  it('writes a share as a whole percent with thousands separators', () => {
    expect(fmtBudgetPct(0.256)).toBe('26%');
    expect(fmtBudgetPct(12.34)).toBe('1,234%');
    expect(fmtBudgetPct(Number.NaN)).toBe('–');
  });
});
