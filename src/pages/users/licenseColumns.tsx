import { Badge, type Column } from '../../components/ui';
import {
  SEAT_STATUS_TONE,
  licenseDay,
  seatPlanLabel,
  seatStatusHint,
  seatStatusLabel,
  seatStatusOf,
} from '../../components/user/license';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtInt } from '../../lib/utils/format';
import { dash } from './columnKit';

/**
 * The columns of the License view, from the license list (`profile.license`). Build them only when a list is loaded.
 * A user with usage but no seat gets "No seat" and blank seat details.
 */
export function licenseColumns(): Column<UserProfile>[] {
  const seatText = (user: UserProfile, pick: (license: NonNullable<UserProfile['license']>) => string): string =>
    user.license?.seat ? pick(user.license) : '';
  const seatCell = (user: UserProfile, pick: (license: NonNullable<UserProfile['license']>) => string) => {
    const text = seatText(user, pick);
    return text ? text : dash;
  };

  return [
    {
      key: 'seatStatus',
      header: t('Seat status'),
      hint: t('Recently active, fading (30 to 89 days), inactive (90 days or more), no recent activity date, or no seat in the license list'),
      calc: ['license-active-recently', 'license-fading', 'license-reclaim', 'license-no-activity-date', 'license-unmatched'],
      value: (user) => {
        const id = seatStatusOf(user.license);
        return id === null ? '' : seatStatusLabel(id);
      },
      render: (user) => {
        const id = seatStatusOf(user.license);
        if (id === null) return dash;
        return (
          <Badge tone={SEAT_STATUS_TONE[id]} title={seatStatusHint(id)}>
            {seatStatusLabel(id)}
          </Badge>
        );
      },
    },
    {
      key: 'seatPlan',
      header: t('Seat plan'),
      hint: t('The plan of the seat in the license list'),
      calc: 'license-seats',
      value: (user) => seatText(user, (license) => seatPlanLabel(license.plan)),
      render: (user) => seatCell(user, (license) => seatPlanLabel(license.plan)),
    },
    {
      key: 'lastActivity',
      header: t('Last activity'),
      hint: t('The last day the license list shows activity for this seat'),
      calc: 'license-as-of',
      value: (user) => seatText(user, (license) => license.lastActivityAt),
      render: (user) => seatCell(user, (license) => licenseDay(license.lastActivityAt)),
    },
    {
      key: 'daysSinceActivity',
      header: t('Days since last activity'),
      hint: t('Days from the last activity to the date of the license list'),
      calc: 'license-as-of',
      value: (user) => (user.license?.seat && user.license.daysSinceActivity !== null ? user.license.daysSinceActivity : Number.NaN),
      render: (user) => (user.license?.seat && user.license.daysSinceActivity !== null ? fmtInt(user.license.daysSinceActivity) : dash),
      align: 'end',
    },
    {
      key: 'lastSurface',
      header: t('Last used in'),
      hint: t('The editor or place of the last activity, as the license list names it'),
      calc: ['user-seat-status', 'license-import'],
      value: (user) => seatText(user, (license) => license.lastSurface),
      render: (user) => seatCell(user, (license) => license.lastSurface),
    },
    {
      key: 'seatSince',
      header: t('Seat since'),
      hint: t('The day the seat was created'),
      calc: 'license-new-seats',
      value: (user) => seatText(user, (license) => license.createdAt),
      render: (user) => seatCell(user, (license) => licenseDay(license.createdAt)),
      hidden: true,
    },
    {
      key: 'pendingCancellation',
      header: t('Cancellation date'),
      hint: t('The day a scheduled cancellation of the seat takes effect'),
      calc: 'license-pending-cancellation',
      value: (user) => seatText(user, (license) => license.pendingCancellation),
      render: (user) => seatCell(user, (license) => licenseDay(license.pendingCancellation)),
      hidden: true,
    },
  ];
}
