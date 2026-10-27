import { createContext, useContext, useDeferredValue, useMemo, type ReactNode } from 'react';
import { analyze, type Analysis } from '../lib/analytics/analyze';
import type { Filters } from '../lib/analytics/filters';
import type { Prepared } from '../lib/analytics/prepare';
import { withoutRoster, type Settings } from '../lib/analytics/settings';
import { buildTaxonomy, type Taxonomy } from '../lib/analytics/taxonomy';
import { buildModelTable, type ModelTable } from '../lib/pricing/models';
import type { DataStore } from '../lib/types';
import { useApp, type Dataset } from './store';

export interface AnalysisContextValue {
  dataset: Dataset;
  store: DataStore;
  prep: Prepared;
  models: ModelTable;
  /** The filters the analysis below was computed with (deferred: may lag the live filters while a recompute is pending). */
  filters: Filters;
  settings: Settings;
  taxonomy: Taxonomy;
  analysis: Analysis;
  /** True while the filters or settings were just changed and the analysis is catching up. */
  pending: boolean;
}

const Ctx = createContext<AnalysisContextValue | null>(null);

/** Computes the analysis for the loaded dataset and the active filters/settings. Render only when a dataset is loaded. */
export function AnalysisProvider({ dataset, children }: { dataset: Dataset; children: ReactNode }) {
  const liveFilters = useApp((s) => s.filters);
  const storedSettings = useApp((s) => s.settings);
  // The sample report is made up, so the saved license list (real people) stays out of it.
  const liveSettings = useMemo(() => (dataset.sample ? withoutRoster(storedSettings) : storedSettings), [dataset.sample, storedSettings]);
  const filters = useDeferredValue(liveFilters);
  const settings = useDeferredValue(liveSettings);
  const { store, prep } = dataset;

  const models = useMemo(() => buildModelTable(store, settings.modelOverrides), [store, settings.modelOverrides]);
  const taxonomy = useMemo(() => buildTaxonomy(settings), [settings]);
  const analysis = useMemo(() => analyze({ store, prep, models, filters, settings }), [store, prep, models, filters, settings]);

  const value = useMemo<AnalysisContextValue>(
    () => ({ dataset, store, prep, models, filters, settings, taxonomy, analysis, pending: filters !== liveFilters || settings !== liveSettings }),
    [dataset, store, prep, models, filters, settings, taxonomy, analysis, liveFilters, liveSettings],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAnalysis(): AnalysisContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAnalysis must be used inside <AnalysisProvider>');
  return v;
}

/** The settings behind the numbers on screen (without the license list for the sample). Outside a report: the saved settings. */
export function useEffectiveSettings(): Settings {
  const stored = useApp((s) => s.settings);
  return useContext(Ctx)?.settings ?? stored;
}
