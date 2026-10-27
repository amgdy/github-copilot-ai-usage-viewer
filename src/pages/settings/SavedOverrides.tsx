import { Trash2 } from 'lucide-react';
import { Card } from '../../components/ui';
import { t } from '../../i18n';
import type { ModelOverride, ModelOverrides } from '../../lib/pricing/models';
import { ratesText } from './models';

function summary(modelOverride: ModelOverride): string {
  const parts: string[] = [];
  if (modelOverride.category) parts.push(t('Tier {tier}', { tier: t(modelOverride.category) }));
  if (modelOverride.base) parts.push(ratesText(modelOverride.base));
  return parts.join(t('. ')) || t('No tier or price set');
}

interface SavedOverridesProps {
  overrides: ModelOverrides;
  /** Names to list: every saved override that is not shown in the report list. */
  names: string[];
  /** Whether a report is loaded. Changes the wording only. */
  hasReport: boolean;
  onRemove: (name: string) => void;
}

export function SavedOverrides({ overrides, names, hasReport, onRemove }: SavedOverridesProps) {
  if (names.length === 0) return null;
  return (
    <Card
      title={hasReport ? t('Saved changes for models that are not in this report') : t('Saved model changes')}
      subtitle={t('They stay in this browser. A saved price also applies when its model is used as a right-sizing target.')}
      padded={false}
    >
      <ul className="divide-y divide-border-muted">
        {names.map((name) => (
          <li key={name} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="min-w-0 flex-1 basis-48">
              <span className="block break-words text-sm font-medium" dir="ltr">
                {name}
              </span>
              <span className="num block text-xs text-fg-muted">{summary(overrides[name] ?? {})}</span>
            </span>
            <button type="button" className="btn btn-sm btn-ghost" aria-label={t('Remove the change for {model}', { model: name })} onClick={() => onRemove(name)}>
              <Trash2 size={13} aria-hidden /> {t('Remove')}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
