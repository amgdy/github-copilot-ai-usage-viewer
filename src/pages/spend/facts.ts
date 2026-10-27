import { t, tp } from '../../i18n';
import { CREDIT_USD } from '../../lib/types';
import { fmtDay } from '../../lib/utils/date';
import { fmtInt, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { billedProjectionKnown, type MonthRow } from './helpers';

export interface MonthFacts {
  lines: string[];
  /** A caveat about the selected dates. */
  note: string | null;
}

const share = (part: number, whole: number): string => (whole > 0 ? fmtPct(part / whole, 0) : '–');
/** True when a projected range is wide enough to be worth stating. */
const hasRange = (low: number, high: number): boolean => Math.round(low) !== Math.round(high);

/**
 * Plain-language statements about one month. Pool statements appear only when the pool size is a real figure, and
 * the covered and billed statements only when the file says what was billed. Every sentence is one translated template.
 */
export function monthFacts(row: MonthRow, narrowed: boolean, billing: boolean): MonthFacts {
  const { m: monthPool } = row;
  const projection = monthPool.projection;
  const lines: string[] = [];
  const month = monthPool.label;

  if (!billing) {
    const usage = fmtUSD(monthPool.gross);
    if (narrowed) {
      lines.push(t('The selected rows used {usage} in {month}. The file does not say what was billed, so the covered and billed parts are not known.', { usage, month }));
    } else if (monthPool.complete) {
      lines.push(t('{month} used {usage}. The file does not say what was billed, so the covered and billed parts are not known.', { usage, month }));
    } else {
      lines.push(t('{month} used {usage} so far. The file does not say what was billed, so the covered and billed parts are not known.', { usage, month }));
    }
  } else if (narrowed) {
    lines.push(
      t('The selected rows used {usage} in {month}: {covered} covered by included credits and {billed} billed on top of seats.', {
        usage: fmtUSD(monthPool.gross),
        month,
        covered: fmtUSD(monthPool.discount),
        billed: fmtUSD(monthPool.net),
      }),
    );
  } else {
    if (row.known && monthPool.exhaustedOn !== null) {
      lines.push(t('The included credits ran out on {date}. Usage after that is billed on top of seats.', { date: fmtDay(monthPool.exhaustedOn, true) }));
    } else if (row.known && monthPool.complete) {
      lines.push(
        t('The included credits lasted all month. {amount} ({share} of the pool) went unused. Unused credits do not roll over.', {
          amount: fmtUSD(monthPool.headroom),
          share: share(monthPool.headroom, monthPool.capacity),
        }),
      );
    } else if (row.known) {
      lines.push(
        t('{amount} of included credits are left ({credits}, {share} of the pool).', {
          amount: fmtUSD(monthPool.headroom),
          credits: pluralize(Math.round(monthPool.headroom / CREDIT_USD), 'AI credit'),
          share: share(monthPool.headroom, monthPool.capacity),
        }),
      );
    } else if (monthPool.exhaustedOn !== null) {
      lines.push(t('Billing on top of seats began on {date}.', { date: fmtDay(monthPool.exhaustedOn, true) }));
    }
    if (monthPool.net > 0.005) {
      const messageValues = { billed: fmtUSD(monthPool.net), share: share(monthPool.net, monthPool.gross) };
      lines.push(monthPool.complete ? t('Billed on top of seats in the month: {billed}, {share} of usage.', messageValues) : t('Billed on top of seats so far: {billed}, {share} of usage.', messageValues));
    } else if (!row.known) {
      lines.push(monthPool.complete ? t('Nothing was billed on top of seats in the month.') : t('Nothing was billed on top of seats so far.'));
    }
  }

  if (projection) {
    const usage = fmtUSD(projection.projGross, 0);
    lines.push(
      hasRange(projection.projGrossLow, projection.projGrossHigh)
        ? t('If the current pace holds, usage for {month} ends at about {usage} (likely {low} to {high}).', {
            month,
            usage,
            low: fmtUSD(projection.projGrossLow, 0),
            high: fmtUSD(projection.projGrossHigh, 0),
          })
        : t('If the current pace holds, usage for {month} ends at about {usage}.', { month, usage }),
    );
    if (billedProjectionKnown(monthPool, narrowed)) {
      if (projection.projNet > 0.005) {
        const billed = fmtUSD(projection.projNet, 0);
        lines.push(
          hasRange(projection.projNetLow, projection.projNetHigh)
            ? t('That would bill about {billed} on top of seats (likely {low} to {high}).', { billed, low: fmtUSD(projection.projNetLow, 0), high: fmtUSD(projection.projNetHigh, 0) })
            : t('That would bill about {billed} on top of seats.', { billed }),
        );
      } else if (projection.projNetHigh > 0.005) {
        lines.push(t('That should stay within the included credits. At the higher pace, about {billed} would be billed.', { billed: fmtUSD(projection.projNetHigh, 0) }));
      } else {
        lines.push(t('That stays within the included credits, so nothing would be billed on top of seats.'));
      }
    }
    if (row.known && monthPool.exhaustedOn === null) {
      lines.push(
        projection.exhaustionDate !== null
          ? t('The credits are expected to run out around {date}.', { date: fmtDay(projection.exhaustionDate, true) })
          : t('At the average pace, the credits last until the end of the month.'),
      );
    }
  }

  if (!narrowed && monthPool.users > 0 && row.activeUsers > 0) {
    if (row.takers > 0) {
      const messageValues = { takers: fmtInt(row.takers), active: fmtInt(row.activeUsers), amount: fmtUSD(row.takenUsd, 0) };
      const takers = tp(
        row.activeUsers,
        '{takers} of {active} active user used more than the credits in their own seat, by {amount} together.',
        '{takers} of {active} active users used more than the credits in their own seat, by {amount} together.',
        messageValues,
      );
      lines.push(monthPool.users > row.takers ? `${takers} ${t('They draw on the credits of seats that used less.')}` : takers);
    } else {
      lines.push(t('Nobody used more than the credits in their own seat.'));
    }
  }

  let note: string | null = null;
  if (!narrowed && row.partial) {
    note = billing
      ? t('The selected dates cover only part of {month}, so its pool figures are understated.', { month })
      : t('The selected dates cover only part of {month}, so its usage is understated.', { month });
  }
  return { lines, note };
}
