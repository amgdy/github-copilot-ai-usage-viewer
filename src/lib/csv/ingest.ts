import type { DataStore, Dict, DimKey, FileInfo } from '../types';
import { DIM_KEYS } from '../types';
import { dayFromYMD } from '../utils/date';
import { parseModelName } from '../pricing/models';
import { CsvTokenizer, detectDelimiter } from './tokenizer';

type Canonical =
  | 'date'
  | 'username'
  | 'product'
  | 'sku'
  | 'model'
  | 'quantity'
  | 'unit_type'
  | 'applied_cost_per_quantity'
  | 'gross_amount'
  | 'discount_amount'
  | 'net_amount'
  | 'total_monthly_quota'
  | 'organization'
  | 'app_client_id'
  | 'repository'
  | 'cost_center_name'
  | 'input'
  | 'output'
  | 'cache_read'
  | 'cache_write';

const SYNONYMS: Record<Canonical, string[]> = {
  date: ['date', 'usage_date', 'day', 'usagedate'],
  username: ['username', 'user', 'login', 'user_name', 'github_username', 'user_login'],
  product: ['product'],
  sku: ['sku'],
  model: ['model', 'model_name'],
  quantity: ['quantity', 'qty', 'ai_credits', 'credits'],
  unit_type: ['unit_type', 'unit'],
  applied_cost_per_quantity: ['applied_cost_per_quantity', 'price_per_unit', 'unit_price', 'cost_per_quantity'],
  gross_amount: ['gross_amount', 'gross'],
  discount_amount: ['discount_amount', 'discount'],
  net_amount: ['net_amount', 'net'],
  total_monthly_quota: ['total_monthly_quota', 'monthly_quota', 'quota'],
  organization: ['organization', 'org', 'organization_name'],
  app_client_id: ['app_client_id', 'app'],
  repository: ['repository', 'repo', 'repository_name'],
  cost_center_name: ['cost_center_name', 'cost_center', 'costcenter'],
  input: ['input', 'input_tokens'],
  output: ['output', 'output_tokens'],
  cache_read: ['cache_read', 'cache_read_tokens', 'cached_input'],
  cache_write: ['cache_write', 'cache_write_tokens'],
};

const KNOWN_EXTRA = new Set(['aic_quantity', 'aic_gross_amount']);

const OPTIONAL_COLUMNS: Canonical[] = [
  'username',
  'product',
  'sku',
  'model',
  'gross_amount',
  'quantity',
  'applied_cost_per_quantity',
  'discount_amount',
  'net_amount',
  'total_monthly_quota',
  'organization',
  'repository',
  'cost_center_name',
  'input',
  'output',
  'cache_read',
  'cache_write',
];

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export class ColumnError extends Error {}

class Column<T extends ArrayLike<number> & { length: number }> {
  arr: T;
  private readonly make: (length: number) => T;
  constructor(values: T, make: (length: number) => T) {
    this.arr = values;
    this.make = make;
  }
  grow(length: number): void {
    const next = this.make(length);
    (next as unknown as { set(source: ArrayLike<number>): void }).set(this.arr);
    this.arr = next;
  }
}

const mix = (hash: number, value: number): number => {
  hash = Math.imul(hash ^ value, 0x85ebca6b);
  return hash ^ (hash >>> 13);
};

const floatView = new Float64Array(1);
const floatWords = new Uint32Array(floatView.buffer);

function mixFloat(hash: number, value: number): number {
  floatView[0] = value;
  return mix(mix(hash, floatWords[0]), floatWords[1]);
}

export interface BuilderOptions {
  /** Drop rows that are byte-identical to a row already loaded from a *different* file. */
  dedupe: boolean;
}

export class StoreBuilder {
  private readonly opts: BuilderOptions;
  private n = 0;
  private cap: number;
  private readonly dicts: Record<DimKey, Dict>;
  private readonly cols: {
    day: Column<Int32Array>;
    user: Column<Int32Array>;
    product: Column<Int32Array>;
    sku: Column<Int32Array>;
    model: Column<Int32Array>;
    org: Column<Int32Array>;
    app: Column<Int32Array>;
    repo: Column<Int32Array>;
    costCenter: Column<Int32Array>;
    file: Column<Int32Array>;
    auto: Column<Uint8Array>;
    qty: Column<Float64Array>;
    gross: Column<Float64Array>;
    discount: Column<Float64Array>;
    net: Column<Float64Array>;
    quota: Column<Float32Array>;
    input: Column<Float64Array>;
    output: Column<Float64Array>;
    cacheRead: Column<Float64Array>;
    cacheWrite: Column<Float64Array>;
  };
  private readonly files: FileInfo[] = [];
  private readonly seen = new Map<number, number>();
  private hasTokens = false;
  private readonly modelCache = new Map<string, { id: number; auto: number }>();

  constructor(options: BuilderOptions, capacityHint = 1024) {
    this.opts = options;
    this.cap = Math.max(256, capacityHint);
    this.dicts = {} as Record<DimKey, Dict>;
    for (const dimension of DIM_KEYS) this.dicts[dimension] = { values: [], index: new Map() };
    // Reserve id 0 as the blank value for optional dimensions so blank is always index 0.
    for (const dimension of DIM_KEYS) if (dimension !== 'file' && dimension !== 'model') this.intern(dimension, '');
    const capacity = this.cap;
    this.cols = {
      day: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      user: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      product: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      sku: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      model: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      org: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      app: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      repo: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      costCenter: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      file: new Column(new Int32Array(capacity), (length) => new Int32Array(length)),
      auto: new Column(new Uint8Array(capacity), (length) => new Uint8Array(length)),
      qty: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      gross: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      discount: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      net: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      quota: new Column(new Float32Array(capacity), (length) => new Float32Array(length)),
      input: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      output: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      cacheRead: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
      cacheWrite: new Column(new Float64Array(capacity), (length) => new Float64Array(length)),
    };
  }

  private intern(dimension: DimKey, value: string): number {
    const dictionary = this.dicts[dimension];
    let id = dictionary.index.get(value);
    if (id === undefined) {
      id = dictionary.values.length;
      dictionary.values.push(value);
      dictionary.index.set(value, id);
    }
    return id;
  }

  private ensure(rowCount: number): void {
    if (rowCount <= this.cap) return;
    let next = this.cap;
    while (next < rowCount) next *= 2;
    for (const column of Object.values(this.cols)) (column as Column<Int32Array>).grow(next);
    this.cap = next;
  }

  /** Ingests one whole file given as an async sequence of text chunks. */
  async ingest(
    name: string,
    size: number,
    chunks: AsyncIterable<string> | Iterable<string>,
    onProgress?: (bytesRead: number, rows: number) => void,
  ): Promise<FileInfo> {
    const fileId = this.intern('file', name);
    const info: FileInfo = {
      name,
      size,
      rowsRead: 0,
      rowsKept: 0,
      duplicatesDropped: 0,
      badDateRows: 0,
      badNumberCells: 0,
      balanceMismatchRows: 0,
      priceMismatchRows: 0,
      negativeRows: 0,
      missingColumns: [],
      extraColumns: [],
      delimiter: ',',
      minDay: Number.POSITIVE_INFINITY,
      maxDay: Number.NEGATIVE_INFINITY,
    };
    this.files.push(info);
    const fileIndex = this.files.length - 1;

    let tokenizer: CsvTokenizer | null = null;
    let header: Map<Canonical, number> | null = null;
    let bytes = 0;
    const dayCache = new Map<string, number>();

    const handleRow = (fields: string[]): void => {
      if (header === null) {
        header = this.mapHeader(fields, info);
        return;
      }
      info.rowsRead++;
      this.addRow(fields, header, info, fileId, fileIndex, dayCache);
    };

    let first = true;
    for await (const raw of chunks as AsyncIterable<string>) {
      let text = raw;
      if (first) {
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
        info.delimiter = detectDelimiter(text);
        tokenizer = new CsvTokenizer(info.delimiter, handleRow);
        first = false;
      }
      bytes += raw.length;
      tokenizer!.push(text);
      onProgress?.(bytes, info.rowsRead);
    }
    tokenizer?.end();
    if (header === null) throw new ColumnError(`"${name}" is empty or has no header row.`);
    onProgress?.(size || bytes, info.rowsRead);
    if (!Number.isFinite(info.minDay)) {
      info.minDay = 0;
      info.maxDay = 0;
    }
    return info;
  }

  private mapHeader(fields: string[], info: FileInfo): Map<Canonical, number> {
    const columnNames = fields.map(normalizeHeader);
    const map = new Map<Canonical, number>();
    const used = new Set<number>();
    for (const canon of Object.keys(SYNONYMS) as Canonical[]) {
      for (const synonym of SYNONYMS[canon]) {
        const columnIndex = columnNames.indexOf(synonym);
        if (columnIndex !== -1) {
          map.set(canon, columnIndex);
          used.add(columnIndex);
          break;
        }
      }
    }
    if (!map.has('date')) {
      throw new ColumnError(`"${info.name}" has no date column. Expected a GitHub AI usage report CSV (columns like date, username, model, gross_amount…).`);
    }
    if (!map.has('gross_amount') && !map.has('quantity')) {
      throw new ColumnError(`"${info.name}" has neither gross_amount nor quantity columns, so cost cannot be determined.`);
    }
    info.missingColumns = OPTIONAL_COLUMNS.filter((column) => !map.has(column));
    info.extraColumns = columnNames.filter((columnName, columnIndex) => !used.has(columnIndex) && columnName !== '' && !KNOWN_EXTRA.has(columnName));
    return map;
  }

  private addRow(
    fields: string[],
    header: Map<Canonical, number>,
    info: FileInfo,
    fileId: number,
    fileIndex: number,
    dayCache: Map<string, number>,
  ): void {
    const get = (column: Canonical): string => {
      const columnIndex = header.get(column);
      return columnIndex === undefined || columnIndex >= fields.length ? '' : fields[columnIndex];
    };
    const getNumber = (column: Canonical): number => {
      const cell = get(column);
      if (cell === '') return 0;
      const value = +cell;
      if (Number.isNaN(value)) {
        info.badNumberCells++;
        return 0;
      }
      return value;
    };

    const dateStr = get('date');
    let day = dayCache.get(dateStr);
    if (day === undefined) {
      day = parseDay(dateStr);
      dayCache.set(dateStr, day);
    }
    if (Number.isNaN(day)) {
      info.badDateRows++;
      return;
    }

    let quantity = getNumber('quantity');
    const priceRaw = get('applied_cost_per_quantity');
    const price = priceRaw === '' || Number.isNaN(+priceRaw) ? 0.01 : +priceRaw;
    const hasGross = header.has('gross_amount');
    let gross = hasGross ? getNumber('gross_amount') : quantity * price;
    let discount = header.has('discount_amount') ? getNumber('discount_amount') : NaN;
    let net = header.has('net_amount') ? getNumber('net_amount') : NaN;
    const billingMissing = Number.isNaN(discount) && Number.isNaN(net);
    if (billingMissing) {
      // The file does not say how usage was paid for. Record neither (the analysis reports the gap) rather than inventing an overage.
      discount = 0;
      net = 0;
    } else if (Number.isNaN(net)) {
      net = Math.max(0, gross - discount);
    } else if (Number.isNaN(discount)) {
      discount = Math.max(0, gross - net);
    }
    if (!header.has('quantity')) quantity = price > 0 ? gross / price : 0;

    const tolerance = 1e-4 + 1e-6 * Math.abs(gross);
    if (!billingMissing && Math.abs(gross - (discount + net)) > tolerance) info.balanceMismatchRows++;
    if (header.has('quantity') && hasGross && Math.abs(gross - quantity * price) > tolerance) info.priceMismatchRows++;
    if (gross < 0 || discount < 0 || net < 0) info.negativeRows++;

    const input = getNumber('input');
    const output = getNumber('output');
    const cacheRead = getNumber('cache_read');
    const cacheWrite = getNumber('cache_write');
    if (header.has('input') || header.has('output')) this.hasTokens = true;

    const userId = this.intern('user', get('username').trim());
    const productId = this.intern('product', get('product').trim());
    const skuId = this.intern('sku', get('sku').trim());
    const rawModel = get('model');
    let model = this.modelCache.get(rawModel);
    if (model === undefined) {
      const parsedModel = parseModelName(rawModel);
      model = { id: this.intern('model', parsedModel.name), auto: parsedModel.auto ? 1 : 0 };
      this.modelCache.set(rawModel, model);
    }
    const orgId = this.intern('org', get('organization').trim());
    const appId = this.intern('app', get('app_client_id').trim());
    const repoId = this.intern('repo', get('repository').trim());
    const costCenterId = this.intern('costCenter', get('cost_center_name').trim());
    const quota = getNumber('total_monthly_quota');

    if (this.opts.dedupe) {
      let idHash = 0x9747b28c;
      idHash = mix(idHash, day);
      idHash = mix(idHash, userId);
      idHash = mix(idHash, productId);
      idHash = mix(idHash, skuId);
      idHash = mix(idHash, model.id);
      idHash = mix(idHash, model.auto);
      idHash = mix(idHash, orgId);
      idHash = mix(idHash, appId);
      idHash = mix(idHash, repoId);
      idHash = mix(idHash, costCenterId);
      let numberHash = 0x1b873593;
      numberHash = mixFloat(numberHash, quantity);
      numberHash = mixFloat(numberHash, gross);
      numberHash = mixFloat(numberHash, discount);
      numberHash = mixFloat(numberHash, net);
      numberHash = mixFloat(numberHash, input);
      numberHash = mixFloat(numberHash, output);
      numberHash = mixFloat(numberHash, cacheRead);
      numberHash = mixFloat(numberHash, cacheWrite);
      const key = (numberHash >>> 11) * 4294967296 + (idHash >>> 0);
      const prior = this.seen.get(key);
      if (prior !== undefined && prior !== fileIndex) {
        info.duplicatesDropped++;
        return;
      }
      if (prior === undefined) this.seen.set(key, fileIndex);
    }

    const rowIndex = this.n;
    this.ensure(rowIndex + 1);
    const columns = this.cols;
    columns.day.arr[rowIndex] = day;
    columns.user.arr[rowIndex] = userId;
    columns.product.arr[rowIndex] = productId;
    columns.sku.arr[rowIndex] = skuId;
    columns.model.arr[rowIndex] = model.id;
    columns.auto.arr[rowIndex] = model.auto;
    columns.org.arr[rowIndex] = orgId;
    columns.app.arr[rowIndex] = appId;
    columns.repo.arr[rowIndex] = repoId;
    columns.costCenter.arr[rowIndex] = costCenterId;
    columns.file.arr[rowIndex] = fileId;
    columns.qty.arr[rowIndex] = quantity;
    columns.gross.arr[rowIndex] = gross;
    columns.discount.arr[rowIndex] = discount;
    columns.net.arr[rowIndex] = net;
    columns.quota.arr[rowIndex] = quota;
    columns.input.arr[rowIndex] = input;
    columns.output.arr[rowIndex] = output;
    columns.cacheRead.arr[rowIndex] = cacheRead;
    columns.cacheWrite.arr[rowIndex] = cacheWrite;
    this.n = rowIndex + 1;
    info.rowsKept++;
    if (day < info.minDay) info.minDay = day;
    if (day > info.maxDay) info.maxDay = day;
  }

  finish(): DataStore {
    const rowCount = this.n;
    const columns = this.cols;
    let minDay = Number.POSITIVE_INFINITY;
    let maxDay = Number.NEGATIVE_INFINITY;
    for (const file of this.files) {
      if (file.rowsKept > 0) {
        minDay = Math.min(minDay, file.minDay);
        maxDay = Math.max(maxDay, file.maxDay);
      }
    }
    if (!Number.isFinite(minDay)) {
      minDay = 0;
      maxDay = 0;
    }
    return {
      n: rowCount,
      files: this.files,
      dicts: this.dicts,
      day: columns.day.arr.slice(0, rowCount),
      user: columns.user.arr.slice(0, rowCount),
      product: columns.product.arr.slice(0, rowCount),
      sku: columns.sku.arr.slice(0, rowCount),
      model: columns.model.arr.slice(0, rowCount),
      org: columns.org.arr.slice(0, rowCount),
      app: columns.app.arr.slice(0, rowCount),
      repo: columns.repo.arr.slice(0, rowCount),
      costCenter: columns.costCenter.arr.slice(0, rowCount),
      file: columns.file.arr.slice(0, rowCount),
      auto: columns.auto.arr.slice(0, rowCount),
      qty: columns.qty.arr.slice(0, rowCount),
      gross: columns.gross.arr.slice(0, rowCount),
      discount: columns.discount.arr.slice(0, rowCount),
      net: columns.net.arr.slice(0, rowCount),
      quota: columns.quota.arr.slice(0, rowCount),
      input: columns.input.arr.slice(0, rowCount),
      output: columns.output.arr.slice(0, rowCount),
      cacheRead: columns.cacheRead.arr.slice(0, rowCount),
      cacheWrite: columns.cacheWrite.arr.slice(0, rowCount),
      minDay,
      maxDay,
      hasTokens: this.hasTokens,
    };
  }
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MONTH_BY_NAME = new Map<string, number>();
['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].forEach((name, monthIndex) => {
  MONTH_BY_NAME.set(name, monthIndex + 1);
  MONTH_BY_NAME.set(name.slice(0, 3), monthIndex + 1);
});
MONTH_BY_NAME.set('sept', 9);

/** The day id of a date that exists, or NaN. Years up to 1970 count as missing, because an unset date often reads 1970-01-01. */
function dayOrNaN(year: number, month: number, day: number): number {
  if (!(year > 1970 && year < 10_000 && month >= 1 && month <= 12 && day >= 1)) return Number.NaN;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return day <= DAYS_IN_MONTH[month - 1] + (month === 2 && leap ? 1 : 0) ? dayFromYMD(year, month - 1, day) : Number.NaN;
}

// A time of day may follow the date. Only the calendar date as written is used, so the result never depends on the time zone.
const TIME_TAIL = '(?:[T\\s].*)?$';
const YMD_DATE = new RegExp(`^(\\d{4})([-/.])(\\d{1,2})\\2(\\d{1,2})${TIME_TAIL}`);
const NUMERIC_DATE = new RegExp(`^(\\d{1,2})/(\\d{1,2})/(\\d{4})${TIME_TAIL}`);
const MONTH_FIRST_DATE = /^(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})(?:\s.*)?$/;
const DAY_FIRST_DATE = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})(?:\s.*)?$/;

/**
 * Reads the date of a usage row as a day id (days since 1970-01-01 UTC), or NaN when it is not a real date.
 * It reads 2026-10-03 (also 2026/10/03 and 2026-10-3), 10/3/2026, Oct 3, 2026 and 3 Oct 2026, with an optional time.
 * A day/month/year date such as 25/10/2026 is understood when only that reading is possible; 10/3/2026 is October 3.
 */
export function parseDay(text: string): number {
  const trimmed = text.trim();
  let match = YMD_DATE.exec(trimmed);
  if (match) return dayOrNaN(+match[1], +match[3], +match[4]);
  match = NUMERIC_DATE.exec(trimmed);
  if (match) {
    const first = +match[1];
    const second = +match[2];
    return first > 12 && second <= 12 ? dayOrNaN(+match[3], second, first) : dayOrNaN(+match[3], first, second);
  }
  match = MONTH_FIRST_DATE.exec(trimmed);
  if (match) return dayOrNaN(+match[3], MONTH_BY_NAME.get(match[1].toLowerCase()) ?? 0, +match[2]);
  match = DAY_FIRST_DATE.exec(trimmed);
  if (match) return dayOrNaN(+match[3], MONTH_BY_NAME.get(match[2].toLowerCase()) ?? 0, +match[1]);
  return Number.NaN;
}

export interface TextSource {
  name: string;
  /** Raw text or a Blob/File to stream. */
  data: string | Blob;
}

async function* blobChunks(blob: Blob): AsyncGenerator<string> {
  const reader = blob.stream().getReader();
  const decoder = new TextDecoder('utf-8');
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
  const tail = decoder.decode();
  if (tail) yield tail;
}

function* stringChunks(text: string, size = 1 << 20): Generator<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
}

export async function buildStore(
  sources: TextSource[],
  options: Partial<BuilderOptions> = {},
  onProgress?: (progress: { file: string; fileIndex: number; fileCount: number; fraction: number; rows: number }) => void,
): Promise<DataStore> {
  const totalBytes = sources.reduce((total, source) => total + (typeof source.data === 'string' ? source.data.length : source.data.size), 0);
  const builder = new StoreBuilder({ dedupe: options.dedupe ?? sources.length > 1 }, Math.max(1024, Math.round(totalBytes / 170)));
  let done = 0;
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const size = typeof source.data === 'string' ? source.data.length : source.data.size;
    const chunks = typeof source.data === 'string' ? stringChunks(source.data) : blobChunks(source.data);
    await builder.ingest(source.name, size, chunks, (bytes, rows) => {
      onProgress?.({
        file: source.name,
        fileIndex: i,
        fileCount: sources.length,
        fraction: totalBytes ? Math.min(1, (done + Math.min(bytes, size)) / totalBytes) : 1,
        rows,
      });
    });
    done += size;
  }
  return builder.finish();
}

export function rebuildIndexes(store: DataStore): DataStore {
  for (const dimension of DIM_KEYS) {
    const dictionary = store.dicts[dimension];
    dictionary.index = new Map(dictionary.values.map((value, id) => [value, id]));
  }
  return store;
}
