/** Text and number helpers for the settings inputs. */

/** Formats a number for an input without float noise (0.30000000000000004 becomes "0.3"). */
export function numText(n: number | null | undefined, digits = 4): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return String(Number(n.toFixed(digits)));
}

/** Stored fraction to displayed percent (0.4 to 40). */
export const toPct = (fraction: number): number => Math.round(fraction * 100 * 1e6) / 1e6;

/** Displayed percent to stored fraction (40 to 0.4). */
export const fromPct = (percent: number): number => Math.round((percent / 100) * 1e8) / 1e8;

const PLAIN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
const GROUPED = /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/;

/**
 * Strict number parser. Accepts "12", "12.5", ".5", "1,234.5", "$12" and "40%".
 * Returns null for anything else (hex, exponents, Infinity, text, a decimal comma).
 */
export function parseNumber(text: string): number | null {
  let t = text.trim().replace(/^\$\s*/, '').replace(/\s*%$/, '').trim();
  if (t === '') return null;
  if (GROUPED.test(t)) t = t.replace(/,/g, '');
  if (!PLAIN.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Whether a stored value is a finite number inside a closed range. */
export function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}
