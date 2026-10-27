import { ExternalLink } from 'lucide-react';
import { Badge, CalcInfo } from '../../components/ui';
import { t } from '../../i18n';
import { LEVER_META } from '../../lib/analytics/levers';
import { pluralize } from '../../lib/utils/format';
import type { PlaybookEntry } from './plan';
import { MIN_EFFECT, fmtMoney } from './scenario';

/** One habit: why it matters, what to do, what the matching lever is worth here, and the documentation. Everything is open so it prints. */
export function PlaybookItemCard({ entry }: { entry: PlaybookEntry }) {
  const { item, saving, noEffect, shared } = entry;
  const lever = item.lever;
  const measured = saving !== null && saving >= MIN_EFFECT;
  const leverName = lever ? t(LEVER_META[lever].label) : '';

  return (
    <li className="card flex min-w-0 flex-col gap-2.5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
        <h3 className="min-w-0 text-sm font-semibold">{t(item.title)}</h3>
        {lever && measured ? (
          <span className="inline-flex items-center gap-1">
            <Badge
              tone="neutral"
              className="num whitespace-nowrap"
              title={t('Usage that the "{lever}" lever avoids on its own, per month. Whether it saves cash depends on the pool.', { lever: leverName })}
            >
              {t('≈ {amount}/mo less usage', { amount: fmtMoney(saving) })}
            </Badge>
            <CalcInfo id="rec-playbook-saving" />
          </span>
        ) : null}
      </div>

      <p className="text-sm text-fg-muted">{t(item.why)}</p>

      <div>
        <div className="label">{t('What to do')}</div>
        <ul className="list-disc space-y-1 ps-4 text-sm">
          {item.how.map((step) => (
            <li key={step}>{t(step)}</li>
          ))}
        </ul>
      </div>

      {lever ? (
        <p className="text-xs text-fg-muted">
          {measured
            ? shared > 0
              ? t('Saving of the "{lever}" lever on its own, shared with {habits}.', { lever: leverName, habits: pluralize(shared, 'other habit') })
              : t('Saving of the "{lever}" lever on its own.', { lever: leverName })
            : `${t('No saving found for this habit in this report.')} ${noEffect ?? ''}`.trim()}
        </p>
      ) : null}

      {item.docs.length ? (
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
          {item.docs.map((d) => (
            <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
              <ExternalLink size={12} />
              {t(d.label)}
            </a>
          ))}
        </div>
      ) : null}
    </li>
  );
}
