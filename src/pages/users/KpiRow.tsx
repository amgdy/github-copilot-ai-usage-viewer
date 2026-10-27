import { useMemo } from 'react';
import { hasQuota, median, quotaKnown } from '../../components/user/shared';
import { Kpi, KpiGrid } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { DAYS_PER_MONTH } from '../../lib/utils/date';
import { fmtDelta, fmtInt, fmtMultiple, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { LOW_UTILIZATION, topShare } from './stats';

const NO_QUOTA = msg('Included credits per user are not in the file');

export function KpiRow() {
  const { analysis } = useAnalysis();
  const { users, population, range, narrowed, segmentFiltered, previous } = analysis;
  const perMonth = DAYS_PER_MONTH / Math.max(1, range.length);

  const stats = useMemo(() => {
    const profiles = users.profiles;
    const gross = profiles.map((user) => user.gross);
    const userCount = profiles.length;
    const total = gross.reduce((a, b) => a + b, 0);
    let over = 0;
    let overUsd = 0;
    let low = 0;
    let lowEligible = 0;
    for (const user of profiles) {
      if (!hasQuota(user)) continue;
      if (user.utilization > 1) {
        over++;
        overUsd += Math.max(0, -user.balance);
      }
      if (!user.isNew) {
        lowEligible++;
        if (user.utilization < LOW_UTILIZATION) low++;
      }
    }
    return {
      n: userCount,
      median: median(gross) * perMonth,
      average: userCount > 0 ? (total / userCount) * perMonth : Number.NaN,
      top: topShare(gross, 0.1),
      known: quotaKnown(profiles),
      over,
      overUsd,
      low,
      lowEligible,
    };
  }, [users, perMonth]);

  const neverUsed = narrowed ? 0 : population.inactive.length;
  const activeSub = segmentFiltered
    ? t('Of {n} in this period', { n: fmtInt(population.profiles.length) })
    : neverUsed > 0
      ? tp(neverUsed, '{n} more seat has no usage in the report', '{n} more seats have no usage in the report', { n: fmtInt(neverUsed) })
      : t('With usage in this period');
  const spread = stats.median > 0 ? stats.average / stats.median : Number.NaN;
  const noQuota = t(NO_QUOTA);

  const active = (
    <Kpi
      key="active"
      label={t('Active users')}
      value={fmtInt(stats.n)}
      delta={previous ? fmtDelta(stats.n, previous.totals.users) : null}
      goodWhen="up"
      sub={activeSub}
      hint={t('People with usage in the selected period and filters. Seats in the license list that never show up in the report are listed at the bottom of this page.')}
      calc={['active-users', 'previous-period']}
    />
  );
  const medianTile = (
    <Kpi
      key="median"
      label={t('Median usage per user per month')}
      value={fmtUSD(stats.median)}
      sub={t('Half of the users use less')}
      hint={t('The usage of the middle user, scaled to an average month. Half of the users use less than this and half use more.')}
      calc="user-median-usage"
    />
  );
  const average = (
    <Kpi
      key="average"
      label={t('Average usage per user per month')}
      value={fmtUSD(stats.average)}
      sub={Number.isFinite(spread) ? t('{multiple} the median', { multiple: fmtMultiple(spread) }) : undefined}
      hint={t('Total usage divided by the number of users, scaled to an average month. When the average is far above the median, a few heavy users pull it up.')}
      calc="user-average-usage"
    />
  );
  const top = (
    <Kpi
      key="top"
      label={t('Top 10% share of usage')}
      value={fmtPct(stats.top.share, 0)}
      sub={
        stats.top.n > 0
          ? tp(stats.top.k, '{n} user of {total} uses the most', '{n} users of {total} use the most', { n: fmtInt(stats.top.k), total: fmtInt(stats.top.n) })
          : undefined
      }
      hint={t('Share of all usage made by the 10% of users who use the most. A high share means a few people drive the usage.')}
      calc="top-decile-share"
    />
  );
  const over = (
    <Kpi
      key="over"
      label={t('Users above 100% of included credits')}
      value={stats.known ? fmtInt(stats.over) : '–'}
      tone={!stats.known ? 'neutral' : stats.over > 0 ? 'warn' : 'good'}
      sub={
        !stats.known
          ? noQuota
          : stats.over > 0
            ? t('{amount} above their own credits', { amount: fmtUSD(stats.overUsd, 0) })
            : t('Nobody used more than their own credits')
      }
      hint={t(
        'Users whose usage is higher than the included credits of their own seat. The extra comes out of the shared pool, so it only costs money when the whole pool runs out.',
      )}
      calc="user-above-credits"
    />
  );
  const low = (
    <Kpi
      key="low"
      label={t('Users below 20% of included credits')}
      value={stats.known ? fmtInt(stats.low) : '–'}
      tone={stats.known && stats.low > 0 ? 'info' : 'neutral'}
      sub={
        !stats.known
          ? noQuota
          : stats.lowEligible > 0
            ? t('{share} of users, not counting new users', { share: fmtPct(stats.low / stats.lowEligible, 0) })
            : t('No users to compare')
      }
      hint={t(
        'Users who used less than 20% of the included credits of their seat. New users are not counted because they have had little time. These seats are worth a check-in.',
      )}
      calc="user-below-credits"
    />
  );

  // Most impact first: the users who cost money or waste a seat, then the size of the group, then the typical user.
  // Without included credits in the file the two credit tiles show a dash, so they move to the end.
  return <KpiGrid>{stats.known ? [over, low, active, top, medianTile, average] : [active, top, medianTile, average, over, low]}</KpiGrid>;
}
