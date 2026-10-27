import { useId, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cx } from './cx';
import type { Tone } from './Primitives';
import { t } from '../../i18n';

const TIP_WIDTH = 256;

/** A small "i" icon that explains a metric on hover or keyboard focus. */
export function InfoTip({ children, className }: { children: ReactNode; className?: string }) {
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  // The tip is centered on the icon; near a viewport edge it is nudged back inside. The measures are
  // screen positions, so the tip is placed with physical left in both reading directions.
  const place = () => {
    const bounds = root.current?.getBoundingClientRect();
    if (!bounds) return;
    const viewportWidth = document.documentElement.clientWidth;
    const tipWidth = Math.min(TIP_WIDTH, viewportWidth - 16);
    const centered = bounds.left + bounds.width / 2 - tipWidth / 2;
    setShift(Math.min(Math.max(centered, 8), viewportWidth - tipWidth - 8) - centered);
  };
  return (
    <span ref={root} onMouseEnter={place} onFocus={place} className={cx('group/tip relative inline-flex align-middle', className)}>
      <button type="button" aria-describedby={id} className="rounded-full text-fg-subtle hover:text-fg-muted focus-visible:text-fg-muted" aria-label={t('More information')}>
        <Info size={13} />
      </button>
      <span
        id={id}
        role="tooltip"
        style={{ left: '50%', marginLeft: shift - TIP_WIDTH / 2 }}
        className="anim-fade pointer-events-none absolute top-full z-50 mt-1.5 hidden w-64 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface p-2 text-start text-xs font-normal normal-case leading-snug tracking-normal text-fg shadow-pop group-focus-within/tip:block group-hover/tip:block"
      >
        {children}
      </span>
    </span>
  );
}

const SPARK_COLOR: Record<Tone, string> = {
  neutral: 'var(--fg-subtle)',
  good: 'var(--good)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  info: 'var(--info)',
  accent: 'var(--accent)',
};

export interface SparklineProps {
  values: ArrayLike<number>;
  width?: number;
  height?: number;
  tone?: Tone;
  /** Explicit color (any CSS color); overrides the tone. */
  color?: string;
  fill?: boolean;
  className?: string;
}

/** Tiny inline trend line. */
export function Sparkline({ values, width = 96, height = 28, tone = 'accent', color, fill = true, className }: SparklineProps) {
  const pointCount = values.length;
  if (pointCount < 2) return <span className={cx('inline-block', className)} style={{ width, height }} />;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < pointCount; i++) {
    const value = values[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const padding = 2;
  const span = max - min || 1;
  const points: string[] = [];
  for (let i = 0; i < pointCount; i++) {
    const x = padding + (i / (pointCount - 1)) * (width - 2 * padding);
    const y = height - padding - ((values[i] - min) / span) * (height - 2 * padding);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const lineColor = color ?? SPARK_COLOR[tone];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cx('shrink-0', className)} aria-hidden>
      {fill ? <polygon points={`${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`} fill={lineColor} opacity={0.14} /> : null}
      <polyline points={points.join(' ')} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const BAR_COLOR: Record<Tone, string> = {
  neutral: 'bg-fg-subtle',
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  accent: 'bg-accent',
};

export interface ProgressBarProps {
  /** Fraction, where 1 = 100%. Values above 1 fill the bar and mark overflow. */
  value: number;
  tone?: Tone;
  /** Optional second, lighter segment (e.g. projected usage), also a fraction. */
  ghost?: number;
  height?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, tone = 'accent', ghost, height = 8, className, label }: ProgressBarProps) {
  const fraction = Number.isFinite(value) ? Math.max(0, value) : 0;
  const ghostFraction = ghost !== undefined && Number.isFinite(ghost) ? Math.max(0, ghost) : 0;
  return (
    <div
      className={cx('relative w-full overflow-hidden rounded-xs bg-surface-3', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(Math.min(fraction, 1) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {ghostFraction > fraction ? <div className={cx('absolute inset-y-0 start-0 opacity-30', BAR_COLOR[tone])} style={{ width: `${Math.min(ghostFraction, 1) * 100}%` }} /> : null}
      <div className={cx('absolute inset-y-0 start-0 rounded-xs', BAR_COLOR[fraction > 1 ? 'bad' : tone])} style={{ width: `${Math.min(fraction, 1) * 100}%` }} />
    </div>
  );
}
