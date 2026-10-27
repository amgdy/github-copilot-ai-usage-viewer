import type { ReactNode } from 'react';
import { msg, t } from '../../i18n';
import type { DataCoverage } from '../../lib/analytics/coverage';
import type { Taxonomy } from '../../lib/analytics/taxonomy';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtUSD } from '../../lib/utils/format';

export interface ColumnContext {
  taxonomy: Taxonomy;
  trendReliable: boolean;
  coverage: DataCoverage;
  /** A license list is loaded, so the License view and its columns exist. */
  hasLicense?: boolean;
}

export const NO_BILLING = msg('The file does not say what was billed');
export const NO_MODELS = msg('This file has no model names');
export const NO_TOKENS = msg('This file has no token columns');

export const dash = <span className="text-fg-subtle">–</span>;
export const usd = (amount: number): string => fmtUSD(amount, 2);
export const sum = (rows: UserProfile[], pick: (user: UserProfile) => number): number => rows.reduce((total, user) => total + pick(user), 0);

/** A dash that says why the file cannot fill the cell. Pass the English reason; it is translated here. */
export const withReason = (reason: string): ReactNode => (
  <span className="text-fg-subtle" title={t(reason)}>
    –
  </span>
);
