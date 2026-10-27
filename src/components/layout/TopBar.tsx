import { Calculator, Filter, Menu, Monitor, Moon, Sun } from 'lucide-react';
import { t } from '../../i18n';
import { activeFilterCount } from '../../lib/analytics/filters';
import { pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { datasetLabel, useApp, type ThemeMode } from '../../state/store';
import { DateRangeButton } from './DateRange';
import { ExportMenu } from './ExportMenu';
import { LanguageButton } from './LanguageButton';
import { Badge } from '../ui/Badge';

const THEME_NEXT: Record<ThemeMode, ThemeMode> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const themeName = (mode: ThemeMode) => ({ system: t('same as your device'), light: t('light'), dark: t('dark') })[mode];

function ThemeButton() {
  const theme = useApp((state) => state.theme);
  const setTheme = useApp((state) => state.setTheme);
  const Icon = THEME_ICON[theme];
  const label = t('Theme: {now}. Click to switch to {next}.', { now: themeName(theme), next: themeName(THEME_NEXT[theme]) });
  return (
    <button type="button" className="btn btn-ghost" onClick={() => setTheme(THEME_NEXT[theme])} title={label} aria-label={label}>
      <Icon size={16} />
    </button>
  );
}

function CalcToggle() {
  const on = useApp((state) => state.showCalc);
  const setShowCalc = useApp((state) => state.setShowCalc);
  return (
    <button
      type="button"
      className={`btn ${on ? 'border-accent text-accent' : ''}`}
      aria-pressed={on}
      onClick={() => setShowCalc(!on)}
      title={on ? t('Hide the formulas printed under the numbers') : t('Print the formula under every number, chart and table column')}
    >
      <Calculator size={15} />
      <span className="hidden md:inline">{t('Show calculations')}</span>
      <span className="sr-only md:hidden">{t('Show calculations')}</span>
    </button>
  );
}

export function TopBar() {
  const { dataset, store } = useAnalysis();
  const filters = useApp((state) => state.filters);
  const setNavOpen = useApp((state) => state.setNavOpen);
  const openFilters = useApp((state) => state.setFilterDrawerOpen);
  const count = activeFilterCount(filters);
  const name = datasetLabel(dataset);
  return (
    <header className="no-print flex items-center gap-2 border-b border-border bg-bg px-3 py-2 sm:px-4">
      <button type="button" className="btn btn-ghost btn-sm lg:hidden" onClick={() => setNavOpen(true)} aria-label={t('Open navigation')}>
        <Menu size={18} />
      </button>
      {/* On a phone the buttons leave room for one letter only, so the badge and file name wait for wider screens.
          The sample notice on every page and the Data page still say what is loaded. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-fg-muted">
        {dataset.sample ? (
          <span className="hidden shrink-0 sm:inline-flex">
            <Badge tone="accent">{t('Sample data')}</Badge>
          </span>
        ) : null}
        <span className="hidden truncate sm:block" title={name}>
          <span className="font-medium text-fg">{name}</span> · {pluralize(store.n, 'row')} · {pluralize(store.files.length, 'file')}
        </span>
      </div>
      <DateRangeButton store={store} />
      <button
        type="button"
        className={`btn ${count > 0 ? 'border-accent text-accent' : ''}`}
        onClick={() => openFilters(true)}
        title={t('Open all filters')}
        aria-label={count > 0 ? t('Filters, {n} on', { n: count }) : t('Filters')}
      >
        <Filter size={15} />
        <span className="hidden sm:inline">{t('Filters')}</span>
        {count > 0 ? <span className="num rounded-xs bg-accent px-1 text-[10px] font-semibold leading-4 text-accent-fg">{count}</span> : null}
      </button>
      <CalcToggle />
      <ExportMenu />
      <LanguageButton />
      <ThemeButton />
    </header>
  );
}
