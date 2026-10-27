import { useState } from 'react';
import { PageHeader } from '../components/ui';
import { t } from '../i18n';
import { AppearanceSection } from './settings/AppearanceSection';
import { BudgetSection } from './settings/BudgetSection';
import { DataSection } from './settings/DataSection';
import { PageEpoch } from './settings/epoch';
import { GlossarySection } from './settings/GlossarySection';
import { ModelsSection } from './settings/ModelsSection';
import { RosterSection } from './settings/RosterSection';
import { SectionNav, useScrollSpy } from './settings/SectionNav';
import { ThresholdsSection } from './settings/ThresholdsSection';

export default function SettingsPage() {
  const { active, jump } = useScrollSpy();
  // Bumped when the settings are replaced as a whole (import, reset all), so every input shows the new values.
  const [epoch, setEpoch] = useState(0);

  return (
    <PageEpoch value={epoch}>
      <PageHeader
        title={t('Settings')}
        description={t('Set your budget, your license list and how users are grouped. Changes apply right away and stay in this browser.')}
      />
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <SectionNav active={active} onJump={jump} />
        <div className="min-w-0 space-y-8">
          <BudgetSection />
          <RosterSection />
          <ThresholdsSection />
          <ModelsSection />
          <DataSection onReplaced={() => setEpoch((prev) => prev + 1)} />
          <AppearanceSection />
          <GlossarySection />
        </div>
      </div>
    </PageEpoch>
  );
}
