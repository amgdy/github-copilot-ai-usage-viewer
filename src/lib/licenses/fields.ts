import { readDay } from './dates';
import type { SeatField } from './columns';
import { readLogin } from './login';
import { readPlan } from './plan';
import type { LicenseSeat, SeatSource } from './types';

/** Counts of values that were present but could not be read, for the notes shown to the user. */
export interface ReadStats {
  unreadableDates: number;
  unreadablePlans: number;
}

export const newReadStats = (): ReadStats => ({ unreadableDates: 0, unreadablePlans: 0 });

/** Gives the text of one field of a record, or undefined when the record has none. */
export type FieldGetter = (field: SeatField) => string | undefined;

const MAX_NAME = 100;
const MAX_EMAIL = 120;
const MAX_ORG = 60;
const MAX_TEAM = 100;
const MAX_SURFACE = 40;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

const clean = (s: string | undefined, max: number): string | undefined => {
  if (s === undefined) return undefined;
  const t = s.trim();
  return t === '' ? undefined : t.slice(0, max);
};

/** The product of a surface such as "vscode/1.97.1/copilot-chat/0.24.1", which is "vscode". */
export function surfaceName(raw: string | undefined): string | undefined {
  const s = clean(raw, 200);
  if (s === undefined) return undefined;
  const head = s.split('/')[0].trim();
  return head === '' ? undefined : head.slice(0, MAX_SURFACE);
}

/** Builds a seat from the fields of one record. Null when the record has no usable login. */
export function seatFromFields(get: FieldGetter, source: SeatSource, stats: ReadStats): LicenseSeat | null {
  const login = readLogin(get('login'));
  if (login === null) return null;
  const seat: LicenseSeat = { login, orgs: [], teams: [], source };

  const name = clean(get('name'), MAX_NAME);
  if (name !== undefined) seat.name = name;
  const email = clean(get('email'), MAX_EMAIL);
  if (email !== undefined && EMAIL.test(email)) seat.email = email;

  const planRaw = get('plan');
  if (planRaw !== undefined) {
    const plan = readPlan(planRaw);
    if (plan === null) stats.unreadablePlans++;
    else if (plan !== undefined) seat.plan = plan;
  }

  const org = clean(get('org'), MAX_ORG);
  if (org !== undefined) seat.orgs.push(org);
  const team = clean(get('team'), MAX_TEAM);
  if (team !== undefined) seat.teams.push(team);

  const day = (field: SeatField): string | undefined => {
    const d = readDay(get(field));
    if (d === null) {
      stats.unreadableDates++;
      return undefined;
    }
    return d;
  };
  const createdAt = day('created');
  if (createdAt !== undefined) seat.createdAt = createdAt;
  const lastActivityAt = day('activity');
  if (lastActivityAt !== undefined) seat.lastActivityAt = lastActivityAt;
  const lastAuthenticatedAt = day('authenticated');
  if (lastAuthenticatedAt !== undefined) seat.lastAuthenticatedAt = lastAuthenticatedAt;
  const pendingCancellation = day('cancellation');
  if (pendingCancellation !== undefined) seat.pendingCancellation = pendingCancellation;

  const surface = surfaceName(get('surface'));
  if (surface !== undefined) seat.lastSurface = surface;
  return seat;
}
