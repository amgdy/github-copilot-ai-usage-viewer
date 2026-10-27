import { useMemo, useState } from 'react';
import { useChartColors } from '../../components/charts/EChart';
import { donutOption, rankBarOption, usd } from '../../components/charts/helpers';
import { ChartCard, Segmented } from '../../components/ui';
import { msg, t } from '../../i18n';
import { rollupByCategory, rollupByVendor } from '../../lib/analytics/aggregate';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { VENDORS } from '../../lib/pricing/card';
import { CATEGORIES } from '../../lib/types';
import { fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import type { ModelRow } from './data';
import { TierLegend, VendorName, fmtCount, fmtCredits, tierLabel, vendorColor, vendorLabel } from './parts';

type Metric = 'gross' | 'net' | 'requests' | 'credits';

const TOP = 12;

/** Texts are English keys; translate them with t() where they are shown. */
const METRICS: { value: Metric; label: string; title: string; subtitle: string; format: (value: number) => string }[] = [
  {
    value: 'gross',
    label: msg('Usage'),
    title: msg('Usage: the amount charged in the report, after the Auto discount'),
    subtitle: msg('Usage per model. Bars are colored by tier. Click a bar to filter by that model.'),
    format: (value) => usd(value),
  },
  {
    value: 'net',
    label: msg('Billed'),
    title: msg('Amount billed on top of seats, after included credits'),
    subtitle: msg('Amount billed on top of seats per model. Bars are colored by tier. Click a bar to filter by that model.'),
    format: (value) => usd(value),
  },
  {
    value: 'requests',
    label: msg('Requests'),
    title: msg('Number of usage lines. One line is not always one prompt.'),
    subtitle: msg('Usage lines per model. Bars are colored by tier. Click a bar to filter by that model.'),
    format: fmtCount,
  },
  {
    value: 'credits',
    label: msg('Credits'),
    title: msg('AI credits used. One credit is worth $0.01.'),
    subtitle: msg('AI credits per model. Bars are colored by tier. Click a bar to filter by that model.'),
    format: (value) => (Math.abs(value) >= 1000 ? fmtCount(value) : fmtCredits(value)),
  },
];

export function RankingCard({ rows }: { rows: ModelRow[] }) {
  const colors = useChartColors();
  const [metric, setMetric] = useState<Metric>('gross');
  const metricOption = METRICS.find((choice) => choice.value === metric) ?? METRICS[0];

  const { top, more, tiers } = useMemo(() => {
    const ranked = rows.filter((model) => model[metric] > 0).sort((a, b) => b[metric] - a[metric]);
    const top = ranked.slice(0, TOP);
    return { top, more: ranked.length - top.length, tiers: CATEGORIES.filter((tier) => top.some((model) => model.tier === tier)) };
  }, [rows, metric]);

  const option = useMemo(
    () =>
      rankBarOption(colors, {
        labelWidth: 150,
        format: metricOption.format,
        items: top.map((model) => ({
          name: model.label,
          value: model[metric],
          color: CATEGORY_COLORS[model.tier],
          note: t('{tier} tier · {vendor} · {pct} of usage', { tier: tierLabel(model.tier), vendor: vendorLabel(model.vendor), pct: fmtPct(model.share) }),
        })),
      }),
    [colors, top, metric, metricOption],
  );

  return (
    <ChartCard
      className="lg:col-span-2 xl:col-span-6"
      title={t('Model ranking')}
      exportName="github-copilot-model-ranking"
      calc="model-ranking"
      subtitle={t(metricOption.subtitle)}
      option={option}
      height={Math.max(200, top.length * 27 + 16)}
      empty={top.length === 0 ? (metric === 'net' ? t('Nothing is billed on top of seats in this scope') : t('No model usage in this scope')) : false}
      onClick={(event) => {
        const model = top[event.dataIndex];
        if (model) drill({ models: [model.value] }, { merge: true });
      }}
      actions={
        <Segmented
          size="sm"
          label={t('Rank models by')}
          value={metric}
          onChange={setMetric}
          options={METRICS.map(({ value, label, title }) => ({ value, label: t(label), title: t(title) }))}
        />
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <TierLegend tiers={tiers} />
          {more > 0 ? <span>{t('{models} in the table below', { models: pluralize(more, 'more model') })}</span> : null}
        </div>
      }
    />
  );
}

export function TierDonutCard() {
  const { analysis, models } = useAnalysis();
  const colors = useChartColors();
  const items = useMemo(() => {
    const gross = rollupByCategory(models, analysis.agg.model).gross;
    return CATEGORIES.map((tier, index) => ({ id: tier, name: tierLabel(tier), value: gross[index], color: CATEGORY_COLORS[tier] })).filter((slice) => slice.value > 0);
  }, [analysis, models]);
  const total = items.reduce((a, b) => a + b.value, 0);
  const option = useMemo(
    () => donutOption(colors, { items, legend: 'bottom', center: { value: fmtUSD(total, 0), caption: t('usage') } }),
    [colors, items, total],
  );
  return (
    <ChartCard
      className="xl:col-span-3"
      title={t('Usage by model tier')}
      exportName="github-copilot-usage-by-model-tier"
      calc="tier-usage"
      subtitle={t('Powerful models have the highest token prices. Click a tier to filter.')}
      option={option}
      height={270}
      empty={total === 0 ? t('No model usage in this scope') : false}
      onClick={(event) => {
        const item = items[event.dataIndex];
        if (item) drill({ categories: [item.id] }, { merge: true });
      }}
    />
  );
}

export function VendorDonutCard() {
  const { analysis, models } = useAnalysis();
  const colors = useChartColors();
  const items = useMemo(() => {
    const gross = rollupByVendor(models, analysis.agg.model).gross;
    return VENDORS.map((vendor, index) => ({ id: vendor, name: vendorLabel(vendor), value: gross[index], color: vendorColor(colors, index) })).filter((slice) => slice.value > 0);
  }, [analysis, models, colors]);
  const total = items.reduce((a, b) => a + b.value, 0);
  const option = useMemo(
    () => donutOption(colors, { items, legend: 'none', center: { value: fmtUSD(total, 0), caption: t('usage') } }),
    [colors, items, total],
  );
  return (
    <ChartCard
      className="xl:col-span-3"
      title={t('Usage by vendor')}
      exportName="github-copilot-usage-by-vendor"
      calc="model-vendor-usage"
      subtitle={t('Each vendor sets its own prices. Click a vendor to filter.')}
      option={option}
      height={240}
      empty={total === 0 ? t('No model usage in this scope') : false}
      onClick={(event) => {
        const item = items[event.dataIndex];
        if (item) drill({ vendors: [item.id] }, { merge: true });
      }}
      footer={
        total > 0 ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="inline-flex items-center gap-1.5 hover:text-fg"
                onClick={() => drill({ vendors: [item.id] }, { merge: true })}
              >
                <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} />
                <VendorName vendor={item.id} />
              </button>
            ))}
          </span>
        ) : null
      }
    />
  );
}

export function ModelCharts({ rows }: { rows: ModelRow[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
      <RankingCard rows={rows} />
      <TierDonutCard />
      <VendorDonutCard />
    </div>
  );
}
