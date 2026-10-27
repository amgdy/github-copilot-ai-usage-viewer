import { describe, expect, it } from 'vitest';
import {
  earlierDay,
  isLoginLike,
  laterDay,
  loginKey,
  mergeSeats,
  parseLicenseFile,
  readDay,
  readLogin,
  readPlan,
  todayIso,
  type LicenseParse,
  type LicenseSeat,
} from '../src/lib/licenses';
import { surfaceName } from '../src/lib/licenses/fields';
import { MAX_SEATS } from '../src/lib/licenses/json';
import { canonicalPlan, higherPlan, planRank } from '../src/lib/licenses/plan';
import { makeCsv } from './helpers';

interface SeatSpec {
  login: string;
  name?: string | null;
  email?: string | null;
  plan?: string;
  org?: string;
  team?: string;
  created?: string;
  activity?: string | null;
  authenticated?: string | null;
  editor?: string | null;
  pending?: string | null;
}

/** One seat in the shape of GET /orgs/{org}/copilot/billing/seats. Synthetic data only. */
function restSeat(spec: SeatSpec): Record<string, unknown> {
  const seat: Record<string, unknown> = {
    created_at: spec.created ?? '2025-01-15T09:00:00Z',
    pending_cancellation_date: spec.pending ?? null,
    last_activity_at: spec.activity === undefined ? '2026-03-20T09:00:00Z' : spec.activity,
    last_activity_editor: spec.editor === undefined ? 'vscode/1.97.1/copilot-chat/0.24.1' : spec.editor,
    last_authenticated_at: spec.authenticated === undefined ? '2026-03-21T09:00:00Z' : spec.authenticated,
    plan_type: spec.plan ?? 'business',
    assignee: { login: spec.login, id: 1000, type: 'User', name: spec.name ?? null, email: spec.email ?? null },
  };
  if (spec.org !== undefined) seat.organization = { login: spec.org, id: 5 };
  if (spec.team !== undefined) seat.assigning_team = { slug: spec.team, name: spec.team, id: 7 };
  return seat;
}

const page = (seats: unknown[], total: number = seats.length) => ({ total_seats: total, seats });

const REST_SEAT_A = restSeat({ login: 'user001', name: 'Ada One', email: 'user001@example.com', org: 'acme', team: 'core', authenticated: '2026-03-21T10:00:00Z' });
const REST_SEAT_B = restSeat({ login: 'user002', plan: 'enterprise', activity: null, authenticated: null, editor: null, created: '2025-02-01T00:00:00Z' });
const REST_SEAT_C = restSeat({ login: 'User003', plan: 'unknown', pending: '2026-04-30' });

const SEAT_A: LicenseSeat = {
  login: 'user001',
  name: 'Ada One',
  email: 'user001@example.com',
  plan: 'Business',
  orgs: ['acme'],
  teams: ['core'],
  createdAt: '2025-01-15',
  lastActivityAt: '2026-03-20',
  lastAuthenticatedAt: '2026-03-21',
  lastSurface: 'vscode',
  source: 'api',
};
const SEAT_B: LicenseSeat = { login: 'user002', plan: 'Enterprise', orgs: [], teams: [], createdAt: '2025-02-01', source: 'api' };
const SEAT_C: LicenseSeat = {
  login: 'User003',
  orgs: [],
  teams: [],
  createdAt: '2025-01-15',
  lastActivityAt: '2026-03-20',
  lastAuthenticatedAt: '2026-03-21',
  lastSurface: 'vscode',
  pendingCancellation: '2026-04-30',
  source: 'api',
};

const logins = (parsed: LicenseParse): string[] => parsed.seats.map((seat) => seat.login);

describe('logins', () => {
  it('accepts GitHub logins: letters, digits, hyphens, underscores inside, and a [bot] suffix', () => {
    for (const ok of ['user001', 'a', 'A', '7', 'octo-cat', 'Octo-Cat-2', 'dependabot[bot]', 'a_b', 'user_ab12', 'x'.repeat(100)]) {
      expect(isLoginLike(ok), ok).toBe(true);
    }
  });

  it('rejects anything else: emails, file names, spaces, edge hyphens, a bare [bot]', () => {
    for (const bad of ['', ' ', '-user', 'user-', 'a b', 'user@example.com', 'foo.bar', '[bot]', 'user[bot', 'user_', '_user', 'user!', 'x'.repeat(101), 'üser']) {
      expect(isLoginLike(bad), JSON.stringify(bad)).toBe(false);
    }
  });

  it('reads a login from a cell: trimmed, without quotes or a leading @', () => {
    expect(readLogin('  user001 ')).toBe('user001');
    expect(readLogin('"user001"')).toBe('user001');
    expect(readLogin("'User001'")).toBe('User001');
    expect(readLogin('@user001')).toBe('user001');
    expect(readLogin(' "@user001" ')).toBe('user001');
    for (const bad of ['', '   ', 'user 001', 'user@example.com', null, undefined, 5, {}, []]) expect(readLogin(bad)).toBeNull();
  });

  it('matches without regard to case or surrounding spaces', () => {
    expect(loginKey(' User001 ')).toBe('user001');
    expect(loginKey('USER001')).toBe(loginKey('user001'));
  });
});

describe('readDay', () => {
  it('reads a date alone as written', () => {
    expect(readDay('2025-03-05')).toBe('2025-03-05');
    expect(readDay('2025/03/05')).toBe('2025-03-05');
    expect(readDay(' "2025-03-05" ')).toBe('2025-03-05');
    expect(readDay('2024-02-29')).toBe('2024-02-29');
  });

  it('reads a timestamp as its UTC day', () => {
    for (const timestamp of ['2025-03-05T10:30:00Z', '2025-03-05T10:30:00.123Z', '2025-03-05 10:30:00 UTC', '2025-03-05 10:30:00', '2025-03-05T10:30', '2025-03-05T00:00:00Z', '2025-03-05T23:59:59Z']) {
      expect(readDay(timestamp), timestamp).toBe('2025-03-05');
    }
  });

  it('converts a UTC offset to the UTC day', () => {
    expect(readDay('2025-03-05T23:30:00-06:00')).toBe('2025-03-06');
    expect(readDay('2025-03-05T00:30:00+01:00')).toBe('2025-03-04');
    expect(readDay('2025-03-05T12:00:00+05:30')).toBe('2025-03-05');
    expect(readDay('2025-03-05T02:00:00+0530')).toBe('2025-03-04');
    expect(readDay('2025-03-05T23:30:00-0600')).toBe('2025-03-06');
    expect(readDay('2025-12-31T23:30:00-01:00')).toBe('2026-01-01');
    expect(readDay('2025-03-01T00:30:00+01:00')).toBe('2025-02-28');
    expect(readDay('2024-03-01T00:30:00+01:00')).toBe('2024-02-29');
  });

  it('gives undefined for an empty value', () => {
    for (const empty of ['', '   ', 'null', 'None', 'never', 'N/A', '-', '--', null, undefined]) expect(readDay(empty), String(empty)).toBeUndefined();
  });

  it('gives null for a value that is there but cannot be read', () => {
    for (const bad of ['yesterday', '2025-02-30', '2025-13-01', '2025-00-10', '05/03/2025', '1999-12-31', '2101-01-01', 'garbage', 12345, {}, true]) {
      expect(readDay(bad), String(bad)).toBeNull();
    }
  });

  it('compares days as text', () => {
    expect(laterDay('2025-03-05', '2025-03-04')).toBe('2025-03-05');
    expect(laterDay(undefined, '2025-03-04')).toBe('2025-03-04');
    expect(laterDay('2025-03-05', undefined)).toBe('2025-03-05');
    expect(laterDay(undefined, undefined)).toBeUndefined();
    expect(earlierDay('2025-03-05', '2025-03-04')).toBe('2025-03-04');
    expect(earlierDay(undefined, '2025-03-04')).toBe('2025-03-04');
    expect(earlierDay('2025-03-05', undefined)).toBe('2025-03-05');
    expect(earlierDay(undefined, undefined)).toBeUndefined();
  });

  it('todayIso is the UTC day of the given time', () => {
    expect(todayIso(Date.UTC(2026, 2, 31, 23, 59, 59))).toBe('2026-03-31');
    expect(todayIso(Date.UTC(2026, 3, 1, 0, 0, 0))).toBe('2026-04-01');
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('readPlan', () => {
  it('maps plan names to the names the app uses, in any case and with more words around them', () => {
    for (const raw of ['business', 'Business', 'BUSINESS', 'copilot_business', 'GitHub Copilot Business', ' "business" ']) expect(readPlan(raw), raw).toBe('Business');
    for (const raw of ['enterprise', 'Enterprise', 'ENTERPRISE', 'GitHub Copilot Enterprise']) expect(readPlan(raw), raw).toBe('Enterprise');
  });

  it('leaves the plan unset for "unknown" and for an empty cell', () => {
    for (const raw of ['unknown', 'Unknown', '', '  ', 'none', 'N/A', '-']) expect(readPlan(raw), raw).toBeUndefined();
  });

  it('reads a number like the analysis does: 1,000 or more is credits, less is dollars', () => {
    expect(readPlan('1900')).toBe('Business');
    expect(readPlan('1,900')).toBe('Business');
    expect(readPlan('3900')).toBe('Enterprise');
    expect(readPlan('19')).toBe('Business');
    expect(readPlan('$19')).toBe('Business');
    expect(readPlan('39')).toBe('Enterprise');
    expect(readPlan('2500')).toBe('2500');
    expect(readPlan('25')).toBe('2500');
    expect(readPlan('$25')).toBe('2500');
    expect(readPlan('500 credits')).toBe('5');
  });

  it('reads the label the report gives a custom plan, "Custom (N credits)", as its credits', () => {
    expect(readPlan('Custom (2,500 credits)')).toBe('2500');
    expect(readPlan('custom (2500 credits)')).toBe('2500');
    expect(readPlan(' "Custom (2,500 credits)" ')).toBe('2500');
    expect(readPlan('Custom (500 credits)')).toBe('5');
    expect(readPlan('Custom (1,900 credits)')).toBe('Business');
    expect(readPlan('Custom (3,900 credits)')).toBe('Enterprise');
  });

  it('gives null for a value that is not a plan', () => {
    for (const raw of ['platinum', '0', '-5', 'free trial', '1e999']) expect(readPlan(raw), raw).toBeNull();
  });

  it('gives null for a custom plan label that has no credits it can read', () => {
    for (const raw of ['Custom (0 credits)', 'Custom (abc credits)', 'Custom (12,34 credits)', 'Custom (2,500)', 'Custom (2,500 credits', 'Custom (9,999,999,999 credits)']) expect(readPlan(raw), raw).toBeNull();
  });

  it('ranks Enterprise over Business over unset, and the first plan wins a tie', () => {
    expect(higherPlan('Business', 'Enterprise')).toBe('Enterprise');
    expect(higherPlan('Enterprise', 'Business')).toBe('Enterprise');
    expect(higherPlan(undefined, 'Business')).toBe('Business');
    expect(higherPlan('Business', undefined)).toBe('Business');
    expect(higherPlan(undefined, undefined)).toBeUndefined();
    expect(higherPlan('2500', 'Business')).toBe('2500');
    expect(planRank('Enterprise')).toBe(3900);
    expect(planRank('Business')).toBe(1900);
    expect(planRank(undefined)).toBe(0);
    expect(planRank('garbage')).toBe(0);
    expect(canonicalPlan(1900)).toBe('Business');
    expect(canonicalPlan(3900)).toBe('Enterprise');
  });

  it('keeps only the product of a surface: vscode/1.97.1/copilot-chat/0.24.1 is vscode', () => {
    expect(surfaceName('vscode/1.97.1/copilot-chat/0.24.1')).toBe('vscode');
    expect(surfaceName('JetBrains-IC/2024.3.4')).toBe('JetBrains-IC');
    expect(surfaceName('neovim')).toBe('neovim');
    expect(surfaceName('')).toBeUndefined();
    expect(surfaceName('/x')).toBeUndefined();
    expect(surfaceName(undefined)).toBeUndefined();
    expect(surfaceName('a'.repeat(100))).toHaveLength(40);
  });
});

describe('parseLicenseFile: REST seats JSON', () => {
  it('reads the object GitHub returns', () => {
    const parsed = parseLicenseFile(JSON.stringify(page([REST_SEAT_A, REST_SEAT_B, REST_SEAT_C])), 'seats.json');
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toEqual([SEAT_A, SEAT_B, SEAT_C]);
    expect(parsed.total).toBe(3);
    expect(parsed.records).toBe(3);
    expect(parsed.skipped).toBe(0);
    expect(parsed.problems).toEqual([]);
    expect(parsed.exportedAt).toBe('2026-03-21');
  });

  it('reads it without a file name, pretty printed, and with a BOM', () => {
    const text = JSON.stringify(page([REST_SEAT_A, REST_SEAT_B, REST_SEAT_C]), null, 2);
    for (const input of [text, `\uFEFF${text}`, `  \n${text}\n\n`]) {
      const parsed = parseLicenseFile(input);
      expect(parsed.kind).toBe('seats-json');
      expect(parsed.seats).toEqual([SEAT_A, SEAT_B, SEAT_C]);
    }
  });

  it('reads a bare array of seats', () => {
    const parsed = parseLicenseFile(JSON.stringify([REST_SEAT_A, REST_SEAT_B, REST_SEAT_C]));
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toEqual([SEAT_A, SEAT_B, SEAT_C]);
    expect(parsed.total).toBeUndefined();
    expect(parsed.problems).toEqual([]);
  });

  it('reads an array of pages (gh api --paginate --slurp)', () => {
    for (const space of [undefined, 2]) {
      const parsed = parseLicenseFile(JSON.stringify([page([REST_SEAT_A, REST_SEAT_B], 3), page([REST_SEAT_C], 3)], null, space), 'seats.json');
      expect(parsed.kind).toBe('seats-json');
      expect(parsed.seats).toEqual([SEAT_A, SEAT_B, SEAT_C]);
      expect(parsed.total).toBe(3);
      expect(parsed.problems).toEqual([]);
    }
  });

  it('reads pages written back to back (gh api --paginate), with or without a line break between them', () => {
    const first = JSON.stringify(page([REST_SEAT_A, REST_SEAT_B], 3));
    const second = JSON.stringify(page([REST_SEAT_C], 3));
    for (const joined of [`${first}\n${second}\n`, `${first}${second}`, `${first}\r\n\r\n${second}`, ` ${first} ${second} `]) {
      const parsed = parseLicenseFile(joined, 'seats.json');
      expect(parsed.kind).toBe('seats-json');
      expect(parsed.seats).toEqual([SEAT_A, SEAT_B, SEAT_C]);
      expect(parsed.total).toBe(3);
      expect(parsed.problems).toEqual([]);
    }
  });

  it('does not lose pages when strings hold brackets, braces, quotes and backslashes', () => {
    const odd = 'Odd {Name} ] [ "quoted" \\ end } {';
    const second = restSeat({ login: 'user004', name: odd, team: 'a]b[c' });
    const parsed = parseLicenseFile(JSON.stringify(page([REST_SEAT_A], 2)) + JSON.stringify(page([second], 2)));
    expect(parsed.kind).toBe('seats-json');
    expect(logins(parsed)).toEqual(['user001', 'user004']);
    expect(parsed.seats[1].name).toBe(odd);
    expect(parsed.seats[1].teams).toEqual(['a]b[c']);
    expect(parsed.problems).toEqual([]);
  });

  it('reads one seat per line (NDJSON)', () => {
    const parsed = parseLicenseFile([REST_SEAT_A, REST_SEAT_B, REST_SEAT_C].map((record) => JSON.stringify(record)).join('\n'), 'seats.ndjson');
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toEqual([SEAT_A, SEAT_B, SEAT_C]);
    expect(parsed.total).toBeUndefined();
    expect(parsed.problems).toEqual([]);
  });

  it('reads a seat object on its own', () => {
    const parsed = parseLicenseFile(JSON.stringify(REST_SEAT_A));
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toEqual([SEAT_A]);
  });

  it('keeps the seats before a page that was cut short and says so', () => {
    const first = JSON.stringify(page([REST_SEAT_A, REST_SEAT_B], 3));
    const second = JSON.stringify(page([REST_SEAT_C], 3));
    const parsed = parseLicenseFile((first + second).slice(0, first.length + 70), 'seats.json');
    expect(parsed.kind).toBe('seats-json');
    expect(logins(parsed)).toEqual(['user001', 'user002']);
    expect(parsed.problems).toContain('The file ends in the middle of an entry. It may have been cut short.');
    expect(parsed.problems.some((problem) => problem.startsWith('The file has 2 of 3 seats.'))).toBe(true);
  });

  it('says when the file holds only some of the seats', () => {
    const parsed = parseLicenseFile(JSON.stringify(page([REST_SEAT_A, REST_SEAT_B, REST_SEAT_C], 4)));
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toHaveLength(3);
    expect(parsed.total).toBe(4);
    expect(parsed.problems).toEqual(['The file has 3 of 4 seats. Some pages may be missing. Save every page, for example with gh api --paginate.']);
  });

  it('takes the largest total_seats when pages are joined', () => {
    const parsed = parseLicenseFile(JSON.stringify([page([REST_SEAT_A], 2), page([REST_SEAT_B], 5)]));
    expect(parsed.total).toBe(5);
    expect(parsed.problems.some((problem) => problem.startsWith('The file has 2 of 5 seats.'))).toBe(true);
  });

  it('reads an empty answer as a seat list with no seats', () => {
    const parsed = parseLicenseFile('{"total_seats":0,"seats":[]}');
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toEqual([]);
    expect(parsed.total).toBe(0);
    expect(parsed.problems).toEqual(['The file has no seats.']);
  });

  it('merges a user who appears once per organization or team', () => {
    const rows = [
      restSeat({ login: 'user010', org: 'acme-eu', plan: 'business', created: '2025-03-01T00:00:00Z', activity: '2026-02-01T00:00:00Z', authenticated: '2026-02-02T00:00:00Z', editor: 'neovim/0.10' }),
      restSeat({ login: 'USER010', org: 'acme-us', team: 'platform', plan: 'enterprise', created: '2025-01-10T00:00:00Z', activity: '2026-03-01T00:00:00Z', authenticated: '2026-01-02T00:00:00Z', editor: 'vscode/1.97.1', pending: '2026-05-01' }),
      restSeat({ login: 'user010', org: 'acme-eu', team: 'platform', plan: 'business', created: '2025-06-01T00:00:00Z', activity: '2026-01-15T00:00:00Z', authenticated: '2026-01-16T00:00:00Z' }),
      restSeat({ login: 'user011', org: 'acme-eu' }),
    ];
    const parsed = parseLicenseFile(JSON.stringify(page(rows)));
    expect(parsed.records).toBe(4);
    expect(parsed.seats).toHaveLength(2);
    expect(parsed.seats[0]).toEqual({
      login: 'user010',
      plan: 'Enterprise',
      orgs: ['acme-eu', 'acme-us'],
      teams: ['platform'],
      createdAt: '2025-01-10',
      lastActivityAt: '2026-03-01',
      lastAuthenticatedAt: '2026-02-02',
      lastSurface: 'vscode',
      pendingCancellation: '2026-05-01',
      source: 'api',
    });
  });

  it('turns a timestamp with a UTC offset into the UTC day', () => {
    const parsed = parseLicenseFile(JSON.stringify(page([restSeat({ login: 'user020', activity: '2026-03-20T23:30:00-06:00', authenticated: '2026-03-21T00:30:00+01:00', created: '2025-01-01T00:30:00+01:00' })])));
    expect(parsed.seats[0].lastActivityAt).toBe('2026-03-21');
    expect(parsed.seats[0].lastAuthenticatedAt).toBe('2026-03-20');
    expect(parsed.seats[0].createdAt).toBe('2024-12-31');
  });

  it('counts values it cannot read and keeps the seat', () => {
    const parsed = parseLicenseFile(JSON.stringify(page([restSeat({ login: 'user030', activity: 'yesterday', plan: 'platinum', created: '2025-02-30T00:00:00Z' })])));
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toHaveLength(1);
    expect(parsed.seats[0].lastActivityAt).toBeUndefined();
    expect(parsed.seats[0].plan).toBeUndefined();
    expect(parsed.seats[0].createdAt).toBeUndefined();
    expect(parsed.problems).toEqual(['2 dates could not be read. They were treated as missing.', '1 plan could not be read. It was left empty.']);
  });

  it('skips records without a usable login and counts them', () => {
    const parsed = parseLicenseFile(JSON.stringify(page([REST_SEAT_A, { assignee: { login: 'foo.bar' } }, 7, null, { assignee: {} }, REST_SEAT_B], 6)));
    expect(logins(parsed)).toEqual(['user001', 'user002']);
    expect(parsed.skipped).toBe(4);
    expect(parsed.problems).toEqual(['4 entries without a username were left out.']);
  });

  it('drops a piece of the file that is not JSON and says so', () => {
    const parsed = parseLicenseFile(`${JSON.stringify(page([REST_SEAT_A], 1))}\n{"seats": [oops]}\n${JSON.stringify(page([REST_SEAT_B], 1))}`);
    expect(parsed.kind).toBe('seats-json');
    expect(logins(parsed)).toEqual(['user001', 'user002']);
    expect(parsed.problems).toEqual(['1 piece of the file could not be read as JSON. It was left out.']);
  });

  it('explains a GitHub error answer', () => {
    const parsed = parseLicenseFile('{"message":"Not Found","documentation_url":"https://docs.github.com/rest","status":"404"}');
    expect(parsed.kind).toBe('unknown');
    expect(parsed.seats).toEqual([]);
    expect(parsed.problems).toHaveLength(1);
    expect(parsed.problems[0]).toContain('Not Found');
    expect(parsed.problems[0]).toContain('manage_billing:copilot');
  });

  it('does not take JSON that is not a seat list for one', () => {
    for (const text of ['{"foo":1}', '{"seats":"none"}', '[1,2,3]', '[{"a":1},{"b":2}]', '{"items":[{"login":"x"}]}']) {
      const parsed = parseLicenseFile(text);
      expect(parsed.kind, text).toBe('unknown');
      expect(parsed.seats, text).toEqual([]);
      expect(parsed.problems.length, text).toBeGreaterThan(0);
    }
  });

  it('reads a JSON list of logins', () => {
    const parsed = parseLicenseFile('["user001", "@User002", "user003", 5, "not a login!"]');
    expect(parsed.kind).toBe('seats-json');
    expect(logins(parsed)).toEqual(['user001', 'User002', 'user003']);
    expect(parsed.seats.every((seat) => seat.source === 'list')).toBe(true);
    expect(parsed.skipped).toBe(2);
  });

  it('reads the keys of a CSV export saved as JSON (flat records)', () => {
    const parsed = parseLicenseFile('[{"login":"user001","plan":"enterprise","org":"acme","last_activity_at":"2026-03-01"},{"login":"user002","plan":"business"}]');
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats[0]).toMatchObject({ login: 'user001', plan: 'Enterprise', orgs: ['acme'], lastActivityAt: '2026-03-01', source: 'api' });
    expect(parsed.seats[1]).toMatchObject({ login: 'user002', plan: 'Business', source: 'api' });
  });

  it('stops at the size limit and says so', () => {
    const records = Array.from({ length: MAX_SEATS + 5 }, (_, index) => `{"login":"u${index}"}`).join(',');
    const parsed = parseLicenseFile(`[${records}]`);
    expect(parsed.kind).toBe('seats-json');
    expect(parsed.seats).toHaveLength(MAX_SEATS);
    expect(parsed.problems.some((problem) => problem.includes('more than 250,000 seats'))).toBe(true);
  });
});

describe('parseLicenseFile: CSV', () => {
  const ACTIVITY = [
    '"Report_Time","Login","Last Authenticated At","Last Activity At","Last Surface Used"',
    '"2026-03-31 06:00:00 UTC","user001","2026-03-30T08:00:00Z","2026-03-29T10:15:00Z","vscode/1.97.1/copilot-chat/0.24.1"',
    '"2026-03-31 06:00:00 UTC","user002","","",""',
    '"2026-03-31 06:00:00 UTC","User003","2026-01-05T08:00:00Z","2026-01-04T10:15:00Z","JetBrains-IC/2024.3.4"',
  ].join('\n');

  it('reads the Activity report of the Copilot access page', () => {
    for (const text of [ACTIVITY, `\uFEFF${ACTIVITY}`, `${ACTIVITY}\n`, ACTIVITY.replace(/\n/g, '\r\n')]) {
      const parsed = parseLicenseFile(text, 'copilot_activity_report.csv');
      expect(parsed.kind).toBe('activity-csv');
      expect(parsed.seats).toEqual([
        { login: 'user001', orgs: [], teams: [], lastAuthenticatedAt: '2026-03-30', lastActivityAt: '2026-03-29', lastSurface: 'vscode', source: 'activity' },
        { login: 'user002', orgs: [], teams: [], source: 'activity' },
        { login: 'User003', orgs: [], teams: [], lastAuthenticatedAt: '2026-01-05', lastActivityAt: '2026-01-04', lastSurface: 'JetBrains-IC', source: 'activity' },
      ]);
      expect(parsed.exportedAt).toBe('2026-03-31');
      expect(parsed.skipped).toBe(0);
      expect(parsed.problems).toEqual([]);
    }
  });

  it('matches header names without regard to case, spaces, quotes, a BOM or the delimiter', () => {
    const rows = ['2026-03-31,user001,2026-03-30,2026-03-29,vscode', '2026-03-31,user002,,,'];
    const headers = [
      'report_time,login,last_authenticated_at,last_activity_at,last_surface_used',
      'Report Time,Login,Last Authenticated At,Last Activity At,Last Surface Used',
      'REPORT_TIME,LOGIN,LAST_AUTHENTICATED_AT,LAST_ACTIVITY_AT,LAST_SURFACE_USED',
      ' "report_time" , "login" , "last_authenticated_at" , "last_activity_at" , "last_surface_used" ',
    ];
    for (const header of headers) {
      for (const delimiter of [',', ';', '\t']) {
        const text = [header, ...rows].map((line) => line.replace(/,/g, delimiter)).join('\n');
        const parsed = parseLicenseFile(`\uFEFF${text}`);
        expect(parsed.kind, `${header} ${JSON.stringify(delimiter)}`).toBe('activity-csv');
        expect(logins(parsed)).toEqual(['user001', 'user002']);
        expect(parsed.seats[0].lastActivityAt).toBe('2026-03-29');
        expect(parsed.exportedAt).toBe('2026-03-31');
      }
    }
  });

  it('takes the latest report time as the export date', () => {
    const text = 'report_time,login,last_activity_at\n2026-03-30 06:00:00 UTC,user001,2026-03-01\n2026-04-02 06:00:00 UTC,user002,2026-03-02\n';
    expect(parseLicenseFile(text).exportedAt).toBe('2026-04-02');
  });

  it('uses the latest date in the file when there is no report time', () => {
    const text = 'login,last_activity_at,last_authenticated_at\nuser001,2026-03-01,2026-03-05\nuser002,2026-03-09,\n';
    const parsed = parseLicenseFile(text);
    expect(parsed.kind).toBe('seats-csv');
    expect(parsed.exportedAt).toBe('2026-03-09');
    expect(parsed.seats.every((seat) => seat.source === 'activity')).toBe(true);
  });

  it('reads a CSV with a login column and plan, organization and email columns', () => {
    const text = ['login,plan,org,email', 'user001,business,acme,user001@example.com', 'user002,Enterprise,acme,', 'USER003,,beta,', 'user004,platinum,,'].join('\n');
    const parsed = parseLicenseFile(text, 'seats.csv');
    expect(parsed.kind).toBe('seats-csv');
    expect(parsed.seats).toEqual([
      { login: 'user001', plan: 'Business', orgs: ['acme'], teams: [], email: 'user001@example.com', source: 'list' },
      { login: 'user002', plan: 'Enterprise', orgs: ['acme'], teams: [], source: 'list' },
      { login: 'USER003', orgs: ['beta'], teams: [], source: 'list' },
      { login: 'user004', orgs: [], teams: [], source: 'list' },
    ]);
    expect(parsed.exportedAt).toBeUndefined();
    expect(parsed.problems).toEqual(['1 plan could not be read. It was left empty.']);
  });

  it('keeps the plan label the report gives a custom plan, without a problem', () => {
    const text = ['login,plan', 'user001,"Custom (2,500 credits)"', 'user002,Custom (500 credits)', 'user003,Business'].join('\n');
    const parsed = parseLicenseFile(text, 'seats.csv');
    expect(parsed.kind).toBe('seats-csv');
    expect(parsed.seats.map((seat) => seat.plan)).toEqual(['2500', '5', 'Business']);
    expect(parsed.problems).toEqual([]);
  });

  it('accepts login, username and user as the login column, and plan_type or plan for the plan', () => {
    for (const [login, plan] of [['login', 'plan'], ['username', 'plan_type'], ['user', 'plan'], ['Username', 'Plan Type'], ['GitHub Login', 'Seat Type']]) {
      const parsed = parseLicenseFile(`${login};${plan}\nuser001;enterprise\nuser002;business\n`);
      expect(parsed.kind, login).toBe('seats-csv');
      expect(parsed.seats.map((seat) => seat.plan)).toEqual(['Enterprise', 'Business']);
    }
  });

  it('reads a one-column file with a login header', () => {
    const parsed = parseLicenseFile('login\nuser001\nuser002\n');
    expect(parsed.kind).toBe('seats-csv');
    expect(logins(parsed)).toEqual(['user001', 'user002']);
  });

  it('skips blank rows and repeated headers without counting them, and counts rows without a login', () => {
    const text = ['login,plan', 'user001,business', ',', '', 'login,plan', 'user002,enterprise', 'not a login!,business', 'user@example.com,business'].join('\n');
    const parsed = parseLicenseFile(text);
    expect(parsed.kind).toBe('seats-csv');
    expect(logins(parsed)).toEqual(['user001', 'user002']);
    expect(parsed.skipped).toBe(2);
    expect(parsed.problems).toEqual(['2 entries without a username were left out.']);
  });

  it('merges a user who has several rows', () => {
    const text = ['login,org,team,plan', 'user001,acme-eu,a,business', 'USER001,acme-us,b,enterprise'].join('\n');
    const parsed = parseLicenseFile(text);
    expect(parsed.records).toBe(2);
    expect(parsed.seats).toEqual([{ login: 'user001', plan: 'Enterprise', orgs: ['acme-eu', 'acme-us'], teams: ['a', 'b'], source: 'list' }]);
  });

  it('refuses a usage report and says so', () => {
    const parsed = parseLicenseFile(makeCsv([{ date: '2026-03-01', user: 'user001', gross: 1 }]), 'AIUsageReport.csv');
    expect(parsed.kind).toBe('unknown');
    expect(parsed.seats).toEqual([]);
    expect(parsed.problems).toEqual(['This file is a usage report, not a license list. Load it with the other usage reports.']);
  });

  it('asks for a login column when a table has none', () => {
    const parsed = parseLicenseFile('name,plan\nAda,business\nBo,enterprise\n');
    expect(parsed.kind).toBe('unknown');
    expect(parsed.problems).toEqual(['The table has no username column. Name the column with the GitHub usernames "login" or "username".']);
  });
});

describe('parseLicenseFile: plain login lists', () => {
  it('reads one login per line, with any line ending, blank lines and spaces', () => {
    for (const text of ['user001\nuser002\nUSER003\n', 'user001\r\nuser002\r\nUSER003', 'user001\ruser002\rUSER003', '\n\nuser001\n\nuser002\n  USER003  \n\n', '\uFEFFuser001\nuser002\nUSER003']) {
      const parsed = parseLicenseFile(text, 'logins.txt');
      expect(parsed.kind, JSON.stringify(text)).toBe('login-list');
      expect(logins(parsed)).toEqual(['user001', 'user002', 'USER003']);
      expect(parsed.seats.every((seat) => seat.source === 'list' && seat.orgs.length === 0)).toBe(true);
      expect(parsed.skipped).toBe(0);
      expect(parsed.problems).toEqual([]);
      expect(parsed.exportedAt).toBeUndefined();
    }
  });

  it('reads logins separated by commas, semicolons or spaces, with @ and quotes', () => {
    for (const text of ['user001, user002;USER003 user004', 'user001,user002,USER003,user004', '@user001 "user002" \'USER003\' @user004', 'user001;user002;USER003;user004']) {
      const parsed = parseLicenseFile(text);
      expect(parsed.kind, text).toBe('login-list');
      expect(logins(parsed).map((login) => login.toLowerCase())).toEqual(['user001', 'user002', 'user003', 'user004']);
    }
  });

  it('ignores comment lines', () => {
    const parsed = parseLicenseFile('# exported from the admin page\nuser001\n// not this one: x y z\nuser002\n');
    expect(logins(parsed)).toEqual(['user001', 'user002']);
    expect(parsed.skipped).toBe(0);
  });

  it('counts junk and says how many entries were left out', () => {
    const parsed = parseLicenseFile('user001\nuser002\nuser003\nuser004\nuser005\nuser@example.com\nfoo.bar\n-bad\n');
    expect(parsed.kind).toBe('login-list');
    expect(parsed.seats).toHaveLength(5);
    expect(parsed.skipped).toBe(3);
    expect(parsed.problems).toEqual(['3 entries that are not GitHub usernames were left out.']);
    const one = parseLicenseFile('user001\nuser002\nfoo.bar\n');
    expect(one.problems).toEqual(['1 entry that is not a GitHub username was left out.']);
  });

  it('keeps one seat for logins that differ only in case, and the first spelling', () => {
    const parsed = parseLicenseFile('User001\nuser001\nUSER001\nuser002\n');
    expect(logins(parsed)).toEqual(['User001', 'user002']);
    expect(parsed.records).toBe(4);
  });

  it('does not take a file that is mostly junk for a list', () => {
    const parsed = parseLicenseFile('user001\nfoo.bar\nuser@example.com\n-bad\n');
    expect(parsed.kind).toBe('unknown');
    expect(parsed.seats).toEqual([]);
    expect(parsed.problems).toEqual(['Most entries in the file are not GitHub usernames, so it was not read as a list of usernames.']);
  });

  it('says when no login is found', () => {
    const parsed = parseLicenseFile('foo.bar\nuser@example.com\n-bad\n');
    expect(parsed.kind).toBe('unknown');
    expect(parsed.problems).toEqual(['No GitHub usernames were found. A list of usernames has one username per line, or usernames separated by commas.']);
  });

  it('stops at the size limit and says so', () => {
    const text = Array.from({ length: MAX_SEATS + 5 }, (_, index) => `u${index}`).join('\n');
    const parsed = parseLicenseFile(text, 'logins.txt');
    expect(parsed.kind).toBe('login-list');
    expect(parsed.seats).toHaveLength(MAX_SEATS);
    expect(parsed.problems).toEqual(['The list has more than 250,000 usernames. Only the first 250,000 were read.']);
  });
});

describe('parseLicenseFile: empty and bad input', () => {
  it('says an empty file is empty', () => {
    for (const text of ['', ' ', '\n\n', '\uFEFF', '\t \r\n']) {
      const parsed = parseLicenseFile(text);
      expect(parsed.kind).toBe('unknown');
      expect(parsed.problems).toEqual(['The file is empty.']);
    }
  });

  const NASTY: string[] = [
    '{', '}', '[', ']', '"', '"unterminated', 'null', 'true', '123', ',,,,', ';;;;', '\t\t\t',
    '[[[[[[[[[[1]]]]]]]]]]', '{"seats":', '{"seats":[', '{"seats":[{"assignee":', '{"seats":[null,1,"x",[],{}]}',
    '{"a":{"b":{"c":{}}}}', '{"seats":[{"assignee":{"login":"user001"}}]} trailing words', 'a,b\n1', 'login\n', 'login,plan\n,,\n,,',
    '\u0000\u0001\u0002', '😀😀😀', 'x'.repeat(10_000), '{"seats":' + '['.repeat(10_000), '{'.repeat(5_000), '"'.repeat(5_001), 'login,'.repeat(5_000),
    '['.repeat(100_000) + ']'.repeat(100_000), '{"a":'.repeat(50_000) + '1' + '}'.repeat(50_000),
    Array.from({ length: 3000 }, (_, index) => String.fromCharCode(index % 256)).join(''),
    '{"seats":[{"assignee":{"login":"user001"},"last_activity_at":{"x":1},"plan_type":[1],"created_at":5}]}',
    '{"seats":[{"assignee":"user001"}]}', '{"assignee":{"login":null}}', '{"total_seats":"many","seats":[]}', '{"total_seats":-5,"seats":[]}',
  ];

  it('never throws, whatever the text and the file name', () => {
    for (const text of NASTY) {
      for (const name of [undefined, '', 'a.json', 'a.csv', 'a.txt', 'a.ndjson', 'A.JSON']) {
        let parsed: LicenseParse | undefined;
        expect(() => {
          parsed = parseLicenseFile(text, name);
        }, `${text.slice(0, 30)} ${name}`).not.toThrow();
        expect(['seats-json', 'activity-csv', 'seats-csv', 'login-list', 'unknown']).toContain(parsed?.kind);
        expect(Array.isArray(parsed?.seats)).toBe(true);
        expect(Array.isArray(parsed?.problems)).toBe(true);
        if (parsed?.kind === 'unknown') {
          expect(parsed.seats).toEqual([]);
          expect(parsed.problems.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('never throws on values that are not text', () => {
    for (const value of [null, undefined, 42, {}, [], true, Symbol.iterator] as unknown[]) {
      const parsed = parseLicenseFile(value as string);
      expect(parsed.kind).toBe('unknown');
      expect(parsed.seats).toEqual([]);
    }
  });

  it('gives every problem as a plain sentence', () => {
    for (const text of NASTY) {
      for (const problem of parseLicenseFile(text).problems) {
        expect(problem).toMatch(/^[A-Z0-9].*[.]$/);
        expect(problem).not.toMatch(/NaN|undefined|Infinity|\[object/);
      }
    }
  });
});

describe('mergeSeats', () => {
  const seat = (login: string, over: Partial<LicenseSeat> = {}): LicenseSeat => ({ login, orgs: [], teams: [], source: 'api', ...over });

  it('merges one user across organizations and teams', () => {
    const input = [
      seat('user001', { orgs: ['acme-eu'], plan: 'Business', createdAt: '2025-03-01', lastActivityAt: '2026-02-01', lastAuthenticatedAt: '2026-02-02', lastSurface: 'neovim', name: 'Ada' }),
      seat('USER001', {
        orgs: ['acme-us', 'ACME-EU'],
        teams: ['platform'],
        plan: 'Enterprise',
        createdAt: '2025-01-10',
        lastActivityAt: '2026-03-01',
        lastAuthenticatedAt: '2026-01-02',
        lastSurface: 'vscode',
        pendingCancellation: '2026-05-01',
        email: 'user001@example.com',
      }),
      seat(' user001 ', { teams: ['Platform', 'docs'], pendingCancellation: '2026-04-01', plan: 'Business' }),
    ];
    expect(mergeSeats(input)).toEqual([
      {
        login: 'user001',
        name: 'Ada',
        email: 'user001@example.com',
        plan: 'Enterprise',
        orgs: ['acme-eu', 'acme-us'],
        teams: ['platform', 'docs'],
        createdAt: '2025-01-10',
        lastActivityAt: '2026-03-01',
        lastAuthenticatedAt: '2026-02-02',
        lastSurface: 'vscode',
        pendingCancellation: '2026-04-01',
        source: 'api',
      },
    ]);
  });

  it('keeps the first spelling and the order in which logins first appear', () => {
    expect(logins({ seats: mergeSeats(['Zed', 'amy', 'ZED', 'AMY', 'bob', ' Amy '].map((login) => seat(login))) } as LicenseParse)).toEqual(['Zed', 'amy', 'bob']);
  });

  it('does not change what it is given', () => {
    const input = [seat('a', { orgs: ['x'], plan: 'Business' }), seat('A', { orgs: ['y'], plan: 'Enterprise', teams: ['t'] })];
    const before = JSON.stringify(input);
    const out = mergeSeats(input);
    expect(JSON.stringify(input)).toBe(before);
    out[0].orgs.push('z');
    expect(input[0].orgs).toEqual(['x']);
  });

  it('never lowers a known plan, and a custom plan ranks by its credits', () => {
    expect(mergeSeats([seat('a', { plan: 'Enterprise' }), seat('a')])[0].plan).toBe('Enterprise');
    expect(mergeSeats([seat('a'), seat('a', { plan: 'Business' })])[0].plan).toBe('Business');
    expect(mergeSeats([seat('a', { plan: 'Business' }), seat('a', { plan: '2500' })])[0].plan).toBe('2500');
    expect(mergeSeats([seat('a'), seat('a')])[0].plan).toBeUndefined();
  });

  it('takes the earliest creation date, the latest dates, and any pending cancellation', () => {
    const merged = mergeSeats([
      seat('a', { createdAt: '2025-05-01', lastActivityAt: '2026-01-01', lastAuthenticatedAt: '2026-01-05' }),
      seat('a', { createdAt: '2025-02-01', lastActivityAt: '2026-02-01' }),
      seat('a', { lastAuthenticatedAt: '2026-01-10', pendingCancellation: '2026-06-30' }),
    ])[0];
    expect(merged).toMatchObject({ createdAt: '2025-02-01', lastActivityAt: '2026-02-01', lastAuthenticatedAt: '2026-01-10', pendingCancellation: '2026-06-30' });
  });

  it('keeps the surface of the latest activity, and fills a missing one', () => {
    expect(mergeSeats([seat('a', { lastActivityAt: '2026-03-01', lastSurface: 'vscode' }), seat('a', { lastActivityAt: '2026-01-01', lastSurface: 'neovim' })])[0].lastSurface).toBe('vscode');
    expect(mergeSeats([seat('a', { lastActivityAt: '2026-01-01', lastSurface: 'neovim' }), seat('a', { lastActivityAt: '2026-03-01', lastSurface: 'vscode' })])[0].lastSurface).toBe('vscode');
    expect(mergeSeats([seat('a'), seat('a', { lastSurface: 'vscode' })])[0].lastSurface).toBe('vscode');
  });

  it('keeps the best source: api over activity over list', () => {
    expect(mergeSeats([seat('a', { source: 'list' }), seat('a', { source: 'activity' })])[0].source).toBe('activity');
    expect(mergeSeats([seat('a', { source: 'list' }), seat('a', { source: 'api' }), seat('a', { source: 'activity' })])[0].source).toBe('api');
  });

  it('handles an empty list and skips records without a login', () => {
    expect(mergeSeats([])).toEqual([]);
    expect(mergeSeats([seat(''), seat('  '), seat('a')]).map((mergedSeat) => mergedSeat.login)).toEqual(['a']);
  });
});
