import type { ReactNode } from 'react';

/** A small label above a control, for the control bars of the ranking and the scatter. */
export function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-fg-muted">{label}</span>
      {children}
    </div>
  );
}
