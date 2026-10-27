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

export function SavingsBars({ p: user }: { p: UserProfile }) {
  const { analysis } = useAnalysis();
  const perMonth = DAYS_PER_MONTH / Math.max(1, analysis.range.length);
  const levers = LEVER_ORDER.map((id) => ({ id, value: user.potentialBy[id] })).filter((lever) => lever.value >= 0.005);
  const top = Math.max(0, ...levers.map((lever) => lever.value));
  const share = user.gross > 0 ? user.potential / user.gross : Number.NaN;
  const total = <span className="num font-semibold">{money(user.potential)}</span>;
  const monthly = <span className="num">{money(user.potential * perMonth)}</span>;

  return (
    <DrawerSection
      title={t('Where the savings would come from')}
      calc="user-potential"
      description={t('What this user could avoid by changing habits. Each step is counted after the one above it, so the amounts never overlap.')}
    >
      {levers.length === 0 || user.potential < 0.005 ? (
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
            {levers.map((lever) => (
              <BarRow
                key={lever.id}
                label={t(LEVER_META[lever.id].label)}
                value={fmtUSD(lever.value, 2)}
                fraction={top > 0 ? lever.value / top : 0}
                title={t('{label}: {description}', { label: t(LEVER_META[lever.id].label), description: t(LEVER_META[lever.id].description) })}
              />
            ))}
          </BarList>
          {!hasQuota(user) && user.potentialBy.capRunaway >= 0.005 ? (
            <p className="text-xs text-fg-subtle">{t('Cap runaway users assumes a license size, because the file does not list included credits.')}</p>
          ) : null}
          <DocLinks topic="habits" compact limit={3} />
        </>
      )}
    </DrawerSection>
  );
}
