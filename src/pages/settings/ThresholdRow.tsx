import { type ReactNode } from 'react';

interface ThresholdRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** Shown next to the label, for example a live count. */
  aside?: ReactNode;
  /** Small text under the input, for example the default value. */
  hint?: ReactNode;
  /** The input column. */
  children?: ReactNode;
}

/** One setting: name and plain-language description on the left, the input on the right. */
export function ThresholdRow({ label, description, aside, hint, children }: ThresholdRowProps) {
  return (
    <div className="grid gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
          {label}
          {aside}
        </div>
        {description ? <p className="mt-0.5 text-xs text-fg-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">
        {children}
        {hint ? <p className="mt-1 text-[11px] text-fg-subtle">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Swatch({ color }: { color: string }) {
  return <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />;
}

/** A group heading inside a card. */
export function GroupTitle({ children }: { children: ReactNode }) {
  return <h4 className="border-b border-border-muted pb-1.5 pt-1 text-xs font-semibold text-fg-muted">{children}</h4>;
}
