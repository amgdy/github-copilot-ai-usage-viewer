import { useCallback, useEffect, useRef } from 'react';
import { t } from '../i18n';
import { useAnalysis } from '../state/analysis';
import { useApp } from '../state/store';
import { Drawer, EmptyState } from './ui';
import { AutoVsDirect } from './user/AutoVsDirect';
import { CompareBars } from './user/CompareBars';
import { DailyChart } from './user/DailyChart';
import { LicenseBlock } from './user/LicenseBlock';
import { ModelMix } from './user/ModelMix';
import { SavingsBars } from './user/SavingsBars';
import { userSubtitle } from './user/shared';
import { TipCards } from './user/TipCards';
import { TokensCard } from './user/TokensCard';
import { UserBadges } from './user/UserBadges';
import { UserFooter } from './user/UserFooter';
import { UserKpis } from './user/UserKpis';

/** Slide-over with everything about one user. Any page opens it with `useApp.getState().selectUser(id)`. */
export function UserDrawer() {
  const selected = useApp((s) => s.selectedUser);
  return selected === null ? null : <OpenDrawer id={selected} />;
}

function OpenDrawer({ id }: { id: number }) {
  const { analysis, store } = useAnalysis();
  const selectUser = useApp((s) => s.selectUser);
  const close = useCallback(() => selectUser(null), [selectUser]);
  const body = useRef<HTMLDivElement>(null);
  const p = analysis.population.byId.get(id);

  // The drawer focuses its panel first. A button is a better start for keyboard users.
  useEffect(() => {
    const close = t('Close');
    const buttons = body.current?.closest('[role="dialog"]')?.querySelectorAll<HTMLElement>('button[aria-label]') ?? [];
    for (const b of buttons) {
      if (b.getAttribute('aria-label') === close) {
        b.focus();
        break;
      }
    }
  }, []);

  useEffect(() => {
    const scroller = body.current?.parentElement;
    if (scroller) scroller.scrollTop = 0;
  }, [id]);

  const name = p?.name ?? store.dicts.user.values[id] ?? t('User');
  const subtitle = p ? userSubtitle(p) : '';

  return (
    <Drawer open onClose={close} title={name} subtitle={subtitle || undefined} footer={p ? <UserFooter p={p} /> : undefined}>
      <div ref={body} className="space-y-5 p-4">
        {p ? (
          <>
            <UserBadges p={p} />
            <UserKpis p={p} />
            {p.license ? <LicenseBlock license={p.license} /> : null}
            <DailyChart p={p} />
            <ModelMix p={p} />
            <AutoVsDirect p={p} />
            <TokensCard p={p} />
            <CompareBars p={p} />
            <TipCards p={p} />
            <SavingsBars p={p} />
          </>
        ) : (
          <EmptyState
            title={t('No usage for this user in the current view')}
            description={t('The date range or the filters leave out every row for this user. Reset the filters to see them again.')}
            action={
              <button type="button" className="btn btn-sm" onClick={() => useApp.getState().resetFilters()}>
                {t('Reset all filters')}
              </button>
            }
          />
        )}
      </div>
    </Drawer>
  );
}
