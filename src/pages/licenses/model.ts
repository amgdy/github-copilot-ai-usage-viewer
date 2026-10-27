import type { Tone } from '../../components/ui';
import { msg, t } from '../../i18n';
import { PLAN_CREDITS, planCredits } from '../../lib/analytics/settings';
import { STALE_EXPORT_DAYS, dayOf, type ActivityStatus, type LicenseFinding, type LicenseKind, type LicenseReport, type ReclaimReason, type UnmatchedUser } from '../../lib/licenses';
import { fmtDay } from '../../lib/utils/date';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';

// ---- Import -------------------------------------------------------------------------------------

/** A license list is far smaller than this. A bigger file is almost surely the wrong one. */
export const MAX_LICENSE_FILE_BYTES = 25 * 1024 * 1024;
export const LICENSE_FILE_ACCEPT = '.json,.jsonl,.ndjson,.csv,.tsv,.txt,application/json,text/csv,text/plain';

export const ORG_SEATS_COMMAND = 'gh api --paginate /orgs/ORG/copilot/billing/seats > seats.json';
export const ENTERPRISE_SEATS_COMMAND = 'gh api --paginate /enterprises/ENTERPRISE/copilot/billing/seats > seats.json';

/** The kind of license file in plain words. English; show it through t(). */
export const KIND_LABEL: Record<LicenseKind, string> = {
  'seats-json': msg('Seat list from the GitHub API (JSON)'),
  'activity-csv': msg('Activity report from GitHub (CSV)'),
  'seats-csv': msg('Seat list (CSV)'),
  'login-list': msg('List of usernames'),
  unknown: msg('Not a license list'),
};

/** What each kind of file can tell. English; show it through t(). */
export const KIND_NOTE: Record<LicenseKind, string> = {
  'seats-json': msg('It has plans, creation dates, last activity and sign-in dates.'),
  'activity-csv': msg('It has last activity and sign-in dates, but no plans and no creation dates.'),
  'seats-csv': msg('It has the columns that the file holds, such as plan, organization and team.'),
  'login-list': msg('It has no plans and no dates, so the app cannot tell which seats are unused.'),
  unknown: msg('Nothing can be imported from it.'),
};

export const isTooBig = (bytes: number): boolean => bytes > MAX_LICENSE_FILE_BYTES;

/** A YYYY-MM-DD day as "Jun 30, 2026". Text that is not a day comes back as it is. */
export function fmtIsoDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const day = dayOf(iso);
  return day === null ? iso : fmtDay(day, true);
}

// ---- Plans and reasons --------------------------------------------------------------------------

/** A plan in the current language: Business, Enterprise, a custom size, or '' when the list does not say. */
export function planText(plan: string): string {
  const p = plan.trim();
  if (p === '') return '';
  if (p === 'No quota') return t('No included credits');
  const custom = /^Custom \(([\d,]+) credits\)$/.exec(p);
  const credits = custom ? Number(custom[1].replace(/,/g, '')) : planCredits(p);
  if (credits === PLAN_CREDITS.Business) return t('Business');
  if (credits === PLAN_CREDITS.Enterprise) return t('Enterprise');
  if (Number.isFinite(credits) && credits > 0) return t('Custom plan, {n} credits', { n: fmtInt(credits) });
  return p;
}

const REASON_LABEL: Record<ReclaimReason, string> = {
  stale: msg('No activity for 90 days or more'),
};

export const reasonText = (reason: ReclaimReason | undefined): string => (reason ? t(REASON_LABEL[reason]) : '');

// ---- Activity statuses --------------------------------------------------------------------------

/** Positive to negative: in use, slowing down, inactive, uncertain activity date, then no activity data. */
export const STATUS_ORDER: readonly ActivityStatus[] = ['recent', 'fading', 'stale', 'no-date', 'unknown'];

const STATUS_META: Record<ActivityStatus, { label: string; tone: Tone; calc: string }> = {
  recent: { label: msg('Active in the last 30 days'), tone: 'good', calc: 'license-active-recently' },
  fading: { label: msg('Last active 30 to 89 days ago'), tone: 'warn', calc: 'license-fading' },
  stale: { label: msg('No activity for 90 days or more'), tone: 'bad', calc: 'license-status-breakdown' },
  'no-date': { label: msg('No recent activity date'), tone: 'neutral', calc: 'license-no-activity-date' },
  unknown: { label: msg('No activity data'), tone: 'neutral', calc: 'license-status-breakdown' },
};

export interface StatusRow {
  status: ActivityStatus;
  label: string;
  tone: Tone;
  calc: string;
  count: number;
  /** Share of all seats, 0 to 1. */
  share: number;
}

/** Every seat by activity status, positive to negative. Statuses without seats are left out. */
export function statusRows(report: Pick<LicenseReport, 'byStatus' | 'seats'>): StatusRow[] {
  return STATUS_ORDER.filter((s) => report.byStatus[s] > 0).map((status) => {
    const meta = STATUS_META[status];
    const count = report.byStatus[status];
    return { status, label: t(meta.label), tone: meta.tone, calc: meta.calc, count, share: report.seats > 0 ? count / report.seats : 0 };
  });
}

export interface ShareRow {
  id: string;
  label: string;
  count: number;
  share: number;
  calc: string;
}

/** Seats by plan: Business, Enterprise, then other plans (custom or not in the list) when there are any. */
export function planRows(report: Pick<LicenseReport, 'byPlan' | 'seats'>): ShareRow[] {
  const share = (n: number) => (report.seats > 0 ? n / report.seats : 0);
  const rows: ShareRow[] = [
    { id: 'business', label: t('Business'), count: report.byPlan.Business, share: share(report.byPlan.Business), calc: 'license-seats' },
    { id: 'enterprise', label: t('Enterprise'), count: report.byPlan.Enterprise, share: share(report.byPlan.Enterprise), calc: 'license-seats' },
  ];
  if (report.byPlan.other > 0) rows.push({ id: 'other', label: t('Other plan or no plan'), count: report.byPlan.other, share: share(report.byPlan.other), calc: 'license-seats' });
  return rows;
}

/** Where the seats are in the report. The three rows add up to all seats. */
export function placeRows(report: Pick<LicenseReport, 'matched' | 'seenOutsideScope' | 'neverSeen' | 'seats'>): ShareRow[] {
  const share = (n: number) => (report.seats > 0 ? n / report.seats : 0);
  return [
    { id: 'matched', label: t('Seats with usage in this view'), count: report.matched, share: share(report.matched), calc: 'license-matched' },
    { id: 'outside', label: t('Seats with usage outside this view'), count: report.seenOutsideScope, share: share(report.seenOutsideScope), calc: 'license-outside-scope' },
    { id: 'never-seen', label: t('Seats never in the report'), count: report.neverSeen, share: share(report.neverSeen), calc: 'license-never-seen' },
  ];
}

// ---- KPI tiles ----------------------------------------------------------------------------------

export type ListId = 'reclaim' | 'unmatched' | 'fading' | 'no-date' | 'quiet' | 'pending' | 'new';

export interface KpiTile {
  id: string;
  label: string;
  value: string;
  sub: string;
  calc: string | string[];
  tone: Tone;
  /** The list that opens when the tile is clicked. */
  list?: ListId;
}

/** The KPI tiles in impact order: money to save, seats to free, usage without a seat, coverage, seats, seat cost. */
export function kpiTiles(report: LicenseReport): KpiTile[] {
  const freeing = report.reclaim.length;
  return [
    {
      id: 'reclaim-value',
      label: t('Monthly savings from freeing seats'),
      value: fmtUSD(report.reclaimValue),
      sub: report.hasActivity ? t('{amount} a year', { amount: fmtUSD(report.reclaimValue * 12) }) : t('Needs activity data in the list'),
      calc: 'license-reclaim',
      tone: report.reclaimValue > 0 ? 'good' : 'neutral',
      list: 'reclaim',
    },
    {
      id: 'reclaim-count',
      label: t('Seats to free'),
      value: fmtInt(freeing),
      sub: report.seats > 0 ? t('{share} of all seats', { share: fmtPct(freeing / report.seats, 0) }) : '',
      calc: 'license-reclaim',
      tone: freeing > 0 ? 'warn' : 'neutral',
      list: 'reclaim',
    },
    {
      id: 'unmatched',
      label: t('Usage but no seat'),
      value: fmtInt(report.unmatched.length),
      sub: t('{amount} of usage in this period', { amount: fmtUSD(report.unmatchedUsage) }),
      calc: 'license-unmatched',
      tone: report.unmatched.length > 0 ? 'warn' : 'neutral',
      list: 'unmatched',
    },
    {
      id: 'coverage',
      label: t('License coverage'),
      value: report.coverage === null ? '–' : fmtPct(report.coverage, 0),
      sub: t('{matched} of {users} users in the report have a seat', { matched: fmtInt(report.matched), users: fmtInt(report.reportUsers) }),
      calc: 'license-coverage',
      tone: 'neutral',
    },
    {
      id: 'seats',
      label: t('Seats'),
      value: fmtInt(report.seats),
      sub: report.hasActivity ? t('{n} active in the last 30 days', { n: fmtInt(report.byStatus.recent) }) : t('No activity data in the list'),
      calc: report.hasActivity ? ['license-seats', 'license-active-recently'] : 'license-seats',
      tone: 'neutral',
    },
    {
      id: 'seat-cost',
      label: t('Seat cost per month'),
      value: fmtUSD(report.seatCost),
      sub: t('{amount} a year', { amount: fmtUSD(report.seatCost * 12) }),
      calc: 'license-seats',
      tone: 'neutral',
    },
  ];
}

// ---- Lists --------------------------------------------------------------------------------------

/** The lists in impact order: money first, then risk, then lists that only inform. */
export const LIST_ORDER: readonly ListId[] = ['reclaim', 'unmatched', 'fading', 'no-date', 'quiet', 'pending', 'new'];

const LIST_META: Record<ListId, { label: string; description: string; calc: string; file: string }> = {
  reclaim: {
    label: msg('Seats to free'),
    description: msg('Last activity was 90 days or more ago. Blank activity dates are not counted. The most valuable seats come first.'),
    calc: 'license-reclaim',
    file: 'seats-to-free',
  },
  unmatched: {
    label: msg('Usage but no seat'),
    description: msg('Users with usage in the report but no seat in the license list, biggest usage first. Check that the list is complete before you act.'),
    calc: 'license-unmatched',
    file: 'usage-without-seat',
  },
  fading: {
    label: msg('Fading seats'),
    description: msg('Last activity 30 to 89 days ago. A reminder fits better than taking the seat back.'),
    calc: 'license-fading',
    file: 'fading-seats',
  },
  'no-date': {
    label: msg('No recent activity date'),
    description: msg('The file has no last activity date for these seats. A blank date may mean a new seat or activity older than 90 days. Review them before changing access.'),
    calc: 'license-no-activity-date',
    file: 'no-recent-activity-date',
  },
  quiet: {
    label: msg('Quiet but active'),
    description: msg('Active in the last 30 days but no usage in the report. Code completions are not in the report, so do not free these seats.'),
    calc: 'license-quiet',
    file: 'quiet-seats',
  },
  pending: {
    label: msg('Pending cancellation'),
    description: msg('Seats that already end on a set date. They are not counted as savings.'),
    calc: 'license-pending-cancellation',
    file: 'pending-cancellation',
  },
  new: {
    label: msg('New seats'),
    description: msg('Seats created within the new user window. They are never on the list of seats to free.'),
    calc: 'license-new-seats',
    file: 'new-seats',
  },
};

export const listLabel = (id: ListId): string => t(LIST_META[id].label);
export const listDescription = (id: ListId): string => t(LIST_META[id].description);
export const listCalc = (id: ListId): string => LIST_META[id].calc;
/** The CSV file name without the extension. */
export const listExportName = (id: ListId): string => `github-copilot-licenses-${LIST_META[id].file}`;

/** The seats on one list, in the order of the license report. */
export function findingsOf(report: LicenseReport, id: Exclude<ListId, 'unmatched'>): LicenseFinding[] {
  switch (id) {
    case 'reclaim':
      return report.reclaim;
    case 'fading':
      return report.fading;
    case 'no-date':
      return report.noActivityDate;
    case 'quiet':
      return report.quiet;
    case 'pending':
      return report.pending;
    case 'new':
      return report.newSeats;
  }
}

export const listCount = (report: LicenseReport, id: ListId): number => (id === 'unmatched' ? report.unmatched.length : findingsOf(report, id).length);

/** The first list with rows, in impact order. The seats to free when every list is empty. */
export const firstList = (report: LicenseReport): ListId => LIST_ORDER.find((id) => listCount(report, id) > 0) ?? 'reclaim';

// ---- Table columns ------------------------------------------------------------------------------

export type Cell = string | number | null;
export type CellFormat = 'user' | 'text' | 'plan' | 'usd' | 'int' | 'date';

/** One table column without the React parts, so the columns and the CSV can be tested. */
export interface Field<T> {
  key: string;
  header: string;
  csvHeader?: string;
  hint?: string;
  calc?: string;
  align?: 'end';
  hidden?: boolean;
  format: CellFormat;
  /** The plain value for sorting, searching and the CSV. */
  value: (row: T) => Cell;
  /** Add the column up in the footer. */
  sum?: boolean;
}

const cents = (v: number): number => Math.round(v * 100) / 100;
const orNull = (s: string): string | null => (s === '' ? null : s);

type FindingField = Field<LicenseFinding>;

const userField = (): FindingField => ({
  key: 'user',
  header: t('User'),
  hint: t('Click a user who is in the report to see their details.'),
  format: 'user',
  value: (f) => f.login,
});
const nameField = (): FindingField => ({ key: 'name', header: t('Name'), hidden: true, format: 'text', value: (f) => orNull(f.name) });
const reasonField = (): FindingField => ({ key: 'reason', header: t('Reason'), calc: 'license-reclaim', format: 'text', value: (f) => orNull(reasonText(f.reason)) });
const planField = (): FindingField => ({ key: 'plan', header: t('Plan'), calc: 'license-seats', format: 'plan', value: (f) => orNull(f.plan) });
const orgField = (): FindingField => ({ key: 'org', header: t('Organization'), format: 'text', value: (f) => orNull(f.org) });
const teamField = (hidden: boolean): FindingField => ({ key: 'team', header: t('Team'), hidden, format: 'text', value: (f) => orNull(f.team) });
const daysField = (): FindingField => ({
  key: 'days',
  header: t('Days since activity'),
  hint: t('Days from the last activity to the date of the license list. Empty when the list shows no activity.'),
  calc: 'license-as-of',
  align: 'end',
  format: 'int',
  value: (f) => f.daysSinceActivity,
});
const lastActivityField = (): FindingField => ({ key: 'lastActivity', header: t('Last activity'), calc: 'license-as-of', format: 'date', value: (f) => orNull(f.lastActivityAt) });
const surfaceField = (hidden: boolean): FindingField => ({
  key: 'surface',
  header: t('Last used in'),
  hint: t('The editor or place of the last activity, as the license list writes it.'),
  hidden,
  format: 'text',
  value: (f) => orNull(f.lastSurface),
});
const createdField = (hidden: boolean): FindingField => ({ key: 'created', header: t('Seat since'), calc: 'license-new-seats', hidden, format: 'date', value: (f) => orNull(f.createdAt) });
const endsField = (): FindingField => ({ key: 'ends', header: t('Ends on'), calc: 'license-pending-cancellation', format: 'date', value: (f) => orNull(f.pendingCancellation) });
const usageField = (): FindingField => ({
  key: 'usage',
  header: t('Usage in this period'),
  csvHeader: t('Usage in this period (USD)'),
  calc: 'usage',
  align: 'end',
  format: 'usd',
  value: (f) => cents(f.usage),
  sum: true,
});
const priceField = (asValue: boolean): FindingField => ({
  key: 'price',
  header: asValue ? t('Value per month') : t('Seat price per month'),
  csvHeader: asValue ? t('Value per month (USD)') : t('Seat price per month (USD)'),
  calc: asValue ? 'license-reclaim' : 'license-seats',
  align: 'end',
  format: 'usd',
  value: (f) => cents(f.seatPrice),
  sum: true,
});

/** The columns of one seat list. Hidden columns can be turned on from the Columns menu. */
export function findingFields(id: Exclude<ListId, 'unmatched'>): FindingField[] {
  switch (id) {
    case 'reclaim':
      return [userField(), nameField(), reasonField(), planField(), orgField(), teamField(true), daysField(), lastActivityField(), surfaceField(true), createdField(true), usageField(), priceField(true)];
    case 'fading':
      return [userField(), nameField(), planField(), orgField(), teamField(true), daysField(), lastActivityField(), surfaceField(false), usageField(), priceField(false)];
    case 'quiet':
      return [userField(), nameField(), planField(), orgField(), teamField(true), daysField(), lastActivityField(), surfaceField(false), priceField(false)];
    case 'pending':
      return [userField(), nameField(), planField(), orgField(), teamField(true), endsField(), lastActivityField(), usageField(), priceField(false)];
    case 'new':
      return [userField(), nameField(), planField(), orgField(), teamField(true), createdField(false), daysField(), lastActivityField(), usageField(), priceField(false)];
    case 'no-date':
      return [userField(), nameField(), planField(), orgField(), teamField(false), lastActivityField(), surfaceField(false), createdField(false), usageField(), priceField(false)];
  }
}

/** The columns of the users with usage but no seat. */
export function unmatchedFields(): Field<UnmatchedUser>[] {
  return [
    { key: 'user', header: t('User'), hint: t('Click a user to see their details.'), format: 'user', value: (u) => u.name },
    { key: 'org', header: t('Organization'), format: 'text', value: (u) => orNull(u.org) },
    {
      key: 'plan',
      header: t('Plan in the report'),
      hint: t('The plan read from the monthly included credits of the user in the report.'),
      format: 'plan',
      value: (u) => orNull(u.plan),
    },
    {
      key: 'usage',
      header: t('Usage in this period'),
      csvHeader: t('Usage in this period (USD)'),
      calc: 'license-unmatched',
      align: 'end',
      format: 'usd',
      value: (u) => cents(u.usage),
      sum: true,
    },
  ];
}

/** The CSV of a table: the headers and rows of the visible columns, as the table export writes them. */
export function csvOf<T>(fields: readonly Field<T>[], rows: readonly T[]): { headers: string[]; rows: Cell[][] } {
  const visible = fields.filter((f) => !f.hidden);
  return { headers: visible.map((f) => f.csvHeader ?? f.header), rows: rows.map((r) => visible.map((f) => f.value(r))) };
}

// ---- Users in the report ------------------------------------------------------------------------

/** Report user id by lower-case login. The first profile wins (profiles come biggest usage first). */
export function profileIds(profiles: readonly { id: number; name: string }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of profiles) {
    const key = p.name.trim().toLowerCase();
    if (key !== '' && !out.has(key)) out.set(key, p.id);
  }
  return out;
}

// ---- As-of date and scope -----------------------------------------------------------------------

export interface AsOfInfo {
  /** The as-of date as text, or '' when the list has no dates. */
  date: string;
  source: LicenseReport['asOfSource'];
  /** Days the usage report runs past the as-of date. */
  behind: number | null;
  /** The export is more than STALE_EXPORT_DAYS older than the report. */
  stale: boolean;
}

export function asOfInfo(report: Pick<LicenseReport, 'asOf' | 'asOfSource' | 'asOfBehindReport'>): AsOfInfo {
  const behind = report.asOfBehindReport;
  return { date: fmtIsoDay(report.asOf), source: report.asOfSource, behind, stale: behind !== null && behind > STALE_EXPORT_DAYS };
}

/**
 * What the filters do to this page. 'rows': a row filter narrows the report users, while the seat numbers still cover the
 * whole organization. 'segments': only segment filters are on, and they change nothing here. 'none': no filter.
 */
export function scopeOf(narrowed: boolean, scoped: boolean): 'none' | 'rows' | 'segments' {
  if (!narrowed) return 'none';
  return scoped ? 'rows' : 'segments';
}
