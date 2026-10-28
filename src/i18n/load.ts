import { applyDigitStyle, applyLocale, getLocale, LOCALES, missedKeys, t, trackMisses, type DigitStyle, type Dict, type Locale } from './core';

/** Each area of the app keeps its Arabic text in its own file under ./ar. They load only when Arabic is chosen. */
const ARABIC = import.meta.glob<{ default: Dict }>('./ar/*.ts');

const STORAGE_KEY = 'ghcu.locale';
const DIGITS_KEY = 'ghcu.digits';

export async function loadDictionary(locale: Locale): Promise<Dict> {
  if (locale === 'en') return {};
  const arabicModules = await Promise.all(Object.values(ARABIC).map((load) => load()));
  return Object.assign({}, ...arabicModules.map((arabicModule) => arabicModule.default)) as Dict;
}

export function storedLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function applyDocument(locale: Locale): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = LOCALES.find((language) => language.id === locale)?.dir ?? 'ltr';
  document.title = t('GitHub Copilot Usage Lens');
}

/** Loads the dictionaries for a language, switches to it, and remembers the choice in this browser. */
export async function setLocale(locale: Locale): Promise<void> {
  const entries = await loadDictionary(locale);
  applyLocale(locale, entries);
  applyDocument(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage can be blocked; the choice then lasts for this visit only */
  }
}

export function storedDigitStyle(): DigitStyle {
  try {
    return localStorage.getItem(DIGITS_KEY) === 'latin' ? 'latin' : 'arabic';
  } catch {
    return 'arabic';
  }
}

/** Switches how Arabic shows digits and remembers the choice in this browser. */
export function setDigitStyle(style: DigitStyle): void {
  applyDigitStyle(style);
  try {
    localStorage.setItem(DIGITS_KEY, style);
  } catch {
    /* storage can be blocked; the choice then lasts for this visit only */
  }
}

/** Applies the remembered language before the first render, so Arabic users do not see English first. */
export async function initLocale(): Promise<void> {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    trackMisses(true);
    (window as unknown as Record<string, unknown>).__ghcuI18n = { missedKeys, getLocale };
  }
  applyDigitStyle(storedDigitStyle());
  const savedLocale = storedLocale();
  if (savedLocale !== 'en') await setLocale(savedLocale).catch((error: unknown) => {
    console.error('Could not load the saved language. Using English.', error);
    applyLocale('en', {});
    applyDocument('en');
  });
  else applyDocument('en');
}
