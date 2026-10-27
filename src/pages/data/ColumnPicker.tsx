import { Columns3 } from 'lucide-react';
import { Popover } from '../../components/ui';
import { t } from '../../i18n';
import type { ColumnId, ExplorerColumn } from './explorer';

interface Props {
  columns: ExplorerColumn[];
  hidden: ReadonlySet<ColumnId>;
  initialHidden: ReadonlySet<ColumnId>;
  onChange: (next: Set<ColumnId>) => void;
}

export function ColumnPicker({ columns, hidden, initialHidden, onChange }: Props) {
  const shown = columns.filter((c) => !hidden.has(c.id)).length;

  const toggle = (id: ColumnId) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <Popover
      trigger={(open, flip) => (
        <button type="button" className="btn btn-sm" onClick={flip} aria-expanded={open} aria-haspopup="true" title={t('Choose the columns to show')}>
          <Columns3 size={14} /> {t('Columns')}
          <span className="num text-fg-muted">
            {shown}/{columns.length}
          </span>
        </button>
      )}
    >
      <div className="max-h-72 min-w-48 overflow-auto p-1">
        {columns.map((c) => {
          const checked = !hidden.has(c.id);
          return (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-surface-3">
              <input
                type="checkbox"
                className="accent-[var(--accent)]"
                checked={checked}
                disabled={checked && shown === 1}
                onChange={() => toggle(c.id)}
              />
              <span className="truncate">{t(c.header)}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between gap-2 border-t border-border-muted px-1 pt-1.5">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(new Set())}>
          {t('Show all')}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(new Set(initialHidden))}>
          {t('Reset')}
        </button>
      </div>
    </Popover>
  );
}
