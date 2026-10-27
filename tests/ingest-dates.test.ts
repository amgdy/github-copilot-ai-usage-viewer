import { describe, expect, it } from 'vitest';
import { buildStore, parseDay } from '../src/lib/csv/ingest';
import { isoDate } from '../src/lib/utils/date';
import { analyzeCsv, dayNum, makeCsv, type RowSpec } from './helpers';

const iso = (s: string): string => {
  const d = parseDay(s);
  return Number.isNaN(d) ? 'NaN' : isoDate(d);
};

/** Runs `fn` with the process time zone changed (Node picks up a new TZ at once). */
function withTZ<T>(tz: string, fn: () => T): T {
  const prev = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
}

const ZONES = ['UTC', 'America/Los_Angeles', 'Pacific/Pago_Pago', 'Europe/Berlin', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Kiritimati'];

describe('parseDay: formats it reads correctly', () => {
  it('reads ISO dates, with or without a time part', () => {
    const cases: [string, string][] = [
      ['2026-10-03', '2026-10-03'],
      ['2026-10-03T12:34:56Z', '2026-10-03'],
      ['2026-10-03 23:59:59', '2026-10-03'],
      ['2026-10-03T00:00:00.000+10:00', '2026-10-03'],
      ['2026-10-03T23:30:00-05:00', '2026-10-03'],
      ['2026-01-01', '2026-01-01'],
      ['2026-12-31', '2026-12-31'],
      ['2028-02-29', '2028-02-29'],
      ['1971-01-01', '1971-01-01'],
      ['2099-07-15', '2099-07-15'],
    ];
    for (const [input, want] of cases) expect(iso(input), input).toBe(want);
  });

  it('reads US month/day/year dates, with or without a time part', () => {
    const cases: [string, string][] = [
      ['10/3/2026', '2026-10-03'],
      ['10/03/2026', '2026-10-03'],
      ['1/31/2026', '2026-01-31'],
      ['3/10/2026', '2026-03-10'],
      ['12/1/2026 14:30', '2026-12-01'],
      ['2/29/2028', '2028-02-29'],
    ];
    for (const [input, want] of cases) expect(iso(input), input).toBe(want);
  });

  it('reads ISO and US dates the same way in every time zone', () => {
    for (const tz of ZONES) {
      withTZ(tz, () => {
        for (const [input, want] of [['2026-10-03', '2026-10-03'], ['2026-10-03T23:59:59Z', '2026-10-03'], ['10/3/2026', '2026-10-03'], ['2028-02-29', '2028-02-29'], ['2026-01-01', '2026-01-01']]) {
          expect(iso(input), `${tz}: ${input}`).toBe(want);
        }
      });
    }
  });

  it('gives consecutive days for consecutive dates and keeps the order across a month and a year end', () => {
    const days = ['2026-09-30', '2026-10-01', '2026-10-31', '2026-11-01', '2026-12-31', '2027-01-01', '2028-02-28', '2028-02-29', '2028-03-01'].map(parseDay);
    expect(days[1] - days[0]).toBe(1);
    expect(days[3] - days[2]).toBe(1);
    expect(days[5] - days[4]).toBe(1);
    expect(days[7] - days[6]).toBe(1);
    expect(days[8] - days[7]).toBe(1);
    expect(days).toEqual([...days].sort((a, b) => a - b));
    expect(days[1]).toBe(dayNum('2026-10-01'));
  });
});

describe('parseDay: text that is not a date', () => {
  it('returns NaN, so the row is counted as a bad date', () => {
    for (const s of ['', ' ', 'bad', 'not a date', 'abcd-ef-gh', '2026-13-01', '2026-00-10', '2026-10-32', '2026-10-00', '26-10-03', '0000-00-00', '1900-01-01', 'N/A', 'null', 'undefined']) {
      expect(iso(s), JSON.stringify(s)).toBe('NaN');
    }
  });
});

describe('parseDay: other formats', () => {
  const FORMATS: [string, string][] = [
    ['2026/10/03', '2026-10-03'],
    ['2026.10.03', '2026-10-03'],
    ['Oct 3, 2026', '2026-10-03'],
    ['Oct. 3, 2026', '2026-10-03'],
    ['October 3, 2026', '2026-10-03'],
    ['October 3rd, 2026', '2026-10-03'],
    ['3 Oct 2026', '2026-10-03'],
    ['3rd October 2026', '2026-10-03'],
    ['Sept 9 2026', '2026-09-09'],
    ['Sat Oct 03 2026 00:00:00 GMT+1000 (AEST)', '2026-10-03'],
    ['Oct 3, 2026 11:45 PM', '2026-10-03'],
    ['2026-10-3', '2026-10-03'],
    ['2026-1-03', '2026-01-03'],
    ['  2026-10-03  ', '2026-10-03'],
    // Only a day/month/year reading is possible when the first number is above 12.
    ['25/10/2026', '2026-10-25'],
    ['31/1/2026 08:00', '2026-01-31'],
    // Both readings are possible, so it is month/day/year.
    ['10/3/2026', '2026-10-03'],
    ['3/10/2026', '2026-03-10'],
  ];

  it('reads them as the date written, in every time zone', () => {
    for (const tz of ZONES) {
      withTZ(tz, () => {
        for (const [input, want] of FORMATS) expect(iso(input), `${tz}: ${input}`).toBe(want);
      });
    }
  });

  it('rejects dates that do not exist', () => {
    const invalid = [
      '2026-02-31', '2026-02-29', '2026-04-31', '2026-06-31', '2026-09-31', '2100-02-29', '2026-11-31',
      '13/40/2026', '0/0/2026', '2/30/2026', '2/29/2027', '13/13/2026', '31/4/2026',
      'Feb 30, 2026', '31 Apr 2026', '0 Oct 2026', 'Octember 3, 2026', 'Foo 3, 2026',
    ];
    for (const input of invalid) expect(iso(input), input).toBe('NaN');
  });

  it('follows the leap year rules', () => {
    expect(iso('2028-02-29')).toBe('2028-02-29');
    expect(iso('2000-02-29')).toBe('2000-02-29');
    expect(iso('2100-02-29')).toBe('NaN');
    expect(iso('2/29/2024')).toBe('2024-02-29');
    expect(iso('2/29/2100')).toBe('NaN');
  });

  it('rejects junk, even when it ends in a number or starts like a date', () => {
    for (const input of ['not-a-date-0', 'foo 1', 'order 12', '2026-10-03abc', '2026-10/03', '2026/10-03', '2026-10-03x12:00', '10/3/26', '1970-01-01', '9999999-01-01', '20261003']) {
      expect(iso(input), input).toBe('NaN');
    }
  });
});

describe('dates in a file', () => {
  const spec = (date: string, over: Partial<RowSpec> = {}): RowSpec => ({ date, user: 'u1', gross: 1, ...over });

  it('puts every date format on the same day id, and ignores a time part', async () => {
    const csv = makeCsv([spec('2026-10-03'), spec('10/3/2026'), spec('2026-10-03T12:34:56Z'), spec('2026-10-03 23:59:59')]);
    const store = await buildStore([{ name: 'a.csv', data: csv }]);
    expect(store.n).toBe(4);
    expect([...store.day]).toEqual([dayNum('2026-10-03'), dayNum('2026-10-03'), dayNum('2026-10-03'), dayNum('2026-10-03')]);
    expect(store.minDay).toBe(store.maxDay);
    expect(store.files[0]).toMatchObject({ badDateRows: 0, minDay: dayNum('2026-10-03'), maxDay: dayNum('2026-10-03') });
  });

  it('drops rows with an unreadable date, counts them, and keeps the sums and the day range to the rest', async () => {
    const csv = makeCsv([
      spec('2026-10-05', { gross: 5 }),
      spec('garbage', { gross: 100 }),
      spec('', { gross: 100 }),
      spec('2026-13-45', { gross: 100 }),
      spec('2026-10-02', { gross: 2 }),
      spec('10/4/2026', { gross: 3 }),
    ]);
    const store = await buildStore([{ name: 'a.csv', data: csv }]);
    expect(store.n).toBe(3);
    expect(store.files[0]).toMatchObject({ rowsRead: 6, rowsKept: 3, badDateRows: 3, minDay: dayNum('2026-10-02'), maxDay: dayNum('2026-10-05') });
    expect(store.minDay).toBe(dayNum('2026-10-02'));
    expect(store.maxDay).toBe(dayNum('2026-10-05'));
    expect([...store.gross].reduce((a, b) => a + b, 0)).toBeCloseTo(10, 9);
  });

  it('a file whose dates are all unreadable gives an empty store and an empty analysis, not an error', async () => {
    const csv = makeCsv([spec('x'), spec('yesterday'), spec('')]);
    const store = await buildStore([{ name: 'a.csv', data: csv }]);
    expect(store.n).toBe(0);
    expect(store.files[0]).toMatchObject({ rowsRead: 3, rowsKept: 0, badDateRows: 3 });
    const p = await analyzeCsv(csv);
    expect(p.analysis.agg.totals.rows).toBe(0);
    expect(p.analysis.recs).toEqual([]);
    expect(p.analysis.headline.title).toBe('No rows match the current filters');
  });

  it('reads the same dates in every time zone', async () => {
    const csv = makeCsv([spec('2026-10-03'), spec('10/4/2026'), spec('2026-10-05T23:59:59Z')]);
    const days: number[][] = [];
    for (const tz of ['UTC', 'Pacific/Pago_Pago', 'Pacific/Kiritimati']) {
      const store = await withTZAsync(tz, () => buildStore([{ name: 'a.csv', data: csv }]));
      days.push([...store.day].sort((a, b) => a - b));
    }
    expect(days[0]).toEqual([dayNum('2026-10-03'), dayNum('2026-10-04'), dayNum('2026-10-05')]);
    expect(days[1]).toEqual(days[0]);
    expect(days[2]).toEqual(days[0]);
  });
});

async function withTZAsync<T>(tz: string, fn: () => Promise<T>): Promise<T> {
  const prev = process.env.TZ;
  process.env.TZ = tz;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
}
