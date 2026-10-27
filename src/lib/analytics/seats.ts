import { CREDIT_USD } from '../types';
import type { ProfileLicense } from '../licenses/activity';
import { planLabel } from './prepare';
import { PLAN_CREDITS, PLAN_PRICE, seatCredits, seatPrice, type Settings } from './settings';
import type { UserSet } from './users';

export interface SeatCandidate {
  id: number;
  name: string;
  plan: string;
  /** Monthly seat value that goes away when the seat is removed or downgraded (USD). */
  value: number;
  gross: number;
  utilization: number;
  /** What the imported license data says about this seat. Absent when the roster has no license data for it. */
  license?: ProfileLicense;
}

export interface SeatPlan {
  /** Seats with minimal use and little activity: candidates to reclaim. */
  idle: SeatCandidate[];
  /** Enterprise users who never needed more than the Business allotment. */
  downgrade: SeatCandidate[];
  /** Roster seats that never appear in the report. */
  unused: SeatCandidate[];
  /**
   * Roster seats that never appear in the report but that the license data shows as active in the last 30 days or as new.
   * They use code completions or chat, which the report does not carry, so they are not savings. Set only when there are some.
   */
  keep?: SeatCandidate[];
  idleValue: number;
  downgradeValue: number;
  unusedValue: number;
  /** Monthly value of the `keep` seats. Not a saving. Set only when `keep` is set. */
  keepValue?: number;
}

/** Enterprise users must stay below this share of the Business allotment to count as downgrade candidates. */
export const DOWNGRADE_HEADROOM = 0.8;

/** What a roster seat costs per month. Included credits are worth what the seat costs, so this is its credits at 1 credit = $0.01. */
function rosterSeatValue(plan: string | null, fallbackCredits: number): number {
  return seatPrice(seatCredits(plan, fallbackCredits));
}

/** Names the plan a roster seat without one is priced as, for example "Business (assumed)". */
function assumedPlanLabel(credits: number): string {
  if (credits <= 0) return 'Unknown';
  const label = planLabel(credits);
  return label.endsWith(')') ? `${label.slice(0, -1)}, assumed)` : `${label} (assumed)`;
}

/** A seat with a scheduled cancellation is going away already, so it is no saving to plan for. */
const isLeaving = (license: ProfileLicense | null | undefined): boolean =>
  license !== null && license !== undefined && license.pendingCancellation !== '';

/** The license facts to attach to a candidate: only for a user who really holds a seat in the imported roster. */
const licenseOf = (license: ProfileLicense | null | undefined): { license: ProfileLicense } | undefined =>
  license !== null && license !== undefined && license.seat ? { license } : undefined;

export function planSeats(users: UserSet, _settings: Settings): SeatPlan {
  const idle: SeatCandidate[] = [];
  const downgrade: SeatCandidate[] = [];
  const idleIds = new Set<number>();
  const businessAllot = PLAN_CREDITS.Business * CREDIT_USD;
  for (const p of users.profiles) {
    if (isLeaving(p.license)) continue;
    const value = p.quotaCredits > 0 ? seatPrice(p.quotaCredits) : seatPrice(users.fallbackQuotaCredits);
    // Code completions are not in the report, so a seat the license data shows as active in the last 30 days is not idle.
    const hasActivityEvidence =
      p.license == null || (p.license.seat && (p.license.status === 'fading' || p.license.status === 'stale'));
    if (p.tier === 'minimal' && (p.persona === 'dormant' || p.persona === 'lapsed') && hasActivityEvidence) {
      idle.push({ id: p.id, name: p.name, plan: p.plan, value, gross: p.gross, utilization: p.utilization, ...licenseOf(p.license) });
      idleIds.add(p.id);
    }
  }
  for (const p of users.profiles) {
    if (idleIds.has(p.id) || p.isNew || isLeaving(p.license)) continue;
    if (p.license?.seat && (p.license.status === 'no-date' || p.license.status === 'unknown')) continue;
    if (p.quotaCredits === PLAN_CREDITS.Enterprise && p.peakMonthGross <= DOWNGRADE_HEADROOM * businessAllot) {
      downgrade.push({
        id: p.id,
        name: p.name,
        plan: p.plan,
        value: PLAN_PRICE.Enterprise - PLAN_PRICE.Business,
        gross: p.gross,
        utilization: p.utilization,
        ...licenseOf(p.license),
      });
    }
  }
  const assumedPlan = assumedPlanLabel(users.fallbackQuotaCredits);
  const unused: SeatCandidate[] = [];
  const keep: SeatCandidate[] = [];
  for (const s of users.inactive) {
    if (isLeaving(s.license)) continue;
    const candidate: SeatCandidate = {
      id: -1,
      name: s.user,
      plan: s.plan ?? assumedPlan,
      value: rosterSeatValue(s.plan, users.fallbackQuotaCredits),
      gross: 0,
      utilization: 0,
      ...licenseOf(s.license),
    };
    if (s.license !== undefined && (s.license.status === 'recent' || s.license.isNew)) {
      keep.push(candidate);
    } else if (s.license !== undefined && (s.license.status === 'no-date' || s.license.status === 'unknown')) {
      continue;
    } else {
      unused.push(candidate);
    }
  }
  const sum = (xs: SeatCandidate[]) => xs.reduce((a, x) => a + x.value, 0);
  const plan: SeatPlan = {
    idle,
    downgrade,
    unused,
    idleValue: sum(idle),
    downgradeValue: sum(downgrade),
    unusedValue: sum(unused),
  };
  if (keep.length > 0) {
    plan.keep = keep;
    plan.keepValue = sum(keep);
  }
  return plan;
}
