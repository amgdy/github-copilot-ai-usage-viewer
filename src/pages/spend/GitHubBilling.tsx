import { useMemo } from 'react';
import { Badge, CalcInfo, Card, DataTable, DocLinks, ProgressBar, Section, type Column, type Tone } from '../../components/ui';
import { t, tp } from '../../i18n';
import type { GitHubBudget, GitHubData, MonthBill } from '../../lib/collection';
import { fmtInt, fmtNum, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { budgetName, fromGitHub, monthName } from '../githubText';

const usdOrDash = (amount: number | null): string => (amount === null ? '–' : fmtUSD(amount));

/** The whole GitHub Copilot bill of each month: seats plus AI credits billed. */
function BillCard({ github }: { github: GitHubData }) {
  const columns = useMemo<Column<MonthBill>[]>(
    () => [
      {
        key: 'month',
        header: t('Month'),
        value: (row) => row.month,
        render: (row) => (
          <span className="inline-flex flex-wrap items-center gap-2">
            {monthName(row.month)}
            {row.open ? <Badge tone="neutral">{t('Month not over')}</Badge> : null}
          </span>
        ),
      },
      { key: 'seats', header: t('Seats'), align: 'end', value: (row) => row.seats, render: (row) => usdOrDash(row.seats) },
      { key: 'seat-months', header: t('Seat-months'), align: 'end', value: (row) => row.seatMonths, render: (row) => (row.seatMonths === null ? '–' : fmtNum(row.seatMonths, 1)) },
      { key: 'ai-credits', header: t('AI credits billed'), align: 'end', value: (row) => row.aiCredits, render: (row) => usdOrDash(row.aiCredits) },
      { key: 'total', header: t('Total'), align: 'end', value: (row) => row.total, render: (row) => <span className="font-semibold">{usdOrDash(row.total)}</span> },
    ],
    [],
  );
  return (
    <Card
      title={t('Whole GitHub Copilot bill')}
      calc="github-bill"
      subtitle={t('Seats and the AI credits billed on top of them, by month. The usage report shows only the AI credits.')}
      footer={<DocLinks topic="billing" title={t('Learn more')} limit={2} compact />}
    >
      <DataTable rows={github.bills} columns={columns} rowKey={(row) => row.month} defaultSort={{ key: 'month', dir: 'desc' }} exportName="github-copilot-whole-bill" dense />
    </Card>
  );
}

function shareTone(share: number): Tone {
  if (share >= 1) return 'bad';
  if (share >= 0.8) return 'warn';
  return 'good';
}

function BudgetShare({ budget }: { budget: GitHubBudget }) {
  if (budget.consumed === null || budget.amount <= 0) return <span className="text-fg-subtle">–</span>;
  const share = budget.consumed / budget.amount;
  return (
    <div className="flex min-w-28 items-center gap-2">
      <ProgressBar value={share} tone={shareTone(share)} height={6} className="flex-1" label={t('Share of the budget used')} />
      <span className="num w-12 text-end text-xs">{fmtPct(share, 0)}</span>
    </div>
  );
}

/** Report logins that match the given GitHub logins, without regard to upper and lower case. */
function reportLogins(logins: readonly string[], reportUsers: readonly string[]): string[] {
  const byLowerCase = new Map(reportUsers.map((login) => [login.toLowerCase(), login]));
  return logins.map((login) => byLowerCase.get(login.toLowerCase())).filter((login): login is string => login !== undefined);
}

/** The GitHub Copilot budgets set at GitHub. */
function BudgetsCard({ github }: { github: GitHubData }) {
  const { analysis, store } = useAnalysis();
  const inUse = analysis.budgetSource === 'github' ? github.budget?.id : undefined;
  const columns = useMemo<Column<GitHubBudget>[]>(
    () => [
      {
        key: 'budget',
        header: t('Budget'),
        value: (budget) => budgetName(budget),
        render: (budget) => (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-medium">{budgetName(budget)}</span>
            {budget.id === inUse ? <Badge tone="accent">{t('Used as the monthly budget')}</Badge> : null}
          </span>
        ),
      },
      { key: 'covers', header: t('Covers'), value: (budget) => (budget.aiCredits ? t('AI credits') : t('All of GitHub Copilot')) },
      { key: 'amount', header: t('Budget'), align: 'end', value: (budget) => budget.amount, render: (budget) => fmtUSD(budget.amount) },
      { key: 'used', header: t('Used'), align: 'end', value: (budget) => budget.consumed, render: (budget) => usdOrDash(budget.consumed) },
      {
        key: 'share',
        header: t('Share used'),
        value: (budget) => (budget.consumed === null || budget.amount <= 0 ? null : budget.consumed / budget.amount),
        render: (budget) => <BudgetShare budget={budget} />,
      },
      {
        key: 'when-used-up',
        header: t('When used up'),
        value: (budget) => (budget.stopsUsage ? t('Stops usage') : t('Alerts only')),
        render: (budget) => <Badge tone={budget.stopsUsage ? 'info' : 'neutral'}>{budget.stopsUsage ? t('Stops usage') : t('Alerts only')}</Badge>,
      },
      { key: 'alerts', header: t('Alerts'), value: (budget) => (budget.willAlert ? t('On') : t('Off')) },
    ],
    [inUse],
  );

  const atLimit = github.usersAtLimit;
  const inReport = reportLogins(
    atLimit.map((user) => user.login),
    store.dicts.user.values,
  );
  const budgetsAsked = github.collection.sources.some((source) => source.id === 'budgets' && source.status !== 'skipped');
  const budgetsFailed = github.problems.some((source) => source.id === 'budgets');

  return (
    <Card
      title={t('Budgets at GitHub')}
      calc="github-budgets"
      subtitle={t('The budgets for GitHub Copilot and how much of each was used on the day the data was collected.')}
      footer={<DocLinks topic="budgets" title={t('Learn more')} limit={3} compact />}
    >
      <div className="space-y-3">
        {github.copilotBudgets.length > 0 ? (
          <DataTable
            rows={github.copilotBudgets}
            columns={columns}
            rowKey={(budget) => budget.id}
            pageSize={10}
            searchable={github.copilotBudgets.length > 10}
            exportName="github-copilot-budgets"
            dense
          />
        ) : (
          <p className="text-sm text-fg-muted">
            {budgetsFailed ? t('The budgets could not be read in full. The Data page says why.') : budgetsAsked ? t('The file has no budget for GitHub Copilot.') : t('The script did not read the budgets.')}
          </p>
        )}
        {atLimit.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              {tp(atLimit.length, '{n} user has used up their budget and cannot use AI credits until the next billing cycle.', '{n} users have used up their budget and cannot use AI credits until the next billing cycle.', {
                n: fmtInt(atLimit.length),
              })}
              <CalcInfo id="rec-user-budget-reached" className="ms-1" />
            </p>
            {inReport.length > 0 ? (
              <button type="button" className="btn btn-sm" onClick={() => drill({ users: inReport }, { page: 'users' })}>
                {t('Show these users')}
              </button>
            ) : null}
          </div>
        ) : null}
        {github.otherBudgets > 0 ? (
          <p className="text-xs text-fg-subtle">
            {tp(github.otherBudgets, '{n} budget for other products is not shown.', '{n} budgets for other products are not shown.', { n: fmtInt(github.otherBudgets) })}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

/** The bill and budgets from the GitHub data file. Shown only when one is loaded with your own usage report. */
export function GitHubBilling() {
  const { github } = useAnalysis();
  if (github === null) return null;
  const budgetsAsked = github.collection.sources.some((source) => source.id === 'budgets' && source.status !== 'skipped');
  if (github.bills.length === 0 && !budgetsAsked) return null;
  return (
    <Section title={t('Bill and budgets at GitHub')} description={`${fromGitHub(github.collection.header)} ${t('The filters do not change these amounts.')}`}>
      <div className="space-y-4">
        {github.bills.length > 0 ? <BillCard github={github} /> : null}
        {budgetsAsked ? <BudgetsCard github={github} /> : null}
      </div>
    </Section>
  );
}
