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
import { DOW_NAMES } from '../../lib/utils/date';
import { fmtInt, fmtUSD, fmtUSDCompact } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { Drawer, Field, MultiSelect, NumberField, SearchInput, Segmented, cx, type MultiOption } from '../ui';
import { DateRangeFields } from './DateRange';

type StringFacet = Exclude<FacetKey, 'weekdays'>;
type SegmentKey = (typeof POST_LIST_KEYS)[number];

const DIM_OF = Object.fromEntries(Object.entries(DIM_FILTER_KEY).map(([dim, key]) => [key, dim])) as Partial<Record<ListFilterKey, DimKey>>;

/** Fixed lists whose values are English words, not names from the file. */
const TRANSLATED_VALUES = new Set<string>([msg('Other'), ...CATEGORIES]);

const used = (...lists: unknown[][]): number => lists.filter((l) => l.length > 0).length;

type SectionId = 'time' | 'who' | 'models' | 'sources' | 'billing' | 'segments';

/** How many filters of each section are active (drives the badge and which sections start open). */
const ACTIVE: Record<SectionId, (f: Filters) => number> = {
  time: (f) => (f.dateFrom !== null || f.dateTo !== null ? 1 : 0) + used(f.weekdays),
  who: (f) => used(f.users, f.plans, f.orgs, f.costCenters),
  models: (f) => used(f.models, f.vendors, f.categories) + (f.selection !== 'all' ? 1 : 0),
  sources: (f) => used(f.products, f.skus, f.repos, f.apps, f.files),
  billing: (f) => (f.billing !== 'all' ? 1 : 0) + (f.attribution !== 'all' ? 1 : 0) + (f.minRow !== null || f.maxRow !== null ? 1 : 0) + (f.search.trim() ? 1 : 0),
  segments: (f) => used(...POST_LIST_KEYS.map((k) => f[k])) + (f.minUserSpend !== null || f.maxUserSpend !== null ? 1 : 0),
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
  const { store, prep, models } = useAnalysis();
  const live = useApp((s) => s.filters);
  const filters = useDeferredValue(live);
  const toggle = useApp((s) => s.toggleFilterValue);
  const setFilters = useApp((s) => s.setFilters);
  const selected = live[filterKey];

  const counts = useMemo(() => facetCounts(store, prep, models, filters, filterKey), [store, prep, models, filters, filterKey]);
  const options = useMemo(() => {
    const dim = DIM_OF[filterKey];
    const values: readonly string[] = dim ? store.dicts[dim].values : filterKey === 'vendors' ? VENDORS : filterKey === 'categories' ? CATEGORIES : prep.planLabels;
    const out: (MultiOption & { gross: number })[] = [];
    for (let i = 0; i < values.length; i++) {
      const rows = counts.rows[i] ?? 0;
      const gross = counts.gross[i] ?? 0;
      // Dictionary id 0 is the blank value; static lists (vendors, categories) never show options without data.
      if (rows === 0 && ((dim && i === 0) || !dim)) continue;
      const value = values[i];
      const label = dim ? labelOf(dim, value) : TRANSLATED_VALUES.has(value) ? t(value) : value;
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
  }, [store, prep, counts, filterKey]);

  return (
    <Field label={selected.length ? t('{title} ({n} selected)', { title, n: selected.length }) : title}>
      <MultiSelect options={options} selected={selected} onToggle={(v) => toggle(filterKey, v)} onClear={() => setFilters({ [filterKey]: [] })} />
    </Field>
  );
}

/** A classification filter (tier, persona, …) with the number of users and usage in each class. Kept in the taxonomy order (best to worst, or smallest to largest), not A to Z. */
function SegmentFacet({ filterKey, title, items, stat }: { filterKey: SegmentKey; title: string; items: TaxonomyItem[]; stat: (id: string) => GroupStat | undefined }) {
  const selected = useApp((s) => s.filters[filterKey]);
  const toggle = useApp((s) => s.toggleFilterValue);
  const setFilters = useApp((s) => s.setFilters);
  const options: MultiOption[] = items.map((i) => {
    const g = stat(i.id);
    const users = g?.users ?? 0;
    return { value: i.id, label: i.label, title: i.description, count: users, meta: `${fmtInt(users)} · ${fmtUSDCompact(g?.gross ?? 0)}` };
  });
  return (
    <Field label={selected.length ? t('{title} ({n} selected)', { title, n: selected.length }) : title}>
      <MultiSelect options={options} selected={selected} searchable={false} order="given" maxHeight={260} onToggle={(v) => toggle(filterKey, v)} onClear={() => setFilters({ [filterKey]: [] })} />
    </Field>
  );
}

function TimeSection() {
  const { store } = useAnalysis();
  const weekdays = useApp((s) => s.filters.weekdays);
  const toggleWeekday = useApp((s) => s.toggleWeekday);
  const setFilters = useApp((s) => s.setFilters);
  return (
    <>
      <DateRangeFields store={store} />
      <Field label={t('Weekdays')} hint={t('Only include usage on the selected days of the week (UTC).')}>
        <div className="flex flex-wrap items-center gap-1.5">
          {DOW_NAMES.map((n, i) => {
            const on = weekdays.includes(i);
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => toggleWeekday(i)}
                className={cx('min-w-10 rounded-md border px-1.5 py-1 text-xs transition-colors', on ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-border bg-surface hover:bg-surface-3')}
              >
                {n}
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
  const selection = useApp((s) => s.filters.selection);
  const setFilters = useApp((s) => s.setFilters);
  return (
    <Field label={t('Model selection')} hint={t('Auto lets GitHub Copilot pick the model, and paid plans get a discount on it. Manual means the user picked the model.')}>
      <Segmented
        label={t('Model selection')}
        value={selection}
        onChange={(v) => setFilters({ selection: v })}
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
  const f = useApp((s) => s.filters);
  const setFilters = useApp((s) => s.setFilters);
  return (
    <>
      <Field label={t('Billing')} hint={t('Covered rows were paid from included credits. Billed rows are overage.')}>
        <Segmented
          label={t('Billing')}
          value={f.billing}
          onChange={(v) => setFilters({ billing: v })}
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
          value={f.attribution}
          onChange={(v) => setFilters({ attribution: v })}
          options={[
            { value: 'all', label: t('All') },
            { value: 'attributed', label: t('Per user') },
            { value: 'unattributed', label: t('Repository-level') },
          ]}
        />
      </Field>
      <Field label={t('Cost of a single row (USD)')} hint={t('Find the large single charges, or hide the small ones.')}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField value={f.minRow} onChange={(v) => setFilters({ minRow: v })} allowEmpty min={0} step={0.5} prefix="$" placeholder={t('min')} aria-label={t('Minimum row cost')} />
          <NumberField value={f.maxRow} onChange={(v) => setFilters({ maxRow: v })} allowEmpty min={0} step={0.5} prefix="$" placeholder={t('max')} aria-label={t('Maximum row cost')} />
        </div>
      </Field>
      <Field label={t('Text search')} hint={t('All words must match the user, model, organization, cost center, repository or product.')}>
        <SearchInput value={f.search} onChange={(v) => setFilters({ search: v })} placeholder={t('for example: claude sonnet')} />
      </Field>
    </>
  );
}

function SegmentsSection() {
  const { analysis, taxonomy } = useAnalysis();
  const g = analysis.population.groups;
  const f = useApp((s) => s.filters);
  const setFilters = useApp((s) => s.setFilters);
  // Without model names every user is "Not enough data", so that class is not a real choice.
  const autoUse = analysis.coverage.models ? taxonomy.autoUse : taxonomy.autoUse.filter((i) => i.id !== 'unknown');
  return (
    <>
      <p className="rounded-md bg-info-soft px-2.5 py-1.5 text-xs text-info">
        {t('Segments are worked out for the users in the rows the other filters select. Then they narrow the report. The counts show users and usage in each segment.')}
      </p>
      <SegmentFacet filterKey="segments" title={t('Persona')} items={taxonomy.personas} stat={(id) => g.persona[id as keyof typeof g.persona]} />
      <SegmentFacet filterKey="tiers" title={t('Usage tier')} items={taxonomy.tiers} stat={(id) => g.tier[id as keyof typeof g.tier]} />
      <SegmentFacet
        filterKey="engagement"
        title={t('Engagement and lifecycle')}
        items={taxonomy.engagement}
        stat={(id) => (id === 'new' || id === 'lapsed' ? g.lifecycle[id] : g.engagement[id as keyof typeof g.engagement])}
      />
      <SegmentFacet filterKey="profiles" title={t('Usage profile')} items={taxonomy.profiles} stat={(id) => g.profile[id as keyof typeof g.profile]} />
      <SegmentFacet filterKey="traits" title={t('Behavior traits (any of)')} items={taxonomy.traits} stat={(id) => g.trait[id as keyof typeof g.trait]} />
      <SegmentFacet filterKey="paretoClasses" title={t('Pareto class (share of usage)')} items={taxonomy.pareto} stat={(id) => g.pareto[id as keyof typeof g.pareto]} />
      <SegmentFacet filterKey="autoUse" title={t('Auto use class')} items={autoUse} stat={(id) => g.autoUse[id as keyof typeof g.autoUse]} />
      <Field label={t('Usage per user (USD)')}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField value={f.minUserSpend} onChange={(v) => setFilters({ minUserSpend: v })} allowEmpty min={0} prefix="$" placeholder={t('min')} aria-label={t('Minimum usage per user')} />
          <NumberField value={f.maxUserSpend} onChange={(v) => setFilters({ maxUserSpend: v })} allowEmpty min={0} prefix="$" placeholder={t('max')} aria-label={t('Maximum usage per user')} />
        </div>
      </Field>
    </>
  );
}

function FilterPanel({ onClose }: { onClose: () => void }) {
  const { store, analysis } = useAnalysis();
  const filters = useApp((s) => s.filters);
  const reset = useApp((s) => s.resetFilters);
  const [open, setOpen] = useState<Set<SectionId>>(() => {
    const initial = (Object.keys(ACTIVE) as SectionId[]).filter((id) => ACTIVE[id](filters) > 0);
    return new Set<SectionId>(initial.length ? initial : ['who']);
  });
  const toggle = (id: SectionId) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const total = (Object.keys(ACTIVE) as SectionId[]).reduce((n, id) => n + ACTIVE[id](filters), 0);
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
  const open = useApp((s) => s.filterDrawerOpen);
  const setOpen = useApp((s) => s.setFilterDrawerOpen);
  const close = useCallback(() => setOpen(false), [setOpen]);
  return open ? <FilterPanel onClose={close} /> : null;
}
