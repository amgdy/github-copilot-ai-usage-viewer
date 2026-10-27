import { useDeferredValue, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { Callout, Card, Segmented, cx } from '../../components/ui';
import type { RosterEntry } from '../../lib/analytics/settings';
import { fmtInt } from '../../lib/utils/format';
import { T, t, tp } from '../../i18n';
import { useApp } from '../../state/store';
import { mergeRoster, parseRoster, rosterFromStore } from './roster';

type Mode = 'merge' | 'replace';

const PLACEHOLDER = `octocat
hubot,Enterprise
monalisa,3900
# lines that start with # are ignored`;

const seats = (seatCount: number) => tp(seatCount, '{n} seat', '{n} seats', { n: fmtInt(seatCount) });
const users = (userCount: number) => tp(userCount, '{n} user', '{n} users', { n: fmtInt(userCount) });

function mergeMessage(mergeResult: { added: number; updated: number; unchanged: number; roster: RosterEntry[] }): string {
  return t('Added {added}, updated the plan of {updated}, left {unchanged} unchanged. The license list now has {total}.', {
    added: seats(mergeResult.added),
    updated: seats(mergeResult.updated),
    unchanged: seats(mergeResult.unchanged),
    total: seats(mergeResult.roster.length),
  });
}

interface RosterImportProps {
  roster: RosterEntry[];
  onChange: (next: RosterEntry[]) => void;
}

/** Adds seats by hand: pasted usernames, or the users of the loaded report. Files go through LicenseImport. */
export function RosterImport({ roster, onChange }: RosterImportProps) {
  // The sample's made-up users must never end up in the saved license list.
  const sample = useApp((state) => state.dataset?.sample === true);
  const store = useApp((state) => (state.dataset?.sample ? null : state.dataset?.store)) ?? null;
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('merge');
  const [result, setResult] = useState<string | null>(null);

  // Parsing is one pass over the text. Deferring it keeps typing and pasting responsive.
  const deferred = useDeferredValue(text);
  const parse = useMemo(() => parseRoster(deferred), [deferred]);
  const settled = deferred === text;
  const found = parse.entries.length;
  const ready = settled && found > 0;

  const edit = (value: string) => {
    setText(value);
    setResult(null);
  };

  const apply = () => {
    if (!ready) return;
    if (mode === 'replace') {
      onChange(parse.entries);
      setResult(t('Replaced the license list with {seats}.', { seats: seats(found) }));
    } else {
      const mergeResult = mergeRoster(roster, parse.entries, true);
      onChange(mergeResult.roster);
      setResult(mergeMessage(mergeResult));
    }
    setText('');
  };

  const useReport = () => {
    if (!store) return;
    const entries = rosterFromStore(store);
    if (mode === 'replace') {
      onChange(entries);
      setResult(t('Replaced the license list with the {users} in the report.', { users: users(entries.length) }));
    } else {
      const mergeResult = mergeRoster(roster, entries, false);
      onChange(mergeResult.roster);
      setResult(t('{users} in the report. {result}', { users: users(entries.length), result: mergeMessage(mergeResult) }));
    }
  };

  const hasText = text.trim() !== '';

  return (
    <Card title={t('Add seats by hand')} subtitle={t('Paste a list of users. Nothing changes until you add them.')}>
      <label htmlFor="roster-paste" className="label">
        {t('Users to add')}
      </label>
      <textarea
        id="roster-paste"
        className="input num h-36 resize-y font-mono text-xs leading-5"
        spellCheck={false}
        autoComplete="off"
        dir="ltr"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(event) => edit(event.target.value)}
      />
      <p className="mt-1.5 text-xs text-fg-muted">
        <T
          text="One user per line, as {user} or {userPlan}. The plan can be Business, Enterprise, a custom plan label such as Custom (2,500 credits) or a number. A number of 1,000 or more is AI credits, for example 3900. A smaller number is dollars of included credits, for example 19. A header row is skipped, and users are matched without regard to case."
          values={{ user: <code className="kbd">username</code>, userPlan: <code className="kbd">username,plan</code> }}
        />
      </p>

      {hasText ? (
        <div className={cx('mt-3 rounded-md border border-border-muted bg-surface-2 p-2.5 text-sm transition-opacity', !settled && 'opacity-60')} aria-live="polite">
          <div className="num">
            {[
              tp(found, '{n} user found', '{n} users found', { n: fmtInt(found) }),
              parse.duplicates > 0 ? tp(parse.duplicates, '{n} duplicate skipped', '{n} duplicates skipped', { n: fmtInt(parse.duplicates) }) : '',
              parse.ignoredCount > 0 ? tp(parse.ignoredCount, '{n} line ignored', '{n} lines ignored', { n: fmtInt(parse.ignoredCount) }) : '',
            ]
              .filter(Boolean)
              .join(t(', '))}
          </div>
          {parse.headerSkipped ? <div className="mt-1 text-xs text-fg-muted">{t('The header row was skipped.')}</div> : null}
          {parse.unreadablePlans > 0 ? (
            <div className="mt-1 text-xs text-warn">
              {tp(parse.unreadablePlans, '{n} plan could not be read, for example {samples}. Those users are added without a plan.', '{n} plans could not be read, for example {samples}. Those users are added without a plan.', {
                n: fmtInt(parse.unreadablePlans),
                samples: parse.unreadableSamples.map((unreadablePlan) => `"${unreadablePlan}"`).join(', '),
              })}
            </div>
          ) : null}
          {parse.ignored.length > 0 ? (
            <details className="mt-1.5 text-xs">
              <summary className="cursor-pointer text-fg-muted hover:text-fg">{t('Show ignored lines')}</summary>
              <ul className="mt-1 space-y-0.5">
                {parse.ignored.slice(0, 20).map((ignoredLine) => (
                  <li key={ignoredLine.line} className="text-fg-muted">
                    <span className="num">{t('Line {n}:', { n: fmtInt(ignoredLine.line) })}</span> <code className="font-mono">{ignoredLine.text}</code>. {t(ignoredLine.reason)}.
                  </li>
                ))}
              </ul>
              {parse.ignoredCount > 20 ? <p className="mt-1 text-fg-subtle">{t('And {n} more.', { n: fmtInt(parse.ignoredCount - 20) })}</p> : null}
            </details>
          ) : null}
          {found === 0 && parse.lines > 0 ? <div className="mt-1 text-xs text-bad">{t('No line contains a usable username.')}</div> : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented<Mode>
          label={t('How to add the users')}
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'merge', label: t('Add to the list'), title: t('Add new users and update the plan of users already in the license list') },
            { value: 'replace', label: t('Replace the list'), title: t('Swap the whole license list for this list') },
          ]}
        />
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={apply}>
          {mode === 'merge' ? t('Add {users}', { users: users(found) }) : t('Replace the license list with {users}', { users: users(found) })}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-fg-muted">
        {mode === 'merge'
          ? t('Adding keeps the users already in the list and updates their plan when you give one.')
          : t('Replacing swaps the current license list for this list.')}
      </p>

      <div className="mt-4 border-t border-border-muted pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn"
            disabled={!store}
            onClick={useReport}
            title={store ? undefined : sample ? t('The sample has made-up users. Open your own report first.') : t('Load a report first')}
          >
            <Users size={14} aria-hidden /> {t('Use the users in the loaded report')}
          </button>
          <p className="min-w-0 flex-1 basis-64 text-xs text-fg-muted">
            {t('Fills the license list with everyone who appears in the report, with the plan read from their quota.')}{' '}
            {mode === 'merge' ? t('Adding only fills in users and plans that are missing.') : t('Replacing discards the current license list first.')}{' '}
            {t('Then add the seats that never appear in the report.')}
          </p>
        </div>
      </div>

      {result ? (
        <Callout tone="good" className="mt-3">
          {result}
        </Callout>
      ) : null}
    </Card>
  );
}
