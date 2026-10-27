import { PLAN_CREDITS, customPlanCredits, planCredits } from '../analytics/settings';

const BUSINESS = PLAN_CREDITS.Business;
const ENTERPRISE = PLAN_CREDITS.Enterprise;
const PLAIN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
const GROUPED = /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/;
const NO_PLAN = /^(unknown|none|n\/a|na|null|undefined|-|--)$/i;

/** A strict number: "12", "12.5", "1,234.5", "$12". Null for anything else. */
function parseNumber(text: string): number | null {
  let t = text.trim().replace(/^\$\s*/, '').trim();
  if (t === '') return null;
  if (GROUPED.test(t)) t = t.replace(/,/g, '');
  if (!PLAIN.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Turns AI credits into the plan text kept in the roster. The analysis reads a plan of 1,000 or more as
 * credits and a smaller number as US dollars of included credits, so small amounts are kept as dollars.
 */
export function canonicalPlan(credits: number): string {
  const c = Math.round(credits * 100) / 100;
  if (c === BUSINESS) return 'Business';
  if (c === ENTERPRISE) return 'Enterprise';
  return c >= 1000 ? String(c) : String(Math.round((c / 100) * 1e6) / 1e6);
}

/**
 * Reads a plan cell. Returns the text to keep, undefined when the cell is empty or says "unknown", or null when it
 * cannot be read. A bare number follows the analysis rule. A "$" or "usd" marks dollars and the word "credits" marks credits.
 * The label the report gives a custom plan, "Custom (2,500 credits)", is read as its credits. A plan is an identifier, so only
 * the English names and labels are read. Text that was translated for display is not a plan.
 */
export function readPlan(raw: string): string | undefined | null {
  const t = raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
  if (!t || NO_PLAN.test(t)) return undefined;
  const lower = t.toLowerCase();
  if (lower.includes('enterprise')) return 'Enterprise';
  if (lower.includes('business')) return 'Business';
  const custom = customPlanCredits(lower);
  if (Number.isFinite(custom)) return custom > 1e9 ? null : canonicalPlan(custom);
  const dollars = lower.includes('$') || /\b(usd|dollars?)\b/.test(lower);
  const credits = /\bcredits?\b/.test(lower);
  const n = parseNumber(lower.replace(/\b(credits?|usd|dollars?)\b/g, '').replace(/[$\s]/g, ''));
  if (n === null || n <= 0 || n > 1e9) return null;
  if (dollars) return canonicalPlan(n * 100);
  if (credits) return canonicalPlan(n);
  return canonicalPlan(n >= 1000 ? n : n * 100);
}

/** How much a plan includes, for ranking plans. Zero when the plan is unset or cannot be read. */
export function planRank(plan: string | undefined): number {
  const c = planCredits(plan);
  return Number.isFinite(c) ? c : 0;
}

/** The higher of two plans (Enterprise over Business over unset). The first one wins a tie. */
export function higherPlan(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return planRank(b) > planRank(a) ? b : a;
}
