import { useDeferredValue, useMemo } from 'react';
import { t } from '../../i18n';
import { DEFAULT_LEVERS, type LeverParams } from '../../lib/analytics/levers';
import { runScenario } from '../../lib/analytics/simulator';
import { fmtDay } from '../../lib/utils/date';
import { pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { chipText, describeFilters } from '../../state/filterChips';
import { NarrowedNotice, usePerMonth } from '../shared';
import { SimulatorControls } from './SimulatorControls';
import { SimulatorResults, type SeatState } from './SimulatorResults';
import {
  DEFAULT_SEAT_FLAGS,
  PRESETS,
  cashHiddenReason,
  effectiveSeats,
  isDefaultLevers,
  leverContext,
  matchPreset,
  poolUnknownReason,
  scenarioFigures,
  scenarioText,
  seatOptions,
  type LeverId,
  type SeatFlags,
} from './scenario';

export interface SimulatorTabProps {
  levers: LeverParams;
  onLevers: (next: LeverParams) => void;
  seatFlags: SeatFlags;
  onSeatFlags: (next: SeatFlags) => void;
}

const sameFlags = (a: SeatFlags, b: SeatFlags): boolean => a.reclaimIdle === b.reclaimIdle && a.downgrade === b.downgrade && a.reclaimUnused === b.reclaimUnused;

/** What-if simulator. The sliders stay responsive because the scenario is calculated from deferred copies of the inputs. */
export function SimulatorTab({ levers, onLevers, seatFlags, onSeatFlags }: SimulatorTabProps) {
  const { analysis, models, settings, store, taxonomy, filters } = useAnalysis();
  const perMonth = usePerMonth();

  const options = useMemo(() => seatOptions(analysis, settings), [analysis, settings]);
  const flags = useMemo(() => effectiveSeats(seatFlags, options), [seatFlags, options]);
  const deferredLevers = useDeferredValue(levers);
  const deferredFlags = useDeferredValue(flags);
  const stale = deferredLevers !== levers || deferredFlags !== flags;

  const leverInputs = useMemo(() => leverContext(analysis, models, settings), [analysis, models, settings]);
  const scenario = useMemo(
    () => runScenario(leverInputs, analysis.pool, analysis.users, analysis.seats, { levers: deferredLevers, ...deferredFlags }),
    [leverInputs, analysis.pool, analysis.users, analysis.seats, deferredLevers, deferredFlags],
  );

  const cashReason = cashHiddenReason(analysis);
  const poolReason = poolUnknownReason(analysis);
  const figures = useMemo(() => scenarioFigures(scenario, perMonth, cashReason === null, poolReason === null), [scenario, perMonth, cashReason, poolReason]);
  const alone = useMemo(() => {
    const out = {} as Record<LeverId, number>;
    for (const step of scenario.levers.steps) out[step.id] = step.standalone * perMonth;
    return out;
  }, [scenario, perMonth]);
  const seats: SeatState[] = options.map((option) => ({ option, on: deferredFlags[option.key] }));
  const context = { hasTokens: store.hasTokens, shiftRows: scenario.levers.shiftRows.length, longPremium: analysis.agg.totals.longPremium };

  const atDefault = isDefaultLevers(levers) && sameFlags(seatFlags, DEFAULT_SEAT_FLAGS);
  const reset = () => {
    onLevers(DEFAULT_LEVERS);
    onSeatFlags(DEFAULT_SEAT_FLAGS);
  };

  const getCopyText = (): string => {
    const chips = describeFilters(filters, store, taxonomy).map(chipText);
    const list = chips.join(t('; '));
    const scope = analysis.narrowed
      ? t('filtered view ({filters})', { filters: list })
      : chips.length
        ? t('whole organization ({filters})', { filters: list })
        : t('whole organization');
    const preset = PRESETS.find((candidate) => candidate.id === matchPreset(deferredLevers));
    return scenarioText({
      period: `${t('{from} to {to}', { from: fmtDay(analysis.range.start, true), to: fmtDay(analysis.range.end, true) })} (${pluralize(analysis.range.length, 'day')})`,
      scope,
      userCount: analysis.agg.totals.users,
      presetLabel: preset ? t(preset.label) : t('Custom'),
      levers: deferredLevers,
      seats,
      scenario,
      figures,
      perMonth,
      cashNote: cashReason,
      poolNote: cashReason ? null : poolReason,
      poolIsLowerBound: analysis.pool.capacityIsLowerBound,
    });
  };

  return (
    <div className="space-y-4">
      <NarrowedNotice title={t('Cash savings and seat actions are not shown for a filtered view')}>
        {t('Included credits are shared by the whole organization and cannot be split by a filter. The simulator still shows how much usage the levers avoid for the rows you selected.')}
      </NarrowedNotice>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-3 xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto print:hidden">
          <SimulatorControls
            levers={levers}
            onLevers={onLevers}
            seatFlags={seatFlags}
            onSeatFlags={onSeatFlags}
            options={options}
            alone={alone}
            atDefault={atDefault}
            onReset={reset}
          />
        </div>
        <SimulatorResults
          scenario={scenario}
          figures={figures}
          levers={deferredLevers}
          seats={seats}
          perMonth={perMonth}
          context={context}
          cashReason={analysis.narrowed ? null : cashReason}
          poolReason={analysis.narrowed || cashReason ? null : poolReason}
          lowerBound={analysis.pool.capacityIsLowerBound}
          stale={stale}
          getCopyText={getCopyText}
        />
      </div>
    </div>
  );
}
