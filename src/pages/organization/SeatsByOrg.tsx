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
    const sum = (rows: OrgSeatRow[], f: (r: OrgSeatRow) => number) => rows.reduce((a, r) => a + f(r), 0);
    const everything = (rows: OrgSeatRow[]) => rows.length === data.rows.length;
    return [
      {
        key: 'org',
        header: t('Organization'),
        value: (r) => (r.known ? r.name : t('Organization not known')),
        render: (r) => <GroupName name={r.known ? r.name : t('Organization not known')} blank={!r.known} />,
        total: (rows) => (everything(rows) ? t('Total') : t('Total of {n} matching', { n: fmtInt(rows.length) })),
      },
      {
        key: 'seats',
        header: t('Seats'),
        hint: t('Seats in the license list. A seat counts in the first organization the list names for it.'),
        calc: 'org-seats',
        align: 'end',
        value: (r) => r.seats,
        render: (r) => fmtInt(r.seats),
        total: (rows) => fmtInt(sum(rows, (r) => r.seats)),
      },
      {
        key: 'used',
        header: t('Used'),
        hint: t('Seats whose holder has usage in this view'),
        calc: 'org-seats-used',
        align: 'end',
        value: (r) => r.used,
        render: (r) => fmtInt(r.used),
        total: (rows) => fmtInt(sum(rows, (r) => r.used)),
      },
      {
        key: 'unused',
        header: t('No usage'),
        hint: t('Seats whose holder has no usage in this view. Code completions are not in the report, so check activity on the Licenses page first.'),
        calc: 'org-seats-unused',
        align: 'end',
        value: (r) => r.unused,
        render: (r) => (r.unused > 0 ? <span className="text-warn">{fmtInt(r.unused)}</span> : fmtInt(r.unused)),
        total: (rows) => fmtInt(sum(rows, (r) => r.unused)),
      },
      {
        key: 'noSeat',
        header: t('Users without a seat'),
        hint: t('People with usage in this view who hold no seat in the license list'),
        calc: 'org-no-seat',
        align: 'end',
        value: (r) => r.noSeat,
        render: (r) => fmtInt(r.noSeat),
        total: (rows) => fmtInt(sum(rows, (r) => r.noSeat)),
      },
      {
        key: 'seatCost',
        header: t('Seat cost / month'),
        hint: t('What the seats cost per month at the seat prices'),
        calc: 'org-seat-cost',
        align: 'end',
        value: (r) => r.seatCost,
        render: (r) => fmtUSD(r.seatCost),
        total: (rows) => fmtUSD(sum(rows, (r) => r.seatCost)),
      },
      {
        key: 'perSeat',
        header: t('Usage per seat / month'),
        hint: t('Usage of the seat holders in a 30.4-day month, divided by the seats'),
        calc: 'org-usage-per-seat',
        align: 'end',
        value: (r) => (Number.isFinite(r.perSeat) ? r.perSeat : null),
        render: (r) => (Number.isFinite(r.perSeat) ? fmtUSD(r.perSeat) : DASH),
        total: (rows) => {
          const seats = sum(rows, (r) => r.seats);
          return seats > 0 ? fmtUSD((sum(rows, (r) => r.holderUsage) * perMonth) / seats) : DASH;
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
        render: (r) =>
          r.value === null ? null : (
            <button
              type="button"
              className="btn btn-sm"
              title={t('Filter the whole report to {name}', { name: r.name })}
              onClick={() => drill(filterPatch('org', r.value ?? ''), { merge: true })}
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
  if (data.rows.some((r) => !r.known)) {
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
      footer={notes.length ? notes.map((n) => <p key={n}>{n}</p>) : undefined}
    >
      <div className="space-y-3">
        <DataTable
          rows={data.rows}
          columns={columns}
          rowKey={(r) => r.key}
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
