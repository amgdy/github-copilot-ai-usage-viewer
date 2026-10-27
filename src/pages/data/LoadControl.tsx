import { useRef, type ChangeEvent } from 'react';
import { FileUp } from 'lucide-react';
import { Callout, ProgressBar, Spinner } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import type { LicenseKind } from '../../lib/licenses';
import { fmtInt, pluralize } from '../../lib/utils/format';
import { loadFiles } from '../../state/loadDataset';
import { navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { listNames } from './text';
import { SNIFF_BYTES, routeUploads, useUploadNotice, type LicenseFileResult, type UploadNotice, type UploadOutcome } from './uploads';

/** File types the pickers accept: usage reports (CSV) and license lists (JSON, CSV or a text list of usernames). */
export const UPLOAD_ACCEPT = '.csv,.json,.ndjson,.txt,text/csv,application/json,text/plain';

/**
 * Sorts the files and sends each one where it belongs: usage reports replace the loaded data, license lists go to the
 * license list in the settings. The result of a license import is kept for the Data page.
 */
export async function takeUploads(files: File[]): Promise<UploadOutcome> {
  useApp.getState().setError(null);
  useUploadNotice.getState().show(null);
  const outcome = await routeUploads(files, {
    readHead: (file) => file.slice(0, SNIFF_BYTES).text(),
    readText: (file) => file.text(),
    loadUsage: loadFiles,
    hasDataset: () => useApp.getState().dataset !== null,
    roster: () => {
      const settings = useApp.getState().settings;
      return { roster: settings.roster, rosterAsOf: settings.rosterAsOf };
    },
    saveRoster: (state) => {
      useApp.getState().updateSettings({ roster: state.roster, rosterAsOf: state.rosterAsOf });
      return useApp.getState().settingsSaved;
    },
    setError: (message) => useApp.getState().setError(message),
  });
  useUploadNotice.getState().show(outcome.notice);
  return outcome;
}

/** Picks usage reports or a license list. Usage reports replace the loaded data; a license list is added to the license list. */
export function LoadButton() {
  const input = useRef<HTMLInputElement>(null);
  const busy = useApp((state) => state.loading !== null);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.length) void takeUploads(picked);
  };

  return (
    <>
      <input ref={input} type="file" multiple accept={UPLOAD_ACCEPT} className="hidden" onChange={onPick} aria-label={t('Choose files to load')} />
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => input.current?.click()}
        title={t(
          'A usage report replaces the loaded data. Select every report you want in one go: they are joined, and a row that repeats a row from an earlier file is dropped. A GitHub Copilot license list is added to your license list.',
        )}
      >
        <FileUp size={14} /> {t('Load other files')}
      </button>
    </>
  );
}

/** Progress and errors of a load started from this page. The shell only shows them while no data is loaded. */
export function LoadStatus() {
  const loading = useApp((state) => state.loading);
  const error = useApp((state) => state.error);

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <Callout tone="info" title={t('Loading files')}>
          <div className="flex items-center gap-3">
            <Spinner />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="truncate text-sm">{loading.label}</div>
              <ProgressBar value={loading.fraction} />
              <div className="num text-xs text-fg-muted">{loading.rows > 0 ? t('{n} rows read', { n: fmtInt(loading.rows) }) : t('Starting…')}</div>
            </div>
          </div>
        </Callout>
      </div>
    );
  }

  if (error) {
    return (
      <Callout
        tone="bad"
        title={t('The files could not be loaded')}
        action={
          <button type="button" className="btn btn-sm" onClick={() => useApp.getState().setError(null)}>
            {t('Close')}
          </button>
        }
      >
        {error} {t('The data that was already loaded is unchanged.')}
      </Callout>
    );
  }

  return null;
}

const KIND_LABEL: Record<LicenseKind, string> = {
  'seats-json': msg('Seat list from the GitHub API (JSON)'),
  'activity-csv': msg('Activity report (CSV)'),
  'seats-csv': msg('Seat list (CSV)'),
  'login-list': msg('List of usernames'),
  unknown: msg('Not a license list'),
};

export const licenseKindLabel = (kind: LicenseKind): string => t(KIND_LABEL[kind]);

function fileLine(file: LicenseFileResult): string {
  if (file.tooBig) return t('{name} is larger than 25 MB, so it was not read. A license list is much smaller. Check that this is the right file.', { name: file.name });
  if (file.unreadable) return t('{name} could not be read.', { name: file.name });
  if (file.seats === 0) return t('{name}: no seats found.', { name: file.name });
  return t('{name}: {kind}, {seats}.', { name: file.name, kind: licenseKindLabel(file.kind), seats: pluralize(file.seats, 'seat') });
}

/** The result of the last batch of files: what each license file gave, how the list changed, and how it was kept. */
export function UploadNoticeCallout() {
  const notice = useUploadNotice((state) => state.notice);
  return notice ? <NoticeBody notice={notice} /> : null;
}

function NoticeBody({ notice }: { notice: UploadNotice }) {
  const changed = notice.mode !== null;
  const tone = !changed ? (notice.files.length > 0 ? 'warn' : 'info') : notice.saved === 'saved' ? 'good' : 'warn';
  const title = changed ? t('License list updated') : notice.files.length > 0 ? t('The license list did not change') : t('Some files were not loaded');
  const close = () => useUploadNotice.getState().show(null);

  return (
    <div role="status" aria-live="polite">
      <Callout
        tone={tone}
        title={title}
        action={
          <div className="flex flex-wrap gap-1.5">
            {changed ? (
              <button type="button" className="btn btn-sm" onClick={() => navigate('licenses')}>
                {t('Open the Licenses page')}
              </button>
            ) : null}
            <button type="button" className="btn btn-sm" onClick={close}>
              {t('Close')}
            </button>
          </div>
        }
      >
        <ul className="space-y-0.5">
          {notice.files.map((file) => (
            <li key={file.name}>
              {fileLine(file)}
              {file.skipped > 0 ? ` ${tp(file.skipped, '{n} entry without a usable username was left out.', '{n} entries without a usable username were left out.', { n: fmtInt(file.skipped) })}` : ''}
              {file.problems.length > 0 ? ` ${file.problems.join(' ')}` : ''}
            </li>
          ))}
          {changed ? (
            <li>
              {notice.mode === 'replace' ? t('There was no license list yet, so this became your list.') : t('Added to the license list you had.')}{' '}
              {t('{added} added, {updated} updated, {unchanged} unchanged, {removed} removed. The list now has {total}.', {
                added: fmtInt(notice.added),
                updated: fmtInt(notice.updated),
                unchanged: fmtInt(notice.unchanged),
                removed: fmtInt(notice.removed),
                total: pluralize(notice.total, 'seat'),
              })}
            </li>
          ) : null}
          {notice.saved === 'slim' ? (
            <li className="font-medium">
              {t('The list is too big to keep in full in this browser. It was kept with usernames and plans only. Load the file again on your next visit to see activity dates.')}
            </li>
          ) : null}
          {notice.saved === 'failed' ? (
            <li className="font-medium">{t('This browser could not keep the list, so it is gone when you close the tab. Load the file again on your next visit.')}</li>
          ) : null}
          {notice.ignored.length > 0 ? <li>{t('Not loaded: {names}. They are not a usage report or a license list.', { names: listNames(notice.ignored) })}</li> : null}
        </ul>
      </Callout>
    </div>
  );
}
