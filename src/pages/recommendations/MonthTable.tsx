import { Badge, Card, cx } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { Scenario, ScenarioMonth } from '../../lib/analytics/simulator';
import { fmtMoney, monthBilled, monthNewBilled } from './scenario';
import { TABLE, TABLE_WRAP, BODY_CELL_CLASSES, HEADER_CELL_CLASSES } from './tableClasses';

/** `pool`: the pool size is known; `billed`: only the overage billed on top of seats is known; `usage`: no cash figures. */
export type MonthTableMode = 'pool' | 'billed' | 'usage';

/** `header` and `hint` are English text; show them through t(). */
interface Column {
  key: string;
  header: string;
  hint: string;
  value: (month: ScenarioMonth) => number;
  modes: MonthTableMode[];
  saving?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'gross', header: msg('Usage'), hint: msg('Usage in the month'), value: (month) => month.gross, modes: ['pool', 'billed', 'usage'] },
  { key: 'newGross', header: msg('New usage'), hint: msg('Usage after the levers'), value: (month) => month.newGross, modes: ['pool', 'billed', 'usage'] },
  { key: 'capacity', header: msg('Pool'), hint: msg('Included credits of all seats, which equal the seat prices'), value: (month) => month.capacity, modes: ['pool'] },
  { key: 'newCapacity', header: msg('New pool'), hint: msg('Pool after the seat actions'), value: (month) => month.newCapacity, modes: ['pool'] },
  { key: 'baseCost', header: msg('Cost'), hint: msg('The larger of the pool and the usage'), value: (month) => month.baseCost, modes: ['pool'] },
  { key: 'newCost', header: msg('New cost'), hint: msg('The larger of the new pool and the new usage'), value: (month) => month.newCost, modes: ['pool'] },
  { key: 'billed', header: msg('Billed'), hint: msg('Usage above the pool, billed on top of seats'), value: monthBilled, modes: ['billed'] },
  { key: 'newBilled', header: msg('New billed'), hint: msg('Usage above the pool after the levers'), value: monthNewBilled, modes: ['billed'] },
  { key: 'saving', header: msg('Saving'), hint: msg('Cost minus new cost'), value: (month) => month.saving, modes: ['pool', 'billed'], saving: true },
];

const sum = (months: ScenarioMonth[], pick: (month: ScenarioMonth) => number): number => months.reduce((total, month) => total + pick(month), 0);

const SUBTITLE: Record<MonthTableMode, string> = {
  pool: msg('Figures in US dollars. Cost is the larger of the pool and the usage.'),
  billed: msg('Figures in US dollars. The pool size is unknown, so only the part billed on top of seats is shown.'),
  usage: msg('Usage in US dollars. The pool and cost columns are hidden, see the note above.'),
};

/** One row per month of the report with the figures before and after the scenario. */
export function MonthTable({ scenario, mode, lowerBound }: { scenario: Scenario; mode: MonthTableMode; lowerBound: boolean }) {
  const months = scenario.months;
  if (months.length === 0) return null;
  const cols = COLUMNS.filter((column) => column.modes.includes(mode));
  const hasProjected = months.some((month) => month.projected);

  const cell = (column: Column, amount: number, key: string) => (
    <td key={key} className={cx(BODY_CELL_CLASSES, 'num text-end', column.saving && (amount >= 0.005 ? 'font-medium text-good' : 'text-fg-muted'))}>
      {fmtMoney(amount)}
    </td>
  );

  return (
    <Card title={t('Month by month')} subtitle={t(SUBTITLE[mode])} calc="rec-sim-months">
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <caption className="sr-only">{t('Usage, pool and cost for each month before and after the scenario')}</caption>
          <thead>
            <tr>
              <th scope="col" className={HEADER_CELL_CLASSES}>
                {t('Month')}
              </th>
              {cols.map((column) => (
                <th key={column.key} scope="col" className={cx(HEADER_CELL_CLASSES, 'text-end')} title={t(column.hint)}>
                  {t(column.header)}
                  {lowerBound && mode === 'pool' && column.key === 'capacity' ? '*' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.label}>
                <th scope="row" className={cx(BODY_CELL_CLASSES, 'whitespace-nowrap font-medium')}>
                  <span className="inline-flex items-center gap-2">
                    {month.label}
                    {month.projected ? (
                      <Badge tone="info" title={t('The month is not over. Its usage is projected to the end of the month from the recent daily rate.')}>
                        {t('projected')}
                      </Badge>
                    ) : null}
                  </span>
                </th>
                {cols.map((column) => cell(column, column.value(month), column.key))}
              </tr>
            ))}
          </tbody>
          {months.length > 1 ? (
            <tfoot>
              <tr className="bg-surface-2 font-semibold">
                <th scope="row" className={cx(BODY_CELL_CLASSES, 'text-start')}>
                  {t('Total')}
                </th>
                {cols.map((column) => cell(column, sum(months, column.value), column.key))}
              </tr>
              <tr className="bg-surface-2">
                <th scope="row" className={cx(BODY_CELL_CLASSES, 'whitespace-nowrap text-start')}>
                  {t('Average per month')}
                </th>
                {cols.map((column) => cell(column, sum(months, column.value) / months.length, column.key))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-fg-muted">
        {mode === 'pool' ? (
          <p>
            {t(
              'Cost is the larger of the pool and the usage. Using less saves cash only for the part of the usage above the pool, because the pool is paid for anyway. Removing seats shrinks the pool, so it saves cash only up to the unused part of the pool.',
            )}
          </p>
        ) : mode === 'billed' ? (
          <p>{t('Using less saves cash only for the part of the usage above the pool. A month that ran out of included credits shows the real pool size, and a month that did not billed nothing.')}</p>
        ) : null}
        {hasProjected ? <p>{t('Projected months are included in the total and the average.')}</p> : null}
        {mode === 'pool' && lowerBound ? <p>{t('* The pool counts only the seats that appear in the report. Add your roster in Settings for the real pool size.')}</p> : null}
      </div>
    </Card>
  );
}
