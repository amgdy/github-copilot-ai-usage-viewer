import { useEffect, useId, useRef, useState } from 'react';
import { cx } from '../../components/ui';
import { t } from '../../i18n';
import { numText, parseNumber } from './numbers';

export interface NumInputProps {
  value: number | null;
  /** Receives a valid, clamped value. Return a message to reject it and show it under the field. */
  onCommit: (value: number | null) => string | null | void;
  min?: number;
  max?: number;
  integer?: boolean;
  /** Lets the field be empty, which commits null. */
  allowEmpty?: boolean;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  /** Accessible name of the field. */
  label: string;
  digits?: number;
  widthClass?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Number field that keeps what you type in local state and commits on blur or Enter,
 * so typing never triggers a recompute. Escape puts the last committed value back.
 */
export function NumInput({
  value,
  onCommit,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  integer = false,
  allowEmpty = false,
  prefix,
  suffix,
  placeholder,
  label,
  digits = 4,
  widthClass = 'w-28',
  className,
  disabled,
}: NumInputProps) {
  const [text, setText] = useState(() => numText(value, digits));
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const focused = useRef(false);
  const messageId = useId();

  // Follow changes made elsewhere (section reset, import) unless the user is typing.
  useEffect(() => {
    if (focused.current) return;
    setText(numText(value, digits));
    setError(null);
    setNote(null);
  }, [value, digits]);

  const commit = () => {
    const raw = text.trim();
    let next: number | null = null;
    let clampNote: string | null = null;
    if (raw === '') {
      if (!allowEmpty) {
        setError(t('Enter a number.'));
        return;
      }
    } else {
      const parsed = parseNumber(raw);
      if (parsed === null) {
        setError(t('Enter a number, for example 12.5.'));
        return;
      }
      const rounded = integer ? Math.round(parsed) : Number(parsed.toFixed(digits));
      next = Math.min(max, Math.max(min, rounded));
      if (next !== rounded) {
        clampNote =
          next === max
            ? t('Limited to {value}, the highest allowed value.', { value: numText(next, digits) })
            : t('Limited to {value}, the lowest allowed value.', { value: numText(next, digits) });
      }
    }
    const same = next === null ? value === null : value !== null && Math.abs(next - value) < 1e-9;
    const rejected = same ? null : onCommit(next);
    if (typeof rejected === 'string' && rejected) {
      setNote(null);
      setError(rejected);
      return;
    }
    setError(null);
    setNote(clampNote);
    setText(next === null ? '' : numText(next, digits));
  };

  const padStart = prefix ? 'ps-6' : undefined;
  const padEnd = suffix ? (suffix.length <= 1 ? 'pe-6' : suffix.length <= 4 ? 'pe-12' : 'pe-16') : undefined;
  const message = error ?? note;

  return (
    <div className={cx('min-w-0', className)}>
      <div className={cx('relative max-w-full', widthClass)}>
        {prefix ? <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-sm text-fg-subtle">{prefix}</span> : null}
        <input
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          spellCheck={false}
          className={cx('input num', padStart, padEnd, error && 'border-bad focus:border-bad focus:ring-bad/30')}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          onFocus={(event) => {
            focused.current = true;
            event.currentTarget.select();
          }}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
            setNote(null);
          }}
          onBlur={() => {
            focused.current = false;
            commit();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              setText(numText(value, digits));
              setError(null);
              setNote(null);
            }
          }}
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-sm text-fg-subtle">{suffix}</span> : null}
      </div>
      {error ? (
        <p id={messageId} role="alert" className="mt-1 text-xs text-bad">
          {error}
        </p>
      ) : note ? (
        <p id={messageId} className="mt-1 text-xs text-fg-muted">
          {note}
        </p>
      ) : null}
    </div>
  );
}
