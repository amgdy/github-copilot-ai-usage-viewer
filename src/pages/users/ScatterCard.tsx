import { useMemo, useState } from 'react';
import { EChart, useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { esc, usdCompact } from '../../components/charts/helpers';
import { Card, EmptyState, Segmented, taxLookup } from '../../components/ui';
import { fmtCount, hasQuota, quotaKnown } from '../../components/user/shared';
import type { UserProfile } from '../../lib/analytics/users';
import { msg, t, tp } from '../../i18n';
import { fmtCompact, fmtInt, fmtPct, fmtPctAuto, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { Control } from './Control';
import { GroupedSelect, type SelectGroup } from './GroupedSelect';

const MAX_POINTS = 2000;
const MIN_SIZE = 6;
const SIZE_RANGE = 18;

type XMode = 'days' | 'util' | 'cache' | 'auto';
type YMode = 'usage' | 'tokens';
type SizeMode = 'potential' | 'missed' | 'tokens';
type YScale = 'linear' | 'log';

/** What the file needs to have for a measure to exist. */
type Needs = 'quota' | 'tokens' | 'models';
type Have = Record<Needs, boolean>;

interface Measure {
  /** English, marked with msg(). Translated at render. */
  label: string;
  calc: string;
  needs?: Needs;
  /** NaN when the user has no value. */
  value: (p: UserProfile) => number;
  format: (v: number) => string;
  /** The whole "N users without … are not shown." sentence, in the reader's language. */
  hidden?: (n: number) => string;
}

const X_MEASURES: Record<XMode, Measure> = {
  days: {
    label: msg('Active days'),
    calc: 'user-active-days',
    value: (p) => p.activeDays,
    format: (v) => fmtInt(v),
    hidden: (n) => tp(n, '{n} user without active days is not shown.', '{n} users without active days are not shown.', { n: fmtInt(n) }),
  },
  util: {
    label: msg('Included credits used'),
    calc: 'user-credits-used',
    needs: 'quota',
    value: (p) => (hasQuota(p) ? p.utilization : Number.NaN),
    format: (v) => fmtPctAuto(v),
    hidden: (n) =>
      tp(n, '{n} user without known included credits is not shown.', '{n} users without known included credits are not shown.', { n: fmtInt(n) }),
  },
  cache: {
    label: msg('Cache hit rate'),
    calc: 'cache-hit',
    needs: 'tokens',
    value: (p) => p.cacheHit,
    format: (v) => fmtPct(v, 0),
    hidden: (n) => tp(n, '{n} user without prompt tokens is not shown.', '{n} users without prompt tokens are not shown.', { n: fmtInt(n) }),
  },
  auto: {
    label: msg('Auto share of usage'),
    calc: 'auto-share',
    needs: 'models',
    value: (p) => (p.gross > 0 ? p.autoShare : Number.NaN),
    format: (v) => fmtPct(v, 0),
    hidden: (n) => tp(n, '{n} user without usage is not shown.', '{n} users without usage are not shown.', { n: fmtInt(n) }),
  },
};

const Y_MEASURES: Record<YMode, Measure> = {
  usage: {
    label: msg('Usage'),
    calc: 'usage',
    value: (p) => p.gross,
    format: (v) => fmtUSD(v),
    hidden: (n) =>
      tp(n, '{n} user without usage is not shown on the log scale.', '{n} users without usage are not shown on the log scale.', { n: fmtInt(n) }),
  },
  tokens: {
    label: msg('Total tokens'),
    calc: 'tokens-total',
    needs: 'tokens',
    value: (p) => p.tokens,
    format: (v) => fmtCount(v),
    hidden: (n) =>
      tp(n, '{n} user without tokens is not shown on the log scale.', '{n} users without tokens are not shown on the log scale.', { n: fmtInt(n) }),
  },
};

const SIZE_MEASURES: Record<SizeMode, Measure> = {
  potential: { label: msg('Potential savings'), calc: 'user-potential', value: (p) => p.potential, format: (v) => fmtUSD(v) },
  missed: {
    label: msg('Discount missed on hand-picked usage'),
    calc: 'auto-missed',
    needs: 'models',
    value: (p) => p.autoMissed,
    format: (v) => fmtUSD(v),
  },
  tokens: { label: msg('Total tokens'), calc: 'tokens-total', needs: 'tokens', value: (p) => p.tokens, format: (v) => fmtCount(v) },
};

/** Why a measure cannot be chosen, shown on the disabled option. */
const REASONS: Record<Needs, string> = {
  quota: msg('This file does not say how many included credits each user has.'),
  tokens: msg('This file has no token columns.'),
  models: msg('This file has no model names.'),
};

/** The note under the chart for each missing input. */
const UNAVAILABLE: Record<Needs, string> = {
  quota: msg('Included credits used cannot be chosen, because this file does not say how many included credits each user has.'),
  tokens: msg('Cache hit rate and total tokens cannot be chosen, because this file has no token columns.'),
  models: msg('Auto share of usage and the discount missed on hand-picked usage cannot be chosen, because this file has no model names.'),
};

const usable = (m: Measure, have: Have): boolean => !m.needs || have[m.needs];

function choices<T extends string>(measures: Record<T, Measure>, have: Have): SelectGroup<T>[] {
  return [
    {
      options: (Object.keys(measures) as T[]).map((value) => {
        const m = measures[value];
        const ok = usable(m, have);
        return { value, label: t(m.label), disabled: !ok, title: !ok && m.needs ? t(REASONS[m.needs]) : undefined };
      }),
    },
  ];
}

function preparePoints(profiles: readonly UserProfile[], x: Measure, y: Measure, yScale: YScale) {
  const ranked = [...profiles].sort((a, b) => b.gross - a.gross);
  const capped = ranked.length > MAX_POINTS;
  const plotted: UserProfile[] = [];
  let noX = 0;
  let noY = 0;
  for (const p of capped ? ranked.slice(0, MAX_POINTS) : ranked) {
    if (!Number.isFinite(x.value(p))) {
      noX++;
      continue;
    }
    const yv = y.value(p);
    if (!Number.isFinite(yv) || (yScale === 'log' && yv <= 0)) {
      noY++;
      continue;
    }
    plotted.push(p);
  }
  return { plotted, capped, total: ranked.length, noX, noY };
}

export function ScatterCard() {
  const { analysis, taxonomy } = useAnalysis();
  const colors = useChartColors();
  const [xPick, setXPick] = useState<XMode>('days');
  const [yPick, setYPick] = useState<YMode>('usage');
  const [sizePick, setSizePick] = useState<SizeMode>('potential');
  const [yScale, setYScale] = useState<YScale>('linear');
  const profiles = analysis.users.profiles;
  const quota = useMemo(() => quotaKnown(profiles), [profiles]);
  const { tokens, models } = analysis.coverage;
  const have = useMemo<Have>(() => ({ quota, tokens, models }), [quota, tokens, models]);

  // A choice that the file cannot support falls back to the default one.
  const xMode: XMode = usable(X_MEASURES[xPick], have) ? xPick : 'days';
  const yMode: YMode = usable(Y_MEASURES[yPick], have) ? yPick : 'usage';
  const sizeMode: SizeMode = usable(SIZE_MEASURES[sizePick], have) ? sizePick : 'potential';
  const x = X_MEASURES[xMode];
  const y = Y_MEASURES[yMode];
  const size = SIZE_MEASURES[sizeMode];

  const prepared = useMemo(() => preparePoints(profiles, x, y, yScale), [profiles, x, y, yScale]);
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);

  const option = useMemo<EChartsOption | null>(() => {
    const { plotted } = prepared;
    if (plotted.length === 0) return null;
    let maxSize = 0;
    let minY = Infinity;
    for (const p of plotted) {
      const s = size.value(p);
      if (s > maxSize) maxSize = s;
      const v = y.value(p);
      if (v > 0 && v < minY) minY = v;
    }
    const sizeOf = (p: UserProfile) => {
      const s = size.value(p);
      return maxSize > 0 && Number.isFinite(s) ? MIN_SIZE + SIZE_RANGE * Math.sqrt(Math.max(0, s) / maxSize) : MIN_SIZE + 2;
    };
    const yAxisLabel = (v: number) => (yMode === 'usage' ? usdCompact(v) : fmtCompact(v));
    const byId = new Map(plotted.map((p) => [p.id, p]));

    const groups = taxonomy.personas
      .map((item) => ({ item, users: plotted.filter((p) => p.persona === item.id) }))
      .filter((g) => g.users.length > 0);

    const series = groups.map(({ item, users }, i) => ({
      name: item.label,
      type: 'scatter' as const,
      data: users.map((p) => [x.value(p), y.value(p), p.id, sizeOf(p)]),
      symbolSize: (v: number[]) => v[3],
      itemStyle: { color: item.color, opacity: 0.78, borderColor: colors.surface, borderWidth: 1 },
      emphasis: { focus: 'series' as const, itemStyle: { opacity: 1, borderColor: colors.text, borderWidth: 1.5 } },
      markLine:
        xMode === 'util' && i === 0
          ? {
              symbol: 'none',
              silent: true,
              animation: false,
              lineStyle: { type: 'dashed' as const, width: 1, color: colors.textSubtle },
              label: { formatter: t('All included credits used'), color: colors.textMuted, fontSize: 12, position: 'insideEndTop' as const },
              data: [{ xAxis: 1 }],
            }
          : undefined,
    }));

    return {
      grid: { left: 8, right: 24, top: 40, bottom: 36, containLabel: true },
      legend: { top: 0, type: 'scroll', data: groups.map((g) => g.item.label) },
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (raw: unknown) => {
          const d = (raw as { data?: number[] }).data;
          const p = d ? byId.get(d[2]) : undefined;
          if (!p) return '';
          const line = (m: Measure) => esc(t('{label}: {value}', { label: t(m.label), value: m.format(m.value(p)) }));
          const lines = [
            `<b>${esc(p.name)}</b>`,
            `<span style="opacity:.75">${esc(personas[p.persona]?.label ?? '')}</span>`,
            line(y),
            line(x),
            size.label === y.label ? '' : line(size),
          ];
          return lines.filter(Boolean).join('<br/>');
        },
      },
      xAxis: {
        type: 'value',
        name: t(x.label),
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: colors.textMuted, fontSize: 12 },
        min: 0,
        max: xMode === 'cache' || xMode === 'auto' ? 1 : undefined,
        minInterval: xMode === 'days' ? 1 : undefined,
        axisLabel: { formatter: (v: number) => (xMode === 'days' ? String(v) : x.format(v)) },
      },
      yAxis:
        yScale === 'log'
          ? {
              type: 'log',
              logBase: 10,
              min: Number.isFinite(minY) ? Math.pow(10, Math.floor(Math.log10(minY))) : undefined,
              axisLabel: { formatter: yAxisLabel },
            }
          : { type: 'value', min: 0, axisLabel: { formatter: yAxisLabel } },
      series,
    };
  }, [prepared, taxonomy, personas, colors, x, y, size, xMode, yMode, yScale]);

  const extraCalc = useMemo(() => Array.from(new Set([x.calc, y.calc, size.calc])), [x, y, size]);
  const xChoices = useMemo(() => choices(X_MEASURES, have), [have]);
  const yChoices = useMemo(() => choices(Y_MEASURES, have), [have]);
  const sizeChoices = useMemo(() => choices(SIZE_MEASURES, have), [have]);

  const unavailable = (Object.keys(UNAVAILABLE) as Needs[]).filter((need) => !have[need]).map((need) => t(UNAVAILABLE[need]));

  const notes = [
    prepared.capped ? t('Showing the {n} users with the most usage of {total}.', { n: fmtInt(MAX_POINTS), total: fmtInt(prepared.total) }) : '',
    prepared.noX > 0 && x.hidden ? x.hidden(prepared.noX) : '',
    prepared.noY > 0 && y.hidden ? y.hidden(prepared.noY) : '',
    ...unavailable,
  ].filter(Boolean);

  return (
    <Card
      title={t('Compare users')}
      subtitle={t('One dot per user. Choose what the two axes and the dot size show. Click a dot to open the user.')}
      padded={false}
      calc={['user-usage-scatter', ...extraCalc]}
    >
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-border-muted px-4 py-3">
        <Control label={t('Horizontal axis')}>
          <GroupedSelect value={xMode} onChange={setXPick} groups={xChoices} aria-label={t('Horizontal axis')} />
        </Control>
        <Control label={t('Vertical axis')}>
          <GroupedSelect value={yMode} onChange={setYPick} groups={yChoices} aria-label={t('Vertical axis')} />
        </Control>
        <Control label={t('Dot size')}>
          <GroupedSelect value={sizeMode} onChange={setSizePick} groups={sizeChoices} aria-label={t('Dot size')} />
        </Control>
        <Control label={t('Vertical scale')}>
          <Segmented
            label={t('Vertical scale')}
            value={yScale}
            onChange={setYScale}
            options={[
              { value: 'linear', label: t('Linear') },
              { value: 'log', label: t('Log'), title: t('The log scale spreads out the smaller users.') },
            ]}
          />
        </Control>
      </div>
      {option ? (
        <div className="px-2 pt-3">
          <EChart
            option={option}
            height={320}
            exportName="github-copilot-user-scatter"
            label={t('Scatter chart of {y} against {x}, one dot per user', { y: t(y.label), x: t(x.label) })}
            onClick={(p) => {
              if (p.componentType !== 'series') return;
              const id = Array.isArray(p.data) ? Number(p.data[2]) : Number.NaN;
              if (Number.isFinite(id)) useApp.getState().selectUser(id);
            }}
          />
        </div>
      ) : (
        <div className="p-4">
          <EmptyState title={t('No users to plot')} description={t('Switch an axis or the scale to see more users.')} />
        </div>
      )}
      {notes.length > 0 ? <p className="px-4 pb-3 pt-1 text-xs text-fg-muted">{notes.join(' ')}</p> : <div className="pb-3" />}
    </Card>
  );
}
