import { Card, Kpi, KpiGrid, ProgressBar } from '../../components/ui';
import { t } from '../../i18n';
import type { LicenseReport } from '../../lib/licenses';
import { fmtInt, fmtPct } from '../../lib/utils/format';
import { kpiTiles, placeRows, planRows, statusRows, type ListId, type ShareRow, type StatusRow } from './model';

/** The KPI tiles. A tile with a list opens that list below. */
export function LicenseKpis({ report, onOpen }: { report: LicenseReport; onOpen: (id: ListId) => void }) {
  return (
    <KpiGrid>
      {kpiTiles(report).map((k) => {
        const list = k.list;
        return <Kpi key={k.id} label={k.label} value={k.value} sub={k.sub || undefined} calc={k.calc} tone={k.tone} onClick={list ? () => onOpen(list) : undefined} />;
      })}
    </KpiGrid>
  );
}

function ShareList({ rows }: { rows: readonly (ShareRow | StatusRow)[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={'status' in r ? r.status : r.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="num shrink-0 text-fg-muted">
              <span className="font-medium text-fg">{fmtInt(r.count)}</span> · {fmtPct(r.share, 0)}
            </span>
          </div>
          <ProgressBar value={r.share} tone={'tone' in r ? r.tone : 'accent'} label={r.label} />
        </li>
      ))}
    </ul>
  );
}

/** Seats by activity, by plan, and by where they are in the report. Each card adds up to all seats. */
export function LicenseBreakdowns({ report }: { report: LicenseReport }) {
  const status = statusRows(report);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      <Card title={t('Seats by activity')} subtitle={t('What the license list says about the last activity of each seat.')} calc="license-status-breakdown">
        {report.hasActivity && status.length > 0 ? <ShareList rows={status} /> : <p className="text-sm text-fg-muted">{t('The license list has no activity data, so every seat is shown as unknown.')}</p>}
      </Card>
      <Card title={t('Seats by plan')} subtitle={t('Business and Enterprise seats, and seats with another plan or no plan in the list.')} calc="license-seats">
        <ShareList rows={planRows(report)} />
      </Card>
      <Card title={t('Seats in the usage report')} subtitle={t('Whether each seat has usage in the date range and filters you see.')} calc={['license-matched', 'license-outside-scope', 'license-never-seen']}>
        <ShareList rows={placeRows(report)} />
      </Card>
    </div>
  );
}
