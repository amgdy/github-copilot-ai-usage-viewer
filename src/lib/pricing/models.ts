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
  let name = raw.trim().replace(/\s+/g, ' ');
  let auto = false;
  // "Auto: Model" is the real format. A dash counts only with a space before it, so "auto-complete" stays a model name.
  const match = /^auto(?:\s*[:：]|\s+[\-–—])\s*(.*)$/i.exec(name);
  if (match) {
    auto = true;
    name = match[1].trim();
  } else if (/^auto$/i.test(name)) {
    auto = true;
  }
  return { name: name, auto };
}

export { cardKey };

export const lookupCard: (name: string) => CardEntry | undefined = makeCardLookup(PRICE_CARD);

export function inferVendor(name: string): Vendor {
  const lowerName = name.toLowerCase();
  if (/(^|\b)(gpt|o\d|codex|chatgpt|openai)/.test(lowerName)) return 'OpenAI';
  if (/claude|opus|sonnet|haiku|fable|anthropic/.test(lowerName)) return 'Anthropic';
  if (/gemini|gemma|google/.test(lowerName)) return 'Google';
  if (/grok|xai/.test(lowerName)) return 'xAI';
  if (/kimi|moonshot/.test(lowerName)) return 'Moonshot';
  if (/mai-|phi|microsoft/.test(lowerName)) return 'Microsoft';
  return 'Other';
}

export function resolveModelMeta(id: number, name: string, overrides: ModelOverrides = {}): ModelMeta {
  const card = lookupCard(name);
  const modelOverride = Object.hasOwn(overrides, name) ? overrides[name] : undefined;
  const base = modelOverride?.base ?? card?.base ?? null;
  const long = modelOverride?.long === null ? null : modelOverride?.long ?? card?.long ?? null;
  const category: Category = modelOverride?.category ?? card?.category ?? 'Unknown';
  return {
    id,
    name,
    vendor: modelOverride?.vendor ?? card?.vendor ?? inferVendor(name),
    category,
    priced: base !== null,
    base,
    long,
    longThreshold: long ? modelOverride?.longThreshold ?? card?.longThreshold ?? 272_000 : 0,
    fromCard: !!card,
    overridden: !!modelOverride,
    note: card?.note,
  };
}

export function buildModelTable(store: Pick<DataStore, 'dicts'>, overrides: ModelOverrides = {}): ModelTable {
  const names = store.dicts.model.values;
  const modelCount = names.length;
  const table: ModelTable = {
    meta: new Array(modelCount),
    priced: new Uint8Array(modelCount),
    cat: new Uint8Array(modelCount),
    vendor: new Uint8Array(modelCount),
    rIn: new Float64Array(modelCount),
    rCr: new Float64Array(modelCount),
    rCw: new Float64Array(modelCount),
    rOut: new Float64Array(modelCount),
    hasLong: new Uint8Array(modelCount),
    longThr: new Float64Array(modelCount),
    lIn: new Float64Array(modelCount),
    lCr: new Float64Array(modelCount),
    lCw: new Float64Array(modelCount),
    lOut: new Float64Array(modelCount),
  };
  for (let i = 0; i < modelCount; i++) {
    const meta = resolveModelMeta(i, names[i], overrides);
    table.meta[i] = meta;
    table.cat[i] = CATEGORIES.indexOf(meta.category);
    table.vendor[i] = VENDORS.indexOf(meta.vendor);
    if (meta.base) {
      table.priced[i] = 1;
      table.rIn[i] = meta.base.input / 1e6;
      table.rCr[i] = meta.base.cachedInput / 1e6;
      table.rCw[i] = meta.base.cacheWrite / 1e6;
      table.rOut[i] = meta.base.output / 1e6;
    }
    if (meta.long) {
      table.hasLong[i] = 1;
      table.longThr[i] = meta.longThreshold;
      table.lIn[i] = meta.long.input / 1e6;
      table.lCr[i] = meta.long.cachedInput / 1e6;
      table.lCw[i] = meta.long.cacheWrite / 1e6;
      table.lOut[i] = meta.long.output / 1e6;
    }
  }
  return table;
}

/** Default-tier list cost (USD) of a token mix on a priced model. */
export function listCost(table: ModelTable, modelId: number, input: number, cacheRead: number, cacheWrite: number, output: number): number {
  return input * table.rIn[modelId] + cacheRead * table.rCr[modelId] + cacheWrite * table.rCw[modelId] + output * table.rOut[modelId];
}

/** Long-tier list cost (USD) of a token mix; falls back to the default tier when no long tier exists. */
export function listCostLong(table: ModelTable, modelId: number, input: number, cacheRead: number, cacheWrite: number, output: number): number {
  if (!table.hasLong[modelId]) return listCost(table, modelId, input, cacheRead, cacheWrite, output);
  return input * table.lIn[modelId] + cacheRead * table.lCr[modelId] + cacheWrite * table.lCw[modelId] + output * table.lOut[modelId];
}
