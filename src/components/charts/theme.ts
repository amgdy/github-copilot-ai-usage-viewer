export interface ChartColors {
  /** Categorical palette for series, in order. */
  palette: string[];
  text: string;
  textMuted: string;
  textSubtle: string;
  grid: string;
  axis: string;
  surface: string;
  tooltipBg: string;
  accent: string;
  good: string;
  warn: string;
  bad: string;
  info: string;
  highlight: string;
  /** Neutral grey for "other" / unknown series. */
  muted: string;
  /** Sequential ramp (low → high) for heatmaps. */
  ramp: string[];
}

/** SSR keeps CSS expressions; the browser resolves them for the canvas renderer. */
export function chartColors(
  read = (name: string) => typeof document === 'undefined' ? `var(${name})` : getComputedStyle(document.documentElement).getPropertyValue(name),
): ChartColors {
  const color = (name: string) => {
    const value = read(`--cp-${name}`).trim();
    if (!value) throw new Error(`Missing chart theme color: --cp-${name}`);
    return value;
  };
  const rampEnds = [color('surface-soft'), color('accent')];
  const ramp = Array.from({ length: 6 }, (_, index) => {
    if (typeof document === 'undefined') return rampEnds[index < 3 ? 0 : 1];
    const mixed = echartsColor.lerp(index / 5, rampEnds);
    const hex = mixed && echartsColor.toHex(mixed);
    if (!hex) throw new Error('Chart theme ramp requires valid CSS colors');
    return `#${hex}`;
  });
  return {
    palette: Array.from({ length: 12 }, (_, index) => color(`series-${index + 1}`)),
    text: color('text'),
    textMuted: color('text-muted'),
    textSubtle: color('text-soft'),
    grid: color('border'),
    axis: color('border-strong'),
    surface: color('surface'),
    tooltipBg: color('surface'),
    accent: color('accent'),
    good: color('success'),
    warn: color('warning'),
    bad: color('danger'),
    info: color('link'),
    highlight: color('highlight'),
    muted: color('text-muted'),
    ramp,
  };
}

/** The brand fonts from src/fonts.css. Arabic letters fall through to IBM Plex Sans Arabic. */
const FONT = "'Mona Sans Variable', 'IBM Plex Sans Arabic', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/** The ECharts theme object for one color scheme. Squares for marks and legend keys, nothing smaller than 12px. */
export function themeObject(colors: ChartColors) {
  const axisCommon = {
    axisLine: { lineStyle: { color: colors.axis } },
    axisTick: { show: false },
    axisLabel: { color: colors.textMuted, fontSize: 12 },
    splitLine: { lineStyle: { color: colors.grid } },
    nameTextStyle: { color: colors.textMuted },
  };
  // Only number axes: category axes hold names such as models, whose digits stay as they are.
  const numberLabel = { ...axisCommon.axisLabel, ...(usesArabicDigits() ? { formatter: arabicAxisNumber } : {}) };
  return {
    color: colors.palette,
    backgroundColor: 'transparent',
    textStyle: { color: colors.textMuted, fontFamily: FONT },
    title: { textStyle: { color: colors.text, fontSize: 14 }, subtextStyle: { color: colors.textMuted } },
    legend: {
      textStyle: { color: colors.textMuted, fontSize: 12 },
      pageTextStyle: { color: colors.textMuted },
      pageIconColor: colors.textMuted,
      pageIconInactiveColor: colors.axis,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 14,
      icon: 'rect',
    },
    tooltip: {
      backgroundColor: colors.tooltipBg,
      borderColor: colors.grid,
      borderWidth: 1,
      padding: [8, 10],
      textStyle: { color: colors.text, fontSize: 13 },
      extraCssText: 'border-radius:6px;box-shadow:var(--cp-shadow);max-width:360px;white-space:normal;',
      axisPointer: { lineStyle: { color: colors.axis }, crossStyle: { color: colors.axis }, shadowStyle: { color: colors.highlight } },
    },
    categoryAxis: { ...axisCommon, splitLine: { show: false } },
    valueAxis: { ...axisCommon, axisLabel: numberLabel, axisLine: { show: false } },
    timeAxis: axisCommon,
    logAxis: { ...axisCommon, axisLabel: numberLabel, axisLine: { show: false } },
    dataZoom: {
      textStyle: { color: colors.textMuted },
      borderColor: colors.axis,
      fillerColor: colors.highlight,
      handleStyle: { color: colors.accent, borderColor: colors.accent },
      moveHandleStyle: { color: colors.accent },
      dataBackground: { lineStyle: { color: colors.axis }, areaStyle: { color: colors.grid } },
      selectedDataBackground: { lineStyle: { color: colors.accent }, areaStyle: { color: colors.accent, opacity: 0.2 } },
    },
    visualMap: { textStyle: { color: colors.textMuted } },
    markLine: { label: { color: colors.textMuted }, lineStyle: { color: colors.textSubtle } },
    toolbox: { iconStyle: { borderColor: colors.textMuted }, emphasis: { iconStyle: { borderColor: colors.accent } } },
    calendar: {
      itemStyle: { color: 'transparent', borderColor: colors.grid },
      splitLine: { lineStyle: { color: colors.axis } },
      dayLabel: { color: colors.textMuted },
      monthLabel: { color: colors.textMuted },
      yearLabel: { color: colors.textMuted },
    },
  };
}
import { color as echartsColor } from 'echarts/core';
import { localizeDigits, usesArabicDigits } from '../../i18n/core';

/** Axis labels that a chart does not format itself, in Arabic-Indic digits when Arabic uses them. */
function arabicAxisNumber(value: string | number): string {
  return localizeDigits(typeof value === 'number' ? value.toLocaleString('en-US') : value);
}
