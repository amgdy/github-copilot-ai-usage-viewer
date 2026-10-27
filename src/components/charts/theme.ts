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
export function themeObject(c: ChartColors) {
  const axisCommon = {
    axisLine: { lineStyle: { color: c.axis } },
    axisTick: { show: false },
    axisLabel: { color: c.textMuted, fontSize: 12 },
    splitLine: { lineStyle: { color: c.grid } },
    nameTextStyle: { color: c.textMuted },
  };
  return {
    color: c.palette,
    backgroundColor: 'transparent',
    textStyle: { color: c.textMuted, fontFamily: FONT },
    title: { textStyle: { color: c.text, fontSize: 14 }, subtextStyle: { color: c.textMuted } },
    legend: {
      textStyle: { color: c.textMuted, fontSize: 12 },
      pageTextStyle: { color: c.textMuted },
      pageIconColor: c.textMuted,
      pageIconInactiveColor: c.axis,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 14,
      icon: 'rect',
    },
    tooltip: {
      backgroundColor: c.tooltipBg,
      borderColor: c.grid,
      borderWidth: 1,
      padding: [8, 10],
      textStyle: { color: c.text, fontSize: 13 },
      extraCssText: 'border-radius:6px;box-shadow:var(--cp-shadow);max-width:360px;white-space:normal;',
      axisPointer: { lineStyle: { color: c.axis }, crossStyle: { color: c.axis }, shadowStyle: { color: c.highlight } },
    },
    categoryAxis: { ...axisCommon, splitLine: { show: false } },
    valueAxis: { ...axisCommon, axisLine: { show: false } },
    timeAxis: axisCommon,
    logAxis: { ...axisCommon, axisLine: { show: false } },
    dataZoom: {
      textStyle: { color: c.textMuted },
      borderColor: c.axis,
      fillerColor: c.highlight,
      handleStyle: { color: c.accent, borderColor: c.accent },
      moveHandleStyle: { color: c.accent },
      dataBackground: { lineStyle: { color: c.axis }, areaStyle: { color: c.grid } },
      selectedDataBackground: { lineStyle: { color: c.accent }, areaStyle: { color: c.accent, opacity: 0.2 } },
    },
    visualMap: { textStyle: { color: c.textMuted } },
    markLine: { label: { color: c.textMuted }, lineStyle: { color: c.textSubtle } },
    toolbox: { iconStyle: { borderColor: c.textMuted }, emphasis: { iconStyle: { borderColor: c.accent } } },
    calendar: {
      itemStyle: { color: 'transparent', borderColor: c.grid },
      splitLine: { lineStyle: { color: c.axis } },
      dayLabel: { color: c.textMuted },
      monthLabel: { color: c.textMuted },
      yearLabel: { color: c.textMuted },
    },
  };
}
import { color as echartsColor } from 'echarts/core';
