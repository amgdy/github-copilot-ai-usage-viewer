import { t } from '../../i18n';

/** Users below this share of their included credits count as under-using their seat. */
export const LOW_UTILIZATION = 0.2;

const MAX_CURVE_POINTS = 400;

const finite = (xs: readonly number[]): number[] => xs.filter((x) => Number.isFinite(x));

export interface TopShare {
  /** Users in the top group and the number of users compared. */
  k: number;
  n: number;
  /** Share of all usage made by the top group (0 to 1), NaN without usage. */
  share: number;
}

/** Share of usage made by the largest `fraction` of users (at least one user). */
export function topShare(gross: readonly number[], fraction: number): TopShare {
  const v = finite(gross).sort((a, b) => b - a);
  const n = v.length;
  const total = v.reduce((a, b) => a + b, 0);
  if (n === 0 || total <= 0) return { k: 0, n, share: Number.NaN };
  const k = Math.min(n, Math.max(1, Math.ceil(n * fraction - 1e-9)));
  let top = 0;
  for (let i = 0; i < k; i++) top += v[i];
  return { k, n, share: top / total };
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
  const v = finite(gross)
    .filter((g) => g >= 0)
    .sort((a, b) => b - a);
  const n = v.length;
  const total = v.reduce((a, b) => a + b, 0);
  if (n === 0 || total <= 0) return null;

  // cum[i] is the share of usage made by the i biggest users.
  const cum = new Float64Array(n + 1);
  let run = 0;
  for (let i = 0; i < n; i++) {
    cum[i] = run / total;
    run += v[i];
  }
  cum[n] = 1;

  const step = Math.max(1, Math.ceil(n / MAX_CURVE_POINTS));
  const curve: [number, number][] = [];
  for (let i = 0; i < n; i += step) curve.push([i / n, cum[i]]);
  curve.push([1, 1]);

  let a = 0;
  while (a < n && cum[a] < pareto.a) a++;
  let b = a;
  while (b < n && cum[b] < pareto.b) b++;

  // Gini on the ascending order: sum((2i - n - 1) x_i) / (n * sum(x)), scaled so that one user holding everything gives 1.
  let weighted = 0;
  for (let i = 0; i < n; i++) weighted += (2 * (n - i) - n - 1) * v[i];
  const gini = n > 1 ? Math.max(0, Math.min(1, (weighted / (n * total)) * (n / (n - 1)))) : Number.NaN;

  return {
    n,
    curve,
    gini,
    edges: { a: a / n, b: b / n },
    classes: {
      A: { users: a, share: cum[a] },
      B: { users: b - a, share: cum[b] - cum[a] },
      C: { users: n - b, share: 1 - cum[b] },
    },
    top: (fraction) => {
      const k = Math.min(n, Math.max(1, Math.ceil(n * fraction - 1e-9)));
      return { k, n, share: cum[k] };
    },
  };
}

/** The strength of the concentration a Gini coefficient stands for, in the reader's language. '' when it is not a number. */
export function giniLabel(g: number): string {
  if (!Number.isFinite(g)) return '';
  if (g < 0.3) return t('Low concentration');
  if (g < 0.5) return t('Moderate concentration');
  if (g < 0.7) return t('High concentration');
  return t('Very high concentration');
}
