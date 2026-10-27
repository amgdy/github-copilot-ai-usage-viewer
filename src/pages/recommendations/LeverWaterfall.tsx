import { type ReactNode } from 'react';
import { CalcInfo, Card, cx } from '../../components/ui';
import { t } from '../../i18n';
import type { LeverParams } from '../../lib/analytics/levers';
import type { Scenario } from '../../lib/analytics/simulator';
import { fmtPct, pluralize } from '../../lib/utils/format';
import { MIN_EFFECT, fmtMoney, leverSentence, noEffectNote, targetLabel, type NoEffectContext } from './scenario';
import { TABLE, TABLE_WRAP, BODY_CELL_CLASSES, HEADER_CELL_CLASSES } from './tableClasses';

function Row({ label, note, bar, value, valueNote }: { label: ReactNode; note?: ReactNode; bar: ReactNode; value: ReactNode; valueNote?: ReactNode }) {
  return (
    <li className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,8.5rem)]">
      <div className="min-w-0">
        <div className="text-sm font-medium leading-snug">{label}</div>
        {note ? <div className="text-xs text-fg-muted">{note}</div> : null}
      </div>
      <div className="relative h-3 rounded-xs bg-surface-3" aria-hidden>
        {bar}
      </div>
      <div className="text-start sm:text-end">
        <div className="num text-sm font-semibold">{value}</div>
        {valueNote ? <div className="num text-xs text-fg-muted">{valueNote}</div> : null}
      </div>
    </li>
  );
}

/** Starts at the reading side of the bar, so the waterfall runs right to left in Arabic. */
const Bar = ({ start, width, className }: { start: number; width: number; className: string }) => (
  <span className={cx('absolute inset-y-0 rounded-xs', className)} style={{ insetInlineStart: `${start}%`, width: `max(${width}%, 3px)` }} />
);

/** A signed amount keeps its sign on the left of the number in right-to-left text too. */
const Signed = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span dir="ltr" className={className}>
    {children}
  </span>
);

/** Usage now, the effect of each lever in order, and usage after. Values are usage per month. */
export function LeverWaterfall({ scenario, perMonth, levers, context }: { scenario: Scenario; perMonth: number; levers: LeverParams; context: NoEffectContext }) {
  const { baseline, steps, total } = scenario.levers;
  const pct = (amount: number): number => (baseline > 0 ? Math.min(100, Math.max(0, (amount / baseline) * 100)) : 0);

  let remaining = baseline;
  const rows = steps.map((step) => {
    remaining -= step.savings;
    return { step, start: pct(remaining), width: pct(step.savings), month: step.savings * perMonth, alone: step.standalone * perMonth };
  });
  const after = Math.max(0, baseline - total);
  const projectedMonth = scenario.months.some((scenarioMonth) => scenarioMonth.projected);

  return (
    <Card
      title={t('Where the usage reduction comes from')}
      subtitle={t('Usage per month. Each lever works on what the earlier ones left, so the effects add up without double counting.')}
      calc="rec-sim-waterfall"
    >
      <ol className="space-y-2.5">
        <Row label={t('Usage now')} bar={<Bar start={0} width={100} className="bg-fg-subtle" />} value={fmtMoney(baseline * perMonth)} />
        {rows.map(({ step, start, width, month, alone }) => {
          const none = month < MIN_EFFECT;
          return (
            <Row
              key={step.id}
              label={step.label}
              note={none ? noEffectNote(step.id, levers, context) : leverSentence(step.id, levers)}
              bar={none ? null : <Bar start={start} width={width} className="bg-good" />}
              value={none ? <span className="font-normal text-fg-muted">{t('no effect')}</span> : <Signed className="text-good">−{fmtMoney(month)}</Signed>}
              valueNote={none ? undefined : alone >= MIN_EFFECT && Math.abs(alone - month) >= MIN_EFFECT ? t('{amount} on its own', { amount: fmtMoney(alone) }) : undefined}
            />
          );
        })}
        <Row
          label={<span className="font-semibold">{t('Usage after')}</span>}
          bar={<Bar start={0} width={pct(after)} className="bg-accent" />}
          value={fmtMoney(after * perMonth)}
          valueNote={baseline > 0 ? <Signed>−{fmtPct(scenario.fraction, 1)}</Signed> : undefined}
        />
      </ol>
      {projectedMonth ? (
        <p className="mt-3 text-xs text-fg-muted">{t('This chart averages the whole period. The month table below projects the unfinished month to its end, so its totals differ a little.')}</p>
      ) : null}
      <ShiftDetail scenario={scenario} levers={levers} perMonth={perMonth} />
    </Card>
  );
}

function ShiftDetail({ scenario, levers, perMonth }: { scenario: Scenario; levers: LeverParams; perMonth: number }) {
  const all = scenario.levers.shiftRows;
  const cheaper = all.filter((shiftRow) => shiftRow.savingsAtFull > 0);
  const top = cheaper.slice(0, 5);
  const heading = (
    <h4 className="mb-1.5 mt-5 flex items-center gap-1 text-sm font-semibold">
      {t('Right-sizing detail')}
      <CalcInfo id="rec-sim-rightsizing" />
    </h4>
  );

  if (all.length === 0) {
    return (
      <div>
        {heading}
        <p className="text-sm text-fg-muted">{t('No usage of Powerful-tier models with a known price was found, so there is nothing to right-size.')}</p>
      </div>
    );
  }
  if (top.length === 0) {
    return (
      <div>
        {heading}
        <p className="text-sm text-fg-muted">
          {t('Moving to {target} would not cost less than the Powerful-tier models used here, so right-sizing saves nothing. Pick another target model.', { target: targetLabel(levers.target) })}
        </p>
      </div>
    );
  }
  return (
    <div>
      {heading}
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={HEADER_CELL_CLASSES}>{t('Model')}</th>
              <th className={HEADER_CELL_CLASSES}>{t('Moves to')}</th>
              <th className={cx(HEADER_CELL_CLASSES, 'text-end')}>{t('Same work costs')}</th>
              <th className={cx(HEADER_CELL_CLASSES, 'text-end')}>{t('Usage per month')}</th>
              <th className={cx(HEADER_CELL_CLASSES, 'text-end')}>{t('Saving at {pct}', { pct: fmtPct(levers.modelShift, 0) })}</th>
            </tr>
          </thead>
          <tbody>
            {top.map((shiftRow) => (
              <tr key={shiftRow.modelId}>
                <td className={BODY_CELL_CLASSES}>{shiftRow.model}</td>
                <td className={BODY_CELL_CLASSES}>{shiftRow.target}</td>
                <td className={cx(BODY_CELL_CLASSES, 'num text-end')}>{fmtPct(shiftRow.ratio, 0)}</td>
                <td className={cx(BODY_CELL_CLASSES, 'num text-end')}>{fmtMoney(shiftRow.gross * perMonth)}</td>
                <td className={cx(BODY_CELL_CLASSES, 'num text-end text-good')}>
                  <Signed>−{fmtMoney(shiftRow.savingsAtFull * levers.modelShift * perMonth)}</Signed>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-xs text-fg-muted">
        {cheaper.length > top.length ? `${t('Showing the {models} with the largest saving, out of {total}.', { models: pluralize(top.length, 'model'), total: cheaper.length })} ` : ''}
        {t('Same work costs is the target price divided by the current price for the same mix of input, cache and output tokens, at price card rates.')}
      </p>
    </div>
  );
}
