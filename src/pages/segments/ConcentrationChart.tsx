import { useMemo, useState } from 'react';
import { useChartColors, type ChartClick, type EChartsOption } from '../../components/charts/EChart';
import { donutOption, esc } from '../../components/charts/helpers';
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

const line = (k: string, v: string): string => `<div style="display:flex;justify-content:space-between;gap:16px"><span>${esc(k)}</span><b>${v}</b></div>`;

function tooltip(r: GroupRow): string {
  const ratio = r.userShare > 0 ? r.usageShare / r.userShare : Number.NaN;
  return [
    `<div style="font-weight:600;margin-bottom:4px">${esc(r.item.label)}</div>`,
    line(t('Users'), `${fmtInt(r.users)} (${fmtPct(r.userShare, 1)})`),
    line(t('Usage'), `${fmtUSD(r.gross, 0)} (${fmtPct(r.usageShare, 1)})`),
    line(t('Per user, per month'), fmtUSD(r.perUserMonth, 0)),
    line(t('Compared with the average user'), fmtMultiple(ratio)),
  ].join('');
}

function barsOption(c: ChartColors, rows: GroupRow[]): EChartsOption {
  const filtered = rows.some((r) => r.active);
  const usersName = t('Share of users');
  const usageName = t('Share of usage');
  const bar = (name: string, color: string, pick: (r: GroupRow) => number) => ({
    name,
    type: 'bar' as const,
    barMaxWidth: 16,
    data: rows.map((r) => ({ value: pick(r), itemStyle: { color, opacity: filtered && !r.active ? 0.35 : 1 } })),
    label: { show: true, position: 'right' as const, color: c.textMuted, fontSize: 12, formatter: (p: { value?: unknown }) => fmtPct(Number(p.value), 0) },
  });
  return {
    grid: { left: 8, right: 40, top: 32, bottom: 8, containLabel: true },
    legend: { top: 0, data: [usersName, usageName] },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
        const r = first?.dataIndex === undefined ? undefined : rows[first.dataIndex];
        return r ? tooltip(r) : '';
      },
    },
    xAxis: { type: 'value', min: 0, axisLabel: { formatter: (v: number) => fmtPct(v, 0) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => r.item.label),
      axisLabel: { width: 120, overflow: 'truncate', color: c.text, fontSize: 12 },
      axisLine: { show: false },
    },
    series: [bar(usersName, c.info, (r) => r.userShare), bar(usageName, c.accent, (r) => r.usageShare)],
  };
}

function donutFor(c: ChartColors, rows: GroupRow[], view: 'users' | 'usage'): EChartsOption {
  const value = (r: GroupRow) => (view === 'users' ? r.users : r.gross);
  const total = rows.reduce((s, r) => s + value(r), 0);
  return donutOption(c, {
    items: rows.map((r) => ({ name: r.item.label, value: value(r), color: r.item.color })),
    format: view === 'users' ? (v) => fmtInt(v) : (v) => fmtUSD(v, 0),
    center: { value: view === 'users' ? fmtInt(total) : fmtUSD(total, 0), caption: view === 'users' ? t('users') : t('usage') },
    legend: 'bottom',
  });
}

export function ConcentrationChart({ data }: { data: LensData }) {
  const { lens, rows } = data;
  const c = useChartColors();
  const [view, setView] = useState<View>('bars');
  const mode: View = lens.id === 'trait' ? 'bars' : view;

  const withUsers = useMemo(() => rows.filter((r) => r.users > 0), [rows]);
  const slices = useMemo(() => withUsers.filter((r) => !r.overlay && (mode === 'usage' ? r.gross : r.users) > 0), [withUsers, mode]);
  const listed = mode === 'bars' ? withUsers : slices;
  const option = useMemo(() => (mode === 'bars' ? barsOption(c, withUsers) : donutFor(c, slices, mode)), [c, mode, withUsers, slices]);
  const views = useMemo(() => VIEWS.map((v) => ({ ...v, label: t(v.label), title: t(v.title) })), []);

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
      onClick={(p: ChartClick) => {
        const r = listed[p.dataIndex];
        if (r) showGroup(lens, r.id);
      }}
      actions={lens.id === 'trait' ? undefined : <Segmented size="sm" label={t('Chart view')} value={mode} onChange={setView} options={views} />}
      footer={lens.overlayNote ? t(lens.overlayNote) : null}
    />
  );
}
