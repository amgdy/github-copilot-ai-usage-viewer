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
    autoShare: median(profiles.map((user) => (user.gross > 0 ? user.autoShare : Number.NaN))),
    cacheHit: median(profiles.map((user) => user.cacheHit)),
    costPerActiveDay: median(profiles.map((user) => user.costPerActiveDay)),
    activeRate: median(profiles.map((user) => user.activeRate)),
  };
}

/** Medians over every user of the current row filters, whatever the segment filters say. */
export function usePopulationMedians(): PopulationMedians {
  const profiles = useAnalysis().analysis.population.profiles;
  return useMemo(() => populationMedians(profiles), [profiles]);
}
