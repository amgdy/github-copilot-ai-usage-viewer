import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { useChartColors } from '../../components/charts/EChart';
import { esc, usd } from '../../components/charts/helpers';
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

const gidOf = (p: unknown, byName: Map<string, number>): number | null => {
  const q = p as { name?: string; data?: { gid?: unknown } } | null;
  const gid = q?.data?.gid;
  if (typeof gid === 'number') return gid;
  return q?.name !== undefined ? (byName.get(q.name) ?? null) : null;
};

/** Tiles sized by usage and tinted by the part of the group's usage that is billed on top of seats. */
export function TreemapCard({ spec, groups, height }: { spec: DimSpec; groups: Group[]; height: number }) {
  const colors = useChartColors();
  const billing = useAnalysis().analysis.coverage.billing;

  const model = useMemo(() => {
    const withUsage = groups.filter((g) => g.gross > 0);
    const shown = withUsage.slice(0, MAX_NODES);
    const rest = withUsage.slice(MAX_NODES);
    const steps = colors.ramp.slice(1);
    let maxBilled = 0;
    if (billing) for (const g of shown) maxBilled = Math.max(maxBilled, g.net / g.gross);
    const tint = (g: Group) => steps[maxBilled > 0 ? Math.min(steps.length - 1, Math.floor((g.net / g.gross / maxBilled) * steps.length)) : 0];

    const nodes: TreeNode[] = shown.map((g, gid) => {
      const fill = tint(g);
      return { name: g.name, value: g.gross, gid, itemStyle: { color: fill }, label: { show: g.share >= LABEL_MIN_SHARE, color: readableOn(fill, colors.text, colors.surface) } };
    });
    let other: { count: number; gross: number; share: number } | null = null;
    if (rest.length > 0) {
      other = { count: rest.length, gross: 0, share: 0 };
      for (const g of rest) {
        other.gross += g.gross;
        other.share += g.share;
      }
      nodes.push({
        name: t('Other ({n} more)', { n: fmtInt(rest.length) }),
        value: other.gross,
        gid: -1,
        itemStyle: { color: colors.muted },
        label: { show: other.share >= LABEL_MIN_SHARE, color: readableOn(colors.muted, colors.text, colors.surface) },
      });
    }
    return { nodes, shown, other, maxBilled, steps, byName: new Map(nodes.map((n) => [n.name, n.gid])) };
  }, [groups, colors, billing]);

  const option = useMemo<EChartsOption>(() => {
    const { nodes, shown, other, byName } = model;
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const gid = gidOf(p, byName);
          if (gid === null) return '';
          if (gid < 0) {
            return other
              ? [
                  `<b>${esc(t('Other ({n} more)', { n: fmtInt(other.count) }))}</b>`,
                  esc(t('{usd} usage · {pct}', { usd: usd(other.gross), pct: fmtPct(other.share, 1) })),
                  `<span style="opacity:.75">${esc(t('The table lists every group.'))}</span>`,
                ].join('<br/>')
              : '';
          }
          const g = shown[gid];
          if (!g) return '';
          return [
            `<b>${esc(g.name)}</b>`,
            esc(t('{usd} usage · {pct}', { usd: usd(g.gross), pct: fmtPct(g.share, 1) })),
            billing
              ? esc(
                  g.gross > 0
                    ? t('{usd} billed ({pct} of its usage)', { usd: usd(g.net), pct: fmtPctAuto(g.net / g.gross) })
                    : t('{usd} billed', { usd: usd(g.net) }),
                )
              : null,
            esc(tp(g.users, '1 user', '{n} users', { n: fmtInt(g.users) })),
            `<span style="opacity:.75">${esc(t('Click to filter the report.'))}</span>`,
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
      onClick={(p) => {
        const gid = gidOf(p, byName);
        const g = gid !== null && gid >= 0 ? shown[gid] : undefined;
        if (g) filterToGroup(g);
      }}
      footer={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {maxBilled > 0 ? (
            <>
              <span>{t("Color: share of the group's usage that is billed on top of seats.")}</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="num">{fmtPctAuto(0)}</span>
                <span className="inline-flex overflow-hidden rounded-sm ring-1 ring-border" aria-hidden>
                  {steps.map((c) => (
                    <span key={c} className="h-2.5 w-5" style={{ background: c }} />
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
