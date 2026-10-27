import { useMemo, type ReactNode } from 'react';
import { FeatureIcon } from '../../components/icons';
import { Card, Section, cx, type CalcRef } from '../../components/ui';
import { seatPlanLabel } from '../../components/user/license';
import { hasQuota, quotaKnown } from '../../components/user/shared';
import { t } from '../../i18n';
import { LEVER_META, LEVER_ORDER } from '../../lib/analytics/levers';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtDay } from '../../lib/utils/date';
import { fmtPct, fmtPctAuto, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { useApp } from '../../state/store';

const LIST_SIZE = 5;

interface MiniItem {
  key: string;
  /** The profile to open. Null when the user is not in the current view. */
  id: number | null;
  name: string;
  value: string;
  sub?: string;
  valueClass?: string;
}

function MiniList({
  title,
  why,
  items,
  empty,
  calc,
  footer,
}: {
  title: ReactNode;
  why: string;
  items: MiniItem[];
  empty: string;
  calc: CalcRef;
  footer?: ReactNode;
}) {
  return (
    <Card title={title} subtitle={why} padded={false} calc={calc}>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-fg-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border-muted">
          {items.map((it) => (
            <li key={it.key}>
              <button
                type="button"
                disabled={it.id === null}
                onClick={() => (it.id === null ? undefined : useApp.getState().selectUser(it.id))}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-start transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40 disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{it.name}</span>
                  {it.sub ? <span className="block truncate text-xs text-fg-muted">{it.sub}</span> : null}
                </span>
                <span className={cx('num shrink-0 text-sm font-semibold', it.valueClass)}>{it.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {footer ? <div className="border-t border-border-muted px-4 py-2 text-xs">{footer}</div> : null}
    </Card>
  );
}

function topLever(p: UserProfile): string | null {
  let best: (typeof LEVER_ORDER)[number] | null = null;
  let bestValue = 0;
  for (const id of LEVER_ORDER) {
    if (p.potentialBy[id] > bestValue) {
      bestValue = p.potentialBy[id];
      best = id;
    }
  }
  return best ? t(LEVER_META[best].label) : null;
}

export function AttentionLists() {
  const { analysis, settings } = useAnalysis();
  const profiles = analysis.users.profiles;
  const population = analysis.population.profiles;
  const licenses = analysis.licenses;
  const trendReliable = analysis.users.trendReliable;
  const known = useMemo(() => quotaKnown(profiles), [profiles]);

  const lists = useMemo(() => {
    const over = profiles
      .filter((p) => hasQuota(p) && p.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, LIST_SIZE)
      .map<MiniItem>((p) => ({
        key: String(p.id),
        id: p.id,
        name: p.name,
        value: t('{amount} over', { amount: fmtUSD(-p.balance, 0) }),
        valueClass: 'text-warn',
        sub: t('{share} of their included credits', { share: fmtPctAuto(p.utilization) }),
      }));

    const gain = profiles
      .filter((p) => p.potential > 0)
      .sort((a, b) => b.potential - a.potential)
      .slice(0, LIST_SIZE)
      .map<MiniItem>((p) => ({
        key: String(p.id),
        id: p.id,
        name: p.name,
        value: fmtUSD(p.potential, 0),
        valueClass: 'text-good',
        sub: [topLever(p), p.gross > 0 ? t('{share} of their usage', { share: fmtPct(p.potential / p.gross, 0) }) : ''].filter(Boolean).join(' · '),
      }));

    const fading = profiles
      .filter((p) => p.traits.includes('fading'))
      .sort((a, b) => b.prior - b.recent - (a.prior - a.recent))
      .slice(0, LIST_SIZE)
      .map<MiniItem>((p) => ({
        key: String(p.id),
        id: p.id,
        name: p.name,
        value: Number.isFinite(p.trend) ? fmtPct(p.trend, 0) : '–',
        valueClass: 'text-info',
        sub: t('{recent} last 7 days, {prior} before', { recent: fmtUSD(p.recent, 0), prior: fmtUSD(p.prior, 0) }),
      }));

    const fresh = profiles
      .filter((p) => p.isNew)
      .sort((a, b) => b.gross - a.gross)
      .slice(0, LIST_SIZE)
      .map<MiniItem>((p) => ({
        key: String(p.id),
        id: p.id,
        name: p.name,
        value: fmtUSD(p.gross, 0),
        sub: t('First seen {day} · {days}', { day: fmtDay(p.globalFirstDay), days: pluralize(p.activeDays, 'active day') }),
      }));

    let noSeat: MiniItem[] = [];
    if (licenses) {
      const byName = new Map<string, number>();
      for (const p of population) byName.set(`${p.name.toLowerCase()}\u0000${p.org}`, p.id);
      noSeat = licenses.unmatched.slice(0, LIST_SIZE).map<MiniItem>((u) => ({
        key: `${u.name}\u0000${u.org}`,
        id: byName.get(`${u.name.toLowerCase()}\u0000${u.org}`) ?? null,
        name: u.name,
        value: fmtUSD(u.usage, 0),
        valueClass: 'text-warn',
        sub: [u.org, u.plan ? seatPlanLabel(u.plan) : ''].filter(Boolean).join(' · '),
      }));
    }

    return { over, gain, fading, fresh, noSeat };
  }, [profiles, population, licenses]);

  const unmatchedCount = licenses?.unmatched.length ?? 0;

  return (
    <Section title={t('Needs attention')} description={t('Short lists of users worth a conversation. Click a name to see the details.')}>
      <div className={cx('grid gap-4 md:grid-cols-2', licenses ? 'xl:grid-cols-3' : 'xl:grid-cols-4')}>
        <MiniList
          title={t('Over their included credits')}
          why={t('They used more than their own included credits. The extra comes out of the shared pool.')}
          items={lists.over}
          empty={known ? t('Nobody used more than their own included credits.') : t('Included credits per user are not in the file.')}
          calc={['user-attention-lists', 'user-above-credits']}
        />
        <MiniList
          title={t('Most to gain')}
          why={t('Estimated usage that better model choices and habits could avoid. Start here.')}
          items={lists.gain}
          empty={t('No savings were found for these users.')}
          calc={['user-attention-lists', 'user-potential']}
        />
        <MiniList
          title={t('Fading')}
          why={t('Usage in the last 7 days is half or less of the 7 days before. Ask if something is in their way.')}
          items={lists.fading}
          empty={trendReliable ? t('Nobody is fading.') : t('The date range needs at least 14 days to spot fading.')}
          calc={['user-attention-lists', 'fading-users', 'user-change']}
        />
        <MiniList
          title={t('New and ramping')}
          why={t('Started in the last {n} days. Early habits stick, so a short intro on model choice pays off.', { n: settings.newUserDays })}
          items={lists.fresh}
          empty={t('No new users in this period.')}
          calc={['user-attention-lists', 'persona-groups']}
        />
        {licenses ? (
          <MiniList
            title={
              <span className="inline-flex items-center gap-1.5">
                <FeatureIcon feature="license" size={14} />
                {t('Usage but no seat in the license list')}
              </span>
            }
            why={t('These users have usage in the report but no seat in the license list. Check if the list is complete or the user name is different.')}
            items={lists.noSeat}
            empty={t('Every user in the report has a seat in the license list.')}
            calc={['user-attention-lists', 'license-unmatched']}
            footer={
              unmatchedCount > 0 ? (
                <button type="button" className="text-accent hover:underline" onClick={() => navigate('licenses')}>
                  {unmatchedCount > LIST_SIZE ? t('See all {n} on the Licenses page', { n: unmatchedCount }) : t('Open the Licenses page')}
                </button>
              ) : undefined
            }
          />
        ) : null}
      </div>
    </Section>
  );
}
