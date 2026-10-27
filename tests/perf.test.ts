import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { analyze, type Analysis } from '../src/lib/analytics/analyze';
import { emptyFilters, type Filters } from '../src/lib/analytics/filters';
import { prepareStore, type Prepared } from '../src/lib/analytics/prepare';
import { facetCounts, type FacetKey } from '../src/lib/analytics/series';
import { mergeSettings } from '../src/lib/analytics/settings';
import { buildStore } from '../src/lib/csv/ingest';
import { PRICE_CARD } from '../src/lib/pricing/card';
import { buildModelTable, type ModelTable } from '../src/lib/pricing/models';
import type { DataStore } from '../src/lib/types';
import { analysisTexts, BAD_TEXT, CSV_HEADER, dayNum, isoOf, mulberry32 } from './helpers';

/**
 * Scale test, off by default: `PERF=1 npx vitest run tests/perf.test.ts`.
 * The timings are written to tests/.scratch/perf-report.json (override with PERF_REPORT).
 */

const USERS = 600;
const DAYS = 90;
const TARGET_ROWS = 1_000_000;
const START = '2026-07-01';
const REPORT = process.env.PERF_REPORT ?? join(__dirname, '.scratch', 'perf-report.json');

interface Truth {
  rows: number;
  /** All money in units of 1e-8 USD so that the sums are exact. */
  gross: number;
  discount: number;
  net: number;
  users: number;
  models: number;
  chars: number;
  months: Record<string, { gross: number; net: number; capacity: number }>;
}

/** About a million rows over 90 days: 600 users, 21 models of the price card, a monthly pool that runs dry. */
function generate(): { csv: string; truth: Truth } {
  const rand = mulberry32(1_000_003);
  const card = PRICE_CARD.filter((_, i) => i % 4 !== 3);
  const M = card.length;
  const weights = card.map((_, k) => 1 / (k + 1) ** 0.8);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const cum: number[] = [];
  weights.reduce((acc, w, k) => (cum[k] = acc + w / totalWeight), 0);
  const pickModel = (): number => {
    const x = rand();
    let k = 0;
    while (k < M - 1 && cum[k] < x) k++;
    return k;
  };

  const q = (s: string): string => `"${s}"`;
  const userQ: string[] = [];
  const quota: number[] = [];
  const quotaQ: string[] = [];
  const orgQ: string[] = [];
  const ccQ: string[] = [];
  const scale: number[] = [];
  const shift: number[] = [];
  const first: number[] = [];
  const last: number[] = [];
  const level: number[] = [];
  const ORGS = ['northwind-platform', 'northwind-data', 'northwind-mobile', 'northwind-web', 'northwind-infra', 'northwind-labs'];
  const COST_CENTERS = ['Platform', 'Analytics', 'Mobile', 'Web', 'Infrastructure', 'Research', 'Security', 'Finance'];
  for (let u = 0; u < USERS; u++) {
    userQ.push(q(`user-${String(u).padStart(4, '0')}`));
    const q0 = rand() < 0.7 ? 1900 : 3900;
    quota.push(q0);
    quotaQ.push(q(String(q0)));
    orgQ.push(q(ORGS[u % ORGS.length]));
    ccQ.push(q(COST_CENTERS[u % COST_CENTERS.length]));
    scale.push(Math.exp((rand() - 0.5) * 3.2) * (rand() < 0.02 ? 8 : 1));
    shift.push(Math.floor(rand() * M));
    level.push(0.4 + 0.6 * rand());
    first.push(rand() < 0.05 ? 30 + Math.floor(rand() * 50) : 0);
    last.push(rand() < 0.05 ? 20 + Math.floor(rand() * 50) : DAYS - 1);
  }
  const REPOS = Array.from({ length: 80 }, (_, i) => q(`repo-${String(i).padStart(2, '0')}`));
  REPOS.push('""', '""', '""', '""', '""', '""', '""', '""'); // ~10% of the rows have no repository
  const APPS = ['""', '""', '""', '""', '""', '""', '""', q('Iv1.0a1b2c3d4e5f6a7b'), q('Iv1.7f6e5d4c3b2a1908')];
  const modelQ = card.map((c) => q(c.name));
  const autoQ = card.map((c) => q(`Auto: ${c.name}`));

  const day0 = dayNum(START);
  const dateQ: string[] = [];
  const dow: number[] = [];
  const monthOfDay: string[] = [];
  for (let d = 0; d < DAYS; d++) {
    dateQ.push(q(isoOf(day0 + d)));
    dow.push((day0 + d + 3) % 7);
    monthOfDay.push(isoOf(day0 + d).slice(0, 7));
  }

  // Which users are active on which day, decided first so that the monthly pool is known.
  const active = new Uint8Array(USERS * DAYS);
  let activeDays = 0;
  const monthUsers = new Map<string, Set<number>>();
  for (let d = 0; d < DAYS; d++) {
    const weekday = dow[d] < 5;
    for (let u = 0; u < USERS; u++) {
      if (d < first[u] || d > last[u]) continue;
      if (rand() < level[u] * (weekday ? 0.95 : 0.2)) {
        active[d * USERS + u] = 1;
        activeDays++;
        let set = monthUsers.get(monthOfDay[d]);
        if (!set) monthUsers.set(monthOfDay[d], (set = new Set()));
        set.add(u);
      }
    }
  }
  const months: Truth['months'] = {};
  const remaining = new Map<string, number>();
  for (const [month, set] of monthUsers) {
    let cap = 0;
    for (const u of set) cap += quota[u] * 1e6; // credits × $0.01 in 1e-8 USD
    months[month] = { gross: 0, net: 0, capacity: cap };
    remaining.set(month, cap);
  }

  const perDay = Math.floor(TARGET_ROWS / activeDays);
  const extra = TARGET_ROWS - perDay * activeDays;
  let carry = 0;
  let emitted = 0;
  let gross = 0;
  let discount = 0;
  let net = 0;
  let chars = 0;
  const usersSeen = new Set<number>();
  const modelsSeen = new Set<number>();
  const header = `${CSV_HEADER.map(q).join(',')}`;
  const chunks: string[] = [header];
  let seenActive = 0;

  for (let d = 0; d < DAYS; d++) {
    const lines: string[] = [];
    const month = monthOfDay[d];
    for (let u = 0; u < USERS; u++) {
      if (!active[d * USERS + u]) continue;
      seenActive++;
      carry += extra / activeDays;
      let count = perDay + Math.floor(carry);
      carry -= Math.floor(carry);
      if (seenActive === activeDays) count = TARGET_ROWS - emitted;
      usersSeen.add(u);
      for (let k = 0; k < count; k++) {
        const m = (pickModel() + shift[u]) % M;
        modelsSeen.add(m);
        const entry = card[m];
        const long = entry.long !== undefined && rand() < 0.004;
        const s = scale[u] * (0.4 + rand() * 1.2);
        const inp = Math.round(10_000 * s * (0.5 + rand()));
        let cacheRead = Math.round(inp * rand() * 5);
        const cacheWrite = entry.base.cacheWrite > 0 ? Math.round(inp * rand() * 0.25) : 0;
        const out = Math.round(inp * 0.04 * (0.5 + rand()));
        if (long) cacheRead += entry.longThreshold! + Math.round(rand() * 200_000);
        const rates = long ? entry.long! : entry.base;
        const isAuto = rand() < 0.2;
        const usd = ((inp * rates.input + cacheRead * rates.cachedInput + cacheWrite * rates.cacheWrite + out * rates.output) / 1e6) * (isAuto ? 0.9 : 1);
        const g8 = Math.max(1, Math.round(usd * 1e8));
        const left = remaining.get(month)!;
        const d8 = Math.min(g8, left);
        remaining.set(month, left - d8);
        const n8 = g8 - d8;
        gross += g8;
        discount += d8;
        net += n8;
        months[month].gross += g8;
        months[month].net += n8;
        const line = `${dateQ[d]},${userQ[u]},"copilot","copilot_ai_credit",${isAuto ? autoQ[m] : modelQ[m]},"${(g8 / 1e6).toFixed(6)}","ai-credits","0.01","${(g8 / 1e8).toFixed(8)}","${(d8 / 1e8).toFixed(8)}","${(n8 / 1e8).toFixed(8)}",${quotaQ[u]},${orgQ[u]},${APPS[Math.floor(rand() * APPS.length)]},${REPOS[Math.floor(rand() * REPOS.length)]},${ccQ[u]},"0","0","${inp}","${out}","${cacheRead}","${cacheWrite}"`;
        chars += line.length + 1;
        lines.push(line);
      }
      emitted += count;
    }
    if (lines.length) chunks.push(lines.join('\n'));
  }
  chunks.push('');
  return { csv: chunks.join('\n'), truth: { rows: emitted, gross, discount, net, users: usersSeen.size, models: modelsSeen.size, chars, months } };
}

const FACET_KEYS: FacetKey[] = ['users', 'products', 'skus', 'models', 'orgs', 'costCenters', 'repos', 'apps', 'files', 'vendors', 'categories', 'plans', 'weekdays'];

describe.skipIf(process.env.PERF !== '1')('performance at one million rows', () => {
  const timings: Record<string, number> = {};
  const memory: Record<string, number> = {};
  let truth: Truth;
  let csvChars = 0;
  let store: DataStore;
  let prep: Prepared;
  let models: ModelTable;
  const settings = mergeSettings({});

  const time = <T>(label: string, fn: () => T): T => {
    const t0 = performance.now();
    const out = fn();
    timings[label] = Math.round((performance.now() - t0) * 10) / 10;
    return out;
  };
  const mb = (): number => Math.round(process.memoryUsage().rss / 1e6);
  const run = (label: string, filters: Filters): Analysis => time(label, () => analyze({ store, prep, models, filters, settings }));

  beforeAll(async () => {
    let csv = '';
    const t0 = performance.now();
    ({ csv, truth } = generate());
    timings.generateCsv = Math.round(performance.now() - t0);
    csvChars = csv.length;
    memory.rssAfterGenerateMB = mb();
    const t1 = performance.now();
    store = await buildStore([{ name: 'perf.csv', data: csv }]);
    timings.buildStore = Math.round(performance.now() - t1);
    memory.rssAfterIngestMB = mb();
    prep = time('prepareStore', () => prepareStore(store));
    models = time('buildModelTable', () => buildModelTable(store, settings.modelOverrides));
    memory.rssAfterPrepareMB = mb();
  }, 600_000);

  afterAll(() => {
    memory.rssEndMB = mb();
    mkdirSync(dirname(REPORT), { recursive: true });
    writeFileSync(
      REPORT,
      `${JSON.stringify(
        { node: process.version, rows: store?.n, csvMB: Math.round(csvChars / 1e6), users: truth?.users, models: truth?.models, timingsMs: timings, memory },
        null,
        2,
      )}\n`,
    );
  });

  it('generated about a million rows, in a file of realistic size', () => {
    expect(truth.rows).toBe(TARGET_ROWS);
    expect(truth.users).toBeGreaterThanOrEqual(500);
    expect(truth.models).toBeGreaterThanOrEqual(15);
    expect(csvChars).toBeGreaterThan(150e6);
    expect(truth.net).toBeGreaterThan(0);
    expect(Object.keys(truth.months).sort()).toEqual(['2026-07', '2026-08', '2026-09']);
  });

  it('ingests the file in under 20 s and keeps every row and every cent', { timeout: 60_000 }, () => {
    expect(timings.buildStore).toBeLessThan(20_000);
    expect(store.n).toBe(TARGET_ROWS);
    expect(store.files).toHaveLength(1);
    const f = store.files[0];
    expect(f).toMatchObject({
      rowsRead: TARGET_ROWS,
      rowsKept: TARGET_ROWS,
      duplicatesDropped: 0,
      badDateRows: 0,
      badNumberCells: 0,
      balanceMismatchRows: 0,
      priceMismatchRows: 0,
      negativeRows: 0,
      missingColumns: [],
    });
    expect(store.minDay).toBe(dayNum(START));
    expect(store.maxDay).toBeLessThanOrEqual(dayNum(START) + 89);
    let gross = 0;
    let discount = 0;
    let net = 0;
    for (let i = 0; i < store.n; i++) {
      gross += store.gross[i];
      discount += store.discount[i];
      net += store.net[i];
    }
    expect(gross).toBeCloseTo(truth.gross / 1e8, 2);
    expect(discount).toBeCloseTo(truth.discount / 1e8, 2);
    expect(net).toBeCloseTo(truth.net / 1e8, 2);
    expect(store.dicts.user.values.filter((u) => u !== '')).toHaveLength(truth.users);
    expect(store.dicts.model.values.filter((v) => v !== '')).toHaveLength(truth.models);
  });

  it('prepares the store in under 10 s', () => {
    expect(timings.prepareStore).toBeLessThan(10_000);
    expect(timings.buildModelTable).toBeLessThan(2_000);
  });

  it('analyses everything in under 3 s, cold and warm, with the same result', { timeout: 60_000 }, () => {
    const cold = run('analyze:all:cold', emptyFilters());
    const warm = run('analyze:all:warm', emptyFilters());
    expect(timings['analyze:all:cold']).toBeLessThan(3_000);
    expect(timings['analyze:all:warm']).toBeLessThan(3_000);
    expect(cold.ms).toBeLessThan(3_000);
    for (const a of [cold, warm]) {
      expect(a.agg.totals.rows).toBe(TARGET_ROWS);
      expect(a.agg.totals.gross).toBeCloseTo(truth.gross / 1e8, 2);
      expect(a.agg.totals.net).toBeCloseTo(truth.net / 1e8, 2);
      expect(a.agg.totals.users).toBe(truth.users);
      expect(a.pool.months.map((m) => m.key)).toEqual(['2026-07', '2026-08', '2026-09']);
      expect(a.users.profiles).toHaveLength(truth.users);
      expect(analysisTexts(a).filter((t) => BAD_TEXT.test(t))).toEqual([]);
    }
    expect(warm.agg.totals).toEqual(cold.agg.totals);
    expect(warm.recs.map((r) => r.id)).toEqual(cold.recs.map((r) => r.id));
    expect(warm.pool.months.map((m) => m.capacity)).toEqual(cold.pool.months.map((m) => m.capacity));
  });

  it('the monthly pools and billed amounts match what the generator drew', () => {
    const a = run('analyze:all:again', emptyFilters());
    for (const m of a.pool.months) {
      const t = truth.months[m.key];
      expect(m.capacity, m.key).toBeCloseTo(t.capacity / 1e8, 2);
      expect(m.gross, m.key).toBeCloseTo(t.gross / 1e8, 2);
      expect(m.net, m.key).toBeCloseTo(t.net / 1e8, 2);
    }
  });

  const last30 = (): number => store.maxDay - 29;
  const modelNames = (n: number): string[] => store.dicts.model.values.filter((v) => v !== '').slice(0, n);
  const FILTERS: [string, () => Filters][] = [
    ['dateRange', () => ({ ...emptyFilters(), dateFrom: last30() })],
    ['models', () => ({ ...emptyFilters(), models: modelNames(3) })],
    ['orgs+weekdays', () => ({ ...emptyFilters(), orgs: ['northwind-platform', 'northwind-data'], weekdays: [0, 1, 2, 3, 4] })],
    ['search', () => ({ ...emptyFilters(), search: 'astra' })],
    ['billing+date', () => ({ ...emptyFilters(), billing: 'billed', dateFrom: last30() })],
    ['segment', () => ({ ...emptyFilters(), tiers: ['power', 'runaway'] })],
    ['segment+models+date', () => ({ ...emptyFilters(), tiers: ['core', 'power', 'runaway'], models: modelNames(5), dateFrom: last30() })],
  ];
  for (const [name, make] of FILTERS) {
    it(`analyses with the ${name} filter in under 3 s`, { timeout: 60_000 }, () => {
      const f = make();
      const a = run(`analyze:${name}`, f);
      expect(timings[`analyze:${name}`]).toBeLessThan(3_000);
      expect(a.narrowed || name === 'dateRange').toBe(true);
      expect(a.agg.totals.rows).toBeGreaterThan(0);
      expect(a.agg.totals.rows).toBeLessThanOrEqual(TARGET_ROWS);
      expect(analysisTexts(a).filter((t) => BAD_TEXT.test(t))).toEqual([]);
    });
  }

  it('a date filter keeps exactly the rows of the window, which a plain loop confirms', () => {
    const from = last30();
    let rows = 0;
    for (let i = 0; i < store.n; i++) if (store.day[i] >= from) rows++;
    const a = run('analyze:dateRange:check', { ...emptyFilters(), dateFrom: from });
    expect(a.agg.totals.rows).toBe(rows);
    expect(a.previous).not.toBeNull();
  });

  it('counts every option of every filter in under 2 s each', { timeout: 120_000 }, () => {
    const filters: Filters = { ...emptyFilters(), models: modelNames(3), dateFrom: last30() };
    const wanted = new Set(filters.models.map((m) => store.dicts.model.values.indexOf(m)));
    let withOthers = 0;
    let withoutModels = 0;
    for (let i = 0; i < store.n; i++) {
      if (store.day[i] < filters.dateFrom!) continue;
      withoutModels++;
      if (wanted.has(store.model[i])) withOthers++;
    }
    let total = 0;
    for (const key of FACET_KEYS) {
      const counts = time(`facetCounts:${key}`, () => facetCounts(store, prep, models, filters, key));
      total += timings[`facetCounts:${key}`];
      expect(timings[`facetCounts:${key}`], key).toBeLessThan(2_000);
      const rows = counts.rows.reduce((a, b) => a + b, 0);
      // The facet ignores its own filter and applies all the others.
      expect(rows, key).toBe(key === 'models' ? withoutModels : withOthers);
    }
    timings['facetCounts:total'] = Math.round(total * 10) / 10;
    expect(total).toBeLessThan(10_000);
    const plain = time('facetCounts:models:noFilters', () => facetCounts(store, prep, models, emptyFilters(), 'models'));
    expect(plain.rows.reduce((a, b) => a + b, 0)).toBe(TARGET_ROWS);
  });
});
