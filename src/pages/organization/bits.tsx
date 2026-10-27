import { cx } from '../../components/ui';
import { msg } from '../../i18n';
import { fmtCompact, fmtInt, fmtPctAuto } from '../../lib/utils/format';
import { drill } from '../../state/router';
import type { Group } from './groups';

export const signedPct = (v: number): string => `${v >= 0 ? '+' : ''}${fmtPctAuto(v)}`;

/** A token count: whole numbers below 1,000 and a unit suffix above (1.20M). */
export const fmtTokens = (v: number): string => (Math.abs(v) >= 1000 ? fmtCompact(v) : fmtInt(v));

export const NO_TOKENS_NOTE = msg(
  'This report has no token columns, so token counts and the cache hit rate are not shown. They need the input, output, cache read and cache write columns of the detailed usage export.',
);

export const NO_BILLING_NOTE = msg('This file does not say what was billed, so the billed and covered amounts are not shown.');

/** Chart height that gives each of up to 16 bars room, between 220 and 460 px. */
export const chartHeight = (items: number): number => Math.min(460, Math.max(220, Math.min(items, 16) * 27 + 16));

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** The one of two colors (hex) that has the better contrast on the background. */
export function readableOn(bg: string, a: string, b: string): string {
  const lb = luminance(bg);
  const contrast = (c: string) => {
    const l = luminance(c);
    return (Math.max(l, lb) + 0.05) / (Math.min(l, lb) + 0.05);
  };
  return contrast(a) >= contrast(b) ? a : b;
}

/** Narrows the whole report to one group. */
export function filterToGroup(g: Pick<Group, 'filter'>): void {
  drill(g.filter, { merge: true });
}

/** A group name that is cut off with an ellipsis when it is long; the full name is in the tooltip. */
export function GroupName({ name, blank, className }: { name: string; blank?: boolean; className?: string }) {
  return (
    <span className={cx('block max-w-[28ch] truncate', blank && 'italic text-fg-muted', className)} title={name}>
      {name}
    </span>
  );
}

/** A percentage with a small bar. `max` is the fraction that fills the bar. */
export function ShareCell({ frac, max, text }: { frac: number; max: number; text: string }) {
  const width = max > 0 && Number.isFinite(frac) ? Math.min(100, Math.max(0, (frac / max) * 100)) : 0;
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-xs bg-surface-3" aria-hidden>
        <span className="block h-full rounded-xs bg-accent" style={{ width: `${width}%` }} />
      </span>
      <span className="w-12">{text}</span>
    </span>
  );
}
