import { DEFAULT_SETTINGS, type Settings } from '../../lib/analytics/settings';
import { engagementItems, paretoItems, tierItems, type EngagementId, type ParetoId, type TierId } from '../../lib/analytics/taxonomy';
import { t } from '../../i18n';
import type { Band } from './LiveBands';
import { numText, toPct } from './numbers';

const pct = (fraction: number) => `${numText(toPct(fraction), 2)}%`;

const colorMap = <T extends string>(items: { id: string; color: string }[]) => Object.fromEntries(items.map((i) => [i.id, i.color])) as Record<T, string>;

// Colors do not depend on the thresholds, so they are read once from the defaults.
export const TIER_COLOR = colorMap<TierId>(tierItems(DEFAULT_SETTINGS));
export const ENGAGEMENT_COLOR = colorMap<EngagementId>(engagementItems(DEFAULT_SETTINGS));
export const PARETO_COLOR = colorMap<ParetoId>(paretoItems(DEFAULT_SETTINGS));

export function tierBands(tiers: Settings['tiers']): Band[] {
  return [
    { id: 'minimal', label: t('Minimal'), range: t('Under {value}', { value: pct(tiers.minimal) }), color: TIER_COLOR.minimal },
    { id: 'light', label: t('Light'), range: t('{from} to {to}', { from: pct(tiers.minimal), to: pct(tiers.light) }), color: TIER_COLOR.light },
    { id: 'core', label: t('Core'), range: t('{from} to {to}', { from: pct(tiers.light), to: pct(tiers.core) }), color: TIER_COLOR.core },
    { id: 'power', label: t('Power'), range: t('{from} to {to}', { from: pct(tiers.core), to: pct(tiers.power) }), color: TIER_COLOR.power },
    { id: 'runaway', label: t('Runaway'), range: t('{value} or more', { value: pct(tiers.power) }), color: TIER_COLOR.runaway },
  ];
}

export function engagementBands(e: Settings['engagement']): Band[] {
  return [
    { id: 'daily', label: t('Daily'), range: t('{value} or more', { value: pct(e.daily) }), color: ENGAGEMENT_COLOR.daily },
    { id: 'regular', label: t('Regular'), range: t('{from} to {to}', { from: pct(e.regular), to: pct(e.daily) }), color: ENGAGEMENT_COLOR.regular },
    { id: 'occasional', label: t('Occasional'), range: t('{from} to {to}', { from: pct(e.occasional), to: pct(e.regular) }), color: ENGAGEMENT_COLOR.occasional },
    { id: 'rare', label: t('Rare'), range: t('Under {value}', { value: pct(e.occasional) }), color: ENGAGEMENT_COLOR.rare },
  ];
}

export function paretoBands(p: Settings['pareto']): Band[] {
  return [
    { id: 'A', label: t('A: top users'), range: t('First {value} of usage', { value: pct(p.a) }), color: PARETO_COLOR.A },
    { id: 'B', label: t('B: middle'), range: t('Next {value}', { value: pct(p.b - p.a) }), color: PARETO_COLOR.B },
    { id: 'C', label: t('C: long tail'), range: t('Last {value}', { value: pct(1 - p.b) }), color: PARETO_COLOR.C },
  ];
}
