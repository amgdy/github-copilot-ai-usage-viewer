import { useMemo, useState } from 'react';
import { EChart, useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { rankBarOption } from '../../components/charts/helpers';
import { Card, EmptyState, Segmented, Select, taxLookup } from '../../components/ui';
import { quotaKnown, shortLabel } from '../../components/user/shared';
import { t, tp } from '../../i18n';
import { fmtInt, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { Control } from './Control';
import { GroupedSelect } from './GroupedSelect';
import {
  COLOR_BY_OPTIONS,
  DEFAULT_DIR_LABELS,
  RANK_METRICS,
  categorizer,
  rankMetricGroups,
  rankUsers,
  type ColorBy,
  type MetricContext,
  type MetricId,
  type RankDir,
} from './metrics';

const TOP_SIZES = [10, 20, 50];

export function RankingCard() {
  const { analysis, taxonomy, settings } = useAnalysis();
  const colors = useChartColors();
  const [metricId, setMetricId] = useState<MetricId>('gross');
  const [dir, setDir] = useState<RankDir>('high');
  const [topN, setTopN] = useState(10);
  const [colorBy, setColorBy] = useState<ColorBy>('persona');

  const colorOptions = useMemo(
    () =>
      (analysis.coverage.models ? COLOR_BY_OPTIONS : COLOR_BY_OPTIONS.filter((o) => o.value !== 'profile')).map((o) => ({
        value: o.value,
        label: t(o.label),
      })),
    [analysis.coverage.models],
  );
  const topOptions = TOP_SIZES.map((n) => ({ value: n, label: t('Top {n}', { n: fmtInt(n) }) }));
  const metricGroups = rankMetricGroups();
  const effectiveColorBy: ColorBy = colorOptions.some((o) => o.value === colorBy) ? colorBy : 'persona';

  const metric = RANK_METRICS.find((m) => m.id === metricId) ?? RANK_METRICS[0];
  const profiles = analysis.users.profiles;
  const trendReliable = analysis.users.trendReliable;
  const minSpend = settings.minSpendForTraits;

  const ctx = useMemo<MetricContext>(
    () => ({
      minSpend,
      trendReliable,
      quotaKnown: quotaKnown(profiles),
      hasTokens: analysis.coverage.tokens,
      hasModels: analysis.coverage.models,
    }),
    [profiles, trendReliable, minSpend, analysis.coverage.tokens, analysis.coverage.models],
  );
  const ranking = useMemo(() => rankUsers(profiles, metric, dir, ctx, topN), [profiles, metric, dir, ctx, topN]);
  const cat = useMemo(() => categorizer(taxonomy, effectiveColorBy), [taxonomy, effectiveColorBy]);
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);

  const legend = useMemo(() => {
    const seen = new Set<string>();
    for (const r of ranking.ranked) {
      const item = cat.of(r.p);
      if (item) seen.add(item.id);
    }
    return cat.items.filter((i) => seen.has(i.id));
  }, [ranking, cat]);

  const option = useMemo<EChartsOption>(
    () =>
      rankBarOption(colors, {
        labelWidth: 140,
        format: (v) => metric.format(v, dir),
        items: ranking.ranked.map(({ p, value }) => ({
          name: p.name,
          value,
          color: cat.of(p)?.color,
          note: [
            personas[p.persona]?.label ?? '',
            metric.note ? metric.note(p) : t('{amount} usage', { amount: fmtUSD(p.gross) }),
            pluralize(p.activeDays, 'active day'),
          ]
            .filter(Boolean)
            .join(' · '),
        })),
      }),
    [colors, ranking, cat, personas, metric, dir],
  );

  const shown = ranking.ranked.length;
  const skipped = ranking.total - ranking.eligible;
  const dirLabels = metric.dirLabels ?? DEFAULT_DIR_LABELS;
  const footnote = [
    shown > 0
      ? ranking.eligible > shown
        ? t('Showing the top {shown} of {total} ranked users.', { shown: fmtInt(shown), total: fmtInt(ranking.eligible) })
        : tp(shown, 'Showing the only ranked user.', 'Showing all {n} ranked users.', { n: fmtInt(shown) })
      : '',
    skipped > 0 ? tp(skipped, '{n} user is not ranked.', '{n} users are not ranked.', { n: fmtInt(skipped) }) : '',
    skipped > 0 ? metric.skipReason(ctx, dir) : '',
  ]
    .filter(Boolean)
    .join(' ');

  const pickMetric = (id: MetricId) => {
    setMetricId(id);
    setDir(RANK_METRICS.find((m) => m.id === id)?.defaultDir ?? 'high');
  };

  const unavailable = (metric.group === 'tokens' && !ctx.hasTokens) || (metric.group === 'auto' && !ctx.hasModels);
  const metricLabel = t(metric.label);

  return (
    <Card
      title={t('User ranking')}
      subtitle={`${t(metric.about)} ${t('Click a bar to open the user.')}`}
      padded={false}
      calc={['user-ranking', metric.calc]}
    >
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-border-muted px-4 py-3">
        <Control label={t('Rank by')}>
          <GroupedSelect value={metricId} onChange={pickMetric} groups={metricGroups} aria-label={t('Rank users by')} />
        </Control>
        {metric.directional ? (
          <Control label={t('Order')}>
            <Segmented
              label={t('Order of the ranking')}
              value={dir}
              onChange={setDir}
              options={[
                { value: 'high', label: t(dirLabels.high) },
                { value: 'low', label: t(dirLabels.low) },
              ]}
            />
          </Control>
        ) : null}
        <Control label={t('Show')}>
          <Select value={topN} onChange={setTopN} options={topOptions} order="given" aria-label={t('Number of users to show')} />
        </Control>
        <Control label={t('Color by')}>
          <Segmented label={t('Color the bars by')} value={effectiveColorBy} onChange={setColorBy} options={colorOptions} />
        </Control>
      </div>

      {shown === 0 ? (
        <div className="p-4">
          <EmptyState title={unavailable ? t('Not available in this file') : t('Nobody to rank')} description={metric.missing(ctx, dir)} />
        </div>
      ) : (
        <>
          <div className="px-2 pt-3">
            <EChart
              option={option}
              height={Math.max(160, shown * 27 + 16)}
              exportName="github-copilot-user-ranking"
              label={t('Top {n} users by {measure}', { n: fmtInt(shown), measure: metricLabel })}
              onClick={(p) => {
                const r = ranking.ranked[p.dataIndex];
                if (r) useApp.getState().selectUser(r.p.id);
              }}
            />
          </div>
          {legend.length > 1 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 px-4 pt-1 text-xs text-fg-muted" aria-label={t('Bar colors')}>
              {legend.map((i) => (
                <li key={i.id} className="inline-flex items-center gap-1.5" title={i.description}>
                  <span className="size-2 rounded-xs" style={{ background: i.color }} aria-hidden />
                  {shortLabel(i.label)}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      {footnote ? <p className="px-4 pb-3 pt-2 text-xs text-fg-muted">{footnote}</p> : null}
    </Card>
  );
}
