import { type ReactNode } from 'react';
import { CalcInfo, Callout, Card, DocLinks, ProgressBar, cx, type CalcRef } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { BudgetStatus, MonthPool } from '../../lib/analytics/pool';
import { fmtDay } from '../../lib/utils/date';
import { fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { clearNarrowing } from '../shared';
import { billedProjectionKnown, budgetTone, fmtBudgetPct } from './helpers';

const TITLE = msg('Budget for billed overage');
const TEXT = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' } as const;

function Stat({ label, value, sub, tone, calc }: { label: string; value: string; sub?: string; tone?: keyof typeof TEXT; calc?: CalcRef }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-muted">
        {label}
        {calc ? <CalcInfo id={calc} className="ms-1" /> : null}
      </dt>
      <dd className={cx('num mt-0.5 text-lg font-semibold leading-tight', tone && TEXT[tone])}>{value}</dd>
      {sub ? <dd className="mt-0.5 text-xs text-fg-subtle">{sub}</dd> : null}
    </div>
  );
}

function BudgetNote() {
  return (
    <p className="text-xs text-fg-subtle">
      {t(
        'This budget is only used for the comparison in this app. In GitHub, budgets for an organization, cost center or enterprise limit charges after the pool is used up, and a budget on one user also limits how much of the pool that person can draw.',
      )}
    </p>
  );
}

function verdict(b: BudgetStatus, m: MonthPool, projected: number | null, projectedBurn: number | null): string {
  const budget = fmtUSD(b.monthlyBudget, 0);
  const month = b.month;
  if (b.burn >= 1) {
    const billed = fmtUSD(b.billedToDate, 2);
    return m.complete
      ? t('The {budget} budget for {month} was used up. {billed} was billed on top of seats.', { budget, month, billed })
      : t('The {budget} budget for {month} is used up. {billed} has been billed on top of seats.', { budget, month, billed });
  }
  if (m.complete) {
    return t('{month} is complete. {billed} was billed on top of seats, {share} of the {budget} budget.', {
      month,
      billed: fmtUSD(b.billedToDate, 2),
      share: fmtBudgetPct(b.burn),
      budget,
    });
  }
  if (b.hitDate !== null) return t('At the current pace, the budget is used up on {date}.', { date: fmtDay(b.hitDate, true) });
  if (projected !== null && projectedBurn !== null) {
    return projectedBurn >= 1
      ? t('Billed usage is projected to reach about {amount} by the end of {month}, above the budget.', { amount: fmtUSD(projected, 0), month })
      : t('Billed usage is projected to end {month} at about {amount}, {share} of the budget, so it should hold.', {
          month,
          amount: fmtUSD(projected, 0),
          share: fmtBudgetPct(projectedBurn),
        });
  }
  return t('{billed} has been billed so far, {share} of the budget. A projection needs the pool size.', { billed: fmtUSD(b.billedToDate, 2), share: fmtBudgetPct(b.burn) });
}

function BudgetProgress({ b, m }: { b: BudgetStatus; m: MonthPool }) {
  const { analysis } = useAnalysis();
  const { range } = analysis;
  const known = billedProjectionKnown(m, false);
  const projected = known ? b.projectedBilled : null;
  const projectedBurn = known ? b.projectedBurn : null;
  const tone = budgetTone(b.burn, projectedBurn);
  const rangeCutsMonth = range.start > m.monthStart || (m.complete && range.end < m.monthEnd);
  const over = b.billedToDate > b.monthlyBudget;
  const month = b.month;

  return (
    <div className="space-y-4">
      <ProgressBar
        value={b.burn}
        ghost={projectedBurn ?? undefined}
        tone={tone}
        height={10}
        label={t('Billed on top of seats in {month} compared with the monthly budget', { month })}
      />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Stat
          label={m.complete ? t('Billed in {month}', { month }) : t('Billed so far')}
          calc="billed"
          value={fmtUSD(b.billedToDate, 2)}
          sub={m.complete ? t('On top of seats') : t('{month}, through {date}', { month, date: fmtDay(m.lastDay) })}
        />
        <Stat
          label={t('Budget used')}
          calc="budget-used"
          value={fmtBudgetPct(b.burn)}
          tone={b.burn >= 0.8 ? tone : undefined}
          sub={t('Of {amount} a month', { amount: fmtUSD(b.monthlyBudget, 0) })}
        />
        {m.complete ? (
          <Stat
            label={over ? t('Over budget by') : t('Budget left')}
            calc="budget-used"
            value={fmtUSD(Math.abs(b.monthlyBudget - b.billedToDate), 2)}
            tone={over ? 'bad' : undefined}
          />
        ) : (
          <>
            <Stat
              label={t('Projected at month end')}
              calc="projection"
              value={projected !== null ? fmtUSD(projected, 0) : '–'}
              tone={projectedBurn !== null && projectedBurn >= 1 ? 'bad' : undefined}
              sub={projectedBurn !== null ? t('{share} of the budget', { share: fmtBudgetPct(projectedBurn) }) : t('Needs the pool size')}
            />
            <Stat
              label={t('Budget used up on')}
              calc="budget-hit-date"
              value={b.burn >= 1 ? t('Reached') : b.hitDate !== null ? fmtDay(b.hitDate, true) : '–'}
              tone={b.burn >= 1 || b.hitDate !== null ? 'bad' : undefined}
              sub={b.burn >= 1 ? undefined : b.hitDate !== null ? t('At the current pace') : projected !== null ? t('Not expected this month') : t('Not known')}
            />
          </>
        )}
      </dl>
      <p className="text-sm text-fg">{verdict(b, m, projected, projectedBurn)}</p>
      {projectedBurn !== null && projectedBurn > b.burn ? <p className="text-xs text-fg-subtle">{t('The lighter part of the bar is the amount projected for the rest of the month.')}</p> : null}
      {rangeCutsMonth ? (
        <p className="text-xs text-fg-subtle">{t('The selected date range covers only part of {month}, so the billed amount is lower than the whole month.', { month })}</p>
      ) : null}
      <BudgetNote />
    </div>
  );
}

function SettingsButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-sm" onClick={() => navigate('settings')}>
      {label}
    </button>
  );
}

export function BudgetCard() {
  const { analysis, settings } = useAnalysis();
  const { pool, narrowed, coverage } = analysis;
  const monthly = settings.budgetMonthlyBilled ?? 0;
  const budget = pool.budget;
  const latest = pool.latest;
  const amount = fmtUSD(monthly, 0);

  let body: ReactNode;
  if (monthly <= 0) {
    body = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-fg-muted">
            {t(
              'No monthly budget is set. Enter the most you want to pay on top of seats in a month, in Settings, to see how much of it is used, the projected amount at month end and the day it would run out.',
            )}
          </p>
          <SettingsButton label={t('Set a monthly budget')} />
        </div>
        <BudgetNote />
      </div>
    );
  } else if (!coverage.billing) {
    body = (
      <Callout tone="info" title={t('The file does not say what was billed')}>
        {t(
          'A budget of {amount} a month is set, but it is compared with the billed amount, and the file has no discount_amount or net_amount column. Load the complete usage report to see how much of the budget is used.',
          { amount },
        )}
      </Callout>
    );
  } else if (narrowed) {
    body = (
      <Callout
        tone="info"
        title={t('A budget applies to the whole bill')}
        action={
          <button type="button" className="btn btn-sm" onClick={clearNarrowing}>
            {t('Clear filters')}
          </button>
        }
      >
        {t(
          'The billed amounts on this page cover only the filtered rows, so they cannot be compared with the {amount} monthly budget. Remove the row and segment filters (the date range can stay) to see it.',
          { amount },
        )}
      </Callout>
    );
  } else if (!budget || !latest) {
    body = <p className="text-sm text-fg-muted">{t('A budget of {amount} a month is set, but the selected period has no usage to compare with it.', { amount })}</p>;
  } else {
    body = <BudgetProgress b={budget} m={latest} />;
  }

  return (
    <Card
      title={t(TITLE)}
      calc={['budget-used', 'budget-hit-date']}
      subtitle={monthly > 0 ? t('{amount} a month on top of seats', { amount }) : t('Keep charges on top of seats under control')}
      actions={monthly > 0 && !narrowed ? <SettingsButton label={t('Change budget')} /> : undefined}
      footer={<DocLinks topic="budgets" title={t('Learn more')} limit={3} compact />}
    >
      {body}
    </Card>
  );
}
