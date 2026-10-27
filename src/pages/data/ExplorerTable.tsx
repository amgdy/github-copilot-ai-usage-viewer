import { memo } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { CalcInfo, cx } from '../../components/ui';
import { t } from '../../i18n';
import { labelOf, type DataStore } from '../../lib/types';
import { useApp } from '../../state/store';
import { cell, type ColumnId, type ExplorerColumn } from './explorer';

export interface SortState {
  col: ColumnId;
  dir: 'asc' | 'desc';
}

interface Props {
  store: DataStore;
  columns: ExplorerColumn[];
  /** Row indices of the page. */
  rows: number[];
  sort: SortState | null;
  onSort: (columnId: ColumnId) => void;
  pending: boolean;
}

function Cell({ store, col: column, i: rowIndex }: { store: DataStore; col: ExplorerColumn; i: number }) {
  const content = cell(store, column, rowIndex);
  const base = 'border-b border-border-muted px-3 py-1.5';
  const userId = column.id === 'user' ? (content.id ?? 0) : 0;

  if (column.numeric) {
    return (
      <td className={cx(base, 'num text-end')} title={content.title}>
        {content.text}
      </td>
    );
  }
  if (column.dim) {
    if (content.text === '') {
      return (
        <td className={cx(base, 'text-fg-subtle')} title={labelOf(column.dim, '')}>
          –
        </td>
      );
    }
    return (
      <td className={base}>
        {userId > 0 ? (
          <button
            type="button"
            className="block max-w-64 truncate text-start text-accent hover:underline"
            title={t('{name}: show details', { name: content.text })}
            onClick={() => useApp.getState().selectUser(userId)}
          >
            {content.text}
          </button>
        ) : (
          <span className="block max-w-64 truncate" title={content.text}>
            {content.text}
          </span>
        )}
      </td>
    );
  }
  return <td className={cx(base, 'num whitespace-nowrap', column.id === 'auto' && !store.auto[rowIndex] && 'text-fg-muted')}>{content.text}</td>;
}

/** One page of rows. Only the rows of the page are rendered, so the data set can be any size. */
export const ExplorerTable = memo(function ExplorerTable({ store, columns, rows, sort, onSort, pending }: Props) {
  return (
    <div className={cx('overflow-auto rounded-lg border border-border transition-opacity max-h-[min(70vh,40rem)]', pending && 'opacity-60')} aria-busy={pending}>
      <table className="w-full min-w-max text-start text-sm">
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.col === column.id;
              const head = (
                <button type="button" onClick={() => onSort(column.id)} className={cx('inline-flex items-center gap-1 hover:text-fg', column.numeric && 'flex-row-reverse', active && 'text-fg')}>
                  {t(column.header)}
                  {active ? sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ChevronsUpDown size={12} className="opacity-40" />}
                </button>
              );
              return (
                <th
                  key={column.id}
                  scope="col"
                  title={column.hint ? t(column.hint) : undefined}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cx('sticky top-0 z-10 whitespace-nowrap border-b border-border bg-surface-2 px-3 py-2 text-xs font-medium text-fg-muted', column.numeric && 'text-end')}
                >
                  {column.calc ? (
                    <span className={cx('inline-flex items-center gap-1', column.numeric && 'flex-row-reverse')}>
                      {head}
                      <CalcInfo id={column.calc} />
                    </span>
                  ) : (
                    head
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((rowIndex) => (
            <tr key={rowIndex} className="hover:bg-surface-2">
              {columns.map((column) => (
                <Cell key={column.id} store={store} col={column} i={rowIndex} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
