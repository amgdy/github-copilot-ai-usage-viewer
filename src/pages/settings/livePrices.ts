import { msg } from '../../i18n';
import { compareWithCard, fetchLivePriceCard, liveOverrides, type LiveModel, type PriceDifference, type PriceField } from '../../lib/pricing/docsParser';
import type { ModelOverrides } from '../../lib/pricing/models';

/** English names of the price fields. Render them with t(). */
export const FIELD_LABEL: Record<PriceField, string> = {
  category: msg('Tier'),
  input: msg('Input'),
  cachedInput: msg('Cache read'),
  cacheWrite: msg('Cache write'),
  output: msg('Output'),
  longInput: msg('Long-context input'),
  longCachedInput: msg('Long-context cache read'),
  longCacheWrite: msg('Long-context cache write'),
  longOutput: msg('Long-context output'),
  longThreshold: msg('Long-context threshold'),
};

export interface LiveCheck {
  /** Every model whose live price differs from the price card, changed first. */
  diffs: PriceDifference[];
  changed: number;
  added: number;
  missing: number;
  /** Rows of the GitHub Docs page that could not be read. */
  warnings: number;
  live: LiveModel[];
}

/** Sums up the differences between the live GitHub Docs prices and the price card. */
export function summarizeLive(live: readonly LiveModel[], warnings = 0): LiveCheck {
  const diffs = compareWithCard(live);
  const count = (kind: PriceDifference['kind']) => diffs.filter((difference) => difference.kind === kind).length;
  return { diffs, changed: count('changed'), added: count('new'), missing: count('missing'), warnings, live: [...live] };
}

/** Downloads the GitHub Docs price page and compares it with the price card. Throws when the page cannot be read. */
export async function checkLivePrices(signal?: AbortSignal): Promise<LiveCheck> {
  const card = await fetchLivePriceCard(signal);
  return summarizeLive(card.models, card.warnings.length);
}

/**
 * The price changes to save so the models in the report use the live prices.
 * `count` is the number of models whose saved change is new or different.
 */
export function applyLivePrices(reportModels: readonly string[], live: readonly LiveModel[], existing: ModelOverrides): { overrides: ModelOverrides; count: number } {
  const overrides = liveOverrides(reportModels, live, existing);
  let count = 0;
  for (const name of Object.keys(overrides)) if (JSON.stringify(overrides[name]) !== JSON.stringify(existing[name])) count++;
  return { overrides, count };
}
