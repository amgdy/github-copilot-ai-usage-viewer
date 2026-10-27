import type { ChartColors } from '../../components/charts/theme';
import { msg, t } from '../../i18n';
import type { Aggregates, Totals } from '../../lib/analytics/aggregate';
import { median, quantile } from '../../lib/analytics/anomalies';
import { LEVER_ORDER, type LeverStep } from '../../lib/analytics/levers';
import type { PoolSummary } from '../../lib/analytics/pool';
import type { Settings } from '../../lib/analytics/settings';
import { evaluateMonths, monthInputs } from '../../lib/analytics/simulator';
import type { TierId } from '../../lib/analytics/taxonomy';
import { userTips, type UserTip } from '../../lib/analytics/tips';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import {
  AUTO_SHARE_HEALTHY,
  CACHE_HIT_HEALTHY,
  LONG_CONTEXT_HEALTHY,
  POWERFUL_SHARE_HEALTHY,
  ROLE_MODEL_MAX,
  ROLE_MODEL_MIN_ACTIVE_DAYS,
  ROLE_MODEL_MIN_AUTO,
  ROLE_MODEL_MIN_CACHE_HIT,
  ROLE_MODEL_MIN_EFFICIENCY,
} from './thresholds';

export const hitRate = (input: number, cacheRead: number, cacheWrite: number): number => {
  const prompt = input + cacheRead + cacheWrite;
  return prompt > 0 ? cacheRead / prompt : Number.NaN;
};

export const leverColor = (c: ChartColors, id: LeverStep['id']): string => c.palette[LEVER_ORDER.indexOf(id) % c.palette.length];

/** The explanation of each lever, for the info buttons next to its name. */
export const LEVER_DOC: Record<LeverStep['id'], string> = {
  modelShift: 'lever-model-shift',
  autoAdoption: 'lever-auto',
  cacheDiscipline: 'lever-cache',
  contextHygiene: 'lever-context',
  longContext: 'lever-long-context',
  capRunaway: 'lever-cap',
};

/** Whole dollars from $100 up, cents below. */
export const money = (v: number): string => (Math.abs(v) >= 100 ? fmtUSD(v, 0) : fmtUSD(v, 2));

/* Habits worth */

export interface WaterfallRow {
  id: LeverStep['id'];
  label: string;
  description: string;
  /** Saving of this step after the earlier steps, per month. */
  savings: number;
  /** Saving of this step on its own, per month. */
  standalone: number;
  /** Savings of all earlier steps, per month: where the floating bar starts. */
  base: number;
}

export function waterfall(steps: LeverStep[], perMonth: number): { rows: WaterfallRow[]; total: number } {
  let running = 0;
  const rows = steps.map((s) => {
    const row: WaterfallRow = {
      id: s.id,
      label: s.label,
      description: s.description,
      savings: s.savings * perMonth,
      standalone: s.standalone * perMonth,
      base: running,
    };
    running += row.savings;
    return row;
  });
  return { rows, total: running };
}

export interface HabitCash {
  /** Cash saving per month from usage reduction alone (no seat changes). */
  perMonth: number;
  /** Unused included credits per month, today and after the change (USD). */
  wasteBefore: number;
  wasteAfter: number;
}

/** Monthly pool economics of a usage reduction without any seat change; null when there is no billing month in scope. */
export function habitCash(pool: PoolSummary, fraction: number): HabitCash | null {
  const months = evaluateMonths(monthInputs(pool), fraction, 0);
  if (!months.length) return null;
  const avg = (f: (m: (typeof months)[number]) => number): number => months.reduce((a, m) => a + f(m), 0) / months.length;
  return { perMonth: avg((m) => m.saving), wasteBefore: avg((m) => m.baseWaste), wasteAfter: avg((m) => m.newWaste) };
}

/* Token economics */

/** English labels; tokenRows translates them. */
export const TOKEN_KINDS = [
  { key: 'input', label: msg('Input tokens') },
  { key: 'cacheRead', label: msg('Cache read tokens') },
  { key: 'cacheWrite', label: msg('Cache write tokens') },
  { key: 'output', label: msg('Output tokens') },
] as const;

export type TokenKind = (typeof TOKEN_KINDS)[number]['key'];

export type TokenCounts = Pick<Totals, TokenKind>;

/**
 * The tokens behind the estimated cost split: those of the rows that could be priced, so tokens and cost describe the same rows.
 * When nothing could be priced, the tokens of all rows are returned so that the counts still show.
 */
export function costSplitTokens(agg: Aggregates): TokenCounts {
  const tot = agg.totals;
  if (!(tot.est.input + tot.est.cacheRead + tot.est.cacheWrite + tot.est.output > 0)) return tot;
  const out: TokenCounts = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  for (let m = 0; m < agg.nModels; m++) {
    if (!(agg.modelExtra.listCost[m] > 0)) continue;
    out.input += agg.model.input[m];
    out.cacheRead += agg.model.cacheRead[m];
    out.cacheWrite += agg.model.cacheWrite[m];
    out.output += agg.model.output[m];
  }
  return out;
}

export interface TokenRow {
  key: TokenKind;
  label: string;
  tokens: number;
  tokenShare: number;
  cost: number;
  costShare: number;
  /** Estimated cost per million tokens (USD); NaN without tokens. */
  perMillion: number;
}

export function tokenRows(totals: Totals, counts: TokenCounts = totals): TokenRow[] {
  const tokenTotal = counts.input + counts.cacheRead + counts.cacheWrite + counts.output;
  const costTotal = totals.est.input + totals.est.cacheRead + totals.est.cacheWrite + totals.est.output;
  return TOKEN_KINDS.map((k) => {
    const tokens = counts[k.key];
    const cost = totals.est[k.key];
    return {
      key: k.key,
      label: t(k.label),
      tokens,
      tokenShare: tokenTotal > 0 ? tokens / tokenTotal : 0,
      cost,
      costShare: costTotal > 0 ? cost / costTotal : 0,
      perMillion: tokens > 0 ? (cost / tokens) * 1e6 : Number.NaN,
    };
  });
}

export interface CacheBucket {
  label: string;
  lo: number;
  hi: number;
  users: number;
  gross: number;
}

/** Users by cache hit rate in five 20-point buckets. Users without prompt tokens are skipped. */
export function cacheHitBuckets(profiles: UserProfile[]): CacheBucket[] {
  const out: CacheBucket[] = Array.from({ length: 5 }, (_, i) => ({
    label: t('{lo} to {hi}%', { lo: i * 20, hi: (i + 1) * 20 }),
    lo: i * 0.2,
    hi: (i + 1) * 0.2,
    users: 0,
    gross: 0,
  }));
  for (const p of profiles) {
    if (!Number.isFinite(p.cacheHit)) continue;
    const i = Math.min(4, Math.max(0, Math.floor(p.cacheHit * 5 + 1e-9)));
    out[i].users++;
    out[i].gross += p.gross;
  }
  return out;
}

/** Heavy users (usage at or above `minSpend`) with the lowest cache hit rate, lowest first. */
export function lowCacheHeavyUsers(profiles: UserProfile[], minSpend: number, n: number): UserProfile[] {
  return profiles
    .filter((p) => p.gross >= minSpend && Number.isFinite(p.cacheHit))
    .sort((a, b) => a.cacheHit - b.cacheHit || b.gross - a.gross)
    .slice(0, n);
}

/** The cache tip when the user has one, otherwise the most important tip. */
export function cacheTip(p: UserProfile, s: Settings): UserTip | undefined {
  const tips = userTips(p, s, 12);
  return tips.find((tip) => tip.id === 'cache') ?? tips[0];
}

/* Included credits used */

export interface TierBucket {
  id: TierId;
  users: number;
  gross: number;
  /** Share of the usage of all users with a known allotment. */
  share: number;
}

export function tierBuckets(profiles: UserProfile[], ids: readonly TierId[]): TierBucket[] {
  const known = profiles.filter((p) => Number.isFinite(p.utilization));
  const total = known.reduce((a, p) => a + p.gross, 0);
  return ids.map((id) => {
    const inTier = known.filter((p) => p.tier === id);
    const gross = inTier.reduce((a, p) => a + p.gross, 0);
    return { id, users: inTier.length, gross, share: total > 0 ? gross / total : 0 };
  });
}

/** Users whose plan quota is not in the report, so a default allotment was assumed for them. */
export const assumedAllotmentUsers = (profiles: UserProfile[]): number => profiles.filter((p) => !(p.quotaCredits > 0)).length;

/* Cost per active day */

const hasCostPerDay = (p: UserProfile): boolean => p.activeDays > 0 && Number.isFinite(p.costPerActiveDay);

export interface CostPerDayStats {
  users: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
  maxUser: UserProfile;
}

export function costPerDayStats(profiles: UserProfile[]): CostPerDayStats | null {
  const active = profiles.filter(hasCostPerDay);
  if (!active.length) return null;
  const sorted = active.map((p) => p.costPerActiveDay).sort((a, b) => a - b);
  const maxUser = active.reduce((a, p) => (p.costPerActiveDay > a.costPerActiveDay ? p : a));
  return { users: sorted.length, median: median(sorted), p75: quantile(sorted, 0.75), p90: quantile(sorted, 0.9), max: maxUser.costPerActiveDay, maxUser };
}

export function topCostPerDay(profiles: UserProfile[], n: number): UserProfile[] {
  return profiles
    .filter(hasCostPerDay)
    .sort((a, b) => b.costPerActiveDay - a.costPerActiveDay)
    .slice(0, n);
}

/* Biggest opportunities */

export interface Opportunity {
  profile: UserProfile;
  /** Saving per month. */
  total: number;
  by: Record<LeverStep['id'], number>;
}

export interface Opportunities {
  rows: Opportunity[];
  /** Per month, summed over the users shown and over every user with a saving. */
  shownTotal: number;
  allTotal: number;
  withSaving: number;
}

export function topOpportunities(profiles: UserProfile[], perMonth: number, n: number): Opportunities {
  const ranked = profiles.filter((p) => p.potential > 0).sort((a, b) => b.potential - a.potential);
  const rows = ranked.slice(0, n).map((p): Opportunity => {
    const sum = LEVER_ORDER.reduce((s, id) => s + p.potentialBy[id], 0);
    const k = sum > p.potential && sum > 0 ? p.potential / sum : 1;
    const by = {} as Record<LeverStep['id'], number>;
    for (const id of LEVER_ORDER) by[id] = p.potentialBy[id] * k * perMonth;
    return { profile: p, total: p.potential * perMonth, by };
  });
  return {
    rows,
    shownTotal: rows.reduce((a, r) => a + r.total, 0),
    allTotal: ranked.reduce((a, p) => a + p.potential, 0) * perMonth,
    withSaving: ranked.length,
  };
}

/* Role models */

export function roleModels(profiles: UserProfile[], s: Settings): UserProfile[] {
  return profiles
    .filter(
      (p) =>
        p.gross >= s.minSpendForTraits &&
        p.activeDays >= ROLE_MODEL_MIN_ACTIVE_DAYS &&
        (p.engagement === 'daily' || p.engagement === 'regular') &&
        p.tier !== 'runaway' &&
        p.autoShare >= ROLE_MODEL_MIN_AUTO &&
        (!Number.isFinite(p.cacheHit) || p.cacheHit >= ROLE_MODEL_MIN_CACHE_HIT) &&
        (p.profile === 'efficient' || p.efficiency >= ROLE_MODEL_MIN_EFFICIENCY),
    )
    .sort((a, b) => b.efficiency - a.efficiency || b.gross - a.gross)
    .slice(0, ROLE_MODEL_MAX);
}

/** A few sentences about what a user does well, built from their own numbers (at most three points). */
export function strengthsText(p: UserProfile): string {
  const parts: string[] = [];
  const lighter = p.versatileShare + p.lightweightShare;
  if (p.profile === 'efficient') parts.push(t('Mid-tier and lighter models make up {share} of usage.', { share: fmtPct(lighter, 0) }));
  else if (p.powerfulShare < POWERFUL_SHARE_HEALTHY) parts.push(t('Powerful models take only {share} of usage.', { share: fmtPct(p.powerfulShare, 0) }));
  if (p.autoShare >= AUTO_SHARE_HEALTHY) parts.push(t('Auto handles {share} of usage.', { share: fmtPct(p.autoShare, 0) }));
  if (Number.isFinite(p.cacheHit) && p.cacheHit >= CACHE_HIT_HEALTHY) parts.push(t('{share} of prompt tokens are read from the cache.', { share: fmtPct(p.cacheHit, 0) }));
  if (p.longShare < LONG_CONTEXT_HEALTHY && parts.length < 3) parts.push(t('Long-context surcharges are close to zero.'));
  if (!parts.length) return t('Gets more done per credit than most users, with an efficiency score of {score} out of 100.', { score: Math.round(p.efficiency) });
  return parts.slice(0, 3).join(' ');
}
