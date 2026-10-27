import { useMemo } from 'react';
import { Callout, Kpi, KpiGrid, type Tone } from '../../components/ui';
import { msg, t, T } from '../../i18n';
import { CREDIT_USD } from '../../lib/types';
import { DAYS_PER_MONTH, WEEKDAY_NAMES, dowOf, fmtDay, dateParts } from '../../lib/utils/date';
import { fmtDelta, fmtInt, fmtMultiple, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill, navigate } from '../../state/router';
import { billedProjectionKnown, budgetTone, busiestDay, capacityKnown, estimateMonthlyCost, fmtBudgetPct, poolColumnsText, poolGap } from './helpers';

const NOT_IN_FILE = msg('Not in this file');

// Tiles run from the number a manager acts on first (money billed on top of seats) to background figures.
function UsageKpis() {
  const { analysis } = useAnalysis();
  const { agg: aggregates, range, previous, anomalies, coverage } = analysis;
  const billing = coverage.billing;
  const totals = aggregates.totals;
  const prev = previous?.totals ?? null;
  const avgDay = range.length > 0 ? totals.gross / range.length : 0;
  const busiest = useMemo(() => busiestDay(aggregates.days.gross, range.start), [aggregates, range.start]);
  const unusual = busiest !== null && anomalies.some((anomaly) => anomaly.day === busiest.day);
  const spansYears = dateParts(range.start).y !== dateParts(range.end).y;
  const share = totals.gross > 0 ? totals.net / totals.gross : 0;

  let peakSub = t('No usage in this period');
  if (busiest) {
    const when = t('{weekday}, {date}', { weekday: WEEKDAY_NAMES[dowOf(busiest.day)], date: fmtDay(busiest.day, spansYears) });
    peakSub =
      range.length > 1 && avgDay > 0 ? t('{when} · {multiple} the daily average', { when, multiple: fmtMultiple(busiest.gross / avgDay) }) : when;
  }

  return (
    <KpiGrid>
      <Kpi
        label={t('Billed on top of seats')}
        value={billing ? fmtUSD(totals.net) : '–'}
        delta={billing && prev ? fmtDelta(totals.net, prev.net) : null}
        goodWhen="down"
        tone={!billing ? 'neutral' : totals.net > 0.005 ? 'warn' : 'good'}
        sub={!billing ? t(NOT_IN_FILE) : totals.net > 0.005 ? t('charged in addition to seat fees') : t('nothing billed in this period')}
        spark={billing ? aggregates.days.net : undefined}
        hint={t('Usage that went beyond the pooled included credits. This is the amount charged in addition to the seat fees.')}
        calc={['billed', 'previous-period']}
      />
      <Kpi
        label={t('Usage')}
        value={fmtUSD(totals.gross)}
        delta={prev ? fmtDelta(totals.gross, prev.gross) : null}
        sub={pluralize(totals.credits, 'AI credit')}
        spark={aggregates.days.gross}
        hint={t(
          'Value of all AI credits used in this period (1 credit = $0.01), including usage already paid for by included credits. Rows that went through Auto are shown after the Auto discount.',
        )}
        calc={['usage', 'previous-period']}
      />
      <Kpi
        label={t('Covered by included credits')}
        value={billing ? fmtUSD(totals.discount) : '–'}
        delta={billing && prev ? fmtDelta(totals.discount, prev.discount) : null}
        sub={!billing ? t(NOT_IN_FILE) : totals.gross > 0 ? t('{pct} of usage', { pct: fmtPct(totals.discount / totals.gross, 0) }) : undefined}
        spark={billing ? aggregates.days.discount : undefined}
        hint={t(
          'Usage paid for by the AI credits that come with each GitHub Copilot seat. They are pooled across the organization and reset on the 1st of the month (UTC).',
        )}
        calc={['covered', 'previous-period']}
      />
      <Kpi
        label={t('Billed share of usage')}
        value={billing && totals.gross > 0 ? fmtPct(share, 1) : '–'}
        tone={billing && share > 0.005 ? 'warn' : 'neutral'}
        sub={!billing ? t(NOT_IN_FILE) : totals.gross > 0 ? t('{pct} covered by included credits', { pct: fmtPct(1 - share, 0) }) : undefined}
        hint={t('Billed on top of seats divided by usage. The rest was covered by included credits.')}
        calc="billed-share"
      />
      <Kpi
        label={t('Average per day')}
        value={fmtUSD(avgDay)}
        sub={
          range.length >= 7
            ? t('about {amount} a month at this pace', { amount: fmtUSD(avgDay * DAYS_PER_MONTH, 0) })
            : t('over {days}', { days: pluralize(range.length, 'day') })
        }
        hint={t('Usage divided by all calendar days of the period, including days with no usage.')}
        calc="usage-per-day"
      />
      <Kpi
        label={t('Peak day')}
        value={busiest ? fmtUSD(busiest.gross) : '–'}
        tone={unusual ? 'warn' : 'neutral'}
        sub={peakSub}
        hint={
          range.length > 1
            ? t('The day with the highest usage in this period. Click to zoom into it.')
            : t('The day with the highest usage in this period.')
        }
        calc={['peak-day', 'usage-per-day']}
        onClick={busiest && range.length > 1 ? () => drill({ dateFrom: busiest.day, dateTo: busiest.day }, { merge: true }) : undefined}
      />
    </KpiGrid>
  );
}

function PoolNotice() {
  const { analysis } = useAnalysis();
  const { pool, coverage } = analysis;
  const latest = pool.latest;
  const settingsButton = (
    <button type="button" className="btn btn-sm" onClick={() => navigate('settings')}>
      {t('Open Settings')}
    </button>
  );
  const gap = poolGap(coverage.billing, pool.months);
  if (gap === 'billing') {
    return (
      <Callout tone="warn" title={t('Pool figures are not available')}>
        {poolColumnsText(coverage)}
      </Callout>
    );
  }
  if (gap === 'sizes') {
    return (
      <Callout tone="info" title={t('The file does not say how many credits the seats include')} action={settingsButton}>
        {t(
          'Without the monthly quota per user, the pool size is unknown. So the included credits used and the estimated cost per month are not shown. Add your roster or extra seats in Settings.',
        )}
      </Callout>
    );
  }
  return (
    <Callout tone="warn" title={t('The pool is bigger than this file shows')} action={settingsButton}>
      {latest
        ? `${t('Included credits covered {amount} in {month}, more than the seats in the file pay for.', { amount: fmtUSD(latest.discount), month: latest.label })} `
        : ''}
      {t(
        'Other seats, from files you have not loaded, share the same pool. To see the pool size, the included credits used and the estimated cost per month, add them as roster or extra seats in Settings, or load every file of the billing entity.',
      )}
    </Callout>
  );
}

function PoolKpis() {
  const { analysis, settings } = useAnalysis();
  const { pool, narrowed, coverage } = analysis;
  const latest = pool.latest;
  const cost = useMemo(() => estimateMonthlyCost(pool), [pool]);

  if (narrowed || !latest) return null;

  const poolKnown = !pool.capacityExceeded && capacityKnown(latest);
  const projection = latest.projection;
  const billedKnown = billedProjectionKnown(latest, narrowed);
  const star = pool.capacityIsLowerBound ? '*' : '';
  const budget = coverage.billing && (settings.budgetMonthlyBilled ?? 0) > 0 ? pool.budget : null;
  const tone: Tone = budget ? budgetTone(budget.burn, billedKnown ? budget.projectedBurn : null) : 'neutral';
  const budgetKpi = budget ? (
    <Kpi
      label={t('Budget used')}
      value={fmtBudgetPct(budget.burn)}
      tone={tone}
      sub={t('{billed} of {budget} in {month}', { billed: fmtUSD(budget.billedToDate, 2), budget: fmtUSD(budget.monthlyBudget, 0), month: budget.month })}
      hint={t('Billed on top of seats this month divided by the monthly budget for billed overage you set in Settings.')}
      calc="budget-used"
    />
  ) : null;

  // The budget only needs the billed amounts, so it stays visible when the pool cannot be sized.
  if (!poolKnown) {
    return (
      <div className="space-y-3">
        <PoolNotice />
        {budgetKpi ? <div className="max-w-xs">{budgetKpi}</div> : null}
      </div>
    );
  }

  // Impact order: money still to be billed this month, the budget, the monthly cost, then how well the pool is used.
  return (
    <div className="space-y-1.5">
      <KpiGrid>
        {projection ? (
          <Kpi
            label={t('Projected {month} billed', { month: latest.label })}
            value={billedKnown ? fmtUSD(projection.projNet, 0) : '–'}
            tone={billedKnown && projection.projNet > 0.005 ? 'warn' : 'good'}
            sub={billedKnown ? t('{low} to {high}', { low: fmtUSD(projection.projNetLow, 0), high: fmtUSD(projection.projNetHigh, 0) }) : t('needs the pool size')}
            hint={t('Usage beyond the pool at the projected month end, on top of seat fees.')}
            calc="projection"
          />
        ) : null}
        {budgetKpi}
        <Kpi
          label={t('Estimated cost per month')}
          value={cost.known ? fmtUSD(cost.perMonth, 0) : '–'}
          sub={
            cost.known
              ? t('{seats} seats + {overage} overage', { seats: fmtUSD(cost.seats, 0), overage: fmtUSD(cost.overage, 0) })
              : t('a pool size is missing for some month')
          }
          hint={t(
            'Seats plus overage per month: the larger of the pool size and the usage, averaged over the months in this period. A seat costs as much as the credits it includes ($19 for 1,900 credits, $39 for 3,900). A month in progress counts what was used so far.',
          )}
          calc="monthly-cost-average"
        />
        <Kpi
          label={t('Included credits used')}
          value={fmtPct(pool.utilization, 0)}
          tone={pool.monthsExhausted > 0 ? 'warn' : pool.utilization < 0.4 ? 'info' : 'good'}
          sub={
            pool.months.length > 1
              ? t('{month}: {pct}', { month: latest.label, pct: fmtPct(latest.utilization, 0) })
              : t('{covered} of {capacity}', { covered: fmtUSD(pool.covered, 0), capacity: fmtUSD(pool.capacity, 0) })
          }
          hint={t(
            'Share of the pooled included credits that usage used up in this period, all months together. A low value means paid-for credits go unused. At 100%, billing on top of seats starts.',
          )}
          calc="pool-utilization"
        />
        <Kpi
          label={t('Months the pool ran out')}
          value={t('{count} of {total}', { count: fmtInt(pool.monthsExhausted), total: fmtInt(pool.months.length) })}
          tone={pool.monthsExhausted > 0 ? 'warn' : 'good'}
          sub={pool.monthsExhausted > 0 ? t('usage beyond the pool was billed') : t('the pool always lasted')}
          hint={t('Months in which usage went beyond the pool, so billing on top of seats started.')}
          calc="pool-months-exhausted"
        />
        {projection ? (
          <Kpi
            label={t('Projected {month} usage', { month: latest.label })}
            value={fmtUSD(projection.projGross, 0)}
            sub={t('{low} to {high}', { low: fmtUSD(projection.projGrossLow, 0), high: fmtUSD(projection.projGrossHigh, 0) })}
            hint={t(
              'Usage so far plus the remaining days at the average daily rate of the month and at the rate of the last 7 days. The range runs between the two rates.',
            )}
            calc="projection"
          />
        ) : null}
        <Kpi
          label={t('Pool size in {month}', { month: latest.label })}
          value={`${fmtUSD(latest.capacity, 0)}${star}`}
          sub={pluralize(latest.capacity / CREDIT_USD, 'AI credit')}
          hint={t(
            'The monthly credits of all seats, valued at $0.01 each (1,900 credits for a Business seat, 3,900 for an Enterprise seat). Credits are pooled and cannot be assigned to one user.',
          )}
          calc="pool-size"
        />
      </KpiGrid>
      {pool.capacityIsLowerBound ? (
        <p className="text-[11px] text-fg-subtle">
          <T
            text="* Counts only the seats that appear in the report. {link} for the real pool size."
            values={{
              link: (
                <button type="button" className="text-accent hover:underline" onClick={() => navigate('settings')}>
                  {t('Add your roster in Settings')}
                </button>
              ),
            }}
          />
        </p>
      ) : null}
    </div>
  );
}

export function SpendKpis() {
  return (
    <div className="space-y-3">
      <UsageKpis />
      <PoolKpis />
    </div>
  );
}
