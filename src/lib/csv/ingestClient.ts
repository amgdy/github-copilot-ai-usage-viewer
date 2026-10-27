import type { DataStore } from '../types';
import { buildStore, rebuildIndexes, type TextSource } from './ingest';
import IngestWorker from './ingest.worker?worker&inline';
import type { IngestProgress, WorkerRequest, WorkerResponse } from './ingest.worker';

export type { IngestProgress };

export interface IngestOptions {
  dedupe?: boolean;
  onProgress?: (p: IngestProgress) => void;
}

function runInWorker(sources: TextSource[], opts: IngestOptions): Promise<DataStore> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new IngestWorker();
    } catch (err) {
      reject(err);
      return;
    }
    let started = false;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      started = true;
      if (msg.type === 'progress') {
        opts.onProgress?.(msg);
      } else if (msg.type === 'done') {
        worker.terminate();
        resolve(rebuildIndexes(msg.store as unknown as DataStore));
      } else {
        worker.terminate();
        reject(new ParseError(msg.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      // A worker that never ran (blocked by CSP, unsupported) is recoverable; a failure mid-parse is not.
      reject(started ? new ParseError(e.message || 'The file could not be read.') : new WorkerUnavailable(e.message));
    };
    const req: WorkerRequest = { sources, dedupe: opts.dedupe ?? sources.length > 1 };
    worker.postMessage(req);
  });
}

/** A problem with the file contents (missing columns, unreadable data); shown to the user as is. */
export class ParseError extends Error {}
class WorkerUnavailable extends Error {}

/** Parses CSV sources off the main thread; falls back to the main thread when workers are unavailable. */
export async function ingestSources(sources: TextSource[], opts: IngestOptions = {}): Promise<DataStore> {
  if (typeof Worker !== 'undefined') {
    try {
      return await runInWorker(sources, opts);
    } catch (err) {
      if (err instanceof ParseError) throw err;
    }
  }
  try {
    return await buildStore(sources, { dedupe: opts.dedupe ?? sources.length > 1 }, opts.onProgress);
  } catch (err) {
    throw new ParseError(err instanceof Error ? err.message : String(err));
  }
}
