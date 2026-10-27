import { useMemo, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Card, DocLinks, EmptyState, cx } from '../../components/ui';
import { t } from '../../i18n';
import type { LinkId } from '../../lib/links';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtDay, dateParts } from '../../lib/utils/date';
import { fmtDelta, fmtInt, fmtUSD, pluralize } from '../../lib/utils/format';

const SHOWN = 8;

interface UserRow {
  profile: UserProfile;
  cells: ReactNode[];
}

function UserList({ headers, rows }: { headers: string[]; rows: UserRow[] }) {
  const selectUser = useApp((state) => state.selectUser);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-fg-muted">
            {headers.map((header, index) => (
              <th key={header} scope="col" className={cx('px-4 py-1.5 font-medium', index === 0 ? 'text-start' : 'whitespace-nowrap text-end')}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ profile: profile, cells }) => (
            <tr key={profile.id} onClick={() => selectUser(profile.id)} className="cursor-pointer border-t border-border-muted hover:bg-surface-2">
              <td className="px-4 py-1.5">
                <button type="button" title={t('Open this user')} className="block max-w-[12rem] truncate text-start font-medium hover:text-accent">
                  {profile.name}
                </button>
              </td>
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="num whitespace-nowrap px-4 py-1.5 text-end">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ListFooterProps {
  total: number;
  /** "12 lapsed users", already counted and translated. */
  count: string;
  action: string;
  links: LinkId[];
  onOpen: () => void;
  children?: ReactNode;
}

function ListFooter({ total, count, action, links, onOpen, children }: ListFooterProps) {
  return (
    <div className="space-y-2">
      <p className="text-fg">{action}</p>
      {children ? <p>{children}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{total > SHOWN ? t('Showing the {shown} with the most usage, of {total}.', { shown: fmtInt(SHOWN), total: fmtInt(total) }) : `${count}.`}</span>
        <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={onOpen}>
          {total > SHOWN ? t('Open all {total} in Users', { total: fmtInt(total) }) : t('Open in Users')}
          <ArrowRight size={12} className="rtl:-scale-x-100" />
        </button>
      </div>
      <DocLinks ids={links} title={t('Learn more')} compact />
    </div>
  );
}

const byUsage = (a: UserProfile, b: UserProfile): number => b.gross - a.gross;

function LapsedCard() {
  const { analysis, settings } = useAnalysis();
  const { users, range } = analysis;
  const withYear = dateParts(range.start).y !== dateParts(range.end).y;
  const lapsed = useMemo(() => users.profiles.filter((profile) => profile.lapsed).sort(byUsage), [users]);
  const days = pluralize(settings.lapsedDays, 'day');

  return (
    <Card
      title={t('Lapsed users')}
      subtitle={t('Used GitHub Copilot earlier, then nothing for {days} or more by the end of the range.', { days })}
      padded={false}
      calc="lapsed-users"
      footer={
        lapsed.length > 0 ? (
          <ListFooter
            total={lapsed.length}
            count={pluralize(lapsed.length, 'lapsed user')}
            action={t('Ask them whether they still need GitHub Copilot. A seat nobody uses can go to someone who will.')}
            links={['remindInactive', 'seatAssignment', 'learnFundamentals1']}
            onOpen={() => drill({ engagement: ['lapsed'] }, { page: 'users', merge: true })}
          >
            {t('Users first seen in the last {days} are not counted, because they have had little time to use it.', {
              days: pluralize(settings.newUserDays, 'day'),
            })}
          </ListFooter>
        ) : undefined
      }
    >
      {lapsed.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={22} className="text-good" />}
          title={t('No lapsed users')}
          description={t('Every user was active in the last {days} of the range, or started recently.', { days })}
        />
      ) : (
        <UserList
          headers={[t('User'), t('Last active'), t('Days since'), t('Usage before')]}
          rows={lapsed.slice(0, SHOWN).map((profile) => ({
            profile: profile,
            cells: [fmtDay(profile.lastDay, withYear), fmtInt(profile.daysSinceLast), fmtUSD(profile.gross)],
          }))}
        />
      )}
    </Card>
  );
}

function FadingCard() {
  const { analysis, settings } = useAnalysis();
  const { users, range } = analysis;
  const fading = useMemo(() => users.profiles.filter((profile) => profile.traits.includes('fading')).sort(byUsage), [users]);

  let body: ReactNode;
  if (!users.trendReliable) {
    body = (
      <EmptyState
        icon={<Info size={22} />}
        title={t('Needs 14 days of data')}
        description={t('Fading users compare the last 7 days with the 7 days before, so the range needs at least 14 days. This range has {days}.', {
          days: pluralize(range.length, 'day'),
        })}
      />
    );
  } else if (fading.length === 0) {
    body = (
      <EmptyState
        icon={<CheckCircle2 size={22} className="text-good" />}
        title={t('No fading users')}
        description={t('No user with at least {amount} in the earlier 7 days dropped to half or less in the last 7 days.', {
          amount: fmtUSD(settings.minSpendForTraits),
        })}
      />
    );
  } else {
    body = (
      <UserList
        headers={[t('User'), t('7-day change'), t('Usage')]}
        rows={fading.slice(0, SHOWN).map((profile) => {
          const change = fmtDelta(profile.recent, profile.prior);
          return {
            profile: profile,
            cells: [
              <span
                key="change"
                className="text-bad"
                title={t('{recent} in the last 7 days, {prior} in the 7 days before', { recent: fmtUSD(profile.recent), prior: fmtUSD(profile.prior) })}
              >
                {change ? change.text : '–'}
              </span>,
              fmtUSD(profile.gross),
            ],
          };
        })}
      />
    );
  }

  return (
    <Card
      title={t('Fading users')}
      subtitle={t('Usage in the last 7 days of the range is half or less of the 7 days before.')}
      padded={false}
      calc="fading-users"
      footer={
        users.trendReliable && fading.length > 0 ? (
          <ListFooter
            total={fading.length}
            count={pluralize(fading.length, 'fading user')}
            action={t('Check in with them before they stop. A short tip or a training session can help them get value from GitHub Copilot again.')}
            links={['rolloutGuide', 'learnFundamentals1', 'learnFundamentals2']}
            onOpen={() => drill({ traits: ['fading'] }, { page: 'users', merge: true })}
          >
            {t('Only users with at least {amount} in the earlier 7 days are checked. Hover a change to see the amounts.', {
              amount: fmtUSD(settings.minSpendForTraits),
            })}
          </ListFooter>
        ) : undefined
      }
    >
      {body}
    </Card>
  );
}

// Fading users come first: they can still be won back, while lapsed users have already stopped.
export default function LapsedFading() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FadingCard />
      <LapsedCard />
    </div>
  );
}
