import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { getDigitStyle, getLocale, subscribeLocale, t, type DigitStyle, type Locale } from './core';

/** The current language. Components that call t() re-render anyway, because the app remounts on a language change. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

/** How Arabic shows digits right now. The app remounts when it changes, like it does for the language. */
export function useDigitStyle(): DigitStyle {
  return useSyncExternalStore(subscribeLocale, getDigitStyle, getDigitStyle);
}

/**
 * Translates a sentence that contains elements, such as a link: <T text="Read {link} first." values={{ link: <a>…</a> }} />.
 * Text values can go in `values` too. The translation may move the {placeholders} anywhere in the sentence.
 */
export function T({ text, values = {} }: { text: string; values?: Record<string, ReactNode> }) {
  const parts = t(text).split(/(\{\w+\})/);
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\{(\w+)\}$/.exec(part);
        if (match && Object.hasOwn(values, match[1])) return <Fragment key={index}>{values[match[1]]}</Fragment>;
        return part ? <Fragment key={index}>{part}</Fragment> : null;
      })}
    </>
  );
}
