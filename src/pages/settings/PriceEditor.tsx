import { useId, useMemo, useState } from 'react';
import { cx } from '../../components/ui';
import { t } from '../../i18n';
import type { Rates } from '../../lib/pricing/card';
import { numText } from './numbers';
import { RATE_FIELDS, parseRates, ratesText, type RateKey } from './models';

interface PriceEditorProps {
  model: string;
  /** Prices to start from: the saved override, else the built-in price. */
  initial: Rates | null;
  builtIn: Rates | null;
  /** Whether a saved custom price exists that "Use built-in prices" would remove. */
  canUseBuiltIn: boolean;
  onSave: (rates: Rates) => void;
  onUseBuiltIn: () => void;
  onCancel: () => void;
}

const fieldValues = (r: Rates | null): Record<RateKey, string> => ({
  input: numText(r?.input),
  cachedInput: numText(r?.cachedInput),
  cacheWrite: numText(r?.cacheWrite),
  output: numText(r?.output),
});

/** Four price fields saved together, so a half-filled set is never stored. */
export function PriceEditor({ model, initial, builtIn, canUseBuiltIn, onSave, onUseBuiltIn, onCancel }: PriceEditorProps) {
  const id = useId();
  const [values, setValues] = useState(() => fieldValues(initial));
  const [tried, setTried] = useState(false);
  const parsed = useMemo(() => parseRates(values), [values]);

  const submit = () => {
    setTried(true);
    if (parsed.rates) onSave(parsed.rates);
  };

  return (
    <form
      className="mt-3 rounded-md border border-border-muted bg-surface-2 p-3"
      aria-label={t('Prices for {model}', { model })}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="text-xs text-fg-muted">
        {t('Prices are in US dollars per 1 million tokens. They are used to price the tokens of this model in the estimates that work from token counts.')}
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RATE_FIELDS.map((f) => {
          const error = tried ? parsed.errors[f.key] : undefined;
          const note = error ?? (f.hint ? t(f.hint) : undefined);
          return (
            <div key={f.key} className="min-w-0">
              <label className="label" htmlFor={`${id}-${f.key}`}>
                {f.optional ? t('{name} (optional)', { name: t(f.label) }) : t(f.label)}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-sm text-fg-subtle">$</span>
                <input
                  id={`${id}-${f.key}`}
                  className={cx('input num ps-6', error && 'border-bad focus:border-bad focus:ring-bad/30')}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  value={values[f.key]}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={note ? `${id}-${f.key}-note` : undefined}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
              {note ? (
                <p id={`${id}-${f.key}-note`} role={error ? 'alert' : undefined} className={cx('mt-1 text-[11px]', error ? 'text-bad' : 'text-fg-subtle')}>
                  {note}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {tried && parsed.formError ? (
        <p role="alert" className="mt-1 text-xs text-bad">
          {parsed.formError}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-sm btn-primary">
          {t('Save prices')}
        </button>
        <button type="button" className="btn btn-sm" onClick={onCancel}>
          {t('Cancel')}
        </button>
        {canUseBuiltIn ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onUseBuiltIn}>
            {t('Use the price card prices')}
          </button>
        ) : null}
      </div>
      {builtIn ? <p className="num mt-2 text-xs text-fg-subtle">{t('Price card: {rates}.', { rates: ratesText(builtIn) })}</p> : null}
    </form>
  );
}
