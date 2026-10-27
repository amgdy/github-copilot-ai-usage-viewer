import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { NoRows } from '../components/NoRows';
import { CalcInfo, Card, EmptyState, PageHeader, Section, Segmented, type SegmentedOption } from '../components/ui';
import { t } from '../i18n';
import { useAnalysis } from '../state/analysis';
import { useApp } from '../state/store';
import { ConcentrationChart } from './segments/ConcentrationChart';
import { CrossLensMatrix } from './segments/CrossLensMatrix';
import { GroupCards } from './segments/GroupCards';
import { GroupTable } from './segments/GroupTable';
import { Insights } from './segments/Insights';
import { LabelRules } from './segments/LabelRules';
import { LensKpis } from './segments/LensKpis';
import { LensNotes } from './segments/LensNotes';
import { LENSES, LENS_BY_ID, assumedSeatCount, buildLens, lensUnavailableReason, type Availability, type LensId } from './segments/lenses';
import { PoolFlowCard } from './segments/PoolFlowCard';
import type { RuleContext } from './segments/RuleBlocks';
import { UnsupportedLens } from './segments/UnsupportedLens';
import { NarrowedNotice, usePerMonth } from './shared';

export default function SegmentsPage() {
  const { analysis, settings, taxonomy, store } = useAnalysis();
  const filters = useApp((s) => s.filters);
  const perMonth = usePerMonth();
  const [lensId, setLensId] = useState<LensId>('persona');
  const { population } = analysis;
  const lens = LENS_BY_ID[lensId];
  const activeIds = filters[lens.filterKey];
  const hasModels = analysis.coverage.models;
  const description = t(
    'What kinds of users do you have, how much does each kind use, and what should you do about each? Every user has a persona, a usage tier, an engagement level, a usage profile, a Pareto class and an Auto use class, and may have traits. Choose a lens to compare the groups of one label.',
  );

  const availability = useMemo<Availability>(
    () => ({ hasTokens: store.hasTokens, hasModels, trendReliable: population.trendReliable, hasCostCenters: population.hasCostCenters }),
    [store.hasTokens, hasModels, population.trendReliable, population.hasCostCenters],
  );
  const lensOptions = useMemo<SegmentedOption<LensId>[]>(
    () =>
      LENSES.map((l) => ({
        value: l.id,
        label: t(l.label),
        title: lensUnavailableReason(l.id, availability) === null ? t(l.title) : t('{title} Not available for this report. Select it to see why.', { title: t(l.title) }),
      })),
    [availability],
  );
  const data = useMemo(() => buildLens(lens, taxonomy, population, activeIds, perMonth, availability), [lens, taxonomy, population, activeIds, perMonth, availability]);
  const ruleContext = useMemo<RuleContext>(
    () => ({ settings, taxonomy, availability, fallbackQuotaCredits: population.fallbackQuotaCredits }),
    [settings, taxonomy, availability, population.fallbackQuotaCredits],
  );
  const assumedSeats = useMemo(() => assumedSeatCount(population), [population]);

  if (analysis.agg.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t('Segments')} description={description} />
        <NoRows />
      </>
    );
  }

  if (population.totals.users === 0) {
    return (
      <>
        <PageHeader title={t('Segments')} description={description} />
        <div className="space-y-4">
          <NarrowedNotice />
          <Card>
            <EmptyState
              icon={<Users size={24} />}
              title={t('No individual users in this data')}
              description={t('Every row in view is repo-level or unattributed, so there are no users to classify. Widen the filters or load a report with a user column.')}
            />
          </Card>
        </div>
      </>
    );
  }

  const allotmentsKnown = assumedSeats < population.totals.users;
  const poolKnown = allotmentsKnown && !analysis.narrowed;
  const narrowedNotice = (
    <NarrowedNotice title={t('Pool figures are hidden while filters are on')}>
      {t(
        'This page compares groups using every user in the date range and row filters. Segment filters only mark the groups they select. Pool balance and the shared pool section are hidden while a filter other than the date range is on, because included credits are shared across all seats and cannot be split by filter.',
      )}
    </NarrowedNotice>
  );

  return (
    <>
      <PageHeader title={t('Segments')} description={description} />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-medium text-fg-muted">{t('Compare by')}</span>
          <div className="max-w-full overflow-x-auto p-0.5">
            <Segmented label={t('Lens')} value={lensId} onChange={setLensId} options={lensOptions} />
          </div>
          <CalcInfo id={lens.calc} />
        </div>
        <LensNotes
          data={data}
          segmentFiltered={analysis.segmentFiltered}
          users={population.totals.users}
          assumedSeats={assumedSeats}
          fallbackQuotaCredits={population.fallbackQuotaCredits}
        />
      </div>

      {data.unsupported !== null ? (
        <UnsupportedLens lens={lens} reason={data.unsupported} notice={narrowedNotice} />
      ) : (
        <>
          <Section title={t('Compare the groups')} description={t(lens.title)}>
            <div className="space-y-4">
              <LensKpis data={data} perMonth={perMonth} />
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ConcentrationChart data={data} />
                </div>
                <Insights data={data} />
              </div>
            </div>
          </Section>

          <Section title={t('Group profiles')} description={t('What each group means and what to do about it. Select a row, a card or a name to dig in.')}>
            <div className="space-y-4">
              {narrowedNotice}
              <GroupTable data={data} perMonth={perMonth} showCredits={allotmentsKnown} showPool={poolKnown} billingKnown={analysis.coverage.billing} />
              <GroupCards data={data} />
            </div>
          </Section>
        </>
      )}

      <Section
        title={t('Combine two lenses')}
        description={t('See where two kinds of label meet, for example users in the Power usage tier who are only Occasional.')}
      >
        <CrossLensMatrix taxonomy={taxonomy} population={population} availability={availability} />
      </Section>

      {poolKnown ? (
        <Section title={t('The shared pool')} description={t('Included credits are shared, so one user’s unused credits can cover another user’s heavy use.')}>
          <PoolFlowCard analysis={analysis} />
        </Section>
      ) : null}

      <LabelRules current={lensId} context={ruleContext} />
    </>
  );
}
