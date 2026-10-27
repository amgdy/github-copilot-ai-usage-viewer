import { Undo2 } from 'lucide-react';
import { Callout } from '../../components/ui';
import type { Settings } from '../../lib/analytics/settings';
import { fmtInt } from '../../lib/utils/format';
import { t, tp } from '../../i18n';

export type Outcome =
  | { kind: 'imported'; fileName: string; changes: string[]; ignored: string[]; before: Settings; applied: Settings }
  | { kind: 'undone'; fileName: string }
  | { kind: 'failed'; fileName: string; error: string }
  | { kind: 'reset' };

interface Props {
  outcome: Outcome;
  /** True while the settings are still the ones the import produced. */
  canUndo: boolean;
  onUndo: () => void;
}

/** What happened to the last import, undo or reset. Messages in `outcome` are already translated. */
export function ImportOutcome({ outcome, canUndo, onUndo }: Props) {
  switch (outcome.kind) {
    case 'reset':
      return (
        <Callout tone="good" title={t('All settings reset')}>
          {t('Every setting is back to its default. The theme, the language and the loaded report did not change.')}
        </Callout>
      );
    case 'undone':
      return (
        <Callout tone="info" title={t('Import undone')}>
          {t('Your settings are back to what they were before you imported {file}.', { file: outcome.fileName })}
        </Callout>
      );
    case 'failed':
      return (
        <Callout tone="bad" title={t('Import failed')}>
          {t('{file}: {error} Your settings were not changed.', { file: outcome.fileName, error: outcome.error })}
        </Callout>
      );
    case 'imported': {
      const { changes, ignored, fileName } = outcome;
      return (
        <Callout
          tone={changes.length > 0 ? 'good' : 'info'}
          title={changes.length > 0 ? t('Settings imported') : t('Nothing to change')}
          action={
            canUndo ? (
              <button type="button" className="btn btn-sm" onClick={onUndo}>
                <Undo2 size={13} aria-hidden /> {t('Undo import')}
              </button>
            ) : undefined
          }
        >
          <p>
            {changes.length > 0
              ? tp(changes.length, '{file} changed {n} setting.', '{file} changed {n} settings.', { file: fileName, n: fmtInt(changes.length) })
              : t('{file} has the same settings as the ones in use.', { file: fileName })}
            {changes.length > 0 && canUndo ? ` ${t('You can undo this until you change another setting.')}` : null}
          </p>
          {changes.length > 0 ? (
            <ul className="mt-1.5 max-h-48 list-disc space-y-0.5 overflow-y-auto ps-5">
              {changes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {ignored.length > 0 ? (
            <details className="mt-1.5">
              <summary className="cursor-pointer text-fg">
                {tp(ignored.length, '{n} item in the file was left out', '{n} items in the file were left out', { n: fmtInt(ignored.length) })}
              </summary>
              <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto ps-5">
                {ignored.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </Callout>
      );
    }
  }
}
