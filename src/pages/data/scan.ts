import type { DataStore } from '../../lib/types';

export const SCAN_DIMS = ['user', 'product', 'sku', 'model', 'org', 'app', 'repo', 'costCenter'] as const;
export type ScanDim = (typeof SCAN_DIMS)[number];

export interface DimScan {
  /** Kept rows per dictionary id. */
  rows: Uint32Array;
  /** Gross USD per dictionary id. */
  gross: Float64Array;
  /** Distinct non-blank values that appear in at least one kept row. */
  distinct: number;
  /** Dictionary id of the blank value, or -1 when the dictionary has none. */
  blankId: number;
  blankRows: number;
  blankGross: number;
}

export interface StoreScan {
  rows: number;
  gross: number;
  discount: number;
  net: number;
  qty: number;
  /** 1 for every day with at least one row, indexed by `day - store.minDay`. */
  daysSeen: Uint8Array;
  daysWithData: number;
  dims: Record<ScanDim, DimScan>;
  /** Gross USD per product id for rows that have no username. */
  unattributedByProduct: Float64Array;
}

const cache = new WeakMap<DataStore, StoreScan>();

/** One pass over the store. The result is cached per store, so every card of the page shares it. */
export function scanStore(store: DataStore): StoreScan {
  const hit = cache.get(store);
  if (hit) return hit;

  const n = store.n;
  const span = n ? store.maxDay - store.minDay + 1 : 0;
  const daysSeen = new Uint8Array(span);
  const cols = SCAN_DIMS.map((dim) => {
    const size = store.dicts[dim].values.length;
    return { ids: store[dim], rows: new Uint32Array(size), gross: new Float64Array(size) };
  });

  const { day, gross: grossCol, discount: discountCol, net: netCol, qty: qtyCol, minDay, user, product } = store;
  const blankUser = store.dicts.user.values.indexOf('');
  const unattributedByProduct = new Float64Array(store.dicts.product.values.length);
  let gross = 0;
  let discount = 0;
  let net = 0;
  let qty = 0;
  for (let i = 0; i < n; i++) {
    const g = grossCol[i];
    daysSeen[day[i] - minDay] = 1;
    gross += g;
    discount += discountCol[i];
    net += netCol[i];
    qty += qtyCol[i];
    if (user[i] === blankUser) unattributedByProduct[product[i]] += g;
    for (let d = 0; d < cols.length; d++) {
      const c = cols[d];
      const id = c.ids[i];
      c.rows[id]++;
      c.gross[id] += g;
    }
  }

  let daysWithData = 0;
  for (let k = 0; k < span; k++) daysWithData += daysSeen[k];

  const dims = {} as Record<ScanDim, DimScan>;
  SCAN_DIMS.forEach((dim, d) => {
    const values = store.dicts[dim].values;
    const { rows, gross: byGross } = cols[d];
    const blankId = values.indexOf('');
    let distinct = 0;
    for (let id = 0; id < values.length; id++) if (rows[id] > 0 && id !== blankId) distinct++;
    dims[dim] = {
      rows,
      gross: byGross,
      distinct,
      blankId,
      blankRows: blankId >= 0 ? rows[blankId] : 0,
      blankGross: blankId >= 0 ? byGross[blankId] : 0,
    };
  });

  const scan: StoreScan = { rows: n, gross, discount, net, qty, daysSeen, daysWithData, dims, unattributedByProduct };
  cache.set(store, scan);
  return scan;
}
