import { type ReactNode } from 'react';
import { TaxBadge } from '../../components/ui';
import { msg, t } from '../../i18n';
import { PLAN_CREDITS, PLAN_PRICE, type Settings } from '../../lib/analytics/settings';
import type { Taxonomy, TaxonomyItem } from '../../lib/analytics/taxonomy';
import { lensUnavailableReason, unavailableReason, type Availability, type LensId } from './lenses';

export interface RuleContext {
  settings: Settings;
  taxonomy: Taxonomy;
  availability: Availability;
  /** Credits a month assumed for users whose seat is unknown. */
  fallbackQuotaCredits: number;
}

export const RULE_SUMMARY: Record<LensId, string> = {
  persona: msg('One label per user. The first rule that fits wins.'),
  tier: msg('Usage compared with the user’s own included credits.'),
  engagement: msg('How often the user is active, plus the New and Lapsed flags.'),
  profile: msg('Which model tiers the usage goes to.'),
  pareto: msg('Rank by usage and the share held by the users above.'),
  trait: msg('Habits that need attention. A user can have any number of them.'),
  autoUse: msg('The share of the user’s usage that goes through Auto model selection.'),
};

const pct = (share: number): string => `${Number((share * 100).toFixed(1))}%`;
const dollars = (amount: number): string => `$${amount.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 4 })}`;
const formatInteger = (count: number): string => count.toLocaleString('en-US');
const byId = (items: TaxonomyItem[]): Map<string, TaxonomyItem> => new Map(items.map((item) => [item.id, item]));

interface RuleItem {
  item?: TaxonomyItem;
  text: ReactNode;
  warn?: string | null;
}

function RuleList({ rules, ordered = false }: { rules: RuleItem[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="divide-y divide-border-muted">
      {rules.map((rule, index) => (
        <li key={rule.item?.id ?? index} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:gap-3">
          <div className="flex shrink-0 items-start gap-2 sm:w-56">
            {ordered ? <span className="num grid size-5 shrink-0 place-items-center rounded-xs bg-surface-3 font-mono text-[11px] text-fg-muted">{index + 1}</span> : null}
            <TaxBadge item={rule.item} />
          </div>
          <div className="num min-w-0 flex-1 text-sm text-fg-muted">
            {rule.text}
            {rule.warn ? <p className="mt-1 text-xs text-warn">{rule.warn}</p> : null}
          </div>
        </li>
      ))}
    </Tag>
  );
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="num mb-3 text-sm text-fg-muted">{children}</p>;
}

function Note({ children }: { children: ReactNode }) {
  return <p className="num mt-3 rounded-md bg-surface-2 p-2.5 text-xs text-fg-muted">{children}</p>;
}

/** Why this lens has no real groups in the data in view. Renders nothing when the lens works. */
function Unsupported({ lens, c: context }: { lens: LensId; c: RuleContext }) {
  const reason = lensUnavailableReason(lens, context.availability);
  return reason ? <p className="num mb-3 rounded-md border border-warn/30 bg-warn-soft p-2.5 text-xs text-fg">{reason}</p> : null;
}

function newRule(settings: Settings): string {
  return t(
    'The user’s first use in the whole report is within the last {days} days of the period. Users already active in the first {days} days of the report are never new, because they cannot be told apart from long-time users.',
    { days: formatInteger(settings.newUserDays) },
  );
}

function lapsedRule(settings: Settings): string {
  return t('Not new, and the last usage was {days} days or more before the end of the period.', { days: formatInteger(settings.lapsedDays) });
}

function PersonaRules({ c: context }: { c: RuleContext }) {
  const { settings: settings, taxonomy } = context;
  const personas = byId(taxonomy.personas);
  const name = (id: string): string => personas.get(id)?.label ?? id;
  const heavy = pct(settings.tiers.light);
  const often = pct(settings.engagement.regular);
  return (
    <>
      <Intro>{t('Each user gets exactly one persona. Go down this list: the first rule that fits decides.')}</Intro>
      <RuleList
        ordered
        rules={[
          { item: personas.get('runaway'), text: t('Usage is {share} or more of the user’s own included credits.', { share: pct(settings.tiers.power) }) },
          { item: personas.get('new'), text: newRule(settings) },
          { item: personas.get('lapsed'), text: lapsedRule(settings) },
          { item: personas.get('champion'), text: t('Active on {often} or more of workdays, and usage is {heavy} or more of own included credits.', { often, heavy }) },
          { item: personas.get('burst'), text: t('Usage is {heavy} or more of own included credits, but active on fewer than {often} of workdays.', { often, heavy }) },
          { item: personas.get('steady'), text: t('Active on {often} or more of workdays, but usage is below {heavy} of own included credits.', { often, heavy }) },
          { item: personas.get('dormant'), text: t('Everything else: active on fewer than {often} of workdays and usage below {heavy} of own included credits.', { often, heavy }) },
        ]}
      />
      <Note>
        {t(
          '{runaway} comes first, so a new or lapsed user with runaway usage is in {runaway}. This is why the counts of {newUsers} and {lapsedUsers} can be lower than the New and Lapsed flags under Engagement.',
          { runaway: name('runaway'), newUsers: name('new'), lapsedUsers: name('lapsed') },
        )}
      </Note>
    </>
  );
}

function TierRules({ c: context }: { c: RuleContext }) {
  const { settings: settings, taxonomy } = context;
  const tiers = settings.tiers;
  const bounds: [number, number][] = [
    [0, tiers.minimal],
    [tiers.minimal, tiers.light],
    [tiers.light, tiers.core],
    [tiers.core, tiers.power],
    [tiers.power, Number.POSITIVE_INFINITY],
  ];
  const span = (low: number, high: number, format: (value: number) => string): string =>
    low <= 0 ? t('below {value}', { value: format(high) }) : Number.isFinite(high) ? t('{low} to below {high}', { low: format(low), high: format(high) }) : t('{value} or more', { value: format(low) });
  const seats = [
    { id: 'Business', name: t('Business'), price: PLAN_PRICE.Business },
    { id: 'Enterprise', name: t('Enterprise'), price: PLAN_PRICE.Enterprise },
  ];
  return (
    <>
      <Intro>
        {t(
          'The tier compares a user’s usage with their own included credits in the period. Included credits are the monthly credits of the user’s seat, added up over the months in which the user’s rows show a seat size. A Business seat has {business} credits ({businessPrice}) a month and an Enterprise seat {enterprise} ({enterprisePrice}). When a user’s seat is unknown, {fallback} credits a month are assumed.',
          {
            business: formatInteger(PLAN_CREDITS.Business),
            businessPrice: dollars(PLAN_PRICE.Business),
            enterprise: formatInteger(PLAN_CREDITS.Enterprise),
            enterprisePrice: dollars(PLAN_PRICE.Enterprise),
            fallback: formatInteger(context.fallbackQuotaCredits),
          },
        )}
      </Intro>
      <div className="overflow-x-auto">
        <table className="num w-full min-w-max text-start text-sm">
          <thead>
            <tr className="text-xs text-fg-muted">
              <th scope="col" className="py-1.5 pe-4 font-medium">
                {t('Usage tier')}
              </th>
              <th scope="col" className="py-1.5 pe-4 font-medium">
                {t('Usage as a share of own included credits')}
              </th>
              {seats.map((seat) => (
                <th key={seat.id} scope="col" className="py-1.5 pe-4 font-medium">
                  {t('{seat} seat, per month', { seat: seat.name })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taxonomy.tiers.map((item, index) => {
              const [low, high] = bounds[index] ?? [0, 0];
              return (
                <tr key={item.id}>
                  <td className="border-t border-border-muted py-2 pe-4">
                    <TaxBadge item={item} />
                  </td>
                  <td className="border-t border-border-muted py-2 pe-4 text-fg-muted">{span(low, high, pct)}</td>
                  {seats.map((seat) => (
                    <td key={seat.id} className="border-t border-border-muted py-2 pe-4 text-fg-muted">
                      {span(low, high, (share) => dollars(share * seat.price))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Note>{t('The dollar columns show usage per month. Over a longer period, usage and included credits both add up, so the percentages stay comparable.')}</Note>
    </>
  );
}

function EngagementRules({ c: context }: { c: RuleContext }) {
  const { settings: settings, taxonomy } = context;
  const engagement = settings.engagement;
  const levels = byId(taxonomy.engagement);
  const name = (id: string): string => levels.get(id)?.label ?? id;
  return (
    <>
      <Intro>
        {t(
          'A day counts as active when the user’s usage that day is at least {amount}. The active rate is the number of active days divided by the workdays (Monday to Friday) from the user’s first day in the report, or the start of the period if that is later, to the end of the period. At least 5 workdays are used, so a new user is not rated on one or two days.',
          { amount: dollars(settings.activeThreshold) },
        )}
      </Intro>
      <RuleList
        rules={[
          { item: levels.get('daily'), text: t('Active rate of {share} or more.', { share: pct(engagement.daily) }) },
          { item: levels.get('regular'), text: t('Active rate of {low} to below {high}.', { low: pct(engagement.regular), high: pct(engagement.daily) }) },
          { item: levels.get('occasional'), text: t('Active rate of {low} to below {high}.', { low: pct(engagement.occasional), high: pct(engagement.regular) }) },
          { item: levels.get('rare'), text: t('Active rate below {share}.', { share: pct(engagement.occasional) }) },
          { item: levels.get('new'), text: t('A flag, not a level. {rule}', { rule: newRule(settings) }) },
          { item: levels.get('lapsed'), text: t('A flag, not a level. {rule}', { rule: lapsedRule(settings) }) },
        ]}
      />
      <Note>
        {t(
          'New and Lapsed users also have one of the four activity levels, so only {daily}, {regular}, {occasional} and {rare} add up to all users. Days with usage on a weekend count as active days, and the active rate never goes above 100%.',
          { daily: name('daily'), regular: name('regular'), occasional: name('occasional'), rare: name('rare') },
        )}
      </Note>
    </>
  );
}

function ProfileRules({ c: context }: { c: RuleContext }) {
  const { settings: settings, taxonomy } = context;
  const profiles = byId(taxonomy.profiles);
  return (
    <>
      <Unsupported lens="profile" c={context} />
      <Intro>{t('Usage is split by model tier: Powerful (frontier models), Versatile and Lightweight. Models without a known tier count toward none of the three shares.')}</Intro>
      <RuleList
        ordered
        rules={[
          { item: profiles.get('frontier'), text: t('Powerful models make up {share} or more of the user’s usage.', { share: pct(settings.frontierHeavy) }) },
          { item: profiles.get('efficient'), text: t('Not {frontier}, and Versatile and Lightweight models together make up {share} or more.', { frontier: profiles.get('frontier')?.label ?? 'frontier', share: pct(settings.efficientShare) }) },
          { item: profiles.get('balanced'), text: t('Everything else: a mix with no clear lean.') },
        ]}
      />
    </>
  );
}

function ParetoRules({ c: context }: { c: RuleContext }) {
  const { a: cutoffA, b: cutoffB } = context.settings.pareto;
  const paretoClasses = byId(context.taxonomy.pareto);
  return (
    <>
      <Intro>{t('Users are ranked by usage, largest first. The class depends on the share of all usage held by the users ranked above.')}</Intro>
      <RuleList
        rules={[
          { item: paretoClasses.get('A'), text: t('The users above hold less than {share} of all usage. The user who takes the total past {share} is still in A.', { share: pct(cutoffA) }) },
          { item: paretoClasses.get('B'), text: t('The users above hold {low} to below {high} of all usage.', { low: pct(cutoffA), high: pct(cutoffB) }) },
          { item: paretoClasses.get('C'), text: t('The users above already hold {share} or more of all usage. This is the long tail.', { share: pct(cutoffB) }) },
        ]}
      />
    </>
  );
}

function TraitRules({ c: context }: { c: RuleContext }) {
  const { settings: settings, taxonomy, availability: availability } = context;
  const traits = byId(taxonomy.traits);
  const label = (id: string): string => traits.get(id)?.label ?? id;
  const min = dollars(settings.minSpendForTraits);
  const warn = (id: string) => unavailableReason('trait', id, availability);
  return (
    <>
      <Intro>
        {t(
          'A user can have any number of traits, or none. {lowCache}, {longContext}, {spiky} and {lowAuto} need at least {min} of usage in the period, so small amounts do not trigger them. {growing} and {fading} compare the last 7 days with the 7 days before, use the same minimum per week and need a period of 14 days or more.',
          {
            lowCache: label('lowCache'),
            longContext: label('longContext'),
            spiky: label('spiky'),
            lowAuto: label('lowAuto'),
            growing: label('accelerating'),
            fading: label('fading'),
            min,
          },
        )}
      </Intro>
      <RuleList
        rules={[
          {
            item: traits.get('lowCache'),
            text: t('Cache reads are under {share} of prompt tokens (input, cache reads and cache writes), and at least half of the user’s usage has token counts and a known model price.', {
              share: pct(settings.lowCacheHit),
            }),
            warn: warn('lowCache'),
          },
          {
            item: traits.get('longContext'),
            text: t('Long-context surcharges, estimated from token counts, are {share} or more of the user’s usage.', { share: pct(settings.longContextShare) }),
            warn: warn('longContext'),
          },
          { item: traits.get('spiky'), text: t('At least 3 active days, and the busiest day is {share} or more of the user’s usage.', { share: pct(settings.spikeShare) }) },
          { item: traits.get('lowAuto'), text: t('Auto model selection is under {share} of the user’s usage.', { share: pct(settings.lowAuto) }), warn: warn('lowAuto') },
          { item: traits.get('multiModel'), text: t('The user used 4 or more different models. No minimum usage applies.'), warn: warn('multiModel') },
          {
            item: traits.get('accelerating'),
            text: t(
              'Usage in the last 7 days of the period is at least {min} and at least 1.5 times the 7 days before. A user with usage in the last 7 days and none in the 7 days before also counts, unless the user is new.',
              { min },
            ),
            warn: warn('accelerating'),
          },
          {
            item: traits.get('fading'),
            text: t('Usage in the 7 days before the last week was at least {min}, and the last 7 days are half of that or less.', { min }),
            warn: warn('fading'),
          },
          { item: traits.get('noCostCenter'), text: t('The report has cost centers, and this user has none.'), warn: warn('noCostCenter') },
        ]}
      />
    </>
  );
}

function AutoUseRules({ c: context }: { c: RuleContext }) {
  const { settings: settings, taxonomy } = context;
  const groups = byId(taxonomy.autoUse);
  const lowAutoLabel = taxonomy.traits.find((trait) => trait.id === 'lowAuto')?.label ?? 'lowAuto';
  const directLabel = groups.get('direct')?.label ?? 'direct';
  return (
    <>
      <Unsupported lens="autoUse" c={context} />
      <Intro>
        {t(
          'Each user gets exactly one group. The Auto share is the usage that went through Auto model selection divided by all of the user’s usage in the period. Go down this list: the first rule that fits decides.',
        )}
      </Intro>
      <RuleList
        ordered
        rules={[
          { item: groups.get('unknown'), text: t('The user has no usage, or the report has no model names and usage that went through Auto cannot be told apart.') },
          { item: groups.get('autoFirst'), text: t('The Auto share is {share} or more.', { share: pct(settings.autoFirst) }) },
          { item: groups.get('direct'), text: t('The Auto share is under {share}.', { share: pct(settings.lowAuto) }) },
          { item: groups.get('mixed'), text: t('The Auto share is {low} to under {high}.', { low: pct(settings.lowAuto), high: pct(settings.autoFirst) }) },
        ]}
      />
      <Note>
        {t(
          'One setting, the low Auto threshold ({share}), decides both who is in {direct} and who has the {lowAuto} trait. Change it in Settings and both move together. The Auto-first threshold ({autoFirst}) is a separate setting.',
          { share: pct(settings.lowAuto), direct: directLabel, lowAuto: lowAutoLabel, autoFirst: pct(settings.autoFirst) },
        )}
      </Note>
    </>
  );
}

export function RuleBlock({ lens, c: context }: { lens: LensId; c: RuleContext }) {
  switch (lens) {
    case 'persona':
      return <PersonaRules c={context} />;
    case 'tier':
      return <TierRules c={context} />;
    case 'engagement':
      return <EngagementRules c={context} />;
    case 'profile':
      return <ProfileRules c={context} />;
    case 'pareto':
      return <ParetoRules c={context} />;
    case 'autoUse':
      return <AutoUseRules c={context} />;
    case 'trait':
      return <TraitRules c={context} />;
  }
}
