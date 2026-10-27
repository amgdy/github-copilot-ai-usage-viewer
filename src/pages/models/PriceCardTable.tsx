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

const rateColumn = (key: string, header: string, pick: (e: CardEntry) => number, hint: string): Column<CardRow> => ({
  key,
  header,
  align: 'end',
  value: (r) => (pick(r.entry) > 0 ? pick(r.entry) : null),
  render: (r) => fmtRate(pick(r.entry) > 0 ? pick(r.entry) : Number.NaN),
  hint,
  calc: 'model-list-price',
});

/** The card's notes are English keys marked with msg(); "Promotional price until …" shows as a short badge. */
const noteBadge = (note: string): string => (note.startsWith('Promotional') ? t('Promo price') : t(note));

const buildColumns = (): Column<CardRow>[] => [
  {
    key: 'model',
    header: t('Model'),
    value: (r) => r.entry.name,
    render: (r) => (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <VendorName vendor={r.entry.vendor} className="font-medium">
          {r.entry.name}
        </VendorName>
        {r.usage > 0 ? (
          <Badge tone="accent" title={t('This model has usage in the current view.')}>
            {t('In use')}
          </Badge>
        ) : null}
        {r.entry.note ? (
          <Badge tone="info" title={t(r.entry.note)}>
            {noteBadge(r.entry.note)}
          </Badge>
        ) : null}
      </span>
    ),
  },
  {
    key: 'vendor',
    header: t('Vendor'),
    value: (r) => vendorLabel(r.entry.vendor),
    render: (r) => <VendorName vendor={r.entry.vendor} className="whitespace-nowrap" />,
    calc: 'model-vendor',
  },
  {
    key: 'tier',
    header: t('Tier'),
    value: (r) => tierLabel(r.entry.category),
    render: (r) => <TierBadge tier={r.entry.category} />,
    calc: 'model-tier',
  },
  rateColumn('input', t('Input / 1M'), (e) => e.base.input, t('Price per 1 million input tokens on the price card.')),
  rateColumn(
    'cached',
    t('Cache read / 1M'),
    (e) => e.base.cachedInput,
    t('Price per 1 million cache read tokens on the price card. Cache read tokens are text the model has seen before and reads again at a lower price.'),
  ),
  rateColumn(
    'write',
    t('Cache write / 1M'),
    (e) => e.base.cacheWrite,
    t('Price per 1 million cache write tokens on the price card. Cache write tokens are text saved to the cache for later requests. A dash means no separate charge.'),
  ),
  rateColumn('output', t('Output / 1M'), (e) => e.base.output, t('Price per 1 million output tokens on the price card.')),
  {
    key: 'long',
    header: t('Long prompts'),
    value: (r) => r.entry.longThreshold ?? null,
    render: (r) =>
      r.entry.long && r.entry.longThreshold ? (
        <span className="whitespace-nowrap">
          <T
            text="Above {threshold}: {input} in, {output} out"
            values={{
              threshold: thresholdLabel(r.entry.longThreshold),
              input: <span className="num">{fmtRate(r.entry.long.input)}</span>,
              output: <span className="num">{fmtRate(r.entry.long.output)}</span>,
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
    value: (r) => r.usage,
    render: (r) => (r.usage > 0 ? fmtUSD(r.usage) : <span className="text-fg-subtle">{fmtUSD(0)}</span>),
    hint: t('Usage on this model in the current view, as charged in the report.'),
    calc: 'usage',
    total: (rs) => fmtUSD(rs.reduce((a, r) => a + r.usage, 0)),
  },
];

export function PriceCardTable({ rows }: { rows: ModelRow[] }) {
  const [view, setView] = useState<View>('all');
  const hasUsage = rows.length > 0;

  const all = useMemo(() => {
    const usage = new Map<string, number>();
    for (const r of rows) {
      const hit = lookupCard(r.value);
      if (hit) usage.set(hit.name, (usage.get(hit.name) ?? 0) + r.gross);
    }
    return PRICE_CARD.map((entry): CardRow => ({ entry, usage: usage.get(entry.name) ?? 0 }));
  }, [rows]);

  const shown = useMemo(() => (view === 'used' ? all.filter((r) => r.usage > 0) : all), [all, view]);
  const columns = useMemo(() => {
    const cols = buildColumns();
    return hasUsage ? cols : cols.filter((c) => c.key !== 'usage');
  }, [hasUsage]);
  const views = VIEWS.map((v) => ({ value: v.value, label: t(v.label) }));

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
        rowKey={(r) => r.entry.name}
        defaultSort={hasUsage ? { key: 'usage', dir: 'desc' } : undefined}
        pageSize={10}
        searchable
        searchPlaceholder={t('Search the price card…')}
        exportName="github-copilot-price-card"
        fixedColumns
        rowClassName={(r) => (r.usage > 0 ? 'bg-accent-soft/40' : undefined)}
        emptyText={view === 'used' ? t('None of the models in your data are on the price card.') : t('No models match your search.')}
        toolbar={hasUsage ? <Segmented size="sm" label={t('Models to show')} value={view} onChange={setView} options={views} /> : undefined}
      />
    </Card>
  );
}
