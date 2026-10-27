import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../src/lib/analytics/settings';
import { loadStoredSettings, parseStoredSettings } from '../src/pages/settings/settings-io';

const defaults = () => structuredClone(DEFAULT_SETTINGS);

describe('parseStoredSettings', () => {
  it('returns the defaults when nothing is stored or the text is not usable', () => {
    for (const raw of [null, '', 'not json {{{', 'null', '[]', '5', '"text"']) {
      expect(parseStoredSettings(raw)).toEqual(defaults());
    }
  });

  it('does not hand back the shared defaults object', () => {
    const a = parseStoredSettings(null);
    a.tiers.minimal = 0.99;
    a.roster.push({ user: 'x' });
    expect(DEFAULT_SETTINGS.tiers.minimal).toBe(0.1);
    expect(DEFAULT_SETTINGS.roster).toEqual([]);
  });

  it('keeps valid stored values', () => {
    const stored = { ...defaults(), budgetMonthlyBilled: 500, tiers: { minimal: 0.2, light: 0.4, core: 1, power: 3 }, roster: [{ user: 'ana', plan: 'Business' }, { user: 'bo' }], topN: 5 };
    expect(parseStoredSettings(JSON.stringify(stored))).toEqual(stored);
  });

  // Each of these once crashed the app: the roster ones inside the analysis, the override one on the Settings page.
  it('drops a roster that is not a list of seats', () => {
    expect(parseStoredSettings('{"roster":"abc"}').roster).toEqual([]);
    const messy = parseStoredSettings('{"roster":[null,5,{"user":5},{"user":"x","plan":{}},{"user":"Ana"},{"user":"ana"}]}').roster;
    expect(messy).toEqual([{ user: 'x' }, { user: 'Ana' }]);
  });

  it('drops model overrides that are not usable', () => {
    expect(parseStoredSettings('{"modelOverrides":[1,2]}').modelOverrides).toEqual({});
    const bad = '{"modelOverrides":{"A":5,"B":{"base":"x","category":7},"C":{"category":"Lightweight"},"__proto__":{"category":"Powerful"}}}';
    const out = parseStoredSettings(bad).modelOverrides;
    expect(Object.keys(out)).toEqual(['C']);
    expect(out.C).toEqual({ category: 'Lightweight' });
  });

  it('falls back to the default for each wrong or out-of-range value and keeps the rest', () => {
    const s = parseStoredSettings('{"tiers":{"minimal":"x","light":null},"engagement":5,"pareto":[1,2],"budgetMonthlyBilled":"500","extraSeats":{"business":"a","enterprise":-5},"topN":"ten","lapsedDays":-5,"newUserDays":1e12,"activeThreshold":0.2}');
    expect(s.tiers).toEqual(DEFAULT_SETTINGS.tiers);
    expect(s.engagement).toEqual(DEFAULT_SETTINGS.engagement);
    expect(s.pareto).toEqual(DEFAULT_SETTINGS.pareto);
    expect(s.budgetMonthlyBilled).toBeNull();
    expect(s.extraSeats).toEqual(DEFAULT_SETTINGS.extraSeats);
    expect(s.topN).toBe(DEFAULT_SETTINGS.topN);
    expect(s.lapsedDays).toBe(DEFAULT_SETTINGS.lapsedDays);
    expect(s.newUserDays).toBe(DEFAULT_SETTINGS.newUserDays);
    expect(s.activeThreshold).toBe(0.2);
  });

  it('leaves out settings this version does not know', () => {
    const s = parseStoredSettings('{"topN":7,"surprise":1}') as unknown as Record<string, unknown>;
    expect(s.topN).toBe(7);
    expect('surprise' in s).toBe(false);
  });

  it('treats a budget of zero as no budget', () => {
    expect(parseStoredSettings('{"budgetMonthlyBilled":0}').budgetMonthlyBilled).toBeNull();
  });
});

describe('loadStoredSettings', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the saved text from local storage', () => {
    const store = new Map<string, string>([[SETTINGS_STORAGE_KEY, '{"topN":3}']]);
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null });
    expect(loadStoredSettings().topN).toBe(3);
  });

  it('starts from the defaults when the browser refuses access to storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadStoredSettings()).toEqual(defaults());
  });

  it('starts from the defaults when there is no local storage at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadStoredSettings()).toEqual(defaults());
  });
});
