import { useMemo } from 'react';
import { Badge, Card } from '../../components/ui';
import { ImpactChip, audienceLabel } from '../../components/RecommendationCard';
import { t, tp } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { buildPlan, PHASE_SIZE, type PlanItem, type PlanPhase } from './plan';

function PlanEntry({ item }: { item: PlanItem }) {
  const { rec, owners, value, step } = item;
  return (
    <li className="rounded-md border border-border-muted bg-surface-2/50 p-3">
      <div className="text-sm font-medium">{rec.title}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {owners.map((o) => (
          <Badge key={o} tone="neutral" title={t('Who owns this action')}>
            {audienceLabel(o)}
          </Badge>
        ))}
        {value > 0 ? <ImpactChip rec={rec} /> : <span className="text-xs text-fg-subtle">{t('No dollar value')}</span>}
      </div>
      <p className="mt-1.5 line-clamp-3 text-xs text-fg-muted print:line-clamp-none">
        <span className="font-medium text-fg">{t('First step:')}</span> {step}
      </p>
    </li>
  );
}

function Phase({ phase }: { phase: PlanPhase }) {
  const id = `plan-phase-${phase.days}`;
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h4 id={id} className="mb-2 text-sm font-semibold">
        {t(phase.title)}
      </h4>
      <ol className="space-y-2">
        {phase.items.map((it) => (
          <PlanEntry key={it.rec.id} item={it} />
        ))}
      </ol>
    </section>
  );
}

/** Top actionable recommendations laid out over 90 days. The order of the list decides the phase, so it is only a starting point. */
export function PlanCard() {
  const { analysis } = useAnalysis();
  const plan = useMemo(() => buildPlan(analysis.recs), [analysis.recs]);
  const more = plan.actionable - plan.planned;

  return (
    <Card
      title={t('30/60/90-day plan')}
      subtitle={t('A starting point drawn from the top recommendations, largest impact first')}
      actions={<Badge tone="info">{t('Starting point')}</Badge>}
      calc={['rec-plan', 'rec-impact']}
    >
      {plan.phases.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('No recommendation needs action in this period, so there is nothing to schedule. Keep the habits below in mind as usage grows.')}</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            {plan.phases.map((p) => (
              <Phase key={p.days} phase={p} />
            ))}
          </div>
          <p className="text-xs text-fg-muted">
            {t(
              "The first {size} recommendations that need action go in the first 30 days, the next {size} in days 31 to 60 and the rest in days 61 to 90. Their values overlap, so they are not added up. Adjust the order to your team's capacity, and use the What-if simulator to size the combined effect.",
              { size: PHASE_SIZE },
            )}
            {more > 0
              ? ` ${tp(more, '{n} more recommendation needs action and is listed on the Recommendations tab.', '{n} more recommendations need action and are listed on the Recommendations tab.', { n: more })}`
              : ''}
          </p>
        </div>
      )}
    </Card>
  );
}
