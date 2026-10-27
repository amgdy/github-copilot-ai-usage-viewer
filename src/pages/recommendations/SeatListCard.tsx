import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, type CalcRef } from '../../components/ui';
import { T, t } from '../../i18n';
import { DOCS } from '../../lib/analytics/recommendations';
import { pluralize } from '../../lib/utils/format';
import { MIN_EFFECT, fmtMoney } from './scenario';

export interface SeatListCardProps {
  title: string;
  count: number;
  /** Seat price per month that goes away if every seat in the list is actioned. */
  value: number;
  /** Cash saving per month of this action on its own, or null when the pool size is unknown. */
  cash: number | null;
  /** How seats are chosen, in plain words. */
  rule: ReactNode;
  caveat: string;
  /** The explanations of the count, the seat value and the cash line. */
  calc?: CalcRef;
  children: ReactNode;
}

function CashLine({ value, cash }: { value: number; cash: number }) {
  if (cash < MIN_EFFECT) {
    return <p className="text-sm">{t('On its own this would not lower the bill now, because the pool has no unused included credits to give up.')}</p>;
  }
  const amount = <b className="num">{fmtMoney(cash)}</b>;
  return (
    <p className="text-sm">
      {cash < value - MIN_EFFECT ? (
        <T text="On its own this lowers the bill by about {amount} a month, because only the unused part of the pool is saved." values={{ amount }} />
      ) : (
        <T text="On its own this lowers the bill by about {amount} a month." values={{ amount }} />
      )}
    </p>
  );
}

/** Frame of one seat list: value if actioned, selection rule, caveat and the table. */
export function SeatListCard({ title, count, value, cash, rule, caveat, calc, children }: SeatListCardProps) {
  return (
    <Card
      title={title}
      subtitle={count > 0 ? t('{seats} · {value} a month in seat value if actioned', { seats: pluralize(count, 'seat'), value: fmtMoney(value) }) : pluralize(0, 'seat')}
      calc={calc}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="label">{t('How seats are chosen')}</div>
          <p className="text-sm text-fg-muted">{rule}</p>
        </div>
        {count > 0 && cash !== null ? <CashLine value={value} cash={cash} /> : null}
        <p className="rounded-md bg-warn-soft px-2.5 py-1.5 text-xs text-warn">
          {caveat}{' '}
          <a href={DOCS.licenseUsage.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
            {t(DOCS.licenseUsage.label)} <ExternalLink size={11} />
          </a>
        </p>
        {children}
      </div>
    </Card>
  );
}
