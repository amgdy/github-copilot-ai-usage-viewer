import { describe, expect, it } from 'vitest';
import { csvEscape, toCsv } from '../src/lib/utils/format';

describe('csvEscape', () => {
  it('quotes cells that contain separators, quotes or line breaks', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('two\nlines')).toBe('"two\nlines"');
  });

  it('writes numbers plainly and blanks for missing or non-finite values', () => {
    expect(csvEscape(12.5)).toBe('12.5');
    expect(csvEscape(-3)).toBe('-3');
    expect(csvEscape(NaN)).toBe('');
    expect(csvEscape(Infinity)).toBe('');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('defuses text that a spreadsheet would run as a formula', () => {
    expect(csvEscape('=HYPERLINK("http://x","y")')).toBe(`"'=HYPERLINK(""http://x"",""y"")"`);
    expect(csvEscape('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvEscape('+cmd')).toBe("'+cmd");
    expect(csvEscape('-cmd|x')).toBe("'-cmd|x");
    expect(csvEscape('\tx')).toBe("'\tx");
  });

  it('leaves signed numbers written as text alone', () => {
    for (const s of ['-5', '+12.5', '-12.5%', '-$3.20', '-1e-7']) expect(csvEscape(s)).toBe(s);
    expect(csvEscape('+$1,200.50')).toBe('"+$1,200.50"');
  });

  it('does not touch ordinary text', () => {
    expect(csvEscape('example-org')).toBe('example-org');
    expect(csvEscape('Claude Sonnet 4.6')).toBe('Claude Sonnet 4.6');
  });
});

describe('toCsv', () => {
  it('joins a header row and the data rows with commas', () => {
    expect(toCsv(['a', 'b'], [[1, 'x'], [2, '=y']])).toBe("a,b\n1,x\n2,'=y");
  });
});
