import { msg } from '../../i18n/core.ts';
import type { Category } from '../types';

export type Vendor = 'OpenAI' | 'Anthropic' | 'Google' | 'Microsoft' | 'xAI' | 'Moonshot' | 'Other';
export const VENDORS: Vendor[] = ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'xAI', 'Moonshot', 'Other'];

/** USD per 1M tokens. `cacheWrite` of 0 means the model has no separate cache-write charge. */
export interface Rates {
  input: number;
  cachedInput: number;
  cacheWrite: number;
  output: number;
}

export interface CardEntry {
  name: string;
  vendor: Vendor;
  category: Exclude<Category, 'Unknown'>;
  base: Rates;
  /** Rates applied to requests whose prompt exceeds `longThreshold` tokens. */
  long?: Rates;
  longThreshold?: number;
  /** English note marked with msg(). Show it with t(). */
  note?: string;
}

/** The day the built-in card was copied from GitHub Docs (ISO date). */
export const CARD_AS_OF = '2026-10-27';
/** The GitHub Docs page the card comes from. */
export const CARD_SOURCE = 'https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing';
/** The same page as Markdown. GitHub Docs allows any site to read it, so the app can compare the card with the live page on request. */
export const CARD_SOURCE_MARKDOWN =
  'https://docs.github.com/api/article/body?pathname=/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing';

const rates = (input: number, cachedInput: number, cacheWrite: number, output: number): Rates => ({
  input,
  cachedInput,
  cacheWrite,
  output,
});

/** Built-in GitHub Copilot model price card (USD per 1M tokens). Settings can override a model's rates or category without changing this card. */
export const PRICE_CARD: CardEntry[] = [
  // OpenAI
  { name: 'GPT-5.3-Codex', vendor: 'OpenAI', category: 'Powerful', base: rates(1.75, 0.175, 0, 14) },
  { name: 'GPT-5.4 nano', vendor: 'OpenAI', category: 'Lightweight', base: rates(0.2, 0.02, 0, 1.25) },
  { name: 'GPT-5.6 Luna', vendor: 'OpenAI', category: 'Lightweight', base: rates(0.2, 0.02, 0.25, 1.2), long: rates(0.4, 0.04, 0.5, 1.8), longThreshold: 200_000 },
  { name: 'GPT-5.6 Sol', vendor: 'OpenAI', category: 'Powerful', base: rates(4, 0.4, 5, 20), long: rates(8, 0.8, 10, 30), longThreshold: 272_000 },
  { name: 'GPT-5.6 Terra', vendor: 'OpenAI', category: 'Versatile', base: rates(2, 0.2, 2.5, 12), long: rates(4, 0.4, 5, 18), longThreshold: 272_000 },
  { name: 'GPT-6 Astra', vendor: 'OpenAI', category: 'Powerful', base: rates(10, 1, 12.5, 50), long: rates(20, 2, 25, 75), longThreshold: 272_000 },
  { name: 'GPT-6 Luna', vendor: 'OpenAI', category: 'Lightweight', base: rates(0.1, 0.01, 0.125, 0.5), long: rates(0.2, 0.02, 0.25, 0.75), longThreshold: 272_000 },
  { name: 'GPT-6 Sol', vendor: 'OpenAI', category: 'Powerful', base: rates(2, 0.2, 2.5, 10), long: rates(4, 0.4, 5, 15), longThreshold: 272_000 },
  { name: 'GPT-6.1 Sol', vendor: 'OpenAI', category: 'Powerful', base: rates(2, 0.1, 2.5, 10), long: rates(4, 0.2, 5, 15), longThreshold: 272_000 },
  { name: 'GPT-6.1 Terra', vendor: 'OpenAI', category: 'Versatile', base: rates(1, 0.05, 1.25, 5), long: rates(2, 0.1, 2.5, 7.5), longThreshold: 272_000 },
  // Anthropic
  { name: 'Claude Haiku 4.5', vendor: 'Anthropic', category: 'Versatile', base: rates(1, 0.1, 1.25, 5) },
  { name: 'Claude Haiku 5.5', vendor: 'Anthropic', category: 'Lightweight', base: rates(0.1, 0.01, 0.125, 0.5), long: rates(0.5, 0.05, 0.625, 2.5), longThreshold: 100_000 },
  { name: 'Claude Sonnet 4', vendor: 'Anthropic', category: 'Versatile', base: rates(3, 0.3, 3.75, 15) },
  { name: 'Claude Sonnet 4.6', vendor: 'Anthropic', category: 'Versatile', base: rates(3, 0.3, 3.75, 15) },
  { name: 'Claude Sonnet 5', vendor: 'Anthropic', category: 'Versatile', base: rates(2, 0.2, 2.5, 10) },
  { name: 'Claude Sonnet 5.5', vendor: 'Anthropic', category: 'Versatile', base: rates(2, 0.1, 2.5, 10) },
  { name: 'Claude Opus 4.8', vendor: 'Anthropic', category: 'Powerful', base: rates(5, 0.5, 6.25, 25) },
  { name: 'Claude Opus 4.8 (fast mode) (preview)', vendor: 'Anthropic', category: 'Powerful', base: rates(10, 1, 12.5, 50), note: msg('Preview') },
  { name: 'Claude Opus 5', vendor: 'Anthropic', category: 'Powerful', base: rates(5, 0.5, 6.25, 25) },
  { name: 'Claude Opus 5.5', vendor: 'Anthropic', category: 'Powerful', base: rates(4, 0.2, 5, 20) },
  { name: 'Claude Fable 5', vendor: 'Anthropic', category: 'Powerful', base: rates(10, 1, 12.5, 50) },
  { name: 'Claude Fable 5.1', vendor: 'Anthropic', category: 'Powerful', base: rates(10, 0.25, 12.5, 50) },
  // Google
  { name: 'Gemini 3.8 Flash', vendor: 'Google', category: 'Versatile', base: rates(0.75, 0.075, 0, 3.75), note: msg('Promotional price until 2026-12-31') },
  { name: 'Gemini 4 Argon', vendor: 'Google', category: 'Powerful', base: rates(2, 0.1, 0, 10), note: msg('Promotional price until 2026-12-01') },
  // Microsoft
  { name: 'MAI-Code-1.1-Flash', vendor: 'Microsoft', category: 'Lightweight', base: rates(0.2, 0.02, 0, 1.2) },
  // xAI
  { name: 'Grok 4.5', vendor: 'xAI', category: 'Versatile', base: rates(2, 0.5, 0, 6), long: rates(4, 1, 0, 12), longThreshold: 200_000 },
  { name: 'Grok 4.6', vendor: 'xAI', category: 'Versatile', base: rates(2, 0.5, 0, 6), long: rates(4, 1, 0, 12), longThreshold: 200_000 },
  { name: 'Grok 4.7', vendor: 'xAI', category: 'Versatile', base: rates(2, 0.5, 0, 6), long: rates(4, 1, 0, 12), longThreshold: 200_000 },
  // Moonshot
  { name: 'Kimi K3', vendor: 'Moonshot', category: 'Powerful', base: rates(3, 0.3, 0, 15) },
];

/** Lookup key for a model name: lower case, vendor words and spaces removed ("Claude Opus 4.8" and "opus 4.8" match). */
export function cardKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(claude|anthropic|openai|google|github|copilot)\b/g, '')
    .replace(/[^a-z0-9.()]+/g, '');
}

/**
 * Builds a name lookup over a price card. A card name ending in "(preview)" also matches without it, and a
 * report name with extra trailing qualifiers such as "(preview)" still finds its card entry. "fast mode"
 * changes the price, so it is never dropped.
 */
export function makeCardLookup<T extends { name: string }>(entries: readonly T[]): (name: string) => T | undefined {
  const index = new Map<string, T>();
  for (const entry of entries) index.set(cardKey(entry.name), entry);
  for (const entry of entries) {
    const keyWithoutPreview = cardKey(entry.name).replace(/\(preview\)$/, '');
    if (!index.has(keyWithoutPreview)) index.set(keyWithoutPreview, entry);
  }
  return (name: string) => {
    let key = cardKey(name);
    const hit = index.get(key);
    if (hit) return hit;
    for (;;) {
      const match = /\(([^)]*)\)$/.exec(key);
      if (!match || match[1].includes('fast')) return undefined;
      key = key.slice(0, match.index);
      const found = index.get(key);
      if (found) return found;
    }
  };
}

/** Default Auto model selection discount on paid plans (GitHub Docs). Used for plans whose Auto discount cannot be measured in the report. */
export const AUTO_DISCOUNT = 0.1;
