import type { Settings } from '../../lib/analytics/settings';
import { userTips, type UserTip } from '../../lib/analytics/tips';
import type { UserProfile } from '../../lib/analytics/users';
import { hasQuota } from './shared';

export const TIP_LIMIT = 6;

/** These tips compare usage with the seat size, so they are left out when the file does not give one. */
const NEEDS_QUOTA = new Set(['runaway', 'low-use', 'efficient']);

export function visibleTips(user: UserProfile, settings: Settings): UserTip[] {
  const all = userTips(user, settings, TIP_LIMIT * 2);
  const kept = hasQuota(user) ? all : all.filter((tip) => !NEEDS_QUOTA.has(tip.id));
  return kept.slice(0, TIP_LIMIT);
}
