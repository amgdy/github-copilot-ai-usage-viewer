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
export const isActionable = (r: Recommendation): boolean => r.severity !== 'positive' && r.severity !== 'info';

export { recValue };

export function hasActiveFilters(f: RecFilters): boolean {
  return f.audience !== 'all' || f.themes.length > 0 || f.severities.length > 0 || f.query.trim() !== '' || f.hidePositive;
}

/** Resets every filter and keeps the chosen sort order. */
export const clearFilters = (f: RecFilters): RecFilters => ({ ...DEFAULT_REC_FILTERS, sort: f.sort });

/** Every word must appear somewhere in the title, summary, evidence or actions. */
export function matchesQuery(r: Recommendation, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = [r.title, r.summary, ...r.evidence, ...r.actions].join('\n').toLowerCase();
  return words.every((w) => text.includes(w));
}

/** Applies the filters. `skip` leaves one chip group out, so its chips can show counts for the other filters. */
export function applyFilters(recs: Recommendation[], f: RecFilters, skip?: 'themes' | 'severities'): Recommendation[] {
  return recs.filter(
    (r) =>
      (f.audience === 'all' || r.audience.includes(f.audience)) &&
      (skip === 'themes' || f.themes.length === 0 || f.themes.includes(r.theme)) &&
      (skip === 'severities' || f.severities.length === 0 || f.severities.includes(r.severity)) &&
      (!f.hidePositive || r.severity !== 'positive') &&
      matchesQuery(r, f.query),
  );
}

type Ranked = { rec: Recommendation; index: number };

const COMPARE: Record<SortKey, (a: Ranked, b: Ranked) => number> = {
  priority: (a, b) => SEVERITY_ORDER[a.rec.severity] - SEVERITY_ORDER[b.rec.severity],
  value: (a, b) => recValue(b.rec) - recValue(a.rec),
  confidence: (a, b) => CONFIDENCE_RANK[a.rec.confidence] - CONFIDENCE_RANK[b.rec.confidence],
};

/** Ties keep the order of the input, which is the engine's own priority order. */
export function sortRecs(recs: Recommendation[], key: SortKey): Recommendation[] {
  const compare = COMPARE[key];
  return recs
    .map((rec, index) => ({ rec, index }))
    .sort((a, b) => compare(a, b) || a.index - b.index)
    .map((x) => x.rec);
}

export interface SeverityGroup {
  severity: Severity;
  recs: Recommendation[];
}

export function groupBySeverity(recs: Recommendation[]): SeverityGroup[] {
  return SEVERITIES.map((severity) => ({ severity, recs: recs.filter((r) => r.severity === severity) })).filter((g) => g.recs.length > 0);
}

export function countBy<K extends string>(recs: Recommendation[], keys: readonly K[], pick: (r: Recommendation) => K): Record<K, number> {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const r of recs) out[pick(r)] += 1;
  return out;
}

export interface FacetCounts {
  severity: Record<Severity, number>;
  theme: Record<RecTheme, number>;
}

/** Chip counts: each group is counted over the recommendations that pass every other filter. */
export function facetCounts(recs: Recommendation[], f: RecFilters): FacetCounts {
  return {
    severity: countBy(applyFilters(recs, f, 'severities'), SEVERITIES, (r) => r.severity),
    theme: countBy(applyFilters(recs, f, 'themes'), THEMES, (r) => r.theme),
  };
}

export function toggleIn<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
