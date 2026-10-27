import { describe, expect, it } from 'vitest';
import { DOWNGRADE_HEADROOM } from '../src/lib/analytics/seats';
import { DEFAULT_SETTINGS, PLAN_CREDITS, seatPrice, type RosterEntry } from '../src/lib/analytics/settings';
import {
  RECENT_DAYS,
  RECLAIM_DAYS,
  STALE_EXPORT_DAYS,
  buildLicenseIndex,
  isNewSeat,
  parseLicenseFile,
  seatActivity,
  type LicenseKind,
} from '../src/lib/licenses';
import { LINKS } from '../src/lib/links';
import { LICENSES_DOCS } from '../src/lib/metrics/docs/licenses';
import { METRICS, metricDoc } from '../src/lib/metrics/registry';
import { SETTING_REFS } from '../src/lib/metrics/settingRefs';
import { METRIC_AREAS, type MetricDoc } from '../src/lib/metrics/types';
import { addDays, analyzeCsv, makeCsv, type RowSpec } from './helpers';

/**
 * The explanations of the seat and license numbers (src/lib/metrics/docs/licenses.ts) have to say what the code does.
 * tests/metric-docs.test.ts checks the structure of every doc in the app. These tests add what only the license docs
 * promise: the thresholds, the prices, the formats and the worked examples are checked against the real calculation.
 */

const SEAT_DOCS = ['seat-idle', 'seat-downgrade', 'seat-unused'];
const LICENSE_DOCS = [
  'license-import',
  'license-seats',
  'license-matched',
  'license-unmatched',
  'license-coverage',
  'license-outside-scope',
  'license-active-recently',
  'license-reclaim',
  'license-fading',
  'license-quiet',
  'license-pending-cancellation',
  'license-new-seats',
  'license-as-of',
];

const requireDoc = (id: string): MetricDoc => {
  const metric = metricDoc(id);
  if (!metric) throw new Error(`The doc ${id} is not defined`);
  return metric;
};

const textsOf = (metric: MetricDoc): string[] => [metric.title, metric.meaning, metric.formula, ...(metric.steps ?? []), ...(metric.notes ?? []), metric.example ?? ''];
const textOf = (metric: MetricDoc): string => textsOf(metric).join('\n');
const expectNone = (problems: string[]) => expect(problems, problems.join('\n')).toEqual([]);
const usd = (amount: number): string => `$${amount.toLocaleString('en-US')}`;

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('A value is missing');
  return value;
}

const EM_DASH = /\u2014/;
const EMOJI = /\p{Extended_Pictographic}/u;
const BANNED_WORDS = /\b(seamless|seamlessly|leverage|leverages|unlock|robust|cutting-edge|game-changing|delve)\b/i;
const BRITISH = /\b(organis\w*|behaviour\w*|colour\w*|centre\w*|licence\w*|analys(?:e|ed|ing)|favour\w*|prioritis\w*|recognis\w*|summaris\w*|customis\w*|utilis\w*|minimis\w*|maximis\w*|catalogue\w*|whilst|amongst|learnt)\b/i;

describe('license docs: structure', () => {
  it('defines the three seat docs and one doc for each license number', () => {
    const ids = LICENSES_DOCS.map((metric) => metric.id);
    expect(ids).toEqual(expect.arrayContaining([...SEAT_DOCS, ...LICENSE_DOCS]));
    expect(new Set(ids).size).toBe(ids.length);
    const registered = new Set(METRICS.map((metric) => metric.id));
    expectNone(ids.filter((id) => !registered.has(id)).map((id) => `${id}: missing from the registry`));
  });

  it('keeps every doc in the Seats and licenses area', () => {
    expect(METRIC_AREAS).toContain('Seats and licenses');
    expectNone(LICENSES_DOCS.filter((metric) => metric.area !== 'Seats and licenses').map((metric) => `${metric.id}: area "${metric.area}"`));
  });

  it('gives each license doc a meaning, a formula on one line, a worked example with numbers and related docs', () => {
    const bad: string[] = [];
    for (const id of LICENSE_DOCS) {
      const licenseDoc = requireDoc(id);
      if (!licenseDoc.meaning.trim()) bad.push(`${id}: empty meaning`);
      if (!licenseDoc.formula.trim() || licenseDoc.formula.includes('\n')) bad.push(`${id}: the formula must be one line`);
      if (!licenseDoc.example || !/\d/.test(licenseDoc.example)) bad.push(`${id}: needs a worked example with numbers`);
      if (!licenseDoc.related || licenseDoc.related.length === 0) bad.push(`${id}: needs related docs`);
    }
    expectNone(bad);
  });

  it('resolves every related id, setting, link and column of the seat and license docs', () => {
    const bad: string[] = [];
    for (const metric of LICENSES_DOCS) {
      for (const relatedId of metric.related ?? []) {
        if (relatedId === metric.id) bad.push(`${metric.id}: relates to itself`);
        else if (!metricDoc(relatedId)) bad.push(`${metric.id}: related "${relatedId}" is not defined`);
      }
      for (const setting of metric.settings ?? []) if (!(setting in SETTING_REFS)) bad.push(`${metric.id}: unknown setting "${setting}"`);
      for (const link of metric.links ?? []) if (!(link in LINKS)) bad.push(`${metric.id}: unknown link "${link}"`);
      for (const column of metric.columns ?? []) if (!/^[a-z][a-z0-9_]*$/.test(column)) bad.push(`${metric.id}: "${column}" is not a column name`);
    }
    expectNone(bad);
  });

  it('lets a reader reach each license doc from another one', () => {
    const linked = new Set(LICENSES_DOCS.flatMap((metric) => metric.related ?? []));
    expectNone(LICENSE_DOCS.filter((id) => !linked.has(id)).map((id) => `${id}: no seat or license doc lists it as related`));
  });

  it('follows the writing rules: no em dash, emoji, exclamation mark, marketing word or British spelling', () => {
    const bad: string[] = [];
    for (const metric of LICENSES_DOCS) {
      for (const text of textsOf(metric)) {
        const head = text.slice(0, 60);
        if (EM_DASH.test(text)) bad.push(`${metric.id}: em dash in "${head}"`);
        if (EMOJI.test(text)) bad.push(`${metric.id}: emoji in "${head}"`);
        if (text.includes('!')) bad.push(`${metric.id}: exclamation mark in "${head}"`);
        const banned = BANNED_WORDS.exec(text) ?? BRITISH.exec(text);
        if (banned) bad.push(`${metric.id}: "${banned[0]}" in "${head}"`);
        if (/NaN|undefined|Infinity/.test(text)) bad.push(`${metric.id}: a broken value in "${head}"`);
      }
      if (metric.formula.includes('\n')) bad.push(`${metric.id}: the formula runs over several lines`);
    }
    expectNone(bad);
  });
});

describe('license docs: thresholds and prices come from the code', () => {
  it('states the activity bands with the day counts of the code', () => {
    expect(requireDoc('license-active-recently').formula).toContain(`fewer than ${RECENT_DAYS} days`);
    expect(requireDoc('license-quiet').formula).toContain(`fewer than ${RECENT_DAYS} days`);
    expect(requireDoc('license-fading').formula).toContain(`${RECENT_DAYS} to ${RECLAIM_DAYS - 1} days`);
    expect(requireDoc('license-reclaim').formula).toContain(`at least ${RECLAIM_DAYS} days ago`);
    expect(textOf(requireDoc('license-as-of'))).toContain(
      `Fewer than ${RECENT_DAYS} days: recently active. ${RECENT_DAYS} to ${RECLAIM_DAYS - 1} days: fading. ${RECLAIM_DAYS} days or more`,
    );
    expect(textOf(requireDoc('license-as-of'))).toContain(`more than ${STALE_EXPORT_DAYS} days`);
    expect(textOf(requireDoc('seat-idle'))).toContain(`fewer than ${RECENT_DAYS} days`);
    expect(textOf(requireDoc('seat-unused'))).toContain(`fewer than ${RECENT_DAYS} days`);
    expect(textOf(requireDoc('seat-unused'))).toContain(`at least ${RECLAIM_DAYS} days ago`);
  });

  it('says that the date range and the filters do not change the reclaim and fading lists', () => {
    const sentence = 'The date range and the filters do not change this list. The usage check looks at every loaded row.';
    expect(requireDoc('license-reclaim').notes).toContain(sentence);
    expect(requireDoc('license-fading').notes).toContain(sentence);
    expect(textOf(requireDoc('license-reclaim'))).toContain(`fewer than ${RECLAIM_DAYS} days before the as-of date`);
    expect(requireDoc('license-fading').formula).toContain(`fewer than ${RECENT_DAYS} days before the as-of date`);
  });

  it('uses the seat prices and the plan credits of the app', () => {
    const business = seatPrice(PLAN_CREDITS.Business);
    const enterprise = seatPrice(PLAN_CREDITS.Enterprise);
    expect([business, enterprise]).toEqual([19, 39]);
    expect(seatPrice(2500)).toBe(25);

    const total = 60 * business + 40 * enterprise;
    expect(requireDoc('license-seats').example).toContain(`60 × ${usd(business)} + 40 × ${usd(enterprise)} = ${usd(60 * business)} + ${usd(40 * enterprise)} = ${usd(total)}`);
    expect(textOf(requireDoc('license-seats'))).toContain(`${usd(business)} for Business, ${usd(enterprise)} for Enterprise, otherwise credits × $0.01`);

    const credits = (plan: string): string => PLAN_CREDITS[plan].toLocaleString('en-US');
    expect(textOf(requireDoc('seat-idle'))).toContain(`${usd(business)} for ${credits('Business')} credits, ${usd(enterprise)} for ${credits('Enterprise')} credits`);
    expect(requireDoc('seat-downgrade').formula).toContain(`${usd(enterprise)} − ${usd(business)} = ${usd(enterprise - business)}`);
    expect(requireDoc('seat-downgrade').formula).toContain(`${Math.round(DOWNGRADE_HEADROOM * 100)}% of the Business credits ($${(DOWNGRADE_HEADROOM * business).toFixed(2)})`);
  });

  it('names the default new user window of the settings', () => {
    expect(requireDoc('license-new-seats').example).toContain(`new user window of ${DEFAULT_SETTINGS.newUserDays} days`);
  });
});

describe('license docs: every format the import doc names is accepted', () => {
  const firstSeat = { assignee: { login: 'user001' }, plan_type: 'business', last_activity_at: '2026-06-20T10:00:00Z' };
  const secondSeat = { assignee: { login: 'user002' }, plan_type: 'enterprise', last_activity_at: null };
  const page = (...seats: object[]) => JSON.stringify({ total_seats: 2, seats });
  const ACTIVITY_CSV = [
    'report_time,login,last_authenticated_at,last_activity_at,last_surface',
    '2026-06-30T00:00:00Z,user001,2026-06-20T09:00:00Z,2026-06-20T10:00:00Z,vscode',
    '2026-06-30T00:00:00Z,user002,,,',
    '',
  ].join('\n');

  const CASES: [string, string, LicenseKind][] = [
    ['one response of the seats API', page(firstSeat, secondSeat), 'seats-json'],
    ['a list of seats', JSON.stringify([firstSeat, secondSeat]), 'seats-json'],
    ['pages one after another (gh api --paginate)', `${page(firstSeat)}${page(secondSeat)}`, 'seats-json'],
    ['a list of pages (gh api --slurp)', `[${page(firstSeat)},${page(secondSeat)}]`, 'seats-json'],
    ['one seat per line', `${JSON.stringify(firstSeat)}\n${JSON.stringify(secondSeat)}\n`, 'seats-json'],
    ['the Activity report CSV', ACTIVITY_CSV, 'activity-csv'],
    [
      'a CSV with a login column and optional plan, organization, team and email columns',
      'login,plan,org,team,email\nuser001,business,acme,core,user001@example.com\nuser002,enterprise,acme,,user002@example.com\n',
      'seats-csv',
    ],
    ['logins on separate lines', 'user001\nuser002\n', 'login-list'],
    ['logins separated by commas', 'user001, user002', 'login-list'],
    ['logins separated by semicolons', 'user001;user002', 'login-list'],
    ['logins separated by spaces', 'user001 user002', 'login-list'],
  ];

  it.each(CASES)('%s', (_format, text, kind) => {
    const parse = parseLicenseFile(text);
    expect(parse.kind).toBe(kind);
    expect(parse.seats.map((seat) => seat.login)).toEqual(['user001', 'user002']);
  });

  it('sets the export date to the report time, or to the newest date in a seats file, and a plain list has none', () => {
    expect(parseLicenseFile(ACTIVITY_CSV).exportedAt).toBe('2026-06-30');
    expect(parseLicenseFile(page(firstSeat, secondSeat)).exportedAt).toBe('2026-06-20');
    expect(parseLicenseFile('user001\nuser002').exportedAt).toBeUndefined();
  });

  it('refuses a usage report', () => {
    const parse = parseLicenseFile(makeCsv([{ date: '2026-06-01', user: 'user001', gross: 1 }]));
    expect(parse.kind).toBe('unknown');
    expect(parse.seats).toEqual([]);
    expect(parse.problems.join(' ')).toMatch(/usage report/);
  });

  it('calls a seats file with fewer seats than its total partial, and says so', () => {
    const parse = parseLicenseFile(JSON.stringify({ total_seats: 5, seats: [firstSeat, secondSeat] }));
    expect(parse.total).toBe(5);
    expect(parse.seats).toHaveLength(2);
    expect(parse.problems.length).toBeGreaterThan(0);
  });

  it('turns a login that appears three times into one seat that keeps every organization and team', () => {
    const record = (login: string, org: string, team?: string) => ({
      assignee: { login },
      organization: { login: org },
      ...(team ? { assigning_team: { slug: team } } : {}),
      plan_type: 'business',
    });
    const parse = parseLicenseFile(
      JSON.stringify({
        total_seats: 4,
        seats: [record('Ana-Dev', 'org-one'), record('Ana-Dev', 'org-two'), record('Ana-Dev', 'org-one', 'team-a'), record('ben-dev', 'org-one')],
      }),
    );
    expect(parse.records).toBe(4);
    expect(parse.seats.map((seat) => seat.login)).toEqual(['Ana-Dev', 'ben-dev']);
    expect(parse.seats[0]).toMatchObject({ orgs: ['org-one', 'org-two'], teams: ['team-a'] });
  });

  it('keeps the highest plan, the latest activity and sign-in and the earliest creation date of a merged seat', () => {
    const [merged] = parseLicenseFile(
      JSON.stringify([
        { assignee: { login: 'user001' }, plan_type: 'business', created_at: '2025-03-01T00:00:00Z', last_activity_at: '2026-05-01T00:00:00Z', last_authenticated_at: '2026-05-02T00:00:00Z' },
        { assignee: { login: 'USER001' }, plan_type: 'enterprise', created_at: '2025-01-01T00:00:00Z', last_activity_at: '2026-06-01T00:00:00Z', last_authenticated_at: '2026-04-02T00:00:00Z' },
      ]),
    ).seats;
    expect(merged).toMatchObject({
      login: 'user001',
      plan: 'Enterprise',
      createdAt: '2025-01-01',
      lastActivityAt: '2026-06-01',
      lastAuthenticatedAt: '2026-05-02',
    });
  });
});

describe('license docs: the worked examples match the behavior', () => {
  const AS_OF = '2026-06-30';
  const seat = (user: string, over: Partial<RosterEntry> = {}): RosterEntry => ({ user, plan: 'Business', source: 'api', ...over });
  const indexOf = (entry: RosterEntry) => must(buildLicenseIndex([entry], AS_OF));
  const statusOf = (lastActivityAt: string) => {
    const entry = seat('user001', { lastActivityAt });
    return seatActivity(entry, indexOf(entry));
  };
  const OLD = '2025-01-01';

  it('as-of date: June 20 is 10 days and recently active, March 31 is 91 days and a reclaim candidate', () => {
    expect(statusOf('2026-06-20')).toEqual({ days: 10, status: 'recent' });
    expect(statusOf('2026-03-31')).toEqual({ days: 91, status: 'stale' });
  });

  it('bands: 45 days is fading, and the seat is a reclaim candidate from day 90', () => {
    expect(statusOf(addDays(AS_OF, -45)).status).toBe('fading');
    expect(statusOf(addDays(AS_OF, -(RECENT_DAYS - 1))).status).toBe('recent');
    expect(statusOf(addDays(AS_OF, -RECENT_DAYS)).status).toBe('fading');
    expect(statusOf(addDays(AS_OF, -(RECLAIM_DAYS - 1))).status).toBe('fading');
    expect(statusOf(addDays(AS_OF, -RECLAIM_DAYS)).status).toBe('stale');
  });

  it('new seats: with the default window, 10 days is new and 14 days is not', () => {
    const window = DEFAULT_SETTINGS.newUserDays;
    const isNew = (days: number): boolean => {
      const entry = seat('user001', { createdAt: addDays(AS_OF, -days) });
      return isNewSeat(entry, indexOf(entry), window);
    };
    expect(isNew(10)).toBe(true);
    expect(isNew(window - 1)).toBe(true);
    expect(isNew(window)).toBe(false);
  });

  it('puts dated inactive seats on the reclaim list and blank dates on the review list', async () => {
    const roster = [
      seat('user001', { lastActivityAt: addDays(AS_OF, -2), createdAt: OLD }),
      seat('user002', { lastActivityAt: addDays(AS_OF, -100), createdAt: OLD }),
      seat('user003', { lastActivityAt: addDays(AS_OF, -60), createdAt: OLD }),
      seat('user004', { lastActivityAt: addDays(AS_OF, -5), createdAt: OLD }),
      seat('user005', { createdAt: addDays(AS_OF, -120) }),
      seat('user006', { createdAt: OLD, lastAuthenticatedAt: addDays(AS_OF, -150) }),
    ];
    const csv = makeCsv([{ date: '2026-06-15', user: 'user001', gross: 1 }], { pool: true });
    const { analysis } = await analyzeCsv(csv, { settings: { roster, rosterAsOf: AS_OF } });
    const report = must(analysis.licenses);

    expect(report.reclaim.map((finding) => [finding.login, finding.reason, finding.seatPrice])).toEqual([['user002', 'stale', 19]]);
    expect(report.reclaimValue).toBe(19);
    expect(report.fading.map((finding) => finding.login)).toEqual(['user003']);
    expect(report.quiet.map((finding) => finding.login)).toEqual(['user004']);
    expect(report.noActivityDate.map((finding) => finding.login)).toEqual(['user005', 'user006']);
    expect(report.byStatus).toEqual({ recent: 2, fading: 1, stale: 1, 'no-date': 2, unknown: 0 });

    // The fading seat can be unused, while seats without a recent activity date are only for review.
    expect(analysis.seats.unused.map((candidate) => candidate.name).sort()).toEqual(['user002', 'user003']);
    expect(analysis.seats.keep?.map((candidate) => candidate.name)).toEqual(['user004']);
    expect(analysis.seats.idle).toEqual([]);
  });

  it('pending cancellation: three seats with a cancellation date are listed and count as no saving', async () => {
    const leaving = ['user002', 'user003', 'user004'].map((login) => seat(login, { lastActivityAt: addDays(AS_OF, -200), createdAt: OLD, pendingCancellation: '2026-07-15' }));
    const roster = [seat('user001', { lastActivityAt: addDays(AS_OF, -2), createdAt: OLD }), ...leaving];
    const csv = makeCsv([{ date: '2026-06-15', user: 'user001', gross: 1 }], { pool: true });
    const { analysis } = await analyzeCsv(csv, { settings: { roster, rosterAsOf: AS_OF } });
    const report = must(analysis.licenses);

    expect(report.seats).toBe(4);
    expect(report.pending.map((finding) => finding.login).sort()).toEqual(['user002', 'user003', 'user004']);
    expect(report.reclaim).toEqual([]);
    expect(report.fading).toEqual([]);
    expect(report.reclaimValue).toBe(0);
    expect(analysis.seats.unused).toEqual([]);
    expect(analysis.seats.unusedValue).toBe(0);
  });

  it('coverage: 92 of 100 users in the report on the roster is 92%, and the 8 others used $400', async () => {
    const logins = Array.from({ length: 100 }, (_, index) => `user${String(index + 1).padStart(3, '0')}`);
    const specs: RowSpec[] = logins.map((user, index) => ({ date: '2026-06-15', user, gross: index < 92 ? 1 : 50 }));
    const roster = logins.slice(0, 92).map((login) => seat(login, { lastActivityAt: addDays(AS_OF, -3), createdAt: OLD }));
    const { analysis } = await analyzeCsv(makeCsv(specs, { pool: true }), { settings: { roster, rosterAsOf: AS_OF } });
    const report = must(analysis.licenses);

    expect([report.reportUsers, report.matched, report.unmatched.length]).toEqual([100, 92, 8]);
    expect(report.coverage).toBeCloseTo(0.92, 10);
    expect(report.unmatchedUsage).toBeCloseTo(400, 6);
    expect(report.matchedUsage).toBeCloseTo(92, 6);
  });

  it('unused seats: 12 roster users missing from the report, 2 active last week, leave 10 unused seats worth $190', async () => {
    const reported = Array.from({ length: 238 }, (_, index) => `user${String(index + 1).padStart(3, '0')}`);
    const ghosts = Array.from({ length: 12 }, (_, index) => `ghost${String(index + 1).padStart(2, '0')}`);
    const specs: RowSpec[] = reported.map((user) => ({ date: '2026-06-15', user, gross: 1 }));
    const roster = [
      ...reported.map((login) => seat(login, { lastActivityAt: addDays(AS_OF, -3), createdAt: OLD })),
      ...ghosts.map((ghost, index) => seat(ghost, { lastActivityAt: addDays(AS_OF, index < 2 ? -7 : -120), createdAt: OLD })),
    ];
    const { analysis } = await analyzeCsv(makeCsv(specs, { pool: true }), { settings: { roster, rosterAsOf: AS_OF } });
    const plan = analysis.seats;

    expect(roster).toHaveLength(250);
    expect(plan.unused).toHaveLength(10);
    expect(plan.unusedValue).toBe(190);
    expect(plan.keep?.map((candidate) => candidate.name).sort()).toEqual(['ghost01', 'ghost02']);
  });
});
