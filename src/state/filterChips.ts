import { msg, t } from '../i18n';
import type { Filters, ListFilterKey } from '../lib/analytics/filters';
import type { Taxonomy } from '../lib/analytics/taxonomy';
import type { DataStore, DimKey } from '../lib/types';
import { CATEGORIES, labelOf } from '../lib/types';
import { DOW_NAMES, fmtDay } from '../lib/utils/date';
import { fmtUSD } from '../lib/utils/format';

export interface FilterChip {
  id: string;
  /** Short name of the filter, e.g. "User". Already translated. */
  group: string;
  /** What is selected, e.g. "alice". */
  value: string;
  /** Applying this patch to the filters removes just this chip. */
  clear: Partial<Filters>;
}

interface ListSpec {
  key: ListFilterKey;
  /** English name, translated when the chip is built. */
  group: string;
  dim?: DimKey;
  tax?: keyof Taxonomy;
}

const LISTS: ListSpec[] = [
  { key: 'users', group: msg('User'), dim: 'user' },
  { key: 'plans', group: msg('Plan') },
  { key: 'orgs', group: msg('Organization'), dim: 'org' },
  { key: 'costCenters', group: msg('Cost center'), dim: 'costCenter' },
  { key: 'models', group: msg('Model'), dim: 'model' },
  { key: 'vendors', group: msg('Vendor') },
  { key: 'categories', group: msg('Model category') },
  { key: 'products', group: msg('Product'), dim: 'product' },
  { key: 'skus', group: msg('SKU'), dim: 'sku' },
  { key: 'repos', group: msg('Repository'), dim: 'repo' },
  { key: 'apps', group: msg('App'), dim: 'app' },
  { key: 'files', group: msg('File'), dim: 'file' },
  { key: 'segments', group: msg('Persona'), tax: 'personas' },
  { key: 'tiers', group: msg('Usage tier'), tax: 'tiers' },
  { key: 'engagement', group: msg('Engagement'), tax: 'engagement' },
  { key: 'profiles', group: msg('Usage profile'), tax: 'profiles' },
  { key: 'traits', group: msg('Trait'), tax: 'traits' },
  { key: 'paretoClasses', group: msg('Pareto class'), tax: 'pareto' },
  { key: 'autoUse', group: msg('Auto use class'), tax: 'autoUse' },
];

/** Fixed values that are English words (not names from the file), so they are translated. */
const WORD_VALUES = new Set<string>([msg('Other'), ...CATEGORIES]);

/** Beyond this many values a list collapses into one "N selected" chip. */
const MAX_INDIVIDUAL = 3;

/** Describes every active filter as a removable chip. */
export function describeFilters(f: Filters, store: DataStore, taxonomy: Taxonomy): FilterChip[] {
  const chips: FilterChip[] = [];

  if (f.dateFrom !== null || f.dateTo !== null) {
    chips.push({
      id: 'date',
      group: t('Dates'),
      value: t('{from} to {to}', { from: fmtDay(f.dateFrom ?? store.minDay, true), to: fmtDay(f.dateTo ?? store.maxDay, true) }),
      clear: { dateFrom: null, dateTo: null },
    });
  }

  for (const spec of LISTS) {
    const values = f[spec.key];
    if (!values.length) continue;
    const group = t(spec.group);
    const text = (v: string): string => {
      if (spec.dim) return labelOf(spec.dim, v);
      if (spec.tax) return (taxonomy[spec.tax] as { id: string; label: string }[]).find((i) => i.id === v)?.label ?? v;
      return WORD_VALUES.has(v) ? t(v) : v;
    };
    if (values.length <= MAX_INDIVIDUAL) {
      for (const v of values) chips.push({ id: `${spec.key}:${v}`, group, value: text(v), clear: { [spec.key]: values.filter((x) => x !== v) } });
    } else {
      chips.push({ id: spec.key, group, value: t('{n} selected', { n: values.length }), clear: { [spec.key]: [] } });
    }
  }

  if (f.selection !== 'all') chips.push({ id: 'selection', group: t('Model selection'), value: f.selection === 'auto' ? t('Auto only') : t('Manual only'), clear: { selection: 'all' } });
  if (f.billing !== 'all') chips.push({ id: 'billing', group: t('Billing'), value: f.billing === 'covered' ? t('Covered by included credits') : t('Billed overage'), clear: { billing: 'all' } });
  if (f.attribution !== 'all')
    chips.push({ id: 'attribution', group: t('Attribution'), value: f.attribution === 'attributed' ? t('Per-user usage') : t('Repository-level (no user)'), clear: { attribution: 'all' } });
  for (const d of f.weekdays) chips.push({ id: `dow:${d}`, group: t('Weekday'), value: DOW_NAMES[d] ?? String(d), clear: { weekdays: f.weekdays.filter((x) => x !== d) } });
  if (f.minRow !== null) chips.push({ id: 'minRow', group: t('Row cost'), value: t('at least {amount}', { amount: fmtUSD(f.minRow, 'auto') }), clear: { minRow: null } });
  if (f.maxRow !== null) chips.push({ id: 'maxRow', group: t('Row cost'), value: t('at most {amount}', { amount: fmtUSD(f.maxRow, 'auto') }), clear: { maxRow: null } });
  if (f.search.trim()) chips.push({ id: 'search', group: t('Search'), value: `“${f.search.trim()}”`, clear: { search: '' } });
  if (f.minUserSpend !== null) chips.push({ id: 'minUserSpend', group: t('Usage per user'), value: t('at least {amount}', { amount: fmtUSD(f.minUserSpend, 'auto') }), clear: { minUserSpend: null } });
  if (f.maxUserSpend !== null) chips.push({ id: 'maxUserSpend', group: t('Usage per user'), value: t('at most {amount}', { amount: fmtUSD(f.maxUserSpend, 'auto') }), clear: { maxUserSpend: null } });

  return chips;
}

export const chipText = (c: FilterChip): string => `${c.group}: ${c.value}`;
