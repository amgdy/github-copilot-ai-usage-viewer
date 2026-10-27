/// <reference lib="webworker" />
import { DIM_KEYS, type DataStore, type DimKey } from '../types';
import { buildStore, type TextSource } from './ingest';

export interface WorkerRequest {
  sources: TextSource[];
  dedupe: boolean;
}

export interface IngestProgress {
  file: string;
  fileIndex: number;
  fileCount: number;
  fraction: number;
  rows: number;
}

/** A store without the dictionary lookup maps: Maps are rebuilt on the receiving side. */
export type WireStore = Omit<DataStore, 'dicts'> & { dicts: Record<DimKey, { values: string[] }> };

export type WorkerResponse =
  | ({ type: 'progress' } & IngestProgress)
  | { type: 'done'; store: WireStore }
  | { type: 'error'; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  try {
    const store = await buildStore(e.data.sources, { dedupe: e.data.dedupe }, (p) => ctx.postMessage({ type: 'progress', ...p } satisfies WorkerResponse));
    const dicts = {} as WireStore['dicts'];
    for (const k of DIM_KEYS) dicts[k] = { values: store.dicts[k].values };
    const wire: WireStore = { ...store, dicts };
    const transfer: Transferable[] = [];
    for (const v of Object.values(store)) {
      if (ArrayBuffer.isView(v)) transfer.push(v.buffer as ArrayBuffer);
    }
    ctx.postMessage({ type: 'done', store: wire } satisfies WorkerResponse, transfer);
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) } satisfies WorkerResponse);
  }
};
