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
const money = (v: number): string => fmtUSD(v, 2);

function labelIn<T extends string>(items: readonly TaxonomyItem<T>[], id: T): string {
  const item = items.find((i) => i.id === id);
  return item ? shortLabel(item.label) : id;
}

function creditsLine(p: UserProfile): string {
  if (!hasQuota(p)) return t('Included credits used: not in the file');
  const share = fmtPctAuto(p.utilization);
  return p.balance >= 0
    ? t('Included credits used: {share} ({left} left of {total})', { share, left: money(p.balance), total: money(p.allotment) })
    : t('Included credits used: {share} ({over} over {total})', { share, over: money(-p.balance), total: money(p.allotment) });
}

function weekLine(p: UserProfile): string | null {
  if (p.recent <= 0 && p.prior <= 0) return null;
  if (p.prior <= 0 || !Number.isFinite(p.trend)) return t('Last 7 days: {amount}, nothing the week before', { amount: money(p.recent) });
  const vars = { amount: money(p.recent), prior: money(p.prior) };
  return p.trend >= 0
    ? t('Last 7 days: {amount}, up {change} from {prior} the week before', { ...vars, change: fmtPct(p.trend, 0) })
    : t('Last 7 days: {amount}, down {change} from {prior} the week before', { ...vars, change: fmtPct(-p.trend, 0) });
}

function tokenLines(p: UserProfile): string[] {
  if (!(p.tokens > 0)) return [];
  const lines = [
    t('Total tokens: {total} (input {input}, cache read {read}, cache write {write}, output {output})', {
      total: fmtCount(p.tokens),
      input: fmtCount(p.input),
      read: fmtCount(p.cacheRead),
      write: fmtCount(p.cacheWrite),
      output: fmtCount(p.output),
    }),
  ];
  if (Number.isFinite(p.cacheHit)) lines.push(t('Cache hit rate: {rate}', { rate: fmtPct(p.cacheHit, 0) }));
  return lines;
}

function autoLines(p: UserProfile, analysis: Analysis, taxonomy: Taxonomy): string[] {
  const rate = rateForPlan(analysis.autoRates, p.quotaCredits);
  const basis = analysis.autoRates.plans.find((x) => x.credits === p.quotaCredits)?.source ?? 'assumed';
  const lines = [
    t('Auto share of usage: {share}', { share: fmtPct(p.autoShare, 0) }),
    t('Auto use class: {label}', { label: labelIn(taxonomy.autoUse, p.autoUse) }),
  ];
  if (p.auto.billed > 0) {
    lines.push(
      t('Auto discount received: {amount} ({rate} off an original price of {original})', {
        amount: money(p.auto.discount),
        rate: fmtPct(p.auto.rate, 1),
        original: money(p.auto.original),
      }),
    );
  }
  if (p.autoMissed >= 0.005) {
    const vars = { amount: money(p.autoMissed), base: money(p.directBilled), rate: fmtPct(rate, 1) };
    lines.push(
      basis === 'measured'
        ? t('Discount missed on hand-picked usage: about {amount} ({base} at the {rate} discount rate of the plan, measured)', vars)
        : t('Discount missed on hand-picked usage: about {amount} ({base} at the {rate} discount rate of the plan, assumed)', vars),
    );
  }
  return lines;
}

function licenseLines(p: UserProfile): string[] {
  const lic = p.license;
  const status = seatStatusOf(lic);
  if (!lic || !status) return [];
  if (!lic.seat) return [t('License: no seat in the license list')];
  const lines = [
    t('License: {plan}, {status}', { plan: lic.plan ? seatPlanLabel(lic.plan) : t('Not in the export'), status: seatStatusLabel(status) }),
  ];
  if (lic.lastActivityAt) {
    lines.push(
      lic.lastSurface
        ? t('Last activity in the license list: {date} in {surface}', { date: licenseDay(lic.lastActivityAt), surface: lic.lastSurface })
        : t('Last activity in the license list: {date}', { date: licenseDay(lic.lastActivityAt) }),
    );
  }
  if (lic.pendingCancellation) lines.push(t('Cancellation date: {date}', { date: licenseDay(lic.pendingCancellation) }));
  return lines;
}

/** Plain text for an email or chat message, in the reader's language. It is built when the button is pressed, not on every render. */
export function buildUserSummary({ p, analysis, settings, taxonomy }: SummaryInput): string {
  const { range, population, coverage } = analysis;
  const perMonth = DAYS_PER_MONTH / Math.max(1, range.length);
  const persona = taxonomy.personas.find((i) => i.id === p.persona);
  const lines: string[] = [t('GitHub Copilot AI-credit usage for {name}', { name: p.name })];

  const where = userSubtitle(p);
  if (where) lines.push(where);
  lines.push(
    t('Period: {start} to {end} ({days})', { start: fmtDay(range.start, true), end: fmtDay(range.end, true), days: pluralize(range.length, 'day') }),
    '',
  );

  lines.push(
    t('Usage: {amount} (rank {rank} of {total}, {share} of all usage)', {
      amount: money(p.gross),
      rank: fmtInt(p.rank),
      total: fmtInt(population.profiles.length),
      share: fmtPct(p.share, 1),
    }),
  );
  lines.push(
    coverage.billing
      ? t('Billed on top of seats: {amount} ({covered} covered by included credits)', { amount: money(p.net), covered: money(p.discount) })
      : t('Billed on top of seats: not in the file'),
  );
  lines.push(creditsLine(p));
  lines.push(
    p.activeDays > 0
      ? t('Active days: {days} ({rate} of workdays), last active {date}', {
          days: fmtInt(p.activeDays),
          rate: fmtPct(p.activeRate, 0),
          date: fmtDay(p.lastDay, true),
        })
      : t('Active days: {days}', { days: fmtInt(p.activeDays) }),
  );
  if (Number.isFinite(p.costPerActiveDay)) lines.push(t('Cost per active day: {amount}', { amount: money(p.costPerActiveDay) }));
  const week = population.trendReliable ? weekLine(p) : null;
  if (week) lines.push(week);

  const license = licenseLines(p);
  if (license.length) lines.push('', ...license);

  lines.push('', t('Persona: {label}', { label: labelIn(taxonomy.personas, p.persona) }));
  lines.push(t('Usage tier: {label}', { label: labelIn(taxonomy.tiers, p.tier) }));
  lines.push(t('Engagement: {label}', { label: labelIn(taxonomy.engagement, p.engagement) }));
  if (coverage.models) lines.push(t('Usage profile: {label}', { label: labelIn(taxonomy.profiles, p.profile) }));
  lines.push(t('Pareto class: {label}', { label: labelIn(taxonomy.pareto, p.pareto) }));
  if (p.traits.length) lines.push(t('Traits: {list}', { list: p.traits.map((id) => labelIn(taxonomy.traits, id)).join(', ') }));
  if (persona) lines.push(t('Suggested next step: {action}', { action: persona.action }));

  lines.push('');
  if (p.topModel) {
    lines.push(t('Top model: {model} ({share} of usage)', { model: labelOf('model', p.topModel), share: fmtPct(p.topModelShare, 0) }));
  }
  if (coverage.models) lines.push(...autoLines(p, analysis, taxonomy));
  if (coverage.tokens) lines.push(...tokenLines(p));

  if (p.potential >= 0.005) {
    lines.push('', t('Potential savings: about {amount} over this period, {monthly} a month', { amount: money(p.potential), monthly: money(p.potential * perMonth) }));
    for (const id of LEVER_ORDER) {
      if (p.potentialBy[id] >= 0.005) lines.push(`- ${t('{label}: {value}', { label: t(LEVER_META[id].label), value: money(p.potentialBy[id]) })}`);
    }
  }

  const tips = visibleTips(p, settings);
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
