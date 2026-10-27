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

const must = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new Error('missing value');
  return value;
};

let pipeline: Pipeline;
let report: LicenseReport;
let asOf: string;
/** Report users who got no seat, so they show up as usage without a seat. */
let left: string[];

beforeAll(async () => {
  pipeline = await analyzeDemo();
  asOf = isoOf(pipeline.store.maxDay);
  const names = pipeline.analysis.population.profiles.map((profile) => profile.name);
  left = names.slice(-3);
  const ago = (days: number) => addDays(asOf, -days);
  const seat = (user: string, over: Partial<RosterEntry> = {}): RosterEntry => ({ user, plan: 'Business', source: 'api', createdAt: ago(400), lastAuthenticatedAt: ago(5), ...over });
  const roster: RosterEntry[] = [
    // Report users with a seat: recent, fading and one Enterprise seat. Their usage keeps them off the list of seats to free.
    ...names.slice(0, -3).map((name, index) => seat(name, { lastActivityAt: ago(index % 3 === 0 ? 40 : 3), plan: index === 0 ? 'Enterprise' : 'Business' })),
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
  const analysis = pipeline.run(pipeline.filters, mergeSettings({ roster, rosterAsOf: asOf, newUserDays: 14 }));
  report = must(analysis.licenses);
});

describe('licenses page: KPI tiles and breakdowns', () => {
  it('shows the KPI tiles in impact order, each with an explanation and clean text', () => {
    const tiles = kpiTiles(report);
    expect(tiles.map((tile) => tile.id)).toEqual(['reclaim-value', 'reclaim-count', 'unmatched', 'coverage', 'seats', 'seat-cost']);
    for (const tile of tiles) {
      expect(tile.calc.length).toBeGreaterThan(0);
      expect(`${tile.label} ${tile.value} ${tile.sub}`).not.toMatch(BAD_TEXT);
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
    const order = rows.map((row) => STATUS_ORDER.indexOf(row.status));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(rows.every((row) => row.count > 0)).toBe(true);
    expect(rows.reduce((total, row) => total + row.count, 0)).toBe(report.seats);
    expect(rows[0].status).toBe('recent');
  });

  it('splits the seats by plan and by place in the report, each adding up to all seats', () => {
    const plans = planRows(report);
    expect(plans.map((plan) => plan.id)).toEqual(['business', 'enterprise', 'other']);
    expect(plans.reduce((total, plan) => total + plan.count, 0)).toBe(report.seats);
    const places = placeRows(report);
    expect(places.map((place) => place.id)).toEqual(['matched', 'outside', 'never-seen']);
    expect(places.reduce((total, place) => total + place.count, 0)).toBe(report.seats);
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
    expect(reclaim.map((finding) => finding.login)).toEqual(report.reclaim.map((finding) => finding.login));
    expect(reclaim[0].login).toBe('ghost-custom');
    expect(reclaim.map((finding) => finding.login)).not.toContain('ghost-pending');
    expect(reclaim.map((finding) => finding.login)).not.toContain('ghost-new');
    const noDate = findingsOf(report, 'no-date');
    expect(noDate.map((finding) => finding.login)).toEqual(['ghost-never-active', 'ghost-never-signed-in', 'ghost-new']);
    expect(listCount(report, 'pending')).toBe(1);
    expect(listCount(report, 'new')).toBeGreaterThanOrEqual(1);
    expect(listCount(report, 'unmatched')).toBe(left.length);
  });

  it('names each CSV file after its list', () => {
    const names = LIST_ORDER.map(listExportName);
    expect(new Set(names).size).toBe(LIST_ORDER.length);
    for (const fileName of names) expect(fileName).toMatch(/^github-copilot-licenses-[a-z-]+$/);
    expect(listExportName('reclaim')).toBe('github-copilot-licenses-seats-to-free');
  });

  it('writes the visible columns of the seats to free to the CSV, in the order of the list', () => {
    const fields = findingFields('reclaim');
    expect(fields.map((field) => field.key)).toEqual(['user', 'name', 'reason', 'plan', 'org', 'team', 'days', 'lastActivity', 'surface', 'created', 'usage', 'price']);
    const csv = csvOf(fields, report.reclaim);
    expect(csv.headers).toEqual(['User', 'Reason', 'Plan', 'Organization', 'Days since activity', 'Last activity', 'Usage in this period (USD)', 'Value per month (USD)']);
    expect(csv.rows.map((csvRow) => csvRow[0])).toEqual(report.reclaim.map((finding) => finding.login));
    const price = csv.headers.indexOf('Value per month (USD)');
    const total = csv.rows.reduce((sum, csvRow) => sum + Number(csvRow[price]), 0);
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
      const keys = findingFields(id).map((field) => field.key);
      expect(keys[0]).toBe('user');
      expect(keys[keys.length - 1]).toBe('price');
      expect(new Set(keys).size).toBe(keys.length);
    }
    expect(findingFields('pending').map((field) => field.key)).toContain('ends');
    expect(findingFields('new').map((field) => field.key)).toContain('created');
    expect(findingFields('no-date').map((field) => field.key)).toContain('lastActivity');
  });

  it('writes the users with usage but no seat, biggest usage first', () => {
    const csv = csvOf(unmatchedFields(), report.unmatched);
    expect(csv.headers).toEqual(['User', 'Organization', 'Plan in the report', 'Usage in this period (USD)']);
    expect(new Set(csv.rows.map((csvRow) => String(csvRow[0])))).toEqual(new Set(left));
    const usage = csv.rows.map((csvRow) => Number(csvRow[3]));
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
    const demo = profileIds(pipeline.analysis.population.profiles);
    const firstProfile = pipeline.analysis.population.profiles[0];
    expect(demo.get(firstProfile.name.toUpperCase().toLowerCase())).toBe(firstProfile.id);
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
