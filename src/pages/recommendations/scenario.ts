import { msg, t } from '../../i18n';
import type { Analysis } from '../../lib/analytics/analyze';
import { DEFAULT_LEVERS, LEVER_META, LEVER_ORDER, VERSATILE_TARGETS, type LeverContext, type LeverParams, type LeverStep } from '../../lib/analytics/levers';
import { DOWNGRADE_HEADROOM } from '../../lib/analytics/seats';
import type { Settings } from '../../lib/analytics/settings';
import type { Scenario, ScenarioMonth } from '../../lib/analytics/simulator';
import type { ModelTable } from '../../lib/pricing/models';
import { fmtMultiple, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';

export type LeverId = LeverStep['id'];

/** The explanation of each lever. A slider opens it together with the explanation of how the levers combine. */
export const LEVER_DOC: Record<LeverId, string> = {
  modelShift: 'lever-model-shift',
  autoAdoption: 'lever-auto',
  cacheDiscipline: 'lever-cache',
  contextHygiene: 'lever-context',
  longContext: 'lever-long-context',
  capRunaway: 'lever-cap',
};

/** The context the analysis uses for its own plan, with the Auto rates of the whole filtered population, so the Balanced preset gives that plan. */
export const leverContext = (a: Analysis, models: ModelTable, settings: Settings): LeverContext => ({ agg: a.agg, models, settings, autoRates: a.autoRates });
export type NumericLever = Exclude<keyof LeverParams, 'target'>;
export type PresetValues = Record<NumericLever, number>;

/** Whole dollars from $100 up and cents below, so small single-user figures stay readable. */
export const fmtMoney = (v: number): string => (Math.abs(v) >= 100 ? fmtUSD(v, 0) : fmtUSD(v, 2));

/** Below this monthly amount (USD) a lever counts as having no measurable effect. */
export const MIN_EFFECT = 0.5;

export const NUMERIC_LEVERS: NumericLever[] = ['modelShift', 'autoAdoption', 'cacheDiscipline', 'contextHygiene', 'longContext', 'capRunaway', 'capUtil'];

const valuesOf = (l: LeverParams): PresetValues => ({
  modelShift: l.modelShift,
  autoAdoption: l.autoAdoption,
  cacheDiscipline: l.cacheDiscipline,
  contextHygiene: l.contextHygiene,
  longContext: l.longContext,
  capRunaway: l.capRunaway,
  capUtil: l.capUtil,
});

export type PresetId = 'conservative' | 'balanced' | 'ambitious';

export interface Preset {
  id: PresetId;
  /** English text; show it through t(). */
  label: string;
  /** English text; show it through t(). */
  hint: string;
  values: PresetValues;
}

export const PRESETS: Preset[] = [
  {
    id: 'conservative',
    label: msg('Conservative'),
    hint: msg('Small habit changes that most teams can adopt quickly.'),
    values: { modelShift: 0.15, autoAdoption: 0.25, cacheDiscipline: 0.1, contextHygiene: 0.05, longContext: 0.15, capRunaway: 0.25, capUtil: 4 },
  },
  { id: 'balanced', label: msg('Balanced'), hint: msg('The assumptions behind the plan shown on the other pages.'), values: valuesOf(DEFAULT_LEVERS) },
  {
    id: 'ambitious',
    label: msg('Ambitious'),
    hint: msg('Needs steady coaching and limits that are actually enforced.'),
    values: { modelShift: 0.5, autoAdoption: 0.8, cacheDiscipline: 0.4, contextHygiene: 0.2, longContext: 0.6, capRunaway: 0.8, capUtil: 2 },
  },
];

const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;
const sameNumbers = (l: LeverParams, v: PresetValues): boolean => NUMERIC_LEVERS.every((k) => near(l[k], v[k]));

/** The preset whose percentages equal the current ones, or "custom". The target model is not part of a preset. */
export function matchPreset(l: LeverParams): PresetId | 'custom' {
  return PRESETS.find((p) => sameNumbers(l, p.values))?.id ?? 'custom';
}

export const applyPreset = (l: LeverParams, p: Preset): LeverParams => ({ ...l, ...p.values });

export const isDefaultLevers = (l: LeverParams): boolean => sameNumbers(l, valuesOf(DEFAULT_LEVERS)) && l.target === DEFAULT_LEVERS.target;

export const SAME_VENDOR = 'same-vendor';

/** The default first, then the models A to Z. Labels are English text; show them through t(). Model names stay as they are. */
export const TARGET_OPTIONS: { value: string; label: string }[] = [
  { value: SAME_VENDOR, label: msg('Mid-tier model of the same vendor (default)') },
  ...[...VERSATILE_TARGETS].sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })).map((name) => ({ value: name, label: name })),
];

export const targetLabel = (target: string): string => (target === SAME_VENDOR ? t('the mid-tier model of the same vendor') : target);

export interface SeatFlags {
  reclaimIdle: boolean;
  downgrade: boolean;
  reclaimUnused: boolean;
}

export const DEFAULT_SEAT_FLAGS: SeatFlags = { reclaimIdle: true, downgrade: true, reclaimUnused: true };

/** The explanation of each seat action: the lists on the Seats tab use the same documents. */
export const SEAT_DOC: Record<keyof SeatFlags, string> = { reclaimIdle: 'seat-idle', downgrade: 'seat-downgrade', reclaimUnused: 'seat-unused' };

export interface SeatOption {
  key: keyof SeatFlags;
  label: string;
  /** Seat value per month if the action is taken. */
  value: number;
  count: number;
  /** Why the switch cannot be used, or null when it can. */
  disabledReason: string | null;
}

/**
 * Why cash savings from using less cannot be calculated, or null when they can.
 * They only need the billed split: a pool that ran out is as large as what it covered, and a pool that never ran out billed nothing.
 */
export function cashHiddenReason(a: Analysis): string | null {
  if (a.narrowed) {
    return t('Included credits are shared by the whole organization and cannot be split by a filter, so cash savings are not shown for a filtered view.');
  }
  if (!a.coverage.billing) return t('The file does not say what was billed on top of seats, so cash savings cannot be calculated.');
  if (a.pool.months.length === 0) return t('The pool size is not known, so cash savings cannot be calculated.');
  return null;
}

export const isCashKnown = (a: Analysis): boolean => cashHiddenReason(a) === null;

/** Why the pool size, its unused credits and seat savings cannot be calculated, or null when they can. */
export function poolUnknownReason(a: Analysis): string | null {
  const cash = cashHiddenReason(a);
  if (cash) return cash;
  if (a.pool.capacityExceeded || a.pool.capacity <= 0) {
    return t('The included credits used are more than the seats in this file provide, so the real pool size is unknown. Add your seat roster or extra seats in Settings to see the pool, its unused credits and seat savings.');
  }
  return null;
}

export const isPoolKnown = (a: Analysis): boolean => poolUnknownReason(a) === null;

export function seatOptions(a: Analysis, settings: Settings): SeatOption[] {
  const { seats, narrowed, pool } = a;
  const blocked = narrowed
    ? t('Seats belong to the whole organization, so they are not available for a filtered view.')
    : pool.capacityExceeded
      ? t('The pool is larger than the seats in the file, so seat savings cannot be sized. Add the roster or extra seats in Settings.')
      : null;
  const make = (key: keyof SeatFlags, label: string, value: number, count: number, none: string): SeatOption => ({
    key,
    label,
    value,
    count,
    disabledReason: blocked ?? (value > 0.005 ? null : none),
  });
  return [
    make('reclaimIdle', t('Reclaim idle seats'), seats.idleValue, seats.idle.length, t('No idle seats were found in this period.')),
    make(
      'downgrade',
      t('Move Enterprise seats to Business'),
      seats.downgradeValue,
      seats.downgrade.length,
      t('No Enterprise user stays within {share} of the Business allotment.', { share: fmtPct(DOWNGRADE_HEADROOM, 0) }),
    ),
    make(
      'reclaimUnused',
      t('Remove roster seats that never appear'),
      seats.unusedValue,
      seats.unused.length,
      settings.roster.length === 0 ? t('No seat roster is loaded. Add it in Settings to find seats that never appear.') : t('Every roster seat appears in the files.'),
    ),
  ];
}

/** A switch counts only when the user turned it on and it is available. */
export function effectiveSeats(flags: SeatFlags, options: SeatOption[]): SeatFlags {
  const open = (key: keyof SeatFlags): boolean => flags[key] && options.find((o) => o.key === key)?.disabledReason === null;
  return { reclaimIdle: open('reclaimIdle'), downgrade: open('downgrade'), reclaimUnused: open('reclaimUnused') };
}

export interface ScenarioFigures {
  cash: boolean;
  /** The pool size is known, so cost and unused credits can be shown. Implies `cash`. */
  poolKnown: boolean;
  months: number;
  /** Share of usage avoided (0 to 1). */
  reduction: number;
  /** Usage per month. */
  usageBefore: number;
  usageAfter: number;
  saveMonth: number;
  saveYear: number;
  costBefore: number;
  costAfter: number;
  /** Included credits that are paid for but not used, per month. */
  unusedBefore: number;
  unusedAfter: number;
  /** Usage above the pool, billed on top of seats, per month. */
  billedBefore: number;
  billedAfter: number;
}

export const monthBilled = (m: ScenarioMonth): number => Math.max(0, m.gross - m.capacity);
export const monthNewBilled = (m: ScenarioMonth): number => Math.max(0, m.newGross - m.newCapacity);

/** Monthly figures for the headline tiles. Usage comes from the monthly pool table when cash is known, else from the lever baseline. */
export function scenarioFigures(s: Scenario, perMonth: number, cash: boolean, poolKnown: boolean): ScenarioFigures {
  const n = s.months.length;
  const avg = (pick: (m: ScenarioMonth) => number): number => (n > 0 ? s.months.reduce((a, m) => a + pick(m), 0) / n : 0);
  const fromMonths = cash && n > 0;
  return {
    cash,
    poolKnown: cash && poolKnown,
    months: n,
    reduction: s.fraction,
    usageBefore: fromMonths ? avg((m) => m.gross) : s.levers.baseline * perMonth,
    usageAfter: fromMonths ? avg((m) => m.newGross) : s.levers.final * perMonth,
    saveMonth: cash ? s.perMonth : 0,
    saveYear: cash ? s.perMonth * 12 : 0,
    costBefore: avg((m) => m.baseCost),
    costAfter: avg((m) => m.newCost),
    unusedBefore: avg((m) => m.baseWaste),
    unusedAfter: avg((m) => m.newWaste),
    billedBefore: avg(monthBilled),
    billedAfter: avg(monthNewBilled),
  };
}

export interface NoEffectContext {
  hasTokens: boolean;
  shiftRows: number;
  longPremium: number;
}

/** Plain reason why a lever saves nothing. */
export function noEffectNote(id: LeverId, l: LeverParams, ctx: NoEffectContext): string {
  if (l[id] <= 0) return t('The slider is at 0%.');
  switch (id) {
    case 'modelShift':
      return ctx.shiftRows === 0 ? t('No Powerful-tier model usage with a cheaper target was found.') : t('The saving is too small to measure.');
    case 'autoAdoption':
      return t('There is no manual model usage left to move to Auto.');
    case 'cacheDiscipline':
    case 'contextHygiene':
      return ctx.hasTokens ? t('The saving is too small to measure.') : t('The file has no token columns.');
    case 'longContext':
      return ctx.longPremium <= 0 ? t('No long-context surcharges were found.') : t('The saving is too small to measure.');
    case 'capRunaway':
      return t('Nobody goes above {multiple} their included credits.', { multiple: fmtMultiple(l.capUtil) });
  }
}

export function leverSentence(id: LeverId, l: LeverParams): string {
  const pct = fmtPct(l[id], 0);
  switch (id) {
    case 'modelShift':
      return t('{pct} of Powerful-tier usage moves to {target}', { pct, target: targetLabel(l.target) });
    case 'autoAdoption':
      return t('{pct} of manually chosen model usage moves to Auto', { pct });
    case 'cacheDiscipline':
      return t('{pct} of cache-write tokens become cache reads', { pct });
    case 'contextHygiene':
      return t('{pct} less input-side token usage', { pct });
    case 'longContext':
      return t('{pct} of long-context surcharges avoided', { pct });
    case 'capRunaway':
      return t('{pct} of usage above {multiple} included credits avoided', { pct, multiple: fmtMultiple(l.capUtil) });
  }
}

export interface ScenarioTextInput {
  period: string;
  scope: string;
  userCount: number;
  presetLabel: string;
  levers: LeverParams;
  seats: { option: SeatOption; on: boolean }[];
  scenario: Scenario;
  figures: ScenarioFigures;
  perMonth: number;
  /** Set when cash savings are not shown, with the reason. */
  cashNote: string | null;
  /** Set when the pool size is unknown, with the reason. */
  poolNote: string | null;
  poolIsLowerBound: boolean;
}

/** Plain-text version of the scenario for email or chat. */
export function scenarioText(i: ScenarioTextInput): string {
  const f = i.figures;
  const usd = fmtMoney;
  const out: string[] = [];
  const line = (text: string): void => {
    out.push(`- ${text}`);
  };
  out.push(
    t('GitHub Copilot AI credits: what-if scenario'),
    t('Period: {period}', { period: i.period }),
    t('Scope: {scope}, {users}', { scope: i.scope, users: pluralize(i.userCount, 'user') }),
    t('Preset: {preset}', { preset: i.presetLabel }),
    '',
  );

  out.push(t('Assumptions'));
  for (const id of LEVER_ORDER) line(`${t(LEVER_META[id].label)}: ${leverSentence(id, i.levers)}`);
  out.push('', t('Seat actions'));
  for (const { option, on } of i.seats) {
    const state = option.disabledReason
      ? `${t('not available')}. ${option.disabledReason}`
      : on
        ? t('on, {seats}, {value} a month of seat value', { seats: pluralize(option.count, 'seat'), value: usd(option.value) })
        : t('off');
    line(`${option.label}: ${state}`);
  }

  out.push('', t('Results, per month'));
  line(t('Usage reduction: {pct} (usage goes from {before} to {after})', { pct: fmtPct(f.reduction, 1), before: usd(f.usageBefore), after: usd(f.usageAfter) }));
  if (f.cash) {
    line(t('Cash saving: {month} a month, {year} a year', { month: usd(f.saveMonth), year: usd(f.saveYear) }));
    if (f.poolKnown) {
      line(t('Monthly cost: {before} now, {after} after', { before: usd(f.costBefore), after: usd(f.costAfter) }));
      line(t('Unused included credits: {before} now, {after} after', { before: usd(f.unusedBefore), after: usd(f.unusedAfter) }));
    } else {
      line(t('Billed on top of seats: {before} now, {after} after', { before: usd(f.billedBefore), after: usd(f.billedAfter) }));
      if (i.poolNote) line(t('Pool size, cost and unused credits: not shown. {reason}', { reason: i.poolNote }));
    }
  } else {
    line(`${t('Cash saving: not shown.')} ${i.cashNote ?? ''}`.trim());
  }

  out.push('', t('Effect of each lever, in order (usage per month)'));
  for (const step of i.scenario.levers.steps) {
    line(t('{lever}: -{saving} (-{alone} on its own)', { lever: step.label, saving: usd(step.savings * i.perMonth), alone: usd(step.standalone * i.perMonth) }));
  }

  out.push('', t('Notes'));
  line(t('Cost is the larger of the pool of included credits and the usage. Using less saves cash only above the pool, and removing seats saves only up to the unused part of the pool.'));
  line(t('The levers are applied one after the other, so they do not double count.'));
  if (f.cash && !f.poolKnown) line(t('Cash savings come from the overage that was billed: a month that ran out of included credits shows the real pool size, and a month that did not billed nothing.'));
  else if (i.poolIsLowerBound) line(t('The pool size counts only the seats that appear in the report, so cash figures are a rough guide.'));
  line(t('These are estimates from past usage, not a forecast.'));
  return out.join('\n');
}
