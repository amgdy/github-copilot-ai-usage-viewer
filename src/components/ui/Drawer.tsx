import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { t } from '../../i18n';
import { cx } from './cx';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Edge the panel sits on. `end` is the right edge in English and the left edge in Arabic. */
  side?: 'start' | 'end';
  /** Tailwind width classes. */
  widthClass?: string;
  /** Extra header content (badges, buttons) shown after the title. */
  headerExtra?: ReactNode;
}

/** Modal slide-over panel. Closes on Escape or a click on the backdrop; restores focus on close. */
export function Drawer({ open, onClose, title, subtitle, children, footer, side = 'end', widthClass = 'w-[min(640px,100vw)]', headerExtra }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const previous = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement;
    panel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      if (previous.current instanceof HTMLElement) previous.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="anim-fade absolute inset-0" style={{ background: 'var(--overlay)' }} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cx(
          'anim-drawer absolute inset-y-0 flex max-w-full flex-col border-border bg-bg shadow-drawer outline-none',
          side === 'end' ? 'end-0 border-s' : 'drawer-start start-0 border-e',
          widthClass,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{title}</h2>
            {subtitle ? <div className="mt-0.5 text-xs text-fg-muted">{subtitle}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerExtra}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('Close')}>
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <footer className="border-t border-border bg-surface px-4 py-3">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
