import { Kpi, KpiGrid } from '../../components/ui';
import { t, tp } from '../../i18n';
import { dataCoverage } from '../../lib/analytics/coverage';
import type { DataStore } from '../../lib/types';
import { isoDate } from '../../lib/utils/date';
import { fmtInt, pluralize } from '../../lib/utils/format';
import { sumFiles, type Gaps } from './quality';
import type { DimScan, StoreScan } from './scan';
import { fmtBytes, fmtMoney } from './text';

interface Props {
  store: DataStore;
  scan: StoreScan;
  gaps: Gaps;
}

/** "Set on every row", "Empty on every row" or the count of rows without a value, written by `missing`. */
function blankNote(dimension: DimScan, rows: number, missing: (blankRows: number) => string): string {
  if (dimension.blankRows === 0) return t('Set on every row');
  if (dimension.blankRows === rows) return t('Empty on every row');
  return missing(dimension.blankRows);
}

export function KpiRow({ store, scan, gaps }: Props) {
  const files = store.files;
  const totals = sumFiles(files);
  const billing = dataCoverage(store).billing;
  const span = scan.daysSeen.length;
  const empty = span - scan.daysWithData;
  const size = files.reduce((sum, file) => sum + file.size, 0);
  const { user, model, org, costCenter, repo } = scan.dims;

  const rowNote = [
    t('{n} rows read', { n: fmtInt(totals.read) }),
    tp(totals.duplicates, '{n} duplicate dropped', '{n} duplicates dropped', { n: fmtInt(totals.duplicates) }),
    ...(totals.badDates ? [tp(totals.badDates, '{n} bad date', '{n} bad dates', { n: fmtInt(totals.badDates) })] : []),
  ].join(' · ');
  const credits = fmtInt(Math.round(scan.qty));

  return (
    <KpiGrid>
      <Kpi
        label={t('Total usage')}
        value={fmtMoney(scan.gross)}
        sub={
          billing
            ? t('{credits} AI credits · {billed} billed', { credits, billed: fmtMoney(scan.net) })
            : t('{credits} AI credits · billed amount not in the file', { credits })
        }
        hint={t('Usage of all rows kept, including the part covered by included credits. One AI credit is $0.01. Billed is the part charged on top of seats.')}
        calc="data-total-usage"
      />
      <Kpi
        label={t('Users')}
        value={fmtInt(user.distinct)}
        sub={
          user.blankRows === 0
            ? t('Every row has a username')
            : blankNote(user, scan.rows, (blankRows) => tp(blankRows, '{n} row has no username', '{n} rows have no username', { n: fmtInt(blankRows) }))
        }
        hint={t('Distinct usernames. Rows without a username, such as repository-level products, are counted separately.')}
        calc="data-users"
      />
      <Kpi
        label={t('Date span')}
        value={pluralize(span, 'day')}
        tone={gaps.missingWeekdays > 0 ? 'warn' : 'neutral'}
        sub={
          <>
            {span === 1 ? isoDate(store.minDay) : t('{from} to {to}', { from: isoDate(store.minDay), to: isoDate(store.maxDay) })}
            <br />
            {empty === 0
              ? span === 1
                ? t('One day of data')
                : t('Every day has rows')
              : t('{n} with rows, {m} empty', { n: fmtInt(scan.daysWithData), m: fmtInt(empty) })}
          </>
        }
        hint={t('First to last day with rows. Weekdays inside the span without rows are flagged in the checks below. Quiet weekends are normal.')}
        calc="data-date-span"
      />
      <Kpi
        label={t('Rows kept')}
        value={fmtInt(store.n)}
        tone={totals.badDates > 0 ? 'warn' : 'neutral'}
        sub={rowNote}
        hint={t('Rows in the dataset. Rows read, minus rows already loaded from another file (duplicates) and rows whose date could not be read.')}
        calc="data-rows-kept"
      />
      <Kpi
        label={t('Files')}
        value={fmtInt(files.length)}
        sub={t('{size} in total', { size: fmtBytes(size) })}
        hint={t('CSV files loaded together. Their rows are joined into one dataset.')}
        calc="data-files"
      />
      <Kpi
        label={t('Models')}
        value={fmtInt(model.distinct)}
        sub={blankNote(model, scan.rows, (blankRows) => tp(blankRows, '{n} row has no model', '{n} rows have no model', { n: fmtInt(blankRows) }))}
        hint={t('Distinct model names. The Auto prefix is removed from the name and the row is marked as an Auto row.')}
        calc="data-models"
      />
      <Kpi
        label={t('Organizations')}
        value={fmtInt(org.distinct)}
        sub={blankNote(org, scan.rows, (blankRows) => tp(blankRows, '{n} row has no organization', '{n} rows have no organization', { n: fmtInt(blankRows) }))}
        hint={t('Distinct organizations in the data.')}
        calc="data-distinct-values"
      />
      <Kpi
        label={t('Cost centers')}
        value={fmtInt(costCenter.distinct)}
        sub={blankNote(costCenter, scan.rows, (blankRows) => tp(blankRows, '{n} row has no cost center', '{n} rows have no cost center', { n: fmtInt(blankRows) }))}
        hint={t('Distinct cost centers in the data.')}
        calc="data-distinct-values"
      />
      <Kpi
        label={t('Repositories')}
        value={fmtInt(repo.distinct)}
        sub={blankNote(repo, scan.rows, (blankRows) => tp(blankRows, '{n} row has no repository', '{n} rows have no repository', { n: fmtInt(blankRows) }))}
        hint={t('Distinct repositories in the data. Rows without a repository are counted separately.')}
        calc="data-distinct-values"
      />
    </KpiGrid>
  );
}
