import type { EChartsOption } from '../../components/charts/EChart';
import { escapeHtml, GRID, stackedTimeOption, stackTooltip, usd, usdCompact } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { msg, t } from '../../i18n';
import type { AnomalyDay } from '../../lib/analytics/anomalies';
import type { MonthPool } from '../../lib/analytics/pool';
import { labelOf, type DataStore } from '../../lib/types';
import { fmtDay } from '../../lib/utils/date';
import { fmtMultiple, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { niceMax, type AnomalyMark, type DailyCurves, type ProjectionPath, type UsageSeries } from './helpers';

const row = (label: string, value: string): string => `<div style="display:flex;justify-content:space-between;gap:16px"><span>${label}</span><b>${value}</b></div>`;
const sectionStart = 'margin-top:6px;padding-top:4px;border-block-start:1px solid var(--cp-border)';

function mostlyText(user: string | null, amount: string, model: string | null): string {
  if (user && model) return t('Mostly {user} {amount} on {model}', { user, amount, model });
  if (user) return t('Mostly {user} {amount}', { user, amount });
  return model ? t('Mostly {model}', { model }) : '';
}

function anomalyHtml(days: AnomalyDay[], store: DataStore): string {
  const rows = days
    .map((anomaly) => {
      const user = anomaly.topUsers[0];
      const model = anomaly.topModels[0];
      const mostly = mostlyText(
        user ? escapeHtml(labelOf('user', store.dicts.user.values[user.id])) : null,
        user ? fmtUSD(user.gross) : '',
        model ? escapeHtml(labelOf('model', store.dicts.model.values[model.id])) : null,
      );
      const detail = mostly ? `<br/><span style="opacity:.75">${mostly}</span>` : '';
      const line = t('{amount}, {multiple} a typical day ({baseline})', { amount: fmtUSD(anomaly.gross), multiple: fmtMultiple(anomaly.multiple), baseline: fmtUSD(anomaly.baseline) });
      return `<div style="margin-top:2px"><b>${fmtDay(anomaly.day, true)}</b>: ${line}${detail}</div>`;
    })
    .join('');
  return `<div style="${sectionStart}"><div style="opacity:.75">${days.length > 1 ? t('Unusual days') : t('Unusual day')}</div>${rows}</div>`;
}

export interface UsageOptionInput {
  usage: UsageSeries;
  cumulative: boolean;
  marks: AnomalyMark[];
  store: DataStore;
}

/** Stacked usage per bucket, optionally with a pin on every bucket that holds an unusual day. */
export function usageOverTimeOption(colors: ChartColors, input: UsageOptionInput): EChartsOption {
  const { usage, cumulative, marks, store } = input;
  const base = stackedTimeOption(colors, {
    labels: usage.labels,
    series: usage.series,
    other: usage.other,
    kind: cumulative ? 'area' : 'bar',
    zoom: usage.labels.length > 60,
  });
  if (!marks.length) return base;

  const tip = stackTooltip(usd);
  const byIndex = new Map(marks.map((anomalyMark) => [anomalyMark.index, anomalyMark]));
  const pins = marks.map((anomalyMark) => ({
    name: anomalyMark.days.length > 1 ? pluralize(anomalyMark.days.length, 'unusual day') : t('Unusual day {date}', { date: fmtDay(anomalyMark.days[0].day) }),
    coord: [anomalyMark.index, anomalyMark.value],
  }));
  const series = (base.series as unknown as Record<string, unknown>[]).map((layer, layerIndex) =>
    layerIndex === 0 ? { ...layer, markPoint: { symbol: 'pin', symbolSize: 24, itemStyle: { color: colors.bad }, label: { show: false }, animation: false, data: pins } } : layer,
  );
  return {
    ...base,
    series,
    yAxis: { type: 'value', max: (extent: { max: number }) => extent.max * 1.12, axisLabel: { formatter: (amount: number) => usdCompact(amount) } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: cumulative ? 'line' : 'shadow' },
      formatter: (params: unknown) => {
        const html = tip(params);
        const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
        const mark = first?.dataIndex === undefined ? undefined : byIndex.get(first.dataIndex);
        return mark && html ? html + anomalyHtml(mark.days, store) : html;
      },
    },
  } as EChartsOption;
}

export interface PoolOptionInput {
  m: MonthPool;
  curves: DailyCurves;
  path: ProjectionPath | null;
  /** Pool size to draw. Null when it is unknown or does not apply, so no line is invented. */
  capacity: number | null;
  lowerBound: boolean;
  /** Mark the day billing began. */
  markBilling: boolean;
  /** The text of that mark, with its date ("Ran out Sep 18"), in the current language. */
  billingLabel: string;
  /** False when the file does not say what was billed: one "Usage so far" area is drawn instead of covered and billed. Defaults to true. */
  billing?: boolean;
}

// English names; translated with t() where the chart is built.
const COVERED = msg('Covered by included credits');
const BILLED = msg('Billed on top of seats');
const USAGE_SO_FAR = msg('Usage so far');
const PROJECTED = msg('Projected usage');
const RANGE = msg('Likely range');

/** Cumulative usage over the days of one month with the pool size, the day it ran out and the projected month end. */
export function poolMonthOption(colors: ChartColors, input: PoolOptionInput): EChartsOption {
  const { m: month, curves, path, capacity } = input;
  const billing = input.billing !== false;
  const dayCount = month.daysInMonth;
  const labels = Array.from({ length: dayCount }, (_, dayIndex) => String(dayIndex + 1));
  const points = curves.gross.filter((amount) => amount !== null).length;
  const billingIdx = input.markBilling && month.exhaustedOn !== null ? month.exhaustedOn - month.monthStart : null;
  const expectedIdx = capacity !== null && month.projection?.exhaustionDate != null ? month.projection.exhaustionDate - month.monthStart : null;

  let top = 0;
  for (const amount of curves.gross) if (amount !== null && amount > top) top = amount;
  if (path) for (const amount of path.high) if (amount !== null && amount > top) top = amount;
  const yMax = capacity !== null || top > 0 ? niceMax(Math.max(top, capacity ?? 0) * 1.05) : undefined;

  const chip = (color: string) => ({ show: true, color: colors.text, fontSize: 12, backgroundColor: colors.surface, borderColor: color, borderWidth: 1, padding: [2, 6] });
  const covered = t(COVERED);
  const billed = t(BILLED);
  const soFar = t(USAGE_SO_FAR);
  const projected = t(PROJECTED);
  const likely = t(RANGE);
  const marked: Record<string, unknown>[] = [];
  if (billingIdx !== null && month.exhaustedOn !== null) {
    marked.push({
      name: input.billingLabel,
      coord: [billingIdx, capacity ?? curves.gross[billingIdx] ?? 0],
      itemStyle: { color: colors.warn },
      label: { ...chip(colors.warn), position: 'top', formatter: input.billingLabel },
    });
  }
  if (expectedIdx !== null && capacity !== null && month.projection?.exhaustionDate != null) {
    const expected = t('Expected to run out {date}', { date: fmtDay(month.projection.exhaustionDate) });
    marked.push({
      name: expected,
      coord: [expectedIdx, capacity],
      itemStyle: { color: colors.surface, borderColor: colors.info, borderWidth: 2 },
      label: { ...chip(colors.info), position: 'top', formatter: expected },
    });
  }
  const earlyEvent = (billingIdx ?? expectedIdx ?? dayCount) < dayCount * 0.4;
  const capacityLine =
    capacity === null
      ? undefined
      : {
          symbol: 'none',
          silent: true,
          animation: false,
          label: { formatter: '{b}', position: earlyEvent ? 'insideEndTop' : 'insideStartTop', color: colors.textMuted, fontSize: 12 },
          lineStyle: { type: 'dashed', width: 1.5, color: colors.accent },
          data: [{ name: t('Included credits {amount}', { amount: `${fmtUSD(capacity, 0)}${input.lowerBound ? '*' : ''}` }), yAxis: capacity }],
        };

  const area = (name: string, data: (number | null)[], color: string, opacity: number, extra: Record<string, unknown> = {}) => ({
    name,
    type: 'line',
    stack: 'usage',
    data,
    color,
    showSymbol: points <= 1,
    symbolSize: 7,
    smooth: false,
    lineStyle: { width: 1.5 },
    areaStyle: { opacity },
    ...extra,
  });
  const markers = { markLine: capacityLine, markPoint: marked.length ? { symbol: 'circle', symbolSize: 10, silent: true, animation: false, data: marked } : undefined };
  const series: Record<string, unknown>[] = billing
    ? [area(covered, curves.discount, colors.accent, 0.4, markers), area(billed, curves.net, colors.warn, 0.55)]
    : [area(soFar, curves.gross, colors.accent, 0.4, markers)];
  const legend = billing ? [covered, billed] : [soFar];
  if (path) {
    const band = path.high.map((high, dayIndex) => (high === null || path.low[dayIndex] === null ? null : high - (path.low[dayIndex] as number)));
    series.push(
      { name: projected, type: 'line', data: path.mid, color: colors.info, showSymbol: false, lineStyle: { type: 'dashed', width: 2 }, z: 3 },
      { name: 'range-base', type: 'line', stack: 'band', data: path.low, symbol: 'none', silent: true, lineStyle: { opacity: 0 }, tooltip: { show: false } },
      { name: likely, type: 'line', stack: 'band', data: band, symbol: 'none', silent: true, color: colors.info, lineStyle: { opacity: 0 }, areaStyle: { color: colors.info, opacity: 0.14 } },
    );
    legend.push(projected, likely);
  }

  const tip = (dayIndex: number): string => {
    const runningGross = curves.gross[dayIndex];
    const runningDiscount = curves.discount[dayIndex];
    const runningNet = curves.net[dayIndex];
    const lines: string[] = [];
    if (runningGross !== null && runningDiscount !== null && runningNet !== null) {
      if (billing) {
        lines.push(row(covered, fmtUSD(runningDiscount)), row(billed, fmtUSD(runningNet)), row(soFar, fmtUSD(runningGross)));
        if (capacity !== null && capacity > 0) lines.push(row(t('Included credits used'), fmtPct(runningDiscount / capacity, 0)));
      } else {
        lines.push(row(soFar, fmtUSD(runningGross)));
      }
    }
    if (path && dayIndex > path.startIndex) {
      const mid = path.mid[dayIndex];
      const low = path.low[dayIndex];
      const high = path.high[dayIndex];
      if (mid !== null && low !== null && high !== null) {
        lines.push(row(projected, fmtUSD(mid)), `<div style="opacity:.7">${t('Likely {low} to {high}', { low: fmtUSD(low), high: fmtUSD(high) })}</div>`);
      }
    }
    return lines.length ? `<div style="font-weight:600;margin-bottom:4px">${fmtDay(month.monthStart + dayIndex, true)}</div>${lines.join('')}` : '';
  };

  return {
    grid: { ...GRID, top: 36, bottom: 8 },
    legend: { top: 0, type: 'scroll', data: legend },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: unknown) => {
        const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
        return first?.dataIndex === undefined ? '' : tip(first.dataIndex);
      },
    },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLabel: { hideOverlap: true } },
    yAxis: { type: 'value', min: 0, max: yMax, axisLabel: { formatter: (amount: number) => usdCompact(amount) } },
    series,
  } as EChartsOption;
}
