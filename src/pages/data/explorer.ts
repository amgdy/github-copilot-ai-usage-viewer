import type { CalcRef } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { DataStore, DimKey } from '../../lib/types';
import { isoDate } from '../../lib/utils/date';
import { fmtInt, fmtNum, fmtUSD } from '../../lib/utils/format';

export type ColumnId =
  | 'date'
  | 'user'
  | 'product'
  | 'sku'
  | 'model'
  | 'auto'
  | 'qty'
  | 'gross'
  | 'discount'
  | 'net'
  | 'quota'
  | 'org'
  | 'costCenter'
  | 'repo'
  | 'app'
  | 'input'
  | 'output'
  | 'cacheRead'
  | 'cacheWrite'
  | 'file';

export interface ExplorerColumn {
  id: ColumnId;
  header: string;
  numeric: boolean;
  /** Dictionary-encoded column. */
  dim?: DimKey;
  /** Only available when the data has token columns. */
  tokens?: boolean;
  hiddenByDefault?: boolean;
  /** Tooltip of the header: the column of the file the values come from. */
  hint?: string;
  /** Id of the explanation of what the values mean. */
  calc?: CalcRef;
}

export const EXPLORER_COLUMNS: ExplorerColumn[] = [
  { id: 'date', header: msg('Date'), numeric: false },
  { id: 'user', header: msg('User'), numeric: false, dim: 'user' },
  { id: 'product', header: msg('Product'), numeric: false, dim: 'product' },
  { id: 'sku', header: msg('SKU'), numeric: false, dim: 'sku' },
  { id: 'model', header: msg('Model'), numeric: false, dim: 'model' },
  {
    id: 'auto',
    header: msg('Auto'),
    numeric: false,
    hint: msg('Yes when the model in the file is written as Auto: followed by a model name, or just as Auto. The Model column shows the name without the prefix.'),
    calc: 'auto-share',
  },
  { id: 'qty', header: msg('AI credits'), numeric: true, hint: msg('The quantity column of the file: AI credits used on the row.'), calc: 'ai-credit' },
  { id: 'gross', header: msg('Usage'), numeric: true, hint: msg('The gross_amount column of the file: the usage on the row, in dollars.'), calc: 'usage' },
  {
    id: 'discount',
    header: msg('Covered'),
    numeric: true,
    hint: msg('The discount_amount column of the file: the part of usage covered by included credits.'),
    calc: 'covered',
  },
  { id: 'net', header: msg('Billed'), numeric: true, hint: msg('The net_amount column of the file: the part of usage billed on top of seats.'), calc: 'billed' },
  {
    id: 'quota',
    header: msg('Seat size'),
    numeric: true,
    hint: msg('The total_monthly_quota column of the file: the credits included in the seat each month.'),
    calc: 'data-seat-size',
  },
  { id: 'org', header: msg('Organization'), numeric: false, dim: 'org' },
  { id: 'costCenter', header: msg('Cost center'), numeric: false, dim: 'costCenter' },
  { id: 'repo', header: msg('Repository'), numeric: false, dim: 'repo' },
  { id: 'app', header: msg('App'), numeric: false, dim: 'app' },
  { id: 'input', header: msg('Input tokens'), numeric: true, tokens: true, hint: msg('The input column of the file.'), calc: 'tokens-input' },
  { id: 'output', header: msg('Output tokens'), numeric: true, tokens: true, hint: msg('The output column of the file.'), calc: 'tokens-output' },
  { id: 'cacheRead', header: msg('Cache read tokens'), numeric: true, tokens: true, hint: msg('The cache_read column of the file.'), calc: 'tokens-cache-read' },
  { id: 'cacheWrite', header: msg('Cache write tokens'), numeric: true, tokens: true, hint: msg('The cache_write column of the file.'), calc: 'tokens-cache-write' },
  { id: 'file', header: msg('Source file'), numeric: false, dim: 'file', hiddenByDefault: true },
];

export function availableColumns(store: DataStore): ExplorerColumn[] {
  return EXPLORER_COLUMNS.filter((column) => !column.tokens || store.hasTokens);
}

type NumericId = 'qty' | 'gross' | 'discount' | 'net' | 'quota' | 'input' | 'output' | 'cacheRead' | 'cacheWrite';

const dayText = new Map<number, string>();
function isoDay(day: number): string {
  let text = dayText.get(day);
  if (text === undefined) {
    text = isoDate(day);
    dayText.set(day, text);
  }
  return text;
}

export interface Cell {
  text: string;
  /** Exact value for numeric cells, shown on hover. */
  title?: string;
  /** Dictionary id for dimension cells. */
  id?: number;
}

export function cell(store: DataStore, column: ExplorerColumn, row: number): Cell {
  if (column.dim) {
    const id = store[column.dim][row];
    return { text: store.dicts[column.dim].values[id], id };
  }
  switch (column.id) {
    case 'date':
      return { text: isoDay(store.day[row]) };
    case 'auto':
      return { text: store.auto[row] ? t('Yes') : t('No') };
    case 'qty': {
      const quantity = store.qty[row];
      return { text: fmtNum(quantity, 4), title: String(quantity) };
    }
    case 'gross':
    case 'discount':
    case 'net': {
      const amount = store[column.id][row];
      return { text: fmtUSD(amount, 4), title: String(amount) };
    }
    default: {
      const value = store[column.id as NumericId][row];
      return { text: fmtInt(value), title: String(value) };
    }
  }
}

/** Indices of the rows to show, in store order. Counts first so the array is allocated once. */
export function scopeIndices(rowCount: number, mask: Uint8Array | null): Uint32Array {
  if (!mask) {
    const all = new Uint32Array(rowCount);
    for (let i = 0; i < rowCount; i++) all[i] = i;
    return all;
  }
  let selectedCount = 0;
  for (let i = 0; i < rowCount; i++) if (mask[i] !== 0) selectedCount++;
  const out = new Uint32Array(selectedCount);
  let outIndex = 0;
  for (let i = 0; i < rowCount; i++) if (mask[i] !== 0) out[outIndex++] = i;
  return out;
}

export const MAX_TERMS = 8;
const SEARCH_DIMS = ['user', 'model', 'repo', 'sku', 'org', 'costCenter'] as const;

export function parseQuery(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(Boolean).slice(0, MAX_TERMS);
}

/**
 * Keeps the rows where every term appears in the user, model, repository, SKU, organization or cost center.
 * Each dictionary is matched once (one bit per term and value), so the row scan is a handful of table lookups.
 */
export function filterByQuery(store: DataStore, rows: Uint32Array, terms: string[]): Uint32Array {
  if (!terms.length) return rows;
  const termCount = terms.length;
  const full = (1 << termCount) - 1;
  const bitsFor = (values: string[]): Uint8Array => {
    const bits = new Uint8Array(values.length);
    for (let id = 0; id < values.length; id++) {
      const lowerValue = values[id].toLowerCase();
      let matchBits = 0;
      for (let k = 0; k < termCount; k++) if (lowerValue.includes(terms[k])) matchBits |= 1 << k;
      bits[id] = matchBits;
    }
    return bits;
  };
  const [user, model, repo, sku, org, costCenter] = SEARCH_DIMS.map((dimension) => bitsFor(store.dicts[dimension].values));
  let autoBits = 0;
  for (let k = 0; k < termCount; k++) if ('auto'.includes(terms[k])) autoBits |= 1 << k;

  const { user: userIds, model: modelIds, repo: repoIds, sku: skuIds, org: orgIds, costCenter: costCenterIds, auto } = store;
  const out = new Uint32Array(rows.length);
  let matchCount = 0;
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    const bits = user[userIds[row]] | model[modelIds[row]] | repo[repoIds[row]] | sku[skuIds[row]] | org[orgIds[row]] | costCenter[costCenterIds[row]] | (auto[row] ? autoBits : 0);
    if ((bits & full) === full) out[matchCount++] = row;
  }
  return out.slice(0, matchCount);
}

export interface Sums {
  gross: number;
  discount: number;
  net: number;
}

export function sumRows(store: DataStore, rows: Uint32Array): Sums {
  const { gross: grossAmounts, discount: discountAmounts, net: netAmounts } = store;
  let gross = 0;
  let discount = 0;
  let net = 0;
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    gross += grossAmounts[row];
    discount += discountAmounts[row];
    net += netAmounts[row];
  }
  return { gross, discount, net };
}

/** Stable counting sort of `rows` by a small-range integer key. */
function countingSort(rows: Uint32Array, ids: ArrayLike<number>, shift: number, rank: Int32Array | null, buckets: number): Uint32Array {
  const counts = new Uint32Array(buckets + 1);
  for (let j = 0; j < rows.length; j++) {
    const key = ids[rows[j]] - shift;
    counts[(rank ? rank[key] : key) + 1]++;
  }
  for (let bucket = 0; bucket < buckets; bucket++) counts[bucket + 1] += counts[bucket];
  const out = new Uint32Array(rows.length);
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    const key = ids[row] - shift;
    out[counts[rank ? rank[key] : key]++] = row;
  }
  return out;
}

/** Position of each dictionary id when the values are ordered case-insensitively; the blank value goes last. */
function dictRanks(values: string[]): Int32Array {
  const order = values.map((_, id) => id);
  const lower = values.map((value) => value.toLowerCase());
  order.sort((a, b) => {
    if (lower[a] === lower[b]) return a - b;
    if (lower[a] === '') return 1;
    if (lower[b] === '') return -1;
    return lower[a] < lower[b] ? -1 : 1;
  });
  const rank = new Int32Array(values.length);
  for (let position = 0; position < order.length; position++) rank[order[position]] = position;
  return rank;
}

/** A copy of `rows` ordered ascending by the column. Ties keep store order. */
export function sortAscending(store: DataStore, rows: Uint32Array, columnId: ColumnId): Uint32Array {
  if (columnId === 'date') return countingSort(rows, store.day, store.minDay, null, store.maxDay - store.minDay + 1);
  if (columnId === 'auto') return countingSort(rows, store.auto, 0, null, 2);
  const meta = EXPLORER_COLUMNS.find((column) => column.id === columnId);
  if (meta?.dim) {
    const values = store.dicts[meta.dim].values;
    return countingSort(rows, store[meta.dim], 0, dictRanks(values), values.length);
  }
  const columnValues = store[columnId as NumericId];
  return rows.slice().sort((a, b) => {
    const valueA = columnValues[a];
    const valueB = columnValues[b];
    return valueA < valueB ? -1 : valueA > valueB ? 1 : a - b;
  });
}

/** Row indices of one page. `reverse` reads the ordered array from its end. */
export function pageRows(rows: Uint32Array, reverse: boolean, start: number, size: number): number[] {
  const end = Math.min(rows.length, start + size);
  const out: number[] = [];
  for (let k = start; k < end; k++) out.push(rows[reverse ? rows.length - 1 - k : k]);
  return out;
}
