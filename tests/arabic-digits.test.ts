import { afterEach, describe, expect, it } from 'vitest';
import { applyDigitStyle, applyLocale, localizeDigits, t, tp } from '../src/i18n/core';
import { fmtDay, monthLabel } from '../src/lib/utils/date';
import { csvEscape, fmtDelta, fmtInt, fmtPct, fmtUSD, toCsv } from '../src/lib/utils/format';

afterEach(() => {
  applyLocale('en', {});
  applyDigitStyle('arabic');
});

describe('digits in Arabic', () => {
  it('keeps Latin digits in English, whatever the Arabic choice is', () => {
    applyDigitStyle('arabic');
    expect(fmtUSD(12345.6, 2)).toBe('$12,345.60');
    expect(fmtPct(0.125)).toBe('12.5%');
    expect(localizeDigits('2026')).toBe('2026');
  });

  it('shows Arabic-Indic digits, separators and percent signs in Arabic by default', () => {
    applyLocale('ar', {});
    expect(fmtUSD(12345.6, 2)).toBe('$١٢٬٣٤٥٫٦٠');
    expect(fmtInt(140)).toBe('١٤٠');
    expect(fmtPct(0.125)).toBe('١٢٫٥٪');
    expect(fmtDelta(150, 100)?.text).toBe('+٥٠٫٠٪');
    expect(fmtDay(0, true)).toBe('١ يناير ١٩٧٠');
    expect(monthLabel(2026 * 12 + 9)).toBe('أكتوبر ٢٠٢٦');
  });

  it('fills counted and number values in the chosen digits, but leaves names as they are', () => {
    applyLocale('ar', {});
    expect(t('{n} users of {model}', { n: 12, model: 'GPT-4.1' })).toBe('١٢ users of GPT-4.1');
    expect(tp(3, '{n} day', '{n} days')).toBe('٣ days');
    expect(localizeDigits('KofiIto_nwind')).toBe('KofiIto_nwind');
  });

  it('uses Latin digits in Arabic when the user picks them', () => {
    applyLocale('ar', {});
    applyDigitStyle('latin');
    expect(fmtUSD(12345.6, 2)).toBe('$12,345.60');
    expect(fmtPct(0.125)).toBe('12.5%');
  });

  it('keeps Latin digits in CSV files so spreadsheets can read them', () => {
    applyLocale('ar', {});
    expect(csvEscape(1234.5)).toBe('1234.5');
    expect(toCsv(['Usage'], [[1234.5]])).toBe('Usage\n1234.5');
  });
});
