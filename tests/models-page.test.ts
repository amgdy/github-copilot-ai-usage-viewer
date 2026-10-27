import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { emptyFilters, type Filters } from '../src/lib/analytics/filters';
import ModelsPage from '../src/pages/ModelsPage';
import { AnalysisProvider } from '../src/state/analysis';
import { useApp } from '../src/state/store';
import { CSV_HEADER, analyzeCsv, analyzeDemo, makeCsv, type Pipeline, type RowSpec } from './helpers';
import { SEP_WEEKDAYS, autoDiscounted, terra, tokensFor } from './scenarios';

/**
 * The Models page rendered on small synthetic reports and on the demo report: the Auto section (plan rates with their basis,
 * discount by model, heavy users), a selected segment, and the notices for a file that has no model names or no token columns.
 */

const DAYS = SEP_WEEKDAYS.slice(0, 10);

/**
 * Two Business users whose Auto rows bill 80% of the price-card cost of their tokens (a measured 20% discount), one Enterprise user at 70%
 * (30%), a small custom seat whose Auto rows have no token counts (so its rate is assumed), and one user who picks Sol by hand.
 */
function fixture(): RowSpec[] {
  const business = DAYS.flatMap((date) => [terra({ date, user: 'biz-1', gross: 1 }), terra({ date, user: 'biz-2', gross: 1 })]);
  const enterprise = DAYS.map((date) => terra({ date, user: 'ent-1', gross: 2, quota: 3900 }));
  const direct = DAYS.map((date): RowSpec => ({ date, user: 'direct-1', model: 'GPT-6 Sol', gross: 2, ...tokensFor(2, 'cached') }));
  const custom: RowSpec = { date: DAYS[0], user: 'custom-1', model: 'Auto: GPT-5.6 Terra', gross: 0.4, quota: 1000 };
  return [...autoDiscounted(business, 0.8), ...autoDiscounted(enterprise, 0.7), ...direct, custom];
}

const TOKEN_COLUMNS = ['input', 'output', 'cache_read', 'cache_write'];

const render = (p: Pipeline): string =>
  renderToStaticMarkup(
    createElement(AnalysisProvider, {
      dataset: { store: p.store, prep: p.prep, label: 'synthetic.csv', loadedAt: 0 },
      children: createElement(ModelsPage),
    }),
  );

const count = (html: string, re: RegExp): number => html.match(re)?.length ?? 0;

/** zustand hands the initial state to server renders, so the filters are set there for the time of one render. */
function withFilters(filters: Partial<Filters>, run: () => string): string {
  const initial = useApp.getInitialState();
  const before = initial.filters;
  initial.filters = { ...emptyFilters(), ...filters };
  try {
    return run();
  } finally {
    initial.filters = before;
  }
}

/** The visible text of the page, so that assertions do not depend on markup. */
const textOf = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

/** The text of one block of the Auto card, from its title to the next marker. */
const between = (text: string, from: string, to: string): string => {
  const start = text.indexOf(from);
  expect(start, from).toBeGreaterThanOrEqual(0);
  const end = text.indexOf(to, start);
  return text.slice(start, end < 0 ? undefined : end);
};

describe('Models page: render health', () => {
  it('shows no broken values anywhere on the page', async () => {
    const text = textOf(render(await analyzeCsv(makeCsv(fixture()))));
    expect(text).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });

  it('renders the demo report with every section and no broken values', async () => {
    const text = textOf(render(await analyzeDemo()));
    for (const title of ['Model ranking', 'All models', 'Auto model selection', 'Auto discount rate by plan', 'Price card']) expect(text, title).toContain(title);
    expect(text).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });
});

describe('Models page: with a segment selected', () => {
  it('measures the plan rates on all users, and says so', async () => {
    const p = await analyzeCsv(makeCsv(fixture()));
    const text = textOf(withFilters({ autoUse: ['direct'] }, () => render(p)));
    expect(text).toContain('Plan discount rates are measured on all users in the current row filters, not only on the selected segment.');
    expect(text).toContain('Business');
    expect(text).toContain('No usage went through Auto in this scope.');
    expect(text).not.toContain('Auto discount by model');
  });
});

describe('Models page: Auto discount rate by plan', () => {
  it('lists each plan with its measured or assumed rate', async () => {
    const html = render(await analyzeCsv(makeCsv(fixture())));
    expect(html).toContain('Auto discount rate by plan');
    for (const plan of ['Business', 'Enterprise', 'Custom (1,000 credits)']) expect(html, plan).toContain(plan);
    expect(count(html, />Measured</g)).toBe(2);
    expect(count(html, />Assumed</g)).toBe(1);
    expect(html).toContain('20.0%');
    expect(html).toContain('30.0%');
    expect(html).toContain('Plan discount rates are measured on all users in the current row filters.');
  });

  it('never calls the Auto discount an assumption', async () => {
    const html = render(await analyzeCsv(makeCsv(fixture())));
    expect(html).not.toMatch(/assumption/i);
  });

  it('shows the measured discount of each model', async () => {
    const text = textOf(render(await analyzeCsv(makeCsv(fixture()))));
    const block = between(text, 'Auto discount by model', 'Price card');
    // The Business rows bill $20 for tokens worth $25, the Enterprise rows $20 for $28.57. The unmeasured $0.40 only counts in Auto usage.
    expect(block).toContain('GPT-5.6 Terra $40.40 100% $40.00 $53.57 $13.57 25.3%');
    expect(block).toContain('Total $40.40 $40.00 $53.57 $13.57 25.3%');
  });

  it('shows dashes for a model that could not be measured, and totals only what was measured', async () => {
    const unlisted: RowSpec = { date: DAYS[0], user: 'biz-1', model: 'Auto: Unlisted Model X', gross: 3, input: 1_000_000 };
    const text = textOf(render(await analyzeCsv(makeCsv([...fixture(), unlisted]))));
    const block = between(text, 'Auto discount by model', 'Price card');
    expect(block).toContain('Unlisted Model X $3.00 100% $0.00 $0.00 – –');
    expect(block).toContain('GPT-5.6 Terra $40.40 100% $40.00 $53.57 $13.57 25.3%');
    expect(block).toContain('Total $43.40 $40.00 $53.57 $13.57 25.3%');
    expect(text).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });

  it('measures nothing when the file has no token columns, and says so', async () => {
    const html = render(await analyzeCsv(makeCsv(fixture(), { columns: CSV_HEADER.filter((c) => !TOKEN_COLUMNS.includes(c)) })));
    expect(html).toContain('This report has no token columns, so nothing can be measured and every plan uses the rate from Settings.');
    expect(count(html, />Measured</g)).toBe(0);
    expect(count(html, />Assumed</g)).toBe(3);
  });

  it('explains that there is nothing to measure when no usage went through Auto', async () => {
    const direct = fixture().filter((r) => !/^auto/i.test(r.model ?? ''));
    const html = render(await analyzeCsv(makeCsv(direct)));
    expect(html).toContain('No usage went through Auto in the current row filters');
    expect(html).not.toContain('Auto discount by model');
  });
});

describe('Models page: heavy users with the lowest Auto share', () => {
  it('lists only the heavy users who are below Auto first from', async () => {
    const text = textOf(render(await analyzeCsv(makeCsv(fixture()))));
    const block = between(text, 'Heavy users with the lowest Auto share', 'Estimates here use');
    expect(block).toContain('direct-1');
    for (const name of ['biz-1', 'biz-2', 'ent-1', 'custom-1']) expect(block, name).not.toContain(name);
    expect(block).toContain('Of the 4 biggest users by usage, these send less than 50% of their usage through Auto, lowest share first.');
  });

  it('says so, and lists nobody, when every heavy user already reaches it', async () => {
    const rows = fixture().filter((r) => r.user !== 'direct-1');
    const block = between(textOf(render(await analyzeCsv(makeCsv(rows)))), 'Heavy users with the lowest Auto share', 'Estimates here use');
    expect(block).toContain('Each of the 3 biggest users already sends all of their usage through Auto.');
    for (const name of ['biz-1', 'biz-2', 'ent-1']) expect(block, name).not.toContain(name);
  });
});

describe('Models page: a file without model names', () => {
  it('says so and leaves the Auto section out', async () => {
    const html = render(await analyzeCsv(makeCsv(fixture(), { columns: CSV_HEADER.filter((c) => c !== 'model') })));
    expect(html).toContain('This file has no model names');
    expect(html).not.toContain('Auto discount rate by plan');
    expect(html).not.toContain('Auto model selection');
  });

  it('keeps the price card, without a column of zero usage', async () => {
    const text = textOf(render(await analyzeCsv(makeCsv(fixture(), { columns: CSV_HEADER.filter((c) => c !== 'model') }))));
    expect(text).toContain('Price card');
    expect(text).not.toContain('In your data');
    expect(text).not.toContain('Models you use are highlighted');
    expect(text).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });
});
