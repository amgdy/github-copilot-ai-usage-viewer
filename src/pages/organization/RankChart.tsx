import { useMemo, useState } from 'react';
import { useChartColors } from '../../components/charts/EChart';
import { rankBarOption, usd, type RankItem } from '../../components/charts/helpers';
import { ChartCard, Segmented, type SegmentedOption } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { usePerMonth } from '../shared';
import { filterToGroup } from './bits';
import type { DimSpec } from './dimensions';
import { perUserMonth, type Group } from './groups';

type Metric = 'usage' | 'billed' | 'users' | 'perUser';

const TOP = 15;

const METRICS: { value: Metric; label: string; title: string }[] = [
  { value: 'usage', label: msg('Usage'), title: msg('Usage, including what included credits cover') },
  { value: 'billed', label: msg('Billed'), title: msg('Billed on top of seats') },
  { value: 'users', label: msg('Users'), title: msg('People with usage in the group') },
  { value: 'perUser', label: msg('Per user'), title: msg('Usage per user in a 30.4-day month') },
];

const CHART_LABEL: Record<Metric, string> = {
  usage: msg('Bar chart that ranks the groups by usage'),
  billed: msg('Bar chart that ranks the groups by amount billed'),
  users: msg('Bar chart that ranks the groups by number of users'),
  perUser: msg('Bar chart that ranks the groups by usage per user'),
};

/** Tells what the ranking leaves out when the metric skips some groups. */
const QUALIFIER: Record<Metric, string> = {
  usage: '',
  billed: msg('Only groups with billed usage are ranked.'),
  users: msg('Only groups with users are ranked.'),
  perUser: msg('Only groups with users are ranked.'),
};

const EMPTY: Record<Metric, string> = {
  usage: msg('No usage in this view.'),
  billed: msg('Nothing was billed on top of seats in this view.'),
  users: msg('No usage in this view is linked to a user.'),
  perUser: msg('No usage in this view is linked to a user.'),
};

interface Bar {
  item: RankItem;
  group: Group | null;
}

/** Top groups as ranked bars. The sums for usage and billed get an "Other" bar; users and ratios do not add up, so they do not. */
export function RankChart({ spec, groups, height }: { spec: DimSpec; groups: Group[]; height: number }) {
  const colors = useChartColors();
  const perMonth = usePerMonth();
  const billing = useAnalysis().analysis.coverage.billing;
  const [picked, setPicked] = useState<Metric>('usage');
  // Without a billing split every billed amount is 0, so the Billed ranking would be empty.
  const metric: Metric = !billing && picked === 'billed' ? 'usage' : picked;

  const { bars, format, total } = useMemo(() => {
    const note = (group: Group) =>
      [
        t('{pct} of usage', { pct: fmtPct(group.share, 1) }),
        billing ? t('{usd} billed', { usd: fmtUSD(group.net) }) : null,
        tp(group.users, '1 user', '{n} users', { n: fmtInt(group.users) }),
      ]
        .filter(Boolean)
        .join(' · ');
    const additive = metric === 'usage' || metric === 'billed';
    const value = (group: Group): number => (metric === 'usage' ? group.gross : metric === 'billed' ? group.net : metric === 'users' ? group.users : perUserMonth(group, perMonth));
    const usable = (group: Group) => {
      const metricValue = value(group);
      return Number.isFinite(metricValue) && metricValue > (metric === 'billed' ? 0.005 : 0);
    };
    const bar = (group: Group): Bar => ({
      item: { name: group.name, value: value(group), color: group.blank ? colors.muted : metric === 'billed' ? colors.warn : colors.accent, note: note(group) },
      group: group,
    });
    // The group without a value is not a real group, so it does not take part in the ranking. It gets its own bar at the end.
    const eligible = groups.filter((group) => !group.blank && usable(group));
    const sorted = metric === 'usage' ? eligible : [...eligible].sort((a, b) => value(b) - value(a));
    const out: Bar[] = sorted.slice(0, TOP).map(bar);
    const rest = sorted.slice(TOP);
    if (additive && rest.length > 0) {
      const sum = rest.reduce((restTotal, group) => restTotal + value(group), 0);
      const grand = groups.reduce((grandTotal, group) => grandTotal + (Number.isFinite(value(group)) ? value(group) : 0), 0);
      const share = fmtPct(grand > 0 ? sum / grand : 0, 1);
      out.push({
        item: {
          name: t('Other ({n} more)', { n: fmtInt(rest.length) }),
          value: sum,
          color: colors.muted,
          note: metric === 'usage' ? t('{pct} of usage', { pct: share }) : t('{pct} of billed', { pct: share }),
        },
        group: null,
      });
    }
    // Every group without a value gets its own bar at the end.
    for (const group of groups) if (group.blank && usable(group)) out.push(bar(group));
    return { bars: out, format: metric === 'users' ? fmtInt : usd, total: sorted.length };
  }, [groups, metric, perMonth, colors, billing]);

  const option = useMemo(() => rankBarOption(colors, { items: bars.map((bar) => bar.item), format, labelWidth: 140 }), [colors, bars, format]);

  const scope =
    total > TOP ? t('Top {top} of {n} groups.', { top: TOP, n: fmtInt(total) }) : total === 1 ? t('The only group.') : t('All {n} groups.', { n: fmtInt(total) });
  const subtitle = [
    total > 0 ? scope : '',
    total > 0 && QUALIFIER[metric] ? t(QUALIFIER[metric]) : '',
    metric === 'perUser' ? t('Usage per user in a 30.4-day month.') : '',
    t('Click a bar to filter the report.'),
  ]
    .filter(Boolean)
    .join(' ');
  const metricOptions: SegmentedOption<Metric>[] = METRICS.filter((metricOption) => billing || metricOption.value !== 'billed').map((metricOption) => ({
    value: metricOption.value,
    label: t(metricOption.label),
    title: t(metricOption.title),
  }));

  return (
    <ChartCard
      title={t(spec.top)}
      subtitle={subtitle}
      calc={
        metric === 'usage'
          ? ['org-rank-chart', 'usage']
          : metric === 'billed'
            ? ['org-rank-chart', 'billed']
            : metric === 'users'
              ? ['org-rank-chart', 'org-users']
              : ['org-rank-chart', 'org-per-user-month']
      }
      actions={<Segmented size="sm" label={t('Ranking metric')} value={metric} onChange={setPicked} options={metricOptions} />}
      option={option}
      height={height}
      exportName={`github-copilot-organization-${spec.id}-ranking`}
      label={t(CHART_LABEL[metric])}
      empty={bars.length === 0 ? t(EMPTY[metric]) : false}
      onClick={(event) => {
        const group = bars[event.dataIndex]?.group;
        if (group) filterToGroup(group);
      }}
    />
  );
}
