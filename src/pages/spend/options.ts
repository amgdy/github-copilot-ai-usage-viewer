import type { EChartsOption } from '../../components/charts/EChart';
import { esc, GRID, stackedTimeOption, stackTooltip, usd, usdCompact } from '../../components/charts/helpers';
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
    .map((a) => {
      const user = a.topUsers[0];
      const model = a.topModels[0];
      const mostly = mostlyText(
        user ? esc(labelOf('user', store.dicts.user.values[user.id])) : null,
        user ? fmtUSD(user.gross) : '',
        model ? esc(labelOf('model', store.dicts.model.values[model.id])) : null,
      );
      const detail = mostly ? `<br/><span style="opacity:.75">${mostly}</span>` : '';
      const line = t('{amount}, {multiple} a typical day ({baseline})', { amount: fmtUSD(a.gross), multiple: fmtMultiple(a.multiple), baseline: fmtUSD(a.baseline) });
      return `<div style="margin-top:2px"><b>${fmtDay(a.day, true)}</b>: ${line}${detail}</div>`;
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
export function usageOverTimeOption(c: ChartColors, o: UsageOptionInput): EChartsOption {
  const { usage, cumulative, marks, store } = o;
  const base = stackedTimeOption(c, {
    labels: usage.labels,
    series: usage.series,
    other: usage.other,
    kind: cumulative ? 'area' : 'bar',
    zoom: usage.labels.length > 60,
  });
  if (!marks.length) return base;

  const tip = stackTooltip(usd);
  const byIndex = new Map(marks.map((m) => [m.index, m]));
  const pins = marks.map((m) => ({
    name: m.days.length > 1 ? pluralize(m.days.length, 'unusual day') : t('Unusual day {date}', { date: fmtDay(m.days[0].day) }),
    coord: [m.index, m.value],
  }));
  const series = (base.series as unknown as Record<string, unknown>[]).map((s, i) =>
    i === 0 ? { ...s, markPoint: { symbol: 'pin', symbolSize: 24, itemStyle: { color: c.bad }, label: { show: false }, animation: false, data: pins } } : s,
  );
  return {
    ...base,
    series,
    yAxis: { type: 'value', max: (v: { max: number }) => v.max * 1.12, axisLabel: { formatter: (v: number) => usdCompact(v) } },
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
export function poolMonthOption(c: ChartColors, o: PoolOptionInput): EChartsOption {
  const { m, curves, path, capacity } = o;
  const billing = o.billing !== false;
  const n = m.daysInMonth;
  const labels = Array.from({ length: n }, (_, i) => String(i + 1));
  const points = curves.gross.filter((v) => v !== null).length;
  const billingIdx = o.markBilling && m.exhaustedOn !== null ? m.exhaustedOn - m.monthStart : null;
  const expectedIdx = capacity !== null && m.projection?.exhaustionDate != null ? m.projection.exhaustionDate - m.monthStart : null;

  let top = 0;
  for (const v of curves.gross) if (v !== null && v > top) top = v;
  if (path) for (const v of path.high) if (v !== null && v > top) top = v;
  const yMax = capacity !== null || top > 0 ? niceMax(Math.max(top, capacity ?? 0) * 1.05) : undefined;

  const chip = (color: string) => ({ show: true, color: c.text, fontSize: 12, backgroundColor: c.surface, borderColor: color, borderWidth: 1, padding: [2, 6] });
  const covered = t(COVERED);
  const billed = t(BILLED);
  const soFar = t(USAGE_SO_FAR);
  const projected = t(PROJECTED);
  const likely = t(RANGE);
  const marked: Record<string, unknown>[] = [];
  if (billingIdx !== null && m.exhaustedOn !== null) {
    marked.push({
      name: o.billingLabel,
      coord: [billingIdx, capacity ?? curves.gross[billingIdx] ?? 0],
      itemStyle: { color: c.warn },
      label: { ...chip(c.warn), position: 'top', formatter: o.billingLabel },
    });
  }
  if (expectedIdx !== null && capacity !== null && m.projection?.exhaustionDate != null) {
    const expected = t('Expected to run out {date}', { date: fmtDay(m.projection.exhaustionDate) });
    marked.push({
      name: expected,
      coord: [expectedIdx, capacity],
      itemStyle: { color: c.surface, borderColor: c.info, borderWidth: 2 },
      label: { ...chip(c.info), position: 'top', formatter: expected },
    });
  }
  const earlyEvent = (billingIdx ?? expectedIdx ?? n) < n * 0.4;
  const capacityLine =
    capacity === null
      ? undefined
      : {
          symbol: 'none',
          silent: true,
          animation: false,
          label: { formatter: '{b}', position: earlyEvent ? 'insideEndTop' : 'insideStartTop', color: c.textMuted, fontSize: 12 },
          lineStyle: { type: 'dashed', width: 1.5, color: c.accent },
          data: [{ name: t('Included credits {amount}', { amount: `${fmtUSD(capacity, 0)}${o.lowerBound ? '*' : ''}` }), yAxis: capacity }],
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
    ? [area(covered, curves.discount, c.accent, 0.4, markers), area(billed, curves.net, c.warn, 0.55)]
    : [area(soFar, curves.gross, c.accent, 0.4, markers)];
  const legend = billing ? [covered, billed] : [soFar];
  if (path) {
    const band = path.high.map((h, i) => (h === null || path.low[i] === null ? null : h - (path.low[i] as number)));
    series.push(
      { name: projected, type: 'line', data: path.mid, color: c.info, showSymbol: false, lineStyle: { type: 'dashed', width: 2 }, z: 3 },
      { name: 'range-base', type: 'line', stack: 'band', data: path.low, symbol: 'none', silent: true, lineStyle: { opacity: 0 }, tooltip: { show: false } },
      { name: likely, type: 'line', stack: 'band', data: band, symbol: 'none', silent: true, color: c.info, lineStyle: { opacity: 0 }, areaStyle: { color: c.info, opacity: 0.14 } },
    );
    legend.push(projected, likely);
  }

  const tip = (i: number): string => {
    const g = curves.gross[i];
    const d = curves.discount[i];
    const nt = curves.net[i];
    const lines: string[] = [];
    if (g !== null && d !== null && nt !== null) {
      if (billing) {
        lines.push(row(covered, fmtUSD(d)), row(billed, fmtUSD(nt)), row(soFar, fmtUSD(g)));
        if (capacity !== null && capacity > 0) lines.push(row(t('Included credits used'), fmtPct(d / capacity, 0)));
      } else {
        lines.push(row(soFar, fmtUSD(g)));
      }
    }
    if (path && i > path.startIndex) {
      const mid = path.mid[i];
      const lo = path.low[i];
      const hi = path.high[i];
      if (mid !== null && lo !== null && hi !== null) {
        lines.push(row(projected, fmtUSD(mid)), `<div style="opacity:.7">${t('Likely {low} to {high}', { low: fmtUSD(lo), high: fmtUSD(hi) })}</div>`);
      }
    }
    return lines.length ? `<div style="font-weight:600;margin-bottom:4px">${fmtDay(m.monthStart + i, true)}</div>${lines.join('')}` : '';
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
    yAxis: { type: 'value', min: 0, max: yMax, axisLabel: { formatter: (v: number) => usdCompact(v) } },
    series,
  } as EChartsOption;
}
