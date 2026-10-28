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
const pct = (fraction: number) => `${Number((fraction * 100).toFixed(2))}%`;

export const TIER_ORDER: TierId[] = ['minimal', 'light', 'core', 'power', 'runaway'];

export function tierItems(settings: Settings): TaxonomyItem<TierId>[] {
  const thresholds = { minimal: pct(settings.tiers.minimal), light: pct(settings.tiers.light), core: pct(settings.tiers.core), power: pct(settings.tiers.power) };
  return [
    {
      id: 'minimal',
      label: t('Minimal (under {minimal})', thresholds),
      color: '#afb8c1',
      description: t('Used less than {minimal} of their own included monthly credits.', thresholds),
      action: t('Check that the person still needs the license. Show them agent mode and Auto. If they still do not use it, give the license to someone else.'),
    },
    {
      id: 'light',
      label: t('Light ({minimal} to {light})', thresholds),
      color: '#80ccff',
      description: t('Used {minimal} to {light} of their own included credits.', thresholds),
      action: t('Offer short training on tasks that save the most time, such as agent mode, tools and instruction files.'),
    },
    {
      id: 'core',
      label: t('Core ({light} to {core})', thresholds),
      color: '#218bff',
      description: t('Used {light} to {core} of their own included credits. This is the healthy range.', thresholds),
      action: t('Healthy. Keep it as is. Their included credits are well used.'),
    },
    {
      id: 'power',
      label: t('Power ({core} to {power})', thresholds),
      color: '#d4a72c',
      description: t('Used more than their own included credits ({core} to {power}). The shared pool pays for the extra.', thresholds),
      action: t('Useful work, but watch the shared pool. Check which models they use and how long their chats get. Think about a budget for them.'),
    },
    {
      id: 'runaway',
      label: t('Runaway ({power} or more)', thresholds),
      color: '#e5534b',
      description: t('Used {power} or more of their own included credits.', thresholds),
      action: t('Look at their biggest days with them. Move everyday work to cheaper models or Auto, and set a budget for them.'),
    },
  ];
}

export const ENGAGEMENT_ORDER: EngagementId[] = ['daily', 'regular', 'occasional', 'rare'];

export function engagementItems(settings: Settings): TaxonomyItem<EngagementId | LifecycleId>[] {
  const thresholds = { daily: pct(settings.engagement.daily), regular: pct(settings.engagement.regular), occasional: pct(settings.engagement.occasional), newDays: settings.newUserDays, lapsedDays: settings.lapsedDays };
  return [
    {
      id: 'daily',
      label: t('Daily'),
      color: '#218bff',
      description: t('Active on at least {daily} of workdays since they started.', thresholds),
      action: t('They use it every day. Keep their setup working well and learn from how they work.'),
    },
    {
      id: 'regular',
      label: t('Regular'),
      color: '#54aeff',
      description: t('Active on {regular} to {daily} of workdays.', thresholds),
      action: t('Good users. Share tips so they get more out of it.'),
    },
    {
      id: 'occasional',
      label: t('Occasional'),
      color: '#80ccff',
      description: t('Active on {occasional} to {regular} of workdays.', thresholds),
      action: t('Ask what holds them back (trust, use cases or training) and run a short training session.'),
    },
    {
      id: 'new',
      label: t('New'),
      color: '#8250df',
      description: t('First seen in the last {newDays} days, and the report starts at least {newDays} days before that.', thresholds),
      action: t('Help them start well: show how to pick a model and how to use Auto. Check in after two weeks.'),
    },
    {
      id: 'rare',
      label: t('Rare'),
      color: '#d1d9e0',
      description: t('Active on fewer than {occasional} of workdays.', thresholds),
      action: t('Reach out to them again, or give the license to someone else.'),
    },
    {
      id: 'lapsed',
      label: t('Lapsed'),
      color: '#9198a1',
      description: t('No activity for {lapsedDays} days or more after earlier use.', thresholds),
      action: t('Ask what changed. Bring them back, or take back the license.'),
    },
  ];
}

export function personaItems(settings: Settings): TaxonomyItem<PersonaId>[] {
  const thresholds = { regular: pct(settings.engagement.regular), light: pct(settings.tiers.light), power: pct(settings.tiers.power), newDays: settings.newUserDays, lapsedDays: settings.lapsedDays };
  return [
    {
      id: 'champion',
      label: t('Champions'),
      color: '#2da44e',
      description: t('Active often (on at least {regular} of workdays) and use at least {light} of their own included credits.', thresholds),
      action: t('Learn from them. Write down how they work, which models they pick and how they ask, and share it. Ask them to help others.'),
    },
    {
      id: 'steady',
      label: t('Steady light users'),
      color: '#218bff',
      description: t('Use GitHub Copilot often, but lightly (under {light} of their own included credits).', thresholds),
      action: t('Low cost and a good habit. Offer training on agent mode, tools and instruction files so they get more from it.'),
    },
    {
      id: 'new',
      label: t('New users'),
      color: '#8250df',
      description: t('First seen in the last {newDays} days, and the report starts at least {newDays} days before that.', thresholds),
      action: t('Help them start well: share model tips, Auto and tips on keeping chats short.'),
    },
    {
      id: 'burst',
      label: t('Burst users'),
      color: '#d4a72c',
      description: t('Heavy use packed into a few days.'),
      action: t('Check for very long agent sessions or too many files added to a chat. Suggest starting a new chat for each task, and using Auto. Think about a budget.'),
    },
    {
      id: 'runaway',
      label: t('Runaway users'),
      color: '#e5534b',
      description: t('Used {power} or more of their own included credits.', thresholds),
      action: t('Look at their biggest sessions. Move everyday work to cheaper models or Auto, and set a budget for them.'),
    },
    {
      id: 'dormant',
      label: t('Dormant or low use'),
      color: '#6e7781',
      description: t('Light use, and not often.'),
      action: t('Send a friendly reminder and check that they need the license. Code completions are not in this report, so ask before you take a license back.'),
    },
    {
      id: 'lapsed',
      label: t('Lapsed users'),
      color: '#afb8c1',
      description: t('Used it before, but nothing for {lapsedDays} days or more.', thresholds),
      action: t('Bring them back, or take back the license if they no longer need it.'),
    },
  ];
}

export function profileItems(settings: Settings): TaxonomyItem<ProfileId>[] {
  const thresholds = { frontier: pct(settings.frontierHeavy), efficient: pct(settings.efficientShare) };
  return [
    {
      id: 'efficient',
      label: t('Efficient'),
      color: '#2da44e',
      description: t('At least {efficient} of their usage is on Versatile or Lightweight models.', thresholds),
      action: t('Good model choices. Ask them to share how they pick models.'),
    },
    {
      id: 'balanced',
      label: t('Balanced'),
      color: '#218bff',
      description: t('A healthy mix of Powerful models and cheaper models.'),
      action: t('Keep using Powerful models only for hard problems.'),
    },
    {
      id: 'frontier',
      label: t('Frontier-heavy'),
      color: '#8250df',
      description: t('At least {frontier} of their usage is on Powerful models, the most expensive kind.', thresholds),
      action: t('The biggest chance to save. Use cheaper models or Auto for everyday edits, explanations and tests.'),
    },
  ];
}

export function paretoItems(settings: Settings): TaxonomyItem<ParetoId>[] {
  const shares = { a: pct(settings.pareto.a), b: pct(settings.pareto.b - settings.pareto.a), c: pct(1 - settings.pareto.b) };
  return [
    {
      id: 'A',
      label: t('A: top users'),
      color: '#fb8f44',
      description: t('The few users who together make up the first {a} of usage.', shares),
      action: t('Start here with coaching and budgets. This is where most of the money goes.'),
    },
    {
      id: 'B',
      label: t('B: middle'),
      color: '#eac54f',
      description: t('The users who make up the next {b} of usage.', shares),
      action: t('Give light guidance and keep an eye on them.'),
    },
    {
      id: 'C',
      label: t('C: long tail'),
      color: '#d1d9e0',
      description: t('The users who make up the last {c} of usage. Usually the largest group of people.', shares),
      action: t('Focus on helping them use it more and get value from it, not on cost.'),
    },
  ];
}

export function autoUseItems(settings: Settings): TaxonomyItem<AutoUseId>[] {
  const thresholds = { autoFirst: pct(settings.autoFirst), lowAuto: pct(settings.lowAuto) };
  return [
    {
      id: 'autoFirst',
      label: t('Auto-first'),
      color: '#2da44e',
      description: t("At least {autoFirst} of the user's usage goes through Auto model selection, so most of it gets the Auto discount where the plan has one.", thresholds),
      action: t('Keep it. Ask how they work with Auto and share it with people who pick models by hand.'),
    },
    {
      id: 'mixed',
      label: t('Mixed'),
      color: '#0969da',
      description: t("{lowAuto} to {autoFirst} of the user's usage goes through Auto. The rest uses a model picked by hand.", thresholds),
      action: t('Suggest Auto for everyday work, and a named model only when a task needs it.'),
    },
    {
      id: 'direct',
      label: t('Direct models'),
      color: '#d4a72c',
      description: t("Less than {lowAuto} of the user's usage goes through Auto. They pick models by hand, so they miss the Auto discount where the plan has one.", thresholds),
      action: t('Show them Auto. Where the plan has an Auto discount the same work costs less, and Auto picks a suitable model for each request.'),
    },
    {
      id: 'unknown',
      label: t('Not enough data'),
      color: '#8c959f',
      description: t('The report has no model names, or the user has no usage, so Auto use cannot be judged.'),
      action: t('Export the usage report with the model column to see Auto use.'),
    },
  ];
}

export function traitItems(settings: Settings): TaxonomyItem<TraitId>[] {
  const thresholds = { lowCache: pct(settings.lowCacheHit), longContext: pct(settings.longContextShare), spike: pct(settings.spikeShare), lowAuto: pct(settings.lowAuto) };
  return [
    {
      id: 'longContext',
      label: t('Long-context surcharges'),
      color: '#8250df',
      description: t('At least {longContext} of their usage looks like long-context pricing: very large requests that cost more per token.', thresholds),
      action: t('Keep requests smaller: add fewer files to the chat, split big tasks, and start a new chat when the old one gets long.'),
    },
    {
      id: 'spiky',
      label: t('Spiky usage'),
      color: '#d4a72c',
      description: t("A single day makes up at least {spike} of the user's usage.", thresholds),
      action: t('Look at the biggest day for an agent session that ran too long. Think about limits for long sessions.'),
    },
    {
      id: 'lowCache',
      label: t('Low cache reuse'),
      color: '#0969da',
      description: t('Cache hit rate under {lowCache}. Text that was already sent is sent again at full price instead of being read back from the cheaper cache.', thresholds),
      action: t('Stay in the same chat and with the same model while working on one task. Do not keep changing instructions or restarting chats.'),
    },
    {
      id: 'lowAuto',
      label: t('Rarely uses Auto'),
      color: '#218bff',
      description: t('Less than {lowAuto} of their usage goes through Auto model selection.', thresholds),
      action: t('Try Auto. It picks a suitable model for each request, and on plans that have an Auto discount the same work costs less.'),
    },
    {
      id: 'multiModel',
      label: t('Many models'),
      color: '#a475f9',
      description: t('Uses four or more different models.'),
      action: t('Changing the model in the middle of a chat means the cache cannot be reused. Pick one model for each task.'),
    },
    {
      id: 'accelerating',
      label: t('Growing fast'),
      color: '#e5534b',
      description: t('Usage in the last 7 days is at least 1.5 times the 7 days before.'),
      action: t('Watch the trend. Check that the work is useful and not an agent stuck in a loop.'),
    },
    {
      id: 'noCostCenter',
      label: t('No cost center'),
      color: '#856d4c',
      description: t('Usage cannot be charged to a team because no cost center is set.'),
      action: t('Add the user to a cost center in the billing settings.'),
    },
    {
      id: 'fading',
      label: t('Fading'),
      color: '#6e7781',
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

export function buildTaxonomy(settings: Settings): Taxonomy {
  return {
    tiers: tierItems(settings),
    engagement: engagementItems(settings),
    personas: personaItems(settings),
    profiles: profileItems(settings),
    pareto: paretoItems(settings),
    autoUse: autoUseItems(settings),
    traits: traitItems(settings),
  };
}

export const CATEGORY_COLORS = {
  Powerful: '#fb8f44',
  Versatile: '#218bff',
  Lightweight: '#7fae5a',
  Unknown: '#afb8c1',
} as const;
