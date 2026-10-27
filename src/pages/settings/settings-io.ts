import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, isIsoDay, mergeSettings, type RosterEntry, type Settings } from '../../lib/analytics/settings';
import { sanitizeRosterDetailed } from '../../lib/licenses';
import { VENDORS, type Rates, type Vendor } from '../../lib/pricing/card';
import type { ModelOverride, ModelOverrides } from '../../lib/pricing/models';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { msg, t, tp } from '../../i18n';
import { LIMITS, SCALARS, scalarDisplay, unitText, type Range, type ScalarSpec } from './limits';
import { MAX_RATE, TIERS, type Tier } from './models';
import { inRange, numText, toPct } from './numbers';
import { autoLimitsFileError, isStrictlyAscending } from './validation';

export { SETTINGS_STORAGE_KEY };

/** Settings files are small, but a license list of 20,000 seats with its details takes about 4.3 MB. */
export const MAX_SETTINGS_FILE_BYTES = 25 * 1024 * 1024;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** JSON with sorted keys, so two equal values always compare equal. */
function stable(v: unknown): string {
  return JSON.stringify(v, (_key, val: unknown) => (isObject(val) ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : val));
}

/** `label` is English; it is translated here. */
function readGroup<K extends string>(raw: unknown, label: string, defaults: Record<K, number>, order: readonly K[], rangeOf: (key: K) => Range, ignored: string[]): Record<K, number> | undefined {
  const name = t(label);
  if (!isObject(raw)) {
    ignored.push(t('{name}: expected an object', { name }));
    return undefined;
  }
  const merged = { ...defaults };
  for (const key of order) {
    if (!Object.hasOwn(raw, key)) continue;
    const v = raw[key];
    const r = rangeOf(key);
    if (typeof v !== 'number' || !inRange(toPct(v), r.min, r.max)) {
      ignored.push(t('{name}: "{key}" must be a fraction from {min} to {max}', { name, key, min: String(r.min / 100), max: String(r.max / 100) }));
      return undefined;
    }
    merged[key] = v;
  }
  if (!isStrictlyAscending(order.map((k) => merged[k]))) {
    ignored.push(t('{name}: the values must increase from "{first}" to "{last}"', { name, first: order[0], last: order[order.length - 1] }));
    return undefined;
  }
  return merged;
}

function expected(spec: ScalarSpec): string {
  if (spec.unit === 'percent') return t('use a fraction from {min} to {max}', { min: String(spec.min / 100), max: String(spec.max / 100) });
  if (spec.unit === 'usd') return t('use an amount from {min} to {max}', { min: String(spec.min), max: fmtInt(spec.max) });
  return t('use a whole number from {min} to {max}', { min: String(spec.min), max: fmtInt(spec.max) });
}

function readRates(v: unknown): Rates | null {
  if (!isObject(v)) return null;
  const { input, cachedInput, cacheWrite, output } = v;
  if (!inRange(input, 0, MAX_RATE) || !inRange(cachedInput, 0, MAX_RATE) || !inRange(cacheWrite, 0, MAX_RATE) || !inRange(output, 0, MAX_RATE)) return null;
  return { input, cachedInput, cacheWrite, output };
}

function readOverride(v: unknown): ModelOverride | null {
  if (!isObject(v)) return null;
  const out: ModelOverride = {};
  if (typeof v.vendor === 'string' && (VENDORS as string[]).includes(v.vendor)) out.vendor = v.vendor as Vendor;
  if (typeof v.category === 'string' && (TIERS as string[]).includes(v.category)) out.category = v.category as Tier;
  const base = readRates(v.base);
  if (base && (base.input > 0 || base.output > 0)) out.base = base;
  if (v.long === null) out.long = null;
  else {
    const long = readRates(v.long);
    if (long) out.long = long;
  }
  if (inRange(v.longThreshold, 1, 1e9)) out.longThreshold = v.longThreshold;
  return Object.keys(out).length > 0 ? out : null;
}

function readOverrides(raw: unknown, ignored: string[]): ModelOverrides | undefined {
  if (!isObject(raw)) {
    ignored.push(t('Model price overrides: expected an object'));
    return undefined;
  }
  const out: ModelOverrides = {};
  let dropped = 0;
  for (const [name, value] of Object.entries(raw)) {
    const override = name && name !== '__proto__' ? readOverride(value) : null;
    if (override) out[name] = override;
    else dropped++;
  }
  if (dropped > 0) {
    ignored.push(
      tp(dropped, 'Model price overrides: {n} entry could not be read and was left out', 'Model price overrides: {n} entries could not be read and were left out', { n: fmtInt(dropped) }),
    );
  }
  return out;
}

function readRoster(raw: unknown, ignored: string[]): RosterEntry[] | undefined {
  const r = sanitizeRosterDetailed(raw);
  if (r.notAList) {
    ignored.push(t('License list: expected a list'));
    return undefined;
  }
  if (r.invalid > 0) {
    ignored.push(
      tp(r.invalid, 'License list: {n} entry without a usable username left out', 'License list: {n} entries without a usable username left out', { n: fmtInt(r.invalid) }),
    );
  }
  if (r.duplicates > 0) ignored.push(tp(r.duplicates, 'License list: {n} duplicate left out', 'License list: {n} duplicates left out', { n: fmtInt(r.duplicates) }));
  if (r.unreadablePlans > 0) {
    ignored.push(
      tp(
        r.unreadablePlans,
        'License list: {n} plan value could not be read and was left empty',
        'License list: {n} plan values could not be read and were left empty',
        { n: fmtInt(r.unreadablePlans) },
      ),
    );
  }
  return r.entries;
}

export interface SanitizeResult {
  /** Only valid values, for `mergeSettings`. */
  partial: Partial<Settings>;
  /** What was left out and why. */
  ignored: string[];
  /** How many known settings the file contained. */
  recognized: number;
}

/**
 * Keeps the valid settings from an object read from a file. `mergeSettings` does no checking of its own,
 * so a wrong type or an out-of-range value must never get that far.
 */
export function sanitizeSettings(raw: Record<string, unknown>): SanitizeResult {
  const partial: Partial<Settings> = {};
  const ignored: string[] = [];
  const known = Object.keys(DEFAULT_SETTINGS);
  const has = (key: string) => Object.hasOwn(raw, key);
  const recognized = known.filter(has).length;

  const unknown = Object.keys(raw).filter((k) => !known.includes(k));
  if (unknown.length > 5) ignored.push(t('Unknown settings left out: {names} and {n} more', { names: unknown.slice(0, 5).join(', '), n: fmtInt(unknown.length - 5) }));
  else if (unknown.length > 0) ignored.push(t('Unknown settings left out: {names}', { names: unknown.join(', ') }));

  if (has('activeThreshold')) {
    const v = raw.activeThreshold;
    if (inRange(v, LIMITS.activeThreshold.min, LIMITS.activeThreshold.max)) partial.activeThreshold = v;
    else ignored.push(t('Active-day threshold: use an amount from {min} to {max}', { min: String(LIMITS.activeThreshold.min), max: fmtInt(LIMITS.activeThreshold.max) }));
  }
  if (has('tiers')) {
    const g = readGroup(raw.tiers, msg('Spend tiers'), DEFAULT_SETTINGS.tiers, ['minimal', 'light', 'core', 'power'], () => LIMITS.tier, ignored);
    if (g) partial.tiers = g;
  }
  if (has('engagement')) {
    const g = readGroup(raw.engagement, msg('Engagement'), DEFAULT_SETTINGS.engagement, ['occasional', 'regular', 'daily'], () => LIMITS.engagement, ignored);
    if (g) partial.engagement = g;
  }
  if (has('pareto')) {
    const g = readGroup(raw.pareto, msg('Pareto classes'), DEFAULT_SETTINGS.pareto, ['a', 'b'], (k) => (k === 'a' ? LIMITS.paretoA : LIMITS.paretoB), ignored);
    if (g) partial.pareto = g;
  }

  for (const spec of Object.values(SCALARS)) {
    if (!has(spec.key)) continue;
    const v = raw[spec.key];
    const shown = typeof v === 'number' ? (spec.unit === 'percent' ? toPct(v) : v) : Number.NaN;
    if (typeof v === 'number' && inRange(shown, spec.min, spec.max) && (!spec.integer || Number.isInteger(v))) partial[spec.key] = v;
    else ignored.push(t('{name}: {expected}', { name: t(spec.label), expected: expected(spec) }));
  }

  // Both Auto use limits go together, as a whole group does: a file cannot pick which one of a conflicting pair to keep.
  const autoConflict = autoLimitsFileError(partial, DEFAULT_SETTINGS);
  if (autoConflict) {
    delete partial.lowAuto;
    delete partial.autoFirst;
    ignored.push(autoConflict);
  }

  if (has('budgetMonthlyBilled')) {
    const v = raw.budgetMonthlyBilled;
    if (v === null) partial.budgetMonthlyBilled = null;
    else if (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= LIMITS.budget.max) partial.budgetMonthlyBilled = v;
    else ignored.push(t('Monthly budget: use an amount above 0, or null for no budget'));
  }

  if (has('extraSeats')) {
    const v = raw.extraSeats;
    if (!isObject(v)) ignored.push(t('Extra seats: expected an object'));
    else {
      const seats = { ...DEFAULT_SETTINGS.extraSeats };
      for (const plan of ['business', 'enterprise'] as const) {
        if (!Object.hasOwn(v, plan)) continue;
        const n = v[plan];
        if (typeof n === 'number' && Number.isInteger(n) && inRange(n, LIMITS.extraSeats.min, LIMITS.extraSeats.max)) seats[plan] = n;
        else if (plan === 'business') ignored.push(t('Extra Business seats: use a whole number from 0 to {max}', { max: fmtInt(LIMITS.extraSeats.max) }));
        else ignored.push(t('Extra Enterprise seats: use a whole number from 0 to {max}', { max: fmtInt(LIMITS.extraSeats.max) }));
      }
      partial.extraSeats = seats;
    }
  }

  if (has('roster')) {
    const roster = readRoster(raw.roster, ignored);
    if (roster) partial.roster = roster;
  }
  if (has('rosterAsOf')) {
    if (isIsoDay(raw.rosterAsOf)) partial.rosterAsOf = raw.rosterAsOf;
    else ignored.push(t('License list date: use a day written as YYYY-MM-DD'));
  }
  if (has('modelOverrides')) {
    const overrides = readOverrides(raw.modelOverrides, ignored);
    if (overrides) partial.modelOverrides = overrides;
  }

  return { partial, ignored, recognized };
}

/**
 * Settings from the text kept in this browser. Whatever is damaged or out of range falls back to its default,
 * so a bad stored value (a hand edit, another app on the same site) can never reach the analysis.
 */
export function parseStoredSettings(raw: string | null): Settings {
  try {
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (isObject(data)) return mergeSettings(sanitizeSettings(data).partial);
  } catch {
    /* not JSON: start from the defaults */
  }
  return structuredClone(DEFAULT_SETTINGS);
}

export function loadStoredSettings(): Settings {
  try {
    return parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export type ReadResult = { ok: true; next: Settings; ignored: string[] } | { ok: false; error: string };

/** Reads the text of a settings file. Settings that the file does not have fall back to their defaults. */
export function readSettingsFile(text: string): ReadResult {
  let data: unknown;
  try {
    data = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    return { ok: false, error: t('This file is not valid JSON.') };
  }
  if (!isObject(data)) return { ok: false, error: t('The file must hold a settings object, not a list or a single value.') };
  const { partial, ignored, recognized } = sanitizeSettings(data);
  if (recognized === 0) return { ok: false, error: t('No known settings were found in this file.') };
  return { ok: true, next: mergeSettings(partial), ignored };
}

interface Fact {
  /** English; translated when the line is built. */
  label: string;
  text: string;
  /** Compared instead of the text when the text alone cannot show a difference. */
  sig?: string;
}

const pct = (fraction: number) => `${numText(toPct(fraction), 2)}%`;

function facts(s: Settings): Fact[] {
  const overrides = Object.keys(s.modelOverrides).length;
  return [
    { label: msg('Active-day threshold'), text: `$${numText(s.activeThreshold, 4)}` },
    { label: msg('Minimal tier limit'), text: pct(s.tiers.minimal) },
    { label: msg('Light tier limit'), text: pct(s.tiers.light) },
    { label: msg('Core tier limit'), text: pct(s.tiers.core) },
    { label: msg('Power tier limit'), text: pct(s.tiers.power) },
    { label: msg('Occasional engagement cutoff'), text: pct(s.engagement.occasional) },
    { label: msg('Regular engagement cutoff'), text: pct(s.engagement.regular) },
    { label: msg('Daily engagement cutoff'), text: pct(s.engagement.daily) },
    { label: msg('Pareto class A cutoff'), text: pct(s.pareto.a) },
    { label: msg('Pareto class B cutoff'), text: pct(s.pareto.b) },
    ...Object.values(SCALARS).map((spec) => ({ label: spec.label, text: unitText(spec, scalarDisplay(spec, s)) })),
    { label: msg('Monthly budget'), text: s.budgetMonthlyBilled === null ? t('none') : fmtUSD(s.budgetMonthlyBilled, 2) },
    { label: msg('License list'), text: s.roster.length === 0 ? t('empty') : tp(s.roster.length, '{n} seat', '{n} seats', { n: fmtInt(s.roster.length) }), sig: stable(s.roster) },
    { label: msg('License list date'), text: s.rosterAsOf ?? t('none') },
    { label: msg('Extra Business seats'), text: fmtInt(s.extraSeats.business) },
    { label: msg('Extra Enterprise seats'), text: fmtInt(s.extraSeats.enterprise) },
    { label: msg('Model price overrides'), text: overrides === 0 ? t('none') : tp(overrides, '{n} model', '{n} models', { n: fmtInt(overrides) }), sig: stable(s.modelOverrides) },
  ];
}

/** One line per setting whose value differs, for example "Light tier limit: 40% to 50%". */
export function diffSettings(before: Settings, after: Settings): string[] {
  const b = facts(before);
  const a = facts(after);
  const out: string[] = [];
  b.forEach((f, i) => {
    const g = a[i];
    if ((f.sig ?? f.text) === (g.sig ?? g.text)) return;
    const label = t(f.label);
    out.push(f.text === g.text ? t('{label}: contents changed', { label }) : t('{label}: {from} to {to}', { label, from: f.text, to: g.text }));
  });
  return out;
}

export function settingsFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `github-copilot-settings-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

export const settingsJson = (s: Settings): string => JSON.stringify(s, null, 2);

/** Whether the browser lets this page write to local storage. */
export function storageWorks(): boolean {
  try {
    localStorage.setItem('ghcu.probe', '1');
    localStorage.removeItem('ghcu.probe');
    return true;
  } catch {
    return false;
  }
}

/** Whether what is stored in this browser matches the settings in memory. */
export function isStored(s: Settings): boolean {
  try {
    return localStorage.getItem(SETTINGS_STORAGE_KEY) === JSON.stringify(s);
  } catch {
    return false;
  }
}
