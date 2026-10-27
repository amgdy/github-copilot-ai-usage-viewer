import { useDeferredValue, useMemo, useState } from 'react';
import { Card, SearchInput, Segmented } from '../../components/ui';
import { T, t } from '../../i18n';
import { CARD_AS_OF, CARD_SOURCE } from '../../lib/pricing/card';
import { fmtInt } from '../../lib/utils/format';
import { fmtIsoDay } from '../licenses/model';
import { ModelRow } from './ModelRow';
import type { ModelRowData, OverrideChange } from './models';

export type ModelFilter = 'all' | 'attention' | 'overridden';

interface ModelListProps {
  rows: ModelRowData[];
  /** Total usage in the report, for the share column. */
  total: number;
  filter: ModelFilter;
  onFilter: (filter: ModelFilter) => void;
  onChange: (name: string, change: OverrideChange) => void;
  onRemove: (name: string) => void;
}

export function ModelList({ rows, total, filter, onFilter, onChange, onRemove }: ModelListProps) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  const counts = useMemo(() => ({ all: rows.length, attention: rows.filter((row) => row.attention).length, overridden: rows.filter((row) => row.meta.overridden).length }), [rows]);

  const visible = useMemo(() => {
    const searchText = deferred.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === 'attention' && !row.attention) return false;
      if (filter === 'overridden' && !row.meta.overridden) return false;
      return !searchText || row.name.toLowerCase().includes(searchText) || row.meta.vendor.toLowerCase().includes(searchText);
    });
  }, [rows, filter, deferred]);

  const label = (text: string, count: number) => (
    <>
      {text} <span className="num text-fg-subtle">{fmtInt(count)}</span>
    </>
  );

  return (
    <Card
      title={t('Models in the report')}
      subtitle={t('Change a tier right away, or open the prices to set your own. Models that need attention are listed first.')}
      padded={false}
      footer={
        <T
          text="Prices from the GitHub Docs price card as of {date}. {source}"
          values={{
            date: fmtIsoDay(CARD_AS_OF),
            source: (
              <a className="text-accent hover:underline" href={CARD_SOURCE} target="_blank" rel="noreferrer">
                {t('See the source')}
              </a>
            ),
          }}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border-muted px-4 py-2.5">
        <SearchInput className="min-w-48 flex-1 basis-56" placeholder={t('Search models')} aria-label={t('Search models')} value={query} onChange={setQuery} />
        <Segmented<ModelFilter>
          label={t('Show models')}
          size="sm"
          value={filter}
          onChange={onFilter}
          options={[
            { value: 'all', label: label(t('All'), counts.all) },
            { value: 'attention', label: label(t('Needs attention'), counts.attention), title: t('Models with no price on the price card or no tier') },
            { value: 'overridden', label: label(t('Changed'), counts.overridden), title: t('Models with a tier or prices set here') },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-fg-muted">{rows.length === 0 ? t('The report has no usage rows.') : t('No models match.')}</p>
      ) : (
        <ul className="divide-y divide-border-muted">
          {visible.map((row) => (
            <ModelRow key={row.name} row={row} share={total > 0 ? row.gross / total : Number.NaN} onChange={(change) => onChange(row.name, change)} onRemove={() => onRemove(row.name)} />
          ))}
        </ul>
      )}
    </Card>
  );
}
