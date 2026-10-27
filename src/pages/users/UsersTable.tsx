import { useCallback, useMemo, useState } from 'react';
import { Callout, Card, DataTable, Segmented, taxLookup } from '../../components/ui';
import { seatStatusLabel, seatStatusOf } from '../../components/user/license';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { USERS_VIEWS, VIEW_SORT, type UserColumns, type UsersView } from './columns';

export function UsersTable({ columns }: { columns: UserColumns }) {
  const { analysis, taxonomy } = useAnalysis();
  const selected = useApp((state) => state.selectedUser);
  const [chosen, setView] = useState<UsersView>('general');
  // The License view disappears when the license list is removed.
  const view: UsersView = chosen === 'license' && !columns.hasLicense ? 'general' : chosen;
  const rows = analysis.users.profiles;
  const { coverage } = analysis;

  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);
  const tiers = useMemo(() => taxLookup(taxonomy.tiers), [taxonomy]);
  const autoUse = useMemo(() => taxLookup(taxonomy.autoUse), [taxonomy]);

  const viewOptions = useMemo(
    () =>
      USERS_VIEWS.filter((option) => option.value !== 'license' || columns.hasLicense).map((option) => ({
        value: option.value,
        label: t(option.label),
        title: t(option.title),
      })),
    [columns.hasLicense],
  );

  const searchText = useCallback(
    (user: UserProfile) => {
      const status = seatStatusOf(user.license);
      return [
        user.name,
        user.org,
        user.costCenter,
        user.plan,
        personas[user.persona].label,
        tiers[user.tier].label,
        coverage.models ? autoUse[user.autoUse].label : '',
        user.topModel,
        status === null ? '' : seatStatusLabel(status),
      ]
        .filter(Boolean)
        .join(' ');
    },
    [personas, tiers, autoUse, coverage.models],
  );

  // Share of the usage in view that the cost by token type covers.
  const splitShare = useMemo(() => {
    const gross = rows.reduce((total, user) => total + user.gross, 0);
    return gross > 0 ? rows.reduce((covered, user) => covered + user.tokenCoverage * user.gross, 0) / gross : 0;
  }, [rows]);

  const noSeat = useMemo(() => rows.filter((user) => user.license && !user.license.seat).length, [rows]);

  return (
    <Card
      title={t('All users')}
      subtitle={t('{users}. Click a row to open the user. Use Columns to show more.', { users: pluralize(rows.length, 'user') })}
      calc="user-table"
    >
      {view === 'tokens' && !coverage.tokens ? (
        <Callout tone="info" title={t('This file has no token columns')} className="mb-2">
          {t(
            'Token counts, the cache hit rate and the cost by token type need the input, cache_read, cache_write and output columns, so these cells show a dash.',
          )}
        </Callout>
      ) : null}
      {view === 'tokens' && coverage.tokens && splitShare < 0.995 ? (
        <p className="mb-2 text-xs text-fg-muted">
          {t(
            'The cost by token type covers {share} of the usage in view. Only rows with token counts and a model on the price card are split by token type. Token coverage shows the share for each user.',
            { share: fmtPct(splitShare, 0) },
          )}
        </p>
      ) : null}
      {view === 'auto' && !coverage.models ? (
        <Callout tone="info" title={t('This file has no model names')} className="mb-2">
          {t('Auto usage cannot be told apart from models picked by hand, so the Auto columns show a dash.')}
        </Callout>
      ) : null}
      {view === 'auto' && coverage.models ? (
        <p className="mb-2 text-xs text-fg-muted">
          {t(
            'Discount missed on hand-picked usage is an estimate: hand-picked usage × the Auto discount rate of the plan of the user. Auto discount received is measured from token counts where the file allows it.',
          )}
        </p>
      ) : null}
      {view === 'license' ? (
        <p className="mb-2 text-xs text-fg-muted">
          {noSeat > 0
            ? t('The seat details come from the license list. {users} in this view have usage but no seat in the list.', { users: pluralize(noSeat, 'user') })
            : t('The seat details come from the license list. Every user in this view has a seat in the list.')}
        </p>
      ) : null}
      <DataTable
        key={view}
        rows={rows}
        columns={columns.byView[view]}
        rowKey={(user) => user.id}
        defaultSort={VIEW_SORT[view]}
        searchable={searchText}
        searchPlaceholder={t('Search users, teams, models')}
        exportName={view === 'general' ? 'github-copilot-users' : `github-copilot-users-${view}`}
        dense
        selectedKey={selected}
        onRowClick={(user) => useApp.getState().selectUser(user.id)}
        emptyText={t('No users match.')}
        toolbar={<Segmented label={t('Table view')} value={view} onChange={setView} options={viewOptions} size="sm" />}
      />
    </Card>
  );
}
