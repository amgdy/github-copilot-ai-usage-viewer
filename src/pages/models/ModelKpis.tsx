import { useMemo } from 'react';
import { VendorIcon } from '../../components/icons';
import { Kpi, KpiGrid } from '../../components/ui';
import { t } from '../../i18n';
import { rollupByVendor } from '../../lib/analytics/aggregate';
import { VENDORS } from '../../lib/pricing/card';
import { CATEGORIES } from '../../lib/types';
import { fmtInt, fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill, navigate } from '../../state/router';
import type { ModelRow } from './data';

/** KPI tiles in impact order: the numbers a manager can act on come first, the facts about the model mix after. */
export function ModelKpis({ rows }: { rows: ModelRow[] }) {
  const { analysis, store, models, settings } = useAnalysis();
  const totals = analysis.agg.totals;
  const gross = totals.gross;

  const stats = useMemo(() => {
    const byVendor = rollupByVendor(models, analysis.agg.model);
    const vendors = VENDORS.map((name, index) => ({ name, rows: byVendor.rows[index], gross: byVendor.gross[index] }))
      .filter((vendor) => vendor.rows > 0)
      .sort((a, b) => b.gross - a.gross);
    const unpriced = rows.filter((model) => !model.priced);
    return {
      vendors,
      known: vendors.filter((vendor) => vendor.name !== 'Other'),
      top: rows[0] ?? null,
      top3: rows.slice(0, 3).reduce((total, model) => total + model.gross, 0),
      powerfulGross: totals.tierGross[CATEGORIES.indexOf('Powerful')],
      powerfulModels: rows.filter((model) => model.tier === 'Powerful').length,
      unpricedModels: unpriced.length,
      unpricedGross: unpriced.reduce((total, model) => total + model.gross, 0),
    };
  }, [rows, models, analysis.agg.model, totals.tierGross]);

  const { vendors, known, top, powerfulGross, unpricedGross } = stats;
  const lead = known[0];
  const powerfulShare = gross > 0 ? powerfulGross / gross : 0;
  const autoShare = gross > 0 ? totals.autoGross / gross : 0;
  const unpricedShare = gross > 0 ? unpricedGross / gross : 0;
  const longShare = gross > 0 ? totals.longPremium / gross : 0;
  // Lines of priced models without token counts also land in `unpricedGross`; they are not a model problem.
  const noTokenGross = store.hasTokens ? Math.max(0, totals.unpricedGross - unpricedGross) : 0;

  return (
    <KpiGrid cols="grid-cols-2 md:grid-cols-4 2xl:grid-cols-7">
      <Kpi
        label={t('Powerful-tier share')}
        calc="model-powerful-share"
        value={fmtPct(powerfulShare, 0)}
        tone={powerfulShare >= settings.frontierHeavy ? 'warn' : 'neutral'}
        sub={
          stats.powerfulModels === 0
            ? t('No Powerful models in use')
            : t('{amount} on {models}', { amount: fmtUSD(powerfulGross, 0), models: pluralize(stats.powerfulModels, 'model') })
        }
        hint={t(
          'Share of usage on Powerful models, the most expensive tier. They suit hard tasks with many steps. Routine tasks rarely need them. Click to filter by this tier.',
        )}
        onClick={() => drill({ categories: ['Powerful'] }, { merge: true })}
      />
      <Kpi
        label={t('Auto share of usage')}
        calc="auto-share"
        value={fmtPct(autoShare, 0)}
        tone={gross > 0 && autoShare < settings.lowAuto ? 'warn' : 'neutral'}
        sub={t('{amount} through Auto', { amount: fmtUSD(totals.autoGross, 0) })}
        hint={t(
          'Share of usage where GitHub Copilot picked the model instead of the person. Auto usage gets the Auto discount where the plan has one. Turns amber below {pct}, the "Rarely uses Auto below" limit in Settings. Click to filter by Auto.',
          { pct: fmtPct(settings.lowAuto, 0) },
        )}
        onClick={() => drill({ selection: 'auto' }, { merge: true })}
      />
      <Kpi
        label={t('Long-context premium')}
        calc="long-context-premium"
        value={store.hasTokens ? fmtUSD(totals.longPremium) : '–'}
        tone={store.hasTokens && longShare >= settings.longContextShare ? 'warn' : 'neutral'}
        sub={
          !store.hasTokens
            ? t('Needs token columns')
            : totals.longPremiumRows > 0
              ? t('{requests} · {pct} of usage', { requests: pluralize(totals.longPremiumRows, 'long request'), pct: fmtPct(longShare, 1) })
              : t('No extra charges for long prompts found')
        }
        hint={t(
          'Some models charge a higher rate when one request sends a very long prompt, for example more than 200K or 272K tokens. This is the extra amount paid for those requests, as a cautious estimate. Shorter prompts avoid it.',
        )}
      />
      <Kpi
        label={t('Usage on models without a price')}
        calc="model-unpriced"
        value={fmtUSD(unpricedGross)}
        tone={unpricedGross > 0 ? 'warn' : 'good'}
        sub={
          stats.unpricedModels > 0
            ? t('{pct} of usage on {models}', { pct: fmtPct(unpricedShare, 1), models: pluralize(stats.unpricedModels, 'model') })
            : t('Every model has a price')
        }
        hint={
          <>
            {t(
              'Usage on models that are not on the built-in price card and have no price in Settings. They cannot be compared with cheaper models. Add a tier and a price in Settings, under Model pricing and tiers.',
            )}
            {noTokenGross > 0.005
              ? ` ${t('Another {amount} is on usage lines without token counts, so it cannot be priced either.', { amount: fmtUSD(noTokenGross) })}`
              : ''}
          </>
        }
        onClick={() => navigate('settings')}
      />
      <Kpi
        label={t('Top model')}
        calc="model-top"
        className="col-span-2 2xl:col-span-1"
        value={
          top ? (
            <span className="inline-flex max-w-full items-center gap-1.5 text-base" title={top.label}>
              <VendorIcon vendor={top.vendor} size={16} className="shrink-0 text-fg-muted" />
              <span className="truncate">{top.label}</span>
            </span>
          ) : (
            '–'
          )
        }
        sub={top ? t('{pct} of usage · {amount}', { pct: fmtPct(top.share, 0), amount: fmtUSD(top.gross) }) : undefined}
        hint={t('The model with the most usage in this period. Click to filter the whole page by it.')}
        onClick={top ? () => drill({ models: [top.value] }, { merge: true }) : undefined}
      />
      <Kpi
        label={t('Models used')}
        calc="model-count"
        value={fmtInt(rows.length)}
        sub={
          rows.length <= 1
            ? t('All usage is on one model')
            : rows.length <= 3
              ? t('Usage is split across all of them')
              : t('The top 3 carry {pct} of usage', { pct: fmtPct(gross > 0 ? stats.top3 / gross : 0, 0) })
        }
        hint={t('Models with at least one usage line in this period. A model and its Auto version count once.')}
      />
      <Kpi
        label={t('Vendors')}
        calc="model-vendors"
        value={fmtInt(known.length)}
        sub={
          !lead ? (
            t('No vendor is known for these models')
          ) : (
            <span className="inline-flex items-center gap-1">
              <VendorIcon vendor={lead.name} size={12} className="shrink-0" />
              <span>
                {known.length === 1 && vendors.length === 1
                  ? t('All usage is on {vendor}', { vendor: lead.name })
                  : t('{vendor} leads with {pct}', { vendor: lead.name, pct: fmtPct(gross > 0 ? lead.gross / gross : 0, 0) })}
              </span>
            </span>
          )
        }
        hint={t(
          'The companies that make the models, such as OpenAI, Anthropic and Google. Each vendor sets its own prices. Models with an unknown vendor are not counted.',
        )}
      />
    </KpiGrid>
  );
}
