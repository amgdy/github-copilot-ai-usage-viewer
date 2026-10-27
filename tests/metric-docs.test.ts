import { globSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
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

const textsOf = (metric: MetricDoc): string[] => [metric.title, metric.meaning, metric.formula, ...(metric.steps ?? []), ...(metric.notes ?? []), metric.example ?? ''];

/** Fails with one line per problem, so the message says what to fix. */
const expectNone = (problems: string[]) => expect(problems, problems.join('\n')).toEqual([]);

describe('metric docs: registry', () => {
  it('has at least one explanation', () => {
    expect(METRICS.length).toBeGreaterThan(0);
  });

  it('ids are unique and written as lower-case words joined by dashes', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const metric of METRICS) {
      if (!KEBAB.test(metric.id)) bad.push(`${metric.id}: not kebab-case`);
      if (seen.has(metric.id)) bad.push(`${metric.id}: defined twice`);
      seen.add(metric.id);
    }
    expectNone(bad);
  });

  it('every explanation has a title, a meaning and a formula, in a known area and basis', () => {
    const areas = new Set<string>(METRIC_AREAS);
    const bad: string[] = [];
    for (const metric of METRICS) {
      if (!metric.title.trim()) bad.push(`${metric.id}: empty title`);
      if (!metric.meaning.trim()) bad.push(`${metric.id}: empty meaning`);
      if (!metric.formula.trim()) bad.push(`${metric.id}: empty formula`);
      if (!areas.has(metric.area)) bad.push(`${metric.id}: unknown area "${metric.area}"`);
      if (!(metric.basis in BASIS_LABEL)) bad.push(`${metric.id}: unknown basis "${metric.basis}"`);
      const lists: [string, readonly string[] | undefined][] = [
        ['steps', metric.steps],
        ['notes', metric.notes],
        ['columns', metric.columns],
        ['settings', metric.settings],
        ['related', metric.related],
      ];
      for (const [name, list] of lists) {
        if (list && list.some((entry) => !entry.trim())) bad.push(`${metric.id}: empty entry in ${name}`);
        if (list && new Set(list).size !== list.length) bad.push(`${metric.id}: repeated entry in ${name}`);
      }
    }
    expectNone(bad);
  });

  it('related ids, settings and columns all resolve', () => {
    const bad: string[] = [];
    for (const metric of METRICS) {
      for (const relatedId of metric.related ?? []) {
        if (relatedId === metric.id) bad.push(`${metric.id}: relates to itself`);
        else if (!metricDoc(relatedId)) bad.push(`${metric.id}: related "${relatedId}" is not defined`);
      }
      for (const setting of metric.settings ?? []) if (!(setting in SETTING_REFS)) bad.push(`${metric.id}: unknown setting "${setting}"`);
      for (const columnName of metric.columns ?? []) if (!COLUMN.test(columnName)) bad.push(`${metric.id}: "${columnName}" is not a column name`);
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
    for (const metric of METRICS) {
      for (const text of textsOf(metric)) {
        const head = text.slice(0, 60);
        if (EM_DASH.test(text)) bad.push(`${metric.id}: em dash in "${head}"`);
        if (EMOJI.test(text)) bad.push(`${metric.id}: emoji in "${head}"`);
        if (text.includes('!')) bad.push(`${metric.id}: exclamation mark in "${head}"`);
        const match = BANNED_WORDS.exec(text);
        if (match) bad.push(`${metric.id}: "${match[0]}" in "${head}"`);
      }
    }
    expectNone(bad);
  });

  it('a formula is one line', () => {
    expectNone(METRICS.filter((metric) => metric.formula.includes('\n')).map((metric) => `${metric.id}: formula runs over several lines`));
  });

  it('is grouped by area in reading order and searchable', () => {
    const groups = metricsByArea();
    const order = groups.map((group) => METRIC_AREAS.indexOf(group.area));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(groups.reduce((docCount, group) => docCount + group.docs.length, 0)).toBe(METRICS.length);
    expect(searchMetrics('')).toHaveLength(METRICS.length);
    const hits = searchMetrics('auto discount');
    expect(hits.map((metric) => metric.id)).toContain('auto-discount');
    expect(searchMetrics('zzzz-not-a-word')).toEqual([]);
  });

  it('explains the Auto discount, the token split and the seat rules', () => {
    for (const id of ['auto-share', 'auto-discount', 'auto-original-price', 'auto-plan-rate', 'auto-missed', 'auto-use-class']) expect(metricDoc(id), id).toBeDefined();
    for (const id of ['tokens-input', 'tokens-cache-read', 'tokens-cache-write', 'tokens-output', 'cache-hit']) expect(metricDoc(id), id).toBeDefined();
    for (const id of ['seat-idle', 'seat-downgrade', 'seat-unused']) expect(metricDoc(id), id).toBeDefined();
  });
});

// ---- Source scan: the pages must point at explanations that exist -------------------------------

const SOURCE_DIR = join(import.meta.dirname, '..', 'src');
const REQUIRES_CALC = new Set(['Kpi', 'ChartCard']);

/**
 * Where a <Kpi> or a <ChartCard> without `calc` is an error. A page is added here when its explanations are done.
 * An id that is written in the source but not defined is an error everywhere.
 */
const COVERAGE_ENFORCED = ['pages/', 'components/'];

/** While a page is being finished, run `METRIC_DOCS_ENFORCE=pages/users/,components/user/ npx vitest run tests/metric-docs.test.ts` to check it. */
const ENFORCE_EXTRA = (process.env.METRIC_DOCS_ENFORCE ?? '')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);

interface AstNode {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
}

const isNode = (value: unknown): value is AstNode => typeof value === 'object' && value !== null && typeof (value as AstNode).type === 'string';

function childrenOf(node: AstNode): AstNode[] {
  const out: AstNode[] = [];
  for (const [key, value] of Object.entries(node)) {
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
function idsOf(node: unknown): string[] {
  if (!isNode(node)) return [];
  switch (node.type) {
    case 'Literal':
      return typeof node.value === 'string' ? [node.value] : [];
    case 'TemplateLiteral': {
      const quasis = node.quasis as { value: { cooked?: string | null } }[];
      const expressions = node.expressions as unknown[];
      const cooked = quasis[0]?.value.cooked;
      return expressions.length === 0 && quasis.length === 1 && cooked ? [cooked] : [];
    }
    case 'ArrayExpression':
      return (node.elements as unknown[]).flatMap(idsOf);
    case 'ConditionalExpression':
      return [...idsOf(node.consequent), ...idsOf(node.alternate)];
    case 'LogicalExpression':
      return [...idsOf(node.left), ...idsOf(node.right)];
    case 'JSXExpressionContainer':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'ParenthesizedExpression':
      return idsOf(node.expression);
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

/** Every TypeScript source file under src, as paths relative to src. */
const sourceFiles = (): string[] => globSync('**/*.{ts,tsx}', { cwd: SOURCE_DIR }).filter((file) => !file.endsWith('.d.ts')).sort();

function scan() {
  const uses: Use[] = [];
  const gaps: Gap[] = [];
  const parseErrors: string[] = [];

  for (const entry of sourceFiles()) {
    const path = join(SOURCE_DIR, entry);
    const file = entry.split(sep).join('/');
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

    const lineOf = (node: AstNode) => text.slice(0, node.start).split('\n').length;
    const fileUses: Use[] = [];
    let charts = 0;
    let firstChartLine = 0;

    const visit = (node: AstNode) => {
      if (node.type === 'JSXOpeningElement') {
        const nameNode = node.name as AstNode;
        const tag = nameNode.type === 'JSXIdentifier' ? (nameNode.name as string) : '';
        const attributes = node.attributes as AstNode[];
        const attributeNamed = (name: string) => attributes.find((attribute) => attribute.type === 'JSXAttribute' && (attribute.name as AstNode).name === name);
        const valueIds = (attribute: AstNode | undefined) => idsOf(attribute?.value);

        const calcAttribute = attributeNamed('calc');
        if (calcAttribute) fileUses.push({ file, line: lineOf(node), ids: valueIds(calcAttribute) });
        if (tag === 'CalcInfo' || tag === 'CalcLine') {
          const id = attributeNamed('id');
          if (id) fileUses.push({ file, line: lineOf(node), ids: valueIds(id) });
        }
        const hasSpread = attributes.some((attribute) => attribute.type === 'JSXSpreadAttribute');
        if (REQUIRES_CALC.has(tag) && !calcAttribute && !hasSpread) gaps.push({ file, line: lineOf(node), what: `<${tag}> has no calc` });
        if (tag === 'EChart' && !file.startsWith('components/ui/') && !file.startsWith('components/charts/')) {
          charts++;
          firstChartLine ||= lineOf(node);
        }
      }
      if (node.type === 'Property' && !node.computed) {
        const key = node.key as AstNode;
        if ((key.type === 'Identifier' && key.name === 'calc') || (key.type === 'Literal' && key.value === 'calc')) {
          fileUses.push({ file, line: lineOf(node), ids: idsOf(node.value) });
        }
      }
      for (const child of childrenOf(node)) visit(child);
    };
    visit(program);

    // A chart drawn without the shared card still needs an explanation somewhere in its file.
    if (charts > 0 && fileUses.length === 0) gaps.push({ file, line: firstChartLine, what: '<EChart> in a file without any calc' });
    uses.push(...fileUses);
  }
  return { uses, gaps, parseErrors };
}

const SCAN = scan();
const enforced = (file: string) => [...COVERAGE_ENFORCED, ...ENFORCE_EXTRA].some((path) => (path.endsWith('/') ? file.startsWith(path) : file === path));

describe('metric docs: pages', () => {
  it('reads every source file (the scan works)', () => {
    expectNone(SCAN.parseErrors);
    expect(SCAN.uses.length).toBeGreaterThan(10);
    expect(SCAN.uses.some((use) => use.file === 'pages/OverviewPage.tsx')).toBe(true);
  });

  it('every id written as calc or CalcInfo resolves to an explanation', () => {
    const bad = SCAN.uses.flatMap((use) => use.ids.filter((id) => !metricDoc(id)).map((id) => `${use.file}:${use.line}: "${id}" is not defined`));
    expectNone(bad);
  });

  it('the finished pages explain every Kpi and every chart', () => {
    const bad = SCAN.gaps.filter((gap) => enforced(gap.file)).map((gap) => `${gap.file}:${gap.line}: ${gap.what}`);
    expectNone(bad);
  });

  it('the Overview explains the Auto discount', () => {
    const ids = new Set(SCAN.uses.filter((use) => enforced(use.file)).flatMap((use) => use.ids));
    for (const id of ['auto-share', 'auto-discount', 'auto-original-price', 'auto-missed', 'auto-use-class']) expect(ids.has(id), id).toBe(true);
  });
});
