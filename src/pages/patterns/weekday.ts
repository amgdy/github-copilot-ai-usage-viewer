import type { BarSeriesOption } from 'echarts';
import type { EChartsOption } from '../../components/charts/EChart';
import type { ChartColors } from '../../components/charts/theme';
import { GRID, usdCompact } from '../../components/charts/helpers';
import { t, tp } from '../../i18n';
import { WEEKDAY_NAMES } from '../../lib/utils/date';
import { fmtInt, fmtNum, fmtPct, fmtUSD } from '../../lib/utils/format';
import { weekdayName, type WeekdayStat } from './model';
import { tipHead, tipNote, tipRow } from './tip';

export type WeekdayMetric = 'average' | 'total' | 'active';

export const metricValue = (stat: WeekdayStat, metric: WeekdayMetric): number =>
  metric === 'average' ? stat.perOccurrence : metric === 'total' ? stat.gross : stat.activeUsers;

export interface WeekdayInput {
  colors: ChartColors;
  stats: WeekdayStat[];
  metric: WeekdayMetric;
  /** Weekdays the analysis is filtered to (Monday = 0). */
  selected: number[];
}

export const isFiltered = (selected: number[]): boolean => selected.length > 0 && selected.length < 7;

export function weekdayOption({ colors, stats, metric, selected }: WeekdayInput): EChartsOption {
  const filtered = isFiltered(selected);
  const isSelected = (dayOfWeek: number): boolean => filtered && selected.includes(dayOfWeek);
  const money = metric !== 'active';
  const format = (value: number): string => (money ? usdCompact(value) : fmtNum(value, 1));

  const bars: BarSeriesOption = {
    type: 'bar',
    barMaxWidth: 36,
    data: stats.map((stat) => {
      const barValue = metricValue(stat, metric);
      return {
        value: Number.isFinite(barValue) ? barValue : null,
        itemStyle: {
          color: colors.accent,
          opacity: stat.dow >= 5 ? 0.6 : 1,
          borderColor: colors.text,
          borderWidth: isSelected(stat.dow) ? 2 : 0,
        },
      };
    }),
    label: { show: true, position: 'top', color: colors.textMuted, fontSize: 12, formatter: (chartItem: unknown) => format(Number((chartItem as { value?: unknown }).value)) },
    labelLayout: { hideOverlap: true },
  };

  return {
    grid: { ...GRID, top: 28 },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (chartItem: unknown) => {
        const stat = stats[(chartItem as { dataIndex: number }).dataIndex];
        if (!stat) return '';
        let hint = t('Click to show only this weekday.');
        if (isSelected(stat.dow)) hint = t('Click to take this weekday out of the weekday filter.');
        else if (filtered) hint = t('Click to add this weekday to the weekday filter.');
        return (
          tipHead(weekdayName(stat.dow)) +
          tipRow(t('Usage'), fmtUSD(stat.gross)) +
          tipRow(t('Share of usage'), fmtPct(stat.share, 1)) +
          tipRow(t('Average per day'), fmtUSD(stat.perOccurrence)) +
          tipRow(t('Active users per day'), fmtNum(stat.activeUsers, 1)) +
          tipNote(
            tp(stat.occurrences, 'This weekday occurs {n} time in the range, {usage} with usage.', 'This weekday occurs {n} times in the range, {usage} with usage.', {
              n: fmtInt(stat.occurrences),
              usage: fmtInt(stat.usageDays),
            }),
          ) +
          tipNote(hint)
        );
      },
    },
    xAxis: {
      type: 'category',
      data: WEEKDAY_NAMES,
      axisTick: { show: false },
      axisLabel: {
        interval: 0,
        formatter: (label: string, dayOfWeek: number) => (isSelected(dayOfWeek) ? `{sel|${label}}` : label),
        rich: { sel: { color: colors.accent, fontWeight: 700 } },
      },
    },
    yAxis: {
      type: 'value',
      minInterval: metric === 'active' ? 1 : undefined,
      axisLabel: { formatter: (value: number) => (money ? usdCompact(value) : fmtNum(value, 0)) },
    },
    series: [bars],
  };
}
