import type { BarSeriesOption, LineSeriesOption, SeriesOption } from 'echarts';
import type { EChartsOption } from '../../components/charts/EChart';
import type { ChartColors } from '../../components/charts/theme';
import { GRID, usdCompact } from '../../components/charts/helpers';
import type { AnomalyDay } from '../../lib/analytics/anomalies';
import { t } from '../../i18n';
import { dowOf, fmtDay } from '../../lib/utils/date';
import { fmtInt, fmtMultiple, fmtNum, fmtUSD, pluralize } from '../../lib/utils/format';
import { readableOn } from './colors';
import { isWeekend, weekdayName, type DailyBuckets, type ZoomSpec } from './model';
import { dot, tipHead, tipNote, tipRow } from './tip';

/** "4.2 times the typical day (about $55)". */
export function anomalyText(anomaly: AnomalyDay): string {
  const times = fmtNum(anomaly.multiple, anomaly.multiple >= 10 ? 0 : 1);
  return t('{times} times the typical day (about {amount})', { times, amount: fmtUSD(anomaly.baseline, anomaly.baseline >= 10 ? 0 : 2) });
}

/** An unusual day, placed on the chart bucket that holds it. A week can hold more than one. */
export interface Mark {
  idx: number;
  anomalies: AnomalyDay[];
}

export function marksFor(buckets: DailyBuckets, anomalies: AnomalyDay[]): Mark[] {
  const byIdx = new Map<number, AnomalyDay[]>();
  for (const anomaly of anomalies) {
    const bucketIndex = buckets.indexOfDay(anomaly.day);
    if (bucketIndex < 0 || bucketIndex >= buckets.count) continue;
    const list = byIdx.get(bucketIndex);
    if (list) list.push(anomaly);
    else byIdx.set(bucketIndex, [anomaly]);
  }
  return [...byIdx.entries()].map(([bucketIndex, list]) => ({ idx: bucketIndex, anomalies: list })).sort((first, second) => first.idx - second.idx);
}

function markNotes(buckets: DailyBuckets, mark: Mark): string {
  if (buckets.granularity === 'day') return tipNote(t('Unusual day: {detail}', { detail: anomalyText(mark.anomalies[0]) }));
  return mark.anomalies.map((anomaly) => tipNote(t('{date} was unusual: {detail}', { date: fmtDay(anomaly.day), detail: anomalyText(anomaly) }))).join('');
}

export function hasAverage(buckets: DailyBuckets): boolean {
  return buckets.average.some((average) => average !== null);
}

export interface DailyInput {
  colors: ChartColors;
  buckets: DailyBuckets;
  marks: Mark[];
  zoom: ZoomSpec;
  showActive: boolean;
}

function axisTooltip({ colors, buckets: buckets, marks, showActive }: DailyInput) {
  const day = buckets.granularity === 'day';
  const markAt = new Map(marks.map((mark) => [mark.idx, mark]));
  return (params: unknown): string => {
    const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
    const bucketIndex = first?.dataIndex;
    if (bucketIndex === undefined || bucketIndex < 0 || bucketIndex >= buckets.count) return '';
    const head = day
      ? t('{weekday}, {date}', { weekday: weekdayName(dowOf(buckets.startDay[bucketIndex])), date: fmtDay(buckets.startDay[bucketIndex], true) })
      : t('{from} to {to}', { from: fmtDay(buckets.startDay[bucketIndex]), to: fmtDay(buckets.endDay[bucketIndex], true) });
    const rows = [tipRow(day ? t('Usage') : t('Usage in the week'), fmtUSD(buckets.gross[bucketIndex]), dot(colors.accent))];
    const average = buckets.average[bucketIndex];
    if (average !== null) rows.push(tipRow(day ? t('7-day average') : t('4-week average'), fmtUSD(average), dot(colors.text)));
    if (showActive) {
      rows.push(
        tipRow(t('Active users per day'), day ? fmtInt(buckets.avgActive[bucketIndex]) : fmtNum(buckets.avgActive[bucketIndex], 1), dot(colors.info)),
      );
    }
    let notes = '';
    if (buckets.partial[bucketIndex]) notes += tipNote(t('Partial week: {days} fall in this range.', { days: pluralize(buckets.span[bucketIndex], 'day') }));
    const mark = markAt.get(bucketIndex);
    if (mark) notes += markNotes(buckets, mark);
    if (buckets.gross[bucketIndex] > 0) notes += tipNote(day ? t('Click to show only this day.') : t('Click to show only this week.'));
    return tipHead(head) + rows.join('') + notes;
  };
}

export function dailyOption(input: DailyInput): EChartsOption {
  const { colors, buckets: buckets, marks, zoom, showActive } = input;
  const day = buckets.granularity === 'day';
  const showAverage = hasAverage(buckets);

  const bars: BarSeriesOption = {
    name: day ? t('Usage per day') : t('Usage per week'),
    type: 'bar',
    data: buckets.gross.map((value, bucketIndex) => ({
      value,
      itemStyle: { opacity: (day && isWeekend(buckets.startDay[bucketIndex])) || buckets.partial[bucketIndex] ? 0.5 : 1 },
    })),
    itemStyle: { color: colors.accent },
    barMaxWidth: 24,
    markPoint:
      marks.length > 0
        ? {
            symbol: day ? 'pin' : 'circle',
            symbolSize: day ? 42 : 10,
            itemStyle: { color: colors.bad },
            label: day
              ? {
                  show: true,
                  color: readableOn(colors, colors.bad),
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (chartItem: unknown) => fmtMultiple(Number((chartItem as { value?: unknown }).value)),
                }
              : { show: false },
            tooltip: {
              formatter: (chartItem: unknown) => {
                const mark = marks[(chartItem as { dataIndex: number }).dataIndex];
                return mark ? tipHead(fmtDay(mark.anomalies[0].day, true)) + markNotes(buckets, mark) : '';
              },
            },
            data: marks.map((mark) => ({ name: buckets.labels[mark.idx], coord: [mark.idx, buckets.gross[mark.idx]], value: mark.anomalies[0].multiple })),
          }
        : undefined,
  };

  const series: SeriesOption[] = [bars];
  if (showAverage) {
    const average: LineSeriesOption = {
      name: day ? t('7-day average') : t('4-week average'),
      type: 'line',
      data: buckets.average,
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2, color: colors.text },
      itemStyle: { color: colors.text },
      z: 3,
    };
    series.push(average);
  }
  if (showActive) {
    const active: LineSeriesOption = {
      name: t('Active users per day'),
      type: 'line',
      yAxisIndex: 1,
      data: buckets.avgActive,
      showSymbol: false,
      lineStyle: { width: 1.5, color: colors.info },
      itemStyle: { color: colors.info },
      z: 2,
    };
    series.push(active);
  }

  return {
    legend: { top: 4, left: 12 },
    grid: { ...GRID, right: showActive ? 8 : 16, bottom: zoom.slider ? 44 : 8 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true, formatter: axisTooltip(input) },
    xAxis: { type: 'category', data: buckets.labels, axisLabel: { hideOverlap: true }, axisTick: { alignWithLabel: true } },
    yAxis: [
      {
        type: 'value',
        axisLabel: { formatter: (value: number) => usdCompact(value) },
        boundaryGap: [0, marks.length > 0 && day ? '18%' : 0],
      },
      ...(showActive
        ? [{ type: 'value' as const, minInterval: 1, splitLine: { show: false }, axisLabel: { color: colors.info, formatter: (value: number) => fmtInt(value) } }]
        : []),
    ],
    dataZoom: zoom.slider
      ? [
          { type: 'inside', startValue: zoom.from, endValue: zoom.to, zoomOnMouseWheel: 'ctrl' },
          { type: 'slider', height: 18, bottom: 4, startValue: zoom.from, endValue: zoom.to },
        ]
      : undefined,
    series,
  };
}
