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
  for (const user of users.profiles) {
    if (isLeaving(user.license)) continue;
    const value = user.quotaCredits > 0 ? seatPrice(user.quotaCredits) : seatPrice(users.fallbackQuotaCredits);
    // Code completions are not in the report, so a seat the license data shows as active in the last 30 days is not idle.
    const hasActivityEvidence =
      user.license == null || (user.license.seat && (user.license.status === 'fading' || user.license.status === 'stale'));
    if (user.tier === 'minimal' && (user.persona === 'dormant' || user.persona === 'lapsed') && hasActivityEvidence) {
      idle.push({ id: user.id, name: user.name, plan: user.plan, value, gross: user.gross, utilization: user.utilization, ...licenseOf(user.license) });
      idleIds.add(user.id);
    }
  }
  for (const user of users.profiles) {
    if (idleIds.has(user.id) || user.isNew || isLeaving(user.license)) continue;
    if (user.license?.seat && (user.license.status === 'no-date' || user.license.status === 'unknown')) continue;
    if (user.quotaCredits === PLAN_CREDITS.Enterprise && user.peakMonthGross <= DOWNGRADE_HEADROOM * businessAllot) {
      downgrade.push({
        id: user.id,
        name: user.name,
        plan: user.plan,
        value: PLAN_PRICE.Enterprise - PLAN_PRICE.Business,
        gross: user.gross,
        utilization: user.utilization,
        ...licenseOf(user.license),
      });
    }
  }
  const assumedPlan = assumedPlanLabel(users.fallbackQuotaCredits);
  const unused: SeatCandidate[] = [];
  const keep: SeatCandidate[] = [];
  for (const seat of users.inactive) {
    if (isLeaving(seat.license)) continue;
    const candidate: SeatCandidate = {
      id: -1,
      name: seat.user,
      plan: seat.plan ?? assumedPlan,
      value: rosterSeatValue(seat.plan, users.fallbackQuotaCredits),
      gross: 0,
      utilization: 0,
      ...licenseOf(seat.license),
    };
    if (seat.license !== undefined && (seat.license.status === 'recent' || seat.license.isNew)) {
      keep.push(candidate);
    } else if (seat.license !== undefined && (seat.license.status === 'no-date' || seat.license.status === 'unknown')) {
      continue;
    } else {
      unused.push(candidate);
    }
  }
  const sum = (candidates: SeatCandidate[]) => candidates.reduce((total, candidate) => total + candidate.value, 0);
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
