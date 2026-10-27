import { msg, t } from '../../i18n';
import { fmtPct } from '../../lib/utils/format';

export type CheckStatus = 'good' | 'warn' | 'bad';

/** Guidance thresholds for the best-practice scorecard. "Healthy" is the green boundary, "fair" the amber one. */
export const AUTO_SHARE_HEALTHY = 0.25;
export const AUTO_SHARE_FAIR = 0.1;
export const CACHE_HIT_HEALTHY = 0.6;
export const CACHE_HIT_FAIR = 0.3;
export const POWERFUL_SHARE_HEALTHY = 0.4;
export const POWERFUL_SHARE_FAIR = 0.7;
export const LONG_CONTEXT_HEALTHY = 0.02;
export const LONG_CONTEXT_FAIR = 0.08;
/** Share of users in the runaway tier that is still amber. Any user above it turns the check red. */
export const RUNAWAY_USERS_FAIR = 0.05;
export const ACTIVE_USE_HEALTHY = 0.5;
export const ACTIVE_USE_FAIR = 0.25;

/** Role models: efficient users who still use GitHub Copilot for real work. */
export const ROLE_MODEL_MAX = 6;
export const ROLE_MODEL_MIN = 2;
export const ROLE_MODEL_MIN_ACTIVE_DAYS = 3;
export const ROLE_MODEL_MIN_AUTO = AUTO_SHARE_FAIR;
export const ROLE_MODEL_MIN_CACHE_HIT = CACHE_HIT_HEALTHY;
export const ROLE_MODEL_MIN_EFFICIENCY = 60;

/** English text; show it through t(). */
export const STATUS_LABEL: Record<CheckStatus, string> = {
  good: msg('Healthy'),
  warn: msg('Could be better'),
  bad: msg('Needs attention'),
};

export const higherIsBetter = (value: number, healthy: number, fair: number): CheckStatus => (value >= healthy ? 'good' : value >= fair ? 'warn' : 'bad');

export const lowerIsBetter = (value: number, healthy: number, fair: number): CheckStatus => (value < healthy ? 'good' : value <= fair ? 'warn' : 'bad');

export const runawayStatus = (runaway: number, users: number): CheckStatus =>
  runaway === 0 ? 'good' : users > 0 && runaway / users <= RUNAWAY_USERS_FAIR ? 'warn' : 'bad';

const wholePercent = (share: number): string => fmtPct(share, 0);

const atLeast = (healthy: number, fair: number): string =>
  t('{healthy} or more ({fair} to {healthy} could be better)', { healthy: wholePercent(healthy), fair: wholePercent(fair) });
const under = (healthy: number, fair: number): string =>
  t('under {healthy} ({healthy} to {fair} could be better)', { healthy: wholePercent(healthy), fair: wholePercent(fair) });

/** The limits of each check, written for the reader. Functions, so the text follows the language. */
export const autoTarget = (): string => atLeast(AUTO_SHARE_HEALTHY, AUTO_SHARE_FAIR);
export const cacheTarget = (): string => atLeast(CACHE_HIT_HEALTHY, CACHE_HIT_FAIR);
export const powerfulTarget = (): string => under(POWERFUL_SHARE_HEALTHY, POWERFUL_SHARE_FAIR);
export const longContextTarget = (): string => under(LONG_CONTEXT_HEALTHY, LONG_CONTEXT_FAIR);
export const runawayTarget = (): string => t('none (up to {share} of users could be better)', { share: wholePercent(RUNAWAY_USERS_FAIR) });
export const activeUseTarget = (): string => atLeast(ACTIVE_USE_HEALTHY, ACTIVE_USE_FAIR);
