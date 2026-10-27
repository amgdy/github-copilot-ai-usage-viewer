import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FilterX, SearchX } from 'lucide-react';
import { Card, EmptyState, SearchInput, Select, Spinner } from '../../components/ui';
import { t, T, tp } from '../../i18n';
import { dataCoverage } from '../../lib/analytics/coverage';
import type { DataStore } from '../../lib/types';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { ColumnPicker } from './ColumnPicker';
import { exportFileName } from './csvExport';
import { DownloadButton } from './DownloadButton';
import { availableColumns, EXPLORER_COLUMNS, filterByQuery, pageRows, parseQuery, sumRows, type ColumnId } from './explorer';
import { ExplorerTable, type SortState } from './ExplorerTable';
import { useDebounced, useSortedScope } from './useRowSet';

const PAGE_SIZES = [50, 100, 250];
const INITIAL_HIDDEN: ReadonlySet<ColumnId> = new Set(EXPLORER_COLUMNS.filter((c) => c.hiddenByDefault).map((c) => c.id));
// Columns whose first click sorts from the largest or latest value.
const DESC_FIRST = new Set<ColumnId>([...EXPLORER_COLUMNS.filter((c) => c.numeric).map((c) => c.id), 'date']);

interface Props {
  store: DataStore;
  /** Indices of the rows in the current filters. */
  scope: Uint32Array;
  /** First and last day of the filtered period, for the name of the downloaded file. */
  range: { start: number; end: number };
}

function Pager({ current, pages, onPage }: { current: number; pages: number; onPage: (page: number) => void }) {
  const [jump, setJump] = useState('');
  const go = (e: FormEvent) => {
    e.preventDefault();
    const n = Number.parseInt(jump, 10);
    if (Number.isFinite(n)) onPage(Math.min(pages, Math.max(1, n)) - 1);
    setJump('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className="btn btn-sm" disabled={current === 0} onClick={() => onPage(0)} aria-label={t('First page')}>
        <ChevronsLeft size={14} className="rtl:-scale-x-100" />
      </button>
      <button type="button" className="btn btn-sm" disabled={current === 0} onClick={() => onPage(current - 1)} aria-label={t('Previous page')}>
        <ChevronLeft size={14} className="rtl:-scale-x-100" />
      </button>
      <form onSubmit={go} className="flex items-center gap-1.5">
        <label className="flex items-center gap-1.5">
          <T
            text="Page {page} of {pages}"
            values={{
              page: (
                <input
                  className="input num !w-16 !py-0.5 text-end text-xs"
                  inputMode="numeric"
                  value={jump}
                  placeholder={String(current + 1)}
                  onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
                  aria-label={t('Go to page')}
                />
              ),
              pages: <span className="num">{fmtInt(pages)}</span>,
            }}
          />
        </label>
        <button type="submit" className="btn btn-sm" disabled={jump === ''}>
          {t('Go')}
        </button>
      </form>
      <button type="button" className="btn btn-sm" disabled={current >= pages - 1} onClick={() => onPage(current + 1)} aria-label={t('Next page')}>
        <ChevronRight size={14} className="rtl:-scale-x-100" />
      </button>
      <button type="button" className="btn btn-sm" disabled={current >= pages - 1} onClick={() => onPage(pages - 1)} aria-label={t('Last page')}>
        <ChevronsRight size={14} className="rtl:-scale-x-100" />
      </button>
    </div>
  );
}

export function RowsExplorer({ store, scope, range }: Props) {
  const [text, setText] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Set<ColumnId>>(() => new Set(INITIAL_HIDDEN));
  const [seenScope, setSeenScope] = useState(scope);

  // The filters changed: start again on the first page.
  if (seenScope !== scope) {
    setSeenScope(scope);
    setPage(0);
  }

  const columns = useMemo(() => availableColumns(store), [store]);
  const visible = useMemo(() => columns.filter((c) => !hidden.has(c.id)), [columns, hidden]);
  const billing = useMemo(() => dataCoverage(store).billing, [store]);

  const debounced = useDebounced(text, 220);
  const terms = useMemo(() => parseQuery(debounced), [debounced]);
  const { order, pending } = useSortedScope(store, scope, sort?.col ?? null);
  const rows = useMemo(() => filterByQuery(store, order, terms), [store, order, terms]);
  const sums = useMemo(() => sumRows(store, rows), [store, rows]);

  const reverse = sort?.dir === 'desc';
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const start = current * pageSize;
  const shown = useMemo(() => pageRows(rows, reverse, start, pageSize), [rows, reverse, start, pageSize]);

  const toggleSort = useCallback((id: ColumnId) => {
    const first = DESC_FIRST.has(id) ? 'desc' : 'asc';
    setSort((prev) => {
      if (!prev || prev.col !== id) return { col: id, dir: first };
      return prev.dir === first ? { col: id, dir: first === 'asc' ? 'desc' : 'asc' } : null;
    });
    setPage(0);
  }, []);

  const searching = terms.length > 0;
  const emptyScope = scope.length === 0;
  const noMatch = !emptyScope && rows.length === 0;

  const scopeText =
    scope.length === store.n
      ? tp(store.n, 'The only row you loaded.', 'All {n} rows you loaded.', { n: fmtInt(store.n) })
      : t('Your filters keep {n} of {total} rows.', { n: fmtInt(scope.length), total: fmtInt(store.n) });

  return (
    <Card
      title={t('Rows explorer')}
      calc="data-rows-explorer"
      subtitle={
        emptyScope
          ? t('The rows in your current filters.')
          : `${scopeText} ${t('Click a column to sort. Search words must all match.')}`
      }
      actions={
        emptyScope ? null : (
          <div className="flex flex-wrap items-center gap-2">
            {pending ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted" role="status">
                <Spinner size={12} /> {tp(scope.length, 'Sorting {n} row…', 'Sorting {n} rows…', { n: fmtInt(scope.length) })}
              </span>
            ) : null}
            <Select
              aria-label={t('Rows per page')}
              className="!py-0.5 text-xs"
              value={pageSize}
              order="given"
              onChange={(size) => {
                setPage(Math.floor(start / size));
                setPageSize(size);
              }}
              options={PAGE_SIZES.map((n) => ({ value: n, label: t('{n} per page', { n: fmtInt(n) }) }))}
            />
            <ColumnPicker columns={columns} hidden={hidden} initialHidden={INITIAL_HIDDEN} onChange={setHidden} />
            <DownloadButton
              store={store}
              rows={rows}
              reverse={reverse}
              disabled={pending}
              label={t('Download rows (CSV)')}
              hint={searching ? t('Downloads the rows that match your search, in the order shown.') : t('Downloads these rows in the order shown.')}
              fileName={exportFileName(range.start, range.end, searching ? '_search' : '')}
            />
          </div>
        )
      }
      footer={
        emptyScope ? undefined : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <span className="num">
                {tp(rows.length, 'Showing {from} to {to} of {n} matching row', 'Showing {from} to {to} of {n} matching rows', {
                  from: fmtInt(rows.length ? start + 1 : 0),
                  to: fmtInt(Math.min(rows.length, start + pageSize)),
                  n: fmtInt(rows.length),
                })}
                {searching ? ` ${t('(from {n} in scope)', { n: fmtInt(scope.length) })}` : ''}
              </span>
              <span className="num">
                <T
                  text="All matching rows: usage {usage} · covered {covered} · billed {billed}"
                  values={{
                    usage: <b className="text-fg">{fmtUSD(sums.gross, 2)}</b>,
                    covered: <b className="text-fg">{fmtUSD(sums.discount, 2)}</b>,
                    billed: <b className="text-fg">{fmtUSD(sums.net, 2)}</b>,
                  }}
                />
              </span>
            </div>
            {!billing ? <p>{t('Files with neither a discount_amount nor a net_amount column count as $0 for covered and billed.')}</p> : null}
            <Pager current={current} pages={pages} onPage={setPage} />
          </div>
        )
      }
    >
      {emptyScope ? (
        <EmptyState
          icon={<FilterX size={24} />}
          title={t('No rows match the current filters')}
          description={t('Widen the date range or remove some filters to see rows.')}
          action={
            <button type="button" className="btn btn-primary" onClick={() => useApp.getState().resetFilters()}>
              {t('Clear all filters')}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          <SearchInput
            value={text}
            onChange={(v) => {
              setText(v);
              setPage(0);
            }}
            placeholder={t('Search user, model, repository, SKU, organization or cost center')}
            className="w-full max-w-xl"
          />
          {noMatch ? (
            <EmptyState
              icon={<SearchX size={22} />}
              title={t('No rows match your search')}
              description={t('Try fewer words or a shorter part of a name.')}
              action={
                <button type="button" className="btn" onClick={() => setText('')}>
                  {t('Clear search')}
                </button>
              }
            />
          ) : (
            <ExplorerTable store={store} columns={visible} rows={shown} sort={sort} onSort={toggleSort} pending={pending} />
          )}
        </div>
      )}
    </Card>
  );
}
