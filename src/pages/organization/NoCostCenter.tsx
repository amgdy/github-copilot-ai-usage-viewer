import { useMemo } from 'react';
import { Callout, Card, DataTable, DocLinks, TaxBadge, taxLookup, type Column } from '../../components/ui';
import { t, tp } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { namedCount } from './dimensions';

/** Active users that no cost center covers, or a hint on cost centers when the report has none. */
export function NoCostCenter() {
  const { analysis, taxonomy } = useAnalysis();
  const { users, agg, narrowed, coverage } = analysis;
  const selectUser = useApp((s) => s.selectUser);
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);
  const missing = useMemo(() => (users.hasCostCenters ? users.profiles.filter((p) => p.costCenter === '') : []), [users]);
  const totalGross = agg.totals.gross;
  const billing = coverage.billing;

  const columns = useMemo<Column<UserProfile>[]>(() => {
    const cols: Column<UserProfile>[] = [
      {
        key: 'user',
        header: t('User'),
        value: (p) => p.name,
        render: (p) => (
          <span className="block max-w-[28ch] truncate" title={p.name}>
            {p.name}
          </span>
        ),
      },
      { key: 'persona', header: t('Persona'), calc: 'persona-groups', value: (p) => personas[p.persona]?.label ?? '', render: (p) => <TaxBadge item={personas[p.persona]} /> },
      { key: 'usage', header: t('Usage'), calc: 'usage', align: 'end', value: (p) => p.gross, render: (p) => fmtUSD(p.gross) },
      {
        key: 'share',
        header: t('Share of usage'),
        calc: 'org-no-cost-center',
        align: 'end',
        value: (p) => (totalGross > 0 ? p.gross / totalGross : null),
        render: (p) => (totalGross > 0 ? fmtPct(p.gross / totalGross, 1) : '–'),
      },
    ];
    if (billing) {
      cols.push({ key: 'billed', header: t('Billed'), hint: t('Billed on top of seats'), calc: 'billed', align: 'end', value: (p) => p.net, render: (p) => fmtUSD(p.net) });
    }
    return cols;
  }, [personas, totalGross, billing]);

  if (!users.hasCostCenters) {
    if (namedCount(agg, 'costCenter') > 0) return null;
    return (
      <Callout title={narrowed ? t('No cost centers in these rows') : t('No cost centers in this report')}>
        {t(
          'A cost center groups organizations, repositories or users for billing. With cost centers, the bill can be split by team and charged back instead of staying in one pool. Without them, usage can only be split by organization, repository or product.',
        )}
        <DocLinks topic="costCenters" title={t('Learn more')} compact className="mt-2" />
      </Callout>
    );
  }

  if (missing.length === 0) return null;

  const gross = missing.reduce((a, p) => a + p.gross, 0);
  const users$ = tp(missing.length, '1 active user', '{n} active users');

  return (
    <Card
      title={t('Users without a cost center')}
      subtitle={
        totalGross > 0
          ? t('{users} · {usd} of usage ({pct})', { users: users$, usd: fmtUSD(gross), pct: fmtPct(gross / totalGross, 1) })
          : t('{users} · {usd} of usage', { users: users$, usd: fmtUSD(gross) })
      }
      calc="org-no-cost-center"
      actions={
        <button type="button" className="btn btn-sm" onClick={() => drill({ traits: ['noCostCenter'] }, { page: 'users', merge: true })}>
          {t('Show users')}
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          {t(
            'Usage that no cost center covers cannot be charged back. In the allocation above it stays in the Unassigned row. Assign these users to a cost center and load a new report to move it to the right team.',
          )}
        </p>
        <DataTable
          rows={missing}
          columns={columns}
          rowKey={(p) => p.id}
          defaultSort={{ key: 'usage', dir: 'desc' }}
          pageSize={10}
          dense
          fixedColumns
          searchable={missing.length > 10}
          searchPlaceholder={t('Search users…')}
          exportName="github-copilot-users-without-cost-center"
          onRowClick={(p) => selectUser(p.id)}
        />
        <DocLinks topic="costCenters" title={t('Learn more')} compact />
      </div>
    </Card>
  );
}
