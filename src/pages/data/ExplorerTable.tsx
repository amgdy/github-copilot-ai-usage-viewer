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
  onSort: (col: ColumnId) => void;
  pending: boolean;
}

function Cell({ store, col, i }: { store: DataStore; col: ExplorerColumn; i: number }) {
  const c = cell(store, col, i);
  const base = 'border-b border-border-muted px-3 py-1.5';
  const userId = col.id === 'user' ? (c.id ?? 0) : 0;

  if (col.numeric) {
    return (
      <td className={cx(base, 'num text-end')} title={c.title}>
        {c.text}
      </td>
    );
  }
  if (col.dim) {
    if (c.text === '') {
      return (
        <td className={cx(base, 'text-fg-subtle')} title={labelOf(col.dim, '')}>
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
            title={t('{name}: show details', { name: c.text })}
            onClick={() => useApp.getState().selectUser(userId)}
          >
            {c.text}
          </button>
        ) : (
          <span className="block max-w-64 truncate" title={c.text}>
            {c.text}
          </span>
        )}
      </td>
    );
  }
  return <td className={cx(base, 'num whitespace-nowrap', col.id === 'auto' && !store.auto[i] && 'text-fg-muted')}>{c.text}</td>;
}

/** One page of rows. Only the rows of the page are rendered, so the data set can be any size. */
export const ExplorerTable = memo(function ExplorerTable({ store, columns, rows, sort, onSort, pending }: Props) {
  return (
    <div className={cx('overflow-auto rounded-lg border border-border transition-opacity max-h-[min(70vh,40rem)]', pending && 'opacity-60')} aria-busy={pending}>
      <table className="w-full min-w-max text-start text-sm">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.col === c.id;
              const head = (
                <button type="button" onClick={() => onSort(c.id)} className={cx('inline-flex items-center gap-1 hover:text-fg', c.numeric && 'flex-row-reverse', active && 'text-fg')}>
                  {t(c.header)}
                  {active ? sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ChevronsUpDown size={12} className="opacity-40" />}
                </button>
              );
              return (
                <th
                  key={c.id}
                  scope="col"
                  title={c.hint ? t(c.hint) : undefined}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cx('sticky top-0 z-10 whitespace-nowrap border-b border-border bg-surface-2 px-3 py-2 text-xs font-medium text-fg-muted', c.numeric && 'text-end')}
                >
                  {c.calc ? (
                    <span className={cx('inline-flex items-center gap-1', c.numeric && 'flex-row-reverse')}>
                      {head}
                      <CalcInfo id={c.calc} />
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
          {rows.map((i) => (
            <tr key={i} className="hover:bg-surface-2">
              {columns.map((c) => (
                <Cell key={c.id} store={store} col={c} i={i} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
