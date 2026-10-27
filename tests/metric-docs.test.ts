import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'vite';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/lib/analytics/settings';
import { METRICS, metricDoc, metricsByArea, searchMetrics } from '../src/lib/metrics/registry';
import { SETTING_REFS, describeSetting } from '../src/lib/metrics/settingRefs';
import { BASIS_LABEL, METRIC_AREAS, type MetricDoc } from '../src/lib/metrics/types';

/**
 * Every number in the report explains how it was calculated. These tests keep that true:
 * the explanations are complete and consistent, and the pages point at explanations that exist.
 */

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COLUMN = /^[a-z][a-z0-9_]*$/;
const EM_DASH = /\u2014/;
const EMOJI = /\p{Extended_Pictographic}/u;
const BANNED_WORDS = /\b(seamless|seamlessly|leverage|leverages|unlock|robust|cutting-edge|game-changing|delve)\b/i;

const textsOf = (d: MetricDoc): string[] => [d.title, d.meaning, d.formula, ...(d.steps ?? []), ...(d.notes ?? []), d.example ?? ''];

/** Fails with one line per problem, so the message says what to fix. */
const expectNone = (problems: string[]) => expect(problems, problems.join('\n')).toEqual([]);

describe('metric docs: registry', () => {
  it('has at least one explanation', () => {
    expect(METRICS.length).toBeGreaterThan(0);
  });

  it('ids are unique and written as lower-case words joined by dashes', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const d of METRICS) {
      if (!KEBAB.test(d.id)) bad.push(`${d.id}: not kebab-case`);
      if (seen.has(d.id)) bad.push(`${d.id}: defined twice`);
      seen.add(d.id);
    }
    expectNone(bad);
  });

  it('every explanation has a title, a meaning and a formula, in a known area and basis', () => {
    const areas = new Set<string>(METRIC_AREAS);
    const bad: string[] = [];
    for (const d of METRICS) {
      if (!d.title.trim()) bad.push(`${d.id}: empty title`);
      if (!d.meaning.trim()) bad.push(`${d.id}: empty meaning`);
      if (!d.formula.trim()) bad.push(`${d.id}: empty formula`);
      if (!areas.has(d.area)) bad.push(`${d.id}: unknown area "${d.area}"`);
      if (!(d.basis in BASIS_LABEL)) bad.push(`${d.id}: unknown basis "${d.basis}"`);
      const lists: [string, readonly string[] | undefined][] = [
        ['steps', d.steps],
        ['notes', d.notes],
        ['columns', d.columns],
        ['settings', d.settings],
        ['related', d.related],
      ];
      for (const [name, list] of lists) {
        if (list && list.some((x) => !x.trim())) bad.push(`${d.id}: empty entry in ${name}`);
        if (list && new Set(list).size !== list.length) bad.push(`${d.id}: repeated entry in ${name}`);
      }
    }
    expectNone(bad);
  });

  it('related ids, settings and columns all resolve', () => {
    const bad: string[] = [];
    for (const d of METRICS) {
      for (const r of d.related ?? []) {
        if (r === d.id) bad.push(`${d.id}: relates to itself`);
        else if (!metricDoc(r)) bad.push(`${d.id}: related "${r}" is not defined`);
      }
      for (const s of d.settings ?? []) if (!(s in SETTING_REFS)) bad.push(`${d.id}: unknown setting "${s}"`);
      for (const c of d.columns ?? []) if (!COLUMN.test(c)) bad.push(`${d.id}: "${c}" is not a column name`);
    }
    expectNone(bad);
  });

  it('every setting has a label and a readable value', () => {
    for (const key of Object.keys(SETTING_REFS) as (keyof typeof SETTING_REFS)[]) {
      const { label, value } = describeSetting(key, DEFAULT_SETTINGS);
      expect(label.trim(), key).not.toBe('');
      expect(value.trim(), key).not.toBe('');
      expect(value, key).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('text has no em dashes, emojis, exclamation marks or marketing words', () => {
    const bad: string[] = [];
    for (const d of METRICS) {
      for (const t of textsOf(d)) {
        const head = t.slice(0, 60);
        if (EM_DASH.test(t)) bad.push(`${d.id}: em dash in "${head}"`);
        if (EMOJI.test(t)) bad.push(`${d.id}: emoji in "${head}"`);
        if (t.includes('!')) bad.push(`${d.id}: exclamation mark in "${head}"`);
        const m = BANNED_WORDS.exec(t);
        if (m) bad.push(`${d.id}: "${m[0]}" in "${head}"`);
      }
    }
    expectNone(bad);
  });

  it('a formula is one line', () => {
    expectNone(METRICS.filter((d) => d.formula.includes('\n')).map((d) => `${d.id}: formula runs over several lines`));
  });

  it('is grouped by area in reading order and searchable', () => {
    const groups = metricsByArea();
    const order = groups.map((g) => METRIC_AREAS.indexOf(g.area));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(groups.reduce((n, g) => n + g.docs.length, 0)).toBe(METRICS.length);
    expect(searchMetrics('')).toHaveLength(METRICS.length);
    const hits = searchMetrics('auto discount');
    expect(hits.map((d) => d.id)).toContain('auto-discount');
    expect(searchMetrics('zzzz-not-a-word')).toEqual([]);
  });

  it('explains the Auto discount, the token split and the seat rules', () => {
    for (const id of ['auto-share', 'auto-discount', 'auto-original-price', 'auto-plan-rate', 'auto-missed', 'auto-use-class']) expect(metricDoc(id), id).toBeDefined();
    for (const id of ['tokens-input', 'tokens-cache-read', 'tokens-cache-write', 'tokens-output', 'cache-hit']) expect(metricDoc(id), id).toBeDefined();
    for (const id of ['seat-idle', 'seat-downgrade', 'seat-unused']) expect(metricDoc(id), id).toBeDefined();
  });
});

// ---- Source scan: the pages must point at explanations that exist -------------------------------

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const REQUIRES_CALC = new Set(['Kpi', 'ChartCard']);

/**
 * Where a <Kpi> or a <ChartCard> without `calc` is an error. A page is added here when its explanations are done.
 * An id that is written in the source but not defined is an error everywhere.
 */
const COVERAGE_ENFORCED = ['pages/', 'components/'];

/** While a page is being finished, run `METRIC_DOCS_ENFORCE=pages/users/,components/user/ npx vitest run tests/metric-docs.test.ts` to check it. */
const ENFORCE_EXTRA = (process.env.METRIC_DOCS_ENFORCE ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

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
    } else if (isNode(value)) {
      out.push(value);
    }
  }
  return out;
}

/** The ids an expression can evaluate to, when it is built from string literals, arrays and conditions only. */
function idsOf(e: unknown): string[] {
  if (!isNode(e)) return [];
  switch (e.type) {
    case 'Literal':
      return typeof e.value === 'string' ? [e.value] : [];
    case 'TemplateLiteral': {
      const quasis = e.quasis as { value: { cooked?: string | null } }[];
      const expressions = e.expressions as unknown[];
      const cooked = quasis[0]?.value.cooked;
      return expressions.length === 0 && quasis.length === 1 && cooked ? [cooked] : [];
    }
    case 'ArrayExpression':
      return (e.elements as unknown[]).flatMap(idsOf);
    case 'ConditionalExpression':
      return [...idsOf(e.consequent), ...idsOf(e.alternate)];
    case 'LogicalExpression':
      return [...idsOf(e.left), ...idsOf(e.right)];
    case 'JSXExpressionContainer':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'ParenthesizedExpression':
      return idsOf(e.expression);
    default:
      return [];
  }
}

interface Use {
  file: string;
  line: number;
  ids: string[];
}

interface Gap {
  file: string;
  line: number;
  what: string;
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
  const uses: Use[] = [];
  const gaps: Gap[] = [];
  const parseErrors: string[] = [];

  for (const path of walkDir(SRC)) {
    const file = relative(SRC, path).split(sep).join('/');
    if (file.startsWith('lib/metrics/docs/')) continue;
    const text = readFileSync(path, 'utf8');
    if (!/calc|Calc|EChart|Kpi|ChartCard/.test(text)) continue;

    let program: AstNode;
    try {
      program = parseAst(text, { lang: path.endsWith('.tsx') ? 'tsx' : 'ts' }, path) as unknown as AstNode;
    } catch (error) {
      parseErrors.push(`${file}: ${String(error).slice(0, 120)}`);
      continue;
    }

    const lineOf = (n: AstNode) => text.slice(0, n.start).split('\n').length;
    const fileUses: Use[] = [];
    let charts = 0;
    let firstChartLine = 0;

    const visit = (n: AstNode) => {
      if (n.type === 'JSXOpeningElement') {
        const nameNode = n.name as AstNode;
        const tag = nameNode.type === 'JSXIdentifier' ? (nameNode.name as string) : '';
        const attributes = n.attributes as AstNode[];
        const attr = (name: string) => attributes.find((a) => a.type === 'JSXAttribute' && (a.name as AstNode).name === name);
        const valueIds = (a: AstNode | undefined) => idsOf(a?.value);

        const calc = attr('calc');
        if (calc) fileUses.push({ file, line: lineOf(n), ids: valueIds(calc) });
        if (tag === 'CalcInfo' || tag === 'CalcLine') {
          const id = attr('id');
          if (id) fileUses.push({ file, line: lineOf(n), ids: valueIds(id) });
        }
        const hasSpread = attributes.some((a) => a.type === 'JSXSpreadAttribute');
        if (REQUIRES_CALC.has(tag) && !calc && !hasSpread) gaps.push({ file, line: lineOf(n), what: `<${tag}> has no calc` });
        if (tag === 'EChart' && !file.startsWith('components/ui/') && !file.startsWith('components/charts/')) {
          charts++;
          firstChartLine ||= lineOf(n);
        }
      }
      if (n.type === 'Property' && !n.computed) {
        const key = n.key as AstNode;
        if ((key.type === 'Identifier' && key.name === 'calc') || (key.type === 'Literal' && key.value === 'calc')) {
          fileUses.push({ file, line: lineOf(n), ids: idsOf(n.value) });
        }
      }
      for (const child of childrenOf(n)) visit(child);
    };
    visit(program);

    // A chart drawn without the shared card still needs an explanation somewhere in its file.
    if (charts > 0 && fileUses.length === 0) gaps.push({ file, line: firstChartLine, what: '<EChart> in a file without any calc' });
    uses.push(...fileUses);
  }
  return { uses, gaps, parseErrors };
}

const SCAN = scan();
const enforced = (file: string) => [...COVERAGE_ENFORCED, ...ENFORCE_EXTRA].some((p) => (p.endsWith('/') ? file.startsWith(p) : file === p));

describe('metric docs: pages', () => {
  it('reads every source file (the scan works)', () => {
    expectNone(SCAN.parseErrors);
    expect(SCAN.uses.length).toBeGreaterThan(10);
    expect(SCAN.uses.some((u) => u.file === 'pages/OverviewPage.tsx')).toBe(true);
  });

  it('every id written as calc or CalcInfo resolves to an explanation', () => {
    const bad = SCAN.uses.flatMap((u) => u.ids.filter((id) => !metricDoc(id)).map((id) => `${u.file}:${u.line}: "${id}" is not defined`));
    expectNone(bad);
  });

  it('the finished pages explain every Kpi and every chart', () => {
    const bad = SCAN.gaps.filter((g) => enforced(g.file)).map((g) => `${g.file}:${g.line}: ${g.what}`);
    expectNone(bad);
  });

  it('the Overview explains the Auto discount', () => {
    const ids = new Set(SCAN.uses.filter((u) => enforced(u.file)).flatMap((u) => u.ids));
    for (const id of ['auto-share', 'auto-discount', 'auto-original-price', 'auto-missed', 'auto-use-class']) expect(ids.has(id), id).toBe(true);
  });
});
