import { PLAN_CREDITS, customPlanCredits, planCredits } from '../analytics/settings';

const BUSINESS = PLAN_CREDITS.Business;
const ENTERPRISE = PLAN_CREDITS.Enterprise;
const PLAIN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
const GROUPED = /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/;
const NO_PLAN = /^(unknown|none|n\/a|na|null|undefined|-|--)$/i;

/** A strict number: "12", "12.5", "1,234.5", "$12". Null for anything else. */
function parseNumber(text: string): number | null {
  let cleaned = text.trim().replace(/^\$\s*/, '').trim();
  if (cleaned === '') return null;
  if (GROUPED.test(cleaned)) cleaned = cleaned.replace(/,/g, '');
  if (!PLAIN.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * Turns AI credits into the plan text kept in the roster. The analysis reads a plan of 1,000 or more as
 * credits and a smaller number as US dollars of included credits, so small amounts are kept as dollars.
 */
export function canonicalPlan(credits: number): string {
  const roundedCredits = Math.round(credits * 100) / 100;
  if (roundedCredits === BUSINESS) return 'Business';
  if (roundedCredits === ENTERPRISE) return 'Enterprise';
  return roundedCredits >= 1000 ? String(roundedCredits) : String(Math.round((roundedCredits / 100) * 1e6) / 1e6);
}

/**
 * Reads a plan cell. Returns the text to keep, undefined when the cell is empty or says "unknown", or null when it
 * cannot be read. A bare number follows the analysis rule. A "$" or "usd" marks dollars and the word "credits" marks credits.
 * The label the report gives a custom plan, "Custom (2,500 credits)", is read as its credits. A plan is an identifier, so only
 * the English names and labels are read. Text that was translated for display is not a plan.
 */
export function readPlan(raw: string): string | undefined | null {
  const text = raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
  if (!text || NO_PLAN.test(text)) return undefined;
  const lower = text.toLowerCase();
  if (lower.includes('enterprise')) return 'Enterprise';
  if (lower.includes('business')) return 'Business';
  const custom = customPlanCredits(lower);
  if (Number.isFinite(custom)) return custom > 1e9 ? null : canonicalPlan(custom);
  const dollars = lower.includes('$') || /\b(usd|dollars?)\b/.test(lower);
  const credits = /\bcredits?\b/.test(lower);
  const amount = parseNumber(lower.replace(/\b(credits?|usd|dollars?)\b/g, '').replace(/[$\s]/g, ''));
  if (amount === null || amount <= 0 || amount > 1e9) return null;
  if (dollars) return canonicalPlan(amount * 100);
  if (credits) return canonicalPlan(amount);
  return canonicalPlan(amount >= 1000 ? amount : amount * 100);
}

/** How much a plan includes, for ranking plans. Zero when the plan is unset or cannot be read. */
export function planRank(plan: string | undefined): number {
  const credits = planCredits(plan);
  return Number.isFinite(credits) ? credits : 0;
}

/** The higher of two plans (Enterprise over Business over unset). The first one wins a tie. */
export function higherPlan(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return planRank(b) > planRank(a) ? b : a;
}
