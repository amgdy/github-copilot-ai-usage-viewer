import { type ReactNode } from 'react';
import { Callout } from '../components/ui';
import { t } from '../i18n';
import { labelOf, type DataStore, type DimKey } from '../lib/types';
import { DAYS_PER_MONTH } from '../lib/utils/date';
import { useAnalysis } from '../state/analysis';
import { useApp } from '../state/store';

/** Removes every filter except the date range. */
export function clearNarrowing(): void {
  const { filters, replaceFilters } = useApp.getState();
  replaceFilters({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
}

/**
 * Explains that organization-wide figures (pool utilization, seat changes) are hidden for a filtered view.
 * Renders nothing when no row or segment filter is active. Pass `children` to replace the default sentence.
 */
export function NarrowedNotice({ children, title }: { children?: ReactNode; title?: string }) {
  const { analysis } = useAnalysis();
  if (!analysis.narrowed) return null;
  return (
    <Callout
      tone="info"
      title={title ?? t('You are looking at a filtered view')}
      action={
        <button type="button" className="btn btn-sm" onClick={clearNarrowing}>
          {t('Clear filters')}
        </button>
      }
    >
      {children ??
        t(
          'The numbers cover only the selected rows. Numbers about the whole organization, like pool use and seat changes, are hidden. Included credits are shared by everyone, so they cannot be split by a filter.',
        )}
    </Callout>
  );
}

/** Multiplier that converts a total of the selected date range into a 30.4-day month. */
export function usePerMonth(): number {
  const { analysis } = useAnalysis();
  return DAYS_PER_MONTH / Math.max(1, analysis.range.length);
}

/** Dictionary ids of the `n` largest values, descending. Ids with a value <= `min` are skipped. */
export function topIds(values: ArrayLike<number>, n: number, opts: { min?: number; include?: (id: number) => boolean } = {}): number[] {
  const min = opts.min ?? 0;
  const ids: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] > min && (!opts.include || opts.include(i))) ids.push(i);
  }
  ids.sort((a, b) => values[b] - values[a]);
  return ids.length > n ? ids.slice(0, n) : ids;
}

/** Display label of a dictionary id ("(unattributed / repo-level)" for the blank value). */
export function dimLabel(store: DataStore, dim: DimKey, id: number): string {
  return labelOf(dim, store.dicts[dim].values[id]);
}

/** The string stored in `Filters` for a dictionary id (use it for `drill({ models: [dimValue(store, 'model', id)] })`). */
export function dimValue(store: DataStore, dim: DimKey, id: number): string {
  return store.dicts[dim].values[id];
}
