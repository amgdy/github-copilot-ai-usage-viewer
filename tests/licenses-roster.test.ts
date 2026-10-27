import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { customPlanCredits, DEFAULT_SETTINGS, mergeSettings, planCredits, saveSettings, seatCredits, SETTINGS_STORAGE_KEY, type RosterEntry, type Settings } from '../src/lib/analytics/settings';
import {
  applyLicenseImport,
  entryFromSeat,
  mergeRoster,
  parseLicenseFile,
  rosterFromParse,
  rosterFromSeats,
  sanitizeRoster,
  sanitizeRosterDetailed,
  type LicenseParse,
  type LicenseSeat,
} from '../src/lib/licenses';
import { MAX_SEATS } from '../src/lib/licenses/json';

const login = (i: number): string => `user${String(i).padStart(5, '0')}`;
const day = (i: number): string => `2026-03-${String(1 + (i % 28)).padStart(2, '0')}`;

/** A seat the way the parser reads it from restText(). */
function seatOf(i: number, over: Partial<LicenseSeat> = {}): LicenseSeat {
  return {
    login: login(i),
    name: `Test User ${i}`,
    email: `${login(i)}@example.com`,
    plan: i % 4 === 0 ? 'Enterprise' : 'Business',
    orgs: ['acme'],
    teams: [i % 2 === 0 ? 'core' : 'platform'],
    createdAt: '2025-01-15',
    lastActivityAt: day(i),
    lastAuthenticatedAt: '2026-03-30',
    lastSurface: 'vscode',
    source: 'api',
    ...over,
  };
}

/** The REST answer for seats 0 to n-1, shaped like GET /orgs/{org}/copilot/billing/seats. Synthetic data only. */
function restText(n: number): string {
  const seats = Array.from({ length: n }, (_, i) => ({
    created_at: '2025-01-15T09:00:00Z',
    pending_cancellation_date: null,
    last_activity_at: `${day(i)}T09:00:00Z`,
    last_activity_editor: 'vscode/1.97.1/copilot-chat/0.24.1',
    last_authenticated_at: '2026-03-30T09:00:00Z',
    plan_type: i % 4 === 0 ? 'enterprise' : 'business',
    assignee: { login: login(i), id: i + 1000, type: 'User', name: `Test User ${i}`, email: `${login(i)}@example.com` },
    organization: { login: 'acme' },
    assigning_team: { slug: i % 2 === 0 ? 'core' : 'platform' },
  }));
  return JSON.stringify({ total_seats: n, seats });
}

/** A seat with every text field at its longest, to see how big a roster can get. */
const heavySeat = (i: number): LicenseSeat =>
  seatOf(i, {
    name: 'N'.repeat(100),
    email: `${'e'.repeat(90)}.${i}@example.com`,
    orgs: Array.from({ length: 12 }, (_, k) => `organization-${k}`),
    teams: Array.from({ length: 12 }, (_, k) => `team-${k}-platform-engineering`),
  });

const parseOf = (seats: LicenseSeat[], exportedAt?: string): LicenseParse => ({ kind: 'seats-json', seats, records: seats.length, skipped: 0, problems: [], exportedAt });

function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.freeze(value);
    for (const v of Object.values(value)) freeze(v);
  }
  return value;
}

function bestMs(runs: number, fn: () => void): number {
  let best = Infinity;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    best = Math.min(best, performance.now() - t0);
  }
  return best;
}

/** A fake localStorage that refuses a value longer than `limit` characters, like a full browser quota. */
function fakeStorage(limit = Infinity) {
  const data = new Map<string, string>();
  const calls: number[] = [];
  return {
    data,
    calls,
    getItem: (k: string): string | null => data.get(k) ?? null,
    setItem: (k: string, v: string): void => {
      calls.push(String(v).length);
      if (String(v).length > limit) throw new Error('QuotaExceededError');
      data.set(k, String(v));
    },
    removeItem: (k: string): void => void data.delete(k),
  };
}

const slimOf = (roster: RosterEntry[]): RosterEntry[] => roster.map((e) => (e.plan === undefined ? { user: e.user } : { user: e.user, plan: e.plan }));

describe('sanitizeRoster', () => {
  it('keeps what an import produces, unchanged, also after a trip through JSON', () => {
    const roster = rosterFromSeats(Array.from({ length: 300 }, (_, i) => seatOf(i)));
    expect(sanitizeRoster(roster)).toEqual(roster);
    expect(sanitizeRoster(JSON.parse(JSON.stringify(roster)))).toEqual(roster);
    expect(JSON.stringify(sanitizeRoster(roster))).toBe(JSON.stringify(roster));
    const once = sanitizeRoster(roster);
    expect(sanitizeRoster(once)).toEqual(once);
  });

  it('accepts the plain logins and the short form that earlier versions saved', () => {
    const old = [{ user: 'user001', plan: 'Business' }, { user: 'user002', plan: 'Enterprise' }, { user: 'user003' }, 'user004'];
    expect(sanitizeRoster(old)).toEqual([{ user: 'user001', plan: 'Business' }, { user: 'user002', plan: 'Enterprise' }, { user: 'user003' }, { user: 'user004' }]);
  });

  it('trims, drops a leading @, and counts the entries without a usable login', () => {
    const r = sanitizeRosterDetailed([
      '  user001  ',
      '@user002',
      { user: ' @user003 ' },
      'x'.repeat(100),
      '',
      '   ',
      'has space',
      'a,b',
      'a;b',
      '"quoted"',
      "it's",
      '<b>',
      'x'.repeat(101),
      7,
      null,
      undefined,
      {},
      { user: 5 },
      [],
      ['user004'],
    ]);
    expect(r.entries.map((e) => e.user)).toEqual(['user001', 'user002', 'user003', 'x'.repeat(100)]);
    expect(r.invalid).toBe(16);
    expect(r.duplicates).toBe(0);
    expect(r.notAList).toBe(false);
  });

  it('accepts the looser spelling of a stored login, so rosters that earlier versions saved still load', () => {
    expect(sanitizeRoster(['first.last', 'a@b.c', 'user_name', 'dependabot[bot]']).map((e) => e.user)).toEqual(['first.last', 'a@b.c', 'user_name', 'dependabot[bot]']);
  });

  it('keeps the first of two logins that differ only in case, with its own spelling', () => {
    const r = sanitizeRosterDetailed([{ user: 'Ana', plan: 'Business' }, { user: 'ana', plan: 'Enterprise' }, ' ANA ', 'bob']);
    expect(r.entries).toEqual([{ user: 'Ana', plan: 'Business' }, { user: 'bob' }]);
    expect(r.duplicates).toBe(2);
    expect(r.invalid).toBe(0);
  });

  it('reads plans in the names the app uses, and drops a plan it cannot read while keeping the user', () => {
    const r = sanitizeRosterDetailed([
      { user: 'a', plan: 'business' },
      { user: 'b', plan: 'GitHub Copilot ENTERPRISE' },
      { user: 'c', plan: 'unknown' },
      { user: 'd', plan: 'platinum' },
      { user: 'e', plan: '' },
      { user: 'f', plan: 1900 },
      { user: 'g', plan: {} },
      { user: 'h', plan: null },
      { user: 'i', plan: '$39' },
      { user: 'j', plan: 2500 },
    ]);
    expect(r.entries.map((e) => e.plan)).toEqual(['Business', 'Enterprise', undefined, undefined, undefined, 'Business', undefined, undefined, 'Enterprise', '2500']);
    expect(r.entries).toHaveLength(10);
    expect(r.unreadablePlans).toBe(1);
    expect(planCredits(r.entries[9].plan)).toBe(2500);
  });

  it('reads the label the report gives a custom plan, "Custom (N credits)", as credits in the roster and in the seat credits', () => {
    expect(customPlanCredits('Custom (2,500 credits)')).toBe(2500);
    expect(customPlanCredits('Business')).toBeNaN();
    expect(planCredits('Custom (2,500 credits)')).toBe(2500);
    expect(planCredits(' custom (2500 credits) ')).toBe(2500);
    expect(planCredits('Custom (500 credits)')).toBe(500);
    expect(planCredits('Custom (1,900 credits)')).toBe(1900);
    expect(seatCredits('Custom (2,500 credits)', 1900)).toBe(2500);
    for (const bad of ['Custom (0 credits)', 'Custom (abc credits)', 'Custom (12,34 credits)', 'Custom (2,500)', 'Custom credits']) {
      expect(planCredits(bad), bad).toBeNaN();
      expect(seatCredits(bad, 1900), bad).toBe(1900);
    }
    const r = sanitizeRosterDetailed([{ user: 'a', plan: 'Custom (2,500 credits)' }, { user: 'b', plan: 'Custom (500 credits)' }, { user: 'c', plan: 'Custom (x credits)' }]);
    expect(r.entries.map((e) => e.plan)).toEqual(['2500', '5', undefined]);
    expect(r.unreadablePlans).toBe(1);
    expect(r.entries.slice(0, 2).map((e) => planCredits(e.plan))).toEqual([2500, 500]);
  });

  it('keeps license details only when they hold valid values, and caps long text', () => {
    const long = (n: number): string => 'x'.repeat(n);
    const [kept] = sanitizeRoster([
      {
        user: 'user001',
        plan: 'Business',
        name: `  ${long(150)}  `,
        email: ' User001@Example.com ',
        org: long(200),
        team: long(200),
        createdAt: '2025-01-15',
        lastActivityAt: '2026-03-20',
        lastAuthenticatedAt: '2026-03-21',
        lastSurface: long(80),
        pendingCancellation: '2026-04-30',
        source: 'api',
      },
    ]);
    expect(kept).toEqual({
      user: 'user001',
      plan: 'Business',
      name: long(100),
      email: 'User001@Example.com',
      org: long(160),
      team: long(160),
      createdAt: '2025-01-15',
      lastActivityAt: '2026-03-20',
      lastAuthenticatedAt: '2026-03-21',
      lastSurface: long(40),
      pendingCancellation: '2026-04-30',
      source: 'api',
    });
    const [dropped] = sanitizeRoster([
      {
        user: 'user001',
        name: 5,
        email: 'not an email',
        org: '   ',
        team: {},
        createdAt: '2026-02-30',
        lastActivityAt: '2007-12-31',
        lastAuthenticatedAt: '2101-01-01',
        lastSurface: [],
        pendingCancellation: '2026-03-01T00:00:00Z',
        source: 'list',
      },
    ]);
    expect(dropped).toEqual({ user: 'user001' });
    expect(sanitizeRoster([{ user: 'user001', email: `${long(125)}@example.com` }])).toEqual([{ user: 'user001' }]);
  });

  it('accepts days from 2008-01-01 to 2100-12-31 and only real calendar days', () => {
    const at = (value: unknown): string | undefined => sanitizeRoster([{ user: 'u', lastActivityAt: value }])[0].lastActivityAt;
    for (const ok of ['2008-01-01', '2100-12-31', '2024-02-29', '2026-03-31']) expect(at(ok), ok).toBe(ok);
    for (const bad of ['2007-12-31', '2101-01-01', '2025-02-29', '2026-13-01', '2026-3-1', '20260331', '2026-03-31T10:00:00Z', 20260331, null, true]) {
      expect(at(bad), String(bad)).toBeUndefined();
    }
  });

  it('keeps the source only when it is one of the two known sources', () => {
    const at = (value: unknown): string | undefined => sanitizeRoster([{ user: 'u', source: value }])[0].source;
    expect(at('api')).toBe('api');
    expect(at('activity')).toBe('activity');
    for (const bad of ['list', 'API', '', 5, null]) expect(at(bad), String(bad)).toBeUndefined();
  });

  it('drops every key it does not know and cannot be used to pollute prototypes', () => {
    const hostile: unknown = JSON.parse('{"user":"user001","__proto__":{"polluted":true},"constructor":{"x":1},"isAdmin":true,"seat":{"x":1}}');
    expect(sanitizeRoster([hostile])).toEqual([{ user: 'user001' }]);
    expect(Object.keys(sanitizeRoster([hostile])[0])).toEqual(['user']);
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('writes the keys in a fixed order, so the stored text does not change from one save to the next', () => {
    const shuffled = {
      source: 'activity',
      lastSurface: 'vscode',
      plan: 'Business',
      team: 't',
      user: 'user001',
      org: 'o',
      createdAt: '2025-01-01',
      name: 'N',
      lastActivityAt: '2026-01-01',
      email: 'a@b.c',
      pendingCancellation: '2026-02-01',
      lastAuthenticatedAt: '2026-01-02',
    };
    const order = ['user', 'plan', 'name', 'email', 'org', 'team', 'createdAt', 'lastActivityAt', 'lastAuthenticatedAt', 'lastSurface', 'pendingCancellation', 'source'];
    expect(Object.keys(sanitizeRoster([shuffled])[0])).toEqual(order);
    const fromSeat = entryFromSeat(seatOf(1, { pendingCancellation: '2026-05-31' }));
    expect(Object.keys(fromSeat)).toEqual(order.filter((key) => key !== 'lastAuthenticatedAt'));
    const neverActive = entryFromSeat(seatOf(1, { lastActivityAt: undefined, lastAuthenticatedAt: '2026-03-31', pendingCancellation: '2026-05-31' }));
    expect(Object.keys(neverActive)).toEqual(order.filter((key) => key !== 'lastActivityAt'));
  });

  it('says when the value is not a list at all', () => {
    for (const raw of [undefined, null, 'user001', 5, {}, { user: 'a' }, true]) {
      expect(sanitizeRosterDetailed(raw), String(raw)).toEqual({ entries: [], invalid: 0, duplicates: 0, unreadablePlans: 0, notAList: true });
      expect(sanitizeRoster(raw)).toEqual([]);
    }
    expect(sanitizeRosterDetailed([]).notAList).toBe(false);
    expect(sanitizeRosterDetailed([]).entries).toEqual([]);
  });

  it('stops at the largest roster it accepts and counts the rest as left out', () => {
    const r = sanitizeRosterDetailed(Array.from({ length: MAX_SEATS + 5 }, (_, i) => `u${i}`));
    expect(r.entries).toHaveLength(MAX_SEATS);
    expect(r.invalid).toBe(5);
  });

  it('does not change its input', () => {
    const input = freeze([{ user: ' Ana ', plan: 'business', name: ' N ' }, { user: 'ana' }, { user: 'bob', extra: [1, 2] }]);
    const snapshot = structuredClone(input);
    expect(sanitizeRoster(input)).toEqual([{ user: 'Ana', plan: 'Business', name: 'N' }, { user: 'bob' }]);
    expect(input).toEqual(snapshot);
  });
});

describe('entryFromSeat and the roster of an import', () => {
  it('writes the seat into a roster entry', () => {
    expect(entryFromSeat(seatOf(1))).toEqual({
      user: 'user00001',
      plan: 'Business',
      name: 'Test User 1',
      email: 'user00001@example.com',
      org: 'acme',
      team: 'platform',
      createdAt: '2025-01-15',
      lastActivityAt: '2026-03-02',
      lastSurface: 'vscode',
      source: 'api',
    });
  });

  it('keeps the sign-in day as context only when there is no activity date', () => {
    const signIn = (activity: string | undefined, auth: string | undefined): string | undefined =>
      entryFromSeat(seatOf(1, { lastActivityAt: activity, lastAuthenticatedAt: auth })).lastAuthenticatedAt;
    expect(signIn('2026-03-10', '2026-03-11')).toBeUndefined();
    expect(signIn('2026-03-10', '2026-03-10')).toBeUndefined();
    expect(signIn('2026-03-10', '2026-03-09')).toBeUndefined();
    expect(signIn(undefined, '2026-03-09')).toBe('2026-03-09');
    expect(signIn(undefined, undefined)).toBeUndefined();
  });

  it('leaves out what a plain list of logins does not say', () => {
    expect(entryFromSeat({ login: 'User001', orgs: [], teams: [], source: 'list' })).toEqual({ user: 'User001' });
    expect(Object.keys(entryFromSeat({ login: 'User001', orgs: [], teams: [], source: 'list' }))).toEqual(['user']);
    expect(entryFromSeat({ login: 'User001', plan: 'Enterprise', orgs: [], teams: [], source: 'list' })).toEqual({ user: 'User001', plan: 'Enterprise' });
  });

  it('keeps the source of an Activity report', () => {
    expect(entryFromSeat({ login: 'u', orgs: [], teams: [], source: 'activity', lastActivityAt: '2026-03-01' })).toEqual({ user: 'u', lastActivityAt: '2026-03-01', source: 'activity' });
  });

  it('joins organizations and teams, and caps a long list with the number left out', () => {
    const orgs = Array.from({ length: 40 }, (_, i) => `organization-${i}`);
    const entry = entryFromSeat(seatOf(1, { orgs, teams: ['alpha', 'beta'] }));
    expect(entry.org?.startsWith('organization-0, organization-1, ')).toBe(true);
    expect(entry.org?.endsWith(' +33')).toBe(true);
    expect(entry.org?.length).toBeLessThanOrEqual(125);
    expect(entry.team).toBe('alpha, beta');
    const none = entryFromSeat(seatOf(1, { orgs: [], teams: [] }));
    expect(none.org).toBeUndefined();
    expect(none.team).toBeUndefined();
  });

  it('is what the parser gives for the same seats, in the same order', () => {
    const parse = parseLicenseFile(restText(40));
    expect(parse.seats).toEqual(Array.from({ length: 40 }, (_, i) => seatOf(i)));
    expect(rosterFromParse(parse)).toEqual(rosterFromSeats(parse.seats));
    expect(rosterFromParse(parse).map((e) => e.user)).toEqual(Array.from({ length: 40 }, (_, i) => login(i)));
    expect(rosterFromParse(parseOf([]))).toEqual([]);
    expect(rosterFromParse(parseLicenseFile('<html>'))).toEqual([]);
  });
});

describe('mergeRoster', () => {
  const entry = (i: number, over: Partial<LicenseSeat> = {}): RosterEntry => entryFromSeat(seatOf(i, over));

  it("'replace' gives the new entries, once each, and forgets the old roster", () => {
    const existing: RosterEntry[] = [{ user: 'old1', plan: 'Business' }, { user: 'old2' }];
    const incoming: RosterEntry[] = [entry(1), entry(2), { ...entry(1), plan: 'Enterprise' }, { user: 'USER00002' }];
    expect(mergeRoster(existing, incoming, 'replace')).toEqual([entry(1), entry(2)]);
    expect(mergeRoster(existing, [], 'replace')).toEqual([]);
  });

  it("'add' keeps everyone on the roster in order and puts the new users after them", () => {
    const out = mergeRoster([{ user: 'b' }, { user: 'a' }], [{ user: 'c' }, { user: 'A', plan: 'Business' }, { user: 'd' }], 'add');
    expect(out.map((e) => e.user)).toEqual(['b', 'a', 'c', 'd']);
    expect(out[1].plan).toBe('Business');
    expect(mergeRoster([{ user: 'b' }, { user: 'a' }], [], 'add')).toEqual([{ user: 'b' }, { user: 'a' }]);
  });

  it("'add' lets the new data win where it has a value and keeps the old where it has none", () => {
    const have: RosterEntry = { user: 'user001', plan: 'Business', name: 'Old Name', email: 'old@example.com', org: 'acme', source: 'api' };
    const add: RosterEntry = { user: 'user001', plan: 'Enterprise', name: 'New Name', team: 'core', source: 'api' };
    expect(mergeRoster([have], [add], 'add')).toEqual([{ user: 'user001', plan: 'Enterprise', name: 'New Name', email: 'old@example.com', org: 'acme', team: 'core', source: 'api' }]);
    expect(mergeRoster([have], [{ user: 'user001' }], 'add')).toEqual([have]);
  });

  it("'add' keeps the earlier creation day and the later activity and sign-in days", () => {
    const have: RosterEntry = { user: 'user001', createdAt: '2025-03-01', lastActivityAt: '2026-03-10', lastAuthenticatedAt: '2026-03-12' };
    const add: RosterEntry = { user: 'user001', createdAt: '2025-01-15', lastActivityAt: '2026-03-20', lastAuthenticatedAt: '2026-03-05' };
    expect(mergeRoster([have], [add], 'add')[0]).toEqual({ user: 'user001', createdAt: '2025-01-15', lastActivityAt: '2026-03-20', lastAuthenticatedAt: '2026-03-12' });
    expect(mergeRoster([add], [have], 'add')[0]).toEqual({ user: 'user001', createdAt: '2025-01-15', lastActivityAt: '2026-03-20', lastAuthenticatedAt: '2026-03-12' });
    expect(mergeRoster([{ user: 'user001' }], [add], 'add')[0]).toEqual(add);
    expect(mergeRoster([add], [{ user: 'user001' }], 'add')[0]).toEqual(add);
  });

  it("'add' keeps the spelling of the login that is on the roster", () => {
    expect(mergeRoster([{ user: 'User001' }], [{ user: 'user001', plan: 'Business' }], 'add')).toEqual([{ user: 'User001', plan: 'Business' }]);
  });

  it("'add' keeps the API as the source once there is one", () => {
    const source = (have: RosterEntry['source'], add: RosterEntry['source']): RosterEntry['source'] => mergeRoster([{ user: 'a', source: have }], [{ user: 'a', source: add }], 'add')[0].source;
    expect(source(undefined, 'activity')).toBe('activity');
    expect(source('activity', undefined)).toBe('activity');
    expect(source('activity', 'api')).toBe('api');
    expect(source('api', 'activity')).toBe('api');
    expect(source('api', undefined)).toBe('api');
    expect(source(undefined, undefined)).toBeUndefined();
  });

  it("'add' lets only an API import settle a pending cancellation, because only the API says whether one is scheduled", () => {
    const had: RosterEntry = { user: 'user001', pendingCancellation: '2026-04-30', source: 'api' };
    const pending = (add: RosterEntry): string | undefined => mergeRoster([had], [add], 'add')[0].pendingCancellation;
    expect(pending({ user: 'user001', lastActivityAt: '2026-03-20', source: 'api' })).toBeUndefined();
    expect(pending({ user: 'user001', lastActivityAt: '2026-03-20', source: 'activity' })).toBe('2026-04-30');
    expect(pending({ user: 'user001' })).toBe('2026-04-30');
    expect(pending({ user: 'user001', pendingCancellation: '2026-05-31', source: 'api' })).toBe('2026-05-31');
    expect(mergeRoster([{ user: 'user001', source: 'api' }], [{ user: 'user001', pendingCancellation: '2026-05-31', source: 'api' }], 'add')[0].pendingCancellation).toBe('2026-05-31');
  });

  it("'add' into an empty roster gives the same as 'replace'", () => {
    const incoming = rosterFromSeats(Array.from({ length: 50 }, (_, i) => seatOf(i)));
    expect(mergeRoster([], incoming, 'add')).toEqual(mergeRoster([], incoming, 'replace'));
    expect(mergeRoster([], incoming, 'add')).toEqual(incoming);
  });

  it("'add' with the same data again changes nothing", () => {
    const roster = rosterFromSeats(Array.from({ length: 100 }, (_, i) => seatOf(i)));
    expect(mergeRoster(roster, roster, 'add')).toEqual(roster);
    const part = roster.slice(10, 20);
    expect(mergeRoster(mergeRoster(roster, part, 'add'), part, 'add')).toEqual(roster);
  });

  it('removes duplicates and blank logins from the old roster too', () => {
    expect(mergeRoster([{ user: 'a' }, { user: 'A', plan: 'Business' }, { user: '  ' }], [], 'add')).toEqual([{ user: 'a' }]);
    expect(mergeRoster([{ user: '  ' }], [{ user: '' }], 'add')).toEqual([]);
  });

  it('adds license details to a roster of plain logins', () => {
    const plain: RosterEntry[] = [{ user: 'user00001', plan: 'Business' }, { user: 'user00002' }];
    const out = mergeRoster(plain, [entry(1), entry(2), entry(3)], 'add');
    expect(out.map((e) => e.user)).toEqual(['user00001', 'user00002', 'user00003']);
    expect(out[0]).toEqual(entry(1));
    expect(out[1].lastActivityAt).toBe('2026-03-03');
    expect(out[1].plan).toBe('Business');
  });

  it('does not change its inputs and returns a new list', () => {
    const existing = freeze([{ user: 'a', plan: 'Business' }, { user: 'b' }] as RosterEntry[]);
    const incoming = freeze([{ user: 'B', plan: 'Enterprise' }, { user: 'c' }] as RosterEntry[]);
    for (const mode of ['replace', 'add'] as const) {
      const out = mergeRoster(existing, incoming, mode);
      expect(out).not.toBe(existing);
      expect(out).not.toBe(incoming);
    }
    expect(mergeRoster(existing, incoming, 'add')).toEqual([{ user: 'a', plan: 'Business' }, { user: 'b', plan: 'Enterprise' }, { user: 'c' }]);
  });
});

describe('applyLicenseImport', () => {
  const rosterOf = (...ids: number[]): RosterEntry[] => rosterFromSeats(ids.map((i) => seatOf(i)));
  const usersOf = (r: { roster: RosterEntry[] }): string[] => r.roster.map((e) => e.user);

  it("'replace' swaps the roster for the file and says who was added, changed, kept and removed", () => {
    const file = parseOf([seatOf(2, { plan: 'Enterprise' }), seatOf(3), seatOf(4)], '2026-03-31');
    const r = applyLicenseImport(file, { roster: rosterOf(1, 2, 3), rosterAsOf: '2026-03-01' }, 'replace', '2026-04-02');
    expect(usersOf(r)).toEqual([login(2), login(3), login(4)]);
    expect(r).toMatchObject({ added: 1, updated: 1, unchanged: 1, removed: 1, rosterAsOf: '2026-03-31' });
  });

  it("'add' keeps the seats that are not in the file", () => {
    const file = parseOf([seatOf(2, { plan: 'Enterprise' }), seatOf(3), seatOf(4)], '2026-03-31');
    const r = applyLicenseImport(file, { roster: rosterOf(1, 2, 3), rosterAsOf: '2026-03-01' }, 'add', '2026-04-02');
    expect(usersOf(r)).toEqual([login(1), login(2), login(3), login(4)]);
    expect(r).toMatchObject({ added: 1, updated: 1, unchanged: 2, removed: 0, rosterAsOf: '2026-03-31' });
    expect(r.roster[1].plan).toBe('Enterprise');
  });

  it('counts a user the same way whatever the case of the login', () => {
    const file = parseOf([seatOf(1, { login: login(1).toUpperCase() })], '2026-03-31');
    const r = applyLicenseImport(file, { roster: rosterOf(1) }, 'add');
    expect(r.added).toBe(0);
    expect(r.roster.map((e) => e.user)).toEqual([login(1)]);
  });

  it('takes the export day from the file, and with several files keeps the latest', () => {
    const file = parseOf([seatOf(1)], '2026-03-31');
    expect(applyLicenseImport(file, { roster: [], rosterAsOf: '2026-04-15' }, 'replace', '2026-05-01').rosterAsOf).toBe('2026-03-31');
    expect(applyLicenseImport(file, { roster: [], rosterAsOf: '2026-03-01' }, 'add', '2026-05-01').rosterAsOf).toBe('2026-03-31');
    expect(applyLicenseImport(file, { roster: [], rosterAsOf: '2026-04-15' }, 'add', '2026-05-01').rosterAsOf).toBe('2026-04-15');
    expect(applyLicenseImport(file, { roster: [] }, 'add', '2026-05-01').rosterAsOf).toBe('2026-03-31');
  });

  it('uses today for a plain list of logins, which has no dates, and keeps a stored day when adding', () => {
    const list = parseOf([{ login: 'user001', orgs: [], teams: [], source: 'list' }]);
    expect(applyLicenseImport(list, { roster: [], rosterAsOf: '2026-03-01' }, 'replace', '2026-05-01').rosterAsOf).toBe('2026-05-01');
    expect(applyLicenseImport(list, { roster: [], rosterAsOf: '2026-03-01' }, 'add', '2026-05-01').rosterAsOf).toBe('2026-03-01');
    expect(applyLicenseImport(list, { roster: [] }, 'add', '2026-05-01').rosterAsOf).toBe('2026-05-01');
    expect(applyLicenseImport(list, { roster: [] }, 'replace', '2026-05-01').rosterAsOf).toBe('2026-05-01');
  });

  it('ignores a stored day that is not a real day', () => {
    const file = parseOf([seatOf(1)], '2026-03-31');
    expect(applyLicenseImport(file, { roster: [], rosterAsOf: 'garbage' }, 'add', '2026-05-01').rosterAsOf).toBe('2026-03-31');
    const list = parseOf([{ login: 'user001', orgs: [], teams: [], source: 'list' }]);
    expect(applyLicenseImport(list, { roster: [], rosterAsOf: '2026-02-30' }, 'add', '2026-05-01').rosterAsOf).toBe('2026-05-01');
  });

  it('changes nothing for a file without seats', () => {
    const roster = rosterOf(1, 2);
    for (const empty of [parseOf([]), parseLicenseFile('<html>'), parseLicenseFile('')]) {
      for (const mode of ['replace', 'add'] as const) {
        const r = applyLicenseImport(empty, { roster, rosterAsOf: '2026-03-01' }, mode, '2026-05-01');
        expect(r).toEqual({ roster, rosterAsOf: '2026-03-01', added: 0, updated: 0, unchanged: 2, removed: 0 });
        expect(r.roster).not.toBe(roster);
      }
    }
    expect(applyLicenseImport(parseOf([]), { roster: [] }, 'replace').rosterAsOf).toBeUndefined();
  });

  it('works from the text of a file to settings that carry the license data', () => {
    const r = applyLicenseImport(parseLicenseFile(restText(30)), { roster: [] }, 'replace', '2026-04-02');
    expect(r).toMatchObject({ added: 30, updated: 0, unchanged: 0, removed: 0, rosterAsOf: '2026-03-30' });
    const settings = mergeSettings({ roster: r.roster, rosterAsOf: r.rosterAsOf });
    expect(settings.rosterAsOf).toBe('2026-03-30');
    expect(settings.roster).toEqual(rosterFromSeats(Array.from({ length: 30 }, (_, i) => seatOf(i))));
  });

  it('does not change the roster it is given', () => {
    const roster = freeze(rosterOf(1, 2, 3));
    const snapshot = structuredClone(roster);
    applyLicenseImport(parseOf([seatOf(2, { plan: 'Enterprise' }), seatOf(9)], '2026-03-31'), { roster }, 'add');
    applyLicenseImport(parseOf([seatOf(2, { plan: 'Enterprise' }), seatOf(9)], '2026-03-31'), { roster }, 'replace');
    expect(roster).toEqual(snapshot);
  });
});

describe('Settings.rosterAsOf', () => {
  it('is missing by default', () => {
    expect('rosterAsOf' in DEFAULT_SETTINGS).toBe(false);
    expect('rosterAsOf' in mergeSettings({})).toBe(false);
  });

  it('is kept when it is a real day', () => {
    expect(mergeSettings({ rosterAsOf: '2026-03-31' }).rosterAsOf).toBe('2026-03-31');
    expect(mergeSettings({ rosterAsOf: '2024-02-29' }).rosterAsOf).toBe('2024-02-29');
  });

  it('is dropped for anything else, so a bad stored value cannot reach the analysis', () => {
    for (const bad of ['2026-02-30', 'yesterday', '2026-03-31T00:00:00Z', '', '2026-3-1', 20260331, null, {}, true]) {
      expect('rosterAsOf' in mergeSettings({ rosterAsOf: bad as unknown as string }), String(bad)).toBe(false);
    }
  });

  it('survives merging twice and does not change the argument', () => {
    const input: Partial<Settings> = { rosterAsOf: '2026-03-31', roster: rosterFromSeats([seatOf(1)]) };
    const snapshot = structuredClone(input);
    const once = mergeSettings(input);
    expect(mergeSettings(once)).toEqual(once);
    expect(input).toEqual(snapshot);
    const bad: Partial<Settings> = { rosterAsOf: 'garbage' };
    mergeSettings(bad);
    expect(bad.rosterAsOf).toBe('garbage');
  });

  it('keeps the license details of the roster through merging and through JSON', () => {
    const s = mergeSettings({ roster: rosterFromSeats(Array.from({ length: 20 }, (_, i) => seatOf(i))), rosterAsOf: '2026-03-31' });
    expect(mergeSettings(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(s.roster[3]).toEqual(entryFromSeat(seatOf(3)));
  });
});

describe('saveSettings with a roster that carries license details', () => {
  afterEach(() => vi.unstubAllGlobals());

  const licensed = (n: number): Settings => mergeSettings({ topN: 7, roster: rosterFromSeats(Array.from({ length: n }, (_, i) => seatOf(i))), rosterAsOf: '2026-03-31' });

  it("writes the whole roster and the export day when the browser has room ('saved')", () => {
    const st = fakeStorage();
    vi.stubGlobal('localStorage', st);
    const s = licensed(50);
    expect(saveSettings(s)).toBe('saved');
    const stored = JSON.parse(st.data.get(SETTINGS_STORAGE_KEY) as string);
    expect(mergeSettings(stored)).toEqual(s);
    expect(sanitizeRoster(stored.roster)).toEqual(s.roster);
    expect(st.calls).toHaveLength(1);
  });

  it("falls back to logins and plans when the browser refuses the full roster, and says so ('slim')", () => {
    const s = licensed(500);
    const full = JSON.stringify(s).length;
    const slim = JSON.stringify({ ...s, roster: slimOf(s.roster) }).length;
    expect(slim).toBeLessThan(full / 3);
    const st = fakeStorage(Math.floor((full + slim) / 2));
    vi.stubGlobal('localStorage', st);
    const snapshot = structuredClone(s);
    expect(saveSettings(s)).toBe('slim');
    const stored = JSON.parse(st.data.get(SETTINGS_STORAGE_KEY) as string);
    expect(stored.roster).toHaveLength(500);
    expect(stored.roster).toEqual(slimOf(s.roster));
    expect(stored.rosterAsOf).toBe('2026-03-31');
    expect(stored.topN).toBe(7);
    expect(s).toEqual(snapshot);
    const back = mergeSettings(stored);
    expect(back.roster.map((e) => [e.user, e.plan])).toEqual(s.roster.map((e) => [e.user, e.plan]));
  });

  it("gives up quietly when even the short roster does not fit ('failed')", () => {
    const st = fakeStorage(50);
    vi.stubGlobal('localStorage', st);
    expect(saveSettings(licensed(20))).toBe('failed');
    expect(st.data.size).toBe(0);
    expect(st.calls).toHaveLength(2);
  });

  it('does not try a second time for a roster that is already short', () => {
    const st = fakeStorage(10);
    vi.stubGlobal('localStorage', st);
    expect(saveSettings(mergeSettings({ roster: [{ user: 'a', plan: 'Business' }, { user: 'b' }] }))).toBe('failed');
    expect(st.calls).toHaveLength(1);
  });

  it('does not throw when the browser has no storage or refuses every write', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(saveSettings(licensed(5))).toBe('failed');
    expect(saveSettings(mergeSettings({}))).toBe('failed');
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('SecurityError');
      },
    });
    expect(saveSettings(licensed(5))).toBe('failed');
  });

  it('keeps an earlier saved value when a write is refused', () => {
    const first = mergeSettings({ topN: 3 });
    const st = fakeStorage(JSON.stringify(first).length + 50);
    vi.stubGlobal('localStorage', st);
    expect(saveSettings(first)).toBe('saved');
    const before = st.data.get(SETTINGS_STORAGE_KEY);
    expect(saveSettings(licensed(200))).toBe('failed');
    expect(st.data.get(SETTINGS_STORAGE_KEY)).toBe(before);
  });
});

describe('a roster of 20,000 seats', () => {
  const N = 20_000;
  let text = '';
  beforeAll(() => {
    text = restText(N);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is read, turned into roster entries and merged into an existing roster in well under a second', () => {
    let merged = 0;
    let seats = 0;
    const ms = bestMs(3, () => {
      const parse = parseLicenseFile(text);
      seats = parse.seats.length;
      const roster = rosterFromParse(parse);
      merged = mergeRoster(roster.slice(0, N / 2), roster, 'add').length;
      applyLicenseImport(parse, { roster: roster.slice(0, N / 2), rosterAsOf: '2026-03-01' }, 'add');
    });
    expect(seats).toBe(N);
    expect(merged).toBe(N);
    expect(ms).toBeLessThan(1000);
  });

  it('is checked in well under a second without losing anything', () => {
    const roster = rosterFromParse(parseLicenseFile(text));
    let out: RosterEntry[] = [];
    const ms = bestMs(3, () => {
      out = sanitizeRoster(roster);
    });
    expect(out).toEqual(roster);
    expect(ms).toBeLessThan(1000);
  });

  it('stays small enough for the browser: about 215 characters a seat with names and emails, under the usual 5 MB quota', () => {
    const roster = rosterFromParse(parseLicenseFile(text));
    const s = mergeSettings({ roster, rosterAsOf: '2026-03-30' });
    const size = JSON.stringify(s).length;
    expect(size / N).toBeGreaterThan(150);
    expect(size / N).toBeLessThan(230);
    expect(size).toBeLessThan(4_700_000);
    const slim = JSON.stringify({ ...s, roster: slimOf(roster) }).length;
    expect(slim / N).toBeLessThan(50);
    expect(slim).toBeLessThan(1_000_000);
  });

  it("saves the whole roster under a 5 MB quota, and the short one when the quota is 1 MB ('saved', 'slim')", () => {
    const s = mergeSettings({ roster: rosterFromParse(parseLicenseFile(text)), rosterAsOf: '2026-03-30' });
    const big = fakeStorage(5_000_000);
    vi.stubGlobal('localStorage', big);
    expect(saveSettings(s)).toBe('saved');
    expect(JSON.parse(big.data.get(SETTINGS_STORAGE_KEY) as string).roster).toHaveLength(N);
    const small = fakeStorage(1_000_000);
    vi.stubGlobal('localStorage', small);
    expect(saveSettings(s)).toBe('slim');
    const stored = JSON.parse(small.data.get(SETTINGS_STORAGE_KEY) as string);
    expect(stored.roster).toHaveLength(N);
    expect(stored.roster[0]).toEqual({ user: login(0), plan: 'Enterprise' });
  });

  it("falls back to the short roster when every text field is at its longest and the roster is too big for 5 MB ('slim')", () => {
    const roster = rosterFromSeats(Array.from({ length: N }, (_, i) => heavySeat(i)));
    const s = mergeSettings({ roster, rosterAsOf: '2026-03-30' });
    expect(JSON.stringify(s).length).toBeGreaterThan(5_000_000);
    const st = fakeStorage(5_000_000);
    vi.stubGlobal('localStorage', st);
    expect(saveSettings(s)).toBe('slim');
    expect(JSON.parse(st.data.get(SETTINGS_STORAGE_KEY) as string).roster).toHaveLength(N);
  });
});
