import type { DataStore } from '../../lib/types';

/** Usage of one user per model (dictionary id), from a scan of the rows. Use it when the aggregates do not cover the user. */
export function userModelGross(
  store: DataStore,
  mask: Uint8Array | null,
  range: { start: number; end: number },
  userId: number,
): Float64Array {
  const out = new Float64Array(store.dicts.model.values.length);
  for (let i = 0; i < store.n; i++) {
    if (store.user[i] !== userId) continue;
    if (mask !== null && mask[i] === 0) continue;
    const day = store.day[i];
    if (day < range.start || day > range.end) continue;
    out[store.model[i]] += store.gross[i];
  }
  return out;
}
