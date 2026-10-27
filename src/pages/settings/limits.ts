import type { Settings } from '../../lib/analytics/settings';
import { fmtUSD, pluralize } from '../../lib/utils/format';
import { msg } from '../../i18n';
import { numText } from './numbers';

export interface Range {
  min: number;
  max: number;
}

/** Allowed ranges. Percent ranges are in percent, so the stored fraction is the value divided by 100. */
export const LIMITS = {
  activeThreshold: { min: 0, max: 1000 },
  tier: { min: 1, max: 10_000 },
  engagement: { min: 1, max: 100 },
  paretoA: { min: 1, max: 99 },
  paretoB: { min: 2, max: 100 },
  extraSeats: { min: 0, max: 1_000_000 },
  budget: { min: 0, max: 10_000_000 },
} as const satisfies Record<string, Range>;

export type ScalarKey = Extract<
  keyof Settings,
  | 'frontierHeavy'
  | 'efficientShare'
  | 'lapsedDays'
  | 'newUserDays'
  | 'spikeShare'
  | 'lowAuto'
  | 'autoFirst'
  | 'lowCacheHit'
  | 'longContextShare'
  | 'minSpendForTraits'
  | 'autoDiscount'
  | 'topN'
>;

export type ScalarUnit = 'percent' | 'days' | 'usd' | 'count';

export interface ScalarSpec extends Range {
  key: ScalarKey;
  /** English; show it with t(). */
  label: string;
  /** English; show it with t(). */
  description: string;
  unit: ScalarUnit;
  integer?: boolean;
}

const pctSpec = (key: ScalarKey, label: string, description: string, min = 1, max = 100): ScalarSpec => ({ key, label, description, unit: 'percent', min, max });

export const SCALARS: Record<ScalarKey, ScalarSpec> = {
  frontierHeavy: pctSpec('frontierHeavy', msg('Frontier-heavy from'), msg('A user is Frontier-heavy when at least this share of their usage is on Powerful models.')),
  efficientShare: pctSpec(
    'efficientShare',
    msg('Efficient from'),
    msg('A user is Efficient when at least this share of their usage is on Versatile and Lightweight models, and they are not Frontier-heavy.'),
  ),
  lapsedDays: {
    key: 'lapsedDays',
    label: msg('Lapsed after'),
    description: msg('A user is Lapsed when their last usage was at least this many days before the end of the period, unless they are New.'),
    unit: 'days',
    min: 1,
    max: 365,
    integer: true,
  },
  newUserDays: {
    key: 'newUserDays',
    label: msg('New user window'),
    description: msg('A user is New when their first day is within this many days of the end of the period and at least this many days after the report starts.'),
    unit: 'days',
    min: 1,
    max: 365,
    integer: true,
  },
  minSpendForTraits: {
    key: 'minSpendForTraits',
    label: msg('Minimum usage for traits'),
    description: msg('Users with less usage than this in the period are not flagged for usage traits. The trend traits apply it to a single week.'),
    unit: 'usd',
    min: 0,
    max: 100_000,
  },
  spikeShare: pctSpec('spikeShare', msg('Spiky usage from'), msg("Flags Spiky usage when the biggest single day is at least this share of the user's usage. Needs at least 3 active days.")),
  lowAuto: pctSpec(
    'lowAuto',
    msg('Rarely uses Auto below'),
    msg(
      'A user is in the Direct models class when less than this share of their usage goes through Auto model selection. They also get the Rarely uses Auto trait if their usage reaches the minimum for traits. Keep it below Auto first from.',
    ),
  ),
  autoFirst: pctSpec(
    'autoFirst',
    msg('Auto first from'),
    msg('A user is in the Auto-first class when at least this share of their usage goes through Auto model selection. Keep it above Rarely uses Auto below.'),
  ),
  lowCacheHit: pctSpec(
    'lowCacheHit',
    msg('Low cache reuse below'),
    msg(
      'Flags Low cache reuse when the cache hit rate is below this value. The cache hit rate is cache read tokens (text the model reads again from its cache at a lower price) as a share of input, cache read and cache write tokens.',
    ),
  ),
  longContextShare: pctSpec(
    'longContextShare',
    msg('Long-context surcharges from'),
    msg("Flags Long-context surcharges when the estimated extra cost of long prompts is at least this share of the user's usage."),
  ),
  // The analysis holds the rate at 90% or below, so the setting stops there.
  autoDiscount: pctSpec(
    'autoDiscount',
    msg('Auto model discount'),
    msg(
      'The Auto discount rate to assume for a plan when the report has no Auto usage to measure it from. A plan whose Auto usage can be priced from tokens uses its measured rate instead. The assumed rate sets the discount missed on hand-picked usage and the Auto savings estimate. It never changes usage, covered or billed amounts.',
    ),
    0,
    90,
  ),
  topN: {
    key: 'topN',
    label: msg('Top N users'),
    description: msg('How many users the top-user charts and the executive summary list.'),
    unit: 'count',
    min: 3,
    max: 50,
    integer: true,
  },
};

/** Groups of the number settings, in the order a manager reads them. Titles are English; show them with t(). */
export const BEHAVIOR_GROUPS: { title: string; keys: ScalarKey[] }[] = [
  { title: msg('Model mix'), keys: ['frontierHeavy', 'efficientShare'] },
  { title: msg('Auto use class'), keys: ['lowAuto', 'autoFirst'] },
  { title: msg('Lifecycle'), keys: ['newUserDays', 'lapsedDays'] },
  { title: msg('Traits'), keys: ['minSpendForTraits', 'spikeShare', 'lowCacheHit', 'longContextShare'] },
];

/** Reads a scalar from settings in display units (percent fields are shown as percent). */
export function scalarDisplay(spec: ScalarSpec, settings: Settings): number {
  const storedValue = settings[spec.key];
  return spec.unit === 'percent' ? Math.round(storedValue * 100 * 1e6) / 1e6 : storedValue;
}

/** A value in display units with its unit, for example "70%", "7 days" or "$5.00". */
export function unitText(spec: ScalarSpec, displayValue: number): string {
  if (spec.unit === 'percent') return `${numText(displayValue, 2)}%`;
  if (spec.unit === 'days') return pluralize(displayValue, 'day');
  if (spec.unit === 'usd') return fmtUSD(displayValue, 2);
  return String(displayValue);
}
