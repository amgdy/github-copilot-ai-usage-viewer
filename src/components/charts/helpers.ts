import type { EChartsOption } from 'echarts';
import { t } from '../../i18n';
import { fmtPct, fmtUSD, fmtUSDCompact } from '../../lib/utils/format';
import type { ChartColors } from './theme';

export const usd = (value: unknown): string => fmtUSD(Number(value), 'auto');
export const usdCompact = (value: unknown): string => fmtUSDCompact(Number(value));

export const GRID = { left: 8, right: 16, top: 36, bottom: 8, containLabel: true } as const;

interface TipParam {
  marker?: string;
  seriesName?: string;
  name?: string;
  value?: unknown;
  axisValueLabel?: string;
}

/** Escapes text from the CSV for the HTML of a chart tooltip. */
export const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Rough pixel width of a value label at the chart font size, plus a small gap. */
const labelPx = (text: string, fontSize = 12): number => Math.ceil(text.length * fontSize * 0.58) + 8;

/** Axis tooltip that lists non-zero series largest first, plus a total. */
export function stackTooltip(format: (value: number) => string, options: { total?: boolean; max?: number } = {}) {
  const { total = true, max = 12 } = options;
  return (params: unknown): string => {
    const points = ((Array.isArray(params) ? params : [params]) as TipParam[])
      .map((param) => ({ ...param, v: Array.isArray(param.value) ? Number(param.value[1]) : Number(param.value) }))
      .filter((point) => Number.isFinite(point.v) && point.v !== 0)
      .sort((a, b) => b.v - a.v);
    if (!points.length) return '';
    const head = points[0].axisValueLabel ?? points[0].name ?? '';
    const shown = points.slice(0, max);
    const rest = points.slice(max);
    const rows = shown
      .map((point) => `<div style="display:flex;justify-content:space-between;gap:16px"><span>${point.marker ?? ''}${escapeHtml(point.seriesName ?? '')}</span><b>${format(point.v)}</b></div>`)
      .join('');
    const more = rest.length ? `<div style="opacity:.7">${escapeHtml(t('and {n} more', { n: rest.length }))}: ${format(rest.reduce((runningTotal, point) => runningTotal + point.v, 0))}</div>` : '';
    const sum = total && points.length > 1 ? `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px;padding-top:4px;border-top:1px solid var(--cp-border)"><span>${escapeHtml(t('Total'))}</span><b>${format(points.reduce((runningTotal, point) => runningTotal + point.v, 0))}</b></div>` : '';
    return `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(String(head))}</div>${rows}${more}${sum}`;
  };
}

export interface TimeSeriesInput {
  name: string;
  data: ArrayLike<number>;
  color?: string;
}

export interface StackedTimeOptions {
  labels: string[];
  series: TimeSeriesInput[];
  /** Everything outside the listed series. */
  other?: ArrayLike<number> | null;
  otherName?: string;
  kind?: 'bar' | 'area' | 'line';
  stack?: boolean;
  format?: (value: number) => string;
  legend?: boolean;
  zoom?: boolean;
  /** Reference lines drawn on the first series (e.g. pool capacity). */
  markLines?: { name: string; y: number; color?: string }[];
}

/** Stacked bars or areas over time, with a tooltip that sorts and totals the series. */
export function stackedTimeOption(colors: ChartColors, options: StackedTimeOptions): EChartsOption {
  const format = options.format ?? usd;
  const kind = options.kind ?? 'bar';
  const stack = options.stack ?? kind !== 'line';
  const all: TimeSeriesInput[] = [...options.series];
  if (options.other) all.push({ name: options.otherName ?? t('Other'), data: options.other, color: colors.muted });
  const dense = options.labels.length > 45;
  const series = all.map((seriesInput, index) => ({
    name: seriesInput.name,
    type: kind === 'bar' ? ('bar' as const) : ('line' as const),
    stack: stack ? 'total' : undefined,
    data: Array.from(seriesInput.data),
    color: seriesInput.color ?? colors.palette[index % colors.palette.length],
    barMaxWidth: 28,
    showSymbol: false,
    smooth: false,
    areaStyle: kind === 'area' ? { opacity: stack ? 0.75 : 0.18 } : undefined,
    lineStyle: kind === 'bar' ? undefined : { width: stack ? 1 : 2 },
    emphasis: { focus: 'series' as const },
    markLine:
      index === 0 && options.markLines?.length
        ? {
            symbol: 'none',
            silent: true,
            animation: false,
            label: { formatter: '{b}', position: 'insideEndTop' as const, color: colors.textMuted, fontSize: 12 },
            lineStyle: { type: 'dashed' as const, width: 1.2 },
            data: options.markLines.map((markLine) => ({ name: markLine.name, yAxis: markLine.y, lineStyle: { color: markLine.color ?? colors.textSubtle } })),
          }
        : undefined,
  }));
  return {
    grid: { ...GRID, top: options.legend === false ? 16 : 36, bottom: options.zoom ? 40 : 8 },
    legend: options.legend === false ? { show: false } : { top: 0, type: 'scroll', data: all.map((seriesInput) => seriesInput.name) },
    tooltip: { trigger: 'axis', axisPointer: { type: kind === 'bar' ? 'shadow' : 'line' }, formatter: stackTooltip(format, { total: stack }) },
    xAxis: { type: 'category', data: options.labels, axisLabel: { hideOverlap: true, interval: dense ? 'auto' : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: (value: number) => (format === usd ? usdCompact(value) : format(value)) } },
    dataZoom: options.zoom ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 4 }] : undefined,
    series,
  };
}

export interface RankItem {
  name: string;
  value: number;
  color?: string;
  /** Extra line in the tooltip. */
  note?: string;
}

export interface RankBarOptions {
  items: RankItem[];
  format?: (value: number) => string;
  color?: string;
  /** Pixel width of the category labels. */
  labelWidth?: number;
  max?: number;
}

/** Horizontal ranking bars, largest first (top to bottom). Negative values grow to the left of the zero line. */
export function rankBarOption(colors: ChartColors, options: RankBarOptions): EChartsOption {
  const format = options.format ?? usd;
  const items = options.items;
  const negatives = items.filter((item) => item.value < 0);
  const widest = (list: RankItem[]) => list.reduce((maxWidth, item) => Math.max(maxWidth, labelPx(format(item.value))), 0);
  const right = Math.max(16, widest(items.filter((item) => item.value >= 0)));
  const left = negatives.length ? Math.max(8, widest(negatives)) : 8;
  const lowest = negatives.reduce((minValue, item) => Math.min(minValue, item.value), 0);
  const highest = items.reduce((maxValue, item) => Math.max(maxValue, item.value), 0);
  return {
    grid: { left, right, top: 4, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (param: unknown) => {
        const dataIndex = (param as { dataIndex: number }).dataIndex;
        const item = items[dataIndex];
        return `<b>${escapeHtml(item.name)}</b><br/>${format(item.value)}${item.note ? `<br/><span style="opacity:.75">${escapeHtml(item.note)}</span>` : ''}`;
      },
    },
    xAxis: { type: 'value', show: false, max: options.max, min: negatives.length ? lowest - (highest - lowest) * 0.05 : undefined },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map((item) => item.name),
      axisLabel: { width: options.labelWidth ?? 130, overflow: 'truncate', color: colors.text, fontSize: 12 },
      axisLine: { show: false, onZero: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => ({
          value: item.value,
          itemStyle: { color: item.color ?? options.color ?? colors.accent },
          label: { position: item.value < 0 ? 'left' : 'right' },
        })),
        barMaxWidth: 18,
        label: { show: true, position: 'right', color: colors.textMuted, fontSize: 12, formatter: (param: { value?: unknown }) => format(Number(param.value)) },
      },
    ],
  };
}

export interface DonutItem {
  name: string;
  value: number;
  color?: string;
}

export interface DonutOptions {
  items: DonutItem[];
  format?: (value: number) => string;
  /** Big text in the hole, and the caption under it. */
  center?: { value: string; caption?: string };
  legend?: 'right' | 'bottom' | 'none';
}

export function donutOption(colors: ChartColors, options: DonutOptions): EChartsOption {
  const format = options.format ?? usd;
  const total = options.items.reduce((runningTotal, item) => runningTotal + item.value, 0);
  const legend = options.legend ?? 'right';
  const centerX = legend === 'right' ? '36%' : '50%';
  return {
    tooltip: {
      trigger: 'item',
      formatter: (param: unknown) => {
        const slice = param as { marker?: string; name: string; value: number };
        return `${slice.marker ?? ''}${escapeHtml(slice.name)}<br/><b>${format(slice.value)}</b> · ${fmtPct(total > 0 ? slice.value / total : 0, 1)}`;
      },
    },
    legend:
      legend === 'none'
        ? { show: false }
        : legend === 'right'
          ? { orient: 'vertical', right: 0, top: 'middle', type: 'scroll' }
          : { bottom: 0, type: 'scroll' },
    title: options.center
      ? { text: options.center.value, subtext: options.center.caption, left: centerX, top: legend === 'bottom' ? '36%' : 'middle', textAlign: 'center', textStyle: { fontSize: 18, fontWeight: 600, color: colors.text }, subtextStyle: { fontSize: 12, color: colors.textMuted } }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: ['56%', '80%'],
        center: [centerX, legend === 'bottom' ? '42%' : '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: colors.surface, borderWidth: 2 },
        data: options.items.map((item) => ({ name: item.name, value: item.value, itemStyle: item.color ? { color: item.color } : undefined })),
      },
    ],
  };
}
