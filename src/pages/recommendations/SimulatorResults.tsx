import { Callout, cx, Kpi, KpiGrid } from '../../components/ui';
import { t } from '../../i18n';
import { LEVER_META, LEVER_ORDER, type LeverParams } from '../../lib/analytics/levers';
import type { Scenario } from '../../lib/analytics/simulator';
import { fmtPct, pluralize } from '../../lib/utils/format';
import { CopyButton } from './CopyButton';
import { LeverWaterfall } from './LeverWaterfall';
import { MonthTable } from './MonthTable';
import { fmtMoney, leverSentence, type NoEffectContext, type ScenarioFigures, type SeatOption } from './scenario';

export interface SeatState {
  option: SeatOption;
  on: boolean;
}

export interface SimulatorResultsProps {
  scenario: Scenario;
  figures: ScenarioFigures;
  levers: LeverParams;
  seats: SeatState[];
  perMonth: number;
  context: NoEffectContext;
  /** Why cash savings are hidden, or null when they are shown. */
  cashReason: string | null;
  /** Why the pool size is unknown while cash savings are shown, or null. */
  poolReason: string | null;
  lowerBound: boolean;
  /** True while the result still shows the previous slider positions. */
  stale: boolean;
  getCopyText: () => string;
}

function Tiles({ f, scenario, seatCount }: { f: ScenarioFigures; scenario: Scenario; seatCount: number }) {
  const usage = t('{before} to {after} a month', { before: fmtMoney(f.usageBefore), after: fmtMoney(f.usageAfter) });
  const now = (amount: number): string => t('now {amount} a month', { amount: fmtMoney(amount) });
  const reduction = (
    <Kpi
      label={t('Usage reduction')}
      value={fmtPct(f.reduction, 1)}
      tone={f.reduction > 0 ? 'good' : 'neutral'}
      sub={usage}
      hint={t('The share of usage that the levers avoid. It does not depend on the size of the pool.')}
      calc="rec-sim-reduction"
    />
  );
  const usageAfter = (
    <Kpi label={t('Usage after')} value={fmtMoney(f.usageAfter)} sub={now(f.usageBefore)} hint={t('Usage per month once the levers are applied.')} calc="rec-sim-usage-after" />
  );

  if (!f.cash) {
    return (
      <>
        {reduction}
        {usageAfter}
      </>
    );
  }

  const lower = f.costBefore > 0 ? 1 - f.costAfter / f.costBefore : 0;
  const cashTiles = (
    <>
      {reduction}
      <Kpi
        label={t('Cash saving per month')}
        value={fmtMoney(f.saveMonth)}
        tone={f.saveMonth >= 0.5 ? 'good' : 'neutral'}
        sub={t('average of {months}', { months: pluralize(f.months, 'month') })}
        hint={t('Cost is the larger of the pool and the usage. Using less saves cash only for the part of the usage above the pool. Seat actions add to it.')}
        calc="rec-sim-cash-month"
      />
      <Kpi label={t('Cash saving per year')} value={fmtMoney(f.saveYear)} tone={f.saveYear >= 6 ? 'good' : 'neutral'} sub={t('12 times the monthly saving')} calc="rec-sim-cash-year" />
    </>
  );

  if (!f.poolKnown) {
    return (
      <>
        {cashTiles}
        <Kpi
          label={t('Billed on top of seats')}
          value={fmtMoney(f.billedAfter)}
          sub={now(f.billedBefore)}
          hint={t('Usage above the pool, per month. It is what using less can save while the number of seats stays the same.')}
          calc="rec-sim-billed"
        />
        {usageAfter}
      </>
    );
  }

  return (
    <>
      {cashTiles}
      <Kpi
        label={t('New monthly cost')}
        value={fmtMoney(f.costAfter)}
        sub={lower >= 0.0005 ? t('now {before}, {pct} lower', { before: fmtMoney(f.costBefore), pct: fmtPct(lower, 1) }) : t('now {before}, no change', { before: fmtMoney(f.costBefore) })}
        hint={t('Average cost per month over the months in the report: seats plus usage above the pool.')}
        calc="rec-sim-cost"
      />
      <Kpi
        label={t('Unused included credits')}
        value={fmtMoney(f.unusedAfter)}
        sub={now(f.unusedBefore)}
        hint={t('Included credits that are paid for but not used, per month. Using less leaves more of the pool unused, which is why usage below the pool does not lower the bill.')}
        calc="rec-sim-unused"
      />
      <Kpi
        label={t('Seat value removed')}
        value={fmtMoney(scenario.seatValue)}
        sub={seatCount > 0 ? t('{seats} reclaimed or moved, per month', { seats: pluralize(seatCount, 'seat') }) : t('no seat action is on')}
        hint={t('The monthly price of the seats the switches remove or move to Business. It lowers the pool, and saves cash only where the pool had unused credits.')}
        calc="rec-sim-seat-value"
      />
    </>
  );
}

/** The assumptions, written out so a printed page explains itself. */
function PrintAssumptions({ levers, seats }: { levers: LeverParams; seats: SeatState[] }) {
  return (
    <div className="hidden text-sm print:block">
      <h3 className="mb-1 font-semibold">{t('Assumptions')}</h3>
      <ul className="list-disc space-y-0.5 ps-5">
        {LEVER_ORDER.map((id) => (
          <li key={id}>
            {t(LEVER_META[id].label)}: {leverSentence(id, levers)}
          </li>
        ))}
        {seats.map(({ option, on }) => (
          <li key={option.key}>
            {option.label}: {option.disabledReason ? t('not available') : on ? t('on') : t('off')}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** KPI tiles, the lever waterfall and the month table for the current scenario. */
export function SimulatorResults({ scenario, figures, levers, seats, perMonth, context, cashReason, poolReason, lowerBound, stale, getCopyText }: SimulatorResultsProps) {
  const seatCount = seats.reduce((a, s) => a + (s.on ? s.option.count : 0), 0);
  return (
    <div className={cx('space-y-4 transition-opacity', stale && 'opacity-70')} aria-busy={stale}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{t('Result')}</h3>
        <CopyButton size="sm" label={t('Copy scenario')} getText={getCopyText} className="print:hidden" />
      </div>

      {cashReason ? (
        <Callout tone="info" title={t('Cash savings are not shown')}>
          {cashReason} {t('The usage reduction does not depend on the pool, so it is still shown.')}
        </Callout>
      ) : poolReason ? (
        <Callout tone="info" title={t('Cash savings come from the billed overage')}>
          {t('A month that ran out of included credits shows the real pool size, and a month that did not billed nothing, so the cash effect of using less is known.')} {poolReason}
        </Callout>
      ) : null}

      <KpiGrid cols="grid-cols-2 lg:grid-cols-3">
        <Tiles f={figures} scenario={scenario} seatCount={seatCount} />
      </KpiGrid>

      <PrintAssumptions levers={levers} seats={seats} />
      <LeverWaterfall scenario={scenario} perMonth={perMonth} levers={levers} context={context} />
      <MonthTable scenario={scenario} mode={figures.poolKnown ? 'pool' : figures.cash ? 'billed' : 'usage'} lowerBound={lowerBound} />
    </div>
  );
}
