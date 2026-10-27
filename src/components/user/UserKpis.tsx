import { type ReactNode } from 'react';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtDay } from '../../lib/utils/date';
import { fmtInt, fmtPct, fmtPctAuto, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { Kpi, type KpiDelta, KpiGrid, type Tone } from '../ui';
import { usePopulationMedians } from './medians';
import { hasQuota } from './shared';

function creditsTile(user: UserProfile): { value: string; sub: ReactNode; tone: Tone } {
  const values = { amount: fmtUSD(Math.abs(user.balance), 0), total: fmtUSD(user.allotment, 0) };
  const balanceText = hasQuota(user)
    ? user.balance >= 0
      ? t('{amount} left of {total}', values)
      : t('{amount} over {total}', values)
    : user.balance >= 0
      ? t('{amount} left of {total} (assumed)', values)
      : t('{amount} over {total} (assumed)', values);
  return { value: fmtPctAuto(user.utilization), sub: balanceText, tone: user.utilization > 1 ? 'bad' : 'neutral' };
}

function lastWeek(user: UserProfile, reliable: boolean): { value: string; sub: ReactNode; delta: KpiDelta | null } {
  if (!reliable) return { value: '–', sub: t('Needs at least 14 days of data'), delta: null };
  if (user.recent <= 0 && user.prior <= 0) return { value: fmtUSD(0), sub: t('No usage in the last 2 weeks'), delta: null };
  const delta = Number.isFinite(user.trend) ? { pct: user.trend, text: `${user.trend >= 0 ? '+' : ''}${fmtPct(user.trend, 0)}` } : null;
  return {
    value: fmtUSD(user.recent),
    sub: user.prior > 0 ? t('vs {amount} the week before', { amount: fmtUSD(user.prior) }) : t('Nothing the week before'),
    delta,
  };
}

export function UserKpis({ p: user }: { p: UserProfile }) {
  const { analysis, settings } = useAnalysis();
  const { population, range, coverage } = analysis;
  const medians = usePopulationMedians();
  const credits = creditsTile(user);
  const week = lastWeek(user, population.trendReliable);

  let activeSub = t('No active days');
  if (user.activeDays > 0) {
    const rate = fmtPct(user.activeRate, 0);
    activeSub =
      user.lastDay >= range.end
        ? t('{rate} of workdays · active on the last day', { rate })
        : t('{rate} of workdays · last on {date}', { rate, date: fmtDay(user.lastDay) });
  }

  return (
    <KpiGrid cols="grid-cols-2 sm:grid-cols-3">
      <Kpi
        label={t('Usage')}
        value={fmtUSD(user.gross)}
        sub={t('#{rank} of {total} · {share} of all usage', { rank: fmtInt(user.rank), total: fmtInt(population.profiles.length), share: fmtPct(user.share, 1) })}
        hint={t(
          'Usage of the user in the selected date range, before included credits. Rows that went through Auto are already after the Auto discount. Rank and share compare the user with everyone in the current date range and row filters.',
        )}
        calc={['usage', 'user-share']}
      />
      <Kpi
        label={t('Billed')}
        value={coverage.billing ? fmtUSD(user.net) : '–'}
        sub={coverage.billing ? t('{amount} covered by included credits', { amount: fmtUSD(user.discount) }) : t('The file does not say what was billed')}
        hint={t('Billed on top of licenses, as the report states it. Included credits are shared across the organization, so read a figure for one user with care.')}
        calc={['billed', 'covered']}
      />
      <Kpi
        label={t('Included credits used')}
        value={credits.value}
        tone={credits.tone}
        sub={credits.sub}
        hint={
          hasQuota(user)
            ? t('Usage as a share of the included credits that come with the license, for the selected date range. Above 100% means the user drew from the shared pool.')
            : t(
                'The file has no license size for this user, so the included credits of a {credits}-credit license are assumed. Above 100% means the user drew from the shared pool.',
                { credits: fmtInt(population.fallbackQuotaCredits) },
              )
        }
        calc="user-credits-used"
      />
      <Kpi
        label={t('Active days')}
        value={fmtInt(user.activeDays)}
        sub={activeSub}
        hint={t('Days with at least {amount} of usage. The share counts workdays since the user first appeared.', { amount: fmtUSD(settings.activeThreshold, 2) })}
        calc={['user-active-days', 'user-active-rate']}
      />
      <Kpi
        label={t('Cost per active day')}
        value={fmtUSD(user.costPerActiveDay, 2)}
        sub={
          Number.isFinite(medians.costPerActiveDay) && medians.users > 1
            ? t('Typical user {amount}', { amount: fmtUSD(medians.costPerActiveDay, 2) })
            : undefined
        }
        hint={t('Usage divided by active days. The typical user is the median of everyone in the current view.')}
        calc="user-cost-per-active-day"
      />
      <Kpi
        label={t('Last 7 days')}
        value={week.value}
        delta={week.delta}
        sub={week.sub}
        hint={t('Usage in the last 7 days of the date range, compared with the 7 days before.')}
        calc={['user-change', 'week-over-week']}
      />
    </KpiGrid>
  );
}
