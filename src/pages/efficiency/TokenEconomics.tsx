import { useMemo } from 'react';
import { CalcInfo, Callout, Card, Section } from '../../components/ui';
import { EChart, useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { escapeHtml, usd } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { t } from '../../i18n';
import { fmtCompact, fmtPct } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { PriceSource } from '../models/parts';
import { CacheHistogram, CacheTrend, LowCacheUsers } from './CacheCards';
import { costSplitTokens, money, tokenRows, type TokenKind, type TokenRow } from './metrics';

/** Four hues far apart (purple, green, yellow, blue), so cache read and output never look alike. */
const kindColors = (chartColors: ChartColors): Record<TokenKind, string> => ({ input: chartColors.palette[2], cacheRead: chartColors.palette[3], cacheWrite: chartColors.palette[4], output: chartColors.accent });

function mixOption(chartColors: ChartColors, rows: TokenRow[], withCost: boolean): EChartsOption {
  const colors = kindColors(chartColors);
  return {
    grid: { left: 8, right: 16, top: 30, bottom: 4, containLabel: true },
    legend: { top: 0, data: rows.map((row) => row.label) },
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const row = rows[(params as { seriesIndex: number }).seriesIndex];
        if (!row) return '';
        const tokens = escapeHtml(t('Tokens: {tokens} ({share})', { tokens: fmtCompact(row.tokens), share: fmtPct(row.tokenShare, 1) }));
        const cost = withCost ? `<br/>${escapeHtml(t('Estimated cost: {cost} ({share})', { cost: usd(row.cost), share: fmtPct(row.costShare, 1) }))}` : '';
        return `<b>${escapeHtml(row.label)}</b><br/>${tokens}${cost}`;
      },
    },
    xAxis: { type: 'value', show: false, min: 0, max: 1 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: withCost ? [t('Tokens'), t('Estimated cost')] : [t('Tokens')],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartColors.text, fontSize: 12 },
    },
    series: rows.map((row) => ({
      name: row.label,
      type: 'bar' as const,
      stack: 'mix',
      barWidth: 30,
      color: colors[row.key],
      itemStyle: { borderColor: chartColors.surface, borderWidth: 1 },
      emphasis: { focus: 'series' as const },
      label: { show: true, color: chartColors.surface, fontSize: 12, fontWeight: 600, formatter: (params: { value?: unknown }) => (Number(params.value) >= 0.08 ? fmtPct(Number(params.value), 0) : '') },
      data: withCost ? [row.tokenShare, row.costShare] : [row.tokenShare],
    })),
  };
}

function mixInsight(rows: TokenRow[]): string {
  const by = (kind: TokenKind): TokenRow => rows.find((row) => row.key === kind) ?? rows[0];
  const read = by('cacheRead');
  const out = by('output');
  const cacheText =
    read.tokens > 0
      ? t('Cache reads are {tokens} of the tokens but only {cost} of the estimated cost.', { tokens: fmtPct(read.tokenShare, 0), cost: fmtPct(read.costShare, 0) })
      : t('No tokens were read from the cache, so every prompt token was priced as input or cache write.');
  return `${cacheText} ${t('Output is {tokens} of the tokens and {cost} of the cost.', { tokens: fmtPct(out.tokenShare, 0), cost: fmtPct(out.costShare, 0) })}`;
}

function TokenMix() {
  const { analysis } = useAnalysis();
  const colors = useChartColors();
  const { agg: aggregates } = analysis;
  const totals = aggregates.totals;
  const rows = useMemo(() => tokenRows(totals, costSplitTokens(aggregates)), [aggregates, totals]);
  const sum = (pick: (row: TokenRow) => number): number => rows.reduce((total, row) => total + pick(row), 0);
  const tokenTotal = sum((row) => row.tokens);
  const costTotal = sum((row) => row.cost);
  const withCost = costTotal > 0;
  const option = useMemo(() => mixOption(colors, rows, withCost), [colors, rows, withCost]);
  const palette = kindColors(colors);
  const coverage = totals.gross > 0 ? totals.pricedGross / totals.gross : Number.NaN;

  return (
    <Card
      title={t('Tokens and cost by token type')}
      subtitle={t('The share of each token type next to the share of the estimated cost')}
      calc="token-mix"
      footer={
        <div className="space-y-1">
          <p>
            {t('Estimated: each token type is priced at the standard rate of its model on the price card, then scaled to match the usage amount in the report.')}
            {Number.isFinite(coverage) && coverage < 0.995
              ? ` ${t('Only usage that could be priced from token counts is included ({share} of all usage), so the token counts here can be lower than the totals elsewhere.', { share: fmtPct(coverage, 0) })}`
              : ''}{' '}
            {t('It will not match the invoice to the cent.')}
          </p>
          <PriceSource />
        </div>
      }
    >
      <EChart option={option} height={withCost ? 150 : 100} exportName="github-copilot-token-mix" label={t('Share of tokens and share of estimated cost by token type')} />
      <p className="mt-2 text-sm text-fg-muted">{withCost ? mixInsight(rows) : t('No model in this selection has a known price, so the cost split cannot be estimated.')}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-xs">
          <thead>
            <tr className="text-end text-fg-muted">
              <th scope="col" className="py-1 pe-2 text-start font-medium">
                {t('Token type')}
              </th>
              <th scope="col" className="px-2 py-1 font-medium">
                {t('Tokens')}
              </th>
              <th scope="col" className="px-2 py-1 font-medium">
                {t('Share of tokens')}
              </th>
              <th scope="col" className="px-2 py-1 font-medium">
                <span className="inline-flex items-center justify-end gap-1">
                  {t('Estimated cost')}
                  <CalcInfo id="token-mix" />
                </span>
              </th>
              <th scope="col" className="px-2 py-1 font-medium">
                {t('Share of cost')}
              </th>
              <th scope="col" className="py-1 ps-2 font-medium">
                <span className="inline-flex items-center justify-end gap-1">
                  {t('Cost per 1M tokens')}
                  <CalcInfo id="token-per-million" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted text-end">
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="py-1.5 pe-2 text-start font-normal">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-xs" style={{ background: palette[row.key] }} />
                    {row.label}
                  </span>
                </th>
                <td className="num px-2 py-1.5">{fmtCompact(row.tokens)}</td>
                <td className="num px-2 py-1.5 text-fg-muted">{fmtPct(row.tokenShare, 1)}</td>
                <td className="num px-2 py-1.5">{withCost ? money(row.cost) : '–'}</td>
                <td className="num px-2 py-1.5 text-fg-muted">{withCost ? fmtPct(row.costShare, 1) : '–'}</td>
                <td className="num py-1.5 ps-2">{withCost && Number.isFinite(row.perMillion) ? money(row.perMillion) : '–'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border text-end font-medium">
              <th scope="row" className="py-1.5 pe-2 text-start font-medium">
                {t('Total')}
              </th>
              <td className="num px-2 py-1.5">{fmtCompact(tokenTotal)}</td>
              <td className="num px-2 py-1.5">{fmtPct(1, 0)}</td>
              <td className="num px-2 py-1.5">{withCost ? money(costTotal) : '–'}</td>
              <td className="num px-2 py-1.5">{withCost ? fmtPct(1, 0) : '–'}</td>
              <td className="num py-1.5 ps-2">{withCost && tokenTotal > 0 ? money((costTotal / tokenTotal) * 1e6) : '–'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

export function TokenEconomics() {
  const { analysis, store } = useAnalysis();
  const totals = analysis.agg.totals;
  const hasTokens = store.hasTokens && totals.input + totals.cacheRead + totals.cacheWrite + totals.output > 0;

  return (
    <Section title={t('Token economics')} description={t('How tokens turn into cost, and how well prompts are read from the cache.')}>
      {hasTokens ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <TokenMix />
            <CacheTrend />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <CacheHistogram />
            <LowCacheUsers />
          </div>
        </div>
      ) : (
        <Callout tone="info" title={store.hasTokens ? t('No tokens in the selected rows') : t('This report has no token columns')}>
          {store.hasTokens
            ? t('The rows in this selection have no token counts, so the token mix, cost split and cache hit rate cannot be shown. Widen the filters to bring them back.')
            : t(
                'The token mix, the estimated cost split and the cache hit rate need the token columns of the detailed usage export. Download the report with token details to see this section.',
              )}
        </Callout>
      )}
    </Section>
  );
}
