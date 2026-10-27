import { Fragment } from 'react';
import { Lock } from 'lucide-react';
import { t, tp } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { navigate, useRoute, type PageId } from '../../state/router';
import { useApp } from '../../state/store';
import { BrandMark } from '../icons/BrandMark';
import { cx } from '../ui/cx';
import { groupLabel, NAV, NAV_GROUPS } from './nav';

/** The app name with its mark. The sidebar, the mobile menu and the start page show it. */
export function Brand({ className }: { className?: string }) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <BrandMark size={28} className="shrink-0 text-fg" />
      <div className="min-w-0 leading-none">
        <div className="text-[11px] font-medium text-fg-muted">{t('GitHub Copilot')}</div>
        <div className="font-display mt-1 truncate text-[15px] text-fg">{t('Usage report')}</div>
      </div>
    </div>
  );
}

/** The page list, shared by the desktop sidebar and the mobile drawer. */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const page = useRoute();
  const { analysis } = useAnalysis();
  const actionable = analysis.recs.filter((recommendation) => recommendation.severity === 'critical' || recommendation.severity === 'high').length;
  const go = (id: PageId) => {
    navigate(id);
    onNavigate?.();
  };
  return (
    <nav className="flex flex-col gap-px px-3" aria-label={t('Report sections')}>
      {NAV_GROUPS.map((group) => (
        <Fragment key={group}>
          <div className="eyebrow mb-1 mt-5 px-2 first:mt-0">{groupLabel(group)}</div>
          {NAV.filter((item) => item.group === group).map((item) => {
            const active = page === item.id;
            const Icon = item.Icon;
            return (
              <a
                key={item.id}
                href={`#/${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.id);
                }}
                aria-current={active ? 'page' : undefined}
                title={t(item.hint)}
                className={cx(
                  'relative flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                  active ? 'bg-surface font-semibold text-fg ring-1 ring-border' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
                )}
              >
                {active ? <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-xs bg-accent" aria-hidden /> : null}
                <Icon size={16} strokeWidth={1.75} className={cx('shrink-0', active ? 'text-accent' : 'text-fg-subtle')} aria-hidden />
                <span className="flex-1 truncate">{t(item.label)}</span>
                {item.id === 'recommendations' && actionable > 0 ? (
                  <span className="num rounded-xs border border-bad/40 px-1 text-[10px] font-semibold leading-4 text-bad" title={tp(actionable, '{n} urgent action', '{n} urgent actions')}>
                    {actionable}
                  </span>
                ) : null}
              </a>
            );
          })}
        </Fragment>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const setPickingData = useApp((state) => state.setPickingData);
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e border-border bg-bg lg:flex">
      <div className="px-5 pb-5 pt-4">
        <Brand />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <NavList />
      </div>
      <div className="space-y-2.5 border-t border-border p-4 text-[11px] text-fg-muted">
        <div className="flex items-start gap-1.5">
          <Lock size={12} className="mt-0.5 shrink-0" />
          <span>{t('Your file is read in this browser tab only. Nothing is uploaded.')}</span>
        </div>
        <button type="button" className="btn btn-sm w-full" onClick={() => setPickingData(true)}>
          {t('Load other data')}
        </button>
      </div>
    </aside>
  );
}
