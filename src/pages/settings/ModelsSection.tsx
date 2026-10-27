import { useMemo, useState } from 'react';
import { Callout, DocLinks } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { LivePriceCheck } from './LivePriceCheck';
import { ModelList, type ModelFilter } from './ModelList';
import { SavedOverrides } from './SavedOverrides';
import { SettingsSection } from './SettingsSection';
import { modelRows, modelUsage, withOverride, withoutOverride, type ModelRowData, type OverrideChange } from './models';

// Read the latest overrides at click time, so a stale render never overwrites a newer change.
function changeModel(name: string, change: OverrideChange) {
  const { settings, updateSettings } = useApp.getState();
  updateSettings({ modelOverrides: withOverride(settings.modelOverrides, name, change) });
}

function removeModel(name: string) {
  const { settings, updateSettings } = useApp.getState();
  updateSettings({ modelOverrides: withoutOverride(settings.modelOverrides, name) });
}

function AttentionNote({ rows, total, onShow }: { rows: ModelRowData[]; total: number; onShow: () => void }) {
  const unpriced = rows.filter((r) => r.attention && !r.meta.priced);
  const noTier = rows.filter((r) => r.attention && r.meta.category === 'Unknown');
  if (unpriced.length === 0 && noTier.length === 0) return <Callout tone="good">{t('Every model in the report has a tier and a price on the price card.')}</Callout>;

  const gross = unpriced.reduce((sum, r) => sum + r.gross, 0);
  return (
    <Callout
      tone="warn"
      title={t('Some models are missing a price or a tier')}
      action={
        <button type="button" className="btn btn-sm" onClick={onShow}>
          {t('Show them')}
        </button>
      }
    >
      <div className="space-y-1">
        {unpriced.length > 0 ? (
          <p>
            {tp(
              unpriced.length,
              '{n} model has no price on the price card and carries {usage} ({share}) of usage. The estimates that use tokens skip that usage: model shift, cache discipline, leaner context and long-context surcharges.',
              '{n} models have no price on the price card and carry {usage} ({share}) of usage. The estimates that use tokens skip that usage: model shift, cache discipline, leaner context and long-context surcharges.',
              { n: fmtInt(unpriced.length), usage: fmtUSD(gross, 0), share: fmtPct(total > 0 ? gross / total : Number.NaN, 1) },
            )}
          </p>
        ) : null}
        {noTier.length > 0 ? (
          <p>
            {tp(
              noTier.length,
              '{n} model has no tier. Right-sizing only moves usage off Powerful models, and the usage profiles count only usage that has a tier.',
              '{n} models have no tier. Right-sizing only moves usage off Powerful models, and the usage profiles count only usage that has a tier.',
              { n: fmtInt(noTier.length) },
            )}
          </p>
        ) : null}
      </div>
    </Callout>
  );
}

export function ModelsSection() {
  const store = useApp((s) => s.dataset)?.store ?? null;
  const overrides = useApp((s) => s.settings.modelOverrides);
  const update = useApp((s) => s.updateSettings);
  const [filter, setFilter] = useState<ModelFilter>('all');

  const usage = useMemo(() => (store ? modelUsage(store) : null), [store]);
  const rows = useMemo(() => (store && usage ? modelRows(store, usage, overrides) : []), [store, usage, overrides]);
  const reportModels = useMemo(() => rows.filter((r) => !r.readOnly).map((r) => r.name), [rows]);
  const notListed = useMemo(() => {
    const listed = new Set(rows.map((r) => r.name));
    return Object.keys(overrides)
      .filter((name) => !listed.has(name))
      .sort((a, b) => a.localeCompare(b));
  }, [rows, overrides]);

  return (
    <SettingsSection
      id="models"
      description={t('Fix a missing price or tier so the estimates cover every model.')}
      onReset={() => update({ modelOverrides: {} })}
      confirmReset={t('Remove all your model price and tier changes?')}
    >
      <Callout tone="info" title={t('What the tier and the price do')}>
        <div className="space-y-1">
          <p>
            {t(
              "The tier (Powerful, Versatile or Lightweight) drives the right-sizing recommendations and each user's usage profile. The prices drive the estimates that work from tokens: model shift, cache discipline, leaner context and long-context surcharges.",
            )}
          </p>
          <p>{t('Nothing here changes the billed amounts. They come straight from the report.')}</p>
        </div>
      </Callout>

      {store && usage ? (
        <>
          <AttentionNote rows={rows} total={usage.total} onShow={() => setFilter('attention')} />
          <ModelList rows={rows} total={usage.total} filter={filter} onFilter={setFilter} onChange={changeModel} onRemove={removeModel} />
        </>
      ) : (
        <Callout tone="neutral">{t('Load a report to see the models it contains and to fix any that have no price or tier.')}</Callout>
      )}

      <LivePriceCheck reportModels={reportModels} />
      <SavedOverrides overrides={overrides} names={notListed} hasReport={store !== null} onRemove={removeModel} />
      <DocLinks topic="pricing" title={t('Learn more')} limit={4} />
    </SettingsSection>
  );
}
