import { useMemo, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { EChart, useChartColors } from '../../components/charts/EChart';
import { donutOption } from '../../components/charts/helpers';
import { FeatureIcon } from '../../components/icons';
import { CalcInfo, CalcLine, Card, DocLinks, ProgressBar, cx, type CalcRef } from '../../components/ui';
import { t, T } from '../../i18n';
import { DEFAULT_LEVERS } from '../../lib/analytics/levers';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { usePerMonth } from '../shared';
import { FooterLink } from './parts';

// The biggest users that are looked at, and how many of them are listed.
const HEAVY_POOL = 15;
const LISTED = 5;

function Block({ title, calc, className, children }: { title: string; calc: CalcRef; className?: string; children: ReactNode }) {
  return (
    <div className={cx('min-w-0 rounded-lg border border-border-muted bg-surface-2 p-3', className)}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <span className="min-w-0">{title}</span>
        <CalcInfo id={calc} />
      </div>
      {children}
      <CalcLine id={calc} className="mt-2" />
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

function ShareBlock() {
  const { analysis } = useAnalysis();
  const colors = useChartColors();
  const auto = analysis.auto;

  const items = useMemo(
    () =>
      [
        { key: 'auto' as const, name: t('Through Auto'), value: auto.billed, color: colors.accent },
        { key: 'manual' as const, name: t('Hand-picked'), value: auto.direct, color: colors.muted },
      ].filter((slice) => slice.value > 0),
    [auto.billed, auto.direct, colors],
  );
  const option = useMemo(
    () => donutOption(colors, { items, legend: 'bottom', center: { value: fmtPct(auto.share, 0), caption: t('through Auto') } }),
    [colors, items, auto.share],
  );

  return (
    <Block title={t('Auto share of usage')} calc="auto-share">
      {items.length === 0 ? (
        <p className="text-xs text-fg-muted">{t('No usage in this scope.')}</p>
      ) : (
        <>
          <EChart
            option={option}
            height={190}
            label={t('Share of usage that went through Auto and share that was hand-picked')}
            exportName="github-copilot-auto-share"
            onClick={(event) => {
              const item = items[event.dataIndex];
              if (item) drill({ selection: item.key }, { merge: true });
            }}
          />
          <p className="text-center text-[11px] text-fg-subtle">{t('Click a slice to filter by it')}</p>
          <dl className="mt-2 space-y-0.5 text-xs">
            <Line label={t('Through Auto')} value={fmtUSD(auto.billed)} />
            <Line label={t('Hand-picked models')} value={fmtUSD(auto.direct)} />
          </dl>
        </>
      )}
    </Block>
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
        : t('{pct} of the Auto usage is measured from token counts. For the rest, the discount is estimated with the discount rate of the plan.', {
            pct: fmtPct(auto.measuredShare, 0),
          });

  return (
    <Block title={t('Auto discount received')} calc={['auto-discount', 'auto-original-price']} className={got ? 'border-good/30 bg-good-soft' : undefined}>
      <div className={cx('num truncate text-2xl font-semibold', got && 'text-good')}>{has ? fmtUSD(got ? auto.discount : 0) : '–'}</div>
      {has ? (
        <>
          <p className="mt-0.5 text-xs text-fg-muted">
            {got
              ? t('{pct} off an original price of {amount}', { pct: fmtPct(auto.rate, 1), amount: fmtUSD(auto.original) })
              : t('The report shows no Auto discount. The Auto usage was billed at its original price.')}
          </p>
          {got ? (
            <ProgressBar
              className="mt-2"
              value={inReport}
              ghost={1}
              tone="good"
              height={8}
              label={t('Auto usage in the report as a share of its original price')}
            />
          ) : null}
          <dl className="mt-2 space-y-0.5 text-xs">
            <Line label={t('Original price of Auto usage')} value={fmtUSD(auto.original)} />
            <Line label={t('Auto usage in the report (after the discount)')} value={fmtUSD(auto.billed)} />
          </dl>
          <p className="mt-2 text-[11px] leading-snug text-fg-subtle">{basis}</p>
        </>
      ) : (
        <p className="mt-0.5 text-xs text-fg-muted">{t('No usage went through Auto in this scope.')}</p>
      )}
    </Block>
  );
}

function MissedBlock() {
  const { analysis } = useAnalysis();
  const perMonth = usePerMonth();
  const auto = analysis.auto;
  const moved = DEFAULT_LEVERS.autoAdoption;
  const less = auto.missed * moved * perMonth;
  const missed = auto.missed >= 0.005;

  return (
    <Block title={t('Discount missed on hand-picked usage')} calc={['auto-missed', 'model-auto-adoption']}>
      {auto.total > 0 ? (
        <>
          <div className="num truncate text-2xl font-semibold">{fmtUSD(auto.missed)}</div>
          <p className="mt-0.5 text-xs text-fg-muted">
            {missed
              ? t(
                  "An estimate of the discount the hand-picked usage would have received through Auto. Each person's usage uses the discount rate of their plan.",
                )
              : t('No discount is missed at the current plan rates.')}
          </p>
          {missed ? (
            <dl className="mt-2 space-y-0.5 text-xs">
              <Line
                label={t('Less usage per month if {pct} of it moved to Auto', { pct: fmtPct(moved, 0) })}
                value={t('about {amount}', { amount: fmtUSD(less, less < 10 ? 2 : 0) })}
              />
            </dl>
          ) : null}
          <p className="mt-2 text-[11px] leading-snug text-fg-subtle">
            {t(
              'Usage, not cash: included credits are shared by the whole organization. Each plan uses the discount rate measured on its own Auto usage. Only a plan with no Auto usage to measure uses the Auto model discount from Settings ({pct}).',
              { pct: fmtPct(auto.assumedRate, 0) },
            )}
          </p>
        </>
      ) : (
        <p className="text-xs text-fg-muted">{t('No usage in this scope.')}</p>
      )}
    </Block>
  );
}

function HeavyUsersBlock() {
  const { analysis, settings } = useAnalysis();
  const selectUser = useApp((state) => state.selectUser);

  const { pool, list, lowest } = useMemo(() => {
    const pool = analysis.users.profiles
      .filter((user) => user.gross >= settings.minSpendForTraits)
      .sort((a, b) => b.gross - a.gross)
      .slice(0, HEAVY_POOL);
    const list = pool
      .filter((user) => user.autoShare < settings.autoFirst)
      .sort((a, b) => a.autoShare - b.autoShare || b.gross - a.gross)
      .slice(0, LISTED);
    return { pool, list, lowest: Math.min(1, ...pool.map((user) => user.autoShare)) };
  }, [analysis.users.profiles, settings.minSpendForTraits, settings.autoFirst]);

  const userCount = fmtInt(pool.length);
  const pct = <span className="num font-medium">{fmtPct(lowest, 0)}</span>;
  const autoFirst = fmtPct(settings.autoFirst, 0);
  const allAuto = lowest >= 0.995;

  return (
    <Block title={t('Heavy users with the lowest Auto share')} calc="model-auto-low-users">
      {pool.length === 0 ? (
        <p className="text-xs text-fg-muted">{t('No user has usage that reaches Minimum usage for traits in this scope.')}</p>
      ) : list.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-good/30 bg-good-soft p-3 text-sm">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-good" />
          <span>
            {pool.length === 1 ? (
              allAuto ? (
                t('The biggest user already sends all of their usage through Auto.')
              ) : (
                <T text="The biggest user already sends at least {pct} of their usage through Auto." values={{ pct }} />
              )
            ) : allAuto ? (
              t('Each of the {n} biggest users already sends all of their usage through Auto.', { n: userCount })
            ) : (
              <T text="Each of the {n} biggest users already sends at least {pct} of their usage through Auto." values={{ n: userCount, pct }} />
            )}
          </span>
        </div>
      ) : (
        <>
          <ul className="-my-1 divide-y divide-border-muted">
            {list.map((user) => (
              <li key={user.id}>
                <button type="button" className="flex w-full items-center gap-3 py-2 text-start hover:bg-surface-3" onClick={() => selectUser(user.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user.name}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {user.topModel ? (
                        <T
                          text="{amount} usage · mostly {model}"
                          values={{ amount: <span className="num">{fmtUSD(user.gross, 0)}</span>, model: user.topModel }}
                        />
                      ) : (
                        <T text="{amount} usage" values={{ amount: <span className="num">{fmtUSD(user.gross, 0)}</span> }} />
                      )}
                    </span>
                  </span>
                  <span className="w-16 shrink-0">
                    <span className="num block text-end text-sm font-medium">{fmtPct(user.autoShare, 0)}</span>
                    <ProgressBar value={user.autoShare} height={4} label={t('Auto share of {name}', { name: user.name })} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-fg-subtle">
            {pool.length === 1
              ? t('The biggest user by usage sends less than {pct} of their usage through Auto.', { pct: autoFirst })
              : t('Of the {n} biggest users by usage, these send less than {pct} of their usage through Auto, lowest share first.', { n: userCount, pct: autoFirst })}{' '}
            {t('Ask whether Auto would fit their routine work.')}
          </p>
        </>
      )}
    </Block>
  );
}

/** Who picks models by hand, the discount received and the discount missed. The rates behind them are in the cards below. */
export function AutoSelection() {
  return (
    <Card
      title={
        <>
          <FeatureIcon feature="auto" size={16} className="shrink-0 text-fg-muted" />
          {t('Auto model selection')}
        </>
      }
      subtitle={t(
        'With Auto, GitHub Copilot picks the model for each request instead of the person. The report has no column for the Auto discount, so it is worked out from token counts and the price card.',
      )}
      footer={
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span>{t('Estimates here use the discount rate of each plan, shown in the next card.')}</span>
            <FooterLink to="recommendations">{t('Open the Recommendations simulator')}</FooterLink>
          </div>
          <DocLinks topic="auto" title={t('Learn more')} compact />
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ShareBlock />
        <DiscountBlock />
        <MissedBlock />
        <HeavyUsersBlock />
      </div>
    </Card>
  );
}
