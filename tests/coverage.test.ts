import { describe, expect, it } from 'vitest';
import { dataCoverage, coverageIssues } from '../src/lib/analytics/coverage';
import { buildTaxonomy } from '../src/lib/analytics/taxonomy';
import { buildSummaryMarkdown } from '../src/lib/export/summary';
import { addDays, analyzeCsv, analyzeDemo, analyzeSources, sum } from './helpers';
import { FIXTURE_A, FIXTURE_B, analyzeFixtures } from './fixtures';

const BILLING_RECS = ['overage', 'pool-exhaustion', 'pool-underuse', 'idle-seats', 'downgrade'];

/** A September month of weekday usage for a few users, in the requested columns only. */
function csvWith(columns: string[], users = 6, days = 20): string {
  const rows: string[] = [columns.join(',')];
  for (let userIndex = 0; userIndex < users; userIndex++) {
    for (let dayIndex = 0; dayIndex < days; dayIndex++) {
      const gross = userIndex === 0 ? 4 : userIndex === 1 ? 0.2 : 1 + (dayIndex % 3) * 0.5;
      const cell: Record<string, string> = {
        date: addDays('2026-09-01', dayIndex),
        username: `user${userIndex}`,
        model: 'Claude Sonnet 4.6',
        quantity: String(Math.round(gross * 100)),
        gross_amount: gross.toFixed(2),
        // Everything beyond the first $60 of a user's usage would be billed; only used by files that carry the split.
        discount_amount: (gross * 0.6).toFixed(4),
        net_amount: (gross * 0.4).toFixed(4),
        total_monthly_quota: '1900',
        input: '1000',
        output: '100',
        cache_read: '500',
        cache_write: '50',
      };
      rows.push(columns.map((column) => cell[column] ?? '').join(','));
    }
  }
  return rows.join('\n');
}

describe('a file with no billing split (date, username, gross_amount only)', () => {
  const columns = ['date', 'username', 'gross_amount'];

  it('reports what is missing', async () => {
    const result = await analyzeCsv(csvWith(columns));
    expect(result.analysis.coverage).toEqual({ billing: false, quota: false, users: true, models: false, tokens: false });
    expect(coverageIssues(result.analysis.coverage).map((issue) => issue.id)).toEqual(['billing', 'quota', 'models', 'tokens']);
  });

  it('does not invent covered or billed amounts', async () => {
    const result = await analyzeCsv(csvWith(columns));
    const totals = result.analysis.agg.totals;
    expect(totals.gross).toBeGreaterThan(0);
    expect(totals.discount).toBe(0);
    expect(totals.net).toBe(0);
    expect(sum([...result.store.discount])).toBe(0);
    expect(sum([...result.store.net])).toBe(0);
    expect(result.store.files[0].balanceMismatchRows).toBe(0);
  });

  it('treats the pool as unknown instead of exhausted', async () => {
    const { pool, plan, seats } = (await analyzeCsv(csvWith(columns))).analysis;
    expect(pool.capacityExceeded).toBe(true);
    expect(pool.months.length).toBeGreaterThan(0);
    for (const month of pool.months) {
      expect(month.capacityExceeded).toBe(true);
      expect(month.exhaustedOn).toBeNull();
      expect(Number.isNaN(month.utilization)).toBe(true);
      expect(month.projection?.exhaustionDate ?? null).toBeNull();
    }
    expect(pool.monthsExhausted).toBe(0);
    expect(plan.seatValue).toBe(0);
    expect(plan.perMonth).toBe(0);
    expect(seats.unusedValue).toBe(0);
  });

  it('makes no billing, pool or seat claims and says so in the headline', async () => {
    const analysis = (await analyzeCsv(csvWith(columns))).analysis;
    const ids = analysis.recs.map((recommendation) => recommendation.id);
    for (const id of BILLING_RECS) expect(ids).not.toContain(id);
    expect(ids).toContain('data-coverage');
    expect(analysis.headline.status).toBe('watch');
    expect(analysis.headline.title).toMatch(/does not say what was billed/i);
    const everything = JSON.stringify(analysis.recs) + JSON.stringify(analysis.headline);
    expect(everything).not.toMatch(/billed beyond|ran out|runs out|Reclaim \d+ idle/i);
  });

  it('keeps the parts that do not need billing data', async () => {
    const analysis = (await analyzeCsv(csvWith(columns))).analysis;
    expect(analysis.users.profiles.length).toBe(6);
    expect(analysis.agg.totals.users).toBe(6);
    expect(analysis.agg.totals.gross).toBeCloseTo(sum([...analysis.agg.days.gross]), 6);
  });

  it('flags the gap in the executive summary instead of printing $0 billed', async () => {
    const result = await analyzeCsv(csvWith(columns));
    const summary = buildSummaryMarkdown({ analysis: result.analysis, settings: result.settings, taxonomy: buildTaxonomy(result.settings), label: 'minimal.csv', filters: [] });
    expect(summary).toMatch(/Billed overage \| not in this file/);
    expect(summary).toMatch(/Covered by included credits \| not in this file/);
    expect(summary).toMatch(/does not say what was billed/i);
    expect(summary).not.toMatch(/## Included credits by month/);
  });
});

describe('a file with the billing split but no seat sizes', () => {
  const columns = ['date', 'username', 'model', 'quantity', 'gross_amount', 'discount_amount', 'net_amount'];

  it('keeps the billed amounts but not the pool', async () => {
    const analysis = (await analyzeCsv(csvWith(columns))).analysis;
    expect(analysis.coverage.billing).toBe(true);
    expect(analysis.coverage.quota).toBe(false);
    expect(analysis.agg.totals.net).toBeGreaterThan(0);
    expect(analysis.pool.capacityExceeded).toBe(true);
    const ids = analysis.recs.map((recommendation) => recommendation.id);
    expect(ids).toContain('overage');
    expect(ids).toContain('data-coverage');
    expect(ids).not.toContain('pool-underuse');
    expect(ids).not.toContain('idle-seats');
    expect(analysis.headline.title).not.toMatch(/does not say what was billed/i);
  });

  it('names the missing column', async () => {
    const analysis = (await analyzeCsv(csvWith(columns))).analysis;
    const coverageRecommendation = analysis.recs.find((recommendation) => recommendation.id === 'data-coverage');
    expect(coverageRecommendation?.title).toMatch(/no seat sizes/i);
    expect(coverageRecommendation?.evidence.join(' ')).toMatch(/total_monthly_quota/);
  });
});

describe('a file with no model names', () => {
  const noModelColumn = ['date', 'username', 'quantity', 'gross_amount', 'discount_amount', 'net_amount', 'total_monthly_quota', 'input', 'output', 'cache_read', 'cache_write'];
  const all = [...noModelColumn, 'model'];
  const blankModels = (): string => csvWith(all).replaceAll('Claude Sonnet 4.6', '');

  it('treats a missing model column and an all-blank one the same way', async () => {
    for (const csv of [csvWith(noModelColumn), blankModels()]) {
      const analysis = (await analyzeCsv(csv)).analysis;
      expect(analysis.coverage.models).toBe(false);
      expect(analysis.coverage.billing).toBe(true);
      expect(coverageIssues(analysis.coverage).map((issue) => issue.id)).toContain('models');
    }
  });

  it('claims no Auto savings, no Auto recommendation and no low-Auto users', async () => {
    for (const csv of [csvWith(noModelColumn), blankModels()]) {
      const analysis = (await analyzeCsv(csv)).analysis;
      const lever = analysis.levers.steps.find((step) => step.id === 'autoAdoption');
      expect(lever?.savings).toBe(0);
      expect(analysis.recs.map((recommendation) => recommendation.id)).not.toContain('auto-adoption');
      expect(analysis.users.profiles.every((profile) => !profile.traits.includes('lowAuto'))).toBe(true);
      expect(analysis.users.profiles.every((profile) => profile.potentialBy.autoAdoption === 0)).toBe(true);
      expect(analysis.headline.detail).not.toMatch(/Auto/);
    }
  });

  it('prints a dash for the Auto share in the executive summary', async () => {
    const result = await analyzeCsv(csvWith(noModelColumn));
    const summary = buildSummaryMarkdown({ analysis: result.analysis, settings: result.settings, taxonomy: buildTaxonomy(result.settings), label: 'x.csv', filters: [] });
    expect(summary).toMatch(/Auto share of usage \| –/);
  });

  it('still recommends Auto when models are named and none of them is Auto', async () => {
    const analysis = (await analyzeCsv(csvWith(all))).analysis;
    expect(analysis.coverage.models).toBe(true);
    expect(analysis.levers.steps.find((step) => step.id === 'autoAdoption')?.savings).toBeGreaterThan(0);
    expect(analysis.recs.map((recommendation) => recommendation.id)).toContain('auto-adoption');
  });
});

describe('a file with every column', () => {
  const all = ['date', 'username', 'model', 'quantity', 'gross_amount', 'discount_amount', 'net_amount', 'total_monthly_quota', 'input', 'output', 'cache_read', 'cache_write'];

  it('has full coverage and no coverage recommendation', async () => {
    const analysis = (await analyzeCsv(csvWith(all))).analysis;
    expect(analysis.coverage).toEqual({ billing: true, quota: true, users: true, models: true, tokens: true });
    expect(coverageIssues(analysis.coverage)).toEqual([]);
    expect(analysis.recs.map((recommendation) => recommendation.id)).not.toContain('data-coverage');
  });
});

describe('the fixtures and the demo have full coverage', () => {
  it('pool-used fixture (billed overage, pool exhausted) keeps its billing statements', async () => {
    const analysis = (await analyzeFixtures([FIXTURE_A])).analysis;
    expect(analysis.coverage).toEqual({ billing: true, quota: true, users: true, models: true, tokens: true });
    expect(analysis.pool.capacityExceeded).toBe(false);
    expect(analysis.agg.totals.net).toBeGreaterThan(80);
    expect(analysis.recs.map((recommendation) => recommendation.id)).toContain('overage');
    expect(analysis.recs.map((recommendation) => recommendation.id)).not.toContain('data-coverage');
  });

  it('partial-export fixture still reports an unknown pool size, without a missing-column warning', async () => {
    const analysis = (await analyzeFixtures([FIXTURE_B])).analysis;
    expect(analysis.coverage.billing).toBe(true);
    expect(analysis.pool.capacityExceeded).toBe(true);
    expect(analysis.recs.map((recommendation) => recommendation.id)).not.toContain('data-coverage');
    expect(analysis.headline.title).not.toMatch(/does not say what was billed/i);
  });

  it('the demo data has every column and a known pool', async () => {
    const result = await analyzeDemo();
    expect(dataCoverage(result.store)).toEqual({ billing: true, quota: true, users: true, models: true, tokens: true });
    expect(result.analysis.pool.capacityExceeded).toBe(false);
    expect(result.analysis.recs.map((recommendation) => recommendation.id)).not.toContain('data-coverage');
  });
});

describe('coverage across several files', () => {
  it('needs the billing split in every file', async () => {
    const full = csvWith(['date', 'username', 'gross_amount', 'discount_amount', 'net_amount', 'total_monthly_quota'], 3, 5);
    const bare = csvWith(['date', 'username', 'gross_amount'], 3, 5).replace(/user/g, 'other');
    const both = (await analyzeSources([{ name: 'full.csv', data: full }, { name: 'bare.csv', data: bare }])).analysis;
    expect(both.coverage.billing).toBe(false);
    const alone = (await analyzeSources([{ name: 'full.csv', data: full }])).analysis;
    expect(alone.coverage.billing).toBe(true);
    expect(alone.coverage.quota).toBe(true);
  });
});
