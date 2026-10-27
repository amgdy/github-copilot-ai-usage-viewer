import { type ReactNode } from 'react';
import { t } from '../../i18n';
import { NumInput } from './NumInput';
import { numText } from './numbers';
import { ThresholdRow, Swatch } from './ThresholdRow';
import { orderError, type OrderItem } from './validation';

export interface OrderedField<K extends string> extends OrderItem<K> {
  /** Short English name shown as the row title, for example "Light". Wrap it in msg(); it is translated here. */
  name: string;
  /** English help text. Wrap it in msg(); it is translated here. */
  help: string;
  color?: string;
  min: number;
  max: number;
  /** Default value in percent. */
  defaultValue: number;
}

interface OrderedFieldsProps<K extends string> {
  /** Fields from the lowest to the highest value. They must stay strictly ascending. */
  fields: OrderedField<K>[];
  /** Current values in percent. */
  values: Record<K, number>;
  /** Called only with a value that keeps the order. */
  onSave: (key: K, percent: number) => void;
  /** Fixed rows shown before or after the editable ones. */
  before?: ReactNode;
  after?: ReactNode;
}

const fmt = (n: number) => `${numText(n, 2)}%`;

/** Percent inputs that must stay in ascending order. An invalid value is explained and never saved. */
export function OrderedFields<K extends string>({ fields, values, onSave, before, after }: OrderedFieldsProps<K>) {
  const commit = (key: K, next: number): string | null => {
    const error = orderError(fields, values, key, next, fmt);
    if (error) return error;
    onSave(key, next);
    return null;
  };

  return (
    <div className="divide-y divide-border-muted">
      {before}
      {fields.map((f) => (
        <ThresholdRow
          key={f.key}
          label={
            <>
              {f.color ? <Swatch color={f.color} /> : null}
              {t(f.name)}
            </>
          }
          description={t(f.help)}
          hint={t('Default {value}', { value: fmt(f.defaultValue) })}
        >
          <NumInput label={t('{name}, in percent', { name: t(f.label) })} value={values[f.key]} min={f.min} max={f.max} suffix="%" digits={2} onCommit={(v) => (v === null ? null : commit(f.key, v))} />
        </ThresholdRow>
      ))}
      {after}
    </div>
  );
}

/** A row for a boundary that follows from the other values and cannot be edited. Pass translated text. */
export function FixedRow({ name, color, help, value }: { name: string; color?: string; help: string; value: string }) {
  return (
    <ThresholdRow
      label={
        <>
          {color ? <Swatch color={color} /> : null}
          {name}
        </>
      }
      description={help}
    >
      <div className="flex h-8 items-center text-sm text-fg-muted">{value}</div>
    </ThresholdRow>
  );
}
