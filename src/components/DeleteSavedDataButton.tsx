import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { t } from '../i18n';
import { deleteSavedData } from '../state/savedData';
import { cx } from './ui/cx';

interface Props {
  /** "link" for a quiet text link, "button" for a normal button. */
  look?: 'link' | 'button';
  className?: string;
}

/**
 * Deletes everything this app saved in this browser, after a confirmation, and then opens the app again from the start
 * so every setting, the theme, the colors and the language go back to their defaults.
 */
export function DeleteSavedDataButton({ look = 'button', className }: Props) {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const timer = window.setTimeout(() => setAsking(false), 8000);
    return () => window.clearTimeout(timer);
  }, [asking]);

  const confirmDelete = () => {
    deleteSavedData();
    window.location.replace(window.location.pathname);
  };

  if (asking) {
    return (
      <span className={cx('inline-flex flex-wrap items-center gap-1.5', className)} role="group" aria-label={t('Confirm')}>
        <span className="text-xs text-fg-muted">{t('Delete all saved settings and start again? A loaded report is closed too.')}</span>
        <button type="button" className="btn btn-sm btn-danger" onClick={confirmDelete}>
          {t('Yes, delete')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setAsking(false)}>
          {t('Cancel')}
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={cx(look === 'link' ? 'inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline' : 'btn btn-sm btn-danger', className)}
      onClick={() => setAsking(true)}
    >
      <Trash2 size={look === 'link' ? 11 : 13} aria-hidden /> {t('Delete saved settings')}
    </button>
  );
}
