import { AutoByModel } from './AutoByModel';
import { AutoPlanRates } from './AutoRates';
import { AutoSelection } from './AutoSelection';
import type { ModelRow } from './data';

/** The Auto section of the Models page: who picks models by hand, the discount rate of each plan, and the discount of each model. */
export function AutoCard({ rows }: { rows: ModelRow[] }) {
  return (
    <div className="space-y-4">
      <AutoSelection />
      <AutoPlanRates />
      <AutoByModel rows={rows} />
    </div>
  );
}
