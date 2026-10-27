import { type ReactNode } from 'react';
import { t } from '../../i18n';
import { fmtPct } from '../../lib/utils/format';
import { CalcInfo, cx, type CalcRef } from '../ui';

interface BarRowProps {
  label: ReactNode;
  value: ReactNode;
  /** Bar length as a fraction of the track, 0 to 1. */
  fraction: number;
  /** CSS color. The accent color is used when omitted. */
  color?: string;
  title?: string;
}

export function BarList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="space-y-1.5" aria-label={label}>
      {children}
    </ul>
  );
}

export function BarRow({ label, value, fraction, color, title }: BarRowProps) {
  const width = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  return (
    <li
      className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto] items-center gap-2 text-xs sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]"
      title={title}
    >
      <span className="truncate text-fg">{label}</span>
      <span className="h-2 overflow-hidden rounded-xs bg-surface-3" aria-hidden>
        <span className={cx('block h-full rounded-xs', !color && 'bg-accent')} style={{ width: `${width * 100}%`, backgroundColor: color }} />
      </span>
      <span className="num min-w-[4.5rem] text-end text-fg-muted">{value}</span>
    </li>
  );
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** One stacked bar for shares that add up to a whole, with a legend underneath. */
export function SplitBar({ title, segments, note, calc }: { title: string; segments: Segment[]; note?: ReactNode; calc?: CalcRef }) {
  const parts = segments.filter((s) => Number.isFinite(s.value) && s.value > 0);
  const total = parts.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          {title}
          {calc ? <CalcInfo id={calc} /> : null}
        </span>
        {note ? <span className="text-xs text-fg-muted">{note}</span> : null}
      </div>
      {total > 0 ? (
        <>
          <div
            className="flex h-2.5 overflow-hidden rounded-xs bg-surface-3"
            role="img"
            aria-label={t('{title}: {parts}', { title, parts: parts.map((s) => t('{label} {share}', { label: s.label, share: fmtPct(s.value / total, 0) })).join(', ') })}
          >
            {parts.map((s) => (
              <span key={s.label} className="h-full" style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} title={`${s.label}: ${fmtPct(s.value / total, 1)}`} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-fg-muted">
            {parts.map((s) => (
              <li key={s.label} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-xs" style={{ backgroundColor: s.color }} aria-hidden />
                {s.label}
                <span className="num text-fg">{fmtPct(s.value / total, 0)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="text-xs text-fg-subtle">{t('No usage to split.')}</div>
      )}
    </div>
  );
}
