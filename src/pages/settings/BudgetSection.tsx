import { Wallet } from 'lucide-react';
import { Callout, Card, DocLinks } from '../../components/ui';
import { DEFAULT_SETTINGS } from '../../lib/analytics/settings';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { msg, t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { LIMITS } from './limits';
import { NumInput } from './NumInput';
import { SettingsSection } from './SettingsSection';

const USES: { where: string; what: string }[] = [
  { where: msg('Usage and pool'), what: msg('The budget card compares the amount billed so far this month, and the projected month end, with this amount.') },
  { where: msg('Overview'), what: msg('The included credits card shows how much of the budget is used.') },
  {
    where: msg('Recommendations'),
    what: msg('The app warns when the projected billed amount passes the budget. When no budget is set and the report shows billed usage, runaway users or a pool that runs out, it suggests setting one.'),
  },
];

/** Compares the budget with the latest month. Only mounted when a report is loaded. */
function BudgetStatus() {
  const { analysis } = useAnalysis();
  const b = analysis.pool.budget;
  if (!b) return <p className="text-xs text-fg-subtle">{t('The comparison with the latest month appears here once a budget is saved.')}</p>;
  const values = { month: b.month, billed: fmtUSD(b.billedToDate), budget: fmtUSD(b.monthlyBudget), share: fmtPct(b.burn, 0) };
  return (
    <p className="text-sm">
      {b.projectedBilled !== null && b.projectedBurn !== null
        ? t('{month}: {billed} billed so far of {budget} ({share}), projected to reach {projected} ({projectedShare}) by month end.', {
            ...values,
            projected: fmtUSD(b.projectedBilled),
            projectedShare: fmtPct(b.projectedBurn, 0),
          })
        : t('{month}: {billed} billed so far of {budget} ({share}).', values)}
    </p>
  );
}

export function BudgetSection() {
  const budget = useApp((s) => s.settings.budgetMonthlyBilled);
  const hasData = useApp((s) => s.dataset !== null);
  const updateSettings = useApp((s) => s.updateSettings);

  const commit = (v: number | null): string | null => {
    if (v !== null && v <= 0) return t('Enter an amount above 0, or leave the field empty for no budget.');
    updateSettings({ budgetMonthlyBilled: v });
    return null;
  };

  return (
    <SettingsSection
      id="budget"
      description={t('A monthly limit for the amount billed on top of seats, used as a reference line in the reports.')}
      onReset={() => updateSettings({ budgetMonthlyBilled: DEFAULT_SETTINGS.budgetMonthlyBilled })}
    >
      <Card>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet size={14} className="text-fg-subtle" aria-hidden />
              {t('Monthly budget for billed usage')}
            </div>
            <p className="text-xs text-fg-muted">
              {t(
                'Billed usage is the usage that goes beyond the included credits and is billed on top of seats. Enter the most you want to be billed in a month. Leave the field empty for no budget. The app only reports against this amount. It does not set a limit in GitHub.',
              )}
            </p>
          </div>
          <NumInput
            label={t('Monthly budget in US dollars')}
            value={budget}
            allowEmpty
            prefix="$"
            widthClass="w-40"
            max={LIMITS.budget.max}
            digits={2}
            placeholder={t('No budget')}
            onCommit={commit}
          />
        </div>
        <div className="mt-4 border-t border-border-muted pt-3">
          <div className="text-xs font-medium text-fg-muted">{t('Where the budget is used')}</div>
          <ul className="mt-1.5 space-y-1.5">
            {USES.map((u) => (
              <li key={u.where} className="text-sm">
                <span className="font-medium">{t(u.where)}:</span> <span className="text-fg-muted">{t(u.what)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 border-t border-border-muted pt-3">
          {hasData ? <BudgetStatus /> : <Callout tone="neutral">{t('Load a report to compare the budget with the latest month.')}</Callout>}
        </div>
        <div className="mt-4 border-t border-border-muted pt-3">
          <DocLinks topic="budgets" title={t('Budgets in GitHub')} limit={3} compact />
        </div>
      </Card>
    </SettingsSection>
  );
}
