import { describe, expect, it } from 'vitest';
import type { RosterEntry, SaveResult } from '../src/lib/analytics/settings';
import { rosterKind } from '../src/pages/data/LicenseCard';
import { MAX_LICENSE_BYTES, diffRoster, importLicenseFiles, isCsvFile, routeOf, routeUploads, sortUploads, type RosterState, type UploadDeps } from '../src/pages/data/uploads';
import { makeCsv } from './helpers';

interface FakeFile {
  name: string;
  type?: string;
  size: number;
  text: string;
}

const file = (name: string, text: string, type?: string): FakeFile => ({ name, type, size: text.length, text });

const seat = (login: string, plan = 'business'): Record<string, unknown> => ({
  created_at: '2025-01-15T09:00:00Z',
  last_activity_at: '2026-03-20T09:00:00Z',
  plan_type: plan,
  assignee: { login, id: 1, type: 'User' },
});

const seatsJson = (...logins: string[]): string => JSON.stringify({ total_seats: logins.length, seats: logins.map((l) => seat(l)) });

const USAGE = makeCsv([
  { date: '2026-03-02', user: 'user-a', gross: 2 },
  { date: '2026-03-03', user: 'user-b', gross: 3 },
]);

const ACTIVITY = [
  '"Report_Time","Login","Last Authenticated At","Last Activity At","Last Surface Used"',
  '"2026-03-31 06:00:00 UTC","user-a","2026-03-30T08:00:00Z","2026-03-29T10:15:00Z","vscode/1.97.1/copilot-chat/0.24.1"',
].join('\n');

const readHead = (f: FakeFile): Promise<string> => Promise.resolve(f.text.slice(0, 64 * 1024));
const readText = (f: FakeFile): Promise<string> => Promise.resolve(f.text);

function deps(opts: { dataset?: boolean; roster?: RosterEntry[]; loadOk?: boolean } = {}) {
  const calls = { loaded: [] as string[][], saved: [] as RosterState[], errors: [] as string[] };
  let dataset = opts.dataset ?? false;
  let roster: RosterState = { roster: opts.roster ?? [] };
  const d: UploadDeps<FakeFile> = {
    readHead,
    readText,
    loadUsage: (files) => {
      calls.loaded.push(files.map((f) => f.name));
      if (opts.loadOk !== false) dataset = true;
      return Promise.resolve(opts.loadOk !== false);
    },
    hasDataset: () => dataset,
    roster: () => roster,
    saveRoster: (s): SaveResult => {
      calls.saved.push(s);
      roster = s;
      return 'saved';
    },
    setError: (m) => calls.errors.push(m),
    today: '2026-04-01',
  };
  return { d, calls };
}

describe('upload routing', () => {
  it('knows a CSV by its name or its type', () => {
    expect(isCsvFile({ name: 'report.CSV', size: 1 })).toBe(true);
    expect(isCsvFile({ name: 'report', type: 'text/csv', size: 1 })).toBe(true);
    expect(isCsvFile({ name: 'seats.json', type: 'application/json', size: 1 })).toBe(false);
  });

  it('sends unknown CSV files to the usage loader and refuses other unknown files', () => {
    expect(routeOf('usage', { name: 'x.txt', size: 1 })).toBe('usage');
    expect(routeOf('license', { name: 'x.json', size: 1 })).toBe('license');
    expect(routeOf('unknown', { name: 'odd.csv', size: 1 })).toBe('usage');
    expect(routeOf('unknown', { name: 'photo.png', size: 1 })).toBe('reject');
  });

  it('sorts usage reports, license lists and other files', async () => {
    const files = [file('usage.csv', USAGE), file('seats.json', seatsJson('user-a')), file('activity.csv', ACTIVITY), file('config.json', '{"theme":"dark"}')];
    const sorted = await sortUploads(files, readHead);
    expect(sorted.usage.map((f) => f.name)).toEqual(['usage.csv']);
    expect(sorted.license.map((f) => f.name)).toEqual(['seats.json', 'activity.csv']);
    expect(sorted.reject.map((f) => f.name)).toEqual(['config.json']);
  });

  it('sends a CSV that cannot be read to the usage loader', async () => {
    const bad = file('broken.csv', '');
    const sorted = await sortUploads([bad], () => Promise.reject(new Error('no')));
    expect(sorted.usage).toEqual([bad]);
  });
});

describe('diffRoster', () => {
  it('counts added, updated, unchanged and removed logins', () => {
    const before: RosterEntry[] = [{ user: 'a', plan: 'business' }, { user: 'b', plan: 'business' }, { user: 'c' }];
    const after: RosterEntry[] = [{ user: 'A', plan: 'business' }, { user: 'b', plan: 'enterprise' }, { user: 'd' }];
    const diff = diffRoster(before, after);
    expect(diff.added).toBe(1);
    expect(diff.removed).toBe(1);
    expect(diff.added + diff.updated + diff.unchanged).toBe(3);
    expect(diff.updated).toBeGreaterThanOrEqual(1);
  });

  it('counts a repeated login once', () => {
    expect(diffRoster([], [{ user: 'a' }, { user: 'a' }])).toEqual({ added: 1, updated: 0, unchanged: 0, removed: 0 });
  });
});

describe('importLicenseFiles', () => {
  it('replaces an empty list, then adds the later files', async () => {
    const done = await importLicenseFiles([file('one.json', seatsJson('user-a', 'user-b')), file('two.json', seatsJson('user-c'))], { roster: [] }, readText, '2026-04-01');
    expect(done.mode).toBe('replace');
    expect(done.changed).toBe(true);
    expect(done.state.roster.map((e) => e.user).sort()).toEqual(['user-a', 'user-b', 'user-c']);
    expect(done.files.map((f) => f.seats)).toEqual([2, 1]);
  });

  it('adds to an existing list and skips files that are too big or unreadable', async () => {
    const big: FakeFile = { name: 'big.json', size: MAX_LICENSE_BYTES + 1, text: '' };
    const broken = file('broken.json', seatsJson('user-z'));
    const reader = (f: FakeFile): Promise<string> => (f.name === 'broken.json' ? Promise.reject(new Error('no')) : readText(f));
    const done = await importLicenseFiles([big, broken, file('ok.json', seatsJson('user-b'))], { roster: [{ user: 'user-a' }] }, reader);
    expect(done.mode).toBe('add');
    expect(done.files[0].tooBig).toBe(true);
    expect(done.files[1].unreadable).toBe(true);
    expect(done.state.roster.map((e) => e.user).sort()).toEqual(['user-a', 'user-b']);
  });
});

describe('routeUploads', () => {
  it('says the file is not a CSV when nothing can be used', async () => {
    const { d, calls } = deps();
    const out = await routeUploads([file('photo.png', 'binary')], d);
    expect(out).toEqual({ usageLoaded: null, notice: null });
    expect(calls.errors).toHaveLength(1);
    expect(calls.loaded).toHaveLength(0);
  });

  it('asks for the usage report first when only a license list arrives', async () => {
    const { d, calls } = deps();
    const out = await routeUploads([file('seats.json', seatsJson('user-a'))], d);
    expect(out.usageLoaded).toBeNull();
    expect(out.notice).toBeNull();
    expect(calls.errors).toHaveLength(1);
    expect(calls.saved).toHaveLength(0);
  });

  it('loads the usage report, then imports the license list from the same batch', async () => {
    const { d, calls } = deps();
    const out = await routeUploads([file('seats.json', seatsJson('user-a', 'user-b')), file('usage.csv', USAGE), file('config.json', '{"theme":"dark"}')], d);
    expect(calls.loaded).toEqual([['usage.csv']]);
    expect(out.usageLoaded).toBe(true);
    expect(out.notice?.mode).toBe('replace');
    expect(out.notice?.added).toBe(2);
    expect(out.notice?.total).toBe(2);
    expect(out.notice?.saved).toBe('saved');
    expect(out.notice?.ignored).toEqual(['config.json']);
    expect(calls.errors).toHaveLength(0);
  });

  it('adds a license list to the one already kept when data is loaded', async () => {
    const { d, calls } = deps({ dataset: true, roster: [{ user: 'user-a' }] });
    const out = await routeUploads([file('more.json', seatsJson('user-b'))], d);
    expect(out.usageLoaded).toBeNull();
    expect(out.notice?.mode).toBe('add');
    expect(out.notice?.added).toBe(1);
    expect(out.notice?.total).toBe(2);
    expect(calls.saved).toHaveLength(1);
  });

  it('does not import a license list when the usage report fails to load', async () => {
    const { d, calls } = deps({ loadOk: false });
    const out = await routeUploads([file('usage.csv', USAGE), file('seats.json', seatsJson('user-a'))], d);
    expect(out.usageLoaded).toBe(false);
    expect(out.notice).toBeNull();
    expect(calls.saved).toHaveLength(0);
  });
});

describe('rosterKind', () => {
  it('names where the license list came from', () => {
    expect(rosterKind([])).toBeNull();
    expect(rosterKind([{ user: 'a' }])).toBe('list');
    expect(rosterKind([{ user: 'a', source: 'activity' }])).toBe('activity');
    expect(rosterKind([{ user: 'a', source: 'activity' }, { user: 'b', source: 'api' }])).toBe('api');
  });
});
