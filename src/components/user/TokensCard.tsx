import { useMemo } from 'react';
import { msg, t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtInt, fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { CalcInfo, Kpi, KpiGrid } from '../ui';
import { BarList, BarRow } from './Bars';
import { DrawerSection } from './DrawerSection';
import { usePopulationMedians } from './medians';
import { fmtCount } from './shared';

const COUNTS = [
  { key: 'input', label: msg('Input tokens'), calc: 'tokens-input' },
  { key: 'cacheRead', label: msg('Cache read tokens'), calc: 'tokens-cache-read' },
  { key: 'cacheWrite', label: msg('Cache write tokens'), calc: 'tokens-cache-write' },
  { key: 'output', label: msg('Output tokens'), calc: 'tokens-output' },
] as const;

const COSTS = [
  { key: 'costInput', label: msg('Input tokens') },
  { key: 'costCacheRead', label: msg('Cache read tokens') },
  { key: 'costCacheWrite', label: msg('Cache write tokens') },
  { key: 'costOutput', label: msg('Output tokens') },
] as const;

const EMPTY = 'rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-fg-muted';

/** The four token types of one user, their share of all tokens, the estimated usage by token type and the cache hit rate. */
export function TokensCard({ p }: { p: UserProfile }) {
  const { analysis } = useAnalysis();
  const medians = usePopulationMedians();
  const { coverage, population } = analysis;
  const allTokens = useMemo(() => population.profiles.reduce((sum, u) => sum + u.tokens, 0), [population]);

  if (!coverage.tokens) {
    return (
      <DrawerSection title={t('Tokens')} calc="user-tokens">
        <div className={EMPTY}>{t('This file has no token columns, so token counts and the cost by token type are not available.')}</div>
      </DrawerSection>
    );
  }
  if (!(p.tokens > 0)) {
    return (
      <DrawerSection title={t('Tokens')} calc="user-tokens">
        <div className={EMPTY}>{t('No token counts for this user in this date range.')}</div>
      </DrawerSection>
    );
  }

  const costTotal = COSTS.reduce((sum, c) => sum + p[c.key], 0);
  const costTop = Math.max(0, ...COSTS.map((c) => p[c.key]));
  const typical =
    medians.users > 1 && Number.isFinite(medians.cacheHit) ? t('Typical user {rate}', { rate: fmtPct(medians.cacheHit, 0) }) : undefined;

  return (
    <DrawerSection title={t('Tokens')} calc="user-tokens" aside={pluralTokens(p.tokens)}>
      <KpiGrid cols="grid-cols-2 sm:grid-cols-3">
        {COUNTS.map((c) => (
          <Kpi
            key={c.key}
            label={t(c.label)}
            value={fmtCount(p[c.key])}
            sub={t("{share} of this user's tokens", { share: fmtPct(p[c.key] / p.tokens, 0) })}
            hint={t('{n} tokens in the selected date range.', { n: fmtInt(p[c.key]) })}
            calc={c.calc}
          />
        ))}
        <Kpi
          label={t('Total tokens')}
          value={fmtCount(p.tokens)}
          sub={allTokens > 0 ? t('{share} of all tokens', { share: fmtPct(p.tokens / allTokens, 1) }) : undefined}
          hint={t('{n} tokens in the selected date range. The share compares the user with everyone in the current date range and row filters.', {
            n: fmtInt(p.tokens),
          })}
          calc="tokens-total"
        />
        <Kpi
          label={t('Cache hit rate')}
          value={fmtPct(p.cacheHit, 0)}
          sub={Number.isFinite(p.cacheHit) ? typical : t('No prompt tokens')}
          hint={t('The share of prompt tokens that were read from the cache. A higher rate means less repeated input.')}
          calc="cache-hit"
        />
      </KpiGrid>

      <div className="space-y-1.5 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {t('Cost by token type')}
          <CalcInfo id="token-cost-split" />
        </div>
        {costTotal > 0 ? (
          <BarList label={t('Estimated usage by token type')}>
            {COSTS.map((c) => (
              <BarRow
                key={c.key}
                label={t(c.label)}
                value={`${fmtUSD(p[c.key])} · ${fmtPct(p[c.key] / costTotal, 0)}`}
                fraction={costTop > 0 ? p[c.key] / costTop : 0}
                title={t("{label}: {amount} of {total} of this user's priced usage", {
                  label: t(c.label),
                  amount: fmtUSD(p[c.key]),
                  total: fmtUSD(costTotal),
                })}
              />
            ))}
          </BarList>
        ) : (
          <p className="text-xs text-fg-muted">{t("None of this user's usage could be priced from token counts, so it is not split by token type.")}</p>
        )}
        <p className="text-xs text-fg-subtle">
          {p.tokenCoverage >= 0.995
            ? t("An estimate from the price card. It covers all of this user's usage.")
            : t("An estimate from the price card. It covers {share} of this user's usage. The rest has no token counts or a model that is not on the price card.", {
                share: fmtPct(p.tokenCoverage, 0),
              })}
        </p>
      </div>
    </DrawerSection>
  );
}

const pluralTokens = (n: number): string => t('{n} tokens', { n: fmtInt(n) });
