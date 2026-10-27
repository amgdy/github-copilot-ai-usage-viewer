import { useMemo } from 'react';
import { FeatureIcon } from '../../components/icons';
import { Callout, Card, DocLinks, ProgressBar, cx } from '../../components/ui';
import { autoBasisNote } from '../../components/user/shared';
import { T, t, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill, navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { measuredMissedShare, missedBasisNote, planRatesNote } from './autoStats';
import { MissedList } from './MissedList';
import { Block, Line } from './StripBlock';

function ClassChips() {
  const { analysis, taxonomy, settings } = useAnalysis();
  const active = useApp((s) => s.filters.autoUse);
  const counts = analysis.population.groups.autoUse;

  const toggle = (id: string) => drill({ autoUse: active.includes(id) ? active.filter((x) => x !== id) : [...active, id] }, { merge: true });

  return (
    <Block title={t('Users by Auto use class')} calc="auto-use-class">
      <ul className="grid grid-cols-2 gap-2">
        {taxonomy.autoUse.map((item) => {
          const on = active.includes(item.id);
          return (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={on}
                title={item.description}
                onClick={() => toggle(item.id)}
                className={cx(
                  'flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-start text-xs transition-colors',
                  on ? 'border-accent bg-accent-soft font-medium text-fg' : 'border-border bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} aria-hidden />
                  <span className="wrap-anywhere">{item.label}</span>
                </span>
                <span className="num shrink-0 text-fg-subtle">{fmtInt(counts[item.id].users)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-fg-subtle">
        <T
          text="Click a class to show only those users below. Auto-first from {high} of a user's usage on Auto. Direct models below {low}. Change both in {settings}."
          values={{
            high: fmtPct(settings.autoFirst, 0),
            low: fmtPct(settings.lowAuto, 0),
            settings: (
              <button type="button" className="text-accent hover:underline" onClick={() => navigate('settings')}>
                {t('Settings')}
              </button>
            ),
          }}
        />
      </p>
      {active.length > 0 ? (
        <button type="button" className="btn btn-sm mt-2" onClick={() => drill({ autoUse: [] }, { merge: true })}>
          {t('Show all classes')}
        </button>
      ) : null}
    </Block>
  );
}

export function AutoStrip() {
  const { analysis } = useAnalysis();
  const { coverage, auto: a, autoRates, users, segmentFiltered } = analysis;
  const profiles = users.profiles;

  const totals = useMemo(() => {
    let handPicked = 0;
    for (const p of profiles) handPicked += p.directBilled;
    return { handPicked, missedShare: measuredMissedShare(profiles, autoRates) };
  }, [profiles, autoRates]);

  const has = a.billed > 0;
  const got = a.discount > 0.005;
  const missed = a.missed > 0.005;
  const autoShare = a.share;

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-1.5">
          <FeatureIcon feature="auto" size={16} />
          {t('Auto vs direct in this view')}
        </span>
      }
      subtitle={tp(
        profiles.length,
        'Who lets GitHub Copilot pick the model, what that saved, and what hand-picked usage could still save. {n} user in view.',
        'Who lets GitHub Copilot pick the model, what that saved, and what hand-picked usage could still save. {n} users in view.',
        { n: fmtInt(profiles.length) },
      )}
      calc={['user-auto-strip', 'auto-use-class']}
      className="border-accent/40 bg-accent-soft/30"
    >
      {!coverage.models ? (
        <Callout tone="info" title={t('This file has no model names')}>
          {t(
            'Auto usage cannot be told apart from models picked by hand, so the Auto share of usage, the Auto discount received and the discount missed on hand-picked usage are not available.',
          )}
        </Callout>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-3">
            <ClassChips />
            <Block title={t('Auto discount received')} calc={['auto-discount', 'auto-original-price']} className={got ? 'border-good/30 bg-good-soft' : undefined}>
              <div className={cx('num truncate text-2xl font-semibold', got && 'text-good')}>{has ? fmtUSD(got ? a.discount : 0) : '–'}</div>
              {has ? (
                <>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {got
                      ? t('{rate} off an original price of {amount}', { rate: fmtPct(a.rate, 1), amount: fmtUSD(a.original) })
                      : t('The report shows no Auto discount. The Auto usage was billed at its original price.')}
                  </p>
                  <ProgressBar className="mt-2" value={autoShare} tone="accent" height={8} label={t('Auto share of usage')} />
                  <dl className="mt-2 space-y-0.5 text-xs">
                    <Line label={t('Auto share of usage')} value={fmtPct(autoShare, 0)} />
                    <Line label={t('Original price of Auto usage')} value={fmtUSD(a.original)} />
                  </dl>
                  <p className="mt-2 text-[11px] leading-snug text-fg-subtle">{autoBasisNote(a.measuredShare, 'all')}</p>
                </>
              ) : (
                <p className="mt-0.5 text-xs text-fg-muted">{t('No usage went through Auto for the users in view.')}</p>
              )}
            </Block>
            <Block
              title={t('Discount missed on hand-picked usage')}
              calc={['auto-missed', 'auto-plan-rate']}
              className={missed ? 'border-warn/30 bg-warn-soft' : undefined}
            >
              <div className={cx('num truncate text-2xl font-semibold', missed && 'text-warn')}>
                {missed ? t('About {amount}', { amount: fmtUSD(a.missed) }) : fmtUSD(0)}
              </div>
              <p className="mt-0.5 text-xs text-fg-muted">
                {totals.handPicked > 0
                  ? t('Hand-picked usage of {amount} × the Auto discount rate of the plan of each user.', { amount: fmtUSD(totals.handPicked) })
                  : t('The users in view have no hand-picked usage.')}
              </p>
              {missed ? <p className="mt-2 text-[11px] leading-snug text-fg-subtle">{missedBasisNote(totals.missedShare)}</p> : null}
            </Block>
          </div>
          <MissedList />
          <p className="text-xs text-fg-muted">
            {planRatesNote(autoRates)}
            {segmentFiltered ? ` ${t('Plan discount rates are measured on all users in the current row filters, not only on the users in view.')}` : null}
          </p>
          <DocLinks topic="auto" compact />
        </div>
      )}
    </Card>
  );
}
