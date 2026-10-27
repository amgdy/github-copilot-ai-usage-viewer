import { msg, t, tp } from '../../i18n/core.ts';
import type { DataStore } from '../types';
import { CATEGORIES, labelOf } from '../types';
import type { ModelTable } from '../pricing/models';
import { fmtDay } from '../utils/date';
import { fmtInt, fmtMultiple, fmtPct, fmtPctAuto, fmtUSD, pluralize } from '../utils/format';
import type { Aggregates } from './aggregate';
import type { AnomalyDay, Trend } from './anomalies';
import { quantile } from './anomalies';
import type { AutoSummary } from './autoDiscount';
import { coverageIssues, type DataCoverage } from './coverage';
import type { Filters } from './filters';
import { DEFAULT_LEVERS, type LeverResult, type LeverStep } from './levers';
import type { PoolSummary } from './pool';
import { BLANK_ID } from './prepare';
import type { SeatPlan } from './seats';
import { budgetOf, type Settings } from './settings';
import { cashSaving, monthInputs } from './simulator';
import type { UserProfile, UserSet } from './users';

export type PageId =
  | 'overview'
  | 'spend'
  | 'users'
  | 'segments'
  | 'models'
  | 'efficiency'
  | 'organization'
  | 'patterns'
  | 'recommendations'
  | 'data'
  | 'settings'
  | 'methodology';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'positive';
export type RecTheme = 'cost' | 'pool' | 'efficiency' | 'adoption' | 'governance' | 'data';
export type Audience = 'management' | 'admin' | 'user';
export type Confidence = 'high' | 'medium' | 'low';

export const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4, positive: 5 };

/** The monthly figure shown on a card: cash when there is some, otherwise the usage avoided. Never NaN. */
export function recValue(r: Pick<Recommendation, 'cashUsd' | 'impactUsd'>): number {
  const v = r.cashUsd > 0.5 ? r.cashUsd : r.impactUsd > 0.5 ? r.impactUsd : 0;
  return Number.isFinite(v) ? v : 0;
}

export interface DocLink {
  label: string;
  url: string;
}

const D = 'https://docs.github.com/en/copilot';
export const DOCS = {
  pricing: { label: msg('Models and pricing'), url: `${D}/reference/copilot-billing/models-and-pricing` },
  optimize: { label: msg('Optimizing your AI usage'), url: `${D}/tutorials/optimize-ai-usage` },
  optimizeChat: { label: msg('Optimizing chat usage'), url: `${D}/tutorials/optimize-chat-usage` },
  budgets: { label: msg('Budgets for usage-based billing'), url: `${D}/concepts/billing-and-usage/organizations-and-enterprises/budgets` },
  budgetTuning: { label: msg('Optimizing your budget configuration'), url: `${D}/tutorials/budgets/optimizing-your-budget-configuration` },
  budgetStart: { label: msg('Getting started with budget controls'), url: `${D}/tutorials/budgets/getting-started-with-budget-controls` },
  auto: { label: msg('About GitHub Copilot auto model selection'), url: `${D}/concepts/models/auto-model-selection` },
  sessionLimit: { label: msg('Setting an AI credit session limit in GitHub Copilot CLI'), url: `${D}/how-tos/copilot-cli/use-copilot-cli/set-session-limit` },
  context: { label: msg('Managing context for GitHub Copilot'), url: `${D}/concepts/prompting-and-context/context-management` },
  prompting: { label: msg('Prompt engineering for GitHub Copilot'), url: `${D}/concepts/prompting-and-context/prompt-engineering` },
  comparison: { label: msg('AI model comparison'), url: `${D}/reference/ai-models/model-comparison` },
  licenseUsage: { label: msg('Viewing license usage'), url: `${D}/how-tos/administer-copilot/manage-for-enterprise/manage-access/view-license-usage` },
  seats: { label: msg('Seats and billing cycles'), url: `${D}/concepts/billing-and-usage/organizations-and-enterprises/seats-and-billing-cycles` },
  monitor: { label: msg('Monitoring AI usage'), url: `${D}/how-tos/manage-and-track-spending/monitor-ai-usage` },
  usageMetrics: { label: msg('GitHub Copilot usage metrics'), url: `${D}/concepts/billing-and-usage/copilot-usage-metrics` },
} satisfies Record<string, DocLink>;

export interface RecJump {
  page: PageId;
  label: string;
  filters?: Partial<Filters>;
}

export interface Recommendation {
  id: string;
  theme: RecTheme;
  audience: Audience[];
  severity: Severity;
  title: string;
  summary: string;
  evidence: string[];
  actions: string[];
  /** Usage avoided per month (USD, 1 credit = $0.01). For `impactKind: 'seats'` it is the monthly value of the seats instead. */
  impactUsd: number;
  /** What `impactUsd` measures: usage that would not be consumed, or the monthly value of seats. */
  impactKind: 'usage' | 'seats';
  /** Cash saved per month once the pool-covers-first rule is applied (USD). */
  cashUsd: number;
  /** True when the scope is narrowed by filters: the pool cannot be split, so `cashUsd` is only the part already billed in this scope. */
  cashLowerBound: boolean;
  confidence: Confidence;
  caveat?: string;
  affected: { id: number; name: string }[];
  affectedCount: number;
  docs?: DocLink[];
  jump?: RecJump;
  /** Id of the metric doc that explains how this recommendation is worked out. `add` sets it for every rule. */
  calc?: string;
}

/** The metric doc of a recommendation rule: "rec-" plus the rule id. */
export const recDocId = (ruleId: string): string => `rec-${ruleId}`;

export interface RecContext {
  store: DataStore;
  models: ModelTable;
  agg: Aggregates;
  mask: Uint8Array | null;
  users: UserSet;
  pool: PoolSummary;
  seats: SeatPlan;
  levers: LeverResult;
  anomalies: AnomalyDay[];
  trend: Trend;
  settings: Settings;
  /** A row or segment filter narrows the scope, so organization-wide pool and seat statements do not apply. */
  narrowed: boolean;
  /** Which optional columns the loaded files carry. */
  coverage: DataCoverage;
  /** Auto model selection in this scope: the discount received and the discount hand-picked usage misses. */
  auto: AutoSummary;
}

export interface Headline {
  status: 'action' | 'watch' | 'healthy';
  title: string;
  detail: string;
}

type RecInput = Pick<Recommendation, 'id' | 'theme' | 'audience' | 'severity' | 'title' | 'summary' | 'actions'> &
  Partial<Omit<Recommendation, 'id' | 'theme' | 'audience' | 'severity' | 'title' | 'summary' | 'actions'>>;

const MONTH_DAYS = 30.4375;
const ceil5 = (x: number): number => Math.max(5, Math.ceil(x / 5) * 5);
const brief = (ps: { name: string }[], n = 5): string => {
  const names = ps.slice(0, n).map((p) => p.name).join(t(', '));
  return ps.length > n ? t('{names} and {n} more', { names, n: fmtInt(ps.length - n) }) : names;
};
const who = (ps: UserProfile[], n = 12): { id: number; name: string }[] => ps.slice(0, n).map((p) => ({ id: p.id, name: p.name }));

export function buildRecommendations(c: RecContext): Recommendation[] {
  const { store, agg, users, pool, seats, levers, settings, narrowed } = c;
  const tot = agg.totals;
  const out: Recommendation[] = [];
  if (tot.rows === 0 || tot.gross <= 0) return out;

  const ps = users.profiles;
  const scopeDays = Math.max(1, agg.range.length);
  const baseConf: Confidence = scopeDays >= 21 ? 'high' : scopeDays >= 10 ? 'medium' : 'low';
  const perMonth = MONTH_DAYS / scopeDays;
  const months = narrowed ? [] : monthInputs(pool);
  const nMonths = months.length;
  const avgGross = nMonths ? months.reduce((a, m) => a + m.gross, 0) / nMonths : 0;
  const poolWhole = !narrowed && nMonths > 0;

  const add = (r: RecInput): void => {
    const rec: Recommendation = {
      evidence: [],
      impactUsd: 0,
      impactKind: 'usage',
      cashUsd: 0,
      cashLowerBound: !poolWhole,
      confidence: baseConf,
      affected: [],
      affectedCount: r.affected?.length ?? 0,
      calc: recDocId(r.id),
      ...r,
    };
    // An efficiency gain that frees no cash today (the pool already covers the usage) is worth doing but is not urgent.
    if (rec.theme === 'efficiency' && poolWhole && rec.cashUsd <= 0.005 && SEVERITY_ORDER[rec.severity] < SEVERITY_ORDER.medium) rec.severity = 'medium';
    out.push(rec);
  };
  const step = (id: LeverStep['id']): number => levers.steps.find((s) => s.id === id)?.savings ?? 0;
  const fractionOf = (usd: number): number => Math.min(1, usd / tot.gross);

  /** Monthly usage avoided and monthly cash saved when usage drops by `fraction`. */
  const reduce = (fraction: number): { impact: number; cash: number } => {
    if (!(fraction > 0)) return { impact: 0, cash: 0 };
    if (!poolWhole) {
      const impact = tot.gross * fraction * perMonth;
      return { impact, cash: Math.min(impact, tot.net * perMonth) };
    }
    return { impact: avgGross * fraction, cash: cashSaving(months, fraction, 0) / nMonths };
  };

  // Projected pool use over the months in scope (current month extrapolated).
  const capacityTotal = months.reduce((a, m) => a + m.capacity, 0);
  const usedTotal = months.reduce((a, m) => a + Math.min(m.capacity, m.gross), 0);
  const poolUse = capacityTotal > 0 ? usedTotal / capacityTotal : 0;

  // 1. Billed overage ------------------------------------------------------
  if (tot.net > 0.005) {
    const top = ps.filter((p) => p.net > 0).sort((a, b) => b.net - a.net).slice(0, 3);
    const share = tot.net / tot.gross;
    const overBudget = pool.budget?.projectedBilled != null && pool.budget.projectedBilled > pool.budget.monthlyBudget;
    add({
      id: 'overage',
      theme: 'cost',
      audience: ['management', 'admin'],
      severity: overBudget ? 'critical' : share >= 0.25 || tot.net >= 100 ? 'high' : 'medium',
      title: t('{amount} was billed beyond included credits', { amount: fmtUSD(tot.net, 0) }),
      summary: t('{share} of usage was billed as overage because the pooled credits ran out.', { share: fmtPct(share, 0) }),
      evidence: [
        t('Usage {usage}: {covered} covered by the pool, {billed} billed.', { usage: fmtUSD(tot.gross, 0), covered: fmtUSD(tot.discount, 0), billed: fmtUSD(tot.net, 0) }),
        ...top.map((p) =>
          t('{name}: {billed} billed ({share} of all overage), {own} of their own allotment.', {
            name: p.name,
            billed: fmtUSD(p.net, 0),
            share: fmtPct(p.net / tot.net, 0),
            own: fmtPctAuto(p.utilization),
          }),
        ),
      ],
      actions: [
        t('Start with the usage levers below: they reduce usage without removing tools from anyone.'),
        t('Add a user-level budget so no single user can drain the pool or run up overage (hard stop at the limit).'),
        t('Overage costs the same $0.01 per credit as included credits, so adding seats does not make credits cheaper. It only pays off when the new seats get used.'),
      ],
      affected: who(top),
      affectedCount: ps.filter((p) => p.net > 0).length,
      docs: [DOCS.budgets, DOCS.optimize],
      jump: { page: 'spend', label: t('Open Usage and pool') },
    });
  }

  // 2. Pool exhaustion and projected overage ------------------------------
  if (poolWhole) {
    const lines: string[] = [];
    let projNet = 0;
    for (const m of pool.months) {
      if (m.exhaustedOn !== null) {
        lines.push(t('{month}: pool used up on {day} (day {n} of {total}).', { month: m.label, day: fmtDay(m.exhaustedOn), n: m.exhaustedOn - m.monthStart + 1, total: m.daysInMonth }));
      }
      const p = m.projection;
      if (p) {
        if (m.exhaustedOn === null && p.exhaustionDate !== null) lines.push(t('{month}: on the current pace the pool runs out around {day}.', { month: m.label, day: fmtDay(p.exhaustionDate) }));
        if (p.projNet > 0.005) {
          projNet += p.projNet;
          lines.push(t('{month}: projected billed overage {amount} (range {low} to {high}).', { month: m.label, amount: fmtUSD(p.projNet, 0), low: fmtUSD(p.projNetLow, 0), high: fmtUSD(p.projNetHigh, 0) }));
        }
      }
    }
    const b = pool.budget;
    if (b) {
      const v = {
        budget: fmtUSD(b.monthlyBudget, 0),
        month: b.month,
        burn: fmtPct(b.burn, 0),
        projected: b.projectedBurn !== null ? fmtPct(b.projectedBurn, 0) : '',
        day: b.hitDate !== null ? fmtDay(b.hitDate) : '',
      };
      lines.push(
        b.projectedBurn !== null
          ? b.hitDate !== null
            ? t('Budget {budget} for {month}: {burn} used so far, {projected} projected, limit reached around {day}.', v)
            : t('Budget {budget} for {month}: {burn} used so far, {projected} projected.', v)
          : b.hitDate !== null
            ? t('Budget {budget} for {month}: {burn} used so far, limit reached around {day}.', v)
            : t('Budget {budget} for {month}: {burn} used so far.', v),
      );
    }
    if (lines.length) {
      const budgetHit = b?.projectedBurn != null && b.projectedBurn >= 1;
      add({
        id: 'pool-exhaustion',
        theme: 'pool',
        audience: ['management', 'admin'],
        severity: budgetHit ? 'critical' : tot.net > 0.005 || projNet > 0 ? 'high' : 'medium',
        title: pool.monthsExhausted > 0 ? t('The shared pool runs out before month end') : t('The shared pool is on track to run out'),
        summary: t('Included credits are pooled across all seats and reset on the 1st (UTC); unused credits do not carry over.'),
        evidence: lines,
        actions: [
          t('Configure an enterprise or organization budget with alerts (for example at 75% and 90%) so exhaustion is visible early.'),
          t('Decide deliberately: allow metered overage with a cap, or block at the limit. Maximum bill = seat fees + the budget.'),
          t('Apply the usage levers below to push the exhaustion date later.'),
        ],
        impactUsd: 0,
        docs: [DOCS.budgets, DOCS.budgetStart],
        jump: { page: 'spend', label: t('Open pool timeline') },
      });
    }
  }

  // 3. Pool under-use --------------------------------------------------------
  if (poolWhole && !pool.capacityExceeded && capacityTotal > 0 && poolUse < 0.6) {
    const waste = (capacityTotal - usedTotal) / nMonths;
    const lower = pool.capacityIsLowerBound;
    add({
      id: 'pool-underuse',
      theme: 'pool',
      audience: ['management', 'admin'],
      severity: poolUse < 0.3 ? 'medium' : 'low',
      title: lower ? t('Included credits are at most {share} used', { share: fmtPct(poolUse, 0) }) : t('Only {share} of the included credits are used', { share: fmtPct(poolUse, 0) }),
      summary: t('About {amount} of seat value per month goes unused.', { amount: fmtUSD(waste, 0) }),
      evidence: [
        t('Included credits {credits}/month, projected usage {usage}/month.', { credits: fmtUSD(capacityTotal / nMonths, 0), usage: fmtUSD(usedTotal / nMonths, 0) }),
        lower
          ? t('Only users in this report fund the current estimate. Add a complete license list in Settings for a better estimate; past months may still differ.')
          : t('The estimate includes your license list and extra seats. It may not match the seats assigned in past months.'),
      ],
      actions: [t('Reclaim or reassign idle seats (see the seat recommendations).'), t('Roll out to the teams that have licenses but little usage, for example with short training sessions.')],
      confidence: lower ? 'low' : baseConf,
      docs: [DOCS.seats, DOCS.licenseUsage],
      jump: { page: 'spend', label: t('Open Usage and pool') },
    });
  }

  // 4. Idle seats ------------------------------------------------------------
  const idleCount = seats.idle.length + seats.unused.length;
  const idleValue = seats.idleValue + seats.unusedValue;
  if (poolWhole && !pool.capacityExceeded && idleCount > 0 && idleValue > 0) {
    const cash = cashSaving(months, 0, idleValue) / nMonths;
    const ratio = cash / idleValue;
    const title =
      ratio >= 0.5
        ? t('Reclaim {seats} to save about {amount}/month', { seats: pluralize(idleCount, 'idle seat'), amount: fmtUSD(cash, 0) })
        : cash > 0.5
          ? t('{seats}, but only {amount}/month is recoverable', { seats: pluralize(idleCount, 'idle seat'), amount: fmtUSD(cash, 0) })
          : tp(idleCount, '{n} idle seat currently funds the pool for heavier users', '{n} idle seats currently fund the pool for heavier users', { n: fmtInt(idleCount) });
    add({
      id: 'idle-seats',
      theme: 'pool',
      audience: ['management', 'admin'],
      severity: ratio >= 0.5 && cash >= 50 ? 'medium' : 'low',
      title,
      summary:
        cash > 0.5
          ? t('Seats are worth {value}/month. Removing them shrinks the pool, so only the unused part of the pool ({cash}) turns into cash.', { value: fmtUSD(idleValue, 0), cash: fmtUSD(cash, 0) })
          : t('Removing these seats would not lower the bill while the pool is fully used: heavy users would simply pay for those credits as overage. Reassign the seats to people who will use them.'),
      evidence: [
        ...(seats.idle.length
          ? [
              t('{users} in the report with minimal use and little activity (seat value {value}/month): {names}.', {
                users: pluralize(seats.idle.length, 'user'),
                value: fmtUSD(seats.idleValue, 0),
                names: brief(seats.idle.map((s) => ({ name: s.name }))),
              }),
            ]
          : []),
        ...(seats.unused.length
          ? [
              tp(seats.unused.length, '{n} roster seat never appears in the report ({value}/month): {names}.', '{n} roster seats never appear in the report ({value}/month): {names}.', {
                n: fmtInt(seats.unused.length),
                value: fmtUSD(seats.unusedValue, 0),
                names: brief(seats.unused.map((s) => ({ name: s.name }))),
              }),
            ]
          : []),
        ...(c.settings.roster.some((seat) => seat.source === 'api' || seat.source === 'activity' || seat.lastActivityAt !== undefined || seat.pendingCancellation)
          ? [t('Only dated activity from the license list is used here. Recently active seats and seats pending cancellation are excluded. Seats without a recent activity date are not counted as idle. Check the Licenses page for the recorded activity dates.')]
          : []),
      ],
      actions: [
        t('Check the license usage view or usage metrics for completions and chat activity before removing a seat.'),
        t('Ask the owners whether they still need access; reassign or reclaim the seats.'),
        t('Revisit at the next billing cycle: seat removals apply from the start of the next cycle.'),
      ],
      impactUsd: idleValue,
      impactKind: 'seats',
      cashUsd: cash,
      confidence: scopeDays >= 21 ? 'medium' : 'low',
      caveat: t('This report covers AI-credit usage only. Code completions and next edit suggestions are not billed in credits and do not appear, so "idle in this report" is not the same as "idle seat".'),
      affected: who(ps.filter((p) => seats.idle.some((s) => s.id === p.id))),
      affectedCount: idleCount,
      docs: [DOCS.licenseUsage, DOCS.seats],
      jump: { page: 'users', label: t('Show low-activity users'), filters: { tiers: ['minimal'], segments: ['dormant', 'lapsed'] } },
    });
  }

  // 5. Enterprise to Business downgrade ----------------------------------------
  if (poolWhole && !pool.capacityExceeded && seats.downgrade.length > 0) {
    const cash = cashSaving(months, 0, seats.downgradeValue) / nMonths;
    add({
      id: 'downgrade',
      theme: 'pool',
      audience: ['management', 'admin'],
      severity: cash >= 40 ? 'medium' : 'low',
      title: tp(seats.downgrade.length, '{n} Enterprise user never needed more than the Business allotment', '{n} Enterprise users never needed more than the Business allotment', {
        n: fmtInt(seats.downgrade.length),
      }),
      summary: t('Switching them to Business saves $20 per seat per month ({total} in total) when they do not use Enterprise-only features.', { total: fmtUSD(seats.downgradeValue, 0) }),
      evidence: [
        t('Peak monthly usage stayed at or below 80% of the $19 Business allotment: {names}.', { names: brief(seats.downgrade) }),
        t('Cash impact after pool slack: {amount}/month (the smaller pool is only a saving when it was not fully used).', { amount: fmtUSD(cash, 0) }),
      ],
      actions: [t('Confirm none of these users depend on Enterprise-only capabilities.'), t('Downgrade at the start of a billing cycle; decreases apply from the next cycle.')],
      impactUsd: seats.downgradeValue,
      impactKind: 'seats',
      cashUsd: cash,
      confidence: scopeDays >= 21 ? 'medium' : 'low',
      affected: who(ps.filter((p) => seats.downgrade.some((s) => s.id === p.id))),
      affectedCount: seats.downgrade.length,
      docs: [DOCS.seats],
      jump: { page: 'users', label: t('Open Users') },
    });
  }

  // 6. Usage concentration ---------------------------------------------------
  if (ps.length >= 5) {
    const top1 = ps[0].share;
    const top3 = ps.slice(0, 3).reduce((a, p) => a + p.share, 0);
    const aUsers = users.groups.pareto.A.users;
    if (top1 >= 0.25 || top3 >= 0.5) {
      add({
        id: 'concentration',
        theme: 'governance',
        audience: ['management'],
        severity: top1 >= 0.4 ? 'high' : 'medium',
        title: t('{share} of usage comes from three users', { share: fmtPct(top3, 0) }),
        summary: t('{a} of {n} users ({share}) generate at least {threshold} of attributed usage.', {
          a: aUsers,
          n: ps.length,
          share: fmtPct(aUsers / ps.length, 0),
          threshold: fmtPct(settings.pareto.a, 0),
        }),
        evidence: [
          t('Top user {name}: {share} of attributed usage ({amount}).', { name: ps[0].name, share: fmtPct(top1, 0), amount: fmtUSD(ps[0].gross, 0) }),
          t('Top three: {names} = {share}.', { names: brief(ps.slice(0, 3), 3), share: fmtPct(top3, 0) }),
        ],
        actions: [
          t('Review how the heaviest users work: long agent sessions, large contexts and Powerful models drive most cost.'),
          t('Give them targeted coaching and a per-user limit rather than a blanket restriction. They are often your most productive users.'),
        ],
        affected: who(ps.slice(0, 3)),
        affectedCount: aUsers,
        docs: [DOCS.optimize, DOCS.budgets],
        jump: { page: 'users', label: t('Show Pareto class A'), filters: { paretoClasses: ['A'] } },
      });
    }
  }

  // 7. Runaway users -----------------------------------------------------------
  const runaway = ps.filter((p) => p.tier === 'runaway');
  if (runaway.length > 0) {
    const { impact, cash } = reduce(fractionOf(step('capRunaway')));
    const taken = runaway.reduce((a, p) => a + Math.max(0, -p.balance), 0);
    const aboveCap = runaway.reduce((a, p) => a + Math.max(0, p.gross - DEFAULT_LEVERS.capUtil * p.allotment), 0);
    add({
      id: 'runaway',
      theme: 'cost',
      audience: ['management', 'admin', 'user'],
      severity: tot.net > 0.005 ? 'high' : 'medium',
      title: tp(runaway.length, '{n} user used at least {multiple}× their included credits', '{n} users used at least {multiple}× their included credits', {
        n: fmtInt(runaway.length),
        multiple: Math.round(settings.tiers.power * 10) / 10,
      }),
      summary: t('They drew {amount} from the shared pool beyond their own allotment.', { amount: fmtUSD(taken, 0) }),
      evidence: [
        ...runaway.slice(0, 5).map((p) =>
          t('{name}: {usage} = {own} of allotment; top model {model}; Auto {auto}.', {
            name: p.name,
            usage: fmtUSD(p.gross, 0),
            own: fmtPctAuto(p.utilization),
            model: p.topModel || t('n/a'),
            auto: fmtPct(p.autoShare, 0),
          }),
        ),
        t('Usage above {cap}× allotment: {above}. The plan assumes {share} of it can be avoided ({saving} over this period).', {
          cap: DEFAULT_LEVERS.capUtil,
          above: fmtUSD(aboveCap, 0),
          share: fmtPct(DEFAULT_LEVERS.capRunaway, 0),
          saving: fmtUSD(step('capRunaway'), 0),
        }),
      ],
      actions: [
        t('Set an individual user-level budget with an expiry date for legitimate heavy work, and a universal budget for everyone else.'),
        t('Use AI credit session limits in GitHub Copilot CLI so one task cannot consume an unbounded amount.'),
        t('Check for automation or agent loops on the days with the highest usage (see Patterns).'),
      ],
      impactUsd: impact,
      cashUsd: cash,
      affected: who(runaway),
      affectedCount: runaway.length,
      docs: [DOCS.budgets, DOCS.sessionLimit],
      jump: { page: 'users', label: t('Show runaway users'), filters: { tiers: ['runaway'] } },
    });
  }

  // 8. Model right-sizing ------------------------------------------------------
  const powerfulShare = tot.tierGross[CATEGORIES.indexOf('Powerful')] / tot.gross;
  if (step('modelShift') > 0 && powerfulShare >= 0.2) {
    const { impact, cash } = reduce(fractionOf(step('modelShift')));
    const rows = levers.shiftRows.filter((r) => r.ratio < 1).slice(0, 3);
    add({
      id: 'model-rightsizing',
      theme: 'efficiency',
      audience: ['management', 'user'],
      severity: powerfulShare >= 0.7 ? 'high' : powerfulShare >= 0.4 ? 'medium' : 'low',
      title: t('{share} of usage runs on Powerful models', { share: fmtPct(powerfulShare, 0) }),
      summary: t('Reasoning models are best for architecture and hard debugging. Routine edits, refactors and docs work well on mid-tier models at a fraction of the price.'),
      evidence: [
        ...rows.map((r) =>
          t('{model} → {target}: {usage} of usage; the same tokens cost {ratio} as much on {target} (price card rates).', {
            model: r.model,
            target: r.target,
            usage: fmtUSD(r.gross, 0),
            ratio: fmtPct(r.ratio, 0),
          }),
        ),
        t('Moving {share} of Powerful-tier usage to mid-tier models would reduce usage by about {amount} per month ({cash} as cash).', {
          share: fmtPct(DEFAULT_LEVERS.modelShift, 0),
          amount: fmtUSD(impact, 0),
          cash: fmtUSD(cash, 0),
        }),
      ],
      actions: [
        t('Plan with a strong reasoning model, then implement with a mid-tier model in a fresh session.'),
        t('Use lighter models for formatting, docs and small well-scoped changes, and for subagents.'),
        t('Keep the default reasoning level; raise it only for harder tasks.'),
      ],
      impactUsd: impact,
      cashUsd: cash,
      caveat: t('Assumes {share} of Powerful-tier work can move to a mid-tier model without quality loss. Savings use price card ratios for the same token mix.', { share: fmtPct(DEFAULT_LEVERS.modelShift, 0) }),
      affected: who([...ps].filter((p) => p.profile === 'frontier')),
      affectedCount: ps.filter((p) => p.profile === 'frontier').length,
      docs: [DOCS.comparison, DOCS.pricing, DOCS.optimize],
      jump: { page: 'models', label: t('Open Models'), filters: { categories: ['Powerful'] } },
    });
  }

  // 9. Auto model selection ----------------------------------------------------
  const auto = c.auto;
  if (step('autoAdoption') > 0 && auto.share < 0.7) {
    const { impact, cash } = reduce(fractionOf(step('autoAdoption')));
    const lowAuto = ps.filter((p) => p.traits.includes('lowAuto'));
    // A rate counts as seen only when at least one plan has Auto usage that could be priced from token counts.
    const seen = auto.plans.some((p) => p.source === 'measured' && p.rate > 0);
    const measured = auto.plans.filter((p) => p.source === 'measured');
    const assumed = t('{rate} (assumed, from Settings)', { rate: fmtPct(auto.assumedRate, 0) });
    const rateNote = measured.length
      ? t('Plan rates: {rates}. Plans without measured Auto usage use {assumed}.', {
          rates: measured.map((p) => t('{plan} {rate} (measured)', { plan: p.label, rate: fmtPct(p.rate, 0) })).join(t(', ')),
          assumed,
        })
      : t('No plan has measured Auto usage, so every plan uses {assumed}.', { assumed });
    add({
      id: 'auto-adoption',
      theme: 'efficiency',
      audience: ['management', 'user'],
      severity: impact >= 0.03 * avgGross && poolWhole ? 'medium' : 'low',
      title: t('Only {share} of usage goes through Auto model selection', { share: fmtPct(auto.share, 0) }),
      summary: seen
        ? t('Auto usage in this report received a discount of {rate} off its original price. {share} of it was priced from token counts.', {
            rate: fmtPct(auto.rate, 0),
            share: fmtPct(auto.measuredShare, 0),
          })
        : t('This report has no measured Auto discount, so the estimate uses the assumed rate of {rate} from Settings.', { rate: fmtPct(auto.assumedRate, 0) }),
      evidence: [
        t('Hand-picked usage: {direct} of {total}.', { direct: fmtUSD(auto.direct, 0), total: fmtUSD(auto.total, 0) }),
        lowAuto.length
          ? t('{users} used Auto for less than {share} of their usage: {names}.', { users: pluralize(lowAuto.length, 'user'), share: fmtPct(settings.lowAuto, 0), names: brief(lowAuto) })
          : t('No user used Auto for less than {share} of their usage.', { share: fmtPct(settings.lowAuto, 0) }),
        t('If {share} of the hand-picked usage went through Auto, usage would drop by about {amount} per month.', { share: fmtPct(DEFAULT_LEVERS.autoAdoption, 0), amount: fmtUSD(impact, 0) }),
      ],
      actions: [
        t('Make Auto the default model in GitHub Copilot Chat, GitHub Copilot CLI and the cloud agent.'),
        t('Pin a specific model only when the task needs it, and keep it for the whole session.'),
      ],
      impactUsd: impact,
      cashUsd: cash,
      caveat: t("The estimate applies the Auto discount rate of each user's plan to hand-picked usage. {rateNote} Auto may route a task to a different model than the one picked by hand.", { rateNote }),
      affected: who(lowAuto),
      affectedCount: lowAuto.length,
      docs: [DOCS.auto, DOCS.optimize],
      jump: { page: 'models', label: t('Show manual selection'), filters: { selection: 'manual' } },
    });
  }

  // 10. Cache reuse --------------------------------------------------------------
  const promptTokens = tot.input + tot.cacheRead + tot.cacheWrite;
  const estTotal = tot.est.input + tot.est.cacheRead + tot.est.cacheWrite + tot.est.output;
  if (store.hasTokens && promptTokens > 0 && estTotal > 0 && step('cacheDiscipline') > 0) {
    const hit = tot.cacheRead / promptTokens;
    const lowCache = ps.filter((p) => p.traits.includes('lowCache'));
    if (hit < 0.8 || lowCache.length > 0) {
      const { impact, cash } = reduce(fractionOf(step('cacheDiscipline')));
      add({
        id: 'cache',
        theme: 'efficiency',
        audience: ['management', 'user'],
        severity: hit >= 0.8 ? 'low' : step('cacheDiscipline') >= 0.02 * tot.gross ? 'medium' : 'low',
        title:
          hit < 0.8
            ? t('Only {share} of prompt tokens are cache hits', { share: fmtPct(hit, 0) })
            : tp(lowCache.length, '{n} user reuses the prompt cache poorly', '{n} users reuse the prompt cache poorly', { n: fmtInt(lowCache.length) }),
        summary: t('Cached tokens cost about 10% of normal input. Every cache miss re-sends the whole context at full price.'),
        evidence: [
          t('Overall cache hit rate is {share} of prompt tokens.', { share: fmtPct(hit, 0) }),
          t('Cache writes cost {writes} of priced usage; cache reads {reads}.', { writes: fmtPct(tot.est.cacheWrite / estTotal, 0), reads: fmtPct(tot.est.cacheRead / estTotal, 0) }),
          lowCache.length
            ? tp(lowCache.length, '{n} user is below {threshold} cache hit: {names}.', '{n} users are below {threshold} cache hit: {names}.', {
                n: fmtInt(lowCache.length),
                threshold: fmtPct(settings.lowCacheHit, 0),
                names: brief(lowCache),
              })
            : t('No individual user is below the cache-hit threshold.'),
          t('Turning {share} of cache writes into reads would reduce usage by about {amount} per month.', { share: fmtPct(DEFAULT_LEVERS.cacheDiscipline, 0), amount: fmtUSD(impact, 0) }),
        ],
        actions: [
          t("Don't switch models mid-session; the next request rebuilds the cache from scratch."),
          t('Start a new session, or /compact in GitHub Copilot CLI, instead of resuming an old thread: caches expire after 1 hour (most models) or 24 hours (OpenAI).'),
          t("Don't change reasoning effort, context size or enabled tools and MCP servers during a session."),
        ],
        impactUsd: impact,
        cashUsd: cash,
        affected: who(lowCache),
        affectedCount: lowCache.length,
        docs: [DOCS.optimize, DOCS.pricing],
        jump: { page: 'efficiency', label: t('Open Efficiency'), filters: lowCache.length ? { traits: ['lowCache'] } : undefined },
      });
    }
  }

  // 11. Context hygiene ------------------------------------------------------------
  if (store.hasTokens && estTotal > 0 && step('contextHygiene') > 0) {
    const inputSide = (tot.est.input + tot.est.cacheRead + tot.est.cacheWrite) / estTotal;
    if (inputSide >= 0.5) {
      const { impact, cash } = reduce(fractionOf(step('contextHygiene')));
      add({
        id: 'context',
        theme: 'efficiency',
        audience: ['user', 'management'],
        severity: 'low',
        title: t('{share} of priced usage is prompt context', { share: fmtPct(inputSide, 0) }),
        summary: t('Open tabs, attached files, tool definitions and long conversation history are sent with every request.'),
        evidence: [t('Trimming input-side tokens by {share} would reduce usage by about {amount} per month.', { share: fmtPct(DEFAULT_LEVERS.contextHygiene, 0), amount: fmtUSD(impact, 0) })],
        actions: [
          t('Start a new conversation when you switch problems (/new or a new chat).'),
          t('Use /compact to shrink a long GitHub Copilot CLI session you want to keep, and /context to check usage.'),
          t('Keep AGENTS.md or .github/copilot-instructions.md current so agents read fewer files to orient themselves.'),
          t('Enable only the MCP toolsets the task needs.'),
        ],
        impactUsd: impact,
        cashUsd: cash,
        docs: [DOCS.context, DOCS.optimize],
        jump: { page: 'efficiency', label: t('Open Efficiency') },
      });
    }
  }

  // 12. Long-context surcharge -------------------------------------------------------
  if (tot.longPremium > 0.005 && step('longContext') > 0) {
    const { impact, cash } = reduce(fractionOf(step('longContext')));
    const lc = ps
      .filter((p) => p.longShare > 0)
      .sort((a, b) => b.longShare * b.gross - a.longShare * a.gross);
    // The link and the affected list both use the long-context trait, so they always select the same users.
    const heavy = lc.filter((p) => p.traits.includes('longContext'));
    const modelNames = store.dicts.model.values;
    const topModels = [...Array(modelNames.length).keys()]
      .filter((m) => agg.modelExtra.longPremium[m] > 0)
      .sort((a, b) => agg.modelExtra.longPremium[b] - agg.modelExtra.longPremium[a])
      .slice(0, 3);
    const share = tot.longPremium / tot.gross;
    add({
      id: 'long-context',
      theme: 'efficiency',
      audience: ['management', 'user'],
      severity: share >= 0.05 ? 'medium' : 'low',
      title: t('Long-context surcharges cost at least {amount}', { amount: fmtUSD(tot.longPremium, 0) }),
      summary: t("{share} of usage is the surcharge on requests whose prompts crossed a model's long-context threshold.", { share: fmtPct(share, 1) }),
      evidence: [
        tp(tot.longPremiumRows, '{n} request was billed at the long-context rate.', '{n} requests were billed at the long-context rate.', { n: fmtInt(tot.longPremiumRows) }),
        topModels.length
          ? t('Mostly on {models}.', { models: topModels.map((m) => `${modelNames[m]} (${fmtUSD(agg.modelExtra.longPremium[m], 0)})`).join(t(', ')) })
          : '',
        lc.length ? t('Most affected users: {names}.', { names: brief(lc, 4) }) : '',
      ].filter(Boolean),
      actions: [
        t('Split work into smaller tasks or summarize earlier steps instead of carrying the whole history.'),
        t('Narrow the file scope and avoid attaching large directories or logs.'),
        t('Pick a model without a long-context tier when the task does not need a huge window.'),
      ],
      impactUsd: impact,
      cashUsd: cash,
      caveat: t('The premium is a conservative lower bound estimated from token counts and price card rates.'),
      affected: who(heavy),
      affectedCount: heavy.length,
      docs: [DOCS.pricing, DOCS.context],
      jump: heavy.length
        ? { page: 'efficiency', label: t('Show long-context users'), filters: { traits: ['longContext'] } }
        : { page: 'efficiency', label: t('Open Efficiency') },
    });
  }

  // 13. Budgets and guardrails -----------------------------------------------------------
  {
    const nM = agg.nMonths;
    const scale = new Float64Array(nM).fill(1);
    for (const m of pool.months) if (m.projection && m.projection.mtdGross > 0) scale[m.slot] = Math.min(8, m.projection.projGross / m.projection.mtdGross);
    const vals: number[] = [];
    const umg = agg.userMonthGross;
    const nU = store.dicts.user.values.length;
    for (let u = 1; u < nU; u++) for (let k = 0; k < nM; k++) if (umg[u * nM + k] > 0) vals.push(umg[u * nM + k] * scale[k]);
    vals.sort((a, b) => a - b);
    const poolRisk = poolWhole && (pool.monthsExhausted > 0 || pool.months.some((m) => m.projection && m.projection.projNet > 0.005));
    const risky = tot.net > 0.005 || runaway.length > 0 || poolRisk;
    if (vals.length >= 5 && risky && budgetOf(settings) === null) {
      const cap = ceil5(quantile(vals, 0.9));
      const above = vals.filter((v) => v > cap).length;
      const excess = vals.reduce((a, v) => a + Math.max(0, v - cap), 0);
      const monthlyNet = pool.months.length ? pool.months.reduce((a, m) => a + (m.projection ? m.projection.projNet : m.net), 0) / pool.months.length : 0;
      const entBudget = monthlyNet > 0.5 ? ceil5(monthlyNet * 1.25) : 100;
      add({
        id: 'budgets',
        theme: 'governance',
        audience: ['management', 'admin'],
        severity: tot.net > 0.005 ? 'high' : 'medium',
        title: t('Put budgets in place before the next overage'),
        summary: t('User-level budgets protect the shared pool; enterprise, organization and cost-center budgets cap what you pay once the pool is empty.'),
        evidence: [
          t('A per-user monthly limit near the 90th percentile of monthly usage (about {cap}) would have touched {above} of {total} user-months and held back {excess} of usage.', {
            cap: fmtUSD(cap, 0),
            above: fmtInt(above),
            total: fmtInt(vals.length),
            excess: fmtUSD(excess, 0),
          }),
          monthlyNet > 0.5
            ? t('A metered-overage budget of about {budget} per month covers the projected overage with 25% headroom. Your maximum bill = seat fees + that budget.', { budget: fmtUSD(entBudget, 0) })
            : t('No overage so far, so an enterprise budget can start small (for example {budget}) and act as an early warning. Your maximum bill = seat fees + that budget.', { budget: fmtUSD(entBudget, 0) }),
        ],
        actions: [
          t('Create a universal user-level budget for fair access to the pool. It is a hard stop on pool and metered usage combined.'),
          t('Add individual or cost-center user-level budgets (with expiry) for teams that legitimately need more.'),
          t('Set an enterprise budget with alerts for the overage phase, and use cost-center included-usage controls to keep each team within the credits its licenses fund.'),
        ],
        caveat: t('The suggested figures are starting points based on the loaded data. Review with team leads before enforcing a hard stop.'),
        docs: [DOCS.budgets, DOCS.budgetTuning, DOCS.budgetStart],
        jump: { page: 'settings', label: t('Enter your budget in Settings') },
      });
    }
  }

  // 14. Attribution -------------------------------------------------------------------------
  if (users.hasCostCenters) {
    const noCc = users.groups.trait.noCostCenter;
    if (noCc.users > 0) {
      const names = ps.filter((p) => p.traits.includes('noCostCenter'));
      add({
        id: 'cost-center-coverage',
        theme: 'governance',
        audience: ['admin', 'management'],
        severity: noCc.gross / tot.gross >= 0.2 ? 'medium' : 'low',
        title: tp(noCc.users, '{n} user is not assigned to a cost center', '{n} users are not assigned to a cost center', { n: fmtInt(noCc.users) }),
        summary: t('{amount} ({share} of usage) cannot be charged back or budgeted by team.', { amount: fmtUSD(noCc.gross, 0), share: fmtPct(noCc.gross / tot.gross, 0) }),
        evidence: [t('Without a cost center: {names}.', { names: brief(names) })],
        actions: [
          t('Assign every licensed user to a cost center (directly, through an organization or an enterprise team).'),
          t('Then use cost-center budgets and included-usage controls to keep each team within its own credits.'),
        ],
        affected: who(names),
        affectedCount: noCc.users,
        docs: [DOCS.budgets],
        jump: { page: 'organization', label: t('Show unassigned users'), filters: { traits: ['noCostCenter'] } },
      });
    }
  }
  if (tot.unattributedGross >= 1 && tot.unattributedGross / tot.gross >= 0.01) {
    const byProduct = new Map<number, number>();
    const byRepo = new Map<number, number>();
    for (let i = 0; i < store.n; i++) {
      if (c.mask !== null && c.mask[i] === 0) continue;
      if (store.user[i] !== BLANK_ID) continue;
      byProduct.set(store.product[i], (byProduct.get(store.product[i]) ?? 0) + store.gross[i]);
      byRepo.set(store.repo[i], (byRepo.get(store.repo[i]) ?? 0) + store.gross[i]);
    }
    const top = (m: Map<number, number>, dim: 'product' | 'repo') =>
      [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, v]) => `${labelOf(dim, store.dicts[dim].values[id])} (${fmtUSD(v, 0)})`)
        .join(t(', '));
    add({
      id: 'unattributed',
      theme: 'governance',
      audience: ['admin', 'management'],
      severity: tot.unattributedGross / tot.gross >= 0.15 ? 'medium' : 'low',
      title: t('{amount} is not tied to a user', { amount: fmtUSD(tot.unattributedGross, 0) }),
      summary: t('Repository-level products (such as code quality and security scanning) bill credits without a username, so per-user budgets cannot control them.'),
      evidence: [t('Products: {list}.', { list: top(byProduct, 'product') }), t('Repositories: {list}.', { list: top(byRepo, 'repo') })],
      actions: [t('Review whether those features are needed on every repository.'), t('Track them by repository or cost center and budget them separately from user activity.')],
      docs: [DOCS.budgets, DOCS.monitor],
      jump: { page: 'spend', label: t('Show unattributed usage'), filters: { attribution: 'unattributed' } },
    });
  }
  const mixed = ps.filter((p) => p.orgMixed);
  if (mixed.length > 0) {
    add({
      id: 'multi-org',
      theme: 'governance',
      audience: ['admin'],
      severity: 'low',
      title: tp(mixed.length, '{n} user bills to more than one organization', '{n} users bill to more than one organization', { n: fmtInt(mixed.length) }),
      summary: t('If these users hold licenses from several organizations, GitHub picks one organization per cycle to bill the seat, so organization budgets apply unpredictably.'),
      evidence: [t('Users: {names}.', { names: brief(mixed) })],
      actions: [t('Give each user a single license source, or use cost-center budgets with direct user assignment.')],
      affected: who(mixed),
      affectedCount: mixed.length,
      docs: [DOCS.budgets],
    });
  }

  // 15. Adoption ----------------------------------------------------------------------------
  if (users.trendReliable) {
    const lapsed = ps.filter((p) => p.lapsed);
    if (lapsed.length > 0) {
      add({
        id: 'lapsed',
        theme: 'adoption',
        audience: ['management', 'admin'],
        severity: 'low',
        title: t('{users} stopped using AI credits', { users: pluralize(lapsed.length, 'user') }),
        summary: t('No usage for at least {days}, after earlier activity.', { days: pluralize(settings.lapsedDays, 'day') }),
        evidence: [
          t('Together they generated {amount} of usage earlier in the period: {names}.', { amount: fmtUSD(lapsed.reduce((a, p) => a + p.gross, 0), 0), names: brief(lapsed) }),
        ],
        actions: [
          t('Ask what stopped them: blockers, a budget hard stop, or a change of tasks.'),
          t('Offer a short working session on agent mode or the CLI, or reclaim the seat if it is no longer needed.'),
        ],
        affected: who(lapsed),
        affectedCount: lapsed.length,
        docs: [DOCS.licenseUsage],
        jump: { page: 'segments', label: t('Show lapsed users'), filters: { engagement: ['lapsed'] } },
      });
    }
    const fresh = ps.filter((p) => p.isNew);
    if (fresh.length > 0) {
      add({
        id: 'new-users',
        theme: 'adoption',
        audience: ['management', 'admin'],
        severity: 'positive',
        title: t('{users} started in the last {days}', { users: pluralize(fresh.length, 'new user'), days: pluralize(settings.newUserDays, 'day') }),
        summary: t('They have generated {amount} of usage so far.', { amount: fmtUSD(fresh.reduce((a, p) => a + p.gross, 0), 0) }),
        evidence: [t('New users: {names}.', { names: brief(fresh) })],
        actions: [t('Share the playbook early: Auto by default, one model per session, fresh threads per task.')],
        affected: who(fresh),
        affectedCount: fresh.length,
        docs: [DOCS.optimize],
        jump: { page: 'segments', label: t('Show new users'), filters: { engagement: ['new'] } },
      });
    }
  }
  const champions = ps.filter((p) => p.persona === 'champion');
  if (champions.length > 0) {
    const g = champions.reduce((a, p) => a + p.gross, 0);
    add({
      id: 'champions',
      theme: 'adoption',
      audience: ['management'],
      severity: 'positive',
      title: tp(champions.length, '{n} champion uses GitHub Copilot often and heavily', '{n} champions use GitHub Copilot often and heavily', { n: fmtInt(champions.length) }),
      summary: t('They account for {share} of attributed usage.', { share: fmtPct(g / Math.max(1e-9, users.totals.gross), 0) }),
      evidence: [t('Champions: {names}.', { names: brief(champions) })],
      actions: [
        t('Ask them to share workflows, prompts and custom instructions with their teams.'),
        t('Check their model mix and cache hit rate: their habits are the template for everyone else.'),
      ],
      affected: who(champions),
      affectedCount: champions.length,
      jump: { page: 'segments', label: t('Show champions'), filters: { segments: ['champion'] } },
    });
  }
  const spiky = ps.filter((p) => p.traits.includes('spiky'));
  if (spiky.length > 0) {
    add({
      id: 'spiky',
      theme: 'cost',
      audience: ['user', 'admin'],
      severity: 'low',
      title: tp(spiky.length, '{n} user concentrates their usage on a single day', '{n} users concentrate their usage on a single day', { n: fmtInt(spiky.length) }),
      summary: t("At least {share} of each user's usage happened on one day.", { share: fmtPct(settings.spikeShare, 0) }),
      evidence: spiky.slice(0, 4).map((p) => t('{name}: {share} of {amount} on {day}.', { name: p.name, share: fmtPct(p.peakShare, 0), amount: fmtUSD(p.gross, 0), day: fmtDay(p.peakDayIdx) })),
      actions: [t('Look at what ran on those days: a long agent session, a migration or a loop.'), t('Use AI credit session limits for open-ended agent tasks.')],
      affected: who(spiky),
      affectedCount: spiky.length,
      docs: [DOCS.sessionLimit],
      jump: { page: 'users', label: t('Show spiky users'), filters: { traits: ['spiky'] } },
    });
  }

  // 16. Trend and anomalies ----------------------------------------------------------------------
  // A change only matters when the weeks involved carry a meaningful share of the total.
  const trendMaterial = Math.max(c.trend.recent, c.trend.prior) >= Math.max(5, 0.05 * tot.gross);
  if (c.trend.reliable && Number.isFinite(c.trend.change) && trendMaterial) {
    const ch = c.trend.change;
    const accel = ps.filter((p) => p.traits.includes('accelerating')).sort((a, b) => b.recent - b.prior - (a.recent - a.prior));
    if (ch >= 0.5) {
      add({
        id: 'trend-up',
        theme: 'cost',
        audience: ['management', 'admin'],
        severity: ch >= 1 || tot.net > 0.005 ? 'high' : 'medium',
        title: ch >= 2 ? t('Usage is accelerating: {multiple} the week before', { multiple: fmtMultiple(1 + ch) }) : t('Usage is accelerating: +{share} week over week', { share: fmtPct(ch, 0) }),
        summary: t('If this pace continues, the pool runs out sooner than the monthly average suggests.'),
        evidence: [
          t('Last 7 days {recent} vs {prior} in the 7 days before.', { recent: fmtUSD(c.trend.recent, 0), prior: fmtUSD(c.trend.prior, 0) }),
          accel.length ? t('Fastest growth: {list}.', { list: accel.slice(0, 3).map((p) => `${p.name} (${fmtUSD(p.prior, 0)} → ${fmtUSD(p.recent, 0)})`).join(t(', ')) }) : '',
        ].filter(Boolean),
        actions: [t('Find out what changed: a new rollout, a new model or an automation.'), t('Put alerts on the pool before it is exhausted.')],
        affected: who(accel),
        affectedCount: accel.length,
        docs: [DOCS.monitor],
        jump: { page: 'patterns', label: t('Open Patterns') },
      });
    } else if (ch <= -0.4) {
      add({
        id: 'trend-down',
        theme: 'adoption',
        audience: ['management'],
        severity: 'info',
        title: t('Usage dropped {share} week over week', { share: fmtPct(-ch, 0) }),
        summary: t('A sharp fall can mean a holiday, a freeze, or users blocked by a budget limit.'),
        evidence: [t('Last 7 days {recent} vs {prior} in the 7 days before.', { recent: fmtUSD(c.trend.recent, 0), prior: fmtUSD(c.trend.prior, 0) })],
        actions: [t('Check that user-level budgets are not blocking people unintentionally.')],
        jump: { page: 'patterns', label: t('Open Patterns') },
      });
    }
  }
  if (c.anomalies.length > 0) {
    const top = c.anomalies[0];
    const nameOf = (id: number) => labelOf('user', store.dicts.user.values[id]);
    add({
      id: 'anomalies',
      theme: 'cost',
      audience: ['admin'],
      severity: top.gross >= 0.1 * tot.gross ? 'medium' : 'low',
      title: t('{days} with unusually high usage', { days: pluralize(c.anomalies.length, 'day') }),
      summary: t('The biggest, {day}, reached {multiple} a typical day.', { day: fmtDay(top.day, true), multiple: fmtMultiple(top.multiple) }),
      evidence: c.anomalies.slice(0, 4).map((a) => {
        const u = a.topUsers[0];
        const modelName = a.topModels[0] ? store.dicts.model.values[a.topModels[0].id] : '';
        const v = {
          day: fmtDay(a.day, true),
          amount: fmtUSD(a.gross, 0),
          multiple: fmtMultiple(a.multiple),
          user: u ? nameOf(u.id) : '',
          userAmount: u ? fmtUSD(u.gross, 0) : '',
          model: modelName,
        };
        if (u && modelName) return t('{day}: {amount} ({multiple} typical), mostly {user} ({userAmount}) on {model}.', v);
        if (u) return t('{day}: {amount} ({multiple} typical), mostly {user} ({userAmount}).', v);
        if (modelName) return t('{day}: {amount} ({multiple} typical) on {model}.', v);
        return t('{day}: {amount} ({multiple} typical).', v);
      }),
      actions: [
        t('Open those days in Patterns and look at who and which model drove them.'),
        t('Use session limits and budgets so a single runaway task cannot cost this much again.'),
      ],
      docs: [DOCS.sessionLimit, DOCS.budgets],
      jump: { page: 'patterns', label: t('Open Patterns'), filters: { dateFrom: top.day, dateTo: top.day } },
    });
  }

  // 17. Organization and cost-center balance ------------------------------------------------------------
  {
    const lines: string[] = [];
    let flagged = 0;
    const groupBy = (key: 'org' | 'costCenter') => {
      const g = new Map<string, { users: number; gross: number; allot: number }>();
      for (const p of ps) {
        const k = (key === 'org' ? p.org : p.costCenter) || '';
        if (!k) continue;
        const e = g.get(k) ?? { users: 0, gross: 0, allot: 0 };
        e.users++;
        e.gross += p.gross;
        e.allot += p.allotment;
        g.set(k, e);
      }
      if (g.size < 2) return;
      const rows = [...g.entries()].map(([name, e]) => ({ name, ...e, use: e.allot > 0 ? e.gross / e.allot : 0 }));
      const over = rows.filter((r) => r.use >= 1.5 && r.gross - r.allot >= 20 && r.users >= 2).sort((a, b) => b.gross - b.allot - (a.gross - a.allot));
      const under = rows.filter((r) => r.use < 0.25 && r.users >= 3).sort((a, b) => a.use - b.use);
      for (const r of over.slice(0, 3)) {
        flagged++;
        const v = { name: r.name, share: fmtPctAuto(r.use), usage: fmtUSD(r.gross, 0), funded: fmtUSD(r.allot, 0), drawn: fmtUSD(r.gross - r.allot, 0) };
        lines.push(
          key === 'org'
            ? t('Organization {name} used {share} of the credits its licenses fund ({usage} vs {funded}); it draws {drawn} from the pool.', v)
            : t('Cost center {name} used {share} of the credits its licenses fund ({usage} vs {funded}); it draws {drawn} from the pool.', v),
        );
      }
      for (const r of under.slice(0, 2)) {
        flagged++;
        const v = { name: r.name, share: fmtPctAuto(r.use), users: pluralize(r.users, 'user') };
        lines.push(key === 'org' ? t('Organization {name} used only {share} of its licensed credits ({users}).', v) : t('Cost center {name} used only {share} of its licensed credits ({users}).', v));
      }
    };
    groupBy('org');
    groupBy('costCenter');
    if (flagged > 0) {
      add({
        id: 'group-balance',
        theme: 'governance',
        audience: ['management', 'admin'],
        severity: 'low',
        title: t('Some teams lend credits to the pool while others draw heavily from it'),
        summary: t('Pooling hides the difference. Teams that draw far more than their licenses fund may need a budget or a different seat mix.'),
        evidence: lines,
        actions: [
          t('Use cost-center included-usage controls to cap each team at the credits its licenses fund, choosing block or paid overage when it is reached.'),
          t('Move under-using teams to coaching or fewer seats.'),
        ],
        docs: [DOCS.budgets],
        jump: { page: 'organization', label: t('Open Organization') },
      });
    }
  }

  // 18. Healthy ----------------------------------------------------------------------------------------------
  if (poolWhole && !pool.capacityExceeded && tot.net <= 0.005 && poolUse >= 0.6 && out.every((r) => SEVERITY_ORDER[r.severity] > 1)) {
    add({
      id: 'healthy',
      theme: 'pool',
      audience: ['management'],
      severity: 'positive',
      title: t('The pool is well used and fully covered'),
      summary: t('Utilization is about {share} with no billed overage.', { share: fmtPct(Math.min(1, poolUse), 0) }),
      evidence: [t('Usage {usage} against {credits} of included credits.', { usage: fmtUSD(tot.gross, 0), credits: fmtUSD(capacityTotal, 0) })],
      actions: [t('Keep monitoring the trend and set alerts so a change shows up early.')],
      ...(pool.capacityIsLowerBound
        ? { caveat: t('Only users in this report fund the current estimate. Add a complete license list in Settings for a better estimate; past months may still differ.') }
        : {}),
      impactUsd: 0,
      docs: [DOCS.monitor],
    });
  }

  // 19. Missing columns --------------------------------------------------------------------------------------------
  {
    const issues = coverageIssues(c.coverage, users.fallbackQuotaCredits).filter((i) => i.severity === 'warn');
    if (issues.length > 0) {
      add({
        id: 'data-coverage',
        theme: 'data',
        audience: ['admin'],
        severity: 'medium',
        title: issues.length === 1 ? issues[0].title : t('The file is missing columns the analysis relies on'),
        summary: t('Some figures are hidden or assumed because of what the file does not contain.'),
        evidence: issues.map((i) => `${i.title}. ${i.detail}`),
        actions: [t('Export the AI usage report again from GitHub and load the complete file.')],
        confidence: 'high',
        jump: { page: 'data', label: t('Open Data') },
      });
    }
  }

  // 20. Data notes -------------------------------------------------------------------------------------------------
  {
    const notes: string[] = [];
    if (!narrowed && pool.capacityExceeded) {
      notes.push(
        c.coverage.billing && c.coverage.quota
          ? t(
              'The pool covered {covered}, more than the {capacity} that the seats in this file fund. Other seats share the pool (a partial export, or files from different billing entities), so pool size, utilization and seat recommendations are not shown. Add your seat roster or extra seats in Settings to complete the picture.',
              { covered: fmtUSD(pool.covered, 0), capacity: fmtUSD(pool.capacity, 0) },
            )
          : t('The size of the pool is unknown (see the missing columns below), so pool size, utilization and seat recommendations are not shown.'),
      );
    } else if (!narrowed && pool.capacityIsLowerBound) {
      notes.push(t('The current estimate only includes users in this report. Add a complete license list in Settings to improve included-credit and seat-activity estimates.'));
    }
    if (scopeDays < 14) notes.push(tp(scopeDays, 'Only {n} day of data: projections and trends are indicative.', 'Only {n} days of data: projections and trends are indicative.', { n: fmtInt(scopeDays) }));
    if (store.hasTokens && tot.unpricedGross > 0.005) {
      // Usage with no price card estimate is on models without a price, or on lines without a model name or token counts.
      const names = store.dicts.model.values;
      let noPrice = 0;
      for (let id = 0; id < names.length; id++) if (names[id] !== '' && c.models.priced[id] === 0) noPrice += agg.model.gross[id];
      const noEstimate = Math.max(0, tot.unpricedGross - noPrice);
      if (noPrice > 0.005) notes.push(t('{amount} is on models that are not in the built-in price card. What-if savings exclude them; add overrides in Settings.', { amount: fmtUSD(noPrice, 0) }));
      if (noEstimate > 0.005) notes.push(t('{amount} is on usage lines without token counts or a model name, so price card estimates and what-if savings exclude it.', { amount: fmtUSD(noEstimate, 0) }));
    }
    for (const issue of coverageIssues(c.coverage, users.fallbackQuotaCredits)) notes.push(`${issue.title}. ${issue.detail}`);
    notes.push(t('The report covers AI-credit usage only. Code completions and next edit suggestions are not included.'));
    const dup = store.files.reduce((a, f) => a + f.duplicatesDropped, 0);
    const bad = store.files.reduce((a, f) => a + f.badDateRows + f.badNumberCells + f.negativeRows + f.balanceMismatchRows, 0);
    if (dup > 0) notes.push(tp(dup, '{n} duplicate row was dropped while merging files.', '{n} duplicate rows were dropped while merging files.', { n: fmtInt(dup) }));
    if (bad > 0) notes.push(t('{count} failed validation (see Data).', { count: pluralize(bad, 'row or cell', 'rows or cells') }));
    add({
      id: 'data-notes',
      theme: 'data',
      audience: ['admin'],
      severity: 'info',
      title: t('How to read these numbers'),
      summary: t('Estimates are only as complete as the loaded files.'),
      evidence: notes,
      actions: [],
      confidence: 'high',
      jump: { page: 'data', label: t('Open Data') },
    });
  }

  // Largest monthly value first; equal values (most findings that save nothing) go by severity, then keep the order they were found in.
  out.sort((a, b) => recValue(b) - recValue(a) || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return out;
}

export function buildHeadline(c: RecContext, recs: Recommendation[]): Headline {
  const tot = c.agg.totals;
  if (!c.coverage.billing) {
    return {
      status: 'watch',
      title: t('This file does not say what was billed'),
      detail: t('Overage, pool and seat findings need the discount_amount, net_amount and total_monthly_quota columns.'),
    };
  }
  const urgent = recs.filter((r) => r.severity === 'critical' || r.severity === 'high').length;
  const watch = recs.filter((r) => r.severity === 'medium').length;
  const util = c.narrowed || c.pool.capacityExceeded ? null : c.pool.utilization;
  const detail = [
    util !== null && Number.isFinite(util) ? t('Pool utilization {share}', { share: fmtPct(Math.min(1, util), 0) }) : null,
    c.coverage.models ? t('Auto {share} of usage', { share: fmtPct(c.auto.share, 0) }) : null,
    pluralize(c.users.profiles.length, 'active user'),
  ]
    .filter(Boolean)
    .join(' · ');
  if (urgent > 0) {
    return {
      status: 'action',
      title: tot.net > 0.005 ? t('{amount} billed overage and {actions}', { amount: fmtUSD(tot.net, 0), actions: pluralize(urgent, 'high-priority action') }) : pluralize(urgent, 'high-priority action'),
      detail,
    };
  }
  if (watch > 0) return { status: 'watch', title: t('No urgent issues, {items} worth a look', { items: pluralize(watch, 'item') }), detail };
  return { status: 'healthy', title: t('Usage looks healthy'), detail };
}
