import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../components/ui';
import { isRtl } from '../../i18n';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  /** Small number shown next to the label. */
  count?: number;
}

export const tabId = (prefix: string, id: string): string => `${prefix}-tab-${id}`;
export const panelId = (prefix: string): string => `${prefix}-panel`;

/** Accessible tab list: arrow keys, Home and End move between tabs. Render the matching `role="tabpanel"` yourself. */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix,
  label,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  idPrefix: string;
  label: string;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // The arrow that points to the next tab follows the reading direction.
    const forward = isRtl() ? 'ArrowLeft' : 'ArrowRight';
    const back = isRtl() ? 'ArrowRight' : 'ArrowLeft';
    let next: number;
    if (e.key === forward) next = (index + 1) % tabs.length;
    else if (e.key === back) next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const target = tabs[next];
    onChange(target.id);
    refs.current.get(target.id)?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="mb-4 flex gap-1 overflow-x-auto border-b border-border print:hidden">
      {tabs.map((tab, i) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) refs.current.set(tab.id, el);
              else refs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.id)}
            aria-selected={active}
            aria-controls={panelId(idPrefix)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              '-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:border-border hover:text-fg',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined ? <span className="num rounded-xs bg-surface-3 px-1 text-[11px] font-normal text-fg-muted">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
