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

export function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export class ColumnError extends Error {}

class Column<T extends ArrayLike<number> & { length: number }> {
  constructor(
    public arr: T,
    private readonly make: (n: number) => T,
  ) {}
  grow(n: number): void {
    const next = this.make(n);
    (next as unknown as { set(a: ArrayLike<number>): void }).set(this.arr);
    this.arr = next;
  }
}

const mix = (h: number, v: number): number => {
  h = Math.imul(h ^ v, 0x85ebca6b);
  return h ^ (h >>> 13);
};

const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);

function mixFloat(h: number, v: number): number {
  f64[0] = v;
  return mix(mix(h, u32[0]), u32[1]);
}

export interface BuilderOptions {
  /** Drop rows that are byte-identical to a row already loaded from a *different* file. */
  dedupe: boolean;
}

export class StoreBuilder {
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

  constructor(
    private readonly opts: BuilderOptions,
    capacityHint = 1024,
  ) {
    this.cap = Math.max(256, capacityHint);
    this.dicts = {} as Record<DimKey, Dict>;
    for (const k of DIM_KEYS) this.dicts[k] = { values: [], index: new Map() };
    // Reserve id 0 as the blank value for optional dimensions so blank is always index 0.
    for (const k of DIM_KEYS) if (k !== 'file' && k !== 'model') this.intern(k, '');
    const c = this.cap;
    this.cols = {
      day: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      user: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      product: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      sku: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      model: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      org: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      app: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      repo: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      costCenter: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      file: new Column(new Int32Array(c), (n) => new Int32Array(n)),
      auto: new Column(new Uint8Array(c), (n) => new Uint8Array(n)),
      qty: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      gross: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      discount: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      net: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      quota: new Column(new Float32Array(c), (n) => new Float32Array(n)),
      input: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      output: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      cacheRead: new Column(new Float64Array(c), (n) => new Float64Array(n)),
      cacheWrite: new Column(new Float64Array(c), (n) => new Float64Array(n)),
    };
  }

  private intern(dim: DimKey, value: string): number {
    const d = this.dicts[dim];
    let id = d.index.get(value);
    if (id === undefined) {
      id = d.values.length;
      d.values.push(value);
      d.index.set(value, id);
    }
    return id;
  }

  private ensure(n: number): void {
    if (n <= this.cap) return;
    let next = this.cap;
    while (next < n) next *= 2;
    for (const col of Object.values(this.cols)) (col as Column<Int32Array>).grow(next);
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

    const handleRow = (f: string[]): void => {
      if (header === null) {
        header = this.mapHeader(f, info);
        return;
      }
      info.rowsRead++;
      this.addRow(f, header, info, fileId, fileIndex, dayCache);
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
    const norm = fields.map(normalizeHeader);
    const map = new Map<Canonical, number>();
    const used = new Set<number>();
    for (const canon of Object.keys(SYNONYMS) as Canonical[]) {
      for (const syn of SYNONYMS[canon]) {
        const idx = norm.indexOf(syn);
        if (idx !== -1) {
          map.set(canon, idx);
          used.add(idx);
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
    info.missingColumns = OPTIONAL_COLUMNS.filter((c) => !map.has(c));
    info.extraColumns = norm.filter((h, i) => !used.has(i) && h !== '' && !KNOWN_EXTRA.has(h));
    return map;
  }

  private addRow(
    f: string[],
    h: Map<Canonical, number>,
    info: FileInfo,
    fileId: number,
    fileIndex: number,
    dayCache: Map<string, number>,
  ): void {
    const get = (c: Canonical): string => {
      const i = h.get(c);
      return i === undefined || i >= f.length ? '' : f[i];
    };
    const num = (c: Canonical): number => {
      const s = get(c);
      if (s === '') return 0;
      const v = +s;
      if (Number.isNaN(v)) {
        info.badNumberCells++;
        return 0;
      }
      return v;
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

    let qty = num('quantity');
    const priceRaw = get('applied_cost_per_quantity');
    const price = priceRaw === '' || Number.isNaN(+priceRaw) ? 0.01 : +priceRaw;
    const hasGross = h.has('gross_amount');
    let gross = hasGross ? num('gross_amount') : qty * price;
    let discount = h.has('discount_amount') ? num('discount_amount') : NaN;
    let net = h.has('net_amount') ? num('net_amount') : NaN;
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
    if (!h.has('quantity')) qty = price > 0 ? gross / price : 0;

    const tol = 1e-4 + 1e-6 * Math.abs(gross);
    if (!billingMissing && Math.abs(gross - (discount + net)) > tol) info.balanceMismatchRows++;
    if (h.has('quantity') && hasGross && Math.abs(gross - qty * price) > tol) info.priceMismatchRows++;
    if (gross < 0 || discount < 0 || net < 0) info.negativeRows++;

    const input = num('input');
    const output = num('output');
    const cacheRead = num('cache_read');
    const cacheWrite = num('cache_write');
    if (h.has('input') || h.has('output')) this.hasTokens = true;

    const userId = this.intern('user', get('username').trim());
    const productId = this.intern('product', get('product').trim());
    const skuId = this.intern('sku', get('sku').trim());
    const rawModel = get('model');
    let mc = this.modelCache.get(rawModel);
    if (mc === undefined) {
      const pm = parseModelName(rawModel);
      mc = { id: this.intern('model', pm.name), auto: pm.auto ? 1 : 0 };
      this.modelCache.set(rawModel, mc);
    }
    const orgId = this.intern('org', get('organization').trim());
    const appId = this.intern('app', get('app_client_id').trim());
    const repoId = this.intern('repo', get('repository').trim());
    const ccId = this.intern('costCenter', get('cost_center_name').trim());
    const quota = num('total_monthly_quota');

    if (this.opts.dedupe) {
      let h1 = 0x9747b28c;
      h1 = mix(h1, day);
      h1 = mix(h1, userId);
      h1 = mix(h1, productId);
      h1 = mix(h1, skuId);
      h1 = mix(h1, mc.id);
      h1 = mix(h1, mc.auto);
      h1 = mix(h1, orgId);
      h1 = mix(h1, appId);
      h1 = mix(h1, repoId);
      h1 = mix(h1, ccId);
      let h2 = 0x1b873593;
      h2 = mixFloat(h2, qty);
      h2 = mixFloat(h2, gross);
      h2 = mixFloat(h2, discount);
      h2 = mixFloat(h2, net);
      h2 = mixFloat(h2, input);
      h2 = mixFloat(h2, output);
      h2 = mixFloat(h2, cacheRead);
      h2 = mixFloat(h2, cacheWrite);
      const key = (h2 >>> 11) * 4294967296 + (h1 >>> 0);
      const prior = this.seen.get(key);
      if (prior !== undefined && prior !== fileIndex) {
        info.duplicatesDropped++;
        return;
      }
      if (prior === undefined) this.seen.set(key, fileIndex);
    }

    const i = this.n;
    this.ensure(i + 1);
    const c = this.cols;
    c.day.arr[i] = day;
    c.user.arr[i] = userId;
    c.product.arr[i] = productId;
    c.sku.arr[i] = skuId;
    c.model.arr[i] = mc.id;
    c.auto.arr[i] = mc.auto;
    c.org.arr[i] = orgId;
    c.app.arr[i] = appId;
    c.repo.arr[i] = repoId;
    c.costCenter.arr[i] = ccId;
    c.file.arr[i] = fileId;
    c.qty.arr[i] = qty;
    c.gross.arr[i] = gross;
    c.discount.arr[i] = discount;
    c.net.arr[i] = net;
    c.quota.arr[i] = quota;
    c.input.arr[i] = input;
    c.output.arr[i] = output;
    c.cacheRead.arr[i] = cacheRead;
    c.cacheWrite.arr[i] = cacheWrite;
    this.n = i + 1;
    info.rowsKept++;
    if (day < info.minDay) info.minDay = day;
    if (day > info.maxDay) info.maxDay = day;
  }

  finish(): DataStore {
    const n = this.n;
    const c = this.cols;
    let minDay = Number.POSITIVE_INFINITY;
    let maxDay = Number.NEGATIVE_INFINITY;
    for (const f of this.files) {
      if (f.rowsKept > 0) {
        minDay = Math.min(minDay, f.minDay);
        maxDay = Math.max(maxDay, f.maxDay);
      }
    }
    if (!Number.isFinite(minDay)) {
      minDay = 0;
      maxDay = 0;
    }
    return {
      n,
      files: this.files,
      dicts: this.dicts,
      day: c.day.arr.slice(0, n),
      user: c.user.arr.slice(0, n),
      product: c.product.arr.slice(0, n),
      sku: c.sku.arr.slice(0, n),
      model: c.model.arr.slice(0, n),
      org: c.org.arr.slice(0, n),
      app: c.app.arr.slice(0, n),
      repo: c.repo.arr.slice(0, n),
      costCenter: c.costCenter.arr.slice(0, n),
      file: c.file.arr.slice(0, n),
      auto: c.auto.arr.slice(0, n),
      qty: c.qty.arr.slice(0, n),
      gross: c.gross.arr.slice(0, n),
      discount: c.discount.arr.slice(0, n),
      net: c.net.arr.slice(0, n),
      quota: c.quota.arr.slice(0, n),
      input: c.input.arr.slice(0, n),
      output: c.output.arr.slice(0, n),
      cacheRead: c.cacheRead.arr.slice(0, n),
      cacheWrite: c.cacheWrite.arr.slice(0, n),
      minDay,
      maxDay,
      hasTokens: this.hasTokens,
    };
  }
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MONTH_BY_NAME = new Map<string, number>();
['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].forEach((name, i) => {
  MONTH_BY_NAME.set(name, i + 1);
  MONTH_BY_NAME.set(name.slice(0, 3), i + 1);
});
MONTH_BY_NAME.set('sept', 9);

/** The day id of a date that exists, or NaN. Years up to 1970 count as missing, because an unset date often reads 1970-01-01. */
function dayOrNaN(y: number, m: number, d: number): number {
  if (!(y > 1970 && y < 10_000 && m >= 1 && m <= 12 && d >= 1)) return Number.NaN;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return d <= DAYS_IN_MONTH[m - 1] + (m === 2 && leap ? 1 : 0) ? dayFromYMD(y, m - 1, d) : Number.NaN;
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
export function parseDay(s: string): number {
  const t = s.trim();
  let m = YMD_DATE.exec(t);
  if (m) return dayOrNaN(+m[1], +m[3], +m[4]);
  m = NUMERIC_DATE.exec(t);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    return a > 12 && b <= 12 ? dayOrNaN(+m[3], b, a) : dayOrNaN(+m[3], a, b);
  }
  m = MONTH_FIRST_DATE.exec(t);
  if (m) return dayOrNaN(+m[3], MONTH_BY_NAME.get(m[1].toLowerCase()) ?? 0, +m[2]);
  m = DAY_FIRST_DATE.exec(t);
  if (m) return dayOrNaN(+m[3], MONTH_BY_NAME.get(m[2].toLowerCase()) ?? 0, +m[1]);
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
  opts: Partial<BuilderOptions> = {},
  onProgress?: (p: { file: string; fileIndex: number; fileCount: number; fraction: number; rows: number }) => void,
): Promise<DataStore> {
  const totalBytes = sources.reduce((a, s) => a + (typeof s.data === 'string' ? s.data.length : s.data.size), 0);
  const builder = new StoreBuilder({ dedupe: opts.dedupe ?? sources.length > 1 }, Math.max(1024, Math.round(totalBytes / 170)));
  let done = 0;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    const size = typeof s.data === 'string' ? s.data.length : s.data.size;
    const chunks = typeof s.data === 'string' ? stringChunks(s.data) : blobChunks(s.data);
    await builder.ingest(s.name, size, chunks, (bytes, rows) => {
      onProgress?.({
        file: s.name,
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
  for (const k of DIM_KEYS) {
    const d = store.dicts[k];
    d.index = new Map(d.values.map((v, i) => [v, i]));
  }
  return store;
}
