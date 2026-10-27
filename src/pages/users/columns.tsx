import { VendorIcon } from '../../components/icons';
import { ProgressBar, TaxBadge, cx, taxLookup, type Column } from '../../components/ui';
import { hasQuota, shortItem, signedUsd, withOthers } from '../../components/user/shared';
import { msg, t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { inferVendor } from '../../lib/pricing/models';
import { fmtInt, fmtPct, fmtPctAuto } from '../../lib/utils/format';
import { autoColumns } from './autoColumns';
import { NO_BILLING, NO_MODELS, NO_TOKENS, dash, sum, usd, withReason, type ColumnContext } from './columnKit';
import { licenseColumns } from './licenseColumns';
import { tokenColumns } from './tokenColumns';

export type { ColumnContext } from './columnKit';

const MAX_TRAIT_BADGES = 3;

export type UsersView = 'general' | 'tokens' | 'auto' | 'license';

/** The views of the users table. `license` exists only while a license list is loaded. */
export const USERS_VIEWS: { value: UsersView; label: string; title: string }[] = [
  { value: 'general', label: msg('General'), title: msg('Usage, billing, activity and classes') },
  { value: 'tokens', label: msg('Tokens'), title: msg('Input, cache read, cache write and output tokens per user') },
  { value: 'auto', label: msg('Auto'), title: msg('Auto against hand-picked models per user') },
  { value: 'license', label: msg('License'), title: msg('The seat of each user in the license list') },
];

/** Columns a view shows first, in this order. Every other column of the table stays in the Columns menu. */
const VIEW_FIRST: Record<Exclude<UsersView, 'general'>, string[]> = {
  tokens: ['user', 'gross', 'tokenInput', 'tokenCacheRead', 'tokenCacheWrite', 'tokenOutput', 'tokenTotal', 'cacheHit', 'costInput', 'costCacheRead', 'costCacheWrite', 'costOutput', 'tokenCoverage'],
  auto: ['user', 'plan', 'gross', 'autoShare', 'autoDiscount', 'autoOriginal', 'handPicked', 'autoMissed', 'autoUse'],
  license: ['user', 'gross', 'seatStatus', 'seatPlan', 'lastActivity', 'daysSinceActivity', 'lastSurface', 'daysSinceLast'],
};

export const VIEW_SORT: Record<UsersView, { key: string; dir: 'asc' | 'desc' }> = {
  general: { key: 'gross', dir: 'desc' },
  tokens: { key: 'tokenTotal', dir: 'desc' },
  auto: { key: 'autoMissed', dir: 'desc' },
  license: { key: 'gross', dir: 'desc' },
};

export interface UserColumns {
  /** Every column of every view, each once. This is what the full CSV download uses. */
  all: Column<UserProfile>[];
  byView: Record<UsersView, Column<UserProfile>[]>;
  /** The License view and its columns exist (a license list is loaded). */
  hasLicense: boolean;
}

export function buildColumns(ctx: ColumnContext): UserColumns {
  const hasLicense = ctx.hasLicense === true;
  const general = generalColumns(ctx);
  const tokens = tokenColumns(ctx);
  const auto = autoColumns(ctx);
  const license = hasLicense ? licenseColumns() : [];
  const all = [...general, ...tokens, ...auto, ...license];
  const byKey = new Map(all.map((c) => [c.key, c]));
  const extra: Record<Exclude<UsersView, 'general'>, Column<UserProfile>[]> = { tokens, auto, license };
  const forView = (view: Exclude<UsersView, 'general'>): Column<UserProfile>[] => {
    const first = VIEW_FIRST[view];
    const head = first.flatMap((k) => {
      const c = byKey.get(k);
      return c ? [{ ...c, hidden: false }] : [];
    });
    const pool = [...general, ...extra[view]];
    const rest = pool.filter((c) => !first.includes(c.key)).map((c) => ({ ...c, hidden: true }));
    return [...head, ...rest];
  };
  return {
    all,
    byView: { general, tokens: forView('tokens'), auto: forView('auto'), license: hasLicense ? forView('license') : general },
    hasLicense,
  };
}

function generalColumns({ taxonomy, trendReliable, coverage }: ColumnContext): Column<UserProfile>[] {
  const personas = taxLookup(taxonomy.personas);
  const tiers = taxLookup(taxonomy.tiers);
  const engagement = taxLookup(taxonomy.engagement);
  const profiles = taxLookup(taxonomy.profiles);
  const pareto = taxLookup(taxonomy.pareto);
  const traits = taxLookup(taxonomy.traits);
  const change = (p: UserProfile): number => (trendReliable ? p.recent - p.prior : Number.NaN);
  const billingKnown = coverage.billing;
  const noBilling = withReason(NO_BILLING);
  const noModels = withReason(NO_MODELS);
  const noTokens = withReason(NO_TOKENS);
  const noBillingText = t(NO_BILLING);
  const noModelsText = t(NO_MODELS);
  const noTokensText = t(NO_TOKENS);

  return [
    {
      key: 'rank',
      header: t('Rank'),
      hint: t('Position by usage among all users in the date range'),
      calc: 'user-share',
      value: (p) => p.rank,
      render: (p) => fmtInt(p.rank),
      align: 'end',
    },
    {
      key: 'user',
      header: t('User'),
      value: (p) => p.name,
      render: (p) => (
        <span className="block max-w-[14rem] truncate font-medium" title={p.name}>
          {p.name}
        </span>
      ),
    },
    {
      key: 'persona',
      header: t('Persona'),
      hint: t('The kind of user, from how often and how much they use GitHub Copilot'),
      calc: 'persona-groups',
      value: (p) => personas[p.persona].label,
      render: (p) => <TaxBadge item={personas[p.persona]} />,
    },
    {
      key: 'tier',
      header: t('Usage tier'),
      hint: t('Usage compared with the included credits of the seat'),
      calc: 'spend-tiers',
      value: (p) => tiers[p.tier].label,
      render: (p) => <TaxBadge item={shortItem(tiers[p.tier])} />,
    },
    {
      key: 'engagement',
      header: t('Engagement'),
      hint: t('How often the user is active: the share of workdays with use'),
      calc: 'engagement-levels',
      value: (p) => engagement[p.engagement].label,
      render: (p) => <TaxBadge item={engagement[p.engagement]} />,
      hidden: true,
    },
    {
      key: 'profile',
      header: t('Usage profile'),
      hint: coverage.models ? t('Which kind of model the user mostly uses: Efficient, Balanced or Frontier-heavy') : noModelsText,
      calc: 'usage-profiles',
      value: (p) => (coverage.models ? profiles[p.profile].label : ''),
      render: (p) => (coverage.models ? <TaxBadge item={profiles[p.profile]} /> : noModels),
      hidden: true,
    },
    {
      key: 'pareto',
      header: t('Pareto class'),
      hint: t(
        'A: the users who make the first part of all usage. B: the next part. C: the long tail. Based on all users in the date range, not on the persona, tier or Auto use filters.',
      ),
      calc: 'pareto-classes',
      value: (p) => pareto[p.pareto].label,
      render: (p) => <TaxBadge item={pareto[p.pareto]} />,
      hidden: true,
    },
    {
      key: 'plan',
      header: t('Plan'),
      hint: t('The seat of the user, from the included credits in the file'),
      calc: 'user-credits-used',
      value: (p) => (hasQuota(p) ? p.plan : ''),
      render: (p) => (hasQuota(p) ? p.plan : dash),
      hidden: true,
    },
    {
      key: 'org',
      header: t('Organization'),
      value: (p) => withOthers(p.org, p.orgMixed),
      render: (p) => (p.org ? withOthers(p.org, p.orgMixed) : dash),
      hidden: true,
    },
    {
      key: 'costCenter',
      header: t('Cost center'),
      value: (p) => withOthers(p.costCenter, p.costCenterMixed),
      render: (p) => (p.costCenter ? withOthers(p.costCenter, p.costCenterMixed) : dash),
      hidden: true,
    },
    {
      key: 'gross',
      header: t('Usage'),
      hint: t('Usage in the date range, before included credits'),
      calc: 'usage',
      value: (p) => p.gross,
      render: (p) => usd(p.gross),
      align: 'end',
      total: (rows) => usd(sum(rows, (p) => p.gross)),
    },
    {
      key: 'share',
      header: t('Share of usage'),
      hint: t('Share of the usage of all users in the date range'),
      calc: 'user-share',
      value: (p) => p.share,
      render: (p) => fmtPct(p.share, 1),
      align: 'end',
      total: (rows) => fmtPct(sum(rows, (p) => p.share), 1),
    },
    {
      key: 'net',
      header: t('Billed'),
      hint: billingKnown
        ? t('Billed on top of seats, as the file states it. The included credits are pooled, so a user can be billed while below their own credits.')
        : noBillingText,
      calc: 'billed',
      value: (p) => (billingKnown ? p.net : Number.NaN),
      render: (p) => (billingKnown ? usd(p.net) : noBilling),
      align: 'end',
      total: (rows) => (billingKnown ? usd(sum(rows, (p) => p.net)) : '–'),
    },
    {
      key: 'discount',
      header: t('Covered'),
      hint: billingKnown ? t('Usage covered by included credits') : noBillingText,
      calc: 'covered',
      value: (p) => (billingKnown ? p.discount : Number.NaN),
      render: (p) => (billingKnown ? usd(p.discount) : noBilling),
      align: 'end',
      total: (rows) => (billingKnown ? usd(sum(rows, (p) => p.discount)) : '–'),
      hidden: true,
    },
    {
      key: 'utilization',
      header: t('Included credits used'),
      hint: t('Usage as a share of the included credits of the seat. Above 100% means the user drew from the shared pool.'),
      calc: 'user-credits-used',
      value: (p) => (hasQuota(p) ? p.utilization : Number.NaN),
      render: (p) =>
        hasQuota(p) ? (
          <div className="flex items-center justify-end gap-2">
            <ProgressBar value={p.utilization} height={6} className="hidden w-14 sm:block" label={t('Included credits used')} />
            <span className="w-14 text-end">{fmtPctAuto(p.utilization)}</span>
          </div>
        ) : (
          dash
        ),
      align: 'end',
    },
    {
      key: 'balance',
      header: t('Balance'),
      hint: t('Included credits minus usage. Negative means the user drew from the shared pool.'),
      calc: 'user-credits-used',
      value: (p) => (hasQuota(p) ? p.balance : Number.NaN),
      render: (p) => (hasQuota(p) ? <span className={cx(p.balance < 0 && 'text-bad')}>{usd(p.balance)}</span> : dash),
      align: 'end',
      hidden: true,
    },
    {
      key: 'activeDays',
      header: t('Active days'),
      hint: t('Days with real use in the date range'),
      calc: 'user-active-days',
      value: (p) => p.activeDays,
      render: (p) => fmtInt(p.activeDays),
      align: 'end',
    },
    {
      key: 'activeRate',
      header: t('Active rate'),
      hint: t('Share of workdays with use since the user started'),
      calc: 'user-active-rate',
      value: (p) => p.activeRate,
      render: (p) => fmtPct(p.activeRate, 0),
      align: 'end',
      hidden: true,
    },
    {
      key: 'daysSinceLast',
      header: t('Days since last use'),
      hint: t('Days between the last day with use and the end of the date range'),
      calc: 'user-days-since-last',
      value: (p) => p.daysSinceLast,
      render: (p) => fmtInt(p.daysSinceLast),
      align: 'end',
      hidden: true,
    },
    {
      key: 'costPerActiveDay',
      header: t('Cost per active day'),
      hint: t('Usage divided by active days'),
      calc: 'user-cost-per-active-day',
      value: (p) => p.costPerActiveDay,
      render: (p) => (Number.isFinite(p.costPerActiveDay) ? usd(p.costPerActiveDay) : dash),
      align: 'end',
      hidden: true,
    },
    {
      key: 'autoShare',
      header: t('Auto share of usage'),
      hint: coverage.models ? t('Share of usage on Auto model selection') : noModelsText,
      calc: 'auto-share',
      value: (p) => (coverage.models ? p.autoShare : Number.NaN),
      render: (p) => (coverage.models ? fmtPct(p.autoShare, 0) : noModels),
      align: 'end',
      hidden: true,
    },
    {
      key: 'cacheHit',
      header: t('Cache hit rate'),
      hint: coverage.tokens ? t('Share of prompt tokens read from the cache, where text the model has seen before costs less') : noTokensText,
      calc: 'cache-hit',
      value: (p) => (coverage.tokens ? p.cacheHit : Number.NaN),
      render: (p) => (!coverage.tokens ? noTokens : Number.isFinite(p.cacheHit) ? fmtPct(p.cacheHit, 0) : dash),
      align: 'end',
      hidden: true,
    },
    {
      key: 'topModel',
      header: t('Top model'),
      hint: coverage.models ? t('The model with the most usage for this user') : noModelsText,
      calc: 'user-model-mix',
      value: (p) => p.topModel,
      render: (p) =>
        p.topModel ? (
          <span className="flex max-w-[14rem] items-center gap-1.5" title={t('{model}: {share} of usage', { model: p.topModel, share: fmtPct(p.topModelShare, 0) })}>
            <VendorIcon vendor={inferVendor(p.topModel)} size={12} className="shrink-0 text-fg-muted" />
            <span className="truncate">{p.topModel}</span>
          </span>
        ) : coverage.models ? (
          dash
        ) : (
          noModels
        ),
      hidden: true,
    },
    {
      key: 'change',
      header: t('7-day change'),
      hint: t('Usage in the last 7 days minus the 7 days before. Needs a range of at least 14 days.'),
      calc: ['user-change', 'week-over-week'],
      value: change,
      render: (p) => {
        const v = change(p);
        if (!Number.isFinite(v)) return dash;
        const vars = { recent: usd(p.recent), prior: usd(p.prior) };
        const title = Number.isFinite(p.trend)
          ? t('{recent} in the last 7 days, {prior} in the 7 days before ({change})', { ...vars, change: `${p.trend >= 0 ? '+' : '−'}${fmtPct(Math.abs(p.trend), 0)}` })
          : t('{recent} in the last 7 days, {prior} in the 7 days before', vars);
        return (
          <span className={cx(Math.abs(v) < 0.005 && 'text-fg-muted')} title={title}>
            {signedUsd(v)}
          </span>
        );
      },
      align: 'end',
    },
    {
      key: 'potential',
      header: t('Potential savings'),
      hint: t('Usage that could be avoided with the levers in this report. An estimate.'),
      calc: 'user-potential',
      value: (p) => p.potential,
      render: (p) => usd(p.potential),
      align: 'end',
      total: (rows) => usd(sum(rows, (p) => p.potential)),
    },
    {
      key: 'traits',
      header: t('Traits'),
      hint: t('Habits worth a look. Hover a badge to see what it means.'),
      calc: 'user-traits',
      value: (p) => p.traits.map((id) => traits[id].label).join(', '),
      render: (p) =>
        p.traits.length === 0 ? (
          dash
        ) : (
          <div className="flex items-center gap-1">
            {p.traits.slice(0, MAX_TRAIT_BADGES).map((id) => (
              <TaxBadge key={id} item={traits[id]} />
            ))}
            {p.traits.length > MAX_TRAIT_BADGES ? (
              <span className="text-xs text-fg-muted" title={p.traits.slice(MAX_TRAIT_BADGES).map((id) => traits[id].label).join(', ')}>
                +{p.traits.length - MAX_TRAIT_BADGES}
              </span>
            ) : null}
          </div>
        ),
      sortable: false,
    },
  ];
}

/** Every column of the table, for the full CSV download. */
export function userTableCsv(columns: Column<UserProfile>[], rows: UserProfile[]): { headers: string[]; rows: unknown[][] } {
  const cols = columns.filter((c) => !c.noCsv);
  return {
    headers: cols.map((c) => c.csvHeader ?? (typeof c.header === 'string' ? c.header : c.key)),
    rows: rows.map((r) => cols.map((c) => c.value(r) ?? '')),
  };
}
