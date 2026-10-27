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
export function pickLenses(row: LensId, column: LensId, offered: readonly LensId[]): [LensId, LensId] {
  const rowLens = offered.includes(row) ? row : offered[0];
  const columnLens = offered.includes(column) && column !== rowLens ? column : (offered.find((id) => id !== rowLens) ?? rowLens);
  return [rowLens, columnLens];
}

function nonEmpty(totals: MatrixCell[]): number[] {
  const keep: number[] = [];
  totals.forEach((total, index) => {
    if (total.users > 0) keep.push(index);
  });
  return keep;
}

/** Counts users and usage for every combination of one group of `rowLens` and one group of `colLens`. */
export function buildMatrix(rowLens: Lens, colLens: Lens, taxonomy: Taxonomy, population: UserSet): Matrix {
  const rowItems = rowLens.items(taxonomy);
  const colItems = colLens.items(taxonomy);
  const rowIndex = new Map(rowItems.map((item, index) => [item.id, index]));
  const colIndex = new Map(colItems.map((item, index) => [item.id, index]));
  const cells = rowItems.map(() => colItems.map(cell));
  const rowTotals = rowItems.map(cell);
  const colTotals = colItems.map(cell);

  for (const user of population.profiles) {
    const cols: number[] = [];
    for (const id of colLens.idsOf(user)) {
      const columnPosition = colIndex.get(id);
      if (columnPosition === undefined) continue;
      cols.push(columnPosition);
      colTotals[columnPosition].users++;
      colTotals[columnPosition].gross += user.gross;
    }
    for (const id of rowLens.idsOf(user)) {
      const rowPosition = rowIndex.get(id);
      if (rowPosition === undefined) continue;
      rowTotals[rowPosition].users++;
      rowTotals[rowPosition].gross += user.gross;
      for (const columnPosition of cols) {
        cells[rowPosition][columnPosition].users++;
        cells[rowPosition][columnPosition].gross += user.gross;
      }
    }
  }

  const keepRows = nonEmpty(rowTotals);
  const keepCols = nonEmpty(colTotals);
  const shown = keepRows.map((rowPosition) => keepCols.map((columnPosition) => cells[rowPosition][columnPosition]));
  let maxUsers = 0;
  let maxGross = 0;
  for (const row of shown) {
    for (const matrixCell of row) {
      if (matrixCell.users > maxUsers) maxUsers = matrixCell.users;
      if (matrixCell.gross > maxGross) maxGross = matrixCell.gross;
    }
  }

  return {
    rows: keepRows.map((rowPosition) => rowItems[rowPosition]),
    cols: keepCols.map((columnPosition) => colItems[columnPosition]),
    cells: shown,
    rowTotals: keepRows.map((rowPosition) => rowTotals[rowPosition]),
    colTotals: keepCols.map((columnPosition) => colTotals[columnPosition]),
    all: { users: population.totals.users, gross: population.totals.gross },
    maxUsers,
    maxGross,
    overlaps: rowLens.overlay.size > 0 || colLens.overlay.size > 0,
  };
}
