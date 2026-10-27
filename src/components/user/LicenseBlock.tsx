import type { ReactNode } from 'react';
import { t, tp } from '../../i18n';
import type { ProfileLicense } from '../../lib/licenses';
import { fmtInt } from '../../lib/utils/format';
import { navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { FeatureIcon } from '../icons';
import { Badge } from '../ui';
import { DrawerSection } from './DrawerSection';
import { SEAT_STATUS_TONE, licenseDay, seatPlanLabel, seatStatusHint, seatStatusLabel, seatStatusOf } from './license';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border-muted py-1.5 last:border-b-0">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="num text-end text-xs font-medium text-fg">{children}</dd>
    </div>
  );
}

/** What the license list says about the seat of one user. Shown only when a license list is loaded. */
export function LicenseBlock({ license }: { license: ProfileLicense }) {
  const status = seatStatusOf(license);
  if (!status) return null;
  const openLicenses = () => {
    useApp.getState().selectUser(null);
    navigate('licenses');
  };

  return (
    <DrawerSection
      title={t('License')}
      calc={['license-matched', 'user-seat-status']}
      aside={
        <Badge tone={SEAT_STATUS_TONE[status]} title={seatStatusHint(status)}>
          <FeatureIcon feature="license" size={12} />
          {seatStatusLabel(status)}
        </Badge>
      }
    >
      {license.seat ? (
        <dl className="rounded-lg border border-border-muted bg-surface-2 px-3 py-1">
          <Row label={t('Plan')}>{license.plan ? seatPlanLabel(license.plan) : t('Not in the export')}</Row>
          <Row label={t('License since')}>{licenseDay(license.createdAt) || t('Not in the export')}</Row>
          <Row label={t('Last activity')}>
            {license.lastActivityAt
              ? license.daysSinceActivity !== null
                ? tp(license.daysSinceActivity, '{date} (1 day before the export)', '{date} ({n} days before the export)', {
                    date: licenseDay(license.lastActivityAt),
                    n: fmtInt(license.daysSinceActivity),
                  })
                : licenseDay(license.lastActivityAt)
              : t('None')}
          </Row>
          {license.lastSurface ? <Row label={t('Last used in')}>{license.lastSurface}</Row> : null}
          {license.pendingCancellation ? (
            <Row label={t('Cancellation date')}>{licenseDay(license.pendingCancellation)}</Row>
          ) : null}
        </dl>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-fg-muted">
          {t('No seat in the license list. This user has usage in the report, so check how they get access.')}
        </p>
      )}
      <p className="text-xs text-fg-muted">
        {seatStatusHint(status)}{' '}
        <button type="button" className="text-accent hover:underline" onClick={openLicenses}>
          {t('Open the Licenses page')}
        </button>
      </p>
    </DrawerSection>
  );
}
