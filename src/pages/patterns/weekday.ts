import type { BarSeriesOption } from 'echarts';
import type { EChartsOption } from '../../components/charts/EChart';
import type { ChartColors } from '../../components/charts/theme';
import { GRID, usdCompact } from '../../components/charts/helpers';
import { t, tp } from '../../i18n';
import { DOW_NAMES } from '../../lib/utils/date';
import { fmtInt, fmtNum, fmtPct, fmtUSD } from '../../lib/utils/format';
import { weekdayName, type WeekdayStat } from './model';
import { tipHead, tipNote, tipRow } from './tip';

export type WeekdayMetric = 'average' | 'total' | 'active';

export const metricValue = (s: WeekdayStat, metric: WeekdayMetric): number =>
  metric === 'average' ? s.perOccurrence : metric === 'total' ? s.gross : s.activeUsers;

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
  const isSelected = (d: number): boolean => filtered && selected.includes(d);
  const money = metric !== 'active';
  const format = (v: number): string => (money ? usdCompact(v) : fmtNum(v, 1));

  const bars: BarSeriesOption = {
    type: 'bar',
    barMaxWidth: 36,
    data: stats.map((s) => {
      const v = metricValue(s, metric);
      return {
        value: Number.isFinite(v) ? v : null,
        itemStyle: {
          color: colors.accent,
          opacity: s.dow >= 5 ? 0.6 : 1,
          borderColor: colors.text,
          borderWidth: isSelected(s.dow) ? 2 : 0,
        },
      };
    }),
    label: { show: true, position: 'top', color: colors.textMuted, fontSize: 12, formatter: (p: unknown) => format(Number((p as { value?: unknown }).value)) },
    labelLayout: { hideOverlap: true },
  };

  return {
    grid: { ...GRID, top: 28 },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p: unknown) => {
        const s = stats[(p as { dataIndex: number }).dataIndex];
        if (!s) return '';
        let hint = t('Click to show only this weekday.');
        if (isSelected(s.dow)) hint = t('Click to take this weekday out of the weekday filter.');
        else if (filtered) hint = t('Click to add this weekday to the weekday filter.');
        return (
          tipHead(weekdayName(s.dow)) +
          tipRow(t('Usage'), fmtUSD(s.gross)) +
          tipRow(t('Share of usage'), fmtPct(s.share, 1)) +
          tipRow(t('Average per day'), fmtUSD(s.perOccurrence)) +
          tipRow(t('Active users per day'), fmtNum(s.activeUsers, 1)) +
          tipNote(
            tp(s.occurrences, 'This weekday occurs {n} time in the range, {usage} with usage.', 'This weekday occurs {n} times in the range, {usage} with usage.', {
              n: fmtInt(s.occurrences),
              usage: fmtInt(s.usageDays),
            }),
          ) +
          tipNote(hint)
        );
      },
    },
    xAxis: {
      type: 'category',
      data: DOW_NAMES,
      axisTick: { show: false },
      axisLabel: {
        interval: 0,
        formatter: (v: string, idx: number) => (isSelected(idx) ? `{sel|${v}}` : v),
        rich: { sel: { color: colors.accent, fontWeight: 700 } },
      },
    },
    yAxis: {
      type: 'value',
      minInterval: metric === 'active' ? 1 : undefined,
      axisLabel: { formatter: (v: number) => (money ? usdCompact(v) : fmtNum(v, 0)) },
    },
    series: [bars],
  };
}
