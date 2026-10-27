import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/lib/analytics/settings';
import { AUTO_DISCOUNT, CARD_AS_OF, CARD_SOURCE, PRICE_CARD, VENDORS, type CardEntry, type Rates } from '../src/lib/pricing/card';
import { buildModelTable, cardKey, inferVendor, listCost, listCostLong, lookupCard, resolveModelMeta } from '../src/lib/pricing/models';
import { CATEGORIES, type DataStore } from '../src/lib/types';
import { mulberry32 } from './helpers';
import { FIXTURE_A, loadFixtureStore } from './fixtures';

const byName = (name: string): CardEntry => {
  const e = PRICE_CARD.find((c) => c.name === name);
  if (!e) throw new Error(`not on the card: ${name}`);
  return e;
};

const RATE_KEYS = ['input', 'cachedInput', 'cacheWrite', 'output'] as const;

const storeOf = (names: string[]): Pick<DataStore, 'dicts'> =>
  ({ dicts: { model: { values: names, index: new Map(names.map((n, i) => [n, i])) } } }) as unknown as Pick<DataStore, 'dicts'>;

describe('PRICE_CARD', () => {
  it('has unique model names and unique lookup keys', () => {
    expect(new Set(PRICE_CARD.map((e) => e.name)).size).toBe(PRICE_CARD.length);
    expect(new Set(PRICE_CARD.map((e) => cardKey(e.name))).size).toBe(PRICE_CARD.length);
  });

  it('uses known vendors and categories, and the vendor agrees with the name-based inference', () => {
    const categories = CATEGORIES.filter((c) => c !== 'Unknown');
    for (const e of PRICE_CARD) {
      expect(VENDORS, e.name).toContain(e.vendor);
      expect(categories, e.name).toContain(e.category);
      expect(inferVendor(e.name), e.name).toBe(e.vendor);
    }
  });

  it('has finite, ordered base rates: cached < input < output, and a cache write that is free or at least the input rate', () => {
    for (const e of PRICE_CARD) {
      for (const k of RATE_KEYS) {
        expect(Number.isFinite(e.base[k]), `${e.name}.${k}`).toBe(true);
        expect(e.base[k], `${e.name}.${k}`).toBeGreaterThanOrEqual(0);
      }
      expect(e.base.cachedInput, e.name).toBeGreaterThan(0);
      expect(e.base.cachedInput, e.name).toBeLessThan(e.base.input);
      expect(e.base.output, e.name).toBeGreaterThan(e.base.input);
      if (e.base.cacheWrite !== 0) expect(e.base.cacheWrite, e.name).toBeGreaterThanOrEqual(e.base.input);
    }
  });

  it('has a long tier only together with its threshold, and long rates never below the base rates', () => {
    for (const e of PRICE_CARD) {
      if (!e.long) {
        expect(e.longThreshold, e.name).toBeUndefined();
        continue;
      }
      expect(Number.isInteger(e.longThreshold) && (e.longThreshold ?? 0) > 0, `${e.name} threshold`).toBe(true);
      for (const k of RATE_KEYS) expect(e.long[k], `${e.name}.${k}`).toBeGreaterThanOrEqual(e.base[k]);
      expect(e.long.cacheWrite === 0, `${e.name}: cache write is free in both tiers or in neither`).toBe(e.base.cacheWrite === 0);
    }
  });

  it('says where and when the card was taken from; notes are never empty', () => {
    expect(CARD_SOURCE).toMatch(/^https:\/\/docs\.github\.com\//);
    expect(CARD_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const e of PRICE_CARD) if (e.note !== undefined) expect(e.note.trim().length, e.name).toBeGreaterThan(0);
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
    for (const e of PRICE_CARD) {
      expect(lookupCard(e.name), e.name).toBe(e);
      expect(lookupCard(e.name.toUpperCase()), e.name).toBe(e);
      expect(lookupCard(e.name.toLowerCase()), e.name).toBe(e);
      expect(lookupCard(e.name.replace(/ /g, '-')), e.name).toBe(e);
      expect(lookupCard(`  ${e.name.replace(/ /g, '  ')} `), e.name).toBe(e);
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
    for (const n of ['', ' ', '()', 'Llama 3', 'GPT-4', 'Auto', 'gpt-5.6', 'Claude Opus', 'Claude Opus 4.8 Turbo', 'Opus 4']) {
      expect(lookupCard(n), JSON.stringify(n)).toBeUndefined();
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
    const e = byName('GPT-6 Astra');
    const m = resolveModelMeta(3, 'GPT-6 Astra');
    expect(m).toMatchObject({ id: 3, name: 'GPT-6 Astra', vendor: 'OpenAI', category: 'Powerful', priced: true, fromCard: true, overridden: false, longThreshold: 272_000 });
    expect(m.base).toEqual(e.base);
    expect(m.long).toEqual(e.long);
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
    const m = resolveModelMeta(2, 'Llama 4', { 'Llama 4': { base: rates, category: 'Versatile', vendor: 'Other' } });
    expect(m).toMatchObject({ priced: true, overridden: true, fromCard: false, category: 'Versatile', long: null, longThreshold: 0 });
    expect(m.base).toEqual(rates);
  });

  it('lets an override replace the rates of a card model while keeping its long tier', () => {
    const e = byName('GPT-6 Astra');
    const m = resolveModelMeta(0, 'GPT-6 Astra', { 'GPT-6 Astra': { base: rates } });
    expect(m.base).toEqual(rates);
    expect(m.long).toEqual(e.long);
    expect(m).toMatchObject({ overridden: true, fromCard: true, longThreshold: 272_000 });
  });

  it('lets an override drop the long tier (null), change its threshold, or supply one with the default threshold', () => {
    expect(resolveModelMeta(0, 'GPT-6 Astra', { 'GPT-6 Astra': { long: null } })).toMatchObject({ long: null, longThreshold: 0, overridden: true });
    expect(resolveModelMeta(0, 'GPT-6 Astra', { 'GPT-6 Astra': { longThreshold: 128_000 } }).longThreshold).toBe(128_000);
    expect(resolveModelMeta(0, 'Llama 4', { 'Llama 4': { base: rates, long: rates } }).longThreshold).toBe(272_000);
    expect(resolveModelMeta(0, 'Llama 4', { 'Llama 4': { base: rates, long: rates, longThreshold: 50_000 } }).longThreshold).toBe(50_000);
  });

  it('ignores an override stored under another name', () => {
    const m = resolveModelMeta(0, 'GPT-6 Astra', { 'Some other model': { base: rates } });
    expect(m.overridden).toBe(false);
    expect(m.base).toEqual(byName('GPT-6 Astra').base);
  });

  it('does not take a model name such as "constructor" or "__proto__" for an override', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf']) {
      const m = resolveModelMeta(0, name, {});
      expect(m, name).toMatchObject({ overridden: false, priced: false, base: null, fromCard: false });
    }
    expect(resolveModelMeta(0, 'constructor', { constructor: { base: rates } })).toMatchObject({ overridden: true, priced: true });
  });
});

describe('buildModelTable', () => {
  const names = ['', 'GPT-6 Astra', 'Claude Opus 5', 'Llama 4', 'Kimi K3'];

  it('builds one row per dictionary entry, with rates converted to USD per token', () => {
    const t = buildModelTable(storeOf(names));
    for (const arr of [t.priced, t.cat, t.vendor, t.rIn, t.rCr, t.rCw, t.rOut, t.hasLong, t.longThr, t.lIn, t.lCr, t.lCw, t.lOut]) expect(arr).toHaveLength(names.length);
    expect(t.meta.map((m) => m.id)).toEqual([0, 1, 2, 3, 4]);
    expect(t.meta.map((m) => m.name)).toEqual(names);

    const astra = byName('GPT-6 Astra');
    expect(t.priced[1]).toBe(1);
    expect(t.rIn[1]).toBeCloseTo(astra.base.input / 1e6, 15);
    expect(t.rCr[1]).toBeCloseTo(astra.base.cachedInput / 1e6, 15);
    expect(t.rCw[1]).toBeCloseTo(astra.base.cacheWrite / 1e6, 15);
    expect(t.rOut[1]).toBeCloseTo(astra.base.output / 1e6, 15);
    expect(t.hasLong[1]).toBe(1);
    expect(t.longThr[1]).toBe(astra.longThreshold);
    expect(t.lIn[1]).toBeCloseTo((astra.long as Rates).input / 1e6, 15);
    expect(t.lOut[1]).toBeCloseTo((astra.long as Rates).output / 1e6, 15);
  });

  it('indexes categories and vendors into CATEGORIES and VENDORS, with Unknown / Other for unpriced models', () => {
    const t = buildModelTable(storeOf(names));
    for (const [i, n] of names.entries()) {
      const card = lookupCard(n);
      expect(CATEGORIES[t.cat[i]], n).toBe(card?.category ?? 'Unknown');
      expect(VENDORS[t.vendor[i]], n).toBe(card?.vendor ?? 'Other');
    }
    expect([t.priced[0], t.priced[3]]).toEqual([0, 0]);
    expect([t.rIn[3], t.rOut[3], t.lIn[3], t.hasLong[3]]).toEqual([0, 0, 0, 0]);
  });

  it('has no long tier for a model that does not have one', () => {
    const t = buildModelTable(storeOf(names));
    expect([t.hasLong[2], t.longThr[2], t.lIn[2], t.lCr[2], t.lCw[2], t.lOut[2]]).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('applies overrides: an override prices an unknown model and replaces a long tier', () => {
    const rates: Rates = { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 5 };
    const t = buildModelTable(storeOf(names), { 'Llama 4': { base: rates, long: { ...rates, input: 2 }, longThreshold: 1000 }, 'GPT-6 Astra': { long: null } });
    expect(t.priced[3]).toBe(1);
    expect(t.rIn[3]).toBeCloseTo(1e-6, 15);
    expect(t.rOut[3]).toBeCloseTo(5e-6, 15);
    expect([t.hasLong[3], t.longThr[3]]).toEqual([1, 1000]);
    expect(t.lIn[3]).toBeCloseTo(2e-6, 15);
    expect(t.hasLong[1]).toBe(0);
    expect(t.meta[1].overridden).toBe(true);
  });

  it('copes with an empty dictionary', () => {
    const t = buildModelTable(storeOf([]));
    expect(t.meta).toEqual([]);
    expect(t.priced).toHaveLength(0);
  });
});

describe('listCost / listCostLong', () => {
  const names = PRICE_CARD.map((e) => e.name);
  const t = buildModelTable(storeOf(['', ...names, 'Llama 4']));
  const idOf = (name: string): number => names.indexOf(name) + 1;
  const unpriced = [0, names.length + 1];

  it('multiplies the token mix by the per-million rates (hand-computed for GPT-6 Astra and Claude Opus 5)', () => {
    // 1M input at $10, 2M cached at $1, 3M cache writes at $12.50, 4M output at $50.
    expect(listCost(t, idOf('GPT-6 Astra'), 1e6, 2e6, 3e6, 4e6)).toBeCloseTo(10 + 2 + 37.5 + 200, 9);
    expect(listCostLong(t, idOf('GPT-6 Astra'), 1e6, 2e6, 3e6, 4e6)).toBeCloseTo(20 + 4 + 75 + 300, 9);
    expect(listCost(t, idOf('Claude Opus 5'), 1e6, 2e6, 3e6, 4e6)).toBeCloseTo(5 + 1 + 18.75 + 100, 9);
  });

  it('prices one million tokens of each kind at the sum of the card rates, for every model and both tiers', () => {
    for (const e of PRICE_CARD) {
      const m = idOf(e.name);
      const sum = (r: Rates): number => r.input + r.cachedInput + r.cacheWrite + r.output;
      expect(listCost(t, m, 1e6, 1e6, 1e6, 1e6), e.name).toBeCloseTo(sum(e.base), 9);
      expect(listCostLong(t, m, 1e6, 1e6, 1e6, 1e6), e.name).toBeCloseTo(sum(e.long ?? e.base), 9);
    }
  });

  it('falls back to the default tier when a model has no long tier, and is zero for unpriced models and for no tokens', () => {
    const opus = idOf('Claude Opus 5');
    expect(listCostLong(t, opus, 123_456, 7, 89, 1_000)).toBe(listCost(t, opus, 123_456, 7, 89, 1_000));
    for (const m of unpriced) {
      expect(listCost(t, m, 1e6, 1e6, 1e6, 1e6)).toBe(0);
      expect(listCostLong(t, m, 1e6, 1e6, 1e6, 1e6)).toBe(0);
    }
    for (const m of [1, 5, 9]) expect(listCost(t, m, 0, 0, 0, 0)).toBe(0);
  });

  it('is linear in the token counts and never smaller with a longer tier', () => {
    const rnd = mulberry32(2026);
    for (let k = 0; k < 200; k++) {
      const m = 1 + Math.floor(rnd() * names.length);
      const a = [0, 0, 0, 0].map(() => Math.floor(rnd() * 5e6));
      const b = [0, 0, 0, 0].map(() => Math.floor(rnd() * 5e6));
      const cost = (x: number[]): number => listCost(t, m, x[0], x[1], x[2], x[3]);
      expect(cost(a.map((v, i) => v + b[i]))).toBeCloseTo(cost(a) + cost(b), 6);
      expect(cost(a.map((v) => v * 3))).toBeCloseTo(3 * cost(a), 6);
      expect(listCostLong(t, m, a[0], a[1], a[2], a[3])).toBeGreaterThanOrEqual(cost(a) - 1e-12);
    }
  });
});

describe('the card against billing', () => {
  it('reproduces the pool-used fixture: gross equals the list cost, or 90% of it on the Auto GPT-5.3-Codex rows', async () => {
    const store = await loadFixtureStore([FIXTURE_A]);
    const t = buildModelTable(store);
    let discounted = 0;
    for (let i = 0; i < store.n; i++) {
      const model = store.dicts.model.values[store.model[i]];
      const cost = listCost(t, store.model[i], store.input[i], store.cacheRead[i], store.cacheWrite[i], store.output[i]);
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
