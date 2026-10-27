import type { Filters } from '../../lib/analytics/filters';
import type { Taxonomy, TaxonomyItem } from '../../lib/analytics/taxonomy';
import { TRAIT_IDS, type GroupStat, type UserProfile, type UserSet } from '../../lib/analytics/users';
import { fmtInt, fmtMultiple, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { msg, t, tp } from '../../i18n';

export type LensId = 'persona' | 'tier' | 'engagement' | 'profile' | 'pareto' | 'autoUse' | 'trait';
export type LensFilterKey = 'segments' | 'tiers' | 'engagement' | 'profiles' | 'paretoClasses' | 'autoUse' | 'traits';

/** The texts of a lens are English keys (marked with msg); show them with t(). */
export interface Lens {
  id: LensId;
  label: string;
  /** Tooltip of the lens switcher. */
  title: string;
  /** Id of the metric doc that explains how the groups of this lens are decided. */
  calc: string;
  filterKey: LensFilterKey;
  items: (taxonomy: Taxonomy) => TaxonomyItem[];
  stat: (set: UserSet, id: string) => GroupStat;
  /** Ids of every group the user belongs to. */
  idsOf: (user: UserProfile) => string[];
  /** Groups that overlap the other groups of the lens: a user can be in several of them. */
  overlay: ReadonlySet<string>;
  overlayNote: string | null;
}

const EMPTY: GroupStat = { users: 0, gross: 0, net: 0, potential: 0, allotment: 0 };
const pick = (statsById: Record<string, GroupStat>, id: string): GroupStat => statsById[id] ?? EMPTY;
const NONE: ReadonlySet<string> = new Set();

export const LENSES: Lens[] = [
  {
    id: 'persona',
    label: msg('Persona'),
    title: msg('The kind of user, such as Champions, New users or Runaway users. Each user has exactly one persona.'),
    calc: 'persona-groups',
    filterKey: 'segments',
    items: (taxonomy) => taxonomy.personas,
    stat: (population, id) => pick(population.groups.persona, id),
    idsOf: (user) => [user.persona],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'tier',
    label: msg('Usage tier'),
    title: msg('How much of their own included credits a user used, from Minimal to Runaway.'),
    calc: 'spend-tiers',
    filterKey: 'tiers',
    items: (taxonomy) => taxonomy.tiers,
    stat: (population, id) => pick(population.groups.tier, id),
    idsOf: (user) => [user.tier],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'engagement',
    label: msg('Engagement'),
    title: msg('How often a user is active, from Daily to Rare, plus the New and Lapsed flags.'),
    calc: 'engagement-levels',
    filterKey: 'engagement',
    items: (taxonomy) => taxonomy.engagement,
    stat: (population, id) => (id === 'new' || id === 'lapsed' ? pick(population.groups.lifecycle, id) : pick(population.groups.engagement, id)),
    idsOf: (user) => {
      const ids: string[] = [user.engagement];
      if (user.isNew) ids.push('new');
      if (user.lapsed) ids.push('lapsed');
      return ids;
    },
    overlay: new Set(['new', 'lapsed']),
    overlayNote: msg('New and Lapsed are flags. Those users are also counted in one of the four activity levels, so only Daily to Rare add up to all users.'),
  },
  {
    id: 'profile',
    label: msg('Usage profile'),
    title: msg('Which model tiers a user relies on: Efficient, Balanced or Frontier-heavy.'),
    calc: 'usage-profiles',
    filterKey: 'profiles',
    items: (taxonomy) => taxonomy.profiles,
    stat: (population, id) => pick(population.groups.profile, id),
    idsOf: (user) => [user.profile],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'pareto',
    label: msg('Pareto class'),
    title: msg('Where a user ranks by usage. Class A holds most of the usage, and class C is the long tail.'),
    calc: 'pareto-classes',
    filterKey: 'paretoClasses',
    items: (taxonomy) => taxonomy.pareto,
    stat: (population, id) => pick(population.groups.pareto, id),
    idsOf: (user) => [user.pareto],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'autoUse',
    label: msg('Auto use class'),
    title: msg('Whether a user lets Auto pick the model and gets the Auto discount, or picks models by hand.'),
    calc: 'auto-use-class',
    filterKey: 'autoUse',
    items: (taxonomy) => taxonomy.autoUse,
    stat: (population, id) => pick(population.groups.autoUse, id),
    idsOf: (user) => [user.autoUse],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'trait',
    label: msg('Traits'),
    title: msg('Habits that cost money or need attention. A user can have several traits or none.'),
    calc: 'user-traits',
    filterKey: 'traits',
    items: (taxonomy) => taxonomy.traits,
    stat: (population, id) => pick(population.groups.trait, id),
    idsOf: (user) => user.traits,
    overlay: new Set<string>(TRAIT_IDS),
    overlayNote: msg('A user can have several traits or none. Users, usage and potential savings of different traits overlap, so they are not added up.'),
  },
];

export const LENS_BY_ID = Object.fromEntries(LENSES.map((lens) => [lens.id, lens])) as Record<LensId, Lens>;

/** A filter patch that selects one group of a lens (or several, or none). */
export const filterPatch = (key: LensFilterKey, ids: string[]): Partial<Filters> => ({ [key]: ids });

export interface Availability {
  hasTokens: boolean;
  /** The report names the model of its rows (a model column with at least one value). */
  hasModels: boolean;
  trendReliable: boolean;
  hasCostCenters: boolean;
}

const NEEDS_MODELS = msg('Needs model names, and this report has none.');

/** Why a trait cannot be detected in the current data, or null when it can. */
export function unavailableReason(lens: LensId, id: string, availability: Availability): string | null {
  if (lens !== 'trait') return null;
  switch (id) {
    case 'lowCache':
    case 'longContext':
      if (!availability.hasTokens) return t('Needs token columns, and this report has none.');
      return availability.hasModels ? null : t(NEEDS_MODELS);
    case 'lowAuto':
    case 'multiModel':
      return availability.hasModels ? null : t(NEEDS_MODELS);
    case 'accelerating':
    case 'fading':
      return availability.trendReliable ? null : t('Needs at least 14 days in the selected range to compare two weeks.');
    case 'noCostCenter':
      return availability.hasCostCenters ? null : t('The report has no cost centers.');
    default:
      return null;
  }
}

/**
 * Why the groups of a whole lens would be meaningless in the current data, or null when they are real.
 * Without a model column every user is Not enough data (Auto use class) or Balanced (usage profile).
 */
export function lensUnavailableReason(lens: LensId, availability: Availability): string | null {
  if (availability.hasModels) return null;
  switch (lens) {
    case 'autoUse':
      return t(
        'This report has no model names (the model column is missing or empty), so usage that went through Auto cannot be told apart from other usage. Every user would be Not enough data. Load a report with a model column to compare users by Auto use class.',
      );
    case 'profile':
      return t(
        'This report has no model names (the model column is missing or empty), so the model tier of each user’s usage is unknown. Every user would be Balanced. Load a report with a model column to compare users by usage profile.',
      );
    default:
      return null;
  }
}

/** Users whose seat is not in the report, so their included credits are an assumption. */
export function assumedSeatCount(population: UserSet): number {
  let count = 0;
  for (const user of population.profiles) if (user.quotaCredits <= 0) count++;
  return count;
}

export interface GroupRow {
  id: string;
  item: TaxonomyItem;
  users: number;
  gross: number;
  net: number;
  potential: number;
  allotment: number;
  /** Included credits minus usage (negative = draws from the shared pool). */
  balance: number;
  userShare: number;
  usageShare: number;
  /** Average usage per user, scaled to a 30.4-day month. NaN for an empty group. */
  perUserMonth: number;
  overlay: boolean;
  /** The group is selected in the filters. */
  active: boolean;
  unavailable: string | null;
  /** Heaviest users of the group, largest usage first. */
  top: UserProfile[];
}

export interface LensData {
  lens: Lens;
  rows: GroupRow[];
  /** Footer of the table: everyone, or for overlapping groups each user with at least one group counted once. */
  total: GroupStat;
  /** Everyone in scope: the denominator of the shares. */
  everyone: GroupStat;
  used: number;
  /** Why the groups of this lens are not meaningful in the current data, or null when they are. */
  unsupported: string | null;
}

const TOP_USERS = 5;
export const share = (part: number, whole: number): number => (whole > 0 ? part / whole : 0);

function usersWithTraits(profiles: UserProfile[]): GroupStat {
  const total: GroupStat = { ...EMPTY };
  for (const user of profiles) {
    if (user.traits.length === 0) continue;
    total.users++;
    total.gross += user.gross;
    total.net += user.net;
    total.potential += user.potential;
    total.allotment += user.allotment;
  }
  return total;
}

export function buildLens(
  lens: Lens,
  taxonomy: Taxonomy,
  population: UserSet,
  activeIds: readonly string[],
  perMonth: number,
  availability: Availability,
): LensData {
  const items = lens.items(taxonomy);
  const everyone = population.totals;

  const tops = new Map<string, UserProfile[]>(items.map((item) => [item.id, []]));
  let open = items.length;
  for (const user of population.profiles) {
    for (const id of lens.idsOf(user)) {
      const list = tops.get(id);
      if (list && list.length < TOP_USERS) {
        list.push(user);
        if (list.length === TOP_USERS) open--;
      }
    }
    if (open === 0) break;
  }

  const rows = items.map((item): GroupRow => {
    const groupStat = lens.stat(population, item.id);
    return {
      id: item.id,
      item,
      users: groupStat.users,
      gross: groupStat.gross,
      net: groupStat.net,
      potential: groupStat.potential,
      allotment: groupStat.allotment,
      balance: groupStat.allotment - groupStat.gross,
      userShare: share(groupStat.users, everyone.users),
      usageShare: share(groupStat.gross, everyone.gross),
      perUserMonth: groupStat.users > 0 ? (groupStat.gross / groupStat.users) * perMonth : Number.NaN,
      overlay: lens.overlay.has(item.id),
      active: activeIds.includes(item.id),
      unavailable: unavailableReason(lens.id, item.id, availability),
      top: tops.get(item.id) ?? [],
    };
  });

  const allOverlap = rows.length > 0 && rows.every((row) => row.overlay);
  return {
    lens,
    rows,
    total: allOverlap ? usersWithTraits(population.profiles) : everyone,
    everyone,
    used: rows.filter((row) => row.users > 0).length,
    unsupported: lensUnavailableReason(lens.id, availability),
  };
}

/** The row with the largest value among groups that have users; null when that value is not positive. */
export function maxRow(rows: GroupRow[], by: (row: GroupRow) => number): GroupRow | null {
  let best: GroupRow | null = null;
  for (const row of rows) {
    if (row.users > 0 && Number.isFinite(by(row)) && (best === null || by(row) > by(best))) best = row;
  }
  return best !== null && by(best) > 0 ? best : null;
}

export function minRow(rows: GroupRow[], by: (row: GroupRow) => number): GroupRow | null {
  let best: GroupRow | null = null;
  for (const row of rows) {
    if (row.users > 0 && Number.isFinite(by(row)) && (best === null || by(row) < by(best))) best = row;
  }
  return best;
}

/** Most usage first, then most users, so the groups that matter most come first. Ties keep the order of the lens. */
export function byImpact(rows: GroupRow[]): GroupRow[] {
  return [...rows].sort((a, b) => b.gross - a.gross || b.users - a.users);
}

/** Whole-percent text for prose that never shows a non-zero share as 0%. */
function wholePercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return '–';
  return fraction > 0 && fraction < 0.01 ? t('under 1%') : fmtPct(fraction, 0);
}

function usd(amount: number): string {
  if (amount >= 10) return fmtUSD(amount, 0);
  return amount >= 0.01 ? fmtUSD(amount, 2) : t('under $0.01');
}

/** How much of the users or of the usage a finding is about, so the findings can be listed largest first. */
const reach = (...rows: { userShare: number; usageShare: number }[]): number => Math.max(0, ...rows.map((row) => Math.max(row.userShare, row.usageShare)));

/** Plain-language findings for the selected lens, the one about the most users or the most usage first. */
export function buildInsights(data: LensData): string[] {
  const { lens, rows, total, everyone } = data;
  const used = rows.filter((row) => row.users > 0);
  const found: { text: string; reach: number }[] = [];
  if (everyone.users === 0) return [t('There are no individual users in the data in view.')];
  if (used.length === 0) return [t('No user has any of these traits in the data in view.')];

  if (lens.id === 'trait') {
    const withTrait = share(total.users, everyone.users);
    found.push({
      text: tp(total.users, '{n} user ({share}) has at least one trait. Each user is counted once.', '{n} users ({share}) have at least one trait. Each user is counted once.', {
        n: fmtInt(total.users),
        share: wholePercent(withTrait),
      }),
      reach: reach({ userShare: withTrait, usageShare: share(total.gross, everyone.gross) }),
    });
    const common = maxRow(rows, (row) => row.users);
    if (common) {
      found.push({
        text: t('{trait} is the most common trait, found in {users}.', { trait: common.item.label, users: pluralize(common.users, 'user') }),
        reach: reach(common),
      });
    }
  } else {
    const core = used.filter((row) => !row.overlay);
    if (core.length === 1) return [t('Every user is in one group ({group}), so there is nothing to compare for this lens. Try another lens.', { group: core[0].item.label })];
  }

  const density = (row: GroupRow): number => share(row.usageShare, row.userShare);
  const heavy = maxRow(
    used.filter((row) => row.usageShare >= 0.1),
    density,
  );
  if (heavy && density(heavy) >= 1.5) {
    found.push({
      text: t('{group} is {users} of users but {usage} of usage.', { group: heavy.item.label, users: wholePercent(heavy.userShare), usage: wholePercent(heavy.usageShare) }),
      reach: reach(heavy),
    });
  }
  const lightRows = used.filter((row) => row.userShare >= 0.15);
  const light = minRow(lightRows, density);
  if (light && density(light) <= 0.5) {
    const values = { group: light.item.label, users: wholePercent(light.userShare), usage: wholePercent(light.usageShare) };
    const tiny = light.usageShare > 0 && light.usageShare < 0.01;
    found.push({
      text: tiny ? t('{group} is {users} of users but {usage} of usage.', values) : t('{group} is {users} of users but only {usage} of usage.', values),
      reach: reach(light),
    });
  }

  const top = lens.id === 'trait' ? null : maxRow(rows, (row) => row.potential);
  if (top && total.potential > 0 && top.potential / total.potential >= 0.25) {
    found.push({
      text: t('{group} holds {share} of the potential savings: {amount} of an estimated {total}.', {
        group: top.item.label,
        share: wholePercent(top.potential / total.potential),
        amount: fmtUSD(top.potential, 0),
        total: fmtUSD(total.potential, 0),
      }),
      reach: reach(top),
    });
  }

  const highest = maxRow(rows, (row) => row.perUserMonth);
  const lowest = minRow(rows, (row) => row.perUserMonth);
  if (highest && lowest && highest !== lowest && lowest.perUserMonth > 0 && highest.perUserMonth / lowest.perUserMonth >= 2) {
    const ratio = highest.perUserMonth / lowest.perUserMonth;
    found.push({
      text: t('Per user, per month, usage is {low} in {lowGroup} and {high} in {highGroup}, {ratio} apart.', {
        low: usd(lowest.perUserMonth),
        lowGroup: lowest.item.label,
        high: usd(highest.perUserMonth),
        highGroup: highest.item.label,
        ratio: ratio >= 1000 ? t('over 1,000×') : fmtMultiple(ratio),
      }),
      reach: reach(highest, lowest),
    });
  }
  if (found.length === 0) return [t('Usage is spread fairly evenly across these groups.')];
  return found.sort((first, second) => second.reach - first.reach).map((finding) => finding.text);
}
