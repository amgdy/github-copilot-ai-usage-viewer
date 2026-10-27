import { beforeAll, describe, expect, it } from 'vitest';
import type { RosterEntry } from '../src/lib/analytics/settings';
import { firstListed, listHasTeams } from '../src/pages/organization/dimensions';
import {
  TEAM_NOT_LISTED,
  TEAM_NO_TEAM,
  TEAM_NO_USER,
  buildTeamGroups,
  computeTrends,
  summarize,
  teamColumn,
  type Group,
} from '../src/pages/organization/groups';
import { seatCoverageByOrg } from '../src/pages/organization/seats';
import { analyzeCsv, makeCsv, type Pipeline, type RowSpec } from './helpers';

const AS_OF = '2026-05-31';

const seat = (user: string, over: Partial<RosterEntry> = {}): RosterEntry => ({ user, plan: 'Business', source: 'api', ...over });

const ROSTER: RosterEntry[] = [
  // Two organizations: the seat counts in the first one. Two teams: the user counts in the first one.
  seat('Alice', { org: 'Acme, beta', team: 'Platform, Web' }),
  // Same team in other capital letters.
  seat('bob', { org: 'acme', team: 'platform' }),
  // No organization and no team in the list: the organization comes from the report.
  seat('carol'),
  // A seat whose organization the report does not name and whose holder has no usage.
  seat('ghost', { org: 'Gamma', team: 'Data', plan: 'Enterprise' }),
  // A seat with no organization anywhere.
  seat('nobody'),
];

const SPECS: RowSpec[] = [
  { date: '2026-05-10', user: 'alice', org: 'acme', gross: 4 },
  { date: '2026-05-12', user: 'alice', org: 'acme', gross: 2 },
  { date: '2026-05-11', user: 'bob', org: 'acme', gross: 3 },
  { date: '2026-05-13', user: 'carol', org: 'beta', gross: 5 },
  { date: '2026-05-14', user: 'dave', org: 'beta', gross: 7 },
  { date: '2026-05-15', org: 'acme', repo: 'acme/site', gross: 1 },
];

const must = <T>(v: T | null | undefined): T => {
  expect(v).toBeDefined();
  expect(v).not.toBeNull();
  return v as T;
};

describe('organization: firstListed', () => {
  it('takes the first name of a joined list', () => {
    expect(firstListed('a, b')).toBe('a');
    expect(firstListed(' Platform , Web')).toBe('Platform');
    expect(firstListed('a, b +3')).toBe('a');
    expect(firstListed('solo +2')).toBe('solo');
    expect(firstListed('')).toBe('');
    expect(firstListed(null)).toBe('');
    expect(firstListed(undefined)).toBe('');
  });

  it('knows when the license list names teams', () => {
    expect(listHasTeams(ROSTER)).toBe(true);
    expect(listHasTeams([seat('x'), seat('y', { team: '' })])).toBe(false);
  });
});

describe('organization: team groups and seats by organization', () => {
  let pl: Pipeline;
  beforeAll(async () => {
    pl = await analyzeCsv(makeCsv(SPECS), { settings: { roster: ROSTER, rosterAsOf: AS_OF } });
  });

  const teamGroups = (): Group[] => {
    const { store, analysis } = pl;
    const team = must(teamColumn(store, ROSTER, AS_OF));
    const trends = computeTrends(store, analysis.mask, analysis.range, team);
    return buildTeamGroups(store, analysis.mask, analysis.range, team, trends, analysis.agg.totals.gross);
  };

  it('has no team column without teams in the license list', () => {
    expect(teamColumn(pl.store, [seat('alice'), seat('bob')], AS_OF)).toBeNull();
  });

  it('groups usage by the first team of the seat, ignoring case', () => {
    const groups = teamGroups();
    const byName = new Map(groups.filter((g) => !g.blank).map((g) => [g.name, g]));
    expect([...byName.keys()]).toEqual(['Platform']);
    const platform = must(byName.get('Platform'));
    expect(platform.gross).toBeCloseTo(9, 9);
    expect(platform.users).toBe(2);
    expect(platform.value).toBe('Platform');
    expect([...(platform.filter.users ?? [])].sort()).toEqual(['alice', 'bob']);
  });

  it('keeps the people without a team apart', () => {
    const groups = teamGroups();
    const blank = new Map(groups.filter((g) => g.blank).map((g) => [g.id, g]));
    expect([...blank.keys()].sort()).toEqual([TEAM_NO_USER, TEAM_NOT_LISTED, TEAM_NO_TEAM].sort());
    expect(must(blank.get(TEAM_NO_TEAM)).gross).toBeCloseTo(5, 9);
    expect(must(blank.get(TEAM_NO_TEAM)).filter.users).toEqual(['carol']);
    expect(must(blank.get(TEAM_NOT_LISTED)).gross).toBeCloseTo(7, 9);
    expect(must(blank.get(TEAM_NOT_LISTED)).filter.users).toEqual(['dave']);
    expect(must(blank.get(TEAM_NO_USER)).gross).toBeCloseTo(1, 9);
    expect(must(blank.get(TEAM_NO_USER)).users).toBe(0);
    for (const g of blank.values()) expect(g.value).toBe('');
  });

  it('adds up to the whole view, largest usage first', () => {
    const groups = teamGroups();
    const total = pl.analysis.agg.totals.gross;
    expect(groups.reduce((a, g) => a + g.gross, 0)).toBeCloseTo(total, 9);
    expect(groups.reduce((a, g) => a + g.share, 0)).toBeCloseTo(1, 9);
    for (let i = 1; i < groups.length; i++) expect(groups[i - 1].gross).toBeGreaterThanOrEqual(groups[i].gross);
  });

  it('puts the groups without a value together in the summary', () => {
    const s = summarize(teamGroups());
    expect(s.named.map((g) => g.name)).toEqual(['Platform']);
    expect(must(s.blank).gross).toBeCloseTo(13, 9);
    expect(must(s.blank).share).toBeCloseTo(13 / 22, 9);
    expect(must(s.largest).name).toBe('Platform');
  });

  const coverage = () =>
    must(
      seatCoverageByOrg({
        users: pl.analysis.population,
        population: pl.analysis.population,
        roster: ROSTER,
        rosterAsOf: AS_OF,
        orgValues: pl.store.dicts.org.values,
        perMonth: 1,
      }),
    );

  it('is null without a license list', () => {
    expect(
      seatCoverageByOrg({
        users: pl.analysis.population,
        population: pl.analysis.population,
        roster: [],
        orgValues: pl.store.dicts.org.values,
        perMonth: 1,
      }),
    ).toBeNull();
  });

  it('counts each seat in the first organization, else in the report organization', () => {
    const c = coverage();
    const rows = new Map(c.rows.map((r) => [r.key, r]));
    expect(c.rows.map((r) => r.key)).toEqual(['gamma', 'acme', 'beta', '']);

    const acme = must(rows.get('acme'));
    expect(acme).toMatchObject({ name: 'acme', value: 'acme', known: true, seats: 2, used: 2, unused: 0, noSeat: 0 });
    expect(acme.holderUsage).toBeCloseTo(9, 9);
    expect(acme.perSeat).toBeCloseTo(4.5, 9);

    const beta = must(rows.get('beta'));
    expect(beta).toMatchObject({ value: 'beta', seats: 1, used: 1, unused: 0, noSeat: 1 });
    expect(beta.noSeatUsage).toBeCloseTo(7, 9);

    const gamma = must(rows.get('gamma'));
    expect(gamma).toMatchObject({ name: 'Gamma', value: null, known: true, seats: 1, used: 0, unused: 1 });
    expect(gamma.seatCost).toBe(39);

    const unknown = must(rows.get(''));
    expect(unknown).toMatchObject({ known: false, value: null, seats: 1, used: 0, unused: 1 });

    expect(c.multiOrg).toBe(1);
  });

  it('reconciles with the Licenses page', () => {
    const c = coverage();
    const r = must(pl.analysis.licenses);
    expect(c.totals.seats).toBe(r.seats);
    expect(c.totals.used).toBe(r.matched);
    expect(c.totals.noSeat).toBe(r.unmatched.length);
    expect(c.totals.seatCost).toBeCloseTo(r.seatCost, 6);
    expect(c.totals.seats).toBe(c.totals.used + c.totals.unused);
    expect(c.totals.seats).toBe(5);
    expect(c.totals.seatCost).toBe(4 * 19 + 39);
  });
});
