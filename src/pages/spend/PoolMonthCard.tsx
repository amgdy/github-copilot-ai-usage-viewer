import { useMemo, type ReactNode } from 'react';
import { useChartColors } from '../../components/charts/EChart';
import { Callout, Card, EmptyState, Segmented, Select } from '../../components/ui';
import { msg, t } from '../../i18n';
import { fmtDay } from '../../lib/utils/date';
import { fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { navigate } from '../../state/router';
import { clearNarrowing } from '../shared';
import { ChartPanel } from './ChartPanel';
import { monthFacts } from './facts';
import { dailyCurves, poolColumnsText, poolGap, projectionPath, type MonthRow } from './helpers';
import { poolMonthOption } from './options';

const TITLE = msg('Included credits, month by month');

function SettingsButton() {
  return (
    <button type="button" className="btn btn-sm" onClick={() => navigate('settings')}>
      {t('Open Settings')}
    </button>
  );
}

interface PoolMonthCardProps {
  rows: MonthRow[];
  selected: string | null;
  onSelect: (key: string) => void;
}

export function PoolMonthCard({ rows, selected, onSelect }: PoolMonthCardProps) {
  const { analysis } = useAnalysis();
  const colors = useChartColors();
  const { narrowed, range, pool, coverage } = analysis;
  const billing = coverage.billing;
  const selectedRow = rows.find((row) => row.m.key === selected) ?? rows[rows.length - 1] ?? null;
  const month = selectedRow?.m ?? null;
  const curves = useMemo(() => (month ? dailyCurves(month, range) : null), [month, range]);
  const path = useMemo(() => (month ? projectionPath(month) : null), [month]);
  const lowerBound = pool.capacityIsLowerBound;
  const option = useMemo(() => {
    if (!selectedRow || !month || !curves) return null;
    const date = month.exhaustedOn !== null ? fmtDay(month.exhaustedOn) : '';
    return poolMonthOption(colors, {
      m: month,
      curves,
      path,
      capacity: selectedRow.known ? month.capacity : null,
      lowerBound,
      markBilling: !narrowed && month.exhaustedOn !== null,
      billingLabel: selectedRow.known ? t('Ran out {date}', { date }) : t('Billing began {date}', { date }),
      billing,
    });
  }, [colors, selectedRow, month, curves, path, lowerBound, narrowed, billing]);

  if (!selectedRow || !month || !option) {
    return (
      <Card title={t(TITLE)} calc="pool-month-chart">
        <EmptyState title={t('No billing month in the selected period')} />
      </Card>
    );
  }

  let notice: ReactNode = null;
  if (narrowed) {
    notice = (
      <Callout
        tone="info"
        title={t('Included credits are shared by everyone')}
        action={
          <button type="button" className="btn btn-sm" onClick={clearNarrowing}>
            {t('Clear filters')}
          </button>
        }
      >
        {t(
          'They cannot be split for a filtered view, so the pool size and the day it ran out are not shown. To see the pool, remove the row and segment filters. The date range can stay.',
        )}
      </Callout>
    );
  } else if (!selectedRow.known) {
    const gap = poolGap(billing, [month]);
    if (gap === 'billing') {
      notice = (
        <Callout tone="warn" title={t('Pool figures are not available')}>
          {poolColumnsText(coverage)}
        </Callout>
      );
    } else if (gap === 'sizes') {
      notice = (
        <Callout tone="info" title={t('The pool size is not known')} action={<SettingsButton />}>
          {t('The file does not say how many credits the seats include, so no pool line is drawn. Add your roster or extra seats in Settings to see it.')}
        </Callout>
      );
    } else {
      notice = (
        <Callout tone="warn" title={t('The pool is bigger than this file shows')} action={<SettingsButton />}>
          {t(
            'In {month}, included credits covered {covered}. That is more than the {capacity} that the seats in this file pay for. Other seats share the same pool, so the real size is unknown and no pool line is drawn.',
            { month: month.label, covered: fmtUSD(month.discount, 0), capacity: fmtUSD(month.capacity, 0) },
          )}
        </Callout>
      );
    }
  }

  const facts = monthFacts(selectedRow, narrowed, billing);
  const monthOptions = [...rows].reverse().map((row) => ({ value: row.m.key, label: row.m.label }));
  const controls =
    rows.length > 1 ? (
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>{t('Month')}</span>
        {rows.length <= 4 ? (
          <Segmented size="sm" label={t('Month')} value={month.key} onChange={onSelect} options={rows.map((row) => ({ value: row.m.key, label: row.m.label }))} />
        ) : (
          <Select aria-label={t('Month')} className="!py-0.5 text-xs" value={month.key} onChange={onSelect} options={monthOptions} order="given" />
        )}
      </div>
    ) : null;

  return (
    <ChartPanel
      title={t(TITLE)}
      calc="pool-month-chart"
      subtitle={
        selectedRow.known
          ? t('{month}: usage added up day by day, against the pool of included credits.', { month: month.label })
          : t('{month}: usage added up day by day.', { month: month.label })
      }
      controls={controls}
      notice={notice}
      option={option}
      height={320}
      exportName={`github-copilot-pool-${month.key}`}
      label={t('Usage added up day by day in {month}', { month: month.label })}
      below={
        <div className="space-y-2">
          <ul className="list-disc space-y-1 ps-5 text-sm marker:text-fg-subtle">
            {facts.lines.map((line, lineIndex) => (
              <li key={lineIndex}>{line}</li>
            ))}
          </ul>
          {facts.note ? <p className="text-xs text-fg-muted">{facts.note}</p> : null}
        </div>
      }
    />
  );
}
