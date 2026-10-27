/**
 * Language support. English is the main language and the source text. Arabic text lives in ./ar, one file per
 * area of the app. Analysis code (src/lib) imports from './core' so it stays free of React.
 */
export { getLocale, isRtl, LOCALES, msg, placeholdersOf, t, tp, type Dict, type Entry, type Locale, type PluralEntry, type Vars } from './core';
export { initLocale, loadDictionary, setLocale, storedLocale } from './load';
export { T, useLocale } from './react';
