import { useContext, useEffect, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Section } from '../../components/ui';
import { t } from '../../i18n';
import { PageEpoch } from './epoch';
import { SECTIONS, domId, type SectionId } from './sections';

interface ResetButtonProps {
  onReset: () => void;
  label?: string;
  /** When set, a first click asks this question and a second click confirms. */
  confirm?: string;
  /** Text of the confirming button. */
  yes?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function ResetButton({ onReset, label, confirm, yes, icon, disabled }: ResetButtonProps) {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const timer = window.setTimeout(() => setAsking(false), 5000);
    return () => window.clearTimeout(timer);
  }, [asking]);

  if (asking) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5" role="group" aria-label={t('Confirm')}>
        <span className="text-xs text-fg-muted">{confirm}</span>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => {
            setAsking(false);
            onReset();
          }}
        >
          {yes ?? t('Yes, reset')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setAsking(false)}>
          {t('Cancel')}
        </button>
      </span>
    );
  }
  return (
    <button type="button" className="btn btn-sm btn-ghost" disabled={disabled} onClick={() => (confirm ? setAsking(true) : onReset())}>
      {icon ?? <RotateCcw size={13} aria-hidden />} {label ?? t('Reset section to defaults')}
    </button>
  );
}

interface SettingsSectionProps {
  id: SectionId;
  /** Translated heading. Defaults to the title of the section in SECTIONS. */
  title?: string;
  description: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  confirmReset?: string;
  children: ReactNode;
}

/** Anchor target for the in-page navigation. Resetting also remounts the inputs so stale drafts disappear. */
export function SettingsSection({ id, title, description, onReset, resetLabel, confirmReset, children }: SettingsSectionProps) {
  const [epoch, setEpoch] = useState(0);
  const page = useContext(PageEpoch);
  const heading = title ?? t(SECTIONS.find((section) => section.id === id)?.title ?? '');
  return (
    <div id={domId(id)} className="scroll-mt-24 lg:scroll-mt-4">
      <Section
        title={heading}
        description={description}
        actions={
          onReset ? (
            <ResetButton
              label={resetLabel}
              confirm={confirmReset}
              onReset={() => {
                onReset();
                setEpoch((previous) => previous + 1);
              }}
            />
          ) : undefined
        }
      >
        <div key={`${page}.${epoch}`} className="space-y-4">
          {children}
        </div>
      </Section>
    </div>
  );
}
