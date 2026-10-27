import { useMemo } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { Card, DataTable, EmptyState, type Column } from '../../components/ui';
import { VendorIcon } from '../../components/icons';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { median, type AnomalyDay } from '../../lib/analytics/anomalies';
import { BLANK_ID } from '../../lib/analytics/prepare';
import { inferVendor, lookupCard } from '../../lib/pricing/models';
import { DOW_NAMES, dowOf, fmtDay, isoDate } from '../../lib/utils/date';
import { fmtInt, fmtMultiple, fmtNum, fmtPct, fmtUSD } from '../../lib/utils/format';
import { dimLabel, dimValue } from '../shared';
import { dayStats } from './model';

/** The defaults of findAnomalyDays, repeated here to explain the rule. */
const MIN_DAYS = 10;
const Z_CUT = 3.5;
const MULTIPLE = 1.5;
const LIMIT = 6;

const vendorOf = (model: string) => lookupCard(model)?.vendor ?? inferVendor(model);

export default function UnusualDays() {
  const { analysis, store } = useAnalysis();
  const { anomalies, agg } = analysis;
  const selectUser = useApp((s) => s.selectUser);

  const columns = useMemo<Column<AnomalyDay>[]>(() => {
    const userName = (id: number) => dimLabel(store, 'user', id);
    const modelName = (id: number) => dimLabel(store, 'model', id);
    return [
      {
        key: 'date',
        header: t('Date'),
        value: (a) => isoDate(a.day),
        render: (a) => (
          <span className="whitespace-nowrap">
            <span className="font-medium">{fmtDay(a.day, true)}</span> <span className="text-fg-muted">{DOW_NAMES[dowOf(a.day)]}</span>
          </span>
        ),
      },
      { key: 'gross', header: t('Usage'), align: 'end', calc: 'usage', value: (a) => a.gross, render: (a) => fmtUSD(a.gross) },
      {
        key: 'baseline',
        header: t('Typical day'),
        align: 'end',
        hint: t('The middle day (median) of the days with usage in this range'),
        calc: 'typical-day',
        value: (a) => a.baseline,
        render: (a) => fmtUSD(a.baseline),
      },
      {
        key: 'multiple',
        header: t('Times the typical day'),
        align: 'end',
        hint: t('Usage on the day divided by the typical day'),
        calc: 'unusual-day-multiple',
        value: (a) => a.multiple,
        render: (a) => fmtMultiple(a.multiple),
      },
      {
        key: 'users',
        header: t('Top users that day'),
        hint: t('The users with the most usage on that day. Click one to open the user.'),
        calc: 'unusual-day-users',
        sortable: false,
        value: (a) => a.topUsers.map((u) => `${userName(u.id)} ${fmtUSD(u.gross)}`).join(', '),
        render: (a) => (
          <div className="flex max-w-[16rem] flex-wrap gap-1">
            {a.topUsers.map((u) => {
              const body = (
                <>
                  <span className="max-w-[9rem] truncate">{userName(u.id)}</span>
                  <span className="num text-fg-muted">{fmtUSD(u.gross, 0)}</span>
                </>
              );
              return u.id === BLANK_ID ? (
                <span key={u.id} className="chip" title={t('Usage not tied to a user')}>
                  {body}
                </span>
              ) : (
                <button key={u.id} type="button" className="chip hover:border-accent hover:text-accent" title={t('Open this user')} onClick={() => selectUser(u.id)}>
                  {body}
                </button>
              );
            })}
          </div>
        ),
      },
      {
        key: 'models',
        header: t('Top models that day'),
        hint: t('The models with the most usage on that day, with their share of the day'),
        calc: 'unusual-day-models',
        sortable: false,
        value: (a) => a.topModels.map((m) => `${modelName(m.id)} ${fmtPct(m.gross / a.gross, 0)}`).join(', '),
        render: (a) => (
          <div className="flex max-w-[14rem] flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {a.topModels.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1 whitespace-nowrap">
                {m.id === BLANK_ID ? null : <VendorIcon vendor={vendorOf(dimValue(store, 'model', m.id))} size={12} className="shrink-0 text-fg-muted" />}
                {modelName(m.id)} <span className="num text-fg-muted">{fmtPct(m.gross / a.gross, 0)}</span>
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'action',
        header: <span className="sr-only">{t('Action')}</span>,
        csvHeader: t('Action'),
        sortable: false,
        noCsv: true,
        value: () => '',
        render: (a) => (
          <button
            type="button"
            className="btn btn-sm whitespace-nowrap"
            title={t('Filter the whole report to this day')}
            onClick={() => drill({ dateFrom: a.day, dateTo: a.day }, { merge: true })}
          >
            {t('Only this day')}
          </button>
        ),
      },
    ];
  }, [store, selectUser]);

  const { usageDays, typical } = useMemo(() => {
    const dayUsage: number[] = [];
    for (let i = 0; i < agg.days.gross.length; i++) if (agg.days.gross[i] > 0) dayUsage.push(agg.days.gross[i]);
    return { usageDays: dayStats(agg.days).usageDays, typical: median(dayUsage) };
  }, [agg]);

  const rule = t(
    'A day is unusual when its usage is at least {multiple} times the typical day and far above the normal ups and downs between days (a z-score of {z} or more). The typical day is the middle day (median) of the days with usage. The check needs at least {min} days with usage and lists up to {limit} days.',
    { multiple: fmtNum(MULTIPLE, 1), z: fmtNum(Z_CUT, 1), min: fmtInt(MIN_DAYS), limit: fmtInt(LIMIT) },
  );

  return (
    <Card
      title={t('Unusual days')}
      subtitle={t('Days with far more usage than the typical day, and who and what drove them.')}
      footer={rule}
      calc="unusual-days"
    >
      {anomalies.length > 0 ? (
        <DataTable
          rows={anomalies}
          columns={columns}
          rowKey={(a) => a.day}
          defaultSort={{ key: 'gross', dir: 'desc' }}
          exportName="github-copilot-unusual-days"
          fixedColumns
          pageSize={10}
        />
      ) : usageDays < MIN_DAYS ? (
        <EmptyState
          icon={<Info size={22} />}
          title={t('Not enough days to judge')}
          description={t('Finding unusual days needs at least {min} days with usage, so one busy day cannot define what is normal. This range has {days}.', {
            min: fmtInt(MIN_DAYS),
            days: fmtInt(usageDays),
          })}
        />
      ) : (
        <EmptyState
          icon={<CheckCircle2 size={22} className="text-good" />}
          title={t('No unusual days')}
          description={t('No day was far above the typical day of about {amount}.', { amount: fmtUSD(typical) })}
        />
      )}
    </Card>
  );
}
