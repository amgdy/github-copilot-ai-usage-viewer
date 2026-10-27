import { useCallback, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProductIcon, VendorIcon } from '../icons';
import { msg, t } from '../../i18n';
import { DIM_FILTER_KEY, POST_LIST_KEYS, type Filters, type ListFilterKey } from '../../lib/analytics/filters';
import { facetCounts, type FacetKey } from '../../lib/analytics/series';
import type { TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { GroupStat } from '../../lib/analytics/users';
import { VENDORS, type Vendor } from '../../lib/pricing/card';
import { CATEGORIES, labelOf, type DimKey } from '../../lib/types';
import { WEEKDAY_NAMES } from '../../lib/utils/date';
import { fmtInt, fmtUSD, fmtUSDCompact } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { Drawer, Field, MultiSelect, NumberField, SearchInput, Segmented, cx, type MultiOption } from '../ui';
import { DateRangeFields } from './DateRange';

type StringFacet = Exclude<FacetKey, 'weekdays'>;
type SegmentKey = (typeof POST_LIST_KEYS)[number];

const DIM_OF = Object.fromEntries(Object.entries(DIM_FILTER_KEY).map(([dimension, key]) => [key, dimension])) as Partial<Record<ListFilterKey, DimKey>>;

/** Fixed lists whose values are English words, not names from the file. */
const TRANSLATED_VALUES = new Set<string>([msg('Other'), ...CATEGORIES]);

const used = (...lists: unknown[][]): number => lists.filter((list) => list.length > 0).length;

type SectionId = 'time' | 'who' | 'models' | 'sources' | 'billing' | 'segments';

/** How many filters of each section are active (drives the badge and which sections start open). */
const ACTIVE: Record<SectionId, (filters: Filters) => number> = {
  time: (filters) => (filters.dateFrom !== null || filters.dateTo !== null ? 1 : 0) + used(filters.weekdays),
  who: (filters) => used(filters.users, filters.plans, filters.orgs, filters.costCenters),
  models: (filters) => used(filters.models, filters.vendors, filters.categories) + (filters.selection !== 'all' ? 1 : 0),
  sources: (filters) => used(filters.products, filters.skus, filters.repos, filters.apps, filters.files),
  billing: (filters) => (filters.billing !== 'all' ? 1 : 0) + (filters.attribution !== 'all' ? 1 : 0) + (filters.minRow !== null || filters.maxRow !== null ? 1 : 0) + (filters.search.trim() ? 1 : 0),
  segments: (filters) => used(...POST_LIST_KEYS.map((key) => filters[key])) + (filters.minUserSpend !== null || filters.maxUserSpend !== null ? 1 : 0),
};

function Accordion({ title, active, open, onToggle, children }: { title: string; active: number; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="border-b border-border-muted">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-2 px-4 py-2.5 text-start hover:bg-surface-2">
        <ChevronDown size={15} className={cx('text-fg-subtle transition-transform', !open && '-rotate-90 rtl:rotate-90')} />
        <span className="flex-1 text-sm font-semibold">{title}</span>
        {active > 0 ? <span className="num rounded-xs bg-accent px-1 text-[10px] font-semibold leading-4 text-accent-fg">{active}</span> : null}
      </button>
      {open ? <div className="space-y-4 px-4 pb-4 pt-1">{children}</div> : null}
    </section>
  );
}

/** One filter list with live counts: how many rows and how much usage each option would give with every other filter applied. */
function Facet({ filterKey, title }: { filterKey: StringFacet; title: string }) {
  const { store, prep: prepared, models } = useAnalysis();
  const live = useApp((state) => state.filters);
  const filters = useDeferredValue(live);
  const toggle = useApp((state) => state.toggleFilterValue);
  const setFilters = useApp((state) => state.setFilters);
  const selected = live[filterKey];

  const counts = useMemo(() => facetCounts(store, prepared, models, filters, filterKey), [store, prepared, models, filters, filterKey]);
  const options = useMemo(() => {
    const dimension = DIM_OF[filterKey];
    const values: readonly string[] = dimension ? store.dicts[dimension].values : filterKey === 'vendors' ? VENDORS : filterKey === 'categories' ? CATEGORIES : prepared.planLabels;
    const out: (MultiOption & { gross: number })[] = [];
    for (let i = 0; i < values.length; i++) {
      const rows = counts.rows[i] ?? 0;
      const gross = counts.gross[i] ?? 0;
      // Dictionary id 0 is the blank value; static lists (vendors, categories) never show options without data.
      if (rows === 0 && ((dimension && i === 0) || !dimension)) continue;
      const value = values[i];
      const label = dimension ? labelOf(dimension, value) : TRANSLATED_VALUES.has(value) ? t(value) : value;
      const icon =
        filterKey === 'vendors' ? <VendorIcon vendor={value as Vendor} size={13} /> : filterKey === 'products' && value ? <ProductIcon product={value} size={13} /> : undefined;
      out.push({
        value,
        label,
        icon,
        gross,
        count: rows,
        meta: fmtUSDCompact(gross),
        title: `${label}\n${t('{rows} rows · {usage}', { rows: fmtInt(rows), usage: fmtUSD(gross, 2) })}`,
      });
    }
    return out;
  }, [store, prepared, counts, filterKey]);

  return (
    <Field label={selected.length ? t('{title} ({n} selected)', { title, n: selected.length }) : title}>
      <MultiSelect options={options} selected={selected} onToggle={(optionValue) => toggle(filterKey, optionValue)} onClear={() => setFilters({ [filterKey]: [] })} />
    </Field>
  );
}

/** A classification filter (tier, persona, …) with the number of users and usage in each class. Kept in the taxonomy order (best to worst, or smallest to largest), not A to Z. */
function SegmentFacet({ filterKey, title, items, stat }: { filterKey: SegmentKey; title: string; items: TaxonomyItem[]; stat: (id: string) => GroupStat | undefined }) {
  const selected = useApp((state) => state.filters[filterKey]);
  const toggle = useApp((state) => state.toggleFilterValue);
  const setFilters = useApp((state) => state.setFilters);
  const options: MultiOption[] = items.map((item) => {
    const group = stat(item.id);
    const users = group?.users ?? 0;
    return { value: item.id, label: item.label, title: item.description, count: users, meta: `${fmtInt(users)} · ${fmtUSDCompact(group?.gross ?? 0)}` };
  });
  return (
    <Field label={selected.length ? t('{title} ({n} selected)', { title, n: selected.length }) : title}>
      <MultiSelect options={options} selected={selected} searchable={false} order="given" maxHeight={260} onToggle={(optionValue) => toggle(filterKey, optionValue)} onClear={() => setFilters({ [filterKey]: [] })} />
    </Field>
  );
}

function TimeSection() {
  const { store } = useAnalysis();
  const weekdays = useApp((state) => state.filters.weekdays);
  const toggleWeekday = useApp((state) => state.toggleWeekday);
  const setFilters = useApp((state) => state.setFilters);
  return (
    <>
      <DateRangeFields store={store} />
      <Field label={t('Weekdays')} hint={t('Only include usage on the selected days of the week (UTC).')}>
        <div className="flex flex-wrap items-center gap-1.5">
          {WEEKDAY_NAMES.map((dayName, weekday) => {
            const on = weekdays.includes(weekday);
            return (
              <button
                key={dayName}
                type="button"
                aria-pressed={on}
                onClick={() => toggleWeekday(weekday)}
                className={cx('min-w-10 rounded-md border px-1.5 py-1 text-xs transition-colors', on ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-border bg-surface hover:bg-surface-3')}
              >
                {dayName}
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-3 text-xs">
          <button type="button" className="text-accent hover:underline" onClick={() => setFilters({ weekdays: [0, 1, 2, 3, 4] })}>
            {t('Workdays only')}
          </button>
          <button type="button" className="text-accent hover:underline" onClick={() => setFilters({ weekdays: [5, 6] })}>
            {t('Weekend only')}
          </button>
          {weekdays.length ? (
            <button type="button" className="text-accent hover:underline" onClick={() => setFilters({ weekdays: [] })}>
              {t('Any day')}
            </button>
          ) : null}
        </div>
      </Field>
    </>
  );
}

function ModelSelectionField() {
  const selection = useApp((state) => state.filters.selection);
  const setFilters = useApp((state) => state.setFilters);
  return (
    <Field label={t('Model selection')} hint={t('Auto lets GitHub Copilot pick the model, and paid plans get a discount on it. Manual means the user picked the model.')}>
      <Segmented
        label={t('Model selection')}
        value={selection}
        onChange={(mode) => setFilters({ selection: mode })}
        options={[
          { value: 'all', label: t('All') },
          { value: 'auto', label: t('Auto only') },
          { value: 'manual', label: t('Manual only') },
        ]}
      />
    </Field>
  );
}

function BillingSection() {
  const filters = useApp((state) => state.filters);
  const setFilters = useApp((state) => state.setFilters);
  return (
    <>
      <Field label={t('Billing')} hint={t('Covered rows were paid from included credits. Billed rows are overage.')}>
        <Segmented
          label={t('Billing')}
          value={filters.billing}
          onChange={(mode) => setFilters({ billing: mode })}
          options={[
            { value: 'all', label: t('All') },
            { value: 'covered', label: t('Covered') },
            { value: 'billed', label: t('Billed overage') },
          ]}
        />
      </Field>
      <Field label={t('Attribution')} hint={t('Repository-level products (code quality, security) have no user.')}>
        <Segmented
          label={t('Attribution')}
          value={filters.attribution}
          onChange={(mode) => setFilters({ attribution: mode })}
          options={[
            { value: 'all', label: t('All') },
            { value: 'attributed', label: t('Per user') },
            { value: 'unattributed', label: t('Repository-level') },
          ]}
        />
      </Field>
      <Field label={t('Cost of a single row (USD)')} hint={t('Find the large single charges, or hide the small ones.')}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField value={filters.minRow} onChange={(amount) => setFilters({ minRow: amount })} allowEmpty min={0} step={0.5} prefix="$" placeholder={t('min')} aria-label={t('Minimum row cost')} />
          <NumberField value={filters.maxRow} onChange={(amount) => setFilters({ maxRow: amount })} allowEmpty min={0} step={0.5} prefix="$" placeholder={t('max')} aria-label={t('Maximum row cost')} />
        </div>
      </Field>
      <Field label={t('Text search')} hint={t('All words must match the user, model, organization, cost center, repository or product.')}>
        <SearchInput value={filters.search} onChange={(query) => setFilters({ search: query })} placeholder={t('for example: claude sonnet')} />
      </Field>
    </>
  );
}

function SegmentsSection() {
  const { analysis, taxonomy } = useAnalysis();
  const groups = analysis.population.groups;
  const filters = useApp((state) => state.filters);
  const setFilters = useApp((state) => state.setFilters);
  // Without model names every user is "Not enough data", so that class is not a real choice.
  const autoUse = analysis.coverage.models ? taxonomy.autoUse : taxonomy.autoUse.filter((item) => item.id !== 'unknown');
  return (
    <>
      <p className="rounded-md bg-info-soft px-2.5 py-1.5 text-xs text-info">
        {t('Segments are worked out for the users in the rows the other filters select. Then they narrow the report. The counts show users and usage in each segment.')}
      </p>
      <SegmentFacet filterKey="segments" title={t('Persona')} items={taxonomy.personas} stat={(id) => groups.persona[id as keyof typeof groups.persona]} />
      <SegmentFacet filterKey="tiers" title={t('Usage tier')} items={taxonomy.tiers} stat={(id) => groups.tier[id as keyof typeof groups.tier]} />
      <SegmentFacet
        filterKey="engagement"
        title={t('Engagement and lifecycle')}
        items={taxonomy.engagement}
        stat={(id) => (id === 'new' || id === 'lapsed' ? groups.lifecycle[id] : groups.engagement[id as keyof typeof groups.engagement])}
      />
      <SegmentFacet filterKey="profiles" title={t('Usage profile')} items={taxonomy.profiles} stat={(id) => groups.profile[id as keyof typeof groups.profile]} />
      <SegmentFacet filterKey="traits" title={t('Behavior traits (any of)')} items={taxonomy.traits} stat={(id) => groups.trait[id as keyof typeof groups.trait]} />
      <SegmentFacet filterKey="paretoClasses" title={t('Pareto class (share of usage)')} items={taxonomy.pareto} stat={(id) => groups.pareto[id as keyof typeof groups.pareto]} />
      <SegmentFacet filterKey="autoUse" title={t('Auto use class')} items={autoUse} stat={(id) => groups.autoUse[id as keyof typeof groups.autoUse]} />
      <Field label={t('Usage per user (USD)')}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField value={filters.minUserSpend} onChange={(amount) => setFilters({ minUserSpend: amount })} allowEmpty min={0} prefix="$" placeholder={t('min')} aria-label={t('Minimum usage per user')} />
          <NumberField value={filters.maxUserSpend} onChange={(amount) => setFilters({ maxUserSpend: amount })} allowEmpty min={0} prefix="$" placeholder={t('max')} aria-label={t('Maximum usage per user')} />
        </div>
      </Field>
    </>
  );
}

function FilterPanel({ onClose }: { onClose: () => void }) {
  const { store, analysis } = useAnalysis();
  const filters = useApp((state) => state.filters);
  const reset = useApp((state) => state.resetFilters);
  const [open, setOpen] = useState<Set<SectionId>>(() => {
    const initial = (Object.keys(ACTIVE) as SectionId[]).filter((id) => ACTIVE[id](filters) > 0);
    return new Set<SectionId>(initial.length ? initial : ['who']);
  });
  const toggle = (id: SectionId) =>
    setOpen((openSections) => {
      const next = new Set(openSections);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const total = (Object.keys(ACTIVE) as SectionId[]).reduce((activeCount, id) => activeCount + ACTIVE[id](filters), 0);
  const section = (id: SectionId, title: string, children: ReactNode) => (
    <Accordion title={title} active={ACTIVE[id](filters)} open={open.has(id)} onToggle={() => toggle(id)}>
      {children}
    </Accordion>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      title={t('Filters')}
      subtitle={
        <>
          {t('{shown} of {total} rows match', { shown: fmtInt(analysis.agg.totals.rows), total: fmtInt(store.n) })}
          {analysis.agg.totals.rows > 0 ? <> · {t('{usage} usage', { usage: fmtUSD(analysis.agg.totals.gross, 0) })}</> : null}
        </>
      }
      widthClass="w-[min(480px,100vw)]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="btn" onClick={reset} disabled={total === 0}>
            {t('Clear all')}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t('Show results')}
          </button>
        </div>
      }
    >
      {section('time', t('Time'), <TimeSection />)}
      {section(
        'who',
        t('Users, plans and organizations'),
        <>
          <Facet filterKey="users" title={t('Users')} />
          <Facet filterKey="plans" title={t('Plan (by included credits)')} />
          <Facet filterKey="orgs" title={t('Organizations')} />
          <Facet filterKey="costCenters" title={t('Cost centers')} />
        </>,
      )}
      {section(
        'models',
        t('Models'),
        <>
          <Facet filterKey="models" title={t('Models')} />
          <Facet filterKey="vendors" title={t('Vendors')} />
          <Facet filterKey="categories" title={t('Model category')} />
          <ModelSelectionField />
        </>,
      )}
      {section(
        'sources',
        t('Products and sources'),
        <>
          <Facet filterKey="products" title={t('Products')} />
          <Facet filterKey="skus" title={t('SKUs')} />
          <Facet filterKey="repos" title={t('Repositories')} />
          <Facet filterKey="apps" title={t('App clients')} />
          <Facet filterKey="files" title={t('Source files')} />
        </>,
      )}
      {section('billing', t('Billing and rows'), <BillingSection />)}
      {section('segments', t('User segments'), <SegmentsSection />)}
    </Drawer>
  );
}

/** Side drawer (right in English, left in Arabic) with every filter. Sections only mount while open, so the live counts are computed lazily. */
export function FilterDrawer() {
  const open = useApp((state) => state.filterDrawerOpen);
  const setOpen = useApp((state) => state.setFilterDrawerOpen);
  const close = useCallback(() => setOpen(false), [setOpen]);
  return open ? <FilterPanel onClose={close} /> : null;
}
