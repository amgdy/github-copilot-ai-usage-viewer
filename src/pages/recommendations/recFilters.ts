import {
  SEVERITY_ORDER,
  recValue,
  type Audience,
  type Confidence,
  type RecTheme,
  type Recommendation,
  type Severity,
} from '../../lib/analytics/recommendations';

export type AudienceFilter = 'all' | Audience;
export type SortKey = 'priority' | 'value' | 'confidence';

export interface RecFilters {
  audience: AudienceFilter;
  /** Empty means every theme. */
  themes: RecTheme[];
  /** Empty means every severity. */
  severities: Severity[];
  query: string;
  sort: SortKey;
  hidePositive: boolean;
}

export const DEFAULT_REC_FILTERS: RecFilters = {
  audience: 'all',
  themes: [],
  severities: [],
  query: '',
  sort: 'value',
  hidePositive: false,
};

export const THEMES: RecTheme[] = ['cost', 'pool', 'efficiency', 'adoption', 'governance', 'data'];
export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info', 'positive'];

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };

/** Findings that ask someone to do something (not "good news" or background information). */
export const isActionable = (recommendation: Recommendation): boolean => recommendation.severity !== 'positive' && recommendation.severity !== 'info';

export { recValue };

export function hasActiveFilters(filters: RecFilters): boolean {
  return filters.audience !== 'all' || filters.themes.length > 0 || filters.severities.length > 0 || filters.query.trim() !== '' || filters.hidePositive;
}

/** Resets every filter and keeps the chosen sort order. */
export const clearFilters = (filters: RecFilters): RecFilters => ({ ...DEFAULT_REC_FILTERS, sort: filters.sort });

/** Every word must appear somewhere in the title, summary, evidence or actions. */
export function matchesQuery(recommendation: Recommendation, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = [recommendation.title, recommendation.summary, ...recommendation.evidence, ...recommendation.actions].join('\n').toLowerCase();
  return words.every((word) => text.includes(word));
}

/** Applies the filters. `skip` leaves one chip group out, so its chips can show counts for the other filters. */
export function applyFilters(recommendations: Recommendation[], filters: RecFilters, skip?: 'themes' | 'severities'): Recommendation[] {
  return recommendations.filter(
    (recommendation) =>
      (filters.audience === 'all' || recommendation.audience.includes(filters.audience)) &&
      (skip === 'themes' || filters.themes.length === 0 || filters.themes.includes(recommendation.theme)) &&
      (skip === 'severities' || filters.severities.length === 0 || filters.severities.includes(recommendation.severity)) &&
      (!filters.hidePositive || recommendation.severity !== 'positive') &&
      matchesQuery(recommendation, filters.query),
  );
}

type Ranked = { rec: Recommendation; index: number };

const COMPARE: Record<SortKey, (a: Ranked, b: Ranked) => number> = {
  priority: (a, b) => SEVERITY_ORDER[a.rec.severity] - SEVERITY_ORDER[b.rec.severity],
  value: (a, b) => recValue(b.rec) - recValue(a.rec),
  confidence: (a, b) => CONFIDENCE_RANK[a.rec.confidence] - CONFIDENCE_RANK[b.rec.confidence],
};

/** Ties keep the order of the input, which is the engine's own priority order. */
export function sortRecs(recommendations: Recommendation[], key: SortKey): Recommendation[] {
  const compare = COMPARE[key];
  return recommendations
    .map((recommendation, index) => ({ rec: recommendation, index }))
    .sort((a, b) => compare(a, b) || a.index - b.index)
    .map((ranked) => ranked.rec);
}

export interface SeverityGroup {
  severity: Severity;
  recs: Recommendation[];
}

export function groupBySeverity(recommendations: Recommendation[]): SeverityGroup[] {
  return SEVERITIES.map((severity) => ({ severity, recs: recommendations.filter((recommendation) => recommendation.severity === severity) })).filter((group) => group.recs.length > 0);
}

export function countBy<K extends string>(recommendations: Recommendation[], keys: readonly K[], pick: (recommendation: Recommendation) => K): Record<K, number> {
  const out = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
  for (const recommendation of recommendations) out[pick(recommendation)] += 1;
  return out;
}

export interface FacetCounts {
  severity: Record<Severity, number>;
  theme: Record<RecTheme, number>;
}

/** Chip counts: each group is counted over the recommendations that pass every other filter. */
export function facetCounts(recommendations: Recommendation[], filters: RecFilters): FacetCounts {
  return {
    severity: countBy(applyFilters(recommendations, filters, 'severities'), SEVERITIES, (recommendation) => recommendation.severity),
    theme: countBy(applyFilters(recommendations, filters, 'themes'), THEMES, (recommendation) => recommendation.theme),
  };
}

export function toggleIn<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((existing) => existing !== item) : [...list, item];
}
