import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calculator } from 'lucide-react';
import { metricDoc } from '../../lib/metrics/registry';
import type { MetricDoc } from '../../lib/metrics/types';
import { useApp } from '../../state/store';
import { CalcDetails, methodologyHref } from './CalcDetails';
import { cx } from './cx';
import { t } from '../../i18n';

const PANEL_WIDTH = 400;
const EDGE = 8;

export type CalcRef = string | readonly string[];

/** The docs behind a `calc` prop. An id that is not registered is skipped (a test fails on it). */
export function docsOf(ref: CalcRef | undefined): MetricDoc[] {
  if (!ref) return [];
  const ids = typeof ref === 'string' ? [ref] : ref;
  return ids.map(metricDoc).filter((doc): doc is MetricDoc => doc !== undefined);
}

interface Placement {
  left: number;
  top: number;
  maxHeight: number;
}

/**
 * A small calculator icon that opens "how this is calculated" for a number: what it means, the formula, the columns and settings behind it.
 * The panel is drawn on the page body, so tables and cards that scroll or clip their content do not cut it off.
 */
export function CalcInfo({ id, className }: { id: CalcRef; className?: string }) {
  const docs = docsOf(id);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Placement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const label = docs.map((doc) => t(doc.title)).join(', ');
  const width = typeof window === 'undefined' ? PANEL_WIDTH : Math.min(PANEL_WIDTH, document.documentElement.clientWidth - 2 * EDGE);

  const measure = useCallback(() => {
    const button = trigger.current;
    const panelElement = panel.current;
    if (!button || !panelElement) return;
    const bounds = button.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = Math.min(PANEL_WIDTH, viewportWidth - 2 * EDGE);
    const left = Math.min(Math.max(bounds.left + bounds.width / 2 - panelWidth / 2, EDGE), viewportWidth - panelWidth - EDGE);
    const natural = panelElement.scrollHeight + 2;
    const below = viewportHeight - bounds.bottom - 6 - EDGE;
    const above = bounds.top - 6 - EDGE;
    const underneath = natural <= below || below >= above;
    const maxHeight = Math.max(160, Math.min(natural, underneath ? below : above));
    setPlace({ left, top: underneath ? bounds.bottom + 6 : Math.max(EDGE, bounds.top - 6 - maxHeight), maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (open) measure();
    else setPlace(null);
  }, [open, measure]);

  const placed = place !== null;
  useEffect(() => {
    if (open && placed) panel.current?.focus({ preventScroll: true });
  }, [open, placed]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const down = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close();
    };
    // Capture phase, so Escape closes this panel before it closes a drawer behind it.
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
      trigger.current?.focus();
    };
    const scroll = (event: Event) => {
      if (!panel.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key, true);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (!docs.length) return null;
  const heading = t('How this is calculated: {name}', { name: label });
  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-label={heading}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t('How this is calculated')}
        className={cx('no-print relative inline-flex shrink-0 rounded-full align-middle text-fg-subtle hover:text-accent focus-visible:text-accent', open && 'text-accent', className)}
      >
        <Calculator size={13} />
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              role="dialog"
              aria-label={heading}
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              style={{ width, left: place?.left ?? 0, top: place?.top ?? 0, maxHeight: place?.maxHeight, visibility: place ? 'visible' : 'hidden' }}
              className="anim-fade fixed z-[60] overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-3 text-start font-normal normal-case tracking-normal shadow-pop outline-none"
            >
              <div className="divide-y divide-border-muted">
                {docs.map((doc) => (
                  <CalcDetails key={doc.id} doc={doc} className="py-2.5 first:pt-0 last:pb-0" />
                ))}
              </div>
              <a className="mt-2 inline-block text-xs text-accent hover:underline" href={methodologyHref(docs[0].id)}>
                {t('Open in Methodology')}
              </a>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** One line per item: the name and the formula behind it. Shown only while "Show calculations" is on. */
export function CalcLegend({ items, className }: { items: { label: string; calc: CalcRef }[]; className?: string }) {
  const show = useApp((state) => state.showCalc);
  if (!show) return null;
  const rows = items.map((item) => ({ label: item.label, docs: docsOf(item.calc) })).filter((row) => row.docs.length);
  if (!rows.length) return null;
  return (
    <div className={cx('space-y-1 rounded-lg border border-border-muted bg-surface-2 px-3 py-2 text-[11px] leading-snug text-fg-subtle', className)}>
      {rows.map((row) => (
        <p key={row.label} className="wrap-anywhere">
          <span className="font-medium text-fg-muted">{row.label}:</span> <span className="font-mono">{row.docs.map((doc) => t(doc.formula)).join(' ; ')}</span>
        </p>
      ))}
    </div>
  );
}

/** The formulas of a metric as one muted line each. Shown only while "Show calculations" is on. */
export function CalcLine({ id, className }: { id: CalcRef | undefined; className?: string }) {
  const show = useApp((state) => state.showCalc);
  const docs = show ? docsOf(id) : [];
  if (!docs.length) return null;
  return (
    <div className={cx('space-y-0.5 text-[11px] leading-snug text-fg-subtle', className)}>
      {docs.map((doc) => (
        <p key={doc.id} className="flex gap-1 wrap-anywhere">
          <Calculator size={11} className="mt-px shrink-0" aria-hidden />
          <span className="min-w-0 font-mono">{t(doc.formula)}</span>
        </p>
      ))}
    </div>
  );
}
