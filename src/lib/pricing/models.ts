import type { Category, DataStore } from '../types';
import { CATEGORIES } from '../types';
import { cardKey, makeCardLookup, PRICE_CARD, VENDORS, type CardEntry, type Rates, type Vendor } from './card';

export interface ModelOverride {
  vendor?: Vendor;
  category?: Exclude<Category, 'Unknown'>;
  base?: Rates;
  long?: Rates | null;
  longThreshold?: number;
}

export type ModelOverrides = Record<string, ModelOverride>;

export interface ModelMeta {
  id: number;
  name: string;
  vendor: Vendor;
  category: Category;
  priced: boolean;
  base: Rates | null;
  long: Rates | null;
  longThreshold: number;
  fromCard: boolean;
  overridden: boolean;
  note?: string;
}

/**
 * Typed per-model rate tables (USD per token) used by hot aggregation loops.
 * Index with the store's model dictionary id.
 */
export interface ModelTable {
  meta: ModelMeta[];
  priced: Uint8Array;
  cat: Uint8Array; // index into CATEGORIES
  vendor: Uint8Array; // index into VENDORS
  rIn: Float64Array;
  rCr: Float64Array;
  rCw: Float64Array;
  rOut: Float64Array;
  hasLong: Uint8Array;
  longThr: Float64Array;
  lIn: Float64Array;
  lCr: Float64Array;
  lCw: Float64Array;
  lOut: Float64Array;
}

export function parseModelName(raw: string): { name: string; auto: boolean } {
  let s = raw.trim().replace(/\s+/g, ' ');
  let auto = false;
  // "Auto: Model" is the real format. A dash counts only with a space before it, so "auto-complete" stays a model name.
  const m = /^auto(?:\s*[:：]|\s+[\-–—])\s*(.*)$/i.exec(s);
  if (m) {
    auto = true;
    s = m[1].trim();
  } else if (/^auto$/i.test(s)) {
    auto = true;
  }
  return { name: s, auto };
}

export { cardKey };

export const lookupCard: (name: string) => CardEntry | undefined = makeCardLookup(PRICE_CARD);

export function inferVendor(name: string): Vendor {
  const n = name.toLowerCase();
  if (/(^|\b)(gpt|o\d|codex|chatgpt|openai)/.test(n)) return 'OpenAI';
  if (/claude|opus|sonnet|haiku|fable|anthropic/.test(n)) return 'Anthropic';
  if (/gemini|gemma|google/.test(n)) return 'Google';
  if (/grok|xai/.test(n)) return 'xAI';
  if (/kimi|moonshot/.test(n)) return 'Moonshot';
  if (/mai-|phi|microsoft/.test(n)) return 'Microsoft';
  return 'Other';
}

export function resolveModelMeta(id: number, name: string, overrides: ModelOverrides = {}): ModelMeta {
  const card = lookupCard(name);
  const ov = Object.hasOwn(overrides, name) ? overrides[name] : undefined;
  const base = ov?.base ?? card?.base ?? null;
  const long = ov?.long === null ? null : ov?.long ?? card?.long ?? null;
  const category: Category = ov?.category ?? card?.category ?? 'Unknown';
  return {
    id,
    name,
    vendor: ov?.vendor ?? card?.vendor ?? inferVendor(name),
    category,
    priced: base !== null,
    base,
    long,
    longThreshold: long ? ov?.longThreshold ?? card?.longThreshold ?? 272_000 : 0,
    fromCard: !!card,
    overridden: !!ov,
    note: card?.note,
  };
}

export function buildModelTable(store: Pick<DataStore, 'dicts'>, overrides: ModelOverrides = {}): ModelTable {
  const names = store.dicts.model.values;
  const n = names.length;
  const t: ModelTable = {
    meta: new Array(n),
    priced: new Uint8Array(n),
    cat: new Uint8Array(n),
    vendor: new Uint8Array(n),
    rIn: new Float64Array(n),
    rCr: new Float64Array(n),
    rCw: new Float64Array(n),
    rOut: new Float64Array(n),
    hasLong: new Uint8Array(n),
    longThr: new Float64Array(n),
    lIn: new Float64Array(n),
    lCr: new Float64Array(n),
    lCw: new Float64Array(n),
    lOut: new Float64Array(n),
  };
  for (let i = 0; i < n; i++) {
    const m = resolveModelMeta(i, names[i], overrides);
    t.meta[i] = m;
    t.cat[i] = CATEGORIES.indexOf(m.category);
    t.vendor[i] = VENDORS.indexOf(m.vendor);
    if (m.base) {
      t.priced[i] = 1;
      t.rIn[i] = m.base.input / 1e6;
      t.rCr[i] = m.base.cachedInput / 1e6;
      t.rCw[i] = m.base.cacheWrite / 1e6;
      t.rOut[i] = m.base.output / 1e6;
    }
    if (m.long) {
      t.hasLong[i] = 1;
      t.longThr[i] = m.longThreshold;
      t.lIn[i] = m.long.input / 1e6;
      t.lCr[i] = m.long.cachedInput / 1e6;
      t.lCw[i] = m.long.cacheWrite / 1e6;
      t.lOut[i] = m.long.output / 1e6;
    }
  }
  return t;
}

/** Default-tier list cost (USD) of a token mix on a priced model. */
export function listCost(t: ModelTable, m: number, input: number, cacheRead: number, cacheWrite: number, output: number): number {
  return input * t.rIn[m] + cacheRead * t.rCr[m] + cacheWrite * t.rCw[m] + output * t.rOut[m];
}

/** Long-tier list cost (USD) of a token mix; falls back to the default tier when no long tier exists. */
export function listCostLong(t: ModelTable, m: number, input: number, cacheRead: number, cacheWrite: number, output: number): number {
  if (!t.hasLong[m]) return listCost(t, m, input, cacheRead, cacheWrite, output);
  return input * t.lIn[m] + cacheRead * t.lCr[m] + cacheWrite * t.lCw[m] + output * t.lOut[m];
}
