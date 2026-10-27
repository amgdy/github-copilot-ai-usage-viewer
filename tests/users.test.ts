import { beforeAll, describe, expect, it } from 'vitest';
import type { Analysis } from '../src/lib/analytics/analyze';
import { emptyFilters, type Filters } from '../src/lib/analytics/filters';
import { LEVER_ORDER } from '../src/lib/analytics/levers';
import { DOCS } from '../src/lib/analytics/recommendations';
import { mergeSettings, type Settings } from '../src/lib/analytics/settings';
import { buildTaxonomy } from '../src/lib/analytics/taxonomy';
import { PLAYBOOK, userActionRows, userTips, type UserTip } from '../src/lib/analytics/tips';
import { activityStatusText } from '../src/lib/licenses/labels';
import type { ProfileLicense } from '../src/lib/licenses';
import {
  SEAT_STATUS_ORDER,
  SEAT_STATUS_TONE,
  licenseDay,
  seatPlanLabel,
  seatStatusHint,
  seatStatusLabel,
  seatStatusOf,
} from '../src/components/user/license';
import { licenseColumns } from '../src/pages/users/licenseColumns';
import {
  ENGAGEMENT_IDS,
  LIFECYCLE_IDS,
  PARETO_IDS,
  PERSONA_IDS,
  PROFILE_IDS,
  TIER_IDS,
  TRAIT_IDS,
  allowedUsers,
  summarizeProfiles,
  userPassesFilters,
  type GroupStat,
  type UserProfile,
  type UserSet,
} from '../src/lib/analytics/users';
import { PRICE_CARD } from '../src/lib/pricing/card';
import {
  BAD_TEXT,
  analyzeCsv,
  analyzeDemo,
  dayNum,
  isAutoRow,
  isoOf,
  makeCsv,
  modelOfRow,
  naiveRows,
  numOf,
  sum,
  weekdayOf,
  type NaiveRow,
  type Pipeline,
  type RowSpec,
} from './helpers';

type Cat = 'Powerful' | 'Versatile' | 'Lightweight' | 'Unknown';
const CARD_CATEGORY = new Map<string, Cat>(PRICE_CARD.map((pricedModel) => [pricedModel.name, pricedModel.category as Cat]));
const makeFilters = (over: Partial<Filters> = {}): Filters => ({ ...emptyFilters(), ...over });
type DemoPipeline = Awaited<ReturnType<typeof analyzeDemo>>;

// ---------------------------------------------------------------------------------------------
// Independent oracle: per-user statistics recomputed from the raw CSV rows.
// ---------------------------------------------------------------------------------------------

interface NaiveUser {
  name: string;
  rows: number;
  gross: number;
  discount: number;
  net: number;
  credits: number;
  first: number;
  last: number;
  quota: number;
  monthQuota: Map<string, number>;
  monthGross: Map<string, number>;
  dayGross: Map<number, number>;
  autoGross: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  models: Map<string, number>;
  cat: Record<Cat, number>;
  orgs: Set<string>;
  costCenters: Set<string>;
}

function naiveUsers(rows: NaiveRow[], from: number, to: number): Map<string, NaiveUser> {
  const out = new Map<string, NaiveUser>();
  for (const row of rows) {
    if (!row.username) continue;
    const day = dayNum(row.date);
    if (day < from || day > to) continue;
    let user = out.get(row.username);
    if (!user) {
      user = {
        name: row.username,
        rows: 0,
        gross: 0,
        discount: 0,
        net: 0,
        credits: 0,
        first: day,
        last: day,
        quota: 0,
        monthQuota: new Map(),
        monthGross: new Map(),
        dayGross: new Map(),
        autoGross: 0,
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        models: new Map(),
        cat: { Powerful: 0, Versatile: 0, Lightweight: 0, Unknown: 0 },
        orgs: new Set(),
        costCenters: new Set(),
      };
      out.set(row.username, user);
    }
    const gross = numOf(row, 'gross_amount');
    user.rows++;
    user.gross += gross;
    user.discount += numOf(row, 'discount_amount');
    user.net += numOf(row, 'net_amount');
    user.credits += numOf(row, 'quantity');
    user.first = Math.min(user.first, day);
    user.last = Math.max(user.last, day);
    const quota = numOf(row, 'total_monthly_quota');
    user.quota = Math.max(user.quota, quota);
    const monthKey = row.date.slice(0, 7);
    user.monthQuota.set(monthKey, Math.max(user.monthQuota.get(monthKey) ?? 0, quota));
    user.monthGross.set(monthKey, (user.monthGross.get(monthKey) ?? 0) + gross);
    user.dayGross.set(day, (user.dayGross.get(day) ?? 0) + gross);
    if (isAutoRow(row)) user.autoGross += gross;
    user.input += numOf(row, 'input');
    user.output += numOf(row, 'output');
    user.cacheRead += numOf(row, 'cache_read');
    user.cacheWrite += numOf(row, 'cache_write');
    const model = modelOfRow(row);
    user.models.set(model, (user.models.get(model) ?? 0) + gross);
    user.cat[CARD_CATEGORY.get(model) ?? 'Unknown'] += gross;
    if (row.organization) user.orgs.add(row.organization);
    if (row.cost_center_name) user.costCenters.add(row.cost_center_name);
  }
  return out;
}

const workdays = (a: number, b: number): number => {
  let workdayCount = 0;
  for (let day = a; day <= b; day++) if (weekdayOf(isoOf(day)) < 5) workdayCount++;
  return workdayCount;
};

interface Ctx {
  settings: Settings;
  from: number;
  to: number;
  storeMin: number;
  globalFirst: Map<string, number>;
  fallbackQuota: number;
  hasCostCenters: boolean;
}

function contextOf(rows: NaiveRow[], settings: Settings, filters: Filters = emptyFilters()): Ctx {
  const days = rows.map((row) => dayNum(row.date));
  const storeMin = Math.min(...days);
  const storeMax = Math.max(...days);
  const from = Math.max(filters.dateFrom ?? storeMin, storeMin);
  const to = Math.min(filters.dateTo ?? storeMax, storeMax);
  const globalFirst = new Map<string, number>();
  for (const row of rows) {
    if (!row.username) continue;
    const day = dayNum(row.date);
    globalFirst.set(row.username, Math.min(globalFirst.get(row.username) ?? Infinity, day));
  }
  const inScope = naiveUsers(rows, from, to);
  const counts = new Map<number, number>();
  for (const user of inScope.values()) if (user.quota > 0) counts.set(user.quota, (counts.get(user.quota) ?? 0) + 1);
  let fallbackQuota = 1900;
  let best = 0;
  for (const [quota, userCount] of counts) {
    if (userCount > best) {
      best = userCount;
      fallbackQuota = quota;
    }
  }
  const hasCostCenters = [...inScope.values()].some((user) => user.costCenters.size > 0);
  return { settings, from, to, storeMin, globalFirst, fallbackQuota, hasCostCenters };
}

/** The documented classification rules, evaluated from the raw numbers of one user. */
function expectedOf(user: NaiveUser, context: Ctx) {
  const settings = context.settings;
  const credits = sum([...user.monthQuota.values()]);
  const monthsWithGross = [...user.monthGross.values()].filter((monthGross) => monthGross > 0).length;
  const allotCredits = credits > 0 ? credits : context.fallbackQuota * Math.max(1, monthsWithGross);
  const allotment = allotCredits * 0.01;
  const utilization = allotment > 0 ? user.gross / allotment : 0;
  const globalFirst = context.globalFirst.get(user.name)!;
  const windowWorkdays = Math.max(5, workdays(Math.max(globalFirst, context.from), context.to));
  const dayVals = [...user.dayGross.values()];
  const activeDays = dayVals.filter((dayGross) => dayGross >= settings.activeThreshold).length;
  const activeRate = Math.min(1, activeDays / windowWorkdays);
  const daysSinceLast = Math.max(0, context.to - user.last);
  const isNew = context.to - globalFirst + 1 <= settings.newUserDays && globalFirst - context.storeMin >= settings.newUserDays;
  const lapsed = !isNew && daysSinceLast >= settings.lapsedDays;
  const tiers = settings.tiers;
  const tier =
    utilization >= tiers.power ? 'runaway' : utilization >= tiers.core ? 'power' : utilization >= tiers.light ? 'core' : utilization >= tiers.minimal ? 'light' : 'minimal';
  const engagementCutoffs = settings.engagement;
  const engagement = activeRate >= engagementCutoffs.daily ? 'daily' : activeRate >= engagementCutoffs.regular ? 'regular' : activeRate >= engagementCutoffs.occasional ? 'occasional' : 'rare';
  const isFrequent = activeRate >= engagementCutoffs.regular;
  const intense = utilization >= tiers.light;
  const persona = tier === 'runaway' ? 'runaway' : isNew ? 'new' : lapsed ? 'lapsed' : isFrequent && intense ? 'champion' : intense ? 'burst' : isFrequent ? 'steady' : 'dormant';
  const powerfulShare = user.gross > 0 ? user.cat.Powerful / user.gross : 0;
  const versatileShare = user.gross > 0 ? user.cat.Versatile / user.gross : 0;
  const lightweightShare = user.gross > 0 ? user.cat.Lightweight / user.gross : 0;
  const profile = powerfulShare >= settings.frontierHeavy ? 'frontier' : versatileShare + lightweightShare >= settings.efficientShare ? 'efficient' : 'balanced';
  const prompt = user.input + user.cacheRead + user.cacheWrite;
  const cacheHit = prompt > 0 ? user.cacheRead / prompt : NaN;
  const autoShare = user.gross > 0 ? user.autoGross / user.gross : 0;
  const peak = Math.max(0, ...dayVals);
  const peakShare = user.gross > 0 ? peak / user.gross : 0;
  let recent = 0;
  let prior = 0;
  for (const [day, dayGross] of user.dayGross) {
    if (day >= context.to - 6) recent += dayGross;
    else if (day >= context.to - 13) prior += dayGross;
  }
  const trendReliable = context.to - context.from + 1 >= 14;
  const material = user.gross >= settings.minSpendForTraits;
  const traits = new Set<string>();
  if (material && autoShare < settings.lowAuto) traits.add('lowAuto');
  if (material && activeDays >= 3 && peakShare >= settings.spikeShare) traits.add('spiky');
  if (user.models.size >= 4) traits.add('multiModel');
  if (trendReliable && recent >= settings.minSpendForTraits && (prior <= 0 ? !isNew : recent >= 1.5 * prior)) traits.add('accelerating');
  if (trendReliable && prior >= settings.minSpendForTraits && recent <= 0.5 * prior) traits.add('fading');
  if (context.hasCostCenters && user.costCenters.size === 0) traits.add('noCostCenter');
  let top = '';
  let topGross = 0;
  let second = 0;
  for (const [model, modelGross] of user.models) {
    if (modelGross > topGross) {
      second = topGross;
      topGross = modelGross;
      top = model;
    } else if (modelGross > second) second = modelGross;
  }
  return {
    allotment,
    utilization,
    windowWorkdays,
    activeDays,
    activeRate,
    daysSinceLast,
    isNew,
    lapsed,
    tier,
    engagement,
    persona,
    profile,
    powerfulShare,
    versatileShare,
    lightweightShare,
    cacheHit,
    autoShare,
    peak,
    peakShare,
    recent,
    prior,
    traits,
    material,
    top,
    topUnique: topGross - second > 1e-3,
    peakMonthGross: Math.max(0, ...user.monthGross.values()),
  };
}

/** Compares every profile of an analysis with the oracle; returns the oracle users for further checks. */
function checkProfiles(analysis: Analysis, rows: NaiveRow[], context: Ctx): Map<string, NaiveUser> {
  const oracleUsers = naiveUsers(rows, context.from, context.to);
  const set = analysis.population;
  expect(set.profiles.map((profile) => profile.name).sort()).toEqual([...oracleUsers.keys()].sort());
  expect(set.fallbackQuotaCredits).toBe(context.fallbackQuota);
  expect(set.hasCostCenters).toBe(context.hasCostCenters);
  expect(set.trendReliable).toBe(context.to - context.from + 1 >= 14);
  for (const profile of set.profiles) {
    const user = oracleUsers.get(profile.name)!;
    const expected = expectedOf(user, context);
    const fieldLabel = (field: string) => `${profile.name}.${field}`;
    expect(profile.rows, fieldLabel('rows')).toBe(user.rows);
    expect(profile.gross, fieldLabel('gross')).toBeCloseTo(user.gross, 6);
    expect(profile.discount, fieldLabel('discount')).toBeCloseTo(user.discount, 6);
    expect(profile.net, fieldLabel('net')).toBeCloseTo(user.net, 6);
    expect(profile.credits, fieldLabel('credits')).toBeCloseTo(user.credits, 4);
    expect(profile.firstDay, fieldLabel('firstDay')).toBe(user.first);
    expect(profile.lastDay, fieldLabel('lastDay')).toBe(user.last);
    expect(profile.globalFirstDay, fieldLabel('globalFirstDay')).toBe(context.globalFirst.get(profile.name));
    expect(profile.quotaCredits, fieldLabel('quota')).toBe(user.quota);
    expect(profile.allotment, fieldLabel('allotment')).toBeCloseTo(expected.allotment, 9);
    expect(profile.utilization, fieldLabel('utilization')).toBeCloseTo(expected.utilization, 9);
    expect(profile.balance, fieldLabel('balance')).toBeCloseTo(expected.allotment - user.gross, 9);
    expect(profile.windowWorkdays, fieldLabel('windowWorkdays')).toBe(expected.windowWorkdays);
    expect(profile.activeDays, fieldLabel('activeDays')).toBe(expected.activeDays);
    expect(profile.activeRate, fieldLabel('activeRate')).toBeCloseTo(expected.activeRate, 9);
    expect(profile.daysSinceLast, fieldLabel('daysSinceLast')).toBe(expected.daysSinceLast);
    expect(profile.isNew, fieldLabel('isNew')).toBe(expected.isNew);
    expect(profile.lapsed, fieldLabel('lapsed')).toBe(expected.lapsed);
    expect(profile.tier, fieldLabel('tier')).toBe(expected.tier);
    expect(profile.engagement, fieldLabel('engagement')).toBe(expected.engagement);
    expect(profile.persona, fieldLabel('persona')).toBe(expected.persona);
    expect(profile.profile, fieldLabel('profile')).toBe(expected.profile);
    expect(profile.powerfulShare, fieldLabel('powerfulShare')).toBeCloseTo(expected.powerfulShare, 9);
    expect(profile.versatileShare, fieldLabel('versatileShare')).toBeCloseTo(expected.versatileShare, 9);
    expect(profile.lightweightShare, fieldLabel('lightweightShare')).toBeCloseTo(expected.lightweightShare, 9);
    expect(profile.autoShare, fieldLabel('autoShare')).toBeCloseTo(expected.autoShare, 9);
    if (Number.isNaN(expected.cacheHit)) expect(profile.cacheHit, fieldLabel('cacheHit')).toBeNaN();
    else expect(profile.cacheHit, fieldLabel('cacheHit')).toBeCloseTo(expected.cacheHit, 9);
    expect(profile.peakDay, fieldLabel('peakDay')).toBeCloseTo(expected.peak, 9);
    expect(profile.peakShare, fieldLabel('peakShare')).toBeCloseTo(expected.peakShare, 9);
    expect(profile.recent, fieldLabel('recent')).toBeCloseTo(expected.recent, 9);
    expect(profile.prior, fieldLabel('prior')).toBeCloseTo(expected.prior, 9);
    if (expected.prior > 0) expect(profile.trend, fieldLabel('trend')).toBeCloseTo(expected.recent / expected.prior - 1, 9);
    else expect(profile.trend, fieldLabel('trend')).toBeNaN();
    if (expected.activeDays > 0) expect(profile.costPerActiveDay, fieldLabel('costPerActiveDay')).toBeCloseTo(user.gross / expected.activeDays, 9);
    else expect(profile.costPerActiveDay, fieldLabel('costPerActiveDay')).toBeNaN();
    expect(profile.modelCount, fieldLabel('modelCount')).toBe([...user.models.values()].filter((modelGross) => modelGross > 0).length);
    if (expected.topUnique) expect(profile.topModel, fieldLabel('topModel')).toBe(expected.top);
    expect(profile.topModelShare, fieldLabel('topModelShare')).toBeCloseTo(Math.max(...user.models.values()) / user.gross, 5);
    expect(profile.input).toBeCloseTo(user.input, 6);
    expect(profile.output).toBeCloseTo(user.output, 6);
    expect(profile.cacheRead).toBeCloseTo(user.cacheRead, 6);
    expect(profile.cacheWrite).toBeCloseTo(user.cacheWrite, 6);
    expect(profile.peakMonthGross, fieldLabel('peakMonthGross')).toBeCloseTo(expected.peakMonthGross, 9);
    expect(profile.orgMixed, fieldLabel('orgMixed')).toBe(user.orgs.size > 1);
    if (user.orgs.size === 1) expect(profile.org, fieldLabel('org')).toBe([...user.orgs][0]);
    else if (user.orgs.size > 1) expect([...user.orgs], fieldLabel('org')).toContain(profile.org);
    expect(profile.costCenterMixed, fieldLabel('costCenterMixed')).toBe(user.costCenters.size > 1);
    if (user.costCenters.size === 1) expect(profile.costCenter, fieldLabel('costCenter')).toBe([...user.costCenters][0]);
    if (user.costCenters.size === 0) expect(profile.costCenter, fieldLabel('costCenter')).toBe('');
    expect(profile.plan, fieldLabel('plan')).toBe(user.quota === 1900 ? 'Business' : user.quota === 3900 ? 'Enterprise' : user.quota <= 0 ? 'No quota' : profile.plan);

    // Traits that can be derived from the raw rows alone must match in both directions.
    const independent = ['lowAuto', 'spiky', 'multiModel', 'accelerating', 'fading', 'noCostCenter'];
    expect(new Set(profile.traits.filter((trait) => independent.includes(trait))), fieldLabel('traits')).toEqual(expected.traits);
    // These two depend on the price card, so they are checked against the profile's own numbers.
    expect(profile.traits.includes('longContext'), fieldLabel('longContext')).toBe(expected.material && profile.longShare >= context.settings.longContextShare);
    if (profile.traits.includes('lowCache')) {
      expect(expected.material, fieldLabel('lowCache material')).toBe(true);
      expect(expected.cacheHit, fieldLabel('lowCache')).toBeLessThan(context.settings.lowCacheHit);
    }
    expect(new Set(profile.traits).size, fieldLabel('traits unique')).toBe(profile.traits.length);
    for (const trait of profile.traits) expect(TRAIT_IDS, fieldLabel('trait id')).toContain(trait);
  }
  return oracleUsers;
}

/** Rank, share, cumulative share and Pareto class recomputed from the oracle. */
function checkRanking(set: UserSet, oracleUsers: Map<string, NaiveUser>, pareto: { a: number; b: number }) {
  const order = [...oracleUsers.values()].sort((a, b) => b.gross - a.gross || a.name.localeCompare(b.name));
  expect(set.profiles.map((profile) => profile.name)).toEqual(order.map((user) => user.name));
  const total = sum(order.map((user) => user.gross));
  let cumulativeGross = 0;
  order.forEach((user, index) => {
    const profile = set.profiles[index];
    const before = total > 0 ? cumulativeGross / total : 0;
    cumulativeGross += user.gross;
    expect(profile.rank).toBe(index + 1);
    expect(profile.share).toBeCloseTo(user.gross / total, 9);
    expect(profile.cumShare).toBeCloseTo(cumulativeGross / total, 9);
    expect(profile.pareto, `${profile.name} pareto (cum before ${before})`).toBe(before < pareto.a ? 'A' : before < pareto.b ? 'B' : 'C');
  });
}

const EXCLUSIVE = [
  { dim: 'persona', ids: PERSONA_IDS },
  { dim: 'tier', ids: TIER_IDS },
  { dim: 'engagement', ids: ENGAGEMENT_IDS },
  { dim: 'profile', ids: PROFILE_IDS },
  { dim: 'pareto', ids: PARETO_IDS },
] as const;

/** Group totals must equal the sums over the member profiles. */
function checkGroups(set: UserSet) {
  const profiles = set.profiles;
  const close = (group: GroupStat, members: UserProfile[], label: string) => {
    expect(group.users, `${label}.users`).toBe(members.length);
    expect(group.gross, `${label}.gross`).toBeCloseTo(sum(members.map((member) => member.gross)), 8);
    expect(group.net, `${label}.net`).toBeCloseTo(sum(members.map((member) => member.net)), 8);
    expect(group.potential, `${label}.potential`).toBeCloseTo(sum(members.map((member) => member.potential)), 8);
    expect(group.allotment, `${label}.allotment`).toBeCloseTo(sum(members.map((member) => member.allotment)), 8);
  };
  close(set.totals, profiles, 'totals');
  for (const { dim: dimension, ids } of EXCLUSIVE) {
    const groups = set.groups[dimension] as Record<string, GroupStat>;
    expect(Object.keys(groups).sort()).toEqual([...ids].sort());
    for (const id of ids) close(groups[id], profiles.filter((profile) => profile[dimension] === id), `${dimension}.${id}`);
    expect(sum(ids.map((id) => groups[id].users)), `${dimension} partition`).toBe(profiles.length);
    expect(sum(ids.map((id) => groups[id].gross)), `${dimension} gross partition`).toBeCloseTo(set.totals.gross, 8);
  }
  close(set.groups.lifecycle.new, profiles.filter((profile) => profile.isNew), 'lifecycle.new');
  close(set.groups.lifecycle.lapsed, profiles.filter((profile) => profile.lapsed), 'lifecycle.lapsed');
  expect(Object.keys(set.groups.lifecycle).sort()).toEqual([...LIFECYCLE_IDS].sort());
  for (const trait of TRAIT_IDS) close(set.groups.trait[trait], profiles.filter((profile) => profile.traits.includes(trait)), `trait.${trait}`);
  const takers = profiles.filter((profile) => profile.balance < 0);
  const lenders = profiles.filter((profile) => profile.balance > 0);
  expect(set.poolFlow.takers).toBe(takers.length);
  expect(set.poolFlow.lenders).toBe(lenders.length);
  expect(set.poolFlow.takenUsd).toBeCloseTo(-sum(takers.map((taker) => taker.balance)), 8);
  expect(set.poolFlow.lentUsd).toBeCloseTo(sum(lenders.map((lender) => lender.balance)), 8);
  expect(set.poolFlow.lentUsd - set.poolFlow.takenUsd).toBeCloseTo(set.totals.allotment - set.totals.gross, 8);
  expect(set.byId.size).toBe(profiles.length);
  for (const profile of profiles) expect(set.byId.get(profile.id)).toBe(profile);
}

// ---------------------------------------------------------------------------------------------
// Demo dataset
// ---------------------------------------------------------------------------------------------

describe('user profiles on the demo dataset', () => {
  let pipeline: DemoPipeline;
  let rows: NaiveRow[];
  beforeAll(async () => {
    pipeline = await analyzeDemo();
    rows = naiveRows(pipeline.demo.csv);
  });

  it('profiles every named user once, with no profile for unattributed rows', () => {
    const named = new Set(rows.map((row) => row.username).filter(Boolean));
    const set = pipeline.analysis.population;
    expect(set.profiles.length).toBe(named.size);
    expect(new Set(set.profiles.map((profile) => profile.name)).size).toBe(named.size);
    expect(set.profiles.some((profile) => profile.name === '' || profile.id === 0)).toBe(false);
    expect(pipeline.analysis.users).toBe(pipeline.analysis.population);
    expect(pipeline.analysis.segmentFiltered).toBe(false);
  });

  it('every field matches an independent recomputation from the raw rows', () => {
    const context = contextOf(rows, pipeline.settings);
    const oracleUsers = checkProfiles(pipeline.analysis, rows, context);
    checkRanking(pipeline.analysis.population, oracleUsers, pipeline.settings.pareto);
  });

  it('a date-scoped analysis (last 20 days) is recomputed for that window only', () => {
    const filters = makeFilters({ dateFrom: pipeline.store.maxDay - 19 });
    const analysis = pipeline.run(filters);
    const context = contextOf(rows, pipeline.settings, filters);
    expect(context.to - context.from + 1).toBe(20);
    const oracleUsers = checkProfiles(analysis, rows, context);
    checkRanking(analysis.population, oracleUsers, pipeline.settings.pareto);
    expect(analysis.population.profiles.length).toBeLessThan(pipeline.analysis.population.profiles.length + 1);
  });

  it('a short window (under 14 days) disables the trend-based traits', () => {
    const filters = makeFilters({ dateTo: pipeline.store.minDay + 9 });
    const analysis = pipeline.run(filters);
    expect(analysis.population.trendReliable).toBe(false);
    const context = contextOf(rows, pipeline.settings, filters);
    checkProfiles(analysis, rows, context);
    for (const profile of analysis.population.profiles) {
      expect(profile.traits).not.toContain('accelerating');
      expect(profile.traits).not.toContain('fading');
    }
  });

  it('shares sum to 1, ranks are 1..n in gross order, cumulative share is monotonic and ends at 1', () => {
    const profiles = pipeline.analysis.population.profiles;
    expect(sum(profiles.map((profile) => profile.share))).toBeCloseTo(1, 9);
    expect(profiles.map((profile) => profile.rank)).toEqual(profiles.map((_, index) => index + 1));
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i].gross).toBeLessThanOrEqual(profiles[i - 1].gross);
      expect(profiles[i].cumShare).toBeGreaterThanOrEqual(profiles[i - 1].cumShare);
    }
    expect(profiles[0].cumShare).toBeCloseTo(profiles[0].share, 12);
    expect(profiles[profiles.length - 1].cumShare).toBeCloseTo(1, 9);
    for (const profile of profiles) {
      expect(profile.share).toBeGreaterThanOrEqual(0);
      expect(profile.share).toBeLessThanOrEqual(1);
    }
  });

  it('total gross of the profiles equals the attributed gross of the aggregate', () => {
    const { agg: aggregates, population } = pipeline.analysis;
    expect(population.totals.gross).toBeCloseTo(aggregates.totals.attributedGross, 8);
    expect(population.totals.users).toBe(aggregates.totals.users);
    expect(population.totals.gross + aggregates.totals.unattributedGross).toBeCloseTo(aggregates.totals.gross, 8);
  });

  it('Pareto classes: A holds the first 80% of spend (the crossing user included), B up to 95%, C the tail', () => {
    const profiles = pipeline.analysis.population.profiles;
    const { a: cutoffA, b: cutoffB } = pipeline.settings.pareto;
    const classAUsers = profiles.filter((profile) => profile.pareto === 'A');
    const classBUsers = profiles.filter((profile) => profile.pareto === 'B');
    const classCUsers = profiles.filter((profile) => profile.pareto === 'C');
    expect(classAUsers.length + classBUsers.length + classCUsers.length).toBe(profiles.length);
    expect(classAUsers.length).toBeGreaterThan(0);
    expect(sum(classAUsers.map((profile) => profile.share))).toBeGreaterThanOrEqual(cutoffA);
    expect(sum(classAUsers.slice(0, -1).map((profile) => profile.share))).toBeLessThan(cutoffA);
    expect(sum(classAUsers.concat(classBUsers).map((profile) => profile.share))).toBeGreaterThanOrEqual(cutoffB);
    expect(sum(classAUsers.concat(classBUsers).slice(0, -1).map((profile) => profile.share))).toBeLessThan(cutoffB);
    // classes are contiguous in rank order
    expect(profiles.map((profile) => profile.pareto).join('')).toMatch(/^A+B*C*$/);
    // the highest-spending user is always class A, and there are fewer A users than C users in a skewed dataset
    expect(profiles[0].pareto).toBe('A');
    expect(classAUsers.length).toBeLessThan(profiles.length / 2);
  });

  it('the Pareto cut-off is exclusive: a user whose cumulative share before them equals the cut-off falls into the next class', () => {
    const profiles = pipeline.analysis.population.profiles;
    const firstBIndex = profiles.findIndex((profile) => profile.pareto === 'B');
    expect(firstBIndex).toBeGreaterThan(0);
    const edge = profiles[firstBIndex - 1].cumShare;
    const at = pipeline.run(pipeline.filters, mergeSettings({ pareto: { a: edge, b: 0.95 } })).population.profiles;
    expect(at[firstBIndex].pareto).toBe('B');
    const above = pipeline.run(pipeline.filters, mergeSettings({ pareto: { a: edge + 1e-9, b: 0.95 } })).population.profiles;
    expect(above[firstBIndex].pareto).toBe('A');
  });

  it('utilisation = gross / allotment, balance = allotment − gross, allotment from the monthly quotas', () => {
    for (const profile of pipeline.analysis.population.profiles) {
      expect(profile.utilization).toBeCloseTo(profile.gross / profile.allotment, 12);
      expect(profile.balance).toBeCloseTo(profile.allotment - profile.gross, 9);
      const months = new Set(rows.filter((row) => row.username === profile.name).map((row) => row.date.slice(0, 7))).size;
      expect(profile.allotment).toBeCloseTo((profile.quotaCredits * months) / 100, 6);
      expect(profile.gross).toBeCloseTo(profile.discount + profile.net, 6);
      expect(profile.efficiency).toBeGreaterThanOrEqual(0);
      expect(profile.efficiency).toBeLessThanOrEqual(100);
    }
  });

  it('tiers follow the thresholds; the tier boundary is inclusive', () => {
    const tiers = pipeline.settings.tiers;
    for (const profile of pipeline.analysis.population.profiles) {
      const utilization = profile.utilization;
      const want = utilization >= tiers.power ? 'runaway' : utilization >= tiers.core ? 'power' : utilization >= tiers.light ? 'core' : utilization >= tiers.minimal ? 'light' : 'minimal';
      expect(profile.tier, profile.name).toBe(want);
    }
    const subject = pipeline.analysis.population.profiles.find((profile) => profile.tier === 'light')!;
    const exact = pipeline.run(pipeline.filters, mergeSettings({ tiers: { ...tiers, minimal: subject.utilization } })).population.byId.get(subject.id)!;
    expect(exact.tier).toBe('light');
    const above = pipeline.run(pipeline.filters, mergeSettings({ tiers: { ...tiers, minimal: subject.utilization + 1e-9 } })).population.byId.get(subject.id)!;
    expect(above.tier).toBe('minimal');
  });

  it('persona precedence is runaway > new > lapsed > frequency × intensity quadrant', () => {
    const settings = pipeline.settings;
    for (const profile of pipeline.analysis.population.profiles) {
      const isFrequent = profile.activeRate >= settings.engagement.regular;
      const intense = profile.utilization >= settings.tiers.light;
      if (profile.tier === 'runaway') expect(profile.persona).toBe('runaway');
      else if (profile.isNew) expect(profile.persona).toBe('new');
      else if (profile.lapsed) expect(profile.persona).toBe('lapsed');
      else expect(profile.persona).toBe(isFrequent && intense ? 'champion' : intense ? 'burst' : isFrequent ? 'steady' : 'dormant');
      if (profile.isNew) expect(profile.lapsed).toBe(false);
      expect(profile.persona === 'runaway').toBe(profile.tier === 'runaway');
    }
    const seen = new Set(pipeline.analysis.population.profiles.map((profile) => profile.persona));
    for (const id of ['champion', 'steady', 'dormant', 'runaway', 'new', 'lapsed']) expect(seen).toContain(id);
  });

  it('group totals equal the sums over the member profiles', () => {
    checkGroups(pipeline.analysis.population);
  });

  it('optimisation potential: never above spend, equals the sum of the sequential lever savings', () => {
    const order = new Set<string>(LEVER_ORDER);
    for (const profile of pipeline.analysis.population.profiles) {
      expect(profile.potential, profile.name).toBeGreaterThanOrEqual(0);
      expect(profile.potential, profile.name).toBeLessThanOrEqual(profile.gross + 1e-9);
      expect(new Set(Object.keys(profile.potentialBy))).toEqual(order);
      let total = 0;
      for (const leverSaving of Object.values(profile.potentialBy)) {
        expect(leverSaving).toBeGreaterThanOrEqual(0);
        total += leverSaving;
      }
      expect(profile.potential).toBeCloseTo(total, 9);
      expect(profile.efficiency).toBeCloseTo(100 * (1 - profile.potential / profile.gross), 9);
      if (profile.utilization <= 3) expect(profile.potentialBy.capRunaway).toBe(0);
      if (profile.longShare === 0) expect(profile.potentialBy.longContext).toBe(0);
      if (profile.autoShare >= 1 - 1e-12) expect(profile.potentialBy.autoAdoption).toBeCloseTo(0, 9);
    }
    expect(pipeline.analysis.population.totals.potential).toBeGreaterThan(0);
    expect(pipeline.analysis.population.groups.persona.runaway.potential).toBeGreaterThan(0);
  });

  it('segment sizes of the demo look like a realistic organisation', () => {
    const groups = pipeline.analysis.population.groups;
    expect(groups.persona.runaway.users).toBe(3);
    expect(groups.tier.runaway.users).toBe(groups.persona.runaway.users);
    expect(groups.lifecycle.new.users).toBeGreaterThan(0);
    expect(groups.lifecycle.lapsed.users).toBeGreaterThan(0);
    expect(pipeline.analysis.population.hasCostCenters).toBe(true);
    expect(groups.trait.noCostCenter.users).toBeGreaterThan(0);
    expect(pipeline.analysis.population.poolFlow.takers).toBeGreaterThan(0);
    expect(pipeline.analysis.population.poolFlow.lenders).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Settings sensitivity
// ---------------------------------------------------------------------------------------------

describe('profile settings change the classification', () => {
  let pipeline: DemoPipeline;
  let rows: NaiveRow[];
  beforeAll(async () => {
    pipeline = await analyzeDemo();
    rows = naiveRows(pipeline.demo.csv);
  });
  const countBy = (analysis: Analysis, predicate: (profile: UserProfile) => boolean) => analysis.population.profiles.filter(predicate).length;
  const withSettings = (overrides: Partial<Settings>) => {
    const settings = mergeSettings(overrides);
    return { settings, a: pipeline.run(pipeline.filters, settings) };
  };

  it('raising or lowering the runaway threshold moves users between power and runaway', () => {
    const base = pipeline.analysis.population.groups.tier;
    const { a: none } = withSettings({ tiers: { ...pipeline.settings.tiers, power: 1e9 } });
    expect(none.population.groups.tier.runaway.users).toBe(0);
    expect(none.population.groups.tier.power.users).toBe(base.power.users + base.runaway.users);
    const { a: low } = withSettings({ tiers: { ...pipeline.settings.tiers, power: pipeline.settings.tiers.core } });
    expect(low.population.groups.tier.power.users).toBe(0);
    expect(low.population.groups.tier.runaway.users).toBe(countBy(pipeline.analysis, (profile) => profile.utilization >= pipeline.settings.tiers.core));
  });

  it('the full oracle holds for custom tier / engagement / lifecycle / trait thresholds', () => {
    const custom = mergeSettings({
      tiers: { minimal: 0.2, light: 0.6, core: 1.5, power: 2.5 },
      engagement: { daily: 0.8, regular: 0.5, occasional: 0.2 },
      lapsedDays: 3,
      newUserDays: 21,
      pareto: { a: 0.6, b: 0.9 },
      minSpendForTraits: 20,
      activeThreshold: 0.5,
      spikeShare: 0.25,
      lowAuto: 0.3,
      frontierHeavy: 0.5,
      efficientShare: 0.6,
    });
    const analysis = pipeline.run(pipeline.filters, custom);
    const context = contextOf(rows, custom);
    const oracleUsers = checkProfiles(analysis, rows, context);
    checkRanking(analysis.population, oracleUsers, custom.pareto);
    checkGroups(analysis.population);
  });

  it('lapsedDays and newUserDays switch the lifecycle groups on and off', () => {
    expect(withSettings({ lapsedDays: 10_000 }).a.population.groups.lifecycle.lapsed.users).toBe(0);
    const everyone = withSettings({ lapsedDays: 1 }).a.population;
    expect(everyone.groups.lifecycle.lapsed.users).toBe(everyone.profiles.filter((profile) => !profile.isNew && profile.lastDay < pipeline.store.maxDay).length);
    expect(everyone.groups.lifecycle.lapsed.users).toBeGreaterThan(pipeline.analysis.population.groups.lifecycle.lapsed.users);
    expect(withSettings({ newUserDays: 0 }).a.population.groups.lifecycle.new.users).toBe(0);
    // nobody can be new when the "new" window is longer than the data span minus the grace period
    expect(withSettings({ newUserDays: 60 }).a.population.groups.lifecycle.new.users).toBe(0);
  });

  it('a higher activity threshold means fewer active days and a lower engagement', () => {
    const base = pipeline.analysis.population.profiles;
    const strict = withSettings({ activeThreshold: 5 }).a.population.profiles;
    expect(strict.length).toBe(base.length);
    for (const profile of strict) expect(profile.activeDays).toBeLessThanOrEqual(base.find((baseProfile) => baseProfile.id === profile.id)!.activeDays);
    expect(sum(strict.map((profile) => profile.activeDays))).toBeLessThan(sum(base.map((profile) => profile.activeDays)));
  });

  it('with minSpendForTraits set very high no spend-based trait is assigned', () => {
    const { a: analysis } = withSettings({ minSpendForTraits: 1e9 });
    for (const profile of analysis.population.profiles) {
      for (const trait of ['lowCache', 'longContext', 'spiky', 'lowAuto', 'accelerating', 'fading']) expect(profile.traits).not.toContain(trait);
    }
    expect(analysis.population.groups.trait.multiModel.users).toBeGreaterThan(0);
  });

  it('does not mutate the settings it is given', () => {
    const settings = mergeSettings({ tiers: { minimal: 0.2, light: 0.5, core: 1.2, power: 2 } });
    const copy = JSON.stringify(settings);
    pipeline.run(pipeline.filters, settings);
    expect(JSON.stringify(settings)).toBe(copy);
  });
});

// ---------------------------------------------------------------------------------------------
// Segment post-filters through analyze()
// ---------------------------------------------------------------------------------------------

const SEGMENT_CASES: [string, Partial<Filters>][] = [
  ['one tier', { tiers: ['runaway'] }],
  ['two tiers', { tiers: ['power', 'runaway'] }],
  ['persona champion', { segments: ['champion'] }],
  ['personas new + lapsed', { segments: ['new', 'lapsed'] }],
  ['engagement daily', { engagement: ['daily'] }],
  ['engagement new (lifecycle alias)', { engagement: ['new'] }],
  ['engagement lapsed (lifecycle alias)', { engagement: ['lapsed'] }],
  ['engagement rare + occasional', { engagement: ['rare', 'occasional'] }],
  ['model profile frontier', { profiles: ['frontier'] }],
  ['trait spiky', { traits: ['spiky'] }],
  ['traits are any-of', { traits: ['lowAuto', 'fading'] }],
  ['pareto A', { paretoClasses: ['A'] }],
  ['pareto B + C', { paretoClasses: ['B', 'C'] }],
  ['minimum spend', { minUserSpend: 100 }],
  ['maximum spend', { maxUserSpend: 50 }],
  ['spend band', { minUserSpend: 20, maxUserSpend: 120 }],
  ['tier AND pareto', { tiers: ['core', 'power'], paretoClasses: ['A'] }],
  ['persona AND trait AND spend', { segments: ['champion', 'steady'], traits: ['multiModel'], minUserSpend: 10 }],
  ['row filter AND segment', { orgs: ['northwind-data'], tiers: ['light', 'core'] }],
];

describe('segment post-filters', () => {
  let pipeline: DemoPipeline;
  let rows: NaiveRow[];
  beforeAll(async () => {
    pipeline = await analyzeDemo();
    rows = naiveRows(pipeline.demo.csv);
  });

  const passes = (profile: UserProfile, filters: Filters): boolean =>
    (!filters.segments.length || filters.segments.includes(profile.persona)) &&
    (!filters.tiers.length || filters.tiers.includes(profile.tier)) &&
    (!filters.engagement.length || filters.engagement.some((engagement) => engagement === profile.engagement || (engagement === 'new' && profile.isNew) || (engagement === 'lapsed' && profile.lapsed))) &&
    (!filters.profiles.length || filters.profiles.includes(profile.profile)) &&
    (!filters.traits.length || profile.traits.some((trait) => filters.traits.includes(trait))) &&
    (!filters.paretoClasses.length || filters.paretoClasses.includes(profile.pareto)) &&
    (filters.minUserSpend === null || profile.gross >= filters.minUserSpend) &&
    (filters.maxUserSpend === null || profile.gross <= filters.maxUserSpend);

  const rowFilterOnly = (filters: Filters): Filters => ({
    ...filters,
    segments: [],
    tiers: [],
    engagement: [],
    profiles: [],
    traits: [],
    paretoClasses: [],
    minUserSpend: null,
    maxUserSpend: null,
  });

  it.each(SEGMENT_CASES)('%s narrows users, keeps the population and re-scopes the aggregate', (_label, over) => {
    const filters = makeFilters(over);
    const analysis = pipeline.run(filters);
    const base = pipeline.run(rowFilterOnly(filters));
    const wanted = base.population.profiles.filter((profile) => passes(profile, filters));
    expect(wanted.length).toBeGreaterThan(0);
    expect(analysis.segmentFiltered).toBe(true);
    expect(analysis.narrowed).toBe(true);
    // the population is labelled against the whole row-filtered scope and does not shrink
    expect(analysis.population.profiles.map((profile) => profile.name)).toEqual(base.population.profiles.map((profile) => profile.name));
    expect(analysis.population.profiles.map((profile) => profile.persona)).toEqual(base.population.profiles.map((profile) => profile.persona));
    expect(analysis.population.profiles.map((profile) => profile.tier)).toEqual(base.population.profiles.map((profile) => profile.tier));
    expect(analysis.users).not.toBe(analysis.population);
    expect(analysis.users.profiles.map((profile) => profile.name)).toEqual(wanted.map((profile) => profile.name));
    for (const profile of analysis.users.profiles) expect(analysis.population.byId.get(profile.id)).toBe(profile);
    expect(analysis.users.totals.users).toBe(wanted.length);
    checkGroups(analysis.users);
    // the aggregate only keeps the rows of the visible users (unattributed rows are dropped)
    const names = new Set(wanted.map((profile) => profile.name));
    const kept = rows.filter((row) => names.has(row.username) && (!filters.orgs.length || filters.orgs.includes(row.organization)));
    expect(analysis.agg.totals.rows).toBe(kept.length);
    expect(analysis.agg.totals.gross).toBeCloseTo(sum(kept.map((row) => numOf(row, 'gross_amount'))), 6);
    expect(analysis.agg.totals.net).toBeCloseTo(sum(kept.map((row) => numOf(row, 'net_amount'))), 6);
    expect(analysis.agg.totals.users).toBe(wanted.length);
    expect(analysis.agg.totals.unattributedGross).toBe(0);
    expect(analysis.users.totals.gross).toBeCloseTo(analysis.agg.totals.gross, 6);
    expect(analysis.mask).not.toBeNull();
    expect(analysis.baseMask === null || analysis.baseMask !== analysis.mask).toBe(true);
  });

  it('with no segment filter the analysis keeps unattributed rows and uses one shared user set', () => {
    const analysis = pipeline.analysis;
    expect(analysis.users).toBe(analysis.population);
    expect(analysis.agg.totals.unattributedGross).toBeGreaterThan(0);
    expect(analysis.narrowed).toBe(false);
  });

  it('a date filter alone does not count as narrowing, a segment filter does', () => {
    expect(pipeline.run(makeFilters({ dateFrom: pipeline.store.minDay + 5 })).narrowed).toBe(false);
    expect(pipeline.run(makeFilters({ dateFrom: pipeline.store.minDay + 5, tiers: ['core'] })).narrowed).toBe(true);
  });

  it('segment filters narrow per-user profiles of a date-scoped window the same way', () => {
    const filters = makeFilters({ dateFrom: pipeline.store.maxDay - 19, tiers: ['light', 'core'], minUserSpend: 1 });
    const analysis = pipeline.run(filters);
    const base = pipeline.run(rowFilterOnly(filters));
    expect(analysis.users.profiles.map((profile) => profile.name)).toEqual(base.population.profiles.filter((profile) => passes(profile, filters)).map((profile) => profile.name));
    for (const profile of analysis.users.profiles) expect(analysis.agg.userAcc.gross[profile.id]).toBeCloseTo(profile.gross, 9);
  });

  it('filters that match nobody give an empty, finite and text-safe analysis', () => {
    const analysis = pipeline.run(makeFilters({ minUserSpend: 1e9 }));
    expect(analysis.users.profiles).toEqual([]);
    expect(analysis.users.totals).toEqual({ users: 0, gross: 0, net: 0, potential: 0, allotment: 0 });
    expect(analysis.population.profiles.length).toBe(pipeline.analysis.population.profiles.length);
    expect(analysis.agg.totals.rows).toBe(0);
    expect(analysis.recs).toEqual([]);
    expect(analysis.headline.title).toBe('No rows match the current filters');
    expect(analysis.pool.months).toEqual([]);
    expect(analysis.seats.idle).toEqual([]);
    expect(analysis.seats.downgrade).toEqual([]);
    expect(analysis.seats.unused).toEqual([]);
    expect(JSON.stringify(analysis.plan)).not.toMatch(BAD_TEXT);
  });

  it('segment filters are applied after the profiles are labelled: the labels do not move while filtering', () => {
    const all = pipeline.analysis.population.profiles;
    for (const tier of TIER_IDS) {
      const analysis = pipeline.run(makeFilters({ tiers: [tier] }));
      if (analysis.users.profiles.length === 0) continue;
      expect(analysis.users.profiles.every((profile) => profile.tier === tier)).toBe(true);
      expect(analysis.users.profiles.length).toBe(all.filter((profile) => profile.tier === tier).length);
      expect(analysis.population.groups.tier[tier].users).toBe(analysis.users.profiles.length);
    }
  });

  it('userPassesFilters and allowedUsers implement the documented semantics', () => {
    const profiles = pipeline.analysis.population.profiles;
    const nUsers = pipeline.store.dicts.user.values.length;
    const none = allowedUsers(pipeline.analysis.population, makeFilters(), nUsers);
    expect(none.length).toBe(nUsers);
    expect(none[0]).toBe(0);
    expect(profiles.every((profile) => none[profile.id] === 1)).toBe(true);
    for (const [, over] of SEGMENT_CASES) {
      const filters = makeFilters(over);
      const allowed = allowedUsers(pipeline.analysis.population, filters, nUsers);
      for (const profile of profiles) expect(allowed[profile.id] === 1).toBe(userPassesFilters(profile, filters));
      expect(allowed[0]).toBe(0);
      expect(sum([...allowed])).toBe(profiles.filter((profile) => userPassesFilters(profile, filters)).length);
    }
  });

  it('userPassesFilters edge cases: inclusive spend bounds and lifecycle aliases', () => {
    const profile = pipeline.analysis.population.profiles[3];
    expect(userPassesFilters(profile, makeFilters({ minUserSpend: profile.gross }))).toBe(true);
    expect(userPassesFilters(profile, makeFilters({ maxUserSpend: profile.gross }))).toBe(true);
    expect(userPassesFilters(profile, makeFilters({ minUserSpend: profile.gross + 0.01 }))).toBe(false);
    expect(userPassesFilters(profile, makeFilters({ maxUserSpend: profile.gross - 0.01 }))).toBe(false);
    expect(userPassesFilters(profile, makeFilters({ minUserSpend: 0, maxUserSpend: 1e9 }))).toBe(true);
    const fake = { ...profile, isNew: true, lapsed: false, engagement: 'daily' } as UserProfile;
    expect(userPassesFilters(fake, makeFilters({ engagement: ['new'] }))).toBe(true);
    expect(userPassesFilters(fake, makeFilters({ engagement: ['lapsed'] }))).toBe(false);
    expect(userPassesFilters(fake, makeFilters({ engagement: ['rare', 'daily'] }))).toBe(true);
    expect(userPassesFilters({ ...fake, traits: ['spiky', 'lowAuto'] }, makeFilters({ traits: ['fading', 'lowAuto'] }))).toBe(true);
    expect(userPassesFilters({ ...fake, traits: [] }, makeFilters({ traits: ['fading'] }))).toBe(false);
    expect(userPassesFilters(fake, makeFilters())).toBe(true);
  });

  it('summarizeProfiles of nothing is all zeros', () => {
    const summary = summarizeProfiles([]);
    expect(summary.byId.size).toBe(0);
    expect(summary.totals).toEqual({ users: 0, gross: 0, net: 0, potential: 0, allotment: 0 });
    expect(summary.poolFlow).toEqual({ takers: 0, takenUsd: 0, lenders: 0, lentUsd: 0 });
    expect(sum(Object.values(summary.groups.persona).map((group) => group.users))).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Hand-built scenarios (every expectation derivable by hand)
// ---------------------------------------------------------------------------------------------

const octoberDate = (day: number) => `2026-10-${String(day).padStart(2, '0')}`;
const spread = (user: string, first: number, last: number, total: number, extra: Partial<RowSpec> = {}): RowSpec[] =>
  Array.from({ length: last - first + 1 }, (_, offset) => ({ date: octoberDate(first + offset), user, gross: total / (last - first + 1), ...extra }));
const at = (user: string, days: number[], each: number, extra: Partial<RowSpec> = {}): RowSpec[] => days.map((day) => ({ date: octoberDate(day), user, gross: each, ...extra }));

const SCENARIO: RowSpec[] = [
  ...spread('heavy', 1, 31, 93),
  ...spread('champ', 1, 31, 31),
  ...spread('steady', 1, 31, 3.1),
  ...at('burst', [1, 31], 6),
  ...at('dormant', [1, 31], 0.1),
  ...spread('lapsed', 1, 10, 20),
  ...spread('newbie', 25, 31, 7),
  ...spread('newrun', 28, 31, 70),
  ...spread('newlapsed', 20, 22, 3),
  ...spread('noquota', 5, 9, 9.5, { quota: 0 }),
  ...spread('ent', 1, 31, 58.5, { quota: 3900 }),
  ...at('tie-b', [3, 17], 0.5),
  ...at('tie-a', [3, 17], 0.5),
  { date: octoberDate(15), gross: 0.4 }, // unattributed, repo-level row
];

describe('hand-built scenario: precedence, boundaries and ranking', () => {
  let pipeline: Pipeline;
  let by: Map<string, UserProfile>;
  beforeAll(async () => {
    pipeline = await analyzeCsv(makeCsv(SCENARIO));
    by = new Map(pipeline.analysis.population.profiles.map((profile) => [profile.name, profile]));
  });

  it('matches the oracle, ranking and group sums', () => {
    const rows = naiveRows(makeCsv(SCENARIO));
    const context = contextOf(rows, pipeline.settings);
    const oracleUsers = checkProfiles(pipeline.analysis, rows, context);
    checkRanking(pipeline.analysis.population, oracleUsers, pipeline.settings.pareto);
    checkGroups(pipeline.analysis.population);
    expect(pipeline.analysis.population.profiles.length).toBe(13);
  });

  it('tier and persona of each archetype', () => {
    const expected: Record<string, [string, string]> = {
      heavy: ['runaway', 'runaway'],
      champ: ['power', 'champion'],
      steady: ['light', 'steady'],
      burst: ['core', 'burst'],
      dormant: ['minimal', 'dormant'],
      lapsed: ['power', 'lapsed'],
      newbie: ['light', 'new'],
      newrun: ['runaway', 'runaway'], // runaway wins over new
      newlapsed: ['light', 'new'], // new wins over lapsed
      noquota: ['core', 'lapsed'], // last seen Oct 9, 22 days before the end of the data
      ent: ['power', 'champion'],
      'tie-a': ['minimal', 'lapsed'], // last seen Oct 17
      'tie-b': ['minimal', 'lapsed'],
    };
    for (const [name, [tier, persona]] of Object.entries(expected)) {
      expect([name, by.get(name)!.tier, by.get(name)!.persona]).toEqual([name, tier, persona]);
    }
  });

  it('lifecycle flags: a new user is never lapsed, the first user of the dataset is never new', () => {
    expect(by.get('newbie')!.isNew).toBe(true);
    expect(by.get('newrun')!.isNew).toBe(true);
    expect(by.get('newlapsed')!.isNew).toBe(true);
    expect(by.get('newlapsed')!.lapsed).toBe(false);
    expect(by.get('newlapsed')!.daysSinceLast).toBe(9);
    expect(by.get('lapsed')!.lapsed).toBe(true);
    expect(by.get('lapsed')!.isNew).toBe(false);
    expect(by.get('lapsed')!.daysSinceLast).toBe(21);
    expect(by.get('heavy')!.isNew).toBe(false);
    expect(by.get('champ')!.lapsed).toBe(false);
  });

  it('utilisation uses the plan quota: Business $19, Enterprise $39, a missing quota falls back to the most common plan', () => {
    expect(by.get('heavy')!.allotment).toBeCloseTo(19, 12);
    expect(by.get('heavy')!.utilization).toBeCloseTo(93 / 19, 9);
    expect(by.get('ent')!.plan).toBe('Enterprise');
    expect(by.get('ent')!.allotment).toBeCloseTo(39, 12);
    expect(by.get('ent')!.utilization).toBeCloseTo(1.5, 9);
    const noQuota = by.get('noquota')!;
    expect(noQuota.plan).toBe('No quota');
    expect(noQuota.quotaCredits).toBe(0);
    expect(noQuota.allotment).toBeCloseTo(19, 12);
    expect(noQuota.utilization).toBeCloseTo(0.5, 9);
    expect(noQuota.balance).toBeCloseTo(9.5, 9);
    expect(pipeline.analysis.population.fallbackQuotaCredits).toBe(1900);
  });

  it('ranks by gross, ties by name, and assigns Pareto classes', () => {
    const names = pipeline.analysis.population.profiles.map((profile) => profile.name);
    expect(names).toEqual(['heavy', 'newrun', 'ent', 'champ', 'lapsed', 'burst', 'noquota', 'newbie', 'steady', 'newlapsed', 'tie-a', 'tie-b', 'dormant']);
    const classByName = Object.fromEntries(pipeline.analysis.population.profiles.map((profile) => [profile.name, profile.pareto]));
    expect(classByName).toMatchObject({ heavy: 'A', newrun: 'A', ent: 'A', champ: 'A', lapsed: 'B', burst: 'B', noquota: 'B', newbie: 'C', steady: 'C', dormant: 'C' });
  });

  it('activity: active days need a daily spend above the threshold, engagement uses workdays since first use', () => {
    expect(by.get('champ')!.activeDays).toBe(31);
    expect(by.get('champ')!.windowWorkdays).toBe(22);
    expect(by.get('champ')!.engagement).toBe('daily');
    expect(by.get('burst')!.activeDays).toBe(2);
    expect(by.get('burst')!.engagement).toBe('rare');
    expect(by.get('dormant')!.activeDays).toBe(2); // $0.10 a day is above the $0.05 threshold
    const strict = pipeline.run(pipeline.filters, mergeSettings({ activeThreshold: 0.11 })).population.profiles.find((profile) => profile.name === 'dormant')!;
    expect(strict.activeDays).toBe(0);
    expect(strict.activeRate).toBe(0);
    expect(strict.costPerActiveDay).toBeNaN();
    expect(by.get('newbie')!.windowWorkdays).toBe(5); // the window never shrinks below five workdays
    expect(by.get('newbie')!.activeRate).toBe(1);
  });

  it('the daily spend threshold is inclusive (a day at exactly the threshold counts as active)', () => {
    const exact = pipeline.run(pipeline.filters, mergeSettings({ activeThreshold: 0.1 })).population.profiles.find((profile) => profile.name === 'dormant')!;
    expect(exact.activeDays).toBe(2);
  });

  it('the unattributed row has no profile but is part of the aggregate', () => {
    expect(pipeline.analysis.population.profiles.some((profile) => profile.name === '')).toBe(false);
    expect(pipeline.analysis.agg.totals.unattributedGross).toBeCloseTo(0.4, 9);
    expect(pipeline.analysis.population.totals.gross).toBeCloseTo(pipeline.analysis.agg.totals.gross - 0.4, 9);
  });

  it('peak day, recent and prior windows', () => {
    const heavy = by.get('heavy')!;
    expect(heavy.peakDay).toBeCloseTo(3, 9);
    expect(heavy.peakShare).toBeCloseTo(3 / 93, 9);
    expect(heavy.recent).toBeCloseTo(21, 9); // Oct 25–31
    expect(heavy.prior).toBeCloseTo(21, 9); // Oct 18–24
    expect(heavy.trend).toBeCloseTo(0, 9);
    const burst = by.get('burst')!;
    expect(burst.recent).toBeCloseTo(6, 9);
    expect(burst.prior).toBe(0);
    expect(burst.trend).toBeNaN();
  });
});

const TRAITS: RowSpec[] = [
  ...at('anchor', [1, 31], 1),
  ...spread('nocache', 10, 14, 10, { input: 1_000_000 }),
  ...spread('cachey', 10, 14, 10, { input: 1_000_000, cacheRead: 9_000_000 }),
  ...spread('notokens', 10, 14, 10),
  ...at('spiky', [1, 2, 3, 4, 5], 0.2),
  { date: octoberDate(20), user: 'spiky', gross: 20 },
  ...spread('auto', 1, 10, 10, { model: 'Auto: GPT-5.6 Terra' }),
  ...['m1', 'm2', 'm3', 'm4'].map((model) => ({ date: octoberDate(12), user: 'multi', gross: 2, model })),
  ...['m1', 'm2', 'm3'].map((model) => ({ date: octoberDate(12), user: 'three', gross: 2, model })),
  { date: octoberDate(3), user: 'accel', gross: 0.5 },
  ...spread('accel', 18, 24, 7),
  ...spread('accel', 25, 31, 14),
  { date: octoberDate(2), user: 'fade', gross: 0.5 },
  ...spread('fade', 18, 24, 14),
  { date: octoberDate(25), user: 'fade', gross: 1 },
  ...spread('ccuser', 10, 14, 10, { costCenter: 'CC1' }),
  ...spread('nocc', 10, 14, 10),
];

describe('hand-built scenario: behaviour traits', () => {
  let pipeline: Pipeline;
  let by: Map<string, UserProfile>;
  const traitsOf = (name: string) => by.get(name)!.traits;
  beforeAll(async () => {
    pipeline = await analyzeCsv(makeCsv(TRAITS));
    by = new Map(pipeline.analysis.population.profiles.map((profile) => [profile.name, profile]));
  });

  it('matches the oracle', () => {
    const rows = naiveRows(makeCsv(TRAITS));
    checkProfiles(pipeline.analysis, rows, contextOf(rows, pipeline.settings));
    checkGroups(pipeline.analysis.population);
  });

  it('lowCache needs a priced model, a material spend and a cache hit rate below 50%', () => {
    expect(by.get('nocache')!.cacheHit).toBe(0);
    expect(traitsOf('nocache')).toContain('lowCache');
    expect(by.get('cachey')!.cacheHit).toBeCloseTo(0.9, 9);
    expect(traitsOf('cachey')).not.toContain('lowCache');
    expect(by.get('notokens')!.cacheHit).toBeNaN();
    expect(traitsOf('notokens')).not.toContain('lowCache');
  });

  it('spiky: one day holds ≥ 40% of the spend on at least 3 active days', () => {
    expect(traitsOf('spiky')).toContain('spiky');
    expect(by.get('spiky')!.peakShare).toBeCloseTo(20 / 21, 9);
    expect(traitsOf('anchor')).not.toContain('spiky');
  });

  it('lowAuto: material spend with under 10% on Auto; Auto users are exempt', () => {
    expect(traitsOf('spiky')).toContain('lowAuto');
    expect(by.get('auto')!.autoShare).toBeCloseTo(1, 12);
    expect(traitsOf('auto')).not.toContain('lowAuto');
    expect(traitsOf('anchor')).not.toContain('lowAuto'); // under the material-spend floor
  });

  it('multiModel needs four distinct models', () => {
    expect(by.get('multi')!.modelCount).toBe(4);
    expect(traitsOf('multi')).toContain('multiModel');
    expect(by.get('three')!.modelCount).toBe(3);
    expect(traitsOf('three')).not.toContain('multiModel');
  });

  it('accelerating: the last 7 days at least 1.5× the 7 days before; fading: at most half', () => {
    expect(by.get('accel')!.recent).toBeCloseTo(14, 9);
    expect(by.get('accel')!.prior).toBeCloseTo(7, 9);
    expect(traitsOf('accel')).toContain('accelerating');
    expect(traitsOf('accel')).not.toContain('fading');
    expect(by.get('fade')!.recent).toBeCloseTo(1, 9);
    expect(by.get('fade')!.prior).toBeCloseTo(14, 9);
    expect(traitsOf('fade')).toContain('fading');
    expect(traitsOf('fade')).not.toContain('accelerating');
    expect(traitsOf('anchor')).not.toContain('accelerating');
  });

  it('noCostCenter only exists once at least one user has a cost center', () => {
    expect(pipeline.analysis.population.hasCostCenters).toBe(true);
    expect(traitsOf('nocc')).toContain('noCostCenter');
    expect(traitsOf('ccuser')).not.toContain('noCostCenter');
    expect(by.get('ccuser')!.costCenter).toBe('CC1');
    expect(by.get('nocc')!.costCenter).toBe('');
  });

  it('no cost centers anywhere: nobody is flagged', async () => {
    const plain = await analyzeCsv(makeCsv(spread('a', 1, 20, 20).concat(spread('b', 1, 20, 10))));
    expect(plain.analysis.population.hasCostCenters).toBe(false);
    expect(plain.analysis.population.groups.trait.noCostCenter.users).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Tips, action rows, playbook, taxonomy
// ---------------------------------------------------------------------------------------------

const TIP_RANK: Record<UserTip['severity'], number> = { high: 0, medium: 1, low: 2, positive: 3 };

describe('user tips', () => {
  let pipeline: Pipeline;
  beforeAll(async () => {
    pipeline = await analyzeDemo();
  });

  it('are sorted by savings then severity, unique, limited and free of broken text', () => {
    for (const profile of pipeline.analysis.population.profiles) {
      const all = userTips(profile, pipeline.settings, 100);
      expect(userTips(profile, pipeline.settings).length).toBeLessThanOrEqual(6);
      expect(userTips(profile, pipeline.settings)).toEqual(all.slice(0, 6));
      expect(userTips(profile, pipeline.settings, 2)).toEqual(all.slice(0, 2));
      expect(userTips(profile, pipeline.settings, 0)).toEqual([]);
      expect(new Set(all.map((tip) => tip.id)).size, profile.name).toBe(all.length);
      for (let i = 1; i < all.length; i++) {
        const previousTip = all[i - 1];
        const currentTip = all[i];
        expect(
          previousTip.savingsUsd > currentTip.savingsUsd || (previousTip.savingsUsd === currentTip.savingsUsd && TIP_RANK[previousTip.severity] <= TIP_RANK[currentTip.severity]),
          `${profile.name}: ${previousTip.id} before ${currentTip.id}`,
        ).toBe(true);
      }
      for (const tip of all) {
        expect(tip.title.length).toBeGreaterThan(0);
        expect(tip.detail.length).toBeGreaterThan(0);
        expect(`${tip.title} ${tip.detail}`, `${profile.name}:${tip.id}`).not.toMatch(BAD_TEXT);
        expect(Number.isFinite(tip.savingsUsd)).toBe(true);
        expect(tip.savingsUsd).toBeGreaterThanOrEqual(0);
        expect(tip.savingsUsd).toBeLessThanOrEqual(profile.gross + 1e-9);
        if (tip.docs) expect(tip.docs.url.startsWith('https://docs.github.com/')).toBe(true);
      }
      expect(sum(all.map((tip) => tip.savingsUsd)), profile.name).toBeLessThanOrEqual(profile.gross + 1e-9);
    }
  });

  it('runaway users get a session-limit tip valued at the cap-runaway lever', () => {
    const runaways = pipeline.analysis.population.profiles.filter((profile) => profile.tier === 'runaway');
    expect(runaways.length).toBeGreaterThan(0);
    for (const profile of runaways) {
      const tips = userTips(profile, pipeline.settings, 100);
      const runawayTip = tips.find((tip) => tip.id === 'runaway')!;
      expect(runawayTip.severity).toBe('high');
      expect(runawayTip.savingsUsd).toBeCloseTo(profile.potentialBy.capRunaway, 12);
      expect(runawayTip.docs).toEqual(DOCS.sessionLimit);
    }
  });

  it('dormant and minimal-tier users are nudged to use the seat; new users get onboarding tips', () => {
    const minimal = pipeline.analysis.population.profiles.filter((profile) => profile.tier === 'minimal' && !profile.isNew && !profile.lapsed);
    expect(minimal.length).toBeGreaterThan(0);
    for (const profile of minimal) expect(userTips(profile, pipeline.settings, 100).map((tip) => tip.id)).toContain('low-use');
    const dormant = pipeline.analysis.population.profiles.filter((profile) => profile.persona === 'dormant');
    expect(dormant.length).toBeGreaterThan(0);
    for (const profile of dormant) {
      const tips = userTips(profile, pipeline.settings, 100);
      expect(tips.every((tip) => tip.savingsUsd <= profile.gross + 1e-9)).toBe(true);
      expect(tips.map((tip) => tip.id)).not.toContain('runaway');
    }
    const fresh = pipeline.analysis.population.profiles.filter((profile) => profile.isNew);
    expect(fresh.length).toBeGreaterThan(0);
    for (const profile of fresh) {
      const newUserTip = userTips(profile, pipeline.settings, 100).find((tip) => tip.id === 'new')!;
      expect(newUserTip.severity).toBe('positive');
      expect(newUserTip.savingsUsd).toBe(0);
    }
  });

  it('each trait and persona produces its tip', () => {
    const idsOf = (profile: UserProfile) => userTips(profile, pipeline.settings, 100).map((userTip) => userTip.id);
    const trait: Record<string, string> = {
      spiky: 'spiky',
      lowAuto: 'auto',
      lowCache: 'cache',
      longContext: 'long-context',
      multiModel: 'multi-model',
      accelerating: 'accelerating',
      noCostCenter: 'cost-center',
    };
    for (const profile of pipeline.analysis.population.profiles) {
      const ids = idsOf(profile);
      for (const [traitId, tip] of Object.entries(trait)) {
        expect(ids.includes(tip), `${profile.name} ${traitId}`).toBe(profile.traits.includes(traitId as never));
      }
      expect(ids.includes('champion')).toBe(profile.persona === 'champion');
      expect(ids.includes('lapsed')).toBe(profile.lapsed || profile.traits.includes('fading'));
      expect(ids.includes('efficient')).toBe(profile.profile === 'efficient' && profile.utilization >= 0.4);
    }
  });

  describe('branch conditions with crafted profiles', () => {
    let neutral: UserProfile;
    beforeAll(() => {
      neutral = {
        ...pipeline.analysis.population.profiles[0],
        gross: 100,
        utilization: 0.7,
        tier: 'core',
        persona: 'steady',
        profile: 'balanced',
        isNew: false,
        lapsed: false,
        traits: [],
        powerfulShare: 0,
        autoShare: 1,
        cacheHit: 0.9,
        potentialBy: { modelShift: 0, autoAdoption: 0, cacheDiscipline: 0, contextHygiene: 0, longContext: 0, capRunaway: 0 },
      };
    });
    const ids = (profile: UserProfile, limit = 100) => userTips(profile, pipeline.settings, limit).map((tip) => tip.id);
    const withBy = (by: Partial<UserProfile['potentialBy']>, over: Partial<UserProfile> = {}): UserProfile => ({
      ...neutral,
      ...over,
      potentialBy: { ...neutral.potentialBy, ...by },
    });

    it('a neutral profile has nothing to say', () => {
      expect(userTips(neutral, pipeline.settings)).toEqual([]);
    });

    it('model tip: 40% on Powerful models and a positive saving; high for frontier users saving ≥ 10%', () => {
      expect(ids(withBy({ modelShift: 5 }, { powerfulShare: 0.39 }))).not.toContain('model');
      expect(ids(withBy({ modelShift: 0 }, { powerfulShare: 0.9 }))).not.toContain('model');
      const medium = userTips(withBy({ modelShift: 5 }, { powerfulShare: 0.4 }), pipeline.settings).find((tip) => tip.id === 'model')!;
      expect(medium.severity).toBe('medium');
      expect(medium.savingsUsd).toBe(5);
      const smallFrontier = userTips(withBy({ modelShift: 9.9 }, { powerfulShare: 0.8, profile: 'frontier' }), pipeline.settings).find((tip) => tip.id === 'model')!;
      expect(smallFrontier.severity).toBe('medium');
      const bigFrontier = userTips(withBy({ modelShift: 10 }, { powerfulShare: 0.8, profile: 'frontier' }), pipeline.settings).find((tip) => tip.id === 'model')!;
      expect(bigFrontier.severity).toBe('high');
    });

    it('auto tip severity depends on the saving (3% of spend)', () => {
      expect(userTips(withBy({ autoAdoption: 2.99 }, { traits: ['lowAuto'], autoShare: 0 }), pipeline.settings).find((tip) => tip.id === 'auto')!.severity).toBe('low');
      expect(userTips(withBy({ autoAdoption: 3 }, { traits: ['lowAuto'], autoShare: 0 }), pipeline.settings).find((tip) => tip.id === 'auto')!.severity).toBe('medium');
    });

    it('context tip needs a material spend and a saving ≥ 3% of it', () => {
      expect(ids(withBy({ contextHygiene: 3 }))).toContain('context');
      expect(ids(withBy({ contextHygiene: 2.9 }))).not.toContain('context');
      expect(ids(withBy({ contextHygiene: 0.2 }, { gross: 4 }))).not.toContain('context');
    });

    it('lapsed and fading users get the re-engagement tip with different titles', () => {
      const lapsed = userTips({ ...neutral, lapsed: true, persona: 'lapsed' }, pipeline.settings).find((tip) => tip.id === 'lapsed')!;
      expect(lapsed.title).toMatch(/^No usage since /);
      const fading = userTips({ ...neutral, traits: ['fading'] }, pipeline.settings).find((tip) => tip.id === 'lapsed')!;
      expect(fading.title).toBe('Your usage is fading');
    });

    it('low-use tip is not shown to new or lapsed users', () => {
      expect(ids({ ...neutral, tier: 'minimal' })).toContain('low-use');
      expect(ids({ ...neutral, tier: 'minimal', isNew: true })).not.toContain('low-use');
      expect(ids({ ...neutral, tier: 'minimal', lapsed: true })).not.toContain('low-use');
    });

    it('efficient tip needs an efficient mix and at least 40% utilisation', () => {
      expect(ids({ ...neutral, profile: 'efficient', utilization: 0.4 })).toContain('efficient');
      expect(ids({ ...neutral, profile: 'efficient', utilization: 0.39 })).not.toContain('efficient');
    });

    it('the spiky tip names the day of the peak ("Sep 3"), not the peak amount used as a day number', () => {
      const peakDayIdx = dayNum('2026-09-03');
      const spiky = withBy({}, { traits: ['spiky'], peakShare: 0.84, peakDay: 8, peakDayIdx });
      const spikyTip = userTips(spiky, pipeline.settings).find((tip) => tip.id === 'spiky')!;
      expect(spikyTip.title).toBe('84% of your usage happened on Sep 3');
    });

    it('limits the number of tips and keeps the most important ones', () => {
      const busy = withBy(
        { modelShift: 20, autoAdoption: 5, cacheDiscipline: 4, contextHygiene: 6, longContext: 3, capRunaway: 30 },
        {
          tier: 'runaway',
          powerfulShare: 0.9,
          profile: 'frontier',
          isNew: true,
          persona: 'runaway',
          traits: ['lowAuto', 'lowCache', 'longContext', 'spiky', 'multiModel', 'accelerating', 'noCostCenter'],
        },
      );
      const all = userTips(busy, pipeline.settings, 100);
      expect(all.length).toBeGreaterThan(6);
      expect(userTips(busy, pipeline.settings).length).toBe(6);
      expect(all[0].id).toBe('runaway');
      expect(userTips(busy, pipeline.settings, 1)[0].id).toBe('runaway');
      expect(all[all.length - 1].severity).toBe('positive');
    });
  });
});

describe('per-user action rows', () => {
  let pipeline: Pipeline;
  beforeAll(async () => {
    pipeline = await analyzeDemo();
  });

  const ACTION_HEADERS = [
    'User',
    'Organization',
    'Cost center',
    'Plan',
    'Usage USD',
    'Billed USD',
    'Included credits used',
    'Tier',
    'Persona',
    'Usage profile',
    'Pareto class',
    'Traits',
    'Top model',
    'Auto share',
    'Cache hit rate',
    'Avoidable USD (default levers)',
    'Top action',
    'Input tokens',
    'Output tokens',
    'Cache read tokens',
    'Cache write tokens',
    'Total tokens',
    'Auto usage USD',
    'Original price of Auto usage USD',
    'Auto discount received USD',
    'Auto discount missed USD',
    'Auto use',
    'License seat',
    'License plan',
    'License status',
    'Last activity',
    'Days since last activity',
    'Last surface',
    'Pending cancellation',
  ];

  it('has one row per user and a consistent column count', () => {
    const set = pipeline.analysis.population;
    const { headers, rows } = userActionRows(set, pipeline.settings);
    expect(headers).toEqual(ACTION_HEADERS);
    expect(headers.length).toBe(34);
    expect(new Set(headers).size).toBe(headers.length);
    expect(rows.length).toBe(set.profiles.length);
    for (const row of rows) expect(row.length).toBe(headers.length);
    expect(rows.map((row) => row[0])).toEqual(set.profiles.map((profile) => profile.name));
  });

  it('keeps the original 17 columns in place and calls the usage profile "Usage profile"', () => {
    const { headers } = userActionRows(pipeline.analysis.population, pipeline.settings);
    expect(headers[9]).toBe('Usage profile');
    expect(headers.join('|')).not.toMatch(/Model profile/);
    expect(headers[16]).toBe('Top action');
  });

  it('values mirror the profiles and use the taxonomy labels', () => {
    const set = pipeline.analysis.population;
    const taxonomy = buildTaxonomy(pipeline.settings);
    const { rows } = userActionRows(set, pipeline.settings);
    set.profiles.forEach((profile, index) => {
      const row = rows[index];
      expect(row[1]).toBe(profile.org);
      expect(row[2]).toBe(profile.costCenter);
      expect(row[3]).toBe(profile.plan);
      expect(row[4]).toBeCloseTo(profile.gross, 4);
      expect(row[5]).toBeCloseTo(profile.net, 4);
      expect(row[6]).toBeCloseTo(profile.utilization, 4);
      expect(row[7]).toBe(taxonomy.tiers.find((item) => item.id === profile.tier)!.label);
      expect(row[8]).toBe(taxonomy.personas.find((item) => item.id === profile.persona)!.label);
      expect(row[9]).toBe(taxonomy.profiles.find((item) => item.id === profile.profile)!.label);
      expect(row[10]).toBe(profile.pareto);
      expect(row[11]).toBe(profile.traits.map((trait) => taxonomy.traits.find((item) => item.id === trait)!.label).join('; '));
      expect(row[12]).toBe(profile.topModel);
      expect(row[13]).toBeCloseTo(profile.autoShare, 4);
      if (Number.isFinite(profile.cacheHit)) expect(row[14]).toBeCloseTo(profile.cacheHit, 4);
      else expect(row[14]).toBe('');
      expect(row[15]).toBeCloseTo(profile.potential, 4);
      const tip = userTips(profile, pipeline.settings, 1)[0];
      expect(row[16]).toBe(tip ? `${tip.title}. ${tip.detail}` : '');
      for (const cell of row) {
        if (typeof cell === 'number') expect(Number.isFinite(cell)).toBe(true);
        else expect(String(cell)).not.toMatch(BAD_TEXT);
      }
    });
  });

  it('follows the segment filter (only the visible users)', () => {
    const analysis = pipeline.run(makeFilters({ tiers: ['runaway'] }));
    const { rows } = userActionRows(analysis.users, pipeline.settings);
    expect(rows.length).toBe(analysis.users.profiles.length);
    expect(rows.length).toBe(3);
  });

  it('adds the token columns: rounded counts that add up to the total', () => {
    const { rows } = userActionRows(pipeline.analysis.population, pipeline.settings);
    pipeline.analysis.population.profiles.forEach((profile, index) => {
      const row = rows[index];
      expect(row[17], profile.name).toBe(Math.round(profile.input));
      expect(row[18], profile.name).toBe(Math.round(profile.output));
      expect(row[19], profile.name).toBe(Math.round(profile.cacheRead));
      expect(row[20], profile.name).toBe(Math.round(profile.cacheWrite));
      expect(row[21], profile.name).toBe(Math.round(profile.tokens));
      for (let k = 17; k <= 21; k++) expect(Number.isInteger(row[k]), `${profile.name} column ${k}`).toBe(true);
      expect(Math.abs((row[21] as number) - ((row[17] as number) + (row[18] as number) + (row[19] as number) + (row[20] as number))), profile.name).toBeLessThanOrEqual(2);
    });
    expect(pipeline.analysis.population.profiles.some((profile) => profile.tokens > 0)).toBe(true);
  });

  it('adds the Auto columns: billed, original price, discount received and discount missed, plus the use label', () => {
    const taxonomy = buildTaxonomy(pipeline.settings);
    const { rows } = userActionRows(pipeline.analysis.population, pipeline.settings);
    pipeline.analysis.population.profiles.forEach((profile, index) => {
      const row = rows[index];
      expect(row[22] as number, profile.name).toBeCloseTo(profile.auto.billed, 4);
      expect(row[23] as number, profile.name).toBeCloseTo(profile.auto.original, 4);
      expect(row[24] as number, profile.name).toBeCloseTo(profile.auto.discount, 4);
      expect(row[25] as number, profile.name).toBeCloseTo(profile.autoMissed, 4);
      expect(row[26], profile.name).toBe(taxonomy.autoUse.find((item) => item.id === profile.autoUse)!.label);
      expect((row[23] as number) - (row[22] as number), profile.name).toBeCloseTo(row[24] as number, 3);
      for (let k = 22; k <= 25; k++) expect(Number.isFinite(row[k] as number), `${profile.name} column ${k}`).toBe(true);
    });
    expect(pipeline.analysis.population.profiles.some((profile) => profile.auto.billed > 0)).toBe(true);
  });

  it('leaves the license columns blank when no seat list is loaded', () => {
    const { rows } = userActionRows(pipeline.analysis.population, pipeline.settings);
    for (const profile of pipeline.analysis.population.profiles) expect(profile.license ?? null).toBeNull();
    for (const row of rows) expect(row.slice(27), String(row[0])).toEqual(['', '', '', '', '', '', '']);
  });

  it('fills the license columns from the imported seat list: seat, plan, status, last activity, days, surface, cancellation', async () => {
    const base = await analyzeDemo();
    const [first, second] = base.analysis.population.profiles;
    const roster = [
      {
        user: first.name,
        plan: 'Enterprise',
        lastActivityAt: '2030-01-21',
        lastSurface: 'vscode',
        pendingCancellation: '2030-02-15',
        createdAt: '2029-06-01',
        source: 'api' as const,
      },
      { user: 'someone-not-in-the-report', plan: 'Business', lastActivityAt: '2030-01-30', source: 'api' as const },
    ];
    const withRoster = await analyzeDemo({ settings: { roster, rosterAsOf: '2030-01-31' } });
    const { rows } = userActionRows(withRoster.analysis.population, withRoster.settings);
    const byName = new Map(withRoster.analysis.population.profiles.map((profile, index) => [profile.name, rows[index]]));
    const firstRow = byName.get(first.name)!;
    expect(firstRow[27]).toBe('Yes');
    expect(firstRow[28]).toBe('Enterprise');
    expect(firstRow[29]).toBe(activityStatusText(withRoster.analysis.population.profiles.find((profile) => profile.name === first.name)!.license!.status));
    expect(firstRow[30]).toBe('2030-01-21');
    expect(firstRow[31]).toBe(10);
    expect(firstRow[32]).toBe('vscode');
    expect(firstRow[33]).toBe('2030-02-15');
    const secondRow = byName.get(second.name)!;
    expect(secondRow[27]).toBe('No');
    expect(secondRow.slice(28)).toEqual(['', activityStatusText('unknown'), '', '', '', '']);
  });

  it('an empty user set gives only headers', () => {
    const empty = pipeline.run(makeFilters({ minUserSpend: 1e9 }));
    const { headers, rows } = userActionRows(empty.users, pipeline.settings);
    expect(headers.length).toBe(34);
    expect(rows).toEqual([]);
  });
});

describe('playbook and taxonomy', () => {
  it('playbook items are complete, unique and link to the GitHub docs', () => {
    expect(PLAYBOOK.length).toBeGreaterThanOrEqual(10);
    expect(new Set(PLAYBOOK.map((playbookItem) => playbookItem.id)).size).toBe(PLAYBOOK.length);
    expect(new Set(PLAYBOOK.map((playbookItem) => playbookItem.audience))).toEqual(new Set(['user', 'admin']));
    const levers = new Set<string>(LEVER_ORDER);
    const known = new Set(Object.values(DOCS).map((docLink) => docLink.url));
    for (const item of PLAYBOOK) {
      expect(item.title.length, item.id).toBeGreaterThan(0);
      expect(item.why.length, item.id).toBeGreaterThan(0);
      expect(item.how.length, item.id).toBeGreaterThan(0);
      expect(item.docs.length, item.id).toBeGreaterThan(0);
      for (const step of item.how) expect(step.trim().length).toBeGreaterThan(0);
      for (const docLink of item.docs) {
        expect(docLink.url.startsWith('https://docs.github.com/'), `${item.id}: ${docLink.url}`).toBe(true);
        expect(docLink.label.length).toBeGreaterThan(0);
        expect(known.has(docLink.url), `${item.id}: ${docLink.url} is one of the DOCS links`).toBe(true);
      }
      if (item.lever) expect(levers.has(item.lever), `${item.id} lever`).toBe(true);
      expect(`${item.title} ${item.why} ${item.how.join(' ')}`).not.toMatch(BAD_TEXT);
    }
  });

  it('every DOCS link is a unique https://docs.github.com URL', () => {
    const urls = Object.values(DOCS).map((docLink) => docLink.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url.startsWith('https://docs.github.com/en/copilot')).toBe(true);
  });

  it('the taxonomy covers every id exactly once and is text-safe', () => {
    const taxonomy = buildTaxonomy(mergeSettings({}));
    const idsOf = (items: { id: string }[]) => items.map((item) => item.id);
    expect(idsOf(taxonomy.tiers)).toEqual([...TIER_IDS]);
    expect(idsOf(taxonomy.personas).sort()).toEqual([...PERSONA_IDS].sort());
    expect(idsOf(taxonomy.profiles).sort()).toEqual([...PROFILE_IDS].sort());
    expect(idsOf(taxonomy.pareto)).toEqual([...PARETO_IDS]);
    expect(idsOf(taxonomy.traits).sort()).toEqual([...TRAIT_IDS].sort());
    expect(idsOf(taxonomy.engagement).sort()).toEqual([...ENGAGEMENT_IDS, ...LIFECYCLE_IDS].sort());
    const lists: { id: string; label: string; description: string; action: string; color: string }[][] = Object.values(taxonomy);
    for (const items of lists) {
      expect(new Set(items.map((item) => item.label)).size).toBe(items.length);
      for (const item of items) {
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(item.action.length).toBeGreaterThan(0);
        expect(`${item.label} ${item.description} ${item.action}`).not.toMatch(BAD_TEXT);
        expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('the taxonomy text follows the settings', () => {
    const taxonomy = buildTaxonomy(mergeSettings({ tiers: { minimal: 0.2, light: 0.5, core: 1.5, power: 4 }, lapsedDays: 12, newUserDays: 30 }));
    expect(taxonomy.tiers[0].label).toContain('20%');
    expect(taxonomy.tiers[1].label).toContain('50%');
    expect(taxonomy.tiers[4].label).toContain('400%');
    expect(taxonomy.engagement.find((item) => item.id === 'lapsed')!.description).toContain('12');
    expect(taxonomy.engagement.find((item) => item.id === 'new')!.description).toContain('30');
  });
});

describe('license status of a user', () => {
  const seat = (over: Partial<ProfileLicense> = {}): ProfileLicense => ({
    seat: true,
    plan: 'Business',
    org: 'acme',
    team: '',
    createdAt: '2025-01-02',
    lastActivityAt: '2025-05-10',
    daysSinceActivity: 21,
    lastSurface: 'vscode',
    status: 'recent',
    pendingCancellation: '',
    isNew: false,
    ...over,
  });

  it('is null without a license list, No seat without a seat, and the activity band otherwise', () => {
    expect(seatStatusOf(null)).toBeNull();
    expect(seatStatusOf(undefined)).toBeNull();
    expect(seatStatusOf(seat({ seat: false, status: 'recent' }))).toBe('none');
    for (const status of ['recent', 'fading', 'stale', 'no-date', 'unknown'] as const) {
      expect(seatStatusOf(seat({ status }))).toBe(status);
    }
  });

  it('every status has a label, a hint and a tone, in a fixed order', () => {
    expect([...SEAT_STATUS_ORDER]).toEqual(['recent', 'fading', 'stale', 'no-date', 'unknown', 'none']);
    const labels = SEAT_STATUS_ORDER.map(seatStatusLabel);
    expect(labels).toEqual(['Recently active', 'Fading', 'Inactive', 'No recent activity date', 'No activity data', 'No seat']);
    for (const id of SEAT_STATUS_ORDER) {
      expect(seatStatusHint(id).length).toBeGreaterThan(0);
      expect(seatStatusHint(id)).not.toMatch(BAD_TEXT);
      expect(SEAT_STATUS_TONE[id]).toBeTruthy();
    }
  });

  it('plan and day labels keep custom plans and invalid days as they are', () => {
    expect(seatPlanLabel('Business')).toBe('Business');
    expect(seatPlanLabel('Enterprise')).toBe('Enterprise');
    expect(seatPlanLabel('Pro+ trial')).toBe('Pro+ trial');
    expect(licenseDay('')).toBe('');
    expect(licenseDay('not a day')).toBe('not a day');
    expect(licenseDay('2025-03-04')).toMatch(/2025/);
  });

  it('the License view columns have unique keys, explanations and blank seat details for No seat', () => {
    const cols = licenseColumns();
    const keys = cols.map((column) => column.key);
    expect(keys).toEqual(['seatStatus', 'seatPlan', 'lastActivity', 'daysSinceActivity', 'lastSurface', 'seatSince', 'pendingCancellation']);
    for (const column of cols) expect(column.calc?.length ?? 0).toBeGreaterThan(0);
    const status = cols.find((column) => column.key === 'seatStatus')!;
    const plan = cols.find((column) => column.key === 'seatPlan')!;
    const noSeat = { license: seat({ seat: false }) } as UserProfile;
    const withSeat = { license: seat({ status: 'fading', plan: 'Enterprise' }) } as UserProfile;
    const noList = { license: null } as UserProfile;
    expect(status.value!(noSeat)).toBe('No seat');
    expect(status.value!(withSeat)).toBe('Fading');
    expect(status.value!(noList)).toBe('');
    expect(plan.value!(noSeat)).toBe('');
    expect(plan.value!(withSeat)).toBe('Enterprise');
  });
});
