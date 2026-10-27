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
let dict: Dict = {};
const listeners = new Set<() => void>();
let misses: Set<string> | null = null;
const rules = new Map<Locale, Intl.PluralRules>();

export function getLocale(): Locale {
  return locale;
}

export function isRtl(): boolean {
  return locale === 'ar';
}

/** Switches the language. App code uses `setLocale` from ./load, which also loads the dictionaries. */
export function applyLocale(next: Locale, entries: Dict): void {
  locale = next;
  dict = next === 'en' ? {} : entries;
  for (const l of listeners) l();
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

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (Object.hasOwn(vars, k) ? String(vars[k]) : m));
}

function lookup(key: string): Entry | undefined {
  if (locale === 'en') return undefined;
  const e = Object.hasOwn(dict, key) ? dict[key] : undefined;
  if (e === undefined) misses?.add(key);
  return e;
}

/** Translates a fixed English text. */
export function t(text: string, vars?: Vars): string {
  const e = lookup(text);
  return fill(e === undefined ? text : typeof e === 'string' ? e : e.other, vars);
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
export function tp(n: number, one: string, other: string, vars?: Vars): string {
  const v: Vars = { n, ...vars };
  const e = lookup(other);
  if (e === undefined) return fill(n === 1 ? one : other, v);
  if (typeof e === 'string') return fill(e, v);
  let r = rules.get(locale);
  if (!r) rules.set(locale, (r = new Intl.PluralRules(locale)));
  const form = r.select(n) as keyof PluralEntry;
  return fill(e[form] ?? e.other, v);
}

/** The {placeholders} in a text, sorted, for checking that a translation keeps them all. */
export function placeholdersOf(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
