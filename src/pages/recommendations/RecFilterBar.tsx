import { type ReactNode } from 'react';
import { ChevronsDownUp, ChevronsUpDown, FilterX } from 'lucide-react';
import { audienceLabel, themeLabel } from '../../components/RecommendationCard';
import { CalcInfo, SearchInput, Segmented, Select, TONE_FILL, Toggle, cx, severityLabel, severityTone, type Tone } from '../../components/ui';
import { T, t } from '../../i18n';
import { pluralize } from '../../lib/utils/format';
import {
  SEVERITIES,
  THEMES,
  clearFilters,
  hasActiveFilters,
  toggleIn,
  type AudienceFilter,
  type FacetCounts,
  type RecFilters,
  type SortKey,
} from './recFilters';

const audienceOptions = (): { value: AudienceFilter; label: string }[] => [
  { value: 'all', label: t('All') },
  { value: 'management', label: audienceLabel('management') },
  { value: 'admin', label: audienceLabel('admin') },
  { value: 'user', label: audienceLabel('user') },
];

// "priority" is the severity order and "value" is the order of the most impact first (the default).
const sortOptions = (): { value: SortKey; label: string }[] => [
  { value: 'priority', label: t('Sort by severity') },
  { value: 'value', label: t('Sort by impact') },
  { value: 'confidence', label: t('Sort by confidence') },
];

function FilterChip({ pressed, count, tone, onClick, children }: { pressed: boolean; count: number; tone?: Tone; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs transition-colors',
        pressed ? cx(TONE_FILL[tone ?? 'accent'], 'font-semibold') : 'border-border bg-surface text-fg-muted hover:border-fg-subtle hover:text-fg',
        count === 0 && !pressed && 'opacity-50',
      )}
    >
      {children}
      <span className="num rounded-xs bg-surface-3 px-1 text-[11px] text-fg-muted">{count}</span>
    </button>
  );
}

function ChipGroup({ label, calc, children }: { label: string; calc?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="me-1 inline-flex items-center gap-1 text-xs font-medium text-fg-muted">
        {label}
        {calc ? <CalcInfo id={calc} /> : null}
      </span>
      {children}
    </div>
  );
}

/** Audience, theme, severity, search, sort and expand controls for the recommendation list. */
export function RecFilterBar({
  filters,
  onChange,
  counts,
  shown,
  total,
  onExpandAll,
  onCollapseAll,
}: {
  filters: RecFilters;
  onChange: (next: RecFilters) => void;
  counts: FacetCounts;
  shown: number;
  total: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  const set = (patch: Partial<RecFilters>) => onChange({ ...filters, ...patch });
  const active = hasActiveFilters(filters);

  return (
    <div className="card space-y-3 p-3 print:hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented label={t('Audience')} size="sm" value={filters.audience} onChange={(audience) => set({ audience })} options={audienceOptions()} />
        <SearchInput className="min-w-52 flex-1 basis-60" value={filters.query} onChange={(query) => set({ query })} placeholder={t('Search title, evidence and actions')} aria-label={t('Search recommendations')} />
        <Select aria-label={t('Sort recommendations')} className="text-xs" value={filters.sort} onChange={(sort) => set({ sort })} options={sortOptions()} />
        <Toggle checked={filters.hidePositive} onChange={(hidePositive) => set({ hidePositive })} label={<span className="text-xs font-medium">{t('Hide positive findings')}</span>} />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <ChipGroup label={t('Theme')} calc="rec-themes">
          {THEMES.map((theme) => (
            <FilterChip key={theme} pressed={filters.themes.includes(theme)} count={counts.theme[theme]} onClick={() => set({ themes: toggleIn(filters.themes, theme) })}>
              {themeLabel(theme)}
            </FilterChip>
          ))}
        </ChipGroup>
        <ChipGroup label={t('Severity')} calc="rec-severity">
          {SEVERITIES.map((severity) => (
            <FilterChip key={severity} tone={severityTone(severity)} pressed={filters.severities.includes(severity)} count={counts.severity[severity]} onClick={() => set({ severities: toggleIn(filters.severities, severity) })}>
              {severityLabel(severity)}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-muted pt-2.5">
        <p className="text-xs text-fg-muted" aria-live="polite">
          <T
            text="Showing {shown} of {recs}"
            values={{
              shown: <span className="num font-medium text-fg">{shown}</span>,
              recs: <span className="num font-medium text-fg">{pluralize(total, 'recommendation')}</span>,
            }}
          />
          {active && total > shown ? <span className="text-fg-subtle"> {t('({n} hidden by the filters)', { n: total - shown })}</span> : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {active ? (
            <button type="button" className="btn btn-sm" onClick={() => onChange(clearFilters(filters))}>
              <FilterX size={13} /> {t('Clear filters')}
            </button>
          ) : null}
          <button type="button" className="btn btn-sm" onClick={onExpandAll} disabled={shown === 0}>
            <ChevronsUpDown size={13} /> {t('Expand all')}
          </button>
          <button type="button" className="btn btn-sm" onClick={onCollapseAll} disabled={shown === 0}>
            <ChevronsDownUp size={13} /> {t('Collapse all')}
          </button>
        </div>
      </div>
    </div>
  );
}
