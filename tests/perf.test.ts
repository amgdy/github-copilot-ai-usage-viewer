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
const REPORT = process.env.PERF_REPORT ?? join(import.meta.dirname, '.scratch', 'perf-report.json');

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
  const random = mulberry32(1_000_003);
  const card = PRICE_CARD.filter((_, index) => index % 4 !== 3);
  const modelCount = card.length;
  const weights = card.map((_, modelIndex) => 1 / (modelIndex + 1) ** 0.8);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const cumulativeShares: number[] = [];
  weights.reduce((runningShare, weight, modelIndex) => (cumulativeShares[modelIndex] = runningShare + weight / totalWeight), 0);
  const pickModel = (): number => {
    const draw = random();
    let modelIndex = 0;
    while (modelIndex < modelCount - 1 && cumulativeShares[modelIndex] < draw) modelIndex++;
    return modelIndex;
  };

  const quote = (text: string): string => `"${text}"`;
  const quotedUsers: string[] = [];
  const quota: number[] = [];
  const quotedQuotas: string[] = [];
  const quotedOrganizations: string[] = [];
  const quotedCostCenters: string[] = [];
  const scale: number[] = [];
  const shift: number[] = [];
  const first: number[] = [];
  const last: number[] = [];
  const level: number[] = [];
  const ORGS = ['northwind-platform', 'northwind-data', 'northwind-mobile', 'northwind-web', 'northwind-infra', 'northwind-labs'];
  const COST_CENTERS = ['Platform', 'Analytics', 'Mobile', 'Web', 'Infrastructure', 'Research', 'Security', 'Finance'];
  for (let userIndex = 0; userIndex < USERS; userIndex++) {
    quotedUsers.push(quote(`user-${String(userIndex).padStart(4, '0')}`));
    const seatQuota = random() < 0.7 ? 1900 : 3900;
    quota.push(seatQuota);
    quotedQuotas.push(quote(String(seatQuota)));
    quotedOrganizations.push(quote(ORGS[userIndex % ORGS.length]));
    quotedCostCenters.push(quote(COST_CENTERS[userIndex % COST_CENTERS.length]));
    scale.push(Math.exp((random() - 0.5) * 3.2) * (random() < 0.02 ? 8 : 1));
    shift.push(Math.floor(random() * modelCount));
    level.push(0.4 + 0.6 * random());
    first.push(random() < 0.05 ? 30 + Math.floor(random() * 50) : 0);
    last.push(random() < 0.05 ? 20 + Math.floor(random() * 50) : DAYS - 1);
  }
  const REPOS = Array.from({ length: 80 }, (_, repoIndex) => quote(`repo-${String(repoIndex).padStart(2, '0')}`));
  REPOS.push('""', '""', '""', '""', '""', '""', '""', '""'); // ~10% of the rows have no repository
  const APPS = ['""', '""', '""', '""', '""', '""', '""', quote('Iv1.0a1b2c3d4e5f6a7b'), quote('Iv1.7f6e5d4c3b2a1908')];
  const quotedModels = card.map((entry) => quote(entry.name));
  const quotedAutoModels = card.map((entry) => quote(`Auto: ${entry.name}`));

  const startDay = dayNum(START);
  const quotedDates: string[] = [];
  const weekdayOfDay: number[] = [];
  const monthOfDay: string[] = [];
  for (let dayIndex = 0; dayIndex < DAYS; dayIndex++) {
    quotedDates.push(quote(isoOf(startDay + dayIndex)));
    weekdayOfDay.push((startDay + dayIndex + 3) % 7);
    monthOfDay.push(isoOf(startDay + dayIndex).slice(0, 7));
  }

  // Which users are active on which day, decided first so that the monthly pool is known.
  const active = new Uint8Array(USERS * DAYS);
  let activeDays = 0;
  const monthUsers = new Map<string, Set<number>>();
  for (let dayIndex = 0; dayIndex < DAYS; dayIndex++) {
    const weekday = weekdayOfDay[dayIndex] < 5;
    for (let userIndex = 0; userIndex < USERS; userIndex++) {
      if (dayIndex < first[userIndex] || dayIndex > last[userIndex]) continue;
      if (random() < level[userIndex] * (weekday ? 0.95 : 0.2)) {
        active[dayIndex * USERS + userIndex] = 1;
        activeDays++;
        let set = monthUsers.get(monthOfDay[dayIndex]);
        if (!set) monthUsers.set(monthOfDay[dayIndex], (set = new Set()));
        set.add(userIndex);
      }
    }
  }
  const months: Truth['months'] = {};
  const remaining = new Map<string, number>();
  for (const [month, set] of monthUsers) {
    let cap = 0;
    for (const userIndex of set) cap += quota[userIndex] * 1e6; // credits × $0.01 in 1e-8 USD
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
  const header = `${CSV_HEADER.map(quote).join(',')}`;
  const chunks: string[] = [header];
  let seenActive = 0;

  for (let dayIndex = 0; dayIndex < DAYS; dayIndex++) {
    const lines: string[] = [];
    const month = monthOfDay[dayIndex];
    for (let userIndex = 0; userIndex < USERS; userIndex++) {
      if (!active[dayIndex * USERS + userIndex]) continue;
      seenActive++;
      carry += extra / activeDays;
      let count = perDay + Math.floor(carry);
      carry -= Math.floor(carry);
      if (seenActive === activeDays) count = TARGET_ROWS - emitted;
      usersSeen.add(userIndex);
      for (let k = 0; k < count; k++) {
        const modelIndex = (pickModel() + shift[userIndex]) % modelCount;
        modelsSeen.add(modelIndex);
        const entry = card[modelIndex];
        const long = entry.long !== undefined && random() < 0.004;
        const rowScale = scale[userIndex] * (0.4 + random() * 1.2);
        const inputTokens = Math.round(10_000 * rowScale * (0.5 + random()));
        let cacheRead = Math.round(inputTokens * random() * 5);
        const cacheWrite = entry.base.cacheWrite > 0 ? Math.round(inputTokens * random() * 0.25) : 0;
        const out = Math.round(inputTokens * 0.04 * (0.5 + random()));
        if (long) cacheRead += entry.longThreshold! + Math.round(random() * 200_000);
        const rates = long ? entry.long! : entry.base;
        const isAuto = random() < 0.2;
        const usd = ((inputTokens * rates.input + cacheRead * rates.cachedInput + cacheWrite * rates.cacheWrite + out * rates.output) / 1e6) * (isAuto ? 0.9 : 1);
        const grossUnits = Math.max(1, Math.round(usd * 1e8));
        const left = remaining.get(month)!;
        const discountUnits = Math.min(grossUnits, left);
        remaining.set(month, left - discountUnits);
        const netUnits = grossUnits - discountUnits;
        gross += grossUnits;
        discount += discountUnits;
        net += netUnits;
        months[month].gross += grossUnits;
        months[month].net += netUnits;
        const line = `${quotedDates[dayIndex]},${quotedUsers[userIndex]},"copilot","copilot_ai_credit",${isAuto ? quotedAutoModels[modelIndex] : quotedModels[modelIndex]},"${(grossUnits / 1e6).toFixed(6)}","ai-credits","0.01","${(grossUnits / 1e8).toFixed(8)}","${(discountUnits / 1e8).toFixed(8)}","${(netUnits / 1e8).toFixed(8)}",${quotedQuotas[userIndex]},${quotedOrganizations[userIndex]},${APPS[Math.floor(random() * APPS.length)]},${REPOS[Math.floor(random() * REPOS.length)]},${quotedCostCenters[userIndex]},"0","0","${inputTokens}","${out}","${cacheRead}","${cacheWrite}"`;
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
  let prepared: Prepared;
  let models: ModelTable;
  const settings = mergeSettings({});

  const time = <T>(label: string, task: () => T): T => {
    const startMs = performance.now();
    const out = task();
    timings[label] = Math.round((performance.now() - startMs) * 10) / 10;
    return out;
  };
  const residentMegabytes = (): number => Math.round(process.memoryUsage().rss / 1e6);
  const run = (label: string, filters: Filters): Analysis => time(label, () => analyze({ store, prep: prepared, models, filters, settings }));

  beforeAll(async () => {
    let csv = '';
    const generateStartMs = performance.now();
    ({ csv, truth } = generate());
    timings.generateCsv = Math.round(performance.now() - generateStartMs);
    csvChars = csv.length;
    memory.rssAfterGenerateMB = residentMegabytes();
    const ingestStartMs = performance.now();
    store = await buildStore([{ name: 'perf.csv', data: csv }]);
    timings.buildStore = Math.round(performance.now() - ingestStartMs);
    memory.rssAfterIngestMB = residentMegabytes();
    prepared = time('prepareStore', () => prepareStore(store));
    models = time('buildModelTable', () => buildModelTable(store, settings.modelOverrides));
    memory.rssAfterPrepareMB = residentMegabytes();
  }, 600_000);

  afterAll(() => {
    memory.rssEndMB = residentMegabytes();
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
    const file = store.files[0];
    expect(file).toMatchObject({
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
    expect(store.dicts.user.values.filter((user) => user !== '')).toHaveLength(truth.users);
    expect(store.dicts.model.values.filter((model) => model !== '')).toHaveLength(truth.models);
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
    for (const analysis of [cold, warm]) {
      expect(analysis.agg.totals.rows).toBe(TARGET_ROWS);
      expect(analysis.agg.totals.gross).toBeCloseTo(truth.gross / 1e8, 2);
      expect(analysis.agg.totals.net).toBeCloseTo(truth.net / 1e8, 2);
      expect(analysis.agg.totals.users).toBe(truth.users);
      expect(analysis.pool.months.map((month) => month.key)).toEqual(['2026-07', '2026-08', '2026-09']);
      expect(analysis.users.profiles).toHaveLength(truth.users);
      expect(analysisTexts(analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
    }
    expect(warm.agg.totals).toEqual(cold.agg.totals);
    expect(warm.recs.map((recommendation) => recommendation.id)).toEqual(cold.recs.map((recommendation) => recommendation.id));
    expect(warm.pool.months.map((month) => month.capacity)).toEqual(cold.pool.months.map((month) => month.capacity));
  });

  it('the monthly pools and billed amounts match what the generator drew', () => {
    const analysis = run('analyze:all:again', emptyFilters());
    for (const month of analysis.pool.months) {
      const expectedMonth = truth.months[month.key];
      expect(month.capacity, month.key).toBeCloseTo(expectedMonth.capacity / 1e8, 2);
      expect(month.gross, month.key).toBeCloseTo(expectedMonth.gross / 1e8, 2);
      expect(month.net, month.key).toBeCloseTo(expectedMonth.net / 1e8, 2);
    }
  });

  const last30 = (): number => store.maxDay - 29;
  const modelNames = (modelCount: number): string[] => store.dicts.model.values.filter((model) => model !== '').slice(0, modelCount);
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
      const filters = make();
      const analysis = run(`analyze:${name}`, filters);
      expect(timings[`analyze:${name}`]).toBeLessThan(3_000);
      expect(analysis.narrowed || name === 'dateRange').toBe(true);
      expect(analysis.agg.totals.rows).toBeGreaterThan(0);
      expect(analysis.agg.totals.rows).toBeLessThanOrEqual(TARGET_ROWS);
      expect(analysisTexts(analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
    });
  }

  it('a date filter keeps exactly the rows of the window, which a plain loop confirms', () => {
    const from = last30();
    let rows = 0;
    for (let i = 0; i < store.n; i++) if (store.day[i] >= from) rows++;
    const analysis = run('analyze:dateRange:check', { ...emptyFilters(), dateFrom: from });
    expect(analysis.agg.totals.rows).toBe(rows);
    expect(analysis.previous).not.toBeNull();
  });

  it('counts every option of every filter in under 2 s each', { timeout: 120_000 }, () => {
    const filters: Filters = { ...emptyFilters(), models: modelNames(3), dateFrom: last30() };
    const wanted = new Set(filters.models.map((model) => store.dicts.model.values.indexOf(model)));
    let withOthers = 0;
    let withoutModels = 0;
    for (let i = 0; i < store.n; i++) {
      if (store.day[i] < filters.dateFrom!) continue;
      withoutModels++;
      if (wanted.has(store.model[i])) withOthers++;
    }
    let total = 0;
    for (const key of FACET_KEYS) {
      const counts = time(`facetCounts:${key}`, () => facetCounts(store, prepared, models, filters, key));
      total += timings[`facetCounts:${key}`];
      expect(timings[`facetCounts:${key}`], key).toBeLessThan(2_000);
      const rows = counts.rows.reduce((a, b) => a + b, 0);
      // The facet ignores its own filter and applies all the others.
      expect(rows, key).toBe(key === 'models' ? withoutModels : withOthers);
    }
    timings['facetCounts:total'] = Math.round(total * 10) / 10;
    expect(total).toBeLessThan(10_000);
    const plain = time('facetCounts:models:noFilters', () => facetCounts(store, prepared, models, emptyFilters(), 'models'));
    expect(plain.rows.reduce((a, b) => a + b, 0)).toBe(TARGET_ROWS);
  });
});
