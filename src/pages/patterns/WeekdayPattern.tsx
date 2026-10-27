import { useMemo, useState } from 'react';
import { ChartCard, Segmented, cx, type SegmentedOption } from '../../components/ui';
import { useChartColors, type ChartClick } from '../../components/charts/EChart';
import { msg, t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { WEEKDAY_NAMES } from '../../lib/utils/date';
import { weekdayInsight, weekdayName, weekdayStats } from './model';
import { isFiltered, weekdayOption, type WeekdayMetric } from './weekday';

const METRICS: { value: WeekdayMetric; label: string; title: string; subtitle: string }[] = [
  {
    value: 'average',
    label: msg('Average per day'),
    title: msg('Usage on a weekday divided by how many times that weekday occurs in the range'),
    subtitle: msg('Average usage on each weekday. A range with more Mondays than Fridays does not skew the bars.'),
  },
  {
    value: 'total',
    label: msg('Total usage'),
    title: msg('All usage on that weekday, added up over the range'),
    subtitle: msg('Total usage on each weekday over the range.'),
  },
  {
    value: 'active',
    label: msg('Active users per day'),
    title: msg('Average number of active users on that weekday. Days with no usage count as zero.'),
    subtitle: msg('Average active users on each weekday. Days with no usage count as zero.'),
  },
];

export default function WeekdayPattern() {
  const { analysis, filters } = useAnalysis();
  const { agg: aggregates, range } = analysis;
  const colors = useChartColors();
  const live = useApp((state) => state.filters.weekdays);
  const toggleWeekday = useApp((state) => state.toggleWeekday);
  const setFilters = useApp((state) => state.setFilters);
  const [metric, setMetric] = useState<WeekdayMetric>('average');

  const stats = useMemo(() => weekdayStats(range, aggregates.days, aggregates.dow), [range, aggregates]);
  const option = useMemo(() => weekdayOption({ colors, stats, metric, selected: filters.weekdays }), [colors, stats, metric, filters.weekdays]);
  const insight = useMemo(
    () => weekdayInsight(stats, range.length, isFiltered(filters.weekdays)),
    [stats, range.length, filters.weekdays],
  );

  const options: SegmentedOption<WeekdayMetric>[] = METRICS.map((metricOption) => ({ value: metricOption.value, label: t(metricOption.label), title: t(metricOption.title) }));
  const current = METRICS.find((metricOption) => metricOption.value === metric) ?? METRICS[0];
  const liveFilter = isFiltered(live);

  const onClick = (event: ChartClick) => {
    if (event.componentType === 'series') toggleWeekday(event.dataIndex);
  };

  return (
    <ChartCard
      title={t('Weekday pattern')}
      subtitle={`${t(current.subtitle)} ${t('Click a bar to show only that weekday.')}`}
      actions={<Segmented size="sm" label={t('Weekday measure')} value={metric} onChange={setMetric} options={options} />}
      option={option}
      height={270}
      onClick={onClick}
      exportName="github-copilot-weekday-pattern"
      label={t('Bar chart of usage by weekday')}
      empty={aggregates.totals.gross > 0 ? false : t('No usage in this range')}
      calc={['weekday-pattern', 'active-users-per-day']}
      footer={
        <div className="space-y-2">
          <p className="text-sm text-fg">{insight}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-fg-subtle">{t('Show only')}</span>
            {WEEKDAY_NAMES.map((name, dayOfWeek) => {
              const on = live.includes(dayOfWeek) && liveFilter;
              const weekday = weekdayName(dayOfWeek);
              let title = t('Show only {weekday}', { weekday });
              if (on) title = t('Remove {weekday} from the weekday filter', { weekday });
              else if (liveFilter) title = t('Add {weekday} to the weekday filter', { weekday });
              return (
                <button
                  key={dayOfWeek}
                  type="button"
                  aria-pressed={on}
                  title={title}
                  onClick={() => toggleWeekday(dayOfWeek)}
                  className={cx('chip hover:border-accent hover:text-accent', on && 'border-accent bg-accent-soft text-accent')}
                >
                  {name}
                </button>
              );
            })}
            {liveFilter ? (
              <button type="button" className="text-accent hover:underline" onClick={() => setFilters({ weekdays: [] })}>
                {t('Clear')}
              </button>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
