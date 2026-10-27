import { msg, t, tp } from '../../i18n/core.ts';
import type { Analysis } from '../analytics/analyze';
import { coverageIssues } from '../analytics/coverage';
import { DOCS, SEVERITY_ORDER, recValue, type Recommendation } from '../analytics/recommendations';
import type { Settings } from '../analytics/settings';
import type { Taxonomy } from '../analytics/taxonomy';
import { PERSONA_IDS, TIER_IDS } from '../analytics/users';
import { DAYS_PER_MONTH, fmtDay } from '../utils/date';
import { fmtInt, fmtPct, fmtUSD, pluralize } from '../utils/format';

export interface SummaryInput {
  analysis: Analysis;
  settings: Settings;
  taxonomy: Taxonomy;
  /** What was loaded, e.g. file names. */
  label: string;
  /** Human-readable descriptions of the active filters. */
  filters: string[];
}

/** English words; show them through t(). */
const SEV_LABEL: Record<Recommendation['severity'], string> = {
  critical: msg('Critical'),
  high: msg('High'),
  medium: msg('Medium'),
  low: msg('Low'),
  info: msg('Info'),
  positive: msg('Good news'),
};

const cell = (text: string): string => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (headers: string[], rows: string[][]): string =>
  [`| ${headers.map(cell).join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`)].join('\n');
const labels = (items: { id: string; label: string }[]): Map<string, string> => new Map(items.map((item): [string, string] => [item.id, item.label]));

/** An executive summary in Markdown, ready to paste into an email, wiki page or slide notes. */
export function buildSummaryMarkdown({ analysis: analysis, settings, taxonomy, label, filters }: SummaryInput): string {
  const totals = analysis.agg.totals;
  const out: string[] = [];
  const range = `${fmtDay(analysis.range.start, true)} – ${fmtDay(analysis.range.end, true)}`;

  out.push(`# ${t('GitHub Copilot AI usage: executive summary')}`, '');
  out.push(t('**Data:** {label} · **Period:** {range} ({days})', { label, range, days: pluralize(analysis.range.length, 'day') }));
  out.push(filters.length ? t('**Filters:** {filters}', { filters: filters.join(t('; ')) }) : t('**Filters:** none (all rows)'), '');

  out.push(`## ${t('Headline')}`, '', `**${analysis.headline.title}.** ${analysis.headline.detail}`, '');
  if (analysis.narrowed) {
    out.push(`> ${t('The report is narrowed by filters, so organization-wide statements about the shared pool and seats are left out.')}`, '');
  }

  const prev = analysis.previous?.totals;
  const change = (current: number, before: number | undefined): string => {
    if (before === undefined || !(before > 0)) return '';
    const relativeChange = current / before - 1;
    return ` (${t('{change} vs previous {days}', { change: `${relativeChange >= 0 ? '+' : ''}${fmtPct(relativeChange, 0)}`, days: pluralize(analysis.range.length, 'day') })})`;
  };
  out.push(`## ${t('Key figures')}`, '');
  const billing = analysis.coverage.billing;
  const notInFile = t('not in this file');
  const kpis: string[][] = [
    [t('Usage'), `${fmtUSD(totals.gross, 2)}${change(totals.gross, prev?.gross)}`],
    [t('Covered by included credits'), billing ? fmtUSD(totals.discount, 2) : notInFile],
    [t('Billed overage'), billing ? `${fmtUSD(totals.net, 2)}${change(totals.net, prev?.net)}` : notInFile],
    [t('Users with usage'), fmtInt(totals.users)],
    [t('Average per user'), totals.users > 0 ? fmtUSD(totals.attributedGross / totals.users, 2) : '–'],
    [t('Auto share of usage'), totals.gross > 0 && analysis.coverage.models ? fmtPct(totals.autoGross / totals.gross, 0) : '–'],
  ];
  if (!analysis.narrowed && Number.isFinite(analysis.pool.utilization)) kpis.splice(3, 0, [t('Included credits used'), fmtPct(analysis.pool.utilization, 0)]);
  if (totals.unattributedGross > 0.005) kpis.push([t('Repo-level / unattributed usage'), fmtUSD(totals.unattributedGross, 2)]);
  out.push(table([t('Metric'), t('Value')], kpis), '');

  if (!analysis.narrowed && billing && analysis.pool.months.length) {
    out.push(`## ${t('Included credits by month')}`, '');
    out.push(
      table(
        [t('Month'), t('Pool'), t('Usage'), t('Covered'), t('Billed'), t('Used'), t('Note')],
        analysis.pool.months.map((month) => [
          month.label,
          month.capacityExceeded ? t('n/a') : fmtUSD(month.capacity, 0),
          month.projection ? t('{amount} (proj.)', { amount: fmtUSD(month.projection.projGross, 0) }) : fmtUSD(month.gross, 0),
          fmtUSD(month.discount, 0),
          month.projection ? t('{amount} (proj.)', { amount: fmtUSD(month.projection.projNet, 0) }) : fmtUSD(month.net, 0),
          Number.isFinite(month.utilization) ? fmtPct(month.utilization, 0) : '–',
          month.exhaustedOn !== null
            ? t('Pool ran out {date}', { date: fmtDay(month.exhaustedOn) })
            : month.projection?.exhaustionDate
              ? t('Projected to run out {date}', { date: fmtDay(month.projection.exhaustionDate) })
              : month.complete
                ? ''
                : t('Month in progress'),
        ]),
      ),
      '',
    );
  }

  const personaLabel = labels(taxonomy.personas);
  const personaRows = PERSONA_IDS.map((id) => ({ id, g: analysis.population.groups.persona[id] })).filter((persona) => persona.g.users > 0);
  if (personaRows.length) {
    out.push(`## ${t('User segments')}`, '');
    out.push(
      table(
        [t('Segment'), t('Users'), t('Usage'), t('Share of usage')],
        personaRows.map((persona) => [personaLabel.get(persona.id) ?? persona.id, fmtInt(persona.g.users), fmtUSD(persona.g.gross, 0), totals.attributedGross > 0 ? fmtPct(persona.g.gross / totals.attributedGross, 0) : '–']),
      ),
      '',
    );
    const tierLabel = labels(taxonomy.tiers);
    out.push(
      table(
        [t('Tier (usage vs own included credits)'), t('Users'), t('Usage')],
        TIER_IDS.map((id) => [tierLabel.get(id) ?? id, fmtInt(analysis.population.groups.tier[id].users), fmtUSD(analysis.population.groups.tier[id].gross, 0)]),
      ),
      '',
    );
  }

  const top = [...analysis.users.profiles].sort((first, second) => second.gross - first.gross).slice(0, settings.topN);
  if (top.length) {
    out.push(`## ${tp(top.length, 'Top {n} user by usage', 'Top {n} users by usage')}`, '');
    out.push(
      table(
        ['#', t('User'), t('Usage'), t('Share'), t('Of own credits'), t('Segment'), t('Top model')],
        top.map((user, index) => [String(index + 1), user.name, fmtUSD(user.gross, 0), fmtPct(user.share, 0), fmtPct(user.utilization, 0), personaLabel.get(user.persona) ?? user.persona, user.topModel || '–']),
      ),
      '',
    );
  }

  const recommendations = [...analysis.recs].sort((first, second) => recValue(second) - recValue(first) || SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity]);
  if (recommendations.length) {
    out.push(`## ${t('Recommendations')}`, '');
    recommendations.forEach((recommendation, index) => {
      out.push(`### ${index + 1}. ${recommendation.title} (${t(SEV_LABEL[recommendation.severity])})`, '', recommendation.summary, '');
      if (recommendation.evidence.length) out.push(...recommendation.evidence.map((fact) => `- ${fact}`), '');
      if (recommendation.actions.length) out.push(`**${t('Actions')}**`, '', ...recommendation.actions.map((action) => `- ${action}`), '');
      if (recommendation.impactUsd > 0.5) {
        const seatsKind = recommendation.impactKind === 'seats';
        const values = { amount: fmtUSD(recommendation.impactUsd, 0), kind: seatsKind ? t('seat value') : t('usage'), cash: fmtUSD(recommendation.cashUsd, 0) };
        const potential =
          recommendation.cashUsd > 0.5
            ? recommendation.cashLowerBound
              ? t('about {amount} of {kind} per month, of which at least {cash} is cash saved.', values)
              : t('about {amount} of {kind} per month, of which about {cash} is cash saved.', values)
            : seatsKind
              ? t('about {amount} of {kind} per month, with no cash saving while the pool is fully used.', values)
              : recommendation.cashLowerBound
                ? t('about {amount} of {kind} per month, with the cash effect depending on the pool, which cannot be split for a filtered view.', values)
                : t('about {amount} of {kind} per month, with no cash saving while usage stays within the included credits.', values);
        out.push(`**${t('Potential')}:** ${potential}`, '');
      }
      if (recommendation.caveat) out.push(`_${t('Caveat: {caveat}', { caveat: recommendation.caveat })}_`, '');
      if (recommendation.affected.length) {
        const names = recommendation.affected.map((user) => user.name).join(t(', '));
        const list = recommendation.affectedCount > recommendation.affected.length ? t('{names} and {n} more', { names, n: recommendation.affectedCount - recommendation.affected.length }) : names;
        out.push(t('Affects: {list}.', { list }), '');
      }
    });
  }

  const steps = analysis.plan.levers.steps.filter((step) => step.savings > 0.005);
  if (steps.length) {
    out.push(`## ${t('Savings plan (default assumptions)')}`, '');
    out.push(table([t('Lever'), t('Usage avoided (period)')], steps.map((step) => [step.label, fmtUSD(step.savings, 0)])), '');
    if (!analysis.narrowed && billing && analysis.plan.months.length > 0) {
      out.push(
        t(
          'Combined cash effect of the usage levers and seat actions: about **{amount} per month**. Usage reductions only save cash once usage exceeds the included credits; seat changes only save what the pool does not need.',
          { amount: fmtUSD(analysis.plan.perMonth, 0) },
        ),
        '',
      );
    } else {
      const amount = fmtUSD((analysis.plan.levers.total * DAYS_PER_MONTH) / Math.max(1, analysis.range.length), 0);
      out.push(
        billing
          ? t(
              'Combined effect of the usage levers: about **{amount} less usage per month**. Whether this saves cash depends on the shared pool, which cannot be split for a filtered view; the overlapping levers are not double counted.',
              { amount },
            )
          : t(
              'Combined effect of the usage levers: about **{amount} less usage per month**. Whether this saves cash depends on the shared pool, which this file does not describe; the overlapping levers are not double counted.',
              { amount },
            ),
        '',
      );
    }
  }

  out.push(`## ${t('How to read this report')}`, '');
  out.push(
    `- ${t('Usage = AI credits × $0.01. Included credits are pooled across all seats of a billing entity and reset on the 1st (UTC); anything above the pool is billed.')}`,
    `- ${t('Prices come from the model price card ({url}); token-based estimates are approximations.', { url: DOCS.pricing.url })}`,
    `- ${t('Completions and next-edit suggestions are not in this export, so a user who looks idle here may still use GitHub Copilot.')}`,
  );
  if (analysis.pool.capacityIsLowerBound && !analysis.narrowed) out.push(`- ${t('Pool size only counts users that appear in the report. Add the seat roster in Settings for the exact pool size.')}`);
  if (analysis.pool.capacityExceeded && billing && analysis.coverage.quota) {
    out.push(`- ${t('The included credits used exceed what the seats in this file fund, so the file likely covers only part of a larger billing entity. Pool-size statements are suppressed.')}`);
  }
  for (const issue of coverageIssues(analysis.coverage, analysis.users.fallbackQuotaCredits)) out.push(`- ${issue.title}. ${issue.detail}`);
  out.push('');
  return out.join('\n');
}
