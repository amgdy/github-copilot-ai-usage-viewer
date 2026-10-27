import { useMemo, type ReactNode } from 'react';
import { Card, DataTable, DocLinks, Segmented, type Column } from '../../components/ui';
import { t } from '../../i18n';
import type { LicenseReport } from '../../lib/licenses';
import type { LinkId } from '../../lib/links';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { useAnalysis } from '../../state/analysis';
import {
  LIST_ORDER,
  findingFields,
  findingsOf,
  fmtIsoDay,
  listCalc,
  listCount,
  listDescription,
  listExportName,
  listLabel,
  planText,
  profileIds,
  unmatchedFields,
  type Cell,
  type Field,
  type ListId,
} from './model';

const LIST_LINKS: Partial<Record<ListId, readonly LinkId[]>> = {
  reclaim: ['remindInactive', 'seatAssignment'],
  fading: ['remindInactive'],
  'no-date': ['activityReport', 'seatAssignment'],
  unmatched: ['grantAccess', 'seatAssignment'],
};

function cellOf(format: Field<unknown>['format'], cell: Cell, inReport: boolean): ReactNode {
  if (cell === null || cell === '') return <span className="text-fg-subtle">–</span>;
  switch (format) {
    case 'usd':
      return <span className="num">{fmtUSD(Number(cell))}</span>;
    case 'int':
      return <span className="num">{fmtInt(Number(cell))}</span>;
    case 'date':
      return <span className="num">{fmtIsoDay(String(cell))}</span>;
    case 'plan':
      return planText(String(cell)) || '–';
    case 'user':
      return <span className={inReport ? 'font-medium text-accent' : 'font-medium'}>{String(cell)}</span>;
    default:
      return String(cell);
  }
}

function columnsOf<T>(fields: readonly Field<T>[], inReport: (row: T) => boolean): Column<T>[] {
  return fields.map((field) => ({
    key: field.key,
    header: field.header,
    csvHeader: field.csvHeader,
    hint: field.hint,
    calc: field.calc,
    align: field.align,
    hidden: field.hidden,
    value: field.value,
    render: (row: T) => cellOf(field.format, field.value(row), inReport(row)),
    total: field.sum ? (rows: T[]) => <span className="num">{fmtUSD(rows.reduce((sum, row) => sum + Number(field.value(row) ?? 0), 0))}</span> : undefined,
  }));
}

/** The seat lists in impact order, one tab each, with the CSV of each list. */
export function LicenseLists({ report, list, onList }: { report: LicenseReport; list: ListId; onList: (id: ListId) => void }) {
  const { analysis } = useAnalysis();
  const ids = useMemo(() => profileIds(analysis.population.profiles), [analysis.population.profiles]);
  const open = (login: string) => {
    const id = ids.get(login.trim().toLowerCase());
    if (id !== undefined) useApp.getState().selectUser(id);
  };
  const links = LIST_LINKS[list];
  const empty = t('No seats on this list.');

  return (
    <Card title={t('Seat lists')} subtitle={listDescription(list)} calc={listCalc(list)}>
      <div className="space-y-3">
        <Segmented<ListId>
          label={t('Seat lists')}
          size="sm"
          value={list}
          onChange={onList}
          options={LIST_ORDER.map((id) => ({ value: id, label: `${listLabel(id)} · ${fmtInt(listCount(report, id))}` }))}
        />
        {list === 'unmatched' ? (
          <DataTable
            key={list}
            rows={report.unmatched}
            columns={columnsOf(unmatchedFields(), (user) => ids.has(user.name.trim().toLowerCase()))}
            rowKey={(user) => user.name}
            exportName={listExportName(list)}
            searchable
            onRowClick={(user) => open(user.name)}
            emptyText={empty}
            dense
          />
        ) : (
          <DataTable
            key={list}
            rows={findingsOf(report, list)}
            columns={columnsOf(findingFields(list), (finding) => finding.inReport)}
            rowKey={(finding) => finding.login}
            exportName={listExportName(list)}
            searchable
            onRowClick={(finding) => open(finding.login)}
            emptyText={empty}
            dense
          />
        )}
        {links ? <DocLinks ids={links} title={t('Learn more')} compact /> : null}
      </div>
    </Card>
  );
}
