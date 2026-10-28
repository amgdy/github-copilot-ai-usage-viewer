import { t } from '../i18n';
import { BUILD_INFO } from '../lib/build/buildInfo';
import { APP_REPOSITORY_URL } from '../lib/links';
import { GitHubIcon } from './icons/brand';
import { cx } from './ui/cx';

/**
 * A link to the source code on GitHub, the app version and the GitHub Actions run that built it.
 * A build made on a computer says "local build".
 */
export function BuildVersion({ className }: { className?: string }) {
  const { version, runNumber, shortCommit, runUrl, commitUrl, builtOn } = BUILD_INFO;
  const linkClass = 'underline-offset-2 hover:text-accent hover:underline';
  return (
    <span className={cx('num inline-flex flex-wrap items-center gap-x-1.5', className)}>
      <a
        href={APP_REPOSITORY_URL}
        target="_blank"
        rel="noreferrer"
        className={cx('inline-flex items-center gap-1', linkClass)}
        title={t('Open the source code of this app on GitHub')}
      >
        <GitHubIcon size={11} aria-hidden />
        {t('Source code')}
      </a>
      <span aria-hidden>·</span>
      <span>{t('Version {version}', { version })}</span>
      <span aria-hidden>·</span>
      {runNumber !== undefined ? (
        runUrl ? (
          <a href={runUrl} target="_blank" rel="noreferrer" className={linkClass} title={t('Open the GitHub Actions run that built this version')}>
            {t('Build {n}', { n: runNumber })}
          </a>
        ) : (
          <span>{t('Build {n}', { n: runNumber })}</span>
        )
      ) : (
        <span>{t('Local build')}</span>
      )}
      {shortCommit ? (
        <>
          <span aria-hidden>·</span>
          {commitUrl ? (
            <a href={commitUrl} target="_blank" rel="noreferrer" className={cx('font-mono', linkClass)} title={t('Open the commit this version was built from')}>
              {shortCommit}
            </a>
          ) : (
            <span className="font-mono">{shortCommit}</span>
          )}
        </>
      ) : null}
      {builtOn ? (
        <>
          <span aria-hidden>·</span>
          <span>{builtOn}</span>
        </>
      ) : null}
    </span>
  );
}
