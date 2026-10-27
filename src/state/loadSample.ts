import { msg, t } from '../i18n/core';
import { loadSources } from './loadDataset';
import { useApp } from './store';

/** Name of the made-up file, as shown on the Data page. */
export const SAMPLE_FILE_NAME = 'sample-usage-report.csv';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The sample covers last month and this month up to yesterday, so it looks like a fresh export. */
export function sampleRange(today = new Date()): { start: string; end: string } {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  return { start: isoDay(start), end: isoDay(end) };
}

/**
 * Loads a made-up report. The people, organizations and numbers are invented in this browser tab, so no real
 * report is read. The generator is downloaded only when someone asks for the sample.
 */
export async function loadSample(): Promise<boolean> {
  const { setLoading, setError } = useApp.getState();
  setError(null);
  setLoading({ label: t('Making a sample report…'), fraction: 0, rows: 0 });
  try {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const { generateDemo } = await import('../lib/demo/generate');
    const { csv } = generateDemo(sampleRange());
    // Empty vars make the top bar translate the name when the language changes.
    return await loadSources([{ name: SAMPLE_FILE_NAME, data: csv }], { text: msg('Sample report (made-up data)'), vars: {} }, { sample: true });
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
    setLoading(null);
    return false;
  }
}
