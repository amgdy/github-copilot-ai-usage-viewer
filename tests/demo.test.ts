import { beforeAll, describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/analytics/analyze';
import { emptyFilters } from '../src/lib/analytics/filters';
import { prepareStore } from '../src/lib/analytics/prepare';
import { mergeSettings } from '../src/lib/analytics/settings';
import { buildStore } from '../src/lib/csv/ingest';
import { DEMO_FILE_NAME, DEMO_SEAT_COUNT, DEMO_SHORTCODE, generateDemo, type DemoResult } from '../src/lib/demo/generate';
import { PRICE_CARD, type CardEntry } from '../src/lib/pricing/card';
import { buildModelTable } from '../src/lib/pricing/models';
import {
  analysisTexts,
  analyzeDemo,
  analyzeSources,
  BAD_TEXT,
  CSV_HEADER,
  dayNum,
  isoOf,
  loadDemo,
  modelOfRow,
  naiveRows,
  numOf,
  sum,
  type NaiveRow,
  type Pipeline,
} from './helpers';

const CARD = new Map<string, CardEntry>(PRICE_CARD.map((cardEntry) => [cardEntry.name, cardEntry]));
const SKU_OF: Record<string, string> = { copilot: 'copilot_ai_credit', ghas: 'code_security_ai_credit', code_quality: 'code_quality_ai_credit' };
const REPO_LEVEL = new Set(['ghas', 'code_quality']);

type Rates = CardEntry['base'];
const listCost = (rate: Rates, row: NaiveRow): number =>
  (numOf(row, 'input') * rate.input + numOf(row, 'cache_read') * rate.cachedInput + numOf(row, 'cache_write') * rate.cacheWrite + numOf(row, 'output') * rate.output) / 1e6;

/** Checks every rule the generator promises, straight from the raw CSV rows. Returns a readable list of violations. */
function violations(rows: NaiveRow[], start: string, end: string): string[] {
  const bad: string[] = [];
  const quotaOf = new Map<string, number>();
  const months = new Map<string, { seen: Map<string, number>; gross: number; discount: number; net: number; billed: boolean }>();
  let previous = '';
  rows.forEach((row, rowIndex) => {
    const tag = `line ${rowIndex + 2}`;
    const gross = numOf(row, 'gross_amount');
    const discount = numOf(row, 'discount_amount');
    const net = numOf(row, 'net_amount');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) bad.push(`${tag}: bad date ${row.date}`);
    if (row.date < previous) bad.push(`${tag}: rows are not in date order`);
    previous = row.date;
    if (row.date < start || row.date > end) bad.push(`${tag}: ${row.date} is outside ${start}..${end}`);
    if (SKU_OF[row.product] !== row.sku) bad.push(`${tag}: product ${row.product} with sku ${row.sku}`);
    if (row.unit_type !== 'ai-credits' || row.applied_cost_per_quantity !== '0.01') bad.push(`${tag}: unit ${row.unit_type} price ${row.applied_cost_per_quantity}`);
    if (Math.abs(numOf(row, 'quantity') * 0.01 - gross) > 1e-8) bad.push(`${tag}: gross ${gross} is not quantity x 0.01`);
    if (Math.abs(gross - (discount + net)) > 1e-8) bad.push(`${tag}: gross ${gross} != discount ${discount} + net ${net}`);
    if (!(gross > 0) || discount < 0 || net < 0) bad.push(`${tag}: non-positive gross or negative split`);

    const named = row.username !== '';
    if (named !== !REPO_LEVEL.has(row.product)) bad.push(`${tag}: user "${row.username}" with product ${row.product}`);
    if (named) {
      const quota = numOf(row, 'total_monthly_quota');
      if (quota !== 1900 && quota !== 3900) bad.push(`${tag}: quota ${quota}`);
      if (quotaOf.has(row.username) && quotaOf.get(row.username) !== quota) bad.push(`${tag}: ${row.username} has two different quotas`);
      quotaOf.set(row.username, quota);
      if (row.repository !== '' || row.organization === '') bad.push(`${tag}: named row with repository "${row.repository}" and org "${row.organization}"`);
    } else if (row.total_monthly_quota !== '0' || row.repository === '') {
      bad.push(`${tag}: repo-level row with quota ${row.total_monthly_quota} and repository "${row.repository}"`);
    }

    const card = CARD.get(modelOfRow(row));
    if (!card) bad.push(`${tag}: model ${row.model} is not in the price card`);
    for (const tokenColumn of ['input', 'output', 'cache_read', 'cache_write']) {
      const tokenCount = numOf(row, tokenColumn);
      if (!Number.isInteger(tokenCount) || tokenCount < 0) bad.push(`${tag}: ${tokenColumn} = ${row[tokenColumn]}`);
    }
    if (card) {
      // The billed amount is the list price of the tokens, blended with the long-context rate for a share of the request.
      // Auto model selection bills 10% less than that list price.
      const factor = row.model.startsWith('Auto') ? 0.9 : 1;
      const costs = [listCost(card.base, row), ...(card.long ? [listCost(card.long, row)] : [])].map((cost) => cost * factor);
      if (gross < Math.min(...costs) - 1e-6 || gross > Math.max(...costs) + 1e-6) bad.push(`${tag}: gross ${gross} is outside the list price ${costs.join(' .. ')}`);
    }

    const key = row.date.slice(0, 7);
    let month = months.get(key);
    if (!month) months.set(key, (month = { seen: new Map(), gross: 0, discount: 0, net: 0, billed: false }));
    if (named && !month.seen.has(row.username)) month.seen.set(row.username, numOf(row, 'total_monthly_quota') * 0.01);
    if (month.billed && discount > 1e-8) bad.push(`${tag}: discounted after the ${key} pool was exhausted`);
    if (net > 1e-8) month.billed = true;
    month.gross += gross;
    month.discount += discount;
    month.net += net;
  });
  for (const [key, month] of months) {
    const capacity = sum([...month.seen.values()]);
    if (Math.abs(month.discount - Math.min(month.gross, capacity)) > 1e-5) bad.push(`${key}: discount ${month.discount} != min(gross ${month.gross}, pool ${capacity})`);
    if (Math.abs(month.net - Math.max(0, month.gross - capacity)) > 1e-5) bad.push(`${key}: net ${month.net} != gross ${month.gross} - pool ${capacity}`);
  }
  return bad;
}

const namedUsers = (rows: NaiveRow[]): Set<string> => new Set(rows.map((row) => row.username).filter(Boolean));

describe('generateDemo: determinism and options', () => {
  it('is byte-identical for the same options and differs for another seed', () => {
    const firstDemo = generateDemo();
    const secondDemo = generateDemo();
    expect(firstDemo.csv === secondDemo.csv).toBe(true);
    expect({ ...firstDemo, csv: '' }).toEqual({ ...secondDemo, csv: '' });
    expect(generateDemo({ seed: 7 }).csv === generateDemo({ seed: 7 }).csv).toBe(true);
    expect(generateDemo({ seed: 7 }).csv === firstDemo.csv).toBe(false);
    expect(generateDemo({ seed: 8 }).csv === generateDemo({ seed: 7 }).csv).toBe(false);
  });

  it('uses seed 20261026 and the range 2026-08-01 .. 2026-10-26 by default', () => {
    const defaultDemo = generateDemo();
    expect(defaultDemo.csv === generateDemo({ seed: 20261026, start: '2026-08-01', end: '2026-10-26' }).csv).toBe(true);
    expect(defaultDemo.start).toBe('2026-08-01');
    expect(defaultDemo.end).toBe('2026-10-26');
  });

  it('keeps no state between calls', () => {
    const first = generateDemo().csv;
    generateDemo({ seed: 99, start: '2027-01-04', end: '2027-02-02' });
    expect(generateDemo().csv === first).toBe(true);
  });

  it('honours the date range, including a leap day and a month boundary', () => {
    const leap = generateDemo({ start: '2028-02-27', end: '2028-03-02' });
    expect(leap).toMatchObject({ start: '2028-02-27', end: '2028-03-02' });
    const dates = [...new Set(naiveRows(leap.csv).map((row) => row.date))];
    expect(dates).toEqual(['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02']);

    const one = generateDemo({ start: '2026-09-15', end: '2026-09-15' });
    expect(new Set(naiveRows(one.csv).map((row) => row.date))).toEqual(new Set(['2026-09-15']));
    expect(one.rows).toBeGreaterThan(0);
  });

  it('writes only a header for a reversed range', () => {
    const reversed = generateDemo({ start: '2026-10-26', end: '2026-09-01' });
    expect(reversed.rows).toBe(0);
    expect(reversed.users).toBe(0);
    expect(reversed.csv.replace(/^\uFEFF/, '').trim().split('\n')).toHaveLength(1);
  });

  it('exposes the file name the app uses for the demo', () => {
    expect(DEMO_FILE_NAME).toMatch(/\.csv$/);
  });
});

describe('demo CSV: format', () => {
  let demo: DemoResult;
  let lines: string[];
  let rows: NaiveRow[];
  beforeAll(() => {
    demo = generateDemo();
    lines = demo.csv.replace(/^\uFEFF/, '').split('\n');
    rows = naiveRows(demo.csv);
  });

  it('starts with a byte-order mark and ends with a newline', () => {
    expect(demo.csv.charCodeAt(0)).toBe(0xfeff);
    expect(demo.csv.endsWith('\n')).toBe(true);
    expect(demo.csv.endsWith('\n\n')).toBe(false);
    expect(demo.csv.includes('\r')).toBe(false);
  });

  it('has the 22 report columns in order, every cell quoted, and one line per row', () => {
    expect(lines[0]).toBe(CSV_HEADER.map((column) => `"${column}"`).join(','));
    expect(lines[lines.length - 1]).toBe('');
    expect(lines.length - 2).toBe(demo.rows);
    expect(rows).toHaveLength(demo.rows);
    const unquoted = lines.slice(0, -1).filter((line) => !/^"(?:[^"]|"")*"(?:,"(?:[^"]|"")*")*$/.test(line));
    expect(unquoted).toEqual([]);
    const wrongWidth = rows.filter((row) => Object.keys(row).length !== CSV_HEADER.length);
    expect(wrongWidth).toEqual([]);
  });

  it('reports the number of rows and of users that really are in the file', () => {
    expect(demo.rows).toBe(5770);
    expect(demo.users).toBe(namedUsers(rows).size);
  });

  it('names users like GitHub Enterprise Managed Users: an Entra ID login name, an underscore and the short code', () => {
    expect(DEMO_SHORTCODE).toMatch(/^[a-z]{3,8}$/);
    const pattern = new RegExp(`^[A-Z][a-z]+[A-Z][a-z]+\\d*_${DEMO_SHORTCODE}$`);
    const logins = [...namedUsers(rows)];
    expect(logins.filter((login) => !pattern.test(login))).toEqual([]);
    for (const seed of [1, 42]) {
      const otherLogins = [...namedUsers(naiveRows(generateDemo({ seed }).csv))];
      expect(otherLogins.filter((login) => !pattern.test(login)), `seed ${seed}`).toEqual([]);
    }
  });
});

describe('demo CSV: the generator follows the billing rules', () => {
  let demo: DemoResult;
  let rows: NaiveRow[];
  beforeAll(() => {
    demo = generateDemo();
    rows = naiveRows(demo.csv);
  });

  it('every row is consistent: prices, split, seat size, models, tokens, and the pool drains in date order', () => {
    expect(violations(rows, demo.start, demo.end)).toEqual([]);
  });

  it('draws one pool per calendar month: only September is exhausted', () => {
    const byMonth = (month: string) => rows.filter((row) => row.date.startsWith(month));
    const augustRows = byMonth('2026-08');
    const septemberRows = byMonth('2026-09');
    const octoberRows = byMonth('2026-10');
    expect(augustRows.length + septemberRows.length + octoberRows.length).toBe(rows.length);
    expect(sum(augustRows.map((row) => numOf(row, 'net_amount')))).toBe(0);
    expect(sum(septemberRows.map((row) => numOf(row, 'net_amount')))).toBeGreaterThan(0);
    expect(sum(octoberRows.map((row) => numOf(row, 'net_amount')))).toBe(0);
    // The pool restarts on the 1st: the first October rows are covered although September ended billed.
    expect(octoberRows.slice(0, 20).every((row) => numOf(row, 'discount_amount') === numOf(row, 'gross_amount'))).toBe(true);
    expect(sum(octoberRows.map((row) => numOf(row, 'discount_amount')))).toBeCloseTo(sum(octoberRows.map((row) => numOf(row, 'gross_amount'))), 6);
  });

  it('mixes the plans, the products, Auto and explicit model choices, and several organisations', () => {
    const quotas = new Set(rows.filter((row) => row.username).map((row) => row.total_monthly_quota));
    expect([...quotas].sort()).toEqual(['1900', '3900']);
    expect(new Set(rows.map((row) => row.product))).toEqual(new Set(['copilot', 'ghas', 'code_quality']));
    const auto = rows.filter((row) => row.model.startsWith('Auto: '));
    expect(auto.length).toBeGreaterThan(0);
    expect(auto.length).toBeLessThan(rows.length);
    expect(new Set(rows.map(modelOfRow)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(rows.map((row) => row.organization)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(rows.filter((row) => row.username).map((row) => row.cost_center_name).filter(Boolean)).size).toBeGreaterThanOrEqual(3);
  });

  it('includes long-context requests, which cost more than the base rate', () => {
    const premium = rows.filter((row) => {
      const card = CARD.get(modelOfRow(row));
      return card?.long && numOf(row, 'gross_amount') > listCost(card.base, row) + 1e-6;
    });
    expect(premium.length).toBeGreaterThan(0);
  });
});

describe('demo through the ingest', () => {
  let demo: DemoResult;
  let store: Awaited<ReturnType<typeof loadDemo>>['store'];
  let rows: NaiveRow[];
  beforeAll(async () => {
    ({ demo, store } = await loadDemo());
    rows = naiveRows(demo.csv);
  });

  it('keeps every row and flags nothing', () => {
    expect(store.files).toHaveLength(1);
    const file = store.files[0];
    expect(file).toMatchObject({
      rowsRead: demo.rows,
      rowsKept: demo.rows,
      priceMismatchRows: 0,
      balanceMismatchRows: 0,
      badNumberCells: 0,
      duplicatesDropped: 0,
      badDateRows: 0,
      negativeRows: 0,
      missingColumns: [],
      extraColumns: [],
    });
    expect(store.n).toBe(demo.rows);
    expect(store.hasTokens).toBe(true);
  });

  it('covers August, September and October 2026 and nothing else', () => {
    const dates = rows.map((row) => row.date).sort();
    expect(store.minDay).toBe(dayNum(dates[0]));
    expect(store.maxDay).toBe(dayNum(dates[dates.length - 1]));
    expect(isoOf(store.minDay) >= demo.start && isoOf(store.maxDay) <= demo.end).toBe(true);
    expect(new Set(dates.map((day) => day.slice(0, 7)))).toEqual(new Set(['2026-08', '2026-09', '2026-10']));
  });

  it('keeps the totals of the CSV', () => {
    const columnTotal = (column: Float64Array) => sum([...column]);
    expect(columnTotal(store.gross)).toBeCloseTo(sum(rows.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(columnTotal(store.discount)).toBeCloseTo(sum(rows.map((row) => numOf(row, 'discount_amount'))), 6);
    expect(columnTotal(store.net)).toBeCloseTo(sum(rows.map((row) => numOf(row, 'net_amount'))), 6);
    expect(columnTotal(store.qty)).toBeCloseTo(sum(rows.map((row) => numOf(row, 'quantity'))), 4);
  });

  it('has as many named users as the generator reports, and every planned seat', () => {
    const inStore = store.dicts.user.values.filter((username) => username !== '');
    expect(inStore.length).toBe(demo.users);
    expect(new Set(inStore)).toEqual(namedUsers(rows));
    expect(DEMO_SEAT_COUNT).toBe(140);
    expect(demo.users).toBe(DEMO_SEAT_COUNT);
  });

  it('gives every planned seat a row for any seed, so the landing page can promise 60 users', () => {
    for (const seed of [1, 2, 3, 7, 99]) expect(generateDemo({ seed }).users, `seed ${seed}`).toBe(DEMO_SEAT_COUNT);
  });
});

describe('demo analysis', () => {
  let result: Pipeline & { demo: DemoResult };
  beforeAll(async () => {
    result = await analyzeDemo();
  });

  it('reconciles with the file', () => {
    const rows = naiveRows(result.demo.csv);
    const { agg: aggregates } = result.analysis;
    expect(aggregates.totals.rows).toBe(result.demo.rows);
    expect(aggregates.totals.gross).toBeCloseTo(sum(rows.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(aggregates.totals.discount).toBeCloseTo(sum(rows.map((row) => numOf(row, 'discount_amount'))), 6);
    expect(aggregates.totals.net).toBeCloseTo(sum(rows.map((row) => numOf(row, 'net_amount'))), 6);
    expect(aggregates.totals.gross).toBeCloseTo(aggregates.totals.discount + aggregates.totals.net, 6);
    expect(result.analysis.users.profiles).toHaveLength(result.demo.users);
    expect(result.analysis.coverage).toMatchObject({ billing: true, quota: true, users: true, models: true, tokens: true });
  });

  it('has three billing months: August under-used, September exhausted, October partial and within the pool', () => {
    const { pool } = result.analysis;
    expect(pool.months.map((month) => month.key)).toEqual(['2026-08', '2026-09', '2026-10']);
    const [august, september, october] = pool.months;
    expect(august.complete).toBe(true);
    expect(august.net).toBeCloseTo(0, 6);
    expect(august.exhaustedOn).toBeNull();
    expect(august.gross / august.capacity).toBeLessThan(0.6);
    expect(september.complete).toBe(true);
    expect(september.net).toBeGreaterThan(0);
    expect(september.exhaustedOn).not.toBeNull();
    expect(isoOf(september.exhaustedOn!).slice(0, 7)).toBe('2026-09');
    expect(october.complete).toBe(false);
    expect(october.net).toBeCloseTo(0, 6);
    expect(october.exhaustedOn).toBeNull();
    const projection = october.projection!;
    expect(projection).not.toBeNull();
    expect(projection.exhaustionDate).toBeNull();
    expect(projection.projNet).toBeCloseTo(0, 6);
    expect(projection.projGross).toBeGreaterThan(october.gross);
    expect(projection.projGross).toBeLessThan(october.capacity);
    expect(pool.capacityExceeded).toBe(false);
    expect(pool.monthsExhausted).toBe(1);
    expect(pool.billed).toBeCloseTo(result.analysis.agg.totals.net, 6);
  });

  it('sees the first billed day of September as the day the pool ran out (independent check)', () => {
    const rows = naiveRows(result.demo.csv).filter((row) => row.date.startsWith('2026-09'));
    const daily = new Map<string, number>();
    for (const row of rows) daily.set(row.date, (daily.get(row.date) ?? 0) + numOf(row, 'net_amount'));
    const first = [...daily.entries()].filter(([, net]) => net > 1e-6).map(([day]) => day).sort()[0];
    const september = result.analysis.pool.months.find((month) => month.key === '2026-09')!;
    expect(isoOf(september.exhaustedOn!)).toBe(first);
  });

  it('is quick: an analysis of the whole demo takes well under half a second', () => {
    // Best of several runs: a stalled machine slows some runs, a slow implementation slows all of them.
    const own: number[] = [];
    const wall: number[] = [];
    for (let i = 0; i < 5; i++) {
      const startMs = performance.now();
      own.push(result.run().ms);
      wall.push(performance.now() - startMs);
    }
    expect(Math.min(...own)).toBeLessThan(500);
    expect(Math.min(...wall)).toBeLessThan(500);
  });

  it('is quick to generate, ingest and prepare', async () => {
    const wall: number[] = [];
    for (let i = 0; i < 3; i++) {
      const startMs = performance.now();
      const demo = generateDemo();
      const store = await buildStore([{ name: DEMO_FILE_NAME, data: demo.csv }]);
      const prepared = prepareStore(store);
      const models = buildModelTable(store, {});
      const analysis = analyze({ store, prep: prepared, models, filters: emptyFilters(), settings: mergeSettings({}) });
      wall.push(performance.now() - startMs);
      expect(analysis.agg.totals.rows).toBe(demo.rows);
    }
    expect(Math.min(...wall)).toBeLessThan(2000);
  });
});

describe('the generator is valid for other seeds and ranges', () => {
  const CASES: [string, Parameters<typeof generateDemo>[0]][] = [
    ['seed 1', { seed: 1 }],
    ['seed 2', { seed: 2 }],
    ['seed 42', { seed: 42 }],
    ['seed 777', { seed: 777 }],
    ['three weeks', { seed: 5, start: '2026-09-07', end: '2026-09-27' }],
    ['across a month boundary', { seed: 6, start: '2026-09-28', end: '2026-10-03' }],
    ['a single day', { seed: 7, start: '2026-09-15', end: '2026-09-15' }],
    ['across a leap day', { seed: 8, start: '2028-02-20', end: '2028-03-05' }],
    ['across a year boundary', { seed: 9, start: '2026-12-20', end: '2027-01-12' }],
  ];

  for (const [name, options] of CASES) {
    it(`${name}: valid rows, a clean ingest and an analysis without bad text`, async () => {
      const demo = generateDemo(options);
      const rows = naiveRows(demo.csv);
      expect(violations(rows, demo.start, demo.end)).toEqual([]);
      expect(demo.users).toBe(namedUsers(rows).size);
      const result = await analyzeSources([{ name: 'demo.csv', data: demo.csv }]);
      expect(result.store.files[0]).toMatchObject({
        rowsRead: demo.rows,
        rowsKept: demo.rows,
        priceMismatchRows: 0,
        balanceMismatchRows: 0,
        badNumberCells: 0,
        duplicatesDropped: 0,
        badDateRows: 0,
        negativeRows: 0,
      });
      const { agg: aggregates, pool } = result.analysis;
      expect(aggregates.totals.rows).toBe(demo.rows);
      expect(aggregates.totals.gross).toBeCloseTo(aggregates.totals.discount + aggregates.totals.net, 6);
      expect(pool.months.length).toBe(new Set(rows.map((row) => row.date.slice(0, 7))).size);
      expect(analysisTexts(result.analysis).filter((text) => BAD_TEXT.test(text))).toEqual([]);
    });
  }
});
