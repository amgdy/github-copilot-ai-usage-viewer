import { t } from '../../i18n';

/** Users below this share of their included credits count as under-using their seat. */
export const LOW_UTILIZATION = 0.2;

const MAX_CURVE_POINTS = 400;

const finite = (values: readonly number[]): number[] => values.filter((value) => Number.isFinite(value));

export interface TopShare {
  /** Users in the top group and the number of users compared. */
  k: number;
  n: number;
  /** Share of all usage made by the top group (0 to 1), NaN without usage. */
  share: number;
}

/** Share of usage made by the largest `fraction` of users (at least one user). */
export function topShare(gross: readonly number[], fraction: number): TopShare {
  const sortedGross = finite(gross).sort((a, b) => b - a);
  const userCount = sortedGross.length;
  const total = sortedGross.reduce((a, b) => a + b, 0);
  if (userCount === 0 || total <= 0) return { k: 0, n: userCount, share: Number.NaN };
  const topCount = Math.min(userCount, Math.max(1, Math.ceil(userCount * fraction - 1e-9)));
  let top = 0;
  for (let i = 0; i < topCount; i++) top += sortedGross[i];
  return { k: topCount, n: userCount, share: top / total };
}

export interface ClassSummary {
  users: number;
  /** Share of all usage made by the users of this class (0 to 1). */
  share: number;
}

export interface Concentration {
  n: number;
  /** Lorenz-style curve: share of users (x) and cumulative share of usage (y), biggest users first. */
  curve: [number, number][];
  /** 0 when everyone uses the same amount, 1 when one person uses everything. NaN for fewer than two users. */
  gini: number;
  /** Share of users at which classes A and B end. */
  edges: { a: number; b: number };
  classes: { A: ClassSummary; B: ClassSummary; C: ClassSummary };
  top: (fraction: number) => TopShare;
}

/**
 * Cumulative usage curve of the users, with the A/B/C class cut-offs. The class of a user is decided by the
 * cumulative share before adding the user, as in the user profiles, so the user who crosses a cut-off stays in the higher class.
 */
export function concentration(gross: readonly number[], pareto: { a: number; b: number }): Concentration | null {
  const sortedGross = finite(gross)
    .filter((amount) => amount >= 0)
    .sort((a, b) => b - a);
  const userCount = sortedGross.length;
  const total = sortedGross.reduce((a, b) => a + b, 0);
  if (userCount === 0 || total <= 0) return null;

  // cum[i] is the share of usage made by the i biggest users.
  const cumulativeShare = new Float64Array(userCount + 1);
  let run = 0;
  for (let i = 0; i < userCount; i++) {
    cumulativeShare[i] = run / total;
    run += sortedGross[i];
  }
  cumulativeShare[userCount] = 1;

  const step = Math.max(1, Math.ceil(userCount / MAX_CURVE_POINTS));
  const curve: [number, number][] = [];
  for (let i = 0; i < userCount; i += step) curve.push([i / userCount, cumulativeShare[i]]);
  curve.push([1, 1]);

  let classAEnd = 0;
  while (classAEnd < userCount && cumulativeShare[classAEnd] < pareto.a) classAEnd++;
  let classBEnd = classAEnd;
  while (classBEnd < userCount && cumulativeShare[classBEnd] < pareto.b) classBEnd++;

  // Gini on the ascending order: sum((2i - n - 1) x_i) / (n * sum(x)), scaled so that one user holding everything gives 1.
  let weighted = 0;
  for (let i = 0; i < userCount; i++) weighted += (2 * (userCount - i) - userCount - 1) * sortedGross[i];
  const gini = userCount > 1 ? Math.max(0, Math.min(1, (weighted / (userCount * total)) * (userCount / (userCount - 1)))) : Number.NaN;

  return {
    n: userCount,
    curve,
    gini,
    edges: { a: classAEnd / userCount, b: classBEnd / userCount },
    classes: {
      A: { users: classAEnd, share: cumulativeShare[classAEnd] },
      B: { users: classBEnd - classAEnd, share: cumulativeShare[classBEnd] - cumulativeShare[classAEnd] },
      C: { users: userCount - classBEnd, share: 1 - cumulativeShare[classBEnd] },
    },
    top: (fraction) => {
      const topCount = Math.min(userCount, Math.max(1, Math.ceil(userCount * fraction - 1e-9)));
      return { k: topCount, n: userCount, share: cumulativeShare[topCount] };
    },
  };
}

/** The strength of the concentration a Gini coefficient stands for, in the reader's language. '' when it is not a number. */
export function giniLabel(gini: number): string {
  if (!Number.isFinite(gini)) return '';
  if (gini < 0.3) return t('Low concentration');
  if (gini < 0.5) return t('Moderate concentration');
  if (gini < 0.7) return t('High concentration');
  return t('Very high concentration');
}
