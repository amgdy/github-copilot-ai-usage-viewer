import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useChartColors, type EChartsOption } from '../../components/charts/EChart';
import { escapeHtml } from '../../components/charts/helpers';
import type { ChartColors } from '../../components/charts/theme';
import { CalcInfo, CalcLegend, Card, ChartCard, DocLinks, Kpi, KpiGrid, Section } from '../../components/ui';
import { T, t } from '../../i18n';
import { fmtPct } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { NarrowedNotice, usePerMonth } from '../shared';
import { LEVER_DOC, habitCash, leverColor, money, waterfall, type WaterfallRow } from './metrics';

function waterfallOption(colors: ChartColors, rows: WaterfallRow[], total: number): EChartsOption {
  const combined = t('Combined effect');
  const names = [...rows.map((row) => row.label), combined];
  const base = [...rows.map((row) => row.base), 0];
  const bars = [
    ...rows.map((row) => ({ value: row.savings, itemStyle: { color: leverColor(colors, row.id) } })),
    { value: total, itemStyle: { color: colors.good }, label: { fontWeight: 600, color: colors.text } },
  ];
  return {
    grid: { left: 8, right: 72, top: 4, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const row = rows[(params as { dataIndex: number }).dataIndex];
        if (!row)
          return `<b>${escapeHtml(combined)}</b><br/>${escapeHtml(t('{amount} less usage per month', { amount: money(total) }))}<br/><span style="opacity:.75">${escapeHtml(t('All habit changes together, applied in the order shown.'))}</span>`;
        return `<b>${escapeHtml(row.label)}</b><br/>${escapeHtml(t('{amount} per month, after the steps above', { amount: money(row.savings) }))}<br/>${escapeHtml(t('On its own: {amount} per month', { amount: money(row.standalone) }))}<br/><span style="opacity:.75">${escapeHtml(row.description)}</span>`;
      },
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
      axisLabel: { width: 150, overflow: 'truncate', color: colors.text, fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      { type: 'bar', stack: 'waterfall', silent: true, tooltip: { show: false }, emphasis: { disabled: true }, itemStyle: { color: 'transparent' }, barMaxWidth: 18, data: base },
      {
        type: 'bar',
        stack: 'waterfall',
        barMaxWidth: 18,
        data: bars,
        label: { show: true, position: 'right', color: colors.textMuted, fontSize: 12, formatter: (params: { value?: unknown }) => money(Number(params.value)) },
      },
    ],
  };
}

export function HabitsWorth() {
  const { analysis } = useAnalysis();
  const colors = useChartColors();
  const perMonth = usePerMonth();
  const { plan, pool, narrowed } = analysis;

  const habitSavings = useMemo(() => waterfall(plan.levers.steps, perMonth), [plan, perMonth]);
  const cash = useMemo(() => (narrowed ? null : habitCash(pool, plan.fraction)), [narrowed, pool, plan.fraction]);
  const option = useMemo(() => waterfallOption(colors, habitSavings.rows, habitSavings.total), [colors, habitSavings]);

  const star = cash && pool.capacityIsLowerBound ? '*' : '';
  const missing = narrowed ? t('Needs the whole pool') : t('No billing month in this data');
  const grows = cash ? cash.wasteAfter - cash.wasteBefore : 0;
  const poolNotes = cash && (pool.capacityIsLowerBound || pool.capacityExceeded);

  return (
    <Section title={t('What changing habits is worth')} description={t('The default habit changes from the simulator, with their combined effect on usage and on cash.')}>
      <div className="space-y-3">
        <NarrowedNotice title={t('Cash savings need the whole pool')}>
          {t(
            'Included credits are shared by everyone and cannot be split by a filter, so the cash saving and the unused credits are hidden. The usage reduction below is still valid for the selected rows.',
          )}
        </NarrowedNotice>

        <KpiGrid cols="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label={t('Cash saving per month')}
            value={cash ? `${money(cash.perMonth)}${star}` : '–'}
            tone={cash && cash.perMonth >= 0.5 ? 'good' : 'neutral'}
            sub={
              cash
                ? plan.seatValue > 0
                  ? t('or {amount} with the seat changes too', { amount: `${money(plan.perMonth)}${star}` })
                  : t('From usage habits alone')
                : missing
            }
            hint={t(
              'The part of the usage reduction that would lower the bill. Included credits are pooled and cover usage up to the pool, so only usage above the pool turns into cash. Seat changes are not included.',
            )}
            calc="habits-cash-saving"
          />
          <Kpi
            label={t('Usage reduction')}
            value={fmtPct(plan.fraction, 1)}
            tone="accent"
            sub={t('≈ {amount} less usage per month', { amount: money(habitSavings.total) })}
            hint={t('How much less usage the default habit changes would produce. Overlapping habits are applied one after another, so nothing is counted twice.')}
            calc="habits-usage-reduction"
          />
          <Kpi
            label={t('Unused included credits today')}
            value={cash ? `${money(cash.wasteBefore)}${star}` : '–'}
            sub={cash ? t('per month, paid for but not used') : missing}
            hint={t('Included credits that the seats pay for but nobody used, on average per month. Unused credits are lost at the end of the month.')}
            calc="habits-unused-today"
          />
          <Kpi
            label={t('Unused after the change')}
            value={cash ? `${money(cash.wasteAfter)}${star}` : '–'}
            tone={cash && grows >= 0.5 ? 'warn' : 'neutral'}
            sub={cash ? (grows >= 0.5 ? t('{amount} more than today', { amount: money(grows) }) : t('About the same as today')) : missing}
            hint={t('Unused included credits per month after the habit changes. When usage drops but the number of seats stays the same, more of the pool goes unused.')}
            calc="habits-unused-after"
          />
        </KpiGrid>

        <div className="grid gap-4 xl:grid-cols-5">
          <ChartCard
            className="xl:col-span-3"
            title={t('Where the saving comes from')}
            subtitle={t(
              'Usage saved per month. The habits overlap, so they are applied in this order. Each bar is the extra saving after the ones above it, and the last bar is the combined effect.',
            )}
            calc="habits-waterfall"
            option={option}
            height={(habitSavings.rows.length + 1) * 36 + 16}
            exportName="github-copilot-habit-savings"
            label={t('Usage saved per month by each habit change, in order, and the combined effect')}
            empty={plan.levers.total <= 0 ? t('No habit change has a measurable effect on this data') : false}
            footer={
              plan.levers.total > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {habitSavings.rows.map((row) => (
                      <span key={row.id} className="inline-flex items-center gap-1.5">
                        <span className="size-2 shrink-0 rounded-sm" style={{ background: leverColor(colors, row.id) }} aria-hidden />
                        {row.label}
                        <CalcInfo id={LEVER_DOC[row.id]} />
                      </span>
                    ))}
                  </div>
                  <CalcLegend items={habitSavings.rows.map((row) => ({ label: row.label, calc: LEVER_DOC[row.id] }))} />
                  <DocLinks topic="habits" title={t('Learn more')} limit={3} compact />
                </div>
              ) : undefined
            }
          />
          <Card
            className="xl:col-span-2"
            title={t('Why cash can be smaller than the credit saving')}
            calc="habits-cash-vs-credit"
            footer={
              poolNotes ? (
                <div className="space-y-1">
                  {pool.capacityIsLowerBound ? <p>{t('* Counts only the seats that appear in the report.')}</p> : null}
                  {pool.capacityExceeded ? (
                    <p>
                      {t(
                        'Some months used more included credits than these seats provide, so the real pool is larger than the file shows. The smallest pool that fits the data is used.',
                      )}
                    </p>
                  ) : null}
                </div>
              ) : undefined
            }
          >
            <div className="space-y-2 text-sm text-fg-muted">
              <p>
                {t(
                  'Included credits are pooled across all seats. They reset every month, and credits that nobody uses are lost. Using less saves cash only in months when usage goes beyond the pool.',
                )}
              </p>
              {cash ? (
                <p className="text-fg">
                  <T
                    text="In this data, {usage} less usage per month turns into about {cash} less cash per month."
                    values={{ usage: <span className="num font-medium">{money(habitSavings.total)}</span>, cash: <span className="num font-medium">{money(cash.perMonth)}</span> }}
                  />
                </p>
              ) : null}
              <p>{t('To turn unused credits into cash, the number of seats has to come down as well. The simulator shows both effects together.')}</p>
            </div>
            <button type="button" className="btn btn-primary mt-4" onClick={() => navigate('recommendations')}>
              {t('Open the simulator')} <ArrowRight size={14} className="rtl:-scale-x-100" />
            </button>
          </Card>
        </div>
      </div>
    </Section>
  );
}
