import type { Settings } from './settings';
import { t } from '../../i18n/core';

export type TierId = 'minimal' | 'light' | 'core' | 'power' | 'runaway';
export type EngagementId = 'daily' | 'regular' | 'occasional' | 'rare';
export type LifecycleId = 'new' | 'lapsed';
export type PersonaId = 'champion' | 'steady' | 'burst' | 'dormant' | 'runaway' | 'new' | 'lapsed';
export type ProfileId = 'frontier' | 'balanced' | 'efficient';
export type ParetoId = 'A' | 'B' | 'C';
/** How much of a user's usage goes through Auto model selection. `unknown` when the report has no model names or the user has no usage. */
export type AutoUseId = 'autoFirst' | 'mixed' | 'direct' | 'unknown';
export type TraitId =
  | 'lowCache'
  | 'longContext'
  | 'spiky'
  | 'lowAuto'
  | 'multiModel'
  | 'accelerating'
  | 'fading'
  | 'noCostCenter';

export interface TaxonomyItem<T extends string = string> {
  id: T;
  label: string;
  color: string;
  /** What the label means, in plain language. */
  description: string;
  /** What management / the user should do about it. */
  action: string;
}

/*
 * Display order. Classes that are good or bad run from the best to the worst (engagement, personas, model profiles,
 * Auto use). Size scales keep their natural order, smallest first (spend tiers, Pareto A to C). Traits are all
 * watch-points, so they run from the one that usually costs the most to the one that costs the least.
 * Labels, descriptions and actions go through t(), so they show in the reader's language.
 */

/** A fraction as a percent for a label. A whole percent has no decimals, and a threshold such as 12.5% keeps them. */
const pct = (x: number) => `${Number((x * 100).toFixed(2))}%`;

export const TIER_ORDER: TierId[] = ['minimal', 'light', 'core', 'power', 'runaway'];

export function tierItems(s: Settings): TaxonomyItem<TierId>[] {
  const v = { minimal: pct(s.tiers.minimal), light: pct(s.tiers.light), core: pct(s.tiers.core), power: pct(s.tiers.power) };
  return [
    {
      id: 'minimal',
      label: t('Minimal (under {minimal})', v),
      color: '#b9b6ab',
      description: t('Used less than {minimal} of their own included monthly credits.', v),
      action: t('Check that the person still needs the license. Show them agent mode and Auto. If they still do not use it, give the license to someone else.'),
    },
    {
      id: 'light',
      label: t('Light ({minimal} to {light})', v),
      color: '#8db8b2',
      description: t('Used {minimal} to {light} of their own included credits.', v),
      action: t('Offer short training on tasks that save the most time, such as agent mode, tools and instruction files.'),
    },
    {
      id: 'core',
      label: t('Core ({light} to {core})', v),
      color: '#2a8d93',
      description: t('Used {light} to {core} of their own included credits. This is the healthy range.', v),
      action: t('Healthy. Keep it as is. Their included credits are well used.'),
    },
    {
      id: 'power',
      label: t('Power ({core} to {power})', v),
      color: '#d19a2a',
      description: t('Used more than their own included credits ({core} to {power}). The shared pool pays for the extra.', v),
      action: t('Useful work, but watch the shared pool. Check which models they use and how long their chats get. Think about a budget for them.'),
    },
    {
      id: 'runaway',
      label: t('Runaway ({power} or more)', v),
      color: '#c4513f',
      description: t('Used {power} or more of their own included credits.', v),
      action: t('Look at their biggest days with them. Move everyday work to cheaper models or Auto, and set a budget for them.'),
    },
  ];
}

export const ENGAGEMENT_ORDER: EngagementId[] = ['daily', 'regular', 'occasional', 'rare'];

export function engagementItems(s: Settings): TaxonomyItem<EngagementId | LifecycleId>[] {
  const v = { daily: pct(s.engagement.daily), regular: pct(s.engagement.regular), occasional: pct(s.engagement.occasional), newDays: s.newUserDays, lapsedDays: s.lapsedDays };
  return [
    {
      id: 'daily',
      label: t('Daily'),
      color: '#2a8d93',
      description: t('Active on at least {daily} of workdays since they started.', v),
      action: t('They use it every day. Keep their setup working well and learn from how they work.'),
    },
    {
      id: 'regular',
      label: t('Regular'),
      color: '#5fa8ac',
      description: t('Active on {regular} to {daily} of workdays.', v),
      action: t('Good users. Share tips so they get more out of it.'),
    },
    {
      id: 'occasional',
      label: t('Occasional'),
      color: '#9cc7c6',
      description: t('Active on {occasional} to {regular} of workdays.', v),
      action: t('Ask what holds them back (trust, use cases or training) and run a short training session.'),
    },
    {
      id: 'new',
      label: t('New'),
      color: '#8e4f96',
      description: t('First seen in the last {newDays} days, and the report starts at least {newDays} days before that.', v),
      action: t('Help them start well: show how to pick a model and how to use Auto. Check in after two weeks.'),
    },
    {
      id: 'rare',
      label: t('Rare'),
      color: '#c9c4b6',
      description: t('Active on fewer than {occasional} of workdays.', v),
      action: t('Reach out to them again, or give the license to someone else.'),
    },
    {
      id: 'lapsed',
      label: t('Lapsed'),
      color: '#9a978c',
      description: t('No activity for {lapsedDays} days or more after earlier use.', v),
      action: t('Ask what changed. Bring them back, or take back the license.'),
    },
  ];
}

export function personaItems(s: Settings): TaxonomyItem<PersonaId>[] {
  const v = { regular: pct(s.engagement.regular), light: pct(s.tiers.light), power: pct(s.tiers.power), newDays: s.newUserDays, lapsedDays: s.lapsedDays };
  return [
    {
      id: 'champion',
      label: t('Champions'),
      color: '#5e9a3e',
      description: t('Active often (on at least {regular} of workdays) and use at least {light} of their own included credits.', v),
      action: t('Learn from them. Write down how they work, which models they pick and how they ask, and share it. Ask them to help others.'),
    },
    {
      id: 'steady',
      label: t('Steady light users'),
      color: '#2a8d93',
      description: t('Use GitHub Copilot often, but lightly (under {light} of their own included credits).', v),
      action: t('Low cost and a good habit. Offer training on agent mode, tools and instruction files so they get more from it.'),
    },
    {
      id: 'new',
      label: t('New users'),
      color: '#8e4f96',
      description: t('First seen in the last {newDays} days, and the report starts at least {newDays} days before that.', v),
      action: t('Help them start well: share model tips, Auto and tips on keeping chats short.'),
    },
    {
      id: 'burst',
      label: t('Burst users'),
      color: '#d19a2a',
      description: t('Heavy use packed into a few days.'),
      action: t('Check for very long agent sessions or too many files added to a chat. Suggest starting a new chat for each task, and using Auto. Think about a budget.'),
    },
    {
      id: 'runaway',
      label: t('Runaway users'),
      color: '#c4513f',
      description: t('Used {power} or more of their own included credits.', v),
      action: t('Look at their biggest sessions. Move everyday work to cheaper models or Auto, and set a budget for them.'),
    },
    {
      id: 'dormant',
      label: t('Dormant or low use'),
      color: '#7c8794',
      description: t('Light use, and not often.'),
      action: t('Send a friendly reminder and check that they need the license. Code completions are not in this report, so ask before you take a license back.'),
    },
    {
      id: 'lapsed',
      label: t('Lapsed users'),
      color: '#a3a096',
      description: t('Used it before, but nothing for {lapsedDays} days or more.', v),
      action: t('Bring them back, or take back the license if they no longer need it.'),
    },
  ];
}

export function profileItems(s: Settings): TaxonomyItem<ProfileId>[] {
  const v = { frontier: pct(s.frontierHeavy), efficient: pct(s.efficientShare) };
  return [
    {
      id: 'efficient',
      label: t('Efficient'),
      color: '#5e9a3e',
      description: t('At least {efficient} of their usage is on Versatile or Lightweight models.', v),
      action: t('Good model choices. Ask them to share how they pick models.'),
    },
    {
      id: 'balanced',
      label: t('Balanced'),
      color: '#2a8d93',
      description: t('A healthy mix of Powerful models and cheaper models.'),
      action: t('Keep using Powerful models only for hard problems.'),
    },
    {
      id: 'frontier',
      label: t('Frontier-heavy'),
      color: '#8e4f96',
      description: t('At least {frontier} of their usage is on Powerful models, the most expensive kind.', v),
      action: t('The biggest chance to save. Use cheaper models or Auto for everyday edits, explanations and tests.'),
    },
  ];
}

export function paretoItems(s: Settings): TaxonomyItem<ParetoId>[] {
  const v = { a: pct(s.pareto.a), b: pct(s.pareto.b - s.pareto.a), c: pct(1 - s.pareto.b) };
  return [
    {
      id: 'A',
      label: t('A: top users'),
      color: '#c8643f',
      description: t('The few users who together make up the first {a} of usage.', v),
      action: t('Start here with coaching and budgets. This is where most of the money goes.'),
    },
    {
      id: 'B',
      label: t('B: middle'),
      color: '#d9ae52',
      description: t('The users who make up the next {b} of usage.', v),
      action: t('Give light guidance and keep an eye on them.'),
    },
    {
      id: 'C',
      label: t('C: long tail'),
      color: '#c9c4b6',
      description: t('The users who make up the last {c} of usage. Usually the largest group of people.', v),
      action: t('Focus on helping them use it more and get value from it, not on cost.'),
    },
  ];
}

export function autoUseItems(s: Settings): TaxonomyItem<AutoUseId>[] {
  const v = { autoFirst: pct(s.autoFirst), lowAuto: pct(s.lowAuto) };
  return [
    {
      id: 'autoFirst',
      label: t('Auto-first'),
      color: '#5e9a3e',
      description: t("At least {autoFirst} of the user's usage goes through Auto model selection, so most of it gets the Auto discount where the plan has one.", v),
      action: t('Keep it. Ask how they work with Auto and share it with people who pick models by hand.'),
    },
    {
      id: 'mixed',
      label: t('Mixed'),
      color: '#4a6fc4',
      description: t("{lowAuto} to {autoFirst} of the user's usage goes through Auto. The rest uses a model picked by hand.", v),
      action: t('Suggest Auto for everyday work, and a named model only when a task needs it.'),
    },
    {
      id: 'direct',
      label: t('Direct models'),
      color: '#d19a2a',
      description: t("Less than {lowAuto} of the user's usage goes through Auto. They pick models by hand, so they miss the Auto discount where the plan has one.", v),
      action: t('Show them Auto. Where the plan has an Auto discount the same work costs less, and Auto picks a suitable model for each request.'),
    },
    {
      id: 'unknown',
      label: t('Not enough data'),
      color: '#8a929c',
      description: t('The report has no model names, or the user has no usage, so Auto use cannot be judged.'),
      action: t('Export the usage report with the model column to see Auto use.'),
    },
  ];
}

export function traitItems(s: Settings): TaxonomyItem<TraitId>[] {
  const v = { lowCache: pct(s.lowCacheHit), longContext: pct(s.longContextShare), spike: pct(s.spikeShare), lowAuto: pct(s.lowAuto) };
  return [
    {
      id: 'longContext',
      label: t('Long-context surcharges'),
      color: '#8e4f96',
      description: t('At least {longContext} of their usage looks like long-context pricing: very large requests that cost more per token.', v),
      action: t('Keep requests smaller: add fewer files to the chat, split big tasks, and start a new chat when the old one gets long.'),
    },
    {
      id: 'spiky',
      label: t('Spiky usage'),
      color: '#d19a2a',
      description: t("A single day makes up at least {spike} of the user's usage.", v),
      action: t('Look at the biggest day for an agent session that ran too long. Think about limits for long sessions.'),
    },
    {
      id: 'lowCache',
      label: t('Low cache reuse'),
      color: '#4a6fc4',
      description: t('Cache hit rate under {lowCache}. Text that was already sent is sent again at full price instead of being read back from the cheaper cache.', v),
      action: t('Stay in the same chat and with the same model while working on one task. Do not keep changing instructions or restarting chats.'),
    },
    {
      id: 'lowAuto',
      label: t('Rarely uses Auto'),
      color: '#2a8d93',
      description: t('Less than {lowAuto} of their usage goes through Auto model selection.', v),
      action: t('Try Auto. It picks a suitable model for each request, and on plans that have an Auto discount the same work costs less.'),
    },
    {
      id: 'multiModel',
      label: t('Many models'),
      color: '#5a5fa8',
      description: t('Uses four or more different models.'),
      action: t('Changing the model in the middle of a chat means the cache cannot be reused. Pick one model for each task.'),
    },
    {
      id: 'accelerating',
      label: t('Growing fast'),
      color: '#c4513f',
      description: t('Usage in the last 7 days is at least 1.5 times the 7 days before.'),
      action: t('Watch the trend. Check that the work is useful and not an agent stuck in a loop.'),
    },
    {
      id: 'noCostCenter',
      label: t('No cost center'),
      color: '#8c6a4f',
      description: t('Usage cannot be charged to a team because no cost center is set.'),
      action: t('Add the user to a cost center in the billing settings.'),
    },
    {
      id: 'fading',
      label: t('Fading'),
      color: '#7c8794',
      description: t('Usage in the last 7 days is half or less of the 7 days before.'),
      action: t('Check in. Did they hit a problem or move to another tool?'),
    },
  ];
}

export interface Taxonomy {
  tiers: TaxonomyItem<TierId>[];
  engagement: TaxonomyItem<EngagementId | LifecycleId>[];
  personas: TaxonomyItem<PersonaId>[];
  profiles: TaxonomyItem<ProfileId>[];
  pareto: TaxonomyItem<ParetoId>[];
  autoUse: TaxonomyItem<AutoUseId>[];
  traits: TaxonomyItem<TraitId>[];
}

export function buildTaxonomy(s: Settings): Taxonomy {
  return {
    tiers: tierItems(s),
    engagement: engagementItems(s),
    personas: personaItems(s),
    profiles: profileItems(s),
    pareto: paretoItems(s),
    autoUse: autoUseItems(s),
    traits: traitItems(s),
  };
}

export const CATEGORY_COLORS = {
  Powerful: '#c8643f',
  Versatile: '#2a8d93',
  Lightweight: '#7fae5a',
  Unknown: '#a3a096',
} as const;
