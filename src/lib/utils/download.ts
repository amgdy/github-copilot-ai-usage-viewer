import { toCsv } from './format';

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(name: string, text: string, mime = 'text/plain;charset=utf-8'): void {
  downloadBlob(name, new Blob([text], { type: mime }));
}

/** Downloads a CSV with a UTF-8 BOM so Excel opens non-ASCII names correctly. */
export function downloadCsv(name: string, headers: string[], rows: unknown[][]): void {
  downloadText(name.endsWith('.csv') ? name : `${name}.csv`, `\uFEFF${toCsv(headers, rows)}`, 'text/csv;charset=utf-8');
}
