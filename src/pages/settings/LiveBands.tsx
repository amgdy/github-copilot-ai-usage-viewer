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
          ? bands.map((band) =>
              band.users ? (
                <div key={band.id} className="h-full" style={{ width: `${(band.users / total) * 100}%`, background: band.color }} title={t('{name}: {users}', { name: band.label, users: pluralize(band.users, 'user') })} />
              ) : null,
            )
          : null}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {bands.map((band) => (
          <li key={band.id} className="min-w-[7rem] flex-1 rounded-md border border-border-muted bg-surface-2 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: band.color }} aria-hidden />
              <span className="truncate">{band.label}</span>
            </div>
            <div className="num text-[11px] text-fg-subtle">{band.range}</div>
            <div className="num mt-0.5 text-sm font-semibold">{band.users === null ? '–' : pluralize(band.users, 'user')}</div>
            {band.users !== null && total > 0 ? (
              <div className="num text-[11px] text-fg-subtle">
                {band.usage !== undefined
                  ? t('{users} of users, {usage} of usage', { users: fmtPct(band.users / total, 0), usage: fmtPct(band.usage, 0) })
                  : t('{users} of users', { users: fmtPct(band.users / total, 0) })}
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
  const view = bands.map((band) => {
    const groupStat = groups[band.id];
    return { ...band, users: groupStat?.users ?? 0, usage: totalUsage > 0 ? (groupStat?.gross ?? 0) / totalUsage : undefined };
  });
  const note = analysis.narrowed
    ? t('Filters are on, so the counts cover only the users that match them.')
    : t('Counts cover the users in the selected period and update when you change a limit.');
  return <BandPreview bands={view} busy={pending} note={note} />;
}

/** The bands with a live user count per band. Shows a hint instead when no report is loaded. */
export function Bands({ kind, bands }: { kind: BandKind; bands: Band[] }) {
  const hasData = useApp((state) => state.dataset !== null);
  if (!hasData) {
    return (
      <div className="space-y-2">
        <BandPreview bands={bands.map((band) => ({ ...band, users: null }))} />
        <Callout tone="neutral">{t('Load a report to see how many users fall in each band.')}</Callout>
      </div>
    );
  }
  return <LiveBands kind={kind} bands={bands} />;
}

function LiveCountInner({ group, id, what }: { group: GroupName; id: string; what?: string }) {
  const { analysis, pending } = useAnalysis();
  const groups: Groups = analysis.population.groups[group];
  const groupStat = groups[id];
  if (!groupStat) return null;
  return (
    <span className={cx('chip num transition-opacity', pending && 'opacity-60')} title={what ?? t('Users in the selected period that match this label')}>
      {tp(groupStat.users, '{n} user now', '{n} users now', { n: fmtInt(groupStat.users) })}
    </span>
  );
}

/** A small "12 users now" chip for one group. Renders nothing when no report is loaded. `what` is the translated tooltip. */
export function LiveCount({ group, id, what }: { group: GroupName; id: string; what?: string }) {
  const hasData = useApp((state) => state.dataset !== null);
  return hasData ? <LiveCountInner group={group} id={id} what={what} /> : null;
}
