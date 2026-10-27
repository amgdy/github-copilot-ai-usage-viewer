import { useMemo } from 'react';
import { CalcInfo } from '../../components/ui';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { NarrowedNotice, usePerMonth } from '../shared';
import { PlanCard } from './PlanCard';
import { PlaybookItemCard } from './PlaybookItemCard';
import { playbookGroups } from './plan';

/** The 30/60/90-day plan and the habit playbook for admins and users, with what each habit is worth in this report. */
export function PlaybookTab() {
  const { analysis, store } = useAnalysis();
  const perMonth = usePerMonth();
  const ctx = useMemo(
    () => ({ hasTokens: store.hasTokens, shiftRows: analysis.plan.levers.shiftRows.length, longPremium: analysis.agg.totals.longPremium }),
    [store.hasTokens, analysis.plan.levers.shiftRows.length, analysis.agg.totals.longPremium],
  );
  const groups = useMemo(() => playbookGroups(analysis, perMonth, ctx), [analysis, perMonth, ctx]);

  return (
    <div className="space-y-5">
      <NarrowedNotice title={t('The plan and the savings cover only the selected rows')}>
        {t('Savings are the usage that each habit avoids in the selected rows. Cash savings are not shown for a filtered view, because included credits are shared by the whole organization.')}
      </NarrowedNotice>

      <PlanCard />

      {groups.map((g) => (
        <section key={g.audience} aria-labelledby={`playbook-${g.audience}`} className="space-y-2">
          <div>
            <h2 id={`playbook-${g.audience}`} className="text-base font-semibold">
              {t(g.title)}
            </h2>
            <p className="text-sm text-fg-muted">{t(g.description)}</p>
          </div>
          <ul className="grid gap-3 lg:grid-cols-2">
            {g.entries.map((e) => (
              <PlaybookItemCard key={e.item.id} entry={e} />
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-fg-subtle">
        {t(
          'Savings are what the matching lever avoids on its own, in usage per month, using the Balanced assumptions of the What-if simulator. Several habits share one lever and levers overlap, so the figures are not added up. Whether less usage saves cash depends on the pool. Habits without a figure cannot be measured from this report.',
        )}{' '}
        <CalcInfo id="rec-playbook-saving" />
      </p>
    </div>
  );
}
