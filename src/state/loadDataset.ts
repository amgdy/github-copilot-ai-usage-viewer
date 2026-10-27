import { msg, t, type Vars } from '../i18n/core';
import { prepareStore } from '../lib/analytics/prepare';
import type { TextSource } from '../lib/csv/ingest';
import { ingestSources } from '../lib/csv/ingestClient';
import { useApp } from './store';

/** A dataset name. With `vars`, `text` is English with {placeholders} that is translated when shown. */
export interface LabelText {
  text: string;
  vars?: Vars;
}

export function labelFromNames(names: string[]): LabelText {
  if (names.length === 1) return { text: names[0] };
  if (names.length === 2) return { text: `${names[0]} + ${names[1]}` };
  return { text: msg('{n} files'), vars: { n: names.length } };
}

const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export interface LoadOptions {
  /** Marks the dataset as the made-up sample report. */
  sample?: boolean;
}

/** Parses the sources, prepares them for analysis and makes them the active dataset. Resolves true on success. */
export async function loadSources(sources: TextSource[], label: LabelText = labelFromNames(sources.map((s) => s.name)), options: LoadOptions = {}): Promise<boolean> {
  const { setLoading, setError, setDataset } = useApp.getState();
  setError(null);
  setLoading({ label: t('Reading…'), fraction: 0, rows: 0 });
  try {
    const store = await ingestSources(sources, {
      onProgress: (p) =>
        setLoading({
          label: p.fileCount > 1 ? t('Reading {file} ({i} of {n})', { file: p.file, i: p.fileIndex + 1, n: p.fileCount }) : t('Reading {file}', { file: p.file }),
          fraction: p.fraction,
          rows: p.rows,
        }),
    });
    if (store.n === 0) throw new Error(t('No usage rows were found. Is this an AI usage report export (CSV)?'));
    setLoading({ label: t('Preparing the analysis…'), fraction: 1, rows: store.n });
    await nextFrame();
    const prep = prepareStore(store);
    setDataset({ store, prep, label: label.text, labelVars: label.vars, loadedAt: Date.now(), ...(options.sample ? { sample: true } : {}) });
    return true;
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
    return false;
  } finally {
    setLoading(null);
  }
}

export function loadFiles(files: File[]): Promise<boolean> {
  return loadSources(files.map((f) => ({ name: f.name, data: f })));
}
