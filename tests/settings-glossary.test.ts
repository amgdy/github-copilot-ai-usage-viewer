import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../src/lib/analytics/settings';
import { metricDoc } from '../src/lib/metrics/registry';
import { GLOSSARY, GLOSSARY_GROUPS, type GlossaryEntry } from '../src/pages/settings/glossary';
import { SCALARS } from '../src/pages/settings/limits';
import { BAD_TEXT } from './helpers';

const PAGES = fileURLToPath(new URL('../src/pages', import.meta.url));

const textOf = (entry: GlossaryEntry, settings: Settings = DEFAULT_SETTINGS): string => (typeof entry.definition === 'function' ? entry.definition(settings) : entry.definition);
const everything = (entry: GlossaryEntry): string => `${entry.term} ${(entry.aliases ?? []).join(' ')} ${textOf(entry)}`;
const entry = (id: string): GlossaryEntry => {
  const found = GLOSSARY.find((e) => e.id === id);
  if (!found) throw new Error(`No glossary entry with the id ${id}`);
  return found;
};

/** British spellings that must not appear in anything the Settings page shows. */
const BRITISH = /behaviour|organis|licence|colour|honour|labelled|favour|centre\b|catalogue|cancelled|analyse\b|analysed|optimis|utilis|summaris|normalis|customis/i;

describe('glossary structure', () => {
  it('gives every entry its own id and its own term', () => {
    const ids = GLOSSARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('puts every entry in a listed group and leaves no group empty', () => {
    for (const e of GLOSSARY) expect(GLOSSARY_GROUPS, e.id).toContain(e.group);
    for (const group of GLOSSARY_GROUPS) expect(GLOSSARY.some((e) => e.group === group), group).toBe(true);
  });

  it('reads a definition for every entry, with no stray placeholder in it', () => {
    for (const e of GLOSSARY) {
      const text = textOf(e);
      expect(text.trim().length, e.id).toBeGreaterThan(30);
      expect(text, e.id).not.toMatch(BAD_TEXT);
      expect(text, e.id).not.toContain('${');
    }
  });
});

describe('glossary terms for Auto and tokens', () => {
  const TERMS: [id: string, term: string][] = [
    ['auto-share', 'Auto share of usage'],
    ['auto-discount', 'Auto discount received'],
    ['auto-original-price', 'Original price of Auto usage'],
    ['auto-missed', 'Discount missed on hand-picked usage'],
    ['auto-use-class', 'Auto use class'],
    ['tokens-input', 'Input tokens'],
    ['tokens-cache-read', 'Cache read tokens'],
    ['tokens-cache-write', 'Cache write tokens'],
    ['tokens-output', 'Output tokens'],
  ];

  it.each(TERMS)('defines %s as "%s"', (id, term) => {
    const e = entry(id);
    expect(e.term).toBe(term);
    expect(textOf(e).length).toBeGreaterThan(50);
  });

  it('uses the same title as the metric docs for the same number', () => {
    for (const [id, term] of TERMS) expect(metricDoc(id)?.title, id).toBe(term);
  });

  it('lists the Auto terms together and the token terms together', () => {
    const auto = GLOSSARY.filter((e) => e.id.startsWith('auto-'));
    const tokens = GLOSSARY.filter((e) => e.id.startsWith('tokens-'));
    expect(auto.length).toBeGreaterThanOrEqual(5);
    expect(tokens).toHaveLength(4);
    for (const e of auto) expect(e.group, e.id).toBe('Auto model selection');
    for (const e of tokens) expect(e.group, e.id).toBe('Tokens');
  });

  it('can be found by the short names that people use', () => {
    expect(entry('auto-original-price').aliases).toContain('original price');
    expect(entry('auto-share').aliases).toContain('auto share');
    expect(entry('tokens-cache-read').aliases).toContain('cache read');
    expect(entry('tokens-cache-write').aliases).toContain('cache write');
  });
});

describe('glossary text that follows the live settings', () => {
  const settings: Settings = { ...DEFAULT_SETTINGS, lowAuto: 0.2, autoFirst: 0.65, autoDiscount: 0.15 };

  it('reads the Auto use limits for the class and the trait', () => {
    const cls = textOf(entry('auto-use-class'), settings);
    expect(cls).toContain('65% or more');
    expect(cls).toContain('less than 20%');
    expect(cls).toContain('the lower one must stay below the upper one');
    expect(textOf(entry('trait-low-auto'), settings)).toContain('Less than 20%');
    expect(textOf(entry('trait-low-auto'), settings)).toContain('Direct models class');
  });

  it('says that the Auto model discount is the assumed rate for a plan with no Auto usage to measure', () => {
    const discount = textOf(entry('auto-discount'), settings);
    expect(discount).toContain('15% now');
    expect(discount).toContain('no Auto usage to measure from');
    expect(discount).toContain('assumed');
    expect(textOf(entry('potential'), settings)).toContain('15% from the Auto model discount setting');
  });

  it('does not say that the Auto lever assumes one fixed discount', () => {
    expect(textOf(entry('potential'), settings)).not.toMatch(/assumes a/i);
  });
});

describe('glossary wording', () => {
  it('no longer calls usage a list price figure', () => {
    for (const id of ['usage', 'covered', 'active-day', 'potential', 'auto-discount', 'auto-original-price', 'auto-missed']) {
      expect(textOf(entry(id)), id).not.toMatch(/list price/i);
    }
    for (const e of GLOSSARY) expect(e.aliases ?? [], e.id).not.toContain('list price');
  });

  it('keeps "list price" for the price of a model', () => {
    for (const e of GLOSSARY) {
      for (const sentence of textOf(e).split(/(?<=\.)\s+/)) {
        if (/list price/i.test(sentence)) expect(sentence, e.id).toMatch(/\bmodels?\b/i);
      }
    }
  });

  it('tells usage, covered and billed apart', () => {
    expect(textOf(entry('usage'))).toContain('not the original price');
    expect(textOf(entry('covered'))).toContain('not a price reduction');
    expect(textOf(entry('covered'))).toContain('not the Auto discount');
  });

  it('uses American spelling', () => {
    for (const e of GLOSSARY) expect(everything(e), e.id).not.toMatch(BRITISH);
    for (const spec of Object.values(SCALARS)) expect(`${spec.label} ${spec.description}`, spec.key).not.toMatch(BRITISH);
  });
});

describe('the source of the Settings page', () => {
  const sources = (): { name: string; text: string }[] => {
    const dir = join(PAGES, 'settings');
    const paths = readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => join(dir, f));
    paths.push(join(PAGES, 'SettingsPage.tsx'));
    return paths.map((path) => ({ name: path.slice(PAGES.length + 1), text: readFileSync(path, 'utf8') }));
  };

  it('finds the files', () => {
    const names = sources().map((s) => s.name);
    expect(names).toContain('SettingsPage.tsx');
    expect(names).toContain('settings/glossary.ts');
    expect(names).toContain('settings/ScalarCards.tsx');
  });

  it('uses American spelling in its text and comments', () => {
    // The property name "recognised" in settings-io.ts is code, not text, so it is not checked.
    for (const { name, text } of sources()) expect(text, name).not.toMatch(BRITISH);
  });

  it('has no em dash and never says "at list price"', () => {
    for (const { name, text } of sources()) {
      expect(text, name).not.toContain('\u2014');
      expect(text, name).not.toMatch(/at list price/i);
    }
  });

  it('keeps the link from the glossary to the Methodology page', () => {
    const glossary = sources().find((s) => s.name === 'settings/GlossarySection.tsx');
    expect(glossary?.text).toContain('href="#/methodology"');
    expect(glossary?.text).toContain('Formulas for every number');
  });
});
