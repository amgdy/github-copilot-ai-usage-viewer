import type { ReactNode } from 'react';
import type { Tone } from './Primitives';
import { cx } from './cx';

/** Small charts for KPI tiles. They only repeat what the tile says in words, so they are hidden from screen readers. */

const WIDTH = 64;
const HEIGHT = 24;

export const MINI_COLOR: Record<Tone, string> = {
  neutral: 'var(--fg-subtle)',
  good: 'var(--good)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  info: 'var(--info)',
  accent: 'var(--accent)',
};

const TRACK = 'var(--border-muted)';
const MUTED = 'var(--fg-subtle)';

const finite = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0);

function Frame({ children, className, width = WIDTH }: { children: ReactNode; className?: string; width?: number }) {
  return (
    <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className={cx('shrink-0', className)} aria-hidden>
      {children}
    </svg>
  );
}

export interface MiniColumnsProps {
  values: readonly number[];
  /** Color of each column; defaults to the tone. */
  colorOf?: (index: number, value: number) => string;
  tone?: Tone;
  /** Draws a dashed line at this value, for example 1 for 100%. */
  reference?: number;
  className?: string;
}

/** Column chart: one column per month, week, day or group. */
export function MiniColumns({ values, colorOf, tone = 'accent', reference, className }: MiniColumnsProps) {
  if (values.length === 0) return null;
  const top = Math.max(...values.map(finite), reference ?? 0) || 1;
  const gap = values.length > 16 ? 1 : 2;
  const columnWidth = Math.max(1, (WIDTH - gap * (values.length - 1)) / values.length);
  const scale = (value: number) => (finite(value) / top) * (HEIGHT - 2);
  return (
    <Frame className={className}>
      {values.map((value, index) => {
        const columnHeight = Math.max(finite(value) > 0 ? 1 : 0, scale(value));
        return (
          <rect
            key={index}
            x={index * (columnWidth + gap)}
            y={HEIGHT - columnHeight}
            width={columnWidth}
            height={columnHeight}
            rx={0.5}
            fill={colorOf ? colorOf(index, value) : MINI_COLOR[tone]}
          />
        );
      })}
      {reference !== undefined ? (
        <line x1={0} x2={WIDTH} y1={HEIGHT - scale(reference) + 0.5} y2={HEIGHT - scale(reference) + 0.5} stroke={MUTED} strokeWidth={1} strokeDasharray="2 2" />
      ) : null}
    </Frame>
  );
}

/** Ring that fills to a share between 0 and 1. */
export function MiniRing({ fraction, tone = 'accent', className }: { fraction: number; tone?: Tone; className?: string }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, finite(fraction)) * circumference;
  const centerX = HEIGHT / 2;
  return (
    <Frame className={className} width={HEIGHT}>
      <circle cx={centerX} cy={HEIGHT / 2} r={radius} fill="none" stroke={TRACK} strokeWidth={4} />
      <circle
        cx={centerX}
        cy={HEIGHT / 2}
        r={radius}
        fill="none"
        stroke={MINI_COLOR[tone]}
        strokeWidth={4}
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(-90 ${centerX} ${HEIGHT / 2})`}
      />
    </Frame>
  );
}

export interface MiniPart {
  value: number;
  color: string;
}

/** One bar split into parts, for shares of a whole. */
export function MiniSplit({ parts, className }: { parts: readonly MiniPart[]; className?: string }) {
  const total = parts.reduce((sum, part) => sum + finite(part.value), 0);
  if (total <= 0) return null;
  const barHeight = 10;
  let offset = 0;
  return (
    <Frame className={className}>
      {parts.map((part, index) => {
        const partWidth = (finite(part.value) / total) * WIDTH;
        const x = offset;
        offset += partWidth;
        return partWidth > 0 ? <rect key={index} x={x} y={(HEIGHT - barHeight) / 2} width={Math.max(2, partWidth - (index < parts.length - 1 ? 1 : 0))} height={barHeight} fill={part.color} /> : null;
      })}
    </Frame>
  );
}

/** Two bars: what it is now (gray) and what it would be after a change (colored). */
export function MiniCompare({ before, after, tone = 'accent', className }: { before: number; after: number; tone?: Tone; className?: string }) {
  const top = Math.max(finite(before), finite(after));
  if (top <= 0) return null;
  const barHeight = 7;
  return (
    <Frame className={className}>
      <rect x={0} y={4} width={Math.max(1, (finite(before) / top) * WIDTH)} height={barHeight} fill={MUTED} opacity={0.55} />
      <rect x={0} y={HEIGHT - 4 - barHeight} width={Math.max(1, (finite(after) / top) * WIDTH)} height={barHeight} fill={MINI_COLOR[tone]} />
    </Frame>
  );
}

export interface MiniBurnUpProps {
  /** Running total for each day so far this month. */
  cumulative: readonly number[];
  daysInMonth: number;
  /** Expected running total at the end of the month. */
  projected: number;
  /** Optional limit drawn as a dashed line, such as the included credits of the month. */
  limit?: number;
  tone?: Tone;
  className?: string;
}

/** Running total of the month so far, with a dashed line to the expected month-end figure. */
export function MiniBurnUp({ cumulative, daysInMonth, projected, limit, tone = 'accent', className }: MiniBurnUpProps) {
  if (cumulative.length === 0 || daysInMonth < 2) return null;
  const top = Math.max(finite(projected), ...cumulative.map(finite), limit !== undefined && Number.isFinite(limit) ? limit : 0) || 1;
  const padding = 2;
  const xAt = (day: number) => padding + (day / (daysInMonth - 1)) * (WIDTH - 2 * padding);
  const yAt = (value: number) => HEIGHT - padding - (finite(value) / top) * (HEIGHT - 2 * padding);
  const points = cumulative.map((value, day) => `${xAt(day).toFixed(1)},${yAt(value).toFixed(1)}`);
  const lastDay = cumulative.length - 1;
  const color = MINI_COLOR[tone];
  return (
    <Frame className={className}>
      {limit !== undefined && Number.isFinite(limit) && limit > 0 ? (
        <line x1={padding} x2={WIDTH - padding} y1={yAt(limit)} y2={yAt(limit)} stroke={MUTED} strokeWidth={1} strokeDasharray="2 2" />
      ) : null}
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {lastDay < daysInMonth - 1 ? (
        <line x1={xAt(lastDay)} y1={yAt(cumulative[lastDay])} x2={xAt(daysInMonth - 1)} y2={yAt(projected)} stroke={color} strokeWidth={1.5} strokeDasharray="2 2" strokeLinecap="round" />
      ) : null}
    </Frame>
  );
}
