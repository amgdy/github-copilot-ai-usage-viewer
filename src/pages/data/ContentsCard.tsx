import { Filter } from 'lucide-react';
import { Card, ProgressBar } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { labelOf, type DataStore } from '../../lib/types';
import { fmtInt, fmtUSD, pluralize } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { topIds } from '../shared';
import { SCAN_DIMS, type DimScan, type ScanDim, type StoreScan } from './scan';
import { fmtShare } from './text';

type Missing = (n: number) => string;

const META: Record<ScanDim, { title: string; missing: Missing }> = {
  user: { title: msg('Users'), missing: (n) => tp(n, '{n} row has no username', '{n} rows have no username', { n: fmtInt(n) }) },
  product: { title: msg('Products'), missing: (n) => tp(n, '{n} row has no product', '{n} rows have no product', { n: fmtInt(n) }) },
  sku: { title: msg('SKUs'), missing: (n) => tp(n, '{n} row has no SKU', '{n} rows have no SKU', { n: fmtInt(n) }) },
  model: { title: msg('Models'), missing: (n) => tp(n, '{n} row has no model', '{n} rows have no model', { n: fmtInt(n) }) },
  org: { title: msg('Organizations'), missing: (n) => tp(n, '{n} row has no organization', '{n} rows have no organization', { n: fmtInt(n) }) },
  app: { title: msg('Apps'), missing: (n) => tp(n, '{n} row has no app client', '{n} rows have no app client', { n: fmtInt(n) }) },
  repo: { title: msg('Repositories'), missing: (n) => tp(n, '{n} row has no repository', '{n} rows have no repository', { n: fmtInt(n) }) },
  costCenter: { title: msg('Cost centers'), missing: (n) => tp(n, '{n} row has no cost center', '{n} rows have no cost center', { n: fmtInt(n) }) },
};

const TOP = 3;

function blankLine(d: DimScan, total: StoreScan, missing: Missing): string {
  if (d.blankRows === 0) return t('Set on every row');
  if (d.blankRows === total.rows) return t('Empty on every row');
  const line = missing(d.blankRows);
  return total.gross > 0 ? t('{text} ({share} of usage)', { text: line, share: fmtShare(d.blankGross / total.gross) }) : line;
}

function Tile({ store, scan, dim }: { store: DataStore; scan: StoreScan; dim: ScanDim }) {
  const d = scan.dims[dim];
  const title = t(META[dim].title);
  const values = store.dicts[dim].values;
  const named = { include: (id: number) => id !== d.blankId };
  const byUsage = topIds(d.gross, TOP, named);
  // Without any gross amount, rank by rows so the tile still shows something useful.
  const top = byUsage.length > 0 || d.distinct === 0 ? byUsage : topIds(d.rows, TOP, named);
  const rankedByRows = byUsage.length === 0 && top.length > 0;
  const base = rankedByRows ? scan.rows : scan.gross;

  return (
    <div className="min-w-0 rounded-lg border border-border-muted p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <span className="num text-lg font-semibold" title={pluralize(d.distinct, 'distinct value')}>
          {fmtInt(d.distinct)}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-fg-muted">{blankLine(d, scan, META[dim].missing)}</p>
      {rankedByRows ? <p className="mt-0.5 text-xs text-fg-muted">{t('Ranked by rows, as no value has usage.')}</p> : null}
      {top.length > 0 ? (
        <ol
          className="mt-3 space-y-2"
          aria-label={rankedByRows ? t('Top values of {group} by rows', { group: title }) : t('Top values of {group} by usage', { group: title })}
        >
          {top.map((id) => {
            const amount = rankedByRows ? d.rows[id] : d.gross[id];
            const share = base > 0 ? amount / base : 0;
            const name = labelOf(dim, values[id]);
            const detail = t('{name}: {usage} in {rows}', { name, usage: fmtUSD(d.gross[id]), rows: pluralize(d.rows[id], 'row') });
            return (
              <li key={id} className="min-w-0 text-xs" title={detail}>
                <div className="flex items-baseline justify-between gap-2">
                  {dim === 'user' && id > 0 ? (
                    <button type="button" className="min-w-0 truncate text-start text-accent hover:underline" onClick={() => useApp.getState().selectUser(id)}>
                      {name}
                    </button>
                  ) : (
                    <span className="min-w-0 truncate">{name}</span>
                  )}
                  <span className="num shrink-0 text-fg-muted">{fmtShare(share)}</span>
                </div>
                <ProgressBar
                  className="mt-1"
                  height={4}
                  value={share}
                  label={rankedByRows ? t('{name}: share of rows', { name }) : t('{name}: share of usage', { name })}
                />
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

export function ContentsCard({ store, scan }: { store: DataStore; scan: StoreScan }) {
  return (
    <Card
      title={t('What is in the data')}
      subtitle={t('Distinct values, rows with an empty value and the three biggest values by usage, for everything you loaded.')}
      calc={['data-distinct-values', 'data-top-values']}
      actions={
        <button type="button" className="btn btn-sm" onClick={() => useApp.getState().setFilterDrawerOpen(true)}>
          <Filter size={13} /> {t('Open filters')}
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SCAN_DIMS.map((dim) => (
          <Tile key={dim} store={store} scan={scan} dim={dim} />
        ))}
      </div>
    </Card>
  );
}
