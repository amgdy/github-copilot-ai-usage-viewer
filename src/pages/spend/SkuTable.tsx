import { useMemo } from 'react';
import { ProductIcon } from '../../components/icons';
import { Card, DataTable, type Column } from '../../components/ui';
import { t } from '../../i18n';
import { labelOf } from '../../lib/types';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { buildSkuRows, type SkuRow } from './helpers';

const cents = (v: number): number | null => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const sum = (rows: SkuRow[], f: (r: SkuRow) => number): number => rows.reduce((a, r) => a + f(r), 0);

export function SkuTable() {
  const { analysis, store } = useAnalysis();
  const { agg, mask, range, coverage } = analysis;
  const billing = coverage.billing;
  const rows = useMemo(() => buildSkuRows(store, mask, range, agg), [store, mask, range, agg]);
  const users = agg.totals.users;

  const columns = useMemo<Column<SkuRow>[]>(() => {
    const cols: Column<SkuRow>[] = [
      {
        key: 'sku',
        header: t('SKU'),
        value: (r) => r.sku,
        render: (r) => (
          <span className="inline-flex items-center gap-1.5 font-medium">
            {r.productIds[0] ? <ProductIcon product={r.productIds[0]} size={13} className="shrink-0 text-fg-muted" /> : null}
            {r.sku}
          </span>
        ),
      },
      {
        key: 'product',
        header: t('Product'),
        value: (r) => r.products,
        render: (r) =>
          r.productIds.length ? (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {r.productIds.map((p) => (
                <span key={p} className="inline-flex items-center gap-1">
                  <ProductIcon product={p} size={12} className="shrink-0 text-fg-muted" />
                  {labelOf('product', p)}
                </span>
              ))}
            </span>
          ) : (
            '–'
          ),
        hint: t('The product or products that bill under this SKU.'),
      },
      {
        key: 'credits',
        header: t('AI credits'),
        align: 'end',
        hint: t('AI credits used.'),
        calc: 'ai-credit',
        value: (r) => Math.round(r.credits),
        render: (r) => fmtInt(r.credits),
        total: (rs) => fmtInt(sum(rs, (r) => r.credits)),
      },
      {
        key: 'usage',
        header: t('Usage'),
        align: 'end',
        hint: t('Value of the AI credits used.'),
        calc: 'usage',
        csvHeader: t('Usage (USD)'),
        value: (r) => cents(r.gross),
        render: (r) => fmtUSD(r.gross),
        total: (rs) => fmtUSD(sum(rs, (r) => r.gross)),
      },
    ];
    if (billing) {
      cols.push(
        {
          key: 'covered',
          header: t('Covered'),
          align: 'end',
          hint: t('Usage paid for by the included credits.'),
          calc: 'covered',
          csvHeader: t('Covered by included credits (USD)'),
          value: (r) => cents(r.covered),
          render: (r) => fmtUSD(r.covered),
          total: (rs) => fmtUSD(sum(rs, (r) => r.covered)),
        },
        {
          key: 'billed',
          header: t('Billed'),
          align: 'end',
          hint: t('Usage beyond the included credits, billed on top of seats.'),
          calc: 'billed',
          csvHeader: t('Billed on top of seats (USD)'),
          value: (r) => cents(r.billed),
          render: (r) => <span className={r.billed > 0.005 ? 'font-medium text-warn' : undefined}>{fmtUSD(r.billed)}</span>,
          total: (rs) => fmtUSD(sum(rs, (r) => r.billed)),
        },
      );
    }
    cols.push(
      {
        key: 'share',
        header: t('Share of usage'),
        align: 'end',
        hint: t('Usage of the SKU divided by the usage of all SKUs.'),
        calc: 'usage-by-sku',
        csvHeader: t('Share of usage (%)'),
        value: (r) => Math.round(r.share * 1000) / 10,
        render: (r) => fmtPct(r.share, 1),
      },
      {
        key: 'users',
        header: t('Users'),
        align: 'end',
        hint: t('People with at least one row under this SKU. Rows without a username are not counted.'),
        calc: 'usage-by-sku',
        value: (r) => r.users,
        render: (r) => (r.users > 0 ? fmtInt(r.users) : '–'),
        total: () => fmtInt(users),
      },
    );
    return cols;
  }, [users, billing]);

  return (
    <Card title={t('Usage by SKU')} subtitle={t('Click a row to keep only that SKU.')} calc="usage-by-sku">
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultSort={{ key: 'usage', dir: 'desc' }}
        pageSize={10}
        searchable
        searchPlaceholder={t('Search SKUs…')}
        exportName="github-copilot-usage-by-sku"
        onRowClick={(r) => drill({ skus: [store.dicts.sku.values[r.id]] }, { merge: true })}
        emptyText={t('No usage in this period')}
      />
    </Card>
  );
}
