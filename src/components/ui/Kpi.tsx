import { createContext, useContext, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { CalcInfo, CalcLine, type CalcRef } from './CalcInfo';
import { cx } from './cx';
import type { Tone } from './Primitives';
import { InfoTip, Sparkline } from './Viz';
import { t } from '../../i18n';

export interface KpiDelta {
  /** Fractional change versus the comparison period (0.12 = +12%). */
  pct: number;
  text: string;
}

export interface KpiProps {
  label: string;
  value: ReactNode;
  /** Secondary line under the value. */
  sub?: ReactNode;
  /** Change versus the previous period; build it with `fmtDelta(current, previous)`. */
  delta?: KpiDelta | null;
  /** Whether an increase is good, bad or neither. Controls the delta color. */
  goodWhen?: 'up' | 'down' | 'none';
  tone?: Tone;
  /** Explanation shown in an info tooltip. */
  hint?: ReactNode;
  /** Id of the explanation of how the number is calculated (see `src/lib/metrics/docs`). Every KPI needs one. */
  calc?: CalcRef;
  icon?: ReactNode;
  spark?: ArrayLike<number>;
  /** Another small chart from `MiniCharts`, used when a trend line does not fit the figure. Ignored when `spark` is set. */
  mini?: ReactNode;
  onClick?: () => void;
  className?: string;
}

const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-fg',
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  info: 'text-info',
  accent: 'text-fg',
};

/** True inside a KpiGrid: the figures then share one ruled panel instead of being separate boxes. */
const InLedger = createContext(false);

export function Kpi({ label, value, sub, delta, goodWhen = 'none', tone = 'neutral', hint, calc, icon, spark, mini, onClick, className }: KpiProps) {
  const inLedger = useContext(InLedger);
  const dir = delta ? (delta.pct > 0.005 ? 1 : delta.pct < -0.005 ? -1 : 0) : 0;
  const deltaTone = dir === 0 || goodWhen === 'none' ? 'text-fg-muted' : (dir > 0) === (goodWhen === 'up') ? 'text-good' : 'text-bad';
  return (
    <div
      className={cx(
        'relative min-w-0 p-3.5 text-start',
        inLedger ? 'border-b border-e border-border-muted' : 'card',
        onClick && (inLedger ? 'transition-colors focus-within:bg-surface-2 hover:bg-surface-2' : 'transition-colors focus-within:border-fg-subtle hover:border-fg-subtle hover:bg-surface-2'),
        className,
      )}
    >
      {/* A stretched button keeps the info tooltip (a button too) out of the clickable element. */}
      {onClick ? <button type="button" onClick={onClick} aria-label={t('{name}: show details', { name: label })} className="absolute inset-0 rounded-[inherit]" /> : null}
      <div className="@container flex flex-col gap-1">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-fg-muted @max-[200px]:min-h-8 @max-[200px]:items-start">
          {icon}
          <span className="line-clamp-2 min-w-0 leading-4">{label}</span>
          {hint ? <InfoTip>{hint}</InfoTip> : null}
          {calc ? <CalcInfo id={calc} /> : null}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className={cx('font-display num min-w-0 truncate text-[22px] leading-tight', VALUE_TONE[tone])}>{value}</div>
          {spark ? <Sparkline className="hidden @min-[200px]:block" values={spark} width={64} height={24} tone={tone === 'neutral' ? 'accent' : tone} /> : mini ? <div className="hidden @min-[200px]:block">{mini}</div> : null}
        </div>
        <div className="flex min-h-4 flex-wrap items-center gap-x-2 text-xs text-fg-muted">
          {delta ? (
            <span className={cx('inline-flex items-center gap-0.5 font-medium', deltaTone)} title={t('Change versus the previous period of the same length')}>
              {dir > 0 ? <ArrowUpRight size={13} /> : dir < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
              {delta.text}
            </span>
          ) : null}
          {sub ? <span className="line-clamp-2 min-w-0">{sub}</span> : null}
        </div>
        <CalcLine id={calc} className="mt-0.5" />
      </div>
    </div>
  );
}

/**
 * A ruled panel of figures, like a ledger: one hairline frame with thin lines between the cells.
 * `cols` sets the grid columns (default: 2, 3 from md, 6 from 2xl).
 */
export function KpiGrid({ children, className, cols = 'grid-cols-2 md:grid-cols-3 2xl:grid-cols-6' }: { children: ReactNode; className?: string; cols?: string }) {
  return (
    <div className={cx('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      {/* The grid sticks out 1px at the bottom and end, so the outer frame hides the last row and column lines. */}
      <div className={cx('-mb-px -me-px grid', cols)}>
        <InLedger.Provider value={true}>{children}</InLedger.Provider>
      </div>
    </div>
  );
}
