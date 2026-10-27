import { msg, T, t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { DrawerSection } from './DrawerSection';
import { usePopulationMedians, type PopulationMedians } from './medians';

interface Metric {
  id: string;
  /** English label, translated where it is shown. */
  label: string;
  user: number;
  typical: number;
  format: (v: number) => string;
  /** Share-type metrics never exceed 1, so their bars can use the whole track. */
  fraction: boolean;
  /** English reason, translated where it is shown. */
  missing: string;
}

interface Coverage {
  models: boolean;
  tokens: boolean;
}

function metricsOf(p: UserProfile, m: PopulationMedians, coverage: Coverage): Metric[] {
  return [
    {
      id: 'auto',
      label: msg('Auto share of usage'),
      user: coverage.models ? p.autoShare : Number.NaN,
      typical: coverage.models ? m.autoShare : Number.NaN,
      format: (v) => fmtPct(v, 0),
      fraction: true,
      missing: msg('This file has no model names'),
    },
    {
      id: 'cache',
      label: msg('Cache hit rate'),
      user: p.cacheHit,
      typical: m.cacheHit,
      format: (v) => fmtPct(v, 0),
      fraction: true,
      missing: coverage.tokens ? msg('No prompt tokens') : msg('This file has no token columns'),
    },
    {
      id: 'cost',
      label: msg('Cost per active day'),
      user: p.costPerActiveDay,
      typical: m.costPerActiveDay,
      format: (v) => fmtUSD(v, 2),
      fraction: false,
      missing: msg('No active days'),
    },
    {
      id: 'rate',
      label: msg('Active rate'),
      user: p.activeRate,
      typical: m.activeRate,
      format: (v) => fmtPct(v, 0),
      fraction: true,
      missing: msg('Not available'),
    },
  ];
}

function verdict(user: number, typical: number): string {
  if (typical <= 0) return user > 0 ? t('Higher') : t('Similar');
  const ratio = user / typical;
  if (ratio >= 1.15) return t('Higher');
  if (ratio <= 0.85) return t('Lower');
  return t('Similar');
}

function CompareRow({ metric }: { metric: Metric }) {
  const { user, typical, format, fraction } = metric;
  const label = t(metric.label);
  if (!Number.isFinite(user) || !Number.isFinite(typical)) {
    return (
      <li className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-fg-subtle">{t(metric.missing)}</span>
      </li>
    );
  }
  const top = Math.max(user, typical);
  const scale = top <= 0 ? 1 : fraction ? Math.min(1, top * 1.3) : top * 1.2;
  const userWidth = Math.min(1, Math.max(0, user / scale));
  const typicalPos = Math.min(1, Math.max(0, typical / scale));
  const text = t('{label}: {value}, typical user {typical}', { label, value: format(user), typical: format(typical) });
  return (
    <li className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-fg-muted">
          <T
            text="{value} · typical {typical} · {verdict}"
            values={{ value: <span className="num text-fg">{format(user)}</span>, typical: <span className="num">{format(typical)}</span>, verdict: verdict(user, typical) }}
          />
        </span>
      </div>
      <div className="relative h-2 rounded-xs bg-surface-3" role="img" aria-label={text} title={text}>
        <div className="h-full rounded-xs bg-accent" style={{ width: `${userWidth * 100}%` }} />
        <div
          className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 rounded bg-fg rtl:translate-x-1/2"
          style={{ insetInlineStart: `${typicalPos * 100}%` }}
          aria-hidden
        />
      </div>
    </li>
  );
}

export function CompareBars({ p }: { p: UserProfile }) {
  const medians = usePopulationMedians();
  const { coverage } = useAnalysis().analysis;
  const alone = medians.users < 2;
  return (
    <DrawerSection
      title={t('Compared with everyone else')}
      calc="user-compare"
      aside={alone ? undefined : t('Typical is the median of {n} users', { n: fmtInt(medians.users) })}
      description={
        alone ? t('Only one user is in this view, so there is nothing to compare with.') : t('The bar is this user. The dark tick marks the typical user.')
      }
    >
      {alone ? null : (
        <ul className="space-y-3">
          {metricsOf(p, medians, coverage).map((m) => (
            <CompareRow key={m.id} metric={m} />
          ))}
        </ul>
      )}
    </DrawerSection>
  );
}
