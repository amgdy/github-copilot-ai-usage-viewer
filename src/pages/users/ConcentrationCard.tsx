import { useMemo } from 'react';
import { EChart, useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { Card, EmptyState, TaxBadge, taxLookup } from '../../components/ui';
import { T, t, tp } from '../../i18n';
import { fmtInt, fmtNum, fmtPct, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { concentration, giniLabel } from './stats';

interface TipParam {
  seriesIndex?: number;
  value?: unknown;
}

interface BandEdge {
  xAxis: number;
  itemStyle?: { color: string; opacity: number };
  label?: { show: boolean; formatter: string; position: 'insideBottom'; color: string; fontSize: number };
}

const pctAxis = (share: number): string => `${Math.round(share * 100)}%`;

export function ConcentrationCard() {
  const { analysis, taxonomy, settings } = useAnalysis();
  const colors = useChartColors();
  const profiles = analysis.users.profiles;
  const { a: classACutoff, b: classBCutoff } = settings.pareto;

  const usageConcentration = useMemo(() => concentration(profiles.map((user) => user.gross), { a: classACutoff, b: classBCutoff }), [profiles, classACutoff, classBCutoff]);
  const pareto = useMemo(() => taxLookup(taxonomy.pareto), [taxonomy]);

  const option = useMemo<EChartsOption | null>(() => {
    if (!usageConcentration || usageConcentration.n < 2) return null;
    const { edges, n: userCount } = usageConcentration;
    const band = (from: number, to: number, id: 'A' | 'B' | 'C'): [BandEdge, BandEdge] => [
      { xAxis: from, itemStyle: { color: pareto[id].color, opacity: 0.12 }, label: { show: true, formatter: id, position: 'insideBottom', color: colors.textMuted, fontSize: 12 } },
      { xAxis: to },
    ];
    return {
      grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: unknown) => {
          const list = (Array.isArray(params) ? params : [params]) as TipParam[];
          const point = list.find((param) => param.seriesIndex === 0);
          const pointValue = point?.value;
          if (!Array.isArray(pointValue)) return '';
          const users = Math.round(Number(pointValue[0]) * userCount);
          if (users === 0) return t('No users yet: 0% of usage');
          const head = t('{share} of usage', { share: fmtPct(Number(pointValue[1]), 0) });
          const by = tp(users, 'made by the biggest user ({share} of users)', 'made by the {n} biggest users ({share} of users)', {
            n: fmtInt(users),
            share: fmtPct(users / userCount, 0),
          });
          return `<b>${head}</b><br/>${by}`;
        },
      },
      xAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: pctAxis }, splitLine: { show: false } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: pctAxis } },
      series: [
        {
          name: t('Usage'),
          type: 'line',
          data: usageConcentration.curve,
          showSymbol: false,
          smooth: false,
          z: 3,
          color: colors.accent,
          lineStyle: { width: 2.5, color: colors.accent },
          areaStyle: { color: colors.accent, opacity: 0.1 },
          markArea: {
            silent: true,
            data: [band(0, edges.a, 'A'), band(edges.a, edges.b, 'B'), band(edges.b, 1, 'C')],
          },
          markLine: {
            symbol: 'none',
            silent: true,
            animation: false,
            lineStyle: { type: 'dashed', width: 1, color: colors.textSubtle },
            label: { color: colors.textMuted, fontSize: 12, position: 'insideStartTop' },
            data: [
              { yAxis: classACutoff, label: { formatter: t('{share} of usage', { share: fmtPct(classACutoff, 0) }) } },
              { yAxis: classBCutoff, label: { formatter: t('{share} of usage', { share: fmtPct(classBCutoff, 0) }) } },
              { xAxis: edges.a, label: { show: false } },
              { xAxis: edges.b, label: { show: false } },
            ],
          },
        },
        {
          name: t('Equal use'),
          type: 'line',
          data: [
            [0, 0],
            [1, 1],
          ],
          silent: true,
          showSymbol: false,
          color: colors.textSubtle,
          lineStyle: { type: 'dashed', width: 1, color: colors.textSubtle },
        },
      ],
    };
  }, [usageConcentration, pareto, colors, classACutoff, classBCutoff]);

  const top = usageConcentration?.top(0.1);
  const gini = usageConcentration?.gini ?? Number.NaN;
  const classes = usageConcentration ? (['A', 'B', 'C'] as const).map((id) => ({ item: pareto[id], ...usageConcentration.classes[id] })) : [];
  const headline = top ? t('{users} of users make {share} of usage', { users: fmtPct(top.k / top.n, 0), share: fmtPct(top.share, 0) }) : '';

  return (
    <Card
      title={t('Who drives usage')}
      subtitle={t('How much of all usage the biggest users make')}
      padded={false}
      calc={['user-concentration', 'top-decile-share', 'pareto-classes']}
      footer={
        analysis.segmentFiltered
          ? t('Classes A, B and C are recalculated for the users shown, so they can differ from the class in the table.')
          : undefined
      }
    >
      {!usageConcentration || !option || !top ? (
        <div className="p-4">
          <EmptyState title={t('Not enough users')} description={t('At least two users with usage are needed to show how usage is spread.')} />
        </div>
      ) : (
        <>
          <div className="px-4 pt-3">
            <p className="num text-lg font-semibold leading-snug">{headline}</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {tp(top.k, 'That is the biggest user of {total}.', 'That is the {n} biggest users of {total}.', { n: fmtInt(top.k), total: fmtInt(top.n) })}
            </p>
          </div>
          <div className="px-2 pt-2">
            <EChart option={option} height={260} exportName="github-copilot-usage-concentration" label={headline} />
          </div>
          <p className="px-4 text-xs text-fg-muted">
            {t('Left to right: users from the biggest to the smallest. Up: their combined share of usage. The dashed diagonal is what equal use would look like.')}
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 px-4">
            {classes.map(({ item, users, share }) => (
              <li key={item.id} className="min-w-0 rounded-md border border-border-muted bg-surface-2 p-2">
                <TaxBadge item={item} />
                <div className="num mt-1.5 text-sm font-semibold">{t('{share} of usage', { share: fmtPct(share, 0) })}</div>
                <div className="num text-xs text-fg-muted">
                  {t('{users} ({share})', { users: pluralize(users, 'user'), share: fmtPct(users / usageConcentration.n, 0) })}
                </div>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-3 pt-3 text-xs text-fg-muted">
            <T
              text="{gini} ({level}). 0 means everyone uses the same amount. 1 means one person uses everything."
              values={{ gini: <span className="font-medium text-fg">{t('Gini coefficient {value}', { value: fmtNum(gini, 2) })}</span>, level: giniLabel(gini) }}
            />
          </p>
        </>
      )}
    </Card>
  );
}
