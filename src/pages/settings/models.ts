import { BLANK, type Category, type DataStore } from '../../lib/types';
import type { Rates } from '../../lib/pricing/card';
import { buildModelTable, lookupCard, type ModelMeta, type ModelOverride, type ModelOverrides } from '../../lib/pricing/models';
import { fmtInt } from '../../lib/utils/format';
import { msg, t } from '../../i18n';
import { parseNumber } from './numbers';

export type Tier = Exclude<Category, 'Unknown'>;
export const TIERS: Tier[] = ['Powerful', 'Versatile', 'Lightweight'];

/** Highest price accepted per 1M tokens. A typo guard, not a real price ceiling. */
export const MAX_RATE = 10_000;

export type RateKey = keyof Rates;

/** Labels and hints are English; render them with t(). */
export const RATE_FIELDS: { key: RateKey; label: string; optional?: boolean; hint?: string }[] = [
  { key: 'input', label: msg('Input') },
  { key: 'cachedInput', label: msg('Cache read'), hint: msg('Use the input price if there is no cache discount.') },
  { key: 'cacheWrite', label: msg('Cache write'), optional: true, hint: msg('Leave empty if there is no separate charge.') },
  { key: 'output', label: msg('Output') },
];

/** A change to one model's override. A key set to undefined goes back to the built-in value. */
export type OverrideChange = { [K in keyof ModelOverride]?: ModelOverride[K] | undefined };

export interface ModelRowData {
  /** Exact name in the report, which is also the key in the overrides. */
  name: string;
  meta: ModelMeta;
  gross: number;
  customPrice: boolean;
  /** Has no price on the price card or no tier, so some estimates skip it. */
  attention: boolean;
  /** Rows without a model name, or a name that cannot be used as an override key. */
  readOnly: boolean;
}

export interface ModelUsage {
  gross: Float64Array;
  rows: Int32Array;
  total: number;
}

/** One pass over the rows: usage and row count per model. */
export function modelUsage(store: DataStore): ModelUsage {
  const size = store.dicts.model.values.length;
  const gross = new Float64Array(size);
  const rows = new Int32Array(size);
  const model = store.model;
  const g = store.gross;
  let total = 0;
  for (let i = 0; i < store.n; i++) {
    gross[model[i]] += g[i];
    rows[model[i]]++;
    total += g[i];
  }
  return { gross, rows, total };
}

const isReadOnly = (name: string) => name === BLANK || name === '__proto__';

function ownOverride(all: ModelOverrides, name: string): ModelOverride | undefined {
  return Object.hasOwn(all, name) ? all[name] : undefined;
}

/** The table of models in the report, built exactly as the analysis builds it, with usage added. */
export function modelRows(store: DataStore, usage: ModelUsage, overrides: ModelOverrides): ModelRowData[] {
  const out: ModelRowData[] = [];
  buildModelTable(store, overrides).meta.forEach((meta, id) => {
    if (usage.rows[id] === 0) return;
    const gross = usage.gross[id];
    const readOnly = isReadOnly(meta.name);
    out.push({
      name: meta.name,
      meta,
      gross,
      customPrice: !!ownOverride(overrides, meta.name)?.base,
      attention: !readOnly && gross > 0 && (!meta.priced || meta.category === 'Unknown'),
      readOnly,
    });
  });
  // Models that need attention come first, then the biggest users of credits.
  out.sort((a, b) => Number(b.attention) - Number(a.attention) || b.gross - a.gross || a.name.localeCompare(b.name));
  return out;
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

export const sameRates = (a: Rates, b: Rates) => close(a.input, b.input) && close(a.cachedInput, b.cachedInput) && close(a.cacheWrite, b.cacheWrite) && close(a.output, b.output);

/** Applies a change to one model and drops everything that equals the built-in value, so the stored overrides stay minimal. */
export function withOverride(all: ModelOverrides, name: string, change: OverrideChange): ModelOverrides {
  const card = lookupCard(name);
  const next: ModelOverride = { ...ownOverride(all, name), ...change };
  if (next.category === undefined || next.category === card?.category) delete next.category;
  if (next.base === undefined || (card && sameRates(next.base, card.base))) delete next.base;
  if (next.vendor === undefined) delete next.vendor;
  if (next.long === undefined) delete next.long;
  if (next.longThreshold === undefined) delete next.longThreshold;
  const out = { ...all };
  if (Object.keys(next).length === 0) delete out[name];
  else out[name] = next;
  return out;
}

export function withoutOverride(all: ModelOverrides, name: string): ModelOverrides {
  const out = { ...all };
  delete out[name];
  return out;
}

export const usdRate = (v: number) => `$${Number(v.toFixed(4))}`;

/** "Input $1.75, cache read $0.175, output $14", in the current language. */
export function ratesText(r: Rates): string {
  const parts = [t('Input {price}', { price: usdRate(r.input) }), t('cache read {price}', { price: usdRate(r.cachedInput) })];
  if (r.cacheWrite > 0) parts.push(t('cache write {price}', { price: usdRate(r.cacheWrite) }));
  parts.push(t('output {price}', { price: usdRate(r.output) }));
  return parts.join(t(', '));
}

export interface RatesParse {
  rates: Rates | null;
  errors: Partial<Record<RateKey, string>>;
  /** A problem with the set as a whole. */
  formError: string | null;
}

/** Validates the price form. Input, cached input and output are required. Cache write may be empty. */
export function parseRates(values: Record<RateKey, string>): RatesParse {
  const errors: Partial<Record<RateKey, string>> = {};
  const rates: Rates = { input: 0, cachedInput: 0, cacheWrite: 0, output: 0 };
  for (const f of RATE_FIELDS) {
    const raw = values[f.key].trim();
    if (raw === '') {
      if (!f.optional) errors[f.key] = t('Required.');
      continue;
    }
    const n = raw.includes('%') ? null : parseNumber(raw);
    if (n === null) errors[f.key] = t('Enter a number.');
    else if (n < 0) errors[f.key] = t('Must be 0 or more.');
    else if (n > MAX_RATE) errors[f.key] = t('Must be at most {value}.', { value: fmtInt(MAX_RATE) });
    else rates[f.key] = Number(n.toFixed(6));
  }
  if (Object.keys(errors).length > 0) return { rates: null, errors, formError: null };
  if (rates.input <= 0 && rates.output <= 0) return { rates: null, errors, formError: t('Enter a price above 0 for input or output.') };
  return { rates, errors, formError: null };
}
