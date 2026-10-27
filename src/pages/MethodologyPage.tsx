import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { Badge, Callout, EmptyState, PageHeader, SearchInput, Segmented, Select, cx } from '../components/ui';
import { BASIS_TONE } from '../components/ui/CalcDetails';
import { t } from '../i18n';
import { METRICS, metricDoc, metricsByArea, searchMetrics } from '../lib/metrics/registry';
import { BASIS_HELP, BASIS_LABEL, METRIC_AREAS, type MetricArea, type MetricBasis } from '../lib/metrics/types';
import { useRouteArg } from '../state/router';
import { useApp } from '../state/store';
import { MetricRow, elementId } from './methodology/MetricRow';

type BasisFilter = MetricBasis | 'all';

const BASES: MetricBasis[] = ['reported', 'calculated', 'estimated'];

const areaId = (area: string): string => `area-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

function KindLegend() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {BASES.map((basis) => (
        <div key={basis} className="rounded-lg border border-border-muted bg-surface-2 px-3 py-2">
          <Badge tone={BASIS_TONE[basis]}>{t(BASIS_LABEL[basis])}</Badge>
          <p className="mt-1.5 text-xs text-fg-muted">{t(BASIS_HELP[basis])}</p>
        </div>
      ))}
    </div>
  );
}

export default function MethodologyPage() {
  const target = useRouteArg();
  const showCalc = useApp((state) => state.showCalc);
  const setShowCalc = useApp((state) => state.setShowCalc);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<MetricArea | 'all'>('all');
  const [basis, setBasis] = useState<BasisFilter>('all');
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(metricDoc(target) ? [target] : []));

  // A link such as #/methodology/cache-hit opens that explanation, clears the filters that would hide it and scrolls to it.
  useEffect(() => {
    if (!target || !metricDoc(target)) return;
    setQuery('');
    setArea('all');
    setBasis('all');
    setOpen((prev) => (prev.has(target) ? prev : new Set(prev).add(target)));
    const timer = window.setTimeout(() => document.getElementById(elementId(target))?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
    return () => window.clearTimeout(timer);
  }, [target]);

  const shown = useMemo(() => {
    let docs = searchMetrics(query);
    if (area !== 'all') docs = docs.filter((doc) => doc.area === area);
    if (basis !== 'all') docs = docs.filter((doc) => doc.basis === basis);
    return docs;
  }, [query, area, basis]);
  const groups = useMemo(() => metricsByArea(shown), [shown]);

  const areaOptions = useMemo(() => {
    const present = new Set(METRICS.map((doc) => doc.area));
    return [{ value: 'all' as const, label: t('All areas') }, ...METRIC_AREAS.filter((metricArea) => present.has(metricArea)).map((metricArea) => ({ value: metricArea, label: t(metricArea) }))];
  }, []);

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);
  const allOpen = shown.length > 0 && shown.every((doc) => open.has(doc.id));
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(shown.map((doc) => doc.id)));

  const counts = useMemo(() => {
    const countsByBasis: Record<MetricBasis, number> = { reported: 0, calculated: 0, estimated: 0 };
    for (const doc of METRICS) countsByBasis[doc.basis]++;
    return countsByBasis;
  }, []);

  return (
    <>
      <PageHeader
        title={t('Methodology')}
        description={t('How every number in this report is calculated: what it means, the formula, the columns of your file it uses and the settings that change it.')}
        actions={
          <button type="button" className={cx('btn btn-sm', showCalc && 'border-accent text-accent')} aria-pressed={showCalc} onClick={() => setShowCalc(!showCalc)}>
            <Calculator size={14} />
            {showCalc ? t('Formulas shown on pages') : t('Show formulas on pages')}
          </button>
        }
      />

      <div className="space-y-4">
        <Callout tone="info" title={t('Where to find the calculation of a number')}>
          {t(
            'Look for the small calculator icon next to a number, a chart title or a table column to open its explanation in place. The "Show calculations" switch in the top bar prints the formula under every number. This page lists all of them in one place.',
          )}
        </Callout>

        <KindLegend />

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            className="w-full sm:w-72"
            value={query}
            onChange={setQuery}
            placeholder={t('Search formulas, for example cache or Auto')}
            aria-label={t('Search the calculations')}
          />
          <Select value={area} onChange={setArea} options={areaOptions} aria-label={t('Filter by area')} />
          <Segmented
            size="sm"
            label={t('Filter by kind of number')}
            value={basis}
            onChange={setBasis}
            options={[
              { value: 'all', label: t('All {n}', { n: METRICS.length }) },
              ...BASES.map((metricBasis) => ({ value: metricBasis, label: `${t(BASIS_LABEL[metricBasis])} ${counts[metricBasis]}`, title: t(BASIS_HELP[metricBasis]) })),
            ]}
          />
          <button type="button" className="btn btn-sm ms-auto" onClick={toggleAll} disabled={shown.length === 0}>
            {allOpen ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
            {allOpen ? t('Collapse all') : t('Expand all')}
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="card">
            <EmptyState title={t('Nothing matches')} description={t('Try fewer words, or set the area and the kind of number back to all.')} />
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.area} aria-labelledby={areaId(group.area)}>
              <h2 id={areaId(group.area)} className="mb-1.5 text-sm font-semibold">
                {t(group.area)} <span className="num font-normal text-fg-subtle">({group.docs.length})</span>
              </h2>
              <ul className="space-y-1.5">
                {group.docs.map((doc) => (
                  <MetricRow key={doc.id} doc={doc} open={open.has(doc.id)} highlighted={doc.id === target} onToggle={() => toggle(doc.id)} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
