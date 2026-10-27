import { Badge } from './Badge';
import { DocLinks } from './DocLinks';
import type { Tone } from './Primitives';
import { cx } from './cx';
import { metricDoc } from '../../lib/metrics/registry';
import { describeSetting } from '../../lib/metrics/settingRefs';
import { BASIS_HELP, BASIS_LABEL, type MetricBasis, type MetricDoc } from '../../lib/metrics/types';
import { t } from '../../i18n';
import { useEffectiveSettings } from '../../state/analysis';
import type { ReactNode } from 'react';

export const BASIS_TONE: Record<MetricBasis, Tone> = { reported: 'neutral', calculated: 'info', estimated: 'warn' };

/** Where the explanation of a metric lives in the Methodology page. */
export const methodologyHref = (id: string): string => `#/methodology/${id}`;

function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1">{label}</div>
      {children}
    </div>
  );
}

/** The title and badge are left out when `showTitle` is false: the Methodology page shows them in the row above. */
export function CalcDetails({ doc, showTitle = true, className }: { doc: MetricDoc; showTitle?: boolean; className?: string }) {
  const settings = useEffectiveSettings();
  const related = (doc.related ?? []).map(metricDoc).filter((relatedDoc): relatedDoc is MetricDoc => relatedDoc !== undefined);
  return (
    <div className={cx('space-y-2.5 text-xs leading-snug text-fg', className)}>
      {showTitle ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="min-w-0 wrap-anywhere text-sm font-semibold">{t(doc.title)}</h4>
          <Badge tone={BASIS_TONE[doc.basis]} title={t(BASIS_HELP[doc.basis])}>
            {t(BASIS_LABEL[doc.basis])}
          </Badge>
        </div>
      ) : null}
      <p className="wrap-anywhere text-fg-muted">{t(doc.meaning)}</p>
      <Part label={t('How it is calculated')}>
        <p className="wrap-anywhere rounded-md border border-border-muted bg-surface-2 px-2 py-1.5 font-mono text-[11.5px] leading-relaxed">{t(doc.formula)}</p>
        {doc.steps?.length ? (
          <ol className="mt-1.5 list-decimal space-y-1 ps-4 marker:text-fg-subtle">
            {doc.steps.map((step, index) => (
              <li key={index} className="wrap-anywhere">
                {t(step)}
              </li>
            ))}
          </ol>
        ) : null}
      </Part>
      {doc.example ? (
        <Part label={t('Example')}>
          <p className="wrap-anywhere text-fg-muted">{t(doc.example)}</p>
        </Part>
      ) : null}
      {doc.columns?.length ? (
        <Part label={t('Columns of the report used')}>
          <div className="flex flex-wrap gap-1" dir="ltr">
            {doc.columns.map((column) => (
              <code key={column} className="rounded border border-border-muted bg-surface-2 px-1 py-0.5 font-mono text-[11px]">
                {column}
              </code>
            ))}
          </div>
        </Part>
      ) : null}
      {doc.settings?.length ? (
        <Part label={t('Settings that change it')}>
          <ul className="space-y-0.5">
            {doc.settings.map((ref) => {
              const setting = describeSetting(ref, settings);
              return (
                <li key={ref} className="wrap-anywhere">
                  <span className="font-medium">{t(setting.label)}:</span> <span className="text-fg-muted">{setting.value}</span>
                </li>
              );
            })}
          </ul>
        </Part>
      ) : null}
      {doc.notes?.length ? (
        <Part label={t('Good to know')}>
          <ul className="list-disc space-y-1 ps-4 text-fg-muted marker:text-fg-subtle">
            {doc.notes.map((note, index) => (
              <li key={index} className="wrap-anywhere">
                {t(note)}
              </li>
            ))}
          </ul>
        </Part>
      ) : null}
      {related.length ? (
        <Part label={t('See also')}>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {related.map((relatedDoc) => (
              <a key={relatedDoc.id} className="text-accent hover:underline" href={methodologyHref(relatedDoc.id)}>
                {t(relatedDoc.title)}
              </a>
            ))}
          </div>
        </Part>
      ) : null}
      {doc.links?.length ? (
        <Part label={t('Official guidance')}>
          <DocLinks ids={doc.links} />
        </Part>
      ) : null}
    </div>
  );
}
