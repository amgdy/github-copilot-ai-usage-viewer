import { useMemo, type ReactNode } from 'react';
import { VendorIcon } from '../../components/icons';
import { CalcInfo, Callout, Card, DataTable, DocLinks, type Column } from '../../components/ui';
import { t } from '../../i18n';
import { DEFAULT_LEVERS, type ShiftRow } from '../../lib/analytics/levers';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { inferVendor, lookupCard } from '../../lib/pricing/models';
import { labelOf } from '../../lib/types';
import { fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { usePerMonth } from '../shared';
import { monthlyCash, type ModelRow } from './data';
import { FooterLink, PriceSource, Stat, TierBadge, VendorName } from './parts';

const SHIFT = DEFAULT_LEVERS.modelShift;

function GuideBox({ tier, title, children }: { tier: 'Powerful' | 'Versatile'; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border-muted bg-surface-2 p-3" style={{ borderInlineStart: `3px solid ${CATEGORY_COLORS[tier]}` }}>
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-0.5 text-xs text-fg-muted">{children}</p>
    </div>
  );
}

function CashNote({ cash, narrowed }: { cash: number | null; narrowed: boolean }) {
  const info = <CalcInfo id="model-right-sizing-bill" />;
  if (narrowed || cash === null) {
    return (
      <Callout tone="info" title={t('These figures show less usage, not cash')} action={info}>
        {t(
          'Included credits are shared across the organization, so this view cannot say what the bill would do. Open the Recommendations simulator for cash figures.',
        )}
      </Callout>
    );
  }
  if (cash >= 1) {
    return (
      <Callout tone="good" title={t('About {amount} less on the bill each month', { amount: fmtUSD(cash, 0) })} action={info}>
        {t(
          'That is for a {pct} shift, using the same rules for included credits as the Recommendations simulator. Test the cheaper models on real work first.',
          { pct: fmtPct(SHIFT, 0) },
        )}
      </Callout>
    );
  }
  return (
    <Callout tone="info" title={t('Less usage, but no change to the bill today')} action={info}>
      {cash > 0 ? t('Under $1 a month would come off the bill.') : t('Included credits already cover all usage.')}{' '}
      {t(
        'Moving work to cheaper models would use fewer credits and leave more room before overage. The Recommendations simulator shows when that turns into cash.',
      )}
    </Callout>
  );
}

export function RightSizing({ rows, shift }: { rows: ModelRow[]; shift: ShiftRow[] }) {
  const { analysis, store } = useAnalysis();
  const perMonth = usePerMonth();

  const stats = useMemo(() => {
    const list = shift.filter((r) => r.ratio < 1);
    const full = list.reduce((a, r) => a + r.savingsAtFull, 0);
    const covered = new Set(list.map((r) => r.modelId));
    const powerful = rows.filter((r) => r.tier === 'Powerful');
    return {
      list,
      full,
      part: full * SHIFT,
      powerful: powerful.length,
      powerfulGross: powerful.reduce((a, r) => a + r.gross, 0),
      uncovered: powerful.filter((r) => !covered.has(r.id)),
    };
  }, [shift, rows]);

  // The pool model projects the last partial month, so cap the bill effect at the usage that is saved.
  const cash = useMemo(() => {
    const c = monthlyCash(analysis, stats.part);
    return c === null ? null : Math.min(c, stats.part * perMonth);
  }, [analysis, stats.part, perMonth]);

  const vendorById = useMemo(() => new Map(rows.map((r) => [r.id, r.vendor])), [rows]);

  const columns = useMemo<Column<ShiftRow>[]>(
    () => [
      {
        key: 'model',
        header: t('Powerful model'),
        value: (r) => labelOf('model', r.model),
        render: (r) => (
          <VendorName vendor={vendorById.get(r.modelId) ?? inferVendor(r.model)} className="font-medium whitespace-nowrap">
            {labelOf('model', r.model)}
          </VendorName>
        ),
      },
      {
        key: 'target',
        header: t('Cheaper option'),
        value: (r) => r.target,
        render: (r) => {
          const hit = lookupCard(r.target);
          return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <VendorIcon vendor={hit?.vendor ?? inferVendor(r.target)} size={13} className="shrink-0 text-fg-muted" />
              {r.target}
              {hit ? <TierBadge tier={hit.category} /> : null}
            </span>
          );
        },
        hint: t('The mid-tier model from the same vendor that the simulator uses as the default target.'),
        calc: 'model-cheaper-option',
      },
      {
        key: 'usage',
        header: t('Usage per month'),
        align: 'end',
        value: (r) => r.gross * perMonth,
        render: (r) => fmtUSD(r.gross * perMonth),
        hint: t('Average monthly usage of this model, as charged in the report.'),
        calc: ['usage', 'per-month'],
        total: (rs) => fmtUSD(rs.reduce((a, r) => a + r.gross, 0) * perMonth),
      },
      {
        key: 'ratio',
        header: t('Cost on cheaper option'),
        align: 'end',
        value: (r) => r.ratio,
        render: (r) => fmtPct(r.ratio, 0),
        hint: t("Cost of the same tokens on the cheaper option, as a share of today's cost. 40% means 60% less."),
        calc: 'model-cheaper-cost',
      },
      {
        key: 'full',
        header: t('Less usage if all moved'),
        align: 'end',
        value: (r) => r.savingsAtFull * perMonth,
        render: (r) => fmtUSD(r.savingsAtFull * perMonth),
        hint: t('Per month, if every request on this model moved to the cheaper option. An upper bound.'),
        calc: 'model-less-usage-all',
        total: (rs) => fmtUSD(rs.reduce((a, r) => a + r.savingsAtFull, 0) * perMonth),
      },
      {
        key: 'part',
        header: t('Less usage at {pct} moved', { pct: fmtPct(SHIFT, 0) }),
        align: 'end',
        value: (r) => r.savingsAtFull * SHIFT * perMonth,
        render: (r) => fmtUSD(r.savingsAtFull * SHIFT * perMonth),
        hint: t('Per month, if {pct} of the requests moved. This is the default planning share in the simulator.', { pct: fmtPct(SHIFT, 0) }),
        calc: 'model-less-usage-part',
        total: (rs) => fmtUSD(rs.reduce((a, r) => a + r.savingsAtFull, 0) * SHIFT * perMonth),
      },
    ],
    [perMonth, vendorById],
  );

  const empty =
    stats.powerful === 0
      ? t('No Powerful models are used in this scope, so there is nothing to right-size.')
      : !store.hasTokens
        ? t('This report has no token columns, so a fair cost comparison with cheaper models is not possible.')
        : t('No Powerful model has a cheaper option with a price on the price card.');

  return (
    <Card
      title={t('Right-sizing opportunities')}
      subtitle={t('Where a mid-tier model could do the job of a Powerful one. Costs compare the same tokens at prices from the price card.')}
      calc={['model-cheaper-option', 'model-less-usage-all', 'model-less-usage-part']}
      footer={
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span>{t('Test cheaper models on real tasks before you change team defaults. Quality, not price, should decide.')}</span>
            <FooterLink to="recommendations">{t('Open the Recommendations simulator')}</FooterLink>
          </div>
          <PriceSource />
          <DocLinks topic="modelChoice" title={t('Learn more')} limit={3} compact />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <GuideBox tier="Powerful" title={t('Keep Powerful models for hard work')}>
            {t('Multi-step tasks, large refactors and tricky bugs are where the extra cost pays off.')}
          </GuideBox>
          <GuideBox tier="Versatile" title={t('Send routine work to a mid-tier model or Auto')}>
            {t('Small edits, explanations and tests rarely need the most expensive model. Auto picks a suitable one for you.')}
          </GuideBox>
        </div>

        {stats.list.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat
                label={t('Powerful usage per month')}
                value={fmtUSD(stats.powerfulGross * perMonth, 0)}
                sub={t('On {models}', { models: pluralize(stats.powerful, 'Powerful model') })}
                calc={['tier-usage', 'per-month']}
              />
              <Stat
                label={t('Less usage if all of it moved')}
                value={fmtUSD(stats.full * perMonth, 0)}
                sub={t('Per month. An upper bound, since hard work stays where it is.')}
                calc="model-less-usage-all"
              />
              <Stat
                label={t('Less usage at {pct} moved', { pct: fmtPct(SHIFT, 0) })}
                value={fmtUSD(stats.part * perMonth, 0)}
                sub={t('Per month. The default planning share.')}
                calc="model-less-usage-part"
              />
            </div>
            <CashNote cash={cash} narrowed={analysis.narrowed} />
            <DataTable
              rows={stats.list}
              columns={columns}
              rowKey={(r) => r.modelId}
              defaultSort={{ key: 'full', dir: 'desc' }}
              pageSize={10}
              dense
              fixedColumns
              exportName="github-copilot-right-sizing"
              onRowClick={(r) => drill({ models: [r.model] }, { merge: true })}
            />
          </>
        ) : (
          <Callout tone={stats.powerful === 0 ? 'good' : 'info'}>{empty}</Callout>
        )}

        {stats.uncovered.length > 0 && stats.list.length > 0 ? (
          <p className="text-xs text-fg-muted">
            {t(
              '{models} with no cheaper option: {names}. The mid-tier default is not cheaper for them, or their price or token data is missing.',
              {
                models: pluralize(stats.uncovered.length, 'Powerful model', 'Powerful models'),
                names: stats.uncovered.map((r) => r.label).join(', '),
              },
            )}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
