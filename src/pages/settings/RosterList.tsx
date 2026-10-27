import { useDeferredValue, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Badge, SearchInput, Segmented, Select } from '../../components/ui';
import { t } from '../../i18n';
import type { RosterEntry } from '../../lib/analytics/settings';
import { fmtInt } from '../../lib/utils/format';
import { fmtIsoDay } from '../licenses/model';
import { planText, rosterKey } from './roster';

const PAGE_SIZE = 25;

type Show = 'all' | 'missing';

interface Row {
  entry: RosterEntry;
  /** Position in the full license list. */
  index: number;
  /** Whether the user is in the report. Null when no report is loaded. */
  present: boolean | null;
}

const baseOptions = () => [
  { value: '', label: t('Not set') },
  { value: 'Business', label: t('Business') },
  { value: 'Enterprise', label: t('Enterprise') },
];

/** The select value for a stored plan, so "business" and "1900" show as Business. */
function selectValue(plan: string | undefined): string {
  if (!plan) return '';
  const text = planText(plan);
  return text === 'Business' || text === 'Enterprise' ? text : plan;
}

function optionsFor(plan: string | undefined) {
  const planValue = selectValue(plan);
  const base = baseOptions();
  return base.some((option) => option.value === planValue) ? base : [...base, { value: planValue, label: planText(plan) }];
}

/** Name, organization, team and last activity from an imported license file, when the entry has them. */
function details(entry: RosterEntry): string {
  return [
    entry.name ?? '',
    entry.org ? t('Organization: {org}', { org: entry.org }) : '',
    entry.team ? t('Team: {team}', { team: entry.team }) : '',
    entry.lastActivityAt ? t('Last activity {date}', { date: fmtIsoDay(entry.lastActivityAt) }) : '',
  ]
    .filter(Boolean)
    .join(t(', '));
}

interface RosterListProps {
  roster: RosterEntry[];
  /** Lowercase names of users in the loaded report, or null when no report is loaded. */
  inReport: Set<string> | null;
  onChange: (next: RosterEntry[]) => void;
}

/** Editable license list. Only the current page is rendered, so thousands of seats stay fast. */
export function RosterList({ roster, inReport, onChange }: RosterListProps) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const searchTerm = deferred.trim().toLowerCase();
    const out: Row[] = [];
    roster.forEach((entry, index) => {
      const present = inReport ? inReport.has(rosterKey(entry.user)) : null;
      if (show === 'missing' && present !== false) return;
      if (searchTerm && !entry.user.toLowerCase().includes(searchTerm) && !(entry.name ?? '').toLowerCase().includes(searchTerm)) return;
      out.push({ entry, index, present });
    });
    return out;
  }, [roster, inReport, deferred, show]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  // Keeps the details from an imported license file; only the plan changes.
  const setPlan = (index: number, plan: string) => {
    const next = roster.slice();
    const entry = { ...next[index] };
    if (plan) entry.plan = plan;
    else delete entry.plan;
    next[index] = entry;
    onChange(next);
  };
  const remove = (index: number) => onChange(roster.filter((_, entryIndex) => entryIndex !== index));

  if (roster.length === 0) {
    return <p className="py-6 text-center text-sm text-fg-muted">{t('The license list is empty. Import a license file, paste users above, or use the users in the loaded report.')}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="min-w-48 flex-1 basis-56"
          placeholder={t('Search users')}
          aria-label={t('Search the license list')}
          value={query}
          onChange={(nextQuery) => {
            setQuery(nextQuery);
            setPage(0);
          }}
        />
        {inReport ? (
          <Segmented<Show>
            label={t('Show seats')}
            size="sm"
            value={show}
            onChange={(nextShow) => {
              setShow(nextShow);
              setPage(0);
            }}
            options={[
              { value: 'all', label: t('All seats') },
              { value: 'missing', label: t('Not in the report'), title: t('Seats whose user never appears in the loaded report') },
            ]}
          />
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">{t('No seats match.')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border-muted">
          {visible.map(({ entry, index, present }) => {
            const more = details(entry);
            return (
              <li key={`${index}:${entry.user}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block truncate font-mono text-sm" title={entry.user} dir="ltr">
                    {entry.user}
                  </span>
                  {more ? (
                    <span className="block truncate text-xs text-fg-muted" title={more}>
                      {more}
                    </span>
                  ) : null}
                </span>
                {present === false ? <Badge tone="warn">{t('Not in the report')}</Badge> : present ? <Badge>{t('In the report')}</Badge> : null}
                <Select
                  aria-label={t('Plan for {user}', { user: entry.user })}
                  className="w-44"
                  value={selectValue(entry.plan)}
                  options={optionsFor(entry.plan)}
                  onChange={(plan) => setPlan(index, plan)}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  aria-label={t('Remove {user} from the license list', { user: entry.user })}
                  title={t('Remove from the license list')}
                  onClick={() => remove(index)}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border-muted pt-2 text-xs text-fg-muted">
        <span className="num">
          {rows.length === 0
            ? t('No seats')
            : t('Showing {from} to {to} of {total}', { from: fmtInt(start + 1), to: fmtInt(start + visible.length), total: fmtInt(rows.length) })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <button type="button" className="btn btn-sm" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label={t('Previous page')}>
            <ChevronLeft size={14} className="rtl:-scale-x-100" aria-hidden />
          </button>
          <span className="num">{t('Page {page} of {pages}', { page: fmtInt(current + 1), pages: fmtInt(pages) })}</span>
          <button type="button" className="btn btn-sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label={t('Next page')}>
            <ChevronRight size={14} className="rtl:-scale-x-100" aria-hidden />
          </button>
        </span>
      </div>
    </div>
  );
}
