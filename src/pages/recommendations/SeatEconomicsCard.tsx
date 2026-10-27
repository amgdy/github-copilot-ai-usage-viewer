import { useMemo } from 'react';
import { CalcInfo, Callout, Card, Kpi, KpiGrid, ProgressBar, type Tone } from '../../components/ui';
import { t } from '../../i18n';
import { fmtInt, fmtPct, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { MIN_EFFECT, fmtMoney, poolUnknownReason } from './scenario';
import { SEAT_RULE, seatAdvice, seatCashEffect, seatEconomics } from './seatData';

/** Seats, seat value and how much of the pool is used, with the rule that decides whether seat changes save cash. */
export function SeatEconomicsCard() {
  const { analysis, settings } = useAnalysis();
  const economics = useMemo(() => seatEconomics(analysis), [analysis]);
  const unknown = poolUnknownReason(analysis);
  const advice = seatAdvice(economics);
  const { idleValue, downgradeValue, unusedValue } = analysis.seats;
  const listed = idleValue + downgradeValue + unusedValue;
  const listedCash = useMemo(() => seatCashEffect(analysis, listed), [analysis, listed]);

  const rosterNote =
    economics.rosterOnly > 0
      ? t('plus {seats} that never appear', { seats: pluralize(economics.rosterOnly, 'roster seat') })
      : settings.roster.length > 0
        ? t('every roster seat appears')
        : t('no seat roster loaded');
  const tone: Tone = economics.overage !== null && economics.overage >= MIN_EFFECT ? 'warn' : economics.used !== null && economics.used < 0.4 ? 'info' : 'good';

  return (
    <Card title={t('Seat economics')} subtitle={t('What the seats cost and how much of the pool is used')}>
      <div className="space-y-4">
        <KpiGrid cols="grid-cols-2 lg:grid-cols-4">
          <Kpi
            label={t('Seats in the report')}
            value={fmtInt(economics.inReport)}
            sub={rosterNote}
            hint={t('Users who appear in the loaded files within the selected dates.')}
            calc="rec-seats-in-report"
          />
          <Kpi
            label={t('Seat value per month')}
            value={`${fmtMoney(economics.monthlyValue)}${economics.lowerBound ? '*' : ''}`}
            sub={economics.months > 1 ? t('average of {months}', { months: pluralize(economics.months, 'month') }) : t('one month')}
            hint={t('A seat costs the same as the included credits it carries: one credit is $0.01, so Business is $19 and Enterprise is $39 a month.')}
            calc="rec-seat-value"
          />
          <Kpi
            label={t('Share of the pool used')}
            value={economics.used === null ? '–' : fmtPct(economics.used, 0)}
            sub={economics.used === null ? t('pool size unknown') : economics.projected ? t('latest month projected to its end') : t('usage against included credits')}
            hint={t('Usage that the included credits cover, as a share of the pool of all seats.')}
            calc="rec-pool-share-used"
          />
          <Kpi
            label={t('Unused included credits')}
            value={economics.unused === null ? '–' : fmtMoney(economics.unused)}
            sub={economics.used === null ? t('pool size unknown') : t('{share} of the pool, per month', { share: fmtPct(1 - economics.used, 0) })}
            hint={t('Included credits that are paid for but not used. This is the most that removing seats can save.')}
            calc="rec-pool-unused"
          />
        </KpiGrid>

        {economics.used !== null ? <ProgressBar value={economics.used} tone={tone} height={10} label={t('Share of the pool used')} /> : null}

        {unknown ? (
          <Callout
            tone="info"
            title={t('The size of the pool is not known')}
            action={
              <button type="button" className="btn btn-sm" onClick={() => navigate('settings')}>
                {t('Open Settings')}
              </button>
            }
          >
            {unknown}
          </Callout>
        ) : null}

        {economics.lowerBound ? <p className="text-[11px] text-fg-subtle">{t('* Counts only the seats that appear in the report. Add your roster in Settings for the real pool size.')}</p> : null}

        <div className="space-y-1.5 text-sm">
          <p>
            <b>{t('Rule of thumb.')}</b> {t(SEAT_RULE)}
          </p>
          {advice ? (
            <p className="text-fg-muted">
              {advice} <CalcInfo id="rec-pool-unused" />
            </p>
          ) : null}
          {listed >= MIN_EFFECT ? (
            <p className="text-fg-muted">
              {listedCash !== null
                ? t('Together, the lists below are worth {value} a month in seat value and about {cash} a month in cash today. They draw on the same unused included credits, so their cash savings overlap.', {
                    value: fmtMoney(listed),
                    cash: fmtMoney(listedCash),
                  })
                : t('Together, the lists below are worth {value} a month in seat value. Cash savings need a known pool size. They draw on the same unused included credits, so their cash savings overlap.', {
                    value: fmtMoney(listed),
                  })}{' '}
              <CalcInfo id="rec-seat-lists-value" />
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
