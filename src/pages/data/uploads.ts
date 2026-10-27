import { create } from 'zustand';
import { msg, t } from '../../i18n';
import type { RosterEntry, SaveResult } from '../../lib/analytics/settings';
import { applyLicenseImport, classifyUpload, loginKey, parseLicenseFile, type LicenseKind, type RosterMode, type UploadKind } from '../../lib/licenses';

/** Bytes read from the start of each file to sort it. More than 4 KB of text, so classifyUpload can tell a cut-off file. */
export const SNIFF_BYTES = 64 * 1024;

/** The largest license list accepted. A 20,000-seat list with every detail is about 4.3 MB. */
export const MAX_LICENSE_BYTES = 25 * 1024 * 1024;

/** The parts of a File the routing needs, so tests can pass plain objects. */
export interface UploadFile {
  name: string;
  type?: string;
  size: number;
}

/** Where a picked or dropped file goes. */
export type UploadRoute = 'usage' | 'license' | 'reject';

export const NOT_A_CSV = msg('That does not look like a CSV file. Choose the AI usage report you downloaded from GitHub (.csv).');
export const LICENSE_FIRST = msg('This is a license list. Load your usage report first, then import the list on the Licenses page.');

const CSV_TYPES = new Set(['text/csv', 'application/vnd.ms-excel']);

export const isCsvFile = (file: UploadFile): boolean => /\.csv$/i.test(file.name) || CSV_TYPES.has(file.type ?? '');

/**
 * Usage reports load as before and license lists go to the license list. A CSV that is neither still goes to the usage
 * loader, so the reader gets its message about missing columns. Any other file is refused.
 */
export function routeOf(kind: UploadKind, file: UploadFile): UploadRoute {
  if (kind === 'usage' || kind === 'license') return kind;
  return isCsvFile(file) ? 'usage' : 'reject';
}

export interface SortedUploads<F extends UploadFile> {
  usage: F[];
  license: F[];
  reject: F[];
}

/** Reads the start of every file and sorts the files by route. A file that cannot be read goes to the usage loader when it is a CSV. */
export async function sortUploads<F extends UploadFile>(files: readonly F[], readHead: (file: F) => Promise<string>): Promise<SortedUploads<F>> {
  const out: SortedUploads<F> = { usage: [], license: [], reject: [] };
  for (const file of files) {
    let kind: UploadKind = 'unknown';
    try {
      kind = classifyUpload(await readHead(file), file.name);
    } catch {
      kind = 'unknown';
    }
    out[routeOf(kind, file)].push(file);
  }
  return out;
}

/** What one license file gave. */
export interface LicenseFileResult {
  name: string;
  kind: LicenseKind;
  seats: number;
  skipped: number;
  problems: string[];
  /** Larger than MAX_LICENSE_BYTES, so it was not read. */
  tooBig: boolean;
  /** The file could not be read. */
  unreadable: boolean;
}

/** The result of a batch, shown on the Data page until the reader closes it. */
export interface UploadNotice {
  at: number;
  /** How the first license file was applied: 'replace' when there was no list yet. Null when no license file had seats. */
  mode: RosterMode | null;
  files: LicenseFileResult[];
  /** The whole batch against the list before it. */
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
  /** Seats on the list after the batch. */
  total: number;
  /** How the settings were kept in this browser. Null when the list did not change. */
  saved: SaveResult | null;
  /** Files that are neither a usage report nor a license list. */
  ignored: string[];
}

export interface RosterState {
  roster: RosterEntry[];
  rosterAsOf?: string;
}

/** Compares two lists by login: who is new, who changed, who stayed the same and who is gone. */
export function diffRoster(before: readonly RosterEntry[], after: readonly RosterEntry[]): { added: number; updated: number; unchanged: number; removed: number } {
  const old = new Map(before.map((seat) => [loginKey(seat.user), JSON.stringify(seat)]));
  const now = new Set<string>();
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  for (const seat of after) {
    const key = loginKey(seat.user);
    if (now.has(key)) continue;
    now.add(key);
    const had = old.get(key);
    if (had === undefined) added++;
    else if (had === JSON.stringify(seat)) unchanged++;
    else updated++;
  }
  let removed = 0;
  for (const key of old.keys()) if (!now.has(key)) removed++;
  return { added, updated, unchanged, removed };
}

/**
 * Imports license files one after the other. The first file replaces the list when there is none yet and adds to it
 * otherwise; every later file adds. A file without seats changes nothing.
 */
export async function importLicenseFiles<F extends UploadFile>(
  files: readonly F[],
  current: RosterState,
  readText: (file: F) => Promise<string>,
  today?: string,
): Promise<{ state: RosterState; changed: boolean; mode: RosterMode | null; files: LicenseFileResult[] }> {
  let state: RosterState = { roster: [...current.roster], rosterAsOf: current.rosterAsOf };
  let mode: RosterMode | null = null;
  const results: LicenseFileResult[] = [];
  for (const file of files) {
    const base: LicenseFileResult = { name: file.name, kind: 'unknown', seats: 0, skipped: 0, problems: [], tooBig: false, unreadable: false };
    if (file.size > MAX_LICENSE_BYTES) {
      results.push({ ...base, tooBig: true });
      continue;
    }
    let text: string;
    try {
      text = await readText(file);
    } catch {
      results.push({ ...base, unreadable: true });
      continue;
    }
    const parse = parseLicenseFile(text, file.name);
    results.push({ ...base, kind: parse.kind, seats: parse.seats.length, skipped: parse.skipped, problems: parse.problems });
    if (parse.seats.length === 0) continue;
    const step: RosterMode = state.roster.length === 0 ? 'replace' : 'add';
    mode ??= step;
    const imported = applyLicenseImport(parse, state, step, today);
    state = { roster: imported.roster, rosterAsOf: imported.rosterAsOf };
  }
  return { state, changed: mode !== null, mode, files: results };
}

export interface UploadDeps<F extends UploadFile> {
  /** The first SNIFF_BYTES of the file as text. */
  readHead: (file: F) => Promise<string>;
  readText: (file: F) => Promise<string>;
  /** Replaces the loaded data with the usage files. Resolves true on success and shows its own errors. */
  loadUsage: (files: F[]) => Promise<boolean>;
  hasDataset: () => boolean;
  roster: () => RosterState;
  /** Stores the new list in the settings and says how it was kept. */
  saveRoster: (state: RosterState) => SaveResult;
  setError: (message: string) => void;
  today?: string;
}

export interface UploadOutcome {
  /** True when the usage files loaded, false when they failed, null when the batch had none. */
  usageLoaded: boolean | null;
  /** Set when the batch had license files that were read (even without seats). */
  notice: UploadNotice | null;
}

/**
 * Sends each file where it belongs. Usage reports replace the loaded data. License lists are imported once usage data is
 * loaded, from this batch or before. A license list alone with no usage data gets the LICENSE_FIRST message.
 */
export async function routeUploads<F extends UploadFile>(files: readonly F[], dependencies: UploadDeps<F>): Promise<UploadOutcome> {
  const sorted = await sortUploads(files, dependencies.readHead);
  const ignored = sorted.reject.map((file) => file.name);

  if (sorted.usage.length === 0 && sorted.license.length === 0) {
    dependencies.setError(t(NOT_A_CSV));
    return { usageLoaded: null, notice: null };
  }

  let usageLoaded: boolean | null = null;
  if (sorted.usage.length > 0) usageLoaded = await dependencies.loadUsage(sorted.usage);

  if (sorted.license.length === 0 || !dependencies.hasDataset()) {
    if (sorted.license.length > 0 && usageLoaded === null) dependencies.setError(t(LICENSE_FIRST));
    const notice = ignored.length > 0 && usageLoaded ? emptyNotice(ignored, dependencies.roster().roster.length) : null;
    return { usageLoaded, notice };
  }

  const before = dependencies.roster();
  const done = await importLicenseFiles(sorted.license, before, dependencies.readText, dependencies.today);
  const saved = done.changed ? dependencies.saveRoster(done.state) : null;
  const diff = diffRoster(before.roster, done.state.roster);
  return {
    usageLoaded,
    notice: { at: Date.now(), mode: done.mode, files: done.files, ...diff, total: done.state.roster.length, saved, ignored },
  };
}

function emptyNotice(ignored: string[], total: number): UploadNotice {
  return { at: Date.now(), mode: null, files: [], added: 0, updated: 0, unchanged: total, removed: 0, total, saved: null, ignored };
}

/** The last batch result, so the Data page can show it after a drop on the start page. */
export const useUploadNotice = create<{ notice: UploadNotice | null; show: (notice: UploadNotice | null) => void }>((set) => ({
  notice: null,
  show: (notice) => set({ notice }),
}));
