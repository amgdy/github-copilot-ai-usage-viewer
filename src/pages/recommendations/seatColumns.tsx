import { TaxBadge, type Column } from '../../components/ui';
import { t } from '../../i18n';
import type { PersonaId, TaxonomyItem } from '../../lib/analytics/taxonomy';
import { isoDate } from '../../lib/utils/date';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { BUSINESS_ALLOTMENT, type SeatRow } from './seatData';

type Personas = Record<PersonaId, TaxonomyItem<PersonaId>>;

/** User name that opens the user drawer. Roster seats that never appear (id -1) have no drawer, so they stay plain text. */
function UserLink({ id, name }: { id: number; name: string }) {
  const base = 'block max-w-[28ch] truncate text-start';
  if (id < 0) {
    return (
      <span className={base} title={name}>
        {name}
      </span>
    );
  }
  return (
    <button type="button" className={`${base} text-accent hover:underline`} title={t('Open {name}', { name })} onClick={() => useApp.getState().selectUser(id)}>
      {name}
    </button>
  );
}

const sumValue = (rows: SeatRow[]): string => fmtUSD(rows.reduce((a, r) => a + r.value, 0), 0);

const userColumn = (): Column<SeatRow> => ({ key: 'user', header: t('User'), value: (r) => r.name, render: (r) => <UserLink id={r.id} name={r.name} /> });

const planColumn = (): Column<SeatRow> => ({ key: 'plan', header: t('Plan'), value: (r) => r.plan });

const usageColumn = (): Column<SeatRow> => ({
  key: 'usage',
  header: t('Usage'),
  hint: t('Usage in the selected dates'),
  calc: 'usage',
  align: 'end',
  value: (r) => r.gross,
  render: (r) => fmtUSD(r.gross, 2),
  csvHeader: t('Usage (USD)'),
});

const valueColumn = (header: string, csvHeader: string, hint: string, calc: string): Column<SeatRow> => ({
  key: 'value',
  header,
  hint,
  calc,
  align: 'end',
  value: (r) => r.value,
  render: (r) => fmtUSD(r.value, 0),
  total: sumValue,
  csvHeader,
});

export function idleColumns(personas: Personas): Column<SeatRow>[] {
  return [
    userColumn(),
    planColumn(),
    usageColumn(),
    {
      key: 'used',
      header: t('Included credits used'),
      hint: t("Usage as a share of the user's own included credits"),
      calc: 'user-credits-used',
      align: 'end',
      value: (r) => r.utilization,
      render: (r) => fmtPct(r.utilization, 1),
    },
    {
      key: 'last',
      header: t('Last active'),
      hint: t('Last day with usage in the loaded files. Completions are not in the report.'),
      calc: 'rec-seat-last-active',
      value: (r) => (r.profile ? isoDate(r.profile.lastDay) : null),
    },
    {
      key: 'since',
      header: t('Days since last use'),
      hint: t('Days between the last usage and the end of the selected dates'),
      calc: 'user-days-since-last',
      align: 'end',
      value: (r) => r.profile?.daysSinceLast ?? null,
    },
    {
      key: 'persona',
      header: t('Persona'),
      calc: 'persona-groups',
      value: (r) => (r.profile ? (personas[r.profile.persona]?.label ?? '') : ''),
      render: (r) => (r.profile ? <TaxBadge item={personas[r.profile.persona]} /> : '–'),
    },
    valueColumn(t('Seat value'), t('Seat value (USD)'), t('Seat price per month'), 'seat-idle'),
  ];
}

export function downgradeColumns(): Column<SeatRow>[] {
  return [
    userColumn(),
    usageColumn(),
    {
      key: 'peak',
      header: t('Busiest month'),
      hint: t('Highest usage in any single month'),
      calc: 'rec-seat-busiest-month',
      align: 'end',
      value: (r) => r.profile?.peakMonthGross ?? null,
      render: (r) => (r.profile ? fmtUSD(r.profile.peakMonthGross, 2) : '–'),
      csvHeader: t('Busiest month (USD)'),
    },
    {
      key: 'share',
      header: t('Share of Business allotment'),
      hint: t('Busiest month as a share of the {allotment} of included credits in a Business seat', { allotment: fmtUSD(BUSINESS_ALLOTMENT, 0) }),
      calc: 'rec-seat-business-share',
      align: 'end',
      value: (r) => (r.profile ? r.profile.peakMonthGross / BUSINESS_ALLOTMENT : null),
      render: (r) => (r.profile ? fmtPct(r.profile.peakMonthGross / BUSINESS_ALLOTMENT, 0) : '–'),
    },
    valueColumn(t('Saving'), t('Saving (USD)'), t('Enterprise price minus Business price, per month'), 'seat-downgrade'),
  ];
}

export function unusedColumns(): Column<SeatRow>[] {
  return [userColumn(), planColumn(), valueColumn(t('Seat value'), t('Seat value (USD)'), t('Seat price per month'), 'seat-unused')];
}
