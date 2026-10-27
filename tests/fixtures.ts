/**
 * Made-up usage reports for the tests. Every row is generated here from the specs below; nothing is read from disk and
 * no row comes from a real export. Users, organizations and repositories are invented.
 *
 * FIXTURE_A, "pool used up" (org contoso, October 2026, 2026-10-02 to 2026-10-20, 19 rows on 9 days):
 * - Two seats: alex-dev on Enterprise (39 USD of included credits) and sam-lee on Business (19 USD), so the pool is 58 USD.
 * - The pool covers exactly 58 USD and runs out on 2026-10-03; everything alex-dev uses after that is billed.
 * - alex-dev uses more than 3x their allotment (runaway); sam-lee first appears on 2026-10-16, 14 days after the first row (new user).
 * - Almost everything goes through Auto. alex-dev's Auto rows are billed at list price (the Enterprise plan shows no Auto
 *   discount); sam-lee's two Auto GPT-5.3-Codex rows are billed at 90% of list. Every other row is at list price.
 * - Fewer than ten days with spend (no anomalies), no repo-level rows, no long-context rows, nothing to reclaim.
 *
 * FIXTURE_B, "partial export" (org fabrikam, October 2026, 2026-10-01 to 2026-10-26):
 * - One named user, pat-ops on Enterprise (39 USD), plus repo-level rows with a blank user (unattributed).
 * - Everything is covered and nothing is billed, though the covered usage is far above the 39 USD the visible seat funds,
 *   so the size of the pool is unknown.
 * - No Auto rows. Mostly GPT-6 Astra, a Powerful model that GPT-5.6 Terra (same vendor) could replace for much less.
 * - Four long-context rows billed at the long tier; the two on 2026-10-25 alone carry more than 100 USD of premium.
 * - Weekday usage with clear spikes on 2026-10-16 (the biggest, over 20x a typical day), 2026-10-25 and 2026-10-09,
 *   and a drop between the last two weeks because the 2026-10-16 spike falls in the earlier one.
 * - One amount small enough to be written in scientific notation (5e-7).
 */
import type { Filters } from '../src/lib/analytics/filters';
import type { Settings } from '../src/lib/analytics/settings';
import { buildStore, type TextSource } from '../src/lib/csv/ingest';
import type { DataStore } from '../src/lib/types';
import { makeCsv, pipelineOf, type Pipeline, type RowSpec } from './helpers';

export const FIXTURE_A = 'fixture-pool-used.csv';
export const FIXTURE_B = 'fixture-partial-export.csv';

type Rates = readonly [input: number, cacheRead: number, cacheWrite: number, output: number];

/** USD per 1M tokens the fixtures are billed at. They copy the built-in price card, so a row is at list price unless it says otherwise. */
const RATES: Record<string, Rates> = {
  'GPT-5.3-Codex': [1.75, 0.175, 0, 14],
  'GPT-5.6 Terra': [2, 0.2, 2.5, 12],
  'GPT-6 Astra': [10, 1, 12.5, 50],
  'GPT-6 Luna': [0.1, 0.01, 0.125, 0.5],
  'Claude Haiku 4.5': [1, 0.1, 1.25, 5],
  'Claude Opus 5.5': [4, 0.2, 5, 20],
  'Claude Sonnet 5.5': [2, 0.1, 2.5, 10],
};

/** Long-context rates of the card, for requests above 272k prompt tokens. */
const LONG_RATES: Record<string, Rates> = {
  'GPT-5.6 Terra': [4, 0.4, 5, 18],
  'GPT-6 Astra': [20, 2, 25, 75],
};

interface Tokens {
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
}

const round9 = (x: number): number => Number(x.toFixed(9));
const bare = (model: string): string => model.replace(/^Auto: /, '');
const costOf = (r: Rates, t: Tokens): number => (t.input * r[0] + t.cacheRead * r[1] + t.cacheWrite * r[2] + t.output * r[3]) / 1e6;

/** Whole token counts whose list cost is close to `usd`: a quarter input, a quarter cache reads, 15% cache writes and the rest output. */
function mixFor(model: string, usd: number): Tokens {
  const r = RATES[bare(model)];
  const write = r[2] > 0 ? 0.15 : 0;
  const n = (share: number, rate: number): number => (rate > 0 ? Math.round((share * usd * 1e6) / rate) : 0);
  return { input: n(0.4 - write, r[0]), cacheRead: n(0.25, r[1]), cacheWrite: n(write, r[2]), output: n(0.35, r[3]) };
}

/** A row billed at `factor` times the list price of its tokens. */
function priced(date: string, user: string | undefined, model: string, t: Tokens, extra: Partial<RowSpec> = {}, factor = 1): RowSpec {
  return { date, user, model, gross: round9(factor * costOf(RATES[bare(model)], t)), ...t, ...extra };
}

/** A row of about `usd` at list price. */
const at = (date: string, user: string | undefined, model: string, usd: number, extra: Partial<RowSpec> = {}): RowSpec =>
  priced(date, user, model, mixFor(model, usd), extra);

/** A long-context row: more than 272k prompt tokens, billed at the long tier of the model. */
function long(date: string, user: string, model: string, input: number, output: number, cacheRead = 0, extra: Partial<RowSpec> = {}): RowSpec {
  const t: Tokens = { input, cacheRead, cacheWrite: 0, output };
  return { date, user, model, gross: round9(costOf(LONG_RATES[model], t)), ...t, ...extra };
}

// FIXTURE_A ----------------------------------------------------------------------------------------------------------

const A_ORG = { org: 'contoso' };
const ALEX = 'alex-dev';
const SAM = 'sam-lee';
const OPUS = 'Auto: Claude Opus 5.5';
const TERRA = 'Auto: GPT-5.6 Terra';
const CODEX = 'Auto: GPT-5.3-Codex';

const alexRows: RowSpec[] = [
  at('2026-10-02', ALEX, OPUS, 16.83),
  at('2026-10-02', ALEX, TERRA, 13.27),
  at('2026-10-02', ALEX, 'Claude Haiku 4.5', 0.0042),
  at('2026-10-03', ALEX, OPUS, 22.41),
  at('2026-10-03', ALEX, TERRA, 17.96),
  at('2026-10-06', ALEX, OPUS, 7.64),
  at('2026-10-06', ALEX, TERRA, 4.18),
  at('2026-10-08', ALEX, OPUS, 9.92),
  at('2026-10-08', ALEX, TERRA, 5.37),
  at('2026-10-09', ALEX, OPUS, 6.15),
  at('2026-10-09', ALEX, TERRA, 3.84),
  at('2026-10-13', ALEX, OPUS, 8.73),
  at('2026-10-13', ALEX, TERRA, 5.06),
  at('2026-10-15', ALEX, OPUS, 5.48),
  at('2026-10-15', ALEX, TERRA, 3.29),
  at('2026-10-16', ALEX, OPUS, 7.91),
  at('2026-10-20', ALEX, TERRA, 10.57),
].map((r) => ({ ...r, ...A_ORG, quota: 3900 }));

const samRows: RowSpec[] = [
  priced('2026-10-16', SAM, CODEX, mixFor(CODEX, 1.46), {}, 0.9),
  priced('2026-10-20', SAM, CODEX, mixFor(CODEX, 1.27), {}, 0.9),
].map((r) => ({ ...r, ...A_ORG, quota: 1900, discount: r.gross, net: 0 }));

/** The pool (58 USD) covers sam-lee's rows and then alex-dev's rows in date order until it is used up. */
function drainPool(rows: RowSpec[], pool: number): RowSpec[] {
  let left = pool;
  return rows.map((r) => {
    const discount = round9(Math.min(r.gross, Math.max(0, left)));
    left -= discount;
    return { ...r, discount, net: round9(r.gross - discount) };
  });
}

export const FIXTURE_A_ROWS: RowSpec[] = [...drainPool(alexRows, 58 - samRows.reduce((a, r) => a + r.gross, 0)), ...samRows];

// FIXTURE_B ----------------------------------------------------------------------------------------------------------

const B_ORG = { org: 'fabrikam' };
const PAT = 'pat-ops';
const SONNET = 'Claude Sonnet 5.5';
const ASTRA = 'GPT-6 Astra';

/** Weekday usage of pat-ops: [date, Claude Sonnet 5.5 USD, GPT-6 Astra USD]. */
const WEEKDAYS: [string, number, number][] = [
  ['2026-10-01', 9.62, 14.35],
  ['2026-10-02', 7.18, 10.94],
  ['2026-10-05', 11.27, 15.83],
  ['2026-10-06', 8.45, 13.16],
  ['2026-10-07', 12.09, 17.52],
  ['2026-10-08', 9.83, 14.71],
  ['2026-10-09', 8.36, 12.48],
  ['2026-10-12', 10.74, 15.27],
  ['2026-10-13', 9.15, 13.88],
  ['2026-10-14', 11.62, 16.05],
  ['2026-10-15', 10.38, 14.96],
  ['2026-10-16', 12.84, 552.7],
  ['2026-10-19', 9.47, 13.21],
  ['2026-10-20', 8.12, 11.65],
  ['2026-10-21', 7.36, 10.08],
  ['2026-10-22', 6.94, 9.71],
  ['2026-10-23', 6.21, 8.45],
  ['2026-10-26', 5.83, 7.94],
];

const patRows: RowSpec[] = [
  ...WEEKDAYS.flatMap(([date, sonnet, astra]) => [at(date, PAT, SONNET, sonnet), at(date, PAT, ASTRA, astra)]),
  at('2026-10-16', PAT, 'GPT-5.6 Terra', 41.3),
  // One output token of GPT-6 Luna costs 5e-7 USD, which the export writes in scientific notation.
  priced('2026-10-08', PAT, 'GPT-6 Luna', { input: 0, cacheRead: 0, cacheWrite: 0, output: 1 }),
  long('2026-10-09', PAT, ASTRA, 1_200_000, 90_000),
  long('2026-10-12', PAT, 'GPT-5.6 Terra', 420_000, 25_000),
  long('2026-10-25', PAT, ASTRA, 9_500_000, 520_000, 1_200_000),
  long('2026-10-25', PAT, 'GPT-5.6 Terra', 2_100_000, 160_000),
].map((r) => ({ ...r, ...B_ORG, quota: 3900 }));

/** Repository-level rows: no username and no seat. */
const repoRows: RowSpec[] = [
  at('2026-10-06', undefined, 'GPT-5.6 Terra', 0.11, { repo: 'fabrikam/web' }),
  at('2026-10-14', undefined, 'GPT-5.6 Terra', 0.09, { repo: 'fabrikam/api' }),
  at('2026-10-21', undefined, 'GPT-5.6 Terra', 0.13, { repo: 'fabrikam/web' }),
].map((r) => ({ ...r, ...B_ORG, product: 'code_quality', sku: 'code_quality_ai_credit' }));

/** No billing split is given, so makeCsv writes every row as fully covered. */
export const FIXTURE_B_ROWS: RowSpec[] = [...patRows, ...repoRows];

// Access helpers, shaped like the old sample helpers ----------------------------------------------------------------

const TEXT = new Map<string, string>([
  [FIXTURE_A, makeCsv(FIXTURE_A_ROWS)],
  [FIXTURE_B, makeCsv(FIXTURE_B_ROWS)],
]);

/** The CSV text of a fixture, generated once per test file. */
export function readFixture(name: string): string {
  const text = TEXT.get(name);
  if (text === undefined) throw new Error(`Unknown fixture: ${name}`);
  return text;
}

export function fixtureSource(name: string): TextSource {
  return { name, data: readFixture(name) };
}

export function listFixtures(): string[] {
  return [...TEXT.keys()];
}

export function loadFixtureStore(names: string[], opts: { dedupe?: boolean } = {}): Promise<DataStore> {
  return buildStore(names.map(fixtureSource), opts);
}

/** Loads fixtures, runs the full analysis pipeline and returns everything a test might need. */
export async function analyzeFixtures(
  names: string[],
  opts: { filters?: Partial<Filters>; settings?: Partial<Settings>; dedupe?: boolean } = {},
): Promise<Pipeline> {
  const store = await loadFixtureStore(names, { dedupe: opts.dedupe });
  return pipelineOf(store, opts);
}
