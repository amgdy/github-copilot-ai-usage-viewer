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

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const store = await buildStore(event.data.sources, { dedupe: event.data.dedupe }, (progress) => workerScope.postMessage({ type: 'progress', ...progress } satisfies WorkerResponse));
    const dicts = {} as WireStore['dicts'];
    for (const dimension of DIM_KEYS) dicts[dimension] = { values: store.dicts[dimension].values };
    const wire: WireStore = { ...store, dicts };
    const transfer: Transferable[] = [];
    for (const value of Object.values(store)) {
      if (ArrayBuffer.isView(value)) transfer.push(value.buffer as ArrayBuffer);
    }
    workerScope.postMessage({ type: 'done', store: wire } satisfies WorkerResponse, transfer);
  } catch (error) {
    workerScope.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse);
  }
};
