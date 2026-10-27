import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Check, Copy, FileUp, UploadCloud, X } from 'lucide-react';
import { FeatureIcon } from '../../components/icons';
import { CalcInfo, Callout, DocLinks, Segmented, Spinner, cx } from '../../components/ui';
import { T, t, tp } from '../../i18n';
import type { SaveResult } from '../../lib/analytics/settings';
import { applyLicenseImport, parseLicenseFile, type ImportResult, type LicenseParse, type RosterMode } from '../../lib/licenses';
import { fmtInt } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { ENTERPRISE_SEATS_COMMAND, KIND_LABEL, KIND_NOTE, LICENSE_FILE_ACCEPT, ORG_SEATS_COMMAND, fmtIsoDay, isTooBig } from './model';

interface Picked {
  name: string;
  parse: LicenseParse;
}

interface Done {
  name: string;
  mode: RosterMode;
  result: ImportResult;
  saved: SaveResult;
}

/** A command with a button that copies it. Commands stay left to right in Arabic too. */
function CommandLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="mt-1 flex min-w-0 items-center gap-2 rounded-md border border-border-muted bg-surface-2 py-1 ps-2.5 pe-1">
      <code dir="ltr" className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-fg">
        {command}
      </code>
      <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => void copy()} aria-label={copied ? t('Copied') : t('Copy the command')} title={t('Copy the command')}>
        {copied ? <Check size={14} className="text-good" aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
    </div>
  );
}

/** The no-code activity report is the usual choice; the seats API is an advanced option. */
function HowToGet({ open }: { open: boolean }) {
  const code = (text: string) => <code className="kbd">{text}</code>;
  return (
    <details className="group rounded-md border border-border-muted p-3" open={open}>
      <summary className="cursor-pointer text-sm font-medium text-fg hover:text-accent">{t('How to get the license list')}</summary>
      <div className="mt-2 space-y-3">
        <div>
          <div className="text-xs font-semibold text-good">{t('Recommended for most admins')}</div>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t('Download the activity report in GitHub. No command is needed.')}</p>
          <ul className="mt-1 list-disc space-y-1 ps-4 text-xs leading-relaxed text-fg-muted">
            <li>{t('Organization: open Settings, GitHub Copilot, Access, Get usage report, then Get activity report (CSV).')}</li>
            <li>{t('Enterprise: open Billing and licensing, Licensing, then choose Get activity report.')}</li>
          </ul>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t('The activity report has last activity and sign-in dates, but not plan or seat start dates. A new seat stays blank until first activity, and activity older than 90 days also appears blank.')}</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t('Check that the file covers the same organization or enterprise as your usage report. Compare its seat count with GitHub before acting; this app cannot know if a CSV left out seats.')}</p>
          <DocLinks ids={['activityReport']} title={t('Activity report instructions')} className="mt-2" />
        </div>

        <details className="rounded-md border border-border-muted px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-fg hover:text-accent">{t('Advanced: seat assignments API (JSON)')}</summary>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">{t('Use this when you need plan, seat start or pending-cancellation details, or want a repeatable export. It does not avoid the 90-day activity limit.')}</p>
          <ol className="mt-2 list-decimal space-y-2.5 ps-5 text-xs leading-relaxed text-fg-muted">
            <li>
              {t('Organization owners: run this command with the GitHub CLI. Put your organization name in place of ORG.')}
              <CommandLine command={ORG_SEATS_COMMAND} />
            </li>
            <li>
              {t('Enterprise owners: run this command to get every seat in the enterprise. Put your enterprise name in place of ENTERPRISE.')}
              <CommandLine command={ENTERPRISE_SEATS_COMMAND} />
            </li>
          </ol>
          <p className="mt-2 text-xs text-fg-muted">
            <T
              text="The command needs a token with the {org} or {read} scope for an organization, or {enterprise} for an enterprise."
              values={{ org: code('manage_billing:copilot'), read: code('read:org'), enterprise: code('read:enterprise') }}
            />
          </p>
          <DocLinks ids={['seatsApi']} title={t('Learn more')} className="mt-3" />
        </details>

        <p className="text-xs leading-relaxed text-fg-muted">{t('A plain list of usernames, one per line, also works. It has no dates or plan details.')}</p>
      </div>
    </details>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd className="num truncate text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

/** What was found in the file, before anything changes. */
function Preview({ picked }: { picked: Picked }) {
  const { parse } = picked;
  const found = parse.seats.length;
  return (
    <div className="space-y-2 rounded-md border border-border-muted bg-surface-2 p-3" aria-live="polite">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <FileUp size={14} className="shrink-0 text-fg-muted" aria-hidden />
        <span className="truncate font-medium">{picked.name}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <Fact label={t('Kind of file')}>{t(KIND_LABEL[parse.kind])}</Fact>
        <Fact label={t('Seats found')}>{fmtInt(found)}</Fact>
        {parse.total !== undefined ? <Fact label={t('Seats the file says it has')}>{fmtInt(parse.total)}</Fact> : null}
        {parse.records !== found ? <Fact label={t('Records read')}>{fmtInt(parse.records)}</Fact> : null}
        <Fact label={t('Rows skipped')}>{fmtInt(parse.skipped)}</Fact>
        <Fact label={t('Export date')}>{parse.exportedAt ? fmtIsoDay(parse.exportedAt) : t('No date in the file')}</Fact>
      </dl>
      <p className="text-xs text-fg-muted">{t(KIND_NOTE[parse.kind])}</p>
      {parse.records > found && found > 0 ? (
        <p className="text-xs text-fg-muted">{t('A user who appears more than once, for example in several organizations or teams, becomes one seat.')}</p>
      ) : null}
      {parse.problems.length > 0 ? (
        <Callout tone={found === 0 ? 'bad' : 'warn'} title={found === 0 ? t('Nothing can be imported from this file') : t('Check these notes')}>
          <ul className="list-disc space-y-0.5 ps-4">
            {parse.problems.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
        </Callout>
      ) : found === 0 ? (
        <Callout tone="bad">{t('Nothing can be imported from this file')}</Callout>
      ) : null}
    </div>
  );
}

/** The outcome of an import, and a warning when the browser could not keep the full list. */
function Outcome({ done }: { done: Done }) {
  const result = done.result;
  const total = result.roster.length;
  return (
    <div className="space-y-2" aria-live="polite">
      <Callout tone="good" title={t('Imported {name}', { name: done.name })}>
        <p>{tp(total, 'The license list now has {n} seat.', 'The license list now has {n} seats.', { n: fmtInt(total) })}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          <Fact label={t('Added')}>{fmtInt(result.added)}</Fact>
          <Fact label={t('Updated')}>{fmtInt(result.updated)}</Fact>
          <Fact label={t('Unchanged')}>{fmtInt(result.unchanged)}</Fact>
          {done.mode === 'replace' ? <Fact label={t('Removed')}>{fmtInt(result.removed)}</Fact> : null}
        </dl>
        {result.rosterAsOf ? <p className="mt-2 text-xs">{t('Days without activity are counted from {date}.', { date: fmtIsoDay(result.rosterAsOf) })}</p> : null}
      </Callout>
      {done.saved === 'slim' ? (
        <Callout tone="warn" title={t('Only part of the list is kept in this browser')}>
          {t('The list is too big for the space this browser gives the app. The usernames and plans are kept, but the dates and activity are gone after you reload the page. Import the file again then to see activity.')}
        </Callout>
      ) : done.saved === 'failed' ? (
        <Callout tone="bad" title={t('The list is kept only until you close the page')}>
          {t('This browser could not save the list. It is used until you reload or close the page. Import the file again on your next visit.')}
        </Callout>
      ) : null}
    </div>
  );
}

/**
 * Picks or drops a license file (the seats API JSON, the activity report CSV, a seats CSV or a list of usernames), shows what
 * was found, and replaces or adds to the license list in the settings. `compact` folds the steps to get the file.
 * `onDone` runs after an import.
 */
export function LicenseImport({ compact, onDone }: { compact?: boolean; onDone?: () => void }) {
  const roster = useApp((state) => state.settings.roster);
  const updateSettings = useApp((state) => state.updateSettings);
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [mode, setMode] = useState<RosterMode>('replace');
  const [done, setDone] = useState<Done | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const hasList = roster.length > 0;
  const chosen: RosterMode = hasList ? mode : 'replace';
  const found = picked?.parse.seats.length ?? 0;

  const take = async (files: FileList | File[] | null | undefined) => {
    const list = files ? Array.from(files) : [];
    const file = list[0];
    if (!file) return;
    setDone(null);
    setError(null);
    setPicked(null);
    setNote(list.length > 1 ? t('Only the first file was read. Import the other files one at a time with Add to the list.') : null);
    if (isTooBig(file.size)) {
      setError(t('{name} is larger than 25 MB, which is too big for a license list. Check that you picked the seat list or the activity report.', { name: file.name }));
      return;
    }
    setReading(file.name);
    try {
      const text = await file.text();
      setPicked({ name: file.name, parse: parseLicenseFile(text, file.name) });
    } catch {
      setError(t('{name} could not be read.', { name: file.name }));
    } finally {
      setReading(null);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (reading === null) void take(event.dataTransfer.files);
  };

  const apply = () => {
    if (!picked || found === 0) return;
    const { settings } = useApp.getState();
    const result = applyLicenseImport(picked.parse, { roster: settings.roster, rosterAsOf: settings.rosterAsOf }, chosen);
    updateSettings({ roster: result.roster, rosterAsOf: result.rosterAsOf });
    setDone({ name: picked.name, mode: chosen, result, saved: useApp.getState().settingsSaved });
    setPicked(null);
    setNote(null);
    onDone?.();
  };

  const cancel = () => {
    setPicked(null);
    setNote(null);
  };

  return (
    <div className="space-y-3">
      <div
        className={cx(
          'rounded-lg border-2 border-dashed text-center transition-colors',
          compact ? 'px-4 py-4' : 'px-6 py-8',
          over ? 'border-accent bg-accent-soft' : 'border-border bg-surface',
          reading !== null && 'pointer-events-none opacity-70',
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (reading === null) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {reading !== null ? (
          <div className="flex items-center justify-center gap-2 text-sm" role="status">
            <Spinner size={16} className="text-accent" />
            {t('Reading {name}…', { name: reading })}
          </div>
        ) : (
          <>
            {compact ? null : <UploadCloud size={30} className="mx-auto mb-2 text-accent" aria-hidden />}
            <div className={cx('font-medium', compact ? 'text-sm' : 'text-base')}>{t('Drop a license file here')}</div>
            <div className="mt-1 text-xs text-fg-muted">{t('The seat list from the GitHub API (JSON), the activity report (CSV), or a list of usernames (TXT).')}</div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => input.current?.click()}>
                <FeatureIcon feature="license" size={14} /> {t('Choose a license file')}
              </button>
              <CalcInfo id="license-import" />
            </div>
            <div className="mt-2 text-[11px] text-fg-subtle">{t('The file is read in your browser and is not sent anywhere.')}</div>
          </>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept={LICENSE_FILE_ACCEPT}
          onChange={(event) => {
            void take(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {error ? <Callout tone="bad">{error}</Callout> : null}
      {note ? <p className="text-xs text-fg-muted">{note}</p> : null}

      {picked ? (
        <div className="space-y-3">
          <Preview picked={picked} />
          {found > 0 ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {hasList ? (
                  <Segmented<RosterMode>
                    label={t('How to use this file')}
                    size="sm"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'replace', label: t('Replace the list'), title: t('Use only the seats in this file') },
                      { value: 'add', label: t('Add to the list'), title: t('Keep the seats on the list and add or update the seats in this file') },
                    ]}
                  />
                ) : null}
                <button type="button" className="btn btn-primary" onClick={apply}>
                  {tp(found, 'Import {n} seat', 'Import {n} seats', { n: fmtInt(found) })}
                </button>
                <button type="button" className="btn btn-ghost" onClick={cancel}>
                  <X size={14} aria-hidden /> {t('Cancel')}
                </button>
              </div>
              {hasList ? (
                <p className="text-xs text-fg-muted">
                  {chosen === 'replace'
                    ? tp(roster.length, 'The {n} seat on the list now is replaced by the seats in this file.', 'The {n} seats on the list now are replaced by the seats in this file.', {
                        n: fmtInt(roster.length),
                      })
                    : t('Seats in this file are added to the list. A seat that is already on the list gets the newer data from the file. Use this for a second organization or a second file.')}
                </p>
              ) : null}
            </div>
          ) : (
            <button type="button" className="btn btn-sm" onClick={cancel}>
              {t('Choose another file')}
            </button>
          )}
        </div>
      ) : null}

      {done ? <Outcome done={done} /> : null}

      <HowToGet open={!compact} />
    </div>
  );
}
