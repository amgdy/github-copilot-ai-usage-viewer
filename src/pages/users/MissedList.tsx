import { useMemo } from 'react';
import { taxLookup } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { Block } from './StripBlock';

const LIST_SIZE = 5;
const MIN_MISSED = 0.005;

export function MissedList() {
  const { analysis, taxonomy } = useAnalysis();
  const profiles = analysis.users.profiles;
  const classes = useMemo(() => taxLookup(taxonomy.autoUse), [taxonomy]);

  const { top, count } = useMemo(() => {
    const withMissed = profiles.filter((p) => p.autoMissed > MIN_MISSED);
    withMissed.sort((a, b) => b.autoMissed - a.autoMissed || b.directBilled - a.directBilled);
    return { top: withMissed.slice(0, LIST_SIZE), count: withMissed.length };
  }, [profiles]);

  return (
    <Block title={t('Users with the most missed discount')} calc={['user-missed-list', 'auto-missed', 'auto-plan-rate']}>
      {top.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('Nobody in this view has hand-picked usage with a missed discount.')}</p>
      ) : (
        <>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {top.map((p) => (
              <li key={p.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => useApp.getState().selectUser(p.id)}
                  className="block w-full min-w-0 rounded-md border border-border-muted bg-surface-2 px-2.5 py-2 text-start transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="num block text-base font-semibold text-warn">{fmtUSD(p.autoMissed)}</span>
                  <span className="num block truncate text-xs text-fg-muted">
                    {t('{amount} hand-picked · {share} on Auto', { amount: fmtUSD(p.directBilled, 0), share: fmtPct(p.autoShare, 0) })}
                  </span>
                  <span className="block truncate text-xs text-fg-subtle">{classes[p.autoUse]?.label ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-fg-subtle">
            {count > top.length
              ? t('The {n} users with the most of {total} who have a missed discount. Click a user to see the details.', {
                  n: fmtInt(top.length),
                  total: fmtInt(count),
                })
              : tp(
                  count,
                  'The one user with a missed discount. Click the user to see the details.',
                  'All {n} users with a missed discount. Click a user to see the details.',
                  { n: fmtInt(count) },
                )}
          </p>
        </>
      )}
    </Block>
  );
}
