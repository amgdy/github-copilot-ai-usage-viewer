import { beforeAll, describe, expect, it } from 'vitest';
import { mergeSettings, type RosterEntry } from '../src/lib/analytics/settings';
import type { LicenseReport } from '../src/lib/licenses';
import {
  LIST_ORDER,
  STATUS_ORDER,
  asOfInfo,
  csvOf,
  findingFields,
  findingsOf,
  firstList,
  fmtIsoDay,
  isTooBig,
  kpiTiles,
  listCount,
  listExportName,
  placeRows,
  planRows,
  planText,
  profileIds,
  scopeOf,
  statusRows,
  unmatchedFields,
} from '../src/pages/licenses/model';
import { BAD_TEXT, addDays, analyzeDemo, isoOf, type Pipeline } from './helpers';

const must = <T>(v: T | null | undefined): T => {
  if (v === null || v === undefined) throw new Error('missing value');
  return v;
};

let pl: Pipeline;
let report: LicenseReport;
let asOf: string;
/** Report users who got no seat, so they show up as usage without a seat. */
let left: string[];

beforeAll(async () => {
  pl = await analyzeDemo();
  asOf = isoOf(pl.store.maxDay);
  const names = pl.analysis.population.profiles.map((p) => p.name);
  left = names.slice(-3);
  const ago = (n: number) => addDays(asOf, -n);
  const seat = (user: string, over: Partial<RosterEntry> = {}): RosterEntry => ({ user, plan: 'Business', source: 'api', createdAt: ago(400), lastAuthenticatedAt: ago(5), ...over });
  const roster: RosterEntry[] = [
    // Report users with a seat: recent, fading and one Enterprise seat. Their usage keeps them off the list of seats to free.
    ...names.slice(0, -3).map((n, i) => seat(n, { lastActivityAt: ago(i % 3 === 0 ? 40 : 3), plan: i === 0 ? 'Enterprise' : 'Business' })),
    // Seats that are in no loaded file.
    seat('ghost-stale-ent', { plan: 'Enterprise', lastActivityAt: ago(200) }),
    seat('ghost-stale', { lastActivityAt: ago(120) }),
    seat('ghost-never-signed-in', { lastAuthenticatedAt: undefined }),
    seat('ghost-never-active'),
    seat('ghost-fading', { lastActivityAt: ago(45) }),
    seat('ghost-quiet', { lastActivityAt: ago(2) }),
    seat('ghost-pending', { lastActivityAt: ago(150), pendingCancellation: addDays(asOf, 10) }),
    seat('ghost-new', { createdAt: ago(3) }),
    seat('ghost-custom', { plan: '5000', lastActivityAt: ago(300) }),
  ];
  const a = pl.run(pl.filters, mergeSettings({ roster, rosterAsOf: asOf, newUserDays: 14 }));
  report = must(a.licenses);
});

describe('licenses page: KPI tiles and breakdowns', () => {
  it('shows the KPI tiles in impact order, each with an explanation and clean text', () => {
    const tiles = kpiTiles(report);
    expect(tiles.map((k) => k.id)).toEqual(['reclaim-value', 'reclaim-count', 'unmatched', 'coverage', 'seats', 'seat-cost']);
    for (const k of tiles) {
      expect(k.calc.length).toBeGreaterThan(0);
      expect(`${k.label} ${k.value} ${k.sub}`).not.toMatch(BAD_TEXT);
    }
    expect(tiles[0].list).toBe('reclaim');
    expect(tiles[2].list).toBe('unmatched');
    expect(tiles[2].value).toBe(String(left.length));
  });

  it('asks for activity data when the list has none', () => {
    const plain = { ...report, hasActivity: false, reclaimValue: 0 };
    expect(kpiTiles(plain)[0].sub).toBe('Needs activity data in the list');
    expect(kpiTiles(plain)[4].calc).toBe('license-seats');
  });

  it('lists the statuses from positive to negative, and they add up to all seats', () => {
    const rows = statusRows(report);
    const order = rows.map((r) => STATUS_ORDER.indexOf(r.status));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(rows.every((r) => r.count > 0)).toBe(true);
    expect(rows.reduce((s, r) => s + r.count, 0)).toBe(report.seats);
    expect(rows[0].status).toBe('recent');
  });

  it('splits the seats by plan and by place in the report, each adding up to all seats', () => {
    const plans = planRows(report);
    expect(plans.map((r) => r.id)).toEqual(['business', 'enterprise', 'other']);
    expect(plans.reduce((s, r) => s + r.count, 0)).toBe(report.seats);
    const places = placeRows(report);
    expect(places.map((r) => r.id)).toEqual(['matched', 'outside', 'never-seen']);
    expect(places.reduce((s, r) => s + r.count, 0)).toBe(report.seats);
    expect(places[2].count).toBe(9);
    expect(places[2].calc).toBe('license-never-seen');
  });
});

describe('licenses page: lists', () => {
  it('opens the first list with rows, and the seats to free when every list is empty', () => {
    expect(firstList(report)).toBe(LIST_ORDER.find((id) => listCount(report, id) > 0));
    const empty = { ...report, reclaim: [], unmatched: [], fading: [], noActivityDate: [], quiet: [], pending: [], newSeats: [] };
    expect(firstList(empty)).toBe('reclaim');
    expect(firstList({ ...empty, fading: report.fading })).toBe('fading');
  });

  it('keeps the library order and separates seats without an activity date', () => {
    const reclaim = findingsOf(report, 'reclaim');
    expect(reclaim.map((f) => f.login)).toEqual(report.reclaim.map((f) => f.login));
    expect(reclaim[0].login).toBe('ghost-custom');
    expect(reclaim.map((f) => f.login)).not.toContain('ghost-pending');
    expect(reclaim.map((f) => f.login)).not.toContain('ghost-new');
    const noDate = findingsOf(report, 'no-date');
    expect(noDate.map((f) => f.login)).toEqual(['ghost-never-active', 'ghost-never-signed-in', 'ghost-new']);
    expect(listCount(report, 'pending')).toBe(1);
    expect(listCount(report, 'new')).toBeGreaterThanOrEqual(1);
    expect(listCount(report, 'unmatched')).toBe(left.length);
  });

  it('names each CSV file after its list', () => {
    const names = LIST_ORDER.map(listExportName);
    expect(new Set(names).size).toBe(LIST_ORDER.length);
    for (const n of names) expect(n).toMatch(/^github-copilot-licenses-[a-z-]+$/);
    expect(listExportName('reclaim')).toBe('github-copilot-licenses-seats-to-free');
  });

  it('writes the visible columns of the seats to free to the CSV, in the order of the list', () => {
    const fields = findingFields('reclaim');
    expect(fields.map((f) => f.key)).toEqual(['user', 'name', 'reason', 'plan', 'org', 'team', 'days', 'lastActivity', 'surface', 'created', 'usage', 'price']);
    const csv = csvOf(fields, report.reclaim);
    expect(csv.headers).toEqual(['User', 'Reason', 'Plan', 'Organization', 'Days since activity', 'Last activity', 'Usage in this period (USD)', 'Value per month (USD)']);
    expect(csv.rows.map((r) => r[0])).toEqual(report.reclaim.map((f) => f.login));
    const price = csv.headers.indexOf('Value per month (USD)');
    const total = csv.rows.reduce((s, r) => s + Number(r[price]), 0);
    expect(total).toBeCloseTo(report.reclaimValue, 2);
    const first = csv.rows[0];
    expect(first[1]).toBe('No activity for 90 days or more');
    expect(first[2]).toBe('5000');
    expect(planText(String(first[2]))).toBe('Custom plan, 5,000 credits');
    expect(first[7]).toBe(50);
  });

  it('gives every list a user column first and a price column last', () => {
    for (const id of LIST_ORDER) {
      if (id === 'unmatched') continue;
      const keys = findingFields(id).map((f) => f.key);
      expect(keys[0]).toBe('user');
      expect(keys[keys.length - 1]).toBe('price');
      expect(new Set(keys).size).toBe(keys.length);
    }
    expect(findingFields('pending').map((f) => f.key)).toContain('ends');
    expect(findingFields('new').map((f) => f.key)).toContain('created');
    expect(findingFields('no-date').map((f) => f.key)).toContain('lastActivity');
  });

  it('writes the users with usage but no seat, biggest usage first', () => {
    const csv = csvOf(unmatchedFields(), report.unmatched);
    expect(csv.headers).toEqual(['User', 'Organization', 'Plan in the report', 'Usage in this period (USD)']);
    expect(new Set(csv.rows.map((r) => String(r[0])))).toEqual(new Set(left));
    const usage = csv.rows.map((r) => Number(r[3]));
    expect(usage).toEqual([...usage].sort((a, b) => b - a));
  });
});

describe('licenses page: helpers', () => {
  it('finds report users by login, whatever the capital letters, and the first profile wins', () => {
    const ids = profileIds([
      { id: 4, name: 'Mona' },
      { id: 7, name: 'mona' },
      { id: 9, name: ' Octo ' },
      { id: 11, name: '' },
    ]);
    expect(ids.get('mona')).toBe(4);
    expect(ids.get('octo')).toBe(9);
    expect(ids.size).toBe(2);
    const demo = profileIds(pl.analysis.population.profiles);
    const p = pl.analysis.population.profiles[0];
    expect(demo.get(p.name.toUpperCase().toLowerCase())).toBe(p.id);
  });

  it('writes plans in plain words', () => {
    expect(planText('')).toBe('');
    expect(planText('Business')).toBe('Business');
    expect(planText('enterprise')).toBe('Enterprise');
    expect(planText('Custom (1,900 credits)')).toBe('Business');
    expect(planText('Custom (5,000 credits)')).toBe('Custom plan, 5,000 credits');
    expect(planText('No quota')).toBe('No included credits');
    expect(planText('Special')).toBe('Special');
  });

  it('tells what the filters do to the page', () => {
    expect(scopeOf(false, false)).toBe('none');
    expect(scopeOf(true, true)).toBe('rows');
    expect(scopeOf(true, false)).toBe('segments');
  });

  it('calls an export old when the report runs more than 30 days past it', () => {
    expect(asOfInfo({ asOf: '2026-05-31', asOfSource: 'settings', asOfBehindReport: 30 }).stale).toBe(false);
    const old = asOfInfo({ asOf: '2026-05-31', asOfSource: 'settings', asOfBehindReport: 31 });
    expect(old.stale).toBe(true);
    expect(old.date).toBe(fmtIsoDay('2026-05-31'));
    expect(old.date).toMatch(/2026/);
    expect(asOfInfo({ asOf: null, asOfSource: null, asOfBehindReport: null })).toEqual({ date: '', source: null, behind: null, stale: false });
    expect(asOfInfo(report).date).toBe(fmtIsoDay(asOf));
  });

  it('refuses files above 25 MB', () => {
    expect(isTooBig(25 * 1024 * 1024)).toBe(false);
    expect(isTooBig(25 * 1024 * 1024 + 1)).toBe(true);
  });
});
