import { useMemo } from 'react';
import { Download, UsersRound } from 'lucide-react';
import { NoRows } from '../components/NoRows';
import { Card, EmptyState, PageHeader } from '../components/ui';
import { userActionRows } from '../lib/analytics/tips';
import { fmtDay } from '../lib/utils/date';
import { downloadCsv } from '../lib/utils/download';
import { pluralize } from '../lib/utils/format';
import { msg, t } from '../i18n';
import { useAnalysis } from '../state/analysis';
import { clearNarrowing } from './shared';
import { AttentionLists } from './users/AttentionLists';
import { AutoStrip } from './users/AutoStrip';
import { buildColumns, userTableCsv } from './users/columns';
import { ConcentrationCard } from './users/ConcentrationCard';
import { KpiRow } from './users/KpiRow';
import { NeverUsedCard } from './users/NeverUsedCard';
import { RankingCard } from './users/RankingCard';
import { ScatterCard } from './users/ScatterCard';
import { SegmentChips } from './users/SegmentChips';
import { UsersTable } from './users/UsersTable';

const DESCRIPTION = msg('Who uses GitHub Copilot, how much, and who needs attention.');

export default function UsersPage() {
  const { analysis, settings, taxonomy } = useAnalysis();
  const { range, agg, users, coverage } = analysis;
  const trendReliable = users.trendReliable;
  const hasLicense = analysis.licenses !== null;
  const columns = useMemo(
    () => buildColumns({ taxonomy, trendReliable, coverage, hasLicense }),
    [taxonomy, trendReliable, coverage, hasLicense],
  );

  if (agg.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t('Users')} description={t(DESCRIPTION)} />
        <NoRows />
      </>
    );
  }

  const hasUsers = users.profiles.length > 0;

  const downloadActionList = () => {
    const table = userActionRows(users, settings);
    downloadCsv('github-copilot-user-action-list', table.headers, table.rows);
  };
  const downloadUserTable = () => {
    const table = userTableCsv(columns.all, users.profiles);
    downloadCsv('github-copilot-user-table', table.headers, table.rows);
  };
  const viewNote = t('{users} from {start} to {end}.', {
    users: pluralize(users.profiles.length, 'user'),
    start: fmtDay(range.start, true),
    end: fmtDay(range.end, true),
  });

  return (
    <>
      <PageHeader
        title={t('Users')}
        description={`${t(DESCRIPTION)} ${viewNote}`}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={downloadUserTable}
              disabled={!hasUsers}
              title={columns.hasLicense ? t('Every column of the General, Tokens, Auto and License views for every user in this view') : t('Every column of the General, Tokens and Auto views for every user in this view')}
            >
              <Download size={14} /> {t('Download user table')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={downloadActionList}
              disabled={!hasUsers}
              title={t('One row per user with the suggested next step')}
            >
              <Download size={14} /> {t('Download action list')}
            </button>
          </>
        }
      />
      <div className="space-y-4">
        <AutoStrip />
        {hasUsers ? <KpiRow /> : null}
        <SegmentChips />
        {hasUsers ? (
          <>
            <RankingCard />
            <div className="grid gap-4 xl:grid-cols-2">
              <ConcentrationCard />
              <ScatterCard />
            </div>
            <AttentionLists />
            <UsersTable columns={columns} />
            <NeverUsedCard />
          </>
        ) : (
          <Card>
            <EmptyState
              icon={<UsersRound size={24} />}
              title={t('No users match these filters')}
              description={t('The user group filters, such as persona, usage tier or Auto use class, leave nobody in this view. Clear them to see everyone again.')}
              action={
                <button type="button" className="btn btn-primary" onClick={clearNarrowing}>
                  {t('Clear filters')}
                </button>
              }
            />
          </Card>
        )}
      </div>
    </>
  );
}
