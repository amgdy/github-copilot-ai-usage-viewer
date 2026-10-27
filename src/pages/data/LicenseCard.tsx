import { ArrowRight } from 'lucide-react';
import { FeatureIcon } from '../../components/icons';
import { CalcInfo, Callout, Card, DocLinks } from '../../components/ui';
import { t, tp } from '../../i18n';
import type { RosterEntry } from '../../lib/analytics/settings';
import { dayOf, STALE_EXPORT_DAYS, type LicenseReport } from '../../lib/licenses';
import { fmtDay } from '../../lib/utils/date';
import { fmtInt, fmtPct } from '../../lib/utils/format';
import { navigate } from '../../state/router';

/** What kind of list the stored seats came from. The richest source wins when a list mixes them. */
export function rosterKind(roster: readonly RosterEntry[]): 'api' | 'activity' | 'list' | null {
  if (roster.length === 0) return null;
  if (roster.some((seat) => seat.source === 'api')) return 'api';
  if (roster.some((seat) => seat.source === 'activity')) return 'activity';
  return 'list';
}

function kindText(kind: 'api' | 'activity' | 'list'): string {
  if (kind === 'api') return t('Seat list from the GitHub REST API');
  if (kind === 'activity') return t('GitHub Copilot activity report');
  return t('List of usernames, with no activity dates');
}

function asOfText(asOf: string): string {
  const day = dayOf(asOf);
  return day === null ? asOf : fmtDay(day, true);
}

function OpenButton() {
  return (
    <button type="button" className="btn btn-sm" onClick={() => navigate('licenses')}>
      {t('Open the Licenses page')} <ArrowRight size={14} className="rtl:-scale-x-100" />
    </button>
  );
}

interface Props {
  report: LicenseReport | null;
  roster: readonly RosterEntry[];
}

/** A short summary of the stored license list, so the Data page shows everything that was loaded. */
export function LicenseCard({ report, roster }: Props) {
  const kind = rosterKind(roster);
  const title = (
    <span className="inline-flex items-center gap-2">
      <FeatureIcon feature="license" size={16} />
      {t('License list')}
    </span>
  );

  if (!report || kind === null) {
    return (
      <Card title={title} subtitle={t('No license list is loaded.')} actions={<OpenButton />}>
        <p className="text-sm text-fg-muted">
          {t('For most admins, the GitHub Copilot activity report is the easiest license list to get. It adds activity dates; the REST API is an advanced option for plan and seat details.')}
        </p>
        <DocLinks ids={['activityReport', 'seatsApi']} title={t('Learn more')} compact className="mt-3" />
      </Card>
    );
  }

  const stale = report.asOfBehindReport !== null && report.asOfBehindReport > STALE_EXPORT_DAYS;
  return (
    <Card title={title} subtitle={kindText(kind)} actions={<OpenButton />}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-fg-muted">
            {t('Seats')} <CalcInfo id="license-seats" />
          </dt>
          <dd className="num text-base font-semibold">{fmtInt(report.seats)}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">
            {t('Report users with a seat')} <CalcInfo id="license-matched" />
          </dt>
          <dd className="num text-base font-semibold">
            {t('{n} of {total}', { n: fmtInt(report.matched), total: fmtInt(report.reportUsers) })}
            {report.coverage !== null ? <span className="ms-1.5 text-xs font-normal text-fg-muted">({fmtPct(report.coverage)})</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">
            {t('List date')} <CalcInfo id="license-as-of" />
          </dt>
          <dd className="num text-base font-semibold">{report.asOf ? asOfText(report.asOf) : t('Not known')}</dd>
        </div>
      </dl>
      {stale ? (
        <Callout tone="warn" className="mt-3">
          {tp(report.asOfBehindReport ?? 0, 'The list is {n} day older than the last day of the usage report. Export a new list to see current seats.', 'The list is {n} days older than the last day of the usage report. Export a new list to see current seats.', {
            n: fmtInt(report.asOfBehindReport ?? 0),
          })}
        </Callout>
      ) : null}
      <DocLinks ids={['seatsApi', 'activityReport']} title={t('Learn more')} compact className="mt-3" />
    </Card>
  );
}
