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

const cell = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (headers: string[], rows: string[][]): string =>
  [`| ${headers.map(cell).join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
const labels = (items: { id: string; label: string }[]): Map<string, string> => new Map(items.map((i): [string, string] => [i.id, i.label]));

/** An executive summary in Markdown, ready to paste into an email, wiki page or slide notes. */
export function buildSummaryMarkdown({ analysis: a, settings, taxonomy, label, filters }: SummaryInput): string {
  const tot = a.agg.totals;
  const out: string[] = [];
  const range = `${fmtDay(a.range.start, true)} – ${fmtDay(a.range.end, true)}`;

  out.push(`# ${t('GitHub Copilot AI usage: executive summary')}`, '');
  out.push(t('**Data:** {label} · **Period:** {range} ({days})', { label, range, days: pluralize(a.range.length, 'day') }));
  out.push(filters.length ? t('**Filters:** {filters}', { filters: filters.join(t('; ')) }) : t('**Filters:** none (all rows)'), '');

  out.push(`## ${t('Headline')}`, '', `**${a.headline.title}.** ${a.headline.detail}`, '');
  if (a.narrowed) {
    out.push(`> ${t('The report is narrowed by filters, so organization-wide statements about the shared pool and seats are left out.')}`, '');
  }

  const prev = a.previous?.totals;
  const change = (cur: number, before: number | undefined): string => {
    if (before === undefined || !(before > 0)) return '';
    const d = cur / before - 1;
    return ` (${t('{change} vs previous {days}', { change: `${d >= 0 ? '+' : ''}${fmtPct(d, 0)}`, days: pluralize(a.range.length, 'day') })})`;
  };
  out.push(`## ${t('Key figures')}`, '');
  const billing = a.coverage.billing;
  const notInFile = t('not in this file');
  const kpis: string[][] = [
    [t('Usage'), `${fmtUSD(tot.gross, 2)}${change(tot.gross, prev?.gross)}`],
    [t('Covered by included credits'), billing ? fmtUSD(tot.discount, 2) : notInFile],
    [t('Billed overage'), billing ? `${fmtUSD(tot.net, 2)}${change(tot.net, prev?.net)}` : notInFile],
    [t('Users with usage'), fmtInt(tot.users)],
    [t('Average per user'), tot.users > 0 ? fmtUSD(tot.attributedGross / tot.users, 2) : '–'],
    [t('Auto share of usage'), tot.gross > 0 && a.coverage.models ? fmtPct(tot.autoGross / tot.gross, 0) : '–'],
  ];
  if (!a.narrowed && Number.isFinite(a.pool.utilization)) kpis.splice(3, 0, [t('Included credits used'), fmtPct(a.pool.utilization, 0)]);
  if (tot.unattributedGross > 0.005) kpis.push([t('Repo-level / unattributed usage'), fmtUSD(tot.unattributedGross, 2)]);
  out.push(table([t('Metric'), t('Value')], kpis), '');

  if (!a.narrowed && billing && a.pool.months.length) {
    out.push(`## ${t('Included credits by month')}`, '');
    out.push(
      table(
        [t('Month'), t('Pool'), t('Usage'), t('Covered'), t('Billed'), t('Used'), t('Note')],
        a.pool.months.map((m) => [
          m.label,
          m.capacityExceeded ? t('n/a') : fmtUSD(m.capacity, 0),
          m.projection ? t('{amount} (proj.)', { amount: fmtUSD(m.projection.projGross, 0) }) : fmtUSD(m.gross, 0),
          fmtUSD(m.discount, 0),
          m.projection ? t('{amount} (proj.)', { amount: fmtUSD(m.projection.projNet, 0) }) : fmtUSD(m.net, 0),
          Number.isFinite(m.utilization) ? fmtPct(m.utilization, 0) : '–',
          m.exhaustedOn !== null
            ? t('Pool ran out {date}', { date: fmtDay(m.exhaustedOn) })
            : m.projection?.exhaustionDate
              ? t('Projected to run out {date}', { date: fmtDay(m.projection.exhaustionDate) })
              : m.complete
                ? ''
                : t('Month in progress'),
        ]),
      ),
      '',
    );
  }

  const personaLabel = labels(taxonomy.personas);
  const personaRows = PERSONA_IDS.map((id) => ({ id, g: a.population.groups.persona[id] })).filter((r) => r.g.users > 0);
  if (personaRows.length) {
    out.push(`## ${t('User segments')}`, '');
    out.push(
      table(
        [t('Segment'), t('Users'), t('Usage'), t('Share of usage')],
        personaRows.map((r) => [personaLabel.get(r.id) ?? r.id, fmtInt(r.g.users), fmtUSD(r.g.gross, 0), tot.attributedGross > 0 ? fmtPct(r.g.gross / tot.attributedGross, 0) : '–']),
      ),
      '',
    );
    const tierLabel = labels(taxonomy.tiers);
    out.push(
      table(
        [t('Tier (usage vs own included credits)'), t('Users'), t('Usage')],
        TIER_IDS.map((id) => [tierLabel.get(id) ?? id, fmtInt(a.population.groups.tier[id].users), fmtUSD(a.population.groups.tier[id].gross, 0)]),
      ),
      '',
    );
  }

  const top = [...a.users.profiles].sort((x, y) => y.gross - x.gross).slice(0, settings.topN);
  if (top.length) {
    out.push(`## ${tp(top.length, 'Top {n} user by usage', 'Top {n} users by usage')}`, '');
    out.push(
      table(
        ['#', t('User'), t('Usage'), t('Share'), t('Of own credits'), t('Segment'), t('Top model')],
        top.map((p, i) => [String(i + 1), p.name, fmtUSD(p.gross, 0), fmtPct(p.share, 0), fmtPct(p.utilization, 0), personaLabel.get(p.persona) ?? p.persona, p.topModel || '–']),
      ),
      '',
    );
  }

  const recs = [...a.recs].sort((x, y) => recValue(y) - recValue(x) || SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity]);
  if (recs.length) {
    out.push(`## ${t('Recommendations')}`, '');
    recs.forEach((r, i) => {
      out.push(`### ${i + 1}. ${r.title} (${t(SEV_LABEL[r.severity])})`, '', r.summary, '');
      if (r.evidence.length) out.push(...r.evidence.map((e) => `- ${e}`), '');
      if (r.actions.length) out.push(`**${t('Actions')}**`, '', ...r.actions.map((x) => `- ${x}`), '');
      if (r.impactUsd > 0.5) {
        const seatsKind = r.impactKind === 'seats';
        const vars = { amount: fmtUSD(r.impactUsd, 0), kind: seatsKind ? t('seat value') : t('usage'), cash: fmtUSD(r.cashUsd, 0) };
        const potential =
          r.cashUsd > 0.5
            ? r.cashLowerBound
              ? t('about {amount} of {kind} per month, of which at least {cash} is cash saved.', vars)
              : t('about {amount} of {kind} per month, of which about {cash} is cash saved.', vars)
            : seatsKind
              ? t('about {amount} of {kind} per month, with no cash saving while the pool is fully used.', vars)
              : r.cashLowerBound
                ? t('about {amount} of {kind} per month, with the cash effect depending on the pool, which cannot be split for a filtered view.', vars)
                : t('about {amount} of {kind} per month, with no cash saving while usage stays within the included credits.', vars);
        out.push(`**${t('Potential')}:** ${potential}`, '');
      }
      if (r.caveat) out.push(`_${t('Caveat: {caveat}', { caveat: r.caveat })}_`, '');
      if (r.affected.length) {
        const names = r.affected.map((u) => u.name).join(t(', '));
        const list = r.affectedCount > r.affected.length ? t('{names} and {n} more', { names, n: r.affectedCount - r.affected.length }) : names;
        out.push(t('Affects: {list}.', { list }), '');
      }
    });
  }

  const steps = a.plan.levers.steps.filter((s) => s.savings > 0.005);
  if (steps.length) {
    out.push(`## ${t('Savings plan (default assumptions)')}`, '');
    out.push(table([t('Lever'), t('Usage avoided (period)')], steps.map((s) => [s.label, fmtUSD(s.savings, 0)])), '');
    if (!a.narrowed && billing && a.plan.months.length > 0) {
      out.push(
        t(
          'Combined cash effect of the usage levers and seat actions: about **{amount} per month**. Usage reductions only save cash once usage exceeds the included credits; seat changes only save what the pool does not need.',
          { amount: fmtUSD(a.plan.perMonth, 0) },
        ),
        '',
      );
    } else {
      const amount = fmtUSD((a.plan.levers.total * DAYS_PER_MONTH) / Math.max(1, a.range.length), 0);
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
  if (a.pool.capacityIsLowerBound && !a.narrowed) out.push(`- ${t('Pool size only counts users that appear in the report. Add the seat roster in Settings for the exact pool size.')}`);
  if (a.pool.capacityExceeded && billing && a.coverage.quota) {
    out.push(`- ${t('The included credits used exceed what the seats in this file fund, so the file likely covers only part of a larger billing entity. Pool-size statements are suppressed.')}`);
  }
  for (const issue of coverageIssues(a.coverage, a.users.fallbackQuotaCredits)) out.push(`- ${issue.title}. ${issue.detail}`);
  out.push('');
  return out.join('\n');
}
