import { FIELD_ALIASES, normalizeHeader, type SeatField } from './columns';
import { newReadStats, seatFromFields, type ReadStats } from './fields';
import { readLogin } from './login';
import type { LicenseSeat, SeatSource } from './types';

/** A hard stop, so a runaway file cannot fill the memory of the browser tab. */
export const MAX_SEATS = 250_000;

type Dict = Record<string, unknown>;

const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface JsonScan {
  /** Every top-level JSON value found, in order. */
  values: unknown[];
  /** Pieces of text that looked like JSON but did not parse, and stray closing brackets. */
  garbage: number;
  /** The text ended inside a value. */
  truncated: boolean;
}

/**
 * Finds the top-level JSON objects and arrays in a text. This covers one document, `gh api --paginate` output
 * (objects written back to back) and NDJSON. It counts brackets and skips strings and escapes instead of
 * guessing with a pattern, so braces inside a name or a URL never split a value.
 */
export function scanJsonValues(text: string): JsonScan {
  const values: unknown[] = [];
  let garbage = 0;
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  const n = text.length;
  for (let i = 0; i < n; i++) {
    const c = text.charCodeAt(i);
    if (inString) {
      if (escaped) escaped = false;
      else if (c === 92) escaped = true;
      else if (c === 34) inString = false;
      continue;
    }
    if (c === 34) {
      if (depth > 0) inString = true;
      continue;
    }
    if (c === 123 || c === 91) {
      if (depth === 0) start = i;
      depth++;
    } else if (c === 125 || c === 93) {
      if (depth === 0) {
        garbage++;
        continue;
      }
      depth--;
      if (depth === 0) {
        try {
          values.push(JSON.parse(text.slice(start, i + 1)));
        } catch {
          garbage++;
        }
        start = -1;
      }
    }
  }
  return { values, garbage, truncated: depth > 0 };
}

/** Flattens a seat record to normalized, text-valued keys. Nested assignee, organization and team objects are read in place. */
function flatten(rec: Dict): Record<string, string> {
  const flat: Record<string, string> = {};
  const text = (v: unknown): string | undefined => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined);
  for (const [key, value] of Object.entries(rec)) {
    const k = normalizeHeader(key);
    if (k === '') continue;
    if (isDict(value)) {
      if (k === 'assignee') {
        flat.login = text(value.login) ?? '';
        flat.name = text(value.name) ?? '';
        flat.email = text(value.email) ?? '';
      } else if (k === 'organization') flat.organization = text(value.login) ?? text(value.name) ?? '';
      else if (k === 'assigning_team') flat.assigning_team = text(value.slug) ?? text(value.name) ?? '';
      continue;
    }
    const t = text(value);
    flat[k] = t ?? '';
  }
  return flat;
}

const getterOf =
  (flat: Record<string, string>) =>
  (field: SeatField): string | undefined => {
    for (const alias of FIELD_ALIASES[field]) {
      const v = flat[alias];
      if (v) return v;
    }
    return undefined;
  };

const hasKey = (flat: Record<string, string>, field: SeatField): boolean => FIELD_ALIASES[field].some((a) => a in flat);

/** What the GitHub API answers when the request fails: {"message": "Not Found", "documentation_url": ...}. */
function apiErrorOf(rec: Dict): string | null {
  if (typeof rec.message !== 'string') return null;
  if (!('documentation_url' in rec) && !('status' in rec)) return null;
  return rec.message.slice(0, 120);
}

export interface JsonSeats {
  /** Every valid seat record, before merging. */
  records: LicenseSeat[];
  total?: number;
  skipped: number;
  errors: string[];
  garbage: number;
  truncated: boolean;
  stats: ReadStats;
  /** The text had the shape of a seat list (a "seats" array or seat records), even if it was empty. */
  seatShaped: boolean;
  capped: boolean;
}

interface Ctx {
  out: JsonSeats;
}

function addSeat(item: unknown, ctx: Ctx): void {
  const out = ctx.out;
  if (!isDict(item)) {
    out.skipped++;
    return;
  }
  const error = apiErrorOf(item);
  if (error !== null) {
    out.errors.push(error);
    return;
  }
  const flat = flatten(item);
  // The API writes activity keys even when their values are blank.
  const source: SeatSource = hasKey(flat, 'activity') ? 'api' : 'list';
  const seat = seatFromFields(getterOf(flat), source, out.stats);
  if (seat === null) {
    out.skipped++;
    return;
  }
  if (out.records.length >= MAX_SEATS) {
    out.capped = true;
    return;
  }
  out.seatShaped = true;
  out.records.push(seat);
}

function collect(value: unknown, depth: number, ctx: Ctx): void {
  const out = ctx.out;
  if (Array.isArray(value)) {
    if (depth >= 4) {
      out.skipped++;
      return;
    }
    for (const item of value) collect(item, depth + 1, ctx);
    return;
  }
  if (!isDict(value)) {
    // A JSON list of logins: ["user001", "user002"]
    const login = depth > 0 && typeof value === 'string' ? readLogin(value) : null;
    if (login === null) out.skipped++;
    else if (out.records.length >= MAX_SEATS) out.capped = true;
    else {
      out.seatShaped = true;
      out.records.push({ login, orgs: [], teams: [], source: 'list' });
    }
    return;
  }
  if (Array.isArray(value.seats)) {
    out.seatShaped = true;
    if (typeof value.total_seats === 'number' && Number.isFinite(value.total_seats) && value.total_seats >= 0) {
      out.total = Math.max(out.total ?? 0, Math.floor(value.total_seats));
    }
    for (const item of value.seats) addSeat(item, ctx);
    return;
  }
  addSeat(value, ctx);
}

/** Reads seats from JSON text in any of the shapes the API and the gh CLI produce. Never throws. */
export function parseSeatsJson(text: string): JsonSeats {
  const out: JsonSeats = {
    records: [],
    skipped: 0,
    errors: [],
    garbage: 0,
    truncated: false,
    stats: newReadStats(),
    seatShaped: false,
    capped: false,
  };
  let values: unknown[] | null = null;
  try {
    values = [JSON.parse(text)];
  } catch {
    const scan = scanJsonValues(text);
    values = scan.values;
    out.garbage = scan.garbage;
    out.truncated = scan.truncated;
  }
  const ctx: Ctx = { out };
  for (const v of values) collect(v, 0, ctx);
  // When any record carries activity keys, apply that source to the whole response, including seats with blank dates.
  if (out.records.some((r) => r.source === 'api')) for (const r of out.records) r.source = 'api';
  return out;
}
