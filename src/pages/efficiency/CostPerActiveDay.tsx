import { useMemo } from 'react';
import { VendorIcon } from '../../components/icons';
import { Badge, Card, EmptyState, Kpi, KpiGrid, Section } from '../../components/ui';
import { t, tp } from '../../i18n';
import { inferVendor, lookupCard } from '../../lib/pricing/models';
import { fmtInt, fmtMultiple, fmtPct } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { costPerDayStats, money, topCostPerDay } from './metrics';

const vendorOf = (model: string) => lookupCard(model)?.vendor ?? inferVendor(model);

export function CostPerActiveDay() {
  const { analysis, settings } = useAnalysis();
  const selectUser = useApp((s) => s.selectUser);
  const profiles = analysis.users.profiles;
  const stats = useMemo(() => costPerDayStats(profiles), [profiles]);
  const top = useMemo(() => topCostPerDay(profiles, 10), [profiles]);
  const base = t('Usage divided by the days a user was active. It shows how intense a working day is, not just how much a user used in total.');
  const basedOn = stats
    ? ` ${tp(stats.users, 'Based on {n} user with at least one active day.', 'Based on {n} users with at least one active day.', { n: fmtInt(stats.users) })}`
    : '';

  return (
    <Section title={t('Cost per active day')} description={`${base}${basedOn}`}>
      {!stats ? (
        <Card>
          <EmptyState
            title={t('No user has an active day in this selection')}
            description={t('Cost per active day needs at least one day on which a named user reached the active-day threshold in Settings.')}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <KpiGrid cols="grid-cols-2 lg:grid-cols-4">
            <Kpi
              label={t('Median cost per active day')}
              value={money(stats.median)}
              sub={t('half of users are below this')}
              hint={t('The typical cost of a day on which a user works with GitHub Copilot.')}
              calc="cost-per-day-median"
            />
            <Kpi label={t('75th percentile cost per active day')} value={money(stats.p75)} sub={t('one user in four is above this')} calc="cost-per-day-p75" />
            <Kpi label={t('90th percentile cost per active day')} value={money(stats.p90)} sub={t('one user in ten is above this')} calc="cost-per-day-p90" />
            <Kpi
              label={t('Highest cost per active day')}
              value={money(stats.max)}
              tone={stats.median > 0 && stats.max > 5 * stats.median ? 'warn' : 'neutral'}
              sub={stats.maxUser.name}
              hint={t('The highest cost per active day of any one user. Amber when it is more than 5 times the median.')}
              calc="cost-per-day-highest"
            />
          </KpiGrid>

          <Card
            padded={false}
            title={t('Users with the highest cost per active day')}
            subtitle={t('Up to 10 users, with what drives the cost. Click a user to open their profile.')}
            calc="cost-per-day-top-users"
            footer={t('Chips in amber mark a driver below the thresholds in Settings: little Auto use or a low cache hit rate.')}
          >
            <ol className="divide-y divide-border-muted">
              {top.map((p, i) => {
                const width = top[0].costPerActiveDay > 0 ? Math.max(2, (p.costPerActiveDay / top[0].costPerActiveDay) * 100) : 0;
                const lowAuto = p.autoShare < settings.lowAuto;
                const hasHit = Number.isFinite(p.cacheHit);
                const lowCache = hasHit && p.cacheHit < settings.lowCacheHit;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-2.5 text-start transition-colors hover:bg-surface-2"
                      onClick={() => selectUser(p.id)}
                      title={t('Open the user profile')}
                    >
                      <span className="num pt-0.5 text-xs text-fg-subtle">{fmtInt(i + 1)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-xs bg-surface-3">
                          <span className="block h-full rounded-xs bg-accent" style={{ width: `${width}%` }} />
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {p.topModel ? (
                            <Badge title={t('Model with the most usage')}>
                              <VendorIcon vendor={vendorOf(p.topModel)} size={12} className="shrink-0" />
                              <bdi>{p.topModel}</bdi> <span className="num">{fmtPct(p.topModelShare, 0)}</span>
                            </Badge>
                          ) : null}
                          <Badge tone={lowAuto ? 'warn' : 'neutral'} title={t('Share of usage that went through Auto')}>
                            {t('Auto share {share}', { share: fmtPct(p.autoShare, 0) })}
                          </Badge>
                          <Badge tone={lowCache ? 'warn' : 'neutral'} title={t('Share of prompt tokens read from the cache')}>
                            {t('Cache hit rate {rate}', { rate: hasHit ? fmtPct(p.cacheHit, 0) : '–' })}
                          </Badge>
                          <Badge title={t('Days on which usage reached the active-day threshold in Settings')}>
                            {tp(p.activeDays, '{n} active day', '{n} active days', { n: fmtInt(p.activeDays) })}
                          </Badge>
                        </span>
                      </span>
                      <span className="text-end">
                        <span className="num block text-sm font-semibold">{money(p.costPerActiveDay)}</span>
                        <span className="num block text-xs text-fg-muted">
                          {stats.median > 0 ? t('{times} the median', { times: fmtMultiple(p.costPerActiveDay / stats.median) }) : t('per day')}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      )}
    </Section>
  );
}
