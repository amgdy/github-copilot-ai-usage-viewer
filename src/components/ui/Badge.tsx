import type { ReactNode } from 'react';
import type { Severity } from '../../lib/analytics/recommendations';
import type { TaxonomyItem } from '../../lib/analytics/taxonomy';
import { cx } from './cx';
import { TONE_CLASS, type Tone } from './Primitives';
import { msg, t } from '../../i18n';

export interface BadgeProps {
  tone?: Tone;
  /** Hex color for a small square in front of the text (used for taxonomy items). Overrides the tone styling. */
  color?: string;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Badge({ tone = 'neutral', color, children, title, className }: BadgeProps) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-px text-[11px] font-medium leading-4',
        color ? 'border-border bg-surface text-fg' : TONE_CLASS[tone],
        className,
      )}
    >
      {color ? <span className="size-2 shrink-0 rounded-xs" style={{ background: color }} /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

const SEVERITY: Record<Severity, { tone: Tone; label: string }> = {
  critical: { tone: 'bad', label: msg('Critical') },
  high: { tone: 'bad', label: msg('High') },
  medium: { tone: 'warn', label: msg('Medium') },
  low: { tone: 'info', label: msg('Low') },
  info: { tone: 'neutral', label: msg('Info') },
  positive: { tone: 'good', label: msg('Good news') },
};

/** The translated name of a severity. */
export const severityLabel = (severity: Severity): string => t(SEVERITY[severity].label);
export const severityTone = (severity: Severity): Tone => SEVERITY[severity].tone;

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={SEVERITY[severity].tone}>{severityLabel(severity)}</Badge>;
}

/** Badge for a taxonomy item (tier, persona, trait, …): colored square, label and the plain-language description as tooltip. Taxonomy texts are already translated. */
export function TaxBadge({ item, className }: { item: TaxonomyItem | undefined; className?: string }) {
  if (!item) return null;
  return (
    <Badge color={item.color} title={`${item.description}\n→ ${item.action}`} className={className}>
      {item.label}
    </Badge>
  );
}

/** Index a taxonomy list by id for quick lookups in tables. */
export function taxLookup<T extends string>(items: TaxonomyItem<T>[]): Record<T, TaxonomyItem<T>> {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<T, TaxonomyItem<T>>;
}
