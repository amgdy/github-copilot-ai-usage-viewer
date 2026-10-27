import { useMemo, useState } from 'react';
import { NoRows } from '../components/NoRows';
import { Callout, Card, EmptyState, PageHeader, Segmented, type SegmentedOption } from '../components/ui';
import { msg, t } from '../i18n';
import { useAnalysis } from '../state/analysis';
import { NarrowedNotice } from './shared';
import { GroupDetail } from './organization/GroupDetail';
import { GroupTable } from './organization/GroupTable';
import { KpiRow } from './organization/KpiRow';
import { NoCostCenter } from './organization/NoCostCenter';
import { RankChart } from './organization/RankChart';
import { SeatsByOrg } from './organization/SeatsByOrg';
import { Showback } from './organization/Showback';
import { TreemapCard } from './organization/TreemapCard';
import { WhoIsInGroup } from './organization/WhoIsInGroup';
import { chartHeight } from './organization/bits';
import { DIM_SPECS, SPEC, defaultDim, listHasTeams, namedCount, type OrgDim } from './organization/dimensions';
import { buildGroups, buildTeamGroups, computeTrends, storeColumn, summarize, teamColumn, type GroupColumn } from './organization/groups';

const TITLE = msg('Organization');
const INTRO = msg('Which parts of the business generate the usage and the bill, and how to allocate it between teams.');

export default function OrganizationPage() {
  const { analysis } = useAnalysis();
  if (analysis.agg.totals.rows === 0) {
    return (
      <>
        <PageHeader title={t(TITLE)} description={t(INTRO)} />
        <NoRows />
      </>
    );
  }
  return <OrganizationBody />;
}

interface PageState {
  /** The loaded data the state belongs to. A new dataset starts over. */
  store: unknown;
  dim: OrgDim;
  selected: number | null;
}

function OrganizationBody() {
  const { analysis, store, settings } = useAnalysis();
  const { agg, mask, range, narrowed, licenses } = analysis;

  // The default view is chosen once per dataset, so a click that filters the report does not switch the view.
  const [state, setState] = useState<PageState>(() => ({ store, dim: defaultDim(agg), selected: null }));
  let current = state;
  if (state.store !== store) {
    current = { store, dim: defaultDim(agg), selected: null };
    setState(current);
  }

  // Teams come from the license list, so the team view is offered only when a loaded list names teams.
  const teams = useMemo(
    () => (licenses !== null && listHasTeams(settings.roster) ? teamColumn(store, settings.roster, settings.rosterAsOf) : null),
    [licenses, store, settings.roster, settings.rosterAsOf],
  );
  const dim: OrgDim = current.dim === 'team' && teams === null ? defaultDim(agg) : current.dim;
  const { selected } = current;
  const spec = SPEC[dim];

  const column = useMemo<GroupColumn>(() => (dim === 'team' && teams !== null ? teams : storeColumn(store, dim === 'team' ? 'org' : dim)), [store, dim, teams]);

  const dimOptions = useMemo<SegmentedOption<OrgDim>[]>(
    () =>
      DIM_SPECS.filter((s) => s.id !== 'team' || teams !== null).map((s) => ({
        value: s.id,
        label: t(s.label),
        title: s.id !== 'team' && namedCount(agg, s.id) === 0 ? t(s.none) : undefined,
      })),
    [agg, teams],
  );
  const trends = useMemo(() => computeTrends(store, mask, range, column), [store, mask, range, column]);
  const groups = useMemo(
    () => (dim === 'team' && teams !== null ? buildTeamGroups(store, mask, range, teams, trends, agg.totals.gross) : buildGroups(store, agg, dim === 'team' ? 'org' : dim, trends)),
    [store, agg, mask, range, dim, teams, trends],
  );
  const summary = useMemo(() => summarize(groups), [groups]);
  const selectedGroup = selected === null ? undefined : groups.find((g) => g.id === selected);
  const height = chartHeight(groups.length);
  const choose = (id: number | null) => setState({ ...current, dim, selected: id });

  return (
    <>
      <PageHeader
        title={t(TITLE)}
        description={narrowed ? t('Usage and billed amounts of the selected rows, by organization, cost center, team, repository, application or product.') : t(INTRO)}
      />
      <div className="space-y-4">
        <NarrowedNotice>
          {t(
            'The figures cover only the selected rows, and billed amounts are the ones on these rows. The seat-based allocation is hidden because seat costs need the full user list.',
          )}
        </NarrowedNotice>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm text-fg-muted">{t('View by')}</span>
          <div className="max-w-full overflow-x-auto">
            <Segmented label={t('Dimension')} value={dim} onChange={(next) => setState({ ...current, dim: next, selected: null })} options={dimOptions} />
          </div>
        </div>

        {summary.named.length === 0 ? (
          <Card>
            <EmptyState title={t(spec.none)} description={t(spec.noneHint)} />
          </Card>
        ) : (
          <>
            <KpiRow spec={spec} summary={summary} />
            {summary.named.length === 1 ? (
              <Callout tone="neutral">{t('Only one group has usage here, so there is nothing to compare. Try another view to see how usage splits.')}</Callout>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <RankChart spec={spec} groups={groups} height={height} />
              <TreemapCard spec={spec} groups={groups} height={height} />
            </div>
            <GroupTable key={dim} spec={spec} groups={groups} reliable={trends.reliable} selected={selectedGroup?.id ?? null} onSelect={choose} />
            {selectedGroup ? <GroupDetail spec={spec} column={column} group={selectedGroup} onClear={() => choose(null)} /> : null}
          </>
        )}

        {dim === 'org' || dim === 'costCenter' || dim === 'team' ? (
          <WhoIsInGroup key={dim} spec={spec} column={column} groups={groups} onSelect={choose} />
        ) : null}
        <SeatsByOrg />
        <Showback />
        <NoCostCenter />
      </div>
    </>
  );
}
