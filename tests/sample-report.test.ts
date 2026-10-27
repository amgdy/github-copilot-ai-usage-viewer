import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withoutRoster, type RosterEntry } from '../src/lib/analytics/settings';
import { analyzeDemo, CSV_HEADER, naiveRows } from './helpers';

const loadSources = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => true));
vi.mock('../src/state/loadDataset', () => ({ loadSources }));

const { loadSample, sampleRange, SAMPLE_FILE_NAME } = await import('../src/state/loadSample');

describe('sample report dates', () => {
  it('covers last month and this month up to yesterday', () => {
    expect(sampleRange(new Date(2026, 4, 15))).toEqual({ start: '2026-04-01', end: '2026-05-14' });
  });

  it('works across a new year', () => {
    expect(sampleRange(new Date(2026, 0, 1))).toEqual({ start: '2025-11-01', end: '2025-12-31' });
  });
});

describe('loading the sample report', () => {
  beforeEach(() => loadSources.mockClear());

  it('makes a usage report in the browser and marks it as the sample', async () => {
    expect(await loadSample()).toBe(true);
    expect(loadSources).toHaveBeenCalledTimes(1);
    const [sources, label, options] = loadSources.mock.calls[0] as [{ name: string; data: string }[], { text: string }, { sample?: boolean }];
    expect(sources).toHaveLength(1);
    expect(sources[0].name).toBe(SAMPLE_FILE_NAME);
    expect(Object.keys(naiveRows(sources[0].data)[0] ?? {})).toEqual([...CSV_HEADER]);
    expect(label.text).toBe('Sample report (made-up data)');
    expect(options).toEqual({ sample: true });
  });

  it('uses dates from the last two months, so it looks like a fresh export', async () => {
    await loadSample();
    const [sources] = loadSources.mock.calls[0] as [{ data: string }[]];
    const dates = naiveRows(sources[0].data).map((row) => row.date);
    const { start, end } = sampleRange();
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.every((date) => date >= start && date <= end)).toBe(true);
  });
});

describe('the saved license list and the sample report', () => {
  const realSeats: RosterEntry[] = [
    { user: 'real-person-1', plan: 'Business', name: 'Real Person', email: 'real@example.com' },
    { user: 'real-person-2', plan: 'Enterprise' },
  ];

  it('leaves the saved license list out of the sample analysis', async () => {
    const withList = await analyzeDemo({ settings: { roster: realSeats, rosterAsOf: '2026-01-31' } });
    expect(withList.analysis.licenses).not.toBeNull();

    const sample = withList.run(undefined, withoutRoster(withList.settings));
    expect(sample.licenses).toBeNull();
    expect(JSON.stringify(sample)).not.toMatch(/real-person|Real Person|real@example\.com/);
  });

  it('keeps every other setting', async () => {
    const { settings } = await analyzeDemo({ settings: { roster: realSeats, rosterAsOf: '2026-01-31', topN: 7 } });
    const sample = withoutRoster(settings);
    expect(sample.roster).toEqual([]);
    expect('rosterAsOf' in sample).toBe(false);
    expect({ ...sample, roster: settings.roster, rosterAsOf: settings.rosterAsOf }).toEqual(settings);
    expect(settings.roster).toEqual(realSeats);
  });

  it('changes nothing when no license list is saved', async () => {
    const { settings } = await analyzeDemo();
    expect(withoutRoster(settings)).toBe(settings);
  });
});
