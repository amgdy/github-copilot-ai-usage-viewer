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
  for (let u = 0; u < users; u++) {
    for (let d = 0; d < days; d++) {
      const gross = u === 0 ? 4 : u === 1 ? 0.2 : 1 + (d % 3) * 0.5;
      const cell: Record<string, string> = {
        date: addDays('2026-09-01', d),
        username: `user${u}`,
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
      rows.push(columns.map((c) => cell[c] ?? '').join(','));
    }
  }
  return rows.join('\n');
}

describe('a file with no billing split (date, username, gross_amount only)', () => {
  const columns = ['date', 'username', 'gross_amount'];

  it('reports what is missing', async () => {
    const p = await analyzeCsv(csvWith(columns));
    expect(p.analysis.coverage).toEqual({ billing: false, quota: false, users: true, models: false, tokens: false });
    expect(coverageIssues(p.analysis.coverage).map((i) => i.id)).toEqual(['billing', 'quota', 'models', 'tokens']);
  });

  it('does not invent covered or billed amounts', async () => {
    const p = await analyzeCsv(csvWith(columns));
    const t = p.analysis.agg.totals;
    expect(t.gross).toBeGreaterThan(0);
    expect(t.discount).toBe(0);
    expect(t.net).toBe(0);
    expect(sum([...p.store.discount])).toBe(0);
    expect(sum([...p.store.net])).toBe(0);
    expect(p.store.files[0].balanceMismatchRows).toBe(0);
  });

  it('treats the pool as unknown instead of exhausted', async () => {
    const { pool, plan, seats } = (await analyzeCsv(csvWith(columns))).analysis;
    expect(pool.capacityExceeded).toBe(true);
    expect(pool.months.length).toBeGreaterThan(0);
    for (const m of pool.months) {
      expect(m.capacityExceeded).toBe(true);
      expect(m.exhaustedOn).toBeNull();
      expect(Number.isNaN(m.utilization)).toBe(true);
      expect(m.projection?.exhaustionDate ?? null).toBeNull();
    }
    expect(pool.monthsExhausted).toBe(0);
    expect(plan.seatValue).toBe(0);
    expect(plan.perMonth).toBe(0);
    expect(seats.unusedValue).toBe(0);
  });

  it('makes no billing, pool or seat claims and says so in the headline', async () => {
    const a = (await analyzeCsv(csvWith(columns))).analysis;
    const ids = a.recs.map((r) => r.id);
    for (const id of BILLING_RECS) expect(ids).not.toContain(id);
    expect(ids).toContain('data-coverage');
    expect(a.headline.status).toBe('watch');
    expect(a.headline.title).toMatch(/does not say what was billed/i);
    const everything = JSON.stringify(a.recs) + JSON.stringify(a.headline);
    expect(everything).not.toMatch(/billed beyond|ran out|runs out|Reclaim \d+ idle/i);
  });

  it('keeps the parts that do not need billing data', async () => {
    const a = (await analyzeCsv(csvWith(columns))).analysis;
    expect(a.users.profiles.length).toBe(6);
    expect(a.agg.totals.users).toBe(6);
    expect(a.agg.totals.gross).toBeCloseTo(sum([...a.agg.days.gross]), 6);
  });

  it('flags the gap in the executive summary instead of printing $0 billed', async () => {
    const p = await analyzeCsv(csvWith(columns));
    const md = buildSummaryMarkdown({ analysis: p.analysis, settings: p.settings, taxonomy: buildTaxonomy(p.settings), label: 'minimal.csv', filters: [] });
    expect(md).toMatch(/Billed overage \| not in this file/);
    expect(md).toMatch(/Covered by included credits \| not in this file/);
    expect(md).toMatch(/does not say what was billed/i);
    expect(md).not.toMatch(/## Included credits by month/);
  });
});

describe('a file with the billing split but no seat sizes', () => {
  const columns = ['date', 'username', 'model', 'quantity', 'gross_amount', 'discount_amount', 'net_amount'];

  it('keeps the billed amounts but not the pool', async () => {
    const a = (await analyzeCsv(csvWith(columns))).analysis;
    expect(a.coverage.billing).toBe(true);
    expect(a.coverage.quota).toBe(false);
    expect(a.agg.totals.net).toBeGreaterThan(0);
    expect(a.pool.capacityExceeded).toBe(true);
    const ids = a.recs.map((r) => r.id);
    expect(ids).toContain('overage');
    expect(ids).toContain('data-coverage');
    expect(ids).not.toContain('pool-underuse');
    expect(ids).not.toContain('idle-seats');
    expect(a.headline.title).not.toMatch(/does not say what was billed/i);
  });

  it('names the missing column', async () => {
    const a = (await analyzeCsv(csvWith(columns))).analysis;
    const rec = a.recs.find((r) => r.id === 'data-coverage');
    expect(rec?.title).toMatch(/no seat sizes/i);
    expect(rec?.evidence.join(' ')).toMatch(/total_monthly_quota/);
  });
});

describe('a file with no model names', () => {
  const noModelColumn = ['date', 'username', 'quantity', 'gross_amount', 'discount_amount', 'net_amount', 'total_monthly_quota', 'input', 'output', 'cache_read', 'cache_write'];
  const all = [...noModelColumn, 'model'];
  const blankModels = (): string => csvWith(all).replaceAll('Claude Sonnet 4.6', '');

  it('treats a missing model column and an all-blank one the same way', async () => {
    for (const csv of [csvWith(noModelColumn), blankModels()]) {
      const a = (await analyzeCsv(csv)).analysis;
      expect(a.coverage.models).toBe(false);
      expect(a.coverage.billing).toBe(true);
      expect(coverageIssues(a.coverage).map((i) => i.id)).toContain('models');
    }
  });

  it('claims no Auto savings, no Auto recommendation and no low-Auto users', async () => {
    for (const csv of [csvWith(noModelColumn), blankModels()]) {
      const a = (await analyzeCsv(csv)).analysis;
      const lever = a.levers.steps.find((s) => s.id === 'autoAdoption');
      expect(lever?.savings).toBe(0);
      expect(a.recs.map((r) => r.id)).not.toContain('auto-adoption');
      expect(a.users.profiles.every((p) => !p.traits.includes('lowAuto'))).toBe(true);
      expect(a.users.profiles.every((p) => p.potentialBy.autoAdoption === 0)).toBe(true);
      expect(a.headline.detail).not.toMatch(/Auto/);
    }
  });

  it('prints a dash for the Auto share in the executive summary', async () => {
    const p = await analyzeCsv(csvWith(noModelColumn));
    const md = buildSummaryMarkdown({ analysis: p.analysis, settings: p.settings, taxonomy: buildTaxonomy(p.settings), label: 'x.csv', filters: [] });
    expect(md).toMatch(/Auto share of usage \| –/);
  });

  it('still recommends Auto when models are named and none of them is Auto', async () => {
    const a = (await analyzeCsv(csvWith(all))).analysis;
    expect(a.coverage.models).toBe(true);
    expect(a.levers.steps.find((s) => s.id === 'autoAdoption')?.savings).toBeGreaterThan(0);
    expect(a.recs.map((r) => r.id)).toContain('auto-adoption');
  });
});

describe('a file with every column', () => {
  const all = ['date', 'username', 'model', 'quantity', 'gross_amount', 'discount_amount', 'net_amount', 'total_monthly_quota', 'input', 'output', 'cache_read', 'cache_write'];

  it('has full coverage and no coverage recommendation', async () => {
    const a = (await analyzeCsv(csvWith(all))).analysis;
    expect(a.coverage).toEqual({ billing: true, quota: true, users: true, models: true, tokens: true });
    expect(coverageIssues(a.coverage)).toEqual([]);
    expect(a.recs.map((r) => r.id)).not.toContain('data-coverage');
  });
});

describe('the fixtures and the demo have full coverage', () => {
  it('pool-used fixture (billed overage, pool exhausted) keeps its billing statements', async () => {
    const a = (await analyzeFixtures([FIXTURE_A])).analysis;
    expect(a.coverage).toEqual({ billing: true, quota: true, users: true, models: true, tokens: true });
    expect(a.pool.capacityExceeded).toBe(false);
    expect(a.agg.totals.net).toBeGreaterThan(80);
    expect(a.recs.map((r) => r.id)).toContain('overage');
    expect(a.recs.map((r) => r.id)).not.toContain('data-coverage');
  });

  it('partial-export fixture still reports an unknown pool size, without a missing-column warning', async () => {
    const a = (await analyzeFixtures([FIXTURE_B])).analysis;
    expect(a.coverage.billing).toBe(true);
    expect(a.pool.capacityExceeded).toBe(true);
    expect(a.recs.map((r) => r.id)).not.toContain('data-coverage');
    expect(a.headline.title).not.toMatch(/does not say what was billed/i);
  });

  it('the demo data has every column and a known pool', async () => {
    const p = await analyzeDemo();
    expect(dataCoverage(p.store)).toEqual({ billing: true, quota: true, users: true, models: true, tokens: true });
    expect(p.analysis.pool.capacityExceeded).toBe(false);
    expect(p.analysis.recs.map((r) => r.id)).not.toContain('data-coverage');
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
