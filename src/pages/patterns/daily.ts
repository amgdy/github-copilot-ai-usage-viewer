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
export function anomalyText(a: AnomalyDay): string {
  const times = fmtNum(a.multiple, a.multiple >= 10 ? 0 : 1);
  return t('{times} times the typical day (about {amount})', { times, amount: fmtUSD(a.baseline, a.baseline >= 10 ? 0 : 2) });
}

/** An unusual day, placed on the chart bucket that holds it. A week can hold more than one. */
export interface Mark {
  idx: number;
  anomalies: AnomalyDay[];
}

export function marksFor(b: DailyBuckets, anomalies: AnomalyDay[]): Mark[] {
  const byIdx = new Map<number, AnomalyDay[]>();
  for (const a of anomalies) {
    const idx = b.indexOfDay(a.day);
    if (idx < 0 || idx >= b.count) continue;
    const list = byIdx.get(idx);
    if (list) list.push(a);
    else byIdx.set(idx, [a]);
  }
  return [...byIdx.entries()].map(([idx, list]) => ({ idx, anomalies: list })).sort((x, y) => x.idx - y.idx);
}

function markNotes(b: DailyBuckets, m: Mark): string {
  if (b.granularity === 'day') return tipNote(t('Unusual day: {detail}', { detail: anomalyText(m.anomalies[0]) }));
  return m.anomalies.map((a) => tipNote(t('{date} was unusual: {detail}', { date: fmtDay(a.day), detail: anomalyText(a) }))).join('');
}

export function hasAverage(b: DailyBuckets): boolean {
  return b.average.some((v) => v !== null);
}

export interface DailyInput {
  colors: ChartColors;
  buckets: DailyBuckets;
  marks: Mark[];
  zoom: ZoomSpec;
  showActive: boolean;
}

function axisTooltip({ colors, buckets: b, marks, showActive }: DailyInput) {
  const day = b.granularity === 'day';
  const markAt = new Map(marks.map((m) => [m.idx, m]));
  return (params: unknown): string => {
    const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
    const i = first?.dataIndex;
    if (i === undefined || i < 0 || i >= b.count) return '';
    const head = day
      ? t('{weekday}, {date}', { weekday: weekdayName(dowOf(b.startDay[i])), date: fmtDay(b.startDay[i], true) })
      : t('{from} to {to}', { from: fmtDay(b.startDay[i]), to: fmtDay(b.endDay[i], true) });
    const rows = [tipRow(day ? t('Usage') : t('Usage in the week'), fmtUSD(b.gross[i]), dot(colors.accent))];
    const avg = b.average[i];
    if (avg !== null) rows.push(tipRow(day ? t('7-day average') : t('4-week average'), fmtUSD(avg), dot(colors.text)));
    if (showActive) {
      rows.push(
        tipRow(t('Active users per day'), day ? fmtInt(b.avgActive[i]) : fmtNum(b.avgActive[i], 1), dot(colors.info)),
      );
    }
    let notes = '';
    if (b.partial[i]) notes += tipNote(t('Partial week: {days} fall in this range.', { days: pluralize(b.span[i], 'day') }));
    const mark = markAt.get(i);
    if (mark) notes += markNotes(b, mark);
    if (b.gross[i] > 0) notes += tipNote(day ? t('Click to show only this day.') : t('Click to show only this week.'));
    return tipHead(head) + rows.join('') + notes;
  };
}

export function dailyOption(input: DailyInput): EChartsOption {
  const { colors, buckets: b, marks, zoom, showActive } = input;
  const day = b.granularity === 'day';
  const showAverage = hasAverage(b);

  const bars: BarSeriesOption = {
    name: day ? t('Usage per day') : t('Usage per week'),
    type: 'bar',
    data: b.gross.map((value, k) => ({
      value,
      itemStyle: { opacity: (day && isWeekend(b.startDay[k])) || b.partial[k] ? 0.5 : 1 },
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
                  formatter: (p: unknown) => fmtMultiple(Number((p as { value?: unknown }).value)),
                }
              : { show: false },
            tooltip: {
              formatter: (p: unknown) => {
                const m = marks[(p as { dataIndex: number }).dataIndex];
                return m ? tipHead(fmtDay(m.anomalies[0].day, true)) + markNotes(b, m) : '';
              },
            },
            data: marks.map((m) => ({ name: b.labels[m.idx], coord: [m.idx, b.gross[m.idx]], value: m.anomalies[0].multiple })),
          }
        : undefined,
  };

  const series: SeriesOption[] = [bars];
  if (showAverage) {
    const average: LineSeriesOption = {
      name: day ? t('7-day average') : t('4-week average'),
      type: 'line',
      data: b.average,
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
      data: b.avgActive,
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
    xAxis: { type: 'category', data: b.labels, axisLabel: { hideOverlap: true }, axisTick: { alignWithLabel: true } },
    yAxis: [
      {
        type: 'value',
        axisLabel: { formatter: (v: number) => usdCompact(v) },
        boundaryGap: [0, marks.length > 0 && day ? '18%' : 0],
      },
      ...(showActive
        ? [{ type: 'value' as const, minInterval: 1, splitLine: { show: false }, axisLabel: { color: colors.info, formatter: (v: number) => fmtInt(v) } }]
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
