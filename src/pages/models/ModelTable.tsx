import { useMemo } from 'react';
import { VendorIcon } from '../../components/icons';
import { Badge, Card, DataTable, ProgressBar, type Column } from '../../components/ui';
import { t } from '../../i18n';
import { fmtInt, fmtNum, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import type { ModelRow } from './data';
import { PriceSource, TierBadge, VendorName, fmtCount, fmtCredits, fmtRate, tierLabel, vendorLabel } from './parts';

const sum = (rows: ModelRow[], pick: (r: ModelRow) => number): number => rows.reduce((a, r) => a + pick(r), 0);

export function ModelTable({ rows }: { rows: ModelRow[] }) {
  const { store } = useAnalysis();
  const selectUser = useApp((s) => s.selectUser);
  const hasTokens = store.hasTokens;
  const hasTopUser = rows.some((r) => r.topUser !== null);

  const columns = useMemo(() => {
    const lead: Column<ModelRow>[] = [
      {
        key: 'model',
        header: t('Model'),
        value: (r) => r.label,
        render: (r) => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <VendorIcon vendor={r.vendor} size={14} className="shrink-0 text-fg-muted" />
            <span className="font-medium">{r.label}</span>
            {!r.priced ? (
              <Badge tone="warn" title={t('This model has no price on the price card or in Settings, so it cannot be compared. Set a tier and a price in Settings.')}>
                {t('No price')}
              </Badge>
            ) : null}
            {r.autoShare >= 0.999 ? (
              <Badge tone="info" title={t('Auto picked this model for at least 99.9% of its usage.')}>
                {t('Auto only')}
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        key: 'vendor',
        header: t('Vendor'),
        value: (r) => vendorLabel(r.vendor),
        render: (r) => <VendorName vendor={r.vendor} className="whitespace-nowrap" />,
        calc: 'model-vendor',
      },
      {
        key: 'tier',
        header: t('Tier'),
        value: (r) => tierLabel(r.tier),
        render: (r) => <TierBadge tier={r.tier} />,
        hint: t('Powerful, Versatile or Lightweight. Powerful models have the highest token prices.'),
        calc: 'model-tier',
      },
      {
        key: 'users',
        header: t('Users'),
        align: 'end',
        value: (r) => r.users,
        render: (r) => fmtInt(r.users),
        hint: t('People with usage on this model. Usage not tied to a person is not counted.'),
        calc: 'model-users',
      },
      {
        key: 'requests',
        header: t('Requests'),
        align: 'end',
        value: (r) => r.requests,
        render: (r) => fmtInt(r.requests),
        hint: t('Usage lines in the report. One line is not always one prompt.'),
        calc: 'model-requests',
        total: (rs) => fmtInt(sum(rs, (r) => r.requests)),
      },
      {
        key: 'credits',
        header: t('Credits'),
        align: 'end',
        value: (r) => r.credits,
        render: (r) => fmtCredits(r.credits),
        hint: t('AI credits used. One credit is worth $0.01.'),
        calc: 'ai-credit',
        total: (rs) => fmtCredits(sum(rs, (r) => r.credits)),
      },
      {
        key: 'gross',
        header: t('Usage'),
        align: 'end',
        value: (r) => r.gross,
        render: (r) => fmtUSD(r.gross),
        hint: t('The amount charged in the report. Rows that went through Auto are after the Auto discount.'),
        calc: 'usage',
        total: (rs) => fmtUSD(sum(rs, (r) => r.gross)),
      },
      {
        key: 'share',
        header: t('Share of usage'),
        align: 'end',
        value: (r) => r.share,
        render: (r) => (
          <span className="inline-flex items-center justify-end gap-2">
            <span className="w-12">
              <ProgressBar value={r.share} height={6} label={t('Share of usage on {model}', { model: r.label })} />
            </span>
            <span className="w-12 text-end">{fmtPct(r.share)}</span>
          </span>
        ),
        hint: t('Share of all usage in this scope.'),
        calc: 'model-share',
        total: (rs) => fmtPct(sum(rs, (r) => r.share)),
      },
      {
        key: 'net',
        header: t('Billed'),
        align: 'end',
        value: (r) => r.net,
        render: (r) => fmtUSD(r.net),
        hint: t('Amount billed on top of seats, after included credits.'),
        calc: 'billed',
        total: (rs) => fmtUSD(sum(rs, (r) => r.net)),
      },
      {
        key: 'cpr',
        header: t('Credits per request'),
        align: 'end',
        value: (r) => r.creditsPerRequest,
        render: (r) => fmtNum(r.creditsPerRequest, 2),
        hint: t('Average credits per usage line. Higher means heavier requests or a more expensive model.'),
        calc: 'model-credits-per-request',
      },
    ];
    const tokens: Column<ModelRow>[] = hasTokens
      ? [
          {
            key: 'input',
            header: t('Input tokens'),
            align: 'end',
            value: (r) => r.input,
            render: (r) => fmtCount(r.input),
            hint: t('Prompt tokens that were not read from the cache.'),
            calc: 'tokens-input',
            total: (rs) => fmtCount(sum(rs, (r) => r.input)),
          },
          {
            key: 'output',
            header: t('Output tokens'),
            align: 'end',
            value: (r) => r.output,
            render: (r) => fmtCount(r.output),
            hint: t('Tokens the model wrote back.'),
            calc: 'tokens-output',
            total: (rs) => fmtCount(sum(rs, (r) => r.output)),
          },
          {
            key: 'cacheRead',
            header: t('Cache read tokens'),
            align: 'end',
            value: (r) => r.cacheRead,
            render: (r) => fmtCount(r.cacheRead),
            hint: t('Text the model has seen before and reads again from the cache at a lower price.'),
            calc: 'tokens-cache-read',
            total: (rs) => fmtCount(sum(rs, (r) => r.cacheRead)),
          },
          {
            key: 'cacheWrite',
            header: t('Cache write tokens'),
            align: 'end',
            value: (r) => r.cacheWrite,
            render: (r) => fmtCount(r.cacheWrite),
            hint: t('Text saved to the cache so later requests can read it at a lower price. Some models charge extra to save it.'),
            calc: 'tokens-cache-write',
            total: (rs) => fmtCount(sum(rs, (r) => r.cacheWrite)),
          },
          {
            key: 'cache',
            header: t('Cache hit rate'),
            align: 'end',
            value: (r) => r.cacheHit,
            render: (r) => fmtPct(r.cacheHit, 0),
            hint: t('Share of prompt tokens read from the cache. Cache reads cost far less than new input.'),
            calc: 'cache-hit',
          },
        ]
      : [];
    const tail: Column<ModelRow>[] = [
      {
        key: 'priceIn',
        header: t('Input price / 1M'),
        align: 'end',
        value: (r) => r.priceIn,
        render: (r) => fmtRate(r.priceIn),
        hint: t('Price per 1 million input tokens on the price card. A dash means the model has no price.'),
        calc: 'model-list-price',
      },
      {
        key: 'priceOut',
        header: t('Output price / 1M'),
        align: 'end',
        value: (r) => r.priceOut,
        render: (r) => fmtRate(r.priceOut),
        hint: t('Price per 1 million output tokens on the price card. A dash means the model has no price.'),
        calc: 'model-list-price',
      },
      {
        key: 'auto',
        header: t('Auto share'),
        align: 'end',
        value: (r) => r.autoShare,
        render: (r) => fmtPct(r.autoShare, 0),
        hint: t('Share of the usage on this model where Auto picked it.'),
        calc: 'model-auto-share',
      },
      {
        key: 'cheaper',
        header: t('Cheaper option'),
        value: (r) => r.cheaper?.target ?? null,
        render: (r) => (r.cheaper ? <span className="whitespace-nowrap">{r.cheaper.target}</span> : <span className="text-fg-subtle">–</span>),
        hint: t('A mid-tier model from the same vendor. Only shown for Powerful models with token data.'),
        calc: 'model-cheaper-option',
      },
      {
        key: 'ratio',
        header: t('Cost on cheaper option'),
        align: 'end',
        value: (r) => r.cheaper?.ratio ?? null,
        render: (r) => (r.cheaper ? fmtPct(r.cheaper.ratio, 0) : '–'),
        hint: t("Cost of the same tokens on the cheaper option, as a share of today's cost. 40% means 60% less."),
        calc: 'model-cheaper-cost',
      },
    ];
    const topUser: Column<ModelRow>[] = hasTopUser
      ? [
          {
            key: 'topUser',
            header: t('Top user'),
            hidden: true,
            value: (r) => r.topUser?.name ?? null,
            render: (r) =>
              r.topUser ? (
                <button
                  type="button"
                  className="whitespace-nowrap text-start hover:text-accent hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (r.topUser) selectUser(r.topUser.id);
                  }}
                >
                  {r.topUser.name} <span className="num text-fg-muted">{fmtPct(r.topUser.share, 0)}</span>
                </button>
              ) : (
                '–'
              ),
            hint: t('The person with the most usage on this model, and their share of it.'),
            calc: 'model-top-user',
          },
        ]
      : [];
    return [...lead, ...tokens, ...tail, ...topUser];
  }, [hasTokens, hasTopUser, selectUser]);

  return (
    <Card
      title={t('All models')}
      subtitle={t('Click a row to filter the whole page by that model. Use Columns to show or hide details.')}
      calc="model-table"
      footer={
        <div className="space-y-1">
          {hasTokens ? null : (
            <p>
              {t(
                'This report has no token columns. The token counts and the cache hit rate are not shown, and the cheaper option shows dashes. They need input and output tokens for each request.',
              )}
            </p>
          )}
          <PriceSource />
        </div>
      }
    >
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultSort={{ key: 'gross', dir: 'desc' }}
        searchable
        searchPlaceholder={t('Search models…')}
        exportName="github-copilot-models"
        onRowClick={(r) => drill({ models: [r.value] }, { merge: true })}
        emptyText={t('No models match your search.')}
      />
    </Card>
  );
}
