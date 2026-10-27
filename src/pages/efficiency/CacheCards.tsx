import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { esc } from '../../components/charts/helpers';
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
  const { agg, range } = analysis;
  const [bucket, setBucket] = useState<TrendBucket>(() => (range.length > 90 ? 'week' : 'day'));

  const trend = useMemo(() => {
    const b = makeBucketer(range.start, range.end, bucket);
    const read = new Float64Array(b.count);
    const write = new Float64Array(b.count);
    const prompt = new Float64Array(b.count);
    const d = agg.days;
    for (let i = 0; i < d.input.length; i++) {
      const k = b.indexOf(range.start + i);
      if (k < 0 || k >= b.count) continue;
      read[k] += d.cacheRead[i];
      write[k] += d.cacheWrite[i];
      prompt[k] += d.input[i] + d.cacheRead[i] + d.cacheWrite[i];
    }
    return {
      labels: Array.from({ length: b.count }, (_, k) => b.label(k)),
      hit: Array.from(read, (r, k): number | null => (prompt[k] > 0 ? r / prompt[k] : null)),
      read,
      write,
      prompt,
    };
  }, [agg, range, bucket]);

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (ps: unknown) => {
          const i = ((Array.isArray(ps) ? ps[0] : ps) as { dataIndex: number }).dataIndex;
          const h = trend.hit[i];
          const head = `<b>${esc(trend.labels[i] ?? '')}</b><br/>`;
          if (h === null || h === undefined) return `${head}${esc(t('No prompt tokens'))}`;
          const rate = esc(t('Cache hit rate: {rate}', { rate: fmtPct(h, 1) }));
          const rw = esc(t('Cache read: {read} tokens. Cache write: {write} tokens.', { read: fmtCompact(trend.read[i]), write: fmtCompact(trend.write[i]) }));
          const all = esc(t('{n} prompt tokens', { n: fmtCompact(trend.prompt[i]) }));
          return `${head}<b>${rate}</b><br/><span style="opacity:.75">${rw}<br/>${all}</span>`;
        },
      },
      xAxis: { type: 'category', data: trend.labels, axisLabel: { hideOverlap: true } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: (v: number) => fmtPct(v, 0) } },
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

  const totals = agg.totals;
  const prompt = totals.input + totals.cacheRead + totals.cacheWrite;
  const options = TREND_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }));

  return (
    <ChartCard
      title={t('Cache hit rate over time')}
      subtitle={t('Share of prompt tokens read from the cache. Higher is better. The dashed line is the low cache flag from Settings.')}
      calc="cache-trend"
      option={option}
      height={320}
      exportName="github-copilot-cache-hit-trend"
      label={t('Cache hit rate per period with the low cache line')}
      empty={trend.hit.every((h) => h === null) ? t('No prompt tokens in this period') : false}
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

const bucketColor = (c: ChartColors, b: CacheBucket): string => (b.hi <= CACHE_HIT_FAIR ? c.bad : b.lo >= CACHE_HIT_HEALTHY ? c.good : c.warn);

export function CacheHistogram() {
  const { analysis, settings } = useAnalysis();
  const colors = useChartColors();
  const profiles = analysis.users.profiles;
  const buckets = useMemo(() => cacheHitBuckets(profiles), [profiles]);
  const measured = buckets.reduce((a, b) => a + b.users, 0);
  const skipped = profiles.length - measured;
  const redBars = buckets.filter((b) => b.hi <= CACHE_HIT_FAIR);
  const redNote = redBars.length
    ? `${tp(redBars.length, 'The red bar is below {limit}.', 'Red bars are below {limit}.', { limit: fmtPct(redBars[redBars.length - 1].hi, 0) })} `
    : '';

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const b = buckets[(p as { dataIndex: number }).dataIndex];
          if (!b) return '';
          const head = esc(t('Cache hit rate: {rate}', { rate: b.label }));
          const users = esc(tp(b.users, '{n} user', '{n} users', { n: fmtInt(b.users) }));
          const usage = esc(t('{usage} usage', { usage: money(b.gross) }));
          return `<b>${head}</b><br/>${users}<br/><span style="opacity:.75">${usage}</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: buckets.map((b) => b.label),
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
          data: buckets.map((b) => ({ value: b.users, itemStyle: { color: bucketColor(colors, b) } })),
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
  const selectUser = useApp((s) => s.selectUser);
  const perMonth = usePerMonth();
  const rows = useMemo(
    () => lowCacheHeavyUsers(analysis.users.profiles, settings.minSpendForTraits, 5).map((p) => ({ p, tip: cacheTip(p, settings) })),
    [analysis, settings],
  );
  const anyLow = rows.some((r) => r.p.cacheHit < settings.lowCacheHit);

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
            {rows.map(({ p, tip }) => {
              const saving = tip && tip.id === 'cache' && tip.savingsUsd > 0 ? tip.savingsUsd * perMonth : 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-start transition-colors hover:bg-surface-2"
                    onClick={() => selectUser(p.id)}
                    title={t('Open the user profile')}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium">{p.name}</span>
                      <span className={cx('num shrink-0 text-sm font-semibold', hitTone(p.cacheHit))}>{t('{rate} cache hit rate', { rate: fmtPct(p.cacheHit, 0) })}</span>
                    </div>
                    <div className="num mt-0.5 text-xs text-fg-muted">
                      {saving >= 0.5
                        ? t('{usage} usage, the cache could save about {saving} per month', { usage: money(p.gross), saving: money(saving) })
                        : t('{usage} usage', { usage: money(p.gross) })}
                    </div>
                    <div className="num mt-0.5 text-xs text-fg-muted">{cacheReadWriteText(p.cacheRead, p.cacheWrite, p.costCacheRead, p.costCacheWrite)}</div>
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
