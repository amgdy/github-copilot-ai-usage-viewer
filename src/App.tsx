import { Fragment } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Landing } from './components/Landing';
import { t, useLocale } from './i18n';
import { AnalysisProvider } from './state/analysis';
import { useApp } from './state/store';
import { useResolvedTheme } from './state/theme';

const startOver = () => useApp.getState().setDataset(null);

export function App() {
  const dataset = useApp((s) => s.dataset);
  const picking = useApp((s) => s.pickingData);
  // A language change remounts everything below, so every text (including generated advice) is built again in the new language.
  const locale = useLocale();
  useResolvedTheme();
  return (
    <Fragment key={locale}>
      <ErrorBoundary scope={t('the app')} recover={{ label: t('Load a different file'), run: startOver }}>
        {dataset && !picking ? (
          <AnalysisProvider dataset={dataset}>
            <AppShell />
          </AnalysisProvider>
        ) : (
          <Landing />
        )}
      </ErrorBoundary>
    </Fragment>
  );
}
