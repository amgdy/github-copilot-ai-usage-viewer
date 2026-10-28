/**
 * Language support. English is the main language and the source text. Arabic text lives in ./ar, one file per
 * area of the app. Analysis code (src/lib) imports from './core' so it stays free of React.
 */
export { getDigitStyle, getLocale, isRtl, localizeDigits, LOCALES, msg, placeholdersOf, t, tp, usesArabicDigits, type DigitStyle, type Dict, type Entry, type Locale, type PluralEntry, type Vars } from './core';
export { initLocale, loadDictionary, setDigitStyle, setLocale, storedDigitStyle, storedLocale } from './load';
export { T, useDigitStyle, useLocale } from './react';
