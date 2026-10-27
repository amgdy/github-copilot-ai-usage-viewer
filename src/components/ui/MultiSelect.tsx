import { useMemo, useState, type ReactNode } from 'react';
import { cx } from './cx';
import { SearchInput } from './Controls';
import { sortOptions, type OptionOrder } from './sortOptions';
import { t } from '../../i18n';

export interface MultiOption {
  value: string;
  label: string;
  /** Small vector icon before the label (vendor or product logo). */
  icon?: ReactNode;
  /** Right-aligned secondary text, e.g. "$123 · 45 rows". */
  meta?: string;
  /** Options with a count of 0 are dimmed. */
  count?: number;
  title?: string;
}

const MAX_RENDERED = 200;

/** Checkbox list with search; used by the filter drawer. Choices are shown A to Z unless `order="given"`. */
export function MultiSelect({
  options,
  selected,
  onToggle,
  onClear,
  searchable,
  order = 'alpha',
  maxHeight = 220,
  emptyText,
}: {
  options: MultiOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
  searchable?: boolean;
  order?: OptionOrder;
  maxHeight?: number;
  emptyText?: string;
}) {
  const [q, setQ] = useState('');
  const chosen = useMemo(() => new Set(selected), [selected]);
  const sorted = useMemo(() => sortOptions(options, (o) => o.label, order), [options, order]);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? sorted.filter((o) => o.label.toLowerCase().includes(needle)) : sorted;
  }, [sorted, q]);
  // Keep selected values visible even when they no longer match the facet options.
  const missing = selected.filter((s) => !options.some((o) => o.value === s));
  const list = matches.slice(0, MAX_RENDERED);
  const withSearch = searchable ?? options.length > 8;

  return (
    <div>
      {withSearch ? <SearchInput value={q} onChange={setQ} placeholder={t('Search {n} options…', { n: options.length })} className="mb-1.5" /> : null}
      <div className="overflow-auto rounded-md border border-border-muted" style={{ maxHeight }}>
        {missing.map((m) => (
          <Row key={`missing-${m}`} option={{ value: m, label: m, count: 0 }} checked onToggle={onToggle} />
        ))}
        {list.map((o) => (
          <Row key={o.value} option={o} checked={chosen.has(o.value)} onToggle={onToggle} />
        ))}
        {!list.length && !missing.length ? <div className="px-3 py-3 text-center text-xs text-fg-muted">{q ? t('No match') : (emptyText ?? t('No options'))}</div> : null}
        {matches.length > MAX_RENDERED ? (
          <div className="border-t border-border-muted px-3 py-1.5 text-center text-[11px] text-fg-subtle">
            {t('Showing the first {shown} of {total}. Type to narrow the list.', { shown: MAX_RENDERED, total: matches.length })}
          </div>
        ) : null}
      </div>
      {selected.length && onClear ? (
        <button type="button" onClick={onClear} className="mt-1 text-xs text-accent hover:underline">
          {t('Clear {n} selected', { n: selected.length })}
        </button>
      ) : null}
    </div>
  );
}

function Row({ option, checked, onToggle }: { option: MultiOption; checked: boolean; onToggle: (v: string) => void }) {
  return (
    <label title={option.title ?? option.label} className={cx('flex cursor-pointer items-center gap-2 px-2.5 py-1 text-xs hover:bg-surface-3', option.count === 0 && !checked && 'opacity-50')}>
      <input type="checkbox" className="accent-[var(--accent)]" checked={checked} onChange={() => onToggle(option.value)} />
      {option.icon ? <span className="flex shrink-0 text-fg-muted" aria-hidden>{option.icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {option.meta ? <span className="num shrink-0 text-fg-muted">{option.meta}</span> : null}
    </label>
  );
}
