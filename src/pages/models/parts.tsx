import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ChartColors } from '../../components/charts/theme';
import { VendorIcon } from '../../components/icons';
import { Badge, CalcInfo, CalcLine, cx, type CalcRef } from '../../components/ui';
import { t, T } from '../../i18n';
import { CATEGORY_COLORS } from '../../lib/analytics/taxonomy';
import { CARD_AS_OF, CARD_SOURCE, type Vendor } from '../../lib/pricing/card';
import type { Category } from '../../lib/types';
import { fmtDay, parseIsoDay } from '../../lib/utils/date';
import { fmtCompact, fmtInt, fmtNum } from '../../lib/utils/format';
import { navigate, type PageId } from '../../state/router';

/** USD per 1M tokens, with at least two decimals ("$0.10", "$0.175", "$14.00"). A dash when there is no price. */
export const fmtRate = (v: number): string =>
  Number.isFinite(v) ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}` : '–';

/** Whole numbers below 1,000, compact above ("842", "12.4K"). */
export const fmtCount = (v: number): string => (Math.abs(v) >= 1000 ? fmtCompact(v) : fmtInt(v));

/** Credits are not always whole numbers, so small values keep a decimal. */
export const fmtCredits = (v: number): string => (Math.abs(v) >= 100 ? fmtInt(v) : fmtNum(v, 1));

export const vendorColor = (c: ChartColors, vendorIndex: number): string => c.palette[vendorIndex % c.palette.length];

/** The name a reader sees for a vendor. Company names stay as they are; only "Other" is translated. */
export const vendorLabel = (v: Vendor): string => (v === 'Other' ? t('Other') : v);

/** The translated name of a model tier. */
export const tierLabel = (tier: Category): string => t(tier);

/** A model or vendor name with the vendor's logo in front of it. */
export function VendorName({ vendor, children, className }: { vendor: Vendor; children?: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex min-w-0 items-center gap-1.5', className)}>
      <VendorIcon vendor={vendor} size={13} className="shrink-0 text-fg-muted" />
      <span className="min-w-0 truncate">{children ?? vendorLabel(vendor)}</span>
    </span>
  );
}

export function TierBadge({ tier }: { tier: Category }) {
  return <Badge color={CATEGORY_COLORS[tier]}>{tierLabel(tier)}</Badge>;
}

export function TierLegend({ tiers }: { tiers: Category[] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {tiers.map((tier) => (
        <span key={tier} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-xs" style={{ background: CATEGORY_COLORS[tier] }} />
          {tierLabel(tier)}
        </span>
      ))}
    </span>
  );
}

export function FooterLink({ to, children }: { to: PageId; children: ReactNode }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => navigate(to)}>
      {children} <ArrowRight size={12} className="rtl:-scale-x-100" />
    </button>
  );
}

/**
 * Where the prices come from and when they were copied, with a link to the GitHub Docs page. The live comparison
 * with that page is in Settings, so `settings` adds a pointer there.
 */
export function PriceSource({ settings = false, className }: { settings?: boolean; className?: string }) {
  return (
    <p className={cx('text-xs text-fg-muted', className)}>
      <T
        text="Prices from {source}, as of {date}."
        values={{
          source: (
            <a className="text-accent hover:underline" href={CARD_SOURCE} target="_blank" rel="noreferrer">
              {t('GitHub Docs, Models and pricing')}
            </a>
          ),
          date: fmtDay(parseIsoDay(CARD_AS_OF), true),
        }}
      />
      {settings ? (
        <>
          {' '}
          <T
            text="To check them against the live page or to set your own prices, open {settings}."
            values={{
              settings: (
                <button type="button" className="text-accent hover:underline" onClick={() => navigate('settings')}>
                  {t('Settings')}
                </button>
              ),
            }}
          />
        </>
      ) : null}
    </p>
  );
}

export function Stat({ label, value, sub, calc }: { label: string; value: ReactNode; sub?: ReactNode; calc?: CalcRef }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-fg-muted">
        <span className="min-w-0">{label}</span>
        {calc ? <CalcInfo id={calc} /> : null}
      </div>
      <div className="num truncate text-lg font-semibold leading-tight">{value}</div>
      {sub ? <div className="text-xs text-fg-muted">{sub}</div> : null}
      <CalcLine id={calc} className="mt-0.5" />
    </div>
  );
}
