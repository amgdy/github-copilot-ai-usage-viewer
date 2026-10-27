import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { DAYS_PER_MONTH } from '../../lib/utils/date';
import { useAnalysis } from '../../state/analysis';
import { SeverityBadge, cx, severityTone, type Tone } from '../ui';
import { DrawerSection } from './DrawerSection';
import { money } from './shared';
import { visibleTips } from './visibleTips';

const EDGE: Record<Tone, string> = {
  neutral: 'border-s-fg-subtle',
  accent: 'border-s-accent',
  good: 'border-s-good',
  warn: 'border-s-warn',
  bad: 'border-s-bad',
  info: 'border-s-info',
};

export function TipCards({ p: user }: { p: UserProfile }) {
  const { analysis, settings } = useAnalysis();
  const perMonth = DAYS_PER_MONTH / Math.max(1, analysis.range.length);
  const tips = useMemo(() => visibleTips(user, settings), [user, settings]);

  return (
    <DrawerSection title={t('What to do')} description={t('The tips are written to the user, so you can pass them on as they are.')}>
      {tips.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-fg-muted">{t('Nothing stands out for this user.')}</div>
      ) : (
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li key={tip.id} className={cx('rounded-lg border border-s-4 border-border bg-surface px-3 py-2.5', EDGE[severityTone(tip.severity)])}>
              <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                <div className="min-w-0 text-sm font-medium">{tip.title}</div>
                <SeverityBadge severity={tip.severity} />
              </div>
              <p className="mt-1 text-xs text-fg-muted">{tip.detail}</p>
              {tip.savingsUsd > 0 || tip.docs ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {tip.savingsUsd > 0 ? (
                    <span className="chip num text-fg" title={t('{amount} over the selected date range', { amount: money(tip.savingsUsd) })}>
                      {t('Could save about {amount} a month', { amount: money(tip.savingsUsd * perMonth) })}
                    </span>
                  ) : null}
                  {tip.docs ? (
                    <a className="chip inline-flex items-center gap-1 text-accent hover:underline" href={tip.docs.url} target="_blank" rel="noreferrer">
                      {tip.docs.label}
                      <ExternalLink size={11} aria-hidden />
                      <span className="sr-only">{t('(opens in a new tab)')}</span>
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DrawerSection>
  );
}
