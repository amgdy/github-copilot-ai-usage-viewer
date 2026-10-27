import { useMemo, useState } from 'react';
import { Card, EmptyState, Field, Segmented, Select, cx } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { Taxonomy, TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { UserSet } from '../../lib/analytics/users';
import { fmtInt, fmtUSD, fmtUSDCompact, pluralize } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { showCell } from './actions';
import { LENSES, LENS_BY_ID, lensUnavailableReason, type Availability, type LensId } from './lenses';
import { buildMatrix, pickLenses, type MatrixCell } from './matrix';

type Shade = 'users' | 'usage';

const SHADES = [
  { value: 'users' as const, label: msg('Users'), title: msg('Darker cells hold more users') },
  { value: 'usage' as const, label: msg('Usage'), title: msg('Darker cells hold more usage') },
];

const MIN_INTENSITY = 8;
const MAX_INTENSITY = 52;

function CellBody({ cell }: { cell: MatrixCell }) {
  return (
    <>
      <span className="num text-sm font-semibold">{fmtInt(cell.users)}</span>
      <span className="num text-[11px] text-fg/75">{fmtUSDCompact(cell.gross)}</span>
    </>
  );
}

const CELL_BOX = 'flex min-h-12 w-full min-w-20 flex-col items-center justify-center rounded-md px-2 py-1 text-center';

function Dot({ item }: { item: TaxonomyItem }) {
  return <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} aria-hidden />;
}

function HeaderButton({ item, active, onClick, title }: { item: TaxonomyItem; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cx('inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-start text-xs font-medium hover:bg-surface-3', active && 'bg-accent-soft text-accent')}
    >
      <Dot item={item} />
      <span>{item.label}</span>
    </button>
  );
}

interface Props {
  taxonomy: Taxonomy;
  population: UserSet;
  availability: Availability;
}

export function CrossLensMatrix({ taxonomy, population, availability }: Props) {
  const filters = useApp((state) => state.filters);
  const [rowPick, setRowPick] = useState<LensId>('tier');
  const [colPick, setColPick] = useState<LensId>('engagement');
  const [shade, setShade] = useState<Shade>('users');

  // A lens whose groups would be meaningless in this data (Auto use class without a model column) is not offered.
  const offered = useMemo(() => LENSES.filter((lens) => lensUnavailableReason(lens.id, availability) === null), [availability]);
  const options = useMemo(() => offered.map((lens) => ({ value: lens.id, label: t(lens.label) })), [offered]);
  const shades = useMemo(() => SHADES.map((shadeOption) => ({ ...shadeOption, label: t(shadeOption.label), title: t(shadeOption.title) })), []);
  const [rowId, colId] = pickLenses(
    rowPick,
    colPick,
    offered.map((lens) => lens.id),
  );
  const rowLens = LENS_BY_ID[rowId];
  const colLens = LENS_BY_ID[colId];

  const chooseRows = (lensId: LensId) => {
    if (lensId === colId) setColPick(rowId);
    setRowPick(lensId);
  };
  const chooseCols = (lensId: LensId) => {
    if (lensId === rowId) setRowPick(colId);
    setColPick(lensId);
  };

  const matrix = useMemo(() => buildMatrix(rowLens, colLens, taxonomy, population), [rowLens, colLens, taxonomy, population]);
  const activeRows = filters[rowLens.filterKey];
  const activeCols = filters[colLens.filterKey];
  const max = shade === 'users' ? matrix.maxUsers : matrix.maxGross;
  const intensity = (cell: MatrixCell): number => {
    const value = shade === 'users' ? cell.users : cell.gross;
    return max > 0 ? Math.round(MIN_INTENSITY + (value / max) * (MAX_INTENSITY - MIN_INTENSITY)) : MIN_INTENSITY;
  };
  const describe = (cell: MatrixCell): string => t('{users}, {amount} of usage', { users: pluralize(cell.users, 'user'), amount: fmtUSD(cell.gross, 0) });
  const both = (row: TaxonomyItem, column: TaxonomyItem): string => t('{row} and {col}', { row: row.label, col: column.label });

  return (
    <Card
      title={t('Compare two lenses')}
      subtitle={t('Each cell counts the users who are in both groups. Select a cell to list them.')}
      calc="segment-matrix"
      footer={
        <>
          {t('Row and column totals are the full size of each group. The second line in a cell is the usage of those users.')}
          {matrix.overlaps ? ` ${t('Traits and the New and Lapsed flags overlap other groups, so a user can appear in more than one row or column.')}` : null}
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label={t('Rows')}>
          <Select aria-label={t('Lens for the rows')} value={rowId} onChange={chooseRows} options={options} />
        </Field>
        <Field label={t('Columns')}>
          <Select aria-label={t('Lens for the columns')} value={colId} onChange={chooseCols} options={options} />
        </Field>
        <Field label={t('Shade by')}>
          <Segmented size="sm" label={t('Shade cells by')} value={shade} onChange={setShade} options={shades} className="mb-0.5" />
        </Field>
      </div>

      {matrix.rows.length === 0 || matrix.cols.length === 0 ? (
        <EmptyState title={t('Nothing to compare')} description={t('One of the two lenses has no users in the data in view.')} />
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-max border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-1 text-start text-xs font-normal text-fg-subtle">
                  {t('{rows} by {columns}', { rows: t(rowLens.label), columns: t(colLens.label) })}
                </th>
                {matrix.cols.map((column) => (
                  <th key={column.id} scope="col" className="p-0.5 text-center align-bottom">
                    <HeaderButton
                      item={column}
                      active={activeCols.includes(column.id)}
                      title={t('Show users in {group}', { group: column.label })}
                      onClick={() => showCell(rowLens, null, colLens, column.id)}
                    />
                  </th>
                ))}
                <th scope="col" className="p-1 text-center text-xs font-medium text-fg-muted">
                  {t('All')}
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row, rowIndex) => (
                <tr key={row.id}>
                  <th scope="row" className="sticky start-0 z-10 bg-surface p-0.5 text-start">
                    <HeaderButton
                      item={row}
                      active={activeRows.includes(row.id)}
                      title={t('Show users in {group}', { group: row.label })}
                      onClick={() => showCell(rowLens, row.id, colLens, null)}
                    />
                  </th>
                  {matrix.cells[rowIndex].map((cell, columnIndex) => {
                    const column = matrix.cols[columnIndex];
                    const selected = activeRows.includes(row.id) && activeCols.includes(column.id);
                    return (
                      <td key={column.id} className="p-0">
                        {cell.users === 0 ? (
                          <span className={cx(CELL_BOX, 'bg-surface-2 text-fg-subtle')}>
                            <span aria-hidden="true">–</span>
                            <span className="sr-only">{t('{group}: no users', { group: both(row, column) })}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => showCell(rowLens, row.id, colLens, column.id)}
                            title={t('{group}: {numbers}', { group: both(row, column), numbers: describe(cell) })}
                            aria-label={t('{group}: {numbers}. Show these users.', { group: both(row, column), numbers: describe(cell) })}
                            className={cx(CELL_BOX, 'transition-shadow hover:ring-2 hover:ring-accent/60', selected && 'ring-2 ring-accent')}
                            style={{ background: `color-mix(in srgb, var(--accent) ${intensity(cell)}%, transparent)` }}
                          >
                            <CellBody cell={cell} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-0">
                    <button
                      type="button"
                      onClick={() => showCell(rowLens, row.id, colLens, null)}
                      title={t('{group}: {numbers}', { group: row.label, numbers: describe(matrix.rowTotals[rowIndex]) })}
                      aria-label={t('{group} in total: {numbers}. Show these users.', { group: row.label, numbers: describe(matrix.rowTotals[rowIndex]) })}
                      className={cx(CELL_BOX, 'bg-surface-2 hover:ring-2 hover:ring-accent/60')}
                    >
                      <CellBody cell={matrix.rowTotals[rowIndex]} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="sticky start-0 z-10 bg-surface p-1 text-start text-xs font-medium text-fg-muted">
                  {t('All')}
                </th>
                {matrix.colTotals.map((total, columnIndex) => (
                  <td key={matrix.cols[columnIndex].id} className="p-0">
                    <button
                      type="button"
                      onClick={() => showCell(rowLens, null, colLens, matrix.cols[columnIndex].id)}
                      title={t('{group}: {numbers}', { group: matrix.cols[columnIndex].label, numbers: describe(total) })}
                      aria-label={t('{group} in total: {numbers}. Show these users.', { group: matrix.cols[columnIndex].label, numbers: describe(total) })}
                      className={cx(CELL_BOX, 'bg-surface-2 hover:ring-2 hover:ring-accent/60')}
                    >
                      <CellBody cell={total} />
                    </button>
                  </td>
                ))}
                <td className="p-0">
                  <div className={cx(CELL_BOX, 'bg-surface-3')}>
                    <CellBody cell={matrix.all} />
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
