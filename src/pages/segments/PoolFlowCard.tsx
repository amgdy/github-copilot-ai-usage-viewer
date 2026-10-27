import { Card, DocLinks, ProgressBar } from '../../components/ui';
import { t } from '../../i18n';
import type { Analysis } from '../../lib/analytics/analyze';
import { fmtInt, fmtUSD, pluralize } from '../../lib/utils/format';

function FlowBar({ label, users, amount, value, tone }: { label: string; users: number; amount: number; value: number; tone: 'warn' | 'good' }) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="font-medium">
          {label} <span className="font-normal text-fg-muted">({pluralize(users, 'user')})</span>
        </span>
        <span className="num font-semibold">{fmtUSD(amount, 0)}</span>
      </div>
      <ProgressBar value={value} tone={tone} height={10} label={t('{label}: {amount}', { label, amount: fmtUSD(amount, 0) })} />
    </div>
  );
}

function sentence(takers: number, takenUsd: number, lenders: number, lentUsd: number): string {
  const took = { users: pluralize(takers, 'user'), amount: fmtUSD(takenUsd, 0) };
  const left = { users: pluralize(lenders, 'user'), amount: fmtUSD(lentUsd, 0) };
  if (takers > 0 && lenders > 0) {
    return t('{takers} used {taken} more than their own included credits. {lenders} used less than their own included credits and left {left} in the shared pool.', {
      takers: took.users,
      taken: took.amount,
      lenders: left.users,
      left: left.amount,
    });
  }
  if (takers > 0) return t('{users} used {amount} more than their own included credits. No user left credits unused.', took);
  if (lenders > 0) return t('No user used more than their own included credits. {users} used less than their own included credits and left {amount} in the shared pool.', left);
  return t('Every user used about their own included credits, so nobody drew on the pool or added to it.');
}

function netSentence(takenUsd: number, lentUsd: number): string | null {
  if (takenUsd <= 0 || lentUsd <= 0) return null;
  const gap = lentUsd - takenUsd;
  if (gap >= 0) return t('The credits that lighter users left cover what heavier users drew, with {amount} to spare.', { amount: fmtUSD(gap, 0) });
  return t('Heavier users drew {amount} more than lighter users left. Credits of seats without usage are not counted here.', { amount: fmtUSD(-gap, 0) });
}

/** Shown only when no filter is on, because included credits are shared across all seats. */
export function PoolFlowCard({ analysis }: { analysis: Analysis }) {
  const { population, pool, agg: aggregates, coverage } = analysis;
  const poolFlow = population.poolFlow;
  if (analysis.narrowed || population.totals.allotment <= 0 || population.totals.users === 0) return null;

  const top = Math.max(poolFlow.takenUsd, poolFlow.lentUsd);
  const net = netSentence(poolFlow.takenUsd, poolFlow.lentUsd);

  return (
    <Card
      title={t('Who draws on the shared pool')}
      subtitle={t('Included credits are pooled across all seats. Each user is compared with their own included credits.')}
      calc="segment-pool-flow"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="num text-sm">{sentence(poolFlow.takers, poolFlow.takenUsd, poolFlow.lenders, poolFlow.lentUsd)}</p>
          <div className="space-y-3">
            <FlowBar label={t('Drew on the pool')} users={poolFlow.takers} amount={poolFlow.takenUsd} value={top > 0 ? poolFlow.takenUsd / top : 0} tone="warn" />
            <FlowBar label={t('Left in the pool')} users={poolFlow.lenders} amount={poolFlow.lentUsd} value={top > 0 ? poolFlow.lentUsd / top : 0} tone="good" />
          </div>
          {net ? <p className="num text-sm text-fg-muted">{net}</p> : null}
          {coverage.billing ? (
            <p className="num text-sm">{t('Billed on top of seats in this report: {amount}.', { amount: fmtUSD(aggregates.totals.net, 0) })}</p>
          ) : (
            <p className="num text-sm text-fg-muted">{t('This file has no billing split, so what was billed on top of seats is not known.')}</p>
          )}
        </div>
        <div className="space-y-3 rounded-lg bg-surface-2 p-3 text-sm">
          <h4 className="font-medium">{t('Why pooling matters')}</h4>
          <p className="text-fg-muted">
            {t(
              'Pooling makes heavy users cheap in total: the credits that lighter users leave unused pay for them. Once the pool is empty, further usage is billed on top of the seats, so the same heavy use turns into overage.',
            )}
          </p>
          {pool.months.length > 1 ? (
            <p className="text-xs text-fg-muted">
              {t('The pool resets every month and unused credits do not carry over. These figures add up all {months} months, so they can hide a month in which the pool ran short.', {
                months: fmtInt(pool.months.length),
              })}
            </p>
          ) : null}
          {pool.capacityExceeded ? (
            <p className="text-xs text-fg-muted">
              {t(
                'Usage in the report is higher than the included credits of the seats it lists, so the real pool is larger than the report shows. Add the seat roster in Settings for exact figures.',
              )}
            </p>
          ) : pool.capacityIsLowerBound ? (
            <p className="text-xs text-fg-muted">{t('Based on the seats that appear in the report.')}</p>
          ) : null}
          <DocLinks ids={['usageBilling', 'budgets', 'seatAssignment']} title={t('Learn more')} compact />
        </div>
      </div>
    </Card>
  );
}
