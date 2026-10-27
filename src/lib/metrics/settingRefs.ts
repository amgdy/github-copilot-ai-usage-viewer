import { msg, t, tp } from '../../i18n/core.ts';
import type { Settings } from '../analytics/settings';
import { fmtInt, fmtUSD } from '../utils/format';
import type { SettingRef } from './types';

/** A percent without trailing zeros: 0.5 gives "50%", 0.125 gives "12.5%". */
const pct = (share: number): string => `${Math.round(share * 1000) / 10}%`;
const days = (dayCount: number): string => tp(dayCount, '{n} day', '{n} days', { n: fmtInt(dayCount) });

interface RefSpec {
  /** The label of the setting on the Settings page, in English. Callers translate it with t(). */
  label: string;
  /** The current value in words, from the live settings, in the current language. */
  value: (settings: Settings) => string;
}

/** Every setting, so a setting added later cannot go without a label. */
export const SETTING_REFS: Record<SettingRef, RefSpec> = {
  activeThreshold: { label: msg('Active-day threshold'), value: (settings) => t('{amount} of usage in a day', { amount: fmtUSD(settings.activeThreshold, 2) }) },
  tiers: {
    label: msg('Spend tiers'),
    value: (settings) =>
      t('Minimal up to {minimal}, Light up to {light}, Core up to {core}, Power up to {power} of own included credits', {
        minimal: pct(settings.tiers.minimal),
        light: pct(settings.tiers.light),
        core: pct(settings.tiers.core),
        power: pct(settings.tiers.power),
      }),
  },
  engagement: {
    label: msg('Engagement'),
    value: (settings) =>
      t('Daily from {daily}, Regular from {regular}, Occasional from {occasional} of workdays', {
        daily: pct(settings.engagement.daily),
        regular: pct(settings.engagement.regular),
        occasional: pct(settings.engagement.occasional),
      }),
  },
  pareto: { label: msg('Pareto classes'), value: (settings) => t('Class A to {a}, Class B to {b} of usage', { a: pct(settings.pareto.a), b: pct(settings.pareto.b) }) },
  frontierHeavy: { label: msg('Frontier-heavy from'), value: (settings) => t('{share} of usage on Powerful models', { share: pct(settings.frontierHeavy) }) },
  efficientShare: { label: msg('Efficient from'), value: (settings) => t('{share} of usage on Versatile and Lightweight models', { share: pct(settings.efficientShare) }) },
  lapsedDays: { label: msg('Lapsed after'), value: (settings) => days(settings.lapsedDays) },
  newUserDays: { label: msg('New user window'), value: (settings) => days(settings.newUserDays) },
  spikeShare: { label: msg('Spiky usage from'), value: (settings) => t('{share} of usage on the biggest day', { share: pct(settings.spikeShare) }) },
  lowAuto: { label: msg('Rarely uses Auto below'), value: (settings) => t('{share} of usage through Auto', { share: pct(settings.lowAuto) }) },
  autoFirst: { label: msg('Auto first from'), value: (settings) => t('{share} of usage through Auto', { share: pct(settings.autoFirst) }) },
  lowCacheHit: { label: msg('Low cache reuse below'), value: (settings) => t('{share} cache hit rate', { share: pct(settings.lowCacheHit) }) },
  longContextShare: { label: msg('Long-context surcharges from'), value: (settings) => t('{share} of usage', { share: pct(settings.longContextShare) }) },
  minSpendForTraits: { label: msg('Minimum usage for traits'), value: (settings) => fmtUSD(settings.minSpendForTraits, 2) },
  autoDiscount: {
    label: msg('Auto model discount'),
    value: (settings) =>
      t('{share}, used for plans with no Auto usage to measure from. Plans with enough Auto usage use their measured discount.', {
        share: pct(settings.autoDiscount),
      }),
  },
  budgetMonthlyBilled: { label: msg('Monthly budget'), value: (settings) => (settings.budgetMonthlyBilled === null ? t('Not set') : fmtUSD(settings.budgetMonthlyBilled, 2)) },
  roster: { label: msg('License list'), value: (settings) => tp(settings.roster.length, '{n} seat', '{n} seats', { n: fmtInt(settings.roster.length) }) },
  rosterAsOf: {
    label: msg('License list date'),
    value: (settings) =>
      settings.rosterAsOf
        ? t('{date}. Days since last activity are counted from this day.', { date: settings.rosterAsOf })
        : t('Not set. The latest date in the license list is used.'),
  },
  extraSeats: {
    label: msg('Extra seats'),
    value: (settings) => t('{business} Business, {enterprise} Enterprise', { business: fmtInt(settings.extraSeats.business), enterprise: fmtInt(settings.extraSeats.enterprise) }),
  },
  modelOverrides: {
    label: msg('Model pricing and tiers'),
    value: (settings) => {
      const editedCount = Object.keys(settings.modelOverrides).length;
      return editedCount === 0 ? t('Price card as shipped') : tp(editedCount, '{n} model edited', '{n} models edited', { n: fmtInt(editedCount) });
    },
  },
  topN: { label: msg('Top N users'), value: (settings) => fmtInt(settings.topN) },
};

/** The English label and the current value of a setting, for the explanation of a number. Translate the label with t(). */
export function describeSetting(ref: SettingRef, settings: Settings): { label: string; value: string } {
  const spec = SETTING_REFS[ref];
  return { label: spec.label, value: spec.value(settings) };
}
