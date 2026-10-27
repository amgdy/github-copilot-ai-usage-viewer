import { createContext } from 'react';

/**
 * Changes when the settings are replaced as a whole (an import or "Reset all settings").
 * Sections key their inputs on it, so every field shows the new values and no stale draft or error stays behind.
 */
export const PageEpoch = createContext(0);
