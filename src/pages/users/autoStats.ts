import { seatPlanLabel } from '../../components/user/license';
import { t } from '../../i18n';
import type { AutoRates } from '../../lib/analytics/autoDiscount';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct } from '../../lib/utils/format';

/** Share (0 to 1) of the discount missed that uses a plan rate measured from Auto usage in the file. The rest uses the rate from Settings. */
export function measuredMissedShare(profiles: readonly UserProfile[], rates: AutoRates): number {
  let measured = 0;
  let all = 0;
  for (const user of profiles) {
    if (!(user.autoMissed > 0)) continue;
    all += user.autoMissed;
    if (rates.plans.some((planRate) => planRate.credits === user.quotaCredits && planRate.source === 'measured')) measured += user.autoMissed;
  }
  return all > 0 ? measured / all : 0;
}

export function missedBasisNote(measuredShare: number): string {
  if (measuredShare >= 0.995) return t('An estimate. The plan rates come from the Auto usage in the file.');
  if (measuredShare <= 0.005) return t('An estimate. The file has too little Auto usage to measure these plan rates, so the rate from Settings is assumed.');
  return t('An estimate. {share} of it uses plan rates measured from the file. The rest uses the rate from Settings.', { share: fmtPct(measuredShare, 0) });
}

export function planRatesNote(rates: AutoRates): string {
  const assumed = fmtPct(rates.assumed, 0);
  if (rates.plans.length === 0) {
    return t('The report has no Auto usage to measure a discount rate, so the {rate} from Settings is assumed.', { rate: assumed });
  }
  const list = rates.plans
    .map((planRate) => {
      const values = { plan: seatPlanLabel(planRate.label), rate: fmtPct(planRate.rate, 1) };
      return planRate.source === 'measured' ? t('{plan} {rate} (measured)', values) : t('{plan} {rate} (assumed)', values);
    })
    .join(', ');
  return t('Discount rate by plan: {list}. A plan without Auto usage uses the {rate} from Settings.', { list, rate: assumed });
}
