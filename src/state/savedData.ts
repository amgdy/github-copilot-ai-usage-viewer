/** Every key this app writes to local storage starts with this prefix. */
export const STORAGE_PREFIX = 'ghcu.';

/** The keys this app has saved in this browser, A to Z. Empty when storage is blocked. */
export function savedKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    return keys.sort();
  } catch {
    return [];
  }
}

/** Removes everything this app saved in this browser and returns how many keys were removed. Other sites and apps are not touched. */
export function deleteSavedData(): number {
  const keys = savedKeys();
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage can be blocked; nothing was saved then */
    }
  }
  return keys.length;
}
