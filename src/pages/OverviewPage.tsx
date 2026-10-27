import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Eye } from 'lucide-react';
import { useChartColors } from '../components/charts/EChart';
import { donutOption, rankBarOption, stackedTimeOption, type TimeSeriesInput } from '../components/charts/helpers';
import { NoRows } from '../components/NoRows';
import { RecommendationCard } from '../components/RecommendationCard';
import { CalcInfo, Callout, Card, ChartCard, DocLinks, EmptyState, Kpi, KpiGrid, PageHeader, ProgressBar, Segmented, TONE_TEXT, cx, taxLookup, type Tone } from '../components/ui';
import { FeatureIcon } from '../components/icons';
import { T, msg, t, tp } from '../i18n';
import { rollupByCategory } from '../lib/analytics/aggregate';
import type { DataCoverage } from '../lib/analytics/coverage';
import { makeBucketer, stackedSeries, type Bucket } from '../lib/analytics/series';
import { CATEGORY_COLORS } from '../lib/analytics/taxonomy';
import { VENDORS } from '../lib/pricing/card';
import { CATEGORIES, labelOf } from '../lib/types';
import { DAYS_PER_MONTH, fmtDay } from '../lib/utils/date';
import { fmtCompact, fmtDelta, fmtInt, fmtNum, fmtPct, fmtPctAuto, fmtUSD, pluralize } from '../lib/utils/format';
import { useAnalysis } from '../state/analysis';
import { drill, navigate } from '../state/router';
import { useApp } from '../state/store';
import { AutoDiscountCard } from './overview/AutoDiscountCard';
import { isActionable, sortRecs } from './recommendations/recFilters';
import { NarrowedNotice, clearNarrowing } from './shared';
import { poolGap } from './spend/helpers';

const signedPct = (v: number): string => `${v >= 0 ? '+' : ''}${fmtPctAuto(v)}`;
const FORWARD = 'rtl:-scale-x-100';

const STATUS = {
  action: { tone: 'warn', label: msg('Needs attention'), Icon: AlertTriangle, border: 'border-s-warn' },
  watch: { tone: 'info', label: msg('Worth watching'), Icon: Eye, border: 'border-s-info' },
  healthy: { tone: 'good', label: msg('Healthy'), Icon: CheckCircle2, border: 'border-s-good' },
} as const;

/** Why the pool cannot be sized when the file has no billing split, naming the missing report columns. */
function poolColumnsNote(coverage: Pick<DataCoverage, 'quota'>): string {
  return coverage.quota
    ? t('The file has no discount_amount or net_amount column, so included credits cannot be tracked. Load the full usage report to see how much of the pool was used and when it ran out.')
    : t('The file has no discount_amount, net_amount or total_monthly_quota column, so included credits cannot be sized or tracked. Load the full usage report to see how much of the pool was used and when it ran out.');
}

function HeadlineBanner() {
  const { analysis } = useAnalysis();
  const h = analysis.headline;
  const s = STATUS[h.status];
  const actionable = analysis.recs.filter(isActionable).length;
  return (
    <div className={cx('card flex flex-wrap items-end gap-x-6 gap-y-3 border-s-[3px] px-5 py-4', s.border)}>
      <div className="min-w-0 flex-1 basis-64">
        <div className={cx('eyebrow flex items-center gap-1.5', TONE_TEXT[s.tone])}>
          <s.Icon size={13} aria-hidden />
          {t(s.label)}
          <CalcInfo id="headline-status" />
        </div>
        <h2 className="font-display mt-1.5 text-lg leading-snug text-fg sm:text-xl">{h.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{h.detail}</p>
      </div>
      {actionable > 0 ? (
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => navigate('recommendations')}>
          {tp(actionable, 'Review {n} recommendation', 'Review {n} recommendations', { n: fmtInt(actionable) })} <ArrowRight size={14} className={FORWARD} />
        </button>
      ) : null}
    </div>
  );
}

function KpiRows() {
  const { analysis, store, settings } = useAnalysis();
  const { agg, pool, plan, narrowed, range, trend, users, population, auto } = analysis;
  const tot = agg.totals;
  const prev = analysis.previous?.totals ?? null;
  const perMonth = DAYS_PER_MONTH / Math.max(1, range.length);
  const poolKnown = !narrowed && !pool.capacityExceeded && Number.isFinite(pool.utilization);
  const billingKnown = analysis.coverage.billing;
  // Cash figures need the covered/billed split and the whole pool, so they are off in a filtered view and for files without a billing split.
  const cashKnown = !narrowed && billingKnown;
  const latest = pool.latest;
  const proj = latest?.projection ?? null;

  const avgPerUser = tot.users > 0 ? tot.gross / tot.users : 0;
  const prevAvgPerUser = prev && prev.users > 0 ? prev.gross / prev.users : 0;
  const prompt = tot.input + tot.cacheRead + tot.cacheWrite;
  const cacheHit = store.hasTokens && prompt > 0 ? tot.cacheRead / prompt : Number.NaN;
  const notInFile = t('Not in this file');
  const ofUsage = (v: number): string | undefined => (tot.gross > 0 ? t('{pct} of usage', { pct: fmtPct(v / tot.gross, 0) }) : undefined);

  const top = useMemo(() => {
    const sorted = users.profiles.map((p) => p.gross).sort((a, b) => b - a);
    const total = sorted.reduce((a, b) => a + b, 0);
    const k = Math.max(1, Math.ceil(sorted.length * 0.1));
    return { k, n: sorted.length, share: total > 0 ? sorted.slice(0, k).reduce((a, b) => a + b, 0) / total : 0 };
  }, [users]);

  const dau = useMemo(() => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < agg.days.rows.length; i++) {
      if (agg.days.rows[i] > 0) {
        sum += agg.days.activeUsers[i];
        n++;
      }
    }
    return n ? sum / n : 0;
  }, [agg]);

  const usageAvoided = plan.levers.total * perMonth;
  const idleRoster = narrowed ? 0 : population.inactive.length;

  return (
    <div className="space-y-3">
      <KpiGrid>
        <Kpi
          label={t('Billed on top of seats')}
          value={billingKnown ? fmtUSD(tot.net) : '–'}
          delta={billingKnown && prev ? fmtDelta(tot.net, prev.net) : null}
          goodWhen="down"
          tone={!billingKnown ? 'neutral' : tot.net > 0.005 ? 'warn' : 'good'}
          sub={!billingKnown ? notInFile : ofUsage(tot.net)}
          spark={billingKnown ? agg.days.net : undefined}
          hint={t('Usage that went beyond the included credits. It is charged on top of the seat fees.')}
          calc={['billed', 'previous-period']}
          onClick={() => navigate('spend')}
        />
        <Kpi
          label={t('Savings potential')}
          value={fmtUSD(cashKnown ? plan.perMonth : usageAvoided, 0)}
          tone="accent"
          sub={cashKnown ? t('cash per month, combined plan') : t('less usage per month')}
          hint={t('What the default levers (model right-sizing, Auto, caching, leaner context, caps) and the seat actions save together. Ideas that overlap are counted once. Open Recommendations to change the assumptions.')}
          calc="savings-plan"
          onClick={() => navigate('recommendations')}
        />
        <Kpi
          label={t('Included credits used')}
          value={poolKnown ? fmtPct(pool.utilization, 0) : '–'}
          tone={!poolKnown ? 'neutral' : pool.monthsExhausted > 0 ? 'warn' : pool.utilization < 0.4 ? 'info' : 'good'}
          sub={
            poolKnown
              ? pool.monthsExhausted > 0
                ? tp(pool.months.length, 'Ran out in {k} of {n} month', 'Ran out in {k} of {n} months', { k: fmtInt(pool.monthsExhausted), n: fmtInt(pool.months.length) })
                : t('The pool never ran out')
              : narrowed
                ? t('Not available for a filtered view')
                : !billingKnown
                  ? notInFile
                  : t('Pool size is unknown')
          }
          hint={t('Share of the included credits that was used. A low value means you pay for credits nobody uses. At 100%, extra usage is billed.')}
          calc="pool-utilization"
          onClick={() => navigate('spend')}
        />
        <Kpi
          label={t('Usage')}
          value={fmtUSD(tot.gross)}
          delta={prev ? fmtDelta(tot.gross, prev.gross) : null}
          sub={t('{n} AI credits', { n: fmtInt(tot.credits) })}
          spark={agg.days.gross}
          hint={t('Value of all AI credits used in this period (1 credit = $0.01), including usage that included credits paid for. Auto usage is shown after the Auto discount.')}
          calc={['usage', 'previous-period']}
          onClick={() => navigate('spend')}
        />
        {proj && latest ? (
          <Kpi
            label={t('Projected {month}', { month: latest.label })}
            value={fmtUSD(proj.projGross)}
            sub={!cashKnown ? t('month-end usage') : t('≈ {amount} billed', { amount: fmtUSD(proj.projNet) })}
            hint={t('Month-end estimate from the recent daily rate. The Usage and pool page shows the range.')}
            calc="projection"
            onClick={() => navigate('spend')}
          />
        ) : (
          <Kpi
            label={t('Average per month')}
            value={fmtUSD(tot.gross * perMonth)}
            sub={t('usage per month')}
            hint={t('Usage in the selected period, scaled to a month of 30.4 days.')}
            calc="per-month"
            onClick={() => navigate('spend')}
          />
        )}
        <Kpi
          label={t('Covered by included credits')}
          value={billingKnown ? fmtUSD(tot.discount) : '–'}
          delta={billingKnown && prev ? fmtDelta(tot.discount, prev.discount) : null}
          sub={!billingKnown ? notInFile : ofUsage(tot.discount)}
          spark={billingKnown ? agg.days.discount : undefined}
          hint={t('Usage paid for by the AI credits that come with each GitHub Copilot seat. They are shared across the organization and reset on the 1st of each month (UTC).')}
          calc={['covered', 'previous-period']}
          onClick={() => navigate('spend')}
        />
      </KpiGrid>

      <KpiGrid>
        <Kpi
          label={t('Last 7 days vs before')}
          value={trend.reliable ? signedPct(trend.change) : '–'}
          tone={trend.reliable && trend.change > 0.25 ? 'warn' : 'neutral'}
          sub={
            trend.reliable
              ? t('{recent} vs {prior}', { recent: fmtUSD(trend.recent), prior: fmtUSD(trend.prior) })
              : range.length < 14
                ? t('Needs at least 14 days of data')
                : t('No usage in the 7 days before')
          }
          hint={t('Usage of the last 7 days of the period compared with the 7 days before.')}
          calc="week-over-week"
          onClick={() => navigate('patterns')}
        />
        <Kpi
          label={t('Auto share of usage')}
          icon={<FeatureIcon feature="auto" size={14} className="shrink-0" />}
          value={analysis.coverage.models ? fmtPct(auto.share, 0) : '–'}
          tone={analysis.coverage.models && auto.total > 0 && auto.share < settings.lowAuto ? 'warn' : 'neutral'}
          sub={
            analysis.coverage.models
              ? auto.discount > 0.005
                ? t('{amount} Auto discount received', { amount: fmtUSD(auto.discount, 0) })
                : auto.billed > 0
                  ? t('No Auto discount in the report')
                  : t('No usage went through Auto')
              : t('No model names in the data')
          }
          hint={t('Share of usage where GitHub Copilot picked the model. The Auto model selection card below shows the discount received and the original price.')}
          calc={['auto-share', 'auto-discount']}
          onClick={() => navigate('models')}
        />
        <Kpi
          label={t('Top 10% of users')}
          value={fmtPct(top.share, 0)}
          sub={tp(top.n, '{k} of {n} user', '{k} of {n} users', { k: fmtInt(top.k), n: fmtInt(top.n) })}
          hint={t('Share of all usage that comes from the heaviest tenth of users. When it is high, a few users decide the bill.')}
          calc="top-decile-share"
          onClick={() => navigate('users')}
        />
        <Kpi
          label={t('Per user, per month')}
          value={fmtUSD(avgPerUser * perMonth)}
          delta={prev ? fmtDelta(avgPerUser, prevAvgPerUser) : null}
          sub={t('usage per active user')}
          hint={t('Average monthly usage of an active user. Compare it with the credits included in a seat ($19 Business, $39 Enterprise).')}
          calc={['per-user-month', 'previous-period']}
          onClick={() => navigate('users')}
        />
        <Kpi
          label={t('Active users')}
          value={fmtInt(tot.users)}
          delta={prev ? fmtDelta(tot.users, prev.users) : null}
          goodWhen="up"
          sub={
            idleRoster > 0
              ? tp(idleRoster, '{n} roster seat has no usage in the report', '{n} roster seats have no usage in the report', { n: fmtInt(idleRoster) })
              : t('{n} active on a typical day', { n: fmtNum(dau, 1) })
          }
          spark={agg.days.activeUsers}
          hint={t('Users with usage in this period. Rows without a username (repository-level products) are not counted.')}
          calc={['active-users', 'previous-period']}
          onClick={() => navigate('users')}
        />
        <Kpi
          label={t('Cache hit rate')}
          value={Number.isFinite(cacheHit) ? fmtPct(cacheHit, 0) : '–'}
          tone={Number.isFinite(cacheHit) ? (cacheHit < settings.lowCacheHit ? 'warn' : 'good') : 'neutral'}
          sub={
            Number.isFinite(cacheHit)
              ? t('Tokens: {read} cache read, {write} cache write', { read: fmtCompact(tot.cacheRead), write: fmtCompact(tot.cacheWrite) })
              : t('No token columns in the data')
          }
          hint={t('Cache read tokens ÷ (input + cache read + cache write tokens). Cache read tokens are text the model has seen before and reads again at a lower price. Cache write tokens are text the model stores so it can read it again later.')}
          calc={['cache-hit', 'tokens-cache-read', 'tokens-cache-write']}
          onClick={() => navigate('efficiency')}
        />
      </KpiGrid>
    </div>
  );
}

type StackBy = 'total' | 'coverage' | 'tier' | 'vendor' | 'product';

const STACK_OPTIONS: { value: StackBy; label: string; title: string }[] = [
  { value: 'coverage', label: msg('Covered vs billed'), title: msg('Split by who pays: included credits or extra billing') },
  { value: 'tier', label: msg('Model tier'), title: msg('Powerful, Versatile and Lightweight models') },
  { value: 'vendor', label: msg('Vendor'), title: msg('Model vendor') },
  { value: 'product', label: msg('Product'), title: msg('GitHub Copilot product or SKU family') },
];

/** Files without a billing split cannot be divided into covered and billed usage, so they get a plain total instead. */
const TOTAL_OPTION = { value: 'total' as const, label: msg('Total'), title: msg('All usage') };

const BUCKET_OPTIONS: { value: Bucket; label: string }[] = [
  { value: 'day', label: msg('Day') },
  { value: 'week', label: msg('Week') },
  { value: 'month', label: msg('Month') },
];

function UsageOverTime() {
  const { analysis, store, models } = useAnalysis();
  const colors = useChartColors();
  const { agg, mask, range } = analysis;
  const billing = analysis.coverage.billing;
  const stackOptions = useMemo(
    () => (billing ? STACK_OPTIONS : [TOTAL_OPTION, ...STACK_OPTIONS.filter((o) => o.value !== 'coverage')]).map((o) => ({ ...o, label: t(o.label), title: t(o.title) })),
    [billing],
  );
  const bucketOptions = useMemo(() => BUCKET_OPTIONS.map((o) => ({ ...o, label: t(o.label) })), []);
  const [bucket, setBucket] = useState<Bucket>(() => (range.length > 120 ? 'week' : 'day'));
  const [chosen, setStack] = useState<StackBy>(billing ? 'coverage' : 'total');
  const stack = stackOptions.some((o) => o.value === chosen) ? chosen : stackOptions[0].value;

  const view = useMemo(() => {
    if (stack === 'coverage' || stack === 'total') {
      const b = makeBucketer(range.start, range.end, bucket);
      const covered = new Float64Array(b.count);
      const billed = new Float64Array(b.count);
      const total = new Float64Array(b.count);
      for (let i = 0; i < agg.days.gross.length; i++) {
        const k = b.indexOf(range.start + i);
        covered[k] += agg.days.discount[i];
        billed[k] += agg.days.net[i];
        total[k] += agg.days.gross[i];
      }
      const series: TimeSeriesInput[] =
        stack === 'total'
          ? [{ name: t('Usage'), data: total, color: colors.accent }]
          : [
              { name: t('Covered by included credits'), data: covered, color: colors.accent },
              { name: t('Billed on top'), data: billed, color: colors.warn },
            ];
      return { bucketer: b, labels: Array.from({ length: b.count }, (_, i) => b.label(i)), series, other: null as Float64Array | null };
    }
    let ids: number[];
    let names: string[];
    let groupOf: ((s: typeof store, i: number) => number) | undefined;
    let paint: (id: number) => string | undefined = () => undefined;
    if (stack === 'tier') {
      ids = CATEGORIES.map((_, i) => i);
      names = CATEGORIES.map((c) => t(c));
      groupOf = (s, i) => models.cat[s.model[i]];
      paint = (id) => CATEGORY_COLORS[CATEGORIES[id]];
    } else if (stack === 'vendor') {
      ids = VENDORS.map((_, i) => i);
      names = VENDORS.map((v) => (v === 'Other' ? t('Other') : v));
      groupOf = (s, i) => models.vendor[s.model[i]];
    } else {
      const gross = agg.product.gross;
      ids = Array.from({ length: gross.length }, (_, i) => i)
        .filter((i) => gross[i] > 0)
        .sort((a, b) => gross[b] - gross[a])
        .slice(0, 6);
      names = ids.map((i) => labelOf('product', store.dicts.product.values[i]));
    }
    const s = stackedSeries(store, mask, range, stack === 'product' ? 'product' : 'model', ids, 'gross', bucket, names, groupOf);
    const series: TimeSeriesInput[] = s.series.filter((x) => x.data.some((v) => v !== 0)).map((x) => ({ name: x.name, data: x.data, color: paint(x.id) }));
    return { bucketer: s.bucketer, labels: s.labels, series, other: s.other };
  }, [stack, bucket, agg, mask, range, store, models, colors]);

  const option = useMemo(
    () => stackedTimeOption(colors, { labels: view.labels, series: view.series, other: view.other, kind: 'bar', zoom: view.labels.length > 60 }),
    [colors, view],
  );

  return (
    <ChartCard
      title={t('Usage over time')}
      subtitle={t('Value of AI credits used. Click a bar to zoom into that period.')}
      calc="usage-over-time"
      option={option}
      height={320}
      empty={view.labels.length === 0 ? t('No usage in this period') : false}
      onClick={(p) => {
        const i = p.dataIndex;
        const b = view.bucketer;
        if (i < 0 || i >= b.count) return;
        drill({ dateFrom: b.start(i), dateTo: i + 1 < b.count ? b.start(i + 1) - 1 : range.end }, { merge: true });
      }}
      actions={
        <>
          <Segmented size="sm" label={t('Split usage by')} value={stack} onChange={setStack} options={stackOptions} />
          <Segmented size="sm" label={t('Group by')} value={bucket} onChange={setBucket} options={bucketOptions} />
        </>
      }
    />
  );
}

function PoolCard() {
  const { analysis } = useAnalysis();
  const { pool, narrowed } = analysis;
  const latest = pool.latest;

  let body;
  if (narrowed) {
    body = (
      <Callout
        tone="info"
        title={t('Included credits are shared by everyone')}
        action={
          <button type="button" className="btn btn-sm" onClick={clearNarrowing}>
            {t('Clear filters')}
          </button>
        }
      >
        {t('They cannot be split for a filtered view. Remove the row and segment filters (the date range can stay) to see the pool.')}
      </Callout>
    );
  } else if (!latest) {
    body = <EmptyState title={t('No billing month in the selected period')} />;
  } else if (poolGap(analysis.coverage.billing, [latest]) === 'billing') {
    body = (
      <Callout tone="warn" title={t('Pool figures are not available')}>
        {poolColumnsNote(analysis.coverage)}
      </Callout>
    );
  } else if (poolGap(analysis.coverage.billing, [latest]) === 'sizes') {
    body = (
      <Callout
        tone="info"
        title={t('The file does not say how many credits the seats include')}
        action={
          <button type="button" className="btn btn-sm" onClick={() => navigate('settings')}>
            {t('Open Settings')}
          </button>
        }
      >
        {t('Without the monthly quota of each user, the pool size is unknown. Add your roster or extra seats in Settings to see how much of the pool was used.')}
      </Callout>
    );
  } else if (latest.capacityExceeded) {
    body = (
      <Callout tone="warn" title={t('The pool is bigger than this file shows')}>
        {t(
          'Included credits covered {amount}, more than the seats in the file bring. Other seats, from files you have not loaded, share the same pool. Add them in Settings (roster or extra seats), or load every file of the billing entity, to see how much of the pool was used.',
          { amount: fmtUSD(latest.discount) },
        )}
      </Callout>
    );
  } else {
    const p = latest.projection;
    const util = latest.utilization;
    const ghost = p && latest.capacity > 0 ? Math.min(1, p.projGross / latest.capacity) : undefined;
    const tone: Tone = latest.exhaustedOn !== null ? 'warn' : util < 0.4 ? 'info' : 'good';
    const strong = (v: string) => <b className="text-fg">{v}</b>;
    body = (
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="num text-2xl font-semibold">{fmtPct(util, 0)}</div>
          <div className="num text-xs text-fg-muted">
            {t('{used} of {size}', { used: fmtUSD(latest.discount), size: fmtUSD(latest.capacity) })}
            {pool.capacityIsLowerBound ? '*' : ''}
          </div>
        </div>
        <ProgressBar className="mt-2" value={util} ghost={ghost} tone={tone} height={10} label={t('Included credits used')} />
        <ul className="mt-3 space-y-1 text-xs text-fg-muted">
          <li>
            {latest.exhaustedOn !== null ? (
              <T text="Ran out on {date}. Usage after that day is billed." values={{ date: strong(fmtDay(latest.exhaustedOn)) }} />
            ) : (
              <T text="{amount} of included credits left." values={{ amount: strong(fmtUSD(latest.headroom)) }} />
            )}
          </li>
          <li>
            <T text="Billed so far: {amount}" values={{ amount: strong(fmtUSD(latest.net)) }} />
          </li>
          {p ? (
            <li>
              <T text="Month-end estimate: {usage} of usage, about {billed} billed." values={{ usage: strong(fmtUSD(p.projGross)), billed: strong(fmtUSD(p.projNet)) }} />
              {p.exhaustionDate !== null ? (
                <>
                  {' '}
                  <T text="On track to run out around {date}." values={{ date: strong(fmtDay(p.exhaustionDate)) }} />
                </>
              ) : null}
            </li>
          ) : null}
          {pool.budget ? (
            <li>
              <T
                text="Budget: {billed} of {budget} used ({pct})."
                values={{ billed: strong(fmtUSD(pool.budget.billedToDate)), budget: fmtUSD(pool.budget.monthlyBudget), pct: fmtPct(pool.budget.burn, 0) }}
              />
            </li>
          ) : null}
        </ul>
        {pool.capacityIsLowerBound ? (
          <p className="mt-2 text-[11px] text-fg-subtle">{t('* Counts only the seats that appear in the report. Add your roster in Settings for the real pool size.')}</p>
        ) : null}
        {pool.months.length > 1 ? (
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-start text-fg-muted">
                <th className="pb-1 text-start font-medium">{t('Month')}</th>
                <th className="pb-1 text-end font-medium">{t('Usage')}</th>
                <th className="pb-1 text-end font-medium">{t('Billed')}</th>
                <th className="pb-1 text-end font-medium">{t('Included credits used')}</th>
              </tr>
            </thead>
            <tbody>
              {pool.months.slice(-6).map((m) => (
                <tr key={m.key} className="border-t border-border-muted">
                  <td className="py-1">
                    {m.label}
                    {m.complete ? '' : <span className="text-fg-subtle"> · {t('so far')}</span>}
                  </td>
                  <td className="num py-1 text-end">{fmtUSD(m.gross, 0)}</td>
                  <td className="num py-1 text-end">{fmtUSD(m.net, 0)}</td>
                  <td className="num py-1 text-end">{Number.isFinite(m.utilization) ? fmtPct(m.utilization, 0) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }

  return (
    <Card
      title={t('Included credits')}
      calc={['pool-utilization', 'pool-size', 'pool-headroom', 'pool-exhausted', 'projection']}
      subtitle={!narrowed && latest ? (latest.complete ? latest.label : t('{month}, month in progress', { month: latest.label })) : t('Shared across all seats')}
      footer={
        <div className="space-y-2">
          <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate('spend')}>
            {t('Open usage and pool details')} <ArrowRight size={12} className={FORWARD} />
          </button>
          <DocLinks ids={['usageBilling', 'budgets', 'manageSpending']} title={t('Learn more')} compact />
        </div>
      }
    >
      {body}
    </Card>
  );
}

function TopRecommendations() {
  const { analysis } = useAnalysis();
  const actionable = sortRecs(analysis.recs.filter(isActionable), 'value');
  const shown = actionable.slice(0, 4);
  const good = sortRecs(
    analysis.recs.filter((r) => !isActionable(r)),
    'value',
  ).slice(0, 2);
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{t('What to do next')}</h2>
          <p className="text-xs text-fg-muted">{t('Largest monthly value first. Open one to see the evidence, the steps and who is affected.')}</p>
        </div>
        {analysis.recs.length > shown.length ? (
          <button type="button" className="btn btn-sm" onClick={() => navigate('recommendations')}>
            {actionable.length > 1 ? tp(actionable.length, 'All {n} recommendation', 'All {n} recommendations', { n: fmtInt(actionable.length) }) : t('All recommendations')}{' '}
            <ArrowRight size={13} className={FORWARD} />
          </button>
        ) : null}
      </div>
      {shown.length ? (
        shown.map((r, i) => <RecommendationCard key={r.id} rec={r} defaultOpen={i === 0} />)
      ) : (
        <Card>
          <EmptyState icon={<CheckCircle2 size={22} />} title={t('Nothing needs action')} description={t('No recommendation crossed its threshold for the selected scope.')} />
        </Card>
      )}
      {good.map((r) => (
        <RecommendationCard key={r.id} rec={r} />
      ))}
    </div>
  );
}

interface SavingsRow {
  id: string;
  label: string;
  hint: string;
  value: number;
}

function SavingsCard() {
  const { analysis } = useAnalysis();
  const { plan, seats, pool, narrowed, range, agg } = analysis;
  const perMonth = DAYS_PER_MONTH / Math.max(1, range.length);
  const months = plan.months.length;
  const cash = !narrowed && months > 0 && analysis.coverage.billing;
  // Seat findings need the real pool size, which a filtered view or an incomplete file cannot give.
  const seatsKnown = !narrowed && !pool.capacityExceeded;
  // Billed overage in a filtered view is cash that usage cuts here save first.
  const billed = agg.totals.net * perMonth;
  const billedFloor = Math.min(billed, plan.levers.total * perMonth);

  const levers: SavingsRow[] = plan.levers.steps
    .map((s) => ({ id: s.id, label: s.label, hint: s.description, value: s.savings * perMonth }))
    .filter((x) => x.value >= 0.5)
    .sort((a, b) => b.value - a.value);
  const seatRows: SavingsRow[] = !seatsKnown
    ? []
    : [
        {
          id: 'idle',
          label: tp(seats.idle.length, 'Reclaim {n} idle seat', 'Reclaim {n} idle seats', { n: fmtInt(seats.idle.length) }),
          hint: t('Seats with almost no use and little activity.'),
          value: seats.idleValue,
          count: seats.idle.length,
        },
        {
          id: 'downgrade',
          label: tp(seats.downgrade.length, 'Move {n} user to Business', 'Move {n} users to Business', { n: fmtInt(seats.downgrade.length) }),
          hint: t('Enterprise users who never needed more than the Business credits.'),
          value: seats.downgradeValue,
          count: seats.downgrade.length,
        },
        {
          id: 'unused',
          label: tp(seats.unused.length, 'Remove {n} unused roster seat', 'Remove {n} unused roster seats', { n: fmtInt(seats.unused.length) }),
          hint: t('Seats on your roster that never appear in the report.'),
          value: seats.unusedValue,
          count: seats.unused.length,
        },
      ]
        .filter((x) => x.count > 0 && x.value > 0)
        .sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...levers.map((l) => l.value), ...seatRows.map((s) => s.value));
  const base = months ? plan.baseCost / months : 0;
  // The group with the larger monthly value comes first.
  const groups = [
    { id: 'levers', title: t('Usage levers, per month'), rows: levers, tone: 'bg-accent' },
    { id: 'seats', title: t('Seat changes, per month'), rows: seatRows, tone: 'bg-info' },
  ]
    .filter((g) => g.rows.length > 0)
    .sort((a, b) => b.rows.reduce((s, r) => s + r.value, 0) - a.rows.reduce((s, r) => s + r.value, 0));

  const bar = (value: number, tone: string) => (
    <div className="mt-1 h-1.5 overflow-hidden rounded-xs bg-surface-3">
      <div className={cx('h-full rounded-xs', tone)} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
    </div>
  );

  return (
    <Card
      title={t('Savings potential')}
      calc="savings-plan"
      subtitle={narrowed ? t('What the default usage levers save together') : t('Combined plan with the default levers and all seat actions')}
      footer={
        <div className="space-y-2">
          <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate('recommendations')}>
            {t('Try your own assumptions in the simulator')} <ArrowRight size={12} className={FORWARD} />
          </button>
          <DocLinks ids={['optimizeUsage', 'autoSelection', 'seatAssignment']} title={t('Learn more')} compact />
        </div>
      }
    >
      {cash ? (
        <div>
          <div className="num text-2xl font-semibold text-good">
            ≈ {fmtUSD(plan.perMonth, 0)}
            <span className="text-sm font-normal text-fg-muted"> {t('cash per month')}</span>
          </div>
          {base > 0 ? (
            <p className="mt-0.5 text-xs text-fg-muted">
              {t('From {from} to {to} per month ({pct} lower).', {
                from: fmtUSD(base, 0),
                to: fmtUSD(plan.newCost / months, 0),
                pct: fmtPct(Math.max(0, 1 - plan.newCost / plan.baseCost), 0),
              })}
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="num text-2xl font-semibold">
            ≈ {fmtUSD(plan.levers.total * perMonth, 0)}
            <span className="text-sm font-normal text-fg-muted"> {t('less usage per month')}</span>
          </div>
          <p className="mt-0.5 text-xs text-fg-muted">
            {narrowed
              ? t('Whether this saves cash depends on the pool, which cannot be split for a filtered view.')
              : t('Whether this saves cash depends on how much of it the included credits cover, which this file does not say.')}
            {narrowed && billedFloor > 0.5
              ? ` ${t('This view already has about {billed} per month billed on top of seats, so at least {floor} per month of it is cash.', { billed: fmtUSD(billed, 0), floor: fmtUSD(billedFloor, 0) })}`
              : ''}
          </p>
        </div>
      )}

      {groups.length ? (
        <div className="mt-4 space-y-3 text-sm">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="label">{g.title}</div>
              <ul className="space-y-2">
                {g.rows.map((l) => (
                  <li key={l.id} title={l.hint}>
                    <div className="flex justify-between gap-2">
                      <span>{l.label}</span>
                      <span className="num text-fg-muted">{fmtUSD(l.value, 0)}</span>
                    </div>
                    {bar(l.value, g.tone)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-fg-muted">{t('No lever has a measurable effect for this scope.')}</p>
      )}
      <p className="mt-4 text-[11px] leading-snug text-fg-subtle">
        {t(
          'The lever bars add up to the total drop in usage, because each lever counts only the usage that the levers before it leave. They are usage, not cash. Using less saves cash only once usage is above the included credits, and removing seats makes the pool smaller.',
        )}
      </p>
    </Card>
  );
}

function PersonaCard() {
  const { analysis, taxonomy } = useAnalysis();
  const colors = useChartColors();
  const groups = analysis.population.groups.persona;
  const items = useMemo(
    () => taxonomy.personas.map((p) => ({ id: p.id, name: p.label, value: groups[p.id]?.users ?? 0, color: p.color })).filter((x) => x.value > 0),
    [taxonomy, groups],
  );
  const total = items.reduce((a, b) => a + b.value, 0);
  const option = useMemo(() => donutOption(colors, { items, format: fmtInt, center: { value: fmtInt(total), caption: t('Users') }, legend: 'right' }), [colors, items, total]);
  return (
    <ChartCard
      title={t('Who the users are')}
      subtitle={t('Click a group to list its users')}
      calc="persona-groups"
      option={option}
      height={250}
      empty={total === 0 ? t('No users in this scope') : false}
      onClick={(p) => {
        const item = items[p.dataIndex];
        if (item) drill({ segments: [item.id] }, { page: 'users', merge: true });
      }}
      footer={
        <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate('segments')}>
          {t('Compare all segments')} <ArrowRight size={12} className={FORWARD} />
        </button>
      }
    />
  );
}

function TopSpenders() {
  const { analysis, taxonomy, settings } = useAnalysis();
  const colors = useChartColors();
  const selectUser = useApp((s) => s.selectUser);
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);
  const top = useMemo(() => [...analysis.users.profiles].sort((a, b) => b.gross - a.gross).slice(0, Math.max(3, settings.topN)), [analysis, settings.topN]);
  const option = useMemo(
    () =>
      rankBarOption(colors, {
        labelWidth: 120,
        items: top.map((p) => ({
          name: p.name,
          value: p.gross,
          color: personas[p.persona]?.color,
          note: t('{persona} · {share} of usage · {used} of included credits', {
            persona: personas[p.persona]?.label ?? '',
            share: fmtPct(p.share),
            used: Number.isFinite(p.utilization) ? fmtPct(p.utilization, 0) : '–',
          }),
        })),
      }),
    [colors, top, personas],
  );
  return (
    <ChartCard
      title={tp(top.length, 'Top {n} user', 'Top {n} users', { n: fmtInt(top.length) })}
      subtitle={t('By usage. Click a bar to open the user')}
      calc="top-spenders"
      option={option}
      height={Math.max(200, top.length * 27 + 16)}
      empty={top.length === 0 ? t('No users in this scope') : false}
      onClick={(p) => {
        const u = top[p.dataIndex];
        if (u) selectUser(u.id);
      }}
      footer={
        <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate('users')}>
          {t('See every user')} <ArrowRight size={12} className={FORWARD} />
        </button>
      }
    />
  );
}

function TierCard() {
  const { analysis, models } = useAnalysis();
  const colors = useChartColors();
  const items = useMemo(() => {
    const gross = rollupByCategory(models, analysis.agg.model).gross;
    return CATEGORIES.map((c, i) => ({ id: c, name: t(c), value: gross[i], color: CATEGORY_COLORS[c] })).filter((x) => x.value > 0);
  }, [analysis, models]);
  const total = items.reduce((a, b) => a + b.value, 0);
  const option = useMemo(() => donutOption(colors, { items, center: { value: fmtUSD(total, 0), caption: t('Usage') }, legend: 'right' }), [colors, items, total]);
  return (
    <ChartCard
      title={t('Usage by model tier')}
      subtitle={t('Powerful models have the highest token prices on the price card. Click a tier to filter')}
      calc="tier-usage"
      option={option}
      height={250}
      empty={total === 0 ? t('No model usage in this scope') : false}
      onClick={(p) => {
        const item = items[p.dataIndex];
        if (item) drill({ categories: [item.id] }, { page: 'models', merge: true });
      }}
      footer={
        <div className="space-y-2">
          <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate('models')}>
            {t('Explore models')} <ArrowRight size={12} className={FORWARD} />
          </button>
          <DocLinks ids={['modelComparison', 'pricing']} title={t('Learn more')} compact />
        </div>
      }
    />
  );
}

export default function OverviewPage() {
  const { analysis } = useAnalysis();
  const { range, agg } = analysis;

  if (agg.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t('Overview')} description={t('How much GitHub Copilot is used, what it costs, and what to do about it.')} />
        <NoRows />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('Overview')}
        description={t('{from} to {to} · {days} · {users}', {
          from: fmtDay(range.start, true),
          to: fmtDay(range.end, true),
          days: pluralize(range.length, 'day'),
          users: pluralize(agg.totals.users, 'user'),
        })}
      />
      <div className="space-y-4">
        <HeadlineBanner />
        <NarrowedNotice />
        <KpiRows />
        <div className="grid items-start gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TopRecommendations />
          </div>
          <SavingsCard />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <UsageOverTime />
          </div>
          <PoolCard />
        </div>
        <AutoDiscountCard />
        <div className="grid gap-4 lg:grid-cols-3">
          <TopSpenders />
          <TierCard />
          <PersonaCard />
        </div>
      </div>
    </>
  );
}
