import { seatCredits, seatPrice, type RosterEntry } from '../../lib/analytics/settings';
import type { UserProfile, UserSet } from '../../lib/analytics/users';
import { buildLicenseIndex } from '../../lib/licenses';
import { firstListed } from './dimensions';

/** Seats and usage of one organization. The organization of a seat is the first one the license list names for it. */
export interface OrgSeatRow {
  /** Lowercase organization name. '' for the seats and users whose organization is not known. */
  key: string;
  /** The name to show: the report spelling when the report names the organization, else the license list spelling. */
  name: string;
  known: boolean;
  /** The organization as the report spells it, the value a filter expects. Null when the report does not name it. */
  value: string | null;
  /** Seats in the license list. */
  seats: number;
  /** Seats whose holder has usage in the view. */
  used: number;
  /** Seats whose holder has no usage in the view: seats minus used. */
  unused: number;
  /** People with usage in the view who hold no seat in the license list. */
  noSeat: number;
  noSeatUsage: number;
  /** What the seats cost per month at the seat prices (USD). */
  seatCost: number;
  /** Usage of the seat holders in the view (USD). */
  holderUsage: number;
  /** Usage of the seat holders per month for each seat. NaN when the organization has no seats. */
  perSeat: number;
}

export interface OrgSeatCoverage {
  rows: OrgSeatRow[];
  totals: Omit<OrgSeatRow, 'key' | 'name' | 'known' | 'value'>;
  /** Seats the license list names more than one organization for. They count in the first one. */
  multiOrg: number;
}

export interface SeatCoverageInput {
  /** Users whose usage and organization count. The page passes the row-filtered users, as the Licenses page does. */
  users: Pick<UserSet, 'profiles'>;
  /** Users of the row-filtered report: their included credits price the custom plans, as on the Licenses page. */
  population: Pick<UserSet, 'profiles' | 'fallbackQuotaCredits'>;
  roster: readonly RosterEntry[];
  rosterAsOf?: string;
  /** The organization names of the report, as the report spells them. */
  orgValues: readonly string[];
  /** Days in a month divided by the days of the range. */
  perMonth: number;
}

interface ReportUser {
  profile: UserProfile;
  usage: number;
}

/** Profiles merged by login, ignoring case, as the Licenses page does. */
function byLogin(profiles: readonly UserProfile[]): Map<string, ReportUser> {
  const out = new Map<string, ReportUser>();
  for (const profile of profiles) {
    const key = profile.name.trim().toLowerCase();
    const have = out.get(key);
    if (have === undefined) out.set(key, { profile: profile, usage: profile.gross });
    else have.usage += profile.gross;
  }
  return out;
}

/** Seats, used seats, people without a seat and seat cost per organization. Null when no license list is loaded. */
export function seatCoverageByOrg(input: SeatCoverageInput): OrgSeatCoverage | null {
  const index = buildLicenseIndex(input.roster, input.rosterAsOf);
  if (index === null) return null;

  const reportOrgs = new Map<string, string>();
  for (const org of input.orgValues) {
    if (org === '') continue;
    const key = org.trim().toLowerCase();
    if (!reportOrgs.has(key)) reportOrgs.set(key, org);
  }

  const rows = new Map<string, OrgSeatRow>();
  const rowOf = (raw: string): OrgSeatRow => {
    const name = raw.trim();
    const key = name.toLowerCase();
    let row = rows.get(key);
    if (row === undefined) {
      const value = key === '' ? null : (reportOrgs.get(key) ?? null);
      row = {
        key,
        name: value ?? name,
        known: key !== '',
        value,
        seats: 0,
        used: 0,
        unused: 0,
        noSeat: 0,
        noSeatUsage: 0,
        seatCost: 0,
        holderUsage: 0,
        perSeat: Number.NaN,
      };
      rows.set(key, row);
    }
    return row;
  };

  const inView = byLogin(input.users.profiles);
  const priced = byLogin(input.population.profiles);
  const fallback = input.population.fallbackQuotaCredits;
  let multiOrg = 0;

  for (const [key, entry] of index.seats) {
    const user = inView.get(key);
    const listed = firstListed(entry.org);
    if (listed !== '' && (entry.org ?? '').replace(/\s\+\d+\s*$/, '').includes(', ')) multiOrg++;
    const row = rowOf(listed !== '' ? listed : (user?.profile.org ?? ''));
    const own = priced.get(key)?.profile.quotaCredits ?? 0;
    row.seats++;
    row.seatCost += seatPrice(seatCredits(entry.plan, own > 0 ? own : fallback));
    if (user !== undefined) {
      row.used++;
      row.holderUsage += user.usage;
    }
  }

  for (const [key, user] of inView) {
    if (index.seats.has(key)) continue;
    const row = rowOf(user.profile.org);
    row.noSeat++;
    row.noSeatUsage += user.usage;
  }

  const totals: OrgSeatCoverage['totals'] = { seats: 0, used: 0, unused: 0, noSeat: 0, noSeatUsage: 0, seatCost: 0, holderUsage: 0, perSeat: Number.NaN };
  for (const row of rows.values()) {
    row.unused = row.seats - row.used;
    row.perSeat = row.seats > 0 ? (row.holderUsage * input.perMonth) / row.seats : Number.NaN;
    totals.seats += row.seats;
    totals.used += row.used;
    totals.unused += row.unused;
    totals.noSeat += row.noSeat;
    totals.noSeatUsage += row.noSeatUsage;
    totals.seatCost += row.seatCost;
    totals.holderUsage += row.holderUsage;
  }
  totals.perSeat = totals.seats > 0 ? (totals.holderUsage * input.perMonth) / totals.seats : Number.NaN;

  const list = [...rows.values()].sort(
    (a, b) =>
      Number(b.known) - Number(a.known) ||
      b.seatCost - a.seatCost ||
      b.holderUsage + b.noSeatUsage - (a.holderUsage + a.noSeatUsage) ||
      a.name.localeCompare(b.name),
  );
  return { rows: list, totals, multiOrg };
}
