import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { buildTaxonomy } from '../src/lib/analytics/taxonomy';
import { TRAIT_IDS } from '../src/lib/analytics/users';
import { metricDoc } from '../src/lib/metrics/registry';
import SegmentsPage from '../src/pages/SegmentsPage';
import { ConcentrationChart } from '../src/pages/segments/ConcentrationChart';
import { CrossLensMatrix } from '../src/pages/segments/CrossLensMatrix';
import { GroupCards } from '../src/pages/segments/GroupCards';
import { GroupTable } from '../src/pages/segments/GroupTable';
import { Insights } from '../src/pages/segments/Insights';
import { LabelRules } from '../src/pages/segments/LabelRules';
import { LensKpis } from '../src/pages/segments/LensKpis';
import { LensNotes } from '../src/pages/segments/LensNotes';
import { LENSES, LENS_BY_ID, buildLens, lensUnavailableReason, unavailableReason, type Availability, type LensData, type LensId } from '../src/pages/segments/lenses';
import { buildMatrix, pickLenses } from '../src/pages/segments/matrix';
import { PoolFlowCard } from '../src/pages/segments/PoolFlowCard';
import type { RuleContext } from '../src/pages/segments/RuleBlocks';
import { UnsupportedLens } from '../src/pages/segments/UnsupportedLens';
import { AnalysisProvider } from '../src/state/analysis';
import type { Dataset } from '../src/state/store';
import { CSV_HEADER, analyzeCsv, makeCsv, type Pipeline, type RowSpec } from './helpers';
import { SEP_WEEKDAYS, terra, tokensFor } from './scenarios';

/**
 * What the Segments page does with a report that cannot support a lens or a trait. The groups themselves come from the user
 * classification (tests/users.test.ts and tests/auto-discount.test.ts); this file checks which lenses are offered, which groups
 * are explained instead of shown, how the matrix picks its two lenses, and that the page components render for every lens.
 */

const DAYS = SEP_WEEKDAYS.slice(0, 10);

// The app state reads its settings from localStorage when it is imported; Node has none.
vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
});

/**
 * Four users, one seat each (1,900 credits = $19), usage of $10, $30, $20 and $15:
 * auto-user: all Auto on Terra (Versatile). direct-user: Terra picked by hand. sol-user: Sol (Powerful) picked by hand.
 * mixed-user: $5 Auto on Terra and $10 Sol, so a third of the usage is Auto and two thirds is Powerful.
 */
function fixture(): RowSpec[] {
  const rows: RowSpec[] = [];
  for (const date of DAYS) {
    rows.push(terra({ date, user: 'auto-user', gross: 1 }));
    rows.push({ date, user: 'direct-user', model: 'GPT-5.6 Terra', gross: 3, ...tokensFor(3, 'cached') });
    rows.push({ date, user: 'sol-user', model: 'GPT-6 Sol', gross: 2, ...tokensFor(2, 'cached') });
  }
  for (const date of DAYS.slice(0, 5)) {
    rows.push(terra({ date, user: 'mixed-user', gross: 1 }));
    rows.push({ date, user: 'mixed-user', model: 'GPT-6 Sol', gross: 2, ...tokensFor(2, 'cached') });
  }
  return rows;
}

const withModels = (): Promise<Pipeline> => analyzeCsv(makeCsv(fixture()));
const withoutModelColumn = (): Promise<Pipeline> =>
  analyzeCsv(makeCsv(fixture(), { columns: CSV_HEADER.filter((c) => c !== 'model') }));
const withBlankModels = (): Promise<Pipeline> => analyzeCsv(makeCsv(fixture().map((r) => ({ ...r, model: '' }))));

/** The same flags the page passes to the lenses. */
const availabilityOf = (p: Pipeline): Availability => ({
  hasTokens: p.store.hasTokens,
  hasModels: p.analysis.coverage.models,
  trendReliable: p.analysis.population.trendReliable,
  hasCostCenters: p.analysis.population.hasCostCenters,
});

const lensOf = (p: Pipeline, id: LensId): LensData =>
  buildLens(LENS_BY_ID[id], buildTaxonomy(p.settings), p.analysis.population, [], 1, availabilityOf(p));

const usersIn = (d: LensData): Record<string, number> => Object.fromEntries(d.rows.map((r) => [r.id, r.users]));

const ALL: Availability = { hasTokens: true, hasModels: true, trendReliable: true, hasCostCenters: true };
const NEEDS_TOKENS = 'Needs token columns, and this report has none.';
const NEEDS_MODELS = 'Needs model names, and this report has none.';

describe('the lens list', () => {
  it('has the seven lenses, each with a filter key and a doc that exists', () => {
    expect(LENSES.map((l) => l.id)).toEqual(['persona', 'tier', 'engagement', 'profile', 'pareto', 'autoUse', 'trait']);
    expect(new Set(LENSES.map((l) => l.filterKey)).size).toBe(LENSES.length);
    for (const l of LENSES) expect(metricDoc(l.calc), l.id).toBeDefined();
  });

  it('names the lenses as the page does', () => {
    expect(LENSES.map((l) => l.label)).toEqual(['Persona', 'Usage tier', 'Engagement', 'Usage profile', 'Pareto class', 'Auto use class', 'Traits']);
  });
});

describe('which traits the report can show', () => {
  it('shows every trait when the report has what each needs', () => {
    for (const id of TRAIT_IDS) expect(unavailableReason('trait', id, ALL), id).toBeNull();
  });

  it('needs token columns for the cache and long-context traits', () => {
    const a = { ...ALL, hasTokens: false };
    expect(unavailableReason('trait', 'lowCache', a)).toBe(NEEDS_TOKENS);
    expect(unavailableReason('trait', 'longContext', a)).toBe(NEEDS_TOKENS);
    expect(unavailableReason('trait', 'lowAuto', a)).toBeNull();
    expect(unavailableReason('trait', 'multiModel', a)).toBeNull();
  });

  it('needs model names for the traits that look at models, even when there are token columns', () => {
    const a = { ...ALL, hasModels: false };
    for (const id of ['lowCache', 'longContext', 'lowAuto', 'multiModel']) expect(unavailableReason('trait', id, a), id).toBe(NEEDS_MODELS);
    for (const id of ['spiky', 'accelerating', 'fading', 'noCostCenter']) expect(unavailableReason('trait', id, a), id).toBeNull();
  });

  it('names the token columns first when both are missing', () => {
    const a = { ...ALL, hasTokens: false, hasModels: false };
    expect(unavailableReason('trait', 'lowCache', a)).toBe(NEEDS_TOKENS);
    expect(unavailableReason('trait', 'lowAuto', a)).toBe(NEEDS_MODELS);
  });

  it('needs 14 days for the trend traits and cost centers for the cost center trait', () => {
    const short = { ...ALL, trendReliable: false };
    expect(unavailableReason('trait', 'accelerating', short)).toMatch(/14 days/);
    expect(unavailableReason('trait', 'fading', short)).toMatch(/14 days/);
    expect(unavailableReason('trait', 'noCostCenter', { ...ALL, hasCostCenters: false })).toMatch(/no cost centers/);
  });

  it('never marks the groups of the other lenses', () => {
    for (const lens of ['persona', 'tier', 'engagement', 'profile', 'pareto', 'autoUse'] as const) {
      expect(unavailableReason(lens, 'unknown', { ...ALL, hasModels: false, hasTokens: false })).toBeNull();
    }
  });
});

describe('a report with model names', () => {
  it('offers every lens', async () => {
    const p = await withModels();
    expect(p.analysis.coverage.models).toBe(true);
    for (const l of LENSES) {
      expect(lensUnavailableReason(l.id, availabilityOf(p)), l.id).toBeNull();
      expect(lensOf(p, l.id).unsupported, l.id).toBeNull();
    }
  });

  it('groups the users by the documented Auto use and usage profile rules', async () => {
    const p = await withModels();
    expect(usersIn(lensOf(p, 'autoUse'))).toEqual({ autoFirst: 1, mixed: 1, direct: 2, unknown: 0 });
    expect(usersIn(lensOf(p, 'profile'))).toEqual({ frontier: 1, balanced: 1, efficient: 2 });
  });

  it('groups the users by spend tier and Pareto class from usage and seat size alone', async () => {
    const p = await withModels();
    expect(usersIn(lensOf(p, 'tier'))).toEqual({ minimal: 0, light: 0, core: 2, power: 2, runaway: 0 });
    expect(usersIn(lensOf(p, 'pareto'))).toEqual({ A: 3, B: 1, C: 0 });
  });
});

describe.each([
  ['has no model column', withoutModelColumn],
  ['has a model column with no values', withBlankModels],
])('a report that %s', (_name, load) => {
  it('is read as having no model names, but still has token columns', async () => {
    const p = await load();
    expect(p.analysis.coverage.models).toBe(false);
    expect(p.store.hasTokens).toBe(true);
  });

  it('explains the Auto use class and usage profile lenses instead of offering their groups', async () => {
    const p = await load();
    const a = availabilityOf(p);
    for (const id of ['autoUse', 'profile'] as const) {
      expect(lensUnavailableReason(id, a), id).toMatch(/no model names/);
      expect(lensOf(p, id).unsupported, id).toBe(lensUnavailableReason(id, a));
    }
    expect(lensUnavailableReason('autoUse', a)).toMatch(/Not enough data/);
    expect(lensUnavailableReason('profile', a)).toMatch(/Balanced/);
    for (const id of ['persona', 'tier', 'engagement', 'pareto', 'trait'] as const) {
      expect(lensUnavailableReason(id, a), id).toBeNull();
      expect(lensOf(p, id).unsupported, id).toBeNull();
    }
  });

  it('would otherwise put every user in Not enough data and in Balanced', async () => {
    const p = await load();
    expect(usersIn(lensOf(p, 'autoUse'))).toEqual({ autoFirst: 0, mixed: 0, direct: 0, unknown: 4 });
    expect(usersIn(lensOf(p, 'profile'))).toEqual({ frontier: 0, balanced: 4, efficient: 0 });
  });

  it('marks the traits that need model names as not detectable and gives them no users', async () => {
    const p = await load();
    const byId = Object.fromEntries(lensOf(p, 'trait').rows.map((r) => [r.id, r]));
    for (const id of ['lowCache', 'longContext', 'lowAuto', 'multiModel']) {
      expect(byId[id].unavailable, id).toBe(NEEDS_MODELS);
      expect(byId[id].users, id).toBe(0);
    }
  });

  it('groups by the lenses that do not need model names exactly as with model names', async () => {
    const [p, full] = await Promise.all([load(), withModels()]);
    for (const id of ['persona', 'tier', 'engagement', 'pareto'] as const) expect(usersIn(lensOf(p, id)), id).toEqual(usersIn(lensOf(full, id)));
  });
});

describe('the lenses of the matrix', () => {
  it('keeps the picks that are offered and different', () => {
    expect(pickLenses('tier', 'engagement', ['persona', 'tier', 'engagement'])).toEqual(['tier', 'engagement']);
  });

  it('replaces a pick that is not offered with the first offered lens that fits', () => {
    const offered: LensId[] = ['persona', 'tier', 'engagement', 'pareto', 'trait'];
    expect(pickLenses('autoUse', 'tier', offered)).toEqual(['persona', 'tier']);
    expect(pickLenses('tier', 'autoUse', offered)).toEqual(['tier', 'persona']);
  });

  it('does not use the same lens for the rows and the columns while another one is offered', () => {
    expect(pickLenses('tier', 'tier', ['persona', 'tier'])).toEqual(['tier', 'persona']);
    expect(pickLenses('autoUse', 'autoUse', ['tier', 'persona'])).toEqual(['tier', 'persona']);
  });

  it('counts the users and the usage of each pair of groups', async () => {
    const p = await withModels();
    const m = buildMatrix(LENS_BY_ID.tier, LENS_BY_ID.pareto, buildTaxonomy(p.settings), p.analysis.population);
    const at = (row: string, col: string) => m.cells[m.rows.findIndex((r) => r.id === row)][m.cols.findIndex((c) => c.id === col)];
    expect(m.rows.map((r) => r.id)).toEqual(['core', 'power']);
    expect(m.cols.map((c) => c.id)).toEqual(['A', 'B']);
    expect(m.all.users).toBe(4);
    expect(at('core', 'A').users).toBe(1);
    expect(at('core', 'A').gross).toBeCloseTo(15, 9);
    expect(at('core', 'B').users).toBe(1);
    expect(at('core', 'B').gross).toBeCloseTo(10, 9);
    expect(at('power', 'A').users).toBe(2);
    expect(at('power', 'A').gross).toBeCloseTo(50, 9);
    expect(at('power', 'B').users).toBe(0);
    expect(m.overlaps).toBe(false);
  });

  it('flags the matrix when a lens has overlapping groups', async () => {
    const p = await withModels();
    const m = buildMatrix(LENS_BY_ID.tier, LENS_BY_ID.trait, buildTaxonomy(p.settings), p.analysis.population);
    expect(m.overlaps).toBe(true);
  });
});

const PER_MONTH = 30.4375;
const html = (el: ReactElement): string => renderToStaticMarkup(el);
const calcLabel = (id: string): string => `How this is calculated: ${metricDoc(id)?.title}`;
const contextOf = (p: Pipeline): RuleContext => ({
  settings: p.settings,
  taxonomy: buildTaxonomy(p.settings),
  availability: availabilityOf(p),
  fallbackQuotaCredits: p.analysis.population.fallbackQuotaCredits,
});
const matrixOf = (p: Pipeline): string =>
  html(createElement(CrossLensMatrix, { taxonomy: buildTaxonomy(p.settings), population: p.analysis.population, availability: availabilityOf(p) }));

describe('the rules of the labels', () => {
  it('say why the Auto use class and usage profile rules cannot be applied without model names', async () => {
    const out = html(createElement(LabelRules, { current: 'autoUse', context: contextOf(await withoutModelColumn()) }));
    expect(out.match(/This report has no model names/g)).toHaveLength(2);
  });

  it('do not say it when the report names its models', async () => {
    const out = html(createElement(LabelRules, { current: 'autoUse', context: contextOf(await withModels()) }));
    expect(out).not.toContain('This report has no model names');
  });

  it('link every lens to its explanation', async () => {
    const out = html(createElement(LabelRules, { current: 'tier', context: contextOf(await withModels()) }));
    for (const l of LENSES) expect(out, l.id).toContain(calcLabel(l.calc));
  });

  it('use the live threshold values', async () => {
    const p = await withModels();
    const strict = { ...p.settings, tiers: { minimal: 0.2, light: 0.5, core: 1.5, power: 4 } };
    const out = html(createElement(LabelRules, { current: 'tier', context: { ...contextOf(p), settings: strict, taxonomy: buildTaxonomy(strict) } }));
    expect(out).toContain('400%');
  });
});

describe('the matrix of two lenses', () => {
  it('offers the Auto use class and usage profile lenses only when the report names its models', async () => {
    const [full, bare] = [matrixOf(await withModels()), matrixOf(await withoutModelColumn())];
    for (const label of ['Auto use class', 'Usage profile']) {
      expect(full, label).toContain(`>${label}</option>`);
      expect(bare, label).not.toContain(`>${label}</option>`);
    }
    for (const label of ['Persona', 'Usage tier', 'Engagement', 'Pareto class', 'Traits']) expect(bare, label).toContain(`>${label}</option>`);
  });

  it('links to its explanation', async () => {
    expect(matrixOf(await withModels())).toContain(calcLabel('segment-matrix'));
  });
});

describe('the sections of the page', () => {
  it('render for every lens of a report with model names, with a calc button on the numbers', async () => {
    const p = await withModels();
    const taxonomy = buildTaxonomy(p.settings);
    const av = availabilityOf(p);
    for (const lens of LENSES) {
      const data = buildLens(lens, taxonomy, p.analysis.population, [], PER_MONTH, av);
      const kpis = html(createElement(LensKpis, { data, perMonth: PER_MONTH }));
      for (const id of ['groups-in-use', 'largest-group', 'biggest-usage-share', 'heaviest-per-user', 'biggest-opportunity', 'group-potential-savings']) {
        expect(kpis, `${lens.id} ${id}`).toContain(calcLabel(id));
      }
      const table = html(createElement(GroupTable, { data, perMonth: PER_MONTH, showCredits: true, showPool: true, billingKnown: true }));
      expect(table, lens.id).toContain(calcLabel('group-statistics'));
      expect(table, lens.id).toContain(calcLabel('group-usage-share'));
      expect(html(createElement(GroupCards, { data })), lens.id).toContain(calcLabel('group-heaviest-users'));
      expect(html(createElement(ConcentrationChart, { data })), lens.id).toContain(calcLabel('users-vs-usage-share'));
      expect(() => html(createElement(Insights, { data })), lens.id).not.toThrow();
      expect(() => html(createElement(LensNotes, { data, segmentFiltered: false, users: 4, assumedSeats: 0, fallbackQuotaCredits: 1900 })), lens.id).not.toThrow();
    }
  });

  it('render the pool flow and the insights with a calc button', async () => {
    const p = await withModels();
    const data = lensOf(p, 'tier');
    expect(html(createElement(PoolFlowCard, { analysis: p.analysis }))).toContain(calcLabel('segment-pool-flow'));
    expect(html(createElement(Insights, { data }))).toContain(calcLabel('segment-insights'));
  });

  it('show a dash instead of billed amounts when the report has no billing split', async () => {
    const p = await analyzeCsv(makeCsv(fixture(), { columns: CSV_HEADER.filter((c) => c !== 'discount_amount' && c !== 'net_amount') }));
    expect(p.analysis.coverage.billing).toBe(false);
    const out = html(createElement(GroupTable, { data: lensOf(p, 'tier'), perMonth: PER_MONTH, showCredits: true, showPool: false, billingKnown: false }));
    expect(out).toContain('–');
    expect(out).not.toContain('$0.00');
  });

  it('list the traits that cannot be detected, with the reason', async () => {
    const p = await withoutModelColumn();
    const out = html(createElement(LensNotes, { data: lensOf(p, 'trait'), segmentFiltered: false, users: 4, assumedSeats: 0, fallbackQuotaCredits: 1900 }));
    expect(out).toContain('Some traits cannot be detected in this data');
    expect(out).toContain(NEEDS_MODELS);
  });

  it('say which users have an assumed seat size', async () => {
    const data = lensOf(await withModels(), 'tier');
    const all = html(createElement(LensNotes, { data, segmentFiltered: false, users: 4, assumedSeats: 4, fallbackQuotaCredits: 1900 }));
    expect(all).toContain('This report does not say which seats users have');
    expect(all).toContain('1,900 credits ($19) a month');
    const some = html(createElement(LensNotes, { data, segmentFiltered: false, users: 4, assumedSeats: 2, fallbackQuotaCredits: 1900 }));
    expect(some).toContain('2 users without seat information');
  });

  it('replace the groups of an unsupported lens with the reason and a way to load other data', async () => {
    const p = await withoutModelColumn();
    const reason = lensUnavailableReason('autoUse', availabilityOf(p)) ?? '';
    const out = html(createElement(UnsupportedLens, { lens: LENS_BY_ID.autoUse, reason, notice: null }));
    expect(out).toContain('Auto use class is not available for this report');
    expect(out).toContain('Every user would be Not enough data.');
    expect(out).toContain('Open Data');
  });
});

describe('the whole page', () => {
  const pageOf = async (p: Pipeline): Promise<string> => {
    const dataset: Dataset = { store: p.store, prep: p.prep, label: 'synthetic.csv', loadedAt: 0 };
    return html(createElement(AnalysisProvider, { dataset, children: createElement(SegmentsPage) }));
  };

  it('shows every section for a report with model names', async () => {
    const out = await pageOf(await withModels());
    for (const text of ['Compare by', 'Compare the groups', 'Group profiles', 'Combine two lenses', 'The shared pool', 'How the labels are decided']) {
      expect(out, text).toContain(text);
    }
    expect(out).toContain(calcLabel('persona-groups'));
    expect(out).not.toContain('is not available for this report');
  });

  it('marks the lenses that the report cannot support in the switcher, and still shows the rest of the page', async () => {
    const out = await pageOf(await withoutModelColumn());
    expect(out).toContain('Auto use class');
    expect(out.match(/Not available for this report\. Select it to see why\./g)).toHaveLength(2);
    for (const text of ['Compare the groups', 'Group profiles', 'Combine two lenses', 'How the labels are decided']) expect(out, text).toContain(text);
  });
});
