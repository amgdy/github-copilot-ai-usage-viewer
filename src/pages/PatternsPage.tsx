import { NoRows } from '../components/NoRows';
import { PageHeader } from '../components/ui';
import { t } from '../i18n';
import { fmtDay, monthIndexOf } from '../lib/utils/date';
import { pluralize } from '../lib/utils/format';
import { useAnalysis } from '../state/analysis';
import AdoptionCard from './patterns/AdoptionCard';
import CalendarCard from './patterns/CalendarCard';
import DailyUsage from './patterns/DailyUsage';
import Kpis from './patterns/Kpis';
import LapsedFading from './patterns/LapsedFading';
import MonthTable from './patterns/MonthTable';
import UnusualDays from './patterns/UnusualDays';
import WeekdayPattern from './patterns/WeekdayPattern';
import { MAX_TILE_MONTHS } from './patterns/calendar';

export default function PatternsPage() {
  const { analysis } = useAnalysis();
  const { range, agg: aggregates } = analysis;

  if (aggregates.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t('Patterns')} description={t('When GitHub Copilot is used, whether adoption is growing or fading, and which days stood out.')} />
        <NoRows />
      </>
    );
  }

  const months = monthIndexOf(range.end) - monthIndexOf(range.start) + 1;

  // Cards that ask the reader to act (adoption, unusual days, users drifting away) come before the calendar views.
  return (
    <>
      <PageHeader
        title={t('Patterns')}
        description={t('{from} to {to} · {days} · {users}', {
          from: fmtDay(range.start, true),
          to: fmtDay(range.end, true),
          days: pluralize(range.length, 'day'),
          users: pluralize(aggregates.totals.users, 'user'),
        })}
      />
      <div className="space-y-4">
        <Kpis />
        <DailyUsage />
        <AdoptionCard />
        <UnusualDays />
        <LapsedFading />
        {months <= MAX_TILE_MONTHS ? (
          <div className="grid items-start gap-4 xl:grid-cols-3">
            <WeekdayPattern />
            <div className="xl:col-span-2">
              <CalendarCard />
            </div>
          </div>
        ) : (
          <>
            <CalendarCard />
            <WeekdayPattern />
          </>
        )}
        <MonthTable />
      </div>
    </>
  );
}
