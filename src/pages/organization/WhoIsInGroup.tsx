import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, TaxBadge, taxLookup } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { GroupName } from './bits';
import type { DimSpec } from './dimensions';
import { topUsersByGroup, type Group, type GroupColumn } from './groups';

const LIMIT = 30;
const TOP_USERS = 5;

/** The people behind each group: an expandable list with the heaviest users of every group. */
export function WhoIsInGroup({ column, groups, onSelect }: { spec: DimSpec; column: GroupColumn; groups: Group[]; onSelect: (id: number) => void }) {
  const { analysis, store, taxonomy } = useAnalysis();
  const { mask, range, users } = analysis;
  const selectUser = useApp((s) => s.selectUser);
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);
  const named = useMemo(() => groups.filter((g) => !g.blank), [groups]);
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(() => (showAll ? named : named.slice(0, LIMIT)), [named, showAll]);
  const tops = useMemo(
    () =>
      topUsersByGroup(
        store,
        mask,
        range,
        column,
        visible.map((g) => g.id),
        TOP_USERS,
      ),
    [store, mask, range, column, visible],
  );

  if (named.length === 0) return null;

  return (
    <Card
      title={t('Who is in each group')}
      subtitle={tp(TOP_USERS, 'The user with the most usage in each group. Click a user to open the details.', 'The {n} users with the most usage in each group. Click a user to open the details.')}
      calc="org-top-users"
    >
      <div className="divide-y divide-border-muted overflow-hidden rounded-lg border border-border">
        {visible.map((g, i) => {
          const list = tops.get(g.id) ?? [];
          return (
            <details key={g.id} open={i === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight size={14} className="shrink-0 text-fg-muted transition-transform group-open:rotate-90 rtl:-scale-x-100" aria-hidden />
                <span className="min-w-0 flex-1">
                  <GroupName name={g.name} className="max-w-full font-medium" />
                </span>
                <span className="num hidden shrink-0 text-xs text-fg-muted sm:inline">{pluralize(g.users, 'user')}</span>
                <span className="num w-20 shrink-0 text-end">{fmtUSD(g.gross)}</span>
                <span className="num w-12 shrink-0 text-end text-xs text-fg-muted">{fmtPct(g.share, 1)}</span>
              </summary>
              <div className="border-t border-border-muted bg-surface-2/50 px-3 py-2">
                {list.length === 0 ? (
                  <p className="py-1 text-xs text-fg-muted">{t('No usage in this group is linked to a user.')}</p>
                ) : (
                  <ul className="space-y-0.5">
                    {list.map((u) => {
                      const p = users.byId.get(u.id);
                      const name = p?.name ?? store.dicts.user.values[u.id];
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => selectUser(u.id)}
                            title={t('Open {name}', { name })}
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-start text-sm hover:bg-surface-3"
                          >
                            <span className="min-w-0 flex-1 truncate">{name}</span>
                            {p ? (
                              <span className="hidden sm:inline-flex">
                                <TaxBadge item={personas[p.persona]} />
                              </span>
                            ) : null}
                            <span className="num w-20 shrink-0 text-end">{fmtUSD(u.gross)}</span>
                            <span className="num w-12 shrink-0 text-end text-xs text-fg-muted">{fmtPct(g.gross > 0 ? u.gross / g.gross : Number.NaN, 0)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {g.users > list.length && list.length > 0 ? (
                  <p className="px-2 pt-1 text-xs text-fg-muted">{t('and {n} more', { n: fmtInt(g.users - list.length) })}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm" onClick={() => drill(g.filter, { page: 'users', merge: true })}>
                    {t('Show users')}
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => onSelect(g.id)}>
                    {t('See group detail')}
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </div>
      {named.length > LIMIT ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-fg-muted">
          <span>{t('Showing {shown} of {n} groups, largest first.', { shown: fmtInt(visible.length), n: fmtInt(named.length) })}</span>
          <button type="button" className="btn btn-sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? t('Show the top {n}', { n: LIMIT }) : t('Show all {n}', { n: fmtInt(named.length) })}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
