import { Badge, Card, DocLinks } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { LinkId } from '../../lib/links';

interface Source {
  title: string;
  /** What the source adds, in one plain sentence. */
  detail: string;
  /** How to get it, in one plain sentence. */
  action: string;
  priority?: 'recommended' | 'advanced';
  used: boolean;
  links: LinkId[];
}

// Ordered by how much each source adds to this report.
const SOURCES: Source[] = [
  {
    title: msg('GitHub Copilot activity report'),
    detail: msg('For most admins, this is the easiest seat list to get. It shows last activity, sign-in date and last feature or editor, but not plan or seat start date.'),
    action: msg('For an organization, open Settings, GitHub Copilot, Access, Get usage report, then Get activity report. For an enterprise, open Billing and licensing, Licensing, then Get activity report. Check the scope and seat count before acting.'),
    priority: 'recommended',
    used: true,
    links: ['activityReport'],
  },
  {
    title: msg('Seat list from the GitHub REST API'),
    detail: msg('Advanced option for plan, seat start and pending-cancellation details, or repeatable exports. Its activity dates still have the same 90-day limit.'),
    action: msg('Save every page as JSON with the GitHub CLI, then load it with the usage report.'),
    priority: 'advanced',
    used: true,
    links: ['seatsApi'],
  },
  {
    title: msg('Usage metrics API'),
    detail: msg('Daily use by editor, language and feature. Useful to see how people work with GitHub Copilot, not what it costs.'),
    action: msg('Not read by this app yet. Use it next to this report.'),
    used: false,
    links: ['usageMetricsApi', 'usageMetricsData'],
  },
  {
    title: msg('Team members API'),
    detail: msg('Which team each user is in. Useful to compare usage by team.'),
    action: msg('Not read by this app yet. Cost centers in the usage report give a similar view.'),
    used: false,
    links: ['teamMembersApi'],
  },
  {
    title: msg('Cost centers API'),
    detail: msg('All cost centers and their members, including people with no usage yet.'),
    action: msg('Not read by this app yet. The usage report already names the cost center of each row.'),
    used: false,
    links: ['costCentersApi'],
  },
  {
    title: msg('Billing usage API'),
    detail: msg('The same usage as the report file, by API. Useful to download it on a schedule.'),
    action: msg('Not read by this app yet. Download the usage report from your billing settings instead.'),
    used: false,
    links: ['billingUsageApi'],
  },
  {
    title: msg('Budgets API'),
    detail: msg('The budgets set for AI credits and how much of each is spent.'),
    action: msg('Not read by this app yet. Set budgets in your billing settings.'),
    used: false,
    links: ['budgetsApi'],
  },
  {
    title: msg('Audit log'),
    detail: msg('When seats were added or removed, and by whom.'),
    action: msg('Not read by this app yet. Search the audit log for GitHub Copilot events.'),
    used: false,
    links: ['auditLogs'],
  },
];

/** Other GitHub data that adds to the usage report, and whether the app reads it. */
export function EnrichmentCard() {
  return (
    <Card title={t('What else you can add')} subtitle={t('Other GitHub data that adds to the usage report, from the most useful.')}>
      <ol className="space-y-3">
        {SOURCES.map((s) => (
          <li key={s.title} className="rounded-lg border border-border px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-fg">{t(s.title)}</span>
              {s.priority === 'recommended' ? <Badge tone="good">{t('Recommended for most admins')}</Badge> : null}
              {s.priority === 'advanced' ? <Badge>{t('Advanced')}</Badge> : null}
              {s.used ? <Badge tone="good">{t('Read by this app')}</Badge> : <Badge>{t('Not read yet')}</Badge>}
            </div>
            <p className="mt-1 text-xs text-fg-muted">{t(s.detail)}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{t(s.action)}</p>
            <DocLinks ids={s.links} compact className="mt-1.5" />
          </li>
        ))}
      </ol>
    </Card>
  );
}
