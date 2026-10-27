import { type ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { EChart, type ChartClick, type EChartsOption } from '../../components/charts/EChart';
import { Card, EmptyState, type CalcRef } from '../../components/ui';

interface ChartPanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Id (or ids) of the explanation of how the numbers in this chart are calculated. */
  calc?: CalcRef;
  /** A wrapping row of controls above the chart. */
  controls?: ReactNode;
  /** Shown between the controls and the chart, for example a notice. */
  notice?: ReactNode;
  /** Shown under the chart, inside the card body. */
  below?: ReactNode;
  footer?: ReactNode;
  option: EChartsOption;
  height?: number;
  onClick?: (p: ChartClick) => void;
  exportName: string;
  label: string;
  /** Replaces the chart with this message, for example when there is no data. */
  empty?: string | false;
}

/** A card with a controls row, an optional notice, one chart and free content under it. */
export function ChartPanel({ title, subtitle, calc, controls, notice, below, footer, option, height = 320, onClick, exportName, label, empty }: ChartPanelProps) {
  return (
    <Card title={title} subtitle={subtitle} calc={calc} footer={footer} padded={false} bodyClassName="py-3">
      {controls ? <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 px-4">{controls}</div> : null}
      {notice ? <div className="mb-2 px-4">{notice}</div> : null}
      <div className="px-2">
        {empty ? (
          <div className="flex items-center justify-center" style={{ minHeight: Math.min(height, 200) }}>
            <EmptyState icon={<BarChart3 size={22} />} title={empty} />
          </div>
        ) : (
          <EChart option={option} height={height} onClick={onClick} exportName={exportName} label={label} />
        )}
      </div>
      {below ? <div className="mt-2 px-4">{below}</div> : null}
    </Card>
  );
}
