import { t } from '../../i18n';
import { rateForPlan } from '../../lib/analytics/autoDiscount';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { FeatureIcon } from '../icons';
import { CalcInfo, Kpi, KpiGrid, TaxBadge } from '../ui';
import { DrawerSection } from './DrawerSection';
import { seatPlanLabel } from './license';
import { autoBasisNote } from './shared';

const EMPTY = 'rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-fg-muted';

/** How much of one user's usage went through Auto, the discount that earned against the original price, and the discount hand-picked usage missed. */
export function AutoVsDirect({ p }: { p: UserProfile }) {
  const { analysis, taxonomy } = useAnalysis();
  const { coverage, autoRates } = analysis;
  const title = t('Auto vs direct');

  if (!coverage.models) {
    return (
      <DrawerSection title={title} calc={['user-auto-vs-direct', 'auto-use-class']}>
        <div className={EMPTY}>{t('This file has no model names, so Auto usage cannot be told apart from models picked by hand.')}</div>
      </DrawerSection>
    );
  }
  if (!(p.gross > 0)) {
    return (
      <DrawerSection title={title} calc={['user-auto-vs-direct', 'auto-use-class']}>
        <div className={EMPTY}>{t('No usage for this user in this date range.')}</div>
      </DrawerSection>
    );
  }

  const item = taxonomy.autoUse.find((i) => i.id === p.autoUse);
  const rate = rateForPlan(autoRates, p.quotaCredits);
  const basis = autoRates.plans.find((x) => x.credits === p.quotaCredits)?.source ?? 'assumed';
  const hasAuto = p.auto.billed > 0;
  const got = p.auto.discount > 0.005;
  const missed = p.autoMissed > 0.005;
  const plan = seatPlanLabel(p.plan);

  return (
    <DrawerSection
      title={title}
      calc={['user-auto-vs-direct', 'auto-use-class']}
      aside={t('{share} of usage on Auto', { share: fmtPct(p.autoShare, 0) })}
    >
      <div className="space-y-3 rounded-lg border border-accent/40 bg-accent-soft p-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <FeatureIcon feature="auto" size={14} />
              {t('Auto use class')}
              <CalcInfo id="auto-use-class" />
            </span>
            <TaxBadge item={item} />
          </div>
          {item ? <p className="text-xs text-fg-muted">{item.description}</p> : null}
        </div>

        <KpiGrid cols="grid-cols-2 sm:grid-cols-3">
          <Kpi
            label={t('Auto share of usage')}
            value={fmtPct(p.autoShare, 0)}
            sub={t('{part} of {total}', { part: fmtUSD(p.auto.billed), total: fmtUSD(p.gross) })}
            hint={t("The share of the user's usage that went through Auto model selection.")}
            calc="auto-share"
          />
          <Kpi
            label={t('Auto discount received')}
            value={fmtUSD(got ? p.auto.discount : 0)}
            tone={got ? 'good' : 'neutral'}
            sub={hasAuto ? t('{rate} off the original price', { rate: fmtPct(p.auto.rate, 1) }) : t('No usage went through Auto')}
            hint={t("What the Auto discount took off this user's Auto usage: the original price minus the amount in the report.")}
            calc={['auto-discount', 'auto-plan-rate']}
          />
          <Kpi
            label={t('Original price of Auto usage')}
            value={hasAuto ? fmtUSD(p.auto.original) : '–'}
            sub={hasAuto ? t('{amount} in the report, after the discount', { amount: fmtUSD(p.auto.billed) }) : undefined}
            hint={t('What the Auto usage would have cost with the models Auto picked, before the Auto discount.')}
            calc="auto-original-price"
          />
          <Kpi
            label={t('Hand-picked usage')}
            value={fmtUSD(p.directBilled)}
            sub={t('{share} of usage', { share: fmtPct(1 - p.autoShare, 0) })}
            hint={t('Usage on models the user chose by hand. It earns no Auto discount.')}
            calc="user-hand-picked-usage"
          />
          <Kpi
            label={t('Discount missed on hand-picked usage')}
            value={fmtUSD(p.autoMissed)}
            tone={missed ? 'warn' : 'neutral'}
            sub={t('An estimate: {amount} × {rate}', { amount: fmtUSD(p.directBilled), rate: fmtPct(rate, 1) })}
            hint={t('What the hand-picked usage would have earned if the same requests had gone through Auto.')}
            calc={['auto-missed', 'auto-plan-rate']}
          />
          <Kpi
            label={t('Auto discount rate by plan')}
            value={fmtPct(rate, 1)}
            sub={basis === 'measured' ? t('{plan}, measured', { plan }) : t('{plan}, assumed', { plan })}
            hint={
              basis === 'measured'
                ? t('Measured on the Auto usage of all users on this plan in the report.')
                : t('The report has too little measured Auto usage on this plan, so the {rate} from Settings is assumed.', {
                    rate: fmtPct(autoRates.assumed, 0),
                  })
            }
            calc="auto-plan-rate"
          />
        </KpiGrid>

        {hasAuto ? <p className="text-[11px] leading-snug text-fg-subtle">{autoBasisNote(p.auto.measuredShare, 'user')}</p> : null}
      </div>
    </DrawerSection>
  );
}
