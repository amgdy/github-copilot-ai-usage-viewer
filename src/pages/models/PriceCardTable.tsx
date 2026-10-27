import { useMemo, useState } from 'react';
import { Badge, Card, DataTable, DocLinks, Segmented, type Column } from '../../components/ui';
import { msg, t, T } from '../../i18n';
import { PRICE_CARD, type CardEntry } from '../../lib/pricing/card';
import { lookupCard } from '../../lib/pricing/models';
import { fmtUSD } from '../../lib/utils/format';
import type { ModelRow } from './data';
import { PriceSource, TierBadge, VendorName, fmtRate, tierLabel, vendorLabel } from './parts';

interface CardRow {
  entry: CardEntry;
  usage: number;
}

type View = 'all' | 'used';

const VIEWS: { value: View; label: string }[] = [
  { value: 'all', label: msg('All models') },
  { value: 'used', label: msg('In my data') },
];

const thresholdLabel = (tokens: number): string => `${Math.round(tokens / 1000)}K`;

const rateColumn = (key: string, header: string, pick: (entry: CardEntry) => number, hint: string): Column<CardRow> => ({
  key,
  header,
  align: 'end',
  value: (row) => (pick(row.entry) > 0 ? pick(row.entry) : null),
  render: (row) => fmtRate(pick(row.entry) > 0 ? pick(row.entry) : Number.NaN),
  hint,
  calc: 'model-list-price',
});

/** The card's notes are English keys marked with msg(); "Promotional price until …" shows as a short badge. */
const noteBadge = (note: string): string => (note.startsWith('Promotional') ? t('Promo price') : t(note));

const buildColumns = (): Column<CardRow>[] => [
  {
    key: 'model',
    header: t('Model'),
    value: (row) => row.entry.name,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <VendorName vendor={row.entry.vendor} className="font-medium">
          {row.entry.name}
        </VendorName>
        {row.usage > 0 ? (
          <Badge tone="accent" title={t('This model has usage in the current view.')}>
            {t('In use')}
          </Badge>
        ) : null}
        {row.entry.note ? (
          <Badge tone="info" title={t(row.entry.note)}>
            {noteBadge(row.entry.note)}
          </Badge>
        ) : null}
      </span>
    ),
  },
  {
    key: 'vendor',
    header: t('Vendor'),
    value: (row) => vendorLabel(row.entry.vendor),
    render: (row) => <VendorName vendor={row.entry.vendor} className="whitespace-nowrap" />,
    calc: 'model-vendor',
  },
  {
    key: 'tier',
    header: t('Tier'),
    value: (row) => tierLabel(row.entry.category),
    render: (row) => <TierBadge tier={row.entry.category} />,
    calc: 'model-tier',
  },
  rateColumn('input', t('Input / 1M'), (entry) => entry.base.input, t('Price per 1 million input tokens on the price card.')),
  rateColumn(
    'cached',
    t('Cache read / 1M'),
    (entry) => entry.base.cachedInput,
    t('Price per 1 million cache read tokens on the price card. Cache read tokens are text the model has seen before and reads again at a lower price.'),
  ),
  rateColumn(
    'write',
    t('Cache write / 1M'),
    (entry) => entry.base.cacheWrite,
    t('Price per 1 million cache write tokens on the price card. Cache write tokens are text saved to the cache for later requests. A dash means no separate charge.'),
  ),
  rateColumn('output', t('Output / 1M'), (entry) => entry.base.output, t('Price per 1 million output tokens on the price card.')),
  {
    key: 'long',
    header: t('Long prompts'),
    value: (row) => row.entry.longThreshold ?? null,
    render: (row) =>
      row.entry.long && row.entry.longThreshold ? (
        <span className="whitespace-nowrap">
          <T
            text="Above {threshold}: {input} in, {output} out"
            values={{
              threshold: thresholdLabel(row.entry.longThreshold),
              input: <span className="num">{fmtRate(row.entry.long.input)}</span>,
              output: <span className="num">{fmtRate(row.entry.long.output)}</span>,
            }}
          />
        </span>
      ) : (
        <span className="text-fg-subtle">–</span>
      ),
    hint: t('Some models charge higher prices when a single prompt is longer than a set number of tokens.'),
    calc: 'long-context-premium',
  },
  {
    key: 'usage',
    header: t('In your data'),
    align: 'end',
    value: (row) => row.usage,
    render: (row) => (row.usage > 0 ? fmtUSD(row.usage) : <span className="text-fg-subtle">{fmtUSD(0)}</span>),
    hint: t('Usage on this model in the current view, as charged in the report.'),
    calc: 'usage',
    total: (rows) => fmtUSD(rows.reduce((total, row) => total + row.usage, 0)),
  },
];

export function PriceCardTable({ rows }: { rows: ModelRow[] }) {
  const [view, setView] = useState<View>('all');
  const hasUsage = rows.length > 0;

  const all = useMemo(() => {
    const usage = new Map<string, number>();
    for (const model of rows) {
      const hit = lookupCard(model.value);
      if (hit) usage.set(hit.name, (usage.get(hit.name) ?? 0) + model.gross);
    }
    return PRICE_CARD.map((entry): CardRow => ({ entry, usage: usage.get(entry.name) ?? 0 }));
  }, [rows]);

  const shown = useMemo(() => (view === 'used' ? all.filter((row) => row.usage > 0) : all), [all, view]);
  const columns = useMemo(() => {
    const cols = buildColumns();
    return hasUsage ? cols : cols.filter((column) => column.key !== 'usage');
  }, [hasUsage]);
  const views = VIEWS.map((option) => ({ value: option.value, label: t(option.label) }));

  return (
    <Card
      title={t('Price card')}
      subtitle={
        hasUsage
          ? t('GitHub prices in US dollars per 1 million tokens. Models you use are highlighted.')
          : t('GitHub prices in US dollars per 1 million tokens.')
      }
      calc="model-list-price"
      footer={
        <div className="space-y-1.5">
          <PriceSource settings />
          <p>{t('Prices may change. Prices you change under Model pricing and tiers in Settings are not shown here.')}</p>
          <DocLinks topic="pricing" title={t('Learn more')} compact />
        </div>
      }
    >
      <DataTable
        rows={shown}
        columns={columns}
        rowKey={(row) => row.entry.name}
        defaultSort={hasUsage ? { key: 'usage', dir: 'desc' } : undefined}
        pageSize={10}
        searchable
        searchPlaceholder={t('Search the price card…')}
        exportName="github-copilot-price-card"
        fixedColumns
        rowClassName={(row) => (row.usage > 0 ? 'bg-accent-soft/40' : undefined)}
        emptyText={view === 'used' ? t('None of the models in your data are on the price card.') : t('No models match your search.')}
        toolbar={hasUsage ? <Segmented size="sm" label={t('Models to show')} value={view} onChange={setView} options={views} /> : undefined}
      />
    </Card>
  );
}
