import type { ModelOverrides } from '../pricing/models';

export interface RosterEntry {
  user: string;
  /** Seat plan name (Business / Enterprise) or a quota in credits; optional. */
  plan?: string;
  /*
   * License details from an imported export (see src/lib/licenses). All optional, so a roster of plain
   * logins and plans keeps working. Dates are UTC calendar days written as YYYY-MM-DD.
   */
  name?: string;
  email?: string;
  /** Organizations that hold the seat, joined with ", ". */
  org?: string;
  /** Teams that assigned the seat, joined with ", ". */
  team?: string;
  createdAt?: string;
  lastActivityAt?: string;
  lastAuthenticatedAt?: string;
  /** The editor or surface of the last activity, for example "vscode". */
  lastSurface?: string;
  /** The day a scheduled cancellation takes effect. */
  pendingCancellation?: string;
  /** Where the dates come from: the REST API or an Activity report. Missing for a plain list of logins. */
  source?: 'api' | 'activity';
}

export interface Settings {
  /** A user counts as active on a day when their usage (gross amount) that day reaches this amount (USD). */
  activeThreshold: number;
  /** Upper utilization bounds (fraction of the user's included monthly credits) for each tier. Above `power` = runaway. */
  tiers: { minimal: number; light: number; core: number; power: number };
  /** Active-day-rate cutoffs (share of workdays since first use). */
  engagement: { daily: number; regular: number; occasional: number };
  /** Cumulative-usage cutoffs for Pareto classes A and B. */
  pareto: { a: number; b: number };
  frontierHeavy: number;
  efficientShare: number;
  lapsedDays: number;
  newUserDays: number;
  spikeShare: number;
  lowAuto: number;
  /** Share of a user's usage through Auto at or above which the user counts as Auto-first. */
  autoFirst: number;
  /** Cache hit rate (cache reads ÷ prompt tokens) below which a user is flagged for low cache reuse. */
  lowCacheHit: number;
  longContextShare: number;
  minSpendForTraits: number;
  /**
   * Auto model-selection discount: GitHub gives 10% on model costs for paid plans (30% on GitHub Copilot Max until 2026-10-28).
   * Usage in the report already includes it. This rate prices Auto rows without token counts and the discount direct users miss.
   */
  autoDiscount: number;
  /** Optional monthly budget for the billed (net) amount, USD. */
  budgetMonthlyBilled: number | null;
  roster: RosterEntry[];
  /**
   * The day (YYYY-MM-DD) the seat roster was exported. Days since a seat's last activity are counted from this day.
   * Missing until a license export is imported; then the latest date inside the roster is used.
   */
  rosterAsOf?: string;
  extraSeats: { business: number; enterprise: number };
  modelOverrides: ModelOverrides;
  topN: number;
}

export const DEFAULT_SETTINGS: Settings = {
  activeThreshold: 0.05,
  tiers: { minimal: 0.1, light: 0.4, core: 1.0, power: 3.0 },
  engagement: { daily: 0.6, regular: 0.3, occasional: 0.1 },
  pareto: { a: 0.8, b: 0.95 },
  frontierHeavy: 0.7,
  efficientShare: 0.7,
  lapsedDays: 7,
  newUserDays: 14,
  spikeShare: 0.4,
  lowAuto: 0.1,
  autoFirst: 0.5,
  lowCacheHit: 0.5,
  longContextShare: 0.1,
  minSpendForTraits: 5,
  autoDiscount: 0.1,
  budgetMonthlyBilled: null,
  roster: [],
  extraSeats: { business: 0, enterprise: 0 },
  modelOverrides: {},
  topN: 10,
};

/** Where the settings are kept in this browser. */
export const SETTINGS_STORAGE_KEY = 'ghcu.settings.v1';

/** The settings used with the made-up sample report. The saved license list holds real people, so it is left out. */
export function withoutRoster(s: Settings): Settings {
  if (s.roster.length === 0 && s.rosterAsOf === undefined) return s;
  const { rosterAsOf: _asOf, ...rest } = s;
  return { ...rest, roster: [] };
}

/** 'saved': written in full. 'slim': the browser refused the full roster, so it was kept without license details. 'failed': nothing was written. */
export type SaveResult = 'saved' | 'slim' | 'failed';

const writeSettings = (s: Settings): boolean => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
};

const isSlimEntry = (e: RosterEntry): boolean => Object.keys(e).every((k) => k === 'user' || k === 'plan');
const slimEntry = (e: RosterEntry): RosterEntry => (e.plan === undefined ? { user: e.user } : { user: e.user, plan: e.plan });

/**
 * Stores the settings in the browser. Never throws: storage may be unavailable (private mode) or full. A roster with
 * license details is the one thing that can be big (about 4.3 MB for 20,000 seats with names and emails), so when the
 * full write is refused the roster is stored with logins and plans only (about 0.8 MB). The settings then last for the
 * session in full and survive a reload without the license details.
 */
export function saveSettings(s: Settings): SaveResult {
  if (writeSettings(s)) return 'saved';
  if (s.roster.some((e) => !isSlimEntry(e)) && writeSettings({ ...s, roster: s.roster.map(slimEntry) })) return 'slim';
  return 'failed';
}

/** Whether a value is a real calendar day written as YYYY-MM-DD. */
export function isIsoDay(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/**
 * Fills in defaults around a partial set of settings. It does not check types or ranges, so anything that
 * comes from outside the app (a stored value, a settings file) must go through `sanitizeSettings` first.
 * The one exception is `rosterAsOf`, which is dropped unless it is a valid day.
 */
export function mergeSettings(partial: Partial<Settings>): Settings {
  const d = structuredClone(DEFAULT_SETTINGS);
  const merged: Settings = {
    ...d,
    ...partial,
    tiers: { ...d.tiers, ...(partial.tiers ?? {}) },
    engagement: { ...d.engagement, ...(partial.engagement ?? {}) },
    pareto: { ...d.pareto, ...(partial.pareto ?? {}) },
    extraSeats: { ...d.extraSeats, ...(partial.extraSeats ?? {}) },
    roster: partial.roster ?? [],
    modelOverrides: partial.modelOverrides ?? {},
  };
  if (!isIsoDay(merged.rosterAsOf)) delete merged.rosterAsOf;
  return merged;
}

/** The monthly budget for billed overage in USD, or null when there is none. A missing, zero, negative or invalid amount means no budget. */
export function budgetOf(s: Pick<Settings, 'budgetMonthlyBilled'>): number | null {
  const b = s.budgetMonthlyBilled;
  return typeof b === 'number' && b > 0 ? b : null;
}

export const PLAN_CREDITS: Record<string, number> = { Business: 1900, Enterprise: 3900 };

/** Seat list prices (USD per user per month). Included credits are worth the same amount (1 credit = $0.01). */
export const PLAN_PRICE: Record<string, number> = { Business: 19, Enterprise: 39 };

export const seatPrice = (quotaCredits: number): number => {
  if (quotaCredits === PLAN_CREDITS.Business) return PLAN_PRICE.Business;
  if (quotaCredits === PLAN_CREDITS.Enterprise) return PLAN_PRICE.Enterprise;
  return quotaCredits * 0.01;
};

const CUSTOM_PLAN_LABEL = /^custom\s*\(\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*credits?\s*\)$/;

/**
 * The credits in the label the report gives a custom plan (planLabel), for example "Custom (2,500 credits)". NaN for any other text.
 * The label is an English identifier that the plan filter and the plan groups also use, so translate it only where it is shown.
 */
export function customPlanCredits(plan: string): number {
  const m = CUSTOM_PLAN_LABEL.exec(plan.trim().toLowerCase());
  const credits = m === null ? Number.NaN : Number(m[1].replace(/,/g, ''));
  return credits > 0 ? credits : Number.NaN;
}

/**
 * The AI credits a roster plan stands for. The text can be Business or Enterprise in any case, with more words around it such
 * as "GitHub Copilot Business", the label of a custom plan such as "Custom (2,500 credits)", or a number. A number of 1,000 or more
 * is credits and a smaller one is dollars of included credits. The label always says credits, so "Custom (500 credits)" is 500 credits.
 * Returns NaN when the text is not a plan.
 */
export function planCredits(plan: string | null | undefined): number {
  if (!plan) return Number.NaN;
  const p = plan.trim().toLowerCase();
  if (p.includes('enterprise')) return PLAN_CREDITS.Enterprise;
  if (p.includes('business')) return PLAN_CREDITS.Business;
  const custom = customPlanCredits(p);
  if (Number.isFinite(custom)) return custom;
  const n = Number(p.replace(/[, $]/g, ''));
  if (Number.isFinite(n) && n > 0) return n >= 1000 ? n : n * 100;
  return Number.NaN;
}

/** The included credits of a roster seat. A seat without a plan, or with one that cannot be read, counts as `fallback`. */
export function seatCredits(plan: string | null | undefined, fallback: number): number {
  const c = planCredits(plan);
  return Number.isFinite(c) ? c : fallback;
}
