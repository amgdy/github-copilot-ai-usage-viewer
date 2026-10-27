import { msg, t, tp } from '../../i18n/core.ts';
import { fmtDay } from '../utils/date';
import { fmtMultiple, fmtPct, fmtPctAuto, fmtUSD } from '../utils/format';
import { activityStatusText } from '../licenses/labels';
import type { LeverStep } from './levers';
import { DOCS, type DocLink } from './recommendations';
import type { Settings } from './settings';
import { buildTaxonomy } from './taxonomy';
import type { UserProfile, UserSet } from './users';

export type TipSeverity = 'high' | 'medium' | 'low' | 'positive';

export interface UserTip {
  id: string;
  severity: TipSeverity;
  title: string;
  detail: string;
  /** Usage that could be avoided over the selected period (USD). Zero for coaching tips. */
  savingsUsd: number;
  docs?: DocLink;
}

const RANK: Record<TipSeverity, number> = { high: 0, medium: 1, low: 2, positive: 3 };

/** A link with its label in the current language. */
const link = (d: DocLink): DocLink => ({ label: t(d.label), url: d.url });

/**
 * Personal, rule-based tips. They reuse the same traits and lever estimates as the organization-level view.
 * The tip with the largest saving comes first. Tips with the same saving (all coaching tips are 0) go by severity, then keep the order they are written in.
 */
export function userTips(p: UserProfile, s: Settings, limit = 6): UserTip[] {
  const tips: UserTip[] = [];
  const by = p.potentialBy;
  const push = (tip: UserTip) => tips.push(tip);

  if (p.tier === 'runaway') {
    push({
      id: 'runaway',
      severity: 'high',
      title: t('You used {multiple} your included credits', { multiple: fmtMultiple(p.utilization) }),
      detail: t(
        'Set an AI credit session limit for open-ended agent tasks, split big jobs into plan then implement sessions, and watch for loops. If the work is legitimate, ask your admin for an individual budget with an expiry date.',
      ),
      savingsUsd: by.capRunaway,
      docs: link(DOCS.sessionLimit),
    });
  }
  if (p.powerfulShare >= 0.4 && by.modelShift > 0) {
    push({
      id: 'model',
      severity: p.profile === 'frontier' && by.modelShift >= 0.1 * p.gross ? 'high' : 'medium',
      title: t('{share} of your usage is on Powerful models', { share: fmtPct(p.powerfulShare, 0) }),
      detail: t(
        'Use reasoning models for planning, architecture and hard debugging. Implement the plan with a mid-tier model in a fresh session, and use lighter models for docs, formatting and small refactors.',
      ),
      savingsUsd: by.modelShift,
      docs: link(DOCS.comparison),
    });
  }
  if (p.traits.includes('lowAuto')) {
    push({
      id: 'auto',
      severity: by.autoAdoption >= 0.03 * p.gross ? 'medium' : 'low',
      title: t('Auto handled {share} of your usage', { share: fmtPct(p.autoShare, 0) }),
      detail:
        p.autoMissed > 0
          ? t(
              'Make Auto your default model. It routes each task to an efficient model, and Auto usage gets a discount off the original price of its tokens. Moving your hand-picked usage to Auto would have earned an estimated discount of {amount}. Pin a model only when a task needs it.',
              { amount: fmtUSD(p.autoMissed) },
            )
          : t(
              'Make Auto your default model. It routes each task to an efficient model. The Auto discount rate for your plan is 0% in this report, so the benefit is a fitting model for each task, not a lower price. Pin a model only when a task needs it.',
            ),
      savingsUsd: by.autoAdoption,
      docs: link(DOCS.auto),
    });
  }
  if (p.traits.includes('lowCache')) {
    push({
      id: 'cache',
      severity: 'medium',
      title: t('Your cache hit rate is {rate}', { rate: fmtPct(p.cacheHit, 0) }),
      detail: t(
        'Cached input costs about 10% of normal. Stay on one model for the whole session, start a new session (or /compact) instead of resuming an old thread, and avoid changing reasoning effort or tools mid-session.',
      ),
      savingsUsd: by.cacheDiscipline,
      docs: link(DOCS.optimize),
    });
  }
  if (p.traits.includes('longContext')) {
    push({
      id: 'long-context',
      severity: 'medium',
      title: t('{share} of your usage is long-context surcharge', { share: fmtPct(p.longShare, 0) }),
      detail: t("Prompts above a model's long-context threshold are billed at a higher rate. Split the work, summarize earlier steps and narrow the files you attach."),
      savingsUsd: by.longContext,
      docs: link(DOCS.pricing),
    });
  }
  if (by.contextHygiene >= 0.03 * p.gross && p.gross >= s.minSpendForTraits) {
    push({
      id: 'context',
      severity: 'low',
      title: t('Trim the context you send'),
      detail: t('Start a new conversation when you change problem, use /compact for long CLI sessions, keep AGENTS.md or copilot-instructions.md current and enable only the MCP tools you need.'),
      savingsUsd: by.contextHygiene,
      docs: link(DOCS.context),
    });
  }
  if (p.traits.includes('spiky')) {
    push({
      id: 'spiky',
      severity: 'low',
      title: t('{share} of your usage happened on {day}', { share: fmtPct(p.peakShare, 0), day: fmtDay(p.peakDayIdx) }),
      detail: t('Review what ran on that day. A session limit stops an open-ended agent task before it grows into one very large day.'),
      savingsUsd: 0,
      docs: link(DOCS.sessionLimit),
    });
  }
  if (p.traits.includes('multiModel')) {
    push({
      id: 'multi-model',
      severity: 'low',
      title: tp(p.modelCount, 'You used {n} different model', 'You used {n} different models'),
      detail: t('Switching models mid-session throws away the cache. Pick one model per session and switch only at natural breaks.'),
      savingsUsd: 0,
      docs: link(DOCS.optimize),
    });
  }
  if (p.traits.includes('accelerating')) {
    push({
      id: 'accelerating',
      severity: 'low',
      title: t('Your usage rose to {recent} from {prior} the week before', { recent: fmtUSD(p.recent, 0), prior: fmtUSD(p.prior, 0) }),
      detail: t('If this is a new project, that is expected. If not, review what ran, and ask for a budget before the pool runs out.'),
      savingsUsd: 0,
    });
  }
  if (p.lapsed || p.traits.includes('fading')) {
    push({
      id: 'lapsed',
      severity: 'low',
      title: p.lapsed ? t('No usage since {day}', { day: fmtDay(p.lastDay) }) : t('Your usage is fading'),
      detail: t('Try agent mode on a well-scoped task, or GitHub Copilot CLI for repetitive work. Tell your admin if something is blocking you.'),
      savingsUsd: 0,
      docs: link(DOCS.optimize),
    });
  }
  if (p.tier === 'minimal' && !p.isNew && !p.lapsed) {
    push({
      id: 'low-use',
      severity: 'low',
      title: t('You use {share} of your included credits', { share: fmtPctAuto(p.utilization) }),
      detail: t('There is room to do more with GitHub Copilot: ask it to plan a change, write tests or review a diff. If you no longer need the seat, let your admin know so it can be reassigned.'),
      savingsUsd: 0,
    });
  }
  if (p.isNew) {
    push({
      id: 'new',
      severity: 'positive',
      title: t('Welcome: start with good habits'),
      detail: t('Use Auto by default, keep one model per session, start a fresh thread for each task and give the agent a clear goal and a stopping point.'),
      savingsUsd: 0,
      docs: link(DOCS.prompting),
    });
  }
  if (p.persona === 'champion') {
    push({
      id: 'champion',
      severity: 'positive',
      title: t('You use GitHub Copilot often and heavily'),
      detail: t('Share your prompts, custom instructions and workflows with your team. Your habits are a good template.'),
      savingsUsd: 0,
    });
  }
  if (p.profile === 'efficient' && p.utilization >= 0.4) {
    push({
      id: 'efficient',
      severity: 'positive',
      title: t('Efficient model mix'),
      detail: t('Mostly mid-tier and light models with {share} on Auto. Keep it up.', { share: fmtPct(p.autoShare, 0) }),
      savingsUsd: 0,
    });
  }
  if (p.traits.includes('noCostCenter')) {
    push({
      id: 'cost-center',
      severity: 'low',
      title: t('You are not assigned to a cost center'),
      detail: t('Ask your admin to add you so your usage can be budgeted and reported by team.'),
      savingsUsd: 0,
    });
  }
  tips.sort((a, b) => b.savingsUsd - a.savingsUsd || RANK[a.severity] - RANK[b.severity]);
  return tips.slice(0, limit);
}

export interface PlaybookItem {
  id: string;
  title: string;
  audience: 'user' | 'admin';
  why: string;
  how: string[];
  lever?: LeverStep['id'];
  docs: DocLink[];
}

export const PLAYBOOK: PlaybookItem[] = [
  {
    id: 'right-model',
    title: msg('Match the model to the task'),
    audience: 'user',
    why: msg('Defaulting to the most capable model for everything raises token use without improving the result, and over-thinking can add unnecessary changes.'),
    how: [
      msg('Reasoning models: architecture decisions, complex debugging, system design.'),
      msg('Mid-tier models: executing a plan that is already clear.'),
      msg('Lighter models: refactoring, formatting, documentation and other routine, well-scoped changes.'),
    ],
    lever: 'modelShift',
    docs: [DOCS.comparison, DOCS.optimize],
  },
  {
    id: 'auto',
    title: msg('Make Auto your default'),
    audience: 'user',
    why: msg(
      'A small router sends each prompt to a model that can handle it efficiently, avoids models that burn through budget and changes model only at cache-friendly boundaries. Auto usage also gets a discount off the original price of its tokens; the Overview shows the rate in this report.',
    ),
    how: [
      msg('Select Auto in GitHub Copilot Chat, GitHub Copilot CLI, the GitHub Copilot app and the cloud agent.'),
      msg('Pin a model only when a task needs it, and keep it for the whole session.'),
    ],
    lever: 'autoAdoption',
    docs: [DOCS.auto],
  },
  {
    id: 'reasoning',
    title: msg('Keep reasoning at the regular level'),
    audience: 'user',
    why: msg('A higher reasoning level helps hard problems but consumes more tokens, and therefore more credits.'),
    how: [msg('Use the regular level by default.'), msg('Raise it only for harder tasks (VS Code and GitHub Copilot CLI, supported models).')],
    lever: 'modelShift',
    docs: [DOCS.optimize],
  },
  {
    id: 'subagents',
    title: msg('Run subagents on cheaper models'),
    audience: 'user',
    why: msg("Subagents run in their own session without the main agent's history, so a lighter model is usually enough, and assigning one does not disturb the main agent's cache."),
    how: [msg('Assign a lighter model to subagents that do focused, single-task work.')],
    lever: 'modelShift',
    docs: [DOCS.optimize],
  },
  {
    id: 'prompts',
    title: msg('Write clear prompts with a stopping point'),
    audience: 'user',
    why: msg('Vague prompts lead to retries, scope drift and extra exploration. Clear guidance costs few tokens and saves many agent runs.'),
    how: [
      msg('State the task: what the issue is, where it happens and the expected outcome.'),
      msg('Include the files, logs or errors that matter.'),
      msg('Say what "done" looks like so the agent does not keep going.'),
    ],
    docs: [DOCS.prompting],
  },
  {
    id: 'context',
    title: msg('Keep your context lean'),
    audience: 'user',
    why: msg('Open tabs, attached files, tool definitions and the whole conversation history are sent as input tokens with every request.'),
    how: [
      msg('Start a new conversation when you switch problems (/new or /clear in the CLI, a new chat elsewhere).'),
      msg('Use /compact to shrink a long CLI session you want to continue, and /context to check usage.'),
      msg('Keep AGENTS.md or .github/copilot-instructions.md current so agents do not read many files to orient themselves.'),
      msg('Enable only the MCP toolsets the task needs.'),
    ],
    lever: 'contextHygiene',
    docs: [DOCS.context, DOCS.optimize],
  },
  {
    id: 'cache',
    title: msg('Preserve the cache'),
    audience: 'user',
    why: msg('Cached tokens are billed at about 10% of normal input. Anything that invalidates the cache re-sends the whole context at full price.'),
    how: [
      msg('Do not switch models mid-session.'),
      msg('Do not resume old sessions after the cache expires (1 hour for most models, 24 hours for OpenAI): start a new one or /compact first.'),
      msg('Do not change reasoning effort, context size or the set of tools and MCP servers during a session.'),
    ],
    lever: 'cacheDiscipline',
    docs: [DOCS.optimize, DOCS.pricing],
  },
  {
    id: 'long-context',
    title: msg('Stay under the long-context threshold'),
    audience: 'user',
    why: msg('Some models bill prompts above a size threshold at a higher rate.'),
    how: [
      msg('Split large tasks, summarize earlier steps and narrow the files you attach.'),
      msg('Choose a model without a long-context tier when you do not need a very large window.'),
    ],
    lever: 'longContext',
    docs: [DOCS.pricing],
  },
  {
    id: 'phases',
    title: msg('Research, plan, then implement'),
    audience: 'user',
    why: msg('Doing everything in one session grows the context with material the later steps do not need.'),
    how: [
      msg('Research: explore the codebase and dependencies.'),
      msg('Plan: write a structured plan with a strong reasoning model (/plan in the CLI, Plan mode in VS Code).'),
      msg('Implement: start a new session and execute the plan with a model suited to execution.'),
    ],
    lever: 'modelShift',
    docs: [DOCS.optimize],
  },
  {
    id: 'session-limits',
    title: msg('Set AI credit session limits'),
    audience: 'user',
    why: msg('A session limit stops an open-ended task before it uses more credits than you intended. It is a soft limit per session and does not replace budgets.'),
    how: [
      msg('Set a limit before starting a task in GitHub Copilot CLI or the GitHub Copilot SDK.'),
      msg('When it is reached, choose whether to continue or raise the limit.'),
    ],
    lever: 'capRunaway',
    docs: [DOCS.sessionLimit],
  },
  {
    id: 'chronicle',
    title: msg('Learn from your own history'),
    audience: 'user',
    why: msg('Your session history shows which habits cost the most.'),
    how: [
      msg('Run /chronicle tips and /chronicle cost-tips in GitHub Copilot CLI.'),
      msg('Put recurring fixes into copilot-instructions.md so every session benefits.'),
    ],
    docs: [DOCS.optimize],
  },
  {
    id: 'budgets',
    title: msg('Set budgets: users first, then the pool'),
    audience: 'admin',
    why: msg(
      'User-level budgets are the only control active in both the pool and the metered phase, and always stop usage at the limit. Enterprise, organization and cost-center budgets only cap metered overage, so your maximum bill is seat fees plus the budget.',
    ),
    how: [
      msg('Create a universal user-level budget for fair access to the pool.'),
      msg('Add cost-center or individual budgets (with expiry) where teams need more.'),
      msg('Add an enterprise budget with alerts for the overage phase.'),
      msg('Use cost-center included-usage controls to cap each team at the credits its licenses fund.'),
    ],
    lever: 'capRunaway',
    docs: [DOCS.budgets, DOCS.budgetTuning, DOCS.budgetStart],
  },
  {
    id: 'seats',
    title: msg('Right-size seats'),
    audience: 'admin',
    why: msg(
      'A seat costs the same as the credits it includes, so an unused seat wastes its credits unless other users consume them. Overage is priced at the same rate per credit, so seats are not a discount.',
    ),
    how: [
      msg('Review users with minimal usage and reassign or reclaim their seats at the next billing cycle.'),
      msg('Check completions and chat activity in the license usage view first: this report does not include them.'),
      msg('Consider Business instead of Enterprise for light users who do not need Enterprise-only features.'),
    ],
    docs: [DOCS.seats, DOCS.licenseUsage],
  },
];

/** Rows for the per-user action list export: usage, tokens, Auto, license and the top tip of each user. */
export function userActionRows(users: UserSet, s: Settings): { headers: string[]; rows: unknown[][] } {
  const tax = buildTaxonomy(s);
  const label = <T extends { id: string; label: string }>(items: T[]) => new Map(items.map((i) => [i.id, i.label]));
  const tier = label(tax.tiers);
  const persona = label(tax.personas);
  const profile = label(tax.profiles);
  const trait = label(tax.traits);
  const autoUse = label(tax.autoUse);
  const headers = [
    t('User'),
    t('Organization'),
    t('Cost center'),
    t('Plan'),
    t('Usage USD'),
    t('Billed USD'),
    t('Included credits used'),
    t('Tier'),
    t('Persona'),
    t('Usage profile'),
    t('Pareto class'),
    t('Traits'),
    t('Top model'),
    t('Auto share'),
    t('Cache hit rate'),
    t('Avoidable USD (default levers)'),
    t('Top action'),
    t('Input tokens'),
    t('Output tokens'),
    t('Cache read tokens'),
    t('Cache write tokens'),
    t('Total tokens'),
    t('Auto usage USD'),
    t('Original price of Auto usage USD'),
    t('Auto discount received USD'),
    t('Auto discount missed USD'),
    t('Auto use'),
    t('License seat'),
    t('License plan'),
    t('License status'),
    t('Last activity'),
    t('Days since last activity'),
    t('Last surface'),
    t('Pending cancellation'),
  ];
  const usd = (x: number): number => Number((Number.isFinite(x) ? x : 0).toFixed(4));
  const rows = users.profiles.map((p) => {
    const tips = userTips(p, s, 1);
    const seat = p.license ?? null;
    return [
      p.name,
      p.org,
      p.costCenter,
      p.plan,
      Number(p.gross.toFixed(4)),
      Number(p.net.toFixed(4)),
      Number(p.utilization.toFixed(4)),
      tier.get(p.tier) ?? p.tier,
      persona.get(p.persona) ?? p.persona,
      profile.get(p.profile) ?? p.profile,
      p.pareto,
      p.traits.map((id) => trait.get(id) ?? id).join('; '),
      p.topModel,
      Number(p.autoShare.toFixed(4)),
      Number.isFinite(p.cacheHit) ? Number(p.cacheHit.toFixed(4)) : '',
      Number(p.potential.toFixed(4)),
      tips[0] ? `${tips[0].title}. ${tips[0].detail}` : '',
      Math.round(p.input),
      Math.round(p.output),
      Math.round(p.cacheRead),
      Math.round(p.cacheWrite),
      Math.round(p.tokens),
      usd(p.auto.billed),
      usd(p.auto.original),
      usd(p.auto.discount),
      usd(p.autoMissed),
      autoUse.get(p.autoUse) ?? p.autoUse,
      seat ? (seat.seat ? t('Yes') : t('No')) : '',
      seat?.seat ? seat.plan : '',
      seat ? activityStatusText(seat.status) : '',
      seat?.lastActivityAt ?? '',
      seat?.daysSinceActivity ?? '',
      seat?.lastSurface ?? '',
      seat?.pendingCancellation ?? '',
    ];
  });
  return { headers, rows };
}
