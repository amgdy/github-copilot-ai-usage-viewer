import { Callout, TaxBadge } from '../../components/ui';
import { t } from '../../i18n';
import { POST_LIST_KEYS, type Filters } from '../../lib/analytics/filters';
import { CREDIT_USD } from '../../lib/types';
import { fmtInt, fmtUSD, pluralize } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import type { LensData } from './lenses';

function clearSegmentFilters(): void {
  const patch: Partial<Filters> = { minUserSpend: null, maxUserSpend: null };
  for (const key of POST_LIST_KEYS) patch[key] = [];
  useApp.getState().setFilters(patch);
}

interface Props {
  data: LensData;
  segmentFiltered: boolean;
  /** Users in scope, and how many of them have no seat in the report. */
  users: number;
  assumedSeats: number;
  fallbackQuotaCredits: number;
}

/** Caveats that depend on the data in view and on the selected lens. Renders nothing when there are none. */
export function LensNotes({ data, segmentFiltered, users, assumedSeats, fallbackQuotaCredits }: Props) {
  const missing = data.lens.id === 'trait' ? data.rows.filter((row) => row.unavailable) : [];
  if (!segmentFiltered && assumedSeats === 0 && missing.length === 0) return null;

  const assumed = t('{credits} credits ({amount}) a month', { credits: fmtInt(fallbackQuotaCredits), amount: fmtUSD(fallbackQuotaCredits * CREDIT_USD, 0) });
  const noSeats = assumedSeats >= users;

  return (
    <div className="space-y-3">
      {segmentFiltered ? (
        <Callout
          tone="info"
          title={t('Segment filters are on')}
          action={
            <button type="button" className="btn btn-sm" onClick={clearSegmentFilters}>
              {t('Clear segment filters')}
            </button>
          }
        >
          {t('Other pages list only the selected groups. Group sizes and shares here ignore these filters, so you can still compare every group. Selected groups are marked In filter.')}
        </Callout>
      ) : null}
      {assumedSeats > 0 ? (
        <Callout
          tone="info"
          title={noSeats ? t('This report does not say which seats users have') : t('{users} without seat information', { users: pluralize(assumedSeats, 'user') })}
        >
          {noSeats
            ? t('Included credits are unknown, so the usage tier and the persona assume {assumed} for everyone. Included credits and pool figures are not shown.', { assumed })
            : t('Their included credits are assumed to be {assumed}, the most common seat in the data. This affects their usage tier and persona.', { assumed })}
        </Callout>
      ) : null}
      {missing.length > 0 ? (
        <Callout tone="info" title={t('Some traits cannot be detected in this data')}>
          <ul className="mt-1 space-y-1">
            {missing.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <TaxBadge item={row.item} />
                <span>{row.unavailable}</span>
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}
    </div>
  );
}
