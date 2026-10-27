import { useMemo, useState } from 'react';
import { useChartColors, type ChartClick, type EChartsOption } from '../../components/charts/EChart';
import { donutOption, escapeHtml } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { ChartCard, Segmented } from '../../components/ui';
import { msg, t } from '../../i18n';
import { fmtInt, fmtMultiple, fmtPct, fmtUSD } from '../../lib/utils/format';
import { showGroup } from './actions';
import type { GroupRow, LensData } from './lenses';

type View = 'bars' | 'users' | 'usage';

const VIEWS = [
  { value: 'bars' as const, label: msg('Bars'), title: msg('Share of users next to share of usage') },
  { value: 'users' as const, label: msg('Users'), title: msg('Donut of users by group') },
  { value: 'usage' as const, label: msg('Usage'), title: msg('Donut of usage by group') },
];

const line = (label: string, value: string): string => `<div style="display:flex;justify-content:space-between;gap:16px"><span>${escapeHtml(label)}</span><b>${value}</b></div>`;

function tooltip(row: GroupRow): string {
  const ratio = row.userShare > 0 ? row.usageShare / row.userShare : Number.NaN;
  return [
    `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(row.item.label)}</div>`,
    line(t('Users'), `${fmtInt(row.users)} (${fmtPct(row.userShare, 1)})`),
    line(t('Usage'), `${fmtUSD(row.gross, 0)} (${fmtPct(row.usageShare, 1)})`),
    line(t('Per user, per month'), fmtUSD(row.perUserMonth, 0)),
    line(t('Compared with the average user'), fmtMultiple(ratio)),
  ].join('');
}

function barsOption(colors: ChartColors, rows: GroupRow[]): EChartsOption {
  const filtered = rows.some((row) => row.active);
  const usersName = t('Share of users');
  const usageName = t('Share of usage');
  const bar = (name: string, color: string, pick: (row: GroupRow) => number) => ({
    name,
    type: 'bar' as const,
    barMaxWidth: 16,
    data: rows.map((row) => ({ value: pick(row), itemStyle: { color, opacity: filtered && !row.active ? 0.35 : 1 } })),
    label: { show: true, position: 'right' as const, color: colors.textMuted, fontSize: 12, formatter: (point: { value?: unknown }) => fmtPct(Number(point.value), 0) },
  });
  return {
    grid: { left: 8, right: 40, top: 32, bottom: 8, containLabel: true },
    legend: { top: 0, data: [usersName, usageName] },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
        const row = first?.dataIndex === undefined ? undefined : rows[first.dataIndex];
        return row ? tooltip(row) : '';
      },
    },
    xAxis: { type: 'value', min: 0, axisLabel: { formatter: (share: number) => fmtPct(share, 0) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((row) => row.item.label),
      axisLabel: { width: 120, overflow: 'truncate', color: colors.text, fontSize: 12 },
      axisLine: { show: false },
    },
    series: [bar(usersName, colors.info, (row) => row.userShare), bar(usageName, colors.accent, (row) => row.usageShare)],
  };
}

function donutFor(colors: ChartColors, rows: GroupRow[], view: 'users' | 'usage'): EChartsOption {
  const value = (row: GroupRow) => (view === 'users' ? row.users : row.gross);
  const total = rows.reduce((sum, row) => sum + value(row), 0);
  return donutOption(colors, {
    items: rows.map((row) => ({ name: row.item.label, value: value(row), color: row.item.color })),
    format: view === 'users' ? (count) => fmtInt(count) : (amount) => fmtUSD(amount, 0),
    center: { value: view === 'users' ? fmtInt(total) : fmtUSD(total, 0), caption: view === 'users' ? t('users') : t('usage') },
    legend: 'bottom',
  });
}

export function ConcentrationChart({ data }: { data: LensData }) {
  const { lens, rows } = data;
  const colors = useChartColors();
  const [view, setView] = useState<View>('bars');
  const mode: View = lens.id === 'trait' ? 'bars' : view;

  const withUsers = useMemo(() => rows.filter((row) => row.users > 0), [rows]);
  const slices = useMemo(() => withUsers.filter((row) => !row.overlay && (mode === 'usage' ? row.gross : row.users) > 0), [withUsers, mode]);
  const listed = mode === 'bars' ? withUsers : slices;
  const option = useMemo(() => (mode === 'bars' ? barsOption(colors, withUsers) : donutFor(colors, slices, mode)), [colors, mode, withUsers, slices]);
  const views = useMemo(() => VIEWS.map((viewOption) => ({ ...viewOption, label: t(viewOption.label), title: t(viewOption.title) })), []);

  const empty = withUsers.length === 0 ? t('No group has users in the data in view') : listed.length === 0 ? t('There is no usage to show') : false;

  return (
    <ChartCard
      title={t('Share of users vs share of usage')}
      subtitle={t('A group whose usage bar is longer than its users bar uses more than its headcount suggests.')}
      calc="users-vs-usage-share"
      option={option}
      height={mode === 'bars' ? Math.max(220, withUsers.length * 46 + 64) : 300}
      empty={empty}
      exportName={`github-copilot-segments-${lens.id}-shares`}
      label={t('Share of users and share of usage for each group of the {lens} lens', { lens: t(lens.label) })}
      onClick={(event: ChartClick) => {
        const row = listed[event.dataIndex];
        if (row) showGroup(lens, row.id);
      }}
      actions={lens.id === 'trait' ? undefined : <Segmented size="sm" label={t('Chart view')} value={mode} onChange={setView} options={views} />}
      footer={lens.overlayNote ? t(lens.overlayNote) : null}
    />
  );
}
