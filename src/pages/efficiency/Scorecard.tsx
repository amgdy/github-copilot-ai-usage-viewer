import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { FeatureIcon } from '../../components/icons';
import { Badge, CalcInfo, CalcLine, Card, DocLinks, Section, cx, type Tone } from '../../components/ui';
import { T, t, tp } from '../../i18n';
import type { Analysis } from '../../lib/analytics/analyze';
import type { Filters } from '../../lib/analytics/filters';
import type { UserProfile } from '../../lib/analytics/users';
import type { LinkTopic } from '../../lib/links';
import { CATEGORIES } from '../../lib/types';
import { fmtCompact, fmtInt, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill, type PageId } from '../../state/router';
import {
  ACTIVE_USE_FAIR,
  ACTIVE_USE_HEALTHY,
  AUTO_SHARE_FAIR,
  AUTO_SHARE_HEALTHY,
  CACHE_HIT_FAIR,
  CACHE_HIT_HEALTHY,
  LONG_CONTEXT_FAIR,
  LONG_CONTEXT_HEALTHY,
  POWERFUL_SHARE_FAIR,
  POWERFUL_SHARE_HEALTHY,
  STATUS_LABEL,
  activeUseTarget,
  autoTarget,
  cacheTarget,
  higherIsBetter,
  longContextTarget,
  lowerIsBetter,
  powerfulTarget,
  runawayStatus,
  runawayTarget,
  type CheckStatus,
} from './thresholds';

export interface CheckJump {
  label: string;
  title: string;
  patch: Partial<Filters>;
  page: PageId;
}

export interface Check {
  id: 'auto' | 'cache' | 'powerful' | 'longContext' | 'runaway' | 'active';
  label: string;
  /** The id of the explanation of this check. */
  calc: string;
  /** The measured value as text; "–" when it cannot be measured. */
  value: string;
  detail?: string;
  target: string;
  /** Null when the check cannot be measured for this scope. */
  status: CheckStatus | null;
  why: string;
  todo: string;
  /** Official pages that help with the advice of the check. */
  topic: LinkTopic;
  jump?: CheckJump;
}

const POWERFUL = CATEGORIES.indexOf('Powerful');
const finite = (x: number): boolean => Number.isFinite(x);
const rate = (x: number): string => (finite(x) ? fmtPct(x, 1) : '–');

/** Why Auto matters, with the Auto discount as the report shows it: measured per plan, and the setting only where a plan has nothing to measure. */
function autoWhyText(analysis: Analysis): string {
  const auto = analysis.auto;
  const measuredPlans = auto.plans.filter((p) => p.source === 'measured').length;
  const assumedPlans = auto.plans.length - measuredPlans;
  const discount = { rate: fmtPct(auto.rate, 1) };
  const second =
    auto.billed <= 0
      ? t('Where the plan has an Auto discount, the same work costs less.')
      : auto.discount <= 0.005
        ? t('This report shows no Auto discount, so any gain comes from a fitting model, not from a lower price.')
        : assumedPlans === 0
          ? t('In this report Auto usage received a {rate} discount from its original price. The rate is measured from the token counts of each plan.', discount)
          : measuredPlans === 0
            ? t('The Auto usage in this report could not be priced from token counts. Its discount of about {rate} comes from the setting Auto model discount.', discount)
            : t(
                'In this report Auto usage received about a {rate} discount from its original price. Plans with Auto usage priced from token counts use their measured rate. The setting Auto model discount is used only for the other plans.',
                discount,
              );
  return `${t('Auto picks a fitting model for each request.')} ${second}`;
}

/** The six best-practice checks for the users and usage in scope. Pure, so it can be tested without React. */
export function buildChecks(analysis: Analysis, hasTokens: boolean): Check[] {
  const tot = analysis.agg.totals;
  const profiles = analysis.users.profiles;
  const n = profiles.length;
  const count = (f: (p: UserProfile) => boolean): number => profiles.filter(f).length;
  const gross = tot.gross;

  const modelsKnown = analysis.coverage.models;
  const autoShare = gross > 0 && modelsKnown ? tot.autoGross / gross : Number.NaN;
  const prompt = tot.input + tot.cacheRead + tot.cacheWrite;
  const cacheHit = hasTokens && prompt > 0 ? tot.cacheRead / prompt : Number.NaN;
  const powerfulGross = tot.tierGross[POWERFUL] ?? 0;
  const powerfulShare = gross > 0 && modelsKnown ? powerfulGross / gross : Number.NaN;
  // The premium is only measured on rows that could be priced from token counts, so without any it is unknown, not zero.
  const longMeasured = hasTokens && modelsKnown && tot.pricedGross > 0;
  const longShare = longMeasured && gross > 0 ? tot.longPremium / gross : Number.NaN;
  const runaway = count((p) => p.tier === 'runaway');
  const active = count((p) => p.engagement === 'daily' || p.engagement === 'regular');
  const activeShare = n > 0 ? active / n : Number.NaN;

  const lowAuto = count((p) => p.traits.includes('lowAuto'));
  const lowCache = count((p) => p.traits.includes('lowCache'));
  const frontier = count((p) => p.profile === 'frontier');
  const longCtx = count((p) => p.traits.includes('longContext'));
  const quiet = count((p) => p.engagement === 'occasional' || p.engagement === 'rare');

  const jump = (c: number, label: string, patch: Partial<Filters>, title: string): CheckJump | undefined => (c > 0 ? { label, title, patch, page: 'users' } : undefined);
  const nUsers = (c: number) => ({ n: fmtInt(c) });

  const needsTokens = t('Needs token columns');
  const needsModels = t('Needs a model column');
  const noUsage = t('No usage in this scope');
  const noUsers = t('No users in this scope');
  const noModelsDetail = t('This report names no models, so the model mix cannot be measured.');

  const cacheValue = !hasTokens ? needsTokens : rate(cacheHit);
  const cacheDetail = !hasTokens
    ? t('This report has no token columns, so the cache hit rate cannot be measured.')
    : finite(cacheHit)
      ? t('Cache read: {read} tokens. Cache write: {write} tokens. All prompt tokens: {prompt}.', {
          read: fmtCompact(tot.cacheRead),
          write: fmtCompact(tot.cacheWrite),
          prompt: fmtCompact(prompt),
        })
      : t('No prompt tokens in this scope');

  const longValue = !hasTokens ? needsTokens : !modelsKnown ? needsModels : rate(longShare);
  const longDetail = !hasTokens
    ? t('This report has no token columns, so long-context surcharges cannot be measured.')
    : !modelsKnown
      ? t('This report names no models, so long-context surcharges cannot be measured.')
      : gross <= 0
        ? noUsage
        : !longMeasured
          ? t('No usage could be priced from token counts, so long-context surcharges cannot be measured.')
          : t('{premium} surcharge on {usage} usage', { premium: fmtUSD(tot.longPremium, 0), usage: fmtUSD(gross, 0) });

  return [
    {
      id: 'auto',
      label: t('Auto share of usage'),
      calc: 'scorecard-auto',
      value: modelsKnown ? rate(autoShare) : needsModels,
      detail: !modelsKnown
        ? noModelsDetail
        : gross > 0
          ? t('{auto} of {usage} usage went through Auto', { auto: fmtUSD(tot.autoGross, 0), usage: fmtUSD(gross, 0) })
          : noUsage,
      target: autoTarget(),
      status: finite(autoShare) ? higherIsBetter(autoShare, AUTO_SHARE_HEALTHY, AUTO_SHARE_FAIR) : null,
      why: autoWhyText(analysis),
      todo: t('Make Auto the default in the model picker. Pick a model by hand only when a task needs it.'),
      topic: 'auto',
      jump: jump(
        lowAuto,
        tp(lowAuto, 'Show {n} user with low Auto use', 'Show {n} users with low Auto use', nUsers(lowAuto)),
        { traits: ['lowAuto'] },
        t('Open the Users page, filtered to people who rarely use Auto'),
      ),
    },
    {
      id: 'cache',
      label: t('Cache hit rate'),
      calc: 'scorecard-cache',
      value: cacheValue,
      detail: cacheDetail,
      target: cacheTarget(),
      status: finite(cacheHit) ? higherIsBetter(cacheHit, CACHE_HIT_HEALTHY, CACHE_HIT_FAIR) : null,
      why: t(
        'Cache read tokens are text the model has seen before and reads again at a lower price. Cache write tokens store new text for later and cost more. A steady chat reads more from the cache than one that starts over.',
      ),
      todo: t('Stay in one chat and one model for each task. Avoid restarting chats or editing instructions in the middle of a task.'),
      topic: 'caching',
      jump: hasTokens
        ? jump(
            lowCache,
            tp(lowCache, 'Show {n} user with low cache reuse', 'Show {n} users with low cache reuse', nUsers(lowCache)),
            { traits: ['lowCache'] },
            t('Open the Users page, filtered to people with a low cache hit rate'),
          )
        : undefined,
    },
    {
      id: 'powerful',
      label: t('Powerful-tier share of usage'),
      calc: 'scorecard-powerful',
      value: modelsKnown ? rate(powerfulShare) : needsModels,
      detail: !modelsKnown
        ? noModelsDetail
        : gross > 0
          ? t('{powerful} of {usage} usage ran on Powerful models', { powerful: fmtUSD(powerfulGross, 0), usage: fmtUSD(gross, 0) })
          : noUsage,
      target: powerfulTarget(),
      status: finite(powerfulShare) ? lowerIsBetter(powerfulShare, POWERFUL_SHARE_HEALTHY, POWERFUL_SHARE_FAIR) : null,
      why: t('Powerful models cost the most per request. Most everyday tasks do not need them.'),
      todo: t('Use Versatile or Lightweight models for routine work. Keep Powerful models for hard problems.'),
      topic: 'modelChoice',
      jump: jump(
        frontier,
        tp(frontier, 'Show {n} user on mostly Powerful models', 'Show {n} users on mostly Powerful models', nUsers(frontier)),
        { profiles: ['frontier'] },
        t('Open the Users page, filtered to people who put most of their usage on Powerful models'),
      ),
    },
    {
      id: 'longContext',
      label: t('Long-context premium'),
      calc: 'scorecard-long-context',
      value: longValue,
      detail: longDetail,
      target: longContextTarget(),
      status: finite(longShare) ? lowerIsBetter(longShare, LONG_CONTEXT_HEALTHY, LONG_CONTEXT_FAIR) : null,
      why: t('Prompts above the size limit of a model are charged at a higher rate. Very long prompts add a surcharge.'),
      todo: t('Point to fewer files, summarize long chats, split big tasks and use /compact often.'),
      topic: 'context',
      jump: jump(
        longCtx,
        tp(longCtx, 'Show {n} user with long-context surcharges', 'Show {n} users with long-context surcharges', nUsers(longCtx)),
        { traits: ['longContext'] },
        t('Open the Users page, filtered to people with long-context surcharges'),
      ),
    },
    {
      id: 'runaway',
      label: t('Users in the runaway tier'),
      calc: 'scorecard-runaway',
      value: n > 0 ? (runaway === 0 ? t('None') : pluralize(runaway, 'user')) : '–',
      detail: n > 0 ? tp(n, '{share} of {n} user', '{share} of {n} users', { share: fmtPct(runaway / n, 1), n: fmtInt(n) }) : noUsers,
      target: runawayTarget(),
      status: n > 0 ? runawayStatus(runaway, n) : null,
      why: t('One user far beyond their own included credits can use up the shared pool for everybody.'),
      todo: t('Look at how they work. Move routine work to lighter models and think about a user budget.'),
      topic: 'budgets',
      jump: jump(
        runaway,
        tp(runaway, 'Show {n} user in the runaway tier', 'Show {n} users in the runaway tier', nUsers(runaway)),
        { tiers: ['runaway'] },
        t('Open the Users page, filtered to the runaway tier'),
      ),
    },
    {
      id: 'active',
      label: t('Active use'),
      calc: 'scorecard-active-use',
      value: rate(activeShare),
      detail: n > 0 ? t('Daily or regular users: {active} of {n}', { active: fmtInt(active), n: fmtInt(n) }) : noUsers,
      target: activeUseTarget(),
      status: finite(activeShare) ? higherIsBetter(activeShare, ACTIVE_USE_HEALTHY, ACTIVE_USE_FAIR) : null,
      why: t('A seat pays off only when it is used often. Daily users get the most from their included credits.'),
      todo: t('Run a short training for occasional users. Give seats that stay quiet to someone else.'),
      topic: 'adoption',
      jump: jump(
        quiet,
        tp(quiet, 'Show {n} occasional or rare user', 'Show {n} occasional or rare users', nUsers(quiet)),
        { engagement: ['occasional', 'rare'] },
        t('Open the Users page, filtered to people who use GitHub Copilot only now and then'),
      ),
    },
  ];
}

const BADGE_TONE: Record<CheckStatus, Tone> = { good: 'good', warn: 'warn', bad: 'bad' };
const DOT_CLASS: Record<CheckStatus, string> = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad' };
const VALUE_CLASS: Record<CheckStatus, string> = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' };

function CheckRow({ check }: { check: Check }) {
  const { status, jump } = check;
  const measured = status !== null;
  return (
    <li className="grid gap-x-8 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {check.id === 'auto' ? <FeatureIcon feature="auto" size={14} className="shrink-0 text-fg-muted" /> : null}
          <h4 className="text-sm font-medium">{check.label}</h4>
          <CalcInfo id={check.calc} />
          <Badge tone={status ? BADGE_TONE[status] : 'neutral'}>{status ? t(STATUS_LABEL[status]) : t('Not measured')}</Badge>
        </div>
        <div className={cx('num mt-1 font-semibold leading-tight', check.value.length > 12 ? 'text-base' : 'text-xl', measured ? VALUE_CLASS[status] : 'text-fg-muted')}>{check.value}</div>
        <div className="mt-0.5 text-xs text-fg-muted">
          <T text="Target: {target}" values={{ target: <span className="num">{check.target}</span> }} />
        </div>
        {check.detail ? <div className="num mt-0.5 text-xs text-fg-subtle">{check.detail}</div> : null}
        <CalcLine id={check.calc} className="mt-1" />
      </div>
      <div className="min-w-0 space-y-1 text-sm">
        <p>
          <span className="font-medium">{t('Why it matters:')} </span>
          <span className="text-fg-muted">{check.why}</span>
        </p>
        <p>
          <span className="font-medium">{t('What to do:')} </span>
          <span className="text-fg-muted">{check.todo}</span>
        </p>
        {jump ? (
          <button type="button" className="btn btn-sm mt-1 max-w-full text-start" title={jump.title} onClick={() => drill(jump.patch, { page: jump.page, merge: true })}>
            <span className="num">{jump.label}</span> <ArrowRight size={12} className="shrink-0 rtl:-scale-x-100" />
          </button>
        ) : null}
        <DocLinks topic={check.topic} limit={2} compact className="pt-1" />
      </div>
    </li>
  );
}

export function Scorecard() {
  const { analysis, store } = useAnalysis();
  const checks = useMemo(() => buildChecks(analysis, store.hasTokens), [analysis, store.hasTokens]);
  const healthy = checks.filter((c) => c.status === 'good').length;
  const unmeasured = checks.filter((c) => c.status === null).length;

  return (
    <Section title={t('Best-practice scorecard')} description={t('Six habits that decide how far your credits go. The targets are guidance, not rules.')}>
      <Card
        padded={false}
        footer={t('Green means healthy, amber means it could be better and red needs attention. Shares are measured on the usage in the selected period.')}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border-muted bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {checks.map((c) => (
              <span key={c.id} className={cx('size-3 rounded-xs', c.status ? DOT_CLASS[c.status] : 'bg-surface-3 ring-1 ring-inset ring-border')} title={c.label} />
            ))}
          </div>
          <p className="text-sm font-semibold">
            <T
              text="{healthy} of {total} checks are healthy"
              values={{ healthy: <span className="num">{healthy}</span>, total: <span className="num">{checks.length}</span> }}
            />
          </p>
          <CalcInfo id="efficiency-scorecard" />
          {unmeasured > 0 ? (
            <p className="text-xs text-fg-muted">
              {tp(unmeasured, '{n} check could not be measured for this data.', '{n} checks could not be measured for this data.')}
            </p>
          ) : null}
          <CalcLine id="efficiency-scorecard" className="basis-full" />
        </div>
        <ul className="divide-y divide-border-muted">
          {checks.map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </ul>
      </Card>
    </Section>
  );
}
