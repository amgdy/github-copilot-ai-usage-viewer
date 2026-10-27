import type { Taxonomy, TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { UserSet } from '../../lib/analytics/users';
import type { Lens, LensId } from './lenses';

export interface MatrixCell {
  users: number;
  gross: number;
}

export interface Matrix {
  /** Only groups that have at least one user. */
  rows: TaxonomyItem[];
  cols: TaxonomyItem[];
  cells: MatrixCell[][];
  /** Full size of each row and column group. */
  rowTotals: MatrixCell[];
  colTotals: MatrixCell[];
  all: MatrixCell;
  maxUsers: number;
  maxGross: number;
  /** A user can sit in several cells (one axis has overlapping groups). */
  overlaps: boolean;
}

const cell = (): MatrixCell => ({ users: 0, gross: 0 });

/** The lenses for the rows and the columns: the picked ones when offered and different, else the first offered ones that are. */
export function pickLenses(row: LensId, col: LensId, offered: readonly LensId[]): [LensId, LensId] {
  const r = offered.includes(row) ? row : offered[0];
  const c = offered.includes(col) && col !== r ? col : (offered.find((id) => id !== r) ?? r);
  return [r, c];
}

function nonEmpty(totals: MatrixCell[]): number[] {
  const keep: number[] = [];
  totals.forEach((t, i) => {
    if (t.users > 0) keep.push(i);
  });
  return keep;
}

/** Counts users and usage for every combination of one group of `rowLens` and one group of `colLens`. */
export function buildMatrix(rowLens: Lens, colLens: Lens, taxonomy: Taxonomy, population: UserSet): Matrix {
  const rowItems = rowLens.items(taxonomy);
  const colItems = colLens.items(taxonomy);
  const rowIndex = new Map(rowItems.map((it, i) => [it.id, i]));
  const colIndex = new Map(colItems.map((it, i) => [it.id, i]));
  const cells = rowItems.map(() => colItems.map(cell));
  const rowTotals = rowItems.map(cell);
  const colTotals = colItems.map(cell);

  for (const p of population.profiles) {
    const cols: number[] = [];
    for (const id of colLens.idsOf(p)) {
      const ci = colIndex.get(id);
      if (ci === undefined) continue;
      cols.push(ci);
      colTotals[ci].users++;
      colTotals[ci].gross += p.gross;
    }
    for (const id of rowLens.idsOf(p)) {
      const ri = rowIndex.get(id);
      if (ri === undefined) continue;
      rowTotals[ri].users++;
      rowTotals[ri].gross += p.gross;
      for (const ci of cols) {
        cells[ri][ci].users++;
        cells[ri][ci].gross += p.gross;
      }
    }
  }

  const keepRows = nonEmpty(rowTotals);
  const keepCols = nonEmpty(colTotals);
  const shown = keepRows.map((ri) => keepCols.map((ci) => cells[ri][ci]));
  let maxUsers = 0;
  let maxGross = 0;
  for (const row of shown) {
    for (const c of row) {
      if (c.users > maxUsers) maxUsers = c.users;
      if (c.gross > maxGross) maxGross = c.gross;
    }
  }

  return {
    rows: keepRows.map((i) => rowItems[i]),
    cols: keepCols.map((i) => colItems[i]),
    cells: shown,
    rowTotals: keepRows.map((i) => rowTotals[i]),
    colTotals: keepCols.map((i) => colTotals[i]),
    all: { users: population.totals.users, gross: population.totals.gross },
    maxUsers,
    maxGross,
    overlaps: rowLens.overlay.size > 0 || colLens.overlay.size > 0,
  };
}
