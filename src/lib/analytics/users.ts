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
  const o = {} as Record<K, GroupStat>;
  for (const k of keys) o[k] = emptyGroup();
  return o;
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
  const add = (g: GroupStat, p: UserProfile) => {
    g.users++;
    g.gross += p.gross;
    g.net += p.net;
    g.potential += p.potential;
    g.allotment += p.allotment;
  };
  const byId = new Map<number, UserProfile>();
  for (const p of profiles) {
    byId.set(p.id, p);
    add(totals, p);
    add(groups.persona[p.persona], p);
    add(groups.tier[p.tier], p);
    add(groups.engagement[p.engagement], p);
    if (p.isNew) add(groups.lifecycle.new, p);
    if (p.lapsed) add(groups.lifecycle.lapsed, p);
    add(groups.profile[p.profile], p);
    add(groups.pareto[p.pareto], p);
    add(groups.autoUse[p.autoUse], p);
    for (const t of p.traits) add(groups.trait[t], p);
    if (p.balance < 0) {
      poolFlow.takers++;
      poolFlow.takenUsd += -p.balance;
    } else if (p.balance > 0) {
      poolFlow.lenders++;
      poolFlow.lentUsd += p.balance;
    }
  }
  return { byId, groups, totals, poolFlow };
}

export function buildProfiles(
  store: DataStore,
  prep: Prepared,
  models: ModelTable,
  agg: Aggregates,
  settings: Settings,
): UserSet {
  const ua = agg.userAcc;
  // Without a model column every row looks hand-picked, so Auto-based traits and potential would be made up.
  const modelsKnown = dataCoverage(store).models;
  const autoRates = buildAutoRates(agg, settings.autoDiscount);
  const nU = store.dicts.user.values.length;
  const nM = agg.nModels;
  const nMonths = agg.nMonths;
  const users = store.dicts.user.values;
  const orgs = store.dicts.org.values;
  const ccs = store.dicts.costCenter.values;
  const modelNames = store.dicts.model.values;
  const scopeStart = agg.range.start;
  const scopeEnd = agg.range.end;
  const trendReliable = agg.range.length >= 14;
  const fallbackQuotaCredits = defaultQuotaCredits(agg);
  const minSpend = settings.minSpendForTraits;
  const levers = DEFAULT_LEVERS;
  const ctx: LeverContext = { agg, models, settings, autoRates };
  const licenseIndex = buildLicenseIndex(settings.roster, settings.rosterAsOf);

  const { ratio: shiftRatio, rows: shiftRows } = modelShiftRatios(ctx, levers.target);
  const powerfulGross = shiftRows.reduce((a, r) => a + r.gross, 0);
  const fullSavePerGross = powerfulGross > 0 ? shiftRows.reduce((a, r) => a + r.savingsAtFull, 0) / powerfulGross : 0;
  const cacheWriteEst = agg.totals.est.cacheWrite;
  const cacheK = cacheWriteEst > 0 ? Math.min(1, cacheSavingsStandalone(ctx, 1) / cacheWriteEst) : 0;

  const profiles: UserProfile[] = [];
  let hasCostCenters = false;
  for (let u = 1; u < nU; u++) {
    if (ua.rows[u] > 0 && ua.costCenter[u] !== -1) {
      hasCostCenters = true;
      break;
    }
  }

  let totalGross = 0;
  for (let u = 1; u < nU; u++) {
    if (ua.rows[u] <= 0) continue;
    const gross = ua.gross[u];
    totalGross += gross;
    const quota = ua.quotaMax[u];

    let allotCredits = 0;
    let monthsWithRows = 0;
    let peakMonth = 0;
    for (let s = 0; s < nMonths; s++) {
      const mg = agg.userMonthGross[u * nMonths + s];
      if (mg > 0) {
        monthsWithRows++;
        if (mg > peakMonth) peakMonth = mg;
      }
      allotCredits += agg.monthQuota[u * nMonths + s];
    }
    if (allotCredits <= 0) allotCredits = fallbackQuotaCredits * Math.max(1, monthsWithRows);
    const allotment = allotCredits * CREDIT_USD;
    const utilization = allotment > 0 ? gross / allotment : 0;

    const globalFirst = prep.userFirstDay[u];
    const anchor = Math.max(globalFirst, scopeStart);
    const windowWorkdays = Math.max(MIN_WINDOW_WORKDAYS, workdaysBetween(anchor, scopeEnd));
    const activeDays = ua.activeDays[u];
    const activeRate = Math.min(1, activeDays / windowWorkdays);
    const lastDay = ua.lastDay[u];
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
    const eng = settings.engagement;
    const engagement: EngagementId =
      activeRate >= eng.daily ? 'daily' : activeRate >= eng.regular ? 'regular' : activeRate >= eng.occasional ? 'occasional' : 'rare';

    const freq = activeRate >= eng.regular;
    const intense = utilization >= tiers.light;
    const persona: PersonaId =
      tier === 'runaway'
        ? 'runaway'
        : isNew
          ? 'new'
          : lapsed
            ? 'lapsed'
            : freq && intense
              ? 'champion'
              : intense
                ? 'burst'
                : freq
                  ? 'steady'
                  : 'dormant';

    const tg = (c: number) => (gross > 0 ? ua.tier[u * CATEGORIES.length + c] / gross : 0);
    const powerfulShare = tg(0);
    const versatileShare = tg(1);
    const lightweightShare = tg(2);
    const profile: ProfileId =
      powerfulShare >= settings.frontierHeavy
        ? 'frontier'
        : versatileShare + lightweightShare >= settings.efficientShare
          ? 'efficient'
          : 'balanced';

    const prompt = ua.input[u] + ua.cacheRead[u] + ua.cacheWrite[u];
    const cacheHit = prompt > 0 ? ua.cacheRead[u] / prompt : Number.NaN;
    const autoShare = gross > 0 ? ua.autoGross[u] / gross : 0;
    const auto = userAutoDiscount(ua, u, autoRates);
    const directBilled = Math.max(0, gross - ua.autoGross[u]);
    const autoUse: AutoUseId = modelsKnown && gross > 0 ? autoUseOf(autoShare, settings) : 'unknown';
    const longShare = gross > 0 ? ua.longPremium[u] / gross : 0;
    const peak = ua.peakDay[u];
    const peakShare = gross > 0 ? peak / gross : 0;
    const recent = ua.recent[u];
    const prior = ua.prior[u];
    const trend = prior > 0 ? recent / prior - 1 : Number.NaN;

    let modelCount = 0;
    let topM = -1;
    let topG = 0;
    if (agg.userModel) {
      const base = u * nM;
      for (let m = 0; m < nM; m++) {
        const v = agg.userModel[base + m];
        if (v > 0) {
          modelCount++;
          if (v > topG) {
            topG = v;
            topM = m;
          }
        }
      }
    }

    const traits: TraitId[] = [];
    const material = gross >= minSpend;
    const pricedShare = gross > 0 ? ua.pricedGross[u] / gross : 0;
    if (material && pricedShare >= 0.5 && Number.isFinite(cacheHit) && cacheHit < settings.lowCacheHit) traits.push('lowCache');
    if (material && longShare >= settings.longContextShare) traits.push('longContext');
    if (material && activeDays >= 3 && peakShare >= settings.spikeShare) traits.push('spiky');
    if (material && autoShare < settings.lowAuto && modelsKnown) traits.push('lowAuto');
    if (modelCount >= 4) traits.push('multiModel');
    if (trendReliable && recent >= minSpend && (prior <= 0 ? !isNew : recent >= 1.5 * prior)) traits.push('accelerating');
    if (trendReliable && prior > 0 && prior >= minSpend && recent <= 0.5 * prior) traits.push('fading');
    if (hasCostCenters && ua.costCenter[u] === -1) traits.push('noCostCenter');

    // Optimization potential at the default lever settings (sequential, so levers never double count).
    let modelShift = 0;
    if (agg.userModel) {
      const base = u * nM;
      for (let m = 0; m < nM; m++) {
        const r = shiftRatio[m];
        if (r < 1) modelShift += agg.userModel[base + m] * (1 - r);
      }
    } else {
      modelShift = ua.tier[u * CATEGORIES.length] * fullSavePerGross;
    }
    const standalone: Record<LeverStep['id'], number> = {
      modelShift: modelShift * levers.modelShift,
      autoAdoption: modelsKnown ? directBilled * levers.autoAdoption * rateForPlan(autoRates, quota) : 0,
      cacheDiscipline: ua.estCw[u] * levers.cacheDiscipline * cacheK,
      contextHygiene: (ua.estIn[u] + ua.estCr[u] + ua.estCw[u]) * levers.contextHygiene,
      longContext: ua.longPremium[u] * levers.longContext,
      capRunaway: Math.max(0, gross - levers.capUtil * allotment) * levers.capRunaway,
    };
    const { steps, total } = applyLevers(gross, standalone, LEVER_META, LEVER_ORDER);
    const potentialBy = {} as Record<LeverStep['id'], number>;
    for (const st of steps) potentialBy[st.id] = st.savings;
    const potential = Math.min(total, gross);

    const orgId = ua.org[u];
    const ccId = ua.costCenter[u];
    profiles.push({
      id: u,
      name: users[u],
      org: orgId >= 0 ? orgs[orgId] : '',
      orgMixed: ua.orgMixed[u] === 1,
      costCenter: ccId >= 0 ? ccs[ccId] : '',
      costCenterMixed: ua.costCenterMixed[u] === 1,
      plan: planLabel(quota),
      quotaCredits: quota,
      allotment,
      rows: ua.rows[u],
      gross,
      discount: ua.discount[u],
      net: ua.net[u],
      credits: ua.credits[u],
      share: 0,
      cumShare: 0,
      rank: 0,
      firstDay: ua.firstDay[u],
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
      peakDayIdx: ua.peakDayIdx[u],
      peakShare,
      recent,
      prior,
      trend,
      costPerActiveDay: activeDays > 0 ? gross / activeDays : Number.NaN,
      topModel: topM >= 0 ? modelNames[topM] : '',
      topModelShare: gross > 0 ? topG / gross : 0,
      modelCount,
      input: ua.input[u],
      output: ua.output[u],
      cacheRead: ua.cacheRead[u],
      cacheWrite: ua.cacheWrite[u],
      tokens: ua.input[u] + ua.output[u] + ua.cacheRead[u] + ua.cacheWrite[u],
      costInput: ua.estIn[u],
      costCacheRead: ua.estCr[u],
      costCacheWrite: ua.estCw[u],
      costOutput: ua.estOut[u],
      tokenCoverage: gross > 0 ? Math.min(1, ua.pricedGross[u] / gross) : 0,
      auto,
      directBilled,
      autoMissed: modelsKnown ? userMissedDiscount(ua, u, autoRates) : 0,
      autoUse,
      peakMonthGross: peakMonth,
      potential,
      potentialBy,
      efficiency: gross > 0 ? Math.max(0, Math.min(100, 100 * (1 - potential / gross))) : 100,
      license: licenseIndex === null ? null : profileLicense(users[u], licenseIndex, settings.newUserDays),
    });
  }

  // Rank and Pareto classes: class is decided by the cumulative share *before* adding the user,
  // so the user who crosses the cutoff still belongs to the higher class.
  profiles.sort((a, b) => b.gross - a.gross || a.name.localeCompare(b.name));
  let cum = 0;
  profiles.forEach((p, i) => {
    p.rank = i + 1;
    const before = totalGross > 0 ? cum / totalGross : 0;
    p.pareto = before < settings.pareto.a ? 'A' : before < settings.pareto.b ? 'B' : 'C';
    cum += p.gross;
    p.share = totalGross > 0 ? p.gross / totalGross : 0;
    p.cumShare = totalGross > 0 ? cum / totalGross : 0;
  });

  const { byId, groups, totals, poolFlow } = summarizeProfiles(profiles);

  const known = new Set(users.map((x) => x.toLowerCase()));
  const inactive: InactiveSeat[] = [];
  for (const r of uniqueRoster(settings.roster)) {
    if (known.has(r.user.trim().toLowerCase())) continue;
    const seat: InactiveSeat = { user: r.user.trim(), plan: r.plan ?? null };
    if (licenseIndex !== null) seat.license = entryLicense(r, licenseIndex, settings.newUserDays);
    inactive.push(seat);
  }

  return { profiles, byId, groups, inactive, totals, poolFlow, hasCostCenters, trendReliable, fallbackQuotaCredits };
}

/** Whether a user passes the post-filters (segments, tiers, engagement, profile, traits, Pareto, Auto use, spend). */
export function userPassesFilters(p: UserProfile, f: Filters): boolean {
  if (f.segments.length && !f.segments.includes(p.persona)) return false;
  if (f.tiers.length && !f.tiers.includes(p.tier)) return false;
  if (f.engagement.length) {
    const ok = f.engagement.some((e) => e === p.engagement || (e === 'new' && p.isNew) || (e === 'lapsed' && p.lapsed));
    if (!ok) return false;
  }
  if (f.profiles.length && !f.profiles.includes(p.profile)) return false;
  if (f.traits.length && !f.traits.some((t) => p.traits.includes(t as TraitId))) return false;
  if (f.paretoClasses.length && !f.paretoClasses.includes(p.pareto)) return false;
  if (f.autoUse.length && !f.autoUse.includes(p.autoUse)) return false;
  if (f.minUserSpend !== null && p.gross < f.minUserSpend) return false;
  if (f.maxUserSpend !== null && p.gross > f.maxUserSpend) return false;
  return true;
}

/** Marks the users that pass the post-filters; unattributed (blank-user) rows are only kept when no post-filter is set. */
export function allowedUsers(set: UserSet, f: Filters, nUsers: number): Uint8Array {
  const allowed = new Uint8Array(nUsers);
  for (const p of set.profiles) if (userPassesFilters(p, f)) allowed[p.id] = 1;
  return allowed;
}

export { BLANK_ID };
