import { useMemo, useState } from 'react';
import { ListFilter } from 'lucide-react';
import { Card, DataTable, Segmented, cx, type CalcRef, type Column, type SegmentedOption } from '../../components/ui';
import { msg, t } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { usePerMonth } from '../shared';
import { GroupName, NO_BILLING_NOTE, NO_TOKENS_NOTE, ShareCell, filterToGroup, fmtTokens, signedPct } from './bits';
import type { DimSpec } from './dimensions';
import { cacheHitRate, perUserMonth, totalTokens, trendChange, type Group, type TokenCounts } from './groups';

const DASH = <span className="text-fg-subtle">–</span>;

type View = 'usage' | 'tokens';

const VIEWS: { value: View; label: string; title: string }[] = [
  { value: 'usage', label: msg('Usage'), title: msg('Usage, billed amounts, users and trend') },
  { value: 'tokens', label: msg('Tokens'), title: msg('Input, cache read, cache write and output tokens') },
];

/** Columns that need the billing split of the file. */
const BILLING_COLUMNS = new Set(['billed', 'covered', 'billedShare']);

function Trend({ g, reliable }: { g: Group; reliable: boolean }) {
  if (!reliable) return DASH;
  const change = trendChange(g);
  if (change === null) return g.recent > 0 ? <span className="text-fg-muted">{t('new')}</span> : DASH;
  return <span className={cx(change > 0.25 && 'text-warn')}>{signedPct(change)}</span>;
}

/** Every group with its usage, bill, users and trend. A click on a row selects the group; the Filter button narrows the report. */
export function GroupTable({
  spec,
  groups,
  reliable,
  selected,
  onSelect,
}: {
  spec: DimSpec;
  groups: Group[];
  /** The period has two full weeks, so the trend can be shown. */
  reliable: boolean;
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  const { analysis } = useAnalysis();
  const perMonth = usePerMonth();
  const totals = analysis.agg.totals;
  const { billing, tokens } = analysis.coverage;
  const [picked, setPicked] = useState<View>('usage');
  const view: View = tokens ? picked : 'usage';

  const columns = useMemo<Column<Group>[]>(() => {
    const maxShare = groups.reduce((m, g) => Math.max(m, g.share), 0);
    const sum = (rows: Group[], f: (g: Group) => number) => rows.reduce((a, g) => a + f(g), 0);
    const everything = (rows: Group[]) => rows.length === groups.length;
    const sumTokens = (rows: Group[]): TokenCounts => ({
      input: sum(rows, (g) => g.input),
      cacheRead: sum(rows, (g) => g.cacheRead),
      cacheWrite: sum(rows, (g) => g.cacheWrite),
      output: sum(rows, (g) => g.output),
    });

    const group: Column<Group> = {
      key: 'group',
      header: t(spec.label),
      value: (g) => g.name,
      render: (g) => <GroupName name={g.name} blank={g.blank} />,
      total: (rows) => (everything(rows) ? t('Total') : t('Total of {n} matching', { n: fmtInt(rows.length) })),
    };
    const usage: Column<Group> = {
      key: 'usage',
      header: t('Usage'),
      hint: t('Value of all AI credits used (1 credit = $0.01), including usage covered by included credits'),
      calc: 'usage',
      align: 'end',
      value: (g) => g.gross,
      render: (g) => fmtUSD(g.gross),
      total: (rows) => fmtUSD(sum(rows, (g) => g.gross)),
    };
    const filter: Column<Group> = {
      key: 'filter',
      header: <span className="sr-only">{t('Filter')}</span>,
      csvHeader: t('Filter'),
      noCsv: true,
      sortable: false,
      align: 'end',
      value: () => null,
      render: (g) => (
        <button
          type="button"
          className="btn btn-sm"
          title={t('Filter the whole report to {name}', { name: g.name })}
          onClick={(e) => {
            e.stopPropagation();
            filterToGroup(g);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ListFilter size={12} /> {t('Filter')}
        </button>
      ),
    };
    const tokenColumn = (base: { key: string; header: string; hint: string; calc: CalcRef }, pick: (tk: TokenCounts) => number): Column<Group> => ({
      ...base,
      align: 'end',
      value: (g) => pick(g),
      render: (g) => fmtTokens(pick(g)),
      total: (rows) => fmtTokens(sum(rows, pick)),
    });
    const hitRate = (tk: TokenCounts) => {
      const v = cacheHitRate(tk);
      return Number.isFinite(v) ? v : null;
    };

    if (view === 'tokens') {
      return [
        group,
        usage,
        tokenColumn(
          { key: 'input', header: t('Input tokens'), hint: t('Tokens of fresh text sent to the model, not read from the cache'), calc: 'tokens-input' },
          (tk) => tk.input,
        ),
        tokenColumn(
          {
            key: 'cacheRead',
            header: t('Cache read tokens'),
            hint: t('Tokens served from the model cache, which are priced lower than fresh input'),
            calc: 'tokens-cache-read',
          },
          (tk) => tk.cacheRead,
        ),
        tokenColumn(
          {
            key: 'cacheWrite',
            header: t('Cache write tokens'),
            hint: t('Tokens written to the model cache so that later requests can reuse them'),
            calc: 'tokens-cache-write',
          },
          (tk) => tk.cacheWrite,
        ),
        tokenColumn({ key: 'output', header: t('Output tokens'), hint: t('Tokens the model wrote back'), calc: 'tokens-output' }, (tk) => tk.output),
        tokenColumn(
          { key: 'totalTokens', header: t('Total tokens'), hint: t('Input, cache read, cache write and output tokens together'), calc: 'tokens-total' },
          totalTokens,
        ),
        {
          key: 'cacheHit',
          header: t('Cache hit rate'),
          hint: t('Cache read tokens as a share of all prompt tokens (input, cache read and cache write)'),
          calc: 'cache-hit',
          align: 'end',
          value: (g) => hitRate(g),
          render: (g) => {
            const v = hitRate(g);
            return v === null ? DASH : fmtPct(v, 1);
          },
          total: (rows) => {
            const v = hitRate(sumTokens(rows));
            return v === null ? DASH : fmtPct(v, 1);
          },
        },
        filter,
      ];
    }

    const usageView: Column<Group>[] = [
      group,
      usage,
      {
        key: 'share',
        header: t('Share'),
        hint: t('Share of all usage in this view'),
        calc: 'org-share',
        align: 'end',
        value: (g) => g.share,
        render: (g) => <ShareCell frac={g.share} max={maxShare} text={fmtPct(g.share, 1)} />,
        total: (rows) => fmtPct(sum(rows, (g) => g.share), 1),
      },
      {
        key: 'billed',
        header: t('Billed'),
        hint: t('Billed on top of seats, as the report assigns it to this group'),
        calc: 'billed',
        align: 'end',
        value: (g) => g.net,
        render: (g) => fmtUSD(g.net),
        total: (rows) => fmtUSD(sum(rows, (g) => g.net)),
      },
      {
        key: 'covered',
        header: t('Covered'),
        hint: t('Usage covered by included credits'),
        calc: 'covered',
        align: 'end',
        value: (g) => g.discount,
        render: (g) => fmtUSD(g.discount),
        total: (rows) => fmtUSD(sum(rows, (g) => g.discount)),
      },
      {
        key: 'users',
        header: t('Users'),
        hint: t('People with usage in the group. A person who appears in several groups is counted in each of them.'),
        calc: 'org-users',
        align: 'end',
        hidden: !groups.some((g) => g.users > 0),
        value: (g) => g.users,
        render: (g) => fmtInt(g.users),
        total: (rows) => (everything(rows) ? fmtInt(totals.users) : DASH),
      },
      {
        key: 'perUser',
        header: t('Usage per user / month'),
        hint: t('Usage divided by users, in a 30.4-day month'),
        calc: 'org-per-user-month',
        align: 'end',
        value: (g) => {
          const v = perUserMonth(g, perMonth);
          return Number.isFinite(v) ? v : null;
        },
        render: (g) => {
          const v = perUserMonth(g, perMonth);
          return Number.isFinite(v) ? fmtUSD(v) : DASH;
        },
        total: (rows) => (everything(rows) && totals.users > 0 ? fmtUSD((totals.gross * perMonth) / totals.users) : DASH),
      },
      {
        key: 'trend',
        header: t('Trend'),
        hint: t('Usage of the last 7 days of the period against the 7 days before. It needs a period of at least 14 days.'),
        calc: 'org-trend',
        align: 'end',
        value: (g) => (reliable ? trendChange(g) : null),
        render: (g) => <Trend g={g} reliable={reliable} />,
      },
      {
        key: 'billedShare',
        header: t('Billed share'),
        hint: t('Part of the group’s own usage that is billed on top of seats'),
        calc: 'org-billed-share',
        align: 'end',
        hidden: true,
        value: (g) => (g.gross > 0 ? g.net / g.gross : null),
        render: (g) => (g.gross > 0 ? fmtPct(g.net / g.gross, 1) : DASH),
      },
      filter,
    ];
    return usageView.filter((c) => billing || !BILLING_COLUMNS.has(c.key));
  }, [spec, groups, reliable, perMonth, totals, view, billing]);

  const noTokenCounts = view === 'tokens' && groups.every((g) => totalTokens(g) === 0);
  const notes = [
    !tokens ? t(NO_TOKENS_NOTE) : null,
    noTokenCounts ? t('The rows in this view have no token counts, so every token column is 0.') : null,
    !billing ? t(NO_BILLING_NOTE) : null,
  ].filter((n): n is string => n !== null);
  const viewOptions: SegmentedOption<View>[] = VIEWS.map((o) => ({ value: o.value, label: t(o.label), title: t(o.title) }));

  return (
    <Card
      title={t(spec.all)}
      subtitle={t('Click a row to see what the group is made of. The Filter button narrows the whole report to it.')}
      calc={[spec.id === 'team' ? 'org-team-groups' : 'org-groups', ...(view === 'tokens' ? ['org-group-tokens'] : [])]}
      actions={tokens ? <Segmented size="sm" label={t('Columns shown')} value={view} onChange={setPicked} options={viewOptions} /> : undefined}
      footer={notes.length ? notes.map((n) => <p key={n}>{n}</p>) : undefined}
    >
      <DataTable
        key={view}
        rows={groups}
        columns={columns}
        rowKey={(g) => g.id}
        defaultSort={{ key: 'usage', dir: 'desc' }}
        pageSize={25}
        searchable
        searchPlaceholder={t('Search groups…')}
        exportName={`github-copilot-organization-${spec.id}${view === 'tokens' ? '-tokens' : ''}`}
        selectedKey={selected}
        onRowClick={(g) => onSelect(g.id === selected ? null : g.id)}
        emptyText={t('No groups match.')}
      />
    </Card>
  );
}
