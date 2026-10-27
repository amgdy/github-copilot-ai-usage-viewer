import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { stackTooltip, usd, usdCompact } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { CalcInfo, ChartCard, Section } from '../../components/ui';
import { t, tp } from '../../i18n';
import { LEVER_META, LEVER_ORDER, type LeverStep } from '../../lib/analytics/levers';
import type { Settings } from '../../lib/analytics/settings';
import { userActionRows } from '../../lib/analytics/tips';
import type { UserSet } from '../../lib/analytics/users';
import { isoDate } from '../../lib/utils/date';
import { downloadCsv } from '../../lib/utils/download';
import { fmtInt, fmtPct } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { usePerMonth } from '../shared';
import { LEVER_DOC, leverColor, money, topOpportunities, type Opportunity } from './metrics';

const SHOWN = 10;

type LeverId = LeverStep['id'];
function opportunityOption(c: ChartColors, rows: Opportunity[], levers: LeverId[]): EChartsOption {
  return {
    grid: { left: 8, right: 72, top: 8, bottom: 8, containLabel: true },
    legend: { show: false },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: stackTooltip(usd) },
    xAxis: { type: 'value', axisLabel: { formatter: (v: number) => usdCompact(v) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => r.profile.name),
      axisLabel: { width: 150, overflow: 'truncate', color: c.text, fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      ...levers.map((id) => ({
        name: t(LEVER_META[id].label),
        type: 'bar' as const,
        stack: 'total',
        barMaxWidth: 20,
        color: leverColor(c, id),
        emphasis: { focus: 'series' as const },
        data: rows.map((r) => r.by[id]),
      })),
      {
        name: t('Total'),
        type: 'bar' as const,
        stack: 'total',
        silent: true,
        barMaxWidth: 20,
        itemStyle: { color: 'transparent' },
        data: rows.map(() => 0),
        label: {
          show: true,
          position: 'right' as const,
          color: c.text,
          fontSize: 12,
          fontWeight: 600,
          formatter: (p: { dataIndex: number }) => money(rows[p.dataIndex]?.total ?? 0),
        },
      },
    ],
  };
}

/** Every user, the largest avoidable usage first. `userActionRows` keeps the order of `users.profiles`, so row i belongs to profile i. */
function actionList(users: UserSet, settings: Settings) {
  const { headers, rows } = userActionRows(users, settings);
  const potential = (i: number): number => {
    const v = users.profiles[i]?.potential;
    return Number.isFinite(v) ? (v as number) : 0;
  };
  const order = rows.map((_, i) => i).sort((a, b) => potential(b) - potential(a));
  return { headers, rows: order.map((i) => rows[i]) };
}

export function Opportunities() {
  const { analysis, settings } = useAnalysis();
  const colors = useChartColors();
  const selectUser = useApp((s) => s.selectUser);
  const perMonth = usePerMonth();
  const found = useMemo(() => topOpportunities(analysis.users.profiles, perMonth, SHOWN), [analysis.users, perMonth]);
  const levers = useMemo(() => {
    const total = (id: LeverId): number => found.rows.reduce((a, r) => a + r.by[id], 0);
    return LEVER_ORDER.map((id) => ({ id, total: total(id) })).sort((a, b) => b.total - a.total);
  }, [found.rows]);
  const option = useMemo(
    () =>
      opportunityOption(
        colors,
        found.rows,
        levers.map((l) => l.id),
      ),
    [colors, found.rows, levers],
  );

  const download = () => {
    const { headers, rows } = actionList(analysis.users, settings);
    downloadCsv(`github-copilot-action-list_${isoDate(analysis.range.start)}_${isoDate(analysis.range.end)}`, headers, rows);
  };

  const share = found.allTotal > 0 ? found.shownTotal / found.allTotal : 0;
  const n = found.rows.length;
  const subtitle = n
    ? found.withSaving > n
      ? tp(
          found.withSaving,
          'Together they could avoid {amount} per month, {share} of what the {n} user with a saving could avoid. Click a bar to open the user.',
          'Together they could avoid {amount} per month, {share} of what all {n} users with a saving could avoid. Click a bar to open the user.',
          { n: fmtInt(found.withSaving), amount: money(found.shownTotal), share: fmtPct(share, 0) },
        )
      : t('Together they could avoid {amount} per month. Click a bar to open the user.', { amount: money(found.shownTotal) })
    : undefined;

  return (
    <Section
      title={t('Biggest opportunities')}
      description={t('The users who could avoid the most usage by changing their habits, and which habit is worth the most for each. Amounts are usage per month, not cash.')}
    >
      <ChartCard
        title={n ? tp(n, 'Top {n} user by avoidable usage per month', 'Top {n} users by avoidable usage per month', { n: fmtInt(n) }) : t('Avoidable usage per month')}
        subtitle={subtitle}
        calc="opportunities-chart"
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={download}
            title={t('Download a CSV with every user and the top action for each. The amounts cover the whole period, largest first.')}
          >
            <Download size={14} />
            {t('Download action list')}
          </button>
        }
        option={option}
        height={Math.max(160, n * 34 + 28)}
        exportName="github-copilot-biggest-opportunities"
        label={t('Avoidable usage per month for the ten users with the largest potential, split by habit')}
        empty={n ? false : t('No user has avoidable usage with the default habit changes')}
        onClick={(p) => {
          const row = found.rows[p.dataIndex];
          if (row) selectUser(row.profile.id);
        }}
        footer={
          n ? (
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {levers.map(({ id, total }) => (
                <li key={id} className="flex min-w-0 items-start gap-2">
                  <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: leverColor(colors, id) }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-medium text-fg">
                      {t(LEVER_META[id].label)}
                      <CalcInfo id={LEVER_DOC[id]} />
                    </span>
                    <span className="block">{t(LEVER_META[id].description)}</span>
                  </span>
                  <span className="num shrink-0 text-fg">{total > 0 ? money(total) : '–'}</span>
                </li>
              ))}
            </ul>
          ) : undefined
        }
      />
    </Section>
  );
}
