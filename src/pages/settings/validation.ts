import { t } from '../../i18n';
import { SCALARS, unitText } from './limits';
import { toPct } from './numbers';

export interface OrderItem<K extends string> {
  key: K;
  /** Name used in messages, for example "Light limit". English; translated when the message is built. */
  label: string;
}

/**
 * Checks that setting `key` to `next` keeps `items` strictly ascending.
 * Returns an inline error message, or null when the order holds.
 */
export function orderError<K extends string>(
  items: readonly OrderItem<K>[],
  values: Record<K, number>,
  key: K,
  next: number,
  fmt: (n: number) => string,
): string | null {
  const i = items.findIndex((it) => it.key === key);
  if (i < 0) return null;
  const below = items[i - 1];
  if (below && next <= values[below.key]) return t('"{name}" must be above "{other}" ({value}).', { name: t(items[i].label), other: t(below.label), value: fmt(values[below.key]) });
  const above = items[i + 1];
  if (above && next >= values[above.key]) return t('"{name}" must be below "{other}" ({value}).', { name: t(items[i].label), other: t(above.label), value: fmt(values[above.key]) });
  return null;
}

export function isStrictlyAscending(values: readonly number[]): boolean {
  for (let i = 1; i < values.length; i++) if (!(values[i] > values[i - 1])) return false;
  return true;
}

/** The two limits that cut users into the Auto use classes, as stored fractions. The lower one must stay below the upper one. */
export interface AutoLimits {
  lowAuto: number;
  autoFirst: number;
}

const autoName = (key: keyof AutoLimits): string => t(SCALARS[key].label);
const autoValue = (key: keyof AutoLimits, fraction: number): string => unitText(SCALARS[key], toPct(fraction));

/**
 * Checks that setting `key` to `next` keeps "Rarely uses Auto below" strictly under "Auto first from".
 * Returns an inline error message, or null when the pair holds.
 */
export function autoLimitsError(current: AutoLimits, key: keyof AutoLimits, next: number): string | null {
  if (key === 'lowAuto') {
    if (next < current.autoFirst) return null;
    return t('"{name}" must be below "{other}" ({value}). Raise that setting first, or enter a lower value.', {
      name: autoName('lowAuto'),
      other: autoName('autoFirst'),
      value: autoValue('autoFirst', current.autoFirst),
    });
  }
  if (next > current.lowAuto) return null;
  return t('"{name}" must be above "{other}" ({value}). Lower that setting first, or enter a higher value.', {
    name: autoName('autoFirst'),
    other: autoName('lowAuto'),
    value: autoValue('lowAuto', current.lowAuto),
  });
}

/**
 * Checks the Auto use limits of a settings file. A limit the file does not have counts at its default, because that is the value
 * it gets. Returns the line for the list of left-out items, or null when the pair holds.
 */
export function autoLimitsFileError(file: Partial<AutoLimits>, defaults: AutoLimits): string | null {
  const present = (['lowAuto', 'autoFirst'] as const).filter((k) => file[k] !== undefined);
  if (present.length === 0) return null;
  const low = file.lowAuto ?? defaults.lowAuto;
  const first = file.autoFirst ?? defaults.autoFirst;
  if (low < first) return null;
  const valueOf = (key: keyof AutoLimits, value: number) =>
    file[key] === undefined ? t('{value}, the default', { value: autoValue(key, value) }) : autoValue(key, value);
  const vars = { low: autoName('lowAuto'), lowValue: valueOf('lowAuto', low), first: autoName('autoFirst'), firstValue: valueOf('autoFirst', first) };
  if (present.length === 2) return t('Auto use limits: "{low}" ({lowValue}) must be below "{first}" ({firstValue}). "{low}" and "{first}" were left out.', vars);
  return t('Auto use limits: "{low}" ({lowValue}) must be below "{first}" ({firstValue}). "{name}" was left out.', { ...vars, name: autoName(present[0]) });
}
