import { type ReactNode } from 'react';
import { Contrast, Eye, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { Card, Segmented } from '../../components/ui';
import { getDigitStyle, setDigitStyle, t, type DigitStyle } from '../../i18n';
import { resolveTheme, useApp, type ColorPalette, type ThemeMode } from '../../state/store';
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

function paletteOptions(): { value: ColorPalette; label: ReactNode; title: string }[] {
  return [
    { value: 'default', label: icon(<Palette size={13} aria-hidden />, t('GitHub colors')), title: t('The default GitHub colors') },
    { value: 'contrast', label: icon(<Contrast size={13} aria-hidden />, t('High contrast')), title: t('Darker text and stronger lines, easier to read') },
    { value: 'colorblind', label: icon(<Eye size={13} aria-hidden />, t('Colorblind friendly')), title: t('Blue for good and orange for bad, with chart colors that stay apart for most color vision types') },
  ];
}

function digitOptions(): { value: DigitStyle; label: ReactNode; title: string }[] {
  return [
    { value: 'arabic', label: t('Arabic-Indic digits ({sample})', { sample: '١٢٣' }), title: t('Show numbers as ١٢٣ in Arabic') },
    { value: 'latin', label: t('Latin digits ({sample})', { sample: '123' }), title: t('Show numbers as 123 in Arabic') },
  ];
}

export function AppearanceSection() {
  const theme = useApp((state) => state.theme);
  const setTheme = useApp((state) => state.setTheme);
  const palette = useApp((state) => state.palette);
  const setPalette = useApp((state) => state.setPalette);
  const digitStyle = getDigitStyle();
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
    <SettingsSection id="appearance" description={t('Choose the theme, the colors and the digits for this device.')} onReset={() => {
        setTheme('system');
        setPalette('default');
        if (digitStyle !== 'arabic') setDigitStyle('arabic');
      }}
    >
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
      <Card>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-64">
            <div className="text-sm font-medium">{t('Colors')}</div>
            <p className="text-xs text-fg-muted">
              {t('High contrast makes text darker and lines stronger. Colorblind friendly uses blue for good and orange for bad, and chart colors that are easy to tell apart.')}{' '}
              {t('Each choice works with the light and the dark theme.')}
            </p>
          </div>
          <Segmented<ColorPalette> label={t('Colors')} value={palette} onChange={setPalette} options={paletteOptions()} />
        </div>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-64">
            <div className="text-sm font-medium">{t('Numbers in Arabic')}</div>
            <p className="text-xs text-fg-muted">
              {t('Choose the digits used when the app is in Arabic. English always uses 123. Downloaded CSV files always use 123 so other tools can read them.')}
            </p>
          </div>
          <Segmented<DigitStyle> label={t('Numbers in Arabic')} value={digitStyle} onChange={setDigitStyle} options={digitOptions()} />
        </div>
      </Card>
    </SettingsSection>
  );
}
