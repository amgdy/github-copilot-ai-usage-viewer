import { getLocale, t as translate } from '../../i18n/core.ts';
import { CORE_DOCS } from './docs/core';
import { DATA_DOCS } from './docs/data';
import { EFFICIENCY_DOCS } from './docs/efficiency';
import { LICENSES_DOCS } from './docs/licenses';
import { LICENSES_PAGE_DOCS } from './docs/licenses-page';
import { MODELS_DOCS } from './docs/models';
import { ORGANIZATION_DOCS } from './docs/organization';
import { OVERVIEW_DOCS } from './docs/overview';
import { PATTERNS_DOCS } from './docs/patterns';
import { RECOMMENDATIONS_DOCS } from './docs/recommendations';
import { SEGMENTS_DOCS } from './docs/segments';
import { SPEND_DOCS } from './docs/spend';
import { USERS_DOCS } from './docs/users';
import { METRIC_AREAS, type MetricArea, type MetricDoc } from './types';

/** Every explanation, in reading order: by area, then in the order the docs files list them. */
export const METRICS: readonly MetricDoc[] = (() => {
  const all = [
    ...CORE_DOCS,
    ...OVERVIEW_DOCS,
    ...SPEND_DOCS,
    ...USERS_DOCS,
    ...SEGMENTS_DOCS,
    ...MODELS_DOCS,
    ...EFFICIENCY_DOCS,
    ...LICENSES_DOCS,
    ...LICENSES_PAGE_DOCS,
    ...ORGANIZATION_DOCS,
    ...PATTERNS_DOCS,
    ...RECOMMENDATIONS_DOCS,
    ...DATA_DOCS,
  ];
  const order = new Map<MetricArea, number>(METRIC_AREAS.map((a, i) => [a, i]));
  return all
    .map((doc, i) => ({ doc, i }))
    .sort((a, b) => (order.get(a.doc.area) ?? 0) - (order.get(b.doc.area) ?? 0) || a.i - b.i)
    .map((x) => x.doc);
})();

const BY_ID = new Map<string, MetricDoc>(METRICS.map((m) => [m.id, m]));

export const metricDoc = (id: string): MetricDoc | undefined => BY_ID.get(id);

export interface MetricGroup {
  area: MetricArea;
  docs: MetricDoc[];
}

/** The docs grouped by area; areas without a doc are left out. */
export function metricsByArea(docs: readonly MetricDoc[] = METRICS): MetricGroup[] {
  const groups: MetricGroup[] = [];
  for (const area of METRIC_AREAS) {
    const inArea = docs.filter((d) => d.area === area);
    if (inArea.length) groups.push({ area, docs: inArea });
  }
  return groups;
}

const docTexts = (d: MetricDoc): string[] => [d.title, d.meaning, d.formula, ...(d.steps ?? []), ...(d.notes ?? []), d.example ?? ''];

/** English text plus the current translation, so a search in either language finds the explanation. */
const textOf = (d: MetricDoc): string => {
  const en = docTexts(d);
  const shown = getLocale() === 'en' ? [] : en.map((s) => (s ? translate(s) : ''));
  return [d.id.replace(/-/g, ' '), ...en, ...(d.columns ?? []), ...shown].join(' ').toLowerCase();
};

/** Docs that contain every word of the query, in any field. An empty query returns everything. */
export function searchMetrics(query: string, docs: readonly MetricDoc[] = METRICS): MetricDoc[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...docs];
  return docs.filter((d) => {
    const hay = textOf(d);
    return terms.every((term) => hay.includes(term));
  });
}
