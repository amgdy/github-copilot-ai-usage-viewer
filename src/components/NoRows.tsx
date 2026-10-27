import { FilterX } from 'lucide-react';
import { useApp } from '../state/store';
import { Card, EmptyState } from './ui';
import { t } from '../i18n';

/** Shown by every page when the active filters leave no rows. */
export function NoRows() {
  const resetFilters = useApp((s) => s.resetFilters);
  return (
    <Card>
      <EmptyState
        icon={<FilterX size={24} />}
        title={t('No rows match the current filters')}
        description={t('Widen the date range or clear some filters.')}
        action={
          <button type="button" className="btn btn-primary" onClick={resetFilters}>
            {t('Clear all filters')}
          </button>
        }
      />
    </Card>
  );
}
