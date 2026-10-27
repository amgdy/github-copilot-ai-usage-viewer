import { useMemo } from 'react';
import { X } from 'lucide-react';
import { CalcInfo, cx, type CalcRef } from '../../components/ui';
import { quotaKnown, shortLabel } from '../../components/user/shared';
import type { TaxonomyItem } from '../../lib/analytics/taxonomy';
import type { GroupStat } from '../../lib/analytics/users';
import { fmtInt } from '../../lib/utils/format';
import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';

type Counts = Record<string, GroupStat | undefined>;

interface ChipRowProps {
  label: string;
  calc: CalcRef;
  items: TaxonomyItem[];
  counts: Counts;
  active: string[];
  onToggle: (id: string) => void;
}

function ChipRow({ label, calc, items, counts, active, onToggle }: ChipRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="inline-flex w-24 shrink-0 items-center gap-1 text-xs font-medium text-fg-muted">
        {label}
        <CalcInfo id={calc} />
      </span>
      {items.map((item) => {
        const count = counts[item.id]?.users ?? 0;
        const on = active.includes(item.id);
        if (count === 0 && !on) return null;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={on}
            title={item.description}
            onClick={() => onToggle(item.id)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs transition-colors',
              on ? 'border-accent/60 bg-accent-soft font-semibold text-fg' : 'border-border bg-surface text-fg-muted hover:border-fg-subtle hover:text-fg',
            )}
          >
            <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} aria-hidden />
            {shortLabel(item.label)}
            <span className="num text-fg-subtle">{fmtInt(count)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SegmentChips() {
  const { analysis, taxonomy } = useAnalysis();
  const filters = useApp((s) => s.filters);
  const { groups } = analysis.population;
  const creditsKnown = useMemo(() => quotaKnown(analysis.population.profiles), [analysis.population.profiles]);
  const anyActive = filters.segments.length > 0 || filters.tiers.length > 0;

  return (
    <div className="card space-y-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-fg-muted">{t('Click a group to focus the whole app on it. Click it again to remove it.')}</p>
        {anyActive ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            onClick={() => useApp.getState().setFilters({ segments: [], tiers: [] })}
          >
            <X size={12} aria-hidden /> {t('Clear')}
          </button>
        ) : null}
      </div>
      <ChipRow
        label={t('Persona')}
        calc="persona-groups"
        items={taxonomy.personas}
        counts={groups.persona}
        active={filters.segments}
        onToggle={(id) => useApp.getState().toggleFilterValue('segments', id)}
      />
      <ChipRow
        label={t('Usage tier')}
        calc="spend-tiers"
        items={taxonomy.tiers}
        counts={groups.tier}
        active={filters.tiers}
        onToggle={(id) => useApp.getState().toggleFilterValue('tiers', id)}
      />
      {creditsKnown ? null : (
        <p className="text-xs text-fg-subtle">
          {t('This file does not list included credits per license. Personas and usage tiers use an assumed license size, so read them with care.')}
        </p>
      )}
    </div>
  );
}
