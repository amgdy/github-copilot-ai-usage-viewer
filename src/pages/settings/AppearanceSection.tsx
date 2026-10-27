import { type ReactNode } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Card, Segmented } from '../../components/ui';
import { t } from '../../i18n';
import { resolveTheme, useApp, type ThemeMode } from '../../state/store';
import { SettingsSection } from './SettingsSection';

const icon = (node: ReactNode, text: string): ReactNode => (
  <span className="inline-flex items-center gap-1.5">
    {node}
    {text}
  </span>
);

function themeOptions(): { value: ThemeMode; label: ReactNode; title: string }[] {
  return [
    { value: 'light', label: icon(<Sun size={13} aria-hidden />, t('Light theme')), title: t('Always use the light theme') },
    { value: 'dark', label: icon(<Moon size={13} aria-hidden />, t('Dark theme')), title: t('Always use the dark theme') },
    { value: 'system', label: icon(<Monitor size={13} aria-hidden />, t('System')), title: t('Follow the device setting') },
  ];
}

export function AppearanceSection() {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const showing = resolveTheme(theme);
  const now =
    theme === 'system'
      ? showing === 'dark'
        ? t('Your device is using the dark theme now.')
        : t('Your device is using the light theme now.')
      : showing === 'dark'
        ? t('The dark theme is on.')
        : t('The light theme is on.');

  return (
    <SettingsSection id="appearance" description={t('Choose the color theme for this device.')} onReset={() => setTheme('system')}>
      <Card>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-64">
            <div className="text-sm font-medium">{t('Theme')}</div>
            <p className="text-xs text-fg-muted">
              {t('System follows the light or dark setting of your device.')} {now}{' '}
              {t('This choice is saved in this browser and is not part of the exported settings.')}
            </p>
          </div>
          <Segmented<ThemeMode> label={t('Theme')} value={theme} onChange={setTheme} options={themeOptions()} />
        </div>
      </Card>
    </SettingsSection>
  );
}
