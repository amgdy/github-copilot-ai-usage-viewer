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
  const seatText = (p: UserProfile, pick: (l: NonNullable<UserProfile['license']>) => string): string =>
    p.license?.seat ? pick(p.license) : '';
  const seatCell = (p: UserProfile, pick: (l: NonNullable<UserProfile['license']>) => string) => {
    const text = seatText(p, pick);
    return text ? text : dash;
  };

  return [
    {
      key: 'seatStatus',
      header: t('Seat status'),
      hint: t('Recently active, fading (30 to 89 days), inactive (90 days or more), no recent activity date, or no seat in the license list'),
      calc: ['license-active-recently', 'license-fading', 'license-reclaim', 'license-no-activity-date', 'license-unmatched'],
      value: (p) => {
        const id = seatStatusOf(p.license);
        return id === null ? '' : seatStatusLabel(id);
      },
      render: (p) => {
        const id = seatStatusOf(p.license);
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
      value: (p) => seatText(p, (l) => seatPlanLabel(l.plan)),
      render: (p) => seatCell(p, (l) => seatPlanLabel(l.plan)),
    },
    {
      key: 'lastActivity',
      header: t('Last activity'),
      hint: t('The last day the license list shows activity for this seat'),
      calc: 'license-as-of',
      value: (p) => seatText(p, (l) => l.lastActivityAt),
      render: (p) => seatCell(p, (l) => licenseDay(l.lastActivityAt)),
    },
    {
      key: 'daysSinceActivity',
      header: t('Days since last activity'),
      hint: t('Days from the last activity to the date of the license list'),
      calc: 'license-as-of',
      value: (p) => (p.license?.seat && p.license.daysSinceActivity !== null ? p.license.daysSinceActivity : Number.NaN),
      render: (p) => (p.license?.seat && p.license.daysSinceActivity !== null ? fmtInt(p.license.daysSinceActivity) : dash),
      align: 'end',
    },
    {
      key: 'lastSurface',
      header: t('Last used in'),
      hint: t('The editor or place of the last activity, as the license list names it'),
      calc: ['user-seat-status', 'license-import'],
      value: (p) => seatText(p, (l) => l.lastSurface),
      render: (p) => seatCell(p, (l) => l.lastSurface),
    },
    {
      key: 'seatSince',
      header: t('Seat since'),
      hint: t('The day the seat was created'),
      calc: 'license-new-seats',
      value: (p) => seatText(p, (l) => l.createdAt),
      render: (p) => seatCell(p, (l) => licenseDay(l.createdAt)),
      hidden: true,
    },
    {
      key: 'pendingCancellation',
      header: t('Cancellation date'),
      hint: t('The day a scheduled cancellation of the seat takes effect'),
      calc: 'license-pending-cancellation',
      value: (p) => seatText(p, (l) => l.pendingCancellation),
      render: (p) => seatCell(p, (l) => licenseDay(l.pendingCancellation)),
      hidden: true,
    },
  ];
}
