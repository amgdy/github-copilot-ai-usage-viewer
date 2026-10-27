import type { LinkId } from '../../lib/links';
import type { LensId } from './lenses';

/**
 * Official pages that help with the "What to do" advice of each group, best first. Groups whose advice is "keep it as is"
 * have none.
 */
const GROUP_LINKS: Record<LensId, Record<string, readonly LinkId[]>> = {
  persona: {
    champion: ['bestPractices', 'rollOut'],
    steady: ['agentMode', 'customInstructions'],
    new: ['autoSelection', 'contextManagement'],
    burst: ['contextManagement', 'autoSelection', 'budgets'],
    runaway: ['budgets', 'autoSelection', 'modelComparison'],
    dormant: ['remindInactive', 'activityReport', 'seatAssignment'],
    lapsed: ['remindInactive', 'seatAssignment'],
  },
  tier: {
    minimal: ['seatAssignment', 'agentMode', 'autoSelection'],
    light: ['agentMode', 'customInstructions', 'bestPractices'],
    power: ['budgets', 'modelComparison', 'contextManagement'],
    runaway: ['budgets', 'autoSelection', 'modelComparison'],
  },
  engagement: {
    regular: ['bestPractices', 'promptEngineering'],
    occasional: ['rollOut', 'bestPractices'],
    new: ['autoSelection', 'modelComparison'],
    rare: ['remindInactive', 'seatAssignment'],
    lapsed: ['remindInactive', 'seatAssignment'],
  },
  profile: {
    efficient: ['modelComparison'],
    balanced: ['modelComparison'],
    frontier: ['modelComparison', 'autoSelection'],
  },
  pareto: {
    A: ['budgets', 'optimizeUsage'],
    B: ['optimizeUsage'],
    C: ['bestPractices', 'rollOut'],
  },
  autoUse: {
    autoFirst: ['autoSelection'],
    mixed: ['autoSelection', 'autoDefault'],
    direct: ['autoSelection', 'autoDefault'],
  },
  trait: {
    longContext: ['contextManagement', 'largerContext'],
    spiky: ['agentMode', 'budgets'],
    lowCache: ['optimizeUsage', 'contextManagement'],
    lowAuto: ['autoSelection', 'autoDefault'],
    multiModel: ['optimizeUsage', 'modelComparison'],
    accelerating: ['budgets'],
    noCostCenter: ['useCostCenters', 'costCenters'],
    fading: ['remindInactive'],
  },
};

export function groupLinks(lens: LensId, id: string): readonly LinkId[] {
  return GROUP_LINKS[lens][id] ?? [];
}

/** Groups whose advice is about Auto model selection get the Auto icon. */
export function isAutoGroup(lens: LensId, id: string): boolean {
  return lens === 'autoUse' ? id !== 'unknown' : lens === 'trait' && id === 'lowAuto';
}
