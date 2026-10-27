import { type ReactNode } from 'react';
import { Card, DocLinks } from '../../components/ui';
import { FeatureIcon } from '../../components/icons';
import { DEFAULT_SETTINGS, type Settings } from '../../lib/analytics/settings';
import { msg, t } from '../../i18n';
import { useApp } from '../../state/store';
import { BEHAVIOR_GROUPS, SCALARS, scalarDisplay, unitText, type ScalarKey, type ScalarSpec } from './limits';
import { LiveCount, type GroupName } from './LiveBands';
import { NumInput } from './NumInput';
import { fromPct } from './numbers';
import { GroupTitle, ThresholdRow } from './ThresholdRow';
import { autoLimitsError } from './validation';

/** Which live count sits next to a setting. Settings without an entry have no count. `what` is the English tooltip. */
const LIVE: Partial<Record<ScalarKey, { group: GroupName; id: string; what?: string }>> = {
  frontierHeavy: { group: 'profile', id: 'frontier' },
  efficientShare: { group: 'profile', id: 'efficient' },
  newUserDays: { group: 'lifecycle', id: 'new' },
  lapsedDays: { group: 'lifecycle', id: 'lapsed' },
  spikeShare: { group: 'trait', id: 'spiky' },
  lowAuto: { group: 'autoUse', id: 'direct', what: msg('Users in the selected period in the Direct models class') },
  autoFirst: { group: 'autoUse', id: 'autoFirst', what: msg('Users in the selected period in the Auto-first class') },
  lowCacheHit: { group: 'trait', id: 'lowCache' },
  longContextShare: { group: 'trait', id: 'longContext' },
};

const defaultText = (spec: ScalarSpec): string => unitText(spec, scalarDisplay(spec, DEFAULT_SETTINGS));

function inputLabel(spec: ScalarSpec): string {
  const name = t(spec.label);
  if (spec.unit === 'percent') return t('{name}, in percent', { name });
  if (spec.unit === 'days') return t('{name}, in days', { name });
  if (spec.unit === 'usd') return t('{name}, in US dollars', { name });
  return name;
}

function ScalarRow({ spec }: { spec: ScalarSpec }) {
  const value = useApp((state) => scalarDisplay(spec, state.settings));
  const update = useApp((state) => state.updateSettings);
  const live = LIVE[spec.key];

  return (
    <ThresholdRow
      label={t(spec.label)}
      aside={live ? <LiveCount group={live.group} id={live.id} what={live.what ? t(live.what) : undefined} /> : undefined}
      description={t(spec.description)}
      hint={t('Default {value}', { value: defaultText(spec) })}
    >
      <NumInput
        label={inputLabel(spec)}
        value={value}
        min={spec.min}
        max={spec.max}
        integer={spec.integer}
        prefix={spec.unit === 'usd' ? '$' : undefined}
        suffix={spec.unit === 'percent' ? '%' : spec.unit === 'days' ? t('days') : undefined}
        digits={spec.unit === 'percent' ? 2 : 4}
        onCommit={(entered) => {
          if (entered === null) return null;
          const next = spec.unit === 'percent' ? fromPct(entered) : entered;
          if (spec.key === 'lowAuto' || spec.key === 'autoFirst') {
            const error = autoLimitsError(useApp.getState().settings, spec.key, next);
            if (error) return error;
          }
          update({ [spec.key]: next } as Partial<Settings>);
          return null;
        }}
      />
    </ThresholdRow>
  );
}

function ScalarGroup({ title, keys, note, icon }: { title: string; keys: ScalarKey[]; note?: string; icon?: ReactNode }) {
  return (
    <div>
      <GroupTitle>
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {t(title)}
        </span>
      </GroupTitle>
      {note ? <p className="py-2 text-xs text-fg-subtle">{t(note)}</p> : null}
      <div className="divide-y divide-border-muted pt-3">
        {keys.map((settingKey) => (
          <ScalarRow key={settingKey} spec={SCALARS[settingKey]} />
        ))}
      </div>
    </div>
  );
}

const GROUP_NOTES: Record<string, string> = {
  'Model mix': msg('Frontier-heavy is checked first, so a user who meets both rules is Frontier-heavy. A user who meets neither rule is Balanced.'),
  Lifecycle: msg('New and Lapsed users are set aside before the other personas are decided.'),
  'Auto use class': msg(
    'Users at or above Auto first from are Auto-first. Users below Rarely uses Auto below are Direct models. Users in between are Mixed. Rarely uses Auto below must stay lower than Auto first from. The Rarely uses Auto trait uses the same lower limit and also needs the minimum usage for traits.',
  ),
  Traits: msg(
    'Traits are flags on a user. A user can have several. Most need a minimum amount of usage so that small accounts are not flagged by chance. The Rarely uses Auto trait is set under Auto use class.',
  ),
  'Auto model selection': msg(
    'The report holds the amount after the Auto discount and has no discount column. The app measures the rate from token counts where it can. This setting is the assumed rate, and it is shown as assumed wherever it is used.',
  ),
};

const isAutoGroup = (title: string) => title === 'Auto use class' || title === 'Auto model selection';

export function BehaviorCard() {
  return (
    <Card title={t('User groups and traits')} subtitle={t("The limits behind each user's usage profile, persona, Auto use class and usage traits.")}>
      <div className="space-y-5">
        {BEHAVIOR_GROUPS.map((group) => (
          <ScalarGroup
            key={group.title}
            title={group.title}
            keys={group.keys}
            note={GROUP_NOTES[group.title]}
            icon={isAutoGroup(group.title) ? <FeatureIcon feature="auto" size={13} /> : undefined}
          />
        ))}
      </div>
    </Card>
  );
}

export function EstimatesCard() {
  return (
    <Card title={t('Estimates and rankings')} subtitle={t('The Auto discount rate to assume where the report cannot measure one, and the length of the top lists.')}>
      <div className="space-y-5">
        <ScalarGroup title={msg('Auto model selection')} keys={['autoDiscount']} note={GROUP_NOTES['Auto model selection']} icon={<FeatureIcon feature="auto" size={13} />} />
        <DocLinks topic="auto" title={t('Learn more')} limit={3} compact />
        <ScalarGroup title={msg('Rankings')} keys={['topN']} />
      </div>
    </Card>
  );
}
