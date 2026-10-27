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

const pct = (v: number): string => `${Number((v * 100).toFixed(1))}%`;
const dollars = (v: number): string => `$${v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 4 })}`;
const int = (v: number): string => v.toLocaleString('en-US');
const byId = (items: TaxonomyItem[]): Map<string, TaxonomyItem> => new Map(items.map((i) => [i.id, i]));

interface RuleItem {
  item?: TaxonomyItem;
  text: ReactNode;
  warn?: string | null;
}

function RuleList({ rules, ordered = false }: { rules: RuleItem[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="divide-y divide-border-muted">
      {rules.map((r, i) => (
        <li key={r.item?.id ?? i} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:gap-3">
          <div className="flex shrink-0 items-start gap-2 sm:w-56">
            {ordered ? <span className="num grid size-5 shrink-0 place-items-center rounded-xs bg-surface-3 font-mono text-[11px] text-fg-muted">{i + 1}</span> : null}
            <TaxBadge item={r.item} />
          </div>
          <div className="num min-w-0 flex-1 text-sm text-fg-muted">
            {r.text}
            {r.warn ? <p className="mt-1 text-xs text-warn">{r.warn}</p> : null}
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
function Unsupported({ lens, c }: { lens: LensId; c: RuleContext }) {
  const reason = lensUnavailableReason(lens, c.availability);
  return reason ? <p className="num mb-3 rounded-md border border-warn/30 bg-warn-soft p-2.5 text-xs text-fg">{reason}</p> : null;
}

function newRule(s: Settings): string {
  return t(
    'The user’s first use in the whole report is within the last {days} days of the period. Users already active in the first {days} days of the report are never new, because they cannot be told apart from long-time users.',
    { days: int(s.newUserDays) },
  );
}

function lapsedRule(s: Settings): string {
  return t('Not new, and the last usage was {days} days or more before the end of the period.', { days: int(s.lapsedDays) });
}

function PersonaRules({ c }: { c: RuleContext }) {
  const { settings: s, taxonomy } = c;
  const p = byId(taxonomy.personas);
  const name = (id: string): string => p.get(id)?.label ?? id;
  const heavy = pct(s.tiers.light);
  const often = pct(s.engagement.regular);
  return (
    <>
      <Intro>{t('Each user gets exactly one persona. Go down this list: the first rule that fits decides.')}</Intro>
      <RuleList
        ordered
        rules={[
          { item: p.get('runaway'), text: t('Usage is {share} or more of the user’s own included credits.', { share: pct(s.tiers.power) }) },
          { item: p.get('new'), text: newRule(s) },
          { item: p.get('lapsed'), text: lapsedRule(s) },
          { item: p.get('champion'), text: t('Active on {often} or more of workdays, and usage is {heavy} or more of own included credits.', { often, heavy }) },
          { item: p.get('burst'), text: t('Usage is {heavy} or more of own included credits, but active on fewer than {often} of workdays.', { often, heavy }) },
          { item: p.get('steady'), text: t('Active on {often} or more of workdays, but usage is below {heavy} of own included credits.', { often, heavy }) },
          { item: p.get('dormant'), text: t('Everything else: active on fewer than {often} of workdays and usage below {heavy} of own included credits.', { often, heavy }) },
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

function TierRules({ c }: { c: RuleContext }) {
  const { settings: s, taxonomy } = c;
  const tiers = s.tiers;
  const bounds: [number, number][] = [
    [0, tiers.minimal],
    [tiers.minimal, tiers.light],
    [tiers.light, tiers.core],
    [tiers.core, tiers.power],
    [tiers.power, Number.POSITIVE_INFINITY],
  ];
  const span = (lo: number, hi: number, fmt: (v: number) => string): string =>
    lo <= 0 ? t('below {value}', { value: fmt(hi) }) : Number.isFinite(hi) ? t('{low} to below {high}', { low: fmt(lo), high: fmt(hi) }) : t('{value} or more', { value: fmt(lo) });
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
            business: int(PLAN_CREDITS.Business),
            businessPrice: dollars(PLAN_PRICE.Business),
            enterprise: int(PLAN_CREDITS.Enterprise),
            enterprisePrice: dollars(PLAN_PRICE.Enterprise),
            fallback: int(c.fallbackQuotaCredits),
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
              {seats.map((x) => (
                <th key={x.id} scope="col" className="py-1.5 pe-4 font-medium">
                  {t('{seat} seat, per month', { seat: x.name })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taxonomy.tiers.map((item, i) => {
              const [lo, hi] = bounds[i] ?? [0, 0];
              return (
                <tr key={item.id}>
                  <td className="border-t border-border-muted py-2 pe-4">
                    <TaxBadge item={item} />
                  </td>
                  <td className="border-t border-border-muted py-2 pe-4 text-fg-muted">{span(lo, hi, pct)}</td>
                  {seats.map((x) => (
                    <td key={x.id} className="border-t border-border-muted py-2 pe-4 text-fg-muted">
                      {span(lo, hi, (v) => dollars(v * x.price))}
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

function EngagementRules({ c }: { c: RuleContext }) {
  const { settings: s, taxonomy } = c;
  const e = s.engagement;
  const l = byId(taxonomy.engagement);
  const name = (id: string): string => l.get(id)?.label ?? id;
  return (
    <>
      <Intro>
        {t(
          'A day counts as active when the user’s usage that day is at least {amount}. The active rate is the number of active days divided by the workdays (Monday to Friday) from the user’s first day in the report, or the start of the period if that is later, to the end of the period. At least 5 workdays are used, so a new user is not rated on one or two days.',
          { amount: dollars(s.activeThreshold) },
        )}
      </Intro>
      <RuleList
        rules={[
          { item: l.get('daily'), text: t('Active rate of {share} or more.', { share: pct(e.daily) }) },
          { item: l.get('regular'), text: t('Active rate of {low} to below {high}.', { low: pct(e.regular), high: pct(e.daily) }) },
          { item: l.get('occasional'), text: t('Active rate of {low} to below {high}.', { low: pct(e.occasional), high: pct(e.regular) }) },
          { item: l.get('rare'), text: t('Active rate below {share}.', { share: pct(e.occasional) }) },
          { item: l.get('new'), text: t('A flag, not a level. {rule}', { rule: newRule(s) }) },
          { item: l.get('lapsed'), text: t('A flag, not a level. {rule}', { rule: lapsedRule(s) }) },
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

function ProfileRules({ c }: { c: RuleContext }) {
  const { settings: s, taxonomy } = c;
  const p = byId(taxonomy.profiles);
  return (
    <>
      <Unsupported lens="profile" c={c} />
      <Intro>{t('Usage is split by model tier: Powerful (frontier models), Versatile and Lightweight. Models without a known tier count toward none of the three shares.')}</Intro>
      <RuleList
        ordered
        rules={[
          { item: p.get('frontier'), text: t('Powerful models make up {share} or more of the user’s usage.', { share: pct(s.frontierHeavy) }) },
          { item: p.get('efficient'), text: t('Not {frontier}, and Versatile and Lightweight models together make up {share} or more.', { frontier: p.get('frontier')?.label ?? 'frontier', share: pct(s.efficientShare) }) },
          { item: p.get('balanced'), text: t('Everything else: a mix with no clear lean.') },
        ]}
      />
    </>
  );
}

function ParetoRules({ c }: { c: RuleContext }) {
  const { a, b } = c.settings.pareto;
  const p = byId(c.taxonomy.pareto);
  return (
    <>
      <Intro>{t('Users are ranked by usage, largest first. The class depends on the share of all usage held by the users ranked above.')}</Intro>
      <RuleList
        rules={[
          { item: p.get('A'), text: t('The users above hold less than {share} of all usage. The user who takes the total past {share} is still in A.', { share: pct(a) }) },
          { item: p.get('B'), text: t('The users above hold {low} to below {high} of all usage.', { low: pct(a), high: pct(b) }) },
          { item: p.get('C'), text: t('The users above already hold {share} or more of all usage. This is the long tail.', { share: pct(b) }) },
        ]}
      />
    </>
  );
}

function TraitRules({ c }: { c: RuleContext }) {
  const { settings: s, taxonomy, availability: a } = c;
  const traits = byId(taxonomy.traits);
  const label = (id: string): string => traits.get(id)?.label ?? id;
  const min = dollars(s.minSpendForTraits);
  const warn = (id: string) => unavailableReason('trait', id, a);
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
              share: pct(s.lowCacheHit),
            }),
            warn: warn('lowCache'),
          },
          {
            item: traits.get('longContext'),
            text: t('Long-context surcharges, estimated from token counts, are {share} or more of the user’s usage.', { share: pct(s.longContextShare) }),
            warn: warn('longContext'),
          },
          { item: traits.get('spiky'), text: t('At least 3 active days, and the busiest day is {share} or more of the user’s usage.', { share: pct(s.spikeShare) }) },
          { item: traits.get('lowAuto'), text: t('Auto model selection is under {share} of the user’s usage.', { share: pct(s.lowAuto) }), warn: warn('lowAuto') },
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

function AutoUseRules({ c }: { c: RuleContext }) {
  const { settings: s, taxonomy } = c;
  const p = byId(taxonomy.autoUse);
  const lowAutoLabel = taxonomy.traits.find((x) => x.id === 'lowAuto')?.label ?? 'lowAuto';
  const directLabel = p.get('direct')?.label ?? 'direct';
  return (
    <>
      <Unsupported lens="autoUse" c={c} />
      <Intro>
        {t(
          'Each user gets exactly one group. The Auto share is the usage that went through Auto model selection divided by all of the user’s usage in the period. Go down this list: the first rule that fits decides.',
        )}
      </Intro>
      <RuleList
        ordered
        rules={[
          { item: p.get('unknown'), text: t('The user has no usage, or the report has no model names and usage that went through Auto cannot be told apart.') },
          { item: p.get('autoFirst'), text: t('The Auto share is {share} or more.', { share: pct(s.autoFirst) }) },
          { item: p.get('direct'), text: t('The Auto share is under {share}.', { share: pct(s.lowAuto) }) },
          { item: p.get('mixed'), text: t('The Auto share is {low} to under {high}.', { low: pct(s.lowAuto), high: pct(s.autoFirst) }) },
        ]}
      />
      <Note>
        {t(
          'One setting, the low Auto threshold ({share}), decides both who is in {direct} and who has the {lowAuto} trait. Change it in Settings and both move together. The Auto-first threshold ({autoFirst}) is a separate setting.',
          { share: pct(s.lowAuto), direct: directLabel, lowAuto: lowAutoLabel, autoFirst: pct(s.autoFirst) },
        )}
      </Note>
    </>
  );
}

export function RuleBlock({ lens, c }: { lens: LensId; c: RuleContext }) {
  switch (lens) {
    case 'persona':
      return <PersonaRules c={c} />;
    case 'tier':
      return <TierRules c={c} />;
    case 'engagement':
      return <EngagementRules c={c} />;
    case 'profile':
      return <ProfileRules c={c} />;
    case 'pareto':
      return <ParetoRules c={c} />;
    case 'autoUse':
      return <AutoUseRules c={c} />;
    case 'trait':
      return <TraitRules c={c} />;
  }
}
