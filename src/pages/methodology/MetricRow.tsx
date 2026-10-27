import { ChevronRight } from 'lucide-react';
import { Badge, CalcDetails, cx } from '../../components/ui';
import { BASIS_TONE } from '../../components/ui/CalcDetails';
import { t } from '../../i18n';
import { BASIS_HELP, BASIS_LABEL, type MetricDoc } from '../../lib/metrics/types';

export const elementId = (id: string): string => `metric-${id}`;

/** One explanation: the name and the formula in a line, and the full text when opened. */
export function MetricRow({ doc, open, highlighted, onToggle }: { doc: MetricDoc; open: boolean; highlighted: boolean; onToggle: () => void }) {
  const panel = `${elementId(doc.id)}-details`;
  return (
    <li id={elementId(doc.id)} className={cx('scroll-mt-4 rounded-lg border bg-surface transition-colors', highlighted ? 'border-accent ring-2 ring-accent/30' : 'border-border-muted')}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panel} className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-start hover:bg-surface-2">
        <ChevronRight size={15} className={cx('mt-0.5 shrink-0 text-fg-subtle transition-transform', open ? 'rotate-90' : 'rtl:-scale-x-100')} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium wrap-anywhere">{t(doc.title)}</span>
            <Badge tone={BASIS_TONE[doc.basis]} title={t(BASIS_HELP[doc.basis])}>
              {t(BASIS_LABEL[doc.basis])}
            </Badge>
          </span>
          {open ? null : <span className="mt-0.5 block font-mono text-[11.5px] leading-snug text-fg-muted wrap-anywhere line-clamp-2">{t(doc.formula)}</span>}
        </span>
      </button>
      {open ? (
        <div id={panel} className="border-t border-border-muted px-3 pb-3 ps-9 pt-2.5">
          <CalcDetails doc={doc} showTitle={false} />
        </div>
      ) : null}
    </li>
  );
}
