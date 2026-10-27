import { DEFAULT_SETTINGS, type Settings } from '../../lib/analytics/settings';
import { t } from '../../i18n';
import { useApp } from '../../state/store';
import { SettingsSection } from './SettingsSection';
import { BehaviorCard, EstimatesCard } from './ScalarCards';
import { ActiveDayCard, EngagementCard, ParetoCard, TiersCard } from './ThresholdCards';

/** What the section reset puts back. It must name every setting that this section edits. */
export function defaultThresholds(): Partial<Settings> {
  const defaults = DEFAULT_SETTINGS;
  return {
    activeThreshold: defaults.activeThreshold,
    tiers: { ...defaults.tiers },
    engagement: { ...defaults.engagement },
    pareto: { ...defaults.pareto },
    frontierHeavy: defaults.frontierHeavy,
    efficientShare: defaults.efficientShare,
    lapsedDays: defaults.lapsedDays,
    newUserDays: defaults.newUserDays,
    spikeShare: defaults.spikeShare,
    lowAuto: defaults.lowAuto,
    autoFirst: defaults.autoFirst,
    lowCacheHit: defaults.lowCacheHit,
    longContextShare: defaults.longContextShare,
    minSpendForTraits: defaults.minSpendForTraits,
    autoDiscount: defaults.autoDiscount,
    topN: defaults.topN,
  };
}

export function ThresholdsSection() {
  const updateSettings = useApp((state) => state.updateSettings);
  return (
    <SettingsSection
      id="thresholds"
      description={t('The rules that sort users into tiers, engagement levels, usage profiles, personas and classes. The counts update as you change a value.')}
      onReset={() => updateSettings(defaultThresholds())}
    >
      <ActiveDayCard />
      <TiersCard />
      <EngagementCard />
      <ParetoCard />
      <BehaviorCard />
      <EstimatesCard />
    </SettingsSection>
  );
}
