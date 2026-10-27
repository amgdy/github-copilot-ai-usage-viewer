import { useMemo } from 'react';
import { Badge, Card, DataTable, type Column } from '../../components/ui';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { monthKey } from '../../lib/utils/date';
import { fmtInt, fmtNum, fmtUSD, pluralize } from '../../lib/utils/format';
import { newUserCut } from './adoption';
import { dayStats, monthRows, type MonthRow } from './model';

const sum = (rows: MonthRow[], pick: (r: MonthRow) => number): number => rows.reduce((s, r) => s + pick(r), 0);

export default function MonthTable() {
  const { analysis, store, prep, settings } = useAnalysis();
  const { agg, range, users } = analysis;
  const cut = newUserCut(range.start, store.minDay, settings.newUserDays);

  const input = useMemo(
    () => ({
      range,
      days: agg.days,
      userMonthGross: agg.userMonthGross,
      nMonths: agg.nMonths,
      firstMonth: prep.firstMonth,
      newFirstDays: users.profiles.map((p) => p.globalFirstDay).filter((d) => d >= cut),
    }),
    [range, agg, prep, users, cut],
  );
  const rows = useMemo(() => monthRows(input), [input]);
  const totals = useMemo(() => {
    const usage = sum(rows, (r) => r.usage);
    const usageDays = sum(rows, (r) => r.usageDays);
    return {
      usage,
      perUsageDay: usageDays > 0 ? usage / usageDays : Number.NaN,
      avgActive: dayStats(agg.days).avgActive,
      newUsers: sum(rows, (r) => r.newUsers),
      // Same count as the page header and the Spend page: every named user with a row in scope, $0 rows included.
      activeUsers: agg.totals.users,
      maxUsage: rows.reduce((m, r) => Math.max(m, r.usage), 0),
    };
  }, [rows, agg]);

  const columns = useMemo<Column<MonthRow>[]>(
    () => [
      {
        key: 'month',
        header: t('Month'),
        value: (r) => monthKey(r.monthIdx),
        total: t('Whole range'),
        render: (r) => (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="font-medium">{r.label}</span>
            {r.partial ? (
              <Badge tone="warn" title={t('The date range covers {covered} of the {total} days of this month', { covered: fmtInt(r.coveredDays), total: fmtInt(r.monthDays) })}>
                {t('Partial')}
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        key: 'usage',
        header: t('Usage'),
        align: 'end',
        hint: t('Usage in the month, within the date range'),
        calc: 'usage',
        value: (r) => r.usage,
        total: fmtUSD(totals.usage),
        render: (r) => (
          <span className="inline-flex items-center justify-end gap-2">
            <span className="h-1.5 w-16 overflow-hidden rounded-xs bg-surface-3" aria-hidden>
              <span className="block h-full rounded-xs bg-accent" style={{ width: `${totals.maxUsage > 0 ? (r.usage / totals.maxUsage) * 100 : 0}%` }} />
            </span>
            {fmtUSD(r.usage)}
          </span>
        ),
      },
      {
        key: 'perDay',
        header: t('Usage per active day'),
        align: 'end',
        hint: t('Usage divided by the days of the month that have any usage, so months of different length can be compared'),
        calc: 'usage-per-active-day',
        value: (r) => r.perUsageDay,
        total: fmtUSD(totals.perUsageDay),
        render: (r) => fmtUSD(r.perUsageDay),
      },
      {
        key: 'avgActive',
        header: t('Average active users per day'),
        align: 'end',
        hint: t('Users with at least {amount} of usage on a day, averaged over the days with usage', { amount: fmtUSD(settings.activeThreshold) }),
        calc: 'average-active-users-per-day',
        value: (r) => r.avgActive,
        total: fmtNum(totals.avgActive, 1),
        render: (r) => fmtNum(r.avgActive, 1),
      },
      {
        key: 'newUsers',
        header: t('New users'),
        align: 'end',
        hint: t('Users whose first usage in the data falls in this month. Users first seen in the first {days} of the data are not counted as new.', {
          days: pluralize(settings.newUserDays, 'day'),
        }),
        calc: 'new-users',
        value: (r) => r.newUsers,
        total: fmtInt(totals.newUsers),
        render: (r) => fmtInt(r.newUsers),
      },
      {
        key: 'activeUsers',
        header: t('Active users per month'),
        align: 'end',
        hint: t(
          'Users whose usage in the month adds up to more than $0. The Whole range row counts every user with any usage row in the range once, even if their rows add up to $0.',
        ),
        calc: 'active-users-per-month',
        value: (r) => r.activeUsers,
        total: fmtInt(totals.activeUsers),
        render: (r) => fmtInt(r.activeUsers),
      },
    ],
    [totals, settings.activeThreshold, settings.newUserDays],
  );

  return (
    <Card
      title={t('Month by month')}
      subtitle={t('How usage, activity, and new users change from one calendar month to the next.')}
      footer={t(
        'A partial month has only some of its days inside the date range, so its usage is lower. Compare months with the per-day columns. Active users per month are users whose usage that month adds up to more than $0. The Whole range row counts every user with any usage row once, the same count as the page header.',
      )}
      calc="month-by-month"
    >
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.monthIdx}
        defaultSort={{ key: 'month', dir: 'asc' }}
        exportName="github-copilot-month-by-month"
        fixedColumns
        dense
        pageSize={25}
      />
    </Card>
  );
}
