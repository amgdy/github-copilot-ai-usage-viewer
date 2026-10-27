import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { useChartColors } from '../../components/charts/EChart';
import { rankBarOption } from '../../components/charts/helpers';
import { Card, EmptyState, TaxBadge, taxLookup } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { BLANK_ID } from '../../lib/analytics/prepare';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { dimLabel, topIds } from '../shared';
import { ChartPanel } from './ChartPanel';

const TITLE = msg('Who generates the overage');
const SUBTITLE = msg('Users with the most usage billed on top of seats. Click a bar to open the user.');

export function OverageUsers() {
  const { analysis, store, taxonomy, settings } = useAnalysis();
  const colors = useChartColors();
  const { agg, users, population, narrowed, coverage } = analysis;
  const personas = useMemo(() => taxLookup(taxonomy.personas), [taxonomy]);
  const net = agg.user.net;
  const ids = useMemo(() => topIds(net, Math.max(3, settings.topN), { min: 0.005 }), [net, settings.topN]);

  const stats = useMemo(() => {
    let people = 0;
    for (let id = 0; id < net.length; id++) if (id !== BLANK_ID && net[id] > 0.005) people++;
    const top3 = topIds(net, 3, { min: 0.005, include: (id) => id !== BLANK_ID }).reduce((a, id) => a + net[id], 0);
    return { people, top3, unattributed: net[BLANK_ID] ?? 0 };
  }, [net]);

  const rows = useMemo(
    () =>
      ids.map((id) => {
        const profile = id === BLANK_ID ? undefined : (users.byId.get(id) ?? population.byId.get(id));
        return { id, name: dimLabel(store, 'user', id), billed: net[id], gross: agg.user.gross[id], covered: agg.user.discount[id], profile, persona: profile ? personas[profile.persona] : undefined };
      }),
    [ids, store, net, agg, users, population, personas],
  );

  const option = useMemo(
    () =>
      rankBarOption(colors, {
        labelWidth: 150,
        color: colors.warn,
        items: rows.map((r) => {
          const parts = [r.persona?.label, t('Usage {amount}', { amount: fmtUSD(r.gross) }), t('Covered {amount}', { amount: fmtUSD(r.covered) })];
          if (r.id === BLANK_ID) parts.unshift(t('Repo-level products with no user. Click to show only these rows'));
          else if (r.profile && !narrowed && r.profile.quotaCredits > 0) {
            parts.push(
              r.profile.balance < -0.005
                ? t('Used {amount} more than the credits in their seat', { amount: fmtUSD(-r.profile.balance, 0) })
                : t('Stayed within the credits in their seat'),
            );
          }
          return { name: r.name, value: r.billed, color: r.id === BLANK_ID ? colors.muted : r.persona?.color, note: parts.filter(Boolean).join(' · ') };
        }),
      }),
    [colors, rows, narrowed],
  );

  if (!coverage.billing) {
    return (
      <Card title={t(TITLE)} subtitle={t(SUBTITLE)} calc="overage-users">
        <EmptyState
          icon={<Info size={24} className="text-fg-muted" />}
          title={t('The file does not say what was billed')}
          description={t(
            'It has no discount_amount or net_amount column, so the report cannot tell which usage was billed on top of seats. Load the complete usage report to see who generates the overage.',
          )}
        />
      </Card>
    );
  }

  if (agg.totals.net <= 0.005) {
    return (
      <Card title={t(TITLE)} subtitle={t(SUBTITLE)} calc="overage-users">
        <EmptyState
          icon={<CheckCircle2 size={24} className="text-good" />}
          title={t('Nothing was billed on top of seats')}
          description={t('Included credits covered all usage in this period, so there is no overage to trace back to people.')}
        />
      </Card>
    );
  }

  const legend = [...new Map(rows.filter((r) => r.persona).map((r) => [r.persona!.id, r.persona!])).values()];
  const summary =
    stats.people === 0
      ? null
      : stats.people > 3
        ? tp(stats.people, '{n} user had usage billed on top of seats. The top 3 account for {share} of the billed amount.', '{n} users had usage billed on top of seats. The top 3 account for {share} of the billed amount.', {
            n: fmtInt(stats.people),
            share: fmtPct(stats.top3 / agg.totals.net, 0),
          })
        : tp(stats.people, '{n} user had usage billed on top of seats.', '{n} users had usage billed on top of seats.', { n: fmtInt(stats.people) });

  return (
    <ChartPanel
      title={t(TITLE)}
      calc="overage-users"
      subtitle={t(SUBTITLE)}
      option={option}
      height={Math.max(140, rows.length * 26 + 16)}
      onClick={(p) => {
        const r = rows[p.dataIndex];
        if (!r) return;
        if (r.id === BLANK_ID) drill({ attribution: 'unattributed' }, { merge: true });
        else useApp.getState().selectUser(r.id);
      }}
      exportName="github-copilot-overage-users"
      label={t('Users ranked by usage billed on top of seats')}
      below={
        <div className="space-y-1.5 text-xs text-fg-muted">
          {summary ? <p>{summary}</p> : null}
          {stats.unattributed > 0.005 ? <p>{t('{amount} was billed for repo-level products that have no user.', { amount: fmtUSD(stats.unattributed) })}</p> : null}
          {legend.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {legend.map((item) => (
                <TaxBadge key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      }
      footer={
        <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => drill({ billing: 'billed' }, { page: 'users', merge: true })}>
          {t('Show only billed rows')} <ArrowRight size={12} className="rtl:-scale-x-100" />
        </button>
      }
    />
  );
}
