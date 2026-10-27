import type { DataStore } from '../types';
import { buildStore, rebuildIndexes, type TextSource } from './ingest';
import IngestWorker from './ingest.worker?worker&inline';
import type { IngestProgress, WorkerRequest, WorkerResponse } from './ingest.worker';

export type { IngestProgress };

export interface IngestOptions {
  dedupe?: boolean;
  onProgress?: (progress: IngestProgress) => void;
}

function runInWorker(sources: TextSource[], options: IngestOptions): Promise<DataStore> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new IngestWorker();
    } catch (error) {
      reject(error);
      return;
    }
    let started = false;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      started = true;
      if (response.type === 'progress') {
        options.onProgress?.(response);
      } else if (response.type === 'done') {
        worker.terminate();
        resolve(rebuildIndexes(response.store as unknown as DataStore));
      } else {
        worker.terminate();
        reject(new ParseError(response.message));
      }
    };
    worker.onerror = (event) => {
      worker.terminate();
      // A worker that never ran (blocked by CSP, unsupported) is recoverable; a failure mid-parse is not.
      reject(started ? new ParseError(event.message || 'The file could not be read.') : new WorkerUnavailable(event.message));
    };
    const request: WorkerRequest = { sources, dedupe: options.dedupe ?? sources.length > 1 };
    worker.postMessage(request);
  });
}

/** A problem with the file contents (missing columns, unreadable data); shown to the user as is. */
export class ParseError extends Error {}
class WorkerUnavailable extends Error {}

/** Parses CSV sources off the main thread; falls back to the main thread when workers are unavailable. */
export async function ingestSources(sources: TextSource[], options: IngestOptions = {}): Promise<DataStore> {
  if (typeof Worker !== 'undefined') {
    try {
      return await runInWorker(sources, options);
    } catch (error) {
      if (error instanceof ParseError) throw error;
    }
  }
  try {
    return await buildStore(sources, { dedupe: options.dedupe ?? sources.length > 1 }, options.onProgress);
  } catch (error) {
    throw new ParseError(error instanceof Error ? error.message : String(error));
  }
}
