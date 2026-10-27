import { useMemo, useState } from 'react';
import { useChartColors, type ChartClick } from '../../components/charts/EChart';
import { DocLinks, Segmented, Select, Toggle } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { Bucket } from '../../lib/analytics/series';
import { fmtDay } from '../../lib/utils/date';
import { fmtMultiple, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { ChartPanel } from './ChartPanel';
import { anomalyMarks, bucketRange, buildUsageSeries, SPLIT_LABELS, splitChoices, toCumulative, type SplitBy } from './helpers';
import { usageOverTimeOption } from './options';

// A natural scale, so the buttons keep this order. English labels; shown through t().
const BUCKETS: { value: Bucket; label: string }[] = [
  { value: 'day', label: msg('Day') },
  { value: 'week', label: msg('Week') },
  { value: 'month', label: msg('Month') },
];

const MODES = [
  { value: 'bars', label: msg('Bars') },
  { value: 'cumulative', label: msg('Running total') },
] as const;

type Mode = (typeof MODES)[number]['value'];

const BUCKET_LABEL: Record<Bucket, string> = {
  day: msg('Usage per day'),
  week: msg('Usage per week'),
  month: msg('Usage per month'),
};

export function UsageOverTime() {
  const { analysis, store, models } = useAnalysis();
  const colors = useChartColors();
  const { agg: aggregates, mask, range, anomalies, coverage } = analysis;
  const billing = coverage.billing;
  const [picked, setPicked] = useState<Bucket | null>(null);
  const [splitPick, setSplitPick] = useState<SplitBy>('coverage');
  const [mode, setMode] = useState<Mode>('bars');
  const [pins, setPins] = useState(true);

  const bucket: Bucket = picked ?? (range.length > 120 ? 'week' : 'day');
  const choices = useMemo(() => splitChoices(aggregates, models, billing), [aggregates, models, billing]);
  const split: SplitBy = choices.includes(splitPick) ? splitPick : billing ? 'coverage' : 'total';

  const usage = useMemo(() => buildUsageSeries({ store, mask, range, agg: aggregates, models, bucket, split, colors }), [store, mask, range, aggregates, models, bucket, split, colors]);
  const single = usage.labels.length < 2;
  const cumulative = mode === 'cumulative' && !single;
  const view = useMemo(() => (cumulative ? toCumulative(usage) : usage), [usage, cumulative]);
  const marks = useMemo(() => (pins ? anomalyMarks(anomalies, usage.bucketer, view.totals) : []), [pins, anomalies, usage.bucketer, view.totals]);
  const option = useMemo(() => usageOverTimeOption(colors, { usage: view, cumulative, marks, store }), [colors, view, cumulative, marks, store]);

  // The largest unusual days, in date order, as shortcuts that zoom into one day.
  const chips = useMemo(() => [...anomalies].sort((a, b) => b.z - a.z).slice(0, 6).sort((a, b) => a.day - b.day), [anomalies]);

  const zoom = (event: ChartClick) => {
    const coord = (event.data as { coord?: number[] } | null | undefined)?.coord;
    const bucketIndex = event.componentType === 'markPoint' && coord ? coord[0] : event.dataIndex;
    if (!Number.isInteger(bucketIndex) || bucketIndex < 0 || bucketIndex >= usage.bucketer.count || usage.bucketer.count < 2) return;
    setPicked(null);
    drill(bucketRange(usage.bucketer, bucketIndex, range.end), { merge: true });
  };

  const perBucket = t(BUCKET_LABEL[bucket]);
  const chipRow =
    pins && chips.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">
        <span>{t('Unusual days')}:</span>
        {chips.map((anomaly) => (
          <button
            key={anomaly.day}
            type="button"
            className="btn btn-sm"
            title={t('{date}: {amount}, {multiple} a typical day. Click to zoom into this day.', {
              date: fmtDay(anomaly.day, true),
              amount: fmtUSD(anomaly.gross),
              multiple: fmtMultiple(anomaly.multiple),
            })}
            onClick={() => drill({ dateFrom: anomaly.day, dateTo: anomaly.day }, { merge: true })}
          >
            {fmtDay(anomaly.day)} · {fmtUSD(anomaly.gross, 0)} · {fmtMultiple(anomaly.multiple)}
          </button>
        ))}
      </div>
    ) : null;
  const costCenterLinks = split === 'costCenter' ? <DocLinks topic="costCenters" title={t('Learn more')} limit={3} compact /> : null;

  return (
    <ChartPanel
      title={t('Usage over time')}
      calc="usage-over-time-split"
      subtitle={
        single
          ? t('Value of AI credits used.')
          : cumulative
            ? t('Running total of usage over the selected period.')
            : t('Value of AI credits used. Click a bar to zoom into that period.')
      }
      controls={
        <>
          <Segmented size="sm" label={t('Group by')} value={bucket} onChange={setPicked} options={BUCKETS.map((bucketOption) => ({ value: bucketOption.value, label: t(bucketOption.label) }))} />
          {choices.length > 1 ? (
            <label className="flex items-center gap-1.5 text-xs text-fg-muted">
              {t('Stack by')}
              <Select
                aria-label={t('Stack by')}
                className="!py-0.5 text-xs"
                value={split}
                onChange={setSplitPick}
                options={choices.map((choice) => ({ value: choice, label: t(SPLIT_LABELS[choice]) }))}
              />
            </label>
          ) : null}
          {single ? null : (
            <Segmented size="sm" label={t('Chart type')} value={mode} onChange={setMode} options={MODES.map((modeOption) => ({ value: modeOption.value, label: t(modeOption.label) }))} />
          )}
          {anomalies.length > 0 ? <Toggle checked={pins} onChange={setPins} label={<span className="text-xs">{t('Mark unusual days')}</span>} /> : null}
        </>
      }
      option={option}
      height={340}
      empty={aggregates.totals.gross > 0 ? false : t('No usage in this period')}
      onClick={zoom}
      exportName="github-copilot-usage-over-time"
      label={split === 'total' ? perBucket : t('{chart}, stacked by {split}', { chart: perBucket, split: t(SPLIT_LABELS[split]) })}
      footer={
        chipRow || costCenterLinks ? (
          <div className="space-y-2">
            {chipRow}
            {costCenterLinks}
          </div>
        ) : undefined
      }
    />
  );
}
