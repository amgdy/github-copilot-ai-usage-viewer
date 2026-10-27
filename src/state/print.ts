import { useSyncExternalStore } from 'react';
import { applyTheme, useApp } from './store';

let printing = false;
const listeners = new Set<() => void>();

function setPrinting(on: boolean): void {
  if (printing === on) return;
  printing = on;
  // Paper is white, so only the light palette prints legibly. The charts redraw from the resolved theme.
  if (on) applyTheme('light');
  else applyTheme(useApp.getState().theme);
  listeners.forEach((listener) => listener());
}

/** True while the page is being prepared for or sent to the printer. */
export function usePrinting(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => printing,
    () => false,
  );
}

/** Switches to the light palette, gives the charts time to redraw, then opens the print dialog. */
export function printReport(): void {
  setPrinting(true);
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => window.print(), 120)));
}

/** Also covers Ctrl/Cmd+P and the browser menu, not only our own Print button. */
export function installPrintListeners(): void {
  window.addEventListener('beforeprint', () => setPrinting(true));
  window.addEventListener('afterprint', () => setPrinting(false));
  // Some browsers do not block in print() or skip afterprint: leave print mode as soon as the page is back in use.
  window.addEventListener('focus', () => {
    if (printing && !matchMedia('print').matches) setPrinting(false);
  });
}
