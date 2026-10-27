import { describe, expect, it } from 'vitest';
import { PRICE_CARD, type CardEntry } from '../src/lib/pricing/card';
import { compareWithCard, liveOverrides, parsePrice, parsePricingMarkdown, parseThreshold } from '../src/lib/pricing/docsParser';
import { lookupCard } from '../src/lib/pricing/models';

// A made-up page in the same shape as the GitHub Docs price page: vendor headings, filler rows, Default and
// Long context tiers, "Not applicable" cells, a footnote on a model name and an unrelated table.
const PAGE = `# Models and pricing for GitHub Copilot

## Pricing tables

All prices are **per 1 million tokens**.

### OpenAI

| Model         | Release status | Category    | Tier         | Threshold (input tokens) |  Input | Cached input |    Cache write | Output |
| ------------- | -------------- | ----------- | ------------ | ------------------------ | -----: | -----------: | -------------: | -----: |
|               |                |             |              |                          |        |              |                |        |
| Test GPT A    | GA             | Powerful    | Default      | Not applicable           |  $1.75 |       $0.175 | Not applicable | $14.00 |
|               |                |             |              |                          |        |              |                |        |
| Test GPT B    | GA             | Versatile   | Default      | ≤ 272K                   |  $1.00 |        $0.05 |          $1.25 |  $5.00 |
| Test GPT B    | GA             | Versatile   | Long context | > 272K                   |  $2.00 |        $0.10 |          $2.50 |  $7.50 |

### Anthropic

| Model                  | Release status | Category    | Tier    | Threshold (input tokens) |  Input | Cached input | Cache write | Output |
| ---------------------- | -------------- | ----------- | ------- | ------------------------ | -----: | -----------: | ----------: | -----: |
| Claude Test (preview)  | Public preview | Lightweight | Default | Not applicable           |  $0.10 |        $0.01 |      $0.125 |  $0.50 |
| Claude Broken          | GA             | Lightweight | Default | Not applicable           |  TBD   |        $0.01 |      $0.125 |  $0.50 |

### Google

| Model                         | Release status | Category  | Tier    | Threshold (input tokens) | Input | Cached input | Output |
| ----------------------------- | -------------- | --------- | ------- | ------------------------ | ----: | -----------: | -----: |
| Gemini Test[^promo]           | GA             | Mighty    | Default | Not applicable           | $0.75 |       $0.075 |  $3.75 |

### Moonshot AI

| Model   | Release status | Category | Input | Cached input | Output |
| ------- | -------------- | -------- | ----: | -----------: | -----: |
| Kimi T  | GA             | Versatile | $0.60 |       $0.10 |  $2.50 |

## Model multipliers

| Model | Multiplier |
| ----- | ---------: |
| Test GPT A | 1 |

[^promo]: Gemini Test is available at a promotional price until December 31, 2026.
`;

describe('parsePrice and parseThreshold', () => {
  it('reads dollar amounts and treats anything else as missing', () => {
    expect(parsePrice('$1.75')).toBe(1.75);
    expect(parsePrice(' $0.075 ')).toBe(0.075);
    expect(parsePrice('$1,250.00')).toBe(1250);
    expect(parsePrice('Not applicable')).toBeNull();
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('-')).toBeNull();
  });

  it('reads token thresholds with K and M suffixes', () => {
    expect(parseThreshold('≤ 272K')).toBe(272_000);
    expect(parseThreshold('> 200K')).toBe(200_000);
    expect(parseThreshold('> 1M')).toBe(1_000_000);
    expect(parseThreshold('≤ 128,000')).toBe(128_000);
    expect(parseThreshold('Not applicable')).toBeUndefined();
  });
});

describe('parsePricingMarkdown', () => {
  const { models, warnings } = parsePricingMarkdown(PAGE);
  const get = (name: string) => models.find((m) => m.name === name);

  it('reads every priced model once, skips filler rows and ignores tables without prices', () => {
    expect(models.map((m) => m.name)).toEqual(['Test GPT A', 'Test GPT B', 'Claude Test (preview)', 'Gemini Test', 'Kimi T']);
  });

  it('takes the vendor from the heading above the table', () => {
    expect(models.map((m) => m.vendor)).toEqual(['OpenAI', 'OpenAI', 'Anthropic', 'Google', 'Moonshot']);
  });

  it('reads the four rates; a missing cache write becomes 0', () => {
    expect(get('Test GPT A')).toMatchObject({ category: 'Powerful', status: 'GA', base: { input: 1.75, cachedInput: 0.175, cacheWrite: 0, output: 14 } });
    expect(get('Claude Test (preview)')).toMatchObject({ category: 'Lightweight', status: 'Public preview', base: { input: 0.1, cachedInput: 0.01, cacheWrite: 0.125, output: 0.5 } });
    expect(get('Kimi T')?.base).toEqual({ input: 0.6, cachedInput: 0.1, cacheWrite: 0, output: 2.5 });
  });

  it('joins Default and Long context rows into one model with its threshold', () => {
    const b = get('Test GPT B')!;
    expect(b.base).toEqual({ input: 1, cachedInput: 0.05, cacheWrite: 1.25, output: 5 });
    expect(b.long).toEqual({ input: 2, cachedInput: 0.1, cacheWrite: 2.5, output: 7.5 });
    expect(b.longThreshold).toBe(272_000);
    expect(get('Test GPT A')?.long).toBeUndefined();
    expect(get('Test GPT A')?.longThreshold).toBeUndefined();
  });

  it('removes footnote marks from names and keeps the footnote text as a note', () => {
    expect(get('Gemini Test')?.note).toBe('Gemini Test is available at a promotional price until December 31, 2026.');
  });

  it('reports rows it could not read and categories it does not know, instead of guessing', () => {
    expect(get('Claude Broken')).toBeUndefined();
    expect(get('Gemini Test')?.category).toBeUndefined();
    expect(warnings).toEqual([
      'Claude Broken: skipped, the input or output price is not a number.',
      'Gemini Test: unknown category "Mighty".',
    ]);
  });

  it('returns nothing for text without price tables', () => {
    expect(parsePricingMarkdown('# Nothing here\n\nJust text.')).toEqual({ models: [], warnings: [] });
  });
});

describe('compareWithCard', () => {
  const card: CardEntry[] = [
    { name: 'Test GPT A', vendor: 'OpenAI', category: 'Powerful', base: { input: 1.75, cachedInput: 0.175, cacheWrite: 0, output: 14 } },
    { name: 'Test GPT B', vendor: 'OpenAI', category: 'Powerful', base: { input: 1, cachedInput: 0.05, cacheWrite: 1.25, output: 6 } },
    { name: 'Claude Test', vendor: 'Anthropic', category: 'Lightweight', base: { input: 0.1, cachedInput: 0.01, cacheWrite: 0.125, output: 0.5 } },
    { name: 'Retired Model', vendor: 'Other', category: 'Versatile', base: { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 4 } },
  ];
  const diffs = compareWithCard(parsePricingMarkdown(PAGE).models, card);

  it('lists changed models first, then new ones, then models no longer on the page', () => {
    expect(diffs.map((d) => [d.kind, d.name])).toEqual([
      ['changed', 'Test GPT B'],
      ['new', 'Gemini Test'],
      ['new', 'Kimi T'],
      ['missing', 'Retired Model'],
    ]);
  });

  it('names each field that changed, including the long context tier', () => {
    expect(diffs[0].fields).toEqual(['category', 'output', 'longInput', 'longCachedInput', 'longCacheWrite', 'longOutput', 'longThreshold']);
  });

  it('matches names the same way reports do: "(preview)" and vendor words do not matter', () => {
    expect(diffs.some((d) => d.name.startsWith('Claude Test'))).toBe(false);
  });

  it('finds no difference between the built-in card and itself', () => {
    expect(compareWithCard(PRICE_CARD.map((e) => ({ ...e })))).toEqual([]);
  });
});

describe('liveOverrides', () => {
  const first = PRICE_CARD[0];
  const changed = { ...first, base: { ...first.base, output: first.base.output + 1 } };
  const brandNew = { name: 'Brand New Model', vendor: 'xAI' as const, category: 'Versatile' as const, base: { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 3 } };

  it('adds overrides only for report models whose live price differs from the price the app uses', () => {
    const ov = liveOverrides([first.name, PRICE_CARD[1].name, 'Brand New Model', 'Not on any card'], [changed, PRICE_CARD[1], brandNew]);
    expect(Object.keys(ov).sort()).toEqual(['Brand New Model', first.name].sort());
    expect(ov[first.name].base?.output).toBe(first.base.output + 1);
    expect(ov['Brand New Model']).toEqual({ vendor: 'xAI', category: 'Versatile', base: brandNew.base, long: null });
  });

  it('keeps existing overrides for other models', () => {
    const ov = liveOverrides([first.name], [changed], { 'My Model': { category: 'Lightweight' } });
    expect(ov['My Model']).toEqual({ category: 'Lightweight' });
  });
});

describe('makeCardLookup (via lookupCard)', () => {
  it('still finds card entries by report names', () => {
    expect(lookupCard('Claude Opus 4.8 (fast mode)')?.name).toBe('Claude Opus 4.8 (fast mode) (preview)');
    expect(lookupCard('opus 4.8')?.name).toBe('Claude Opus 4.8');
    expect(lookupCard('GPT-6.1 Terra')?.category).toBe('Versatile');
    expect(lookupCard('Claude Opus 4.8 (fast mode) (extra)')?.name).toBe('Claude Opus 4.8 (fast mode) (preview)');
    // "fast" changes the price, so it is never dropped to fall back to the normal model.
    expect(lookupCard('Claude Opus 4.8 (fast)')).toBeUndefined();
  });
});
