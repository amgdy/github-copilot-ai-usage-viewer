import { vi } from 'vitest';
import { analyze, type Analysis } from '../src/lib/analytics/analyze';
import { emptyFilters, type Filters } from '../src/lib/analytics/filters';
import { prepareStore, type Prepared } from '../src/lib/analytics/prepare';
import { mergeSettings, type Settings } from '../src/lib/analytics/settings';
import { buildStore, type TextSource } from '../src/lib/csv/ingest';
import { generateDemo, type DemoOptions, type DemoResult } from '../src/lib/demo/generate';
import { buildModelTable, type ModelTable } from '../src/lib/pricing/models';
import type { DataStore } from '../src/lib/types';

// When other processes build or test on the same machine, every worker can freeze for several seconds; the
// default 5 s limit would then fail fast tests that merely waited for their turn. Real slowness is still
// caught by the explicit timing assertions (demo, analyze, perf).
vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

export interface Pipeline {
  store: DataStore;
  prep: Prepared;
  models: ModelTable;
  settings: Settings;
  filters: Filters;
  /** Runs the analysis again; the filters and settings default to the ones the pipeline was created with. */
  run(f?: Filters, s?: Settings): Analysis;
  analysis: Analysis;
}

/** Runs prepare + model table + analyze on an already ingested store. */
export function pipelineOf(
  store: DataStore,
  opts: { filters?: Partial<Filters>; settings?: Partial<Settings> } = {},
): Pipeline {
  const prep = prepareStore(store);
  const settings = mergeSettings(opts.settings ?? {});
  const models = buildModelTable(store, settings.modelOverrides);
  const filters = { ...emptyFilters(), ...opts.filters };
  const run = (f: Filters = filters, s: Settings = settings): Analysis => analyze({ store, prep, models, filters: f, settings: s });
  return { store, prep, models, settings, filters, run, analysis: run() };
}

/** Pipeline over in-memory CSV sources (for synthetic data). */
export async function analyzeSources(
  sources: TextSource[],
  opts: { filters?: Partial<Filters>; settings?: Partial<Settings>; dedupe?: boolean } = {},
): Promise<Pipeline> {
  const store = await buildStore(sources, { dedupe: opts.dedupe });
  return pipelineOf(store, opts);
}

export const analyzeCsv = (
  csv: string,
  opts: { filters?: Partial<Filters>; settings?: Partial<Settings> } = {},
): Promise<Pipeline> => analyzeSources([{ name: 'synthetic.csv', data: csv }], opts);

const demoCache = new Map<string, Promise<{ demo: DemoResult; store: DataStore }>>();

/** The synthetic demo dataset, ingested once per test file and shared (stores are read-only). */
export function loadDemo(opts: DemoOptions = {}): Promise<{ demo: DemoResult; store: DataStore }> {
  const key = JSON.stringify(opts);
  let p = demoCache.get(key);
  if (!p) {
    const demo = generateDemo(opts);
    p = buildStore([{ name: 'demo.csv', data: demo.csv }]).then((store) => ({ demo, store }));
    demoCache.set(key, p);
  }
  return p;
}

export async function analyzeDemo(
  opts: { demo?: DemoOptions; filters?: Partial<Filters>; settings?: Partial<Settings> } = {},
): Promise<Pipeline & { demo: DemoResult }> {
  const { demo, store } = await loadDemo(opts.demo);
  return { demo, ...pipelineOf(store, opts) };
}

/** Independent, naive parser for the (fully quoted) sample files. */
export function naiveRows(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  const split = (l: string) => [...l.matchAll(/"((?:[^"]|"")*)"|([^,]+)|(?<=,)(?=,)/g)].map((m) => m[1] ?? m[2] ?? '');
  const head = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    const o: Record<string, string> = {};
    head.forEach((h, i) => (o[h] = cells[i] ?? ''));
    return o;
  });
}

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

export type NaiveRow = Record<string, string>;

/** Days since 1970-01-01 (UTC) for an ISO date, computed without the library under test. */
export const dayNum = (iso: string): number => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};
export const isoOf = (day: number): string => new Date(day * 86_400_000).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number): string => isoOf(dayNum(iso) + n);
/** Monday = 0 … Sunday = 6. */
export const weekdayOf = (iso: string): number => (new Date(`${iso.slice(0, 10)}T00:00:00Z`).getUTCDay() + 6) % 7;
export const numOf = (r: NaiveRow, k: string): number => Number(r[k] || 0);
export const isAutoRow = (r: NaiveRow): boolean => /^auto(\s*[:：\-–—]|$)/i.test(r.model.trim());
export const modelOfRow = (r: NaiveRow): string => r.model.trim().replace(/^auto\s*[:：\-–—]\s*/i, '');

export function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return m;
}

/** Totals of the rows of a CSV, recomputed from the raw text. */
export function naiveTotals(rows: NaiveRow[]) {
  return {
    rows: rows.length,
    gross: sum(rows.map((r) => numOf(r, 'gross_amount'))),
    discount: sum(rows.map((r) => numOf(r, 'discount_amount'))),
    net: sum(rows.map((r) => numOf(r, 'net_amount'))),
    credits: sum(rows.map((r) => numOf(r, 'quantity'))),
    users: new Set(rows.map((r) => r.username).filter(Boolean)).size,
  };
}

export const CSV_HEADER = [
  'date', 'username', 'product', 'sku', 'model', 'quantity', 'unit_type', 'applied_cost_per_quantity', 'gross_amount', 'discount_amount', 'net_amount',
  'total_monthly_quota', 'organization', 'app_client_id', 'repository', 'cost_center_name', 'aic_quantity', 'aic_gross_amount', 'input', 'output', 'cache_read', 'cache_write',
] as const;

export interface RowSpec {
  date: string;
  user?: string;
  product?: string;
  sku?: string;
  model?: string;
  /** Gross USD (quantity = gross / 0.01 credits). */
  gross: number;
  /** Explicit billing split. Without it the row is fully covered, or drawn from the simulated pool. */
  discount?: number;
  net?: number;
  /** Monthly quota in credits; defaults to 1900 for named users and 0 for repo-level rows. */
  quota?: number;
  org?: string;
  app?: string;
  repo?: string;
  costCenter?: string;
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface MakeCsvOptions {
  /** Drain one pool per calendar month (the sum of the quotas of the users seen that month) in date order. */
  pool?: boolean;
  bom?: boolean;
  /** Only emit these columns (header order is kept). */
  columns?: readonly string[];
}

const round9 = (x: number): number => Math.round(x * 1e9) / 1e9;
const cell = (x: number): string => String(Number(x.toFixed(9)));
const quote = (s: string): string => `"${s.replace(/"/g, '""')}"`;

/** Builds a fully quoted usage CSV in the GitHub export format from row specs. */
export function makeCsv(specs: RowSpec[], opts: MakeCsvOptions = {}): string {
  const rows = specs.map((s, seq) => ({ s, seq }));
  rows.sort((a, b) => (a.s.date < b.s.date ? -1 : a.s.date > b.s.date ? 1 : a.seq - b.seq));
  const remaining = new Map<string, number>();
  if (opts.pool) {
    const seen = new Set<string>();
    for (const { s } of rows) {
      if (!s.user) continue;
      const month = s.date.slice(0, 7);
      const key = `${month}|${s.user}`;
      if (seen.has(key)) continue;
      seen.add(key);
      remaining.set(month, (remaining.get(month) ?? 0) + (s.quota ?? 1900) * 0.01);
    }
  }
  const columns = opts.columns;
  const header = columns ? CSV_HEADER.filter((c) => columns.includes(c)) : [...CSV_HEADER];
  const lines = [header.map(quote).join(',')];
  for (const { s } of rows) {
    const gross = round9(s.gross);
    let discount: number;
    let net: number;
    if (s.discount !== undefined || s.net !== undefined) {
      discount = s.discount ?? round9(gross - (s.net ?? 0));
      net = s.net ?? round9(gross - discount);
    } else if (opts.pool) {
      const month = s.date.slice(0, 7);
      const left = remaining.get(month) ?? 0;
      discount = round9(Math.min(gross, left));
      remaining.set(month, left - discount);
      net = round9(gross - discount);
    } else {
      discount = gross;
      net = 0;
    }
    const values: Record<string, string> = {
      date: s.date,
      username: s.user ?? '',
      product: s.product ?? 'copilot',
      sku: s.sku ?? 'copilot_ai_credit',
      model: s.model ?? 'GPT-5.6 Terra',
      quantity: cell(round9(gross / 0.01)),
      unit_type: 'ai-credits',
      applied_cost_per_quantity: '0.01',
      gross_amount: cell(gross),
      discount_amount: cell(discount),
      net_amount: cell(net),
      total_monthly_quota: String(s.quota ?? (s.user ? 1900 : 0)),
      organization: s.org ?? 'acme',
      app_client_id: s.app ?? '',
      repository: s.repo ?? '',
      cost_center_name: s.costCenter ?? '',
      aic_quantity: '0',
      aic_gross_amount: '0',
      input: String(s.input ?? 0),
      output: String(s.output ?? 0),
      cache_read: String(s.cacheRead ?? 0),
      cache_write: String(s.cacheWrite ?? 0),
    };
    lines.push(header.map((c) => quote(values[c])).join(','));
  }
  return `${opts.bom === false ? '' : '\uFEFF'}${lines.join('\n')}\n`;
}

/** Text that must never leak into anything a user reads. */
export const BAD_TEXT = /NaN|undefined|Infinity|\[object/;

/** Small deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every user-facing string of an analysis (headline and recommendations). */
export function analysisTexts(a: Analysis): string[] {
  const out = [a.headline.title, a.headline.detail];
  for (const r of a.recs) {
    out.push(r.title, r.summary, ...r.evidence, ...r.actions);
    if (r.caveat) out.push(r.caveat);
    for (const d of r.docs ?? []) out.push(d.label, d.url);
    if (r.jump) out.push(r.jump.label);
  }
  return out;
}
