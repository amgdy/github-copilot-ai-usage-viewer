import { Languages } from 'lucide-react';
import { useState } from 'react';
import { LOCALES, setLocale, t, useLocale } from '../../i18n';

/** Switches between English and Arabic. The label is the other language in its own script, so both readers can find it. */
export function LanguageButton({ className = 'btn btn-ghost' }: { className?: string }) {
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const next = LOCALES.find((l) => l.id !== locale)!;
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        lang={next.id}
        onClick={() => {
          setBusy(true);
          setFailed(false);
          void setLocale(next.id)
            .catch((error: unknown) => {
              console.error('Could not change language', error);
              setFailed(true);
            })
            .finally(() => setBusy(false));
        }}
        title={t('Show the app in {language}', { language: next.native })}
        aria-label={t('Show the app in {language}', { language: next.native })}
      >
        <Languages size={16} />
        <span className="hidden sm:inline">{next.native}</span>
      </button>
      {failed ? <span role="alert" className="max-w-48 text-xs text-bad">{t('Could not change language. Please try again.')}</span> : null}
    </>
  );
}
