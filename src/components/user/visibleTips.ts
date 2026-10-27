import type { Settings } from '../../lib/analytics/settings';
import { userTips, type UserTip } from '../../lib/analytics/tips';
import type { UserProfile } from '../../lib/analytics/users';
import { hasQuota } from './shared';

export const TIP_LIMIT = 6;

/** These tips compare usage with the seat size, so they are left out when the file does not give one. */
const NEEDS_QUOTA = new Set(['runaway', 'low-use', 'efficient']);

export function visibleTips(p: UserProfile, settings: Settings): UserTip[] {
  const all = userTips(p, settings, TIP_LIMIT * 2);
  const kept = hasQuota(p) ? all : all.filter((t) => !NEEDS_QUOTA.has(t.id));
  return kept.slice(0, TIP_LIMIT);
}
