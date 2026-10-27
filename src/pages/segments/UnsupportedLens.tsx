import type { ReactNode } from 'react';
import { Database } from 'lucide-react';
import { Card, EmptyState, Section } from '../../components/ui';
import { t } from '../../i18n';
import { navigate } from '../../state/router';
import type { Lens } from './lenses';

/** Takes the place of the Kpis, chart and group tables of a lens that the report cannot support, with the reason and a way to load better data. */
export function UnsupportedLens({ lens, reason, notice }: { lens: Lens; reason: string; notice: ReactNode }) {
  return (
    <Section title={t('Compare the groups')} description={t(lens.title)}>
      <div className="space-y-4">
        {notice}
        <Card>
          <EmptyState
            icon={<Database size={24} />}
            title={t('{lens} is not available for this report', { lens: t(lens.label) })}
            description={reason}
            action={
              <button type="button" className="btn btn-sm" onClick={() => navigate('data')}>
                {t('Open {page}', { page: t('Data') })}
              </button>
            }
          />
        </Card>
      </div>
    </Section>
  );
}
