import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { Card } from '../../components/ui';
import { t } from '../../i18n';
import { buildInsights, type LensData } from './lenses';

export function Insights({ data }: { data: LensData }) {
  const items = useMemo(() => buildInsights(data), [data]);
  return (
    <Card title={t('What stands out')} calc="segment-insights" className="h-full">
      <ul className="space-y-3 text-sm">
        {items.map((text) => (
          <li key={text} className="flex gap-2.5">
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span className="num min-w-0">{text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
