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
export function monthFacts(r: MonthRow, narrowed: boolean, billing: boolean): MonthFacts {
  const { m } = r;
  const p = m.projection;
  const lines: string[] = [];
  const month = m.label;

  if (!billing) {
    const usage = fmtUSD(m.gross);
    if (narrowed) {
      lines.push(t('The selected rows used {usage} in {month}. The file does not say what was billed, so the covered and billed parts are not known.', { usage, month }));
    } else if (m.complete) {
      lines.push(t('{month} used {usage}. The file does not say what was billed, so the covered and billed parts are not known.', { usage, month }));
    } else {
      lines.push(t('{month} used {usage} so far. The file does not say what was billed, so the covered and billed parts are not known.', { usage, month }));
    }
  } else if (narrowed) {
    lines.push(
      t('The selected rows used {usage} in {month}: {covered} covered by included credits and {billed} billed on top of seats.', {
        usage: fmtUSD(m.gross),
        month,
        covered: fmtUSD(m.discount),
        billed: fmtUSD(m.net),
      }),
    );
  } else {
    if (r.known && m.exhaustedOn !== null) {
      lines.push(t('The included credits ran out on {date}. Usage after that is billed on top of seats.', { date: fmtDay(m.exhaustedOn, true) }));
    } else if (r.known && m.complete) {
      lines.push(
        t('The included credits lasted all month. {amount} ({share} of the pool) went unused. Unused credits do not roll over.', {
          amount: fmtUSD(m.headroom),
          share: share(m.headroom, m.capacity),
        }),
      );
    } else if (r.known) {
      lines.push(
        t('{amount} of included credits are left ({credits}, {share} of the pool).', {
          amount: fmtUSD(m.headroom),
          credits: pluralize(Math.round(m.headroom / CREDIT_USD), 'AI credit'),
          share: share(m.headroom, m.capacity),
        }),
      );
    } else if (m.exhaustedOn !== null) {
      lines.push(t('Billing on top of seats began on {date}.', { date: fmtDay(m.exhaustedOn, true) }));
    }
    if (m.net > 0.005) {
      const vars = { billed: fmtUSD(m.net), share: share(m.net, m.gross) };
      lines.push(m.complete ? t('Billed on top of seats in the month: {billed}, {share} of usage.', vars) : t('Billed on top of seats so far: {billed}, {share} of usage.', vars));
    } else if (!r.known) {
      lines.push(m.complete ? t('Nothing was billed on top of seats in the month.') : t('Nothing was billed on top of seats so far.'));
    }
  }

  if (p) {
    const usage = fmtUSD(p.projGross, 0);
    lines.push(
      hasRange(p.projGrossLow, p.projGrossHigh)
        ? t('If the current pace holds, usage for {month} ends at about {usage} (likely {low} to {high}).', {
            month,
            usage,
            low: fmtUSD(p.projGrossLow, 0),
            high: fmtUSD(p.projGrossHigh, 0),
          })
        : t('If the current pace holds, usage for {month} ends at about {usage}.', { month, usage }),
    );
    if (billedProjectionKnown(m, narrowed)) {
      if (p.projNet > 0.005) {
        const billed = fmtUSD(p.projNet, 0);
        lines.push(
          hasRange(p.projNetLow, p.projNetHigh)
            ? t('That would bill about {billed} on top of seats (likely {low} to {high}).', { billed, low: fmtUSD(p.projNetLow, 0), high: fmtUSD(p.projNetHigh, 0) })
            : t('That would bill about {billed} on top of seats.', { billed }),
        );
      } else if (p.projNetHigh > 0.005) {
        lines.push(t('That should stay within the included credits. At the higher pace, about {billed} would be billed.', { billed: fmtUSD(p.projNetHigh, 0) }));
      } else {
        lines.push(t('That stays within the included credits, so nothing would be billed on top of seats.'));
      }
    }
    if (r.known && m.exhaustedOn === null) {
      lines.push(
        p.exhaustionDate !== null
          ? t('The credits are expected to run out around {date}.', { date: fmtDay(p.exhaustionDate, true) })
          : t('At the average pace, the credits last until the end of the month.'),
      );
    }
  }

  if (!narrowed && m.users > 0 && r.activeUsers > 0) {
    if (r.takers > 0) {
      const vars = { takers: fmtInt(r.takers), active: fmtInt(r.activeUsers), amount: fmtUSD(r.takenUsd, 0) };
      const takers = tp(
        r.activeUsers,
        '{takers} of {active} active user used more than the credits in their own seat, by {amount} together.',
        '{takers} of {active} active users used more than the credits in their own seat, by {amount} together.',
        vars,
      );
      lines.push(m.users > r.takers ? `${takers} ${t('They draw on the credits of seats that used less.')}` : takers);
    } else {
      lines.push(t('Nobody used more than the credits in their own seat.'));
    }
  }

  let note: string | null = null;
  if (!narrowed && r.partial) {
    note = billing
      ? t('The selected dates cover only part of {month}, so its pool figures are understated.', { month })
      : t('The selected dates cover only part of {month}, so its usage is understated.', { month });
  }
  return { lines, note };
}
