import { CalcInfo, Card, DocLinks } from '../../components/ui';
import { msg, t, T } from '../../i18n';

const GROUPS: { title: string; columns: string[] }[] = [
  { title: msg('People and places'), columns: ['username', 'organization', 'repository', 'cost_center_name', 'app_client_id'] },
  { title: msg('What was used'), columns: ['product', 'sku', 'model'] },
  { title: msg('Amounts'), columns: ['quantity', 'gross_amount', 'discount_amount', 'net_amount', 'applied_cost_per_quantity', 'total_monthly_quota'] },
  { title: msg('Tokens'), columns: ['input', 'output', 'cache_read', 'cache_write'] },
];

function Code({ children }: { children: string }) {
  return <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-fg">{children}</code>;
}

function Columns({ names }: { names: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {names.map((n) => (
        <Code key={n}>{n}</Code>
      ))}
    </span>
  );
}

const c = (name: string) => <Code>{name}</Code>;

export function HelpCard() {
  return (
    <Card title={t('How to get the report')} subtitle={t('Where the file comes from, which columns the app reads and how it is handled.')}>
      <div className="grid gap-6 text-sm lg:grid-cols-2">
        <div className="space-y-3">
          <p>
            {t(
              'The AI usage report is a CSV file. You download it from the billing and usage area of your GitHub enterprise or organization. GitHub explains where to find it.',
            )}
          </p>
          <DocLinks ids={['usageBilling', 'manageSpending']} title={t('Learn more')} limit={2} compact />
          <ul className="list-disc space-y-1.5 ps-4 text-fg-muted">
            <li>
              <span className="text-fg">{t('Your data stays on this computer.')}</span>{' '}
              {t('The app runs only in your browser and the file is never uploaded.')}
            </li>
            <li>
              <span className="text-fg">{t('Several files can be loaded together, for example one per month or per organization.')}</span>{' '}
              {t('They are joined into one dataset. A row that repeats a row from an earlier file is dropped. Identical rows inside one file are all kept.')}{' '}
              <CalcInfo id="data-duplicates" />
            </li>
            <li>
              <span className="text-fg">{t('Loading new usage files replaces the usage data you have now.')}</span>{' '}
              {t('Select every file you want in one go.')}
            </li>
            <li>
              <span className="text-fg">{t('A license list can be loaded with the usage files.')}</span>{' '}
              {t('The app sees which file is which. The list is added to the license list you already have.')}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="flex items-center gap-1.5 font-medium">
              {t('Required columns')} <CalcInfo id="data-columns-found" />
            </h4>
            <p className="mt-1 text-fg-muted">
              <T
                text="{date} and at least one of {gross} or {quantity}. A file without them is rejected with a message. Without a {gross} column, usage is worked out as {quantity} × {price}, or as {quantity} × $0.01 when that column is missing too."
                values={{ date: c('date'), gross: c('gross_amount'), quantity: c('quantity'), price: c('applied_cost_per_quantity') }}
              />
            </p>
          </div>
          <div>
            <h4 className="flex items-center gap-1.5 font-medium">
              {t('Optional columns')} <CalcInfo id="data-coverage-flags" />
            </h4>
            <dl className="mt-1 space-y-1.5">
              {GROUPS.map((g) => (
                <div key={g.title} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <dt className="w-36 shrink-0 text-xs text-fg-muted">{t(g.title)}</dt>
                  <dd>
                    <Columns names={g.columns} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-xs text-fg-muted">
            <T
              text="A missing optional column is not an error. The app works out what it can, and the checks above say what is limited. Header names ignore capitals, and a space, dash or similar character counts as an underscore, so {spaced} is read as {gross}. Common other names such as {login}, {org} or {repo} are accepted. {unit}, {aicQty} and {aicGross} are accepted and ignored."
              values={{
                spaced: c('Gross Amount'),
                gross: c('gross_amount'),
                login: c('login'),
                org: c('org'),
                repo: c('repo'),
                unit: c('unit_type'),
                aicQty: c('aic_quantity'),
                aicGross: c('aic_gross_amount'),
              }}
            />
          </p>
        </div>
      </div>
    </Card>
  );
}
