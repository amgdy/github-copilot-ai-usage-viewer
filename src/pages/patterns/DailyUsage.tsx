import { useMemo, useState } from 'react';
import { ChartCard, Segmented, Toggle } from '../../components/ui';
import { useChartColors, type ChartClick } from '../../components/charts/EChart';
import { msg, t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { pluralize } from '../../lib/utils/format';
import { LATEST_DAYS, LONG_RANGE_DAYS, dailyBuckets, zoomSpec, type Granularity } from './model';
import { dailyOption, hasAverage, marksFor } from './daily';

const MIN_DAYS_FOR_WEEKS = 14;

const GRANULARITY_OPTIONS = [
  { value: 'day' as const, label: msg('Days'), title: msg('One bar per day') },
  { value: 'week' as const, label: msg('Weeks'), title: msg('One bar per week, Monday to Sunday') },
];

export default function DailyUsage() {
  const { analysis } = useAnalysis();
  const { agg: aggregates, range, anomalies } = analysis;
  const colors = useChartColors();
  const [choice, setChoice] = useState<Granularity | null>(null);
  const [showActive, setShowActive] = useState(false);

  const canAggregate = range.length >= MIN_DAYS_FOR_WEEKS;
  const granularity: Granularity = !canAggregate ? 'day' : (choice ?? (range.length > LONG_RANGE_DAYS ? 'week' : 'day'));
  const day = granularity === 'day';

  const buckets = useMemo(() => dailyBuckets(range, aggregates.days, granularity), [range, aggregates, granularity]);
  const marks = useMemo(() => marksFor(buckets, anomalies), [buckets, anomalies]);
  const zoom = useMemo(() => zoomSpec(granularity, buckets.count, range.length), [granularity, buckets.count, range.length]);
  const option = useMemo(
    () => dailyOption({ colors, buckets, marks, zoom, showActive }),
    [colors, buckets, marks, zoom, showActive],
  );

  const drillTo = (from: number, to: number) => drill({ dateFrom: from, dateTo: to }, { merge: true });

  const onClick = (event: ChartClick) => {
    if (event.componentType === 'markPoint') {
      const mark = marks[event.dataIndex];
      if (!mark) return;
      if (mark.anomalies.length === 1) drillTo(mark.anomalies[0].day, mark.anomalies[0].day);
      else drillTo(buckets.startDay[mark.idx], buckets.endDay[mark.idx]);
      return;
    }
    if (event.componentType !== 'series') return;
    const bucketIndex = event.dataIndex;
    if (buckets.gross[bucketIndex] > 0) drillTo(buckets.startDay[bucketIndex], buckets.endDay[bucketIndex]);
  };

  const notes: string[] = [];
  if (hasAverage(buckets)) {
    notes.push(
      day
        ? t('The line is the average of the last 7 days, so a quiet weekend does not look like a drop.')
        : t('The line is the average week over the last 4 weeks.'),
    );
  }
  if (day) notes.push(t('Weekend bars are lighter.'));
  else if (buckets.partial.some(Boolean)) notes.push(t('Lighter bars are weeks only partly inside the range.'));
  if (marks.length > 0) notes.push(t('Red markers are unusual days, listed in the table further down.'));
  notes.push(day ? t('Click a bar to show only that day.') : t('Click a bar to show only that week.'));
  if (zoom.narrowed) notes.push(t('Zoomed to the latest {days}. Drag the slider to see earlier days.', { days: pluralize(LATEST_DAYS, 'day') }));
  else if (zoom.slider) notes.push(t('Drag the slider to zoom in.'));

  const options = GRANULARITY_OPTIONS.map((granularityOption) => ({ ...granularityOption, label: t(granularityOption.label), title: t(granularityOption.title) }));

  return (
    <ChartCard
      title={t('Daily usage')}
      subtitle={day ? t('Usage per day.') : t('Usage per week, Monday to Sunday.')}
      actions={
        <>
          {canAggregate ? <Segmented size="sm" label={t('Group usage by')} value={granularity} onChange={setChoice} options={options} /> : null}
          <Toggle checked={showActive} onChange={setShowActive} label={t('Active users per day')} />
        </>
      }
      option={option}
      height={340}
      onClick={onClick}
      exportName="github-copilot-daily-usage"
      label={day ? t('Bar chart of usage per day with a moving average') : t('Bar chart of usage per week with a moving average')}
      empty={aggregates.totals.gross > 0 ? false : t('No usage in this range')}
      footer={notes.join(' ')}
      calc={['daily-usage', 'moving-average', 'active-users-per-day']}
    />
  );
}
