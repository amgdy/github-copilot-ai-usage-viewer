import { describe, expect, it } from 'vitest';
import { CsvTokenizer, detectDelimiter } from '../src/lib/csv/tokenizer';
import { buildStore, parseDay } from '../src/lib/csv/ingest';
import { isoDate } from '../src/lib/utils/date';
import { naiveRows, sum } from './helpers';
import { FIXTURE_A, FIXTURE_B, loadFixtureStore, readFixture } from './fixtures';

function tokenize(text: string, chunk = 7): string[][] {
  const rows: string[][] = [];
  const tokenizer = new CsvTokenizer(',', (row) => rows.push(row));
  for (let i = 0; i < text.length; i += chunk) tokenizer.push(text.slice(i, i + chunk));
  tokenizer.end();
  return rows;
}

describe('CsvTokenizer', () => {
  it('handles quotes, escaped quotes, embedded delimiters and newlines across chunk boundaries', () => {
    const rows = tokenize('a,"b,1","c ""x"" d"\r\n"multi\nline",,z\n');
    expect(rows).toEqual([
      ['a', 'b,1', 'c "x" d'],
      ['multi\nline', '', 'z'],
    ]);
  });

  it('skips blank lines and handles a missing trailing newline', () => {
    expect(tokenize('a,b\n\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('detects the delimiter', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
  });
});

describe('parseDay', () => {
  it('parses ISO and US dates', () => {
    expect(isoDate(parseDay('2026-10-03'))).toBe('2026-10-03');
    expect(isoDate(parseDay('10/3/2026'))).toBe('2026-10-03');
    expect(Number.isNaN(parseDay('not a date'))).toBe(true);
  });
});

describe('ingest the pool-used fixture', () => {
  it('loads every row and keeps the sums', async () => {
    const store = await loadFixtureStore([FIXTURE_A]);
    const ref = naiveRows(readFixture(FIXTURE_A));
    expect(store.n).toBe(ref.length);
    expect(store.n).toBe(19);
    expect(sum([...store.gross])).toBeCloseTo(sum(ref.map((row) => +row.gross_amount)), 9);
    expect(sum([...store.discount])).toBeCloseTo(sum(ref.map((row) => +row.discount_amount)), 9);
    expect(sum([...store.net])).toBeCloseTo(sum(ref.map((row) => +row.net_amount)), 9);
    expect(sum([...store.qty])).toBeCloseTo(sum(ref.map((row) => +row.quantity)), 6);
    expect(sum([...store.input])).toBe(sum(ref.map((row) => +row.input)));
    expect(sum([...store.cacheWrite])).toBe(sum(ref.map((row) => +row.cache_write)));
    expect(store.hasTokens).toBe(true);
  });

  it('dictionary-encodes dimensions and strips the Auto prefix', async () => {
    const store = await loadFixtureStore([FIXTURE_A]);
    expect(store.dicts.user.values).toContain('alex-dev');
    expect(store.dicts.user.values).toContain('sam-lee');
    expect(store.dicts.user.values[0]).toBe('');
    expect(store.dicts.model.values.some((model) => model.startsWith('Auto'))).toBe(false);
    expect(store.dicts.model.values).toContain('Claude Opus 5.5');
    const autoRows = [...store.auto].filter((autoFlag) => autoFlag === 1).length;
    const refAuto = naiveRows(readFixture(FIXTURE_A)).filter((row) => /^auto/i.test(row.model)).length;
    expect(autoRows).toBe(refAuto);
    expect(autoRows).toBeGreaterThan(0);
  });

  it('has no data-quality problems', async () => {
    const store = await loadFixtureStore([FIXTURE_A]);
    const file = store.files[0];
    expect(file.badDateRows).toBe(0);
    expect(file.badNumberCells).toBe(0);
    expect(file.balanceMismatchRows).toBe(0);
    expect(file.missingColumns).toEqual([]);
    expect(isoDate(store.minDay)).toBe('2026-10-02');
  });
});

describe('ingest the partial-export fixture', () => {
  it('loads every row including scientific notation and blank users', async () => {
    const store = await loadFixtureStore([FIXTURE_B]);
    const ref = naiveRows(readFixture(FIXTURE_B));
    expect(readFixture(FIXTURE_B)).toMatch(/"\d(\.\d+)?e-\d+"/);
    expect(store.n).toBe(ref.length);
    expect(store.n).toBe(45);
    expect(sum([...store.gross])).toBeCloseTo(sum(ref.map((row) => +row.gross_amount)), 9);
    const blank = [...store.user].filter((userId) => userId === 0).length;
    expect(blank).toBe(ref.filter((row) => row.username === '').length);
    expect(blank).toBeGreaterThan(0);
    expect(store.files[0].badNumberCells).toBe(0);
  });
});

describe('multi-file ingest', () => {
  it('keeps both files and tags rows with their source file', async () => {
    const store = await loadFixtureStore([FIXTURE_A, FIXTURE_B]);
    expect(store.n).toBe(19 + 45);
    expect(store.dicts.file.values.length).toBeGreaterThanOrEqual(2);
    expect(store.files.length).toBe(2);
  });

  it('drops rows duplicated across files, but not within a file', async () => {
    const csvText = readFixture(FIXTURE_A);
    const store = await buildStore(
      [
        { name: 'one.csv', data: csvText },
        { name: 'two.csv', data: csvText },
      ],
      { dedupe: true },
    );
    expect(store.n).toBe(19);
    expect(store.files[1].duplicatesDropped).toBe(19);

    const keep = await buildStore(
      [
        { name: 'one.csv', data: csvText },
        { name: 'two.csv', data: csvText },
      ],
      { dedupe: false },
    );
    expect(keep.n).toBe(38);
  });
});

describe('schema tolerance', () => {
  it('derives missing money columns and accepts header synonyms', async () => {
    const csv = ['Date,User,Model,Quantity,Gross Amount', '2026-05-01,alice,GPT-5.3-Codex,100,1.0', '2026-05-02,bob,GPT-5.3-Codex,50,0.5'].join('\n');
    const store = await buildStore([{ name: 'min.csv', data: csv }]);
    expect(store.n).toBe(2);
    expect(store.dicts.user.values).toContain('alice');
    expect(sum([...store.gross])).toBeCloseTo(1.5, 9);
  });

  it('reports a clear error when required columns are missing', async () => {
    await expect(buildStore([{ name: 'bad.csv', data: 'foo,bar\n1,2\n' }])).rejects.toThrow(/column/i);
  });
});
