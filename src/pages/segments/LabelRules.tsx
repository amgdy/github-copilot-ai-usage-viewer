import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { CalcInfo, Section } from '../../components/ui';
import { t } from '../../i18n';
import { navigate } from '../../state/router';
import { LENSES, type LensId } from './lenses';
import { RULE_SUMMARY, RuleBlock, type RuleContext } from './RuleBlocks';

export function LabelRules({ current, context }: { current: LensId; context: RuleContext }) {
  const [open, setOpen] = useState<ReadonlySet<LensId>>(() => new Set([current]));
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setOpen((prev) => new Set(prev).add(current));
  }

  const sync = (id: LensId, isOpen: boolean) =>
    setOpen((prev) => {
      if (prev.has(id) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Section
      title={t('How the labels are decided')}
      description={t('The rules use the thresholds set in Settings, so the numbers below change when you change them.')}
      actions={
        <button type="button" className="btn btn-sm" onClick={() => navigate('settings')}>
          <SlidersHorizontal size={14} aria-hidden="true" />
          {t('Change thresholds')}
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        {LENSES.map((lens) => (
          <details key={lens.id} open={open.has(lens.id)} onToggle={(event) => sync(lens.id, event.currentTarget.open)} className="group card overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t(lens.label)}</span>
                <span className="block text-xs text-fg-muted">{t(RULE_SUMMARY[lens.id])}</span>
              </span>
              <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-subtle transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border-muted px-4 py-3">
              <RuleBlock lens={lens.id} c={context} />
              <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
                <CalcInfo id={lens.calc} />
                <span>{t('Formula, columns used and an example')}</span>
              </p>
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}
