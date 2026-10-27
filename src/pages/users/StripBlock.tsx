import type { ReactNode } from 'react';
import { CalcInfo, cx, type CalcRef } from '../../components/ui';

/** One panel of the Auto strip: a small title with its calc button, then the content. */
export function Block({ title, calc, className, children }: { title: string; calc: CalcRef; className?: string; children: ReactNode }) {
  return (
    <div className={cx('min-w-0 rounded-lg border border-border-muted bg-surface p-3', className)}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <span className="min-w-0">{title}</span>
        <CalcInfo id={calc} />
      </div>
      {children}
    </div>
  );
}

export function Line({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0 text-fg-muted">{label}</dt>
      <dd className="num shrink-0">{value}</dd>
    </div>
  );
}
