import { Check, Copy } from 'lucide-react';
import { cx } from '../../components/ui';
import { t } from '../../i18n';
import { useCopy } from './clipboard';

/** Button that copies text and briefly says so. The text is built on click, so it is never stale. Pass `label` already translated. */
export function CopyButton({ label, getText, size = 'md', className }: { label: string; getText: () => string; size?: 'sm' | 'md'; className?: string }) {
  const { state, copy } = useCopy();
  const text = state === 'copied' ? t('Copied') : state === 'failed' ? t('Copy failed') : label;
  // The live region sits outside the button because a button's children are presentational for screen readers.
  return (
    <>
      <button type="button" className={cx('btn', size === 'sm' && 'btn-sm', className)} onClick={() => void copy(getText())}>
        {state === 'copied' ? <Check size={size === 'sm' ? 13 : 14} aria-hidden /> : <Copy size={size === 'sm' ? 13 : 14} aria-hidden />}
        {text}
      </button>
      <span className="sr-only" role="status">
        {state === 'copied' ? t('Copied to the clipboard') : state === 'failed' ? t('Copying failed. Select the text and copy it by hand.') : ''}
      </span>
    </>
  );
}
