import { useMemo } from 'react';
import { NoRows } from '../components/NoRows';
import { Callout, PageHeader } from '../components/ui';
import { msg, t } from '../i18n';
import { modelShiftRatios } from '../lib/analytics/levers';
import { useAnalysis } from '../state/analysis';
import { AutoCard } from './models/AutoCard';
import { buildModelRows, type ModelRow } from './models/data';
import { ModelCharts } from './models/ModelCharts';
import { ModelKpis } from './models/ModelKpis';
import { ModelTable } from './models/ModelTable';
import { ModelsOverTime } from './models/ModelsOverTime';
import { PriceCardTable } from './models/PriceCardTable';
import { RightSizing } from './models/RightSizing';
import { TierByUser } from './models/TierByUser';
import { UnpricedCard } from './models/UnpricedCard';
import { NarrowedNotice } from './shared';

const DESCRIPTION = msg('Which models drive the cost, are they right for the job, and where is a cheaper model good enough?');
const NO_MODELS: ModelRow[] = [];

export default function ModelsPage() {
  const { analysis, models, store, settings } = useAnalysis();
  const { agg } = analysis;

  const shift = useMemo(() => modelShiftRatios({ agg, models, settings }, 'same-vendor'), [agg, models, settings]);
  const rows = useMemo(() => buildModelRows(agg, models, store, shift.rows), [agg, models, store, shift]);

  if (agg.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t('Models')} description={t(DESCRIPTION)} />
        <NoRows />
      </>
    );
  }

  if (!analysis.coverage.models) {
    return (
      <>
        <PageHeader title={t('Models')} description={t(DESCRIPTION)} />
        <div className="space-y-4">
          <Callout tone="info" title={t('This file has no model names')}>
            {t(
              'Without the model column, usage cannot be split by model, model tier or Auto, so this page has nothing to chart. Load the usage report with the model column to see it. The price card below still lists the built-in models and their prices.',
            )}
          </Callout>
          <PriceCardTable rows={NO_MODELS} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('Models')} description={t(DESCRIPTION)} />
      <div className="space-y-4">
        <NarrowedNotice>
          {t(
            'The figures cover only the selected rows. Savings on this page are shown as less usage, not cash, because included credits are shared across the organization and cannot be split by filter.',
          )}
        </NarrowedNotice>
        <ModelKpis rows={rows} />
        <ModelCharts rows={rows} />
        <ModelsOverTime />
        <ModelTable rows={rows} />
        <RightSizing rows={rows} shift={shift.rows} />
        <TierByUser />
        <AutoCard rows={rows} />
        <PriceCardTable rows={rows} />
        <UnpricedCard rows={rows} />
      </div>
    </>
  );
}
