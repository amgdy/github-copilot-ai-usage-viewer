import { useEffect, useState } from 'react';
import { usePrinting } from './print';
import { applyTheme, resolveTheme, useApp } from './store';

/** The color scheme actually in effect ('system' resolved against the OS setting; always light while printing). */
export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useApp((s) => s.theme);
  const printing = usePrinting();
  const [system, setSystem] = useState<'light' | 'dark'>(() => resolveTheme('system'));
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setSystem(mq.matches ? 'dark' : 'light');
      if (useApp.getState().theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  if (printing) return 'light';
  return mode === 'system' ? system : mode;
}
