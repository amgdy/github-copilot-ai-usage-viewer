import { Callout, cx } from '../../components/ui';
import type { GroupStat } from '../../lib/analytics/users';
import { fmtInt, fmtPct, pluralize } from '../../lib/utils/format';
import { t, tp } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';

export interface Band {
  id: string;
  label: string;
  range: string;
  color: string;
}

export type BandKind = 'tier' | 'engagement' | 'pareto';
export type GroupName = BandKind | 'profile' | 'lifecycle' | 'autoUse' | 'trait';

interface BandView extends Band {
  users: number | null;
  /** Share of all usage, from 0 to 1. */
  usage?: number;
}

type Groups = Record<string, GroupStat | undefined>;

function BandPreview({ bands, busy, note }: { bands: BandView[]; busy?: boolean; note?: string }) {
  const total = bands.reduce((a, b) => a + (b.users ?? 0), 0);
  return (
    <div className={cx('transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <div className="flex h-3 overflow-hidden rounded-xs bg-surface-3" role="img" aria-label={t('Share of users in each band')}>
        {total > 0
          ? bands.map((b) =>
              b.users ? (
                <div key={b.id} className="h-full" style={{ width: `${(b.users / total) * 100}%`, background: b.color }} title={t('{name}: {users}', { name: b.label, users: pluralize(b.users, 'user') })} />
              ) : null,
            )
          : null}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {bands.map((b) => (
          <li key={b.id} className="min-w-[7rem] flex-1 rounded-md border border-border-muted bg-surface-2 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: b.color }} aria-hidden />
              <span className="truncate">{b.label}</span>
            </div>
            <div className="num text-[11px] text-fg-subtle">{b.range}</div>
            <div className="num mt-0.5 text-sm font-semibold">{b.users === null ? '–' : pluralize(b.users, 'user')}</div>
            {b.users !== null && total > 0 ? (
              <div className="num text-[11px] text-fg-subtle">
                {b.usage !== undefined
                  ? t('{users} of users, {usage} of usage', { users: fmtPct(b.users / total, 0), usage: fmtPct(b.usage, 0) })
                  : t('{users} of users', { users: fmtPct(b.users / total, 0) })}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {note ? <p className="mt-2 text-xs text-fg-subtle">{note}</p> : null}
    </div>
  );
}

function LiveBands({ kind, bands }: { kind: BandKind; bands: Band[] }) {
  const { analysis, pending } = useAnalysis();
  const groups: Groups = analysis.population.groups[kind];
  const totalUsage = analysis.population.totals.gross;
  const view = bands.map((b) => {
    const g = groups[b.id];
    return { ...b, users: g?.users ?? 0, usage: totalUsage > 0 ? (g?.gross ?? 0) / totalUsage : undefined };
  });
  const note = analysis.narrowed
    ? t('Filters are on, so the counts cover only the users that match them.')
    : t('Counts cover the users in the selected period and update when you change a limit.');
  return <BandPreview bands={view} busy={pending} note={note} />;
}

/** The bands with a live user count per band. Shows a hint instead when no report is loaded. */
export function Bands({ kind, bands }: { kind: BandKind; bands: Band[] }) {
  const hasData = useApp((s) => s.dataset !== null);
  if (!hasData) {
    return (
      <div className="space-y-2">
        <BandPreview bands={bands.map((b) => ({ ...b, users: null }))} />
        <Callout tone="neutral">{t('Load a report to see how many users fall in each band.')}</Callout>
      </div>
    );
  }
  return <LiveBands kind={kind} bands={bands} />;
}

function LiveCountInner({ group, id, what }: { group: GroupName; id: string; what?: string }) {
  const { analysis, pending } = useAnalysis();
  const groups: Groups = analysis.population.groups[group];
  const g = groups[id];
  if (!g) return null;
  return (
    <span className={cx('chip num transition-opacity', pending && 'opacity-60')} title={what ?? t('Users in the selected period that match this label')}>
      {tp(g.users, '{n} user now', '{n} users now', { n: fmtInt(g.users) })}
    </span>
  );
}

/** A small "12 users now" chip for one group. Renders nothing when no report is loaded. `what` is the translated tooltip. */
export function LiveCount({ group, id, what }: { group: GroupName; id: string; what?: string }) {
  const hasData = useApp((s) => s.dataset !== null);
  return hasData ? <LiveCountInner group={group} id={id} what={what} /> : null;
}
