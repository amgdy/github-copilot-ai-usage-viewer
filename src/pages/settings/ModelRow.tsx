import { useState } from 'react';
import { VendorIcon } from '../../components/icons';
import { Badge, Select, cx } from '../../components/ui';
import { t } from '../../i18n';
import { BLANK, BLANK_LABELS, type Category } from '../../lib/types';
import { lookupCard } from '../../lib/pricing/models';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { PriceEditor } from './PriceEditor';
import { TIERS, ratesText, type ModelRowData, type OverrideChange } from './models';

interface ModelRowProps {
  row: ModelRowData;
  /** Share of all usage in the report, 0 to 1. */
  share: number;
  onChange: (change: OverrideChange) => void;
  onRemove: () => void;
}

function Usage({ gross, share }: { gross: number; share: number }) {
  return (
    <div className="num shrink-0 text-end text-sm">
      {fmtUSD(gross, 0)} <span className="text-xs text-fg-muted">{t('{share} of usage', { share: fmtPct(share, 1) })}</span>
    </div>
  );
}

export function ModelRow({ row, share, onChange, onRemove }: ModelRowProps) {
  const { meta, name } = row;
  const [open, setOpen] = useState(false);
  const card = lookupCard(name);

  if (row.readOnly) {
    return (
      <li className="px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className="font-medium text-fg-muted">{name === BLANK ? t(BLANK_LABELS.model) : name}</span>
          <Usage gross={row.gross} share={share} />
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          {name === BLANK
            ? t('Rows with no model name cannot be priced or given a tier. Their usage is left out of the estimates that use tokens.')
            : t('This name cannot be used for a price change.')}
        </p>
      </li>
    );
  }

  const tierOptions: { value: Category; label: string }[] = [
    ...(card ? [] : [{ value: 'Unknown' as const, label: t('No tier set') }]),
    ...TIERS.map((tier) => ({ value: tier, label: t(tier) })),
  ];
  const builtInTier = card && meta.category !== card.category ? card.category : null;

  return (
    <li className={cx('px-4 py-3', row.attention && 'border-s-2 border-warn ps-3.5')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <VendorIcon vendor={meta.vendor} size={14} aria-hidden />
          <span className="break-words font-medium" dir="ltr">
            {name}
          </span>
          <span className="text-xs text-fg-muted">{meta.vendor}</span>
        </div>
        <Usage gross={row.gross} share={share} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Select<Category>
          aria-label={t('Tier of {model}', { model: name })}
          className={cx('w-36', meta.category === 'Unknown' && 'border-warn')}
          value={meta.category}
          options={tierOptions}
          onChange={(v) => onChange({ category: v === 'Unknown' ? undefined : v })}
        />
        {builtInTier ? <span className="text-[11px] text-fg-subtle">{t('Tier on the price card: {tier}', { tier: t(builtInTier) })}</span> : null}
        {!meta.priced ? (
          <Badge tone="warn">{t('No price on the price card')}</Badge>
        ) : row.customPrice ? (
          <Badge tone="accent">{t('Your prices')}</Badge>
        ) : (
          <Badge>{t('Price card prices')}</Badge>
        )}
        <span className={cx('num min-w-0 text-xs', meta.priced ? 'text-fg-muted' : 'text-warn')}>
          {meta.base ? t('{rates} per 1M tokens', { rates: ratesText(meta.base) }) : t('The token-based estimates skip this model until it has prices.')}
        </span>
        <span className="ms-auto inline-flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? t('Close') : meta.priced ? t('Edit prices') : t('Set prices')}
          </button>
          {meta.overridden ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
            >
              {t('Remove your change')}
            </button>
          ) : null}
        </span>
      </div>

      {open ? (
        <PriceEditor
          model={name}
          initial={meta.base}
          builtIn={card?.base ?? null}
          canUseBuiltIn={!!card && row.customPrice}
          onSave={(rates) => {
            onChange({ base: rates });
            setOpen(false);
          }}
          onUseBuiltIn={() => {
            onChange({ base: undefined });
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </li>
  );
}
