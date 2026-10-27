import { useEffect, useState } from 'react';
import { usePrinting } from './print';
import { applyTheme, resolveTheme, useApp } from './store';

/** The color scheme actually in effect ('system' resolved against the OS setting; always light while printing). */
export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useApp((state) => state.theme);
  const printing = usePrinting();
  const [system, setSystem] = useState<'light' | 'dark'>(() => resolveTheme('system'));
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const darkModeQuery = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setSystem(darkModeQuery.matches ? 'dark' : 'light');
      if (useApp.getState().theme === 'system') applyTheme('system');
    };
    darkModeQuery.addEventListener('change', onChange);
    return () => darkModeQuery.removeEventListener('change', onChange);
  }, []);
  if (printing) return 'light';
  return mode === 'system' ? system : mode;
}
