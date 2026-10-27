import type { DataStore } from '../../lib/types';
import { isoDate } from '../../lib/utils/date';

/** The report's columns in their original order. aic_quantity and aic_gross_amount are not kept by the app, so they are not written. */
export const EXPORT_HEADERS = [
  'date',
  'username',
  'product',
  'sku',
  'model',
  'quantity',
  'unit_type',
  'applied_cost_per_quantity',
  'gross_amount',
  'discount_amount',
  'net_amount',
  'total_monthly_quota',
  'organization',
  'app_client_id',
  'repository',
  'cost_center_name',
] as const;

export const TOKEN_HEADERS = ['input', 'output', 'cache_read', 'cache_write'] as const;

export const CHUNK_ROWS = 20_000;

const FORMULA_START = /^[=+\-@\t\r]/;
const NEGATIVE_NUMBER = /^-(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/** A quoted CSV field. Text that a spreadsheet could run as a formula gets a leading apostrophe; plain negative numbers are left alone. */
export function csvField(text: string): string {
  const safe = FORMULA_START.test(text) && !NEGATIVE_NUMBER.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

const autoModel = (name: string): string => (name === '' || /^auto$/i.test(name) ? 'Auto' : `Auto: ${name}`);

const quoteAll = (values: string[], map: (value: string) => string = (value) => value): string[] => values.map((value) => csvField(map(value)));

const numberField = (value: number): string => (Number.isFinite(value) ? `"${value}"` : '""');

const quota = (value: number): string => {
  if (!Number.isFinite(value)) return '""';
  return `"${Number.isInteger(value) ? value : +value.toPrecision(7)}"`;
};

export interface ExportRequest {
  store: DataStore;
  /** Row indices in output order. */
  rows: Uint32Array;
  /** Write `rows` from the last entry to the first. */
  reverse?: boolean;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Builds the CSV in chunks so the page stays responsive, yielding between chunks.
 * Returns null when canceled through `signal`.
 */
export async function buildCsv({ store, rows, reverse = false, signal, onProgress }: ExportRequest): Promise<Blob | null> {
  const total = rows.length;
  const tokens = store.hasTokens;
  const header = [...EXPORT_HEADERS, ...(tokens ? TOKEN_HEADERS : [])].map(csvField).join(',');

  const span = total ? store.maxDay - store.minDay + 1 : 0;
  const days: string[] = new Array(span);
  for (let dayIndex = 0; dayIndex < span; dayIndex++) days[dayIndex] = `"${isoDate(store.minDay + dayIndex)}"`;
  const user = quoteAll(store.dicts.user.values);
  const product = quoteAll(store.dicts.product.values);
  const sku = quoteAll(store.dicts.sku.values);
  const model = quoteAll(store.dicts.model.values);
  const modelAuto = quoteAll(store.dicts.model.values, autoModel);
  const org = quoteAll(store.dicts.org.values);
  const app = quoteAll(store.dicts.app.values);
  const repo = quoteAll(store.dicts.repo.values);
  const costCenter = quoteAll(store.dicts.costCenter.values);
  const unitType = csvField('ai-credits');
  const unitPrice = '"0.01"';

  const { day, qty: quantity, gross, discount, net, input, output, cacheRead, cacheWrite, minDay } = store;
  const parts: BlobPart[] = ['\uFEFF', `${header}\n`];

  for (let start = 0; start < total; start += CHUNK_ROWS) {
    if (signal?.aborted) return null;
    const end = Math.min(total, start + CHUNK_ROWS);
    const lines: string[] = new Array(end - start);
    for (let k = start; k < end; k++) {
      const row = rows[reverse ? total - 1 - k : k];
      let line =
        days[day[row] - minDay] +
        ',' +
        user[store.user[row]] +
        ',' +
        product[store.product[row]] +
        ',' +
        sku[store.sku[row]] +
        ',' +
        (store.auto[row] ? modelAuto[store.model[row]] : model[store.model[row]]) +
        ',' +
        numberField(quantity[row]) +
        ',' +
        unitType +
        ',' +
        unitPrice +
        ',' +
        numberField(gross[row]) +
        ',' +
        numberField(discount[row]) +
        ',' +
        numberField(net[row]) +
        ',' +
        quota(store.quota[row]) +
        ',' +
        org[store.org[row]] +
        ',' +
        app[store.app[row]] +
        ',' +
        repo[store.repo[row]] +
        ',' +
        costCenter[store.costCenter[row]];
      if (tokens) line += ',' + numberField(input[row]) + ',' + numberField(output[row]) + ',' + numberField(cacheRead[row]) + ',' + numberField(cacheWrite[row]);
      lines[k - start] = line;
    }
    parts.push(new Blob([`${lines.join('\n')}\n`]));
    onProgress?.(end, total);
    await new Promise<void>((resolve) => setTimeout(resolve));
  }

  if (signal?.aborted) return null;
  return new Blob(parts, { type: 'text/csv;charset=utf-8' });
}

export function exportFileName(from: number, to: number, suffix = ''): string {
  const fromDate = isoDate(from);
  const toDate = isoDate(to);
  return `github-copilot-ai-usage-rows${suffix}_${fromDate === toDate ? fromDate : `${fromDate}_${toDate}`}.csv`;
}
