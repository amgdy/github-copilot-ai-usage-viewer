import { fmtCount, hasQuota } from '../../components/user/shared';
import { msg, t } from '../../i18n';
import type { Taxonomy, TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct, fmtPctAuto, fmtUSD, pluralize } from '../../lib/utils/format';

export type MetricId =
  | 'gross'
  | 'net'
  | 'utilization'
  | 'activeDays'
  | 'costPerActiveDay'
  | 'potential'
  | 'change'
  | 'tokenTotal'
  | 'tokenOutput'
  | 'tokenInput'
  | 'tokenCacheRead'
  | 'tokenCacheWrite'
  | 'cacheHit'
  | 'autoShare'
  | 'autoDiscount'
  | 'autoOriginal'
  | 'autoMissed';

/** `high` lists the biggest values first, `low` the smallest. */
export type RankDir = 'high' | 'low';

export type MetricGroup = 'usage' | 'tokens' | 'auto';

/** English labels of the groups, translated where they are shown. */
export const METRIC_GROUP_LABELS: Record<MetricGroup, string> = {
  usage: msg('Usage and credits'),
  tokens: msg('Tokens'),
  auto: msg('Auto model selection'),
};

export interface MetricContext {
  /** Users with less usage than this are left out of ratio metrics, where tiny amounts are noise. */
  minSpend: number;
  trendReliable: boolean;
  quotaKnown: boolean;
  /** The file has token columns. */
  hasTokens: boolean;
  /** The file has a model column, so Auto usage can be told apart. */
  hasModels: boolean;
}

export interface RankMetric {
  id: MetricId;
  /** English label, translated where it is shown. */
  label: string;
  group: MetricGroup;
  /** English sentence, translated where it is shown. */
  about: string;
  /** Id of the doc that explains the measure. */
  calc: string;
  /** Second line of the tooltip of a bar. Defaults to the usage of the user. */
  note?: (p: UserProfile) => string;
  /** Value to rank by. NaN leaves the user out. */
  value: (p: UserProfile, ctx: MetricContext, dir: RankDir) => number;
  format: (v: number, dir: RankDir) => string;
  /** The list can be turned around (smallest first). */
  directional: boolean;
  defaultDir: RankDir;
  /** English labels of the two orders, translated where they are shown. */
  dirLabels?: Record<RankDir, string>;
  /** The value already includes the direction, so the list is always sorted from the largest value. */
  flips?: boolean;
  /** Users with a value of zero or less are left out. */
  positiveOnly?: boolean;
  /** A whole translated sentence that says which users are left out of the ranking. */
  skipReason: (ctx: MetricContext, dir: RankDir) => string;
  /** Explains an empty ranking, as a whole translated sentence. */
  missing: (ctx: MetricContext, dir: RankDir) => string;
}

const enough = (p: UserProfile, ctx: MetricContext): boolean => p.gross >= ctx.minSpend;

const ratioReason = (ctx: MetricContext): string =>
  t('Users with less than {amount} of usage are left out.', { amount: fmtUSD(ctx.minSpend, 0) });
const notEnough = (ctx: MetricContext): string =>
  t('Nobody has at least {amount} of usage in this range.', { amount: fmtUSD(ctx.minSpend, 0) });

const noTokenColumns = (): string => t('The file has no token columns.');
const noModelNames = (): string => t('The file has no model names.');
const noTokenRanking = (): string => t('This file has no token columns, so users cannot be ranked by tokens.');
const tokenSkip = (ctx: MetricContext, reason: string): string => (ctx.hasTokens ? t(reason) : noTokenColumns());
const tokenMissing = (ctx: MetricContext, reason: string): string => (ctx.hasTokens ? t(reason) : noTokenRanking());

export const RANK_METRICS: RankMetric[] = [
  {
    id: 'gross',
    label: msg('Usage'),
    group: 'usage',
    about: msg('Everything the user used, before included credits.'),
    calc: 'usage',
    note: (p) => t('{share} of all usage', { share: fmtPct(p.share) }),
    value: (p) => p.gross,
    format: (v) => fmtUSD(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: () => t('Users with no usage are left out.'),
    missing: () => t('Nobody has usage in this range.'),
  },
  {
    id: 'net',
    label: msg('Billed'),
    group: 'usage',
    about: msg('Amount billed on top of licenses, after included credits.'),
    calc: 'billed',
    value: (p) => p.net,
    format: (v) => fmtUSD(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: () => t('Users with nothing billed on top of their license are left out.'),
    missing: () => t('Nothing was billed on top of licenses in this range. Included credits covered all usage.'),
  },
  {
    id: 'utilization',
    label: msg('Included credits used'),
    group: 'usage',
    about: msg('Usage as a share of the included credits of the license.'),
    calc: 'user-credits-used',
    value: (p, _ctx, dir) => (!hasQuota(p) || (dir === 'low' && p.isNew) ? Number.NaN : p.utilization),
    format: (v) => fmtPctAuto(v),
    directional: true,
    defaultDir: 'high',
    dirLabels: { high: msg('Most used'), low: msg('Least used') },
    skipReason: (_ctx, dir) =>
      dir === 'low'
        ? t('New users and users whose included credits are unknown are left out.')
        : t('Users whose included credits are unknown are left out.'),
    missing: () => t('This file does not say how many included credits each user has, so this cannot be calculated.'),
  },
  {
    id: 'activeDays',
    label: msg('Active days'),
    group: 'usage',
    about: msg('Days with real use in the date range.'),
    calc: 'user-active-days',
    value: (p, _ctx, dir) => (dir === 'low' && p.isNew ? Number.NaN : p.activeDays),
    format: (v) => pluralize(v, 'day'),
    directional: true,
    defaultDir: 'high',
    dirLabels: { high: msg('Most days'), low: msg('Fewest days') },
    skipReason: () => t('New users are left out.'),
    missing: () => t('Nobody has active days in this range.'),
  },
  {
    id: 'costPerActiveDay',
    label: msg('Cost per active day'),
    group: 'usage',
    about: msg('Usage divided by active days. High values mean heavy days.'),
    calc: 'user-cost-per-active-day',
    value: (p) => p.costPerActiveDay,
    format: (v) => fmtUSD(v),
    directional: true,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: () => t('Users with no active days are left out.'),
    missing: () => t('Nobody has active days in this range.'),
  },
  {
    id: 'potential',
    label: msg('Potential savings'),
    group: 'usage',
    about: msg('Usage that could be avoided with the levers in this report.'),
    calc: 'user-potential',
    value: (p) => p.potential,
    format: (v) => fmtUSD(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: () => t('Users with no savings found are left out.'),
    missing: () => t('No savings were found for these users.'),
  },
  {
    id: 'change',
    label: msg('7-day change'),
    group: 'usage',
    about: msg('Usage in the last 7 days compared with the 7 days before.'),
    calc: 'user-change',
    value: (p, ctx, dir) =>
      ctx.trendReliable ? (dir === 'high' ? p.recent - p.prior : p.prior - p.recent) : Number.NaN,
    format: (v, dir) => `${dir === 'high' ? '+' : '−'}${fmtUSD(v)}`,
    directional: true,
    defaultDir: 'high',
    dirLabels: { high: msg('Biggest rise'), low: msg('Biggest drop') },
    flips: true,
    positiveOnly: true,
    skipReason: (_ctx, dir) =>
      dir === 'high' ? t('Users whose usage did not rise are left out.') : t('Users whose usage did not drop are left out.'),
    missing: (ctx, dir) =>
      ctx.trendReliable
        ? dir === 'high'
          ? t('Nobody used more in the last 7 days than in the 7 days before.')
          : t('Nobody used less in the last 7 days than in the 7 days before.')
        : t('The date range needs at least 14 days to compare the last 7 days with the 7 days before.'),
  },
  {
    id: 'tokenTotal',
    label: msg('Total tokens'),
    group: 'tokens',
    about: msg('Input, cache read, cache write and output tokens together.'),
    calc: 'tokens-total',
    value: (p, ctx) => (ctx.hasTokens ? p.tokens : Number.NaN),
    format: (v) => fmtCount(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => tokenSkip(ctx, msg('Users with no tokens are left out.')),
    missing: (ctx) => tokenMissing(ctx, msg('Nobody has tokens in this range.')),
  },
  {
    id: 'tokenOutput',
    label: msg('Output tokens'),
    group: 'tokens',
    about: msg('Tokens the models wrote back.'),
    calc: 'tokens-output',
    value: (p, ctx) => (ctx.hasTokens ? p.output : Number.NaN),
    format: (v) => fmtCount(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => tokenSkip(ctx, msg('Users with no output tokens are left out.')),
    missing: (ctx) => tokenMissing(ctx, msg('Nobody has output tokens in this range.')),
  },
  {
    id: 'tokenInput',
    label: msg('Input tokens'),
    group: 'tokens',
    about: msg('Tokens sent to the models that were not served from the cache and not written to it.'),
    calc: 'tokens-input',
    value: (p, ctx) => (ctx.hasTokens ? p.input : Number.NaN),
    format: (v) => fmtCount(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => tokenSkip(ctx, msg('Users with no input tokens are left out.')),
    missing: (ctx) => tokenMissing(ctx, msg('Nobody has input tokens in this range.')),
  },
  {
    id: 'tokenCacheRead',
    label: msg('Cache read tokens'),
    group: 'tokens',
    about: msg('Tokens served from the cache of the model, which costs less than sending them again.'),
    calc: 'tokens-cache-read',
    value: (p, ctx) => (ctx.hasTokens ? p.cacheRead : Number.NaN),
    format: (v) => fmtCount(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => tokenSkip(ctx, msg('Users with no cache read tokens are left out.')),
    missing: (ctx) => tokenMissing(ctx, msg('Nobody has cache read tokens in this range.')),
  },
  {
    id: 'tokenCacheWrite',
    label: msg('Cache write tokens'),
    group: 'tokens',
    about: msg('Tokens written to the cache of the model so that later requests can read them.'),
    calc: 'tokens-cache-write',
    value: (p, ctx) => (ctx.hasTokens ? p.cacheWrite : Number.NaN),
    format: (v) => fmtCount(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => tokenSkip(ctx, msg('Users with no cache write tokens are left out.')),
    missing: (ctx) => tokenMissing(ctx, msg('Nobody has cache write tokens in this range.')),
  },
  {
    id: 'cacheHit',
    label: msg('Cache hit rate'),
    group: 'tokens',
    about: msg('Share of the text sent to the model that was served from the cache. A higher rate is cheaper.'),
    calc: 'cache-hit',
    value: (p, ctx) => (ctx.hasTokens && enough(p, ctx) ? p.cacheHit : Number.NaN),
    format: (v) => fmtPct(v, 0),
    directional: true,
    defaultDir: 'low',
    skipReason: (ctx) =>
      ctx.hasTokens
        ? t('Users with less than {amount} of usage or no input tokens are left out.', { amount: fmtUSD(ctx.minSpend, 0) })
        : noTokenColumns(),
    missing: (ctx) => (ctx.hasTokens ? notEnough(ctx) : t('This file has no token columns, so the cache hit rate cannot be calculated.')),
  },
  {
    id: 'autoShare',
    label: msg('Auto share of usage'),
    group: 'auto',
    about: msg('Share of usage that went through Auto. A low share means more models picked by hand.'),
    calc: 'auto-share',
    note: (p) => t('{auto} of {usage} usage went through Auto', { auto: fmtUSD(p.auto.billed), usage: fmtUSD(p.gross) }),
    value: (p, ctx) => (ctx.hasModels && enough(p, ctx) ? p.autoShare : Number.NaN),
    format: (v) => fmtPct(v, 0),
    directional: true,
    defaultDir: 'low',
    skipReason: (ctx) => (ctx.hasModels ? ratioReason(ctx) : noModelNames()),
    missing: (ctx) =>
      ctx.hasModels ? notEnough(ctx) : t('This file has no model names, so the Auto share of usage cannot be calculated.'),
  },
  {
    id: 'autoDiscount',
    label: msg('Auto discount received'),
    group: 'auto',
    about: msg('What the Auto discount took off the original price of the Auto usage of the user.'),
    calc: 'auto-discount',
    note: (p) => t('{rate} off an original price of {price}', { rate: fmtPct(p.auto.rate, 1), price: fmtUSD(p.auto.original) }),
    value: (p, ctx) => (ctx.hasModels ? p.auto.discount : Number.NaN),
    format: (v) => fmtUSD(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => (ctx.hasModels ? t('Users who received no Auto discount are left out.') : noModelNames()),
    missing: (ctx) =>
      ctx.hasModels ? t('Nobody received an Auto discount in this range.') : t('This file has no model names, so the Auto discount cannot be calculated.'),
  },
  {
    id: 'autoOriginal',
    label: msg('Original price of Auto usage'),
    group: 'auto',
    about: msg('What the Auto usage of the user would have cost at price-card rates, without the Auto discount.'),
    calc: 'auto-original-price',
    note: (p) => t('{billed} charged after a discount of {discount}', { billed: fmtUSD(p.auto.billed), discount: fmtUSD(p.auto.discount) }),
    value: (p, ctx) => (ctx.hasModels ? p.auto.original : Number.NaN),
    format: (v) => fmtUSD(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => (ctx.hasModels ? t('Users with no Auto usage are left out.') : noModelNames()),
    missing: (ctx) =>
      ctx.hasModels
        ? t('Nobody has Auto usage in this range.')
        : t('This file has no model names, so the original price of Auto usage cannot be calculated.'),
  },
  {
    id: 'autoMissed',
    label: msg('Discount missed on hand-picked usage'),
    group: 'auto',
    about: msg('An estimate of the discount the user would have received on usage sent to models picked by hand, had it gone through Auto.'),
    calc: 'auto-missed',
    note: (p) => t('{amount} of hand-picked usage', { amount: fmtUSD(p.directBilled) }),
    value: (p, ctx) => (ctx.hasModels ? p.autoMissed : Number.NaN),
    format: (v) => fmtUSD(v),
    directional: false,
    defaultDir: 'high',
    positiveOnly: true,
    skipReason: (ctx) => (ctx.hasModels ? t('Users with no hand-picked usage are left out.') : noModelNames()),
    missing: (ctx) =>
      ctx.hasModels
        ? t('Nobody has hand-picked usage in this range.')
        : t('This file has no model names, so the discount missed on hand-picked usage cannot be calculated.'),
  },
];

export interface MetricGroupOptions {
  label: string;
  options: { value: MetricId; label: string }[];
}

const GROUP_ORDER: MetricGroup[] = ['usage', 'tokens', 'auto'];

/** The measures grouped for the picker, translated. Call it while rendering. */
export function rankMetricGroups(): MetricGroupOptions[] {
  return GROUP_ORDER.map((group) => ({
    label: t(METRIC_GROUP_LABELS[group]),
    options: RANK_METRICS.filter((m) => m.group === group).map((m) => ({ value: m.id, label: t(m.label) })),
  }));
}

export const DEFAULT_DIR_LABELS: Record<RankDir, string> = { high: msg('Highest first'), low: msg('Lowest first') };

export interface RankedUser {
  p: UserProfile;
  value: number;
}

export interface Ranking {
  ranked: RankedUser[];
  /** Users who have a value for this metric. */
  eligible: number;
  /** All users considered. */
  total: number;
}

export function rankUsers(
  profiles: readonly UserProfile[],
  metric: RankMetric,
  dir: RankDir,
  ctx: MetricContext,
  topN: number,
): Ranking {
  const rows: RankedUser[] = [];
  for (const p of profiles) {
    const value = metric.value(p, ctx, dir);
    if (!Number.isFinite(value)) continue;
    if (metric.positiveOnly && value <= 0) continue;
    rows.push({ p, value });
  }
  const ascending = metric.directional && dir === 'low' && !metric.flips;
  rows.sort((a, b) => (ascending ? a.value - b.value : b.value - a.value) || b.p.gross - a.p.gross);
  return { ranked: rows.slice(0, topN), eligible: rows.length, total: profiles.length };
}

export type ColorBy = 'persona' | 'tier' | 'engagement' | 'profile';

/** English labels, translated where they are shown. */
export const COLOR_BY_OPTIONS: { value: ColorBy; label: string }[] = [
  { value: 'persona', label: msg('Persona') },
  { value: 'tier', label: msg('Usage tier') },
  { value: 'engagement', label: msg('Engagement') },
  { value: 'profile', label: msg('Usage profile') },
];

export interface Categorizer {
  items: TaxonomyItem[];
  of: (p: UserProfile) => TaxonomyItem | undefined;
}

export function categorizer(taxonomy: Taxonomy, by: ColorBy): Categorizer {
  const items: TaxonomyItem[] =
    by === 'persona'
      ? taxonomy.personas
      : by === 'tier'
        ? taxonomy.tiers
        : by === 'engagement'
          ? taxonomy.engagement
          : taxonomy.profiles;
  const byId = new Map(items.map((i) => [i.id, i]));
  const key = (p: UserProfile): string =>
    by === 'persona' ? p.persona : by === 'tier' ? p.tier : by === 'engagement' ? p.engagement : p.profile;
  return { items, of: (p) => byId.get(key(p)) };
}
