import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy, Filter } from 'lucide-react';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtInt } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { drill } from '../../state/router';
import { useApp } from '../../state/store';
import { buildUserSummary, copyText } from './summary';

interface CopyResult {
  id: number;
  ok: boolean;
}

/** Filter, copy and step through the users of the current ranking. */
export function UserFooter({ p }: { p: UserProfile }) {
  const { analysis, settings, taxonomy } = useAnalysis();
  const [copied, setCopied] = useState<CopyResult | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const order = useMemo(() => (analysis.users.profiles.includes(p) ? analysis.users.profiles : analysis.population.profiles), [analysis, p]);
  const index = order.indexOf(p);
  const previous = index > 0 ? order[index - 1] : undefined;
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined;

  const status = copied && copied.id === p.id ? (copied.ok ? 'done' : 'failed') : 'idle';
  const copyLabel = status === 'done' ? t('Copied') : status === 'failed' ? t('Copy failed') : t('Copy summary');

  const onCopy = async () => {
    const ok = await copyText(buildUserSummary({ p, analysis, settings, taxonomy }));
    setCopied({ id: p.id, ok });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2500);
  };

  const filterToUser = () => {
    drill({ users: [p.name] }, { merge: true });
    useApp.getState().selectUser(null);
  };

  const go = (target: UserProfile | undefined) => {
    if (target) useApp.getState().selectUser(target.id);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={filterToUser}>
          <Filter size={14} aria-hidden />
          {t('Filter everything to this user')}
        </button>
        <button type="button" className="btn btn-sm" onClick={onCopy}>
          {status === 'done' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copyLabel}
        </button>
        <span className="sr-only" role="status">
          {status === 'done' ? t('Summary copied to the clipboard') : status === 'failed' ? t('The summary could not be copied') : ''}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => go(previous)}
          disabled={!previous}
          aria-label={previous ? t('Previous user: {name}', { name: previous.name }) : t('Previous user')}
          title={previous ? t('Previous user: {name}', { name: previous.name }) : t('This is the first user')}
        >
          <ChevronLeft size={16} aria-hidden className="rtl:-scale-x-100" />
        </button>
        <span className="num min-w-[4.5rem] text-center text-xs text-fg-muted">
          {index >= 0 ? t('{i} of {n}', { i: fmtInt(index + 1), n: fmtInt(order.length) }) : '–'}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => go(next)}
          disabled={!next}
          aria-label={next ? t('Next user: {name}', { name: next.name }) : t('Next user')}
          title={next ? t('Next user: {name}', { name: next.name }) : t('This is the last user')}
        >
          <ChevronRight size={16} aria-hidden className="rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
}
