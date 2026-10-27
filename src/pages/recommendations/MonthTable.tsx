import { Badge, Card, cx } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { Scenario, ScenarioMonth } from '../../lib/analytics/simulator';
import { fmtMoney, monthBilled, monthNewBilled } from './scenario';
import { TABLE, TABLE_WRAP, TD, TH } from './tableClasses';

/** `pool`: the pool size is known; `billed`: only the overage billed on top of seats is known; `usage`: no cash figures. */
export type MonthTableMode = 'pool' | 'billed' | 'usage';

/** `header` and `hint` are English text; show them through t(). */
interface Column {
  key: string;
  header: string;
  hint: string;
  value: (m: ScenarioMonth) => number;
  modes: MonthTableMode[];
  saving?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'gross', header: msg('Usage'), hint: msg('Usage in the month'), value: (m) => m.gross, modes: ['pool', 'billed', 'usage'] },
  { key: 'newGross', header: msg('New usage'), hint: msg('Usage after the levers'), value: (m) => m.newGross, modes: ['pool', 'billed', 'usage'] },
  { key: 'capacity', header: msg('Pool'), hint: msg('Included credits of all seats, which equal the seat prices'), value: (m) => m.capacity, modes: ['pool'] },
  { key: 'newCapacity', header: msg('New pool'), hint: msg('Pool after the seat actions'), value: (m) => m.newCapacity, modes: ['pool'] },
  { key: 'baseCost', header: msg('Cost'), hint: msg('The larger of the pool and the usage'), value: (m) => m.baseCost, modes: ['pool'] },
  { key: 'newCost', header: msg('New cost'), hint: msg('The larger of the new pool and the new usage'), value: (m) => m.newCost, modes: ['pool'] },
  { key: 'billed', header: msg('Billed'), hint: msg('Usage above the pool, billed on top of seats'), value: monthBilled, modes: ['billed'] },
  { key: 'newBilled', header: msg('New billed'), hint: msg('Usage above the pool after the levers'), value: monthNewBilled, modes: ['billed'] },
  { key: 'saving', header: msg('Saving'), hint: msg('Cost minus new cost'), value: (m) => m.saving, modes: ['pool', 'billed'], saving: true },
];

const sum = (months: ScenarioMonth[], pick: (m: ScenarioMonth) => number): number => months.reduce((a, m) => a + pick(m), 0);

const SUBTITLE: Record<MonthTableMode, string> = {
  pool: msg('Figures in US dollars. Cost is the larger of the pool and the usage.'),
  billed: msg('Figures in US dollars. The pool size is unknown, so only the part billed on top of seats is shown.'),
  usage: msg('Usage in US dollars. The pool and cost columns are hidden, see the note above.'),
};

/** One row per month of the report with the figures before and after the scenario. */
export function MonthTable({ scenario, mode, lowerBound }: { scenario: Scenario; mode: MonthTableMode; lowerBound: boolean }) {
  const months = scenario.months;
  if (months.length === 0) return null;
  const cols = COLUMNS.filter((c) => c.modes.includes(mode));
  const hasProjected = months.some((m) => m.projected);

  const cell = (c: Column, v: number, key: string) => (
    <td key={key} className={cx(TD, 'num text-end', c.saving && (v >= 0.005 ? 'font-medium text-good' : 'text-fg-muted'))}>
      {fmtMoney(v)}
    </td>
  );

  return (
    <Card title={t('Month by month')} subtitle={t(SUBTITLE[mode])} calc="rec-sim-months">
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <caption className="sr-only">{t('Usage, pool and cost for each month before and after the scenario')}</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                {t('Month')}
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className={cx(TH, 'text-end')} title={t(c.hint)}>
                  {t(c.header)}
                  {lowerBound && mode === 'pool' && c.key === 'capacity' ? '*' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.label}>
                <th scope="row" className={cx(TD, 'whitespace-nowrap font-medium')}>
                  <span className="inline-flex items-center gap-2">
                    {m.label}
                    {m.projected ? (
                      <Badge tone="info" title={t('The month is not over. Its usage is projected to the end of the month from the recent daily rate.')}>
                        {t('projected')}
                      </Badge>
                    ) : null}
                  </span>
                </th>
                {cols.map((c) => cell(c, c.value(m), c.key))}
              </tr>
            ))}
          </tbody>
          {months.length > 1 ? (
            <tfoot>
              <tr className="bg-surface-2 font-semibold">
                <th scope="row" className={cx(TD, 'text-start')}>
                  {t('Total')}
                </th>
                {cols.map((c) => cell(c, sum(months, c.value), c.key))}
              </tr>
              <tr className="bg-surface-2">
                <th scope="row" className={cx(TD, 'whitespace-nowrap text-start')}>
                  {t('Average per month')}
                </th>
                {cols.map((c) => cell(c, sum(months, c.value) / months.length, c.key))}
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
