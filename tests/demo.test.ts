import { beforeAll, describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/analytics/analyze';
import { emptyFilters } from '../src/lib/analytics/filters';
import { prepareStore } from '../src/lib/analytics/prepare';
import { mergeSettings } from '../src/lib/analytics/settings';
import { buildStore } from '../src/lib/csv/ingest';
import { DEMO_FILE_NAME, generateDemo, type DemoResult } from '../src/lib/demo/generate';
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

const CARD = new Map<string, CardEntry>(PRICE_CARD.map((c) => [c.name, c]));
const SKU_OF: Record<string, string> = { copilot: 'copilot_ai_credit', ghas: 'code_security_ai_credit', code_quality: 'code_quality_ai_credit' };
const REPO_LEVEL = new Set(['ghas', 'code_quality']);

type Rates = CardEntry['base'];
const listCost = (rate: Rates, r: NaiveRow): number =>
  (numOf(r, 'input') * rate.input + numOf(r, 'cache_read') * rate.cachedInput + numOf(r, 'cache_write') * rate.cacheWrite + numOf(r, 'output') * rate.output) / 1e6;

/** Checks every rule the generator promises, straight from the raw CSV rows. Returns a readable list of violations. */
function violations(rows: NaiveRow[], start: string, end: string): string[] {
  const bad: string[] = [];
  const quotaOf = new Map<string, number>();
  const months = new Map<string, { seen: Map<string, number>; gross: number; discount: number; net: number; billed: boolean }>();
  let previous = '';
  rows.forEach((r, i) => {
    const tag = `line ${i + 2}`;
    const gross = numOf(r, 'gross_amount');
    const discount = numOf(r, 'discount_amount');
    const net = numOf(r, 'net_amount');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) bad.push(`${tag}: bad date ${r.date}`);
    if (r.date < previous) bad.push(`${tag}: rows are not in date order`);
    previous = r.date;
    if (r.date < start || r.date > end) bad.push(`${tag}: ${r.date} is outside ${start}..${end}`);
    if (SKU_OF[r.product] !== r.sku) bad.push(`${tag}: product ${r.product} with sku ${r.sku}`);
    if (r.unit_type !== 'ai-credits' || r.applied_cost_per_quantity !== '0.01') bad.push(`${tag}: unit ${r.unit_type} price ${r.applied_cost_per_quantity}`);
    if (Math.abs(numOf(r, 'quantity') * 0.01 - gross) > 1e-8) bad.push(`${tag}: gross ${gross} is not quantity x 0.01`);
    if (Math.abs(gross - (discount + net)) > 1e-8) bad.push(`${tag}: gross ${gross} != discount ${discount} + net ${net}`);
    if (!(gross > 0) || discount < 0 || net < 0) bad.push(`${tag}: non-positive gross or negative split`);

    const named = r.username !== '';
    if (named !== !REPO_LEVEL.has(r.product)) bad.push(`${tag}: user "${r.username}" with product ${r.product}`);
    if (named) {
      const quota = numOf(r, 'total_monthly_quota');
      if (quota !== 1900 && quota !== 3900) bad.push(`${tag}: quota ${quota}`);
      if (quotaOf.has(r.username) && quotaOf.get(r.username) !== quota) bad.push(`${tag}: ${r.username} has two different quotas`);
      quotaOf.set(r.username, quota);
      if (r.repository !== '' || r.organization === '') bad.push(`${tag}: named row with repository "${r.repository}" and org "${r.organization}"`);
    } else if (r.total_monthly_quota !== '0' || r.repository === '') {
      bad.push(`${tag}: repo-level row with quota ${r.total_monthly_quota} and repository "${r.repository}"`);
    }

    const card = CARD.get(modelOfRow(r));
    if (!card) bad.push(`${tag}: model ${r.model} is not in the price card`);
    for (const k of ['input', 'output', 'cache_read', 'cache_write']) {
      const v = numOf(r, k);
      if (!Number.isInteger(v) || v < 0) bad.push(`${tag}: ${k} = ${r[k]}`);
    }
    if (card) {
      // The billed amount is the list price of the tokens, blended with the long-context rate for a share of the request.
      // Auto model selection bills 10% less than that list price.
      const factor = r.model.startsWith('Auto') ? 0.9 : 1;
      const costs = [listCost(card.base, r), ...(card.long ? [listCost(card.long, r)] : [])].map((c) => c * factor);
      if (gross < Math.min(...costs) - 1e-6 || gross > Math.max(...costs) + 1e-6) bad.push(`${tag}: gross ${gross} is outside the list price ${costs.join(' .. ')}`);
    }

    const key = r.date.slice(0, 7);
    let m = months.get(key);
    if (!m) months.set(key, (m = { seen: new Map(), gross: 0, discount: 0, net: 0, billed: false }));
    if (named && !m.seen.has(r.username)) m.seen.set(r.username, numOf(r, 'total_monthly_quota') * 0.01);
    if (m.billed && discount > 1e-8) bad.push(`${tag}: discounted after the ${key} pool was exhausted`);
    if (net > 1e-8) m.billed = true;
    m.gross += gross;
    m.discount += discount;
    m.net += net;
  });
  for (const [key, m] of months) {
    const capacity = sum([...m.seen.values()]);
    if (Math.abs(m.discount - Math.min(m.gross, capacity)) > 1e-5) bad.push(`${key}: discount ${m.discount} != min(gross ${m.gross}, pool ${capacity})`);
    if (Math.abs(m.net - Math.max(0, m.gross - capacity)) > 1e-5) bad.push(`${key}: net ${m.net} != gross ${m.gross} - pool ${capacity}`);
  }
  return bad;
}

const namedUsers = (rows: NaiveRow[]): Set<string> => new Set(rows.map((r) => r.username).filter(Boolean));

describe('generateDemo: determinism and options', () => {
  it('is byte-identical for the same options and differs for another seed', () => {
    const a = generateDemo();
    const b = generateDemo();
    expect(a.csv === b.csv).toBe(true);
    expect({ ...a, csv: '' }).toEqual({ ...b, csv: '' });
    expect(generateDemo({ seed: 7 }).csv === generateDemo({ seed: 7 }).csv).toBe(true);
    expect(generateDemo({ seed: 7 }).csv === a.csv).toBe(false);
    expect(generateDemo({ seed: 8 }).csv === generateDemo({ seed: 7 }).csv).toBe(false);
  });

  it('uses seed 20261026 and the range 2026-09-01 .. 2026-10-26 by default', () => {
    const a = generateDemo();
    expect(a.csv === generateDemo({ seed: 20261026, start: '2026-09-01', end: '2026-10-26' }).csv).toBe(true);
    expect(a.start).toBe('2026-09-01');
    expect(a.end).toBe('2026-10-26');
  });

  it('keeps no state between calls', () => {
    const first = generateDemo().csv;
    generateDemo({ seed: 99, start: '2027-01-04', end: '2027-02-02' });
    expect(generateDemo().csv === first).toBe(true);
  });

  it('honours the date range, including a leap day and a month boundary', () => {
    const leap = generateDemo({ start: '2028-02-27', end: '2028-03-02' });
    expect(leap).toMatchObject({ start: '2028-02-27', end: '2028-03-02' });
    const dates = [...new Set(naiveRows(leap.csv).map((r) => r.date))];
    expect(dates).toEqual(['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02']);

    const one = generateDemo({ start: '2026-09-15', end: '2026-09-15' });
    expect(new Set(naiveRows(one.csv).map((r) => r.date))).toEqual(new Set(['2026-09-15']));
    expect(one.rows).toBeGreaterThan(0);
  });

  it('writes only a header for a reversed range', () => {
    const d = generateDemo({ start: '2026-10-26', end: '2026-09-01' });
    expect(d.rows).toBe(0);
    expect(d.users).toBe(0);
    expect(d.csv.replace(/^\uFEFF/, '').trim().split('\n')).toHaveLength(1);
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
    expect(lines[0]).toBe(CSV_HEADER.map((h) => `"${h}"`).join(','));
    expect(lines[lines.length - 1]).toBe('');
    expect(lines.length - 2).toBe(demo.rows);
    expect(rows).toHaveLength(demo.rows);
    const unquoted = lines.slice(0, -1).filter((l) => !/^"(?:[^"]|"")*"(?:,"(?:[^"]|"")*")*$/.test(l));
    expect(unquoted).toEqual([]);
    const wrongWidth = rows.filter((r) => Object.keys(r).length !== CSV_HEADER.length);
    expect(wrongWidth).toEqual([]);
  });

  it('reports the number of rows and of users that really are in the file', () => {
    expect(demo.rows).toBe(1952);
    expect(demo.users).toBe(namedUsers(rows).size);
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

  it('draws one pool per calendar month: September is exhausted, October is not yet', () => {
    const byMonth = (m: string) => rows.filter((r) => r.date.startsWith(m));
    const sep = byMonth('2026-09');
    const oct = byMonth('2026-10');
    expect(sep.length + oct.length).toBe(rows.length);
    expect(sum(sep.map((r) => numOf(r, 'net_amount')))).toBeGreaterThan(0);
    expect(sum(oct.map((r) => numOf(r, 'net_amount')))).toBe(0);
    // The pool restarts on the 1st: the first October rows are covered although September ended billed.
    expect(oct.slice(0, 20).every((r) => numOf(r, 'discount_amount') === numOf(r, 'gross_amount'))).toBe(true);
    expect(sum(oct.map((r) => numOf(r, 'discount_amount')))).toBeCloseTo(sum(oct.map((r) => numOf(r, 'gross_amount'))), 6);
  });

  it('mixes the plans, the products, Auto and explicit model choices, and several organisations', () => {
    const quotas = new Set(rows.filter((r) => r.username).map((r) => r.total_monthly_quota));
    expect([...quotas].sort()).toEqual(['1900', '3900']);
    expect(new Set(rows.map((r) => r.product))).toEqual(new Set(['copilot', 'ghas', 'code_quality']));
    const auto = rows.filter((r) => r.model.startsWith('Auto: '));
    expect(auto.length).toBeGreaterThan(0);
    expect(auto.length).toBeLessThan(rows.length);
    expect(new Set(rows.map(modelOfRow)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(rows.map((r) => r.organization)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(rows.filter((r) => r.username).map((r) => r.cost_center_name).filter(Boolean)).size).toBeGreaterThanOrEqual(3);
  });

  it('includes long-context requests, which cost more than the base rate', () => {
    const premium = rows.filter((r) => {
      const card = CARD.get(modelOfRow(r));
      return card?.long && numOf(r, 'gross_amount') > listCost(card.base, r) + 1e-6;
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
    const f = store.files[0];
    expect(f).toMatchObject({
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

  it('covers September and October 2026 and nothing else', () => {
    const dates = rows.map((r) => r.date).sort();
    expect(store.minDay).toBe(dayNum(dates[0]));
    expect(store.maxDay).toBe(dayNum(dates[dates.length - 1]));
    expect(isoOf(store.minDay) >= demo.start && isoOf(store.maxDay) <= demo.end).toBe(true);
    expect(new Set(dates.map((d) => d.slice(0, 7)))).toEqual(new Set(['2026-09', '2026-10']));
  });

  it('keeps the totals of the CSV', () => {
    const t = (a: Float64Array) => sum([...a]);
    expect(t(store.gross)).toBeCloseTo(sum(rows.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(t(store.discount)).toBeCloseTo(sum(rows.map((r) => numOf(r, 'discount_amount'))), 6);
    expect(t(store.net)).toBeCloseTo(sum(rows.map((r) => numOf(r, 'net_amount'))), 6);
    expect(t(store.qty)).toBeCloseTo(sum(rows.map((r) => numOf(r, 'quantity'))), 4);
  });

  it('has as many named users as the generator reports, and every one of the 60 planned seats', () => {
    const inStore = store.dicts.user.values.filter((u) => u !== '');
    expect(inStore.length).toBe(demo.users);
    expect(new Set(inStore)).toEqual(namedUsers(rows));
    expect(demo.users).toBe(60);
  });

  it('gives every planned seat a row for any seed, so the landing page can promise 60 users', () => {
    for (const seed of [1, 2, 3, 7, 99]) expect(generateDemo({ seed }).users, `seed ${seed}`).toBe(60);
  });
});

describe('demo analysis', () => {
  let p: Pipeline & { demo: DemoResult };
  beforeAll(async () => {
    p = await analyzeDemo();
  });

  it('reconciles with the file', () => {
    const rows = naiveRows(p.demo.csv);
    const { agg } = p.analysis;
    expect(agg.totals.rows).toBe(p.demo.rows);
    expect(agg.totals.gross).toBeCloseTo(sum(rows.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(agg.totals.discount).toBeCloseTo(sum(rows.map((r) => numOf(r, 'discount_amount'))), 6);
    expect(agg.totals.net).toBeCloseTo(sum(rows.map((r) => numOf(r, 'net_amount'))), 6);
    expect(agg.totals.gross).toBeCloseTo(agg.totals.discount + agg.totals.net, 6);
    expect(p.analysis.users.profiles).toHaveLength(p.demo.users);
    expect(p.analysis.coverage).toMatchObject({ billing: true, quota: true, users: true, models: true, tokens: true });
  });

  it('has two billing months: September complete and exhausted, October partial and projected to run out', () => {
    const { pool } = p.analysis;
    expect(pool.months.map((m) => m.key)).toEqual(['2026-09', '2026-10']);
    const [sep, oct] = pool.months;
    expect(sep.complete).toBe(true);
    expect(sep.net).toBeGreaterThan(0);
    expect(sep.exhaustedOn).not.toBeNull();
    expect(isoOf(sep.exhaustedOn!).slice(0, 7)).toBe('2026-09');
    expect(oct.complete).toBe(false);
    expect(oct.net).toBeCloseTo(0, 6);
    expect(oct.exhaustedOn).toBeNull();
    const proj = oct.projection!;
    expect(proj).not.toBeNull();
    expect(proj.exhaustionDate).not.toBeNull();
    expect(proj.exhaustionDate!).toBeGreaterThan(proj.asOf);
    expect(proj.exhaustionDate!).toBeLessThanOrEqual(oct.monthEnd);
    expect(proj.projNet).toBeGreaterThan(oct.net);
    expect(pool.capacityExceeded).toBe(false);
    expect(pool.monthsExhausted).toBe(1);
    expect(pool.billed).toBeCloseTo(p.analysis.agg.totals.net, 6);
  });

  it('sees the first billed day of September as the day the pool ran out (independent check)', () => {
    const rows = naiveRows(p.demo.csv).filter((r) => r.date.startsWith('2026-09'));
    const daily = new Map<string, number>();
    for (const r of rows) daily.set(r.date, (daily.get(r.date) ?? 0) + numOf(r, 'net_amount'));
    const first = [...daily.entries()].filter(([, n]) => n > 1e-6).map(([d]) => d).sort()[0];
    expect(isoOf(p.analysis.pool.months[0].exhaustedOn!)).toBe(first);
  });

  it('is quick: an analysis of the whole demo takes well under half a second', () => {
    // Best of several runs: a stalled machine slows some runs, a slow implementation slows all of them.
    const own: number[] = [];
    const wall: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      own.push(p.run().ms);
      wall.push(performance.now() - t0);
    }
    expect(Math.min(...own)).toBeLessThan(500);
    expect(Math.min(...wall)).toBeLessThan(500);
  });

  it('is quick to generate, ingest and prepare', async () => {
    const wall: number[] = [];
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      const d = generateDemo();
      const store = await buildStore([{ name: DEMO_FILE_NAME, data: d.csv }]);
      const prep = prepareStore(store);
      const models = buildModelTable(store, {});
      const a = analyze({ store, prep, models, filters: emptyFilters(), settings: mergeSettings({}) });
      wall.push(performance.now() - t0);
      expect(a.agg.totals.rows).toBe(d.rows);
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

  for (const [name, opts] of CASES) {
    it(`${name}: valid rows, a clean ingest and an analysis without bad text`, async () => {
      const demo = generateDemo(opts);
      const rows = naiveRows(demo.csv);
      expect(violations(rows, demo.start, demo.end)).toEqual([]);
      expect(demo.users).toBe(namedUsers(rows).size);
      const p = await analyzeSources([{ name: 'demo.csv', data: demo.csv }]);
      expect(p.store.files[0]).toMatchObject({
        rowsRead: demo.rows,
        rowsKept: demo.rows,
        priceMismatchRows: 0,
        balanceMismatchRows: 0,
        badNumberCells: 0,
        duplicatesDropped: 0,
        badDateRows: 0,
        negativeRows: 0,
      });
      const { agg, pool } = p.analysis;
      expect(agg.totals.rows).toBe(demo.rows);
      expect(agg.totals.gross).toBeCloseTo(agg.totals.discount + agg.totals.net, 6);
      expect(pool.months.length).toBe(new Set(rows.map((r) => r.date.slice(0, 7))).size);
      expect(analysisTexts(p.analysis).filter((t) => BAD_TEXT.test(t))).toEqual([]);
    });
  }
});
