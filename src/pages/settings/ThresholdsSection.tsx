import { DEFAULT_SETTINGS, type Settings } from '../../lib/analytics/settings';
import { t } from '../../i18n';
import { useApp } from '../../state/store';
import { SettingsSection } from './SettingsSection';
import { BehaviorCard, EstimatesCard } from './ScalarCards';
import { ActiveDayCard, EngagementCard, ParetoCard, TiersCard } from './ThresholdCards';

/** What the section reset puts back. It must name every setting that this section edits. */
export function defaultThresholds(): Partial<Settings> {
  const d = DEFAULT_SETTINGS;
  return {
    activeThreshold: d.activeThreshold,
    tiers: { ...d.tiers },
    engagement: { ...d.engagement },
    pareto: { ...d.pareto },
    frontierHeavy: d.frontierHeavy,
    efficientShare: d.efficientShare,
    lapsedDays: d.lapsedDays,
    newUserDays: d.newUserDays,
    spikeShare: d.spikeShare,
    lowAuto: d.lowAuto,
    autoFirst: d.autoFirst,
    lowCacheHit: d.lowCacheHit,
    longContextShare: d.longContextShare,
    minSpendForTraits: d.minSpendForTraits,
    autoDiscount: d.autoDiscount,
    topN: d.topN,
  };
}

export function ThresholdsSection() {
  const updateSettings = useApp((s) => s.updateSettings);
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
