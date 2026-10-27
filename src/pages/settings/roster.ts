import { PLAN_CREDITS, planCredits, type RosterEntry } from '../../lib/analytics/settings';
import { canonicalPlan, readPlan } from '../../lib/licenses/plan';
import type { DataStore } from '../../lib/types';
import { fmtInt } from '../../lib/utils/format';
import { msg, t } from '../../i18n';

/** Uploads larger than this are refused. A real seat list is a few hundred kilobytes at most. */
export const MAX_ROSTER_FILE_BYTES = 5 * 1024 * 1024;

const BUSINESS = PLAN_CREDITS.Business ?? 1900;
const ENTERPRISE = PLAN_CREDITS.Enterprise ?? 3900;
const MAX_NAME_LENGTH = 100;
const MAX_IGNORED_KEPT = 100;
const BAD_NAME = /[\s,;"'<>]/;

/** The key the analysis uses to match roster users with users in the report. */
export const rosterKey = (user: string): string => user.trim().toLowerCase();

/** Why a username cannot go on the roster (English, show it through t()), or null when it is fine. */
export function userProblem(user: string): string | null {
  if (!user) return msg('No username');
  if (user.length > MAX_NAME_LENGTH) return msg('Username is too long');
  if (BAD_NAME.test(user)) return msg('Username has spaces or other characters that GitHub does not allow');
  return null;
}

/** The plan as the reader sees it, translated. */
export function planText(plan: string | undefined): string {
  if (!plan) return t('Not set');
  const c = planCredits(plan);
  if (c === BUSINESS) return 'Business';
  if (c === ENTERPRISE) return 'Enterprise';
  return Number.isFinite(c) ? t('Custom ({credits} credits)', { credits: fmtInt(c) }) : plan;
}

/**
 * Reads the plan column with the same rules as the license file import (readPlan). Returns the text to store, undefined
 * when the cell is empty or says "unknown", or null when it cannot be read. Business and Enterprise are read by name, and the
 * label the report gives a custom plan, "Custom (2,500 credits)", is read as its credits. A bare number follows the analysis
 * rule. A "$" or "usd" marks dollars and the word "credits" marks credits.
 */
export function parsePlan(raw: string): string | undefined | null {
  return readPlan(raw);
}

export interface IgnoredLine {
  line: number;
  text: string;
  reason: string;
}

export interface RosterParse {
  /** Unique users in the order they first appear. */
  entries: RosterEntry[];
  /** Lines with content, not counting blank lines and comments. */
  lines: number;
  duplicates: number;
  /** Lines with a plan that could not be read. Those users are kept without a plan. */
  unreadablePlans: number;
  /** A few examples of plan text that could not be read. */
  unreadableSamples: string[];
  /** The first lines that were left out. */
  ignored: IgnoredLine[];
  ignoredCount: number;
  headerSkipped: boolean;
}

interface Header {
  delimiter: string;
  user: number;
  plan: number;
}

const USER_HEADER = /^(user ?name|user|login|github ?(user ?name|login|handle|user)?|handle|account|member)$/;
const PLAN_HEADERS = [/^plan$/, /^seat( ?(plan|type))?$/, /^licen[cs]e$/, /^(total )?monthly ?quota$/, /^(included )?credits$/, /^quota$/];

const cell = (s: string) => s.trim().replace(/^"|"$/g, '').trim().toLowerCase().replace(/[_-]+/g, ' ');

/** Splits one CSV line, honoring double quotes. */
function splitFields(line: string, delimiter: string): string[] {
  if (!line.includes('"')) return line.split(delimiter);
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch !== '"') cur += ch;
      else if (line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function detectHeader(line: string): Header | null {
  let best = ',';
  let most = -1;
  for (const d of [',', ';', '\t']) {
    const count = line.split(d).length;
    if (count > most) {
      most = count;
      best = d;
    }
  }
  const names = splitFields(line, best).map(cell);
  const user = names.findIndex((n) => USER_HEADER.test(n));
  if (user < 0) return null;
  let plan = -1;
  for (const re of PLAN_HEADERS) {
    plan = names.findIndex((n, i) => i !== user && re.test(n));
    if (plan >= 0) break;
  }
  return { delimiter: best, user, plan };
}

/** Splits a line without a header at the first comma, semicolon or tab, or at a space when the rest of the line is a plan. */
function splitFirst(line: string): [string, string] {
  // "alice Business" or "alice Custom (2,500 credits)": checked first, because a custom plan label has a comma in it.
  const m = /^([^\s,;]+)\s+(\S.*)$/.exec(line);
  if (m && typeof parsePlan(m[2]) === 'string') return [m[1], m[2]];
  let at = -1;
  for (const d of [',', ';', '\t']) {
    const i = line.indexOf(d);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at >= 0) return [line.slice(0, at), line.slice(at + 1)];
  return [line, ''];
}

const unquote = (s: string) => s.trim().replace(/^"+|"+$/g, '').trim();

/**
 * Reads a roster from pasted text or a file in one pass. Accepts lines of "username" or "username,plan".
 * A header row (username, plan) is recognized, and users are deduplicated without regard to case.
 */
export function parseRoster(input: string): RosterParse {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const found = new Map<string, RosterEntry>();
  const ignored: IgnoredLine[] = [];
  let ignoredCount = 0;
  let duplicates = 0;
  let unreadablePlans = 0;
  const unreadableSamples: string[] = [];
  let lines = 0;
  let header: Header | null = null;
  let headerSkipped = false;
  let first = true;

  const skip = (line: number, raw: string, reason: string) => {
    ignoredCount++;
    if (ignored.length < MAX_IGNORED_KEPT) ignored.push({ line, text: raw.length > 60 ? `${raw.slice(0, 57)}...` : raw, reason });
  };

  const rows = text.split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i].trim();
    if (!raw || raw.startsWith('#')) continue;
    lines++;
    if (first) {
      first = false;
      header = detectHeader(raw);
      if (header) {
        headerSkipped = true;
        lines--;
        continue;
      }
    }

    let userText: string;
    let planText: string;
    if (header) {
      const fields = splitFields(raw, header.delimiter);
      userText = fields[header.user] ?? '';
      planText = header.plan >= 0 ? fields[header.plan] ?? '' : '';
    } else {
      const [u, p] = splitFirst(raw);
      userText = u;
      planText = p;
    }

    let user = unquote(userText);
    if (user.startsWith('@')) user = user.slice(1);
    const problem = userProblem(user);
    if (problem) {
      skip(i + 1, raw, problem);
      continue;
    }

    let plan = parsePlan(planText);
    if (plan === null) {
      unreadablePlans++;
      if (unreadableSamples.length < 3) unreadableSamples.push(planText.trim().slice(0, 30));
      plan = undefined;
    }
    const key = user.toLowerCase();
    const existing = found.get(key);
    if (existing) {
      duplicates++;
      if (plan && !existing.plan) existing.plan = plan;
    } else {
      found.set(key, plan ? { user, plan } : { user });
    }
  }

  return { entries: [...found.values()], lines, duplicates, unreadablePlans, unreadableSamples, ignored, ignoredCount, headerSkipped };
}

export interface MergeResult {
  roster: RosterEntry[];
  added: number;
  updated: number;
  unchanged: number;
}

/**
 * Adds incoming users to the roster. A user who is already there keeps their place.
 * Their plan changes when the incoming plan differs and `overwritePlans` is set, or when they have no plan yet.
 */
export function mergeRoster(current: RosterEntry[], incoming: RosterEntry[], overwritePlans: boolean): MergeResult {
  const roster: RosterEntry[] = [];
  const at = new Map<string, number>();
  for (const e of current) {
    const k = rosterKey(e.user);
    if (!k || at.has(k)) continue;
    at.set(k, roster.length);
    roster.push(e);
  }
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  for (const e of incoming) {
    const k = rosterKey(e.user);
    if (!k) continue;
    const i = at.get(k);
    if (i === undefined) {
      at.set(k, roster.length);
      roster.push(e);
      added++;
      continue;
    }
    const cur = roster[i];
    if (e.plan !== undefined && e.plan !== cur.plan && (overwritePlans || cur.plan === undefined)) {
      roster[i] = { ...cur, plan: e.plan };
      updated++;
    } else unchanged++;
  }
  return { roster, added, updated, unchanged };
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Every user in the loaded report, with the plan taken from the quota on their latest day. */
export function rosterFromStore(store: DataStore): RosterEntry[] {
  const names = store.dicts.user.values;
  const latest = new Int32Array(names.length);
  const quota = new Float32Array(names.length);
  const seen = new Uint8Array(names.length);
  for (let i = 0; i < store.n; i++) {
    const u = store.user[i];
    const d = store.day[i];
    const q = store.quota[i];
    if (!seen[u] || d > latest[u]) {
      seen[u] = 1;
      latest[u] = d;
      quota[u] = q;
    } else if (d === latest[u] && q > quota[u]) quota[u] = q;
  }
  const out: RosterEntry[] = [];
  for (let u = 0; u < names.length; u++) {
    const user = names[u].trim();
    if (!user || !seen[u]) continue;
    out.push(quota[u] > 0 ? { user, plan: canonicalPlan(quota[u]) } : { user });
  }
  return out.sort((a, b) => collator.compare(a.user, b.user));
}

/** Lowercase names of every user in the report, for matching roster seats against it. */
export function reportUsers(store: DataStore): Set<string> {
  const set = new Set<string>();
  for (const v of store.dicts.user.values) {
    const k = rosterKey(v);
    if (k) set.add(k);
  }
  return set;
}

export interface RosterStats {
  seats: number;
  business: number;
  enterprise: number;
  custom: number;
  noPlan: number;
  /** Seats whose user is in the report. Null when no report is loaded. */
  inReport: number | null;
  notInReport: number | null;
}

export function rosterStats(roster: RosterEntry[], inReport: Set<string> | null): RosterStats {
  let business = 0;
  let enterprise = 0;
  let custom = 0;
  let noPlan = 0;
  let present = 0;
  for (const e of roster) {
    if (!e.plan) noPlan++;
    else {
      const c = planCredits(e.plan);
      if (c === BUSINESS) business++;
      else if (c === ENTERPRISE) enterprise++;
      else custom++;
    }
    if (inReport?.has(rosterKey(e.user))) present++;
  }
  return {
    seats: roster.length,
    business,
    enterprise,
    custom,
    noPlan,
    inReport: inReport ? present : null,
    notInReport: inReport ? roster.length - present : null,
  };
}
