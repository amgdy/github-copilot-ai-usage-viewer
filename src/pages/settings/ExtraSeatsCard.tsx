import { Card } from '../../components/ui';
import { T, msg, t } from '../../i18n';
import { PLAN_CREDITS, PLAN_PRICE } from '../../lib/analytics/settings';
import { CREDIT_USD } from '../../lib/types';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { LIMITS } from './limits';
import { NumInput } from './NumInput';
import { ThresholdRow } from './ThresholdRow';

type Plan = 'business' | 'enterprise';

const PLANS: { key: Plan; name: string; input: string; plan: 'Business' | 'Enterprise' }[] = [
  { key: 'business', name: msg('Business seats'), input: msg('Number of extra Business seats'), plan: 'Business' },
  { key: 'enterprise', name: msg('Enterprise seats'), input: msg('Number of extra Enterprise seats'), plan: 'Enterprise' },
];

export function ExtraSeatsCard() {
  const extra = useApp((state) => state.settings.extraSeats);
  const update = useApp((state) => state.updateSettings);

  const credits = PLANS.reduce((sum, seatPlan) => sum + extra[seatPlan.key] * (PLAN_CREDITS[seatPlan.plan] ?? 0), 0);

  return (
    <Card title={t('Extra seats not in the report')} subtitle={t('Seats you pay for but cannot name, for example when you only know the count.')}>
      <p className="mb-3 text-xs text-fg-muted">
        {t(
          'Each extra seat adds its included credits to the pool in every month, which makes the pool size and the utilization more accurate. Do not count a seat twice: seats in the license list are already in the pool.',
        )}
      </p>
      <div className="divide-y divide-border-muted">
        {PLANS.map((seatPlan) => {
          const each = PLAN_CREDITS[seatPlan.plan] ?? 0;
          return (
            <ThresholdRow
              key={seatPlan.key}
              label={t(seatPlan.name)}
              description={t('{plan} seats include {credits} AI credits ({usd}) each month.', {
                plan: seatPlan.plan,
                credits: fmtInt(each),
                usd: fmtUSD(PLAN_PRICE[seatPlan.plan] ?? each * CREDIT_USD, 0),
              })}
              hint={
                extra[seatPlan.key] > 0
                  ? t('Adds {credits} AI credits ({usd}) a month.', { credits: fmtInt(extra[seatPlan.key] * each), usd: fmtUSD(extra[seatPlan.key] * each * CREDIT_USD, 0) })
                  : t('Default {value}', { value: fmtInt(0) })
              }
            >
              <NumInput
                label={t(seatPlan.input)}
                value={extra[seatPlan.key]}
                integer
                min={LIMITS.extraSeats.min}
                max={LIMITS.extraSeats.max}
                digits={0}
                onCommit={(seatCount) => {
                  if (seatCount !== null) update({ extraSeats: { ...extra, [seatPlan.key]: seatCount } });
                }}
              />
            </ThresholdRow>
          );
        })}
      </div>
      <p className="mt-3 border-t border-border-muted pt-3 text-sm">
        {credits > 0 ? (
          <T
            text="Together the extra seats add {credits} AI credits ({usd}) to the pool each month."
            values={{ credits: <b className="num">{fmtInt(credits)}</b>, usd: <b className="num">{fmtUSD(credits * CREDIT_USD, 0)}</b> }}
          />
        ) : (
          <span className="text-fg-muted">{t('No extra seats are counted.')}</span>
        )}
      </p>
    </Card>
  );
}
