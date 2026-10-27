import { Kpi, KpiGrid } from '../../components/ui';
import { t, T, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import type { DimSpec } from './dimensions';
import type { Summary } from './groups';

export function KpiRow({ spec, summary }: { spec: DimSpec; summary: Summary }) {
  const { analysis } = useAnalysis();
  const totals = analysis.agg.totals;
  const billing = analysis.coverage.billing;
  const { named, blank, largest, top3Share, billedLeader } = summary;
  const groupCount = named.length;
  const blankShare = blank?.share ?? 0;

  return (
    <KpiGrid>
      <Kpi
        label={t('Usage')}
        value={fmtUSD(totals.gross)}
        sub={t('{n} AI credits', { n: fmtInt(totals.credits) })}
        hint={t(
          'Value of all AI credits used in this view (1 credit = $0.01), including usage already paid for by included credits. The shares on this page are shares of this amount.',
        )}
        calc={['usage', 'ai-credit']}
      />
      <Kpi
        label={t(spec.plural)}
        value={fmtInt(groupCount)}
        sub={tp(groupCount, 'One group with usage', '{n} groups with usage')}
        hint={t('Distinct groups in this view. Usage without a value is not counted here, see Unattributed usage.')}
        calc="org-group-count"
      />
      <Kpi
        label={t('Largest group')}
        value={largest ? <span title={largest.name}>{largest.name}</span> : '–'}
        sub={largest ? t('{pct} of usage · {usd}', { pct: fmtPct(largest.share, 0), usd: fmtUSD(largest.gross, 0) }) : t('No group has a value')}
        hint={t('The group with the most usage. Usage without a value is not considered.')}
        calc="org-largest-group"
      />
      <Kpi
        label={t('Top 3 share')}
        value={groupCount ? fmtPct(top3Share, 0) : '–'}
        sub={groupCount > 3 ? t('The 3 largest of {n}', { n: fmtInt(groupCount) }) : groupCount ? tp(groupCount, 'Only one group', 'Only {n} groups') : undefined}
        hint={t('Share of all usage that comes from the three largest groups. A high share means a few groups decide the bill.')}
        calc="org-top3-share"
      />
      <Kpi
        label={t('Unattributed usage')}
        value={fmtUSD(blank?.gross ?? 0)}
        tone={blankShare >= 0.2 ? 'warn' : 'neutral'}
        sub={blank ? t('{pct} of usage', { pct: fmtPct(blankShare, 0) }) : t('Every row has a group')}
        hint={t(spec.blankHint)}
        calc="org-unattributed"
      />
      <Kpi
        label={t('Billed on top of seats')}
        value={billing ? fmtUSD(totals.net) : '–'}
        tone={!billing ? 'neutral' : totals.net > 0.005 ? 'warn' : 'good'}
        sub={
          !billing ? (
            t('Not in this file')
          ) : billedLeader ? (
            <T
              text="{name} carries {pct} of it"
              values={{
                name: <span className="break-all">{billedLeader.name}</span>,
                pct: fmtPct(totals.net > 0 ? billedLeader.net / totals.net : 0, 0),
              }}
            />
          ) : (
            t('Nothing billed beyond the included credits')
          )
        }
        hint={t(
          'Usage in this view that went beyond the pooled included credits. The group named below it carries the largest part, as the report assigns it.',
        )}
        calc={['billed', 'org-billed-leader']}
      />
    </KpiGrid>
  );
}
