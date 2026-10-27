import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cx } from './cx';
import { sortOptions, type OptionOrder } from './sortOptions';
import { t } from '../../i18n';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
  title?: string;
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  size = 'md',
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
  /** Accessible name of the group. */
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex max-w-full flex-wrap gap-0.5 rounded-md border border-border bg-surface p-0.5', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              'whitespace-nowrap rounded-sm font-medium transition-colors',
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
              on ? 'bg-primary text-primary-fg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cx('flex items-start gap-2.5', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors', checked ? 'border-accent bg-accent' : 'border-border bg-surface-3')}
      >
        <span className={cx('absolute top-0.5 size-3.5 rounded-full shadow transition-all', checked ? 'start-[18px] bg-accent-fg' : 'start-0.5 bg-fg-muted')} />
      </button>
      {label || description ? (
        <span className="min-w-0 text-sm">
          {label ? <span className="font-medium">{label}</span> : null}
          {description ? <span className="block text-xs text-fg-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

export function Field({ label, hint, children, className }: { label?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label ? <span className="label">{label}</span> : null}
      {children}
      {hint ? <span className="mt-1 block text-xs text-fg-subtle">{hint}</span> : null}
    </div>
  );
}

export interface NumberFieldProps {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  /** An empty input yields `null`. Without it, empty input is ignored. */
  allowEmpty?: boolean;
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
}

/** Numeric input that lets you type freely (including partial values) and commits valid numbers as you go. */
export function NumberField({ value, onChange, min, max, step = 1, prefix, suffix, placeholder, allowEmpty, className, disabled, ...rest }: NumberFieldProps) {
  const [text, setText] = useState(value === null ? '' : String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value === null ? '' : String(value));
  }, [value]);
  const commit = (raw: string) => {
    setText(raw);
    if (raw.trim() === '') {
      if (allowEmpty) onChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
  };
  return (
    <div className={cx('relative flex items-center', className)}>
      {prefix ? <span className="pointer-events-none absolute start-2.5 text-xs text-fg-subtle">{prefix}</span> : null}
      <input
        type="number"
        inputMode="decimal"
        className={cx('input num', prefix && 'ps-6', suffix && 'pe-9')}
        value={text}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={rest['aria-label']}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(value === null ? '' : String(value));
        }}
        onChange={(e) => commit(e.target.value)}
      />
      {suffix ? <span className="pointer-events-none absolute end-2.5 text-xs text-fg-subtle">{suffix}</span> : null}
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 0.01,
  format,
  label,
  hint,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        {label ? (
          <label htmlFor={id} className="text-xs font-medium text-fg-muted">
            {label}
          </label>
        ) : (
          <span />
        )}
        <span className="num text-xs font-semibold text-fg">{format ? format(value) : value}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-[var(--accent)]" />
      {hint ? <div className="mt-1 text-xs text-fg-subtle">{hint}</div> : null}
    </div>
  );
}

/** A dropdown. Choices are shown A to Z unless `order="given"` (see sortOptions). Labels should already be translated. */
export function Select<T extends string | number>({
  value,
  onChange,
  options,
  order = 'alpha',
  className,
  ...rest
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  order?: OptionOrder;
  className?: string;
  'aria-label'?: string;
}) {
  const sorted = useMemo(() => sortOptions(options, (o) => o.label, order), [options, order]);
  return (
    <select
      className={cx('input w-auto max-w-full pe-7', className)}
      value={String(value)}
      aria-label={rest['aria-label']}
      onChange={(e) => {
        const o = options.find((x) => String(x.value) === e.target.value);
        if (o) onChange(o.value);
      }}
    >
      {sorted.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder, className, ...rest }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; 'aria-label'?: string }) {
  const hint = placeholder ?? t('Search…');
  return (
    <div className={cx('relative', className)}>
      <Search size={14} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
      <input type="search" className="input ps-8 pe-7 [&::-webkit-search-cancel-button]:hidden" value={value} placeholder={hint} aria-label={rest['aria-label'] ?? hint} onChange={(e) => onChange(e.target.value)} />
      {value ? (
        <button type="button" onClick={() => onChange('')} className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-subtle hover:text-fg" aria-label={t('Clear search')}>
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}

/** A button that opens a small floating panel; closes on outside click or Escape. `align` is the side the panel lines up with. */
export function Popover({ trigger, children, align = 'end', className }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: ReactNode | ((close: () => void) => ReactNode); align?: 'start' | 'end'; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div ref={ref} className="relative inline-block">
      {trigger(open, () => setOpen((o) => !o))}
      {open ? (
        <div className={cx('anim-fade absolute z-40 mt-1.5 min-w-48 rounded-lg border border-border bg-surface p-1.5 shadow-pop', align === 'end' ? 'end-0' : 'start-0', className)}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}
