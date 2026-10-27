import { useMemo } from 'react';
import { ListFilter } from 'lucide-react';
import { Card, DataTable, DocLinks, type Column } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill, navigate } from '../../state/router';
import { usePerMonth } from '../shared';
import { GroupName } from './bits';
import { filterPatch } from './dimensions';
import { seatCoverageByOrg, type OrgSeatRow } from './seats';

const DASH = <span className="text-fg-subtle">–</span>;

/** Seats of the license list next to the usage of each organization: how many are used and what they cost. */
export function SeatsByOrg() {
  const { analysis, store, settings } = useAnalysis();
  const { population, narrowed, licenses } = analysis;
  const perMonth = usePerMonth();

  // The users of the row-filtered report, as on the Licenses page, so that both pages count the same seats as used.
  const data = useMemo(
    () =>
      licenses === null
        ? null
        : seatCoverageByOrg({
            users: population,
            population,
            roster: settings.roster,
            rosterAsOf: settings.rosterAsOf,
            orgValues: store.dicts.org.values,
            perMonth,
          }),
    [licenses, population, settings.roster, settings.rosterAsOf, store, perMonth],
  );

  const columns = useMemo<Column<OrgSeatRow>[]>(() => {
    if (data === null) return [];
    const sum = (rows: OrgSeatRow[], getValue: (row: OrgSeatRow) => number) => rows.reduce((total, row) => total + getValue(row), 0);
    const everything = (rows: OrgSeatRow[]) => rows.length === data.rows.length;
    return [
      {
        key: 'org',
        header: t('Organization'),
        value: (row) => (row.known ? row.name : t('Organization not known')),
        render: (row) => <GroupName name={row.known ? row.name : t('Organization not known')} blank={!row.known} />,
        total: (rows) => (everything(rows) ? t('Total') : t('Total of {n} matching', { n: fmtInt(rows.length) })),
      },
      {
        key: 'seats',
        header: t('Seats'),
        hint: t('Seats in the license list. A seat counts in the first organization the list names for it.'),
        calc: 'org-seats',
        align: 'end',
        value: (row) => row.seats,
        render: (row) => fmtInt(row.seats),
        total: (rows) => fmtInt(sum(rows, (row) => row.seats)),
      },
      {
        key: 'used',
        header: t('Used'),
        hint: t('Seats whose holder has usage in this view'),
        calc: 'org-seats-used',
        align: 'end',
        value: (row) => row.used,
        render: (row) => fmtInt(row.used),
        total: (rows) => fmtInt(sum(rows, (row) => row.used)),
      },
      {
        key: 'unused',
        header: t('No usage'),
        hint: t('Seats whose holder has no usage in this view. Code completions are not in the report, so check activity on the Licenses page first.'),
        calc: 'org-seats-unused',
        align: 'end',
        value: (row) => row.unused,
        render: (row) => (row.unused > 0 ? <span className="text-warn">{fmtInt(row.unused)}</span> : fmtInt(row.unused)),
        total: (rows) => fmtInt(sum(rows, (row) => row.unused)),
      },
      {
        key: 'noSeat',
        header: t('Users without a seat'),
        hint: t('People with usage in this view who hold no seat in the license list'),
        calc: 'org-no-seat',
        align: 'end',
        value: (row) => row.noSeat,
        render: (row) => fmtInt(row.noSeat),
        total: (rows) => fmtInt(sum(rows, (row) => row.noSeat)),
      },
      {
        key: 'seatCost',
        header: t('Seat cost / month'),
        hint: t('What the seats cost per month at the seat prices'),
        calc: 'org-seat-cost',
        align: 'end',
        value: (row) => row.seatCost,
        render: (row) => fmtUSD(row.seatCost),
        total: (rows) => fmtUSD(sum(rows, (row) => row.seatCost)),
      },
      {
        key: 'perSeat',
        header: t('Usage per seat / month'),
        hint: t('Usage of the seat holders in a 30.4-day month, divided by the seats'),
        calc: 'org-usage-per-seat',
        align: 'end',
        value: (row) => (Number.isFinite(row.perSeat) ? row.perSeat : null),
        render: (row) => (Number.isFinite(row.perSeat) ? fmtUSD(row.perSeat) : DASH),
        total: (rows) => {
          const seats = sum(rows, (row) => row.seats);
          return seats > 0 ? fmtUSD((sum(rows, (row) => row.holderUsage) * perMonth) / seats) : DASH;
        },
      },
      {
        key: 'filter',
        header: <span className="sr-only">{t('Filter')}</span>,
        csvHeader: t('Filter'),
        noCsv: true,
        sortable: false,
        align: 'end',
        value: () => null,
        render: (row) =>
          row.value === null ? null : (
            <button
              type="button"
              className="btn btn-sm"
              title={t('Filter the whole report to {name}', { name: row.name })}
              onClick={() => drill(filterPatch('org', row.value ?? ''), { merge: true })}
            >
              <ListFilter size={12} /> {t('Filter')}
            </button>
          ),
      },
    ];
  }, [data, perMonth]);

  if (data === null || data.rows.length === 0) return null;

  const notes: string[] = [];
  if (narrowed) {
    notes.push(
      t(
        'Filters are active. Seats and seat cost cover the whole license list. Used seats, users without a seat and usage follow the dates and row filters, as on the Licenses page, so a seat whose holder is outside them counts as a seat with no usage.',
      ),
    );
  }
  if (data.multiOrg > 0) {
    notes.push(
      tp(
        data.multiOrg,
        'The license list names more than one organization for 1 seat. It counts in the first one.',
        'The license list names more than one organization for {n} seats. Each counts in the first one.',
        { n: fmtInt(data.multiOrg) },
      ),
    );
  }
  if (data.rows.some((row) => !row.known)) {
    notes.push(t('Organization not known: the license list names no organization for the seat, and the report names none for its holder.'));
  }

  return (
    <Card
      title={t('Seats by organization')}
      subtitle={t('Seats of the license list next to the usage of each organization. Seats with no usage are the first place to look for savings.')}
      calc="org-seat-coverage"
      actions={
        <button type="button" className="btn btn-sm" onClick={() => navigate('licenses')}>
          {t('Open Licenses')}
        </button>
      }
      footer={notes.length ? notes.map((note) => <p key={note}>{note}</p>) : undefined}
    >
      <div className="space-y-3">
        <DataTable
          rows={data.rows}
          columns={columns}
          rowKey={(row) => row.key}
          defaultSort={{ key: 'seatCost', dir: 'desc' }}
          pageSize={10}
          searchable={data.rows.length > 10}
          searchPlaceholder={t('Search organizations…')}
          exportName="github-copilot-seats-by-organization"
          emptyText={t('No seats in the license list.')}
        />
        <DocLinks topic="seats" title={t('Learn more')} compact />
      </div>
    </Card>
  );
}
