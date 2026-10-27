import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../../components/ui';
import { t } from '../../i18n';
import { SECTIONS, SECTION_IDS, domId, type SectionId } from './sections';

function scrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const overflow = getComputedStyle(p).overflowY;
    if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') return p;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** Tracks which section is in view inside the page's own scroll container. */
export function useScrollSpy(): { active: SectionId; jump: (id: SectionId) => void } {
  const [active, setActive] = useState<SectionId>(SECTION_IDS[0]);
  const lockUntil = useRef(0);
  const refresh = useRef<() => void>(() => {});
  const settle = useRef(0);

  useEffect(() => {
    const first = document.getElementById(domId(SECTION_IDS[0]));
    if (!first) return;
    const scroller = scrollParent(first);
    const isRoot = scroller === document.scrollingElement || scroller === document.documentElement;
    const target: HTMLElement | Window = isRoot ? window : scroller;
    let frame = 0;

    const compute = () => {
      frame = 0;
      if (performance.now() < lockUntil.current) return;
      const top = isRoot ? 0 : scroller.getBoundingClientRect().top;
      let current: SectionId = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(domId(id));
        if (el && el.getBoundingClientRect().top - top <= 120) current = id;
      }
      const room = scroller.scrollHeight - scroller.clientHeight;
      if (room > 8 && scroller.scrollTop >= room - 4) current = SECTION_IDS[SECTION_IDS.length - 1];
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    refresh.current = schedule;
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    compute();
    return () => {
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle.current);
      refresh.current = () => {};
    };
  }, []);

  const jump = useCallback((id: SectionId) => {
    const el = document.getElementById(domId(id));
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    lockUntil.current = performance.now() + 900;
    setActive(id);
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => refresh.current(), 950);
  }, []);

  return { active, jump };
}

/**
 * In-page navigation. Buttons rather than "#" links, because the app routes on the URL hash.
 * A vertical sticky list on wide screens and a sticky horizontal scroller on narrow ones.
 */
export function SectionNav({ active, onJump }: { active: SectionId; onJump: (id: SectionId) => void }) {
  return (
    <nav
      aria-label={t('Settings sections')}
      className="sticky top-2 z-20 mb-4 overflow-x-auto rounded-lg border border-border bg-surface/95 p-1 shadow-card backdrop-blur lg:top-4 lg:mb-0 lg:overflow-visible lg:p-1.5"
    >
      <ul className="flex gap-1 lg:flex-col">
        {SECTIONS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                aria-current={on ? 'location' : undefined}
                onClick={() => onJump(id)}
                className={cx(
                  'flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-start text-sm transition-colors',
                  on ? 'bg-accent-soft font-medium text-accent' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
                )}
              >
                <Icon size={15} aria-hidden /> {t(label)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
