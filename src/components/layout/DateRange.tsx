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
  for (const dayCount of [7, 14, 30]) if (max - min + 1 > dayCount) out.push({ label: t('Last {n} days', { n: dayCount }), from: max - dayCount + 1, to: max });
  const first = monthIndexOf(min);
  const last = monthIndexOf(max);
  for (let month = last; month >= Math.max(first, last - 11); month--) {
    out.push({ label: monthLabel(month), from: Math.max(min, monthStartDay(month)), to: Math.min(max, monthEndDay(month)) });
  }
  return out;
}

export function describeRange(store: DataStore, from: number | null, to: number | null): string {
  if (from === null && to === null) return t('All time');
  const startDay = from ?? store.minDay;
  const endDay = to ?? store.maxDay;
  return t('{from} to {to}', { from: fmtDay(startDay, true), to: fmtDay(endDay, true) });
}

/** Preset buttons and two date inputs bound to the global date filter. */
export function DateRangeFields({ store, onPreset }: { store: DataStore; onPreset?: () => void }) {
  const from = useApp((state) => state.filters.dateFrom);
  const to = useApp((state) => state.filters.dateTo);
  const setFilters = useApp((state) => state.setFilters);
  const presets = useMemo(() => datePresets(store), [store]);
  const min = isoDate(store.minDay);
  const max = isoDate(store.maxDay);
  const onDate = (which: 'from' | 'to', raw: string) => {
    if (!raw) return setFilters(which === 'from' ? { dateFrom: null } : { dateTo: null });
    const day = parseIsoDay(raw);
    if (!Number.isFinite(day)) return;
    if (which === 'from') setFilters({ dateFrom: day, dateTo: to !== null && to < day ? day : to });
    else setFilters({ dateTo: day, dateFrom: from !== null && from > day ? day : from });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const on = preset.from === from && preset.to === to;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setFilters({ dateFrom: preset.from, dateTo: preset.to });
                onPreset?.();
              }}
              className={cx('rounded-sm border px-2 py-0.5 text-xs transition-colors', on ? 'border-accent/60 bg-accent-soft font-semibold text-accent' : 'border-border bg-surface hover:border-fg-subtle hover:bg-surface-2')}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="label">{t('From')}</span>
          <input type="date" className="input" min={min} max={max} value={from === null ? '' : isoDate(from)} onChange={(event) => onDate('from', event.target.value)} />
        </label>
        <label>
          <span className="label">{t('To')}</span>
          <input type="date" className="input" min={min} max={max} value={to === null ? '' : isoDate(to)} onChange={(event) => onDate('to', event.target.value)} />
        </label>
      </div>
      <p className="text-[11px] text-fg-subtle">{t('The data covers {from} to {to}.', { from: fmtDay(store.minDay, true), to: fmtDay(store.maxDay, true) })}</p>
    </div>
  );
}

/** Top-bar button showing the active date range; opens the date fields in a popover. */
export function DateRangeButton({ store }: { store: DataStore }) {
  const from = useApp((state) => state.filters.dateFrom);
  const to = useApp((state) => state.filters.dateTo);
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
