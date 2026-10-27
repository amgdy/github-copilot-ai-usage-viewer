import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { SampleListNote } from '../../components/layout/SampleNotice';
import { Callout, Card, DocLinks } from '../../components/ui';
import { t, tp } from '../../i18n';
import { DEFAULT_SETTINGS, type RosterEntry } from '../../lib/analytics/settings';
import { fmtInt } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { LicenseImport } from '../licenses/LicenseImport';
import { fmtIsoDay } from '../licenses/model';
import { ExtraSeatsCard } from './ExtraSeatsCard';
import { rosterStats, reportUsers, type RosterStats } from './roster';
import { RosterImport } from './RosterImport';
import { RosterList } from './RosterList';
import { ResetButton, SettingsSection } from './SettingsSection';

const seats = (n: number) => tp(n, '{n} seat', '{n} seats', { n: fmtInt(n) });

function describe(s: RosterStats): string {
  if (s.seats === 0) return t('No seats yet.');
  const parts = [
    s.business > 0 ? t('{n} Business', { n: fmtInt(s.business) }) : '',
    s.enterprise > 0 ? t('{n} Enterprise', { n: fmtInt(s.enterprise) }) : '',
    s.custom > 0 ? t('{n} with a custom plan', { n: fmtInt(s.custom) }) : '',
    s.noPlan > 0 ? t('{n} with no plan', { n: fmtInt(s.noPlan) }) : '',
  ].filter(Boolean);
  const head = t('{seats}: {plans}.', { seats: seats(s.seats), plans: parts.join(t(', ')) });
  if (s.inReport === null) return head;
  return `${head} ${t('{inReport} appear in the report and {notInReport} do not.', { inReport: fmtInt(s.inReport), notInReport: fmtInt(s.notInReport ?? 0) })}`;
}

export function RosterSection() {
  const roster = useApp((s) => s.settings.roster);
  const rosterAsOf = useApp((s) => s.settings.rosterAsOf);
  const saved = useApp((s) => s.settingsSaved);
  // The sample's made-up users are never compared with the saved list, which holds real people.
  const store = useApp((s) => (s.dataset?.sample ? null : s.dataset?.store)) ?? null;
  const update = useApp((s) => s.updateSettings);

  const inReport = useMemo(() => (store ? reportUsers(store) : null), [store]);
  const stats = useMemo(() => rosterStats(roster, inReport), [roster, inReport]);
  const setRoster = (next: RosterEntry[]) => update({ roster: next });

  return (
    <SettingsSection
      id="roster"
      description={t('Tell the app about seats that never show up in the report.')}
      onReset={() => update({ roster: [], rosterAsOf: undefined, extraSeats: { ...DEFAULT_SETTINGS.extraSeats } })}
      confirmReset={t('Remove the license list and the extra seats?')}
    >
      <SampleListNote />
      <Callout tone="info" title={t('Why add a license list')}>
        <p>{t('The report lists only users who used AI credits, so a seat with no usage never appears in it. A license list lets the app:')}</p>
        <ul className="mt-1 list-disc space-y-0.5 ps-5">
          <li>{t('Find seats you pay for that have no AI-credit usage. The Users page lists them, and the savings on the Overview and Recommendations include them.')}</li>
          <li>
            {t(
              'Count a seat in the pool in months when its user had no usage. This gives a better estimate of the pool size and the utilization. The list holds the seats you have now, so past months with a different set of seats are still estimates.',
            )}
          </li>
        </ul>
        <p className="mt-1">{t('The license list and the extra seats apply only when no filter is set, because a filtered view cannot tell which seats belong to it.')}</p>
      </Callout>

      <Card title={t('Import a license file')} subtitle={t('Use the seat list you export from GitHub. The Licenses page shows the full results.')}>
        <LicenseImport compact />
      </Card>

      <RosterImport roster={roster} onChange={setRoster} />

      <Card
        title={t('Seats in the license list')}
        subtitle={describe(stats)}
        actions={
          <ResetButton
            label={t('Clear the license list')}
            yes={t('Yes, clear')}
            icon={<Trash2 size={13} aria-hidden />}
            confirm={t('Remove all {seats}?', { seats: seats(roster.length) })}
            disabled={roster.length === 0}
            onReset={() => update({ roster: [], rosterAsOf: undefined })}
          />
        }
      >
        {rosterAsOf ? (
          <p className="mb-3 text-xs text-fg-muted">{t('Days without activity are counted from {date}.', { date: fmtIsoDay(rosterAsOf) })}</p>
        ) : null}
        {saved === 'slim' ? (
          <Callout tone="warn" className="mb-3" title={t('Only part of the list is kept in this browser')}>
            {t('The list is too big for the space this browser gives the app. The usernames and plans are kept, but the dates and activity are gone after you reload the page. Import the file again then to see activity.')}
          </Callout>
        ) : saved === 'failed' ? (
          <Callout tone="bad" className="mb-3" title={t('The list is kept only until you close the page')}>
            {t('This browser could not save the list. It is used until you reload or close the page. Import the file again on your next visit.')}
          </Callout>
        ) : null}
        {stats.notInReport ? (
          <p className="mb-3 text-xs text-fg-muted">
            {tp(
              stats.notInReport,
              '{n} seat never appears in the report. It counts as an unused seat, and its included credits are added to the pool. A seat with no plan uses the most common plan in the report.',
              '{n} seats never appear in the report. They count as unused seats, and their included credits are added to the pool. A seat with no plan uses the most common plan in the report.',
              { n: fmtInt(stats.notInReport) },
            )}
          </p>
        ) : null}
        <RosterList roster={roster} inReport={inReport} onChange={setRoster} />
      </Card>

      <ExtraSeatsCard />
      <DocLinks topic="seats" title={t('Learn more')} limit={4} />
    </SettingsSection>
  );
}
