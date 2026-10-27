import { CARD_SOURCE_MARKDOWN, makeCardLookup, PRICE_CARD, type CardEntry, type Rates, type Vendor } from './card.ts';
import type { ModelOverride, ModelOverrides } from './models.ts';

/**
 * Reads the GitHub Docs "Models and pricing for GitHub Copilot" page (the Markdown version) and turns its
 * price tables into price card entries, so the app can compare its built-in card with the live page.
 */

type Tier = CardEntry['category'];

export interface LiveModel {
  name: string;
  vendor: Vendor;
  /** Missing when the page uses a category the app does not know. */
  category?: Tier;
  base: Rates;
  long?: Rates;
  longThreshold?: number;
  /** Release status as written on the page, for example "GA" or "Public preview". */
  status?: string;
  /** Footnote text attached to the model name, for example a promotional price end date. */
  note?: string;
}

export interface LivePriceCard {
  models: LiveModel[];
  /** Rows the parser could not read. Each line says what was skipped and why. */
  warnings: string[];
}

const VENDOR_HEADINGS: [RegExp, Vendor][] = [
  [/openai/i, 'OpenAI'],
  [/anthropic/i, 'Anthropic'],
  [/google|gemini/i, 'Google'],
  [/microsoft/i, 'Microsoft'],
  [/\bxai\b/i, 'xAI'],
  [/moonshot|kimi/i, 'Moonshot'],
];

const CATEGORY_NAMES: Record<string, Tier> = { powerful: 'Powerful', versatile: 'Versatile', lightweight: 'Lightweight' };

type Column = 'model' | 'status' | 'category' | 'tier' | 'threshold' | 'input' | 'cachedInput' | 'cacheWrite' | 'output';

function columnOf(header: string): Column | undefined {
  const h = header.toLowerCase().replace(/\s+/g, ' ').trim();
  if (h === 'model' || h === 'model name') return 'model';
  if (h.startsWith('release')) return 'status';
  if (h === 'category') return 'category';
  if (h === 'tier') return 'tier';
  if (h.startsWith('threshold')) return 'threshold';
  if (h === 'input' || h === 'input price') return 'input';
  if (h.startsWith('cached input') || h === 'cache read') return 'cachedInput';
  if (h.startsWith('cache write')) return 'cacheWrite';
  if (h === 'output' || h === 'output price') return 'output';
  return undefined;
}

function cellsOf(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

const isSeparator = (cells: string[]) => cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c));

/** "$1.75" → 1.75. "Not applicable", "-" or an empty cell → null. */
export function parsePrice(cell: string): number | null {
  const s = cell.replace(/[$,\s*`]/g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** "≤ 272K" or "> 272K" → 272000. "Not applicable" → undefined. */
export function parseThreshold(cell: string): number | undefined {
  const m = /([\d.,]+)\s*([km])?/i.exec(cell.replace(/,/g, ''));
  if (!m) return undefined;
  const n = Number(m[1]) * (m[2]?.toLowerCase() === 'm' ? 1_000_000 : m[2] ? 1_000 : 1);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

/** Removes Markdown decoration from a model cell and returns the footnote ids it points to. */
function cleanName(cell: string): { name: string; footnotes: string[] } {
  const footnotes: string[] = [];
  const name = cell
    .replace(/\[\^([^\]]+)\]/g, (_, id: string) => {
      footnotes.push(id);
      return '';
    })
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, footnotes };
}

interface Row {
  name: string;
  vendor: Vendor;
  category?: Tier;
  status?: string;
  long: boolean;
  threshold?: number;
  rates: Rates;
  footnotes: string[];
}

/** Parses the price tables. Tables without Model, Input and Output columns (for example multipliers) are ignored. */
export function parsePricingMarkdown(md: string): LivePriceCard {
  const lines = md.split(/\r?\n/);
  const warnings: string[] = [];
  const footnoteText = new Map<string, string>();
  for (const line of lines) {
    const f = /^\[\^([^\]]+)\]:\s*(.+)$/.exec(line.trim());
    if (f) footnoteText.set(f[1], f[2].trim());
  }

  const rows: Row[] = [];
  let vendor: Vendor = 'Other';
  let cols: (Column | undefined)[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const heading = /^#{2,4}\s+(.+)$/.exec(line);
    if (heading) {
      vendor = VENDOR_HEADINGS.find(([re]) => re.test(heading[1]))?.[1] ?? 'Other';
      cols = null;
      continue;
    }
    if (!line.startsWith('|')) {
      cols = null;
      continue;
    }
    const cells = cellsOf(line);
    if (!cols) {
      const next = lines[i + 1]?.trim() ?? '';
      if (!next.startsWith('|') || !isSeparator(cellsOf(next))) continue;
      const mapped = cells.map(columnOf);
      if (mapped.includes('model') && mapped.includes('input') && mapped.includes('output')) cols = mapped;
      i++;
      continue;
    }
    if (cells.every((c) => c === '')) continue;
    const get = (c: Column) => {
      const at = cols!.indexOf(c);
      return at < 0 ? '' : cells[at] ?? '';
    };
    const { name, footnotes } = cleanName(get('model'));
    if (!name) continue;
    const input = parsePrice(get('input'));
    const output = parsePrice(get('output'));
    if (input === null || output === null) {
      warnings.push(`${name}: skipped, the input or output price is not a number.`);
      continue;
    }
    const cachedInput = parsePrice(get('cachedInput'));
    if (cachedInput === null) warnings.push(`${name}: no cached input price; 0 is used.`);
    const categoryCell = get('category').toLowerCase();
    const category = CATEGORY_NAMES[categoryCell];
    if (categoryCell && !category) warnings.push(`${name}: unknown category "${get('category')}".`);
    rows.push({
      name,
      vendor,
      category,
      status: get('status') || undefined,
      long: /long/i.test(get('tier')),
      threshold: parseThreshold(get('threshold')),
      rates: { input, cachedInput: cachedInput ?? 0, cacheWrite: parsePrice(get('cacheWrite')) ?? 0, output },
      footnotes,
    });
  }

  const byName = new Map<string, LiveModel>();
  const order: string[] = [];
  for (const row of rows) {
    let m = byName.get(row.name);
    if (!m) {
      m = { name: row.name, vendor: row.vendor, category: row.category, base: row.rates, status: row.status };
      byName.set(row.name, m);
      order.push(row.name);
      if (row.long) warnings.push(`${row.name}: the long context row comes before the default row.`);
    }
    if (row.long) {
      m.long = row.rates;
      m.longThreshold = row.threshold ?? m.longThreshold;
    } else {
      m.base = row.rates;
      if (row.threshold !== undefined) m.longThreshold = row.threshold;
    }
    m.category ??= row.category;
    const notes = row.footnotes.map((id) => footnoteText.get(id)).filter((t): t is string => !!t);
    if (notes.length) m.note = notes.join(' ');
  }
  const models = order.map((n) => byName.get(n)!);
  for (const m of models) if (!m.long) delete m.longThreshold;
  return { models, warnings };
}

/** Downloads the live page as Markdown and parses it. Only public GitHub Docs content is requested; nothing is sent. */
export async function fetchLivePriceCard(signal?: AbortSignal): Promise<LivePriceCard> {
  const res = await fetch(CARD_SOURCE_MARKDOWN, { signal, credentials: 'omit', headers: { accept: 'text/markdown, text/plain' } });
  if (!res.ok) throw new Error(`GitHub Docs answered ${res.status} ${res.statusText}`.trim());
  const parsed = parsePricingMarkdown(await res.text());
  if (parsed.models.length === 0) throw new Error('No price tables were found on the GitHub Docs page.');
  return parsed;
}

export type PriceField =
  | 'category'
  | 'input'
  | 'cachedInput'
  | 'cacheWrite'
  | 'output'
  | 'longInput'
  | 'longCachedInput'
  | 'longCacheWrite'
  | 'longOutput'
  | 'longThreshold';

export interface PriceDifference {
  name: string;
  /** new: on the live page only. changed: on both with different values. missing: on the built-in card only. */
  kind: 'new' | 'changed' | 'missing';
  fields: PriceField[];
  live?: LiveModel;
  card?: CardEntry;
}

const RATE_FIELDS: [keyof Rates, PriceField, PriceField][] = [
  ['input', 'input', 'longInput'],
  ['cachedInput', 'cachedInput', 'longCachedInput'],
  ['cacheWrite', 'cacheWrite', 'longCacheWrite'],
  ['output', 'output', 'longOutput'],
];

const same = (a: number | undefined, b: number | undefined) => (a ?? 0) === (b ?? 0) || Math.abs((a ?? 0) - (b ?? 0)) < 1e-9;

/** Lists every model whose live price differs from the built-in card. Models that match are left out. */
export function compareWithCard(live: readonly LiveModel[], card: readonly CardEntry[] = PRICE_CARD): PriceDifference[] {
  const findCard = makeCardLookup(card);
  const out: PriceDifference[] = [];
  const seen = new Set<CardEntry>();
  for (const m of live) {
    const c = findCard(m.name);
    if (!c) {
      out.push({ name: m.name, kind: 'new', fields: [], live: m });
      continue;
    }
    seen.add(c);
    const fields: PriceField[] = [];
    if (m.category && m.category !== c.category) fields.push('category');
    for (const [k, baseField] of RATE_FIELDS) if (!same(m.base[k], c.base[k])) fields.push(baseField);
    for (const [k, , longField] of RATE_FIELDS) if (!same(m.long?.[k], c.long?.[k])) fields.push(longField);
    if (!same(m.longThreshold, c.longThreshold)) fields.push('longThreshold');
    if (fields.length) out.push({ name: m.name, kind: 'changed', fields, live: m, card: c });
  }
  for (const c of card) if (!seen.has(c)) out.push({ name: c.name, kind: 'missing', fields: [], card: c });
  const rank = { changed: 0, new: 1, missing: 2 } as const;
  return out.sort((a, b) => rank[a.kind] - rank[b.kind] || a.name.localeCompare(b.name));
}

/**
 * Turns live prices into Settings price overrides for the models in a report. Only models whose live price
 * differs from what the app uses today get an override; existing overrides for other models are kept.
 */
export function liveOverrides(reportModels: readonly string[], live: readonly LiveModel[], existing: ModelOverrides = {}): ModelOverrides {
  const findLive = makeCardLookup(live);
  const findCard = makeCardLookup(PRICE_CARD);
  const next: ModelOverrides = { ...existing };
  for (const name of reportModels) {
    const m = findLive(name);
    if (!m) continue;
    const c = findCard(name);
    const diff = !c || compareWithCard([m], [c]).some((d) => d.kind === 'changed');
    if (!diff) continue;
    const ov: ModelOverride = { vendor: m.vendor, base: m.base, long: m.long ?? null };
    if (m.category) ov.category = m.category;
    if (m.long && m.longThreshold) ov.longThreshold = m.longThreshold;
    next[name] = ov;
  }
  return next;
}
