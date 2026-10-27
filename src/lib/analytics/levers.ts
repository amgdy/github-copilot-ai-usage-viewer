import { msg, t } from '../../i18n/core.ts';
import { PRICE_CARD, type Vendor } from '../pricing/card';
import { resolveModelMeta, type ModelMeta, type ModelTable } from '../pricing/models';
import type { Aggregates } from './aggregate';
import { summarizeAuto, type AutoRates } from './autoDiscount';
import type { Settings } from './settings';

export interface LeverParams {
  /** Share of Powerful-tier spend moved to a mid-tier model. */
  modelShift: number;
  /** Share of manual (non-Auto) spend moved to Auto. */
  autoAdoption: number;
  /** Share of cache-write tokens turned into cache reads (stable sessions, no mid-session model switches). */
  cacheDiscipline: number;
  /** Reduction of input-side token spend through leaner context (/compact, fresh threads, fewer tools). */
  contextHygiene: number;
  /** Share of the long-context premium avoided. */
  longContext: number;
  /** Share of spend above `capUtil` × the user's included credits that is avoided (budgets / session limits). */
  capRunaway: number;
  capUtil: number;
  /** "same-vendor" or an explicit target model name. */
  target: string;
}

export const DEFAULT_LEVERS: LeverParams = {
  modelShift: 0.3,
  autoAdoption: 0.5,
  cacheDiscipline: 0.2,
  contextHygiene: 0.1,
  longContext: 0.3,
  capRunaway: 0.5,
  capUtil: 3,
  target: 'same-vendor',
};

/** Mid-tier ("Versatile") default targets for model right-sizing, per vendor. */
export const DEFAULT_TARGETS: Record<Vendor, string> = {
  OpenAI: 'GPT-5.6 Terra',
  Anthropic: 'Claude Sonnet 5.5',
  Google: 'Gemini 3.8 Flash',
  Microsoft: 'MAI-Code-1.1-Flash',
  xAI: 'Grok 4.7',
  Moonshot: 'Claude Sonnet 5.5',
  Other: 'Claude Sonnet 5.5',
};

export const VERSATILE_TARGETS: string[] = PRICE_CARD.filter((e) => e.category === 'Versatile').map((e) => e.name);

export interface ShiftRow {
  modelId: number;
  model: string;
  target: string;
  gross: number;
  /** Target cost as a fraction of source cost for the same token mix (list prices). */
  ratio: number;
  savingsAtFull: number;
}

export interface LeverContext {
  agg: Aggregates;
  models: ModelTable;
  settings: Settings;
  /** Auto discount per plan. Measured on `agg` when absent. A segment filter passes the rates of the whole filtered population. */
  autoRates?: AutoRates;
}

function tokenCost(m: ModelMeta, input: number, cacheRead: number, cacheWrite: number, output: number): number {
  if (!m.base) return 0;
  const r = m.base;
  return (input * r.input + cacheRead * r.cachedInput + cacheWrite * r.cacheWrite + output * r.output) / 1e6;
}

export function targetMeta(targetName: string, vendor: Vendor, settings: Settings): ModelMeta {
  const name = targetName === 'same-vendor' ? DEFAULT_TARGETS[vendor] : targetName;
  return resolveModelMeta(-1, name, settings.modelOverrides);
}

/** Per-model right-sizing ratios for Powerful models (NaN when not applicable). */
export function modelShiftRatios(ctx: LeverContext, target: string): { ratio: Float64Array; rows: ShiftRow[] } {
  const { agg, models, settings } = ctx;
  const n = models.meta.length;
  const ratio = new Float64Array(n).fill(Number.NaN);
  const rows: ShiftRow[] = [];
  for (let m = 0; m < n; m++) {
    const meta = models.meta[m];
    if (meta.category !== 'Powerful' || !meta.priced) continue;
    const g = agg.model.gross[m];
    if (g <= 0) continue;
    const t = targetMeta(target, meta.vendor, settings);
    if (!t.base || t.name === meta.name) continue;
    const src = tokenCost(meta, agg.model.input[m], agg.model.cacheRead[m], agg.model.cacheWrite[m], agg.model.output[m]);
    const dst = tokenCost(t, agg.model.input[m], agg.model.cacheRead[m], agg.model.cacheWrite[m], agg.model.output[m]);
    if (src <= 0 || dst <= 0) continue;
    const r = dst / src;
    ratio[m] = r;
    rows.push({ modelId: m, model: meta.name, target: t.name, gross: g, ratio: r, savingsAtFull: r < 1 ? g * (1 - r) : 0 });
  }
  rows.sort((a, b) => b.savingsAtFull - a.savingsAtFull);
  return { ratio, rows };
}

export interface LeverStep {
  id: 'modelShift' | 'autoAdoption' | 'cacheDiscipline' | 'contextHygiene' | 'longContext' | 'capRunaway';
  label: string;
  description: string;
  /** Savings in billed-gross dollars, after earlier steps have already reduced the base. */
  savings: number;
  /** Savings if applied on its own to the original spend. */
  standalone: number;
}

export interface LeverResult {
  baseline: number;
  steps: LeverStep[];
  total: number;
  final: number;
  shiftRows: ShiftRow[];
}

export interface UserLeverInput {
  gross: number;
  manualGross: number;
  estCw: number;
  estIn: number;
  estCr: number;
  longPremium: number;
  /** Gross by model for the user (null when unavailable); used for model right-sizing. */
  powerfulSavingsFull: number;
  allotment: number;
}

/**
 * Applies the levers sequentially so overlapping levers never double count:
 * every step works on what is left after the previous one.
 */
export function applyLevers(
  baseline: number,
  standalone: Record<LeverStep['id'], number>,
  meta: Record<LeverStep['id'], { label: string; description: string }>,
  order: LeverStep['id'][],
): { steps: LeverStep[]; total: number } {
  let remaining = baseline;
  const steps: LeverStep[] = [];
  let total = 0;
  for (const id of order) {
    const scale = baseline > 0 ? remaining / baseline : 0;
    const s = Math.max(0, standalone[id] * scale);
    remaining -= s;
    total += s;
    steps.push({ id, label: t(meta[id].label), description: t(meta[id].description), savings: s, standalone: standalone[id] });
  }
  return { steps, total };
}

/** English text; show it through t(). The steps built by applyLevers are already translated. */
export const LEVER_META: Record<LeverStep['id'], { label: string; description: string }> = {
  modelShift: {
    label: msg('Right-size models'),
    description: msg('Move part of the usage on Powerful models (deep reasoning models) to Versatile models for everyday work.'),
  },
  autoAdoption: {
    label: msg('Use Auto model selection'),
    description: msg('Let GitHub Copilot choose the model. It avoids using a bigger model than needed, and where the plan has an Auto discount the same work costs less.'),
  },
  cacheDiscipline: {
    label: msg('Cache discipline'),
    description: msg('Keep chats and models steady, so saved context is read again (cheap) instead of written again (costly).'),
  },
  contextHygiene: {
    label: msg('Leaner context'),
    description: msg('Start new chats more often, use /compact, keep instructions short, and turn on only the MCP tools you need.'),
  },
  longContext: {
    label: msg('Avoid long-context surcharges'),
    description: msg('Keep prompts under the long-context size of the model: split the work, summarize, and point to fewer files.'),
  },
  capRunaway: {
    label: msg('Cap runaway users'),
    description: msg('Set user budgets or GitHub Copilot CLI session limits for the heaviest users, and show them cheaper ways to work.'),
  },
};

export const LEVER_ORDER: LeverStep['id'][] = [
  'modelShift',
  'autoAdoption',
  'cacheDiscipline',
  'contextHygiene',
  'longContext',
  'capRunaway',
];

/** Estimated spend saved by turning cache writes into cache reads, using per-model billed/list ratios. */
export function cacheSavingsStandalone(ctx: LeverContext, share: number): number {
  const { agg, models } = ctx;
  let s = 0;
  for (let m = 0; m < models.meta.length; m++) {
    if (!models.priced[m]) continue;
    const list = agg.modelExtra.listCost[m];
    if (list <= 0) continue;
    const billedRatio = agg.modelExtra.pricedGross[m] / list;
    const perToken = models.rCw[m] - models.rCr[m];
    if (perToken > 0) s += agg.model.cacheWrite[m] * perToken * billedRatio;
  }
  return s * share;
}

export function computeLevers(
  ctx: LeverContext,
  params: LeverParams,
  allotment: Float64Array,
): LeverResult {
  const { agg, settings } = ctx;
  const baseline = agg.totals.gross;
  const { rows: shiftRows } = modelShiftRatios(ctx, params.target);
  const modelShiftFull = shiftRows.reduce((a, r) => a + r.savingsAtFull, 0);
  // Without model names nothing is known to be hand-picked, so there is no manual usage to move to Auto.
  const modelsKnown = ctx.models.meta.some((m) => m.name !== '');
  // What the hand-picked usage would earn through Auto: each user's hand-picked usage times the Auto discount of their plan.
  const autoPotential = modelsKnown ? summarizeAuto(agg, settings, true, ctx.autoRates).missed : 0;
  const inputSide = agg.totals.est.input + agg.totals.est.cacheRead + agg.totals.est.cacheWrite;

  let capped = 0;
  const g = agg.userAcc.gross;
  for (let u = 1; u < g.length; u++) {
    const allot = allotment[u];
    if (allot > 0 && g[u] > params.capUtil * allot) capped += g[u] - params.capUtil * allot;
  }

  const standalone: Record<LeverStep['id'], number> = {
    modelShift: modelShiftFull * params.modelShift,
    autoAdoption: autoPotential * params.autoAdoption,
    cacheDiscipline: cacheSavingsStandalone(ctx, params.cacheDiscipline),
    contextHygiene: inputSide * params.contextHygiene,
    longContext: agg.totals.longPremium * params.longContext,
    capRunaway: capped * params.capRunaway,
  };
  const { steps, total } = applyLevers(baseline, standalone, LEVER_META, LEVER_ORDER);
  return { baseline, steps, total, final: baseline - total, shiftRows };
}
