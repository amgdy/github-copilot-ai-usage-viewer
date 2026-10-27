import { useMemo } from 'react';
import { Kpi, KpiGrid } from '../../components/ui';
import { t } from '../../i18n';
import { fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { showGroup } from './actions';
import { maxRow, type GroupRow, type LensData } from './lenses';

/** Money first (what can be saved, then where usage goes), then people, then the count of groups. */
export function LensKpis({ data, perMonth }: { data: LensData; perMonth: number }) {
  const { lens, rows, total, used } = data;
  const best = useMemo(
    () => ({
      largest: maxRow(rows, (row) => row.users),
      usage: maxRow(rows, (row) => row.usageShare),
      perUser: maxRow(rows, (row) => row.perUserMonth),
      potential: maxRow(rows, (row) => row.potential),
    }),
    [rows],
  );
  const open = (row: GroupRow | null) => (row ? () => showGroup(lens, row.id) : undefined);
  const traits = lens.id === 'trait';
  const potentialShare = best.potential && total.potential > 0 ? best.potential.potential / total.potential : 0;

  return (
    <KpiGrid>
      <Kpi
        label={t('Potential savings')}
        value={fmtUSD(total.potential, 0)}
        tone={total.potential > 0 ? 'good' : 'neutral'}
        sub={traits ? t('Users with a trait, each counted once') : t('About {amount} a month', { amount: fmtUSD(total.potential * perMonth, 0) })}
        hint={
          traits
            ? t('Traits overlap: one user can have several. This is the total for users with at least one trait, each counted once. Do not add the trait rows together.')
            : t('Estimated reduction in usage if users followed the default recommendations. Included credits already cover part of it, so cash savings are lower.')
        }
        calc="group-potential-savings"
      />
      <Kpi
        label={t('Biggest opportunity')}
        value={best.potential ? fmtUSD(best.potential.potential, 0) : '–'}
        tone={best.potential ? 'good' : 'neutral'}
        sub={best.potential ? t('{group}, {share} of the total', { group: best.potential.item.label, share: fmtPct(potentialShare, 0) }) : t('No savings estimated')}
        hint={t('The group with the largest potential savings. It is a reduction in usage, not cash.')}
        calc="biggest-opportunity"
        onClick={open(best.potential)}
      />
      <Kpi
        label={t('Biggest share of usage')}
        value={best.usage ? fmtPct(best.usage.usageShare, 0) : '–'}
        sub={best.usage ? t('{group}, {share} of users', { group: best.usage.item.label, share: fmtPct(best.usage.userShare, 0) }) : t('No usage yet')}
        hint={t('The group that accounts for the largest part of the usage, and what share of the users it holds.')}
        calc="biggest-usage-share"
        onClick={open(best.usage)}
      />
      <Kpi
        label={t('Largest group by users')}
        value={best.largest ? fmtPct(best.largest.userShare, 0) : '–'}
        sub={best.largest ? t('{group}, {users}', { group: best.largest.item.label, users: pluralize(best.largest.users, 'user') }) : t('No group has users')}
        hint={t('The group with the most users, shown as its share of all users.')}
        calc="largest-group"
        onClick={open(best.largest)}
      />
      <Kpi
        label={t('Heaviest per user')}
        value={best.perUser ? fmtUSD(best.perUser.perUserMonth, 0) : '–'}
        sub={best.perUser ? t('{group}, per user, per month', { group: best.perUser.item.label }) : t('No usage yet')}
        hint={t('Average usage per user, per month, in the group with the highest average.')}
        calc="heaviest-per-user"
        onClick={open(best.perUser)}
      />
      <Kpi
        label={t('Groups in use')}
        value={t('{used} of {all}', { used, all: rows.length })}
        sub={used === rows.length ? t('Every group has users') : t('{groups} with no users', { groups: pluralize(rows.length - used, 'group') })}
        hint={t('How many of the groups in this lens have at least one user.')}
        calc="groups-in-use"
      />
    </KpiGrid>
  );
}
