import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../components/ui';
import { EChart, useChartColors, type ChartClick } from '../../components/charts/EChart';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { fmtUSD, pluralize } from '../../lib/utils/format';
import { YEAR_HEIGHT, cellDay, makeScale, planCalendar, tileHeight, tileOption, type Scale } from './calendar';

function Legend({ scale, unusual }: { scale: Scale; unusual: boolean }) {
  const colors = useChartColors();
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label={t('Color key')}>
      {scale.labels.map((label, i) => (
        <li key={i} className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-border-muted" style={{ background: scale.fills[i] }} />
          <span className="num">{label}</span>
        </li>
      ))}
      {unusual ? (
        <li className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border-2" style={{ borderColor: colors.bad }} />
          {t('Unusual day')}
        </li>
      ) : null}
    </ul>
  );
}

export default function CalendarCard() {
  const { analysis } = useAnalysis();
  const { agg, range, anomalies } = analysis;
  const colors = useChartColors();

  const plan = useMemo(() => planCalendar(range, agg.days), [range, agg]);
  const scale = useMemo(() => makeScale(colors, agg.days, range, plan.from, plan.to), [colors, agg, range, plan]);
  const options = useMemo(() => {
    const byDay = new Map(anomalies.map((a) => [a.day, a]));
    return plan.tiles.map((tile) => tileOption({ colors, scale, tile, mode: plan.mode, range, days: agg.days, anomalies: byDay }));
  }, [colors, scale, plan, range, agg, anomalies]);

  const onClick = (p: ChartClick) => {
    if (p.componentType !== 'series') return;
    const day = cellDay(p.value);
    if (day !== null) drill({ dateFrom: day, dateTo: day }, { merge: true });
  };

  const unusual = anomalies.some((a) => a.day >= plan.from && a.day <= plan.to);
  const weeks = plan.tiles.reduce((m, tile) => Math.max(m, tile.weeks), 1);
  const hasUsage = agg.totals.gross > 0;

  return (
    <Card
      title={t('Usage calendar')}
      subtitle={t('Usage on each day of the range. Darker days have more usage. Click a day to show only that day.')}
      calc={['usage-calendar', 'active-users-per-day']}
      footer={
        hasUsage ? (
          <div className="space-y-1.5">
            <Legend scale={scale} unusual={unusual} />
            {plan.note ? <p>{plan.note}</p> : null}
          </div>
        ) : undefined
      }
    >
      {!hasUsage ? (
        <EmptyState icon={<BarChart3 size={22} />} title={t('No usage in this range')} />
      ) : plan.mode === 'year' ? (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 760 }}>
            <EChart
              option={options[0]}
              height={YEAR_HEIGHT}
              onClick={onClick}
              exportName="github-copilot-usage-calendar"
              label={t('Calendar of daily usage for the months shown')}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-x-4 gap-y-3">
          {plan.tiles.map((tile, i) => (
            <div key={tile.key} className="max-w-md">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {tile.label}
                  {tile.partial ? <Badge title={t('Only part of this month is inside the date range')}>{t('Partial')}</Badge> : null}
                </div>
                <div className="num text-xs text-fg-muted" title={t('Usage in {month}, within the date range', { month: tile.label })}>
                  {fmtUSD(tile.usage, 0)} · {pluralize(tile.usageDays, 'day')}
                </div>
              </div>
              <EChart
                option={options[i]}
                height={tileHeight(weeks)}
                onClick={onClick}
                exportName={`github-copilot-usage-calendar-${tile.key}`}
                label={t('Calendar of daily usage for {month}', { month: tile.label })}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
