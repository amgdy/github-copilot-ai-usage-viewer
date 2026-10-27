import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge, CalcInfo, Callout, Section } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt, fmtPct } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { money, roleModels, strengthsText } from './metrics';
import { ROLE_MODEL_MIN } from './thresholds';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="wrap-anywhere text-fg-subtle">{label}</dt>
      <dd className="num font-medium text-fg">{value}</dd>
    </div>
  );
}

export function RoleModels() {
  const { analysis, settings } = useAnalysis();
  const selectUser = useApp((state) => state.selectUser);
  const models = useMemo(() => roleModels(analysis.users.profiles, settings), [analysis.users, settings]);

  if (models.length < ROLE_MODEL_MIN) return null;

  return (
    <Section
      title={
        <span className="inline-flex items-center gap-1.5">
          {t('Role models')}
          <CalcInfo id={['role-models', 'efficiency-score']} />
        </span>
      }
      description={t(
        'Users who get a lot done per credit. They use GitHub Copilot regularly, use enough for the numbers to mean something, use Auto, and read most of their prompt from the cache where the report shows it.',
      )}
    >
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {models.map((user) => (
          <li key={user.id} className="card flex min-w-0 flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold" title={user.name}>
                  {user.name}
                </h3>
                <p className="num text-xs text-fg-muted">
                  {tp(user.activeDays, '{usage} usage over {n} active day', '{usage} usage over {n} active days', { n: fmtInt(user.activeDays), usage: money(user.gross) })}
                </p>
              </div>
              <Badge tone="good" title={t("Efficiency score: the share of this user's usage that the default habit changes would not remove")}>
                {t('Efficiency score {score}', { score: fmtInt(Math.round(user.efficiency)) })}
              </Badge>
            </div>
            <p className="text-sm text-fg-muted">{strengthsText(user)}</p>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <Stat label={t('Auto share')} value={fmtPct(user.autoShare, 0)} />
              <Stat label={t('Cache hit rate')} value={Number.isFinite(user.cacheHit) ? fmtPct(user.cacheHit, 0) : '–'} />
              <Stat label={t('Powerful share')} value={fmtPct(user.powerfulShare, 0)} />
            </dl>
            <button type="button" className="btn btn-sm mt-auto self-start" onClick={() => selectUser(user.id)} title={t('Open the user profile')}>
              {t('Open profile')}
              <ArrowRight size={13} className="rtl:-scale-x-100" />
            </button>
          </li>
        ))}
      </ul>
      <Callout className="mt-3" title={t('Share what works')}>
        {t('Ask these users to show how they work, for example in a short demo, a written guide or a pairing session. A habit that a colleague has seen work is easier to adopt than a rule.')}
      </Callout>
    </Section>
  );
}
