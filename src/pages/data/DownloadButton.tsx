import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { ProgressBar, cx } from '../../components/ui';
import { t, tp } from '../../i18n';
import type { DataStore } from '../../lib/types';
import { downloadBlob } from '../../lib/utils/download';
import { fmtInt, fmtPct } from '../../lib/utils/format';
import { buildCsv, EXPORT_HEADERS, TOKEN_HEADERS } from './csvExport';

interface Props {
  store: DataStore;
  /** Row indices in output order. */
  rows: Uint32Array;
  reverse?: boolean;
  label: string;
  fileName: string;
  primary?: boolean;
  /** Blocks the button while the order of `rows` is still being computed. */
  disabled?: boolean;
  /** Tooltip text before the column description. */
  hint?: string;
}

/** Builds the CSV in the browser in chunks, with a progress bar and a cancel button. */
export function DownloadButton({ store, rows, reverse, label, fileName, primary, disabled, hint }: Props) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const start = async () => {
    const control = new AbortController();
    abort.current = control;
    setFailure(null);
    setProgress({ done: 0, total: rows.length });
    try {
      const blob = await buildCsv({ store, rows, reverse, signal: control.signal, onProgress: (done, total) => setProgress({ done, total }) });
      if (blob) downloadBlob(fileName, blob);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : String(err));
    } finally {
      if (abort.current === control) {
        abort.current = null;
        setProgress(null);
      }
    }
  };

  const cancel = () => {
    abort.current?.abort();
    abort.current = null;
    setProgress(null);
  };

  if (progress) {
    const fraction = progress.total > 0 ? progress.done / progress.total : 0;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1" role="status" aria-live="polite">
        <div className="w-28">
          <ProgressBar value={fraction} />
        </div>
        <span className="num text-xs text-fg-muted">
          {t('{percent} · {done} of {total} rows', { percent: fmtPct(fraction, 0), done: fmtInt(progress.done), total: fmtInt(progress.total) })}
        </span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={cancel}>
          <X size={12} /> {t('Cancel')}
        </button>
      </div>
    );
  }

  const columnCount = EXPORT_HEADERS.length + (store.hasTokens ? TOKEN_HEADERS.length : 0);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={cx('btn', primary && 'btn-primary')}
        disabled={rows.length === 0 || disabled}
        onClick={start}
        title={[
          hint ?? '',
          tp(
            rows.length,
            '{n} row, {columns} columns in the order of the report.',
            '{n} rows, {columns} columns in the order of the report.',
            { n: fmtInt(rows.length), columns: fmtInt(columnCount) },
          ),
          t(
            'aic_quantity and aic_gross_amount are not written because the app does not read them. unit_type is written as ai-credits and applied_cost_per_quantity as 0.01. The file is built in your browser and large exports take a moment.',
          ),
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Download size={14} /> {label}
      </button>
      {failure ? <span className="text-xs text-bad">{t('Export failed: {reason}', { reason: failure })}</span> : null}
    </span>
  );
}
