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
const CARD_CATEGORY = new Map<string, Cat>(PRICE_CARD.map((e) => [e.name, e.category as Cat]));
const F = (over: Partial<Filters> = {}): Filters => ({ ...emptyFilters(), ...over });
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
  for (const r of rows) {
    if (!r.username) continue;
    const day = dayNum(r.date);
    if (day < from || day > to) continue;
    let u = out.get(r.username);
    if (!u) {
      u = {
        name: r.username,
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
      out.set(r.username, u);
    }
    const g = numOf(r, 'gross_amount');
    u.rows++;
    u.gross += g;
    u.discount += numOf(r, 'discount_amount');
    u.net += numOf(r, 'net_amount');
    u.credits += numOf(r, 'quantity');
    u.first = Math.min(u.first, day);
    u.last = Math.max(u.last, day);
    const q = numOf(r, 'total_monthly_quota');
    u.quota = Math.max(u.quota, q);
    const mk = r.date.slice(0, 7);
    u.monthQuota.set(mk, Math.max(u.monthQuota.get(mk) ?? 0, q));
    u.monthGross.set(mk, (u.monthGross.get(mk) ?? 0) + g);
    u.dayGross.set(day, (u.dayGross.get(day) ?? 0) + g);
    if (isAutoRow(r)) u.autoGross += g;
    u.input += numOf(r, 'input');
    u.output += numOf(r, 'output');
    u.cacheRead += numOf(r, 'cache_read');
    u.cacheWrite += numOf(r, 'cache_write');
    const model = modelOfRow(r);
    u.models.set(model, (u.models.get(model) ?? 0) + g);
    u.cat[CARD_CATEGORY.get(model) ?? 'Unknown'] += g;
    if (r.organization) u.orgs.add(r.organization);
    if (r.cost_center_name) u.costCenters.add(r.cost_center_name);
  }
  return out;
}

const workdays = (a: number, b: number): number => {
  let n = 0;
  for (let d = a; d <= b; d++) if (weekdayOf(isoOf(d)) < 5) n++;
  return n;
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

function contextOf(rows: NaiveRow[], settings: Settings, f: Filters = emptyFilters()): Ctx {
  const days = rows.map((r) => dayNum(r.date));
  const storeMin = Math.min(...days);
  const storeMax = Math.max(...days);
  const from = Math.max(f.dateFrom ?? storeMin, storeMin);
  const to = Math.min(f.dateTo ?? storeMax, storeMax);
  const globalFirst = new Map<string, number>();
  for (const r of rows) {
    if (!r.username) continue;
    const d = dayNum(r.date);
    globalFirst.set(r.username, Math.min(globalFirst.get(r.username) ?? Infinity, d));
  }
  const inScope = naiveUsers(rows, from, to);
  const counts = new Map<number, number>();
  for (const u of inScope.values()) if (u.quota > 0) counts.set(u.quota, (counts.get(u.quota) ?? 0) + 1);
  let fallbackQuota = 1900;
  let best = 0;
  for (const [q, n] of counts) {
    if (n > best) {
      best = n;
      fallbackQuota = q;
    }
  }
  const hasCostCenters = [...inScope.values()].some((u) => u.costCenters.size > 0);
  return { settings, from, to, storeMin, globalFirst, fallbackQuota, hasCostCenters };
}

/** The documented classification rules, evaluated from the raw numbers of one user. */
function expectedOf(u: NaiveUser, c: Ctx) {
  const s = c.settings;
  const credits = sum([...u.monthQuota.values()]);
  const monthsWithGross = [...u.monthGross.values()].filter((g) => g > 0).length;
  const allotCredits = credits > 0 ? credits : c.fallbackQuota * Math.max(1, monthsWithGross);
  const allotment = allotCredits * 0.01;
  const utilization = allotment > 0 ? u.gross / allotment : 0;
  const globalFirst = c.globalFirst.get(u.name)!;
  const windowWorkdays = Math.max(5, workdays(Math.max(globalFirst, c.from), c.to));
  const dayVals = [...u.dayGross.values()];
  const activeDays = dayVals.filter((g) => g >= s.activeThreshold).length;
  const activeRate = Math.min(1, activeDays / windowWorkdays);
  const daysSinceLast = Math.max(0, c.to - u.last);
  const isNew = c.to - globalFirst + 1 <= s.newUserDays && globalFirst - c.storeMin >= s.newUserDays;
  const lapsed = !isNew && daysSinceLast >= s.lapsedDays;
  const t = s.tiers;
  const tier =
    utilization >= t.power ? 'runaway' : utilization >= t.core ? 'power' : utilization >= t.light ? 'core' : utilization >= t.minimal ? 'light' : 'minimal';
  const e = s.engagement;
  const engagement = activeRate >= e.daily ? 'daily' : activeRate >= e.regular ? 'regular' : activeRate >= e.occasional ? 'occasional' : 'rare';
  const freq = activeRate >= e.regular;
  const intense = utilization >= t.light;
  const persona = tier === 'runaway' ? 'runaway' : isNew ? 'new' : lapsed ? 'lapsed' : freq && intense ? 'champion' : intense ? 'burst' : freq ? 'steady' : 'dormant';
  const powerfulShare = u.gross > 0 ? u.cat.Powerful / u.gross : 0;
  const versatileShare = u.gross > 0 ? u.cat.Versatile / u.gross : 0;
  const lightweightShare = u.gross > 0 ? u.cat.Lightweight / u.gross : 0;
  const profile = powerfulShare >= s.frontierHeavy ? 'frontier' : versatileShare + lightweightShare >= s.efficientShare ? 'efficient' : 'balanced';
  const prompt = u.input + u.cacheRead + u.cacheWrite;
  const cacheHit = prompt > 0 ? u.cacheRead / prompt : NaN;
  const autoShare = u.gross > 0 ? u.autoGross / u.gross : 0;
  const peak = Math.max(0, ...dayVals);
  const peakShare = u.gross > 0 ? peak / u.gross : 0;
  let recent = 0;
  let prior = 0;
  for (const [d, g] of u.dayGross) {
    if (d >= c.to - 6) recent += g;
    else if (d >= c.to - 13) prior += g;
  }
  const trendReliable = c.to - c.from + 1 >= 14;
  const material = u.gross >= s.minSpendForTraits;
  const traits = new Set<string>();
  if (material && autoShare < s.lowAuto) traits.add('lowAuto');
  if (material && activeDays >= 3 && peakShare >= s.spikeShare) traits.add('spiky');
  if (u.models.size >= 4) traits.add('multiModel');
  if (trendReliable && recent >= s.minSpendForTraits && (prior <= 0 ? !isNew : recent >= 1.5 * prior)) traits.add('accelerating');
  if (trendReliable && prior >= s.minSpendForTraits && recent <= 0.5 * prior) traits.add('fading');
  if (c.hasCostCenters && u.costCenters.size === 0) traits.add('noCostCenter');
  let top = '';
  let topG = 0;
  let second = 0;
  for (const [m, g] of u.models) {
    if (g > topG) {
      second = topG;
      topG = g;
      top = m;
    } else if (g > second) second = g;
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
    topUnique: topG - second > 1e-3,
    peakMonthGross: Math.max(0, ...u.monthGross.values()),
  };
}

/** Compares every profile of an analysis with the oracle; returns the oracle users for further checks. */
function checkProfiles(a: Analysis, rows: NaiveRow[], c: Ctx): Map<string, NaiveUser> {
  const nu = naiveUsers(rows, c.from, c.to);
  const set = a.population;
  expect(set.profiles.map((p) => p.name).sort()).toEqual([...nu.keys()].sort());
  expect(set.fallbackQuotaCredits).toBe(c.fallbackQuota);
  expect(set.hasCostCenters).toBe(c.hasCostCenters);
  expect(set.trendReliable).toBe(c.to - c.from + 1 >= 14);
  for (const p of set.profiles) {
    const u = nu.get(p.name)!;
    const x = expectedOf(u, c);
    const w = (field: string) => `${p.name}.${field}`;
    expect(p.rows, w('rows')).toBe(u.rows);
    expect(p.gross, w('gross')).toBeCloseTo(u.gross, 6);
    expect(p.discount, w('discount')).toBeCloseTo(u.discount, 6);
    expect(p.net, w('net')).toBeCloseTo(u.net, 6);
    expect(p.credits, w('credits')).toBeCloseTo(u.credits, 4);
    expect(p.firstDay, w('firstDay')).toBe(u.first);
    expect(p.lastDay, w('lastDay')).toBe(u.last);
    expect(p.globalFirstDay, w('globalFirstDay')).toBe(c.globalFirst.get(p.name));
    expect(p.quotaCredits, w('quota')).toBe(u.quota);
    expect(p.allotment, w('allotment')).toBeCloseTo(x.allotment, 9);
    expect(p.utilization, w('utilization')).toBeCloseTo(x.utilization, 9);
    expect(p.balance, w('balance')).toBeCloseTo(x.allotment - u.gross, 9);
    expect(p.windowWorkdays, w('windowWorkdays')).toBe(x.windowWorkdays);
    expect(p.activeDays, w('activeDays')).toBe(x.activeDays);
    expect(p.activeRate, w('activeRate')).toBeCloseTo(x.activeRate, 9);
    expect(p.daysSinceLast, w('daysSinceLast')).toBe(x.daysSinceLast);
    expect(p.isNew, w('isNew')).toBe(x.isNew);
    expect(p.lapsed, w('lapsed')).toBe(x.lapsed);
    expect(p.tier, w('tier')).toBe(x.tier);
    expect(p.engagement, w('engagement')).toBe(x.engagement);
    expect(p.persona, w('persona')).toBe(x.persona);
    expect(p.profile, w('profile')).toBe(x.profile);
    expect(p.powerfulShare, w('powerfulShare')).toBeCloseTo(x.powerfulShare, 9);
    expect(p.versatileShare, w('versatileShare')).toBeCloseTo(x.versatileShare, 9);
    expect(p.lightweightShare, w('lightweightShare')).toBeCloseTo(x.lightweightShare, 9);
    expect(p.autoShare, w('autoShare')).toBeCloseTo(x.autoShare, 9);
    if (Number.isNaN(x.cacheHit)) expect(p.cacheHit, w('cacheHit')).toBeNaN();
    else expect(p.cacheHit, w('cacheHit')).toBeCloseTo(x.cacheHit, 9);
    expect(p.peakDay, w('peakDay')).toBeCloseTo(x.peak, 9);
    expect(p.peakShare, w('peakShare')).toBeCloseTo(x.peakShare, 9);
    expect(p.recent, w('recent')).toBeCloseTo(x.recent, 9);
    expect(p.prior, w('prior')).toBeCloseTo(x.prior, 9);
    if (x.prior > 0) expect(p.trend, w('trend')).toBeCloseTo(x.recent / x.prior - 1, 9);
    else expect(p.trend, w('trend')).toBeNaN();
    if (x.activeDays > 0) expect(p.costPerActiveDay, w('costPerActiveDay')).toBeCloseTo(u.gross / x.activeDays, 9);
    else expect(p.costPerActiveDay, w('costPerActiveDay')).toBeNaN();
    expect(p.modelCount, w('modelCount')).toBe([...u.models.values()].filter((g) => g > 0).length);
    if (x.topUnique) expect(p.topModel, w('topModel')).toBe(x.top);
    expect(p.topModelShare, w('topModelShare')).toBeCloseTo(Math.max(...u.models.values()) / u.gross, 5);
    expect(p.input).toBeCloseTo(u.input, 6);
    expect(p.output).toBeCloseTo(u.output, 6);
    expect(p.cacheRead).toBeCloseTo(u.cacheRead, 6);
    expect(p.cacheWrite).toBeCloseTo(u.cacheWrite, 6);
    expect(p.peakMonthGross, w('peakMonthGross')).toBeCloseTo(x.peakMonthGross, 9);
    expect(p.orgMixed, w('orgMixed')).toBe(u.orgs.size > 1);
    if (u.orgs.size === 1) expect(p.org, w('org')).toBe([...u.orgs][0]);
    else if (u.orgs.size > 1) expect([...u.orgs], w('org')).toContain(p.org);
    expect(p.costCenterMixed, w('costCenterMixed')).toBe(u.costCenters.size > 1);
    if (u.costCenters.size === 1) expect(p.costCenter, w('costCenter')).toBe([...u.costCenters][0]);
    if (u.costCenters.size === 0) expect(p.costCenter, w('costCenter')).toBe('');
    expect(p.plan, w('plan')).toBe(u.quota === 1900 ? 'Business' : u.quota === 3900 ? 'Enterprise' : u.quota <= 0 ? 'No quota' : p.plan);

    // Traits that can be derived from the raw rows alone must match in both directions.
    const independent = ['lowAuto', 'spiky', 'multiModel', 'accelerating', 'fading', 'noCostCenter'];
    expect(new Set(p.traits.filter((t) => independent.includes(t))), w('traits')).toEqual(x.traits);
    // These two depend on the price card, so they are checked against the profile's own numbers.
    expect(p.traits.includes('longContext'), w('longContext')).toBe(x.material && p.longShare >= c.settings.longContextShare);
    if (p.traits.includes('lowCache')) {
      expect(x.material, w('lowCache material')).toBe(true);
      expect(x.cacheHit, w('lowCache')).toBeLessThan(c.settings.lowCacheHit);
    }
    expect(new Set(p.traits).size, w('traits unique')).toBe(p.traits.length);
    for (const t of p.traits) expect(TRAIT_IDS, w('trait id')).toContain(t);
  }
  return nu;
}

/** Rank, share, cumulative share and Pareto class recomputed from the oracle. */
function checkRanking(set: UserSet, nu: Map<string, NaiveUser>, pareto: { a: number; b: number }) {
  const order = [...nu.values()].sort((a, b) => b.gross - a.gross || a.name.localeCompare(b.name));
  expect(set.profiles.map((p) => p.name)).toEqual(order.map((u) => u.name));
  const total = sum(order.map((u) => u.gross));
  let cum = 0;
  order.forEach((u, i) => {
    const p = set.profiles[i];
    const before = total > 0 ? cum / total : 0;
    cum += u.gross;
    expect(p.rank).toBe(i + 1);
    expect(p.share).toBeCloseTo(u.gross / total, 9);
    expect(p.cumShare).toBeCloseTo(cum / total, 9);
    expect(p.pareto, `${p.name} pareto (cum before ${before})`).toBe(before < pareto.a ? 'A' : before < pareto.b ? 'B' : 'C');
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
  const ps = set.profiles;
  const close = (g: GroupStat, members: UserProfile[], label: string) => {
    expect(g.users, `${label}.users`).toBe(members.length);
    expect(g.gross, `${label}.gross`).toBeCloseTo(sum(members.map((p) => p.gross)), 8);
    expect(g.net, `${label}.net`).toBeCloseTo(sum(members.map((p) => p.net)), 8);
    expect(g.potential, `${label}.potential`).toBeCloseTo(sum(members.map((p) => p.potential)), 8);
    expect(g.allotment, `${label}.allotment`).toBeCloseTo(sum(members.map((p) => p.allotment)), 8);
  };
  close(set.totals, ps, 'totals');
  for (const { dim, ids } of EXCLUSIVE) {
    const groups = set.groups[dim] as Record<string, GroupStat>;
    expect(Object.keys(groups).sort()).toEqual([...ids].sort());
    for (const id of ids) close(groups[id], ps.filter((p) => p[dim] === id), `${dim}.${id}`);
    expect(sum(ids.map((id) => groups[id].users)), `${dim} partition`).toBe(ps.length);
    expect(sum(ids.map((id) => groups[id].gross)), `${dim} gross partition`).toBeCloseTo(set.totals.gross, 8);
  }
  close(set.groups.lifecycle.new, ps.filter((p) => p.isNew), 'lifecycle.new');
  close(set.groups.lifecycle.lapsed, ps.filter((p) => p.lapsed), 'lifecycle.lapsed');
  expect(Object.keys(set.groups.lifecycle).sort()).toEqual([...LIFECYCLE_IDS].sort());
  for (const t of TRAIT_IDS) close(set.groups.trait[t], ps.filter((p) => p.traits.includes(t)), `trait.${t}`);
  const takers = ps.filter((p) => p.balance < 0);
  const lenders = ps.filter((p) => p.balance > 0);
  expect(set.poolFlow.takers).toBe(takers.length);
  expect(set.poolFlow.lenders).toBe(lenders.length);
  expect(set.poolFlow.takenUsd).toBeCloseTo(-sum(takers.map((p) => p.balance)), 8);
  expect(set.poolFlow.lentUsd).toBeCloseTo(sum(lenders.map((p) => p.balance)), 8);
  expect(set.poolFlow.lentUsd - set.poolFlow.takenUsd).toBeCloseTo(set.totals.allotment - set.totals.gross, 8);
  expect(set.byId.size).toBe(ps.length);
  for (const p of ps) expect(set.byId.get(p.id)).toBe(p);
}

// ---------------------------------------------------------------------------------------------
// Demo dataset
// ---------------------------------------------------------------------------------------------

describe('user profiles on the demo dataset', () => {
  let P: DemoPipeline;
  let rows: NaiveRow[];
  beforeAll(async () => {
    P = await analyzeDemo();
    rows = naiveRows(P.demo.csv);
  });

  it('profiles every named user once, with no profile for unattributed rows', () => {
    const named = new Set(rows.map((r) => r.username).filter(Boolean));
    const set = P.analysis.population;
    expect(set.profiles.length).toBe(named.size);
    expect(new Set(set.profiles.map((p) => p.name)).size).toBe(named.size);
    expect(set.profiles.some((p) => p.name === '' || p.id === 0)).toBe(false);
    expect(P.analysis.users).toBe(P.analysis.population);
    expect(P.analysis.segmentFiltered).toBe(false);
  });

  it('every field matches an independent recomputation from the raw rows', () => {
    const c = contextOf(rows, P.settings);
    const nu = checkProfiles(P.analysis, rows, c);
    checkRanking(P.analysis.population, nu, P.settings.pareto);
  });

  it('a date-scoped analysis (last 20 days) is recomputed for that window only', () => {
    const f = F({ dateFrom: P.store.maxDay - 19 });
    const a = P.run(f);
    const c = contextOf(rows, P.settings, f);
    expect(c.to - c.from + 1).toBe(20);
    const nu = checkProfiles(a, rows, c);
    checkRanking(a.population, nu, P.settings.pareto);
    expect(a.population.profiles.length).toBeLessThan(P.analysis.population.profiles.length + 1);
  });

  it('a short window (under 14 days) disables the trend-based traits', () => {
    const f = F({ dateTo: P.store.minDay + 9 });
    const a = P.run(f);
    expect(a.population.trendReliable).toBe(false);
    const c = contextOf(rows, P.settings, f);
    checkProfiles(a, rows, c);
    for (const p of a.population.profiles) {
      expect(p.traits).not.toContain('accelerating');
      expect(p.traits).not.toContain('fading');
    }
  });

  it('shares sum to 1, ranks are 1..n in gross order, cumulative share is monotonic and ends at 1', () => {
    const ps = P.analysis.population.profiles;
    expect(sum(ps.map((p) => p.share))).toBeCloseTo(1, 9);
    expect(ps.map((p) => p.rank)).toEqual(ps.map((_, i) => i + 1));
    for (let i = 1; i < ps.length; i++) {
      expect(ps[i].gross).toBeLessThanOrEqual(ps[i - 1].gross);
      expect(ps[i].cumShare).toBeGreaterThanOrEqual(ps[i - 1].cumShare);
    }
    expect(ps[0].cumShare).toBeCloseTo(ps[0].share, 12);
    expect(ps[ps.length - 1].cumShare).toBeCloseTo(1, 9);
    for (const p of ps) {
      expect(p.share).toBeGreaterThanOrEqual(0);
      expect(p.share).toBeLessThanOrEqual(1);
    }
  });

  it('total gross of the profiles equals the attributed gross of the aggregate', () => {
    const { agg, population } = P.analysis;
    expect(population.totals.gross).toBeCloseTo(agg.totals.attributedGross, 8);
    expect(population.totals.users).toBe(agg.totals.users);
    expect(population.totals.gross + agg.totals.unattributedGross).toBeCloseTo(agg.totals.gross, 8);
  });

  it('Pareto classes: A holds the first 80% of spend (the crossing user included), B up to 95%, C the tail', () => {
    const ps = P.analysis.population.profiles;
    const { a, b } = P.settings.pareto;
    const A = ps.filter((p) => p.pareto === 'A');
    const B = ps.filter((p) => p.pareto === 'B');
    const C = ps.filter((p) => p.pareto === 'C');
    expect(A.length + B.length + C.length).toBe(ps.length);
    expect(A.length).toBeGreaterThan(0);
    expect(sum(A.map((p) => p.share))).toBeGreaterThanOrEqual(a);
    expect(sum(A.slice(0, -1).map((p) => p.share))).toBeLessThan(a);
    expect(sum(A.concat(B).map((p) => p.share))).toBeGreaterThanOrEqual(b);
    expect(sum(A.concat(B).slice(0, -1).map((p) => p.share))).toBeLessThan(b);
    // classes are contiguous in rank order
    expect(ps.map((p) => p.pareto).join('')).toMatch(/^A+B*C*$/);
    // the highest-spending user is always class A, and there are fewer A users than C users in a skewed dataset
    expect(ps[0].pareto).toBe('A');
    expect(A.length).toBeLessThan(ps.length / 2);
  });

  it('the Pareto cut-off is exclusive: a user whose cumulative share before them equals the cut-off falls into the next class', () => {
    const ps = P.analysis.population.profiles;
    const i = ps.findIndex((p) => p.pareto === 'B');
    expect(i).toBeGreaterThan(0);
    const edge = ps[i - 1].cumShare;
    const at = P.run(P.filters, mergeSettings({ pareto: { a: edge, b: 0.95 } })).population.profiles;
    expect(at[i].pareto).toBe('B');
    const above = P.run(P.filters, mergeSettings({ pareto: { a: edge + 1e-9, b: 0.95 } })).population.profiles;
    expect(above[i].pareto).toBe('A');
  });

  it('utilisation = gross / allotment, balance = allotment − gross, allotment from the monthly quotas', () => {
    for (const p of P.analysis.population.profiles) {
      expect(p.utilization).toBeCloseTo(p.gross / p.allotment, 12);
      expect(p.balance).toBeCloseTo(p.allotment - p.gross, 9);
      const months = new Set(rows.filter((r) => r.username === p.name).map((r) => r.date.slice(0, 7))).size;
      expect(p.allotment).toBeCloseTo((p.quotaCredits * months) / 100, 6);
      expect(p.gross).toBeCloseTo(p.discount + p.net, 6);
      expect(p.efficiency).toBeGreaterThanOrEqual(0);
      expect(p.efficiency).toBeLessThanOrEqual(100);
    }
  });

  it('tiers follow the thresholds; the tier boundary is inclusive', () => {
    const t = P.settings.tiers;
    for (const p of P.analysis.population.profiles) {
      const u = p.utilization;
      const want = u >= t.power ? 'runaway' : u >= t.core ? 'power' : u >= t.light ? 'core' : u >= t.minimal ? 'light' : 'minimal';
      expect(p.tier, p.name).toBe(want);
    }
    const subject = P.analysis.population.profiles.find((p) => p.tier === 'light')!;
    const exact = P.run(P.filters, mergeSettings({ tiers: { ...t, minimal: subject.utilization } })).population.byId.get(subject.id)!;
    expect(exact.tier).toBe('light');
    const above = P.run(P.filters, mergeSettings({ tiers: { ...t, minimal: subject.utilization + 1e-9 } })).population.byId.get(subject.id)!;
    expect(above.tier).toBe('minimal');
  });

  it('persona precedence is runaway > new > lapsed > frequency × intensity quadrant', () => {
    const s = P.settings;
    for (const p of P.analysis.population.profiles) {
      const freq = p.activeRate >= s.engagement.regular;
      const intense = p.utilization >= s.tiers.light;
      if (p.tier === 'runaway') expect(p.persona).toBe('runaway');
      else if (p.isNew) expect(p.persona).toBe('new');
      else if (p.lapsed) expect(p.persona).toBe('lapsed');
      else expect(p.persona).toBe(freq && intense ? 'champion' : intense ? 'burst' : freq ? 'steady' : 'dormant');
      if (p.isNew) expect(p.lapsed).toBe(false);
      expect(p.persona === 'runaway').toBe(p.tier === 'runaway');
    }
    const seen = new Set(P.analysis.population.profiles.map((p) => p.persona));
    for (const id of ['champion', 'steady', 'dormant', 'runaway', 'new', 'lapsed']) expect(seen).toContain(id);
  });

  it('group totals equal the sums over the member profiles', () => {
    checkGroups(P.analysis.population);
  });

  it('optimisation potential: never above spend, equals the sum of the sequential lever savings', () => {
    const order = new Set<string>(LEVER_ORDER);
    for (const p of P.analysis.population.profiles) {
      expect(p.potential, p.name).toBeGreaterThanOrEqual(0);
      expect(p.potential, p.name).toBeLessThanOrEqual(p.gross + 1e-9);
      expect(new Set(Object.keys(p.potentialBy))).toEqual(order);
      let total = 0;
      for (const v of Object.values(p.potentialBy)) {
        expect(v).toBeGreaterThanOrEqual(0);
        total += v;
      }
      expect(p.potential).toBeCloseTo(total, 9);
      expect(p.efficiency).toBeCloseTo(100 * (1 - p.potential / p.gross), 9);
      if (p.utilization <= 3) expect(p.potentialBy.capRunaway).toBe(0);
      if (p.longShare === 0) expect(p.potentialBy.longContext).toBe(0);
      if (p.autoShare >= 1 - 1e-12) expect(p.potentialBy.autoAdoption).toBeCloseTo(0, 9);
    }
    expect(P.analysis.population.totals.potential).toBeGreaterThan(0);
    expect(P.analysis.population.groups.persona.runaway.potential).toBeGreaterThan(0);
  });

  it('segment sizes of the demo look like a realistic organisation', () => {
    const g = P.analysis.population.groups;
    expect(g.persona.runaway.users).toBe(3);
    expect(g.tier.runaway.users).toBe(g.persona.runaway.users);
    expect(g.lifecycle.new.users).toBeGreaterThan(0);
    expect(g.lifecycle.lapsed.users).toBeGreaterThan(0);
    expect(P.analysis.population.hasCostCenters).toBe(true);
    expect(g.trait.noCostCenter.users).toBeGreaterThan(0);
    expect(P.analysis.population.poolFlow.takers).toBeGreaterThan(0);
    expect(P.analysis.population.poolFlow.lenders).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Settings sensitivity
// ---------------------------------------------------------------------------------------------

describe('profile settings change the classification', () => {
  let P: DemoPipeline;
  let rows: NaiveRow[];
  beforeAll(async () => {
    P = await analyzeDemo();
    rows = naiveRows(P.demo.csv);
  });
  const countBy = (a: Analysis, f: (p: UserProfile) => boolean) => a.population.profiles.filter(f).length;
  const withSettings = (s: Partial<Settings>) => {
    const settings = mergeSettings(s);
    return { settings, a: P.run(P.filters, settings) };
  };

  it('raising or lowering the runaway threshold moves users between power and runaway', () => {
    const base = P.analysis.population.groups.tier;
    const { a: none } = withSettings({ tiers: { ...P.settings.tiers, power: 1e9 } });
    expect(none.population.groups.tier.runaway.users).toBe(0);
    expect(none.population.groups.tier.power.users).toBe(base.power.users + base.runaway.users);
    const { a: low } = withSettings({ tiers: { ...P.settings.tiers, power: P.settings.tiers.core } });
    expect(low.population.groups.tier.power.users).toBe(0);
    expect(low.population.groups.tier.runaway.users).toBe(countBy(P.analysis, (p) => p.utilization >= P.settings.tiers.core));
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
    const a = P.run(P.filters, custom);
    const c = contextOf(rows, custom);
    const nu = checkProfiles(a, rows, c);
    checkRanking(a.population, nu, custom.pareto);
    checkGroups(a.population);
  });

  it('lapsedDays and newUserDays switch the lifecycle groups on and off', () => {
    expect(withSettings({ lapsedDays: 10_000 }).a.population.groups.lifecycle.lapsed.users).toBe(0);
    const everyone = withSettings({ lapsedDays: 1 }).a.population;
    expect(everyone.groups.lifecycle.lapsed.users).toBe(everyone.profiles.filter((p) => !p.isNew && p.lastDay < P.store.maxDay).length);
    expect(everyone.groups.lifecycle.lapsed.users).toBeGreaterThan(P.analysis.population.groups.lifecycle.lapsed.users);
    expect(withSettings({ newUserDays: 0 }).a.population.groups.lifecycle.new.users).toBe(0);
    // nobody can be new when the "new" window is longer than the data span minus the grace period
    expect(withSettings({ newUserDays: 60 }).a.population.groups.lifecycle.new.users).toBe(0);
  });

  it('a higher activity threshold means fewer active days and a lower engagement', () => {
    const base = P.analysis.population.profiles;
    const strict = withSettings({ activeThreshold: 5 }).a.population.profiles;
    expect(strict.length).toBe(base.length);
    for (const p of strict) expect(p.activeDays).toBeLessThanOrEqual(base.find((b) => b.id === p.id)!.activeDays);
    expect(sum(strict.map((p) => p.activeDays))).toBeLessThan(sum(base.map((p) => p.activeDays)));
  });

  it('with minSpendForTraits set very high no spend-based trait is assigned', () => {
    const { a } = withSettings({ minSpendForTraits: 1e9 });
    for (const p of a.population.profiles) {
      for (const t of ['lowCache', 'longContext', 'spiky', 'lowAuto', 'accelerating', 'fading']) expect(p.traits).not.toContain(t);
    }
    expect(a.population.groups.trait.multiModel.users).toBeGreaterThan(0);
  });

  it('does not mutate the settings it is given', () => {
    const s = mergeSettings({ tiers: { minimal: 0.2, light: 0.5, core: 1.2, power: 2 } });
    const copy = JSON.stringify(s);
    P.run(P.filters, s);
    expect(JSON.stringify(s)).toBe(copy);
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
  let P: DemoPipeline;
  let rows: NaiveRow[];
  beforeAll(async () => {
    P = await analyzeDemo();
    rows = naiveRows(P.demo.csv);
  });

  const passes = (p: UserProfile, f: Filters): boolean =>
    (!f.segments.length || f.segments.includes(p.persona)) &&
    (!f.tiers.length || f.tiers.includes(p.tier)) &&
    (!f.engagement.length || f.engagement.some((e) => e === p.engagement || (e === 'new' && p.isNew) || (e === 'lapsed' && p.lapsed))) &&
    (!f.profiles.length || f.profiles.includes(p.profile)) &&
    (!f.traits.length || p.traits.some((t) => f.traits.includes(t))) &&
    (!f.paretoClasses.length || f.paretoClasses.includes(p.pareto)) &&
    (f.minUserSpend === null || p.gross >= f.minUserSpend) &&
    (f.maxUserSpend === null || p.gross <= f.maxUserSpend);

  const rowFilterOnly = (f: Filters): Filters => ({
    ...f,
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
    const f = F(over);
    const a = P.run(f);
    const base = P.run(rowFilterOnly(f));
    const wanted = base.population.profiles.filter((p) => passes(p, f));
    expect(wanted.length).toBeGreaterThan(0);
    expect(a.segmentFiltered).toBe(true);
    expect(a.narrowed).toBe(true);
    // the population is labelled against the whole row-filtered scope and does not shrink
    expect(a.population.profiles.map((p) => p.name)).toEqual(base.population.profiles.map((p) => p.name));
    expect(a.population.profiles.map((p) => p.persona)).toEqual(base.population.profiles.map((p) => p.persona));
    expect(a.population.profiles.map((p) => p.tier)).toEqual(base.population.profiles.map((p) => p.tier));
    expect(a.users).not.toBe(a.population);
    expect(a.users.profiles.map((p) => p.name)).toEqual(wanted.map((p) => p.name));
    for (const p of a.users.profiles) expect(a.population.byId.get(p.id)).toBe(p);
    expect(a.users.totals.users).toBe(wanted.length);
    checkGroups(a.users);
    // the aggregate only keeps the rows of the visible users (unattributed rows are dropped)
    const names = new Set(wanted.map((p) => p.name));
    const kept = rows.filter((r) => names.has(r.username) && (!f.orgs.length || f.orgs.includes(r.organization)));
    expect(a.agg.totals.rows).toBe(kept.length);
    expect(a.agg.totals.gross).toBeCloseTo(sum(kept.map((r) => numOf(r, 'gross_amount'))), 6);
    expect(a.agg.totals.net).toBeCloseTo(sum(kept.map((r) => numOf(r, 'net_amount'))), 6);
    expect(a.agg.totals.users).toBe(wanted.length);
    expect(a.agg.totals.unattributedGross).toBe(0);
    expect(a.users.totals.gross).toBeCloseTo(a.agg.totals.gross, 6);
    expect(a.mask).not.toBeNull();
    expect(a.baseMask === null || a.baseMask !== a.mask).toBe(true);
  });

  it('with no segment filter the analysis keeps unattributed rows and uses one shared user set', () => {
    const a = P.analysis;
    expect(a.users).toBe(a.population);
    expect(a.agg.totals.unattributedGross).toBeGreaterThan(0);
    expect(a.narrowed).toBe(false);
  });

  it('a date filter alone does not count as narrowing, a segment filter does', () => {
    expect(P.run(F({ dateFrom: P.store.minDay + 5 })).narrowed).toBe(false);
    expect(P.run(F({ dateFrom: P.store.minDay + 5, tiers: ['core'] })).narrowed).toBe(true);
  });

  it('segment filters narrow per-user profiles of a date-scoped window the same way', () => {
    const f = F({ dateFrom: P.store.maxDay - 19, tiers: ['light', 'core'], minUserSpend: 1 });
    const a = P.run(f);
    const base = P.run(rowFilterOnly(f));
    expect(a.users.profiles.map((p) => p.name)).toEqual(base.population.profiles.filter((p) => passes(p, f)).map((p) => p.name));
    for (const p of a.users.profiles) expect(a.agg.userAcc.gross[p.id]).toBeCloseTo(p.gross, 9);
  });

  it('filters that match nobody give an empty, finite and text-safe analysis', () => {
    const a = P.run(F({ minUserSpend: 1e9 }));
    expect(a.users.profiles).toEqual([]);
    expect(a.users.totals).toEqual({ users: 0, gross: 0, net: 0, potential: 0, allotment: 0 });
    expect(a.population.profiles.length).toBe(P.analysis.population.profiles.length);
    expect(a.agg.totals.rows).toBe(0);
    expect(a.recs).toEqual([]);
    expect(a.headline.title).toBe('No rows match the current filters');
    expect(a.pool.months).toEqual([]);
    expect(a.seats.idle).toEqual([]);
    expect(a.seats.downgrade).toEqual([]);
    expect(a.seats.unused).toEqual([]);
    expect(JSON.stringify(a.plan)).not.toMatch(BAD_TEXT);
  });

  it('segment filters are applied after the profiles are labelled: the labels do not move while filtering', () => {
    const all = P.analysis.population.profiles;
    for (const tier of TIER_IDS) {
      const a = P.run(F({ tiers: [tier] }));
      if (a.users.profiles.length === 0) continue;
      expect(a.users.profiles.every((p) => p.tier === tier)).toBe(true);
      expect(a.users.profiles.length).toBe(all.filter((p) => p.tier === tier).length);
      expect(a.population.groups.tier[tier].users).toBe(a.users.profiles.length);
    }
  });

  it('userPassesFilters and allowedUsers implement the documented semantics', () => {
    const ps = P.analysis.population.profiles;
    const nUsers = P.store.dicts.user.values.length;
    const none = allowedUsers(P.analysis.population, F(), nUsers);
    expect(none.length).toBe(nUsers);
    expect(none[0]).toBe(0);
    expect(ps.every((p) => none[p.id] === 1)).toBe(true);
    for (const [, over] of SEGMENT_CASES) {
      const f = F(over);
      const al = allowedUsers(P.analysis.population, f, nUsers);
      for (const p of ps) expect(al[p.id] === 1).toBe(userPassesFilters(p, f));
      expect(al[0]).toBe(0);
      expect(sum([...al])).toBe(ps.filter((p) => userPassesFilters(p, f)).length);
    }
  });

  it('userPassesFilters edge cases: inclusive spend bounds and lifecycle aliases', () => {
    const p = P.analysis.population.profiles[3];
    expect(userPassesFilters(p, F({ minUserSpend: p.gross }))).toBe(true);
    expect(userPassesFilters(p, F({ maxUserSpend: p.gross }))).toBe(true);
    expect(userPassesFilters(p, F({ minUserSpend: p.gross + 0.01 }))).toBe(false);
    expect(userPassesFilters(p, F({ maxUserSpend: p.gross - 0.01 }))).toBe(false);
    expect(userPassesFilters(p, F({ minUserSpend: 0, maxUserSpend: 1e9 }))).toBe(true);
    const fake = { ...p, isNew: true, lapsed: false, engagement: 'daily' } as UserProfile;
    expect(userPassesFilters(fake, F({ engagement: ['new'] }))).toBe(true);
    expect(userPassesFilters(fake, F({ engagement: ['lapsed'] }))).toBe(false);
    expect(userPassesFilters(fake, F({ engagement: ['rare', 'daily'] }))).toBe(true);
    expect(userPassesFilters({ ...fake, traits: ['spiky', 'lowAuto'] }, F({ traits: ['fading', 'lowAuto'] }))).toBe(true);
    expect(userPassesFilters({ ...fake, traits: [] }, F({ traits: ['fading'] }))).toBe(false);
    expect(userPassesFilters(fake, F())).toBe(true);
  });

  it('summarizeProfiles of nothing is all zeros', () => {
    const s = summarizeProfiles([]);
    expect(s.byId.size).toBe(0);
    expect(s.totals).toEqual({ users: 0, gross: 0, net: 0, potential: 0, allotment: 0 });
    expect(s.poolFlow).toEqual({ takers: 0, takenUsd: 0, lenders: 0, lentUsd: 0 });
    expect(sum(Object.values(s.groups.persona).map((g) => g.users))).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Hand-built scenarios (every expectation derivable by hand)
// ---------------------------------------------------------------------------------------------

const oct = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;
const spread = (user: string, first: number, last: number, total: number, extra: Partial<RowSpec> = {}): RowSpec[] =>
  Array.from({ length: last - first + 1 }, (_, i) => ({ date: oct(first + i), user, gross: total / (last - first + 1), ...extra }));
const at = (user: string, days: number[], each: number, extra: Partial<RowSpec> = {}): RowSpec[] => days.map((d) => ({ date: oct(d), user, gross: each, ...extra }));

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
  { date: oct(15), gross: 0.4 }, // unattributed, repo-level row
];

describe('hand-built scenario: precedence, boundaries and ranking', () => {
  let P: Pipeline;
  let by: Map<string, UserProfile>;
  beforeAll(async () => {
    P = await analyzeCsv(makeCsv(SCENARIO));
    by = new Map(P.analysis.population.profiles.map((p) => [p.name, p]));
  });

  it('matches the oracle, ranking and group sums', () => {
    const rows = naiveRows(makeCsv(SCENARIO));
    const c = contextOf(rows, P.settings);
    const nu = checkProfiles(P.analysis, rows, c);
    checkRanking(P.analysis.population, nu, P.settings.pareto);
    checkGroups(P.analysis.population);
    expect(P.analysis.population.profiles.length).toBe(13);
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
    const nq = by.get('noquota')!;
    expect(nq.plan).toBe('No quota');
    expect(nq.quotaCredits).toBe(0);
    expect(nq.allotment).toBeCloseTo(19, 12);
    expect(nq.utilization).toBeCloseTo(0.5, 9);
    expect(nq.balance).toBeCloseTo(9.5, 9);
    expect(P.analysis.population.fallbackQuotaCredits).toBe(1900);
  });

  it('ranks by gross, ties by name, and assigns Pareto classes', () => {
    const names = P.analysis.population.profiles.map((p) => p.name);
    expect(names).toEqual(['heavy', 'newrun', 'ent', 'champ', 'lapsed', 'burst', 'noquota', 'newbie', 'steady', 'newlapsed', 'tie-a', 'tie-b', 'dormant']);
    const cls = Object.fromEntries(P.analysis.population.profiles.map((p) => [p.name, p.pareto]));
    expect(cls).toMatchObject({ heavy: 'A', newrun: 'A', ent: 'A', champ: 'A', lapsed: 'B', burst: 'B', noquota: 'B', newbie: 'C', steady: 'C', dormant: 'C' });
  });

  it('activity: active days need a daily spend above the threshold, engagement uses workdays since first use', () => {
    expect(by.get('champ')!.activeDays).toBe(31);
    expect(by.get('champ')!.windowWorkdays).toBe(22);
    expect(by.get('champ')!.engagement).toBe('daily');
    expect(by.get('burst')!.activeDays).toBe(2);
    expect(by.get('burst')!.engagement).toBe('rare');
    expect(by.get('dormant')!.activeDays).toBe(2); // $0.10 a day is above the $0.05 threshold
    const strict = P.run(P.filters, mergeSettings({ activeThreshold: 0.11 })).population.profiles.find((p) => p.name === 'dormant')!;
    expect(strict.activeDays).toBe(0);
    expect(strict.activeRate).toBe(0);
    expect(strict.costPerActiveDay).toBeNaN();
    expect(by.get('newbie')!.windowWorkdays).toBe(5); // the window never shrinks below five workdays
    expect(by.get('newbie')!.activeRate).toBe(1);
  });

  it('the daily spend threshold is inclusive (a day at exactly the threshold counts as active)', () => {
    const exact = P.run(P.filters, mergeSettings({ activeThreshold: 0.1 })).population.profiles.find((p) => p.name === 'dormant')!;
    expect(exact.activeDays).toBe(2);
  });

  it('the unattributed row has no profile but is part of the aggregate', () => {
    expect(P.analysis.population.profiles.some((p) => p.name === '')).toBe(false);
    expect(P.analysis.agg.totals.unattributedGross).toBeCloseTo(0.4, 9);
    expect(P.analysis.population.totals.gross).toBeCloseTo(P.analysis.agg.totals.gross - 0.4, 9);
  });

  it('peak day, recent and prior windows', () => {
    const h = by.get('heavy')!;
    expect(h.peakDay).toBeCloseTo(3, 9);
    expect(h.peakShare).toBeCloseTo(3 / 93, 9);
    expect(h.recent).toBeCloseTo(21, 9); // Oct 25–31
    expect(h.prior).toBeCloseTo(21, 9); // Oct 18–24
    expect(h.trend).toBeCloseTo(0, 9);
    const b = by.get('burst')!;
    expect(b.recent).toBeCloseTo(6, 9);
    expect(b.prior).toBe(0);
    expect(b.trend).toBeNaN();
  });
});

const TRAITS: RowSpec[] = [
  ...at('anchor', [1, 31], 1),
  ...spread('nocache', 10, 14, 10, { input: 1_000_000 }),
  ...spread('cachey', 10, 14, 10, { input: 1_000_000, cacheRead: 9_000_000 }),
  ...spread('notokens', 10, 14, 10),
  ...at('spiky', [1, 2, 3, 4, 5], 0.2),
  { date: oct(20), user: 'spiky', gross: 20 },
  ...spread('auto', 1, 10, 10, { model: 'Auto: GPT-5.6 Terra' }),
  ...['m1', 'm2', 'm3', 'm4'].map((model) => ({ date: oct(12), user: 'multi', gross: 2, model })),
  ...['m1', 'm2', 'm3'].map((model) => ({ date: oct(12), user: 'three', gross: 2, model })),
  { date: oct(3), user: 'accel', gross: 0.5 },
  ...spread('accel', 18, 24, 7),
  ...spread('accel', 25, 31, 14),
  { date: oct(2), user: 'fade', gross: 0.5 },
  ...spread('fade', 18, 24, 14),
  { date: oct(25), user: 'fade', gross: 1 },
  ...spread('ccuser', 10, 14, 10, { costCenter: 'CC1' }),
  ...spread('nocc', 10, 14, 10),
];

describe('hand-built scenario: behaviour traits', () => {
  let P: Pipeline;
  let by: Map<string, UserProfile>;
  const traitsOf = (n: string) => by.get(n)!.traits;
  beforeAll(async () => {
    P = await analyzeCsv(makeCsv(TRAITS));
    by = new Map(P.analysis.population.profiles.map((p) => [p.name, p]));
  });

  it('matches the oracle', () => {
    const rows = naiveRows(makeCsv(TRAITS));
    checkProfiles(P.analysis, rows, contextOf(rows, P.settings));
    checkGroups(P.analysis.population);
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
    expect(P.analysis.population.hasCostCenters).toBe(true);
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
  let P: Pipeline;
  beforeAll(async () => {
    P = await analyzeDemo();
  });

  it('are sorted by savings then severity, unique, limited and free of broken text', () => {
    for (const p of P.analysis.population.profiles) {
      const all = userTips(p, P.settings, 100);
      expect(userTips(p, P.settings).length).toBeLessThanOrEqual(6);
      expect(userTips(p, P.settings)).toEqual(all.slice(0, 6));
      expect(userTips(p, P.settings, 2)).toEqual(all.slice(0, 2));
      expect(userTips(p, P.settings, 0)).toEqual([]);
      expect(new Set(all.map((t) => t.id)).size, p.name).toBe(all.length);
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1];
        const b = all[i];
        expect(
          a.savingsUsd > b.savingsUsd || (a.savingsUsd === b.savingsUsd && TIP_RANK[a.severity] <= TIP_RANK[b.severity]),
          `${p.name}: ${a.id} before ${b.id}`,
        ).toBe(true);
      }
      for (const t of all) {
        expect(t.title.length).toBeGreaterThan(0);
        expect(t.detail.length).toBeGreaterThan(0);
        expect(`${t.title} ${t.detail}`, `${p.name}:${t.id}`).not.toMatch(BAD_TEXT);
        expect(Number.isFinite(t.savingsUsd)).toBe(true);
        expect(t.savingsUsd).toBeGreaterThanOrEqual(0);
        expect(t.savingsUsd).toBeLessThanOrEqual(p.gross + 1e-9);
        if (t.docs) expect(t.docs.url.startsWith('https://docs.github.com/')).toBe(true);
      }
      expect(sum(all.map((t) => t.savingsUsd)), p.name).toBeLessThanOrEqual(p.gross + 1e-9);
    }
  });

  it('runaway users get a session-limit tip valued at the cap-runaway lever', () => {
    const runaways = P.analysis.population.profiles.filter((p) => p.tier === 'runaway');
    expect(runaways.length).toBeGreaterThan(0);
    for (const p of runaways) {
      const tips = userTips(p, P.settings, 100);
      const t = tips.find((x) => x.id === 'runaway')!;
      expect(t.severity).toBe('high');
      expect(t.savingsUsd).toBeCloseTo(p.potentialBy.capRunaway, 12);
      expect(t.docs).toEqual(DOCS.sessionLimit);
    }
  });

  it('dormant and minimal-tier users are nudged to use the seat; new users get onboarding tips', () => {
    const minimal = P.analysis.population.profiles.filter((p) => p.tier === 'minimal' && !p.isNew && !p.lapsed);
    expect(minimal.length).toBeGreaterThan(0);
    for (const p of minimal) expect(userTips(p, P.settings, 100).map((t) => t.id)).toContain('low-use');
    const dormant = P.analysis.population.profiles.filter((p) => p.persona === 'dormant');
    expect(dormant.length).toBeGreaterThan(0);
    for (const p of dormant) {
      const tips = userTips(p, P.settings, 100);
      expect(tips.every((t) => t.savingsUsd <= p.gross + 1e-9)).toBe(true);
      expect(tips.map((t) => t.id)).not.toContain('runaway');
    }
    const fresh = P.analysis.population.profiles.filter((p) => p.isNew);
    expect(fresh.length).toBeGreaterThan(0);
    for (const p of fresh) {
      const t = userTips(p, P.settings, 100).find((x) => x.id === 'new')!;
      expect(t.severity).toBe('positive');
      expect(t.savingsUsd).toBe(0);
    }
  });

  it('each trait and persona produces its tip', () => {
    const idsOf = (p: UserProfile) => userTips(p, P.settings, 100).map((t) => t.id);
    const trait: Record<string, string> = {
      spiky: 'spiky',
      lowAuto: 'auto',
      lowCache: 'cache',
      longContext: 'long-context',
      multiModel: 'multi-model',
      accelerating: 'accelerating',
      noCostCenter: 'cost-center',
    };
    for (const p of P.analysis.population.profiles) {
      const ids = idsOf(p);
      for (const [t, tip] of Object.entries(trait)) {
        expect(ids.includes(tip), `${p.name} ${t}`).toBe(p.traits.includes(t as never));
      }
      expect(ids.includes('champion')).toBe(p.persona === 'champion');
      expect(ids.includes('lapsed')).toBe(p.lapsed || p.traits.includes('fading'));
      expect(ids.includes('efficient')).toBe(p.profile === 'efficient' && p.utilization >= 0.4);
    }
  });

  describe('branch conditions with crafted profiles', () => {
    let neutral: UserProfile;
    beforeAll(() => {
      neutral = {
        ...P.analysis.population.profiles[0],
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
    const ids = (p: UserProfile, limit = 100) => userTips(p, P.settings, limit).map((t) => t.id);
    const withBy = (by: Partial<UserProfile['potentialBy']>, over: Partial<UserProfile> = {}): UserProfile => ({
      ...neutral,
      ...over,
      potentialBy: { ...neutral.potentialBy, ...by },
    });

    it('a neutral profile has nothing to say', () => {
      expect(userTips(neutral, P.settings)).toEqual([]);
    });

    it('model tip: 40% on Powerful models and a positive saving; high for frontier users saving ≥ 10%', () => {
      expect(ids(withBy({ modelShift: 5 }, { powerfulShare: 0.39 }))).not.toContain('model');
      expect(ids(withBy({ modelShift: 0 }, { powerfulShare: 0.9 }))).not.toContain('model');
      const medium = userTips(withBy({ modelShift: 5 }, { powerfulShare: 0.4 }), P.settings).find((t) => t.id === 'model')!;
      expect(medium.severity).toBe('medium');
      expect(medium.savingsUsd).toBe(5);
      const smallFrontier = userTips(withBy({ modelShift: 9.9 }, { powerfulShare: 0.8, profile: 'frontier' }), P.settings).find((t) => t.id === 'model')!;
      expect(smallFrontier.severity).toBe('medium');
      const bigFrontier = userTips(withBy({ modelShift: 10 }, { powerfulShare: 0.8, profile: 'frontier' }), P.settings).find((t) => t.id === 'model')!;
      expect(bigFrontier.severity).toBe('high');
    });

    it('auto tip severity depends on the saving (3% of spend)', () => {
      expect(userTips(withBy({ autoAdoption: 2.99 }, { traits: ['lowAuto'], autoShare: 0 }), P.settings).find((t) => t.id === 'auto')!.severity).toBe('low');
      expect(userTips(withBy({ autoAdoption: 3 }, { traits: ['lowAuto'], autoShare: 0 }), P.settings).find((t) => t.id === 'auto')!.severity).toBe('medium');
    });

    it('context tip needs a material spend and a saving ≥ 3% of it', () => {
      expect(ids(withBy({ contextHygiene: 3 }))).toContain('context');
      expect(ids(withBy({ contextHygiene: 2.9 }))).not.toContain('context');
      expect(ids(withBy({ contextHygiene: 0.2 }, { gross: 4 }))).not.toContain('context');
    });

    it('lapsed and fading users get the re-engagement tip with different titles', () => {
      const lapsed = userTips({ ...neutral, lapsed: true, persona: 'lapsed' }, P.settings).find((t) => t.id === 'lapsed')!;
      expect(lapsed.title).toMatch(/^No usage since /);
      const fading = userTips({ ...neutral, traits: ['fading'] }, P.settings).find((t) => t.id === 'lapsed')!;
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
      const peakDayIdx = Math.round(Date.UTC(2026, 8, 3) / 86_400_000);
      const spiky = withBy({}, { traits: ['spiky'], peakShare: 0.84, peakDay: 8, peakDayIdx });
      const t = userTips(spiky, P.settings).find((x) => x.id === 'spiky')!;
      expect(t.title).toBe('84% of your usage happened on Sep 3');
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
      const all = userTips(busy, P.settings, 100);
      expect(all.length).toBeGreaterThan(6);
      expect(userTips(busy, P.settings).length).toBe(6);
      expect(all[0].id).toBe('runaway');
      expect(userTips(busy, P.settings, 1)[0].id).toBe('runaway');
      expect(all[all.length - 1].severity).toBe('positive');
    });
  });
});

describe('per-user action rows', () => {
  let P: Pipeline;
  beforeAll(async () => {
    P = await analyzeDemo();
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
    const set = P.analysis.population;
    const { headers, rows } = userActionRows(set, P.settings);
    expect(headers).toEqual(ACTION_HEADERS);
    expect(headers.length).toBe(34);
    expect(new Set(headers).size).toBe(headers.length);
    expect(rows.length).toBe(set.profiles.length);
    for (const r of rows) expect(r.length).toBe(headers.length);
    expect(rows.map((r) => r[0])).toEqual(set.profiles.map((p) => p.name));
  });

  it('keeps the original 17 columns in place and calls the usage profile "Usage profile"', () => {
    const { headers } = userActionRows(P.analysis.population, P.settings);
    expect(headers[9]).toBe('Usage profile');
    expect(headers.join('|')).not.toMatch(/Model profile/);
    expect(headers[16]).toBe('Top action');
  });

  it('values mirror the profiles and use the taxonomy labels', () => {
    const set = P.analysis.population;
    const tax = buildTaxonomy(P.settings);
    const { rows } = userActionRows(set, P.settings);
    set.profiles.forEach((p, i) => {
      const r = rows[i];
      expect(r[1]).toBe(p.org);
      expect(r[2]).toBe(p.costCenter);
      expect(r[3]).toBe(p.plan);
      expect(r[4]).toBeCloseTo(p.gross, 4);
      expect(r[5]).toBeCloseTo(p.net, 4);
      expect(r[6]).toBeCloseTo(p.utilization, 4);
      expect(r[7]).toBe(tax.tiers.find((t) => t.id === p.tier)!.label);
      expect(r[8]).toBe(tax.personas.find((t) => t.id === p.persona)!.label);
      expect(r[9]).toBe(tax.profiles.find((t) => t.id === p.profile)!.label);
      expect(r[10]).toBe(p.pareto);
      expect(r[11]).toBe(p.traits.map((t) => tax.traits.find((x) => x.id === t)!.label).join('; '));
      expect(r[12]).toBe(p.topModel);
      expect(r[13]).toBeCloseTo(p.autoShare, 4);
      if (Number.isFinite(p.cacheHit)) expect(r[14]).toBeCloseTo(p.cacheHit, 4);
      else expect(r[14]).toBe('');
      expect(r[15]).toBeCloseTo(p.potential, 4);
      const tip = userTips(p, P.settings, 1)[0];
      expect(r[16]).toBe(tip ? `${tip.title}. ${tip.detail}` : '');
      for (const cell of r) {
        if (typeof cell === 'number') expect(Number.isFinite(cell)).toBe(true);
        else expect(String(cell)).not.toMatch(BAD_TEXT);
      }
    });
  });

  it('follows the segment filter (only the visible users)', () => {
    const a = P.run(F({ tiers: ['runaway'] }));
    const { rows } = userActionRows(a.users, P.settings);
    expect(rows.length).toBe(a.users.profiles.length);
    expect(rows.length).toBe(3);
  });

  it('adds the token columns: rounded counts that add up to the total', () => {
    const { rows } = userActionRows(P.analysis.population, P.settings);
    P.analysis.population.profiles.forEach((p, i) => {
      const r = rows[i];
      expect(r[17], p.name).toBe(Math.round(p.input));
      expect(r[18], p.name).toBe(Math.round(p.output));
      expect(r[19], p.name).toBe(Math.round(p.cacheRead));
      expect(r[20], p.name).toBe(Math.round(p.cacheWrite));
      expect(r[21], p.name).toBe(Math.round(p.tokens));
      for (let k = 17; k <= 21; k++) expect(Number.isInteger(r[k]), `${p.name} column ${k}`).toBe(true);
      expect(Math.abs((r[21] as number) - ((r[17] as number) + (r[18] as number) + (r[19] as number) + (r[20] as number))), p.name).toBeLessThanOrEqual(2);
    });
    expect(P.analysis.population.profiles.some((p) => p.tokens > 0)).toBe(true);
  });

  it('adds the Auto columns: billed, original price, discount received and discount missed, plus the use label', () => {
    const tax = buildTaxonomy(P.settings);
    const { rows } = userActionRows(P.analysis.population, P.settings);
    P.analysis.population.profiles.forEach((p, i) => {
      const r = rows[i];
      expect(r[22] as number, p.name).toBeCloseTo(p.auto.billed, 4);
      expect(r[23] as number, p.name).toBeCloseTo(p.auto.original, 4);
      expect(r[24] as number, p.name).toBeCloseTo(p.auto.discount, 4);
      expect(r[25] as number, p.name).toBeCloseTo(p.autoMissed, 4);
      expect(r[26], p.name).toBe(tax.autoUse.find((x) => x.id === p.autoUse)!.label);
      expect((r[23] as number) - (r[22] as number), p.name).toBeCloseTo(r[24] as number, 3);
      for (let k = 22; k <= 25; k++) expect(Number.isFinite(r[k] as number), `${p.name} column ${k}`).toBe(true);
    });
    expect(P.analysis.population.profiles.some((p) => p.auto.billed > 0)).toBe(true);
  });

  it('leaves the license columns blank when no seat list is loaded', () => {
    const { rows } = userActionRows(P.analysis.population, P.settings);
    for (const p of P.analysis.population.profiles) expect(p.license ?? null).toBeNull();
    for (const r of rows) expect(r.slice(27), String(r[0])).toEqual(['', '', '', '', '', '', '']);
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
    const byName = new Map(withRoster.analysis.population.profiles.map((p, i) => [p.name, rows[i]]));
    const a = byName.get(first.name)!;
    expect(a[27]).toBe('Yes');
    expect(a[28]).toBe('Enterprise');
    expect(a[29]).toBe(activityStatusText(withRoster.analysis.population.profiles.find((p) => p.name === first.name)!.license!.status));
    expect(a[30]).toBe('2030-01-21');
    expect(a[31]).toBe(10);
    expect(a[32]).toBe('vscode');
    expect(a[33]).toBe('2030-02-15');
    const b = byName.get(second.name)!;
    expect(b[27]).toBe('No');
    expect(b.slice(28)).toEqual(['', activityStatusText('unknown'), '', '', '', '']);
  });

  it('an empty user set gives only headers', () => {
    const empty = P.run(F({ minUserSpend: 1e9 }));
    const { headers, rows } = userActionRows(empty.users, P.settings);
    expect(headers.length).toBe(34);
    expect(rows).toEqual([]);
  });
});

describe('playbook and taxonomy', () => {
  it('playbook items are complete, unique and link to the GitHub docs', () => {
    expect(PLAYBOOK.length).toBeGreaterThanOrEqual(10);
    expect(new Set(PLAYBOOK.map((i) => i.id)).size).toBe(PLAYBOOK.length);
    expect(new Set(PLAYBOOK.map((i) => i.audience))).toEqual(new Set(['user', 'admin']));
    const levers = new Set<string>(LEVER_ORDER);
    const known = new Set(Object.values(DOCS).map((d) => d.url));
    for (const item of PLAYBOOK) {
      expect(item.title.length, item.id).toBeGreaterThan(0);
      expect(item.why.length, item.id).toBeGreaterThan(0);
      expect(item.how.length, item.id).toBeGreaterThan(0);
      expect(item.docs.length, item.id).toBeGreaterThan(0);
      for (const h of item.how) expect(h.trim().length).toBeGreaterThan(0);
      for (const d of item.docs) {
        expect(d.url.startsWith('https://docs.github.com/'), `${item.id}: ${d.url}`).toBe(true);
        expect(d.label.length).toBeGreaterThan(0);
        expect(known.has(d.url), `${item.id}: ${d.url} is one of the DOCS links`).toBe(true);
      }
      if (item.lever) expect(levers.has(item.lever), `${item.id} lever`).toBe(true);
      expect(`${item.title} ${item.why} ${item.how.join(' ')}`).not.toMatch(BAD_TEXT);
    }
  });

  it('every DOCS link is a unique https://docs.github.com URL', () => {
    const urls = Object.values(DOCS).map((d) => d.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) expect(u.startsWith('https://docs.github.com/en/copilot')).toBe(true);
  });

  it('the taxonomy covers every id exactly once and is text-safe', () => {
    const tax = buildTaxonomy(mergeSettings({}));
    const idsOf = (items: { id: string }[]) => items.map((i) => i.id);
    expect(idsOf(tax.tiers)).toEqual([...TIER_IDS]);
    expect(idsOf(tax.personas).sort()).toEqual([...PERSONA_IDS].sort());
    expect(idsOf(tax.profiles).sort()).toEqual([...PROFILE_IDS].sort());
    expect(idsOf(tax.pareto)).toEqual([...PARETO_IDS]);
    expect(idsOf(tax.traits).sort()).toEqual([...TRAIT_IDS].sort());
    expect(idsOf(tax.engagement).sort()).toEqual([...ENGAGEMENT_IDS, ...LIFECYCLE_IDS].sort());
    const lists: { id: string; label: string; description: string; action: string; color: string }[][] = Object.values(tax);
    for (const items of lists) {
      expect(new Set(items.map((i) => i.label)).size).toBe(items.length);
      for (const i of items) {
        expect(i.label.length).toBeGreaterThan(0);
        expect(i.description.length).toBeGreaterThan(0);
        expect(i.action.length).toBeGreaterThan(0);
        expect(`${i.label} ${i.description} ${i.action}`).not.toMatch(BAD_TEXT);
        expect(i.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('the taxonomy text follows the settings', () => {
    const tax = buildTaxonomy(mergeSettings({ tiers: { minimal: 0.2, light: 0.5, core: 1.5, power: 4 }, lapsedDays: 12, newUserDays: 30 }));
    expect(tax.tiers[0].label).toContain('20%');
    expect(tax.tiers[1].label).toContain('50%');
    expect(tax.tiers[4].label).toContain('400%');
    expect(tax.engagement.find((i) => i.id === 'lapsed')!.description).toContain('12');
    expect(tax.engagement.find((i) => i.id === 'new')!.description).toContain('30');
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
    const keys = cols.map((c) => c.key);
    expect(keys).toEqual(['seatStatus', 'seatPlan', 'lastActivity', 'daysSinceActivity', 'lastSurface', 'seatSince', 'pendingCancellation']);
    for (const c of cols) expect(c.calc?.length ?? 0).toBeGreaterThan(0);
    const status = cols.find((c) => c.key === 'seatStatus')!;
    const plan = cols.find((c) => c.key === 'seatPlan')!;
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
