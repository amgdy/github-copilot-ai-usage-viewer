import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { CalcInfo, DocLinks } from '../../components/ui';
import { t } from '../../i18n';
import type { MonthPool } from '../../lib/analytics/pool';
import { PLAN_CREDITS, PLAN_PRICE } from '../../lib/analytics/settings';
import { CREDIT_USD } from '../../lib/types';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { capacityKnown } from './helpers';

function Point({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="min-w-0">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-0.5 text-sm text-fg-muted">{children}</p>
    </li>
  );
}

/** A worked example from the latest complete month with a known pool, or the month in progress when there is none. */
function exampleMonth(months: MonthPool[], latest: MonthPool | null): MonthPool | null {
  const complete = [...months].reverse().find((m) => m.complete && capacityKnown(m));
  if (complete) return complete;
  return latest && capacityKnown(latest) ? latest : null;
}

function exampleLines(m: MonthPool, lowerBound: boolean): string[] {
  const vars = { month: m.label, capacity: fmtUSD(m.capacity, 0), usage: fmtUSD(m.gross, 0), covered: fmtUSD(m.discount, 0), billed: fmtUSD(m.net, 0) };
  let first: string;
  if (m.complete) {
    first = lowerBound
      ? t('In {month}, the seats in this report held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.', vars)
      : t('In {month}, the pool held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.', vars);
  } else {
    first = lowerBound
      ? t('In {month} so far, the seats in this report held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.', vars)
      : t('In {month} so far, the pool held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.', vars);
  }
  const lines = [first];
  const headroom = fmtUSD(m.headroom, 0);
  if (!m.complete) {
    lines.push(t('{amount} of the pool is still unused.', { amount: headroom }));
  } else if (m.net > 0.005) {
    lines.push(
      t(
        'Cutting usage by {dollar} would have saved {dollar} of cash, until usage was back down to the pool size. Removing a seat would not have saved money, because its credits leave the pool and the same amount is billed instead.',
        { dollar: fmtUSD(1, 0) },
      ),
    );
  } else {
    lines.push(
      t(
        '{amount} of included credits went unused. Cutting usage would not have saved cash. Removing seats could have saved at most {amount}, the unused part of the pool, if usage had stayed the same.',
        { amount: headroom },
      ),
    );
  }
  return lines;
}

function Example() {
  const { analysis } = useAnalysis();
  const { pool, narrowed } = analysis;
  const m = narrowed ? null : exampleMonth(pool.months, pool.latest);
  if (!m) return null;
  return (
    <div className="rounded-md border border-border-muted bg-surface-2 p-3 text-sm">
      <h4 className="eyebrow">
        {t('Example from your data')}
        <CalcInfo id="billing-example" className="ms-1" />
      </h4>
      {exampleLines(m, pool.capacityIsLowerBound).map((line) => (
        <p key={line} className="mt-1 text-fg-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

export function BillingExplainer() {
  const credit = fmtUSD(CREDIT_USD, 2);
  return (
    <details className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{t('How billing works here')}</span>
          <span className="block text-xs text-fg-muted">{t('Seats, the shared pool of included credits, and what is billed on top.')}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border-muted px-4 py-4">
        <ol className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <Point title={t('Every seat includes credits')}>
            {t(
              'A GitHub Copilot Business seat ({businessPrice} a month) includes {businessCredits} AI credits. An Enterprise seat ({enterprisePrice}) includes {enterpriseCredits}. One credit is worth {credit}, so the included credits are worth what the seat costs.',
              {
                businessPrice: fmtUSD(PLAN_PRICE.Business, 0),
                businessCredits: fmtInt(PLAN_CREDITS.Business),
                enterprisePrice: fmtUSD(PLAN_PRICE.Enterprise, 0),
                enterpriseCredits: fmtInt(PLAN_CREDITS.Enterprise),
                credit,
              },
            )}
          </Point>
          <Point title={t('Credits are pooled')}>
            {t(
              'The credits of all seats in a billing entity, an organization or an enterprise, go into one shared pool. Anyone can draw from it, so a heavy user is covered by credits that light users do not use. The pool is not split per person.',
            )}
          </Point>
          <Point title={t('The pool resets on the 1st')}>
            {t('It resets at the start of each month, UTC. Unused credits do not roll over, so credits left at the end of the month are lost.')}
          </Point>
          <Point title={t('Usage beyond the pool is billed')}>
            {t('When the pool is used up, further usage is billed at {credit} per credit, on top of the seat fees. That is the amount shown as billed on top of seats.', { credit })}
          </Point>
          <Point title={t('Usage without a user draws from the pool too')}>
            {t('Repo-level products are not tied to a person. Their usage has an empty username in the report, and it takes credits from the same pool.')}
          </Point>
          <Point title={t('What this means for savings')}>
            {t(
              'Using less only saves cash while usage is above the pool. Below it, the credits are already paid for through the seats. Removing seats only saves up to the unused part of the pool, because each removed seat takes its credits with it. A removed seat is still billed until the end of the billing cycle.',
            )}
          </Point>
        </ol>
        <Example />
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <DocLinks ids={['usageBilling', 'copilotBilling', 'seatAssignment', 'pricing']} title={t('Learn more')} compact />
          <button type="button" className="text-xs text-accent hover:underline" onClick={() => navigate('recommendations')}>
            {t('See recommendations')}
          </button>
        </div>
      </div>
    </details>
  );
}
