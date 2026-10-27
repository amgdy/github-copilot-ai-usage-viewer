import { msg, t, tp } from '../../i18n/core.ts';
import type { Settings } from '../analytics/settings';
import { fmtInt, fmtUSD } from '../utils/format';
import type { SettingRef } from './types';

/** A percent without trailing zeros: 0.5 gives "50%", 0.125 gives "12.5%". */
const pct = (v: number): string => `${Math.round(v * 1000) / 10}%`;
const days = (n: number): string => tp(n, '{n} day', '{n} days', { n: fmtInt(n) });

interface RefSpec {
  /** The label of the setting on the Settings page, in English. Callers translate it with t(). */
  label: string;
  /** The current value in words, from the live settings, in the current language. */
  value: (s: Settings) => string;
}

/** Every setting, so a setting added later cannot go without a label. */
export const SETTING_REFS: Record<SettingRef, RefSpec> = {
  activeThreshold: { label: msg('Active-day threshold'), value: (s) => t('{amount} of usage in a day', { amount: fmtUSD(s.activeThreshold, 2) }) },
  tiers: {
    label: msg('Spend tiers'),
    value: (s) =>
      t('Minimal up to {minimal}, Light up to {light}, Core up to {core}, Power up to {power} of own included credits', {
        minimal: pct(s.tiers.minimal),
        light: pct(s.tiers.light),
        core: pct(s.tiers.core),
        power: pct(s.tiers.power),
      }),
  },
  engagement: {
    label: msg('Engagement'),
    value: (s) =>
      t('Daily from {daily}, Regular from {regular}, Occasional from {occasional} of workdays', {
        daily: pct(s.engagement.daily),
        regular: pct(s.engagement.regular),
        occasional: pct(s.engagement.occasional),
      }),
  },
  pareto: { label: msg('Pareto classes'), value: (s) => t('Class A to {a}, Class B to {b} of usage', { a: pct(s.pareto.a), b: pct(s.pareto.b) }) },
  frontierHeavy: { label: msg('Frontier-heavy from'), value: (s) => t('{share} of usage on Powerful models', { share: pct(s.frontierHeavy) }) },
  efficientShare: { label: msg('Efficient from'), value: (s) => t('{share} of usage on Versatile and Lightweight models', { share: pct(s.efficientShare) }) },
  lapsedDays: { label: msg('Lapsed after'), value: (s) => days(s.lapsedDays) },
  newUserDays: { label: msg('New user window'), value: (s) => days(s.newUserDays) },
  spikeShare: { label: msg('Spiky usage from'), value: (s) => t('{share} of usage on the biggest day', { share: pct(s.spikeShare) }) },
  lowAuto: { label: msg('Rarely uses Auto below'), value: (s) => t('{share} of usage through Auto', { share: pct(s.lowAuto) }) },
  autoFirst: { label: msg('Auto first from'), value: (s) => t('{share} of usage through Auto', { share: pct(s.autoFirst) }) },
  lowCacheHit: { label: msg('Low cache reuse below'), value: (s) => t('{share} cache hit rate', { share: pct(s.lowCacheHit) }) },
  longContextShare: { label: msg('Long-context surcharges from'), value: (s) => t('{share} of usage', { share: pct(s.longContextShare) }) },
  minSpendForTraits: { label: msg('Minimum usage for traits'), value: (s) => fmtUSD(s.minSpendForTraits, 2) },
  autoDiscount: {
    label: msg('Auto model discount'),
    value: (s) =>
      t('{share}, used for plans with no Auto usage to measure from. Plans with enough Auto usage use their measured discount.', {
        share: pct(s.autoDiscount),
      }),
  },
  budgetMonthlyBilled: { label: msg('Monthly budget'), value: (s) => (s.budgetMonthlyBilled === null ? t('Not set') : fmtUSD(s.budgetMonthlyBilled, 2)) },
  roster: { label: msg('License list'), value: (s) => tp(s.roster.length, '{n} seat', '{n} seats', { n: fmtInt(s.roster.length) }) },
  rosterAsOf: {
    label: msg('License list date'),
    value: (s) =>
      s.rosterAsOf
        ? t('{date}. Days since last activity are counted from this day.', { date: s.rosterAsOf })
        : t('Not set. The latest date in the license list is used.'),
  },
  extraSeats: {
    label: msg('Extra seats'),
    value: (s) => t('{business} Business, {enterprise} Enterprise', { business: fmtInt(s.extraSeats.business), enterprise: fmtInt(s.extraSeats.enterprise) }),
  },
  modelOverrides: {
    label: msg('Model pricing and tiers'),
    value: (s) => {
      const n = Object.keys(s.modelOverrides).length;
      return n === 0 ? t('Price card as shipped') : tp(n, '{n} model edited', '{n} models edited', { n: fmtInt(n) });
    },
  },
  topN: { label: msg('Top N users'), value: (s) => fmtInt(s.topN) },
};

/** The English label and the current value of a setting, for the explanation of a number. Translate the label with t(). */
export function describeSetting(ref: SettingRef, settings: Settings): { label: string; value: string } {
  const spec = SETTING_REFS[ref];
  return { label: spec.label, value: spec.value(settings) };
}
