import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { FeatureIcon } from '../../components/icons';
import { CalcInfo, Callout, Card, DocLinks, ProgressBar, cx, type CalcRef } from '../../components/ui';
import { t } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill, navigate } from '../../state/router';

const FORWARD = 'rtl:-scale-x-100';

/** Plan name from the included credits per seat. The analysis keeps an English label, so it is named again here. */
function planName(credits: number): string {
  const quota = Math.round(credits);
  if (quota <= 0) return t('No quota');
  if (quota === 1900) return t('Business');
  if (quota === 3900) return t('Enterprise');
  return t('Custom ({n} credits)', { n: fmtInt(quota) });
}

function Block({ title, calc, className, children }: { title: string; calc: CalcRef; className?: string; children: ReactNode }) {
  return (
    <div className={cx('min-w-0 rounded-lg border border-border-muted bg-surface-2 p-3', className)}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <span className="min-w-0">{title}</span>
        <CalcInfo id={calc} />
      </div>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0 text-fg-muted">{label}</dt>
      <dd className="num shrink-0">{value}</dd>
    </div>
  );
}

function DiscountBlock() {
  const { analysis } = useAnalysis();
  const auto = analysis.auto;
  const has = auto.billed > 0;
  const got = auto.discount > 0.005;
  const inReport = auto.original > 0 ? Math.min(1, auto.billed / auto.original) : 1;
  const basis =
    auto.measuredShare >= 0.995
      ? t('Measured: the original price comes from the token counts and the price card.')
      : auto.measuredShare <= 0.005
        ? t('Estimated: these Auto rows have no usable token counts, so the original price uses the discount rate of the plan.')
        : t('{share} of the Auto usage is measured from token counts. For the rest the discount is estimated with the discount rate of the plan.', {
            share: fmtPct(auto.measuredShare, 0),
          });

  return (
    <Block title={t('Auto discount received')} calc={['auto-discount', 'auto-original-price']} className={got ? 'border-good/30 bg-good-soft' : undefined}>
      <div className={cx('num truncate text-2xl font-semibold', got && 'text-good')}>{has ? fmtUSD(got ? auto.discount : 0) : '–'}</div>
      {has ? (
        <>
          <p className="mt-0.5 text-xs text-fg-muted">
            {got
              ? t('{rate} off an original price of {original}', { rate: fmtPct(auto.rate, 1), original: fmtUSD(auto.original) })
              : t('The report shows no Auto discount. The Auto usage was billed at its original price.')}
          </p>
          {got ? <ProgressBar className="mt-2" value={inReport} ghost={1} tone="good" height={8} label={t('Auto usage in the report as a share of its original price')} /> : null}
          <dl className="mt-2 space-y-0.5 text-xs">
            <Line label={t('Original price of Auto usage')} value={fmtUSD(auto.original)} />
            <Line label={t('Auto usage in the report (after the discount)')} value={fmtUSD(auto.billed)} />
          </dl>
          <p className="mt-2 text-[11px] leading-snug text-fg-subtle">{basis}</p>
        </>
      ) : (
        <p className="mt-0.5 text-xs text-fg-muted">{t('No usage went through Auto in this period.')}</p>
      )}
    </Block>
  );
}

function ShareBlock() {
  const { analysis, settings } = useAnalysis();
  const auto = analysis.auto;
  const low = auto.total > 0 && auto.share < settings.lowAuto;
  return (
    <Block title={t('Auto share of usage')} calc={['auto-share', 'auto-missed', 'auto-plan-rate']}>
      <div className="num text-2xl font-semibold">{auto.total > 0 ? fmtPct(auto.share, 0) : '–'}</div>
      <ProgressBar className="mt-2" value={auto.share} tone={low ? 'warn' : 'accent'} height={8} label={t('Share of usage that went through Auto')} />
      <dl className="mt-2 space-y-0.5 text-xs">
        <Line label={t('Through Auto')} value={fmtUSD(auto.billed)} />
        <Line label={t('Hand-picked models')} value={fmtUSD(auto.direct)} />
        <Line label={t('Discount missed on hand-picked usage')} value={t('about {amount}', { amount: fmtUSD(auto.missed) })} />
      </dl>
      {auto.plans.length > 0 ? (
        <>
          <p className="mt-2 text-[11px] font-medium text-fg-muted">{t('Auto discount rate by plan')}</p>
          <dl className="mt-0.5 space-y-0.5 text-[11px]">
            {auto.plans.map((plan) => (
              <Line
                key={`${plan.credits}-${plan.label}`}
                label={planName(plan.credits)}
                value={t('{rate} ({basis})', { rate: fmtPct(plan.rate, 1), basis: plan.source === 'measured' ? t('Measured') : t('Assumed') })}
              />
            ))}
          </dl>
        </>
      ) : null}
      <p className="mt-2 text-[11px] leading-snug text-fg-subtle">
        {auto.plans.some((plan) => plan.source === 'measured')
          ? t(
              'A plan with at least $1 of measured Auto usage uses the rate measured in this report. Only plans without that use the Auto model discount from Settings ({rate}).',
              { rate: fmtPct(auto.assumedRate, 0) },
            )
          : t('The report has no Auto usage that can be measured, so every plan uses the Auto model discount from Settings ({rate}).', {
              rate: fmtPct(auto.assumedRate, 0),
            })}
      </p>
    </Block>
  );
}

function ClassBlock() {
  const { analysis, taxonomy, settings } = useAnalysis();
  const groups = analysis.population.groups.autoUse;
  const rows = taxonomy.autoUse.map((item) => ({ item, g: groups[item.id] })).filter((row) => row.g && row.g.users > 0);
  const total = rows.reduce((sum, row) => sum + row.g.gross, 0);
  return (
    <Block title={t('Users by Auto use class')} calc="auto-use-class">
      {rows.length ? (
        <>
          <div className="mb-1 flex justify-end gap-2 px-1.5 text-[11px] text-fg-subtle">
            <span className="w-12 text-end">{t('Users')}</span>
            <span className="w-12 text-end">{t('Usage')}</span>
          </div>
          <ul className="space-y-0.5">
            {rows.map(({ item, g: group }) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-start text-sm hover:bg-surface-3"
                  title={t('{description} Click to list these users.', { description: item.description })}
                  onClick={() => drill({ autoUse: [item.id] }, { page: 'users', merge: true })}
                >
                  <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="num w-12 text-end">{fmtInt(group.users)}</span>
                  <span className="num w-12 text-end text-fg-muted">{total > 0 ? fmtPct(group.gross / total, 0) : '–'}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs text-fg-muted">{t('No users in this scope.')}</p>
      )}
      <p className="mt-2 text-[11px] leading-snug text-fg-subtle">
        {t("Auto-first from {autoFirst} of a user's usage on Auto. Direct models below {lowAuto}. Change both in Settings.", {
          autoFirst: fmtPct(settings.autoFirst, 0),
          lowAuto: fmtPct(settings.lowAuto, 0),
        })}
      </p>
    </Block>
  );
}

/** Auto model selection at a glance: the discount received against the original price, the share of usage and who picks models by hand. */
export function AutoDiscountCard() {
  const { analysis } = useAnalysis();
  const { coverage, segmentFiltered } = analysis;
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-1.5">
          <FeatureIcon feature="auto" size={16} className="shrink-0" />
          {t('Auto model selection')}
        </span>
      }
      subtitle={t(
        'GitHub Copilot picks the model for each request. The report has no column for the Auto discount, so it is worked out from token counts and the price card.',
      )}
      footer={
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate('models')}>
              {t('See Auto by plan and by model')} <ArrowRight size={12} className={FORWARD} />
            </button>
            {segmentFiltered && coverage.models ? (
              <span className="text-fg-subtle">{t('Plan discount rates are measured on all users in the current row filters, not only on the selected segment.')}</span>
            ) : null}
          </div>
          <DocLinks topic="auto" title={t('Learn more')} compact />
        </div>
      }
    >
      {coverage.models ? (
        <div className="grid gap-3 md:grid-cols-3">
          <DiscountBlock />
          <ShareBlock />
          <ClassBlock />
        </div>
      ) : (
        <Callout tone="info" title={t('This file has no model names')}>
          {t('Auto shows up in the model column as "Auto". Load the usage report with that column to see the Auto discount and who picks models by hand.')}
        </Callout>
      )}
    </Card>
  );
}
