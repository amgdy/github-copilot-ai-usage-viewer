import { useMemo } from 'react';
import { t } from '../../i18n';
import { fmtDay } from '../../lib/utils/date';
import { pluralize } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { chipText, describeFilters } from '../../state/filterChips';
import { datasetLabel, useApp } from '../../state/store';

/** Printed at the top of every page: the top bar and filter chips are hidden on paper, so say what this view covers. */
export function PrintHeader() {
  const { dataset, analysis, store, taxonomy } = useAnalysis();
  const filters = useApp((s) => s.filters);
  const chips = useMemo(() => describeFilters(filters, store, taxonomy).map(chipText), [filters, store, taxonomy]);
  const { start, end, length } = analysis.range;
  const today = Math.floor(Date.now() / 86_400_000);
  return (
    <div className="mb-4 hidden border-b border-border pb-2 text-xs text-fg-muted print:block">
      <div className="text-sm font-semibold text-fg">{t('GitHub Copilot AI usage report')}</div>
      <div>
        {t('{name} · {start} to {end} ({days}) · printed {today}', {
          name: datasetLabel(dataset),
          start: fmtDay(start, true),
          end: fmtDay(end, true),
          days: pluralize(length, 'day'),
          today: fmtDay(today, true),
        })}
      </div>
      <div>{chips.length ? t('Filters: {list}', { list: chips.join('; ') }) : t('Filters: none (all rows)')}</div>
    </div>
  );
}
