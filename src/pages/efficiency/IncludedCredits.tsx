import { useMemo } from 'react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { esc } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { Card, ChartCard, DocLinks, EmptyState, Section } from '../../components/ui';
import { T, t, tp } from '../../i18n';
import type { TaxonomyItem, TierId } from '../../lib/analytics/taxonomy';
import { CREDIT_USD } from '../../lib/types';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { assumedAllotmentUsers, money, tierBuckets, type TierBucket } from './metrics';

const usersText = (n: number): string => tp(n, '{n} user', '{n} users', { n: fmtInt(n) });

function tierOption(c: ChartColors, items: TaxonomyItem<TierId>[], buckets: TierBucket[]): EChartsOption {
  return {
    grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const i = (p as { dataIndex: number }).dataIndex;
        const item = items[i];
        const b = buckets[i];
        if (!item || !b) return '';
        const usage = esc(t('{usage} usage ({share} of the total)', { usage: money(b.gross), share: fmtPct(b.share, 0) }));
        return `<b>${esc(item.label)}</b><br/>${esc(usersText(b.users))}<br/>${usage}<br/><span style="opacity:.75">${esc(item.description)}</span>`;
      },
    },
    xAxis: { type: 'category', data: items.map((i) => i.label), axisLabel: { interval: 0, width: 84, overflow: 'break', fontSize: 12 } },
    yAxis: { type: 'value', minInterval: 1, name: t('Users'), nameTextStyle: { color: c.textMuted, fontSize: 12, align: 'left' } },
    series: [
      {
        type: 'bar',
        barMaxWidth: 56,
        data: buckets.map((b, i) => ({ value: b.users, itemStyle: { color: items[i]?.color ?? c.muted } })),
        label: { show: true, position: 'top', color: c.textMuted, fontSize: 12 },
      },
    ],
  };
}

const sum = (xs: TierBucket[], f: (b: TierBucket) => number): number => xs.reduce((a, b) => a + f(b), 0);

export function IncludedCredits() {
  const { analysis, taxonomy, settings } = useAnalysis();
  const colors = useChartColors();
  const { users, narrowed } = analysis;
  const items = taxonomy.tiers;
  const buckets = useMemo(() => tierBuckets(users.profiles, items.map((item) => item.id)), [users, items]);
  const option = useMemo(() => tierOption(colors, items, buckets), [colors, items, buckets]);
  const assumed = useMemo(() => assumedAllotmentUsers(users.profiles), [users]);
  const known = users.profiles.length - assumed;

  const underUsers = sum(buckets.filter((b) => b.id === 'minimal' || b.id === 'light'), (b) => b.users);
  const overUsers = sum(buckets.filter((b) => b.id === 'power' || b.id === 'runaway'), (b) => b.users);
  const flow = users.poolFlow;
  const fallbackUsd = users.fallbackQuotaCredits * CREDIT_USD;
  const fallback = { amount: fmtUSD(fallbackUsd, 0) };

  return (
    <Section
      title={t('Included credits used')}
      description={t('How much of their own included credits each user uses. The credits are pooled, so both under-use and over-use have a price.')}
    >
      {known === 0 ? (
        <Card>
          <EmptyState
            title={t('Included credits are not in this report')}
            description={t('The report has no plan quota for these users, so their use cannot be compared with included credits.')}
          />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title={t('Users by share of included credits used')}
            subtitle={t('Each bar is a tier. Click a bar to list its users.')}
            calc="credits-by-tier"
            option={option}
            height={280}
            exportName="github-copilot-included-credits-by-tier"
            label={t('Number of users in each included credit usage tier')}
            onClick={(p) => {
              const item = items[p.dataIndex];
              if (item) drill({ tiers: [item.id] }, { page: 'users', merge: true });
            }}
            footer={
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {items.map((item, i) => {
                    const b = buckets[i];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={`${item.description} ${t('Click to list these users.')}`}
                        className="min-w-0 rounded-md border border-border-muted px-2 py-1.5 text-start transition-colors hover:bg-surface-2"
                        onClick={() => drill({ tiers: [item.id] }, { page: 'users', merge: true })}
                      >
                        <span className="flex items-center gap-1.5 text-fg">
                          <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} />
                          <span className="truncate font-medium">{item.label}</span>
                        </span>
                        <span className="num block text-fg">{usersText(b.users)}</span>
                        <span className="num block text-fg-muted">{t('{usage}, {share} of usage', { usage: money(b.gross), share: fmtPct(b.share, 0) })}</span>
                      </button>
                    );
                  })}
                </div>
                {assumed > 0 ? (
                  <p>
                    {assumed === users.profiles.length
                      ? t('The report has no plan quota for any user, so {amount} of included credits per month is assumed for each of them.', fallback)
                      : tp(
                          assumed,
                          '{n} user has no plan quota in the report, so {amount} of included credits per month is assumed for them.',
                          '{n} users have no plan quota in the report, so {amount} of included credits per month is assumed for each of them.',
                          { n: fmtInt(assumed), ...fallback },
                        )}
                  </p>
                ) : null}
              </div>
            }
          />
          <Card className="xl:col-span-1" title={t('What under-use and over-use mean')} calc="credits-under-over">
            <div className="space-y-3 text-sm text-fg-muted">
              <p>{t('Every seat includes credits. They are pooled across the organization and reset each month, so credits that nobody uses are lost.')}</p>
              <div>
                <div className="font-medium text-fg">{t('Under-use')}</div>
                <p>
                  <span className="num font-medium text-fg">
                    {tp(underUsers, '{n} user uses less than {limit} of their included credits.', '{n} users use less than {limit} of their included credits.', {
                      n: fmtInt(underUsers),
                      limit: fmtPct(settings.tiers.light, 0),
                    })}
                  </span>{' '}
                  {t('The unused part is paid for and lost at month end, so check that these seats are needed, or help the users get more out of them.')}
                </p>
              </div>
              <div>
                <div className="font-medium text-fg">{t('Over-use')}</div>
                <p>
                  <span className="num font-medium text-fg">
                    {tp(overUsers, '{n} user uses at least {limit} of their own credits.', '{n} users use at least {limit} of their own credits.', {
                      n: fmtInt(overUsers),
                      limit: fmtPct(settings.tiers.core, 0),
                    })}
                  </span>{' '}
                  {t('That is fine while the pool lasts, because other users leave credits behind. When the pool is used up, the extra usage is billed on top of the seat fees.')}
                </p>
              </div>
              {!narrowed && (flow.lenders > 0 || flow.takers > 0) ? (
                <p>
                  <T
                    text="In this period, {lenders} left {lent} unused, while {takers} used {taken} beyond their own credits."
                    values={{
                      lenders: usersText(flow.lenders),
                      lent: <span className="num">{money(flow.lentUsd)}</span>,
                      takers: usersText(flow.takers),
                      taken: <span className="num">{money(flow.takenUsd)}</span>,
                    }}
                  />
                </p>
              ) : null}
              <DocLinks topic="seats" limit={2} compact />
            </div>
          </Card>
        </div>
      )}
    </Section>
  );
}
