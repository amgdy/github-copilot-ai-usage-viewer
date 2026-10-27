import { t, tp } from '../../i18n/core.ts';
import { RECLAIM_DAYS, type ActivityStatus } from './activity';
import type { ReclaimReason } from './insights';
import type { LicenseKind } from './types';

/*
 * Plain words for the codes of the license library, in the current language. Call them where the text is shown
 * (inside a component or a function), never at module level, so a change of language is picked up.
 */

/** What an uploaded license file turned out to be. */
export function licenseKindText(kind: LicenseKind): string {
  switch (kind) {
    case 'seats-json':
      return t('Seat list from GitHub (JSON)');
    case 'activity-csv':
      return t('GitHub Copilot activity report (CSV)');
    case 'seats-csv':
      return t('Seat list (CSV)');
    case 'login-list':
      return t('List of usernames');
    case 'unknown':
      return t('Not a license list');
  }
}

/** How recently a seat was used, from the license list alone. */
export function activityStatusText(status: ActivityStatus): string {
  switch (status) {
    case 'recent':
      return t('Recently active');
    case 'fading':
      return t('Fading');
    case 'stale':
      return t('Inactive');
    case 'no-date':
      return t('No recent activity date');
    case 'unknown':
      return t('No activity data');
  }
}

/** Why a seat is on the list of seats to free. */
export function reclaimReasonText(reason: ReclaimReason): string {
  switch (reason) {
    case 'stale':
      return tp(RECLAIM_DAYS, 'No activity for {n} day or more', 'No activity for {n} days or more');
  }
}
