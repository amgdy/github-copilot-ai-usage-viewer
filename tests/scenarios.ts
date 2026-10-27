import { makeCsv, weekdayOf, type RowSpec } from './helpers';

/** Synthetic September 2026 datasets (a complete month; the 1st is a Tuesday) used to exercise wording and edge cases. */

export const septemberDate = (dayOfMonth: number): string => `2026-09-${String(dayOfMonth).padStart(2, '0')}`;
export const SEPTEMBER: string[] = Array.from({ length: 30 }, (_, index) => septemberDate(index + 1));
export const SEP_WEEKDAYS: string[] = SEPTEMBER.filter((date) => weekdayOf(date) < 5);

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
  const scale = (tokens: number | undefined): number | undefined => (tokens === undefined ? undefined : Math.round(tokens / factor));
  return rows.map((row) =>
    row.model && /^auto/i.test(row.model) ? { ...row, input: scale(row.input), output: scale(row.output), cacheRead: scale(row.cacheRead), cacheWrite: scale(row.cacheWrite) } : row,
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
export function agreementCsv(usersPerBehavior: number): string {
  const rows: RowSpec[] = [];
  const costCenterFields = { costCenter: 'eng' };
  for (let i = 1; i <= usersPerBehavior; i++) {
    for (const date of SEP_WEEKDAYS.slice(-15)) rows.push(terra({ date, user: `champ-${i}`, gross: 1, ...costCenterFields }));
    rows.push(terra({ date: septemberDate(3), user: `spike-${i}`, gross: 8, ...costCenterFields }));
    for (const dayOfMonth of [10, 17, 28]) rows.push(terra({ date: septemberDate(dayOfMonth), user: `spike-${i}`, gross: 0.5, ...costCenterFields }));
    rows.push(terra({ date: septemberDate(8), user: `multi-${i}`, gross: 2, org: 'acme', ...costCenterFields }));
    rows.push(terra({ date: septemberDate(9), user: `multi-${i}`, gross: 2, org: 'beta', ...costCenterFields }));
    rows.push(terra({ date: septemberDate(29), user: `multi-${i}`, gross: 0.5, org: 'beta', ...costCenterFields }));
    rows.push(terra({ date: septemberDate(14), user: `nocc-${i}`, gross: 1 }), terra({ date: septemberDate(28), user: `nocc-${i}`, gross: 1 }));
    rows.push(terra({ date: septemberDate(1), user: `ghost-${i}`, gross: 0.1, ...costCenterFields }), terra({ date: septemberDate(2), user: `ghost-${i}`, gross: 0.1, ...costCenterFields }));
    rows.push(terra({ date: septemberDate(8), user: `ent-${i}`, gross: 3, quota: 3900, ...costCenterFields }), terra({ date: septemberDate(28), user: `ent-${i}`, gross: 2, quota: 3900, ...costCenterFields }));
    for (const dayOfMonth of [10, 17, 24, 29]) rows.push(terra({ date: septemberDate(dayOfMonth), user: `run-${i}`, gross: 15, ...costCenterFields }));
    rows.push(terra({ date: septemberDate(24), user: `newbie-${i}`, gross: 1, ...costCenterFields }), terra({ date: septemberDate(28), user: `newbie-${i}`, gross: 1, ...costCenterFields }));
  }
  return makeCsv(rows, { pool: true });
}

/** Three users in September with one idle seat; the other two split `heavy` and `light` dollars. */
export function idleSeatCsv(heavy: number, light: number): string {
  const costCenterFields = { costCenter: 'eng' };
  const rows = [
    ...spread('heavy', heavy, SEP_WEEKDAYS.slice(0, 20), costCenterFields),
    ...spread('light', light - 0.5, SEP_WEEKDAYS.slice(0, 10), costCenterFields),
    terra({ date: septemberDate(30), user: 'light', gross: 0.5, ...costCenterFields }),
    terra({ date: septemberDate(1), user: 'ghost', gross: 0.4, ...costCenterFields }),
  ];
  return makeCsv(rows, { pool: true });
}

/** `n` long-context requests by one regular user; everyone else has a healthy cache. */
export function longContextCsv(requestCount: number): string {
  const costCenterFields = { costCenter: 'eng' };
  const rows = [...spread('lc', 15, SEP_WEEKDAYS.slice(-15), costCenterFields)];
  for (let i = 0; i < requestCount; i++) rows.push(longRow(SEP_WEEKDAYS[i], 'lc', costCenterFields));
  return makeCsv(rows, { pool: true });
}

/** `n` users with a poor cache hit rate next to one heavy cached user, so the overall hit rate stays high. */
export function lowCacheCsv(userCount: number): string {
  const costCenterFields = { costCenter: 'eng' };
  const rows = [...spread('good', 100, SEP_WEEKDAYS, costCenterFields)];
  for (let i = 1; i <= userCount; i++) rows.push(...spread(`bad-${i}`, 6, SEP_WEEKDAYS.slice(0, 6), costCenterFields, 'fresh'));
  return makeCsv(rows, { pool: true });
}

/** Four steady users at about 90% of the pool, all Auto: nothing to fix. */
export function healthyCsv(): string {
  const rows: RowSpec[] = [];
  // 17 weekdays spread over the whole month so that it is complete (the last day of data is Sep 30).
  const days = SEP_WEEKDAYS.filter((_, index) => index % 4 !== 3);
  for (let userNumber = 1; userNumber <= 4; userNumber++) {
    for (const date of days) rows.push({ date, user: `steady-${userNumber}`, gross: 1, model: 'Auto: GPT-5.6 Terra', costCenter: 'eng' });
  }
  return makeCsv(rows, { pool: true });
}
