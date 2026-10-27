import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/lib/analytics/settings';
import { AUTO_DISCOUNT, CARD_AS_OF, CARD_SOURCE, PRICE_CARD, VENDORS, type CardEntry, type Rates } from '../src/lib/pricing/card';
import { buildModelTable, cardKey, inferVendor, listCost, listCostLong, lookupCard, resolveModelMeta } from '../src/lib/pricing/models';
import { CATEGORIES, type DataStore } from '../src/lib/types';
import { mulberry32 } from './helpers';
import { FIXTURE_A, loadFixtureStore } from './fixtures';

const byName = (name: string): CardEntry => {
  const cardEntry = PRICE_CARD.find((candidate) => candidate.name === name);
  if (!cardEntry) throw new Error(`not on the card: ${name}`);
  return cardEntry;
};

const RATE_KEYS = ['input', 'cachedInput', 'cacheWrite', 'output'] as const;

const storeOf = (names: string[]): Pick<DataStore, 'dicts'> =>
  ({ dicts: { model: { values: names, index: new Map(names.map((name, index) => [name, index])) } } }) as unknown as Pick<DataStore, 'dicts'>;

describe('PRICE_CARD', () => {
  it('has unique model names and unique lookup keys', () => {
    expect(new Set(PRICE_CARD.map((cardEntry) => cardEntry.name)).size).toBe(PRICE_CARD.length);
    expect(new Set(PRICE_CARD.map((cardEntry) => cardKey(cardEntry.name))).size).toBe(PRICE_CARD.length);
  });

  it('uses known vendors and categories, and the vendor agrees with the name-based inference', () => {
    const categories = CATEGORIES.filter((category) => category !== 'Unknown');
    for (const cardEntry of PRICE_CARD) {
      expect(VENDORS, cardEntry.name).toContain(cardEntry.vendor);
      expect(categories, cardEntry.name).toContain(cardEntry.category);
      expect(inferVendor(cardEntry.name), cardEntry.name).toBe(cardEntry.vendor);
    }
  });

  it('has finite, ordered base rates: cached < input < output, and a cache write that is free or at least the input rate', () => {
    for (const cardEntry of PRICE_CARD) {
      for (const rateKey of RATE_KEYS) {
        expect(Number.isFinite(cardEntry.base[rateKey]), `${cardEntry.name}.${rateKey}`).toBe(true);
        expect(cardEntry.base[rateKey], `${cardEntry.name}.${rateKey}`).toBeGreaterThanOrEqual(0);
      }
      expect(cardEntry.base.cachedInput, cardEntry.name).toBeGreaterThan(0);
      expect(cardEntry.base.cachedInput, cardEntry.name).toBeLessThan(cardEntry.base.input);
      expect(cardEntry.base.output, cardEntry.name).toBeGreaterThan(cardEntry.base.input);
      if (cardEntry.base.cacheWrite !== 0) expect(cardEntry.base.cacheWrite, cardEntry.name).toBeGreaterThanOrEqual(cardEntry.base.input);
    }
  });

  it('has a long tier only together with its threshold, and long rates never below the base rates', () => {
    for (const cardEntry of PRICE_CARD) {
      if (!cardEntry.long) {
        expect(cardEntry.longThreshold, cardEntry.name).toBeUndefined();
        continue;
      }
      expect(Number.isInteger(cardEntry.longThreshold) && (cardEntry.longThreshold ?? 0) > 0, `${cardEntry.name} threshold`).toBe(true);
      for (const rateKey of RATE_KEYS) expect(cardEntry.long[rateKey], `${cardEntry.name}.${rateKey}`).toBeGreaterThanOrEqual(cardEntry.base[rateKey]);
      expect(cardEntry.long.cacheWrite === 0, `${cardEntry.name}: cache write is free in both tiers or in neither`).toBe(cardEntry.base.cacheWrite === 0);
    }
  });

  it('says where and when the card was taken from; notes are never empty', () => {
    expect(CARD_SOURCE).toMatch(/^https:\/\/docs\.github\.com\//);
    expect(CARD_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const cardEntry of PRICE_CARD) if (cardEntry.note !== undefined) expect(cardEntry.note.trim().length, cardEntry.name).toBeGreaterThan(0);
  });

  it('uses the documented Auto discount as the default for the simulator', () => {
    expect(AUTO_DISCOUNT).toBe(0.1);
    expect(DEFAULT_SETTINGS.autoDiscount).toBe(AUTO_DISCOUNT);
  });
});

describe('cardKey', () => {
  it('ignores case, spaces, hyphens and vendor words', () => {
    expect(cardKey('Claude Opus 4.8')).toBe('opus4.8');
    expect(cardKey('claude-opus-4.8')).toBe('opus4.8');
    expect(cardKey('OPUS 4.8')).toBe('opus4.8');
    expect(cardKey('Anthropic Claude Opus 4.8')).toBe('opus4.8');
    expect(cardKey('GPT-5.6 Terra')).toBe('gpt5.6terra');
    expect(cardKey('OpenAI GPT 5.6 Terra')).toBe('gpt5.6terra');
    expect(cardKey('Claude Opus 4.8 (fast mode) (preview)')).toBe('opus4.8(fastmode)(preview)');
    expect(cardKey('')).toBe('');
  });
});

describe('lookupCard', () => {
  it('finds every card entry by its own name, in other cases and with hyphens instead of spaces', () => {
    for (const cardEntry of PRICE_CARD) {
      expect(lookupCard(cardEntry.name), cardEntry.name).toBe(cardEntry);
      expect(lookupCard(cardEntry.name.toUpperCase()), cardEntry.name).toBe(cardEntry);
      expect(lookupCard(cardEntry.name.toLowerCase()), cardEntry.name).toBe(cardEntry);
      expect(lookupCard(cardEntry.name.replace(/ /g, '-')), cardEntry.name).toBe(cardEntry);
      expect(lookupCard(`  ${cardEntry.name.replace(/ /g, '  ')} `), cardEntry.name).toBe(cardEntry);
    }
  });

  it('tolerates a trailing qualifier that is not part of the card name', () => {
    expect(lookupCard('Claude Opus 4.8 (preview)')).toBe(byName('Claude Opus 4.8'));
    expect(lookupCard('GPT-5.6 Sol (beta)')).toBe(byName('GPT-5.6 Sol'));
    expect(lookupCard('GPT-5.6 Sol (beta) (preview)')).toBe(byName('GPT-5.6 Sol'));
  });

  it('knows the fast-mode variant, and never prices a fast-mode name as the regular model', () => {
    const fast = byName('Claude Opus 4.8 (fast mode) (preview)');
    expect(lookupCard('Claude Opus 4.8 (fast mode)')).toBe(fast);
    expect(lookupCard('Claude Opus 4.8 (fast mode) (beta)')).toBe(fast);
    expect(lookupCard('Claude Opus 4.8 (fast)')).toBeUndefined();
    expect(lookupCard('Claude Opus 4.8 (fast) (preview)')).toBeUndefined();
    expect(lookupCard('Claude Opus 4.8')).not.toBe(fast);
    expect(fast.base.input).toBeGreaterThan(byName('Claude Opus 4.8').base.input);
  });

  it('returns undefined for unknown, empty or partial names', () => {
    for (const name of ['', ' ', '()', 'Llama 3', 'GPT-4', 'Auto', 'gpt-5.6', 'Claude Opus', 'Claude Opus 4.8 Turbo', 'Opus 4']) {
      expect(lookupCard(name), JSON.stringify(name)).toBeUndefined();
    }
  });
});

describe('inferVendor', () => {
  it.each([
    ['gpt-4o', 'OpenAI'],
    ['o3-mini', 'OpenAI'],
    ['codex-mini', 'OpenAI'],
    ['Claude 3.7 Sonnet', 'Anthropic'],
    ['Fable 9', 'Anthropic'],
    ['Gemini 3 Pro', 'Google'],
    ['gemma-3', 'Google'],
    ['Grok 5', 'xAI'],
    ['Kimi K9', 'Moonshot'],
    ['MAI-X-2', 'Microsoft'],
    ['Phi-4', 'Microsoft'],
    ['Llama 4', 'Other'],
    ['Mystery', 'Other'],
    ['', 'Other'],
  ])('%j -> %s', (name, vendor) => {
    expect(inferVendor(name)).toBe(vendor);
  });
});

describe('resolveModelMeta', () => {
  const rates: Rates = { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 5 };

  it('takes everything from the card for a known model', () => {
    const cardEntry = byName('GPT-6 Astra');
    const meta = resolveModelMeta(3, 'GPT-6 Astra');
    expect(meta).toMatchObject({ id: 3, name: 'GPT-6 Astra', vendor: 'OpenAI', category: 'Powerful', priced: true, fromCard: true, overridden: false, longThreshold: 272_000 });
    expect(meta.base).toEqual(cardEntry.base);
    expect(meta.long).toEqual(cardEntry.long);
    expect(resolveModelMeta(0, 'Gemini 3.8 Flash').note).toBe(byName('Gemini 3.8 Flash').note);
  });

  it('has no long tier and a zero threshold for a model without one', () => {
    expect(resolveModelMeta(0, 'Claude Opus 5')).toMatchObject({ long: null, longThreshold: 0, priced: true });
  });

  it('marks a model that is not on the card as unpriced and Unknown, with a vendor guessed from the name', () => {
    expect(resolveModelMeta(1, 'Llama 4')).toMatchObject({ vendor: 'Other', category: 'Unknown', priced: false, base: null, long: null, longThreshold: 0, fromCard: false, overridden: false });
    expect(resolveModelMeta(1, 'Grok 9')).toMatchObject({ vendor: 'xAI', priced: false });
    expect(resolveModelMeta(0, '')).toMatchObject({ vendor: 'Other', category: 'Unknown', priced: false });
  });

  it('lets an override price a model the card does not know', () => {
    const meta = resolveModelMeta(2, 'Llama 4', { 'Llama 4': { base: rates, category: 'Versatile', vendor: 'Other' } });
    expect(meta).toMatchObject({ priced: true, overridden: true, fromCard: false, category: 'Versatile', long: null, longThreshold: 0 });
    expect(meta.base).toEqual(rates);
  });

  it('lets an override replace the rates of a card model while keeping its long tier', () => {
    const cardEntry = byName('GPT-6 Astra');
    const meta = resolveModelMeta(0, 'GPT-6 Astra', { 'GPT-6 Astra': { base: rates } });
    expect(meta.base).toEqual(rates);
    expect(meta.long).toEqual(cardEntry.long);
    expect(meta).toMatchObject({ overridden: true, fromCard: true, longThreshold: 272_000 });
  });

  it('lets an override drop the long tier (null), change its threshold, or supply one with the default threshold', () => {
    expect(resolveModelMeta(0, 'GPT-6 Astra', { 'GPT-6 Astra': { long: null } })).toMatchObject({ long: null, longThreshold: 0, overridden: true });
    expect(resolveModelMeta(0, 'GPT-6 Astra', { 'GPT-6 Astra': { longThreshold: 128_000 } }).longThreshold).toBe(128_000);
    expect(resolveModelMeta(0, 'Llama 4', { 'Llama 4': { base: rates, long: rates } }).longThreshold).toBe(272_000);
    expect(resolveModelMeta(0, 'Llama 4', { 'Llama 4': { base: rates, long: rates, longThreshold: 50_000 } }).longThreshold).toBe(50_000);
  });

  it('ignores an override stored under another name', () => {
    const meta = resolveModelMeta(0, 'GPT-6 Astra', { 'Some other model': { base: rates } });
    expect(meta.overridden).toBe(false);
    expect(meta.base).toEqual(byName('GPT-6 Astra').base);
  });

  it('does not take a model name such as "constructor" or "__proto__" for an override', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf']) {
      const meta = resolveModelMeta(0, name, {});
      expect(meta, name).toMatchObject({ overridden: false, priced: false, base: null, fromCard: false });
    }
    expect(resolveModelMeta(0, 'constructor', { constructor: { base: rates } })).toMatchObject({ overridden: true, priced: true });
  });
});

describe('buildModelTable', () => {
  const names = ['', 'GPT-6 Astra', 'Claude Opus 5', 'Llama 4', 'Kimi K3'];

  it('builds one row per dictionary entry, with rates converted to USD per token', () => {
    const modelTable = buildModelTable(storeOf(names));
    for (const column of [modelTable.priced, modelTable.cat, modelTable.vendor, modelTable.rIn, modelTable.rCr, modelTable.rCw, modelTable.rOut, modelTable.hasLong, modelTable.longThr, modelTable.lIn, modelTable.lCr, modelTable.lCw, modelTable.lOut]) expect(column).toHaveLength(names.length);
    expect(modelTable.meta.map((meta) => meta.id)).toEqual([0, 1, 2, 3, 4]);
    expect(modelTable.meta.map((meta) => meta.name)).toEqual(names);

    const astra = byName('GPT-6 Astra');
    expect(modelTable.priced[1]).toBe(1);
    expect(modelTable.rIn[1]).toBeCloseTo(astra.base.input / 1e6, 15);
    expect(modelTable.rCr[1]).toBeCloseTo(astra.base.cachedInput / 1e6, 15);
    expect(modelTable.rCw[1]).toBeCloseTo(astra.base.cacheWrite / 1e6, 15);
    expect(modelTable.rOut[1]).toBeCloseTo(astra.base.output / 1e6, 15);
    expect(modelTable.hasLong[1]).toBe(1);
    expect(modelTable.longThr[1]).toBe(astra.longThreshold);
    expect(modelTable.lIn[1]).toBeCloseTo((astra.long as Rates).input / 1e6, 15);
    expect(modelTable.lOut[1]).toBeCloseTo((astra.long as Rates).output / 1e6, 15);
  });

  it('indexes categories and vendors into CATEGORIES and VENDORS, with Unknown / Other for unpriced models', () => {
    const modelTable = buildModelTable(storeOf(names));
    for (const [index, name] of names.entries()) {
      const card = lookupCard(name);
      expect(CATEGORIES[modelTable.cat[index]], name).toBe(card?.category ?? 'Unknown');
      expect(VENDORS[modelTable.vendor[index]], name).toBe(card?.vendor ?? 'Other');
    }
    expect([modelTable.priced[0], modelTable.priced[3]]).toEqual([0, 0]);
    expect([modelTable.rIn[3], modelTable.rOut[3], modelTable.lIn[3], modelTable.hasLong[3]]).toEqual([0, 0, 0, 0]);
  });

  it('has no long tier for a model that does not have one', () => {
    const modelTable = buildModelTable(storeOf(names));
    expect([modelTable.hasLong[2], modelTable.longThr[2], modelTable.lIn[2], modelTable.lCr[2], modelTable.lCw[2], modelTable.lOut[2]]).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('applies overrides: an override prices an unknown model and replaces a long tier', () => {
    const rates: Rates = { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 5 };
    const modelTable = buildModelTable(storeOf(names), { 'Llama 4': { base: rates, long: { ...rates, input: 2 }, longThreshold: 1000 }, 'GPT-6 Astra': { long: null } });
    expect(modelTable.priced[3]).toBe(1);
    expect(modelTable.rIn[3]).toBeCloseTo(1e-6, 15);
    expect(modelTable.rOut[3]).toBeCloseTo(5e-6, 15);
    expect([modelTable.hasLong[3], modelTable.longThr[3]]).toEqual([1, 1000]);
    expect(modelTable.lIn[3]).toBeCloseTo(2e-6, 15);
    expect(modelTable.hasLong[1]).toBe(0);
    expect(modelTable.meta[1].overridden).toBe(true);
  });

  it('copes with an empty dictionary', () => {
    const modelTable = buildModelTable(storeOf([]));
    expect(modelTable.meta).toEqual([]);
    expect(modelTable.priced).toHaveLength(0);
  });
});

describe('listCost / listCostLong', () => {
  const names = PRICE_CARD.map((cardEntry) => cardEntry.name);
  const modelTable = buildModelTable(storeOf(['', ...names, 'Llama 4']));
  const idOf = (name: string): number => names.indexOf(name) + 1;
  const unpriced = [0, names.length + 1];

  it('multiplies the token mix by the per-million rates (hand-computed for GPT-6 Astra and Claude Opus 5)', () => {
    // 1M input at $10, 2M cached at $1, 3M cache writes at $12.50, 4M output at $50.
    expect(listCost(modelTable, idOf('GPT-6 Astra'), 1e6, 2e6, 3e6, 4e6)).toBeCloseTo(10 + 2 + 37.5 + 200, 9);
    expect(listCostLong(modelTable, idOf('GPT-6 Astra'), 1e6, 2e6, 3e6, 4e6)).toBeCloseTo(20 + 4 + 75 + 300, 9);
    expect(listCost(modelTable, idOf('Claude Opus 5'), 1e6, 2e6, 3e6, 4e6)).toBeCloseTo(5 + 1 + 18.75 + 100, 9);
  });

  it('prices one million tokens of each kind at the sum of the card rates, for every model and both tiers', () => {
    for (const cardEntry of PRICE_CARD) {
      const modelId = idOf(cardEntry.name);
      const sum = (rates: Rates): number => rates.input + rates.cachedInput + rates.cacheWrite + rates.output;
      expect(listCost(modelTable, modelId, 1e6, 1e6, 1e6, 1e6), cardEntry.name).toBeCloseTo(sum(cardEntry.base), 9);
      expect(listCostLong(modelTable, modelId, 1e6, 1e6, 1e6, 1e6), cardEntry.name).toBeCloseTo(sum(cardEntry.long ?? cardEntry.base), 9);
    }
  });

  it('falls back to the default tier when a model has no long tier, and is zero for unpriced models and for no tokens', () => {
    const opus = idOf('Claude Opus 5');
    expect(listCostLong(modelTable, opus, 123_456, 7, 89, 1_000)).toBe(listCost(modelTable, opus, 123_456, 7, 89, 1_000));
    for (const modelId of unpriced) {
      expect(listCost(modelTable, modelId, 1e6, 1e6, 1e6, 1e6)).toBe(0);
      expect(listCostLong(modelTable, modelId, 1e6, 1e6, 1e6, 1e6)).toBe(0);
    }
    for (const modelId of [1, 5, 9]) expect(listCost(modelTable, modelId, 0, 0, 0, 0)).toBe(0);
  });

  it('is linear in the token counts and never smaller with a longer tier', () => {
    const random = mulberry32(2026);
    for (let k = 0; k < 200; k++) {
      const modelId = 1 + Math.floor(random() * names.length);
      const firstMix = [0, 0, 0, 0].map(() => Math.floor(random() * 5e6));
      const secondMix = [0, 0, 0, 0].map(() => Math.floor(random() * 5e6));
      const cost = (mix: number[]): number => listCost(modelTable, modelId, mix[0], mix[1], mix[2], mix[3]);
      expect(cost(firstMix.map((tokenCount, index) => tokenCount + secondMix[index]))).toBeCloseTo(cost(firstMix) + cost(secondMix), 6);
      expect(cost(firstMix.map((tokenCount) => tokenCount * 3))).toBeCloseTo(3 * cost(firstMix), 6);
      expect(listCostLong(modelTable, modelId, firstMix[0], firstMix[1], firstMix[2], firstMix[3])).toBeGreaterThanOrEqual(cost(firstMix) - 1e-12);
    }
  });
});

describe('the card against billing', () => {
  it('reproduces the pool-used fixture: gross equals the list cost, or 90% of it on the Auto GPT-5.3-Codex rows', async () => {
    const store = await loadFixtureStore([FIXTURE_A]);
    const modelTable = buildModelTable(store);
    let discounted = 0;
    for (let i = 0; i < store.n; i++) {
      const model = store.dicts.model.values[store.model[i]];
      const cost = listCost(modelTable, store.model[i], store.input[i], store.cacheRead[i], store.cacheWrite[i], store.output[i]);
      expect(cost, model).toBeGreaterThan(0);
      const ratio = store.gross[i] / cost;
      if (Math.abs(ratio - 1) < 1e-3) continue;
      expect(model).toBe('GPT-5.3-Codex');
      expect(ratio, model).toBeCloseTo(1 - AUTO_DISCOUNT, 3);
      discounted++;
    }
    expect(discounted).toBe(2);
    expect(store.n).toBe(19);
  });
});
