import { useMemo } from 'react';
import { X } from 'lucide-react';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { chipText, describeFilters } from '../../state/filterChips';
import { useApp } from '../../state/store';

/** The active filters as removable chips, shown under the top bar. */
export function FilterChips() {
  const filters = useApp((state) => state.filters);
  const setFilters = useApp((state) => state.setFilters);
  const reset = useApp((state) => state.resetFilters);
  const openDrawer = useApp((state) => state.setFilterDrawerOpen);
  const { store, taxonomy } = useAnalysis();
  const chips = useMemo(() => describeFilters(filters, store, taxonomy), [filters, store, taxonomy]);
  if (!chips.length) return null;
  return (
    <div className="no-print flex flex-wrap items-center gap-1.5 border-b border-border bg-bg px-4 py-2" role="list" aria-label={t('Active filters')}>
      <span className="me-0.5 text-xs font-medium text-fg-muted">{t('Filtered by')}</span>
      {chips.map((chip) => (
        <span key={chip.id} role="listitem" className="chip" title={chipText(chip)}>
          <span className="text-fg-muted">{chip.group}:</span>
          <span className="truncate font-medium">{chip.value}</span>
          <button type="button" aria-label={t('Remove filter {name}', { name: chipText(chip) })} onClick={() => setFilters(chip.clear)} className="-me-0.5 rounded-xs p-0.5 text-fg-subtle hover:bg-surface-3 hover:text-fg">
            <X size={12} />
          </button>
        </span>
      ))}
      <button type="button" className="ms-1 text-xs text-accent hover:underline" onClick={() => openDrawer(true)}>
        {t('Edit')}
      </button>
      <button type="button" className="text-xs text-accent hover:underline" onClick={reset}>
        {t('Clear all')}
      </button>
    </div>
  );
}
