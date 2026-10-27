import { useMemo } from 'react';
import { CalcInfo, Callout, Card, Section } from '../../components/ui';
import { EChart, useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { esc, usd } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { t } from '../../i18n';
import { fmtCompact, fmtPct } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { PriceSource } from '../models/parts';
import { CacheHistogram, CacheTrend, LowCacheUsers } from './CacheCards';
import { costSplitTokens, money, tokenRows, type TokenKind, type TokenRow } from './metrics';

/** Four hues far apart (cobalt, moss, ochre, petrol), so cache read and output never look alike. */
const kindColors = (c: ChartColors): Record<TokenKind, string> => ({ input: c.palette[2], cacheRead: c.palette[3], cacheWrite: c.palette[4], output: c.accent });

function mixOption(c: ChartColors, rows: TokenRow[], withCost: boolean): EChartsOption {
  const colors = kindColors(c);
  return {
    grid: { left: 8, right: 16, top: 30, bottom: 4, containLabel: true },
    legend: { top: 0, data: rows.map((r) => r.label) },
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const r = rows[(p as { seriesIndex: number }).seriesIndex];
        if (!r) return '';
        const tokens = esc(t('Tokens: {tokens} ({share})', { tokens: fmtCompact(r.tokens), share: fmtPct(r.tokenShare, 1) }));
        const cost = withCost ? `<br/>${esc(t('Estimated cost: {cost} ({share})', { cost: usd(r.cost), share: fmtPct(r.costShare, 1) }))}` : '';
        return `<b>${esc(r.label)}</b><br/>${tokens}${cost}`;
      },
    },
    xAxis: { type: 'value', show: false, min: 0, max: 1 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: withCost ? [t('Tokens'), t('Estimated cost')] : [t('Tokens')],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.text, fontSize: 12 },
    },
    series: rows.map((r) => ({
      name: r.label,
      type: 'bar' as const,
      stack: 'mix',
      barWidth: 30,
      color: colors[r.key],
      itemStyle: { borderColor: c.surface, borderWidth: 1 },
      emphasis: { focus: 'series' as const },
      label: { show: true, color: c.surface, fontSize: 12, fontWeight: 600, formatter: (p: { value?: unknown }) => (Number(p.value) >= 0.08 ? fmtPct(Number(p.value), 0) : '') },
      data: withCost ? [r.tokenShare, r.costShare] : [r.tokenShare],
    })),
  };
}

function mixInsight(rows: TokenRow[]): string {
  const by = (k: TokenKind): TokenRow => rows.find((r) => r.key === k) ?? rows[0];
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
  const { agg } = analysis;
  const totals = agg.totals;
  const rows = useMemo(() => tokenRows(totals, costSplitTokens(agg)), [agg, totals]);
  const sum = (f: (r: TokenRow) => number): number => rows.reduce((a, r) => a + f(r), 0);
  const tokenTotal = sum((r) => r.tokens);
  const costTotal = sum((r) => r.cost);
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
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="py-1.5 pe-2 text-start font-normal">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-xs" style={{ background: palette[r.key] }} />
                    {r.label}
                  </span>
                </th>
                <td className="num px-2 py-1.5">{fmtCompact(r.tokens)}</td>
                <td className="num px-2 py-1.5 text-fg-muted">{fmtPct(r.tokenShare, 1)}</td>
                <td className="num px-2 py-1.5">{withCost ? money(r.cost) : '–'}</td>
                <td className="num px-2 py-1.5 text-fg-muted">{withCost ? fmtPct(r.costShare, 1) : '–'}</td>
                <td className="num py-1.5 ps-2">{withCost && Number.isFinite(r.perMillion) ? money(r.perMillion) : '–'}</td>
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
