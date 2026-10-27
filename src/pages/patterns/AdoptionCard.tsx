import { useMemo } from 'react';
import { Info, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, DocLinks, EmptyState, cx } from '../../components/ui';
import { EChart, useChartColors, type ChartClick } from '../../components/charts/EChart';
import { t, tp } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { fmtDay, dateParts } from '../../lib/utils/date';
import { fmtInt, pluralize } from '../../lib/utils/format';
import { adoptionVerdict, buildAdoption, newUserCut, verdictSentence, type VerdictKind } from './adoption';
import { adoptionOption, hasPartialWeeks } from './adoptionChart';

const VERDICT_VIEW: Record<VerdictKind, { icon: typeof Info; className: string }> = {
  growing: { icon: TrendingUp, className: 'bg-good-soft text-good' },
  declining: { icon: TrendingDown, className: 'bg-bad-soft text-bad' },
  flat: { icon: Minus, className: 'bg-surface-3 text-fg-muted' },
  unknown: { icon: Info, className: 'bg-surface-3 text-fg-muted' },
};

export default function AdoptionCard() {
  const { analysis, store, settings } = useAnalysis();
  const { range, users, mask } = analysis;
  const colors = useChartColors();
  const userCount = store.dicts.user.values.length;

  const newUserCutoff = newUserCut(range.start, store.minDay, settings.newUserDays);
  const adoption = useMemo(
    () => buildAdoption(store, userCount, mask, range, users.profiles.map((profile) => profile.globalFirstDay), newUserCutoff),
    [store, userCount, mask, range, users, newUserCutoff],
  );
  const verdict = useMemo(() => adoptionVerdict(adoption), [adoption]);
  const withYear = dateParts(range.start).y !== dateParts(range.end).y;
  const option = useMemo(() => adoptionOption({ colors, adoption, withYear }), [colors, adoption, withYear]);

  const onClick = (event: ChartClick) => {
    if (event.componentType !== 'series') return;
    const weekIndex = event.dataIndex;
    if (weekIndex >= 0 && weekIndex < adoption.count) drill({ dateFrom: adoption.startDay[weekIndex], dateTo: adoption.endDay[weekIndex] }, { merge: true });
  };

  const { icon: Icon, className } = VERDICT_VIEW[verdict.kind];
  const baseline = adoption.baseline;

  const firstDays = pluralize(settings.newUserDays, 'day');
  const notes = [t('A user counts as new in the week they first appear in the data. Active users per week are users with any usage that week.')];
  if (newUserCutoff > range.end) {
    notes.push(t('Users first seen in the first {days} of the data count as already using GitHub Copilot, so this range has no new users.', { days: firstDays }));
  } else if (newUserCutoff > range.start) {
    notes.push(
      tp(baseline, '{n} user counts as already using GitHub Copilot.', '{n} users count as already using GitHub Copilot.', { n: fmtInt(baseline) }),
      t('Users first seen in the first {days} of the data cannot be told apart from existing users, so new users are counted from {date}.', {
        days: firstDays,
        date: fmtDay(newUserCutoff, true),
      }),
    );
  } else {
    notes.push(tp(baseline, '{n} user was already using GitHub Copilot before this range began.', '{n} users were already using GitHub Copilot before this range began.', { n: fmtInt(baseline) }));
  }
  if (hasPartialWeeks(adoption)) notes.push(t('Lighter bars and hollow markers are weeks only partly inside the range.'));
  notes.push(t('Click a week to show only that week.'));

  return (
    <Card
      title={t('Adoption over time')}
      subtitle={t('New users, users so far, and active users per week, Monday to Sunday.')}
      padded={false}
      footer={
        <div className="space-y-2">
          <p>{notes.join(' ')}</p>
          <DocLinks topic="adoption" title={t('Learn more')} limit={3} compact />
        </div>
      }
      calc={['adoption-over-time', 'weekly-active-users', 'new-users']}
    >
      {users.profiles.length === 0 ? (
        <EmptyState icon={<Info size={22} />} title={t('No users in this scope')} />
      ) : (
        <>
          <div className={cx('mx-4 mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm', className)}>
            <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
            <p className="min-w-0 text-fg">{verdictSentence(verdict)}</p>
          </div>
          <div className="px-2 pb-3 pt-2">
            <EChart
              option={option}
              height={300}
              onClick={onClick}
              exportName="github-copilot-adoption-over-time"
              label={t('Chart of new users, users so far, and active users per week')}
            />
          </div>
        </>
      )}
    </Card>
  );
}
