import type { BarSeriesOption, LineSeriesOption } from 'echarts';
import type { EChartsOption } from '../../components/charts/EChart';
import type { ChartColors } from '../../components/charts/theme';
import { GRID } from '../../components/charts/helpers';
import { t } from '../../i18n';
import { fmtDay } from '../../lib/utils/date';
import { fmtInt, pluralize } from '../../lib/utils/format';
import type { Adoption } from './adoption';
import { dot, tipHead, tipNote, tipRow } from './tip';

const SYMBOLS_UP_TO = 40;
const SLIDER_FROM = 26;

export interface AdoptionChartInput {
  colors: ChartColors;
  adoption: Adoption;
  withYear: boolean;
}

export const hasPartialWeeks = (a: Adoption): boolean => a.days.some((d) => d < 7);

export function adoptionOption({ colors, adoption: a, withYear }: AdoptionChartInput): EChartsOption {
  const labels = a.startDay.map((d) => fmtDay(d, withYear));
  const partial = a.days.map((d) => d < 7);
  const symbols = a.count <= SYMBOLS_UP_TO;
  const slider = a.count > SLIDER_FROM;

  const point = (values: number[]) =>
    values.map((value, k) => ({ value, symbol: partial[k] ? 'emptyCircle' : 'circle' }));

  const newUsersName = t('New users');
  const totalName = t('Users so far');
  const activeName = t('Active users per week');

  const newUsers: BarSeriesOption = {
    name: newUsersName,
    type: 'bar',
    yAxisIndex: 1,
    data: a.newUsers.map((value, k) => ({ value, itemStyle: { opacity: partial[k] ? 0.5 : 1 } })),
    itemStyle: { color: colors.good },
    barMaxWidth: 22,
  };
  const total: LineSeriesOption = {
    name: totalName,
    type: 'line',
    data: point(a.cumulative),
    showSymbol: symbols,
    symbolSize: 6,
    lineStyle: { width: 2, color: colors.accent },
    itemStyle: { color: colors.accent },
    z: 3,
  };
  const active: LineSeriesOption = {
    name: activeName,
    type: 'line',
    data: point(a.weeklyActive),
    showSymbol: symbols,
    symbolSize: 6,
    lineStyle: { width: 2, color: colors.info },
    itemStyle: { color: colors.info },
    z: 4,
  };

  return {
    legend: { top: 4, left: 12 },
    grid: { ...GRID, bottom: slider ? 44 : 8 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
      formatter: (params: unknown) => {
        const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
        const i = first?.dataIndex;
        if (i === undefined || i < 0 || i >= a.count) return '';
        let notes = '';
        if (partial[i]) notes += tipNote(t('Partial week: {days} of 7 fall in this range.', { days: pluralize(a.days[i], 'day') }));
        notes += tipNote(t('Click to show only this week.'));
        return (
          tipHead(t('{from} to {to}', { from: fmtDay(a.startDay[i]), to: fmtDay(a.endDay[i], true) })) +
          tipRow(activeName, fmtInt(a.weeklyActive[i]), dot(colors.info)) +
          tipRow(totalName, fmtInt(a.cumulative[i]), dot(colors.accent)) +
          tipRow(newUsersName, fmtInt(a.newUsers[i]), dot(colors.good)) +
          notes
        );
      },
    },
    xAxis: { type: 'category', data: labels, axisLabel: { hideOverlap: true }, axisTick: { alignWithLabel: true } },
    yAxis: [
      { type: 'value', min: 0, minInterval: 1, axisLabel: { formatter: (v: number) => fmtInt(v) } },
      {
        type: 'value',
        min: 0,
        minInterval: 1,
        boundaryGap: [0, '100%'],
        splitLine: { show: false },
        axisLabel: { color: colors.good, formatter: (v: number) => fmtInt(v) },
      },
    ],
    dataZoom: slider
      ? [
          { type: 'inside', startValue: 0, endValue: a.count - 1, zoomOnMouseWheel: 'ctrl' },
          { type: 'slider', height: 18, bottom: 4, startValue: 0, endValue: a.count - 1 },
        ]
      : undefined,
    series: [newUsers, active, total],
  };
}
