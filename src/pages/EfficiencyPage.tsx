import { NoRows } from '../components/NoRows';
import { PageHeader } from '../components/ui';
import { msg, t } from '../i18n';
import { useAnalysis } from '../state/analysis';
import { CostPerActiveDay } from './efficiency/CostPerActiveDay';
import { HabitsWorth } from './efficiency/HabitsWorth';
import { IncludedCredits } from './efficiency/IncludedCredits';
import { Opportunities } from './efficiency/Opportunities';
import { Playbook } from './efficiency/Playbook';
import { RoleModels } from './efficiency/RoleModels';
import { Scorecard } from './efficiency/Scorecard';
import { TokenEconomics } from './efficiency/TokenEconomics';

const DESCRIPTION = msg('Are you getting the best value from each credit? Which habits waste credits, and what is it worth to change them?');

export default function EfficiencyPage() {
  const { analysis } = useAnalysis();

  if (analysis.agg.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t('Efficiency')} description={t(DESCRIPTION)} />
        <NoRows />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('Efficiency')} description={t(DESCRIPTION)} />
      <div>
        <Scorecard />
        <HabitsWorth />
        <TokenEconomics />
        <IncludedCredits />
        <CostPerActiveDay />
        <Opportunities />
        <RoleModels />
        <Playbook />
      </div>
    </>
  );
}
