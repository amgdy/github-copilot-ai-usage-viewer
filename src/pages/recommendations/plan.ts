import { msg } from '../../i18n';
import type { Analysis } from '../../lib/analytics/analyze';
import { DEFAULT_LEVERS } from '../../lib/analytics/levers';
import type { Audience, Recommendation } from '../../lib/analytics/recommendations';
import { PLAYBOOK, type PlaybookItem } from '../../lib/analytics/tips';
import { isActionable, recValue } from './recFilters';
import { MIN_EFFECT, noEffectNote, type NoEffectContext } from './scenario';

export interface PlaybookEntry {
  item: PlaybookItem;
  /** What the matching lever saves on its own, as usage per month. Null when the habit has no lever. */
  saving: number | null;
  /** Why the lever shows no saving, or null when it does. */
  noEffect: string | null;
  /** Other habits that use the same lever. */
  shared: number;
}

export interface PlaybookGroup {
  audience: PlaybookItem['audience'];
  /** English text; show it through t(). */
  title: string;
  /** English text; show it through t(). */
  description: string;
  entries: PlaybookEntry[];
}

const GROUPS: Omit<PlaybookGroup, 'entries'>[] = [
  { audience: 'admin', title: msg('For admins'), description: msg('Controls for the people who manage GitHub Copilot seats and budgets.') },
  { audience: 'user', title: msg('For users'), description: msg('Habits that every GitHub Copilot user can apply in daily work.') },
];

/** Playbook habits by audience, with habits that have a measurable saving first. */
export function playbookGroups(a: Analysis, perMonth: number, ctx: NoEffectContext): PlaybookGroup[] {
  const standalone = new Map(a.plan.levers.steps.map((s) => [s.id, s.standalone * perMonth]));
  const entries = PLAYBOOK.map((item): PlaybookEntry => {
    const lever = item.lever;
    if (!lever) return { item, saving: null, noEffect: null, shared: 0 };
    const raw = standalone.get(lever) ?? 0;
    const saving = Number.isFinite(raw) ? raw : 0;
    return {
      item,
      saving,
      noEffect: saving < MIN_EFFECT ? noEffectNote(lever, DEFAULT_LEVERS, ctx) : null,
      shared: PLAYBOOK.filter((o) => o.lever === lever).length - 1,
    };
  });
  // Array.sort is stable, so habits with equal savings keep the order of the playbook.
  return GROUPS.map((g) => ({
    ...g,
    entries: entries.filter((e) => e.item.audience === g.audience).sort((x, y) => (y.saving ?? -1) - (x.saving ?? -1)),
  })).filter((g) => g.entries.length > 0);
}

export interface PlanItem {
  rec: Recommendation;
  owners: Audience[];
  /** Monthly value shown on the recommendation card; 0 when it has no dollar value. */
  value: number;
  /** First action of the recommendation. */
  step: string;
}

export interface PlanPhase {
  days: 30 | 60 | 90;
  /** English text; show it through t(). */
  title: string;
  items: PlanItem[];
}

const PHASES: { days: PlanPhase['days']; title: string }[] = [
  { days: 30, title: msg('First 30 days') },
  { days: 60, title: msg('Days 31 to 60') },
  { days: 90, title: msg('Days 61 to 90') },
];

export const PHASE_SIZE = 3;

export interface Plan {
  phases: PlanPhase[];
  /** Recommendations that ask for action, including the ones that did not fit into the plan. */
  actionable: number;
  planned: number;
}

/** The top actionable recommendations in the order of the list (largest impact first), three per phase. Empty phases are left out. */
export function buildPlan(recs: Recommendation[]): Plan {
  const actionable = recs.filter((r) => isActionable(r) && r.actions.length > 0);
  const chosen = actionable.slice(0, PHASE_SIZE * PHASES.length);
  const phases = PHASES.map((p, i) => ({
    ...p,
    items: chosen.slice(i * PHASE_SIZE, (i + 1) * PHASE_SIZE).map(
      (rec): PlanItem => ({ rec, owners: rec.audience, value: recValue(rec), step: rec.actions[0] }),
    ),
  })).filter((p) => p.items.length > 0);
  return { phases, actionable: actionable.length, planned: chosen.length };
}
