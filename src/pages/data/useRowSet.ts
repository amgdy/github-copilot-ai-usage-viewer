import { useEffect, useState } from 'react';
import type { DataStore } from '../../lib/types';
import { sortAscending, type ColumnId } from './explorer';

const MAX_CACHED_SORTS = 3;
const sortCache = new WeakMap<Uint32Array, Map<ColumnId, Uint32Array>>();

const cached = (scope: Uint32Array, col: ColumnId): Uint32Array | undefined => sortCache.get(scope)?.get(col);

function remember(scope: Uint32Array, col: ColumnId, order: Uint32Array): void {
  let orders = sortCache.get(scope);
  if (!orders) {
    orders = new Map();
    sortCache.set(scope, orders);
  }
  orders.set(col, order);
  if (orders.size > MAX_CACHED_SORTS) {
    const oldest = orders.keys().next();
    if (!oldest.done) orders.delete(oldest.value);
  }
}

export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * `scope` ordered ascending by `col`, computed off the render path: the sort starts in a timeout so the pending state paints first.
 * Sorted orders are cached per scope array, so switching columns or direction back is instant.
 * While a sort runs, `order` is the previous order of the same scope.
 */
export function useSortedScope(store: DataStore, scope: Uint32Array, col: ColumnId | null): { order: Uint32Array; pending: boolean } {
  const hit = col ? cached(scope, col) : undefined;
  const [last, setLast] = useState<{ scope: Uint32Array; order: Uint32Array } | null>(null);

  useEffect(() => {
    if (!col || cached(scope, col)) return;
    const timer = setTimeout(() => {
      const order = sortAscending(store, scope, col);
      remember(scope, col, order);
      setLast({ scope, order });
    }, 30);
    return () => clearTimeout(timer);
  }, [store, scope, col]);

  if (!col) return { order: scope, pending: false };
  if (hit) return { order: hit, pending: false };
  return { order: last && last.scope === scope ? last.order : scope, pending: true };
}
