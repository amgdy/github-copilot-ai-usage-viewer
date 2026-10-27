import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'vite';
import { describe, expect, it } from 'vitest';
import { placeholdersOf, type Dict, type Entry } from '../src/i18n/core';
import { METRICS } from '../src/lib/metrics/registry';
import type { MetricDoc } from '../src/lib/metrics/types';
import { LINKS } from '../src/lib/links';

/**
 * Keeps the Arabic version complete and the layout right-to-left safe:
 *  - every English text passed to t(), tp(), msg(), pluralize() or <T text> has an Arabic entry,
 *  - each Arabic entry keeps the {placeholders} of its English key,
 *  - no English key is defined in two dictionary files,
 *  - the user sees no raw English in JSX (text, text props, label/title/… object fields),
 *  - class names use start/end (ms, pe, start-0, text-end, border-s…) instead of left/right.
 * The source checks run on the paths in ENFORCED. While an area is being translated, run
 * `I18N_ENFORCE=pages/users/,components/user/ npx vitest run tests/i18n.test.ts` to check it.
 * Add `I18N_DUMP=/tmp/missing.json` to get the full list of texts that still need Arabic.
 */

const SRC = fileURLToPath(new URL('../src', import.meta.url));

const ENFORCED = [
  'pages/',
  'components/',
  'App.tsx',
  'components/Landing.tsx',
  'components/charts/',
  'components/layout/AppShell.tsx',
  'components/layout/CoverageNotice.tsx',
  'components/layout/DateRange.tsx',
  'components/layout/ExportMenu.tsx',
  'components/layout/FilterChips.tsx',
  'components/layout/FilterDrawer.tsx',
  'components/layout/LanguageButton.tsx',
  'components/layout/PrintHeader.tsx',
  'components/layout/Sidebar.tsx',
  'components/layout/TopBar.tsx',
  'components/layout/nav.tsx',
  'components/ui/',
  'lib/analytics/taxonomy.ts',
  'lib/analytics/',
  'lib/licenses/',
  'lib/export/',
  'lib/pricing/card.ts',
  'lib/metrics/settingRefs.ts',
  'lib/metrics/types.ts',
  'lib/types.ts',
  'pages/MethodologyPage.tsx',
  'pages/methodology/',
  'pages/shared.tsx',
  'state/filterChips.ts',
  'state/loadDataset.ts',
  'state/loadSample.ts',
];

const ENFORCE_EXTRA = (process.env.I18N_ENFORCE ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Metric explanation areas (or docs files such as 'docs/users.ts') whose texts must all have Arabic.
 * `I18N_DOCS_ENFORCE=docs/users.ts` checks one docs file while it is being translated.
 */
const DOCS_ENFORCED: string[] = ['*'];
const DOCS_ENFORCE_EXTRA = (process.env.I18N_DOCS_ENFORCE ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const enforced = (file: string) => [...ENFORCED, ...ENFORCE_EXTRA].some((p) => file === p || (p.endsWith('/') && file.startsWith(p)));

// ---- Dictionaries ------------------------------------------------------------------------------

const DICT_FILES = import.meta.glob<{ default: Dict }>('../src/i18n/ar/*.ts', { eager: true });
const AR: Dict = Object.assign({}, ...Object.values(DICT_FILES).map((m) => m.default));
const hasArabic = (key: string) => Object.hasOwn(AR, key);

const expectNone = (problems: string[]) => expect(problems, problems.join('\n')).toEqual([]);
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * `I18N_DUMP=/tmp/missing.json` adds the full English text of every key that still needs Arabic to that
 * file (the failure message cuts long texts). Both checks append, so delete the file before a run.
 */
function dumpMissing(texts: string[]) {
  const path = process.env.I18N_DUMP;
  if (!path || !texts.length) return;
  const before: string[] = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
  writeFileSync(path, JSON.stringify([...new Set([...before, ...texts])], null, 2));
}

function placeholderProblem(key: string, e: Entry): string | null {
  const want = placeholdersOf(key);
  if (typeof e === 'string') return same(placeholdersOf(e), want) ? null : `{${want}} in English, {${placeholdersOf(e)}} in Arabic`;
  for (const [form, text] of Object.entries(e)) {
    if (typeof text !== 'string') continue;
    const extra = placeholdersOf(text).filter((p) => !want.includes(p));
    if (extra.length) return `form "${form}" has unknown {${extra}}`;
    // The singular and dual forms may spell the number out, so only {n} may be left out of them.
    const needed = form === 'one' || form === 'two' ? want.filter((p) => p !== 'n') : want;
    const missing = needed.filter((p) => !placeholdersOf(text).includes(p));
    if (missing.length) return `form "${form}" lacks {${missing}}`;
  }
  return null;
}

describe('i18n: Arabic dictionaries', () => {
  it('loads at least one dictionary file', () => {
    expect(Object.keys(DICT_FILES).length).toBeGreaterThan(0);
  });

  it('defines each English key in one file only', () => {
    const where = new Map<string, string[]>();
    for (const [path, mod] of Object.entries(DICT_FILES)) {
      for (const key of Object.keys(mod.default)) where.set(key, [...(where.get(key) ?? []), path.split('/').pop()!]);
    }
    expectNone([...where].filter(([, files]) => files.length > 1).map(([key, files]) => `"${key}" is in ${files.join(' and ')}`));
  });

  it('keeps the {placeholders} of every key', () => {
    const bad: string[] = [];
    for (const [key, e] of Object.entries(AR)) {
      const p = placeholderProblem(key, e);
      if (p) bad.push(`"${key.slice(0, 80)}": ${p}`);
    }
    expectNone(bad);
  });

  it('has no empty translations', () => {
    const bad = Object.entries(AR)
      .filter(([, e]) => (typeof e === 'string' ? !e.trim() : Object.values(e).some((x) => typeof x === 'string' && !x.trim())))
      .map(([k]) => `"${k.slice(0, 80)}" is empty`);
    expectNone(bad);
  });

  it('translates official guidance titles', () => {
    expectNone(Object.values(LINKS).map((link) => link.label).filter((label) => !hasArabic(label)));
  });
});

// ---- Source scan -------------------------------------------------------------------------------

interface AstNode {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
}

const isNode = (v: unknown): v is AstNode => typeof v === 'object' && v !== null && typeof (v as AstNode).type === 'string';

function childrenOf(n: AstNode): AstNode[] {
  const out: AstNode[] = [];
  for (const [key, value] of Object.entries(n)) {
    if (key === 'type') continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) out.push(item);
    } else if (isNode(value)) out.push(value);
  }
  return out;
}

const literal = (n: unknown): string | null => {
  if (!isNode(n)) return null;
  if (n.type === 'Literal' && typeof n.value === 'string') return n.value;
  if (n.type === 'TemplateLiteral' && (n.expressions as unknown[]).length === 0) return (n.quasis as { value: { cooked: string } }[])[0].value.cooked;
  return null;
};

/** The fixed text pieces of a string or template literal, for spotting raw English. */
const textPieces = (n: unknown): string[] => {
  if (!isNode(n)) return [];
  if (n.type === 'Literal' && typeof n.value === 'string') return [n.value];
  if (n.type === 'TemplateLiteral') return (n.quasis as { value: { cooked: string } }[]).map((q) => q.value.cooked);
  return [];
};

const WORDS = /[A-Za-z]{2,}/;
const TEXT_PROPS = new Set(['label', 'title', 'hint', 'description', 'subtitle', 'placeholder', 'aria-label', 'alt', 'caption', 'emptyText', 'tooltip', 'heading', 'note']);
const TEXT_KEYS = new Set(['label', 'title', 'hint', 'description', 'subtitle', 'placeholder', 'caption', 'tooltip', 'heading', 'note', 'detail', 'summary', 'why', 'action']);
const CODE_TAGS = new Set(['code', 'pre', 'kbd', 'samp']);
const PHYSICAL =
  /(?<![\w-])(?:[\w-]+:)*-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|scroll-ml|scroll-mr|space-x-reverse|text-left|text-right|float-left|float-right)(?:-[\w./[\]%-]+)?(?![\w-])/g;

interface Found {
  file: string;
  line: number;
  text: string;
}

const walkDir = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkDir(p, out);
    else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
};

function scan() {
  const keys: Found[] = [];
  const raw: Found[] = [];
  const physical: Found[] = [];
  const parseErrors: string[] = [];

  for (const path of walkDir(SRC)) {
    const file = relative(SRC, path).split(sep).join('/');
    if (file.startsWith('i18n/ar/') || file.startsWith('lib/metrics/docs/')) continue;
    const text = readFileSync(path, 'utf8');
    let program: AstNode;
    try {
      program = parseAst(text, { lang: path.endsWith('.tsx') ? 'tsx' : 'ts' }, path) as unknown as AstNode;
    } catch (error) {
      parseErrors.push(`${file}: ${String(error).slice(0, 120)}`);
      continue;
    }
    const lineOf = (n: AstNode) => text.slice(0, n.start).split('\n').length;
    const key = (n: AstNode, k: string | null) => k !== null && keys.push({ file, line: lineOf(n), text: k });
    const rawText = (n: AstNode, s: string) => raw.push({ file, line: lineOf(n), text: s.trim().slice(0, 80) });

    const classStrings = (n: AstNode) => {
      for (const s of textPieces(n)) for (const m of s.matchAll(PHYSICAL)) physical.push({ file, line: lineOf(n), text: m[0] });
      for (const c of childrenOf(n)) classStrings(c);
    };

    const visit = (n: AstNode, inCode: boolean) => {
      if (n.type === 'CallExpression' && isNode(n.callee) && n.callee.type === 'Identifier') {
        const name = n.callee.name as string;
        const args = n.arguments as AstNode[];
        if (name === 't' || name === 'msg') key(n, literal(args[0]));
        else if (name === 'tp') key(n, literal(args[2]));
        else if (name === 'pluralize') {
          const one = literal(args[1]);
          const many = args[2] ? literal(args[2]) : one === null ? null : `${one}s`;
          if (many !== null) key(n, `{n} ${many}`);
        } else if (name === 'cx') classStrings(n);
      }
      if (n.type === 'JSXElement') {
        const opening = n.openingElement as AstNode;
        const nameNode = opening.name as AstNode;
        const tag = nameNode.type === 'JSXIdentifier' ? (nameNode.name as string) : '';
        if (tag === 'T') {
          const textAttr = (opening.attributes as AstNode[]).find((a) => a.type === 'JSXAttribute' && (a.name as AstNode).name === 'text');
          const v = textAttr?.value as AstNode | undefined;
          key(n, literal(v?.type === 'JSXExpressionContainer' ? v.expression : v));
        }
        const code = inCode || CODE_TAGS.has(tag);
        for (const c of n.children as AstNode[]) {
          if (!code && c.type === 'JSXText' && WORDS.test(c.value as string)) rawText(c, c.value as string);
          if (!code && c.type === 'JSXExpressionContainer' && textPieces(c.expression).some((s) => WORDS.test(s))) rawText(c, textPieces(c.expression).join('…'));
        }
        visit(opening, code);
        for (const c of n.children as AstNode[]) visit(c, code);
        return;
      }
      if (n.type === 'JSXAttribute') {
        const name = (n.name as AstNode).name as string;
        const v = n.value as AstNode | null;
        const inner = v?.type === 'JSXExpressionContainer' ? (v.expression as AstNode) : v;
        if (/className$/i.test(name) && v) classStrings(v);
        else if (TEXT_PROPS.has(name) && inner && textPieces(inner).some((s) => WORDS.test(s))) rawText(n, `${name}="${textPieces(inner).join('…')}"`);
      }
      if (n.type === 'Property' && !n.computed && isNode(n.key)) {
        const k = (n.key.name ?? n.key.value) as string | undefined;
        if (k && /className$/i.test(k)) classStrings(n.value as AstNode);
        else if (k && TEXT_KEYS.has(k) && textPieces(n.value).some((s) => WORDS.test(s))) rawText(n, `${k}: ${textPieces(n.value).join('…')}`);
      }
      for (const c of childrenOf(n)) visit(c, inCode);
    };
    visit(program, false);
  }
  return { keys, raw, physical, parseErrors };
}

const SCAN = scan();
const fmt = (f: Found, what: string) => `${f.file}:${f.line}: ${what}`;

describe('i18n: source', () => {
  it('parses every source file', () => {
    expectNone(SCAN.parseErrors);
  });

  it('finds the texts marked for translation', () => {
    expect(SCAN.keys.length).toBeGreaterThan(50);
  });

  it('has Arabic for every text passed to t, tp, msg, pluralize and <T> (enforced paths)', () => {
    const missing = SCAN.keys.filter((k) => enforced(k.file) && !hasArabic(k.text));
    dumpMissing(missing.map((k) => k.text));
    expectNone(missing.map((k) => fmt(k, `no Arabic for "${k.text.slice(0, 100)}"`)));
  });

  it('shows no raw English in JSX (enforced paths)', () => {
    expectNone(SCAN.raw.filter((r) => enforced(r.file)).map((r) => fmt(r, `wrap in t() or msg(): ${r.text}`)));
  });

  it('uses start/end classes instead of left/right (enforced paths)', () => {
    expectNone(SCAN.physical.filter((p) => enforced(p.file)).map((p) => fmt(p, `use a start/end class instead of "${p.text}"`)));
  });
});

// ---- Metric explanations -----------------------------------------------------------------------

const docTexts = (d: MetricDoc): string[] => [d.title, d.meaning, d.formula, ...(d.steps ?? []), ...(d.notes ?? []), ...(d.example ? [d.example] : [])];

/** Doc id → 'docs/<file>.ts', so a docs file can be checked on its own (areas span several files). */
const DOC_FILES = import.meta.glob<Record<string, unknown>>('../src/lib/metrics/docs/*.ts', { eager: true });
const FILE_OF = new Map<string, string>();
for (const [path, mod] of Object.entries(DOC_FILES)) {
  const name = `docs/${path.split('/').pop()}`;
  for (const v of Object.values(mod)) if (Array.isArray(v)) for (const d of v as MetricDoc[]) if (d?.id) FILE_OF.set(d.id, name);
}

describe('i18n: metric explanations', () => {
  it('have Arabic for every text in the translated areas or docs files', () => {
    const wanted = new Set([...DOCS_ENFORCED, ...DOCS_ENFORCE_EXTRA]);
    const inScope = (d: MetricDoc) => wanted.has('*') || wanted.has(d.area) || wanted.has(FILE_OF.get(d.id) ?? '');
    const bad: string[] = [];
    for (const d of METRICS) {
      if (!inScope(d)) continue;
      for (const s of docTexts(d)) if (!hasArabic(s)) bad.push(`${d.id}: no Arabic for "${s.slice(0, 80)}"`);
    }
    dumpMissing(METRICS.filter(inScope).flatMap((d) => docTexts(d).filter((s) => !hasArabic(s))));
    expectNone(bad);
  });
});
