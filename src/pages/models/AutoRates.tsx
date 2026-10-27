import { useMemo } from 'react';
import { FeatureIcon } from '../../components/icons';
import { Badge, Card, DataTable, type Column } from '../../components/ui';
import { t } from '../../i18n';
import { MIN_PLAN_MEASURED_USD, type AutoPlanRate } from '../../lib/analytics/autoDiscount';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';

const sum = (rows: AutoPlanRate[], pick: (p: AutoPlanRate) => number): number => rows.reduce((a, p) => a + pick(p), 0);

/** The Auto discount rate of each plan, and whether it was measured in the report or is the rate from Settings. */
export function AutoPlanRates() {
  const { analysis, store } = useAnalysis();
  const { plans, assumed } = analysis.autoRates;
  const settingsRate = fmtPct(assumed, 0);

  const columns = useMemo<Column<AutoPlanRate>[]>(() => {
    const basisTitle = (p: AutoPlanRate): string => {
      if (p.source === 'measured') {
        return t('Worked out from {amount} of Auto usage that could be priced from token counts and the price card.', { amount: fmtUSD(p.measuredBilled) });
      }
      if (p.measuredBilled > 0) {
        return t(
          'Only {amount} of the Auto usage could be measured from token counts. A plan needs at least {min}, so the Auto model discount from Settings ({pct}) is used.',
          { amount: fmtUSD(p.measuredBilled), min: fmtUSD(MIN_PLAN_MEASURED_USD, 0), pct: settingsRate },
        );
      }
      return t('None of the Auto usage on this plan could be measured from token counts, so the Auto model discount from Settings ({pct}) is used.', {
        pct: settingsRate,
      });
    };
    return [
      {
        key: 'plan',
        header: t('Plan'),
        value: (p) => p.label,
        render: (p) => <span className="font-medium">{p.label}</span>,
        hint: t('The plan is told apart by the monthly quota of each user in the report.'),
        calc: 'model-auto-plan',
      },
      {
        key: 'users',
        header: t('Users'),
        align: 'end',
        value: (p) => p.users,
        render: (p) => fmtInt(p.users),
        hint: t('Users of this plan with Auto usage.'),
        calc: 'model-auto-plan-users',
        total: (rs) => fmtInt(sum(rs, (p) => p.users)),
      },
      {
        key: 'billed',
        header: t('Auto usage'),
        align: 'end',
        value: (p) => p.billed,
        render: (p) => fmtUSD(p.billed),
        hint: t('Usage that went through Auto, as charged in the report. This is after the Auto discount.'),
        calc: 'model-auto-usage',
        total: (rs) => fmtUSD(sum(rs, (p) => p.billed)),
      },
      {
        key: 'measured',
        header: t('Measured usage'),
        align: 'end',
        value: (p) => p.measuredBilled,
        render: (p) => fmtUSD(p.measuredBilled),
        hint: t('The part of the Auto usage that could be priced from token counts and the price card.'),
        calc: 'model-auto-measured',
        total: (rs) => fmtUSD(sum(rs, (p) => p.measuredBilled)),
      },
      {
        key: 'original',
        header: t('Original price (measured)'),
        align: 'end',
        value: (p) => p.measuredList,
        render: (p) => fmtUSD(p.measuredList),
        hint: t('What the measured usage would have cost at the price card, without the Auto discount.'),
        calc: 'model-auto-measured-original',
        total: (rs) => fmtUSD(sum(rs, (p) => p.measuredList)),
      },
      {
        key: 'rate',
        header: t('Discount rate'),
        align: 'end',
        value: (p) => p.rate,
        render: (p) => fmtPct(p.rate, 1),
        hint: t('The rate used to estimate the Auto discount of this plan.'),
        calc: 'auto-plan-rate',
      },
      {
        key: 'basis',
        header: t('Basis'),
        value: (p) => (p.source === 'measured' ? t('Measured') : t('Assumed')),
        render: (p) => (
          <Badge tone={p.source === 'measured' ? 'good' : 'warn'} title={basisTitle(p)}>
            {p.source === 'measured' ? t('Measured') : t('Assumed')}
          </Badge>
        ),
        hint: t('Measured: the rate comes from the report. Assumed: the Auto model discount from Settings is used. Point at the badge to see why.'),
        calc: 'model-auto-plan-basis',
      },
    ];
  }, [settingsRate]);

  return (
    <Card
      title={
        <>
          <FeatureIcon feature="auto" size={16} className="shrink-0 text-fg-muted" />
          {t('Auto discount rate by plan')}
        </>
      }
      subtitle={t(
        'One rate for each plan, used to estimate the Auto discount. A plan with enough Auto usage uses the rate measured in the report. Any other plan uses the rate from Settings.',
      )}
      calc="auto-plan-rate"
      footer={
        <div className="space-y-0.5">
          <p>
            {t(
              'A plan needs at least {min} of measured Auto usage to use its own rate. Any other plan, including one with no Auto usage, uses the Auto model discount from Settings ({pct}).',
              { min: fmtUSD(MIN_PLAN_MEASURED_USD, 0), pct: settingsRate },
            )}
          </p>
          <p>
            {analysis.segmentFiltered
              ? t('Plan discount rates are measured on all users in the current row filters, not only on the selected segment.')
              : t('Plan discount rates are measured on all users in the current row filters.')}
          </p>
          {!store.hasTokens ? <p>{t('This report has no token columns, so nothing can be measured and every plan uses the rate from Settings.')}</p> : null}
        </div>
      }
    >
      {plans.length === 0 ? (
        <p className="text-sm text-fg-muted">
          {t(
            'No usage went through Auto in the current row filters, so there is no plan rate to measure. Every plan uses the Auto model discount from Settings ({pct}).',
            { pct: settingsRate },
          )}
        </p>
      ) : (
        <DataTable rows={plans} columns={columns} rowKey={(p) => p.credits} dense fixedColumns pageSize={10} exportName="github-copilot-auto-plan-rates" />
      )}
    </Card>
  );
}
