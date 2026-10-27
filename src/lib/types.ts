import { msg, t } from '../i18n/core.ts';

export const CREDIT_USD = 0.01;

/** Dimensions that are dictionary-encoded in the data store. */
export type DimKey = 'user' | 'product' | 'sku' | 'model' | 'org' | 'app' | 'repo' | 'costCenter' | 'file';

export const DIM_KEYS: DimKey[] = ['user', 'product', 'sku', 'model', 'org', 'app', 'repo', 'costCenter', 'file'];

export interface Dict {
  values: string[];
  index: Map<string, number>;
}

export type Category = 'Powerful' | 'Versatile' | 'Lightweight' | 'Unknown';
export const CATEGORIES: Category[] = ['Powerful', 'Versatile', 'Lightweight', 'Unknown'];

export interface FileInfo {
  name: string;
  size: number;
  rowsRead: number;
  rowsKept: number;
  duplicatesDropped: number;
  badDateRows: number;
  badNumberCells: number;
  balanceMismatchRows: number;
  priceMismatchRows: number;
  negativeRows: number;
  missingColumns: string[];
  extraColumns: string[];
  delimiter: string;
  minDay: number;
  maxDay: number;
}

/**
 * Columnar, dictionary-encoded representation of one or more usage CSV files.
 * Every array has length `n`. Dictionary ids are indices into `dicts[dim].values`.
 */
export interface DataStore {
  n: number;
  files: FileInfo[];
  dicts: Record<DimKey, Dict>;
  day: Int32Array; // days since 1970-01-01 (UTC)
  user: Int32Array;
  product: Int32Array;
  sku: Int32Array;
  model: Int32Array; // resolved model name (without the "Auto: " prefix)
  org: Int32Array;
  app: Int32Array;
  repo: Int32Array;
  costCenter: Int32Array;
  file: Int32Array;
  auto: Uint8Array; // 1 when the model was selected by GitHub Copilot Auto
  qty: Float64Array; // AI credits
  gross: Float64Array; // USD
  discount: Float64Array; // USD, covered by included credits
  net: Float64Array; // USD, billed overage
  quota: Float32Array; // total_monthly_quota (credits) for the row's user
  input: Float64Array;
  output: Float64Array;
  cacheRead: Float64Array;
  cacheWrite: Float64Array;
  minDay: number;
  maxDay: number;
  /** True when token columns were present in the CSV. */
  hasTokens: boolean;
}

export const BLANK = '';

export const DIM_LABELS: Record<DimKey, string> = {
  user: msg('User'),
  product: msg('Product'),
  sku: msg('SKU'),
  model: msg('Model'),
  org: msg('Organization'),
  app: msg('App client'),
  repo: msg('Repository'),
  costCenter: msg('Cost center'),
  file: msg('Source file'),
};

/** English labels for the empty value of each field. Show them through `labelOf`, which translates. */
export const BLANK_LABELS: Record<DimKey, string> = {
  user: msg('(unattributed / repo-level)'),
  product: msg('(none)'),
  sku: msg('(none)'),
  model: msg('(unknown model)'),
  org: msg('(no organization)'),
  app: msg('(no app)'),
  repo: msg('(no repository)'),
  costCenter: msg('(no cost center)'),
  file: msg('(file)'),
};

export function labelOf(dimension: DimKey, value: string): string {
  return value === BLANK ? t(BLANK_LABELS[dimension]) : value;
}
