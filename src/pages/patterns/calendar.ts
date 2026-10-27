import type { CalendarComponentOption, HeatmapSeriesOption } from 'echarts';
import type { EChartsOption } from '../../components/charts/EChart';
import type { ChartColors } from '../../components/charts/theme';
import { t } from '../../i18n';
import type { DaySeries } from '../../lib/analytics/aggregate';
import { quantile, type AnomalyDay } from '../../lib/analytics/anomalies';
import {
  MONTH_NAMES,
  dowOf,
  fmtDay,
  isoDate,
  monthEndDay,
  monthIndexOf,
  monthKey,
  monthLabel,
  monthStartDay,
  parseIsoDay,
  dateParts,
} from '../../lib/utils/date';
import { fmtInt, fmtUSD, fmtUSDCompact, pluralize } from '../../lib/utils/format';
import { readableOn } from './colors';
import { anomalyText } from './daily';
import { weekdayName, weekdayShort, type DayRange } from './model';
import { tipHead, tipNote, tipRow } from './tip';

/** Ranges of up to this many months get one calendar per month; longer ranges get one scrolling calendar. */
export const MAX_TILE_MONTHS = 6;
export const YEAR_MONTHS = 12;
export const CELL_HEIGHT = 26;
const MONTH_TOP = 22;
const YEAR_CELL_HEIGHT = 16;
const YEAR_TOP = 24;

export type CalendarMode = 'tiles' | 'year';

export interface CalendarTile {
  key: string;
  label: string;
  from: number;
  to: number;
  /** The month is only partly inside the range. */
  partial: boolean;
  weeks: number;
  usage: number;
  usageDays: number;
}

export interface CalendarPlan {
  mode: CalendarMode;
  tiles: CalendarTile[];
  /** First and last day drawn, across all tiles. */
  from: number;
  to: number;
  note: string | null;
}

const weekStart = (day: number): number => day - dowOf(day);

function makeTile(key: string, label: string, from: number, to: number, partial: boolean, range: DayRange, days: DaySeries): CalendarTile {
  let usage = 0;
  let usageDays = 0;
  for (let day = from; day <= to; day++) {
    const gross = days.gross[day - range.start];
    if (gross > 0) {
      usage += gross;
      usageDays++;
    }
  }
  return { key, label, from, to, partial, weeks: (weekStart(to) - weekStart(from)) / 7 + 1, usage, usageDays };
}

export function planCalendar(range: DayRange, days: DaySeries): CalendarPlan {
  const startMonth = monthIndexOf(range.start);
  const endMonth = monthIndexOf(range.end);
  if (endMonth - startMonth + 1 <= MAX_TILE_MONTHS) {
    const tiles: CalendarTile[] = [];
    for (let month = startMonth; month <= endMonth; month++) {
      const from = Math.max(monthStartDay(month), range.start);
      const to = Math.min(monthEndDay(month), range.end);
      const partial = from > monthStartDay(month) || to < monthEndDay(month);
      tiles.push(makeTile(monthKey(month), monthLabel(month), from, to, partial, range, days));
    }
    return { mode: 'tiles', tiles, from: range.start, to: range.end, note: null };
  }
  const firstMonth = Math.max(startMonth, endMonth - YEAR_MONTHS + 1);
  const from = Math.max(monthStartDay(firstMonth), range.start);
  const note =
    firstMonth > startMonth
      ? t('Showing the latest {months}, {from} to {to}. Narrow the date range to see earlier months.', {
          months: pluralize(YEAR_MONTHS, 'month'),
          from: monthLabel(firstMonth),
          to: monthLabel(endMonth),
        })
      : t('Showing all {months} of the range.', { months: pluralize(endMonth - startMonth + 1, 'month') });
  return { mode: 'year', tiles: [makeTile('year', t('Calendar'), from, range.end, false, range, days)], from, to: range.end, note };
}

export const tileHeight = (weeks: number): number => MONTH_TOP + weeks * CELL_HEIGHT + 8;
export const YEAR_HEIGHT = YEAR_TOP + 7 * YEAR_CELL_HEIGHT + 8;

export interface Scale {
  /** Fill per band. Band 0 is a day without usage. */
  fills: string[];
  labels: string[];
  band: (gross: number) => number;
}

const PICKS: Record<number, number[]> = { 1: [3], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] };

/** Up to five usage bands cut at quantiles of the days shown, so a few huge days do not turn the rest pale. */
export function makeScale(colors: ChartColors, days: DaySeries, range: DayRange, from: number, to: number): Scale {
  const positive: number[] = [];
  for (let day = from; day <= to; day++) {
    const gross = days.gross[day - range.start];
    if (gross > 0) positive.push(gross);
  }
  positive.sort((a, b) => a - b);
  const max = positive.length ? positive[positive.length - 1] : 0;
  const parts = Math.min(5, positive.length);
  const thresholds: number[] = [];
  for (let j = 1; j < parts; j++) {
    const threshold = Number(quantile(positive, j / parts).toPrecision(2));
    if (threshold > 0 && threshold < max && (thresholds.length === 0 || threshold > thresholds[thresholds.length - 1])) thresholds.push(threshold);
  }
  const bands = positive.length ? thresholds.length + 1 : 0;
  const fills = [colors.grid, ...(PICKS[bands] ?? []).map((rampIndex) => colors.ramp[rampIndex])];
  const labels = [t('No usage')];
  if (bands === 1) labels.push(t('Has usage'));
  else {
    for (let j = 1; j <= bands; j++) {
      if (j === 1) labels.push(t('Up to {amount}', { amount: fmtUSDCompact(thresholds[0]) }));
      else if (j === bands) labels.push(t('Over {amount}', { amount: fmtUSDCompact(thresholds[bands - 2]) }));
      else labels.push(t('{from} to {to}', { from: fmtUSDCompact(thresholds[j - 2]), to: fmtUSDCompact(thresholds[j - 1]) }));
    }
  }
  const band = (gross: number): number => {
    if (!(gross > 0)) return 0;
    let bandIndex = 1;
    for (const threshold of thresholds) if (gross > threshold) bandIndex++;
    return bandIndex;
  };
  return { fills, labels, band };
}

export interface TileInput {
  colors: ChartColors;
  scale: Scale;
  tile: CalendarTile;
  mode: CalendarMode;
  range: DayRange;
  days: DaySeries;
  anomalies: Map<number, AnomalyDay>;
}

/** value: [ISO date, band, usage, active users, day of the month]. */
interface Cell {
  value: [string, number, number, number, number];
  label: { color: string };
}

function cellsOf({ colors, scale, tile, range, days }: TileInput): Cell[] {
  const cells: Cell[] = [];
  for (let day = tile.from; day <= tile.to; day++) {
    const dayIndex = day - range.start;
    const gross = days.gross[dayIndex];
    const band = scale.band(gross);
    cells.push({
      value: [isoDate(day), band, gross, days.activeUsers[dayIndex], dateParts(day).d],
      label: { color: band === 0 ? colors.textMuted : readableOn(colors, scale.fills[band]) },
    });
  }
  return cells;
}

/**
 * Unusual days of the tile. Drawn as a separate layer so the outline is not covered by the neighboring cells. The
 * value -1 lies outside every visual map piece, so the cell stays transparent and only the outline shows.
 */
function outlineOf({ colors, tile, anomalies }: TileInput): HeatmapSeriesOption | null {
  const data: [string, number][] = [];
  for (let day = tile.from; day <= tile.to; day++) if (anomalies.has(day)) data.push([isoDate(day), -1]);
  if (data.length === 0) return null;
  return {
    type: 'heatmap',
    coordinateSystem: 'calendar',
    silent: true,
    z: 4,
    data,
    itemStyle: { color: 'transparent', borderColor: colors.bad, borderWidth: 2 },
    label: { show: false },
  };
}

/** The day a click or hover on a cell refers to, or null for a day without usage. */
export function cellDay(value: unknown): number | null {
  if (!Array.isArray(value) || !(Number(value[2]) > 0)) return null;
  const day = parseIsoDay(String(value[0]));
  return Number.isFinite(day) ? day : null;
}

function cellTooltip(anomalies: Map<number, AnomalyDay>) {
  return (chartItem: unknown): string => {
    const value = (chartItem as { value?: unknown }).value;
    if (!Array.isArray(value)) return '';
    const day = parseIsoDay(String(value[0]));
    if (!Number.isFinite(day)) return '';
    const gross = Number(value[2]);
    const head = tipHead(t('{weekday}, {date}', { weekday: weekdayName(dowOf(day)), date: fmtDay(day, true) }));
    if (!(gross > 0)) return head + tipNote(t('No usage on this day.'));
    const anomaly = anomalies.get(day);
    return (
      head +
      tipRow(t('Usage'), fmtUSD(gross)) +
      tipRow(t('Active users'), fmtInt(Number(value[3]))) +
      (anomaly ? tipNote(t('Unusual day: {detail}', { detail: anomalyText(anomaly) })) : '') +
      tipNote(t('Click to show only this day.'))
    );
  };
}

export function tileOption(input: TileInput): EChartsOption {
  const { colors, scale, tile, mode, anomalies } = input;
  const year = mode === 'year';
  const firstShown = monthIndexOf(tile.from);
  const outline = outlineOf(input);

  const calendar: CalendarComponentOption = year
    ? {
        orient: 'horizontal',
        range: [isoDate(tile.from), isoDate(tile.to)],
        cellSize: ['auto', YEAR_CELL_HEIGHT],
        left: 34,
        right: 8,
        top: YEAR_TOP,
        splitLine: { show: false },
        itemStyle: { borderWidth: 0, color: 'transparent' },
        yearLabel: { show: false },
        monthLabel: {
          show: true,
          nameMap: MONTH_NAMES,
          color: colors.textMuted,
          fontSize: 12,
          margin: 8,
          formatter: ({ nameMap, yyyy, M: month }) =>
            month === 1 || Number(yyyy) * 12 + (month - 1) === firstShown ? `${nameMap} ${yyyy}` : nameMap,
        },
        dayLabel: { firstDay: 1, nameMap: ['', weekdayShort(0), '', weekdayShort(2), '', weekdayShort(4), ''], color: colors.textMuted, fontSize: 12, margin: 6 },
      }
    : {
        orient: 'vertical',
        range: [isoDate(tile.from), isoDate(tile.to)],
        cellSize: ['auto', CELL_HEIGHT],
        left: 4,
        right: 4,
        top: MONTH_TOP,
        splitLine: { show: false },
        itemStyle: { borderWidth: 0, color: 'transparent' },
        yearLabel: { show: false },
        monthLabel: { show: false },
        dayLabel: { firstDay: 1, nameMap: [6, 0, 1, 2, 3, 4, 5].map(weekdayShort), color: colors.textMuted, fontSize: 12, margin: 8 },
      };

  const heatmap: HeatmapSeriesOption = {
    type: 'heatmap',
    coordinateSystem: 'calendar',
    data: cellsOf(input),
    itemStyle: { borderColor: colors.surface, borderWidth: 2 },
    label: year
      ? { show: false }
      : {
          show: true,
          fontSize: 12,
          formatter: (chartItem: unknown) => {
            const cellValue = (chartItem as { value?: unknown[] }).value;
            return Array.isArray(cellValue) ? String(cellValue[4]) : '';
          },
        },
    emphasis: { itemStyle: { borderColor: colors.text, borderWidth: 2 } },
  };

  return {
    tooltip: { trigger: 'item', confine: true, formatter: cellTooltip(anomalies) },
    visualMap: {
      type: 'piecewise',
      show: false,
      dimension: 1,
      seriesIndex: outline ? [0, 1] : 0,
      pieces: scale.fills.map((color, band) => ({ value: band, color })),
      outOfRange: { color: 'transparent' },
    },
    calendar,
    series: outline ? [heatmap, outline] : [heatmap],
  };
}
