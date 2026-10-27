import { makeCsv, weekdayOf, type RowSpec } from './helpers';

/** Synthetic September 2026 datasets (a complete month; the 1st is a Tuesday) used to exercise wording and edge cases. */

export const sep = (d: number): string => `2026-09-${String(d).padStart(2, '0')}`;
export const SEPTEMBER: string[] = Array.from({ length: 30 }, (_, i) => sep(i + 1));
export const SEP_WEEKDAYS: string[] = SEPTEMBER.filter((d) => weekdayOf(d) < 5);

/**
 * Token counts that make a GPT-5.6 Terra row cost exactly its list price ($2 input, $0.2 cache read, $2.5 cache write per 1M).
 * `cached`: 93% cache hit. `fresh`: 0% cache hit. Both include cache writes so the cache lever has something to save.
 */
export function tokensFor(gross: number, kind: 'cached' | 'fresh'): Pick<RowSpec, 'input' | 'cacheRead' | 'cacheWrite'> {
  return kind === 'cached'
    ? { cacheRead: Math.round(gross * 2_500_000), cacheWrite: Math.round(gross * 200_000) }
    : { input: Math.round(gross * 250_000), cacheWrite: Math.round(gross * 200_000) };
}

/** An Auto-routed GPT-5.6 Terra row with matching tokens. */
export const terra = (spec: RowSpec, kind: 'cached' | 'fresh' = 'cached'): RowSpec => ({
  model: 'Auto: GPT-5.6 Terra',
  ...tokensFor(spec.gross, kind),
  ...spec,
});

/** A long-context request: 300k prompt tokens on GPT-6 Astra billed at the long-context rate ($6 instead of the $3 list price). */
export const longRow = (date: string, user: string, extra: Partial<RowSpec> = {}): RowSpec => ({
  date,
  user,
  model: 'Auto: GPT-6 Astra',
  gross: 6,
  input: 300_000,
  ...extra,
});

/** What a Business seat is billed for Auto rows, as a share of the list price of their tokens (measured on real exports). */
export const AUTO_BILLED_FACTOR = 0.9;

/**
 * Makes the Auto rows of `rows` bill `factor` of the list price of their tokens, so the report shows an Auto discount.
 * The tokens are scaled up, the billed amount stays the same.
 */
export function autoDiscounted(rows: RowSpec[], factor = AUTO_BILLED_FACTOR): RowSpec[] {
  const scale = (n: number | undefined): number | undefined => (n === undefined ? undefined : Math.round(n / factor));
  return rows.map((r) =>
    r.model && /^auto/i.test(r.model) ? { ...r, input: scale(r.input), output: scale(r.output), cacheRead: scale(r.cacheRead), cacheWrite: scale(r.cacheWrite) } : r,
  );
}

/** Splits `total` evenly over `dates` as separate rows. */
export function spread(user: string, total: number, dates: string[], extra: Partial<RowSpec> = {}, kind: 'cached' | 'fresh' = 'cached'): RowSpec[] {
  return dates.map((date) => terra({ date, user, gross: total / dates.length, ...extra }, kind));
}

/**
 * One user per behaviour, `n` users each, so that every counted recommendation can be checked for n = 1, 2, 3.
 * No user is billed (the pool is far from exhausted), all rows are Auto with a healthy cache.
 */
export function agreementCsv(n: number): string {
  const rows: RowSpec[] = [];
  const cc = { costCenter: 'eng' };
  for (let i = 1; i <= n; i++) {
    for (const date of SEP_WEEKDAYS.slice(-15)) rows.push(terra({ date, user: `champ-${i}`, gross: 1, ...cc }));
    rows.push(terra({ date: sep(3), user: `spike-${i}`, gross: 8, ...cc }));
    for (const d of [10, 17, 28]) rows.push(terra({ date: sep(d), user: `spike-${i}`, gross: 0.5, ...cc }));
    rows.push(terra({ date: sep(8), user: `multi-${i}`, gross: 2, org: 'acme', ...cc }));
    rows.push(terra({ date: sep(9), user: `multi-${i}`, gross: 2, org: 'beta', ...cc }));
    rows.push(terra({ date: sep(29), user: `multi-${i}`, gross: 0.5, org: 'beta', ...cc }));
    rows.push(terra({ date: sep(14), user: `nocc-${i}`, gross: 1 }), terra({ date: sep(28), user: `nocc-${i}`, gross: 1 }));
    rows.push(terra({ date: sep(1), user: `ghost-${i}`, gross: 0.1, ...cc }), terra({ date: sep(2), user: `ghost-${i}`, gross: 0.1, ...cc }));
    rows.push(terra({ date: sep(8), user: `ent-${i}`, gross: 3, quota: 3900, ...cc }), terra({ date: sep(28), user: `ent-${i}`, gross: 2, quota: 3900, ...cc }));
    for (const d of [10, 17, 24, 29]) rows.push(terra({ date: sep(d), user: `run-${i}`, gross: 15, ...cc }));
    rows.push(terra({ date: sep(24), user: `newbie-${i}`, gross: 1, ...cc }), terra({ date: sep(28), user: `newbie-${i}`, gross: 1, ...cc }));
  }
  return makeCsv(rows, { pool: true });
}

/** Three users in September with one idle seat; the other two split `heavy` and `light` dollars. */
export function idleSeatCsv(heavy: number, light: number): string {
  const cc = { costCenter: 'eng' };
  const rows = [
    ...spread('heavy', heavy, SEP_WEEKDAYS.slice(0, 20), cc),
    ...spread('light', light - 0.5, SEP_WEEKDAYS.slice(0, 10), cc),
    terra({ date: sep(30), user: 'light', gross: 0.5, ...cc }),
    terra({ date: sep(1), user: 'ghost', gross: 0.4, ...cc }),
  ];
  return makeCsv(rows, { pool: true });
}

/** `n` long-context requests by one regular user; everyone else has a healthy cache. */
export function longContextCsv(n: number): string {
  const cc = { costCenter: 'eng' };
  const rows = [...spread('lc', 15, SEP_WEEKDAYS.slice(-15), cc)];
  for (let i = 0; i < n; i++) rows.push(longRow(SEP_WEEKDAYS[i], 'lc', cc));
  return makeCsv(rows, { pool: true });
}

/** `n` users with a poor cache hit rate next to one heavy cached user, so the overall hit rate stays high. */
export function lowCacheCsv(n: number): string {
  const cc = { costCenter: 'eng' };
  const rows = [...spread('good', 100, SEP_WEEKDAYS, cc)];
  for (let i = 1; i <= n; i++) rows.push(...spread(`bad-${i}`, 6, SEP_WEEKDAYS.slice(0, 6), cc, 'fresh'));
  return makeCsv(rows, { pool: true });
}

/** Four steady users at about 90% of the pool, all Auto: nothing to fix. */
export function healthyCsv(): string {
  const rows: RowSpec[] = [];
  // 17 weekdays spread over the whole month so that it is complete (the last day of data is Sep 30).
  const days = SEP_WEEKDAYS.filter((_, i) => i % 4 !== 3);
  for (let u = 1; u <= 4; u++) {
    for (const date of days) rows.push({ date, user: `steady-${u}`, gross: 1, model: 'Auto: GPT-5.6 Terra', costCenter: 'eng' });
  }
  return makeCsv(rows, { pool: true });
}
