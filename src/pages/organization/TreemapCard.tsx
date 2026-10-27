import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { useChartColors } from '../../components/charts/EChart';
import { escapeHtml, usd } from '../../components/charts/helpers';
import { ChartCard } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtPctAuto } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { filterToGroup, readableOn } from './bits';
import type { DimSpec } from './dimensions';
import type { Group } from './groups';

const MAX_NODES = 40;
/** Smaller tiles are too small for a readable name; the tooltip still has it. */
const LABEL_MIN_SHARE = 0.015;

interface TreeNode {
  name: string;
  value: number;
  /** Index into the shown groups, or -1 for the "Other" tile. */
  gid: number;
  itemStyle: { color: string };
  label: { show: boolean; color: string };
}

const gidOf = (chartItem: unknown, byName: Map<string, number>): number | null => {
  const tile = chartItem as { name?: string; data?: { gid?: unknown } } | null;
  const groupIndex = tile?.data?.gid;
  if (typeof groupIndex === 'number') return groupIndex;
  return tile?.name !== undefined ? (byName.get(tile.name) ?? null) : null;
};

/** Tiles sized by usage and tinted by the part of the group's usage that is billed on top of seats. */
export function TreemapCard({ spec, groups, height }: { spec: DimSpec; groups: Group[]; height: number }) {
  const colors = useChartColors();
  const billing = useAnalysis().analysis.coverage.billing;

  const model = useMemo(() => {
    const withUsage = groups.filter((group) => group.gross > 0);
    const shown = withUsage.slice(0, MAX_NODES);
    const rest = withUsage.slice(MAX_NODES);
    const steps = colors.ramp.slice(1);
    let maxBilled = 0;
    if (billing) for (const group of shown) maxBilled = Math.max(maxBilled, group.net / group.gross);
    const tint = (group: Group) => steps[maxBilled > 0 ? Math.min(steps.length - 1, Math.floor((group.net / group.gross / maxBilled) * steps.length)) : 0];

    const nodes: TreeNode[] = shown.map((group, groupIndex) => {
      const fill = tint(group);
      return { name: group.name, value: group.gross, gid: groupIndex, itemStyle: { color: fill }, label: { show: group.share >= LABEL_MIN_SHARE, color: readableOn(fill, colors.text, colors.surface) } };
    });
    let other: { count: number; gross: number; share: number } | null = null;
    if (rest.length > 0) {
      other = { count: rest.length, gross: 0, share: 0 };
      for (const group of rest) {
        other.gross += group.gross;
        other.share += group.share;
      }
      nodes.push({
        name: t('Other ({n} more)', { n: fmtInt(rest.length) }),
        value: other.gross,
        gid: -1,
        itemStyle: { color: colors.muted },
        label: { show: other.share >= LABEL_MIN_SHARE, color: readableOn(colors.muted, colors.text, colors.surface) },
      });
    }
    return { nodes, shown, other, maxBilled, steps, byName: new Map(nodes.map((node) => [node.name, node.gid])) };
  }, [groups, colors, billing]);

  const option = useMemo<EChartsOption>(() => {
    const { nodes, shown, other, byName } = model;
    return {
      tooltip: {
        trigger: 'item',
        formatter: (chartItem: unknown) => {
          const groupIndex = gidOf(chartItem, byName);
          if (groupIndex === null) return '';
          if (groupIndex < 0) {
            return other
              ? [
                  `<b>${escapeHtml(t('Other ({n} more)', { n: fmtInt(other.count) }))}</b>`,
                  escapeHtml(t('{usd} usage · {pct}', { usd: usd(other.gross), pct: fmtPct(other.share, 1) })),
                  `<span style="opacity:.75">${escapeHtml(t('The table lists every group.'))}</span>`,
                ].join('<br/>')
              : '';
          }
          const group = shown[groupIndex];
          if (!group) return '';
          return [
            `<b>${escapeHtml(group.name)}</b>`,
            escapeHtml(t('{usd} usage · {pct}', { usd: usd(group.gross), pct: fmtPct(group.share, 1) })),
            billing
              ? escapeHtml(
                  group.gross > 0
                    ? t('{usd} billed ({pct} of its usage)', { usd: usd(group.net), pct: fmtPctAuto(group.net / group.gross) })
                    : t('{usd} billed', { usd: usd(group.net) }),
                )
              : null,
            escapeHtml(tp(group.users, '1 user', '{n} users', { n: fmtInt(group.users) })),
            `<span style="opacity:.75">${escapeHtml(t('Click to filter the report.'))}</span>`,
          ]
            .filter(Boolean)
            .join('<br/>');
        },
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          left: 4,
          right: 4,
          top: 4,
          bottom: 4,
          squareRatio: 1.2,
          label: { show: true, position: 'insideTopLeft', formatter: '{b}', fontSize: 12, fontWeight: 600, overflow: 'truncate', padding: [4, 6] },
          itemStyle: { borderColor: colors.surface, borderWidth: 2, gapWidth: 2 },
          emphasis: { itemStyle: { borderColor: colors.text, borderWidth: 2 } },
          data: nodes,
        },
      ],
    };
  }, [model, colors, billing]);

  const { shown, byName, maxBilled, steps } = model;

  return (
    <ChartCard
      title={t(spec.usageBy)}
      subtitle={t('Each tile is sized by usage. Click a tile to filter the report.')}
      calc={billing ? ['org-treemap', 'org-billed-share'] : 'org-treemap'}
      option={option}
      height={height}
      exportName={`github-copilot-organization-${spec.id}-treemap`}
      label={billing ? t('Treemap of usage by group, tinted by the share that is billed on top of seats') : t('Treemap of usage by group')}
      empty={shown.length === 0 ? t('No usage in this view.') : false}
      onClick={(event) => {
        const groupIndex = gidOf(event, byName);
        const group = groupIndex !== null && groupIndex >= 0 ? shown[groupIndex] : undefined;
        if (group) filterToGroup(group);
      }}
      footer={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {maxBilled > 0 ? (
            <>
              <span>{t("Color: share of the group's usage that is billed on top of seats.")}</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="num">{fmtPctAuto(0)}</span>
                <span className="inline-flex overflow-hidden rounded-sm ring-1 ring-border" aria-hidden>
                  {steps.map((color) => (
                    <span key={color} className="h-2.5 w-5" style={{ background: color }} />
                  ))}
                </span>
                <span className="num">{fmtPctAuto(maxBilled)}</span>
              </span>
            </>
          ) : (
            <span>
              {billing
                ? t('Nothing is billed on top of seats in this view, so every tile has the same color.')
                : t('This file does not say what was billed, so every tile has the same color.')}
            </span>
          )}
        </div>
      }
    />
  );
}
