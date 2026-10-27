import { useMemo } from 'react';
import { Kpi, KpiGrid } from '../../components/ui';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { dowOf, fmtDay, ymd } from '../../lib/utils/date';
import { fmtDelta, fmtInt, fmtNum, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { busiestWeekday, dayStats, weekdayName, weekdayStats } from './model';

export default function Kpis() {
  const { analysis, settings, filters } = useAnalysis();
  const { agg, range, trend, anomalies } = analysis;
  const stats = useMemo(() => dayStats(agg.days), [agg]);
  const weekdays = useMemo(() => weekdayStats(range, agg.days, agg.dow), [agg, range]);
  const busiest = useMemo(() => busiestWeekday(weekdays), [weekdays]);

  const weekdayFilter = filters.weekdays.length > 0 && filters.weekdays.length < 7;
  const spansYears = ymd(range.start).y !== ymd(range.end).y;
  const eligibleDays = weekdayFilter ? filters.weekdays.reduce((sum, d) => sum + (weekdays[d]?.occurrences ?? 0), 0) : range.length;

  const peak = useMemo(() => {
    if (stats.peakIdx < 0) return null;
    const day = range.start + stats.peakIdx;
    return { day, unusual: anomalies.some((a) => a.day === day) };
  }, [stats.peakIdx, range.start, anomalies]);

  const weekendDays = weekdays[5].occurrences + weekdays[6].occurrences;
  const weekendGross = weekdays[5].gross + weekdays[6].gross;
  const noUsage = t('No usage in this range');
  let weekendValue = '–';
  let weekendSub = '';
  if (weekdayFilter) weekendSub = t('A weekday filter is on');
  else if (weekendDays === 0) weekendSub = t('No weekend days in this range');
  else if (!(stats.total > 0)) weekendSub = noUsage;
  else {
    weekendValue = fmtPct(weekdays[5].share + weekdays[6].share, 1);
    weekendSub = t('{amount} across {days}', { amount: fmtUSD(weekendGross), days: pluralize(weekendDays, 'weekend day') });
  }

  const change = trend.reliable ? fmtDelta(trend.recent, trend.prior) : null;
  let trendSub: string;
  if (change) trendSub = t('{recent} vs {prior}', { recent: fmtUSD(trend.recent), prior: fmtUSD(trend.prior) });
  else if (range.length < 14) trendSub = t('Needs at least 14 days of data');
  else trendSub = t('No usage in the 7 days before');

  let peakSub = noUsage;
  if (peak) {
    const vars = { amount: fmtUSD(stats.peakGross), weekday: weekdayName(dowOf(peak.day)) };
    peakSub = peak.unusual ? t('{amount} on {weekday}, an unusual day', vars) : t('{amount} on {weekday}', vars);
  }

  let busiestSub = noUsage;
  if (busiest) {
    const vars = { amount: fmtUSD(busiest.perOccurrence), weekday: weekdayName(busiest.dow) };
    busiestSub = weekdayFilter ? t('About {amount} on an average {weekday}, among the selected weekdays', vars) : t('About {amount} on an average {weekday}', vars);
  }

  // Most useful first: how many people use it, whether usage is rising, then when it happens.
  return (
    <KpiGrid>
      <Kpi
        label={t('Average active users per day')}
        value={fmtNum(stats.avgActive, 1)}
        sub={stats.usageDays > 0 ? t('Highest was {n} in one day', { n: fmtInt(stats.maxActive) }) : noUsage}
        spark={agg.days.activeUsers.length >= 2 ? agg.days.activeUsers : undefined}
        hint={t('Users with at least {amount} of usage on a day, averaged over the days that have usage. Change the threshold in Settings.', {
          amount: fmtUSD(settings.activeThreshold),
        })}
        calc="average-active-users-per-day"
      />
      <Kpi
        label={t('Last 7 days vs before')}
        value={change ? change.text : '–'}
        tone={trend.reliable && trend.change > 0.25 ? 'warn' : 'neutral'}
        sub={trendSub}
        hint={t(
          'Usage of the last 7 days of the range against the 7 days before them. It needs at least 14 days of data and some usage in the earlier week. A rise of more than 25% is shown in the warning color.',
        )}
        calc="week-over-week"
      />
      <Kpi
        label={t('Peak day')}
        value={peak ? <span title={fmtDay(peak.day, true)}>{fmtDay(peak.day, spansYears)}</span> : '–'}
        sub={peakSub}
        tone={peak?.unusual ? 'warn' : 'neutral'}
        hint={t('The day with the most usage. Unusual days are explained further down this page.')}
        calc="peak-day"
      />
      <Kpi
        label={t('Days with usage')}
        value={fmtInt(stats.usageDays)}
        sub={
          weekdayFilter
            ? t('of {days} on the selected weekdays', { days: pluralize(eligibleDays, 'day') })
            : t('of {days} in the range', { days: pluralize(range.length, 'day') })
        }
        hint={t('Days with any usage. Days with no usage at all, such as weekends or holidays, are not counted.')}
        calc="days-with-usage"
      />
      <Kpi
        label={t('Busiest weekday')}
        value={busiest ? weekdayName(busiest.dow) : '–'}
        sub={busiestSub}
        hint={t(
          'The weekday with the highest usage per day. Each weekday is divided by how many times it occurs in the range, including days with no usage, so a range with more Mondays does not win by count.',
        )}
        calc="busiest-weekday"
      />
      <Kpi
        label={t('Weekend share of usage')}
        value={weekendValue}
        sub={weekendSub}
        hint={t(
          'Usage on Saturdays and Sundays as a share of all usage. An even spread over the week would be about 29%, so a low share means GitHub Copilot is used mostly on workdays.',
        )}
        calc="weekend-share"
      />
    </KpiGrid>
  );
}
