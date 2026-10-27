import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type RosterEntry } from '../src/lib/analytics/settings';
import LicensesPage from '../src/pages/LicensesPage';
import { RosterSection } from '../src/pages/settings/RosterSection';
import { AnalysisProvider } from '../src/state/analysis';
import { useApp, type Dataset } from '../src/state/store';
import { analyzeDemo, type Pipeline } from './helpers';

/**
 * The saved license list holds real people. While the made-up sample report is open, the Licenses page and the license list
 * in Settings say that the list is not used, and Settings does not compare the list with the made-up users.
 */

const savedSeats: RosterEntry[] = [
  { user: 'real-person-1', plan: 'Business', name: 'Real Person', email: 'real@example.com', lastActivityAt: '2026-01-02', source: 'api' },
  { user: 'real-person-2', plan: 'Enterprise' },
];
const NOTE = 'License lists are not used with the sample';

const textOf = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

/** zustand hands the initial state to server renders, so the dataset and the settings are set there for the time of one render. */
function screens(p: Pipeline, sample: boolean): { settingsHtml: string; settings: string; licenses: string } {
  const dataset: Dataset = { store: p.store, prep: p.prep, label: 'synthetic.csv', loadedAt: 0, ...(sample ? { sample: true } : {}) };
  const initial = useApp.getInitialState();
  const before = { dataset: initial.dataset, settings: initial.settings };
  initial.dataset = dataset;
  initial.settings = { ...DEFAULT_SETTINGS, roster: savedSeats, rosterAsOf: '2026-01-31' };
  try {
    const settingsHtml = renderToStaticMarkup(createElement(RosterSection));
    return {
      settingsHtml,
      settings: textOf(settingsHtml),
      licenses: textOf(renderToStaticMarkup(createElement(AnalysisProvider, { dataset, children: createElement(LicensesPage) }))),
    };
  } finally {
    Object.assign(initial, before);
  }
}

describe('the saved license list while the sample report is open', () => {
  let report: Pipeline;
  beforeAll(async () => {
    report = await analyzeDemo();
  });

  it('says on both screens that the list is not used with the sample', () => {
    const { settings, licenses } = screens(report, true);
    expect(settings).toContain(NOTE);
    expect(licenses).toContain(NOTE);
  });

  it('does not compare the list with made-up users or show seats from it', () => {
    const { settings, licenses } = screens(report, true);
    expect(settings).toContain('2 seats: 1 Business, 1 Enterprise.');
    expect(settings).not.toMatch(/appear in the report and|never appears? in the report\. (It|They) counts? as unused/);
    expect(licenses).toContain('Import your license list to see your seats');
    expect(licenses).not.toMatch(/real-person|Real Person|real@example\.com/);
  });

  it('does not let the made-up users be added to the saved list', () => {
    const fill = /<button[^>]*disabled=""[^>]*title="The sample has made-up users\. Open your own report first\."/;
    expect(screens(report, true).settingsHtml).toMatch(fill);
    expect(screens(report, false).settingsHtml).not.toMatch(/disabled=""[^>]*title="(The sample has made-up users|Load a report first)/);
  });

  it('uses the list with your own report', () => {
    const { settings, licenses } = screens(report, false);
    expect(settings).not.toContain(NOTE);
    expect(licenses).not.toContain(NOTE);
    expect(settings).toContain('0 appear in the report and 2 do not.');
    expect(settings).toContain('2 seats never appear in the report. They count as unused seats');
    expect(licenses).not.toContain('Import your license list to see your seats');
  });
});
