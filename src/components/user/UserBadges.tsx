import { useMemo } from 'react';
import { T, t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { useAnalysis } from '../../state/analysis';
import { TaxBadge, taxLookup } from '../ui';
import { hasQuota, shortItem } from './shared';

/** Persona, tier, engagement, profile, Pareto class and every trait. Hover a badge for its meaning. */
export function UserBadges({ p }: { p: UserProfile }) {
  const { taxonomy, analysis } = useAnalysis();
  const lookup = useMemo(
    () => ({
      personas: taxLookup(taxonomy.personas),
      tiers: taxLookup(taxonomy.tiers),
      engagement: taxLookup(taxonomy.engagement),
      profiles: taxLookup(taxonomy.profiles),
      pareto: taxLookup(taxonomy.pareto),
      traits: taxLookup(taxonomy.traits),
    }),
    [taxonomy],
  );
  const persona = lookup.personas[p.persona];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <TaxBadge item={persona} />
        <TaxBadge item={shortItem(lookup.tiers[p.tier])} />
        <TaxBadge item={shortItem(lookup.engagement[p.engagement])} />
        {analysis.coverage.models ? <TaxBadge item={lookup.profiles[p.profile]} /> : null}
        <TaxBadge item={lookup.pareto[p.pareto]} />
        {p.traits.map((id) => (
          <TaxBadge key={id} item={lookup.traits[id]} />
        ))}
      </div>
      {persona ? (
        <div className="space-y-0.5 text-xs text-fg-muted">
          <p>{persona.description}</p>
          <p>
            <T text="{label} {action}" values={{ label: <span className="font-medium text-fg">{t('Suggested next step:')}</span>, action: persona.action }} />
          </p>
          {hasQuota(p) ? null : (
            <p className="text-fg-subtle">{t('The file has no license size for this user, so the persona and usage tier assume one.')}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
