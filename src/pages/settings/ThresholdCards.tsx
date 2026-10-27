import { useMemo } from 'react';
import { Card } from '../../components/ui';
import { DEFAULT_SETTINGS } from '../../lib/analytics/settings';
import { CREDIT_USD } from '../../lib/types';
import { fmtUSD } from '../../lib/utils/format';
import { msg, t, tp } from '../../i18n';
import { useApp } from '../../state/store';
import { ENGAGEMENT_COLOR, PARETO_COLOR, TIER_COLOR, engagementBands, paretoBands, tierBands } from './bands';
import { Bands } from './LiveBands';
import { LIMITS } from './limits';
import { NumInput } from './NumInput';
import { fromPct, numText, toPct } from './numbers';
import { FixedRow, OrderedFields, type OrderedField } from './OrderedFields';
import { ThresholdRow } from './ThresholdRow';

const pctText = (n: number) => `${numText(n, 2)}%`;

export function ActiveDayCard() {
  const value = useApp((s) => s.settings.activeThreshold);
  const update = useApp((s) => s.updateSettings);
  const credits = value / CREDIT_USD;
  const hint = [
    value === 0
      ? t('At $0, any day with a usage row counts as active.')
      : tp(credits, 'About {n} AI credit.', 'About {n} AI credits.', { n: numText(credits, 2) }),
    t('Default {value}.', { value: fmtUSD(DEFAULT_SETTINGS.activeThreshold, 2) }),
  ].join(' ');

  return (
    <Card title={t('Active day')} subtitle={t('What counts as a day of use.')}>
      <ThresholdRow
        label={t('Active-day threshold')}
        description={t(
          'A day counts as active for a user when their usage that day reaches this amount. It feeds the active rate, the engagement level, the personas and the cost per active day.',
        )}
        hint={hint}
      >
        <NumInput
          label={t('{name}, in US dollars', { name: t('Active-day threshold') })}
          value={value}
          min={LIMITS.activeThreshold.min}
          max={LIMITS.activeThreshold.max}
          prefix="$"
          digits={4}
          widthClass="w-36"
          onCommit={(v) => {
            if (v !== null) update({ activeThreshold: v });
          }}
        />
      </ThresholdRow>
    </Card>
  );
}

type TierKey = 'minimal' | 'light' | 'core' | 'power';

const TIER_FIELDS: OrderedField<TierKey>[] = [
  { key: 'minimal', label: msg('Minimal limit'), name: msg('Minimal'), help: msg('Users up to this share of their included credits barely use the license.'), color: TIER_COLOR.minimal, ...LIMITS.tier, defaultValue: toPct(DEFAULT_SETTINGS.tiers.minimal) },
  { key: 'light', label: msg('Light limit'), name: msg('Light'), help: msg('Some use, well inside the included credits.'), color: TIER_COLOR.light, ...LIMITS.tier, defaultValue: toPct(DEFAULT_SETTINGS.tiers.light) },
  { key: 'core', label: msg('Core limit'), name: msg('Core'), help: msg('Healthy use. 100% means the user has used all of their own included credits.'), color: TIER_COLOR.core, ...LIMITS.tier, defaultValue: toPct(DEFAULT_SETTINGS.tiers.core) },
  { key: 'power', label: msg('Power limit'), name: msg('Power'), help: msg('The user has gone past their own included credits and draws on the shared pool.'), color: TIER_COLOR.power, ...LIMITS.tier, defaultValue: toPct(DEFAULT_SETTINGS.tiers.power) },
];

export function TiersCard() {
  const tiers = useApp((s) => s.settings.tiers);
  const update = useApp((s) => s.updateSettings);
  const values = useMemo<Record<TierKey, number>>(
    () => ({ minimal: toPct(tiers.minimal), light: toPct(tiers.light), core: toPct(tiers.core), power: toPct(tiers.power) }),
    [tiers],
  );
  const bands = useMemo(() => tierBands(tiers), [tiers]);

  return (
    <Card title={t('Spend tiers')} subtitle={t('How much of their own included credits each user uses, as a percent.')}>
      <p className="mb-3 text-xs text-fg-muted">
        {t(
          "Usage is divided by the user's own included credits: the credits of their license for the months in the period. A Business license includes 1,900 AI credits ($19) a month, so in a one-month period a user is at 100% when usage reaches $19. Each limit is the top of its tier. The limits must stay in ascending order.",
        )}
      </p>
      <Bands kind="tier" bands={bands} />
      <div className="mt-4 border-t border-border-muted pt-3">
        <OrderedFields
          fields={TIER_FIELDS}
          values={values}
          onSave={(key, percent) => update({ tiers: { ...tiers, [key]: fromPct(percent) } })}
          after={
            <FixedRow
              name={t('Runaway')}
              color={TIER_COLOR.runaway}
              help={t('The user has used at least the Power limit. These users are the first to review.')}
              value={t('{value} or more', { value: pctText(values.power) })}
            />
          }
        />
      </div>
    </Card>
  );
}

type EngagementKey = 'occasional' | 'regular' | 'daily';

const ENGAGEMENT_FIELDS: OrderedField<EngagementKey>[] = [
  { key: 'occasional', label: msg('Occasional cutoff'), name: msg('Occasional'), help: msg('Lowest share of workdays for an Occasional user. Below it the user is Rare.'), color: ENGAGEMENT_COLOR.occasional, ...LIMITS.engagement, defaultValue: toPct(DEFAULT_SETTINGS.engagement.occasional) },
  { key: 'regular', label: msg('Regular cutoff'), name: msg('Regular'), help: msg('Lowest share of workdays for a Regular user. Personas also use this cutoff to tell frequent users from infrequent ones.'), color: ENGAGEMENT_COLOR.regular, ...LIMITS.engagement, defaultValue: toPct(DEFAULT_SETTINGS.engagement.regular) },
  { key: 'daily', label: msg('Daily cutoff'), name: msg('Daily'), help: msg('Lowest share of workdays for a Daily user.'), color: ENGAGEMENT_COLOR.daily, ...LIMITS.engagement, defaultValue: toPct(DEFAULT_SETTINGS.engagement.daily) },
];

export function EngagementCard() {
  const engagement = useApp((s) => s.settings.engagement);
  const update = useApp((s) => s.updateSettings);
  const values = useMemo<Record<EngagementKey, number>>(
    () => ({ occasional: toPct(engagement.occasional), regular: toPct(engagement.regular), daily: toPct(engagement.daily) }),
    [engagement],
  );
  const bands = useMemo(() => engagementBands(engagement), [engagement]);

  return (
    <Card title={t('Engagement')} subtitle={t('How often a user is active, as a percent of workdays.')}>
      <p className="mb-3 text-xs text-fg-muted">
        {t(
          'The active rate is the number of active days divided by the workdays (Monday to Friday) since the user started, limited to the selected period. Each cutoff is the lowest rate for its level. The cutoffs must stay in ascending order.',
        )}
      </p>
      <Bands kind="engagement" bands={bands} />
      <div className="mt-4 border-t border-border-muted pt-3">
        <OrderedFields
          fields={ENGAGEMENT_FIELDS}
          values={values}
          onSave={(key, percent) => update({ engagement: { ...engagement, [key]: fromPct(percent) } })}
          before={<FixedRow name={t('Rare')} color={ENGAGEMENT_COLOR.rare} help={t('Everyone below the Occasional cutoff.')} value={t('Under {value}', { value: pctText(values.occasional) })} />}
        />
      </div>
    </Card>
  );
}

type ParetoKey = 'a' | 'b';

const PARETO_FIELDS: OrderedField<ParetoKey>[] = [
  { key: 'a', label: msg('A cutoff'), name: msg('Class A ends at'), help: msg('Class A is the group of top users who together make up this share of total usage.'), color: PARETO_COLOR.A, ...LIMITS.paretoA, defaultValue: toPct(DEFAULT_SETTINGS.pareto.a) },
  { key: 'b', label: msg('B cutoff'), name: msg('Class B ends at'), help: msg('Class B covers the usage up to this share. Class C is everyone after it.'), color: PARETO_COLOR.B, ...LIMITS.paretoB, defaultValue: toPct(DEFAULT_SETTINGS.pareto.b) },
];

export function ParetoCard() {
  const pareto = useApp((s) => s.settings.pareto);
  const update = useApp((s) => s.updateSettings);
  const values = useMemo<Record<ParetoKey, number>>(() => ({ a: toPct(pareto.a), b: toPct(pareto.b) }), [pareto]);
  const bands = useMemo(() => paretoBands(pareto), [pareto]);

  return (
    <Card title={t('Pareto classes')} subtitle={t('Which users account for most of the usage, as a cumulative percent of usage.')}>
      <p className="mb-3 text-xs text-fg-muted">
        {t('Users are ranked by usage, largest first. The classes follow the running share of total usage. The A cutoff must be below the B cutoff.')}
      </p>
      <Bands kind="pareto" bands={bands} />
      <div className="mt-4 border-t border-border-muted pt-3">
        <OrderedFields fields={PARETO_FIELDS} values={values} onSave={(key, percent) => update({ pareto: { ...pareto, [key]: fromPct(percent) } })} />
      </div>
    </Card>
  );
}
