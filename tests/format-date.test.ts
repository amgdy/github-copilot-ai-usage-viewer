import { describe, expect, it } from 'vitest';
import { CsvTokenizer } from '../src/lib/csv/tokenizer';
import {
  DAYS_PER_MONTH,
  DOW_NAMES,
  MONTH_NAMES,
  dayFromYMD,
  dayToDate,
  daysInMonth,
  dowOf,
  fmtDay,
  isoDate,
  monthEndDay,
  monthIndexOf,
  monthKey,
  monthLabel,
  monthStartDay,
  parseIsoDay,
  workdaysBetween,
  ymd,
} from '../src/lib/utils/date';
import {
  csvEscape,
  fmtCompact,
  fmtDelta,
  fmtInt,
  fmtMultiple,
  fmtNum,
  fmtPct,
  fmtPctAuto,
  fmtUSD,
  fmtUSDCompact,
  pluralize,
  toCsv,
} from '../src/lib/utils/format';
import { mulberry32 } from './helpers';

const DASH = '\u2013';
const TIMES = '\u00d7';

/** Parses a formatted number back, e.g. "-$1,234.50" or "12.3K" (the suffix is applied). */
function parseMoney(s: string): number {
  const m = /^(-?)\$?([\d,]+(?:\.\d+)?)([KMBT]?)$/.exec(s);
  if (!m) return NaN;
  const mult = { '': 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[3] as '' | 'K' | 'M' | 'B' | 'T'];
  return (m[1] === '-' ? -1 : 1) * Number(m[2].replace(/,/g, '')) * mult;
}

describe('fmtUSD', () => {
  it('chooses the number of decimals from the size of the amount', () => {
    const cases: [number, string][] = [
      [0, '$0.00'],
      [0.00004, '$0.0000'],
      [0.0123, '$0.0123'],
      [0.5, '$0.5000'],
      [1, '$1.00'],
      [9.999, '$10.00'],
      [1234.5, '$1,234.50'],
      [9999.994, '$9,999.99'],
      [10_000, '$10,000'],
      [12_345.67, '$12,346'],
      [1_000_000, '$1,000,000'],
      [-0.5, '-$0.5000'],
      [-5, '-$5.00'],
      [-12_345.6, '-$12,346'],
    ];
    for (const [v, want] of cases) expect(fmtUSD(v), String(v)).toBe(want);
  });

  it('honours an explicit number of decimals', () => {
    expect(fmtUSD(1234.567, 0)).toBe('$1,235');
    expect(fmtUSD(1234.567, 2)).toBe('$1,234.57');
    expect(fmtUSD(1234.567, 4)).toBe('$1,234.5670');
    expect(fmtUSD(0.4, 0)).toBe('$0');
    expect(fmtUSD(0.4, 2)).toBe('$0.40');
    expect(fmtUSD(-3, 2)).toBe('-$3.00');
    expect(fmtUSD(5, 'auto')).toBe(fmtUSD(5));
  });

  it('shows an en dash instead of NaN or infinity', () => {
    for (const v of [NaN, Infinity, -Infinity]) {
      for (const digits of [0, 2, 4, 'auto'] as const) expect(fmtUSD(v, digits)).toBe(DASH);
    }
  });

  it('stays within half a unit of the displayed precision of the real value', () => {
    const rand = mulberry32(11);
    const bad: string[] = [];
    for (let i = 0; i < 4000; i++) {
      const v = (rand() < 0.5 ? -1 : 1) * 10 ** (rand() * 11 - 5);
      const a = Math.abs(v);
      const decimals = a >= 10_000 ? 0 : a >= 1 ? 2 : 4;
      const s = fmtUSD(v);
      const back = parseMoney(s);
      if (!(Math.abs(back - v) <= 0.5 * 10 ** -decimals + 1e-9 * Math.max(1, a))) bad.push(`${v} -> ${s}`);
      if (!/^-?\$[\d,]+(\.\d+)?$/.test(s)) bad.push(`shape ${v} -> ${s}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('fmtUSDCompact', () => {
  it('abbreviates thousands, millions and billions and keeps small amounts exact', () => {
    const cases: [number, string][] = [
      [0, '$0'],
      [0.0004, '$0.000'],
      [0.0123, '$0.012'],
      [1, '$1.00'],
      [5.5, '$5.50'],
      [99.99, '$99.99'],
      [100, '$100'],
      [1234.5, '$1,235'],
      [10_000, '$10.0K'],
      [12_345, '$12.3K'],
      [1_000_000, '$1.00M'],
      [2_500_000, '$2.50M'],
      [1e9, '$1.00B'],
      [1.234e9, '$1.23B'],
      [-5, '-$5.00'],
      [-1234.5, '-$1,235'],
      [-2_500_000, '-$2.50M'],
    ];
    for (const [v, want] of cases) expect(fmtUSDCompact(v), String(v)).toBe(want);
  });

  it('shows an en dash instead of NaN or infinity', () => {
    for (const v of [NaN, Infinity, -Infinity]) expect(fmtUSDCompact(v)).toBe(DASH);
  });

  it('stays close to the real value over twelve orders of magnitude', () => {
    const rand = mulberry32(12);
    const bad: string[] = [];
    for (let i = 0; i < 4000; i++) {
      const v = (rand() < 0.5 ? -1 : 1) * 10 ** (rand() * 15 - 3);
      const s = fmtUSDCompact(v);
      const back = parseMoney(s);
      if (!(Math.abs(back - v) <= 0.006 * Math.abs(v) + 0.00051)) bad.push(`${v} -> ${s}`);
    }
    expect(bad).toEqual([]);
  });

  it('moves up a unit instead of printing 1000 of the smaller one', () => {
    const cases: [number, string][] = [
      [999_949, '$999.9K'],
      [999_999, '$1.00M'],
      [999_999_999, '$1.00B'],
      [-999_999, '-$1.00M'],
    ];
    for (const [v, want] of cases) expect(fmtUSDCompact(v), String(v)).toBe(want);
    for (const v of [999_950, 999_999, 999_999_000, 999_999_999]) expect(fmtUSDCompact(v), String(v)).not.toMatch(/\$1000/);
  });
});

describe('fmtCompact', () => {
  it('abbreviates counts with a K, M, B or T suffix', () => {
    const cases: [number, string][] = [
      [0, '0.00'],
      [5, '5.00'],
      [9.99, '9.99'],
      [10, '10.0'],
      [100, '100'],
      [999, '999'],
      [1000, '1.0K'],
      [1234, '1.2K'],
      [1_000_000, '1.00M'],
      [1.5e9, '1.50B'],
      [2e12, '2.00T'],
      [-1500, '-1.5K'],
    ];
    for (const [v, want] of cases) expect(fmtCompact(v), String(v)).toBe(want);
    expect(fmtCompact(NaN)).toBe(DASH);
    expect(fmtCompact(Infinity)).toBe(DASH);
  });

  it('stays close to the real value', () => {
    const rand = mulberry32(13);
    const bad: string[] = [];
    for (let i = 0; i < 4000; i++) {
      const v = (rand() < 0.5 ? -1 : 1) * 10 ** (rand() * 16 - 2);
      const s = fmtCompact(v);
      const back = parseMoney(s.replace(/^(-?)/, '$1$'));
      if (!(Math.abs(back - v) <= 0.051 * Math.abs(v) + 0.006)) bad.push(`${v} -> ${s}`);
    }
    expect(bad).toEqual([]);
  });

  it('moves up a unit instead of printing 1000 of the smaller one', () => {
    const cases: [number, string][] = [
      [999.4, '999'],
      [999.7, '1.0K'],
      [999_949, '999.9K'],
      [999_999, '1.00M'],
      [999_999_999, '1.00B'],
      [999_999_999_999, '1.00T'],
      [-999_999, '-1.00M'],
    ];
    for (const [v, want] of cases) expect(fmtCompact(v), String(v)).toBe(want);
  });
});

describe('fmtInt and fmtNum', () => {
  it('fmtInt rounds and groups thousands', () => {
    expect(fmtInt(0)).toBe('0');
    expect(fmtInt(1_234_567)).toBe('1,234,567');
    expect(fmtInt(0.4999)).toBe('0');
    expect(fmtInt(0.5)).toBe('1');
    expect(fmtInt(-1)).toBe('-1');
    expect(fmtInt(NaN)).toBe(DASH);
    expect(fmtInt(Infinity)).toBe(DASH);
  });

  it('fmtNum keeps the requested number of decimals', () => {
    expect(fmtNum(1234.567)).toBe('1,234.6');
    expect(fmtNum(1234.567, 0)).toBe('1,235');
    expect(fmtNum(1234.567, 3)).toBe('1,234.567');
    expect(fmtNum(0)).toBe('0.0');
    expect(fmtNum(0, 3)).toBe('0.000');
    expect(fmtNum(NaN)).toBe(DASH);
    expect(fmtNum(-Infinity, 2)).toBe(DASH);
  });
});

describe('fmtPct, fmtPctAuto and fmtDelta', () => {
  it('fmtPct turns a ratio into a percentage', () => {
    expect(fmtPct(0)).toBe('0.0%');
    expect(fmtPct(0.1234)).toBe('12.3%');
    expect(fmtPct(0.1234, 0)).toBe('12%');
    expect(fmtPct(0.1234, 3)).toBe('12.340%');
    expect(fmtPct(1)).toBe('100.0%');
    expect(fmtPct(1.5)).toBe('150.0%');
    expect(fmtPct(-0.05)).toBe('-5.0%');
    expect(fmtPct(NaN)).toBe(DASH);
    expect(fmtPct(Infinity)).toBe(DASH);
    expect(fmtPct(-Infinity, 0)).toBe(DASH);
  });

  it('fmtPct stays within half a unit of the displayed precision', () => {
    const rand = mulberry32(14);
    const bad: string[] = [];
    for (let i = 0; i < 2000; i++) {
      const v = (rand() - 0.5) * 10;
      const digits = Math.floor(rand() * 4);
      const s = fmtPct(v, digits);
      const back = parseFloat(s) / 100;
      if (!s.endsWith('%') || !(Math.abs(back - v) <= 0.5 * 10 ** -(digits + 2) + 1e-12)) bad.push(`${v}/${digits} -> ${s}`);
    }
    expect(bad).toEqual([]);
  });

  it('fmtPctAuto groups large percentages and keeps a decimal for small ones', () => {
    expect(fmtPctAuto(0)).toBe('0.0%');
    expect(fmtPctAuto(0.1234)).toBe('12.3%');
    expect(fmtPctAuto(0.995)).toBe('99.5%');
    expect(fmtPctAuto(1)).toBe('100%');
    expect(fmtPctAuto(1.5)).toBe('150%');
    expect(fmtPctAuto(50.124)).toBe('5,012%');
    expect(fmtPctAuto(-0.05)).toBe('-5.0%');
    expect(fmtPctAuto(-2.5)).toBe('-250%');
    expect(fmtPctAuto(NaN)).toBe(DASH);
    expect(fmtPctAuto(Infinity)).toBe(DASH);
  });

  it('fmtDelta reports the relative change with a sign', () => {
    expect(fmtDelta(110, 100)).toEqual({ pct: expect.closeTo(0.1, 12), text: '+10.0%' });
    expect(fmtDelta(50, 100)).toEqual({ pct: -0.5, text: '-50.0%' });
    expect(fmtDelta(0, 100)).toEqual({ pct: -1, text: '-100%' });
    expect(fmtDelta(300, 100)).toEqual({ pct: 2, text: '+200%' });
    expect(fmtDelta(200, 100)).toEqual({ pct: 1, text: '+100%' });
    expect(fmtDelta(199, 100)).toEqual({ pct: expect.closeTo(0.99, 12), text: '+99.0%' });
    expect(fmtDelta(101, 100)?.text).toBe('+1.0%');
    expect(fmtDelta(100.4, 100)?.text).toBe('+0.4%');
    expect(fmtDelta(100, 100)).toEqual({ pct: 0, text: '+0.0%' });
  });

  it('fmtDelta divides by the size of the previous value, so a negative base keeps the direction', () => {
    expect(fmtDelta(100, -100)).toEqual({ pct: 2, text: '+200%' });
    expect(fmtDelta(-50, -100)).toEqual({ pct: 0.5, text: '+50.0%' });
    expect(fmtDelta(-150, -100)).toEqual({ pct: -0.5, text: '-50.0%' });
  });

  it('fmtDelta has no answer when the previous value is zero or a number is missing', () => {
    expect(fmtDelta(100, 0)).toBeNull();
    expect(fmtDelta(0, 0)).toBeNull();
    expect(fmtDelta(NaN, 1)).toBeNull();
    expect(fmtDelta(1, NaN)).toBeNull();
    expect(fmtDelta(1, Infinity)).toBeNull();
    expect(fmtDelta(Infinity, 1)).toBeNull();
  });
});

describe('fmtMultiple and pluralize', () => {
  it('fmtMultiple uses one decimal below ten and none from ten up', () => {
    expect(fmtMultiple(0)).toBe(`0.0${TIMES}`);
    expect(fmtMultiple(1)).toBe(`1.0${TIMES}`);
    expect(fmtMultiple(3.14159)).toBe(`3.1${TIMES}`);
    expect(fmtMultiple(10)).toBe(`10${TIMES}`);
    expect(fmtMultiple(12.6)).toBe(`13${TIMES}`);
    expect(fmtMultiple(150)).toBe(`150${TIMES}`);
    expect(fmtMultiple(NaN)).toBe(DASH);
    expect(fmtMultiple(Infinity)).toBe(DASH);
  });

  it('pluralize agrees with the count: only exactly 1 is singular', () => {
    expect(pluralize(0, 'user')).toBe('0 users');
    expect(pluralize(1, 'user')).toBe('1 user');
    expect(pluralize(2, 'user')).toBe('2 users');
    expect(pluralize(1234, 'row')).toBe('1,234 rows');
    expect(pluralize(1, 'child', 'children')).toBe('1 child');
    expect(pluralize(2, 'child', 'children')).toBe('2 children');
    expect(pluralize(0, 'x', 'y')).toBe('0 y');
    expect(pluralize(1.0, 'seat')).toBe('1 seat');
    expect(pluralize(-1, 'seat')).toBe('-1 seats');
  });
});

describe('csvEscape', () => {
  it('writes nothing for missing values and non-finite numbers', () => {
    for (const v of [null, undefined, '', NaN, Infinity, -Infinity]) expect(csvEscape(v)).toBe('');
  });

  it('writes numbers and booleans plainly, including negative numbers', () => {
    expect(csvEscape(0)).toBe('0');
    expect(csvEscape(-0)).toBe('0');
    expect(csvEscape(1.5)).toBe('1.5');
    expect(csvEscape(-3)).toBe('-3');
    expect(csvEscape(1e21)).toBe('1e+21');
    expect(csvEscape(true)).toBe('true');
    expect(csvEscape(false)).toBe('false');
  });

  it('quotes cells that contain a comma, a quote, a line feed or a carriage return', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('a"b')).toBe('"a""b"');
    expect(csvEscape('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvEscape('a\nb')).toBe('"a\nb"');
    expect(csvEscape('a\rb')).toBe('"a\rb"');
    expect(csvEscape('semi;colon|pipe tab\there')).toBe('semi;colon|pipe tab\there');
  });

  it('defuses a leading formula character in text but not in a signed number written as text', () => {
    expect(csvEscape('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvEscape('+cmd')).toBe("'+cmd");
    expect(csvEscape('-cmd')).toBe("'-cmd");
    expect(csvEscape('@x')).toBe("'@x");
    expect(csvEscape('\tx')).toBe("'\tx");
    expect(csvEscape('\rx')).toBe(`"'\rx"`);
    expect(csvEscape('--5')).toBe("'--5");
    expect(csvEscape('-')).toBe("'-");
    expect(csvEscape('- 5')).toBe("'- 5");
    expect(csvEscape('=a,b')).toBe(`"'=a,b"`);
    for (const s of ['-5', '+1.5', '-$5', '-5%', '-1e3', '+7']) expect(csvEscape(s), s).toBe(s);
    expect(csvEscape('-1,234.56')).toBe('"-1,234.56"');
  });

  it('leaves formula characters alone when they are not the first character', () => {
    for (const s of ['a=b', ' =x', '5-3', 'x@y.com', 'a+b']) expect(csvEscape(s), s).toBe(s);
  });
});

describe('toCsv', () => {
  it('joins header and rows with commas and line feeds, without a trailing newline', () => {
    expect(toCsv(['a', 'b'], [[1, 'x'], [2, 'y']])).toBe('a,b\n1,x\n2,y');
    expect(toCsv(['a', 'b'], [])).toBe('a,b');
    expect(toCsv([], [[1]])).toBe('\n1');
  });

  it('escapes the header cells and the data cells the same way', () => {
    expect(toCsv(['a', 'b,c', '-x'], [[1, 'x,y'], [NaN, null], ['q"', undefined, 3], []])).toBe('a,"b,c",\'-x\n1,"x,y"\n,\n"q""",,3\n');
  });

  it('does not pad or trim ragged rows', () => {
    expect(toCsv(['a', 'b', 'c'], [[1], [1, 2, 3, 4]])).toBe('a,b,c\n1\n1,2,3,4');
  });

  const rand = mulberry32(15);
  const ALPHABET = ['a', 'B', '7', ' ', ',', '"', '\n', '\r', '\t', "'", '=', '-', '+', '@', 'é', '日', '😀', '|', ';', '$', '%', '.'];
  const cell = (): string => {
    const len = Math.floor(rand() * 6);
    let s = '';
    for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)];
    return s;
  };
  const LEAD = new Set(['=', '+', '-', '@', '\t', '\r']);

  function parse(text: string, chunk = 0): string[][] {
    const out: string[][] = [];
    const t = new CsvTokenizer(',', (f) => out.push(f));
    if (chunk > 0) for (let i = 0; i < text.length; i += chunk) t.push(text.slice(i, i + chunk));
    else t.push(text);
    t.end();
    return out;
  }

  it('is read back cell by cell by the CSV tokenizer of the product, however the text is chunked', () => {
    const headers = ['id', 'text', 'value', 'note'];
    const rows: unknown[][] = [];
    for (let r = 0; r < 300; r++) {
      const row: unknown[] = [];
      for (let c = 0; c < headers.length; c++) {
        const k = rand();
        row.push(k < 0.15 ? Math.round((rand() - 0.5) * 1e6) / 100 : k < 0.2 ? NaN : k < 0.25 ? null : cell());
      }
      rows.push(row);
    }
    const text = toCsv(headers, rows);
    const whole = parse(text);
    expect(parse(text, 5)).toEqual(whole);
    expect(parse(text, 1)).toEqual(whole);
    expect(whole).toHaveLength(rows.length + 1);
    expect(whole[0]).toEqual(headers);

    const problems: string[] = [];
    rows.forEach((row, r) => {
      const got = whole[r + 1];
      if (got.length !== headers.length) {
        problems.push(`row ${r}: ${got.length} cells`);
        return;
      }
      row.forEach((v, c) => {
        const g = got[c];
        if (typeof v === 'number') {
          if (g !== (Number.isFinite(v) ? String(v) : '')) problems.push(`row ${r} col ${c}: number ${v} -> ${JSON.stringify(g)}`);
        } else if (v === null || v === undefined) {
          if (g !== '') problems.push(`row ${r} col ${c}: null -> ${JSON.stringify(g)}`);
        } else {
          const s = v as string;
          if (g !== s && g !== `'${s}`) problems.push(`row ${r} col ${c}: ${JSON.stringify(s)} -> ${JSON.stringify(g)}`);
          if (g !== s && !LEAD.has(s[0])) problems.push(`row ${r} col ${c}: ${JSON.stringify(s)} defused without a leading formula character`);
          if (g === s && s.length > 0 && LEAD.has(s[0]) && !/^[+-]?\$?\d/.test(s)) problems.push(`row ${r} col ${c}: ${JSON.stringify(s)} left as a formula`);
        }
      });
    });
    expect(problems).toEqual([]);
  });
});

describe('date utils: independent calendar oracle', () => {
  const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const lenOf = (y: number, m0: number): number => (m0 === 1 && isLeap(y) ? 29 : MONTH_LEN[m0]);

  // Howard Hinnant's days-from-civil and civil-from-days algorithms (m is 1-12).
  function daysFromCivil(y: number, m: number, d: number): number {
    const yy = m <= 2 ? y - 1 : y;
    const era = Math.floor(yy / 400);
    const yoe = yy - era * 400;
    const doy = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1;
    const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function civilFromDays(z0: number): { y: number; m: number; d: number } {
    const z = z0 + 719468;
    const era = Math.floor(z / 146097);
    const doe = z - era * 146097;
    const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    const mp = Math.floor((5 * doy + 2) / 153);
    const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    const m = mp < 10 ? mp + 3 : mp - 9;
    return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
  }

  const FIRST = -800; // 1967-10-12
  const LAST = daysFromCivil(2100, 12, 31);
  const pad = (n: number, w: number): string => String(n).padStart(w, '0');

  it('the oracle itself agrees with known anchors', () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
    expect(daysFromCivil(1969, 12, 31)).toBe(-1);
    expect(daysFromCivil(2000, 3, 1)).toBe(11017);
    expect(daysFromCivil(2026, 9, 1)).toBe(20697);
    expect(daysFromCivil(2026, 10, 2)).toBe(20728);
    expect(civilFromDays(20728)).toEqual({ y: 2026, m: 10, d: 2 });
    expect(civilFromDays(-1)).toEqual({ y: 1969, m: 12, d: 31 });
    expect(civilFromDays(daysFromCivil(2028, 2, 29))).toEqual({ y: 2028, m: 2, d: 29 });
  });

  it('dayFromYMD, ymd and isoDate agree with the oracle for every day from 1967 to 2100', () => {
    const bad: string[] = [];
    for (let day = FIRST; day <= LAST; day++) {
      const o = civilFromDays(day);
      const got = ymd(day);
      if (got.y !== o.y || got.m0 !== o.m - 1 || got.d !== o.d) bad.push(`ymd(${day}) = ${JSON.stringify(got)}, want ${JSON.stringify(o)}`);
      if (dayFromYMD(o.y, o.m - 1, o.d) !== day) bad.push(`dayFromYMD(${o.y}, ${o.m - 1}, ${o.d}) != ${day}`);
      const iso = `${pad(o.y, 4)}-${pad(o.m, 2)}-${pad(o.d, 2)}`;
      if (isoDate(day) !== iso) bad.push(`isoDate(${day}) = ${isoDate(day)}, want ${iso}`);
      if (parseIsoDay(iso) !== day) bad.push(`parseIsoDay(${iso}) != ${day}`);
      if (bad.length > 5) break;
    }
    expect(bad).toEqual([]);
  });

  it('dowOf counts Monday as 0 and agrees with the JavaScript calendar for every day', () => {
    const bad: number[] = [];
    for (let day = FIRST; day <= LAST; day++) {
      if (dowOf(day) !== (new Date(day * 86_400_000).getUTCDay() + 6) % 7) bad.push(day);
    }
    expect(bad).toEqual([]);
    expect(dowOf(0)).toBe(3);
    expect(dowOf(-1)).toBe(2);
    expect(DOW_NAMES[dowOf(daysFromCivil(2026, 10, 2))]).toBe('Fri');
    expect(DOW_NAMES[dowOf(daysFromCivil(2026, 10, 4))]).toBe('Sun');
    expect(DOW_NAMES[dowOf(daysFromCivil(2026, 10, 5))]).toBe('Mon');
  });

  it('a week always walks through seven different weekdays', () => {
    for (let start = 20_000; start < 20_014; start++) {
      expect(new Set(Array.from({ length: 7 }, (_, i) => dowOf(start + i))).size).toBe(7);
      expect(dowOf(start + 7)).toBe(dowOf(start));
    }
  });

  it('dayToDate is midnight UTC of the day', () => {
    expect(dayToDate(0).toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(dayToDate(20_728).toISOString()).toBe('2026-10-02T00:00:00.000Z');
    expect(dayToDate(-1).toISOString()).toBe('1969-12-31T00:00:00.000Z');
  });

  it('isoDate is fixed width, so text order is date order', () => {
    const days = [-1, 0, 365, 20_697, 20_728, 20_757, 20_758, 47_000];
    const iso = days.map(isoDate);
    for (const s of iso) expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([...iso].sort()).toEqual(iso);
  });

  it('month helpers agree with the oracle for every month from 1970 to 2100', () => {
    const bad: string[] = [];
    for (let y = 1970; y <= 2100; y++) {
      for (let m0 = 0; m0 < 12; m0++) {
        const idx = y * 12 + m0;
        const start = daysFromCivil(y, m0 + 1, 1);
        const len = lenOf(y, m0);
        if (monthStartDay(idx) !== start) bad.push(`monthStartDay ${y}-${m0 + 1}`);
        if (daysInMonth(idx) !== len) bad.push(`daysInMonth ${y}-${m0 + 1}: ${daysInMonth(idx)} != ${len}`);
        if (monthEndDay(idx) !== start + len - 1) bad.push(`monthEndDay ${y}-${m0 + 1}`);
        if (monthIndexOf(start) !== idx || monthIndexOf(start + len - 1) !== idx) bad.push(`monthIndexOf ${y}-${m0 + 1}`);
        if (monthIndexOf(start + len) !== idx + 1 || monthIndexOf(start - 1) !== idx - 1) bad.push(`neighbour months ${y}-${m0 + 1}`);
        if (monthKey(idx) !== `${y}-${pad(m0 + 1, 2)}`) bad.push(`monthKey ${y}-${m0 + 1}: ${monthKey(idx)}`);
        if (monthLabel(idx) !== `${MONTH_NAMES[m0]} ${y}`) bad.push(`monthLabel ${y}-${m0 + 1}: ${monthLabel(idx)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('February follows the leap year rule, including the century exceptions', () => {
    const feb = (y: number): number => daysInMonth(y * 12 + 1);
    expect(feb(2026)).toBe(28);
    expect(feb(2027)).toBe(28);
    expect(feb(2028)).toBe(29);
    expect(feb(2024)).toBe(29);
    expect(feb(2000)).toBe(29);
    expect(feb(2100)).toBe(28);
    expect(feb(1900)).toBe(28);
    expect(fmtDay(monthEndDay(2028 * 12 + 1))).toBe('Feb 29');
    expect(fmtDay(monthEndDay(2026 * 12 + 1))).toBe('Feb 28');
    expect(monthEndDay(2028 * 12 + 1) + 1).toBe(dayFromYMD(2028, 2, 1));
  });

  it('knows the months of the sample period', () => {
    const oct = monthIndexOf(dayFromYMD(2026, 9, 2));
    expect(oct).toBe(2026 * 12 + 9);
    expect(monthKey(oct)).toBe('2026-10');
    expect(monthLabel(oct)).toBe('Oct 2026');
    expect(monthStartDay(oct)).toBe(20_727);
    expect(monthEndDay(oct)).toBe(20_757);
    expect(daysInMonth(oct)).toBe(31);
    expect(daysInMonth(oct - 1)).toBe(30);
    expect(monthLabel(2027 * 12)).toBe('Jan 2027');
    expect(monthKey(2027 * 12 + 11)).toBe('2027-12');
  });

  it('month keys sort like month indexes', () => {
    const idx = Array.from({ length: 120 }, (_, i) => 2024 * 12 + i);
    const keys = idx.map(monthKey);
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('fmtDay prints the month name and the day, with the year on request', () => {
    expect(fmtDay(20_728)).toBe('Oct 2');
    expect(fmtDay(20_728, true)).toBe('Oct 2, 2026');
    expect(fmtDay(0, true)).toBe('Jan 1, 1970');
    const bad: string[] = [];
    for (let day = daysFromCivil(2028, 1, 1); day <= daysFromCivil(2028, 12, 31); day++) {
      const o = civilFromDays(day);
      if (fmtDay(day) !== `${MONTH_NAMES[o.m - 1]} ${o.d}` || fmtDay(day, true) !== `${MONTH_NAMES[o.m - 1]} ${o.d}, 2028`) bad.push(isoDate(day));
    }
    expect(bad).toEqual([]);
  });

  it('parseIsoDay reads the date part of an ISO string and rejects other shapes', () => {
    expect(parseIsoDay('2026-10-03')).toBe(20_729);
    expect(parseIsoDay('2026-10-03T12:00:00Z')).toBe(20_729);
    expect(parseIsoDay('2026-10-03 23:59')).toBe(20_729);
    expect(parseIsoDay('1969-12-31')).toBe(-1);
    for (const s of ['', ' 2026-10-03', '26-10-03', '2026-1-3', '2026-10', 'abc', '10/03/2026']) expect(parseIsoDay(s), JSON.stringify(s)).toBeNaN();
  });

  it('workdaysBetween counts Monday to Friday days of an inclusive range', () => {
    const naive = (a: number, b: number): number => {
      let n = 0;
      for (let d = a; d <= b; d++) if ((new Date(d * 86_400_000).getUTCDay() + 6) % 7 < 5) n++;
      return n;
    };
    const bad: string[] = [];
    for (let a = 20_690; a < 20_725; a++) {
      for (let b = a - 3; b < a + 75; b++) {
        if (workdaysBetween(a, b) !== naive(a, b)) bad.push(`${isoDate(a)}..${isoDate(b)}: ${workdaysBetween(a, b)} != ${naive(a, b)}`);
      }
    }
    const rand = mulberry32(16);
    for (let i = 0; i < 400; i++) {
      const a = Math.floor(rand() * 40_000) - 2000;
      const b = a + Math.floor(rand() * 1500) - 10;
      if (workdaysBetween(a, b) !== naive(a, b)) bad.push(`random ${a}..${b}`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('workdaysBetween on calendar facts', () => {
    const D = dayFromYMD;
    expect(workdaysBetween(D(2026, 8, 1), D(2026, 8, 30))).toBe(22);
    expect(workdaysBetween(D(2026, 9, 1), D(2026, 9, 31))).toBe(22);
    expect(workdaysBetween(D(2026, 0, 1), D(2026, 11, 31))).toBe(261);
    expect(workdaysBetween(20_731, 20_735)).toBe(5);
    expect(workdaysBetween(20_731, 20_738)).toBe(6);
    expect(workdaysBetween(20_728, 20_728)).toBe(1);
    expect(workdaysBetween(20_729, 20_730)).toBe(0);
    expect(workdaysBetween(20_730, 20_729)).toBe(0);
    expect(workdaysBetween(10, 9)).toBe(0);
  });

  it('exposes the constants the rest of the code relies on', () => {
    expect(DOW_NAMES).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(MONTH_NAMES).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
    expect(DAYS_PER_MONTH).toBeCloseTo(365.25 / 12, 12);
  });
});
