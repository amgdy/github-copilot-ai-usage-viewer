import { useMemo, useState } from 'react';
import { CheckCircle2, SearchX } from 'lucide-react';
import { RecommendationCard } from '../../components/RecommendationCard';
import { Card, EmptyState, SeverityBadge } from '../../components/ui';
import { t } from '../../i18n';
import type { Recommendation } from '../../lib/analytics/recommendations';
import { pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { usePrinting } from '../../state/print';
import { RecFilterBar } from './RecFilterBar';
import { SummaryStrip } from './SummaryStrip';
import { applyFilters, clearFilters, facetCounts, groupBySeverity, sortRecs, type RecFilters } from './recFilters';

/** Summary, filters and the list of recommendation cards, grouped by severity when sorted by priority. */
export function RecommendationsTab({ filters, onChange }: { filters: RecFilters; onChange: (next: RecFilters) => void }) {
  const { analysis } = useAnalysis();
  const recs = analysis.recs;
  const printing = usePrinting();
  const [expand, setExpand] = useState({ open: false, epoch: 0 });

  const counts = useMemo(() => facetCounts(recs, filters), [recs, filters]);
  const visible = useMemo(() => sortRecs(applyFilters(recs, filters), filters.sort), [recs, filters]);
  const groups = useMemo(() => (filters.sort === 'priority' ? groupBySeverity(visible) : []), [visible, filters.sort]);

  // The card keeps its own open state, so a new key is how "Expand all" and "Collapse all" reach it.
  const cards = (list: Recommendation[]) => (
    <div className="space-y-2">
      {list.map((rec) => (
        <RecommendationCard key={`${rec.id}:${expand.epoch}:${printing}`} rec={rec} defaultOpen={expand.open || printing} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <SummaryStrip recs={recs} />

      {recs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 size={24} />}
            title={t('Nothing to recommend for this period')}
            description={
              analysis.agg.totals.gross > 0
                ? t('No finding needs action in these dates. Check the included credits again as usage changes, and see the Playbook tab for habits that keep usage efficient.')
                : t('There is no usage here, so there is nothing to optimize. Choose a longer date range or clear the filters to see more.')
            }
          />
        </Card>
      ) : (
        <>
          <RecFilterBar
            filters={filters}
            onChange={onChange}
            counts={counts}
            shown={visible.length}
            total={recs.length}
            onExpandAll={() => setExpand((e) => ({ open: true, epoch: e.epoch + 1 }))}
            onCollapseAll={() => setExpand((e) => ({ open: false, epoch: e.epoch + 1 }))}
          />

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={<SearchX size={24} />}
                title={t('No recommendation matches these filters')}
                description={t('Try a different search word or remove a filter.')}
                action={
                  <button type="button" className="btn btn-primary" onClick={() => onChange(clearFilters(filters))}>
                    {t('Clear filters')}
                  </button>
                }
              />
            </Card>
          ) : groups.length > 1 ? (
            <div className="space-y-5">
              {groups.map((g) => (
                <section key={g.severity} aria-labelledby={`rec-group-${g.severity}`}>
                  <h2 id={`rec-group-${g.severity}`} className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <SeverityBadge severity={g.severity} />
                    <span className="font-normal text-fg-muted">{pluralize(g.recs.length, 'recommendation')}</span>
                  </h2>
                  {cards(g.recs)}
                </section>
              ))}
            </div>
          ) : (
            cards(visible)
          )}
        </>
      )}
    </div>
  );
}
