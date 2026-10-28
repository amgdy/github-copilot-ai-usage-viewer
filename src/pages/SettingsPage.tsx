import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui';
import { t } from '../i18n';
import { useRouteArg } from '../state/router';
import { AppearanceSection } from './settings/AppearanceSection';
import { BudgetSection } from './settings/BudgetSection';
import { DataSection } from './settings/DataSection';
import { PageEpoch } from './settings/epoch';
import { GlossarySection } from './settings/GlossarySection';
import { ModelsSection } from './settings/ModelsSection';
import { RosterSection } from './settings/RosterSection';
import { SectionNav, useScrollSpy } from './settings/SectionNav';
import { SECTION_IDS, type SectionId } from './settings/sections';
import { ThresholdsSection } from './settings/ThresholdsSection';

export default function SettingsPage() {
  const { active, jump } = useScrollSpy();
  // Bumped when the settings are replaced as a whole (import, reset all), so every input shows the new values.
  const [epoch, setEpoch] = useState(0);
  // `#/settings/data` opens the page at that section, so other pages can link straight to it.
  const target = useRouteArg();
  useEffect(() => {
    if (!SECTION_IDS.includes(target as SectionId)) return;
    // Wait for the sections to lay out, then drop the section from the URL so the same link works again.
    const timer = window.setTimeout(() => {
      jump(target as SectionId);
      window.history.replaceState(null, '', '#/settings');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, 150);
    return () => window.clearTimeout(timer);
  }, [target, jump]);

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
