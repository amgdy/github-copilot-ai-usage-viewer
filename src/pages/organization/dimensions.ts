import type { Aggregates } from '../../lib/analytics/aggregate';
import { DIM_FILTER_KEY, type Filters } from '../../lib/analytics/filters';
import type { RosterEntry } from '../../lib/analytics/settings';
import { msg } from '../../i18n';

/** The dimensions the Organization page can split usage by. `team` comes from the license list, the others from the report. */
export type OrgDim = 'org' | 'costCenter' | 'team' | 'repo' | 'app' | 'product';

/** The dimensions that are a column of the report. */
export type StoreDim = Exclude<OrgDim, 'team'>;

/** Texts of one dimension. Every text is a msg() key: translate it with t() where it is shown. */
export interface DimSpec {
  id: OrgDim;
  /** Name of the field: the View by choice and the column header. */
  label: string;
  /** Title of the count tile, for example "Organizations". */
  plural: string;
  /** Title of the table of all groups. */
  all: string;
  /** Title of the ranking chart. */
  top: string;
  /** Title of the treemap. */
  usageBy: string;
  /** Shown when no group has a value. */
  none: string;
  noneHint: string;
  /** What a blank value means for this dimension, in plain language. */
  blankHint: string;
}

export const DIM_SPECS: DimSpec[] = [
  {
    id: 'org',
    label: msg('Organization'),
    plural: msg('Organizations'),
    all: msg('All organizations'),
    top: msg('Top organizations'),
    usageBy: msg('Usage by organization'),
    none: msg('No organizations in this view'),
    noneHint: msg('No row names an organization, so there is nothing to group by. Pick another view above.'),
    blankHint: msg('Usage on rows that name no organization, so it cannot be assigned to one.'),
  },
  {
    id: 'costCenter',
    label: msg('Cost center'),
    plural: msg('Cost centers'),
    all: msg('All cost centers'),
    top: msg('Top cost centers'),
    usageBy: msg('Usage by cost center'),
    none: msg('No cost centers in this view'),
    noneHint: msg('No row names a cost center, so there is nothing to group by. Pick another view above.'),
    blankHint: msg(
      'Usage with no cost center. Repository-level products (such as code quality) have no user and often no cost center, and some users are not assigned to one. This usage cannot be charged back.',
    ),
  },
  {
    id: 'team',
    label: msg('Team (from license list)'),
    plural: msg('Teams'),
    all: msg('All teams'),
    top: msg('Top teams'),
    usageBy: msg('Usage by team'),
    none: msg('No teams in this view'),
    noneHint: msg('No user in this view has a team in the license list, so there is nothing to group by. Pick another view above.'),
    blankHint: msg(
      'Usage of people who are not in the license list or have no team in it, and of rows without a username. It cannot be assigned to a team.',
    ),
  },
  {
    id: 'repo',
    label: msg('Repository'),
    plural: msg('Repositories'),
    all: msg('All repositories'),
    top: msg('Top repositories'),
    usageBy: msg('Usage by repository'),
    none: msg('No repositories in this view'),
    noneHint: msg('No row names a repository, so there is nothing to group by. Pick another view above.'),
    blankHint: msg('Usage that is not tied to a repository. Usage by people is often not linked to one, while repository-level products usually are.'),
  },
  {
    id: 'app',
    label: msg('Application'),
    plural: msg('Applications'),
    all: msg('All applications'),
    top: msg('Top applications'),
    usageBy: msg('Usage by application'),
    none: msg('No applications in this view'),
    noneHint: msg('No row names an application, so there is nothing to group by. Pick another view above.'),
    blankHint: msg('Usage where the report names no application client.'),
  },
  {
    id: 'product',
    label: msg('Product'),
    plural: msg('Products'),
    all: msg('All products'),
    top: msg('Top products'),
    usageBy: msg('Usage by product'),
    none: msg('No products in this view'),
    noneHint: msg('No row names a product, so there is nothing to group by. Pick another view above.'),
    blankHint: msg('Usage where the report names no product.'),
  },
];

export const SPEC: Record<OrgDim, DimSpec> = Object.fromEntries(DIM_SPECS.map((spec) => [spec.id, spec])) as Record<OrgDim, DimSpec>;

/** Filter that selects one group. `value` is the dictionary string ('' selects the blank group). */
export function filterPatch(dimension: StoreDim, value: string): Partial<Filters> {
  const patch: Partial<Filters> = {};
  patch[DIM_FILTER_KEY[dimension]] = [value];
  return patch;
}

/**
 * The first name in a list of organizations or teams as the license list keeps it: names joined with ", ", and
 * " +N" at the end when more names did not fit. '' when the list is empty.
 */
export function firstListed(joined: string | null | undefined): string {
  if (!joined) return '';
  const list = joined.replace(/\s\+\d+\s*$/, '');
  const commaIndex = list.indexOf(', ');
  return (commaIndex < 0 ? list : list.slice(0, commaIndex)).trim();
}

/** The license list names a team for at least one seat, so the page can group by team. */
export function listHasTeams(roster: readonly RosterEntry[]): boolean {
  return roster.some((seat) => firstListed(seat.team) !== '');
}

/** Number of distinct non-blank values with rows in the current scope. */
export function namedCount(aggregates: Aggregates, dimension: StoreDim): number {
  const rows = aggregates[dimension].rows;
  let groupCount = 0;
  for (let id = 1; id < rows.length; id++) if (rows[id] > 0) groupCount++;
  return groupCount;
}

/** Cost center when it splits usage into several groups, otherwise organization. */
export function defaultDim(aggregates: Aggregates): OrgDim {
  return namedCount(aggregates, 'costCenter') > 1 ? 'costCenter' : 'org';
}
