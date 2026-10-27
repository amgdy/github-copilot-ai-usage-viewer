import { useMemo } from 'react';
import type { UserProfile } from '../../lib/analytics/users';
import { useAnalysis } from '../../state/analysis';
import { median } from './shared';

export interface PopulationMedians {
  users: number;
  autoShare: number;
  cacheHit: number;
  costPerActiveDay: number;
  activeRate: number;
}

export function populationMedians(profiles: readonly UserProfile[]): PopulationMedians {
  return {
    users: profiles.length,
    autoShare: median(profiles.map((p) => (p.gross > 0 ? p.autoShare : Number.NaN))),
    cacheHit: median(profiles.map((p) => p.cacheHit)),
    costPerActiveDay: median(profiles.map((p) => p.costPerActiveDay)),
    activeRate: median(profiles.map((p) => p.activeRate)),
  };
}

/** Medians over every user of the current row filters, whatever the segment filters say. */
export function usePopulationMedians(): PopulationMedians {
  const profiles = useAnalysis().analysis.population.profiles;
  return useMemo(() => populationMedians(profiles), [profiles]);
}
