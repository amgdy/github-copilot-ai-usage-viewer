import { RotateCcw } from 'lucide-react';
import { CalcInfo, Card, Field, Segmented, Select, Slider, Toggle, type CalcRef } from '../../components/ui';
import { t } from '../../i18n';
import { LEVER_META, LEVER_ORDER, type LeverParams } from '../../lib/analytics/levers';
import { fmtMultiple, pluralize } from '../../lib/utils/format';
import {
  LEVER_DOC,
  MIN_EFFECT,
  PRESETS,
  SEAT_DOC,
  TARGET_OPTIONS,
  applyPreset,
  fmtMoney,
  matchPreset,
  type LeverId,
  type NumericLever,
  type PresetId,
  type SeatFlags,
  type SeatOption,
} from './scenario';

type PresetChoice = PresetId | 'custom';

/** Most sliders run from 0 to 100 percent. Leaner context is capped at 50 percent, which is already hard to reach. */
const MAX_PERCENT: Partial<Record<LeverId, number>> = { contextHygiene: 50 };

const WithCalc = ({ calc, children }: { calc: CalcRef; children: string }) => (
  <span className="inline-flex items-center gap-1">
    {children}
    <CalcInfo id={calc} />
  </span>
);

const SubHeading = ({ children, calc }: { children: string; calc?: string }) => (
  <h4 className="eyebrow mb-2 flex items-center gap-1">
    {children}
    {calc ? <CalcInfo id={calc} /> : null}
  </h4>
);

export interface SimulatorControlsProps {
  levers: LeverParams;
  onLevers: (next: LeverParams) => void;
  seatFlags: SeatFlags;
  onSeatFlags: (next: SeatFlags) => void;
  options: SeatOption[];
  /** Usage per month that each lever saves on its own, or null before the first result. */
  alone: Record<LeverId, number> | null;
  atDefault: boolean;
  onReset: () => void;
}

/** Presets, one slider per lever, the target model and the seat switches. */
export function SimulatorControls({ levers, onLevers, seatFlags, onSeatFlags, options, alone, atDefault, onReset }: SimulatorControlsProps) {
  const current = matchPreset(levers);
  const presetOptions: { value: PresetChoice; label: string; title: string }[] = [
    ...PRESETS.map((presetItem) => ({ value: presetItem.id as PresetChoice, label: t(presetItem.label), title: t(presetItem.hint) })),
    ...(current === 'custom' ? [{ value: 'custom' as PresetChoice, label: t('Custom'), title: t('A slider no longer matches a preset.') }] : []),
  ];
  const preset = PRESETS.find((candidate) => candidate.id === current);
  const targets = TARGET_OPTIONS.map((targetOption) => ({ ...targetOption, label: t(targetOption.label) }));

  const set = (key: NumericLever, value: number) => onLevers({ ...levers, [key]: value });

  const effect = (id: LeverId): string | null => {
    if (!alone || levers[id] <= 0) return null;
    return alone[id] >= MIN_EFFECT ? t('Saves about {amount} of usage a month on its own.', { amount: fmtMoney(alone[id]) }) : t('No measurable effect in this data.');
  };

  return (
    <Card
      title={t('Assumptions')}
      subtitle={t('Move a slider and the result updates.')}
      actions={
        <button type="button" className="btn btn-sm btn-ghost" onClick={onReset} disabled={atDefault} title={t('Back to the Balanced preset with every seat action on')}>
          <RotateCcw size={13} aria-hidden /> {t('Reset')}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <SubHeading calc="rec-sim-presets">{t('Preset')}</SubHeading>
          <Segmented<PresetChoice>
            size="sm"
            label={t('Preset')}
            value={current}
            options={presetOptions}
            onChange={(id) => {
              const selectedPreset = PRESETS.find((candidate) => candidate.id === id);
              if (selectedPreset) onLevers(applyPreset(levers, selectedPreset));
            }}
          />
          <p className="mt-1.5 text-xs text-fg-subtle">{preset ? t(preset.hint) : t('You changed a slider, so the values no longer match a preset.')}</p>
        </div>

        <div>
          <SubHeading>{t('Usage levers')}</SubHeading>
          <div className="space-y-4">
            {LEVER_ORDER.map((id) => {
              const note = effect(id);
              return (
                <div key={id} className="space-y-3">
                  <Slider
                    label={<WithCalc calc={[LEVER_DOC[id], 'rec-sim-levers']}>{t(LEVER_META[id].label)}</WithCalc>}
                    value={Math.round(levers[id] * 100)}
                    min={0}
                    max={MAX_PERCENT[id] ?? 100}
                    step={5}
                    format={(percent) => `${percent}%`}
                    onChange={(percent) => set(id, percent / 100)}
                    hint={
                      <>
                        {t(LEVER_META[id].description)}
                        {note ? <span className="mt-0.5 block text-fg-muted">{note}</span> : null}
                      </>
                    }
                  />
                  {id === 'modelShift' ? (
                    <Field label={<WithCalc calc="rec-sim-target">{t('Move Powerful-tier usage to')}</WithCalc>}>
                      <Select value={levers.target} onChange={(target) => onLevers({ ...levers, target })} options={targets} order="given" aria-label={t('Target model for right-sizing')} />
                    </Field>
                  ) : null}
                  {id === 'capRunaway' ? (
                    <Slider
                      label={<WithCalc calc="rec-sim-cap-level">{t('Cap level')}</WithCalc>}
                      value={levers.capUtil}
                      min={1}
                      max={10}
                      step={0.5}
                      format={fmtMultiple}
                      onChange={(multiple) => set('capUtil', multiple)}
                      hint={t("Usage above this multiple of the credits included with a user's seat counts as runaway. A lower multiple is a stricter limit.")}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SubHeading>{t('Seat actions')}</SubHeading>
          <div className="space-y-3">
            {options.map((seatOption) => (
              <Toggle
                key={seatOption.key}
                checked={seatFlags[seatOption.key] && seatOption.disabledReason === null}
                disabled={seatOption.disabledReason !== null}
                onChange={(on) => onSeatFlags({ ...seatFlags, [seatOption.key]: on })}
                label={<WithCalc calc={SEAT_DOC[seatOption.key]}>{seatOption.label}</WithCalc>}
                description={seatOption.disabledReason ?? t('{seats}, {value} a month of seat value', { seats: pluralize(seatOption.count, 'seat'), value: fmtMoney(seatOption.value) })}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
