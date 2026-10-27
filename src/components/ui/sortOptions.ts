import { getLocale } from '../../i18n/core';

/**
 * How the choices in a dropdown or filter list are ordered.
 * - `alpha` (default): A to Z by the text the reader sees, with numbers in number order ("Org 2" before "Org 10").
 * - `given`: keep the order of the array. Use it only for scales with a natural order, such as dates, months or
 *   the Minimal to Power tiers, where A to Z would put them out of sequence.
 */
export type OptionOrder = 'alpha' | 'given';

/** Values that always stay at the top in their own order, such as "All" or "Any". */
export const PINNED_VALUES: readonly (string | number)[] = ['', 'all', 'any', 'none', '*'];

let collator: { locale: string; c: Intl.Collator } | null = null;
function compareText(a: string, b: string): number {
  const locale = getLocale();
  if (collator?.locale !== locale) collator = { locale, c: new Intl.Collator(locale === 'ar' ? ['ar', 'en'] : 'en', { numeric: true, sensitivity: 'base' }) };
  return collator.c.compare(a, b);
}

/** Orders options A to Z by `labelOf`, keeping pinned values first. Stable, and returns a new array. */
export function sortOptions<O extends { value: string | number }>(
  options: readonly O[],
  labelOf: (o: O) => string,
  order: OptionOrder = 'alpha',
  pinned: readonly (string | number)[] = PINNED_VALUES,
): O[] {
  if (order === 'given') return [...options];
  const top = options.filter((o) => pinned.includes(o.value));
  const rest = options.filter((o) => !pinned.includes(o.value));
  return [...top, ...rest.sort((a, b) => compareText(labelOf(a), labelOf(b)))];
}
