import { TaxBadge, cx, taxLookup, type Column } from '../../components/ui';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct } from '../../lib/utils/format';
import { NO_MODELS, sum, usd, withReason, type ColumnContext } from './columnKit';

/** The columns of the Auto view that the General view does not have. The Auto share of usage column is shared with the General view. */
export function autoColumns({ coverage, taxonomy }: ColumnContext): Column<UserProfile>[] {
  const known = coverage.models;
  const none = withReason(NO_MODELS);
  const noModels = t(NO_MODELS);
  const classes = taxLookup(taxonomy.autoUse);

  const money = (
    key: string,
    header: string,
    hint: string,
    pick: (p: UserProfile) => number,
    tone?: 'good' | 'warn',
  ): Column<UserProfile> => ({
    key,
    header,
    hint: known ? hint : noModels,
    value: (p) => (known ? pick(p) : Number.NaN),
    render: (p) =>
      known ? <span className={cx(tone === 'good' && pick(p) > 0.005 && 'text-good', tone === 'warn' && pick(p) > 0.005 && 'text-warn')}>{usd(pick(p))}</span> : none,
    align: 'end',
    total: (rows) => (known ? usd(sum(rows, pick)) : '–'),
  });

  return [
    {
      ...money('autoDiscount', t('Auto discount received'), t('What the Auto discount took off the Auto usage of the user'), (p) => p.auto.discount, 'good'),
      calc: 'auto-discount',
    },
    {
      ...money('autoOriginal', t('Original price of Auto usage'), t('The Auto usage of the user at the price card, without the Auto discount'), (p) => p.auto.original),
      calc: 'auto-original-price',
    },
    {
      ...money('handPicked', t('Hand-picked usage'), t('Usage on models the user picked by hand, not through Auto'), (p) => p.directBilled),
      calc: 'user-hand-picked-usage',
    },
    {
      ...money(
        'autoMissed',
        t('Discount missed on hand-picked usage'),
        t('An estimate: hand-picked usage × the Auto discount rate of the plan of the user'),
        (p) => p.autoMissed,
        'warn',
      ),
      calc: ['auto-missed', 'auto-plan-rate'],
    },
    {
      key: 'autoRate',
      header: t('Auto discount rate'),
      hint: known ? t('Auto discount received ÷ original price of Auto usage. A dash when the user has no Auto usage.') : noModels,
      calc: 'auto-discount',
      value: (p) => (known && p.auto.billed > 0 ? p.auto.rate : Number.NaN),
      render: (p) => (!known ? none : p.auto.billed > 0 ? fmtPct(p.auto.rate, 1) : <span className="text-fg-subtle">–</span>),
      align: 'end',
    },
    {
      key: 'autoUse',
      header: t('Auto use class'),
      hint: known ? t('Auto-first, Mixed or Direct models, from the share of usage on Auto') : noModels,
      calc: 'auto-use-class',
      value: (p) => (known ? classes[p.autoUse].label : ''),
      render: (p) => (known ? <TaxBadge item={classes[p.autoUse]} /> : none),
    },
  ];
}
