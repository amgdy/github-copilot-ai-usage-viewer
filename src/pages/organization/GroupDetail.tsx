import { useEffect, useMemo, useRef } from 'react';
import { ListFilter, X } from 'lucide-react';
import { useChartColors } from '../../components/charts/EChart';
import { donutOption, stackedTimeOption, usd, type DonutItem, type TimeSeriesInput } from '../../components/charts/helpers';
import { CalcInfo, CalcLine, ChartCard, type CalcRef } from '../../components/ui';
import { makeBucketer } from '../../lib/analytics/series';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { CATEGORIES, labelOf } from '../../lib/types';
import { fmtInt, fmtPct, fmtPctAuto, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { msg, t } from '../../i18n';
import { usePerMonth } from '../shared';
import { NO_TOKENS_NOTE, filterToGroup, fmtTokens } from './bits';
import type { DimSpec } from './dimensions';
import { cacheHitRate, computeDetail, perUserMonth, type BreakdownDim, type Group, type GroupColumn } from './groups';

const BREAKDOWN_TITLE: Record<BreakdownDim, string> = { product: msg('By product'), costCenter: msg('By cost center'), org: msg('By organization') };

const BREAKDOWN_LABEL: Record<BreakdownDim, string> = {
  product: msg('Donut chart of the usage of {name} by product'),
  costCenter: msg('Donut chart of the usage of {name} by cost center'),
  org: msg('Donut chart of the usage of {name} by organization'),
};

function Stat({ label, value, sub, calc }: { label: string; value: string; sub?: string; calc?: CalcRef }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-xs text-fg-muted">
        {label}
        {calc ? <CalcInfo id={calc} /> : null}
      </dt>
      <dd className="num text-sm font-semibold">{value}</dd>
      {sub ? <dd className="text-xs text-fg-muted">{sub}</dd> : null}
      {calc ? (
        <dd>
          <CalcLine id={calc} className="mt-0.5" />
        </dd>
      ) : null}
    </div>
  );
}

/** What one group is made of: usage by product (or cost center), by model tier and over time. */
export function GroupDetail({ spec, column, group, onClear }: { spec: DimSpec; column: GroupColumn; group: Group; onClear: () => void }) {
  const { analysis, store, models } = useAnalysis();
  const { mask, range, users, coverage } = analysis;
  const colors = useChartColors();
  const perMonth = usePerMonth();
  const root = useRef<HTMLElement>(null);

  // A product group is split by cost center (or organization) because splitting it by product is trivial.
  const byDim: BreakdownDim = spec.id === 'product' ? (users.hasCostCenters ? 'costCenter' : 'org') : 'product';

  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  }, [group.id]);

  const detail = useMemo(() => computeDetail(store, mask, range, models, column, group.id, byDim), [store, mask, range, models, column, group.id, byDim]);

  const byOption = useMemo(() => {
    const values = store.dicts[byDim].values;
    const items: DonutItem[] = detail.by.slice(0, 8).map((part) => ({ name: labelOf(byDim, values[part.id]), value: part.gross, color: part.id === 0 ? colors.muted : undefined }));
    const rest = detail.by.slice(8);
    if (rest.length > 0) items.push({ name: t('Other ({n} more)', { n: fmtInt(rest.length) }), value: rest.reduce((a, b) => a + b.gross, 0), color: colors.muted });
    return { items, option: donutOption(colors, { items, legend: 'bottom', center: { value: fmtUSD(detail.gross, 0), caption: t('usage') } }) };
  }, [store, byDim, detail, colors]);

  const tierOption = useMemo(() => {
    const items: DonutItem[] = CATEGORIES.map((name, index) => ({ name: t(name), value: detail.tiers[index], color: CATEGORY_COLORS[name] })).filter((slice) => slice.value > 0);
    return { items, option: donutOption(colors, { items, legend: 'bottom', center: { value: fmtUSD(detail.gross, 0), caption: t('usage') } }) };
  }, [detail, colors]);

  const weekly = range.length > 120;
  const timeOption = useMemo(() => {
    const bucketer = makeBucketer(range.start, range.end, weekly ? 'week' : 'day');
    const gross = new Float64Array(bucketer.count);
    const net = new Float64Array(bucketer.count);
    for (let dayIndex = 0; dayIndex < detail.daily.length; dayIndex++) {
      const bucketIndex = bucketer.indexOf(range.start + dayIndex);
      if (bucketIndex < 0 || bucketIndex >= bucketer.count) continue;
      gross[bucketIndex] += detail.daily[dayIndex];
      net[bucketIndex] += detail.dailyNet[dayIndex];
    }
    const series: TimeSeriesInput[] = [{ name: t('Usage'), data: gross, color: colors.accent }];
    if (detail.net > 0.005) series.push({ name: t('Billed'), data: net, color: colors.warn });
    const labels = Array.from({ length: bucketer.count }, (_, bucketIndex) => bucketer.label(bucketIndex));
    return stackedTimeOption(colors, { labels, series, kind: 'line', stack: false, legend: series.length > 1, format: usd });
  }, [range, weekly, detail, colors]);

  const perUser = perUserMonth(group, perMonth);
  const hit = cacheHitRate(group);
  const { billing, tokens } = coverage;

  return (
    <section ref={root} aria-label={t('Detail of {name}', { name: group.name })} className="scroll-mt-4 space-y-3">
      <div className="card border-s-4 border-s-accent p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-56">
            <div className="eyebrow">{t('Group detail · {dim}', { dim: t(spec.label) })}</div>
            <h3 className={group.blank ? 'truncate text-base font-semibold italic text-fg-muted' : 'truncate text-base font-semibold'} title={group.name}>
              {group.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-sm" onClick={() => filterToGroup(group)} title={t('Narrow the whole report to this group')}>
              <ListFilter size={13} /> {t('Filter the report to this group')}
            </button>
            <button type="button" className="btn btn-sm" onClick={onClear}>
              <X size={13} /> {t('Clear selection')}
            </button>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label={t('Usage')} value={fmtUSD(group.gross)} sub={t('{pct} of usage', { pct: fmtPct(group.share, 1) })} calc="usage" />
          <Stat
            label={t('Billed on top of seats')}
            value={billing ? fmtUSD(group.net) : '–'}
            sub={!billing ? t('Not in this file') : group.gross > 0 ? t('{pct} of its usage', { pct: fmtPctAuto(group.net / group.gross) }) : undefined}
            calc="billed"
          />
          <Stat label={t('Covered by included credits')} value={billing ? fmtUSD(group.discount) : '–'} sub={billing ? undefined : t('Not in this file')} calc="covered" />
          <Stat label={t('Users')} value={fmtInt(group.users)} calc="org-users" />
          <Stat label={t('Usage per user / month')} value={Number.isFinite(perUser) ? fmtUSD(perUser) : '–'} calc="org-per-user-month" />
        </dl>
        {tokens ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border-muted pt-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label={t('Input tokens')} value={fmtTokens(group.input)} calc="tokens-input" />
            <Stat label={t('Cache read tokens')} value={fmtTokens(group.cacheRead)} calc="tokens-cache-read" />
            <Stat label={t('Cache write tokens')} value={fmtTokens(group.cacheWrite)} calc="tokens-cache-write" />
            <Stat label={t('Output tokens')} value={fmtTokens(group.output)} calc="tokens-output" />
            <Stat
              label={t('Cache hit rate')}
              value={Number.isFinite(hit) ? fmtPct(hit, 1) : '–'}
              sub={Number.isFinite(hit) ? t('Of all prompt tokens') : t('No prompt tokens')}
              calc="cache-hit"
            />
          </dl>
        ) : (
          <p className="mt-3 border-t border-border-muted pt-2 text-xs text-fg-muted">{t(NO_TOKENS_NOTE)}</p>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title={t(BREAKDOWN_TITLE[byDim])}
          subtitle={t('Usage of this group')}
          calc="org-detail-breakdown"
          option={byOption.option}
          height={280}
          exportName={`github-copilot-organization-${spec.id}-detail-${byDim}`}
          label={t(BREAKDOWN_LABEL[byDim], { name: group.name })}
          empty={byOption.items.length === 0 ? t('No usage in this group.') : false}
        />
        <ChartCard
          title={t('By model tier')}
          subtitle={t('Usage of this group')}
          calc="tier-usage"
          option={tierOption.option}
          height={280}
          exportName={`github-copilot-organization-${spec.id}-detail-tier`}
          label={t('Donut chart of the usage of {name} by model tier', { name: group.name })}
          empty={tierOption.items.length === 0 ? t('No usage in this group.') : false}
        />
        <ChartCard
          title={weekly ? t('Weekly usage') : t('Daily usage')}
          subtitle={t('Usage of this group over the period')}
          calc="org-detail-over-time"
          option={timeOption}
          height={280}
          exportName={`github-copilot-organization-${spec.id}-detail-trend`}
          label={weekly ? t('Line chart of the weekly usage of {name}', { name: group.name }) : t('Line chart of the daily usage of {name}', { name: group.name })}
          empty={detail.rows === 0 ? t('No usage in this group.') : false}
        />
      </div>
    </section>
  );
}
