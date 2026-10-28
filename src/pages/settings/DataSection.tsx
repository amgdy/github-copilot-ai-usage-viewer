import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { Callout, Card } from '../../components/ui';
import type { Settings } from '../../lib/analytics/settings';
import { downloadText } from '../../lib/utils/download';
import { T, t } from '../../i18n';
import { DeleteSavedDataButton } from '../../components/DeleteSavedDataButton';
import { savedKeys, STORAGE_PREFIX } from '../../state/savedData';
import { useApp } from '../../state/store';
import { ImportOutcome, type Outcome } from './ImportOutcome';
import { MAX_SETTINGS_FILE_BYTES, SETTINGS_STORAGE_KEY, diffSettings, isStored, readSettingsFile, settingsFileName, settingsJson, storageWorks } from './settings-io';
import { ResetButton, SettingsSection } from './SettingsSection';

/** False when this browser refuses to keep the settings, for example in some private windows or when storage is full. */
function useStorageWorks(settings: Settings): boolean {
  const initial = useRef(settings);
  const [works, setWorks] = useState(true);
  useEffect(() => {
    setWorks(settings === initial.current ? storageWorks() : isStored(settings));
  }, [settings]);
  return works;
}

interface Props {
  /** Called after the settings were replaced as a whole, so every section shows the new values. */
  onReplaced: () => void;
}

export function DataSection({ onReplaced }: Props) {
  const settings = useApp((state) => state.settings);
  const update = useApp((state) => state.updateSettings);
  const resetAll = useApp((state) => state.resetSettings);
  const works = useStorageWorks(settings);
  const picker = useRef<HTMLInputElement>(null);
  // Kept here, not in the section body, because the body is rebuilt whenever the settings are replaced.
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const canUndo = outcome?.kind === 'imported' && outcome.applied === settings;

  const exportFile = () => downloadText(settingsFileName(), settingsJson(settings), 'application/json');

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const fail = (error: string) => setOutcome({ kind: 'failed', fileName: file.name, error });
    if (file.size > MAX_SETTINGS_FILE_BYTES) {
      input.value = '';
      return fail(t('The file is larger than 25 MB, which is far more than a settings file needs.'));
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      return fail(t('The file could not be read.'));
    } finally {
      input.value = '';
    }
    const read = readSettingsFile(text);
    if (!read.ok) return fail(read.error);
    const before = useApp.getState().settings;
    update(read.next);
    const applied = useApp.getState().settings;
    onReplaced();
    setOutcome({ kind: 'imported', fileName: file.name, changes: diffSettings(before, applied), ignored: read.ignored, before, applied });
  }

  const undo = () => {
    if (outcome?.kind !== 'imported') return;
    update(outcome.before);
    onReplaced();
    setOutcome({ kind: 'undone', fileName: outcome.fileName });
  };

  const reset = () => {
    resetAll();
    onReplaced();
    setOutcome({ kind: 'reset' });
  };

  return (
    <SettingsSection id="data" description={t('What this app keeps in your browser, and how to back up or move your settings.')}>
      <Card title={t('What stays on this device')}>
        <ul className="list-disc space-y-1.5 ps-5 text-xs text-fg-muted">
          <li>
            <T
              text="Settings are saved in this browser, in local storage under the key {key}. The theme, the colors, the language, the digits for Arabic and the Show calculations switch are saved there too. Every key starts with {prefix}."
              values={{
                key: <code className="kbd">{SETTINGS_STORAGE_KEY}</code>,
                prefix: <code className="kbd">{STORAGE_PREFIX}</code>,
              }}
            />
          </li>
          <li>{t('The report is never saved. It is read from the file you choose and kept in memory while the tab is open. Closing or reloading the tab removes it.')}</li>
          <li>{t('Nothing is uploaded. Clearing the site data of this browser removes the saved settings, and another browser starts with the defaults.')}</li>
        </ul>
      </Card>

      {works ? null : (
        <Callout tone="warn" title={t('This browser is not keeping the settings')}>
          {t('Storage may be blocked or full. Your settings still apply while this tab is open, but they are lost when you reload it. Export a settings file to keep a copy.')}
        </Callout>
      )}

      <Card title={t('Settings file')} subtitle={t('Back up your settings or move them to another browser.')}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-sm btn-primary" onClick={exportFile}>
            <Download size={13} aria-hidden /> {t('Export settings')}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => picker.current?.click()}>
            <Upload size={13} aria-hidden /> {t('Import settings')}
          </button>
          <input ref={picker} type="file" accept=".json,application/json" className="hidden" tabIndex={-1} aria-hidden onChange={importFile} />
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          {t(
            'The export is a JSON file with the thresholds, the budget, the license list and its date, the extra seats and the model price overrides. It holds no report data, no theme and no language. An import replaces the settings you have now. Settings missing from the file go back to their defaults, so a file from an older version works, and values that are out of range are left out. Files up to 25 MB are accepted.',
          )}
        </p>
      </Card>

      <div aria-live="polite">{outcome ? <ImportOutcome outcome={outcome} canUndo={canUndo} onUndo={undo} /> : null}</div>

      <SavedDataCard settings={settings} />

      <Card title={t('Reset all settings')} subtitle={t('Put every setting back to its default.')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 basis-64 text-xs text-fg-muted">
            {t(
              'This clears the thresholds, the budget, the license list, the extra seats and the model price overrides. The theme, the language and the loaded report stay as they are. Export a settings file first if you may want them back.',
            )}
          </p>
          <ResetButton
            label={t('Reset all settings')}
            confirm={t('Reset every setting, including the license list and the model price overrides?')}
            onReset={reset}
          />
        </div>
      </Card>
    </SettingsSection>
  );
}

/** Lists what is saved in this browser right now and offers to delete all of it. */
function SavedDataCard({ settings }: { settings: Settings }) {
  const theme = useApp((state) => state.theme);
  const palette = useApp((state) => state.palette);
  const showCalc = useApp((state) => state.showCalc);
  const [keys, setKeys] = useState<string[]>(savedKeys);
  useEffect(() => setKeys(savedKeys()), [settings, theme, palette, showCalc]);

  return (
    <Card title={t('Delete everything saved on this device')} subtitle={t('Remove all settings this app keeps in this browser.')}>
      <p className="text-xs text-fg-muted">
        {keys.length === 0 ? t('Nothing is saved in this browser yet. Every setting is at its default.') : t('Saved now:')}
      </p>
      {keys.length > 0 ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {keys.map((key) => (
            <li key={key}>
              <code className="kbd">{key}</code>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 basis-64 text-xs text-fg-muted">
          {t(
            'This deletes the settings, the license list, the theme, the colors, the language and the digit choice, then opens the app again from the start. A loaded report is closed, because it is only kept in memory. Other websites are not touched. Export a settings file first if you may want them back.',
          )}
        </p>
        <DeleteSavedDataButton />
      </div>
    </Card>
  );
}
