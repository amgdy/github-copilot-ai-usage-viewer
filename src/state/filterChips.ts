import { msg, t } from '../i18n';
import type { Filters, ListFilterKey } from '../lib/analytics/filters';
import type { Taxonomy } from '../lib/analytics/taxonomy';
import type { DataStore, DimKey } from '../lib/types';
import { CATEGORIES, labelOf } from '../lib/types';
import { WEEKDAY_NAMES, fmtDay } from '../lib/utils/date';
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
export function describeFilters(filters: Filters, store: DataStore, taxonomy: Taxonomy): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.dateFrom !== null || filters.dateTo !== null) {
    chips.push({
      id: 'date',
      group: t('Dates'),
      value: t('{from} to {to}', { from: fmtDay(filters.dateFrom ?? store.minDay, true), to: fmtDay(filters.dateTo ?? store.maxDay, true) }),
      clear: { dateFrom: null, dateTo: null },
    });
  }

  for (const spec of LISTS) {
    const values = filters[spec.key];
    if (!values.length) continue;
    const group = t(spec.group);
    const text = (value: string): string => {
      if (spec.dim) return labelOf(spec.dim, value);
      if (spec.tax) return (taxonomy[spec.tax] as { id: string; label: string }[]).find((item) => item.id === value)?.label ?? value;
      return WORD_VALUES.has(value) ? t(value) : value;
    };
    if (values.length <= MAX_INDIVIDUAL) {
      for (const value of values) chips.push({ id: `${spec.key}:${value}`, group, value: text(value), clear: { [spec.key]: values.filter((otherValue) => otherValue !== value) } });
    } else {
      chips.push({ id: spec.key, group, value: t('{n} selected', { n: values.length }), clear: { [spec.key]: [] } });
    }
  }

  if (filters.selection !== 'all') chips.push({ id: 'selection', group: t('Model selection'), value: filters.selection === 'auto' ? t('Auto only') : t('Manual only'), clear: { selection: 'all' } });
  if (filters.billing !== 'all') chips.push({ id: 'billing', group: t('Billing'), value: filters.billing === 'covered' ? t('Covered by included credits') : t('Billed overage'), clear: { billing: 'all' } });
  if (filters.attribution !== 'all')
    chips.push({ id: 'attribution', group: t('Attribution'), value: filters.attribution === 'attributed' ? t('Per-user usage') : t('Repository-level (no user)'), clear: { attribution: 'all' } });
  for (const weekday of filters.weekdays) chips.push({ id: `dow:${weekday}`, group: t('Weekday'), value: WEEKDAY_NAMES[weekday] ?? String(weekday), clear: { weekdays: filters.weekdays.filter((otherWeekday) => otherWeekday !== weekday) } });
  if (filters.minRow !== null) chips.push({ id: 'minRow', group: t('Row cost'), value: t('at least {amount}', { amount: fmtUSD(filters.minRow, 'auto') }), clear: { minRow: null } });
  if (filters.maxRow !== null) chips.push({ id: 'maxRow', group: t('Row cost'), value: t('at most {amount}', { amount: fmtUSD(filters.maxRow, 'auto') }), clear: { maxRow: null } });
  if (filters.search.trim()) chips.push({ id: 'search', group: t('Search'), value: `“${filters.search.trim()}”`, clear: { search: '' } });
  if (filters.minUserSpend !== null) chips.push({ id: 'minUserSpend', group: t('Usage per user'), value: t('at least {amount}', { amount: fmtUSD(filters.minUserSpend, 'auto') }), clear: { minUserSpend: null } });
  if (filters.maxUserSpend !== null) chips.push({ id: 'maxUserSpend', group: t('Usage per user'), value: t('at most {amount}', { amount: fmtUSD(filters.maxUserSpend, 'auto') }), clear: { maxUserSpend: null } });

  return chips;
}

export const chipText = (chip: FilterChip): string => `${chip.group}: ${chip.value}`;
