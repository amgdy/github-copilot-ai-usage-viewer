import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { applyLocale, type Dict } from '../src/i18n/core';
import { loadDictionary } from '../src/i18n/load';
import type { Analysis } from '../src/lib/analytics/analyze';
import { planCredits, seatCredits, type RosterEntry } from '../src/lib/analytics/settings';
import { parseLicenseFile, readPlan, rosterFromParse, sanitizeRoster, type LicenseParse } from '../src/lib/licenses';
import { analyzeCsv, makeCsv, type RowSpec } from './helpers';

/**
 * A plan is an identifier, not display text. The plan filter, the plan groups and the credits in "Custom (N credits)" all depend on
 * the English names. These tests switch to Arabic, give Arabic to every plan word, and check that nothing a plan depends on moves.
 */
let arabic: Dict = {};

beforeAll(async () => {
  arabic = {
    ...(await loadDictionary('ar')),
    Business: 'أعمال',
    Enterprise: 'مؤسسات',
    'No quota': 'بلا حصة',
    'Custom ({credits} credits)': 'مخصص ({credits} رصيد)',
    'Custom ({n} credits)': 'مخصص ({n} رصيد)',
  };
});

afterEach(() => applyLocale('en', {}));

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

describe('plans when the language is Arabic', () => {
  it('reads every plan text the same way', () => {
    const cells = ['Business', 'GitHub Copilot Enterprise', 'Custom (2,500 credits)', 'Custom (500 credits)', '1,900', '$25', 'unknown', 'platinum', 'Custom (abc credits)'];
    const read = (): unknown[] => cells.map((c) => [readPlan(c), planCredits(c), seatCredits(c, 1900)]);
    const english = read();
    applyLocale('ar', arabic);
    expect(read()).toEqual(english);
    expect(readPlan('Custom (2,500 credits)')).toBe('2500');
    expect(planCredits('Custom (2,500 credits)')).toBe(2500);
    expect(seatCredits('Custom (500 credits)', 1900)).toBe(500);
    expect(sanitizeRoster([{ user: 'user001', plan: 'Custom (2,500 credits)' }])).toEqual([{ user: 'user001', plan: '2500' }]);
  });

  it('reads the same seats and plans from a file, and only the messages change', () => {
    const rest = JSON.stringify({
      total_seats: 3,
      seats: [
        { assignee: { login: 'user001' }, plan_type: 'business', created_at: '2025-01-15T09:00:00Z', last_activity_at: '2026-05-20T08:00:00Z' },
        { assignee: { login: 'user002' }, plan_type: 'enterprise', created_at: '2025-02-01T09:00:00Z', last_activity_at: null },
        { assignee: { login: 'user003' }, plan_type: 'unknown', created_at: '2025-03-01T09:00:00Z', last_activity_at: null },
      ],
    });
    const table = ['login,plan', 'user004,"Custom (2,500 credits)"', 'user005,Business', ',Business'].join('\n');
    const files = [rest, table, 'user006\nuser007\nnot a login!', ''];
    const run = (): LicenseParse[] => files.map((f) => parseLicenseFile(f));
    const bare = (runs: LicenseParse[]): unknown[] => runs.map((r) => ({ ...r, problems: r.problems.length }));

    const english = run();
    expect(english[0].seats.map((s) => s.plan)).toEqual(['Business', 'Enterprise', undefined]);
    expect(english[1].seats.map((s) => s.plan)).toEqual(['2500', 'Business']);
    expect(english[3].problems).toEqual(['The file is empty.']);

    applyLocale('ar', arabic);
    const translated = run();
    expect(bare(translated)).toEqual(bare(english));
    expect(translated.map((r) => rosterFromParse(r))).toEqual(english.map((r) => rosterFromParse(r)));
    expect(translated[3].problems).toHaveLength(1);
    expect(translated[3].problems).not.toEqual(english[3].problems);
  });

  it('builds the same license report, seat lists and profile plans when the analysis runs again in Arabic', async () => {
    const specs: RowSpec[] = [
      { date: '2026-05-20', user: 'user001', gross: 5, quota: 1900 },
      { date: '2026-05-31', user: 'user001', gross: 5, quota: 1900 },
      { date: '2026-05-20', user: 'user010', gross: 5, quota: 3900 },
      { date: '2026-05-20', user: 'user009', gross: 3, quota: 1000 },
    ];
    const roster: RosterEntry[] = [
      { user: 'user001', plan: 'Business', lastActivityAt: '2026-05-25', source: 'api' },
      { user: 'user010', plan: 'Enterprise', lastActivityAt: '2026-05-28', source: 'api' },
      { user: 'user002', plan: 'Enterprise', lastActivityAt: '2026-01-10', source: 'api' },
      { user: 'user003', plan: '2500', lastActivityAt: '2026-01-10', source: 'api' },
      { user: 'user004', plan: 'Custom (2,500 credits)', lastActivityAt: '2026-01-10', source: 'api' },
      { user: 'user005', source: 'api' },
    ];
    const pl = await analyzeCsv(makeCsv(specs, { pool: true }), { settings: { roster, rosterAsOf: '2026-05-31' } });
    const view = (a: Analysis): unknown => ({
      licenses: a.licenses,
      seats: a.seats,
      plans: a.population.profiles.map((p) => [p.name, p.plan, p.license]),
    });

    const report = must(pl.analysis.licenses);
    const listed = report.reclaim.filter((f) => ['user002', 'user003', 'user004'].includes(f.login));
    expect(listed.map((f) => [f.login, f.plan, f.seatPrice])).toEqual([
      ['user002', 'Enterprise', 39],
      ['user003', '2500', 25],
      ['user004', 'Custom (2,500 credits)', 25],
    ]);
    expect(report.unmatched.map((u) => [u.name, u.plan])).toEqual([['user009', 'Custom (1,000 credits)']]);

    const english = view(pl.analysis);
    applyLocale('ar', arabic);
    expect(view(pl.run())).toEqual(english);
  });
});
