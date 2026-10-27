import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { getLocale, subscribeLocale, t, type Locale } from './core';

/** The current language. Components that call t() re-render anyway, because the app remounts on a language change. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

/**
 * Translates a sentence that contains elements, such as a link: <T text="Read {link} first." values={{ link: <a>…</a> }} />.
 * Text values can go in `values` too. The translation may move the {placeholders} anywhere in the sentence.
 */
export function T({ text, values = {} }: { text: string; values?: Record<string, ReactNode> }) {
  const parts = t(text).split(/(\{\w+\})/);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^\{(\w+)\}$/.exec(p);
        if (m && Object.hasOwn(values, m[1])) return <Fragment key={i}>{values[m[1]]}</Fragment>;
        return p ? <Fragment key={i}>{p}</Fragment> : null;
      })}
    </>
  );
}
