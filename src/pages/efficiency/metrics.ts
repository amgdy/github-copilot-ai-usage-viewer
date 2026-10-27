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

export const leverColor = (colors: ChartColors, id: LeverStep['id']): string => colors.palette[LEVER_ORDER.indexOf(id) % colors.palette.length];

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
export const money = (amount: number): string => (Math.abs(amount) >= 100 ? fmtUSD(amount, 0) : fmtUSD(amount, 2));

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
  const rows = steps.map((step) => {
    const row: WaterfallRow = {
      id: step.id,
      label: step.label,
      description: step.description,
      savings: step.savings * perMonth,
      standalone: step.standalone * perMonth,
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
  const average = (pick: (month: (typeof months)[number]) => number): number => months.reduce((total, month) => total + pick(month), 0) / months.length;
  return { perMonth: average((month) => month.saving), wasteBefore: average((month) => month.baseWaste), wasteAfter: average((month) => month.newWaste) };
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
export function costSplitTokens(aggregates: Aggregates): TokenCounts {
  const totals = aggregates.totals;
  if (!(totals.est.input + totals.est.cacheRead + totals.est.cacheWrite + totals.est.output > 0)) return totals;
  const out: TokenCounts = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  for (let modelIndex = 0; modelIndex < aggregates.nModels; modelIndex++) {
    if (!(aggregates.modelExtra.listCost[modelIndex] > 0)) continue;
    out.input += aggregates.model.input[modelIndex];
    out.cacheRead += aggregates.model.cacheRead[modelIndex];
    out.cacheWrite += aggregates.model.cacheWrite[modelIndex];
    out.output += aggregates.model.output[modelIndex];
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
  return TOKEN_KINDS.map((kind) => {
    const tokens = counts[kind.key];
    const cost = totals.est[kind.key];
    return {
      key: kind.key,
      label: t(kind.label),
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
  const out: CacheBucket[] = Array.from({ length: 5 }, (_, bucketIndex) => ({
    label: t('{lo} to {hi}%', { lo: bucketIndex * 20, hi: (bucketIndex + 1) * 20 }),
    lo: bucketIndex * 0.2,
    hi: (bucketIndex + 1) * 0.2,
    users: 0,
    gross: 0,
  }));
  for (const user of profiles) {
    if (!Number.isFinite(user.cacheHit)) continue;
    const bucketIndex = Math.min(4, Math.max(0, Math.floor(user.cacheHit * 5 + 1e-9)));
    out[bucketIndex].users++;
    out[bucketIndex].gross += user.gross;
  }
  return out;
}

/** Heavy users (usage at or above `minSpend`) with the lowest cache hit rate, lowest first. */
export function lowCacheHeavyUsers(profiles: UserProfile[], minSpend: number, limit: number): UserProfile[] {
  return profiles
    .filter((user) => user.gross >= minSpend && Number.isFinite(user.cacheHit))
    .sort((a, b) => a.cacheHit - b.cacheHit || b.gross - a.gross)
    .slice(0, limit);
}

/** The cache tip when the user has one, otherwise the most important tip. */
export function cacheTip(user: UserProfile, settings: Settings): UserTip | undefined {
  const tips = userTips(user, settings, 12);
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
  const known = profiles.filter((user) => Number.isFinite(user.utilization));
  const total = known.reduce((sum, user) => sum + user.gross, 0);
  return ids.map((id) => {
    const inTier = known.filter((user) => user.tier === id);
    const gross = inTier.reduce((sum, user) => sum + user.gross, 0);
    return { id, users: inTier.length, gross, share: total > 0 ? gross / total : 0 };
  });
}

/** Users whose plan quota is not in the report, so a default allotment was assumed for them. */
export const assumedAllotmentUsers = (profiles: UserProfile[]): number => profiles.filter((user) => !(user.quotaCredits > 0)).length;

/* Cost per active day */

const hasCostPerDay = (user: UserProfile): boolean => user.activeDays > 0 && Number.isFinite(user.costPerActiveDay);

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
  const sorted = active.map((user) => user.costPerActiveDay).sort((a, b) => a - b);
  const maxUser = active.reduce((highest, user) => (user.costPerActiveDay > highest.costPerActiveDay ? user : highest));
  return { users: sorted.length, median: median(sorted), p75: quantile(sorted, 0.75), p90: quantile(sorted, 0.9), max: maxUser.costPerActiveDay, maxUser };
}

export function topCostPerDay(profiles: UserProfile[], limit: number): UserProfile[] {
  return profiles
    .filter(hasCostPerDay)
    .sort((a, b) => b.costPerActiveDay - a.costPerActiveDay)
    .slice(0, limit);
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

export function topOpportunities(profiles: UserProfile[], perMonth: number, limit: number): Opportunities {
  const ranked = profiles.filter((user) => user.potential > 0).sort((a, b) => b.potential - a.potential);
  const rows = ranked.slice(0, limit).map((user): Opportunity => {
    const sum = LEVER_ORDER.reduce((total, id) => total + user.potentialBy[id], 0);
    const scale = sum > user.potential && sum > 0 ? user.potential / sum : 1;
    const by = {} as Record<LeverStep['id'], number>;
    for (const id of LEVER_ORDER) by[id] = user.potentialBy[id] * scale * perMonth;
    return { profile: user, total: user.potential * perMonth, by };
  });
  return {
    rows,
    shownTotal: rows.reduce((total, row) => total + row.total, 0),
    allTotal: ranked.reduce((total, user) => total + user.potential, 0) * perMonth,
    withSaving: ranked.length,
  };
}

/* Role models */

export function roleModels(profiles: UserProfile[], settings: Settings): UserProfile[] {
  return profiles
    .filter(
      (user) =>
        user.gross >= settings.minSpendForTraits &&
        user.activeDays >= ROLE_MODEL_MIN_ACTIVE_DAYS &&
        (user.engagement === 'daily' || user.engagement === 'regular') &&
        user.tier !== 'runaway' &&
        user.autoShare >= ROLE_MODEL_MIN_AUTO &&
        (!Number.isFinite(user.cacheHit) || user.cacheHit >= ROLE_MODEL_MIN_CACHE_HIT) &&
        (user.profile === 'efficient' || user.efficiency >= ROLE_MODEL_MIN_EFFICIENCY),
    )
    .sort((a, b) => b.efficiency - a.efficiency || b.gross - a.gross)
    .slice(0, ROLE_MODEL_MAX);
}

/** A few sentences about what a user does well, built from their own numbers (at most three points). */
export function strengthsText(user: UserProfile): string {
  const parts: string[] = [];
  const lighter = user.versatileShare + user.lightweightShare;
  if (user.profile === 'efficient') parts.push(t('Mid-tier and lighter models make up {share} of usage.', { share: fmtPct(lighter, 0) }));
  else if (user.powerfulShare < POWERFUL_SHARE_HEALTHY) parts.push(t('Powerful models take only {share} of usage.', { share: fmtPct(user.powerfulShare, 0) }));
  if (user.autoShare >= AUTO_SHARE_HEALTHY) parts.push(t('Auto handles {share} of usage.', { share: fmtPct(user.autoShare, 0) }));
  if (Number.isFinite(user.cacheHit) && user.cacheHit >= CACHE_HIT_HEALTHY) parts.push(t('{share} of prompt tokens are read from the cache.', { share: fmtPct(user.cacheHit, 0) }));
  if (user.longShare < LONG_CONTEXT_HEALTHY && parts.length < 3) parts.push(t('Long-context surcharges are close to zero.'));
  if (!parts.length) return t('Gets more done per credit than most users, with an efficiency score of {score} out of 100.', { score: Math.round(user.efficiency) });
  return parts.slice(0, 3).join(' ');
}
