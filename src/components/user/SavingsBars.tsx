import { t, T } from '../../i18n';
import { LEVER_META, LEVER_ORDER } from '../../lib/analytics/levers';
import type { UserProfile } from '../../lib/analytics/users';
import { DAYS_PER_MONTH } from '../../lib/utils/date';
import { fmtPct, fmtUSD } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { DocLinks } from '../ui';
import { BarList, BarRow } from './Bars';
import { DrawerSection } from './DrawerSection';
import { hasQuota, money } from './shared';

export function SavingsBars({ p }: { p: UserProfile }) {
  const { analysis } = useAnalysis();
  const perMonth = DAYS_PER_MONTH / Math.max(1, analysis.range.length);
  const levers = LEVER_ORDER.map((id) => ({ id, value: p.potentialBy[id] })).filter((l) => l.value >= 0.005);
  const top = Math.max(0, ...levers.map((l) => l.value));
  const share = p.gross > 0 ? p.potential / p.gross : Number.NaN;
  const total = <span className="num font-semibold">{money(p.potential)}</span>;
  const monthly = <span className="num">{money(p.potential * perMonth)}</span>;

  return (
    <DrawerSection
      title={t('Where the savings would come from')}
      calc="user-potential"
      description={t('What this user could avoid by changing habits. Each step is counted after the one above it, so the amounts never overlap.')}
    >
      {levers.length === 0 || p.potential < 0.005 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-fg-muted">
          {t('No savings stand out for this user with the current settings.')}
        </div>
      ) : (
        <>
          <p className="text-sm">
            {Number.isFinite(share) ? (
              <T
                text="Could save about {total} over this date range, {monthly} a month, {share} of their usage."
                values={{ total, monthly, share: <span className="num">{fmtPct(share, 0)}</span> }}
              />
            ) : (
              <T text="Could save about {total} over this date range, {monthly} a month." values={{ total, monthly }} />
            )}
          </p>
          <BarList label={t('Savings by step')}>
            {levers.map((l) => (
              <BarRow
                key={l.id}
                label={t(LEVER_META[l.id].label)}
                value={fmtUSD(l.value, 2)}
                fraction={top > 0 ? l.value / top : 0}
                title={t('{label}: {description}', { label: t(LEVER_META[l.id].label), description: t(LEVER_META[l.id].description) })}
              />
            ))}
          </BarList>
          {!hasQuota(p) && p.potentialBy.capRunaway >= 0.005 ? (
            <p className="text-xs text-fg-subtle">{t('Cap runaway users assumes a license size, because the file does not list included credits.')}</p>
          ) : null}
          <DocLinks topic="habits" compact limit={3} />
        </>
      )}
    </DrawerSection>
  );
}
