import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DataTable, EmptyState, taxLookup } from '../../components/ui';
import { t } from '../../i18n';
import { DOWNGRADE_HEADROOM } from '../../lib/analytics/seats';
import { isoDate } from '../../lib/utils/date';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { NarrowedNotice } from '../shared';
import { SeatEconomicsCard } from './SeatEconomicsCard';
import { SeatListCard } from './SeatListCard';
import { downgradeColumns, idleColumns, unusedColumns } from './seatColumns';
import { BUSINESS_ALLOTMENT, DOWNGRADE_LIMIT, DOWNGRADE_SAVING, seatCashEffect, seatRows, type SeatRow } from './seatData';

const rowKey = (r: SeatRow): string | number => (r.id >= 0 ? r.id : `roster:${r.name}`);

/** Seats that could be reclaimed or moved to a cheaper plan, with what each action is worth. */
export function SeatsTab() {
  const { analysis, settings, taxonomy } = useAnalysis();
  const { users, seats, range } = analysis;
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);
  const idle = useMemo(() => seatRows(seats.idle, users), [seats.idle, users]);
  const downgrade = useMemo(() => seatRows(seats.downgrade, users), [seats.downgrade, users]);
  const unused = useMemo(() => seatRows(seats.unused, users), [seats.unused, users]);
  const idleCols = useMemo(() => idleColumns(personas), [personas]);
  const downgradeCols = useMemo(downgradeColumns, []);
  const unusedCols = useMemo(unusedColumns, []);
  const cash = useMemo(
    () => ({
      idle: seatCashEffect(analysis, seats.idleValue),
      downgrade: seatCashEffect(analysis, seats.downgradeValue),
      unused: seatCashEffect(analysis, seats.unusedValue),
    }),
    [analysis, seats],
  );
  const stamp = `${isoDate(range.start)}_${isoDate(range.end)}`;

  if (analysis.narrowed) {
    return (
      <NarrowedNotice title={t('Seat lists are not shown for a filtered view')}>
        {t('Seats belong to the whole organization and included credits are shared, so a filter cannot show which seats are idle or what a change would save. Clear the row and segment filters (the date range can stay) to see the lists.')}
      </NarrowedNotice>
    );
  }

  return (
    <div className="space-y-4">
      <SeatEconomicsCard />

      <SeatListCard
        title={t('Idle seats')}
        count={idle.length}
        value={seats.idleValue}
        cash={cash.idle}
        calc={['seat-idle', 'rec-seat-cash']}
        rule={t(
          'A seat is listed when its user used less than {share} of their own included credits in these dates and is either dormant (low intensity and few active days) or lapsed (no usage for {days} days or more after earlier use). New users are never listed.',
          { share: fmtPct(settings.tiers.minimal, 0), days: settings.lapsedDays },
        )}
        caveat={t(
          "This report has no seat-assignment or completions data. A seat that only uses code completions can look idle here. Check the user's last activity in GitHub before you remove a seat.",
        )}
      >
        {idle.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title={t('No seat qualifies as idle')}
            description={t('Everyone either uses a meaningful share of their included credits, is active regularly, or is new.')}
          />
        ) : (
          <DataTable
            rows={idle}
            columns={idleCols}
            rowKey={rowKey}
            defaultSort={{ key: 'since', dir: 'desc' }}
            pageSize={10}
            dense
            fixedColumns
            searchable={idle.length > 10}
            searchPlaceholder={t('Search idle seats')}
            exportName={`github-copilot-idle-seats_${stamp}`}
          />
        )}
      </SeatListCard>

      <SeatListCard
        title={t('Enterprise seats that fit Business')}
        count={downgrade.length}
        value={seats.downgradeValue}
        cash={cash.downgrade}
        calc={['seat-downgrade', 'rec-seat-cash']}
        rule={t(
          'An Enterprise user is listed when their busiest month stayed at or below {headroom} of the Business allotment ({limit} of {allotment} of included credits), so a Business seat would still have {spare} to spare. Idle seats and new users are left out. Each move saves {saving} a month.',
          {
            headroom: fmtPct(DOWNGRADE_HEADROOM, 0),
            limit: fmtUSD(DOWNGRADE_LIMIT, 2),
            allotment: fmtUSD(BUSINESS_ALLOTMENT, 0),
            spare: fmtPct(1 - DOWNGRADE_HEADROOM, 0),
            saving: fmtUSD(DOWNGRADE_SAVING, 0),
          },
        )}
        caveat={t(
          'This report has no seat-assignment or completions data. It also cannot show which Enterprise-only features a user relies on. Check last activity and feature use in GitHub before you move a seat.',
        )}
      >
        {downgrade.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title={t('No Enterprise seat qualifies')}
            description={t('Either nobody has an Enterprise seat in this report, or every Enterprise user came close to the Business allotment in at least one month.')}
          />
        ) : (
          <DataTable
            rows={downgrade}
            columns={downgradeCols}
            rowKey={rowKey}
            defaultSort={{ key: 'peak', dir: 'asc' }}
            pageSize={10}
            dense
            fixedColumns
            searchable={downgrade.length > 10}
            searchPlaceholder={t('Search Enterprise seats')}
            exportName={`github-copilot-enterprise-seats-that-fit-business_${stamp}`}
          />
        )}
      </SeatListCard>

      <SeatListCard
        title={t('Roster seats that never appear')}
        count={unused.length}
        value={seats.unusedValue}
        cash={cash.unused}
        calc={['seat-unused', 'rec-seat-cash']}
        rule={t(
          'A seat is listed when its user is in the seat roster from Settings but never appears in the loaded files. Seat value follows the plan in the roster, or the typical seat size in the report when the roster has no plan.',
        )}
        caveat={t(
          'This report has no seat-assignment or completions data. A roster seat can be missing here because its user only uses code completions, or because the loaded files do not cover every billing entity. Check last activity in GitHub before you remove the seat.',
        )}
      >
        {settings.roster.length === 0 ? (
          <EmptyState
            title={t('No seat roster loaded')}
            description={t('Add your seat roster in Settings to find seats that never appear in the report.')}
            action={
              <button type="button" className="btn btn-primary" onClick={() => navigate('settings')}>
                {t('Open Settings')}
              </button>
            }
          />
        ) : unused.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={22} />}           title={t('No roster seat can be marked unused from the available data')} />
        ) : (
          <DataTable
            rows={unused}
            columns={unusedCols}
            rowKey={rowKey}
            defaultSort={{ key: 'value', dir: 'desc' }}
            pageSize={10}
            dense
            fixedColumns
            searchable={unused.length > 10}
            searchPlaceholder={t('Search roster seats')}
            exportName={`github-copilot-roster-seats-never-seen_${stamp}`}
          />
        )}
      </SeatListCard>
    </div>
  );
}
