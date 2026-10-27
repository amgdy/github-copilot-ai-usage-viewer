import type { Filters } from '../../lib/analytics/filters';
import { drill } from '../../state/router';
import { filterPatch, type Lens } from './lenses';

/** Opens the Users page with this group selected. Other filters stay as they are. */
export function showGroup(lens: Lens, id: string): void {
  drill(filterPatch(lens.filterKey, [id]), { page: 'users', merge: true });
}

/** Opens the Users page with one group of each lens selected. A null id leaves that lens alone. */
export function showCell(rowLens: Lens, rowId: string | null, colLens: Lens, colId: string | null): void {
  const patch: Partial<Filters> = {
    ...(rowId === null ? {} : filterPatch(rowLens.filterKey, [rowId])),
    ...(colId === null ? {} : filterPatch(colLens.filterKey, [colId])),
  };
  drill(patch, { page: 'users', merge: true });
}
