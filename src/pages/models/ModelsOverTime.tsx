import { useMemo, useState } from 'react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { GRID, stackedTimeOption, type TimeSeriesInput } from '../../components/charts/helpers';
import { ChartCard, Segmented } from '../../components/ui';
import { msg, t } from '../../i18n';
import { stackedSeries, type Bucket } from '../../lib/analytics/series';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { VENDORS } from '../../lib/pricing/card';
import { CATEGORIES, labelOf } from '../../lib/types';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { topIds } from '../shared';
import { autoManualSeries, bucketPatch, type AutoSeries } from './data';
import { tierLabel, vendorColor, vendorLabel } from './parts';

type StackBy = 'model' | 'tier' | 'vendor';

const TOP_MODELS = 8;

/** Texts are English keys; translate them with t() where they are shown. */
const STACK_OPTIONS: { value: StackBy; label: string; title: string }[] = [
  { value: 'model', label: msg('Model'), title: msg('The top 8 models, everything else grouped as Other models') },
  { value: 'tier', label: msg('Tier'), title: msg('Powerful, Versatile and Lightweight') },
  { value: 'vendor', label: msg('Vendor'), title: msg('OpenAI, Anthropic, Google and the others') },
];

const BUCKET_OPTIONS: { value: Bucket; label: string }[] = [
  { value: 'day', label: msg('Day') },
  { value: 'week', label: msg('Week') },
  { value: 'month', label: msg('Month') },
];

const STACK_SUBTITLE: Record<Bucket, string> = {
  day: msg('Usage per day. The top 8 models, the rest grouped. Click a bar to zoom in.'),
  week: msg('Usage per week. The top 8 models, the rest grouped. Click a bar to zoom in.'),
  month: msg('Usage per month. The top 8 models, the rest grouped. Click a bar to zoom in.'),
};

const GROUP_SUBTITLE: Record<Bucket, string> = {
  day: msg('Usage per day. Click a bar to zoom into that period.'),
  week: msg('Usage per week. Click a bar to zoom into that period.'),
  month: msg('Usage per month. Click a bar to zoom into that period.'),
};

const translated = <V extends string>(list: { value: V; label: string; title?: string }[]) =>
  list.map((o) => ({ value: o.value, label: t(o.label), title: o.title ? t(o.title) : undefined }));

interface BucketProps {
  bucket: Bucket;
  onBucket: (b: Bucket) => void;
}

function StackedModelsCard({ bucket, onBucket }: BucketProps) {
  const { analysis, store, models } = useAnalysis();
  const colors = useChartColors();
  const { agg, mask, range } = analysis;
  const [stack, setStack] = useState<StackBy>('model');

  const view = useMemo(() => {
    let ids: number[];
    let names: string[];
    let groupOf: ((s: typeof store, i: number) => number) | undefined;
    let paint: (id: number) => string | undefined = () => undefined;
    if (stack === 'tier') {
      ids = CATEGORIES.map((_, i) => i);
      names = CATEGORIES.map(tierLabel);
      groupOf = (s, i) => models.cat[s.model[i]];
      paint = (id) => CATEGORY_COLORS[CATEGORIES[id]];
    } else if (stack === 'vendor') {
      ids = VENDORS.map((_, i) => i);
      names = VENDORS.map(vendorLabel);
      groupOf = (s, i) => models.vendor[s.model[i]];
      paint = (id) => vendorColor(colors, id);
    } else {
      ids = topIds(agg.model.gross, TOP_MODELS);
      names = ids.map((id) => labelOf('model', store.dicts.model.values[id]));
    }
    const s = stackedSeries(store, mask, range, 'model', ids, 'gross', bucket, names, groupOf);
    const series: TimeSeriesInput[] = s.series.filter((x) => x.data.some((v) => v !== 0)).map((x) => ({ name: x.name, data: x.data, color: paint(x.id) }));
    return { bucketer: s.bucketer, labels: s.labels, series, other: s.other };
  }, [stack, bucket, agg, mask, range, store, models, colors]);

  const option = useMemo(
    () =>
      stackedTimeOption(colors, {
        labels: view.labels,
        series: view.series,
        other: view.other,
        otherName: stack === 'model' ? t('Other models') : t('Other'),
        kind: 'bar',
        zoom: view.labels.length > 60,
      }),
    [colors, view, stack],
  );

  return (
    <ChartCard
      title={t('Models over time')}
      exportName="github-copilot-models-over-time"
      calc="model-usage-over-time"
      subtitle={t(stack === 'model' ? STACK_SUBTITLE[bucket] : GROUP_SUBTITLE[bucket])}
      option={option}
      height={320}
      empty={view.labels.length === 0 ? t('No usage in this period') : false}
      onClick={(p) => {
        const patch = bucketPatch(view.bucketer, p.dataIndex, range.end);
        if (patch) drill(patch, { merge: true });
      }}
      actions={
        <>
          <Segmented size="sm" label={t('Split usage by')} value={stack} onChange={setStack} options={translated(STACK_OPTIONS)} />
          <Segmented size="sm" label={t('Group by')} value={bucket} onChange={onBucket} options={translated(BUCKET_OPTIONS)} />
        </>
      }
    />
  );
}

type AutoView = 'share' | 'amounts';

const AUTO_VIEWS: { value: AutoView; label: string; title: string }[] = [
  { value: 'share', label: msg('Share'), title: msg('Share of usage that went through Auto, per period') },
  { value: 'amounts', label: msg('Auto and hand-picked'), title: msg('Usage through Auto and on hand-picked models, stacked') },
];

function halfShares(s: AutoSeries): { first: number; second: number } | null {
  const n = s.labels.length;
  if (n < 4) return null;
  const mid = Math.floor(n / 2);
  let a1 = 0;
  let t1 = 0;
  let a2 = 0;
  let t2 = 0;
  for (let i = 0; i < n; i++) {
    const sum = s.auto[i] + s.manual[i];
    if (i < mid) {
      a1 += s.auto[i];
      t1 += sum;
    } else {
      a2 += s.auto[i];
      t2 += sum;
    }
  }
  return t1 > 0 && t2 > 0 ? { first: a1 / t1, second: a2 / t2 } : null;
}

function AutoOverTimeCard({ bucket, onBucket }: BucketProps) {
  const { analysis, store } = useAnalysis();
  const colors = useChartColors();
  const { mask, range } = analysis;
  const [view, setView] = useState<AutoView>('share');

  const s = useMemo(() => autoManualSeries(store, mask, range, bucket), [store, mask, range, bucket]);
  const { autoTotal, total, halves } = useMemo(() => {
    let a = 0;
    let m = 0;
    for (let i = 0; i < s.labels.length; i++) {
      a += s.auto[i];
      m += s.manual[i];
    }
    return { autoTotal: a, total: a + m, halves: halfShares(s) };
  }, [s]);
  const average = total > 0 ? autoTotal / total : 0;

  const option = useMemo((): EChartsOption => {
    const throughAuto = t('Through Auto');
    const handPicked = t('Hand-picked');
    const autoShare = t('Auto share');
    if (view === 'amounts') {
      return stackedTimeOption(colors, {
        labels: s.labels,
        series: [
          { name: throughAuto, data: s.auto, color: colors.accent },
          { name: handPicked, data: s.manual, color: colors.muted },
        ],
        kind: 'bar',
        zoom: s.labels.length > 60,
      });
    }
    const share = Array.from(s.auto, (a, i) => {
      const sum = a + s.manual[i];
      return sum > 0 ? a / sum : null;
    });
    return {
      grid: { ...GRID, top: 16 },
      legend: { show: false },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown): string => {
          const list = (Array.isArray(params) ? params : [params]) as { dataIndex?: number }[];
          const i = list[0]?.dataIndex ?? -1;
          if (i < 0 || i >= s.labels.length) return '';
          const a = s.auto[i];
          const m = s.manual[i];
          const row = (label: string, value: string) => `<div style="display:flex;justify-content:space-between;gap:16px"><span>${label}</span><b>${value}</b></div>`;
          return (
            `<div style="font-weight:600;margin-bottom:4px">${s.labels[i]}</div>` +
            row(autoShare, a + m > 0 ? fmtPct(a / (a + m), 0) : '–') +
            row(throughAuto, fmtUSD(a, 'auto')) +
            row(handPicked, fmtUSD(m, 'auto'))
          );
        },
      },
      xAxis: { type: 'category', data: s.labels, axisLabel: { hideOverlap: true, interval: s.labels.length > 45 ? 'auto' : 0 } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: (v: number) => fmtPct(v, 0) } },
      dataZoom: s.labels.length > 60 ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 4 }] : undefined,
      series: [
        {
          type: 'line',
          name: autoShare,
          data: share,
          color: colors.accent,
          showSymbol: s.labels.length <= 40,
          symbolSize: 6,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.12 },
          markLine:
            total > 0
              ? {
                  symbol: 'none',
                  silent: true,
                  animation: false,
                  label: { formatter: t('Average {pct}', { pct: fmtPct(average, 0) }), position: 'insideEndTop', color: colors.textMuted, fontSize: 12 },
                  lineStyle: { type: 'dashed', width: 1.2, color: colors.textSubtle },
                  data: [{ yAxis: average }],
                }
              : undefined,
        },
      ],
    };
  }, [view, s, colors, total, average]);

  const note =
    total <= 0
      ? null
      : autoTotal <= 0
        ? t('No usage in this scope went through Auto.')
        : !halves
          ? t('Auto picked the model for {pct} of usage.', { pct: fmtPct(average, 0) })
          : Math.abs(halves.second - halves.first) >= 0.05
            ? halves.second > halves.first
              ? t('The Auto share rose from {first} in the first half of the period to {second} in the second half.', {
                  first: fmtPct(halves.first, 0),
                  second: fmtPct(halves.second, 0),
                })
              : t('The Auto share fell from {first} in the first half of the period to {second} in the second half.', {
                  first: fmtPct(halves.first, 0),
                  second: fmtPct(halves.second, 0),
                })
            : t('Auto picked the model for {pct} of usage, and the share stayed steady through the period.', { pct: fmtPct(average, 0) });

  return (
    <ChartCard
      title={t('Auto and hand-picked usage over time')}
      exportName="github-copilot-auto-over-time"
      calc="model-auto-over-time"
      subtitle={t('Auto picks the model for each request. Hand-picked means a person chose the model. Click a point or a bar to zoom in.')}
      option={option}
      height={320}
      empty={total <= 0 ? t('No usage in this period') : false}
      onClick={(p) => {
        const patch = bucketPatch(s.bucketer, p.dataIndex, range.end);
        if (patch) drill(patch, { merge: true });
      }}
      actions={
        <>
          <Segmented size="sm" label={t('Auto chart view')} value={view} onChange={setView} options={translated(AUTO_VIEWS)} />
          <Segmented size="sm" label={t('Group by')} value={bucket} onChange={onBucket} options={translated(BUCKET_OPTIONS)} />
        </>
      }
      footer={note}
    />
  );
}

export function ModelsOverTime() {
  const { analysis } = useAnalysis();
  const [bucket, setBucket] = useState<Bucket>(() => (analysis.range.length > 120 ? 'week' : 'day'));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <StackedModelsCard bucket={bucket} onBucket={setBucket} />
      <AutoOverTimeCard bucket={bucket} onBucket={setBucket} />
    </div>
  );
}
