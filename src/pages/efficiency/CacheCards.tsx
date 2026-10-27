import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { escapeHtml } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { Callout, Card, ChartCard, EmptyState, Segmented, cx } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { makeBucketer } from '../../lib/analytics/series';
import { fmtCompact, fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { usePerMonth } from '../shared';
import { cacheHitBuckets, cacheTip, lowCacheHeavyUsers, money, type CacheBucket } from './metrics';
import { CACHE_HIT_FAIR, CACHE_HIT_HEALTHY } from './thresholds';

type TrendBucket = 'day' | 'week';

const TREND_OPTIONS: { value: TrendBucket; label: string }[] = [
  { value: 'day', label: msg('Day') },
  { value: 'week', label: msg('Week') },
];

const hitTone = (hit: number): string => (hit < CACHE_HIT_FAIR ? 'text-bad' : hit < CACHE_HIT_HEALTHY ? 'text-warn' : 'text-good');

/** Cache read and cache write side by side, in tokens and estimated cost, so the two are never shown apart. */
function cacheReadWriteText(read: number, write: number, readCost: number, writeCost: number): string {
  if (readCost > 0 || writeCost > 0) {
    return t('Cache read: {read} tokens, about {readCost}. Cache write: {write} tokens, about {writeCost}.', {
      read: fmtCompact(read),
      write: fmtCompact(write),
      readCost: money(readCost),
      writeCost: money(writeCost),
    });
  }
  return t('Cache read: {read} tokens. Cache write: {write} tokens.', { read: fmtCompact(read), write: fmtCompact(write) });
}

export function CacheTrend() {
  const { analysis, settings } = useAnalysis();
  const colors = useChartColors();
  const { agg: aggregates, range } = analysis;
  const [bucket, setBucket] = useState<TrendBucket>(() => (range.length > 90 ? 'week' : 'day'));

  const trend = useMemo(() => {
    const bucketer = makeBucketer(range.start, range.end, bucket);
    const read = new Float64Array(bucketer.count);
    const write = new Float64Array(bucketer.count);
    const prompt = new Float64Array(bucketer.count);
    const days = aggregates.days;
    for (let i = 0; i < days.input.length; i++) {
      const bucketIndex = bucketer.indexOf(range.start + i);
      if (bucketIndex < 0 || bucketIndex >= bucketer.count) continue;
      read[bucketIndex] += days.cacheRead[i];
      write[bucketIndex] += days.cacheWrite[i];
      prompt[bucketIndex] += days.input[i] + days.cacheRead[i] + days.cacheWrite[i];
    }
    return {
      labels: Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex)),
      hit: Array.from(read, (readTokens, bucketIndex): number | null => (prompt[bucketIndex] > 0 ? readTokens / prompt[bucketIndex] : null)),
      read,
      write,
      prompt,
    };
  }, [aggregates, range, bucket]);

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const bucketIndex = ((Array.isArray(params) ? params[0] : params) as { dataIndex: number }).dataIndex;
          const hitRate = trend.hit[bucketIndex];
          const head = `<b>${escapeHtml(trend.labels[bucketIndex] ?? '')}</b><br/>`;
          if (hitRate === null || hitRate === undefined) return `${head}${escapeHtml(t('No prompt tokens'))}`;
          const rate = escapeHtml(t('Cache hit rate: {rate}', { rate: fmtPct(hitRate, 1) }));
          const readWriteText = escapeHtml(t('Cache read: {read} tokens. Cache write: {write} tokens.', { read: fmtCompact(trend.read[bucketIndex]), write: fmtCompact(trend.write[bucketIndex]) }));
          const all = escapeHtml(t('{n} prompt tokens', { n: fmtCompact(trend.prompt[bucketIndex]) }));
          return `${head}<b>${rate}</b><br/><span style="opacity:.75">${readWriteText}<br/>${all}</span>`;
        },
      },
      xAxis: { type: 'category', data: trend.labels, axisLabel: { hideOverlap: true } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: (rate: number) => fmtPct(rate, 0) } },
      series: [
        {
          type: 'line',
          name: t('Cache hit rate'),
          data: trend.hit,
          color: colors.accent,
          showSymbol: trend.labels.length <= 45,
          symbolSize: 5,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.1 },
          markLine: {
            symbol: 'none',
            silent: true,
            animation: false,
            label: { formatter: '{b}', position: 'insideEndTop', color: colors.textMuted, fontSize: 12 },
            lineStyle: { type: 'dashed', width: 1.2, color: colors.warn },
            data: [{ name: t('Low cache line {rate}', { rate: fmtPct(settings.lowCacheHit, 0) }), yAxis: settings.lowCacheHit }],
          },
        },
      ],
    }),
    [trend, colors, settings.lowCacheHit],
  );

  const totals = aggregates.totals;
  const prompt = totals.input + totals.cacheRead + totals.cacheWrite;
  const options = TREND_OPTIONS.map((trendOption) => ({ value: trendOption.value, label: t(trendOption.label) }));

  return (
    <ChartCard
      title={t('Cache hit rate over time')}
      subtitle={t('Share of prompt tokens read from the cache. Higher is better. The dashed line is the low cache flag from Settings.')}
      calc="cache-trend"
      option={option}
      height={320}
      exportName="github-copilot-cache-hit-trend"
      label={t('Cache hit rate per period with the low cache line')}
      empty={trend.hit.every((hitRate) => hitRate === null) ? t('No prompt tokens in this period') : false}
      actions={<Segmented size="sm" label={t('Group by')} value={bucket} onChange={setBucket} options={options} />}
      footer={
        <div className="space-y-1">
          <p>
            {t('Overall in this period: {rate}. Periods without prompt tokens are left blank.', { rate: prompt > 0 ? fmtPct(totals.cacheRead / prompt, 1) : '–' })}
          </p>
          <p>{cacheReadWriteText(totals.cacheRead, totals.cacheWrite, totals.est.cacheRead, totals.est.cacheWrite)}</p>
        </div>
      }
    />
  );
}

const bucketColor = (colors: ChartColors, bucket: CacheBucket): string => (bucket.hi <= CACHE_HIT_FAIR ? colors.bad : bucket.lo >= CACHE_HIT_HEALTHY ? colors.good : colors.warn);

export function CacheHistogram() {
  const { analysis, settings } = useAnalysis();
  const colors = useChartColors();
  const profiles = analysis.users.profiles;
  const buckets = useMemo(() => cacheHitBuckets(profiles), [profiles]);
  const measured = buckets.reduce((a, b) => a + b.users, 0);
  const skipped = profiles.length - measured;
  const redBars = buckets.filter((bucket) => bucket.hi <= CACHE_HIT_FAIR);
  const redNote = redBars.length
    ? `${tp(redBars.length, 'The red bar is below {limit}.', 'Red bars are below {limit}.', { limit: fmtPct(redBars[redBars.length - 1].hi, 0) })} `
    : '';

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const bucket = buckets[(params as { dataIndex: number }).dataIndex];
          if (!bucket) return '';
          const head = escapeHtml(t('Cache hit rate: {rate}', { rate: bucket.label }));
          const users = escapeHtml(tp(bucket.users, '{n} user', '{n} users', { n: fmtInt(bucket.users) }));
          const usage = escapeHtml(t('{usage} usage', { usage: money(bucket.gross) }));
          return `<b>${head}</b><br/>${users}<br/><span style="opacity:.75">${usage}</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: buckets.map((bucket) => bucket.label),
        name: t('Cache hit rate'),
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: colors.textMuted, fontSize: 12 },
      },
      yAxis: { type: 'value', minInterval: 1, name: t('Users'), nameTextStyle: { color: colors.textMuted, fontSize: 12, align: 'left' } },
      series: [
        {
          type: 'bar',
          barMaxWidth: 52,
          data: buckets.map((bucket) => ({ value: bucket.users, itemStyle: { color: bucketColor(colors, bucket) } })),
          label: { show: true, position: 'top', color: colors.textMuted, fontSize: 12 },
        },
      ],
    }),
    [buckets, colors],
  );

  return (
    <ChartCard
      title={t('Users by cache hit rate')}
      subtitle={`${redNote}${t('Green bars are {healthy} or more. The low cache flag is {low}.', { healthy: fmtPct(CACHE_HIT_HEALTHY, 0), low: fmtPct(settings.lowCacheHit, 0) })}`}
      calc="cache-histogram"
      option={option}
      height={320}
      exportName="github-copilot-cache-hit-by-user"
      label={t('Number of users in each cache hit rate range')}
      empty={measured === 0 ? t('No users with prompt tokens in this selection') : false}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => drill({ traits: ['lowCache'] }, { page: 'users', merge: true })}>
            {t('Show users with low cache reuse')} <ArrowRight size={12} className="rtl:-scale-x-100" />
          </button>
          {skipped > 0 ? <span>{tp(skipped, '{n} user without prompt tokens is not shown', '{n} users without prompt tokens are not shown', { n: fmtInt(skipped) })}</span> : null}
        </div>
      }
    />
  );
}

export function LowCacheUsers() {
  const { analysis, settings } = useAnalysis();
  const selectUser = useApp((state) => state.selectUser);
  const perMonth = usePerMonth();
  const rows = useMemo(
    () => lowCacheHeavyUsers(analysis.users.profiles, settings.minSpendForTraits, 5).map((user) => ({ p: user, tip: cacheTip(user, settings) })),
    [analysis, settings],
  );
  const anyLow = rows.some((row) => row.p.cacheHit < settings.lowCacheHit);

  return (
    <Card
      padded={false}
      title={t('Heavy users with the lowest cache hit rate')}
      subtitle={t('Users with at least {amount} of usage. Open one to see their profile and tips.', { amount: fmtUSD(settings.minSpendForTraits, 0) })}
      calc="cache-low-users"
    >
      {rows.length === 0 ? (
        <EmptyState
          title={t('No heavy users with prompt tokens')}
          description={t('Nobody reached {amount} of usage with prompt tokens in this selection.', { amount: fmtUSD(settings.minSpendForTraits, 0) })}
        />
      ) : (
        <>
          {!anyLow ? (
            <div className="border-b border-border-muted p-3">
              <Callout tone="good" title={t('No heavy user is below the {rate} line', { rate: fmtPct(settings.lowCacheHit, 0) })}>
                {t('These are the lowest hit rates among heavy users, so there is little to fix here.')}
              </Callout>
            </div>
          ) : null}
          <ul className="divide-y divide-border-muted">
            {rows.map(({ p: user, tip }) => {
              const saving = tip && tip.id === 'cache' && tip.savingsUsd > 0 ? tip.savingsUsd * perMonth : 0;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-start transition-colors hover:bg-surface-2"
                    onClick={() => selectUser(user.id)}
                    title={t('Open the user profile')}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium">{user.name}</span>
                      <span className={cx('num shrink-0 text-sm font-semibold', hitTone(user.cacheHit))}>{t('{rate} cache hit rate', { rate: fmtPct(user.cacheHit, 0) })}</span>
                    </div>
                    <div className="num mt-0.5 text-xs text-fg-muted">
                      {saving >= 0.5
                        ? t('{usage} usage, the cache could save about {saving} per month', { usage: money(user.gross), saving: money(saving) })
                        : t('{usage} usage', { usage: money(user.gross) })}
                    </div>
                    <div className="num mt-0.5 text-xs text-fg-muted">{cacheReadWriteText(user.cacheRead, user.cacheWrite, user.costCacheRead, user.costCacheWrite)}</div>
                    {tip ? (
                      <p className="mt-1 line-clamp-2 text-xs text-fg-muted">
                        <span className="font-medium text-fg">{t('Tip:')} </span>
                        {tip.id === 'cache' ? null : <span className="font-medium text-fg">{tip.title}. </span>}
                        {tip.detail}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
