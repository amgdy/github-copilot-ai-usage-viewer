import { useMemo } from 'react';
import { CalendarRange } from 'lucide-react';
import { t } from '../../i18n';
import { isoDate, monthEndDay, monthIndexOf, monthLabel, monthStartDay, parseIsoDay, fmtDay } from '../../lib/utils/date';
import type { DataStore } from '../../lib/types';
import { useApp } from '../../state/store';
import { Popover, cx } from '../ui';

interface Preset {
  label: string;
  from: number | null;
  to: number | null;
}

/** Quick ranges relative to the loaded data (not today's date, since reports are usually historical). */
export function datePresets(store: DataStore): Preset[] {
  const { minDay: min, maxDay: max } = store;
  const out: Preset[] = [{ label: t('All time'), from: null, to: null }];
  for (const n of [7, 14, 30]) if (max - min + 1 > n) out.push({ label: t('Last {n} days', { n }), from: max - n + 1, to: max });
  const first = monthIndexOf(min);
  const last = monthIndexOf(max);
  for (let m = last; m >= Math.max(first, last - 11); m--) {
    out.push({ label: monthLabel(m), from: Math.max(min, monthStartDay(m)), to: Math.min(max, monthEndDay(m)) });
  }
  return out;
}

export function describeRange(store: DataStore, from: number | null, to: number | null): string {
  if (from === null && to === null) return t('All time');
  const a = from ?? store.minDay;
  const b = to ?? store.maxDay;
  return t('{from} to {to}', { from: fmtDay(a, true), to: fmtDay(b, true) });
}

/** Preset buttons and two date inputs bound to the global date filter. */
export function DateRangeFields({ store, onPreset }: { store: DataStore; onPreset?: () => void }) {
  const from = useApp((s) => s.filters.dateFrom);
  const to = useApp((s) => s.filters.dateTo);
  const setFilters = useApp((s) => s.setFilters);
  const presets = useMemo(() => datePresets(store), [store]);
  const min = isoDate(store.minDay);
  const max = isoDate(store.maxDay);
  const onDate = (which: 'from' | 'to', raw: string) => {
    if (!raw) return setFilters(which === 'from' ? { dateFrom: null } : { dateTo: null });
    const d = parseIsoDay(raw);
    if (!Number.isFinite(d)) return;
    if (which === 'from') setFilters({ dateFrom: d, dateTo: to !== null && to < d ? d : to });
    else setFilters({ dateTo: d, dateFrom: from !== null && from > d ? d : from });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const on = p.from === from && p.to === to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setFilters({ dateFrom: p.from, dateTo: p.to });
                onPreset?.();
              }}
              className={cx('rounded-sm border px-2 py-0.5 text-xs transition-colors', on ? 'border-accent/60 bg-accent-soft font-semibold text-accent' : 'border-border bg-surface hover:border-fg-subtle hover:bg-surface-2')}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="label">{t('From')}</span>
          <input type="date" className="input" min={min} max={max} value={from === null ? '' : isoDate(from)} onChange={(e) => onDate('from', e.target.value)} />
        </label>
        <label>
          <span className="label">{t('To')}</span>
          <input type="date" className="input" min={min} max={max} value={to === null ? '' : isoDate(to)} onChange={(e) => onDate('to', e.target.value)} />
        </label>
      </div>
      <p className="text-[11px] text-fg-subtle">{t('The data covers {from} to {to}.', { from: fmtDay(store.minDay, true), to: fmtDay(store.maxDay, true) })}</p>
    </div>
  );
}

/** Top-bar button showing the active date range; opens the date fields in a popover. */
export function DateRangeButton({ store }: { store: DataStore }) {
  const from = useApp((s) => s.filters.dateFrom);
  const to = useApp((s) => s.filters.dateTo);
  const active = from !== null || to !== null;
  return (
    <Popover
      trigger={(_open, toggle) => (
        <button
          type="button"
          onClick={toggle}
          className={cx('btn', active && 'border-accent text-accent')}
          title={t('Change the date range')}
          aria-label={t('Date range: {range}', { range: describeRange(store, from, to) })}
        >
          <CalendarRange size={15} />
          <span className="hidden sm:inline">{describeRange(store, from, to)}</span>
        </button>
      )}
      className="w-80 p-3"
    >
      {(close) => <DateRangeFields store={store} onPreset={close} />}
    </Popover>
  );
}
