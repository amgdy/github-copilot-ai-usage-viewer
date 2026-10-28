import { useRef, useState, type DragEvent } from 'react';
import { ArrowLeft, ArrowRight, Calculator, FileUp, Filter, LockKeyhole, Moon, Sparkles, Sun } from 'lucide-react';
import { msg, t } from '../i18n';
import { LanguageButton } from './layout/LanguageButton';
import { fmtInt } from '../lib/utils/format';
import { navigate } from '../state/router';
import { loadSample } from '../state/loadSample';
import { savedKeys } from '../state/savedData';
import { datasetLabel, resolveTheme, useApp } from '../state/store';
import { UPLOAD_ACCEPT, takeUploads } from '../pages/data/LoadControl';
import { Brand } from './layout/Sidebar';
import { BuildVersion } from './BuildVersion';
import { DeleteSavedDataButton } from './DeleteSavedDataButton';
import { Callout, DocLinks, Spinner } from './ui';
import { cx } from './ui/cx';

/** What the report gives, with a matching icon for each point. */
const POINTS = [
  {
    Icon: Sparkles,
    title: msg('Clear next steps'),
    text: msg('Users are grouped by how much and how they use GitHub Copilot. Actions are sorted by the money they can save.'),
  },
  {
    Icon: Filter,
    title: msg('Every angle'),
    text: msg('Filter by user, model, organization, cost center, product, date, weekday, billing and more. Click any chart to see the details.'),
  },
  {
    Icon: Calculator,
    title: msg('Every number explained'),
    text: msg('Each number has a button that shows how it is calculated, with an example. The Methodology page lists them all.'),
  },
  {
    Icon: LockKeyhole,
    title: msg('Private'),
    text: msg('The file is read in this browser tab only. Nothing is uploaded or saved on a server, and it works offline.'),
  },
];

export function Landing() {
  const loading = useApp((state) => state.loading);
  const error = useApp((state) => state.error);
  const setError = useApp((state) => state.setError);
  const theme = useApp((state) => state.theme);
  const setTheme = useApp((state) => state.setTheme);
  const dataset = useApp((state) => state.dataset);
  const [hasSavedData] = useState(() => savedKeys().length > 0);
  const setPickingData = useApp((state) => state.setPickingData);
  const dark = resolveTheme(theme) === 'dark';
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const busy = loading !== null;

  const take = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    void takeUploads(files).then((outcome) => {
      // A license list loaded with (or after) a usage report: show its result on the Data page.
      if (outcome.notice && outcome.notice.files.length > 0 && useApp.getState().dataset) {
        setPickingData(false);
        navigate('data');
      }
    });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (!busy) take(event.dataTransfer.files);
  };

  return (
    <div className="min-h-full bg-bg">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <Brand />
          <div className="flex min-w-0 items-center gap-1.5">
            {dataset ? (
              <button
                type="button"
                className="btn btn-sm min-w-0"
                disabled={busy}
                title={t('Go back to {name}', { name: datasetLabel(dataset) })}
                onClick={() => {
                  setError(null);
                  setPickingData(false);
                }}
              >
                <ArrowLeft size={14} className="shrink-0 rtl:-scale-x-100" />
                <span className="max-w-[14rem] truncate">{t('Back to {name}', { name: datasetLabel(dataset) })}</span>
              </button>
            ) : null}
            <LanguageButton className="btn btn-ghost btn-sm" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={t('Switch between light and dark')}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:py-16">
          <div className="lg:col-start-1 lg:row-start-1">
            <span aria-hidden className="block h-[3px] w-10 bg-accent" />
            <p className="eyebrow mt-4">{t('For GitHub Copilot admins and managers')}</p>
            <h1 className="font-display mt-3 text-balance text-[34px] leading-[1.06] sm:text-[46px]">{t('See where your GitHub Copilot AI credits go')}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted">
              {t(
                'Drop the AI usage report you downloaded from GitHub. You get usage and pool health, rankings, user groups, tokens and the Auto discount for each user, and clear steps to get more from GitHub Copilot at a fair cost.',
              )}
            </p>
          </div>

          {/* Second in the page, so on a phone the ways to open a report come right after the title. */}
          <div className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <section aria-labelledby="landing-open" className="card p-5 sm:p-6">
              <h2 id="landing-open" className="font-display text-lg">
                {t('Open a report')}
              </h2>
              <div
                className={cx(
                  'mt-4 rounded-lg border border-dashed px-5 py-6 text-center transition-colors',
                  over ? 'border-accent bg-accent-soft' : 'border-control bg-surface-2',
                  busy && 'pointer-events-none',
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!busy) setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={onDrop}
              >
                {busy ? (
                  <div role="status" aria-live="polite">
                    <Spinner size={20} className="mx-auto text-accent" />
                    <div className="mt-3 text-sm font-medium">{loading.label}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-xs bg-surface-3">
                      <div className="h-full rounded-xs bg-accent transition-[width] duration-150" style={{ width: `${Math.max(4, Math.round(loading.fraction * 100))}%` }} />
                    </div>
                    <div className="num mt-1.5 text-xs text-fg-muted">{loading.rows > 0 ? t('{n} rows read', { n: fmtInt(loading.rows) }) : t('Starting…')}</div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-semibold">{t('Drop one or more CSV files here')}</div>
                    <div className="mt-1 text-xs text-fg-muted">{t('Several files are joined into one, and repeated rows are removed.')}</div>
                    <button type="button" className="btn btn-primary mt-4" onClick={() => input.current?.click()}>
                      <FileUp size={16} /> {t('Choose files')}
                    </button>
                    <input
                      ref={input}
                      type="file"
                      accept={UPLOAD_ACCEPT}
                      multiple
                      hidden
                      onChange={(event) => {
                        if (event.target.files?.length) take(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </>
                )}
              </div>

              <div className="my-4 flex items-center gap-3 text-xs text-fg-subtle">
                <span aria-hidden className="h-px flex-1 bg-border" />
                {t('or')}
                <span aria-hidden className="h-px flex-1 bg-border" />
              </div>

              <button type="button" className="btn w-full" disabled={busy} onClick={() => void loadSample()}>
                {t('View a sample report')}
                <ArrowRight size={14} className="rtl:-scale-x-100" />
              </button>
              <p className="mt-2 text-center text-xs text-fg-subtle">{t('The sample uses made-up people and numbers. It is made in this browser tab.')}</p>

              <p className="mt-5 border-t border-border pt-3 text-xs leading-relaxed text-fg-muted">
                {t('After loading, you can add your GitHub Copilot license list and other GitHub files on the Data page for a fuller picture.')}
              </p>
            </section>

            {error ? (
              <Callout tone="bad" title={t('That file could not be loaded')}>
                {error}
              </Callout>
            ) : null}

            <div className="text-xs text-fg-muted">
              <h2 className="eyebrow">{t('How to get the report')}</h2>
              <p className="mt-1.5 leading-relaxed">
                {t('The AI usage report is a CSV file. You download it from the billing and usage area of your GitHub enterprise or organization. GitHub explains where to find it.')}
              </p>
              <DocLinks ids={['usageBilling', 'manageSpending']} className="mt-2" compact />
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <h2 className="eyebrow">{t('What you get')}</h2>
            <ol className="mt-3 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {POINTS.map((point) => (
                <li key={point.title} className="border-t border-border pt-3">
                  <div className="flex items-center gap-2.5">
                    <point.Icon size={15} strokeWidth={1.75} className="shrink-0 text-accent" aria-hidden />
                    <h3 className="text-sm font-semibold">{t(point.title)}</h3>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{t(point.text)}</p>
                </li>
              ))}
            </ol>
          </div>
        </main>

        <footer className="border-t border-border pt-3 text-[11px] leading-relaxed text-fg-subtle">
          {t('Columns the report needs: {columns} and the token columns. Other columns are ignored.', {
            columns: 'date, username, model, quantity, gross_amount, discount_amount, net_amount, total_monthly_quota, organization, cost_center_name',
          })}
          {hasSavedData ? (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('This browser keeps your settings from an earlier visit.')} <DeleteSavedDataButton look="link" />
            </span>
          ) : null}
          <BuildVersion className="mt-1.5 flex" />
        </footer>
      </div>
    </div>
  );
}
