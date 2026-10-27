import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Callout, Card, Spinner } from '../../components/ui';
import { t, tp } from '../../i18n';
import { CARD_AS_OF, CARD_SOURCE } from '../../lib/pricing/card';
import { fmtInt } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { fmtIsoDay } from '../licenses/model';
import { FIELD_LABEL, applyLivePrices, checkLivePrices, type LiveCheck } from './livePrices';

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'done'; check: LiveCheck; applied: number | null };

const SHOWN = 12;

/** Compares the built-in price card with the live GitHub Docs page and can apply the new prices to the models in the report. */
export function LivePriceCheck({ reportModels }: { reportModels: string[] }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const run = async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setState({ kind: 'loading' });
    try {
      const check = await checkLivePrices(controller.signal);
      if (!controller.signal.aborted) setState({ kind: 'done', check, applied: null });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  const apply = (check: LiveCheck) => {
    const { settings, updateSettings } = useApp.getState();
    const { overrides, count } = applyLivePrices(reportModels, check.live, settings.modelOverrides);
    if (count > 0) updateSettings({ modelOverrides: overrides });
    setState({ kind: 'done', check, applied: count });
  };

  return (
    <Card
      title={t('Check the live prices')}
      subtitle={t('The price card in the app is from {date}. Compare it with the GitHub Docs page to find new or changed prices.', { date: fmtIsoDay(CARD_AS_OF) })}
      actions={
        <button type="button" className="btn btn-sm" disabled={state.kind === 'loading'} onClick={() => void run()}>
          {state.kind === 'loading' ? <Spinner size={13} /> : <RefreshCw size={13} aria-hidden />} {t('Check GitHub Docs')}
        </button>
      }
    >
      <p className="text-xs text-fg-muted">
        {t('The app downloads the public page and sends nothing. Your data stays in this browser.')}{' '}
        <a className="text-accent hover:underline" href={CARD_SOURCE} target="_blank" rel="noreferrer">
          {t('Open the GitHub Docs page')}
        </a>
      </p>

      {state.kind === 'error' ? (
        <Callout tone="bad" className="mt-3" title={t('The live prices could not be read')}>
          <span dir="ltr">{state.message}</span> {t('Check the connection, or compare the prices by hand on the GitHub Docs page.')}
        </Callout>
      ) : null}

      {state.kind === 'done' ? <Result check={state.check} applied={state.applied} reportModels={reportModels} onApply={() => apply(state.check)} /> : null}
    </Card>
  );
}

function Result({ check, applied, reportModels, onApply }: { check: LiveCheck; applied: number | null; reportModels: string[]; onApply: () => void }) {
  const total = check.changed + check.added + check.missing;
  if (total === 0) {
    return (
      <Callout tone="good" className="mt-3">
        {t('The price card matches the GitHub Docs page.')}
      </Callout>
    );
  }
  const shown = check.diffs.slice(0, SHOWN);
  return (
    <div className="mt-3 space-y-2 text-sm" aria-live="polite">
      <p>
        {t('{list}.', {
          list: [
            tp(check.changed, '{n} model has a changed price or tier', '{n} models have a changed price or tier', { n: fmtInt(check.changed) }),
            tp(check.added, '{n} model is new on the page', '{n} models are new on the page', { n: fmtInt(check.added) }),
            tp(check.missing, '{n} model is no longer on the page', '{n} models are no longer on the page', { n: fmtInt(check.missing) }),
          ].join(t(', ')),
        })}
      </p>
      <ul className="space-y-0.5 text-xs text-fg-muted">
        {shown.map((difference) => (
          <li key={`${difference.kind}:${difference.name}`}>
            <span className="font-medium text-fg" dir="ltr">
              {difference.name}
            </span>
            {': '}
            {difference.kind === 'new'
              ? t('New on the page')
              : difference.kind === 'missing'
                ? t('No longer on the page')
                : t('Changed: {fields}', { fields: difference.fields.map((field) => t(FIELD_LABEL[field])).join(t(', ')) })}
          </li>
        ))}
      </ul>
      {check.diffs.length > SHOWN ? <p className="text-xs text-fg-subtle">{t('And {n} more.', { n: fmtInt(check.diffs.length - SHOWN) })}</p> : null}
      {check.warnings > 0 ? (
        <p className="text-xs text-warn">{tp(check.warnings, '{n} row of the page could not be read.', '{n} rows of the page could not be read.', { n: fmtInt(check.warnings) })}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-border-muted pt-2">
        <button type="button" className="btn btn-sm btn-primary" disabled={reportModels.length === 0} onClick={onApply}>
          {t('Use the live prices for the models in this report')}
        </button>
        <span className="text-xs text-fg-muted">
          {applied === null
            ? reportModels.length === 0
              ? t('Load a report to apply the live prices.')
              : t('Saved as price changes below. You can remove them at any time.')
            : applied === 0
              ? t('The models in this report already use these prices.')
              : tp(applied, 'Saved new prices for {n} model.', 'Saved new prices for {n} models.', { n: fmtInt(applied) })}
        </span>
      </div>
    </div>
  );
}
