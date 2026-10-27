import { useMemo } from 'react';
import { Card, DataTable, type Column } from '../../components/ui';
import { T, t, tp } from '../../i18n';
import { fmtDay, isoDate, monthLabel } from '../../lib/utils/date';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { fmtTokens, gapMonths, type MonthRow, type MonthTokens } from './helpers';

const cents = (v: number): number | null => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const sum = (rows: MonthRow[], f: (r: MonthRow) => number): number => rows.reduce((a, r) => a + f(r), 0);

const promptOf = (tk: MonthTokens): number => tk.input + tk.cacheRead + tk.cacheWrite;
const hitRateOf = (tk: MonthTokens): number => (promptOf(tk) > 0 ? tk.cacheRead / promptOf(tk) : Number.NaN);
const tokensOf = (rows: MonthRow[]): MonthTokens => ({
  input: sum(rows, (r) => r.tokens.input),
  cacheRead: sum(rows, (r) => r.tokens.cacheRead),
  cacheWrite: sum(rows, (r) => r.tokens.cacheWrite),
  output: sum(rows, (r) => r.tokens.output),
});

type TokenColumn = Pick<Column<MonthRow>, 'key' | 'header' | 'csvHeader' | 'hint' | 'calc'>;

/** The token columns start hidden, and show a dash when the file has no token columns. Cache read and write sit next to the hit rate. */
function tokenColumns(hasTokens: boolean): Column<MonthRow>[] {
  const count = (col: TokenColumn, of: (tk: MonthTokens) => number): Column<MonthRow> => ({
    ...col,
    align: 'end',
    hidden: true,
    value: (r) => (hasTokens ? of(r.tokens) : null),
    render: (r) => (hasTokens ? fmtTokens(of(r.tokens)) : '–'),
    total: (rs) => (hasTokens ? fmtTokens(of(tokensOf(rs))) : '–'),
  });
  return [
    count(
      {
        key: 'tokensIn',
        header: t('Input tokens'),
        csvHeader: t('Input tokens'),
        hint: t('Tokens of new text sent to the model, not read from the cache.'),
        calc: 'tokens-input',
      },
      (tk) => tk.input,
    ),
    count({ key: 'tokensOut', header: t('Output tokens'), csvHeader: t('Output tokens'), hint: t('Tokens the model wrote back.'), calc: 'tokens-output' }, (tk) => tk.output),
    count(
      {
        key: 'tokensCr',
        header: t('Cache read tokens'),
        csvHeader: t('Cache read tokens'),
        hint: t('Text the model has seen before and reads again from its cache, at a lower price than new input.'),
        calc: 'tokens-cache-read',
      },
      (tk) => tk.cacheRead,
    ),
    count(
      {
        key: 'tokensCw',
        header: t('Cache write tokens'),
        csvHeader: t('Cache write tokens'),
        hint: t('Text the model saves in its cache so that later requests can read it again.'),
        calc: 'tokens-cache-write',
      },
      (tk) => tk.cacheWrite,
    ),
    {
      key: 'cacheHit',
      header: t('Cache hit rate'),
      align: 'end',
      hint: t('Cache read tokens as a share of all prompt tokens (input, cache read and cache write).'),
      calc: 'cache-hit',
      hidden: true,
      csvHeader: t('Cache hit rate (%)'),
      value: (r) => (hasTokens && promptOf(r.tokens) > 0 ? Math.round(hitRateOf(r.tokens) * 1000) / 10 : null),
      render: (r) => (hasTokens ? fmtPct(hitRateOf(r.tokens), 0) : '–'),
      total: (rs) => (hasTokens ? fmtPct(hitRateOf(tokensOf(rs)), 0) : '–'),
    },
    count(
      {
        key: 'tokensAll',
        header: t('Total tokens'),
        csvHeader: t('Total tokens'),
        hint: t('Input, output, cache read and cache write tokens together.'),
        calc: 'tokens-total',
      },
      (tk) => promptOf(tk) + tk.output,
    ),
  ];
}

interface MonthTableProps {
  rows: MonthRow[];
  selected: string | null;
  onSelect: (key: string) => void;
}

function ranOutCell(r: MonthRow): string | null {
  const { m } = r;
  if (m.exhaustedOn !== null) return fmtDay(m.exhaustedOn, true);
  if (!r.known) return null;
  if (m.complete) return t('Lasted');
  return m.projection?.exhaustionDate != null ? t('Expected {date}', { date: fmtDay(m.projection.exhaustionDate) }) : t('Not yet');
}

export function MonthTable({ rows, selected, onSelect }: MonthTableProps) {
  const { analysis } = useAnalysis();
  const { narrowed, pool, agg, coverage } = analysis;
  const billing = coverage.billing;
  const hasTokens = coverage.tokens;
  const showPool = !narrowed && rows.some((r) => r.known);
  const star = pool.capacityIsLowerBound ? '*' : '';
  const users = agg.totals.users;
  const gaps = useMemo(() => gapMonths(pool.months), [pool.months]);

  const columns = useMemo(() => {
    const cols: Column<MonthRow>[] = [
      {
        key: 'month',
        header: t('Month'),
        value: (r) => r.m.key,
        csvHeader: t('Month'),
        render: (r) => (
          <span className="whitespace-nowrap font-medium">
            {r.m.label}
            {!r.m.complete ? (
              <span className="ms-1.5 text-[11px] font-normal text-fg-subtle">{t('so far')}</span>
            ) : r.partial ? (
              <span className="ms-1.5 text-[11px] font-normal text-fg-subtle">{t('partial')}</span>
            ) : null}
          </span>
        ),
      },
      {
        key: 'usage',
        header: t('Usage'),
        align: 'end',
        hint: t('Value of the AI credits used.'),
        calc: 'usage',
        csvHeader: t('Usage (USD)'),
        value: (r) => cents(r.m.gross),
        render: (r) => fmtUSD(r.m.gross),
        total: (rs) => fmtUSD(sum(rs, (r) => r.m.gross)),
      },
    ];
    if (billing) {
      cols.push(
        {
          key: 'covered',
          header: t('Covered'),
          align: 'end',
          hint: t('Usage paid for by the included credits.'),
          calc: 'covered',
          csvHeader: t('Covered by included credits (USD)'),
          value: (r) => cents(r.m.discount),
          render: (r) => fmtUSD(r.m.discount),
          total: (rs) => fmtUSD(sum(rs, (r) => r.m.discount)),
        },
        {
          key: 'billed',
          header: t('Billed'),
          align: 'end',
          hint: t('Usage beyond the included credits, billed on top of seats.'),
          calc: 'billed',
          csvHeader: t('Billed on top of seats (USD)'),
          value: (r) => cents(r.m.net),
          render: (r) => <span className={r.m.net > 0.005 ? 'font-medium text-warn' : undefined}>{fmtUSD(r.m.net)}</span>,
          total: (rs) => fmtUSD(sum(rs, (r) => r.m.net)),
        },
      );
    }
    if (showPool) {
      cols.push(
        {
          key: 'capacity',
          header: t('Pool size'),
          align: 'end',
          hint: t('Credits included with all seats, at $0.01 each. A month whose pool size is not known shows a dash.'),
          calc: 'pool-size',
          csvHeader: t('Pool size (USD)'),
          value: (r) => (r.known ? cents(r.m.capacity) : null),
          render: (r) => (r.known ? `${fmtUSD(r.m.capacity, 0)}${star}` : '–'),
          total: (rs) => (rs.length && rs.every((r) => r.known) ? `${fmtUSD(sum(rs, (r) => r.m.capacity), 0)}${star}` : ''),
        },
        {
          key: 'used',
          header: t('Included credits used'),
          align: 'end',
          hint: t('Covered usage divided by the pool size.'),
          calc: 'pool-utilization',
          csvHeader: t('Included credits used (%)'),
          value: (r) => (r.known ? Math.round(r.m.utilization * 1000) / 10 : null),
          render: (r) => (r.known ? fmtPct(r.m.utilization, 0) : '–'),
          total: (rs) => (rs.length && rs.every((r) => r.known) ? fmtPct(sum(rs, (r) => r.m.discount) / sum(rs, (r) => r.m.capacity), 0) : ''),
        },
      );
    }
    if (!narrowed && billing) {
      cols.push({
        key: 'ranOut',
        header: t('Ran out on'),
        align: 'end',
        hint: t('The first day with usage billed on top of seats. An expected date is a projection.'),
        calc: ['pool-exhausted', 'projection'],
        csvHeader: t('Ran out on'),
        value: (r) => (r.m.exhaustedOn !== null ? isoDate(r.m.exhaustedOn) : null),
        render: (r) => ranOutCell(r) ?? '–',
        total: (rs) => t('{count} of {total}', { count: fmtInt(rs.filter((r) => r.m.exhaustedOn !== null).length), total: fmtInt(rs.length) }),
      });
    }
    if (showPool) {
      cols.push({
        key: 'left',
        header: t('Included credits left'),
        align: 'end',
        hint: t('Included credits not used yet. Unused credits do not roll over to the next month.'),
        calc: 'pool-headroom',
        csvHeader: t('Included credits left (USD)'),
        value: (r) => (r.known ? cents(r.m.headroom) : null),
        render: (r) => (r.known ? fmtUSD(r.m.headroom, 0) : '–'),
      });
    }
    cols.push(
      {
        key: 'users',
        header: t('Active users'),
        align: 'end',
        hint: t('Named users with usage above $0 in the month.'),
        calc: 'active-users-per-month',
        csvHeader: t('Active users'),
        value: (r) => r.activeUsers,
        render: (r) => fmtInt(r.activeUsers),
        total: () => fmtInt(users),
      },
      {
        key: 'perUser',
        header: t('Usage per user'),
        align: 'end',
        hint: t('Usage of the named users divided by the active users.'),
        calc: 'spend-month-usage-per-user',
        csvHeader: t('Usage per active user (USD)'),
        value: (r) => cents(r.perActiveUser),
        render: (r) => fmtUSD(r.perActiveUser),
      },
    );
    if (showPool) {
      cols.push({
        key: 'cost',
        header: t('Monthly cost'),
        align: 'end',
        hint: t('Seats plus overage: the larger of the pool size and the usage. A seat costs as much as the credits it includes.'),
        calc: 'monthly-cost',
        csvHeader: t('Monthly cost (USD)'),
        value: (r) => cents(r.cost),
        render: (r) => fmtUSD(r.cost, 0),
        total: (rs) => (rs.length && rs.every((r) => r.known) ? fmtUSD(sum(rs, (r) => r.cost), 0) : ''),
      });
    }
    cols.push({
      key: 'projected',
      header: t('Projected usage'),
      align: 'end',
      hint: t('For a month in progress: usage at the end of the month if the current pace holds.'),
      calc: 'projection',
      csvHeader: t('Projected usage (USD)'),
      value: (r) => (r.m.projection ? cents(r.m.projection.projGross) : null),
      render: (r) => {
        const p = r.m.projection;
        return p ? (
          <span title={t('Likely {low} to {high}', { low: fmtUSD(p.projGrossLow, 0), high: fmtUSD(p.projGrossHigh, 0) })}>{fmtUSD(p.projGross, 0)}</span>
        ) : (
          '–'
        );
      },
    });
    cols.push(...tokenColumns(hasTokens));
    return cols;
  }, [showPool, narrowed, billing, hasTokens, star, users]);

  const gapList = gaps.map(monthLabel).join(', ');

  return (
    <Card title={t('Usage and pool by month')} subtitle={t('Click a month to see its daily curve above.')} calc="spend-month-table">
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.m.key}
        defaultSort={{ key: 'month', dir: 'desc' }}
        exportName="github-copilot-usage-by-month"
        selectedKey={selected}
        onRowClick={(r) => onSelect(r.m.key)}
        emptyText={t('No billing month in the selected period')}
      />
      {(showPool && pool.capacityIsLowerBound) || gaps.length > 0 ? (
        <div className="mt-2 space-y-1 text-[11px] text-fg-subtle">
          {showPool && pool.capacityIsLowerBound ? (
            <p>
              <T
                text="* Counts only the seats that appear in the report. {link} for the real pool size."
                values={{
                  link: (
                    <button type="button" className="text-accent hover:underline" onClick={() => navigate('settings')}>
                      {t('Add your roster in Settings')}
                    </button>
                  ),
                }}
              />
            </p>
          ) : null}
          {gaps.length > 0 ? (
            <p>
              {tp(
                gaps.length,
                'No usage rows for {months}, so that month is not listed.',
                'No usage rows for {months}, so those months are not listed.',
                { months: gapList },
              )}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
