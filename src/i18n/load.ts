import { applyLocale, getLocale, LOCALES, missedKeys, t, trackMisses, type Dict, type Locale } from './core';

/** Each area of the app keeps its Arabic text in its own file under ./ar. They load only when Arabic is chosen. */
const ARABIC = import.meta.glob<{ default: Dict }>('./ar/*.ts');

const STORAGE_KEY = 'ghcu.locale';

export async function loadDictionary(l: Locale): Promise<Dict> {
  if (l === 'en') return {};
  const mods = await Promise.all(Object.values(ARABIC).map((load) => load()));
  return Object.assign({}, ...mods.map((m) => m.default)) as Dict;
}

export function storedLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function applyDocument(l: Locale): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.lang = l;
  el.dir = LOCALES.find((x) => x.id === l)?.dir ?? 'ltr';
  document.title = t('GitHub Copilot AI Usage Viewer');
}

/** Loads the dictionaries for a language, switches to it, and remembers the choice in this browser. */
export async function setLocale(l: Locale): Promise<void> {
  const entries = await loadDictionary(l);
  applyLocale(l, entries);
  applyDocument(l);
  try {
    localStorage.setItem(STORAGE_KEY, l);
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
  const l = storedLocale();
  if (l !== 'en') await setLocale(l).catch((error: unknown) => {
    console.error('Could not load the saved language. Using English.', error);
    applyLocale('en', {});
    applyDocument('en');
  });
  else applyDocument('en');
}
