import { describe, expect, it } from 'vitest';
import { clampAutoRate } from '../src/lib/analytics/autoDiscount';
import { DEFAULT_SETTINGS, type Settings } from '../src/lib/analytics/settings';
import { SETTING_REFS } from '../src/lib/metrics/settingRefs';
import { BEHAVIOR_GROUPS, SCALARS, scalarDisplay, unitText, type ScalarKey } from '../src/pages/settings/limits';
import { diffSettings, parseStoredSettings, readSettingsFile, sanitizeSettings, settingsJson } from '../src/pages/settings/settings-io';
import { defaultThresholds } from '../src/pages/settings/ThresholdsSection';
import { autoLimitsError, autoLimitsFileError } from '../src/pages/settings/validation';

const defaults = (): Settings => structuredClone(DEFAULT_SETTINGS);
const KEYS = Object.keys(SCALARS) as ScalarKey[];
const DEFAULT_LIMITS = { lowAuto: DEFAULT_SETTINGS.lowAuto, autoFirst: DEFAULT_SETTINGS.autoFirst };

describe('the Auto first from setting', () => {
  it('is a percent setting that starts at 50%, next to Rarely uses Auto below at 10%', () => {
    const spec = SCALARS.autoFirst;
    expect(spec.key).toBe('autoFirst');
    expect(spec.label).toBe('Auto first from');
    expect(spec.unit).toBe('percent');
    expect([spec.min, spec.max]).toEqual([1, 100]);
    expect(unitText(spec, scalarDisplay(spec, DEFAULT_SETTINGS))).toBe('50%');
    expect(SCALARS.lowAuto.label).toBe('Rarely uses Auto below');
    expect(unitText(SCALARS.lowAuto, scalarDisplay(SCALARS.lowAuto, DEFAULT_SETTINGS))).toBe('10%');
  });

  it('starts from defaults that obey the rule that the lower limit stays below the upper one', () => {
    expect(DEFAULT_SETTINGS.lowAuto).toBeLessThan(DEFAULT_SETTINGS.autoFirst);
  });

  it('sits in the Auto use class group, after Rarely uses Auto below', () => {
    expect(BEHAVIOR_GROUPS.find((group) => group.title === 'Auto use class')?.keys).toEqual(['lowAuto', 'autoFirst']);
  });

  it('is named in the section reset, like every other setting on the page', () => {
    const reset = defaultThresholds();
    expect(reset.autoFirst).toBe(DEFAULT_SETTINGS.autoFirst);
    for (const key of KEYS) expect(reset[key], key).toBe(DEFAULT_SETTINGS[key]);
  });
});

describe('the number settings', () => {
  it('give every setting a place on the page, and none twice', () => {
    const grouped = BEHAVIOR_GROUPS.flatMap((group) => group.keys);
    expect(new Set(grouped).size).toBe(grouped.length);
    // The Estimates and rankings card holds the other two.
    expect([...grouped, 'autoDiscount', 'topN'].sort()).toEqual([...KEYS].sort());
  });

  it('keep every default inside its own range, so a file with the defaults is accepted', () => {
    for (const key of KEYS) {
      const spec = SCALARS[key];
      const shown = scalarDisplay(spec, DEFAULT_SETTINGS);
      expect(shown, key).toBeGreaterThanOrEqual(spec.min);
      expect(shown, key).toBeLessThanOrEqual(spec.max);
      if (spec.integer) expect(Number.isInteger(shown), key).toBe(true);
    }
    const { partial, ignored } = sanitizeSettings(defaults() as unknown as Record<string, unknown>);
    expect(ignored).toEqual([]);
    for (const key of KEYS) expect(partial[key], key).toBe(DEFAULT_SETTINGS[key]);
  });

  it('use the labels that the metric docs print for the same settings', () => {
    for (const key of KEYS) expect(SETTING_REFS[key].label, key).toBe(SCALARS[key].label);
  });
});

describe('the Auto model discount setting', () => {
  it('stops at the highest rate the analysis applies', () => {
    expect(SCALARS.autoDiscount.max / 100).toBe(clampAutoRate(1));
    expect(SCALARS.autoDiscount.min).toBe(0);
  });

  it('says it is the rate for plans with no Auto usage to measure from', () => {
    const text = SCALARS.autoDiscount.description;
    expect(text).toContain('no Auto usage to measure');
    expect(text).toContain('measured rate');
    expect(text).toContain('never changes usage, covered or billed amounts');
    expect(text).not.toMatch(/only (changes|affects|drives)|estimates only/i);
  });

  it('is ignored in a file above 90%, and accepted at 90%', () => {
    expect(sanitizeSettings({ autoDiscount: 0.9 }).partial.autoDiscount).toBe(0.9);
    const over = sanitizeSettings({ autoDiscount: 0.95 });
    expect(over.partial.autoDiscount).toBeUndefined();
    expect(over.ignored).toEqual(['Auto model discount: use a fraction from 0 to 0.9']);
  });
});

describe('autoLimitsError, the check behind the two inputs', () => {
  const current = { lowAuto: 0.1, autoFirst: 0.5 };

  it('accepts a Rarely uses Auto limit below Auto first from', () => {
    expect(autoLimitsError(current, 'lowAuto', 0.3)).toBeNull();
    expect(autoLimitsError(current, 'lowAuto', 0.49)).toBeNull();
  });

  it('rejects a Rarely uses Auto limit that reaches Auto first from, and says what to do', () => {
    const message = '"Rarely uses Auto below" must be below "Auto first from" (50%). Raise that setting first, or enter a lower value.';
    expect(autoLimitsError(current, 'lowAuto', 0.5)).toBe(message);
    expect(autoLimitsError(current, 'lowAuto', 0.8)).toBe(message);
  });

  it('accepts an Auto first limit above Rarely uses Auto below', () => {
    expect(autoLimitsError(current, 'autoFirst', 0.11)).toBeNull();
    expect(autoLimitsError(current, 'autoFirst', 1)).toBeNull();
  });

  it('rejects an Auto first limit at or below Rarely uses Auto below, and says what to do', () => {
    const message = '"Auto first from" must be above "Rarely uses Auto below" (10%). Lower that setting first, or enter a higher value.';
    expect(autoLimitsError(current, 'autoFirst', 0.1)).toBe(message);
    expect(autoLimitsError(current, 'autoFirst', 0.05)).toBe(message);
  });

  it('shows the other limit the way the page does', () => {
    expect(autoLimitsError({ lowAuto: 0.1, autoFirst: 0.125 }, 'lowAuto', 0.2)).toContain('(12.5%)');
  });
});

describe('autoLimitsFileError, the check for a settings file', () => {
  it('has nothing to say about a file that has neither limit', () => {
    expect(autoLimitsFileError({}, DEFAULT_LIMITS)).toBeNull();
    expect(autoLimitsFileError({}, { lowAuto: 0.6, autoFirst: 0.5 })).toBeNull();
  });

  it('accepts a pair that holds, and counts a limit that is missing at its default', () => {
    expect(autoLimitsFileError({ lowAuto: 0.2, autoFirst: 0.6 }, DEFAULT_LIMITS)).toBeNull();
    expect(autoLimitsFileError({ lowAuto: 0.3 }, DEFAULT_LIMITS)).toBeNull();
    expect(autoLimitsFileError({ autoFirst: 0.2 }, DEFAULT_LIMITS)).toBeNull();
  });

  it('rejects a pair that overlaps and says that both were left out', () => {
    expect(autoLimitsFileError({ lowAuto: 0.6, autoFirst: 0.5 }, DEFAULT_LIMITS)).toBe(
      'Auto use limits: "Rarely uses Auto below" (60%) must be below "Auto first from" (50%). "Rarely uses Auto below" and "Auto first from" were left out.',
    );
    expect(autoLimitsFileError({ lowAuto: 0.5, autoFirst: 0.5 }, DEFAULT_LIMITS)).not.toBeNull();
  });

  it('marks the side that comes from the defaults, and names only the limit that was in the file', () => {
    expect(autoLimitsFileError({ lowAuto: 0.6 }, DEFAULT_LIMITS)).toBe(
      'Auto use limits: "Rarely uses Auto below" (60%) must be below "Auto first from" (50%, the default). "Rarely uses Auto below" was left out.',
    );
    expect(autoLimitsFileError({ autoFirst: 0.05 }, DEFAULT_LIMITS)).toBe(
      'Auto use limits: "Rarely uses Auto below" (10%, the default) must be below "Auto first from" (5%). "Auto first from" was left out.',
    );
  });
});

describe('sanitizeSettings and the Auto use limits', () => {
  it('keeps a valid pair, in any key order', () => {
    const { partial, ignored } = sanitizeSettings({ autoFirst: 0.7, lowAuto: 0.2 });
    expect(partial.autoFirst).toBe(0.7);
    expect(partial.lowAuto).toBe(0.2);
    expect(ignored).toEqual([]);
  });

  it('counts autoFirst as a setting that it knows', () => {
    expect(sanitizeSettings({ autoFirst: 0.7 }).recognized).toBe(1);
  });

  it('leaves out both limits of a pair that overlaps, keeps the rest and says why', () => {
    const { partial, ignored } = sanitizeSettings({ topN: 7, lowAuto: 0.6, autoFirst: 0.5 });
    expect(partial.topN).toBe(7);
    expect('lowAuto' in partial).toBe(false);
    expect('autoFirst' in partial).toBe(false);
    expect(ignored).toHaveLength(1);
    expect(ignored[0]).toContain('must be below');
  });

  it('checks a limit on its own against the default of the other one', () => {
    expect(sanitizeSettings({ lowAuto: 0.3 }).partial.lowAuto).toBe(0.3);
    expect(sanitizeSettings({ autoFirst: 0.2 }).partial.autoFirst).toBe(0.2);

    const tooHigh = sanitizeSettings({ lowAuto: 0.6 });
    expect(tooHigh.partial.lowAuto).toBeUndefined();
    expect(tooHigh.ignored).toHaveLength(1);
    expect(tooHigh.ignored[0]).toContain('(50%, the default)');

    const tooLow = sanitizeSettings({ autoFirst: 0.05 });
    expect(tooLow.partial.autoFirst).toBeUndefined();
    expect(tooLow.ignored).toHaveLength(1);
    expect(tooLow.ignored[0]).toContain('(10%, the default)');
  });

  it('reports an Auto first value that is out of range as a range problem, once', () => {
    for (const bad of [0, 0.001, 1.5, -1, '0.5', null, Number.NaN]) {
      const { partial, ignored } = sanitizeSettings({ autoFirst: bad });
      expect(partial.autoFirst, String(bad)).toBeUndefined();
      expect(ignored, String(bad)).toEqual(['Auto first from: use a fraction from 0.01 to 1']);
    }
  });
});

describe('settings export and import with the Auto use limits', () => {
  const custom = (): Settings => ({ ...defaults(), lowAuto: 0.2, autoFirst: 0.65, autoDiscount: 0.25 });

  it('writes both limits to the file', () => {
    const file = JSON.parse(settingsJson(custom())) as Record<string, unknown>;
    expect(file.lowAuto).toBe(0.2);
    expect(file.autoFirst).toBe(0.65);
  });

  it('reads back exactly what it wrote, with nothing left out', () => {
    const read = readSettingsFile(settingsJson(custom()));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.ignored).toEqual([]);
    expect(read.next).toEqual(custom());
  });

  it('keeps both limits in the text stored in the browser', () => {
    const stored = parseStoredSettings(JSON.stringify(custom()));
    expect(stored.lowAuto).toBe(0.2);
    expect(stored.autoFirst).toBe(0.65);
    expect(parseStoredSettings(JSON.stringify(stored))).toEqual(stored);
  });

  it('lists the change to Auto first from when a file is imported', () => {
    expect(diffSettings(defaults(), custom())).toEqual([
      'Rarely uses Auto below: 10% to 20%',
      'Auto first from: 50% to 65%',
      'Auto model discount: 10% to 25%',
    ]);
  });

  it('accepts a file that has only one of the limits', () => {
    const read = readSettingsFile('{"lowAuto":0.2,"topN":5}');
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.ignored).toEqual([]);
    expect(read.next.lowAuto).toBe(0.2);
    expect(read.next.autoFirst).toBe(DEFAULT_SETTINGS.autoFirst);
  });

  it('does not import limits that overlap, and says so in the list of left-out items', () => {
    const read = readSettingsFile(JSON.stringify({ ...defaults(), lowAuto: 0.7, autoFirst: 0.6 }));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.next.lowAuto).toBe(DEFAULT_SETTINGS.lowAuto);
    expect(read.next.autoFirst).toBe(DEFAULT_SETTINGS.autoFirst);
    expect(read.ignored).toEqual([
      'Auto use limits: "Rarely uses Auto below" (70%) must be below "Auto first from" (60%). "Rarely uses Auto below" and "Auto first from" were left out.',
    ]);
  });

  it('falls back to the default limits when the stored pair overlaps', () => {
    const stored = parseStoredSettings('{"lowAuto":0.7,"autoFirst":0.6,"topN":9}');
    expect(stored.lowAuto).toBe(DEFAULT_SETTINGS.lowAuto);
    expect(stored.autoFirst).toBe(DEFAULT_SETTINGS.autoFirst);
    expect(stored.topN).toBe(9);
  });
});
