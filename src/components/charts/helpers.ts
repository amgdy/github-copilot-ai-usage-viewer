import type { EChartsOption } from 'echarts';
import { t } from '../../i18n';
import { fmtPct, fmtUSD, fmtUSDCompact } from '../../lib/utils/format';
import type { ChartColors } from './theme';

export const usd = (v: unknown): string => fmtUSD(Number(v), 'auto');
export const usdCompact = (v: unknown): string => fmtUSDCompact(Number(v));

export const GRID = { left: 8, right: 16, top: 36, bottom: 8, containLabel: true } as const;

interface TipParam {
  marker?: string;
  seriesName?: string;
  name?: string;
  value?: unknown;
  axisValueLabel?: string;
}

/** Escapes text from the CSV for the HTML of a chart tooltip. */
export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Rough pixel width of a value label at the chart font size, plus a small gap. */
const labelPx = (s: string, fontSize = 12): number => Math.ceil(s.length * fontSize * 0.58) + 8;

/** Axis tooltip that lists non-zero series largest first, plus a total. */
export function stackTooltip(format: (v: number) => string, opts: { total?: boolean; max?: number } = {}) {
  const { total = true, max = 12 } = opts;
  return (params: unknown): string => {
    const ps = ((Array.isArray(params) ? params : [params]) as TipParam[])
      .map((p) => ({ ...p, v: Array.isArray(p.value) ? Number(p.value[1]) : Number(p.value) }))
      .filter((p) => Number.isFinite(p.v) && p.v !== 0)
      .sort((a, b) => b.v - a.v);
    if (!ps.length) return '';
    const head = ps[0].axisValueLabel ?? ps[0].name ?? '';
    const shown = ps.slice(0, max);
    const rest = ps.slice(max);
    const rows = shown
      .map((p) => `<div style="display:flex;justify-content:space-between;gap:16px"><span>${p.marker ?? ''}${esc(p.seriesName ?? '')}</span><b>${format(p.v)}</b></div>`)
      .join('');
    const more = rest.length ? `<div style="opacity:.7">${esc(t('and {n} more', { n: rest.length }))}: ${format(rest.reduce((s, p) => s + p.v, 0))}</div>` : '';
    const sum = total && ps.length > 1 ? `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px;padding-top:4px;border-top:1px solid var(--cp-border)"><span>${esc(t('Total'))}</span><b>${format(ps.reduce((s, p) => s + p.v, 0))}</b></div>` : '';
    return `<div style="font-weight:600;margin-bottom:4px">${esc(String(head))}</div>${rows}${more}${sum}`;
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
  format?: (v: number) => string;
  legend?: boolean;
  zoom?: boolean;
  /** Reference lines drawn on the first series (e.g. pool capacity). */
  markLines?: { name: string; y: number; color?: string }[];
}

/** Stacked bars or areas over time, with a tooltip that sorts and totals the series. */
export function stackedTimeOption(c: ChartColors, o: StackedTimeOptions): EChartsOption {
  const format = o.format ?? usd;
  const kind = o.kind ?? 'bar';
  const stack = o.stack ?? kind !== 'line';
  const all: TimeSeriesInput[] = [...o.series];
  if (o.other) all.push({ name: o.otherName ?? t('Other'), data: o.other, color: c.muted });
  const dense = o.labels.length > 45;
  const series = all.map((s, i) => ({
    name: s.name,
    type: kind === 'bar' ? ('bar' as const) : ('line' as const),
    stack: stack ? 'total' : undefined,
    data: Array.from(s.data),
    color: s.color ?? c.palette[i % c.palette.length],
    barMaxWidth: 28,
    showSymbol: false,
    smooth: false,
    areaStyle: kind === 'area' ? { opacity: stack ? 0.75 : 0.18 } : undefined,
    lineStyle: kind === 'bar' ? undefined : { width: stack ? 1 : 2 },
    emphasis: { focus: 'series' as const },
    markLine:
      i === 0 && o.markLines?.length
        ? {
            symbol: 'none',
            silent: true,
            animation: false,
            label: { formatter: '{b}', position: 'insideEndTop' as const, color: c.textMuted, fontSize: 12 },
            lineStyle: { type: 'dashed' as const, width: 1.2 },
            data: o.markLines.map((m) => ({ name: m.name, yAxis: m.y, lineStyle: { color: m.color ?? c.textSubtle } })),
          }
        : undefined,
  }));
  return {
    grid: { ...GRID, top: o.legend === false ? 16 : 36, bottom: o.zoom ? 40 : 8 },
    legend: o.legend === false ? { show: false } : { top: 0, type: 'scroll', data: all.map((s) => s.name) },
    tooltip: { trigger: 'axis', axisPointer: { type: kind === 'bar' ? 'shadow' : 'line' }, formatter: stackTooltip(format, { total: stack }) },
    xAxis: { type: 'category', data: o.labels, axisLabel: { hideOverlap: true, interval: dense ? 'auto' : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (format === usd ? usdCompact(v) : format(v)) } },
    dataZoom: o.zoom ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 4 }] : undefined,
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
  format?: (v: number) => string;
  color?: string;
  /** Pixel width of the category labels. */
  labelWidth?: number;
  max?: number;
}

/** Horizontal ranking bars, largest first (top to bottom). Negative values grow to the left of the zero line. */
export function rankBarOption(c: ChartColors, o: RankBarOptions): EChartsOption {
  const format = o.format ?? usd;
  const items = o.items;
  const negatives = items.filter((i) => i.value < 0);
  const widest = (list: RankItem[]) => list.reduce((w, i) => Math.max(w, labelPx(format(i.value))), 0);
  const right = Math.max(16, widest(items.filter((i) => i.value >= 0)));
  const left = negatives.length ? Math.max(8, widest(negatives)) : 8;
  const lowest = negatives.reduce((m, i) => Math.min(m, i.value), 0);
  const highest = items.reduce((m, i) => Math.max(m, i.value), 0);
  return {
    grid: { left, right, top: 4, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const d = (p as { dataIndex: number }).dataIndex;
        const it = items[d];
        return `<b>${esc(it.name)}</b><br/>${format(it.value)}${it.note ? `<br/><span style="opacity:.75">${esc(it.note)}</span>` : ''}`;
      },
    },
    xAxis: { type: 'value', show: false, max: o.max, min: negatives.length ? lowest - (highest - lowest) * 0.05 : undefined },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map((i) => i.name),
      axisLabel: { width: o.labelWidth ?? 130, overflow: 'truncate', color: c.text, fontSize: 12 },
      axisLine: { show: false, onZero: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: items.map((i) => ({
          value: i.value,
          itemStyle: { color: i.color ?? o.color ?? c.accent },
          label: { position: i.value < 0 ? 'left' : 'right' },
        })),
        barMaxWidth: 18,
        label: { show: true, position: 'right', color: c.textMuted, fontSize: 12, formatter: (p: { value?: unknown }) => format(Number(p.value)) },
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
  format?: (v: number) => string;
  /** Big text in the hole, and the caption under it. */
  center?: { value: string; caption?: string };
  legend?: 'right' | 'bottom' | 'none';
}

export function donutOption(c: ChartColors, o: DonutOptions): EChartsOption {
  const format = o.format ?? usd;
  const total = o.items.reduce((s, i) => s + i.value, 0);
  const legend = o.legend ?? 'right';
  const centerX = legend === 'right' ? '36%' : '50%';
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const q = p as { marker?: string; name: string; value: number };
        return `${q.marker ?? ''}${esc(q.name)}<br/><b>${format(q.value)}</b> · ${fmtPct(total > 0 ? q.value / total : 0, 1)}`;
      },
    },
    legend:
      legend === 'none'
        ? { show: false }
        : legend === 'right'
          ? { orient: 'vertical', right: 0, top: 'middle', type: 'scroll' }
          : { bottom: 0, type: 'scroll' },
    title: o.center
      ? { text: o.center.value, subtext: o.center.caption, left: centerX, top: legend === 'bottom' ? '36%' : 'middle', textAlign: 'center', textStyle: { fontSize: 18, fontWeight: 600, color: c.text }, subtextStyle: { fontSize: 12, color: c.textMuted } }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: ['56%', '80%'],
        center: [centerX, legend === 'bottom' ? '42%' : '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: c.surface, borderWidth: 2 },
        data: o.items.map((i) => ({ name: i.name, value: i.value, itemStyle: i.color ? { color: i.color } : undefined })),
      },
    ],
  };
}
