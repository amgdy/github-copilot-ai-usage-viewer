import { t } from '../../i18n/core.ts';
import type { DataStore } from '../types';
import { fmtInt } from '../utils/format';

/** Which of the report's optional columns the loaded files carry. Missing ones are reported instead of silently replaced by guesses. */
export interface DataCoverage {
  /** Every file has discount_amount or net_amount, so covered vs billed usage is known. */
  billing: boolean;
  /** At least one row carries the seat size (total_monthly_quota), so the included-credit pool can be sized. */
  quota: boolean;
  /** Some file has a username column. */
  users: boolean;
  /** At least one row names a model (a missing or empty model column leaves this false). */
  models: boolean;
  /** Some file has token columns. */
  tokens: boolean;
}

export interface CoverageIssue {
  id: keyof DataCoverage;
  /** `warn`: figures on screen are affected. `info`: a view or an estimate is unavailable. */
  severity: 'warn' | 'info';
  title: string;
  detail: string;
}

const cache = new WeakMap<DataStore, DataCoverage>();

export function dataCoverage(store: DataStore): DataCoverage {
  const hit = cache.get(store);
  if (hit) return hit;
  const files = store.files;
  const lacks = (file: (typeof files)[number], column: string): boolean => file.missingColumns.includes(column);
  let quota = false;
  for (let i = 0; i < store.n; i++) {
    if (store.quota[i] > 0) {
      quota = true;
      break;
    }
  }
  const coverage: DataCoverage = {
    billing: files.length > 0 && files.every((file) => !(lacks(file, 'discount_amount') && lacks(file, 'net_amount'))),
    quota,
    users: files.some((file) => !lacks(file, 'username')),
    models: store.dicts.model.values.some((modelName) => modelName !== ''),
    tokens: store.hasTokens,
  };
  cache.set(store, coverage);
  return coverage;
}

/** Human-readable consequences of the missing columns, most important first. */
export function coverageIssues(coverage: DataCoverage, fallbackQuotaCredits = 1900): CoverageIssue[] {
  const out: CoverageIssue[] = [];
  if (!coverage.billing) {
    out.push({
      id: 'billing',
      severity: 'warn',
      title: t('The file does not say what was billed'),
      detail: t(
        'It has neither discount_amount nor net_amount, so the covered and billed amounts are left at $0. Usage still shows. Overage, pool and seat findings are hidden because the file does not have what they need.',
      ),
    });
  }
  if (!coverage.quota) {
    out.push({
      id: 'quota',
      severity: 'warn',
      title: t('The file has no seat sizes'),
      detail: t(
        'total_monthly_quota is missing or empty, so the size of the included-credit pool is unknown. Pool utilization and seat findings are hidden, and per-user utilization assumes a {credits}-credit seat. Import your license list on the Licenses page for a better estimate.',
        { credits: fmtInt(fallbackQuotaCredits) },
      ),
    });
  }
  if (!coverage.users) {
    out.push({
      id: 'users',
      severity: 'warn',
      title: t('The file has no username column'),
      detail: t('All usage is put in one unnamed group, so rankings, segments and seat findings do not apply.'),
    });
  }
  if (!coverage.models) {
    out.push({
      id: 'models',
      severity: 'info',
      title: t('The file has no model names'),
      detail: t('Model comparison, the Auto share and model-based savings are not available.'),
    });
  }
  if (!coverage.tokens) {
    out.push({
      id: 'tokens',
      severity: 'info',
      title: t('The file has no token columns'),
      detail: t('Cache, context and model-mix savings cannot be estimated. Only credit totals are available.'),
    });
  }
  return out;
}
