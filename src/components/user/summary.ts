import { t } from '../../i18n';
import type { Analysis } from '../../lib/analytics/analyze';
import { rateForPlan } from '../../lib/analytics/autoDiscount';
import { LEVER_META, LEVER_ORDER } from '../../lib/analytics/levers';
import type { Settings } from '../../lib/analytics/settings';
import type { Taxonomy, TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { UserProfile } from '../../lib/analytics/users';
import { labelOf } from '../../lib/types';
import { DAYS_PER_MONTH, fmtDay } from '../../lib/utils/date';
import { fmtInt, fmtPct, fmtPctAuto, fmtUSD, pluralize } from '../../lib/utils/format';
import { licenseDay, seatPlanLabel, seatStatusLabel, seatStatusOf } from './license';
import { fmtCount, hasQuota, shortLabel, userSubtitle } from './shared';
import { visibleTips } from './visibleTips';

interface SummaryInput {
  p: UserProfile;
  analysis: Analysis;
  settings: Settings;
  taxonomy: Taxonomy;
}

/** Cents everywhere, so the amounts line up when the text is pasted into a message. */
const money = (amount: number): string => fmtUSD(amount, 2);

function labelIn<T extends string>(items: readonly TaxonomyItem<T>[], id: T): string {
  const item = items.find((candidate) => candidate.id === id);
  return item ? shortLabel(item.label) : id;
}

function creditsLine(user: UserProfile): string {
  if (!hasQuota(user)) return t('Included credits used: not in the file');
  const share = fmtPctAuto(user.utilization);
  return user.balance >= 0
    ? t('Included credits used: {share} ({left} left of {total})', { share, left: money(user.balance), total: money(user.allotment) })
    : t('Included credits used: {share} ({over} over {total})', { share, over: money(-user.balance), total: money(user.allotment) });
}

function weekLine(user: UserProfile): string | null {
  if (user.recent <= 0 && user.prior <= 0) return null;
  if (user.prior <= 0 || !Number.isFinite(user.trend)) return t('Last 7 days: {amount}, nothing the week before', { amount: money(user.recent) });
  const values = { amount: money(user.recent), prior: money(user.prior) };
  return user.trend >= 0
    ? t('Last 7 days: {amount}, up {change} from {prior} the week before', { ...values, change: fmtPct(user.trend, 0) })
    : t('Last 7 days: {amount}, down {change} from {prior} the week before', { ...values, change: fmtPct(-user.trend, 0) });
}

function tokenLines(user: UserProfile): string[] {
  if (!(user.tokens > 0)) return [];
  const lines = [
    t('Total tokens: {total} (input {input}, cache read {read}, cache write {write}, output {output})', {
      total: fmtCount(user.tokens),
      input: fmtCount(user.input),
      read: fmtCount(user.cacheRead),
      write: fmtCount(user.cacheWrite),
      output: fmtCount(user.output),
    }),
  ];
  if (Number.isFinite(user.cacheHit)) lines.push(t('Cache hit rate: {rate}', { rate: fmtPct(user.cacheHit, 0) }));
  return lines;
}

function autoLines(user: UserProfile, analysis: Analysis, taxonomy: Taxonomy): string[] {
  const rate = rateForPlan(analysis.autoRates, user.quotaCredits);
  const basis = analysis.autoRates.plans.find((planRate) => planRate.credits === user.quotaCredits)?.source ?? 'assumed';
  const lines = [
    t('Auto share of usage: {share}', { share: fmtPct(user.autoShare, 0) }),
    t('Auto use class: {label}', { label: labelIn(taxonomy.autoUse, user.autoUse) }),
  ];
  if (user.auto.billed > 0) {
    lines.push(
      t('Auto discount received: {amount} ({rate} off an original price of {original})', {
        amount: money(user.auto.discount),
        rate: fmtPct(user.auto.rate, 1),
        original: money(user.auto.original),
      }),
    );
  }
  if (user.autoMissed >= 0.005) {
    const values = { amount: money(user.autoMissed), base: money(user.directBilled), rate: fmtPct(rate, 1) };
    lines.push(
      basis === 'measured'
        ? t('Discount missed on hand-picked usage: about {amount} ({base} at the {rate} discount rate of the plan, measured)', values)
        : t('Discount missed on hand-picked usage: about {amount} ({base} at the {rate} discount rate of the plan, assumed)', values),
    );
  }
  return lines;
}

function licenseLines(user: UserProfile): string[] {
  const license = user.license;
  const status = seatStatusOf(license);
  if (!license || !status) return [];
  if (!license.seat) return [t('License: no seat in the license list')];
  const lines = [
    t('License: {plan}, {status}', { plan: license.plan ? seatPlanLabel(license.plan) : t('Not in the export'), status: seatStatusLabel(status) }),
  ];
  if (license.lastActivityAt) {
    lines.push(
      license.lastSurface
        ? t('Last activity in the license list: {date} in {surface}', { date: licenseDay(license.lastActivityAt), surface: license.lastSurface })
        : t('Last activity in the license list: {date}', { date: licenseDay(license.lastActivityAt) }),
    );
  }
  if (license.pendingCancellation) lines.push(t('Cancellation date: {date}', { date: licenseDay(license.pendingCancellation) }));
  return lines;
}

/** Plain text for an email or chat message, in the reader's language. It is built when the button is pressed, not on every render. */
export function buildUserSummary({ p: user, analysis, settings, taxonomy }: SummaryInput): string {
  const { range, population, coverage } = analysis;
  const perMonth = DAYS_PER_MONTH / Math.max(1, range.length);
  const persona = taxonomy.personas.find((candidate) => candidate.id === user.persona);
  const lines: string[] = [t('GitHub Copilot AI-credit usage for {name}', { name: user.name })];

  const where = userSubtitle(user);
  if (where) lines.push(where);
  lines.push(
    t('Period: {start} to {end} ({days})', { start: fmtDay(range.start, true), end: fmtDay(range.end, true), days: pluralize(range.length, 'day') }),
    '',
  );

  lines.push(
    t('Usage: {amount} (rank {rank} of {total}, {share} of all usage)', {
      amount: money(user.gross),
      rank: fmtInt(user.rank),
      total: fmtInt(population.profiles.length),
      share: fmtPct(user.share, 1),
    }),
  );
  lines.push(
    coverage.billing
      ? t('Billed on top of seats: {amount} ({covered} covered by included credits)', { amount: money(user.net), covered: money(user.discount) })
      : t('Billed on top of seats: not in the file'),
  );
  lines.push(creditsLine(user));
  lines.push(
    user.activeDays > 0
      ? t('Active days: {days} ({rate} of workdays), last active {date}', {
          days: fmtInt(user.activeDays),
          rate: fmtPct(user.activeRate, 0),
          date: fmtDay(user.lastDay, true),
        })
      : t('Active days: {days}', { days: fmtInt(user.activeDays) }),
  );
  if (Number.isFinite(user.costPerActiveDay)) lines.push(t('Cost per active day: {amount}', { amount: money(user.costPerActiveDay) }));
  const week = population.trendReliable ? weekLine(user) : null;
  if (week) lines.push(week);

  const license = licenseLines(user);
  if (license.length) lines.push('', ...license);

  lines.push('', t('Persona: {label}', { label: labelIn(taxonomy.personas, user.persona) }));
  lines.push(t('Usage tier: {label}', { label: labelIn(taxonomy.tiers, user.tier) }));
  lines.push(t('Engagement: {label}', { label: labelIn(taxonomy.engagement, user.engagement) }));
  if (coverage.models) lines.push(t('Usage profile: {label}', { label: labelIn(taxonomy.profiles, user.profile) }));
  lines.push(t('Pareto class: {label}', { label: labelIn(taxonomy.pareto, user.pareto) }));
  if (user.traits.length) lines.push(t('Traits: {list}', { list: user.traits.map((id) => labelIn(taxonomy.traits, id)).join(', ') }));
  if (persona) lines.push(t('Suggested next step: {action}', { action: persona.action }));

  lines.push('');
  if (user.topModel) {
    lines.push(t('Top model: {model} ({share} of usage)', { model: labelOf('model', user.topModel), share: fmtPct(user.topModelShare, 0) }));
  }
  if (coverage.models) lines.push(...autoLines(user, analysis, taxonomy));
  if (coverage.tokens) lines.push(...tokenLines(user));

  if (user.potential >= 0.005) {
    lines.push('', t('Potential savings: about {amount} over this period, {monthly} a month', { amount: money(user.potential), monthly: money(user.potential * perMonth) }));
    for (const id of LEVER_ORDER) {
      if (user.potentialBy[id] >= 0.005) lines.push(`- ${t('{label}: {value}', { label: t(LEVER_META[id].label), value: money(user.potentialBy[id]) })}`);
    }
  }

  const tips = visibleTips(user, settings);
  if (tips.length) {
    lines.push('', t('What to do:'));
    for (const tip of tips) lines.push(`- ${tip.title}. ${tip.detail}`);
  }
  return lines.join('\n');
}

function legacyCopy(text: string): boolean {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const host = active?.closest('[role="dialog"]') ?? document.body;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
  host.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  active?.focus();
  return ok;
}

/** The clipboard API needs a secure context, so a page opened from a file falls back to a hidden text box. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy(text);
    }
  }
  return legacyCopy(text);
}
