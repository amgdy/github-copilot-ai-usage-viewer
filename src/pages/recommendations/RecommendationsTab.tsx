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
  const recommendations = analysis.recs;
  const printing = usePrinting();
  const [expand, setExpand] = useState({ open: false, epoch: 0 });

  const counts = useMemo(() => facetCounts(recommendations, filters), [recommendations, filters]);
  const visible = useMemo(() => sortRecs(applyFilters(recommendations, filters), filters.sort), [recommendations, filters]);
  const groups = useMemo(() => (filters.sort === 'priority' ? groupBySeverity(visible) : []), [visible, filters.sort]);

  // The card keeps its own open state, so a new key is how "Expand all" and "Collapse all" reach it.
  const cards = (list: Recommendation[]) => (
    <div className="space-y-2">
      {list.map((recommendation) => (
        <RecommendationCard key={`${recommendation.id}:${expand.epoch}:${printing}`} rec={recommendation} defaultOpen={expand.open || printing} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <SummaryStrip recs={recommendations} />

      {recommendations.length === 0 ? (
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
            total={recommendations.length}
            onExpandAll={() => setExpand((previous) => ({ open: true, epoch: previous.epoch + 1 }))}
            onCollapseAll={() => setExpand((previous) => ({ open: false, epoch: previous.epoch + 1 }))}
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
              {groups.map((group) => (
                <section key={group.severity} aria-labelledby={`rec-group-${group.severity}`}>
                  <h2 id={`rec-group-${group.severity}`} className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <SeverityBadge severity={group.severity} />
                    <span className="font-normal text-fg-muted">{pluralize(group.recs.length, 'recommendation')}</span>
                  </h2>
                  {cards(group.recs)}
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
