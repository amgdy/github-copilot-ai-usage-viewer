import { type ReactNode } from 'react';
import { CalcInfo, CalcLine, type CalcRef } from '../ui';

interface DrawerSectionProps {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  /** Id (or ids) of the explanation of how the numbers in this section are calculated. */
  calc?: CalcRef;
  children: ReactNode;
}

export function DrawerSection({ title, description, aside, calc, children }: DrawerSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          {calc ? <CalcInfo id={calc} /> : null}
        </h3>
        {aside ? <div className="text-xs text-fg-muted">{aside}</div> : null}
      </div>
      {description ? <p className="text-xs text-fg-muted">{description}</p> : null}
      <CalcLine id={calc} />
      {children}
    </section>
  );
}
