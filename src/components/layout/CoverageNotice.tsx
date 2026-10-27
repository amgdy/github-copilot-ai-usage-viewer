import { useMemo } from 'react';
import { t } from '../../i18n';
import { coverageIssues } from '../../lib/analytics/coverage';
import { useAnalysis } from '../../state/analysis';
import { navigate, useRoute } from '../../state/router';
import { Callout } from '../ui';

/**
 * Tells the reader, on every page, when the loaded files lack columns that figures depend on
 * (what was billed, seat sizes, usernames). Only problems that change numbers on screen are shown here;
 * the Data page lists the rest.
 */
export function CoverageNotice() {
  const page = useRoute();
  const { analysis } = useAnalysis();
  const issues = useMemo(() => coverageIssues(analysis.coverage, analysis.users.fallbackQuotaCredits).filter((issue) => issue.severity === 'warn'), [analysis.coverage, analysis.users.fallbackQuotaCredits]);
  if (issues.length === 0 || page === 'data') return null;
  return (
    <Callout
      tone="warn"
      className="mb-4"
      title={issues.length === 1 ? issues[0].title : t('The file is missing columns that some numbers depend on')}
      action={
        <button type="button" className="btn btn-sm" onClick={() => navigate('data')}>
          {t('Details')}
        </button>
      }
    >
      {issues.length === 1 ? (
        issues[0].detail
      ) : (
        <ul className="list-disc space-y-0.5 ps-4">
          {issues.map((issue) => (
            <li key={issue.id}>{issue.title}</li>
          ))}
        </ul>
      )}
    </Callout>
  );
}
