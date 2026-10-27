import { create } from 'zustand';
import type { DataStore } from '../lib/types';
import type { Prepared } from '../lib/analytics/prepare';
import { emptyFilters, type Filters, type ListFilterKey } from '../lib/analytics/filters';
import { mergeSettings, saveSettings, DEFAULT_SETTINGS, type SaveResult, type Settings } from '../lib/analytics/settings';
import { loadStoredSettings } from '../pages/settings/settings-io';
import { t, type Vars } from '../i18n/core';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Dataset {
  store: DataStore;
  prep: Prepared;
  /** Human-readable description of what was loaded (the file names). Show it with datasetLabel(). */
  label: string;
  /** When set, `label` is English text with {placeholders} and is translated when shown. */
  labelVars?: Vars;
  loadedAt: number;
  /** True for the made-up sample report. The app then says so on every page. */
  sample?: boolean;
}

/** The dataset name in the current language. File names are shown as they are. */
export function datasetLabel(d: Pick<Dataset, 'label' | 'labelVars'>): string {
  return d.labelVars ? t(d.label, d.labelVars) : d.label;
}

export interface LoadingState {
  label: string;
  fraction: number;
  rows: number;
}

const THEME_KEY = 'ghcu.theme';
const SHOW_CALC_KEY = 'ghcu.showCalc';

function loadShowCalc(): boolean {
  try {
    return localStorage.getItem(SHOW_CALC_KEY) === '1';
  } catch {
    return false;
  }
}

function loadTheme(): ThemeMode {
  const requested = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('theme') : null;
  if (requested === 'light' || requested === 'dark') return requested;
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' || t === 'system' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.dataset.theme = resolved;
}

interface AppState {
  dataset: Dataset | null;
  setDataset: (d: Dataset | null) => void;
  /** True while the landing page is shown on top of an already loaded dataset ("Load other data"). */
  pickingData: boolean;
  setPickingData: (picking: boolean) => void;
  loading: LoadingState | null;
  setLoading: (l: LoadingState | null) => void;
  error: string | null;
  setError: (e: string | null) => void;

  filters: Filters;
  /** Merge a partial filter set into the current filters. */
  setFilters: (patch: Partial<Filters>) => void;
  /** Reset all filters, then apply `patch`. Used for drill-downs from charts. */
  replaceFilters: (patch?: Partial<Filters>) => void;
  /** Add the value to a string-list filter when absent, remove it when present. */
  toggleFilterValue: (key: ListFilterKey, value: string) => void;
  toggleWeekday: (dow: number) => void;
  resetFilters: () => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  /**
   * How the last settings change was kept in this browser: 'saved' in full, 'slim' (a very large license list was
   * kept with usernames and plans only) or 'failed' (the browser storage refused it; the change lasts for this visit).
   */
  settingsSaved: SaveResult;

  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  /** Prints the formula of every number under it, in addition to the calculator icon. */
  showCalc: boolean;
  setShowCalc: (on: boolean) => void;

  selectedUser: number | null;
  selectUser: (id: number | null) => void;
  filterDrawerOpen: boolean;
  setFilterDrawerOpen: (open: boolean) => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}

export const useApp = create<AppState>((set, get) => ({
  dataset: null,
  setDataset: (dataset) => set({ dataset, pickingData: false, filters: emptyFilters(), selectedUser: null, error: null }),
  pickingData: false,
  setPickingData: (pickingData) => set({ pickingData }),
  loading: null,
  setLoading: (loading) => set({ loading }),
  error: null,
  setError: (error) => set({ error }),

  filters: emptyFilters(),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  replaceFilters: (patch) => set({ filters: { ...emptyFilters(), ...patch } }),
  toggleFilterValue: (key, value) =>
    set((s) => {
      const cur = s.filters[key];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { filters: { ...s.filters, [key]: next } };
    }),
  toggleWeekday: (dow) =>
    set((s) => {
      const cur = s.filters.weekdays;
      return { filters: { ...s.filters, weekdays: cur.includes(dow) ? cur.filter((d) => d !== dow) : [...cur, dow].sort((a, b) => a - b) } };
    }),
  resetFilters: () => set({ filters: emptyFilters() }),

  settings: loadStoredSettings(),
  updateSettings: (patch) => {
    const settings = mergeSettings({ ...get().settings, ...patch });
    set({ settings, settingsSaved: saveSettings(settings) });
  },
  resetSettings: () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    set({ settings, settingsSaved: saveSettings(settings) });
  },
  settingsSaved: 'saved',

  theme: loadTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* the choice then lasts for this session only */
    }
    applyTheme(theme);
    set({ theme });
  },

  showCalc: loadShowCalc(),
  setShowCalc: (showCalc) => {
    try {
      localStorage.setItem(SHOW_CALC_KEY, showCalc ? '1' : '0');
    } catch {
      /* the choice then lasts for this session only */
    }
    set({ showCalc });
  },

  selectedUser: null,
  selectUser: (selectedUser) => set({ selectedUser }),
  filterDrawerOpen: false,
  setFilterDrawerOpen: (filterDrawerOpen) => set({ filterDrawerOpen }),
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
}));
