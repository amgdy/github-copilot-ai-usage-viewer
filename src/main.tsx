import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import './index.css';
import { App } from './App';
import { initLocale } from './i18n';
import { applyPalette, applyTheme, useApp } from './state/store';
import { installPrintListeners } from './state/print';

applyTheme(useApp.getState().theme);
applyPalette(useApp.getState().palette);
installPrintListeners();

void initLocale().finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
