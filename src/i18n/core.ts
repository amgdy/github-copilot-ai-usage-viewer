/**
 * Translation core. English text is the key: t('Usage per user') returns the Arabic text when Arabic is on and
 * an Arabic entry exists, otherwise the English text. Values go in {braces}: t('{n} users', { n: '12' }).
 * This file imports nothing, so analysis code and Node scripts can use it too.
 */

export type Locale = 'en' | 'ar';

/** Arabic plural forms, chosen with Intl.PluralRules('ar'). `other` is required; missing forms fall back to it. */
export interface PluralEntry {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type Entry = string | PluralEntry;
export type Dict = Record<string, Entry>;
export type Vars = Record<string, string | number>;

export const LOCALES: { id: Locale; name: string; native: string; dir: 'ltr' | 'rtl' }[] = [
  { id: 'en', name: 'English', native: 'English', dir: 'ltr' },
  { id: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' },
];

let locale: Locale = 'en';
let dictionary: Dict = {};
const listeners = new Set<() => void>();
let misses: Set<string> | null = null;
const rules = new Map<Locale, Intl.PluralRules>();

export function getLocale(): Locale {
  return locale;
}

/** How Arabic shows digits: Arabic-Indic (١٢٣, the common style in Arabic text) or Latin (123). English always uses Latin. */
export type DigitStyle = 'arabic' | 'latin';

let digitStyle: DigitStyle = 'arabic';

export function getDigitStyle(): DigitStyle {
  return digitStyle;
}

/** Switches the Arabic digit style. App code uses `setDigitStyle` from ./load, which also remembers the choice. */
export function applyDigitStyle(next: DigitStyle): void {
  digitStyle = next;
  for (const listener of listeners) listener();
}

/** True when numbers are shown with Arabic-Indic digits right now. */
export function usesArabicDigits(): boolean {
  return locale === 'ar' && digitStyle === 'arabic';
}

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Writes the digits of a formatted number in the current style: "12,345.6%" becomes "١٢٬٣٤٥٫٦٪" in Arabic.
 * Separators and the percent sign change only next to a digit, so other text is left alone. Use it only for
 * numbers the app formats, never for names such as logins or model names.
 */
export function localizeDigits(text: string): string {
  if (!usesArabicDigits()) return text;
  return text
    .replace(/(\d)\.(?=\d)/g, '$1٫')
    .replace(/(\d),(?=\d)/g, '$1٬')
    .replace(/(\d)%/g, '$1٪')
    .replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
}

export function isRtl(): boolean {
  return locale === 'ar';
}

/** Switches the language. App code uses `setLocale` from ./load, which also loads the dictionaries. */
export function applyLocale(next: Locale, entries: Dict): void {
  locale = next;
  dictionary = next === 'en' ? {} : entries;
  for (const listener of listeners) listener();
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Starts recording keys that have no translation (used by tests and the in-browser check). */
export function trackMisses(on: boolean): void {
  misses = on ? new Set() : null;
}

export function missedKeys(): string[] {
  return misses ? [...misses].sort() : [];
}

function fill(text: string, values?: Vars): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    if (!Object.hasOwn(values, name)) return placeholder;
    const value = values[name];
    return typeof value === 'number' ? localizeDigits(String(value)) : value;
  });
}

function lookup(key: string): Entry | undefined {
  if (locale === 'en') return undefined;
  const entry = Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
  if (entry === undefined) misses?.add(key);
  return entry;
}

/** Translates a fixed English text. */
export function t(text: string, values?: Vars): string {
  const entry = lookup(text);
  return fill(entry === undefined ? text : typeof entry === 'string' ? entry : entry.other, values);
}

/**
 * Marks an English text for translation without translating it now. Use it for text stored in constants or state
 * that is translated later with t(), so the dictionary checks can find it.
 */
export function msg<S extends string>(text: S): S {
  return text;
}

/**
 * Translates a counted text. English picks `one` for 1 and `other` otherwise. Arabic looks up `other` and
 * picks the plural form for n. `{n}` is filled with n unless `vars.n` is given (for example a formatted number).
 */
export function tp(count: number, one: string, other: string, values?: Vars): string {
  const valuesWithCount: Vars = { n: count, ...values };
  const entry = lookup(other);
  if (entry === undefined) return fill(count === 1 ? one : other, valuesWithCount);
  if (typeof entry === 'string') return fill(entry, valuesWithCount);
  let pluralRules = rules.get(locale);
  if (!pluralRules) rules.set(locale, (pluralRules = new Intl.PluralRules(locale)));
  const form = pluralRules.select(count) as keyof PluralEntry;
  return fill(entry[form] ?? entry.other, valuesWithCount);
}

/** The {placeholders} in a text, sorted, for checking that a translation keeps them all. */
export function placeholdersOf(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}
