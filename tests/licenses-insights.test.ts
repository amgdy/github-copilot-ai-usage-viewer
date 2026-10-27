import { beforeAll, describe, expect, it } from 'vitest';
import { emptyFilters } from '../src/lib/analytics/filters';
import { planSeats } from '../src/lib/analytics/seats';
import { mergeSettings, type RosterEntry } from '../src/lib/analytics/settings';
import type { InactiveSeat, UserProfile, UserSet } from '../src/lib/analytics/users';
import {
  RECENT_DAYS,
  RECLAIM_DAYS,
  STALE_EXPORT_DAYS,
  buildLicenseReport,
  lastUsageDays,
  parseLicenseFile,
  rosterFromParse,
  type LicenseFinding,
  type LicenseReport,
  type ProfileLicense,
} from '../src/lib/licenses';
import { addDays, analyzeCsv, analyzeDemo, dayNum, makeCsv, mulberry32, type Pipeline, type RowSpec } from './helpers';

const AS_OF = '2026-05-31';
const ago = (days: number): string => addDays(AS_OF, -days);

/** A roster seat from an API export, with the given details. */
const seat = (user: string, over: Partial<RosterEntry> = {}): RosterEntry => ({ user, plan: 'Business', source: 'api', ...over });

interface ReportUser {
  name: string;
  gross?: number;
  /** The last day with usage (YYYY-MM-DD). Defaults to the as-of date. */
  lastDay?: string;
  quota?: number;
  org?: string;
  plan?: string;
}

function populationOf(users: ReportUser[], inactive: InactiveSeat[], fallback: number): UserSet {
  const profiles = users.map((user, index) => ({
    id: index + 1,
    name: user.name,
    org: user.org ?? 'acme',
    plan: user.plan ?? 'Business',
    quotaCredits: user.quota ?? 1900,
    gross: user.gross ?? 5,
    lastDay: dayNum(user.lastDay ?? AS_OF),
  }));
  return { profiles, inactive, fallbackQuotaCredits: fallback } as unknown as UserSet;
}

interface ReportOptions {
  /** The export date. `null` leaves the setting unset. Defaults to AS_OF. */
  asOf?: string | null;
  /** The last day of the loaded report. Defaults to AS_OF. */
  maxDay?: string;
  newUserDays?: number;
  scoped?: boolean;
  fallback?: number;
  /** Roster seats that appear in no loaded file. Defaults to the roster seats that are not report users. */
  inactive?: string[];
}

function reportOf(roster: RosterEntry[], users: ReportUser[] = [], options: ReportOptions = {}): LicenseReport {
  const names = new Set(users.map((user) => user.name.trim().toLowerCase()));
  const inactive: InactiveSeat[] =
    options.inactive !== undefined
      ? options.inactive.map((user) => ({ user, plan: null }))
      : roster.filter((entry) => !names.has(entry.user.trim().toLowerCase())).map((entry) => ({ user: entry.user, plan: entry.plan ?? null }));
  const asOf = options.asOf === undefined ? AS_OF : options.asOf === null ? undefined : options.asOf;
  const report = buildLicenseReport(
    populationOf(users, inactive, options.fallback ?? 1900),
    { roster, rosterAsOf: asOf, newUserDays: options.newUserDays ?? 14 },
    { maxDay: dayNum(options.maxDay ?? AS_OF) },
    options.scoped,
  );
  if (report === null) throw new Error('the roster has no usable seat');
  return report;
}

const loginsOf = (list: LicenseFinding[]): string[] => list.map((finding) => finding.login);
const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

function bestMs(runs: number, task: () => void): number {
  let best = Infinity;
  for (let i = 0; i < runs; i++) {
    const startMs = performance.now();
    task();
    best = Math.min(best, performance.now() - startMs);
  }
  return best;
}

describe('license report: the activity thresholds', () => {
  it('uses 30 days for recently active, 90 days for reclaim, and calls an export old after 30 days', () => {
    expect(RECENT_DAYS).toBe(30);
    expect(RECLAIM_DAYS).toBe(90);
    expect(STALE_EXPORT_DAYS).toBe(30);
  });

  it('sorts seats that are not in the report by the days since their last activity (29, 30, 31 and 89, 90, 91)', () => {
    const daysAgoValues = [0, 1, RECENT_DAYS - 1, RECENT_DAYS, RECENT_DAYS + 1, RECLAIM_DAYS - 1, RECLAIM_DAYS, RECLAIM_DAYS + 1, 365];
    const report = reportOf(daysAgoValues.map((daysAgo) => seat(`seat-${daysAgo}`, { lastActivityAt: ago(daysAgo) })));
    expect(report.quiet.map((finding) => finding.daysSinceActivity)).toEqual([0, 1, 29]);
    expect(report.fading.map((finding) => finding.daysSinceActivity)).toEqual([89, 31, 30]);
    expect(report.reclaim.map((finding) => finding.daysSinceActivity)).toEqual([365, 91, 90]);
    expect(report.reclaim.every((finding) => finding.reason === 'stale')).toBe(true);
    expect(loginsOf(report.reclaim)).toEqual(['seat-365', 'seat-91', 'seat-90']);
    expect(report.byStatus).toEqual({ recent: 3, fading: 3, stale: 3, 'no-date': 0, unknown: 0 });
    expect(report.seats).toBe(9);
  });

  it('counts a seat with activity after the export date as active today', () => {
    const report = reportOf([seat('future', { lastActivityAt: addDays(AS_OF, 5) })]);
    expect(report.quiet).toHaveLength(1);
    expect(report.quiet[0].daysSinceActivity).toBe(0);
  });

  it('treats a blank activity date as uncertain and never as proof that a seat was unused', () => {
    const report = reportOf([
      seat('signed-in', { lastAuthenticatedAt: ago(5) }),
      seat('no-sign-in'),
      seat('csv-no-sign-in', { source: 'activity' }),
      seat('csv-signed-in', { source: 'activity', lastAuthenticatedAt: ago(40) }),
      seat('plain', { source: undefined }),
    ]);
    expect(report.reclaim).toEqual([]);
    expect(loginsOf(report.noActivityDate)).toEqual(['csv-no-sign-in', 'csv-signed-in', 'no-sign-in', 'signed-in']);
    expect(report.noActivityDate.every((finding) => finding.daysSinceActivity === null && finding.lastActivityAt === '')).toBe(true);
    expect(report.byStatus).toEqual({ recent: 0, fading: 0, stale: 0, 'no-date': 4, unknown: 1 });
  });

  it('judges nothing for a plain list of logins: no activity data means every seat is unknown and no list is filled', () => {
    const report = reportOf([{ user: 'a', plan: 'Business' }, { user: 'b' }, { user: 'c', plan: 'Enterprise' }]);
    expect(report).toMatchObject({ hasActivity: false, asOf: AS_OF, asOfSource: 'settings', seats: 3 });
    expect(report.byStatus).toEqual({ recent: 0, fading: 0, stale: 0, 'no-date': 0, unknown: 3 });
    expect([report.reclaim, report.fading, report.quiet, report.pending, report.newSeats].every((list) => list.length === 0)).toBe(true);
    const undated = reportOf([{ user: 'a' }, { user: 'b' }], [], { asOf: null });
    expect(undated).toMatchObject({ hasActivity: false, asOf: null, asOfSource: null, asOfBehindReport: null, seats: 2 });
    expect(undated.byStatus.unknown).toBe(2);
  });

  it('lists a seat with a scheduled cancellation as pending only, but still counts it', () => {
    const report = reportOf([
      seat('p-stale', { lastActivityAt: ago(200), pendingCancellation: '2026-06-15' }),
      seat('p-fading', { lastActivityAt: ago(45), pendingCancellation: '2026-06-10' }),
      seat('p-quiet', { lastActivityAt: ago(2), pendingCancellation: '2026-06-20' }),
      seat('p-never', { pendingCancellation: '2026-06-12' }),
      seat('ok', { lastActivityAt: ago(1) }),
    ]);
    expect(loginsOf(report.pending)).toEqual(['p-fading', 'p-never', 'p-stale', 'p-quiet']);
    expect(report.pending[0].pendingCancellation).toBe('2026-06-10');
    expect(report.reclaim).toEqual([]);
    expect(report.fading).toEqual([]);
    expect(loginsOf(report.quiet)).toEqual(['ok']);
    expect(report.seats).toBe(5);
    expect(report.byStatus).toEqual({ recent: 2, fading: 1, stale: 1, 'no-date': 1, unknown: 0 });
    expect(report.reclaimValue).toBe(0);
  });

  it('lists seats created fewer than newUserDays before the export date as new, and never asks to reclaim them', () => {
    const roster = [
      seat('n13', { createdAt: ago(13) }),
      seat('n14', { createdAt: ago(14) }),
      seat('n0', { createdAt: ago(0), lastActivityAt: ago(0) }),
      seat('np', { createdAt: ago(3), pendingCancellation: '2026-06-30' }),
      seat('old-never', { createdAt: ago(100) }),
      seat('no-date'),
    ];
    const report = reportOf(roster);
    expect(loginsOf(report.newSeats)).toEqual(['n0', 'np', 'n13']);
    expect(loginsOf(report.reclaim)).toEqual([]);
    expect(loginsOf(report.noActivityDate)).toEqual(['n13', 'n14', 'no-date', 'np', 'old-never']);
    expect(loginsOf(report.pending)).toEqual(['np']);
    expect(loginsOf(report.quiet)).toEqual(['n0']);
    expect(report.newSeats[0].createdAt).toBe(AS_OF);
    const wide = reportOf(roster, [], { newUserDays: 30 });
    expect(loginsOf(wide.newSeats)).toEqual(['n0', 'np', 'n13', 'n14']);
    expect(loginsOf(wide.reclaim)).toEqual([]);
    expect(loginsOf(reportOf(roster, [], { newUserDays: 1 }).newSeats)).toEqual(['n0']);
  });
});

describe('license report: the as-of date', () => {
  it('is the stored export date when there is one', () => {
    const report = reportOf([seat('a', { lastActivityAt: '2026-05-01' })], [], { asOf: '2026-05-20' });
    expect(report).toMatchObject({ asOf: '2026-05-20', asOfSource: 'settings' });
    expect(report.quiet[0].daysSinceActivity).toBe(19);
  });

  it('is the latest date inside the roster when the export date is missing or not a real day', () => {
    const roster = [
      seat('a', { lastActivityAt: '2026-05-01', createdAt: '2025-01-01' }),
      seat('b', { lastAuthenticatedAt: '2026-05-12' }),
      seat('c', { createdAt: '2026-05-09', lastActivityAt: '2026-04-01' }),
    ];
    for (const asOf of [null, '2026-02-30', 'yesterday', '']) {
      expect(reportOf(roster, [], { asOf }), String(asOf)).toMatchObject({ asOf: '2026-05-12', asOfSource: 'roster' });
    }
  });

  it('says how far the loaded report runs past the export, never below zero', () => {
    const roster = [seat('a', { lastActivityAt: ago(1) })];
    expect(reportOf(roster, [], { maxDay: addDays(AS_OF, 45) }).asOfBehindReport).toBe(45);
    expect(reportOf(roster, [], { maxDay: addDays(AS_OF, 45) }).asOfBehindReport).toBeGreaterThan(STALE_EXPORT_DAYS);
    expect(reportOf(roster, [], { maxDay: AS_OF }).asOfBehindReport).toBe(0);
    expect(reportOf(roster, [], { maxDay: addDays(AS_OF, -10) }).asOfBehindReport).toBe(0);
  });
});

describe('license report: matching and totals', () => {
  it('returns null for an empty roster and for one without a usable login', () => {
    const none = (roster: RosterEntry[]) => buildLicenseReport(populationOf([], [], 1900), { roster, rosterAsOf: AS_OF, newUserDays: 14 }, { maxDay: dayNum(AS_OF) });
    expect(none([])).toBeNull();
    expect(none([{ user: '' }])).toBeNull();
    expect(none([{ user: '   ' }])).toBeNull();
  });

  it('matches logins without regard to case or surrounding spaces, and counts each side', () => {
    const roster = [seat('User001', { lastActivityAt: ago(1) }), seat(' user002 '), seat('USER003'), seat('user004')];
    const users: ReportUser[] = [
      { name: 'user001', gross: 10 },
      { name: 'User002', gross: 20 },
      { name: 'user003', gross: 30 },
      { name: 'stranger-a', gross: 5, org: 'beta', plan: 'Enterprise' },
      { name: 'stranger-b', gross: 50 },
    ];
    const report = reportOf(roster, users);
    expect(report).toMatchObject({ seats: 4, reportUsers: 5, matched: 3, neverSeen: 1, seenOutsideScope: 0, matchedUsage: 60, unmatchedUsage: 55 });
    expect(report.coverage).toBeCloseTo(3 / 5, 12);
    expect(report.unmatched).toEqual([
      { name: 'stranger-b', org: 'acme', plan: 'Business', usage: 50 },
      { name: 'stranger-a', org: 'beta', plan: 'Enterprise', usage: 5 },
    ]);
  });

  it('lists the report users without a seat by usage, biggest first, then by name', () => {
    const users: ReportUser[] = [{ name: 'zed', gross: 5 }, { name: 'amy', gross: 5 }, { name: 'big', gross: 90 }, { name: 'small', gross: 0 }, { name: 'seat', gross: 1 }];
    const report = reportOf([seat('seat')], users);
    expect(report.unmatched.map((user) => user.name)).toEqual(['big', 'amy', 'zed', 'small']);
    expect(report.unmatchedUsage).toBe(100);
  });

  it('counts a report user whose login appears in two spellings once, with the usage added', () => {
    const report = reportOf([seat('ana', { lastActivityAt: ago(2) })], [{ name: 'Ana', gross: 4 }, { name: 'ana', gross: 6 }, { name: 'other', gross: 1 }]);
    expect(report).toMatchObject({ reportUsers: 2, matched: 1, matchedUsage: 10, unmatchedUsage: 1 });
    expect(report.quiet).toEqual([]);
  });

  it('has no coverage when the report has no users', () => {
    const report = reportOf([seat('a', { lastActivityAt: ago(1) })]);
    expect(report).toMatchObject({ reportUsers: 0, matched: 0, unmatched: [], matchedUsage: 0, unmatchedUsage: 0 });
    expect(report.coverage).toBeNull();
  });

  it('counts a login that is on the roster twice once, and the first entry wins', () => {
    const report = reportOf([seat('Ana', { lastActivityAt: ago(1) }), seat('ana', { lastActivityAt: ago(300) }), seat(' ANA '), { user: ' ' }]);
    expect(report.seats).toBe(1);
    expect(loginsOf(report.quiet)).toEqual(['Ana']);
    expect(report.reclaim).toEqual([]);
  });

  it('prices a seat by its plan, else by the seat size in the report, else by the most common seat size', () => {
    const stale = ago(120);
    const roster = [
      seat('biz', { plan: 'Business', lastActivityAt: stale }),
      seat('ent', { plan: 'Enterprise', lastActivityAt: stale }),
      seat('custom', { plan: '2500', lastActivityAt: stale }),
      seat('noplan-report', { plan: undefined, lastActivityAt: stale }),
      seat('noplan-absent', { plan: undefined, lastActivityAt: stale }),
    ];
    const report = reportOf(roster, [{ name: 'noplan-report', quota: 3900, lastDay: ago(200) }]);
    expect(report.reclaim.map((finding) => [finding.login, finding.seatPrice])).toEqual([
      ['ent', 39],
      ['noplan-report', 39],
      ['custom', 25],
      ['biz', 19],
      ['noplan-absent', 19],
    ]);
    expect(report.reclaimValue).toBe(141);
    expect(report.seatCost).toBe(141);
    expect(report.byPlan).toEqual({ Business: 1, Enterprise: 1, other: 3 });
    expect(reportOf([seat('x', { plan: undefined, lastActivityAt: stale })], [], { fallback: 3900 }).reclaim[0].seatPrice).toBe(39);
  });

  it('prices a seat with the label the report gives a custom plan by the credits in the label, not by the fallback', () => {
    const stale = ago(120);
    const roster = [
      seat('label-2500', { plan: 'Custom (2,500 credits)', lastActivityAt: stale }),
      seat('label-500', { plan: 'Custom (500 credits)', lastActivityAt: stale }),
      seat('label-1900', { plan: 'Custom (1,900 credits)', lastActivityAt: stale }),
      seat('plain', { plan: 'Enterprise', lastActivityAt: stale }),
    ];
    const report = reportOf(roster, [], { fallback: 3900 });
    expect(report.reclaim.map((finding) => [finding.login, finding.seatPrice])).toEqual([
      ['plain', 39],
      ['label-2500', 25],
      ['label-1900', 19],
      ['label-500', 5],
    ]);
    expect(report.reclaimValue).toBe(88);
    expect(report.seatCost).toBe(88);
    expect(report.byPlan).toEqual({ Business: 1, Enterprise: 1, other: 2 });
  });

  it('adds up on a mixed roster of 300 seats', () => {
    const random = mulberry32(42);
    const pick = <T>(choices: T[]): T => choices[Math.floor(random() * choices.length)];
    const roster: RosterEntry[] = Array.from({ length: 300 }, (_, seatIndex) => {
      const entry: RosterEntry = { user: `u${seatIndex}`, source: 'api' };
      const plan = pick(['Business', 'Enterprise', undefined]);
      if (plan !== undefined) entry.plan = plan;
      if (random() < 0.8) entry.lastActivityAt = ago(Math.floor(random() * 400));
      else if (random() < 0.5) entry.lastAuthenticatedAt = ago(Math.floor(random() * 50));
      if (random() < 0.5) entry.createdAt = ago(Math.floor(random() * 500));
      if (random() < 0.05) entry.pendingCancellation = '2026-06-30';
      return entry;
    });
    const users: ReportUser[] = [
      ...Array.from({ length: 150 }, (_, userIndex) => ({ name: `U${userIndex}`, gross: Math.round(random() * 20 * 100) / 100, lastDay: ago(Math.floor(random() * 200)) })),
      ...Array.from({ length: 50 }, (_, userIndex) => ({ name: `x${userIndex}`, gross: 3 })),
    ];
    const never = roster.slice(200).map((entry) => entry.user);
    const report = reportOf(roster, users, { inactive: never });

    expect(report.seats).toBe(300);
    expect(report.reportUsers).toBe(200);
    expect(report.matched).toBe(150);
    expect(report.matched + report.unmatched.length).toBe(report.reportUsers);
    expect(report.neverSeen).toBe(100);
    expect(report.seenOutsideScope).toBe(50);
    expect(report.matched + report.seenOutsideScope + report.neverSeen).toBe(report.seats);
    expect(sum(Object.values(report.byStatus))).toBe(report.seats);
    expect(report.byPlan.Business + report.byPlan.Enterprise + report.byPlan.other).toBe(report.seats);
    expect(report.reclaimValue).toBe(sum(report.reclaim.map((finding) => finding.seatPrice)));
    expect(report.matchedUsage + report.unmatchedUsage).toBeCloseTo(sum(users.map((user) => user.gross ?? 0)), 6);
    expect(report.unmatchedUsage).toBe(150);
    expect(report.coverage).toBeCloseTo(0.75, 12);

    const seen = new Set<string>();
    for (const list of [report.reclaim, report.fading, report.quiet, report.pending]) {
      for (const finding of list) {
        expect(seen.has(finding.login), finding.login).toBe(false);
        seen.add(finding.login);
      }
    }
    expect(report.reclaim.length).toBeGreaterThan(0);
    expect(report.fading.length).toBeGreaterThan(5);
    expect(report.quiet.length).toBeGreaterThan(5);
    expect(report.pending.length).toBeGreaterThan(3);

    const order = [...report.reclaim].sort((a, b) => {
      if (a.seatPrice !== b.seatPrice) return b.seatPrice - a.seatPrice;
      if (a.daysSinceActivity !== b.daysSinceActivity) {
        if (a.daysSinceActivity === null) return -1;
        if (b.daysSinceActivity === null) return 1;
        return b.daysSinceActivity - a.daysSinceActivity;
      }
      return a.login < b.login ? -1 : 1;
    });
    expect(loginsOf(report.reclaim)).toEqual(loginsOf(order));
    for (const finding of report.reclaim) expect(finding.daysSinceActivity === null || finding.daysSinceActivity >= RECLAIM_DAYS, finding.login).toBe(true);
    for (const finding of report.fading) expect(finding.daysSinceActivity !== null && finding.daysSinceActivity >= RECENT_DAYS && finding.daysSinceActivity < RECLAIM_DAYS, finding.login).toBe(true);
    for (const finding of report.quiet) expect(finding.daysSinceActivity !== null && finding.daysSinceActivity < RECENT_DAYS, finding.login).toBe(true);
  });

  it('gives every finding the facts of its seat', () => {
    const roster = [seat('Full', { plan: 'Enterprise', name: 'Full Name', org: 'acme, beta', team: 'core', createdAt: '2025-01-15', lastActivityAt: ago(100), lastSurface: 'vscode' })];
    const [finding] = reportOf(roster).reclaim;
    expect(finding).toEqual({
      login: 'Full',
      name: 'Full Name',
      plan: 'Enterprise',
      org: 'acme, beta',
      team: 'core',
      daysSinceActivity: 100,
      lastActivityAt: ago(100),
      lastSurface: 'vscode',
      createdAt: '2025-01-15',
      pendingCancellation: '',
      usage: 0,
      inReport: false,
      seatPrice: 39,
      reason: 'stale',
    });
  });
});

describe('license report: the usage safety net', () => {
  const listed = (roster: RosterEntry[], gross: number, usageAgo: number): LicenseReport => reportOf(roster, [{ name: roster[0].user, gross, lastDay: ago(usageAgo) }]);

  it('keeps a stale seat off the reclaim list when the report shows usage in the last 90 days', () => {
    const roster = [seat('st', { lastActivityAt: ago(100) })];
    for (const [usageAgo, expected] of [[0, false], [11, false], [89, false], [90, true], [131, true], [-5, false]] as const) {
      const report = listed(roster, 12, usageAgo);
      expect(loginsOf(report.reclaim), `usage ${usageAgo} days ago`).toEqual(expected ? ['st'] : []);
    }
    const [finding] = listed(roster, 12, 131).reclaim;
    expect(finding).toMatchObject({ inReport: true, usage: 12, daysSinceActivity: 100 });
  });

  it('does not reclaim a seat without a dated activity record, even when the report shows old usage', () => {
    const roster = [seat('nv')];
    expect(listed(roster, 4, 10).reclaim).toEqual([]);
    expect(listed(roster, 4, 89).reclaim).toEqual([]);
    expect(listed(roster, 4, 90).reclaim).toEqual([]);
    expect(listed(roster, 4, 200).reclaim).toEqual([]);
    expect(listed(roster, 4, 200).noActivityDate).toHaveLength(1);
  });

  it('keeps a fading seat off the fading list when the report shows usage in the last 30 days', () => {
    const roster = [seat('fd', { lastActivityAt: ago(60) })];
    for (const [usageAgo, expected] of [[0, false], [6, false], [29, false], [30, true], [56, true], [-3, false]] as const) {
      expect(loginsOf(listed(roster, 8, usageAgo).fading), `usage ${usageAgo} days ago`).toEqual(expected ? ['fd'] : []);
    }
  });

  it('calls a recently active seat quiet when the report has no usage for it, and not when it has some', () => {
    const roster = [seat('q', { lastActivityAt: ago(5) })];
    expect(loginsOf(reportOf(roster).quiet)).toEqual(['q']);
    expect(loginsOf(listed(roster, 0, 3).quiet)).toEqual(['q']);
    expect(listed(roster, 0.01, 3).quiet).toEqual([]);
    expect(listed(roster, 3, 3).quiet).toEqual([]);
  });

  it('looks at the last usage in every loaded file when the caller passes it, whoever is in the view', () => {
    const roster = [seat('st', { lastActivityAt: ago(100) }), seat('fd', { lastActivityAt: ago(60) }), seat('Mixed', { lastActivityAt: ago(100) })];
    const run = (entries: [string, number][]): LicenseReport => {
      const lastUsage = new Map(entries.map(([login, daysAgo]) => [login, dayNum(ago(daysAgo))] as const));
      const report = buildLicenseReport(populationOf([], [], 1900), { roster, rosterAsOf: AS_OF, newUserDays: 14 }, { maxDay: dayNum(AS_OF) }, false, lastUsage);
      return must(report);
    };
    const none = run([]);
    expect(loginsOf(none.reclaim)).toEqual(['Mixed', 'st']);
    expect(loginsOf(none.fading)).toEqual(['fd']);
    const recent = run([['st', 11], ['fd', 6], ['mixed', 20]]);
    expect(recent.reclaim).toEqual([]);
    expect(recent.fading).toEqual([]);
    const old = run([['st', 95], ['fd', 31], ['mixed', 90]]);
    expect(loginsOf(old.reclaim)).toEqual(['Mixed', 'st']);
    expect(loginsOf(old.fading)).toEqual(['fd']);
    const edge = run([['st', 89], ['fd', 29], ['mixed', 91]]);
    expect(loginsOf(edge.reclaim)).toEqual(['Mixed']);
    expect(edge.fading).toEqual([]);
    const later = run([['st', -3], ['fd', -3], ['mixed', -3]]);
    expect(later.reclaim).toEqual([]);
    expect(later.fading).toEqual([]);
    expect(run([['other', 1]]).reclaim).toHaveLength(2);
  });

  it('takes the last day of each login over every loaded row, without filters, in lower case', async () => {
    const pipeline = await analyzeCsv(
      makeCsv([
        { date: '2026-03-01', user: 'Ana', gross: 1 },
        { date: '2026-03-10', user: 'ana', gross: 1 },
        { date: '2026-03-04', user: 'bob', gross: 1, org: 'beta' },
        { date: '2026-03-20', user: 'bob', gross: 1, org: 'acme' },
        { date: '2026-03-22', user: '', gross: 1, product: 'ghas', sku: 'code_security_ai_credit' },
      ]),
      { filters: { orgs: ['beta'], dateTo: dayNum('2026-03-05') } },
    );
    const days = lastUsageDays(pipeline.store, pipeline.prep);
    expect([...days.keys()].sort()).toEqual(['ana', 'bob']);
    expect(days.get('ana')).toBe(dayNum('2026-03-10'));
    expect(days.get('bob')).toBe(dayNum('2026-03-20'));
  });
});

describe('analysis.licenses', () => {
  const march = (dayOfMonth: number): string => `2026-03-${String(dayOfMonth).padStart(2, '0')}`;
  const specs: RowSpec[] = [];
  for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 3) specs.push({ date: march(dayOfMonth), user: 'user001', gross: 2, org: 'acme' });
  specs.push({ date: march(2), user: 'user002', gross: 0.5, org: 'acme' });
  for (let dayOfMonth = 2; dayOfMonth <= 30; dayOfMonth += 4) specs.push({ date: march(dayOfMonth), user: 'user003', gross: 1.5, org: 'beta' });
  specs.push({ date: march(30), user: 'user004', gross: 1, org: 'beta' });
  for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 5) specs.push({ date: march(dayOfMonth), user: 'stranger01', gross: 1, org: 'acme' });
  const CSV = makeCsv(specs, { pool: true });

  const ROSTER: RosterEntry[] = [
    { user: 'USER001', plan: 'Business', org: 'acme', team: 'core', createdAt: '2025-01-10', lastActivityAt: '2026-03-30', lastSurface: 'vscode', source: 'api' },
    { user: 'user002', plan: 'Business', org: 'acme', lastActivityAt: '2026-03-20', source: 'api' },
    { user: 'user003', plan: 'Enterprise', org: 'beta', lastActivityAt: '2026-02-15', source: 'api' },
    { user: 'user004', plan: 'Business', org: 'beta', createdAt: '2026-03-28', source: 'api' },
    { user: 'ghost01', plan: 'Business', source: 'api' },
    { user: 'ghost02', plan: 'Enterprise', lastActivityAt: '2026-03-25', source: 'api' },
    { user: 'ghost03', plan: 'Business', createdAt: '2026-03-27', source: 'api' },
    { user: 'ghost04', plan: 'Business', lastActivityAt: '2026-01-20', source: 'api' },
    { user: 'ghost05', plan: 'Business', lastActivityAt: '2025-06-01', pendingCancellation: '2026-04-15', source: 'api' },
    { user: 'ghost06', plan: 'Business', lastActivityAt: '2025-10-01', source: 'api' },
  ];
  const settings = { roster: ROSTER, rosterAsOf: '2026-03-31' };

  let base: Pipeline;
  beforeAll(async () => {
    base = await analyzeCsv(CSV, { settings });
  });

  it('is null without a roster, and so is the license of every user', async () => {
    const none = base.run(base.filters, mergeSettings({}));
    expect(none.licenses).toBeNull();
    expect(none.population.profiles.length).toBeGreaterThan(0);
    expect(none.population.profiles.every((profile) => profile.license === null)).toBe(true);
    expect(none.users.profiles.every((profile) => profile.license === null)).toBe(true);
    const blank = base.run(base.filters, mergeSettings({ roster: [{ user: '  ' }] }));
    expect(blank.licenses).toBeNull();
  });

  it('sets the roster against the report: seats, matched, never seen, and the lists', () => {
    const report = must(base.analysis.licenses);
    expect(report).toMatchObject({ asOf: '2026-03-31', asOfSource: 'settings', asOfBehindReport: 0, hasActivity: true, scoped: false, seats: 10, reportUsers: 5, matched: 4, neverSeen: 6, seenOutsideScope: 0 });
    expect(report.byPlan).toEqual({ Business: 8, Enterprise: 2, other: 0 });
    expect(report.seatCost).toBe(8 * 19 + 2 * 39);
    expect(report.coverage).toBeCloseTo(0.8, 12);
    expect(report.matchedUsage).toBeCloseTo(35.5, 9);
    expect(report.unmatched).toEqual([{ name: 'stranger01', org: 'acme', plan: 'Business', usage: expect.closeTo(7, 9) }]);
    expect(report.unmatchedUsage).toBeCloseTo(7, 9);
    expect(report.byStatus).toEqual({ recent: 3, fading: 2, stale: 2, 'no-date': 3, unknown: 0 });
    expect(report.reclaim.map((finding) => [finding.login, finding.reason])).toEqual([['ghost06', 'stale']]);
    expect(report.reclaimValue).toBe(19);
    expect(loginsOf(report.noActivityDate)).toEqual(['ghost01', 'ghost03', 'user004']);
    expect(loginsOf(report.fading)).toEqual(['ghost04']);
    expect(loginsOf(report.quiet)).toEqual(['ghost02']);
    expect(loginsOf(report.pending)).toEqual(['ghost05']);
    expect(loginsOf(report.newSeats)).toEqual(['user004', 'ghost03']);
  });

  it('explains how imported activity protects seats in the idle-seat recommendation', () => {
    const recommendation = must(base.analysis.recs.find((item) => item.id === 'idle-seats'));
    expect(recommendation.evidence).toContain('Only dated activity from the license list is used here. Recently active seats and seats pending cancellation are excluded. Seats without a recent activity date are not counted as idle. Check the Licenses page for the recorded activity dates.');
    const candidates = [...base.analysis.seats.idle, ...base.analysis.seats.unused].map((item) => item.name);
    expect(candidates).not.toContain('ghost02');
    expect(candidates).not.toContain('ghost05');
  });

  it('leaves a fading seat off the list when the report shows its user at work (user003 stopped using completions but still spends credits)', () => {
    const report = must(base.analysis.licenses);
    expect(loginsOf(report.fading)).not.toContain('user003');
    expect(report.byStatus.fading).toBe(2);
  });

  it('gives each report user the facts of their seat, matched by login without regard to case', () => {
    const user001 = must(base.analysis.population.profiles.find((profile) => profile.name === 'user001'));
    expect(user001.license).toEqual({
      seat: true,
      plan: 'Business',
      org: 'acme',
      team: 'core',
      createdAt: '2025-01-10',
      lastActivityAt: '2026-03-30',
      daysSinceActivity: 1,
      lastSurface: 'vscode',
      status: 'recent',
      pendingCancellation: '',
      isNew: false,
    });
    const user004 = must(base.analysis.population.profiles.find((profile) => profile.name === 'user004'));
    expect(user004.license).toMatchObject({ seat: true, status: 'no-date', daysSinceActivity: null, isNew: true, createdAt: '2026-03-28' });
    const stranger = must(base.analysis.population.profiles.find((profile) => profile.name === 'stranger01'));
    expect(stranger.license).toEqual({
      seat: false,
      plan: '',
      org: '',
      team: '',
      createdAt: '',
      lastActivityAt: '',
      daysSinceActivity: null,
      lastSurface: '',
      status: 'unknown',
      pendingCancellation: '',
      isNew: false,
    });
    expect(base.analysis.population.profiles.every((profile) => profile.license !== null && profile.license !== undefined)).toBe(true);
    expect(base.analysis.population.inactive.map((inactiveSeat) => inactiveSeat.user)).toEqual(['ghost01', 'ghost02', 'ghost03', 'ghost04', 'ghost05', 'ghost06']);
    expect(must(base.analysis.population.inactive[1].license)).toMatchObject({ seat: true, status: 'recent', daysSinceActivity: 6 });
  });

  it('is not changed by segment filters, although they switch off the seat actions', () => {
    const before = JSON.stringify(base.analysis.licenses);
    const variants: Partial<ReturnType<typeof emptyFilters>>[] = [
      { tiers: ['power'] },
      { tiers: ['minimal', 'light'] },
      { engagement: ['rare'] },
      { minUserSpend: 10 },
      { maxUserSpend: 3 },
      { paretoClasses: ['A'] },
      { autoUse: ['unknown'] },
      { segments: ['new'] },
      { tiers: ['core'], minUserSpend: 11, maxUserSpend: 13 },
    ];
    let narrowedAtLeastOnce = false;
    for (const variant of variants) {
      const analysis = base.run({ ...emptyFilters(), ...variant });
      expect(analysis.segmentFiltered, JSON.stringify(variant)).toBe(true);
      expect(JSON.stringify(analysis.licenses), JSON.stringify(variant)).toBe(before);
      if (analysis.users.profiles.length < analysis.population.profiles.length) narrowedAtLeastOnce = true;
      expect(analysis.seats.unused, JSON.stringify(variant)).toEqual([]);
    }
    expect(narrowedAtLeastOnce).toBe(true);
    expect(base.analysis.seats.unused.length).toBeGreaterThan(0);
  });

  it('follows a row filter for the usage side only: scoped, with seats, plans and activity unchanged', () => {
    const full = must(base.analysis.licenses);
    const beta = base.run({ ...emptyFilters(), orgs: ['beta'] });
    const report = must(beta.licenses);
    expect(report.scoped).toBe(true);
    expect(report).toMatchObject({ seats: 10, reportUsers: 2, matched: 2, neverSeen: 6, seenOutsideScope: 2, coverage: 1 });
    expect(report.unmatched).toEqual([]);
    for (const key of ['seats', 'byPlan', 'byStatus', 'seatCost', 'reclaim', 'reclaimValue', 'fading', 'noActivityDate', 'pending', 'newSeats'] as const) {
      expect(report[key], key).toEqual(full[key]);
    }
    expect(loginsOf(report.quiet)).toEqual(['USER001', 'ghost02', 'user002']);
    expect(report.seats - report.matched - report.neverSeen).toBe(report.seenOutsideScope);
    expect(report.matched + report.unmatched.length).toBe(report.reportUsers);
  });

  it('follows the date range for the usage side, without calling the view scoped', () => {
    const last3 = base.run({ ...emptyFilters(), dateFrom: dayNum('2026-03-29'), dateTo: dayNum('2026-03-31') });
    const report = must(last3.licenses);
    expect(report.scoped).toBe(false);
    expect(report).toMatchObject({ seats: 10, reportUsers: 4, matched: 3, neverSeen: 6, seenOutsideScope: 1, asOfBehindReport: 0 });
    expect(report.matchedUsage).toBeCloseTo(4.5, 9);
    expect(report.unmatchedUsage).toBeCloseTo(1, 9);
    expect(report.unmatched.map((user) => user.name)).toEqual(['stranger01']);
    expect(loginsOf(report.quiet)).toEqual(['ghost02', 'user002']);
    expect(report.byStatus).toEqual(must(base.analysis.licenses).byStatus);
  });

  it('counts the days from the stored export date, and says when the report runs past it', () => {
    const early = base.run(base.filters, mergeSettings({ roster: ROSTER, rosterAsOf: '2026-03-10' }));
    const report = must(early.licenses);
    expect(report).toMatchObject({ asOf: '2026-03-10', asOfSource: 'settings', asOfBehindReport: 21 });
    expect(report.asOfBehindReport).toBeLessThanOrEqual(STALE_EXPORT_DAYS);
    const none = base.run(base.filters, mergeSettings({ roster: ROSTER }));
    expect(must(none.licenses)).toMatchObject({ asOf: '2026-03-30', asOfSource: 'roster', asOfBehindReport: 1 });
  });

  it('reads a roster of plain logins and plans: no activity data, so nothing to judge', () => {
    const plain = ROSTER.map((entry) => ({ user: entry.user, plan: entry.plan }));
    const analysis = base.run(base.filters, mergeSettings({ roster: plain }));
    const report = must(analysis.licenses);
    expect(report).toMatchObject({ hasActivity: false, asOf: null, asOfSource: null, seats: 10, matched: 4, neverSeen: 6, unmatched: [expect.objectContaining({ name: 'stranger01' })] });
    expect(report.byStatus).toEqual({ recent: 0, fading: 0, stale: 0, 'no-date': 0, unknown: 10 });
    expect([report.reclaim, report.fading, report.quiet, report.pending, report.newSeats].every((list) => list.length === 0)).toBe(true);
    expect(report.byPlan).toEqual({ Business: 8, Enterprise: 2, other: 0 });
  });
});

describe('the license lists in other views of the report', () => {
  const SPECS: RowSpec[] = [
    { date: '2026-01-01', user: 'anchor', gross: 1, org: 'acme' },
    { date: '2026-05-31', user: 'anchor', gross: 1, org: 'acme' },
    { date: '2026-02-10', user: 'stale-a', gross: 1, org: 'acme' },
    { date: '2026-05-20', user: 'stale-a', gross: 1, org: 'acme' },
    { date: '2026-02-10', user: 'fade-a', gross: 1, org: 'beta' },
    { date: '2026-05-25', user: 'fade-a', gross: 1, org: 'acme' },
    { date: '2026-01-12', user: 'stale-b', gross: 1, org: 'beta' },
    { date: '2026-05-28', user: 'stranger', gross: 1, org: 'acme' },
  ];
  const ROSTER: RosterEntry[] = [
    seat('anchor', { lastActivityAt: '2026-05-30' }),
    seat('stale-a', { lastActivityAt: '2025-12-01' }),
    seat('fade-a', { lastActivityAt: '2026-04-01' }),
    seat('stale-b', { lastActivityAt: '2025-11-01', plan: 'Enterprise' }),
    seat('ghost', { lastActivityAt: '2025-10-01' }),
    seat('leaving', { lastActivityAt: '2025-10-01', pendingCancellation: '2026-06-15' }),
    seat('rookie', { createdAt: '2026-05-25' }),
  ];

  /** The numbers and lists that come from the license data, without the usage columns that follow the view. */
  const facts = (licenses: LicenseReport | null) => {
    const report = must(licenses);
    return {
      asOf: [report.asOf, report.asOfSource, report.asOfBehindReport, report.hasActivity],
      seats: [report.seats, report.byPlan, report.seatCost, report.byStatus],
      reclaim: [report.reclaim.map((finding) => [finding.login, finding.reason, finding.seatPrice, finding.daysSinceActivity]), report.reclaimValue],
      fading: report.fading.map((finding) => [finding.login, finding.daysSinceActivity]),
      noActivityDate: report.noActivityDate.map((finding) => finding.login),
      pending: report.pending.map((finding) => [finding.login, finding.pendingCancellation]),
      newSeats: report.newSeats.map((finding) => [finding.login, finding.createdAt]),
    };
  };

  let pipeline: Pipeline;
  beforeAll(async () => {
    pipeline = await analyzeCsv(makeCsv(SPECS, { pool: true }), { settings: { roster: ROSTER, rosterAsOf: AS_OF } });
  });

  it('puts the right seats on the lists for the whole report', () => {
    const report = must(pipeline.analysis.licenses);
    expect(report).toMatchObject({ seats: 7, reportUsers: 5, matched: 4, neverSeen: 3, seenOutsideScope: 0, scoped: false, asOfBehindReport: 0 });
    expect(report.reclaim.map((finding) => [finding.login, finding.reason, finding.seatPrice])).toEqual([['stale-b', 'stale', 39], ['ghost', 'stale', 19]]);
    expect(report.reclaimValue).toBe(58);
    expect(report.fading).toEqual([]);
    expect(loginsOf(report.pending)).toEqual(['leaving']);
    expect(loginsOf(report.newSeats)).toEqual(['rookie']);
    expect(report.byStatus).toEqual({ recent: 1, fading: 1, stale: 4, 'no-date': 1, unknown: 0 });
    expect(report.unmatched.map((user) => user.name)).toEqual(['stranger']);
  });

  it('keeps a seat off the reclaim and fading lists when the user has later usage outside the date range', () => {
    const early = pipeline.run({ ...emptyFilters(), dateFrom: dayNum('2026-01-01'), dateTo: dayNum('2026-02-28') });
    expect(early.licenses?.reportUsers).toBe(4);
    expect(early.licenses?.matched).toBe(4);
    expect(early.licenses?.reclaim.map((finding) => finding.login)).toEqual(['stale-b', 'ghost']);
    expect(early.licenses?.fading).toEqual([]);
    expect(facts(early.licenses)).toEqual(facts(pipeline.analysis.licenses));

    const late = pipeline.run({ ...emptyFilters(), dateFrom: dayNum('2026-05-26'), dateTo: dayNum('2026-05-31') });
    const report = must(late.licenses);
    expect(report).toMatchObject({ scoped: false, reportUsers: 2, matched: 1, neverSeen: 3, seenOutsideScope: 3 });
    expect(report.unmatched.map((user) => user.name)).toEqual(['stranger']);
    expect(facts(report)).toEqual(facts(pipeline.analysis.licenses));
  });

  it('keeps the same lists when a row filter leaves the user out of the view', () => {
    const variants: Partial<ReturnType<typeof emptyFilters>>[] = [
      { orgs: ['beta'] },
      { orgs: ['acme'] },
      { users: ['anchor'] },
      { users: ['stranger'] },
      { orgs: ['beta'], dateFrom: dayNum('2026-02-01'), dateTo: dayNum('2026-02-28') },
    ];
    for (const variant of variants) {
      const report = must(pipeline.run({ ...emptyFilters(), ...variant }).licenses);
      expect(report.scoped, JSON.stringify(variant)).toBe(true);
      expect(facts(report), JSON.stringify(variant)).toEqual(facts(pipeline.analysis.licenses));
    }
    const beta = must(pipeline.run({ ...emptyFilters(), orgs: ['beta'] }).licenses);
    expect(beta).toMatchObject({ reportUsers: 2, matched: 2, seenOutsideScope: 2, neverSeen: 3 });
  });

  it('still lists a seat when the loaded files hold only old usage of the user', () => {
    const report = must(pipeline.run({ ...emptyFilters(), users: ['stale-b'] }).licenses);
    expect(report.reclaim.map((finding) => finding.login)).toContain('stale-b');
    const [stale] = report.reclaim.filter((finding) => finding.login === 'stale-b');
    expect(stale).toMatchObject({ inReport: true, usage: 1, daysSinceActivity: 211 });
  });
});

describe('seat actions with license data', () => {
  const settings = mergeSettings({});
  const idle = { tier: 'minimal', persona: 'dormant' } as const;
  const fakeLicense = (over: Partial<ProfileLicense> = {}): ProfileLicense => ({
    seat: true,
    plan: 'Business',
    org: '',
    team: '',
    createdAt: '',
    lastActivityAt: '',
    daysSinceActivity: null,
    lastSurface: '',
    status: 'unknown',
    pendingCancellation: '',
    isNew: false,
    ...over,
  });

  function fakeUsers(profiles: Partial<UserProfile>[], inactive: InactiveSeat[] = [], fallbackQuotaCredits = 1900): UserSet {
    const full = profiles.map((profile, index) => ({
      id: index + 1,
      name: `user-${index + 1}`,
      plan: 'Business',
      quotaCredits: 1900,
      tier: 'light',
      persona: 'steady',
      isNew: false,
      peakMonthGross: 5,
      gross: 5,
      utilization: 0.26,
      ...profile,
    }));
    return { profiles: full, inactive, fallbackQuotaCredits } as unknown as UserSet;
  }

  it('only calls a seat idle when its dated activity supports the decision', () => {
    const cases = [['recent', 0], ['fading', 1], ['stale', 1], ['no-date', 0], ['unknown', 0]] as const;
    for (const persona of ['dormant', 'lapsed'] as const) {
      for (const [status, count] of cases) {
        expect(planSeats(fakeUsers([{ tier: 'minimal', persona, license: fakeLicense({ status }) }]), settings).idle.length, `${persona} ${status}`).toBe(count);
      }
    }
    for (const license of [null, undefined]) {
      expect(planSeats(fakeUsers([{ ...idle, license }]), settings).idle.length, String(license)).toBe(1);
    }
    expect(planSeats(fakeUsers([{ ...idle, license: fakeLicense({ seat: false }) }]), settings).idle).toEqual([]);
  });

  it('still needs the old evidence: a recently active seat is never idle, but an active one in the report is not either', () => {
    expect(planSeats(fakeUsers([{ tier: 'light', persona: 'dormant', license: fakeLicense({ status: 'stale' }) }]), settings).idle).toEqual([]);
    expect(planSeats(fakeUsers([{ tier: 'minimal', persona: 'steady', license: fakeLicense({ status: 'stale' }) }]), settings).idle).toEqual([]);
  });

  it('shows the license of an idle seat, and excludes users without a seat', () => {
    const stale = fakeLicense({ status: 'stale', daysSinceActivity: 120, lastActivityAt: '2026-01-01', lastSurface: 'vscode' });
    const plan = planSeats(fakeUsers([{ ...idle, license: stale }, { ...idle, license: fakeLicense({ seat: false }) }, { ...idle, license: null }, { ...idle }]), settings);
    expect(plan.idle).toHaveLength(3);
    expect(plan.idle[0].license).toEqual(stale);
    expect(plan.idle.slice(1).every((candidate) => !candidate.license)).toBe(true);
  });

  it('does not plan a saving from a seat that is already being cancelled', () => {
    const leaving = fakeLicense({ status: 'stale', pendingCancellation: '2026-06-30' });
    const enterprise = { quotaCredits: 3900, plan: 'Enterprise', peakMonthGross: 1 };
    const plan = planSeats(
      fakeUsers(
        [{ ...idle, license: leaving }, { ...enterprise, license: leaving }, { ...enterprise, license: fakeLicense() }, { ...enterprise, license: fakeLicense({ status: 'recent' }) }],
        [{ user: 'gone', plan: 'Business', license: leaving }, { user: 'stays', plan: 'Business', license: fakeLicense({ status: 'stale' }) }],
      ),
      settings,
    );
    expect(plan.idle).toEqual([]);
    expect(plan.downgrade.map((candidate) => candidate.id)).toEqual([4]);
    expect(plan.unused.map((candidate) => candidate.name)).toEqual(['stays']);
    expect(plan.keep).toBeUndefined();
  });

  it('splits confirmed recent or new seats from savings, and leaves uncertain dates for review', () => {
    const plan = planSeats(
      fakeUsers(
        [],
        [
          { user: 'recent', plan: 'Business', license: fakeLicense({ status: 'recent', daysSinceActivity: 4 }) },
          { user: 'stale', plan: 'Business', license: fakeLicense({ status: 'stale', daysSinceActivity: 200 }) },
          { user: 'new', plan: 'Enterprise', license: fakeLicense({ status: 'no-date', isNew: true }) },
          { user: 'fading', plan: 'Business', license: fakeLicense({ status: 'fading', daysSinceActivity: 60 }) },
          { user: 'no-date', plan: 'Business', license: fakeLicense({ status: 'no-date' }) },
          { user: 'unknown', plan: 'Business', license: fakeLicense({ status: 'unknown' }) },
          { user: 'bare', plan: 'Business' },
          { user: 'cancelling', plan: 'Business', license: fakeLicense({ status: 'recent', pendingCancellation: '2026-06-30' }) },
        ],
      ),
      settings,
    );
    expect(plan.keep?.map((candidate) => candidate.name)).toEqual(['recent', 'new']);
    expect(plan.keepValue).toBe(19 + 39);
    expect(plan.unused.map((candidate) => candidate.name)).toEqual(['stale', 'fading', 'bare']);
    expect(plan.unusedValue).toBe(3 * 19);
    expect(plan.keep?.[0].license).toMatchObject({ status: 'recent', daysSinceActivity: 4 });
    expect(plan.idle).toEqual([]);
  });

  it('has the same shape as before when there is no license data: no keep list, no license on a candidate', () => {
    const plan = planSeats(
      fakeUsers([{ ...idle }], [{ user: 'a', plan: 'Business' }, { user: 'b', plan: 'Enterprise' }]),
      settings,
    );
    expect(plan).toEqual({
      idle: [{ id: 1, name: 'user-1', plan: 'Business', value: 19, gross: 5, utilization: 0.26 }],
      downgrade: [],
      unused: [
        { id: -1, name: 'a', plan: 'Business', value: 19, gross: 0, utilization: 0 },
        { id: -1, name: 'b', plan: 'Enterprise', value: 39, gross: 0, utilization: 0 },
      ],
      idleValue: 19,
      downgradeValue: 0,
      unusedValue: 58,
    });
    expect('keep' in plan).toBe(false);
    expect('keepValue' in plan).toBe(false);
  });

  describe('through analyze()', () => {
    const day = (dayOfMonth: number): string => `2026-03-${String(dayOfMonth).padStart(2, '0')}`;
    const specs: RowSpec[] = [];
    for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 3) specs.push({ date: day(dayOfMonth), user: 'user001', gross: 2 });
    specs.push({ date: day(2), user: 'user002', gross: 0.5 });
    for (let dayOfMonth = 2; dayOfMonth <= 30; dayOfMonth += 4) specs.push({ date: day(dayOfMonth), user: 'user003', gross: 1.5 });
    const csv = makeCsv(specs, { pool: true });
    const stamps = { rosterAsOf: '2026-03-31' };
    const ghosts: RosterEntry[] = [
      { user: 'ghost-never', plan: 'Business', source: 'api' },
      { user: 'ghost-active', plan: 'Enterprise', lastActivityAt: '2026-03-25', source: 'api' },
      { user: 'ghost-new', plan: 'Business', createdAt: '2026-03-27', source: 'api' },
      { user: 'ghost-fading', plan: 'Business', lastActivityAt: '2026-01-20', source: 'api' },
      { user: 'ghost-leaving', plan: 'Business', lastActivityAt: '2025-06-01', pendingCancellation: '2026-04-15', source: 'api' },
      { user: 'ghost-stale', plan: 'Business', lastActivityAt: '2025-10-01', source: 'api' },
    ];
    const seatsOf = (user002: RosterEntry): RosterEntry[] => [
      { user: 'user001', plan: 'Business', lastActivityAt: '2026-03-30', source: 'api' },
      user002,
      { user: 'user003', plan: 'Business', lastActivityAt: '2026-03-29', source: 'api' },
      ...ghosts,
    ];
    const run = async (roster: RosterEntry[]): Promise<Pipeline> => analyzeCsv(csv, { settings: { roster, ...stamps } });

    it('keeps a minimal seat that the license data shows as active, and flags it when the data shows it as stale', async () => {
      const recent = await run(seatsOf({ user: 'user002', plan: 'Business', lastActivityAt: '2026-03-20', source: 'api' }));
      const lapsed = recent.analysis.population.profiles.find((profile) => profile.name === 'user002');
      expect(lapsed).toMatchObject({ tier: 'minimal', persona: 'lapsed' });
      expect(recent.analysis.seats.idle).toEqual([]);

      const stale = await run(seatsOf({ user: 'user002', plan: 'Business', lastActivityAt: '2025-12-01', source: 'api' }));
      expect(stale.analysis.seats.idle.map((candidate) => candidate.name)).toEqual(['user002']);
      expect(stale.analysis.seats.idle[0].license).toMatchObject({ seat: true, status: 'stale', daysSinceActivity: 120 });

      const cancelling = await run(seatsOf({ user: 'user002', plan: 'Business', lastActivityAt: '2025-12-01', pendingCancellation: '2026-04-30', source: 'api' }));
      expect(cancelling.analysis.seats.idle).toEqual([]);
    });

    it('leaves seats without a recent activity date out of savings and reclaim lists', async () => {
      const pipeline = await run(seatsOf({ user: 'user002', plan: 'Business', lastActivityAt: '2026-03-20', source: 'api' }));
      const seatPlan = pipeline.analysis.seats;
      expect(seatPlan.unused.map((candidate) => candidate.name)).toEqual(['ghost-fading', 'ghost-stale']);
      expect(seatPlan.unusedValue).toBe(38);
      expect(seatPlan.keep?.map((candidate) => candidate.name)).toEqual(['ghost-active', 'ghost-new']);
      expect(seatPlan.keepValue).toBe(39 + 19);
      expect(must(pipeline.analysis.licenses).noActivityDate.map((finding) => finding.login)).toEqual(['ghost-never', 'ghost-new']);
      expect(must(pipeline.analysis.licenses).reclaim.map((finding) => finding.login)).toEqual(['ghost-stale']);
      expect(must(pipeline.analysis.licenses).reclaimValue).toBe(19);
    });

    it('does not make seat savings recommendations when activity dates are absent', async () => {
      const plain = seatsOf({ user: 'user002', plan: 'Business' }).map((entry) => ({ user: entry.user, plan: entry.plan }));
      const pipeline = await analyzeCsv(csv, { settings: { roster: plain } });
      expect(pipeline.analysis.seats.idle).toEqual([]);
      expect(pipeline.analysis.seats.unused).toEqual([]);
      expect(pipeline.analysis.seats.unusedValue).toBe(0);
      expect('keep' in pipeline.analysis.seats).toBe(false);
      const without = await analyzeCsv(csv, {});
      expect(without.analysis.seats.idle.map((candidate) => candidate.name)).toEqual(['user002']);
      expect(without.analysis.seats.unused).toEqual([]);
      expect(without.analysis.licenses).toBeNull();
    });
  });
});

describe('pool capacity from imported plans', () => {
  const dates = ['2026-05-05', '2026-05-20', '2026-06-03', '2026-06-20'];
  const csv = makeCsv(dates.flatMap((date) => ['user001', 'user002'].map((user) => ({ date, user, gross: 1 }))), { pool: true });
  const ghosts = (seatCount: number, prefix: string, over: Partial<RosterEntry> = {}): RosterEntry[] => Array.from({ length: seatCount }, (_, seatIndex) => seat(`${prefix}${seatIndex + 1}`, over));

  it('adds the credits of each seat the report does not show, from the plan of the seat, and none before the seat existed', async () => {
    const roster = [
      seat('user001'),
      seat('user002'),
      ...ghosts(8, 'ghost-b', { plan: 'Business' }),
      seat('ghost-e1', { plan: 'Enterprise', createdAt: '2025-01-15' }),
      seat('ghost-e2', { plan: 'Enterprise', createdAt: '2026-06-10' }),
    ];
    const pipeline = await analyzeCsv(csv, { settings: { roster, rosterAsOf: '2026-06-20' } });
    const pool = pipeline.analysis.pool;
    expect(pool.months).toHaveLength(2);
    const [may, june] = pool.months;
    expect(may.csvCapacity).toBeCloseTo(38, 9);
    expect(may.extraCapacity).toBeCloseTo(8 * 19 + 39, 9);
    expect(may.capacity).toBeCloseTo(229, 9);
    expect(june.csvCapacity).toBeCloseTo(38, 9);
    expect(june.extraCapacity).toBeCloseTo(8 * 19 + 2 * 39, 9);
    expect(june.capacity).toBeCloseTo(268, 9);
    expect(pool.capacityIsLowerBound).toBe(false);
    expect(pool.capacityExceeded).toBe(false);
    expect(may.utilization).toBeCloseTo(may.discount / 229, 9);

    const without = await analyzeCsv(csv, {});
    expect(without.analysis.pool.months[0].capacity).toBeCloseTo(38, 9);
    expect(without.analysis.pool.capacityIsLowerBound).toBe(true);
  });

  it('counts a seat without a creation day in every month', async () => {
    const roster = [seat('user001'), seat('user002'), ...ghosts(3, 'ghost-')];
    const pool = (await analyzeCsv(csv, { settings: { roster } })).analysis.pool;
    expect(pool.months.map((month) => month.extraCapacity)).toEqual([expect.closeTo(57, 9), expect.closeTo(57, 9)]);
  });

  it('adds the credits in the label of a custom plan for a seat the report does not show', async () => {
    const roster = [seat('user001'), seat('user002'), ...ghosts(2, 'label-', { plan: 'Custom (2,500 credits)' }), ...ghosts(1, 'small-', { plan: 'Custom (500 credits)' })];
    const pool = (await analyzeCsv(csv, { settings: { roster } })).analysis.pool;
    expect(pool.months[0].extraCapacity).toBeCloseTo(2 * 25 + 5, 9);
    expect(pool.capacityIsLowerBound).toBe(false);
  });

  it('prices a seat without a plan like the most common seat size in the report', async () => {
    const roster = [seat('user001'), seat('user002'), ...ghosts(5, 'np-', { plan: undefined })];
    const business = (await analyzeCsv(csv, { settings: { roster } })).analysis.pool;
    expect(business.months[0].extraCapacity).toBeCloseTo(5 * 19, 9);
    const enterprise = makeCsv(dates.flatMap((date) => ['user001', 'user002'].map((user) => ({ date, user, gross: 1, quota: 3900 }))), { pool: true });
    const pool = (await analyzeCsv(enterprise, { settings: { roster } })).analysis.pool;
    expect(pool.months[0].extraCapacity).toBeCloseTo(5 * 39, 9);
    expect(pool.months[0].capacity).toBeCloseTo(2 * 39 + 5 * 39, 9);
    expect(pool.capacityIsLowerBound).toBe(false);
  });

  it('gives the exact pool for a complete import: 60 Business and 40 Enterprise seats are $2,700', async () => {
    const planOf = (seatIndex: number): string => (seatIndex % 5 < 3 ? 'business' : 'enterprise');
    const rest = {
      total_seats: 100,
      seats: Array.from({ length: 100 }, (_, seatIndex) => ({
        created_at: '2025-01-15T09:00:00Z',
        pending_cancellation_date: null,
        last_activity_at: `${ago(1 + (seatIndex % 20))}T09:00:00Z`,
        last_activity_editor: 'vscode/1.97.1/copilot-chat/0.24.1',
        last_authenticated_at: `${AS_OF}T09:00:00Z`,
        plan_type: planOf(seatIndex),
        assignee: { login: `member${String(seatIndex).padStart(3, '0')}`, type: 'User' },
      })),
    };
    const parse = parseLicenseFile(JSON.stringify(rest));
    expect(parse).toMatchObject({ kind: 'seats-json', total: 100, exportedAt: AS_OF });
    const roster = rosterFromParse(parse);
    const specs: RowSpec[] = Array.from({ length: 10 }, (_, userIndex) => ({ date: '2026-05-10', user: `member${String(userIndex).padStart(3, '0')}`, gross: 1, quota: planOf(userIndex) === 'business' ? 1900 : 3900 }));
    const pipeline = await analyzeCsv(makeCsv(specs, { pool: true }), { settings: { roster, rosterAsOf: parse.exportedAt } });
    const may = pipeline.analysis.pool.months[0];
    expect(may.csvCapacity).toBeCloseTo(6 * 19 + 4 * 39, 9);
    expect(may.extraCapacity).toBeCloseTo(54 * 19 + 36 * 39, 9);
    expect(may.capacity).toBeCloseTo(2700, 9);
    expect(pipeline.analysis.pool.capacityIsLowerBound).toBe(false);
    const report = must(pipeline.analysis.licenses);
    expect(report.byPlan).toEqual({ Business: 60, Enterprise: 40, other: 0 });
    expect(report.seatCost).toBe(2700);
    expect(report).toMatchObject({ seats: 100, reportUsers: 10, matched: 10, neverSeen: 90, seenOutsideScope: 0 });
    expect(report.coverage).toBe(1);
  });
});

describe('a roster of 20,000 seats', () => {
  const SEAT_COUNT = 20_000;

  function restText(seatCount: number, names: string[]): string {
    const seats = Array.from({ length: seatCount }, (_, seatIndex) => ({
      created_at: '2025-01-15T09:00:00Z',
      pending_cancellation_date: seatIndex % 50 === 0 ? '2026-06-30' : null,
      last_activity_at: seatIndex % 7 === 0 ? null : `${ago((seatIndex * 13) % 300)}T09:00:00Z`,
      last_activity_editor: 'vscode/1.97.1/copilot-chat/0.24.1',
      last_authenticated_at: `${ago((seatIndex * 7) % 100)}T09:00:00Z`,
      plan_type: seatIndex % 4 === 0 ? 'enterprise' : 'business',
      assignee: { login: seatIndex < names.length ? names[seatIndex].toUpperCase() : `member${seatIndex}`, name: `Test User ${seatIndex}`, email: `member${seatIndex}@example.com` },
      organization: { login: 'acme' },
      assigning_team: { slug: seatIndex % 2 === 0 ? 'core' : 'platform' },
    }));
    return JSON.stringify({ total_seats: seatCount, seats });
  }

  it('is read and set against a report in well under a second', async () => {
    const pipeline = await analyzeDemo();
    const names = pipeline.analysis.population.profiles.map((profile) => profile.name);
    expect(names.length).toBeGreaterThan(20);
    const text = restText(SEAT_COUNT, names);
    const out: { report: LicenseReport | null } = { report: null };
    const elapsedMs = bestMs(3, () => {
      const parse = parseLicenseFile(text);
      const roster = rosterFromParse(parse);
      out.report = buildLicenseReport(pipeline.analysis.population, { roster, rosterAsOf: parse.exportedAt, newUserDays: 14 }, pipeline.store);
    });
    const report = must(out.report);
    expect(report.seats).toBe(SEAT_COUNT);
    expect(report.matched).toBe(names.length);
    expect(report.matched + report.seenOutsideScope + report.neverSeen).toBe(report.seats);
    expect(report.reclaim.length).toBeGreaterThan(1000);
    expect(elapsedMs).toBeLessThan(1000);
  });

  it('runs through the whole analysis, and the report is the one buildLicenseReport gives', async () => {
    const pipeline = await analyzeDemo();
    const names = pipeline.analysis.population.profiles.map((profile) => profile.name);
    const parse = parseLicenseFile(restText(SEAT_COUNT, names));
    const settings = mergeSettings({ roster: rosterFromParse(parse), rosterAsOf: parse.exportedAt });
    const out: { a: ReturnType<Pipeline['run']> | null } = { a: null };
    const elapsedMs = bestMs(2, () => {
      out.a = pipeline.run(pipeline.filters, settings);
    });
    const analysis = must(out.a);
    expect(must(analysis.licenses).seats).toBe(SEAT_COUNT);
    expect(JSON.stringify(analysis.licenses)).toBe(JSON.stringify(buildLicenseReport(analysis.population, settings, pipeline.store)));
    expect(analysis.seats.unused.length + (analysis.seats.keep?.length ?? 0)).toBeLessThanOrEqual(SEAT_COUNT);
    expect(elapsedMs).toBeLessThan(5000);
  });
});
