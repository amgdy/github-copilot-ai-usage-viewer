import { useEffect, useMemo, useRef } from 'react';
import { Download } from 'lucide-react';
import type { EChartsOption } from 'echarts';
import { useResolvedTheme } from '../../state/theme';
import { t } from '../../i18n';
import { cx } from '../ui/cx';
import { echarts } from './echarts';
import { chartColors, themeObject, type ChartColors } from './theme';

export type { EChartsOption };

/** The subset of ECharts' event payload the pages rely on. */
export interface ChartClick {
  componentType: string;
  seriesType?: string;
  seriesIndex?: number;
  seriesName?: string;
  /** Category / item name. */
  name: string;
  dataIndex: number;
  data: unknown;
  value: unknown;
  color?: string;
}

export interface EChartProps {
  /** Memoize this with useMemo: a new object on every render resets legend and zoom state. */
  option: EChartsOption;
  height?: number | string;
  className?: string;
  onClick?: (p: ChartClick) => void;
  /** Accessible description of what the chart shows. */
  label?: string;
  /** Shows a hover button that downloads the chart as a PNG with this file name (no extension). */
  exportName?: string;
}

/** Colors for the active color scheme, for building chart options. */
export function useChartColors(): ChartColors {
  const scheme = useResolvedTheme();
  return useMemo(() => chartColors(), [scheme]);
}

export function EChart({ option, height = 280, className, onClick, label, exportName }: EChartProps) {
  const host = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  const scheme = useResolvedTheme();
  const colors = useChartColors();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const chart = echarts.init(el, themeObject(colors), { renderer: 'canvas' });
    chartRef.current = chart;
    chart.on('click', (p) => clickRef.current?.(p as unknown as ChartClick));
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [colors]);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option, scheme]);

  const download = useMemo(
    () => () => {
      const chart = chartRef.current;
      if (!chart) return;
      const a = document.createElement('a');
      a.href = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: colors.surface });
      a.download = `${exportName ?? 'chart'}.png`;
      a.click();
    },
    [exportName, colors],
  );

  return (
    <div className={cx('group relative', className)}>
      <div ref={host} role="img" aria-label={label} style={{ height, width: '100%' }} />
      {exportName ? (
        <button
          type="button"
          onClick={download}
          title={t('Download as PNG')}
          aria-label={t('Download chart as PNG')}
          className="no-print absolute end-1 top-0 rounded-md border border-border bg-surface p-1 text-fg-muted opacity-0 shadow-card transition-opacity hover:text-fg focus:opacity-100 group-hover:opacity-100"
        >
          <Download size={13} />
        </button>
      ) : null}
    </div>
  );
}
