import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteSavedData, savedKeys, STORAGE_PREFIX } from '../src/state/savedData';

function stubStorage(entries: Record<string, string>): Map<string, string> {
  const store = new Map(Object.entries(entries));
  vi.stubGlobal('localStorage', {
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  return store;
}

afterEach(() => vi.unstubAllGlobals());

describe('saved data in this browser', () => {
  it('lists only the keys of this app, A to Z', () => {
    stubStorage({ 'ghcu.theme': 'dark', 'other.app': '1', 'ghcu.settings.v1': '{}', 'ghcu.locale': 'ar' });
    expect(savedKeys()).toEqual(['ghcu.locale', 'ghcu.settings.v1', 'ghcu.theme']);
    expect(savedKeys().every((key) => key.startsWith(STORAGE_PREFIX))).toBe(true);
  });

  it('deletes every key of this app and leaves other keys alone', () => {
    const store = stubStorage({ 'ghcu.theme': 'dark', 'ghcu.palette': 'contrast', 'ghcu.digits': 'latin', 'ghcu.showCalc': '1', 'other.app': '1' });
    expect(deleteSavedData()).toBe(4);
    expect([...store.keys()]).toEqual(['other.app']);
    expect(savedKeys()).toEqual([]);
  });

  it('does not fail when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      get length(): number {
        throw new Error('blocked');
      },
    });
    expect(savedKeys()).toEqual([]);
    expect(deleteSavedData()).toBe(0);
  });
});
