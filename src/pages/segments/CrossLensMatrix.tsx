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
  const filters = useApp((s) => s.filters);
  const [rowPick, setRowPick] = useState<LensId>('tier');
  const [colPick, setColPick] = useState<LensId>('engagement');
  const [shade, setShade] = useState<Shade>('users');

  // A lens whose groups would be meaningless in this data (Auto use class without a model column) is not offered.
  const offered = useMemo(() => LENSES.filter((l) => lensUnavailableReason(l.id, availability) === null), [availability]);
  const options = useMemo(() => offered.map((l) => ({ value: l.id, label: t(l.label) })), [offered]);
  const shades = useMemo(() => SHADES.map((s) => ({ ...s, label: t(s.label), title: t(s.title) })), []);
  const [rowId, colId] = pickLenses(
    rowPick,
    colPick,
    offered.map((l) => l.id),
  );
  const rowLens = LENS_BY_ID[rowId];
  const colLens = LENS_BY_ID[colId];

  const chooseRows = (v: LensId) => {
    if (v === colId) setColPick(rowId);
    setRowPick(v);
  };
  const chooseCols = (v: LensId) => {
    if (v === rowId) setRowPick(colId);
    setColPick(v);
  };

  const m = useMemo(() => buildMatrix(rowLens, colLens, taxonomy, population), [rowLens, colLens, taxonomy, population]);
  const activeRows = filters[rowLens.filterKey];
  const activeCols = filters[colLens.filterKey];
  const max = shade === 'users' ? m.maxUsers : m.maxGross;
  const intensity = (c: MatrixCell): number => {
    const v = shade === 'users' ? c.users : c.gross;
    return max > 0 ? Math.round(MIN_INTENSITY + (v / max) * (MAX_INTENSITY - MIN_INTENSITY)) : MIN_INTENSITY;
  };
  const describe = (c: MatrixCell): string => t('{users}, {amount} of usage', { users: pluralize(c.users, 'user'), amount: fmtUSD(c.gross, 0) });
  const both = (row: TaxonomyItem, col: TaxonomyItem): string => t('{row} and {col}', { row: row.label, col: col.label });

  return (
    <Card
      title={t('Compare two lenses')}
      subtitle={t('Each cell counts the users who are in both groups. Select a cell to list them.')}
      calc="segment-matrix"
      footer={
        <>
          {t('Row and column totals are the full size of each group. The second line in a cell is the usage of those users.')}
          {m.overlaps ? ` ${t('Traits and the New and Lapsed flags overlap other groups, so a user can appear in more than one row or column.')}` : null}
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

      {m.rows.length === 0 || m.cols.length === 0 ? (
        <EmptyState title={t('Nothing to compare')} description={t('One of the two lenses has no users in the data in view.')} />
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-max border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-1 text-start text-xs font-normal text-fg-subtle">
                  {t('{rows} by {columns}', { rows: t(rowLens.label), columns: t(colLens.label) })}
                </th>
                {m.cols.map((col) => (
                  <th key={col.id} scope="col" className="p-0.5 text-center align-bottom">
                    <HeaderButton
                      item={col}
                      active={activeCols.includes(col.id)}
                      title={t('Show users in {group}', { group: col.label })}
                      onClick={() => showCell(rowLens, null, colLens, col.id)}
                    />
                  </th>
                ))}
                <th scope="col" className="p-1 text-center text-xs font-medium text-fg-muted">
                  {t('All')}
                </th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((row, ri) => (
                <tr key={row.id}>
                  <th scope="row" className="sticky start-0 z-10 bg-surface p-0.5 text-start">
                    <HeaderButton
                      item={row}
                      active={activeRows.includes(row.id)}
                      title={t('Show users in {group}', { group: row.label })}
                      onClick={() => showCell(rowLens, row.id, colLens, null)}
                    />
                  </th>
                  {m.cells[ri].map((cell, ci) => {
                    const col = m.cols[ci];
                    const selected = activeRows.includes(row.id) && activeCols.includes(col.id);
                    return (
                      <td key={col.id} className="p-0">
                        {cell.users === 0 ? (
                          <span className={cx(CELL_BOX, 'bg-surface-2 text-fg-subtle')}>
                            <span aria-hidden="true">–</span>
                            <span className="sr-only">{t('{group}: no users', { group: both(row, col) })}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => showCell(rowLens, row.id, colLens, col.id)}
                            title={t('{group}: {numbers}', { group: both(row, col), numbers: describe(cell) })}
                            aria-label={t('{group}: {numbers}. Show these users.', { group: both(row, col), numbers: describe(cell) })}
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
                      title={t('{group}: {numbers}', { group: row.label, numbers: describe(m.rowTotals[ri]) })}
                      aria-label={t('{group} in total: {numbers}. Show these users.', { group: row.label, numbers: describe(m.rowTotals[ri]) })}
                      className={cx(CELL_BOX, 'bg-surface-2 hover:ring-2 hover:ring-accent/60')}
                    >
                      <CellBody cell={m.rowTotals[ri]} />
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
                {m.colTotals.map((total, ci) => (
                  <td key={m.cols[ci].id} className="p-0">
                    <button
                      type="button"
                      onClick={() => showCell(rowLens, null, colLens, m.cols[ci].id)}
                      title={t('{group}: {numbers}', { group: m.cols[ci].label, numbers: describe(total) })}
                      aria-label={t('{group} in total: {numbers}. Show these users.', { group: m.cols[ci].label, numbers: describe(total) })}
                      className={cx(CELL_BOX, 'bg-surface-2 hover:ring-2 hover:ring-accent/60')}
                    >
                      <CellBody cell={total} />
                    </button>
                  </td>
                ))}
                <td className="p-0">
                  <div className={cx(CELL_BOX, 'bg-surface-3')}>
                    <CellBody cell={m.all} />
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
