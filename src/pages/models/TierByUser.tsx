import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { escapeHtml, GRID } from '../../components/charts/helpers';
import { Card, ChartCard, EmptyState } from '../../components/ui';
import { t, T } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import type { Category } from '../../lib/types';
import { fmtInt, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { usePerMonth } from '../shared';
import { FooterLink, tierLabel } from './parts';

const TOP_USERS = 15;
const LISTED = 6;
const HEAVY_POWERFUL = 0.8;

const TIERS: { tier: Category; share: (user: UserProfile) => number }[] = [
  { tier: 'Powerful', share: (user) => user.powerfulShare },
  { tier: 'Versatile', share: (user) => user.versatileShare },
  { tier: 'Lightweight', share: (user) => user.lightweightShare },
  { tier: 'Unknown', share: (user) => Math.max(0, 1 - user.powerfulShare - user.versatileShare - user.lightweightShare) },
];

function TierChart() {
  const { analysis } = useAnalysis();
  const colors = useChartColors();
  const selectUser = useApp((state) => state.selectUser);

  const top = useMemo(() => analysis.users.profiles.filter((user) => user.gross > 0).sort((a, b) => b.gross - a.gross).slice(0, TOP_USERS), [analysis.users.profiles]);

  const option = useMemo((): EChartsOption => {
    const tiers = TIERS.filter((entry) => entry.tier !== 'Unknown' || top.some((user) => entry.share(user) >= 0.005));
    return {
      grid: { ...GRID, top: 32 },
      legend: { top: 0, data: tiers.map((entry) => tierLabel(entry.tier)) },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown): string => {
          const list = (Array.isArray(params) ? params : [params]) as { dataIndex?: number }[];
          const user = top[list[0]?.dataIndex ?? -1];
          if (!user) return '';
          const rows = tiers
            .map((entry) => ({ tier: entry.tier, v: entry.share(user) }))
            .filter((tierShare) => tierShare.v >= 0.005)
            .map(
              (tierShare) =>
                `<div style="display:flex;justify-content:space-between;gap:16px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-inline-end:6px;background:${CATEGORY_COLORS[tierShare.tier]}"></span>${escapeHtml(tierLabel(tierShare.tier))}</span><b>${fmtPct(tierShare.v, 0)}</b></div>`,
            )
            .join('');
          return `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(user.name)}</div>${rows}<div style="margin-top:4px;opacity:.75">${escapeHtml(t('Usage {amount}', { amount: fmtUSD(user.gross) }))}</div>`;
        },
      },
      xAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: (value: number) => fmtPct(value, 0) } },
      yAxis: {
        type: 'category',
        inverse: true,
        data: top.map((user) => user.name),
        axisLabel: { width: 130, overflow: 'truncate', color: colors.text, fontSize: 12 },
        axisLine: { show: false },
      },
      series: tiers.map((entry) => ({
        name: tierLabel(entry.tier),
        type: 'bar' as const,
        stack: 'tier',
        data: top.map((user) => entry.share(user)),
        color: CATEGORY_COLORS[entry.tier],
        barMaxWidth: 18,
        emphasis: { focus: 'series' as const },
      })),
    };
  }, [top, colors]);

  return (
    <ChartCard
      className="xl:col-span-2"
      title={t('Who relies on which tier')}
      exportName="github-copilot-tier-by-user"
      subtitle={t("The {n} biggest users. Each bar shows 100% of one person's usage. Click a bar to open the person.", {
        n: fmtInt(Math.min(TOP_USERS, top.length)),
      })}
      calc="model-tier-by-user"
      option={option}
      height={Math.max(220, top.length * 26 + 64)}
      empty={top.length === 0 ? t('No users in this scope') : false}
      onClick={(event) => {
        const user = top[event.dataIndex];
        if (user) selectUser(user.id);
      }}
    />
  );
}

function PowerfulOnlyCard() {
  const { analysis, settings } = useAnalysis();
  const selectUser = useApp((state) => state.selectUser);
  const perMonth = usePerMonth();

  const { list, share } = useMemo(() => {
    const list = analysis.users.profiles
      .filter((user) => user.powerfulShare >= HEAVY_POWERFUL && user.gross >= settings.minSpendForTraits)
      .sort((a, b) => b.gross - a.gross);
    const total = analysis.agg.totals.gross;
    return { list, share: total > 0 ? list.reduce((sum, user) => sum + user.gross, 0) / total : 0 };
  }, [analysis, settings.minSpendForTraits]);

  const heavy = fmtPct(HEAVY_POWERFUL, 0);

  return (
    <Card
      title={t('Users on Powerful models almost exclusively')}
      subtitle={
        list.length > 0
          ? t('{users} with {pct} or more of their usage on Powerful models. Together {share} of all usage.', {
              users: pluralize(list.length, 'user'),
              pct: heavy,
              share: fmtPct(share, 0),
            })
          : t('Users with {pct} or more of their usage on Powerful models.', { pct: heavy })
      }
      calc="model-powerful-users"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span>
            {list.length > LISTED
              ? t('{n} more not shown.', { n: fmtInt(list.length - LISTED) })
              : t('Only users whose usage reaches Minimum usage for traits are counted.')}
          </span>
          <FooterLink to="users">{t('See all users')}</FooterLink>
        </div>
      }
    >
      {list.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={22} />}
          title={t('No one relies on Powerful models alone')}
          description={t('Every user whose usage reaches Minimum usage for traits has less than {pct} of their usage on Powerful models.', { pct: heavy })}
        />
      ) : (
        <ul className="-my-2 divide-y divide-border-muted">
          {list.slice(0, LISTED).map((user) => (
            <li key={user.id}>
              <button type="button" className="flex w-full items-center justify-between gap-3 py-2 text-start hover:bg-surface-2" onClick={() => selectUser(user.id)}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  <span className="block text-xs text-fg-muted">
                    <T
                      text="{pct} on Powerful · {amount} usage"
                      values={{
                        pct: <span className="num">{fmtPct(user.powerfulShare, 0)}</span>,
                        amount: <span className="num">{fmtUSD(user.gross, 0)}</span>,
                      }}
                    />
                  </span>
                </span>
                {user.potentialBy.modelShift * perMonth >= 0.5 ? (
                  <span className="shrink-0 text-end text-xs text-fg-muted">
                    <span className="num block text-sm font-medium text-fg">{fmtUSD(user.potentialBy.modelShift * perMonth, 0)}</span>
                    {t('less usage per month')}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function TierByUser() {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-3">
      <TierChart />
      <PowerfulOnlyCard />
    </div>
  );
}
