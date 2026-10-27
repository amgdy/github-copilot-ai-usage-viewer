import { PLAN_CREDITS, PLAN_PRICE, type Settings } from '../../lib/analytics/settings';
import { DOWNGRADE_HEADROOM } from '../../lib/analytics/seats';
import { CREDIT_USD } from '../../lib/types';
import { fmtInt, fmtUSD, pluralize } from '../../lib/utils/format';
import { msg, t } from '../../i18n';
import { numText, toPct } from './numbers';

export type GlossaryGroup =
  | 'Money'
  | 'Tokens'
  | 'Seats and the pool'
  | 'Activity'
  | 'Classification'
  | 'Auto model selection'
  | 'Traits'
  | 'Savings and efficiency'
  | 'Trends and projections';

/** English group names; render them with t(). */
export const GLOSSARY_GROUPS: GlossaryGroup[] = [
  msg('Money'),
  msg('Tokens'),
  msg('Seats and the pool'),
  msg('Activity'),
  msg('Classification'),
  msg('Auto model selection'),
  msg('Traits'),
  msg('Savings and efficiency'),
  msg('Trends and projections'),
];

export interface GlossaryEntry {
  id: string;
  /** English term; render it with t(). */
  term: string;
  group: GlossaryGroup;
  /** Other words a reader may search for. */
  aliases?: string[];
  /**
   * An English string to render with t(), or a function that returns translated text.
   * A function reads the live settings, so the numbers in the text always match the rules in use.
   */
  definition: string | ((settings: Settings) => string);
}

const pct = (fraction: number): string => `${numText(toPct(fraction), 2)}%`;
const usd = (value: number): string => `$${numText(value, 4)}`;

const planCredits = (plan: 'Business' | 'Enterprise'): string => t('{credits} credits ({usd})', { credits: fmtInt(PLAN_CREDITS[plan]), usd: `$${PLAN_PRICE[plan]}` });
const BUSINESS_ALLOTMENT = DOWNGRADE_HEADROOM * PLAN_CREDITS.Business * CREDIT_USD;

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'usage',
    term: msg('Usage (gross)'),
    group: 'Money',
    aliases: ['gross', 'gross amount', 'total usage'],
    definition: msg(
      'The value of the AI credits that were used, before any included credits are applied. It is the gross_amount column of the report, and it drives the tiers, the rankings and the savings estimates. Auto rows are already reduced by the Auto discount, so usage is the amount charged, not the original price.',
    ),
  },
  {
    id: 'billed',
    term: msg('Billed (net)'),
    group: 'Money',
    aliases: ['net', 'net amount', 'overage', 'charged'],
    definition: msg('The part of usage that the included credits did not cover. It is billed on top of the seat prices and is the net_amount column of the report.'),
  },
  {
    id: 'covered',
    term: msg('Covered by included credits (discount)'),
    group: 'Money',
    aliases: ['discount', 'discount amount', 'covered'],
    definition: msg('The part of usage paid for by the included credits of the seats. It is the discount_amount column, and usage equals covered plus billed. It is not a price reduction and it is not the Auto discount.'),
  },
  {
    id: 'credit',
    term: msg('AI credit'),
    group: 'Money',
    aliases: ['credit', 'credits', 'quantity', 'cent'],
    definition: msg('The unit that GitHub Copilot usage is counted in. One AI credit is worth $0.01, so 100 credits are $1, and the quantity column of the report counts credits.'),
  },
  {
    id: 'monthly-cost',
    term: msg('Estimated monthly cost'),
    group: 'Money',
    aliases: ['monthly cost', 'total cost', 'seat cost', 'cash savings', 'max of pool and usage'],
    definition: msg(
      'The larger of the pool size and the usage in a month. Seat prices equal the value of their included credits, so the pool size is the seat cost and only usage above the pool is billed on top. Cash savings are the difference in this cost before and after a change, so cutting usage saves money only above the pool, and removing seats shrinks the pool.',
    ),
  },

  {
    id: 'tokens-input',
    term: msg('Input tokens'),
    group: 'Tokens',
    aliases: ['input', 'fresh input', 'prompt tokens'],
    definition: msg('Text the model read that was not served from the cache: new prompts, files and conversation history. It is the input column of the report and is charged at the full input rate.'),
  },
  {
    id: 'tokens-cache-read',
    term: msg('Cache read tokens'),
    group: 'Tokens',
    aliases: ['cache read', 'cache_read', 'cached input'],
    definition: msg('Prompt text the model had already seen and could read from its cache. It is the cache_read column of the report and is charged at a much lower rate than fresh input. The cache hit rate is built from it.'),
  },
  {
    id: 'tokens-cache-write',
    term: msg('Cache write tokens'),
    group: 'Tokens',
    aliases: ['cache write', 'cache_write'],
    definition: msg('Prompt text that the model stored in its cache so that later requests can reuse it. It is the cache_write column of the report. Some models charge a separate rate for it and others charge nothing extra.'),
  },
  {
    id: 'tokens-output',
    term: msg('Output tokens'),
    group: 'Tokens',
    aliases: ['output', 'completion'],
    definition: msg('Text the model wrote back: answers, code and reasoning. It is the output column of the report. Each model has its own rate for it, separate from the rate for input tokens.'),
  },

  {
    id: 'pool',
    term: msg('Included credits and the pool'),
    group: 'Seats and the pool',
    aliases: ['pool', 'pool size', 'capacity', 'included credits', 'seat credits'],
    definition: () =>
      t(
        'Each seat includes credits every month: {business} for Business and {enterprise} for Enterprise. The credits of all seats are pooled, so a user can go past their own share at no charge, and billing starts only when the pool is used up. The pool also counts the seats in the license list and the extra seats from the License list section, when no filter is set.',
        { business: planCredits('Business'), enterprise: planCredits('Enterprise') },
      ),
  },
  {
    id: 'allotment',
    term: msg('Allotment'),
    group: 'Seats and the pool',
    aliases: ['allowance', 'own share'],
    definition: msg(
      "A user's own share of the pool: the included credits of their seat in each month they appear in the report, in dollars. When the report has no seat size for a user, the most common seat size in the report is used.",
    ),
  },
  {
    id: 'utilization',
    term: msg('Utilization'),
    group: 'Seats and the pool',
    aliases: ['used', 'consumption', 'pool utilization'],
    definition: msg(
      'For a user, usage divided by their allotment, so 100% means they used exactly their own share. For the pool, the covered credits divided by the pool size. The pool figure is not shown when the pool size cannot be worked out from the report.',
    ),
  },
  {
    id: 'balance',
    term: msg('Balance'),
    group: 'Seats and the pool',
    aliases: ['credits left', 'remaining', 'lend', 'borrow'],
    definition: msg("A user's allotment minus their usage. A positive balance means the user left credits in the pool for others, and a negative balance means the user drew on the pool."),
  },
  {
    id: 'seat-plan',
    term: msg('Seat plan'),
    group: 'Seats and the pool',
    aliases: ['plan', 'business', 'enterprise', 'custom', 'quota'],
    definition: () =>
      t(
        "The plan of a seat, read from the user's monthly quota in the report. Business is {business}, Enterprise is {enterprise}, and any other quota shows as Custom with its credits, valued at $0.01 each. A seat in the license list uses the plan from the list, or the most common plan in the report when none is given.",
        { business: planCredits('Business'), enterprise: planCredits('Enterprise') },
      ),
  },
  {
    id: 'idle-seat',
    term: msg('Idle seat'),
    group: 'Seats and the pool',
    aliases: ['reclaim', 'inactive', 'seat savings'],
    definition: msg('A seat whose user is in the Minimal tier and is Dormant or Lapsed. Reclaiming it saves the seat price of its plan.'),
  },
  {
    id: 'downgrade',
    term: msg('Downgrade candidate'),
    group: 'Seats and the pool',
    aliases: ['enterprise to business', 'seat savings'],
    definition: () =>
      t(
        'An Enterprise user who is not idle or new and whose highest month of usage stayed at or below {headroom} of a Business allotment ({allotment}). Moving them to Business saves {saving} a month per seat.',
        { headroom: pct(DOWNGRADE_HEADROOM), allotment: fmtUSD(BUSINESS_ALLOTMENT, 2), saving: fmtUSD(PLAN_PRICE.Enterprise - PLAN_PRICE.Business, 0) },
      ),
  },
  {
    id: 'unused-seat',
    term: msg('Unused seat'),
    group: 'Seats and the pool',
    aliases: ['roster', 'license list', 'no usage', 'not in the report', 'seat savings'],
    definition: msg('A seat in the license list whose user never appears in the report, so it is paid for with no AI-credit usage. Its value is the price of its plan.'),
  },

  {
    id: 'active-day',
    term: msg('Active day'),
    group: 'Activity',
    aliases: ['active days', 'threshold'],
    definition: (s) =>
      s.activeThreshold > 0
        ? t("A day on which a user's usage adds up to at least {amount}. The amount is set under Classification thresholds.", { amount: usd(s.activeThreshold) })
        : t('A day with any usage row for the user, because the active-day amount is set to $0.'),
  },
  {
    id: 'active-rate',
    term: msg('Active rate'),
    group: 'Activity',
    aliases: ['activity', 'workdays', 'frequency'],
    definition: msg(
      "The share of workdays on which a user was active. Workdays are Monday to Friday, counted from the user's first day in the report, or the start of the period in view if that is later, up to the end of the period. The count is at least 5 workdays, and the rate never goes above 100%.",
    ),
  },
  {
    id: 'engagement',
    term: msg('Engagement'),
    group: 'Activity',
    aliases: ['daily', 'regular', 'occasional', 'rare', 'frequency'],
    definition: (s) =>
      t('How often a user is active, from the active rate: Daily at {daily} of workdays or more, Regular from {regular}, Occasional from {occasional}, and Rare below that.', {
        daily: pct(s.engagement.daily),
        regular: pct(s.engagement.regular),
        occasional: pct(s.engagement.occasional),
      }),
  },
  {
    id: 'new-lapsed',
    term: msg('New and lapsed users'),
    group: 'Activity',
    aliases: ['new', 'lapsed', 'onboarding'],
    definition: (s) =>
      t(
        'A user is New when their first day in the report is within the last {newDays} of the period in view and at least {newDays} after the report starts, so people who were already active at the start are not new. A user is Lapsed when they are not new and have had no usage for the last {lapsedDays} or more.',
        { newDays: pluralize(s.newUserDays, 'day'), lapsedDays: pluralize(s.lapsedDays, 'day') },
      ),
  },
  {
    id: 'cost-per-active-day',
    term: msg('Cost per active day'),
    group: 'Activity',
    aliases: ['daily cost', 'per day'],
    definition: msg("A user's usage divided by their active days. It compares what a day of use costs across users, and it shows as a dash when the user has no active day."),
  },
  {
    id: 'unattributed',
    term: msg('Unattributed usage'),
    group: 'Activity',
    aliases: ['no user', 'repository-level', 'blank user'],
    definition: msg('Usage in the report with no username, such as repository-level usage. It is part of the totals, but it belongs to no user, so it has no tier, persona or seat.'),
  },

  {
    id: 'tier',
    term: msg('Spend tier'),
    group: 'Classification',
    aliases: ['tier', 'minimal', 'light', 'core', 'power', 'runaway'],
    definition: (s) => {
      const tiers = s.tiers;
      return t(
        "A band for a user's utilization: Minimal below {minimal}, Light from {minimal} to {light}, Core from {light} to {core}, Power from {core} to {power}, and Runaway at {power} or more. Core is the range in which the included credits of a seat are well used.",
        { minimal: pct(tiers.minimal), light: pct(tiers.light), core: pct(tiers.core), power: pct(tiers.power) },
      );
    },
  },
  {
    id: 'persona',
    term: msg('Persona'),
    group: 'Classification',
    aliases: ['champions', 'steady light users', 'burst users', 'dormant', 'runaway users', 'runaway spenders', 'precedence'],
    definition: (s) =>
      t(
        'Each user gets one label, checked in this order: Runaway users (the Runaway tier), New users, then Lapsed users. Everyone else is split by two tests: active on at least {regular} of workdays, and utilization of at least {light}. Passing both makes a Champion, utilization only makes a Burst user, activity only makes a Steady light user, and neither makes a Dormant user.',
        { regular: pct(s.engagement.regular), light: pct(s.tiers.light) },
      ),
  },
  {
    id: 'profile',
    term: msg('Usage profile'),
    group: 'Classification',
    aliases: ['profile', 'behavior profile', 'frontier-heavy', 'balanced', 'efficient', 'model mix'],
    definition: (s) =>
      t(
        'How a user splits usage across model tiers. A user is Frontier-heavy when at least {frontier} of their usage is on Powerful models, otherwise Efficient when at least {efficient} is on Versatile and Lightweight models, and Balanced when neither holds.',
        { frontier: pct(s.frontierHeavy), efficient: pct(s.efficientShare) },
      ),
  },
  {
    id: 'pareto',
    term: msg('Pareto class'),
    group: 'Classification',
    aliases: ['pareto', 'top spenders', 'long tail', 'cumulative share'],
    definition: (s) =>
      t(
        'Users sorted by usage, highest first, and grouped by the running share of total usage. Class A is the users who together make up the first {a}, class B the next {b} and class C the last {c}. A user whose usage carries the running share over a cutoff stays in the earlier class.',
        { a: pct(s.pareto.a), b: pct(s.pareto.b - s.pareto.a), c: pct(1 - s.pareto.b) },
      ),
  },
  {
    id: 'model-tier',
    term: msg('Model tier'),
    group: 'Classification',
    aliases: ['powerful', 'versatile', 'lightweight', 'unknown', 'category', 'right-sizing'],
    definition: msg(
      'A label for what kind of work a model suits: Powerful for hard reasoning, Versatile for everyday work and Lightweight for small, fast and low-cost tasks. Right-sizing moves usage only away from Powerful models that have a price, and the usage profile counts usage by tier. A model with no tier is Unknown, and its usage counts toward neither side of the profile.',
    ),
  },

  {
    id: 'auto-share',
    term: msg('Auto share of usage'),
    group: 'Auto model selection',
    aliases: ['auto share', 'auto', 'auto model selection'],
    definition: msg(
      "The share of a user's usage that went through Auto model selection, where GitHub Copilot picks the model for each request. It is usage on Auto rows divided by total usage. Without a model column Auto cannot be told apart, and the share is shown as unknown.",
    ),
  },
  {
    id: 'auto-discount',
    term: msg('Auto discount received'),
    group: 'Auto model selection',
    aliases: ['auto discount', 'discount received', 'measured', 'assumed'],
    definition: (s) =>
      t(
        'How much cheaper the Auto usage was than the same tokens at the original price of the models. The report has no column for it, so the app measures it by comparing the amount charged with the price card. A plan with no Auto usage to measure from uses the Auto model discount setting ({rate} now), and that rate is called assumed. It is not the discount_amount column, which holds the included credits.',
        { rate: pct(s.autoDiscount) },
      ),
  },
  {
    id: 'auto-original-price',
    term: msg('Original price of Auto usage'),
    group: 'Auto model selection',
    aliases: ['original price', 'price card', 'without the auto discount'],
    definition: msg(
      'What the same Auto usage would have cost at the original price of the models on the price card, without the Auto discount. It is the Auto usage in the report plus the Auto discount received, and it is not an amount on an invoice.',
    ),
  },
  {
    id: 'auto-missed',
    term: msg('Discount missed on hand-picked usage'),
    group: 'Auto model selection',
    aliases: ['missed discount', 'hand-picked', 'direct usage'],
    definition: msg(
      "What the Auto discount would have been on the usage that a user sent to models they picked by hand, had it gone through Auto. It is that usage times the Auto discount rate of the user's plan. It is a potential saving, not money that was lost.",
    ),
  },
  {
    id: 'auto-use-class',
    term: msg('Auto use class'),
    group: 'Auto model selection',
    aliases: ['auto-first', 'mixed', 'direct models', 'not enough data', 'rarely uses auto'],
    definition: (s) =>
      t(
        'Where a user sits between Auto and models picked by hand. Auto-first: {autoFirst} or more of their usage goes through Auto. Direct models: less than {lowAuto}. Mixed: in between. Not enough data: the report has no model column, or the user has no usage. Both limits are set under Classification thresholds, and the lower one must stay below the upper one.',
        { autoFirst: pct(s.autoFirst), lowAuto: pct(s.lowAuto) },
      ),
  },

  {
    id: 'traits',
    term: msg('Traits'),
    group: 'Traits',
    aliases: ['habits', 'flags', 'minimum usage'],
    definition: (s) =>
      t('Labels for habits that a user can have in any combination. Most need at least {min} of usage, so that small accounts are not flagged. Each trait is listed below.', { min: usd(s.minSpendForTraits) }),
  },
  {
    id: 'trait-low-cache',
    term: msg('Low cache reuse'),
    group: 'Traits',
    aliases: ['trait', 'cache'],
    definition: (s) =>
      t('Cache hit rate below {rate}, so context is paid for again instead of being read from the cache. It needs at least {min} of usage, with at least half of it on models that have a price.', {
        rate: pct(s.lowCacheHit),
        min: usd(s.minSpendForTraits),
      }),
  },
  {
    id: 'trait-long-context',
    term: msg('Long-context surcharges'),
    group: 'Traits',
    aliases: ['trait', 'long context'],
    definition: (s) =>
      t("At least {share} of the user's usage is long-context premium. It needs at least {min} of usage.", { share: pct(s.longContextShare), min: usd(s.minSpendForTraits) }),
  },
  {
    id: 'trait-spiky',
    term: msg('Spiky usage'),
    group: 'Traits',
    aliases: ['trait', 'spike', 'peak day', 'spiky spend'],
    definition: (s) =>
      t("One day makes up at least {share} of the user's usage. It needs at least {min} of usage and at least 3 active days.", { share: pct(s.spikeShare), min: usd(s.minSpendForTraits) }),
  },
  {
    id: 'trait-low-auto',
    term: msg('Rarely uses Auto'),
    group: 'Traits',
    aliases: ['trait', 'auto'],
    definition: (s) =>
      t(
        "Less than {lowAuto} of the user's usage goes through Auto model selection, the same limit that puts a user in the Direct models class. The trait needs at least {min} of usage and a model column in the report.",
        { lowAuto: pct(s.lowAuto), min: usd(s.minSpendForTraits) },
      ),
  },
  {
    id: 'trait-many-models',
    term: msg('Many models'),
    group: 'Traits',
    aliases: ['trait', 'multiple models'],
    definition: msg('The user used four or more different models in the period.'),
  },
  {
    id: 'trait-accelerating',
    term: msg('Growing fast'),
    group: 'Traits',
    aliases: ['trait', 'growing', 'trend', 'accelerating'],
    definition: (s) =>
      t(
        'Usage in the last 7 days is at least 1.5 times the 7 days before. It needs a period of 14 days or more and at least {min} in the last 7 days, and a user with nothing in the 7 days before counts unless they are new.',
        { min: usd(s.minSpendForTraits) },
      ),
  },
  {
    id: 'trait-fading',
    term: msg('Fading'),
    group: 'Traits',
    aliases: ['trait', 'declining', 'trend'],
    definition: (s) => t('Usage in the last 7 days is half or less of the 7 days before. It needs a period of 14 days or more and at least {min} in the 7 days before.', { min: usd(s.minSpendForTraits) }),
  },
  {
    id: 'trait-no-cost-center',
    term: msg('No cost center'),
    group: 'Traits',
    aliases: ['trait', 'chargeback'],
    definition: msg('The user has no cost center, in a report where other users do. It is not used when the report has no cost centers at all.'),
  },

  {
    id: 'cache-hit',
    term: msg('Cache hit rate'),
    group: 'Savings and efficiency',
    aliases: ['cache', 'cache read', 'cached input'],
    definition: msg(
      "The share of a user's prompt tokens that were read from the cache: cache read tokens divided by input, cache read and cache write tokens. It shows as a dash when the report has no token columns.",
    ),
  },
  {
    id: 'long-context',
    term: msg('Long-context premium'),
    group: 'Savings and efficiency',
    aliases: ['long context', 'surcharge', 'premium'],
    definition: msg(
      'The extra cost billed when a prompt is longer than the long-context threshold of a model. The app estimates it from token counts, and only for models that have a price and a long-context rate, so it is a lower bound.',
    ),
  },
  {
    id: 'potential',
    term: msg('Potential savings and levers'),
    group: 'Savings and efficiency',
    aliases: ['savings', 'potential', 'levers', 'right-size models', 'use auto model selection', 'cache discipline', 'leaner context', 'cap runaway users', 'optimization'],
    definition: (s) =>
      t(
        'Usage that habit changes could avoid, from six levers: right-size models, use Auto model selection, cache discipline, leaner context, avoid long-context surcharges and cap runaway users. The levers are applied one after the other, each on what is left, so the same usage is never counted twice, and the shares can be changed in the simulator on the Recommendations page. The Auto lever applies the Auto discount rate of each plan: the rate measured in the report or, for a plan with no Auto usage to measure from, {rate} from the Auto model discount setting. All of it is an estimate of usage, not of cash.',
        { rate: pct(s.autoDiscount) },
      ),
  },
  {
    id: 'efficiency',
    term: msg('Efficiency score'),
    group: 'Savings and efficiency',
    aliases: ['efficiency', 'score'],
    definition: msg(
      'A score from 0 to 100 for one user: 100 minus the share of their usage that the savings levers could remove. A score of 100 means no savings were found, and a user with no usage scores 100.',
    ),
  },

  {
    id: 'anomaly',
    term: msg('Anomaly day'),
    group: 'Trends and projections',
    aliases: ['spike', 'unusual day', 'outlier'],
    definition: msg(
      'A day with usage far above the typical day. It is flagged when it is at least 1.5 times the median day and has a modified z-score of 3.5 or more, which compares it with the usual spread of days using the median absolute deviation. The check needs at least 10 days with usage and lists at most 6 days.',
    ),
  },
  {
    id: 'projection',
    term: msg('Projection (low, mid, high)'),
    group: 'Trends and projections',
    aliases: ['forecast', 'projected', 'month end', 'exhaustion'],
    definition: msg(
      'An estimate for the rest of the latest month, made only when that month is not finished: usage so far plus the days left times a daily rate. Low uses the lower of two daily rates (the month-to-date average and the average of the last 7 days), High uses the higher one, and Mid uses their average. Projected billed usage is whatever goes above the pool, and once the pool is used up all further usage is billed.',
    ),
  },
];
