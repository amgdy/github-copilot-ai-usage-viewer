import type { DataStore } from '../types';
import { CATEGORIES, CREDIT_USD } from '../types';
import type { ModelTable } from '../pricing/models';
import { buildLicenseIndex, entryLicense, profileLicense, type ProfileLicense } from '../licenses/activity';
import { workdaysBetween } from '../utils/date';
import type { Aggregates } from './aggregate';
import { autoUseOf, buildAutoRates, rateForPlan, userAutoDiscount, userMissedDiscount, type AutoDiscount } from './autoDiscount';
import { dataCoverage } from './coverage';
import type { Filters } from './filters';
import {
  applyLevers,
  cacheSavingsStandalone,
  DEFAULT_LEVERS,
  LEVER_META,
  LEVER_ORDER,
  modelShiftRatios,
  type LeverContext,
  type LeverStep,
} from './levers';
import { defaultQuotaCredits, uniqueRoster } from './pool';
import type { Prepared } from './prepare';
import { BLANK_ID, planLabel } from './prepare';
import type { Settings } from './settings';
import type { AutoUseId, EngagementId, LifecycleId, ParetoId, PersonaId, ProfileId, TierId, TraitId } from './taxonomy';

export interface UserProfile {
  id: number;
  name: string;
  org: string;
  orgMixed: boolean;
  costCenter: string;
  costCenterMixed: boolean;
  plan: string;
  quotaCredits: number;
  /** Included credits in USD for the months the user appears in (the user's "fair share" of the pool). */
  allotment: number;
  rows: number;
  gross: number;
  discount: number;
  net: number;
  credits: number;
  share: number;
  cumShare: number;
  rank: number;
  firstDay: number;
  lastDay: number;
  globalFirstDay: number;
  activeDays: number;
  windowWorkdays: number;
  activeRate: number;
  daysSinceLast: number;
  utilization: number;
  /** Allotment minus spend: positive = lends credits to the pool, negative = draws from it. */
  balance: number;
  tier: TierId;
  engagement: EngagementId;
  isNew: boolean;
  lapsed: boolean;
  persona: PersonaId;
  profile: ProfileId;
  pareto: ParetoId;
  traits: TraitId[];
  autoShare: number;
  powerfulShare: number;
  versatileShare: number;
  lightweightShare: number;
  cacheHit: number;
  longShare: number;
  peakDay: number;
  peakDayIdx: number;
  peakShare: number;
  recent: number;
  prior: number;
  trend: number;
  costPerActiveDay: number;
  topModel: string;
  topModelShare: number;
  modelCount: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** input + output + cacheRead + cacheWrite. */
  tokens: number;
  /** Estimated usage by token type (USD): the list price of each token type scaled to what was billed. Priced models with token counts only. */
  costInput: number;
  costCacheRead: number;
  costCacheWrite: number;
  costOutput: number;
  /** Share of the user's usage that the token cost split covers (rows of priced models with token counts). */
  tokenCoverage: number;
  /** Usage that went through Auto, with its original price and the Auto discount (see `AutoDiscount`). */
  auto: AutoDiscount;
  /** Usage on models picked by hand. */
  directBilled: number;
  /** What the hand-picked usage would have earned if the same requests had gone through Auto: `directBilled` times the Auto discount of the user's plan (measured in the report, else the Settings rate). An estimate. */
  autoMissed: number;
  autoUse: AutoUseId;
  peakMonthGross: number;
  potential: number;
  potentialBy: Record<LeverStep['id'], number>;
  /** 100 × (1 − addressable share of spend). */
  efficiency: number;
  /** The seat of this user in the imported license roster. Null when no roster is loaded; `seat` is false for a user without a seat. */
  license?: ProfileLicense | null;
}

export interface GroupStat {
  users: number;
  gross: number;
  net: number;
  potential: number;
  allotment: number;
}

const emptyGroup = (): GroupStat => ({ users: 0, gross: 0, net: 0, potential: 0, allotment: 0 });

function groupOf<K extends string>(keys: readonly K[]): Record<K, GroupStat> {
  const groups = {} as Record<K, GroupStat>;
  for (const key of keys) groups[key] = emptyGroup();
  return groups;
}

export const PERSONA_IDS: PersonaId[] = ['champion', 'steady', 'burst', 'dormant', 'runaway', 'new', 'lapsed'];
export const TIER_IDS: TierId[] = ['minimal', 'light', 'core', 'power', 'runaway'];
export const ENGAGEMENT_IDS: EngagementId[] = ['daily', 'regular', 'occasional', 'rare'];
export const LIFECYCLE_IDS: LifecycleId[] = ['new', 'lapsed'];
export const PROFILE_IDS: ProfileId[] = ['frontier', 'balanced', 'efficient'];
export const PARETO_IDS: ParetoId[] = ['A', 'B', 'C'];
export const AUTO_USE_IDS: AutoUseId[] = ['autoFirst', 'mixed', 'direct', 'unknown'];
export const TRAIT_IDS: TraitId[] = [
  'lowCache',
  'longContext',
  'spiky',
  'lowAuto',
  'multiModel',
  'accelerating',
  'fading',
  'noCostCenter',
];

export interface InactiveSeat {
  user: string;
  plan: string | null;
  /** What the imported license data says about this seat. Absent when the roster has no license data. */
  license?: ProfileLicense;
}

export interface UserSet {
  profiles: UserProfile[];
  byId: Map<number, UserProfile>;
  groups: {
    persona: Record<PersonaId, GroupStat>;
    tier: Record<TierId, GroupStat>;
    engagement: Record<EngagementId, GroupStat>;
    lifecycle: Record<LifecycleId, GroupStat>;
    profile: Record<ProfileId, GroupStat>;
    pareto: Record<ParetoId, GroupStat>;
    autoUse: Record<AutoUseId, GroupStat>;
    trait: Record<TraitId, GroupStat>;
  };
  /** Roster users that never appear in the loaded files. */
  inactive: InactiveSeat[];
  totals: GroupStat;
  /** Users who draw from the pool (spend above their allotment) and those who lend to it. */
  poolFlow: { takers: number; takenUsd: number; lenders: number; lentUsd: number };
  hasCostCenters: boolean;
  trendReliable: boolean;
  fallbackQuotaCredits: number;
}

const MIN_WINDOW_WORKDAYS = 5;

/** Group totals, pool flow and the id lookup for a list of profiles (also used for segment-filtered subsets). */
export function summarizeProfiles(profiles: UserProfile[]): Pick<UserSet, 'byId' | 'groups' | 'totals' | 'poolFlow'> {
  const groups: UserSet['groups'] = {
    persona: groupOf(PERSONA_IDS),
    tier: groupOf(TIER_IDS),
    engagement: groupOf(ENGAGEMENT_IDS),
    lifecycle: groupOf(LIFECYCLE_IDS),
    profile: groupOf(PROFILE_IDS),
    pareto: groupOf(PARETO_IDS),
    autoUse: groupOf(AUTO_USE_IDS),
    trait: groupOf(TRAIT_IDS),
  };
  const totals = emptyGroup();
  const poolFlow = { takers: 0, takenUsd: 0, lenders: 0, lentUsd: 0 };
  const add = (group: GroupStat, user: UserProfile) => {
    group.users++;
    group.gross += user.gross;
    group.net += user.net;
    group.potential += user.potential;
    group.allotment += user.allotment;
  };
  const byId = new Map<number, UserProfile>();
  for (const user of profiles) {
    byId.set(user.id, user);
    add(totals, user);
    add(groups.persona[user.persona], user);
    add(groups.tier[user.tier], user);
    add(groups.engagement[user.engagement], user);
    if (user.isNew) add(groups.lifecycle.new, user);
    if (user.lapsed) add(groups.lifecycle.lapsed, user);
    add(groups.profile[user.profile], user);
    add(groups.pareto[user.pareto], user);
    add(groups.autoUse[user.autoUse], user);
    for (const trait of user.traits) add(groups.trait[trait], user);
    if (user.balance < 0) {
      poolFlow.takers++;
      poolFlow.takenUsd += -user.balance;
    } else if (user.balance > 0) {
      poolFlow.lenders++;
      poolFlow.lentUsd += user.balance;
    }
  }
  return { byId, groups, totals, poolFlow };
}

export function buildProfiles(
  store: DataStore,
  prepared: Prepared,
  models: ModelTable,
  aggregates: Aggregates,
  settings: Settings,
): UserSet {
  const userTotals = aggregates.userAcc;
  // Without a model column every row looks hand-picked, so Auto-based traits and potential would be made up.
  const modelsKnown = dataCoverage(store).models;
  const autoRates = buildAutoRates(aggregates, settings.autoDiscount);
  const userCount = store.dicts.user.values.length;
  const modelIdCount = aggregates.nModels;
  const nMonths = aggregates.nMonths;
  const users = store.dicts.user.values;
  const orgs = store.dicts.org.values;
  const costCenters = store.dicts.costCenter.values;
  const modelNames = store.dicts.model.values;
  const scopeStart = aggregates.range.start;
  const scopeEnd = aggregates.range.end;
  const trendReliable = aggregates.range.length >= 14;
  const fallbackQuotaCredits = defaultQuotaCredits(aggregates);
  const minSpend = settings.minSpendForTraits;
  const levers = DEFAULT_LEVERS;
  const leverContext: LeverContext = { agg: aggregates, models, settings, autoRates };
  const licenseIndex = buildLicenseIndex(settings.roster, settings.rosterAsOf);

  const { ratio: shiftRatio, rows: shiftRows } = modelShiftRatios(leverContext, levers.target);
  const powerfulGross = shiftRows.reduce((total, shiftRow) => total + shiftRow.gross, 0);
  const fullSavePerGross = powerfulGross > 0 ? shiftRows.reduce((total, shiftRow) => total + shiftRow.savingsAtFull, 0) / powerfulGross : 0;
  const cacheWriteEst = aggregates.totals.est.cacheWrite;
  const cacheK = cacheWriteEst > 0 ? Math.min(1, cacheSavingsStandalone(leverContext, 1) / cacheWriteEst) : 0;

  const profiles: UserProfile[] = [];
  let hasCostCenters = false;
  for (let userId = 1; userId < userCount; userId++) {
    if (userTotals.rows[userId] > 0 && userTotals.costCenter[userId] !== -1) {
      hasCostCenters = true;
      break;
    }
  }

  let totalGross = 0;
  for (let userId = 1; userId < userCount; userId++) {
    if (userTotals.rows[userId] <= 0) continue;
    const gross = userTotals.gross[userId];
    totalGross += gross;
    const quota = userTotals.quotaMax[userId];

    let allotCredits = 0;
    let monthsWithRows = 0;
    let peakMonth = 0;
    for (let monthIndex = 0; monthIndex < nMonths; monthIndex++) {
      const monthGross = aggregates.userMonthGross[userId * nMonths + monthIndex];
      if (monthGross > 0) {
        monthsWithRows++;
        if (monthGross > peakMonth) peakMonth = monthGross;
      }
      allotCredits += aggregates.monthQuota[userId * nMonths + monthIndex];
    }
    if (allotCredits <= 0) allotCredits = fallbackQuotaCredits * Math.max(1, monthsWithRows);
    const allotment = allotCredits * CREDIT_USD;
    const utilization = allotment > 0 ? gross / allotment : 0;

    const globalFirst = prepared.userFirstDay[userId];
    const anchor = Math.max(globalFirst, scopeStart);
    const windowWorkdays = Math.max(MIN_WINDOW_WORKDAYS, workdaysBetween(anchor, scopeEnd));
    const activeDays = userTotals.activeDays[userId];
    const activeRate = Math.min(1, activeDays / windowWorkdays);
    const lastDay = userTotals.lastDay[userId];
    const daysSinceLast = Math.max(0, scopeEnd - lastDay);

    const isNew =
      scopeEnd - globalFirst + 1 <= settings.newUserDays && globalFirst - store.minDay >= settings.newUserDays;
    const lapsed = !isNew && daysSinceLast >= settings.lapsedDays;

    const tiers = settings.tiers;
    const tier: TierId =
      utilization >= tiers.power
        ? 'runaway'
        : utilization >= tiers.core
          ? 'power'
          : utilization >= tiers.light
            ? 'core'
            : utilization >= tiers.minimal
              ? 'light'
              : 'minimal';
    const engagementCutoffs = settings.engagement;
    const engagement: EngagementId =
      activeRate >= engagementCutoffs.daily ? 'daily' : activeRate >= engagementCutoffs.regular ? 'regular' : activeRate >= engagementCutoffs.occasional ? 'occasional' : 'rare';

    const frequent = activeRate >= engagementCutoffs.regular;
    const intense = utilization >= tiers.light;
    const persona: PersonaId =
      tier === 'runaway'
        ? 'runaway'
        : isNew
          ? 'new'
          : lapsed
            ? 'lapsed'
            : frequent && intense
              ? 'champion'
              : intense
                ? 'burst'
                : frequent
                  ? 'steady'
                  : 'dormant';

    const categoryShare = (categoryIndex: number) => (gross > 0 ? userTotals.tier[userId * CATEGORIES.length + categoryIndex] / gross : 0);
    const powerfulShare = categoryShare(0);
    const versatileShare = categoryShare(1);
    const lightweightShare = categoryShare(2);
    const profile: ProfileId =
      powerfulShare >= settings.frontierHeavy
        ? 'frontier'
        : versatileShare + lightweightShare >= settings.efficientShare
          ? 'efficient'
          : 'balanced';

    const prompt = userTotals.input[userId] + userTotals.cacheRead[userId] + userTotals.cacheWrite[userId];
    const cacheHit = prompt > 0 ? userTotals.cacheRead[userId] / prompt : Number.NaN;
    const autoShare = gross > 0 ? userTotals.autoGross[userId] / gross : 0;
    const auto = userAutoDiscount(userTotals, userId, autoRates);
    const directBilled = Math.max(0, gross - userTotals.autoGross[userId]);
    const autoUse: AutoUseId = modelsKnown && gross > 0 ? autoUseOf(autoShare, settings) : 'unknown';
    const longShare = gross > 0 ? userTotals.longPremium[userId] / gross : 0;
    const peak = userTotals.peakDay[userId];
    const peakShare = gross > 0 ? peak / gross : 0;
    const recent = userTotals.recent[userId];
    const prior = userTotals.prior[userId];
    const trend = prior > 0 ? recent / prior - 1 : Number.NaN;

    let modelCount = 0;
    let topModelId = -1;
    let topModelGross = 0;
    if (aggregates.userModel) {
      const base = userId * modelIdCount;
      for (let modelId = 0; modelId < modelIdCount; modelId++) {
        const modelGross = aggregates.userModel[base + modelId];
        if (modelGross > 0) {
          modelCount++;
          if (modelGross > topModelGross) {
            topModelGross = modelGross;
            topModelId = modelId;
          }
        }
      }
    }

    const traits: TraitId[] = [];
    const material = gross >= minSpend;
    const pricedShare = gross > 0 ? userTotals.pricedGross[userId] / gross : 0;
    if (material && pricedShare >= 0.5 && Number.isFinite(cacheHit) && cacheHit < settings.lowCacheHit) traits.push('lowCache');
    if (material && longShare >= settings.longContextShare) traits.push('longContext');
    if (material && activeDays >= 3 && peakShare >= settings.spikeShare) traits.push('spiky');
    if (material && autoShare < settings.lowAuto && modelsKnown) traits.push('lowAuto');
    if (modelCount >= 4) traits.push('multiModel');
    if (trendReliable && recent >= minSpend && (prior <= 0 ? !isNew : recent >= 1.5 * prior)) traits.push('accelerating');
    if (trendReliable && prior > 0 && prior >= minSpend && recent <= 0.5 * prior) traits.push('fading');
    if (hasCostCenters && userTotals.costCenter[userId] === -1) traits.push('noCostCenter');

    // Optimization potential at the default lever settings (sequential, so levers never double count).
    let modelShift = 0;
    if (aggregates.userModel) {
      const base = userId * modelIdCount;
      for (let modelId = 0; modelId < modelIdCount; modelId++) {
        const ratio = shiftRatio[modelId];
        if (ratio < 1) modelShift += aggregates.userModel[base + modelId] * (1 - ratio);
      }
    } else {
      modelShift = userTotals.tier[userId * CATEGORIES.length] * fullSavePerGross;
    }
    const standalone: Record<LeverStep['id'], number> = {
      modelShift: modelShift * levers.modelShift,
      autoAdoption: modelsKnown ? directBilled * levers.autoAdoption * rateForPlan(autoRates, quota) : 0,
      cacheDiscipline: userTotals.estCw[userId] * levers.cacheDiscipline * cacheK,
      contextHygiene: (userTotals.estIn[userId] + userTotals.estCr[userId] + userTotals.estCw[userId]) * levers.contextHygiene,
      longContext: userTotals.longPremium[userId] * levers.longContext,
      capRunaway: Math.max(0, gross - levers.capUtil * allotment) * levers.capRunaway,
    };
    const { steps, total } = applyLevers(gross, standalone, LEVER_META, LEVER_ORDER);
    const potentialBy = {} as Record<LeverStep['id'], number>;
    for (const step of steps) potentialBy[step.id] = step.savings;
    const potential = Math.min(total, gross);

    const orgId = userTotals.org[userId];
    const costCenterId = userTotals.costCenter[userId];
    profiles.push({
      id: userId,
      name: users[userId],
      org: orgId >= 0 ? orgs[orgId] : '',
      orgMixed: userTotals.orgMixed[userId] === 1,
      costCenter: costCenterId >= 0 ? costCenters[costCenterId] : '',
      costCenterMixed: userTotals.costCenterMixed[userId] === 1,
      plan: planLabel(quota),
      quotaCredits: quota,
      allotment,
      rows: userTotals.rows[userId],
      gross,
      discount: userTotals.discount[userId],
      net: userTotals.net[userId],
      credits: userTotals.credits[userId],
      share: 0,
      cumShare: 0,
      rank: 0,
      firstDay: userTotals.firstDay[userId],
      lastDay,
      globalFirstDay: globalFirst,
      activeDays,
      windowWorkdays,
      activeRate,
      daysSinceLast,
      utilization,
      balance: allotment - gross,
      tier,
      engagement,
      isNew,
      lapsed,
      persona,
      profile,
      pareto: 'C',
      traits,
      autoShare,
      powerfulShare,
      versatileShare,
      lightweightShare,
      cacheHit,
      longShare,
      peakDay: peak,
      peakDayIdx: userTotals.peakDayIdx[userId],
      peakShare,
      recent,
      prior,
      trend,
      costPerActiveDay: activeDays > 0 ? gross / activeDays : Number.NaN,
      topModel: topModelId >= 0 ? modelNames[topModelId] : '',
      topModelShare: gross > 0 ? topModelGross / gross : 0,
      modelCount,
      input: userTotals.input[userId],
      output: userTotals.output[userId],
      cacheRead: userTotals.cacheRead[userId],
      cacheWrite: userTotals.cacheWrite[userId],
      tokens: userTotals.input[userId] + userTotals.output[userId] + userTotals.cacheRead[userId] + userTotals.cacheWrite[userId],
      costInput: userTotals.estIn[userId],
      costCacheRead: userTotals.estCr[userId],
      costCacheWrite: userTotals.estCw[userId],
      costOutput: userTotals.estOut[userId],
      tokenCoverage: gross > 0 ? Math.min(1, userTotals.pricedGross[userId] / gross) : 0,
      auto,
      directBilled,
      autoMissed: modelsKnown ? userMissedDiscount(userTotals, userId, autoRates) : 0,
      autoUse,
      peakMonthGross: peakMonth,
      potential,
      potentialBy,
      efficiency: gross > 0 ? Math.max(0, Math.min(100, 100 * (1 - potential / gross))) : 100,
      license: licenseIndex === null ? null : profileLicense(users[userId], licenseIndex, settings.newUserDays),
    });
  }

  // Rank and Pareto classes: class is decided by the cumulative share *before* adding the user,
  // so the user who crosses the cutoff still belongs to the higher class.
  profiles.sort((a, b) => b.gross - a.gross || a.name.localeCompare(b.name));
  let cumulativeGross = 0;
  profiles.forEach((user, index) => {
    user.rank = index + 1;
    const before = totalGross > 0 ? cumulativeGross / totalGross : 0;
    user.pareto = before < settings.pareto.a ? 'A' : before < settings.pareto.b ? 'B' : 'C';
    cumulativeGross += user.gross;
    user.share = totalGross > 0 ? user.gross / totalGross : 0;
    user.cumShare = totalGross > 0 ? cumulativeGross / totalGross : 0;
  });

  const { byId, groups, totals, poolFlow } = summarizeProfiles(profiles);

  const known = new Set(users.map((login) => login.toLowerCase()));
  const inactive: InactiveSeat[] = [];
  for (const entry of uniqueRoster(settings.roster)) {
    if (known.has(entry.user.trim().toLowerCase())) continue;
    const seat: InactiveSeat = { user: entry.user.trim(), plan: entry.plan ?? null };
    if (licenseIndex !== null) seat.license = entryLicense(entry, licenseIndex, settings.newUserDays);
    inactive.push(seat);
  }

  return { profiles, byId, groups, inactive, totals, poolFlow, hasCostCenters, trendReliable, fallbackQuotaCredits };
}

/** Whether a user passes the post-filters (segments, tiers, engagement, profile, traits, Pareto, Auto use, spend). */
export function userPassesFilters(user: UserProfile, filters: Filters): boolean {
  if (filters.segments.length && !filters.segments.includes(user.persona)) return false;
  if (filters.tiers.length && !filters.tiers.includes(user.tier)) return false;
  if (filters.engagement.length) {
    const ok = filters.engagement.some((engagement) => engagement === user.engagement || (engagement === 'new' && user.isNew) || (engagement === 'lapsed' && user.lapsed));
    if (!ok) return false;
  }
  if (filters.profiles.length && !filters.profiles.includes(user.profile)) return false;
  if (filters.traits.length && !filters.traits.some((trait) => user.traits.includes(trait as TraitId))) return false;
  if (filters.paretoClasses.length && !filters.paretoClasses.includes(user.pareto)) return false;
  if (filters.autoUse.length && !filters.autoUse.includes(user.autoUse)) return false;
  if (filters.minUserSpend !== null && user.gross < filters.minUserSpend) return false;
  if (filters.maxUserSpend !== null && user.gross > filters.maxUserSpend) return false;
  return true;
}

/** Marks the users that pass the post-filters; unattributed (blank-user) rows are only kept when no post-filter is set. */
export function allowedUsers(set: UserSet, filters: Filters, nUsers: number): Uint8Array {
  const allowed = new Uint8Array(nUsers);
  for (const user of set.profiles) if (userPassesFilters(user, filters)) allowed[user.id] = 1;
  return allowed;
}

export { BLANK_ID };
