import { useMemo } from 'react';
import { t } from '../../i18n';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import type { UserProfile } from '../../lib/analytics/users';
import { inferVendor } from '../../lib/pricing/models';
import { CATEGORIES, labelOf } from '../../lib/types';
import { fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { FeatureIcon, VendorIcon } from '../icons';
import { BarList, BarRow, SplitBar } from './Bars';
import { DrawerSection } from './DrawerSection';
import { userModelGross } from './scan';

const MAX_MODELS = 7;

interface ModelUse {
  name: string;
  gross: number;
  color: string;
  tier: string;
}

export function ModelMix({ p: user }: { p: UserProfile }) {
  const { analysis, store, models } = useAnalysis();
  const { agg: aggregates, baseMask, range, segmentFiltered, users, coverage } = analysis;

  const uses = useMemo<ModelUse[]>(() => {
    const nModels = store.dicts.model.values.length;
    const inScope = !segmentFiltered || users.profiles.includes(user);
    const perModel: ArrayLike<number> =
      aggregates.userModel && inScope && aggregates.nModels === nModels
        ? aggregates.userModel.subarray(user.id * nModels, (user.id + 1) * nModels)
        : userModelGross(store, baseMask, { start: range.start, end: range.end }, user.id);
    const out: ModelUse[] = [];
    for (let modelIndex = 0; modelIndex < nModels; modelIndex++) {
      if (!(perModel[modelIndex] > 0)) continue;
      const tier = CATEGORIES[models.cat[modelIndex]] ?? 'Unknown';
      out.push({ name: labelOf('model', store.dicts.model.values[modelIndex]), gross: perModel[modelIndex], color: CATEGORY_COLORS[tier], tier });
    }
    return out.sort((a, b) => b.gross - a.gross);
  }, [aggregates, store, models, baseMask, range.start, range.end, segmentFiltered, users, user]);

  const total = uses.reduce((sum, modelUse) => sum + modelUse.gross, 0);
  const shown = uses.slice(0, MAX_MODELS);
  const rest = uses.slice(MAX_MODELS);
  const restGross = rest.reduce((sum, modelUse) => sum + modelUse.gross, 0);
  const top = shown[0]?.gross ?? 0;

  const unknownShare = Math.max(0, 1 - user.powerfulShare - user.versatileShare - user.lightweightShare);

  if (!coverage.models) {
    return (
      <DrawerSection title={t('Models and Auto')} calc={['user-model-mix', 'auto-share']}>
        <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-fg-muted">
          {t('This file has no model names, so the usage cannot be split by model, model tier or Auto.')}
        </div>
      </DrawerSection>
    );
  }

  return (
    <DrawerSection title={t('Models and Auto')} calc={['user-model-mix', 'auto-share']} aside={uses.length > 0 ? pluralize(uses.length, 'model') : undefined}>
      {uses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-fg-muted">{t('No model usage in this date range.')}</div>
      ) : (
        <BarList label={t('Usage by model')}>
          {shown.map((modelUse) => (
            <BarRow
              key={modelUse.name}
              label={
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <VendorIcon vendor={inferVendor(modelUse.name)} size={12} />
                  <span className="truncate">{modelUse.name}</span>
                </span>
              }
              value={`${fmtUSD(modelUse.gross)} · ${fmtPct(modelUse.gross / total, 0)}`}
              fraction={modelUse.gross / top}
              color={modelUse.color}
              title={t("{model} ({tier}): {amount}, {share} of this user's usage", {
                model: modelUse.name,
                tier: t(modelUse.tier),
                amount: fmtUSD(modelUse.gross),
                share: fmtPct(modelUse.gross / total, 1),
              })}
            />
          ))}
          {rest.length > 0 ? (
            <BarRow
              label={pluralize(rest.length, 'other model')}
              value={`${fmtUSD(restGross)} · ${fmtPct(restGross / total, 0)}`}
              fraction={restGross / top}
              color="var(--fg-subtle)"
              title={rest.map((modelUse) => `${modelUse.name}: ${fmtUSD(modelUse.gross)}`).join('\n')}
            />
          ) : null}
        </BarList>
      )}
      <div className="grid gap-4 pt-2 sm:grid-cols-2">
        <SplitBar
          title={t('Model tier')}
          calc="tier-usage"
          segments={[
            { label: t('Powerful'), value: user.powerfulShare, color: CATEGORY_COLORS.Powerful },
            { label: t('Versatile'), value: user.versatileShare, color: CATEGORY_COLORS.Versatile },
            { label: t('Lightweight'), value: user.lightweightShare, color: CATEGORY_COLORS.Lightweight },
            { label: t('Unknown'), value: unknownShare > 0.005 ? unknownShare : 0, color: CATEGORY_COLORS.Unknown },
          ]}
        />
        <SplitBar
          title={t('Auto or hand-picked')}
          calc="auto-share"
          note={<FeatureIcon feature="auto" size={12} />}
          segments={[
            { label: t('Auto'), value: user.autoShare, color: 'var(--accent)' },
            { label: t('Hand-picked'), value: 1 - user.autoShare, color: 'var(--fg-subtle)' },
          ]}
        />
      </div>
    </DrawerSection>
  );
}
