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
  items: (t: Taxonomy) => TaxonomyItem[];
  stat: (set: UserSet, id: string) => GroupStat;
  /** Ids of every group the user belongs to. */
  idsOf: (p: UserProfile) => string[];
  /** Groups that overlap the other groups of the lens: a user can be in several of them. */
  overlay: ReadonlySet<string>;
  overlayNote: string | null;
}

const EMPTY: GroupStat = { users: 0, gross: 0, net: 0, potential: 0, allotment: 0 };
const pick = (rec: Record<string, GroupStat>, id: string): GroupStat => rec[id] ?? EMPTY;
const NONE: ReadonlySet<string> = new Set();

export const LENSES: Lens[] = [
  {
    id: 'persona',
    label: msg('Persona'),
    title: msg('The kind of user, such as Champions, New users or Runaway users. Each user has exactly one persona.'),
    calc: 'persona-groups',
    filterKey: 'segments',
    items: (t) => t.personas,
    stat: (s, id) => pick(s.groups.persona, id),
    idsOf: (p) => [p.persona],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'tier',
    label: msg('Usage tier'),
    title: msg('How much of their own included credits a user used, from Minimal to Runaway.'),
    calc: 'spend-tiers',
    filterKey: 'tiers',
    items: (t) => t.tiers,
    stat: (s, id) => pick(s.groups.tier, id),
    idsOf: (p) => [p.tier],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'engagement',
    label: msg('Engagement'),
    title: msg('How often a user is active, from Daily to Rare, plus the New and Lapsed flags.'),
    calc: 'engagement-levels',
    filterKey: 'engagement',
    items: (t) => t.engagement,
    stat: (s, id) => (id === 'new' || id === 'lapsed' ? pick(s.groups.lifecycle, id) : pick(s.groups.engagement, id)),
    idsOf: (p) => {
      const ids: string[] = [p.engagement];
      if (p.isNew) ids.push('new');
      if (p.lapsed) ids.push('lapsed');
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
    items: (t) => t.profiles,
    stat: (s, id) => pick(s.groups.profile, id),
    idsOf: (p) => [p.profile],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'pareto',
    label: msg('Pareto class'),
    title: msg('Where a user ranks by usage. Class A holds most of the usage, and class C is the long tail.'),
    calc: 'pareto-classes',
    filterKey: 'paretoClasses',
    items: (t) => t.pareto,
    stat: (s, id) => pick(s.groups.pareto, id),
    idsOf: (p) => [p.pareto],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'autoUse',
    label: msg('Auto use class'),
    title: msg('Whether a user lets Auto pick the model and gets the Auto discount, or picks models by hand.'),
    calc: 'auto-use-class',
    filterKey: 'autoUse',
    items: (t) => t.autoUse,
    stat: (s, id) => pick(s.groups.autoUse, id),
    idsOf: (p) => [p.autoUse],
    overlay: NONE,
    overlayNote: null,
  },
  {
    id: 'trait',
    label: msg('Traits'),
    title: msg('Habits that cost money or need attention. A user can have several traits or none.'),
    calc: 'user-traits',
    filterKey: 'traits',
    items: (t) => t.traits,
    stat: (s, id) => pick(s.groups.trait, id),
    idsOf: (p) => p.traits,
    overlay: new Set<string>(TRAIT_IDS),
    overlayNote: msg('A user can have several traits or none. Users, usage and potential savings of different traits overlap, so they are not added up.'),
  },
];

export const LENS_BY_ID = Object.fromEntries(LENSES.map((l) => [l.id, l])) as Record<LensId, Lens>;

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
export function unavailableReason(lens: LensId, id: string, a: Availability): string | null {
  if (lens !== 'trait') return null;
  switch (id) {
    case 'lowCache':
    case 'longContext':
      if (!a.hasTokens) return t('Needs token columns, and this report has none.');
      return a.hasModels ? null : t(NEEDS_MODELS);
    case 'lowAuto':
    case 'multiModel':
      return a.hasModels ? null : t(NEEDS_MODELS);
    case 'accelerating':
    case 'fading':
      return a.trendReliable ? null : t('Needs at least 14 days in the selected range to compare two weeks.');
    case 'noCostCenter':
      return a.hasCostCenters ? null : t('The report has no cost centers.');
    default:
      return null;
  }
}

/**
 * Why the groups of a whole lens would be meaningless in the current data, or null when they are real.
 * Without a model column every user is Not enough data (Auto use class) or Balanced (usage profile).
 */
export function lensUnavailableReason(lens: LensId, a: Availability): string | null {
  if (a.hasModels) return null;
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
  let n = 0;
  for (const p of population.profiles) if (p.quotaCredits <= 0) n++;
  return n;
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
  const t: GroupStat = { ...EMPTY };
  for (const p of profiles) {
    if (p.traits.length === 0) continue;
    t.users++;
    t.gross += p.gross;
    t.net += p.net;
    t.potential += p.potential;
    t.allotment += p.allotment;
  }
  return t;
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

  const tops = new Map<string, UserProfile[]>(items.map((i) => [i.id, []]));
  let open = items.length;
  for (const p of population.profiles) {
    for (const id of lens.idsOf(p)) {
      const list = tops.get(id);
      if (list && list.length < TOP_USERS) {
        list.push(p);
        if (list.length === TOP_USERS) open--;
      }
    }
    if (open === 0) break;
  }

  const rows = items.map((item): GroupRow => {
    const s = lens.stat(population, item.id);
    return {
      id: item.id,
      item,
      users: s.users,
      gross: s.gross,
      net: s.net,
      potential: s.potential,
      allotment: s.allotment,
      balance: s.allotment - s.gross,
      userShare: share(s.users, everyone.users),
      usageShare: share(s.gross, everyone.gross),
      perUserMonth: s.users > 0 ? (s.gross / s.users) * perMonth : Number.NaN,
      overlay: lens.overlay.has(item.id),
      active: activeIds.includes(item.id),
      unavailable: unavailableReason(lens.id, item.id, availability),
      top: tops.get(item.id) ?? [],
    };
  });

  const allOverlap = rows.length > 0 && rows.every((r) => r.overlay);
  return {
    lens,
    rows,
    total: allOverlap ? usersWithTraits(population.profiles) : everyone,
    everyone,
    used: rows.filter((r) => r.users > 0).length,
    unsupported: lensUnavailableReason(lens.id, availability),
  };
}

/** The row with the largest value among groups that have users; null when that value is not positive. */
export function maxRow(rows: GroupRow[], by: (r: GroupRow) => number): GroupRow | null {
  let best: GroupRow | null = null;
  for (const r of rows) {
    if (r.users > 0 && Number.isFinite(by(r)) && (best === null || by(r) > by(best))) best = r;
  }
  return best !== null && by(best) > 0 ? best : null;
}

export function minRow(rows: GroupRow[], by: (r: GroupRow) => number): GroupRow | null {
  let best: GroupRow | null = null;
  for (const r of rows) {
    if (r.users > 0 && Number.isFinite(by(r)) && (best === null || by(r) < by(best))) best = r;
  }
  return best;
}

/** Most usage first, then most users, so the groups that matter most come first. Ties keep the order of the lens. */
export function byImpact(rows: GroupRow[]): GroupRow[] {
  return [...rows].sort((a, b) => b.gross - a.gross || b.users - a.users);
}

/** Whole-percent text for prose that never shows a non-zero share as 0%. */
function pct0(v: number): string {
  if (!Number.isFinite(v)) return '–';
  return v > 0 && v < 0.01 ? t('under 1%') : fmtPct(v, 0);
}

function usd(v: number): string {
  if (v >= 10) return fmtUSD(v, 0);
  return v >= 0.01 ? fmtUSD(v, 2) : t('under $0.01');
}

/** How much of the users or of the usage a finding is about, so the findings can be listed largest first. */
const reach = (...rows: { userShare: number; usageShare: number }[]): number => Math.max(0, ...rows.map((r) => Math.max(r.userShare, r.usageShare)));

/** Plain-language findings for the selected lens, the one about the most users or the most usage first. */
export function buildInsights(data: LensData): string[] {
  const { lens, rows, total, everyone } = data;
  const used = rows.filter((r) => r.users > 0);
  const found: { text: string; reach: number }[] = [];
  if (everyone.users === 0) return [t('There are no individual users in the data in view.')];
  if (used.length === 0) return [t('No user has any of these traits in the data in view.')];

  if (lens.id === 'trait') {
    const withTrait = share(total.users, everyone.users);
    found.push({
      text: tp(total.users, '{n} user ({share}) has at least one trait. Each user is counted once.', '{n} users ({share}) have at least one trait. Each user is counted once.', {
        n: fmtInt(total.users),
        share: pct0(withTrait),
      }),
      reach: reach({ userShare: withTrait, usageShare: share(total.gross, everyone.gross) }),
    });
    const common = maxRow(rows, (r) => r.users);
    if (common) {
      found.push({
        text: t('{trait} is the most common trait, found in {users}.', { trait: common.item.label, users: pluralize(common.users, 'user') }),
        reach: reach(common),
      });
    }
  } else {
    const core = used.filter((r) => !r.overlay);
    if (core.length === 1) return [t('Every user is in one group ({group}), so there is nothing to compare for this lens. Try another lens.', { group: core[0].item.label })];
  }

  const density = (r: GroupRow): number => share(r.usageShare, r.userShare);
  const heavy = maxRow(
    used.filter((r) => r.usageShare >= 0.1),
    density,
  );
  if (heavy && density(heavy) >= 1.5) {
    found.push({
      text: t('{group} is {users} of users but {usage} of usage.', { group: heavy.item.label, users: pct0(heavy.userShare), usage: pct0(heavy.usageShare) }),
      reach: reach(heavy),
    });
  }
  const lightRows = used.filter((r) => r.userShare >= 0.15);
  const light = minRow(lightRows, density);
  if (light && density(light) <= 0.5) {
    const vars = { group: light.item.label, users: pct0(light.userShare), usage: pct0(light.usageShare) };
    const tiny = light.usageShare > 0 && light.usageShare < 0.01;
    found.push({
      text: tiny ? t('{group} is {users} of users but {usage} of usage.', vars) : t('{group} is {users} of users but only {usage} of usage.', vars),
      reach: reach(light),
    });
  }

  const top = lens.id === 'trait' ? null : maxRow(rows, (r) => r.potential);
  if (top && total.potential > 0 && top.potential / total.potential >= 0.25) {
    found.push({
      text: t('{group} holds {share} of the potential savings: {amount} of an estimated {total}.', {
        group: top.item.label,
        share: pct0(top.potential / total.potential),
        amount: fmtUSD(top.potential, 0),
        total: fmtUSD(total.potential, 0),
      }),
      reach: reach(top),
    });
  }

  const hi = maxRow(rows, (r) => r.perUserMonth);
  const lo = minRow(rows, (r) => r.perUserMonth);
  if (hi && lo && hi !== lo && lo.perUserMonth > 0 && hi.perUserMonth / lo.perUserMonth >= 2) {
    const ratio = hi.perUserMonth / lo.perUserMonth;
    found.push({
      text: t('Per user, per month, usage is {low} in {lowGroup} and {high} in {highGroup}, {ratio} apart.', {
        low: usd(lo.perUserMonth),
        lowGroup: lo.item.label,
        high: usd(hi.perUserMonth),
        highGroup: hi.item.label,
        ratio: ratio >= 1000 ? t('over 1,000×') : fmtMultiple(ratio),
      }),
      reach: reach(hi, lo),
    });
  }
  if (found.length === 0) return [t('Usage is spread fairly evenly across these groups.')];
  return found.sort((x, y) => y.reach - x.reach).map((f) => f.text);
}
