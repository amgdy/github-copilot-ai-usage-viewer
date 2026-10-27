import { msg, t } from '../../i18n';
import type { Tone } from '../ui';
import { dayOf, type ProfileLicense } from '../../lib/licenses';
import { fmtDay } from '../../lib/utils/date';

/**
 * What the license list says about the seat of a report user. The activity statuses come from the license library
 * (recent under 30 days, fading 30 to 89, stale 90 or more, or no recent activity date); `none` is a user with usage but no seat in the list.
 */
export type SeatStatusId = 'recent' | 'fading' | 'stale' | 'no-date' | 'unknown' | 'none';

/** Good to bad, the order of every list and legend of seat statuses. */
export const SEAT_STATUS_ORDER: readonly SeatStatusId[] = ['recent', 'fading', 'stale', 'no-date', 'unknown', 'none'];

const STATUS_LABEL: Record<SeatStatusId, string> = {
  recent: msg('Recently active'),
  fading: msg('Fading'),
  stale: msg('Inactive'),
  'no-date': msg('No recent activity date'),
  unknown: msg('No activity data'),
  none: msg('No seat'),
};

const STATUS_HINT: Record<SeatStatusId, string> = {
  recent: msg('The license list shows activity in the last 30 days.'),
  fading: msg('The license list shows the last activity 30 to 89 days ago.'),
  stale: msg('The license list shows no activity for 90 days or more.'),
  'no-date': msg('A blank activity date can mean a new seat or activity older than 90 days. It does not prove that the seat was never used.'),
  unknown: msg('The license list has no activity dates, so it cannot say how active this seat is.'),
  none: msg('This user has usage in the report but no seat in the license list.'),
};

export const SEAT_STATUS_TONE: Record<SeatStatusId, Tone> = {
  recent: 'good',
  fading: 'warn',
  stale: 'bad',
  'no-date': 'neutral',
  unknown: 'neutral',
  none: 'warn',
};

/** The seat status of a user. Null when no license list is loaded. */
export function seatStatusOf(license: ProfileLicense | null | undefined): SeatStatusId | null {
  if (!license) return null;
  return license.seat ? license.status : 'none';
}

export const seatStatusLabel = (id: SeatStatusId): string => t(STATUS_LABEL[id]);
export const seatStatusHint = (id: SeatStatusId): string => t(STATUS_HINT[id]);

/** Business and Enterprise in the reader's language; a custom plan as the export writes it. */
export function seatPlanLabel(plan: string): string {
  if (plan === 'Business') return t('Business');
  if (plan === 'Enterprise') return t('Enterprise');
  return plan;
}

/** A YYYY-MM-DD day of the license list as "Mar 4, 2025". The text as it is when it is not a valid day, '' when empty. */
export function licenseDay(iso: string): string {
  if (!iso) return '';
  const day = dayOf(iso);
  return day === null ? iso : fmtDay(day, true);
}
