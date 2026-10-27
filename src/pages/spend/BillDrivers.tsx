import { useMemo, useState, type ReactNode } from 'react';
import { useChartColors } from '../../components/charts/EChart';
import { rankBarOption } from '../../components/charts/helpers';
import { ProductIcon, VendorIcon } from '../../components/icons';
import { Segmented } from '../../components/ui';
import { msg, T, t } from '../../i18n';
import type { Vendor } from '../../lib/pricing/card';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { ChartPanel } from './ChartPanel';
import { DRIVER_LABELS, driverRows, filterPatch, withOther, type Driver, type DriverMetric, type DriverRow } from './drivers';

const METRICS: { value: DriverMetric; label: string }[] = [
  { value: 'gross', label: msg('Usage') },
  { value: 'net', label: msg('Billed') },
];

const SUBTITLES: Record<Driver, string> = {
  product: msg('Click a bar to keep only that product.'),
  sku: msg('Click a bar to keep only that SKU.'),
  tier: msg('Click a bar to keep only that model tier.'),
  vendor: msg('Click a bar to keep only that vendor.'),
};

/** The name of a row, with the product or vendor logo in front when there is one. */
function rowName(driver: Driver, row: DriverRow): ReactNode {
  const icon =
    row.filter === null ? null : driver === 'product' ? (
      <ProductIcon product={row.filter} size={13} className="shrink-0" />
    ) : driver === 'vendor' ? (
      <VendorIcon vendor={row.filter as Vendor} size={13} className="shrink-0" />
    ) : null;
  return (
    <span className="inline-flex items-center gap-1 font-medium text-fg">
      {icon}
      <bdi>{row.name}</bdi>
    </span>
  );
}

export function BillDrivers() {
  const { analysis, store, models } = useAnalysis();
  const colors = useChartColors();
  const { agg: aggregates, coverage } = analysis;
  const billing = coverage.billing;
  const [driver, setDriver] = useState<Driver>('product');
  const [metricPick, setMetricPick] = useState<DriverMetric>('gross');
  const metric: DriverMetric = billing ? metricPick : 'gross';

  const items = useMemo(() => withOther(driverRows(driver, metric, aggregates, store, models), 10), [driver, metric, aggregates, store, models]);
  const total = metric === 'gross' ? aggregates.totals.gross : aggregates.totals.net;
  const key = metric === 'gross' ? 'gross' : 'billed';

  const option = useMemo(
    () =>
      rankBarOption(colors, {
        labelWidth: 150,
        color: metric === 'net' ? colors.warn : colors.accent,
        items: items.map((driverRow) => {
          const noteValues = { usage: fmtUSD(driverRow.gross), covered: fmtUSD(driverRow.covered), billed: fmtUSD(driverRow.billed), share: fmtPct(total > 0 ? driverRow[key] / total : 0, 0) };
          return {
            name: driverRow.name,
            value: driverRow[key],
            color: driverRow.filter === null ? colors.muted : driverRow.color,
            note: !billing
              ? t('Usage {usage} · {share} of usage', noteValues)
              : metric === 'gross'
                ? t('Usage {usage} · Covered {covered} · Billed {billed} · {share} of usage', noteValues)
                : t('Usage {usage} · Covered {covered} · Billed {billed} · {share} of the billed amount', noteValues),
          };
        }),
      }),
    [colors, items, key, metric, total, billing],
  );

  const first = items[0];
  const group = t(DRIVER_LABELS[driver]);

  return (
    <ChartPanel
      title={t('Biggest cost drivers')}
      calc="cost-drivers"
      subtitle={t(SUBTITLES[driver])}
      controls={
        <>
          <Segmented
            size="sm"
            label={t('Rank by')}
            value={driver}
            onChange={setDriver}
            options={(Object.keys(DRIVER_LABELS) as Driver[]).map((value) => ({ value, label: t(DRIVER_LABELS[value]) }))}
          />
          {billing ? (
            <Segmented size="sm" label={t('Measure')} value={metric} onChange={setMetricPick} options={METRICS.map((metricOption) => ({ value: metricOption.value, label: t(metricOption.label) }))} />
          ) : null}
        </>
      }
      option={option}
      height={Math.max(120, items.length * 26 + 16)}
      empty={items.length === 0 ? (metric === 'net' ? t('Nothing was billed on top of seats in this period') : t('No usage in this period')) : false}
      onClick={(event) => {
        const row = items[event.dataIndex];
        if (row && row.filter !== null) drill(filterPatch(driver, row.filter), { merge: true });
      }}
      exportName={`github-copilot-cost-drivers-${driver}-${metric}`}
      label={metric === 'gross' ? t('{group} ranked by usage', { group }) : t('{group} ranked by billed amount', { group })}
      below={
        first && total > 0 ? (
          <p className="text-xs text-fg-muted">
            {metric === 'gross' ? (
              <T text="{name} accounts for {share} of usage." values={{ name: rowName(driver, first), share: fmtPct(first[key] / total, 0) }} />
            ) : (
              <T text="{name} accounts for {share} of the amount billed on top of seats." values={{ name: rowName(driver, first), share: fmtPct(first[key] / total, 0) }} />
            )}
          </p>
        ) : undefined
      }
    />
  );
}
