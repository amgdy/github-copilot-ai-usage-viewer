import type { DataStore } from '../types';
import { dowOf, monthIndexOf } from '../utils/date';

export const BLANK_ID = 0;

export interface Prepared {
  /** Distinct plan labels derived from `total_monthly_quota`. */
  planLabels: string[];
  planOfRow: Uint8Array;
  /** Month slot (0-based) per day, indexed by `day - store.minDay`. */
  monthOfDay: Int32Array;
  dowOfDay: Uint8Array;
  firstMonth: number; // absolute month index (year*12+m0) of slot 0
  nMonths: number;
  nDays: number;
  /** First/last day a user appears anywhere in the data (ignores filters). */
  userFirstDay: Int32Array;
  userLastDay: Int32Array;
}

export function planLabel(quotaCredits: number): string {
  const quota = Math.round(quotaCredits);
  if (quota <= 0) return 'No quota';
  if (quota === 1900) return 'Business';
  if (quota === 3900) return 'Enterprise';
  return `Custom (${quota.toLocaleString('en-US')} credits)`;
}

export function prepareStore(store: DataStore): Prepared {
  const nDays = store.n ? store.maxDay - store.minDay + 1 : 0;
  const monthOfDay = new Int32Array(Math.max(nDays, 0));
  const dowOfDayArr = new Uint8Array(Math.max(nDays, 0));
  const firstMonth = store.n ? monthIndexOf(store.minDay) : 0;
  let lastMonth = firstMonth;
  for (let dayIndex = 0; dayIndex < nDays; dayIndex++) {
    const day = store.minDay + dayIndex;
    const month = monthIndexOf(day);
    monthOfDay[dayIndex] = month - firstMonth;
    lastMonth = month;
    dowOfDayArr[dayIndex] = dowOf(day);
  }

  const labelIndex = new Map<string, number>();
  const planLabels: string[] = [];
  const quotaToPlan = new Map<number, number>();
  const planOfRow = new Uint8Array(store.n);
  for (let i = 0; i < store.n; i++) {
    const quota = store.quota[i];
    let plan = quotaToPlan.get(quota);
    if (plan === undefined) {
      const label = planLabel(quota);
      let labelId = labelIndex.get(label);
      if (labelId === undefined) {
        labelId = planLabels.length;
        planLabels.push(label);
        labelIndex.set(label, labelId);
      }
      plan = labelId;
      quotaToPlan.set(quota, plan);
    }
    planOfRow[i] = plan;
  }

  const nUsers = store.dicts.user.values.length;
  const userFirstDay = new Int32Array(nUsers).fill(2_000_000_000);
  const userLastDay = new Int32Array(nUsers).fill(-1);
  for (let i = 0; i < store.n; i++) {
    const user = store.user[i];
    const day = store.day[i];
    if (day < userFirstDay[user]) userFirstDay[user] = day;
    if (day > userLastDay[user]) userLastDay[user] = day;
  }

  return {
    planLabels,
    planOfRow,
    monthOfDay,
    dowOfDay: dowOfDayArr,
    firstMonth,
    nMonths: store.n ? lastMonth - firstMonth + 1 : 0,
    nDays,
    userFirstDay,
    userLastDay,
  };
}
