import { useMemo } from 'react';
import { T, t } from '../../i18n';
import { userDailySeries } from '../../lib/analytics/series';
import type { UserProfile } from '../../lib/analytics/users';
import { WEEKDAY_NAMES, dowOf, fmtDay } from '../../lib/utils/date';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { EChart, useChartColors, type EChartsOption } from '../charts/EChart';
import { GRID, usd, usdCompact } from '../charts/helpers';
import { DrawerSection } from './DrawerSection';

interface AxisParam {
  dataIndex: number;
  value?: unknown;
}

const dayLabel = (day: number): string => t('{weekday}, {date}', { weekday: WEEKDAY_NAMES[dowOf(day)], date: fmtDay(day, true) });

export function DailyChart({ p: user }: { p: UserProfile }) {
  const { analysis, store } = useAnalysis();
  const colors = useChartColors();
  const { baseMask, range } = analysis;

  // The base mask keeps users that a segment filter hides on the page, so they still show here.
  const daily = useMemo(
    () => userDailySeries(store, baseMask, { start: range.start, end: range.end }, [user.id]).get(user.id) ?? new Float32Array(0),
    [store, baseMask, range.start, range.end, user.id],
  );

  const peak = useMemo(() => {
    let index = -1;
    let value = 0;
    let total = 0;
    for (let i = 0; i < daily.length; i++) {
      total += daily[i];
      if (daily[i] > value) {
        value = daily[i];
        index = i;
      }
    }
    return { index, value, total };
  }, [daily]);

  const option = useMemo<EChartsOption | null>(() => {
    if (peak.index < 0) return null;
    const labels = Array.from(daily, (_, dayIndex) => fmtDay(range.start + dayIndex));
    return {
      grid: { ...GRID, top: 12 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const param = (Array.isArray(params) ? params[0] : params) as AxisParam | undefined;
          if (!param) return '';
          return `<b>${dayLabel(range.start + param.dataIndex)}</b><br/>${usd(param.value)}`;
        },
      },
      xAxis: { type: 'category', data: labels, axisLabel: { hideOverlap: true, interval: labels.length > 30 ? 'auto' : 0 } },
      yAxis: { type: 'value', axisLabel: { formatter: (value: number) => usdCompact(value) } },
      series: [
        {
          type: 'bar',
          name: t('Usage'),
          barMaxWidth: 18,
          data: Array.from(daily, (usage, dayIndex) => ({ value: usage, itemStyle: { color: dayIndex === peak.index ? colors.warn : colors.accent } })),
        },
      ],
    };
  }, [daily, peak.index, range.start, colors.accent, colors.warn]);

  const peakDay = range.start + peak.index;
  const peakValue = <span className="num text-fg">{fmtUSD(peak.value)}</span>;
  return (
    <DrawerSection
      title={t('Daily usage of this user')}
      calc="user-daily-usage"
      aside={
        peak.index >= 0 ? (
          peak.total > 0 ? (
            <T
              text="Peak day {day}: {value} ({share} of usage)"
              values={{ day: fmtDay(peakDay), value: peakValue, share: fmtPct(peak.value / peak.total, 0) }}
            />
          ) : (
            <T text="Peak day {day}: {value}" values={{ day: fmtDay(peakDay), value: peakValue }} />
          )
        ) : undefined
      }
    >
      {option ? (
        <div className="rounded-lg border border-border bg-surface px-1 py-2">
          <EChart option={option} height={190} label={t('Daily usage of {name}', { name: user.name })} exportName="github-copilot-user-daily-usage" />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-fg-muted">
          {t('No usage on any day of this date range.')}
        </div>
      )}
    </DrawerSection>
  );
}
