import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAst } from 'vite';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const CODE_FILES = ['src/**/*.{ts,tsx}', 'tests/**/*.ts', 'scripts/**/*.ts', 'vite.config.ts'];

/**
 * Short forms that make a reader stop and guess. Write the full words instead.
 * Plain words (out, pick, spec), standard terms (html, iso, sku) and project words (calc, doc, lens) stay allowed.
 */
const UNCLEAR_NAMES = new Set([
  'ab', 'acc', 'act', 'agg', 'aggs', 'al', 'an', 'AR', 'ar', 'arr', 'as', 'attr', 'au', 'av', 'avg', 'bb', 'bg', 'bi',
  'bn', 'bom', 'btn', 'buf', 'cat', 'cb', 'cc', 'ccs', 'cd', 'cfg', 'cg', 'ch', 'ci', 'cls', 'cn', 'cnt', 'col', 'conc',
  'cov', 'cr', 'ctrl', 'Ctx', 'ctx', 'cum', 'cur', 'curr', 'cv', 'cw', 'cx', 'dc', 'dd', 'def', 'defs', 'deps', 'desc',
  'dev', 'di', 'dict', 'dim', 'dims', 'dk', 'doe', 'DOW', 'dow', 'doy', 'ds', 'dsc', 'dst', 'dt', 'dup', 'ed', 'el',
  'elem', 'els', 'em', 'en', 'eng', 'ENT', 'ent', 'err', 'esc', 'est', 'ev', 'evt', 'ey', 'fa', 'fb', 'fc', 'feb', 'fmt',
  'fn', 'fns', 'frac', 'freq', 'ge', 'getP', 'gid', 'grp', 'hay', 'hdr', 'hi', 'hm', 'ia', 'ib', 'idA', 'idB', 'idx',
  'inp', 'int', 'it', 'ix', 'ks', 'kv', 'kvs', 'la', 'lb', 'lc', 'le', 'len', 'lhs', 'lic', 'lin', 'lo', 'mad', 'mb',
  'mc', 'md', 'meas', 'med', 'mg', 'mi', 'mk', 'mm', 'mn', 'mo', 'mod', 'mods', 'MON', 'mp', 'mq', 'ms', 'msg', 'msgs',
  'mult', 'mx', 'nB', 'neg', 'nm', 'norm', 'nq', 'ns', 'nt', 'nu', 'num', 'obj', 'OCT', 'oct', 'of', 'opt', 'opts', 'ov',
  'PAT', 'pl', 'pm', 'pos', 'pow', 'pp', 'prep', 'proj', 'ps', 'pts', 'py', 'qs', 'qt', 'qty', 'rand', 'rc', 're', 'rec',
  'recs', 'rem', 'req', 'res', 'ret', 'rhs', 'ri', 'rng', 'rnd', 'ro', 'rs', 'rt', 'rw', 'rx', 'sb', 'sd', 'seg', 'sel',
  'sep', 'seq', 'sev', 'sm', 'SRC', 'src', 'st', 'str', 'sy', 'syn', 'tax', 'tcr', 'tcw', 'TD', 'tg', 'TH', 'thr', 'tin',
  'tk', 'tmp', 'tok', 'tol', 'tot', 'tout', 'ts', 'tx', 'tz', 'ua', 'um', 'umg', 'uniq', 'util', 'val', 'vals', 'vars',
  'vh', 'vw', 'wf', 'wk', 'ws', 'xs', 'ymd', 'yoe', 'yr', 'yv', 'yy',
]);

/** The translation helpers and the class name helper are short on purpose, and only as the functions that define them. */
const SHORT_HELPERS = new Set(['t', 'T', 'tp', 'msg', 'cx']);
/** Chart coordinates. */
const COORDINATES = new Set(['x', 'y']);
/** One to three letters and then digits, such as q0 or g8. */
const LETTERS_THEN_DIGITS = /^[A-Za-z]{1,3}\d+$/;

interface AstNode {
  type: string;
  start: number;
  [key: string]: unknown;
}

interface DeclaredName {
  name: string;
  start: number;
  role: 'variable' | 'parameter' | 'function' | 'catch';
  /** True for the counter of a classic loop: for (let i = 0; ...). */
  isLoopCounter: boolean;
  /** For a parameter, the names of all parameters of its function. */
  siblingNames: string[];
}

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'TSDeclareFunction', 'TSEmptyBodyFunctionExpression',
  'TSFunctionType', 'TSConstructorType', 'TSMethodSignature', 'TSCallSignatureDeclaration', 'TSConstructSignatureDeclaration',
]);

const isNode = (value: unknown): value is AstNode => typeof value === 'object' && value !== null && typeof (value as AstNode).type === 'string';

function childrenOf(node: AstNode): AstNode[] {
  const children: AstNode[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type') continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) children.push(item);
    } else if (isNode(value)) children.push(value);
  }
  return children;
}

/** Every name a pattern binds, such as `{ a, b: [c] }` or `value = 1`. */
function boundNames(pattern: unknown): AstNode[] {
  if (!isNode(pattern)) return [];
  switch (pattern.type) {
    case 'Identifier':
      return [pattern];
    case 'AssignmentPattern':
      return boundNames(pattern.left);
    case 'RestElement':
      return boundNames(pattern.argument);
    case 'TSParameterProperty':
      return boundNames(pattern.parameter);
    case 'ArrayPattern':
      return (pattern.elements as unknown[]).flatMap(boundNames);
    case 'ObjectPattern':
      return (pattern.properties as AstNode[]).flatMap((property) => boundNames(property.type === 'Property' ? property.value : property));
    default:
      return [];
  }
}

function declaredNames(program: AstNode): DeclaredName[] {
  const declared: DeclaredName[] = [];
  const add = (identifiers: AstNode[], role: DeclaredName['role'], isLoopCounter = false, siblingNames: string[] = []) => {
    for (const identifier of identifiers) {
      declared.push({ name: identifier.name as string, start: identifier.start, role, isLoopCounter, siblingNames });
    }
  };
  const visit = (node: AstNode, parent: AstNode | undefined, grandparent: AstNode | undefined) => {
    if (node.type === 'VariableDeclarator') {
      add(boundNames(node.id), 'variable', grandparent?.type === 'ForStatement' && grandparent.init === parent);
    } else if (node.type === 'CatchClause') {
      add(boundNames(node.param), 'catch');
    } else if (FUNCTION_TYPES.has(node.type)) {
      if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && isNode(node.id)) add([node.id], 'function');
      const parameters = ((node.params ?? node.parameters ?? []) as unknown[]).flatMap(boundNames);
      add(parameters, 'parameter', false, parameters.map((parameter) => parameter.name as string));
    }
    for (const child of childrenOf(node)) visit(child, node, parent);
  };
  visit(program, undefined, undefined);
  return declared;
}

function isAllowed({ name, role, isLoopCounter, siblingNames }: DeclaredName): boolean {
  if (name.startsWith('_')) return true;
  if (SHORT_HELPERS.has(name)) return role === 'function';
  if (COORDINATES.has(name)) return true;
  if (name.length === 1) {
    if (['i', 'j', 'k'].includes(name)) return isLoopCounter;
    // A sort comparator or reducer with exactly the two parameters a and b.
    if (name === 'a' || name === 'b') return role === 'parameter' && siblingNames.join(',') === 'a,b';
    return false;
  }
  return !UNCLEAR_NAMES.has(name) && !LETTERS_THEN_DIGITS.test(name);
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index++) if (text.charCodeAt(index) === 10) line++;
  return line;
}

function unclearNamesIn(text: string, path: string): string[] {
  const program = parseAst(text, { lang: path.endsWith('.tsx') ? 'tsx' : 'ts' }, path) as unknown as AstNode;
  return declaredNames(program)
    .filter((use) => !isAllowed(use))
    .map((use) => `${path}:${lineOf(text, use.start)} ${use.name}`);
}

describe('readable names', () => {
  it('flags short and unclear names, and allows the agreed exceptions', () => {
    const sample = [
      'const e = 1;',
      'let cfg = {};',
      'const q0 = 2;',
      'for (let i = 0; i < 3; i++) {}',
      'for (const k of [1]) {}',
      '[2, 1].sort((a, b) => a - b);',
      'function f(cb: () => void, { x, y }: { x: number; y: number }) {}',
      'type Handler = (v: string) => void;',
      'try {} catch (err) {}',
      'const t = (column: number[]) => column.length;',
      'export function cx(...parts: string[]) { return parts.join(" "); }',
      'const _unused = 0;',
      'const total = 3;',
    ].join('\n');
    expect(unclearNamesIn(sample, 'sample.ts').map((entry) => entry.split(' ')[1])).toEqual(['e', 'cfg', 'q0', 'k', 'f', 'cb', 'v', 'err', 't']);
  });

  it('uses clear names for variables, parameters and functions in the code, tests and scripts', () => {
    const files = globSync(CODE_FILES, { cwd: ROOT }).sort();
    expect(files.length).toBeGreaterThan(300);
    const unclear = files.flatMap((file) => unclearNamesIn(readFileSync(join(ROOT, file), 'utf8'), file.split('\\').join('/')));
    expect(unclear).toEqual([]);
  });
});
