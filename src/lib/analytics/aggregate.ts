import type { DataStore } from '../types';
import { CATEGORIES } from '../types';
import type { ModelTable } from '../pricing/models';
import { VENDORS } from '../pricing/card';
import type { Prepared } from './prepare';
import { BLANK_ID } from './prepare';

export interface Measures {
  rows: Float64Array;
  gross: Float64Array;
  discount: Float64Array;
  net: Float64Array;
  credits: Float64Array;
  input: Float64Array;
  output: Float64Array;
  cacheRead: Float64Array;
  cacheWrite: Float64Array;
}

export const makeMeasures = (n: number): Measures => ({
  rows: new Float64Array(n),
  gross: new Float64Array(n),
  discount: new Float64Array(n),
  net: new Float64Array(n),
  credits: new Float64Array(n),
  input: new Float64Array(n),
  output: new Float64Array(n),
  cacheRead: new Float64Array(n),
  cacheWrite: new Float64Array(n),
});

export interface Totals {
  rows: number;
  gross: number;
  discount: number;
  net: number;
  credits: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  attributedGross: number;
  unattributedGross: number;
  users: number;
  /** Default-tier list cost of priced rows (USD) and the billed amount of those same rows. */
  listCost: number;
  pricedGross: number;
  unpricedGross: number;
  /** Conservative lower bound of the premium paid for long-context requests (USD). */
  longPremium: number;
  longPremiumRows: number;
  autoGross: number;
  /**
   * Auto rows whose original price is known from token counts and the price card: the original (list) price,
   * and the amount billed for the same rows. Standard-tier requests only. The difference is the Auto discount actually present in the file.
   */
  autoList: number;
  autoMeasuredGross: number;
  /** Estimated split of `pricedGross` by token type (USD). */
  est: { input: number; cacheRead: number; cacheWrite: number; output: number };
  tierGross: Float64Array; // indexed by CATEGORIES
}

export interface ExtraArrays {
  listCost: Float64Array;
  pricedGross: Float64Array;
  longPremium: Float64Array;
  autoGross: Float64Array;
  autoList: Float64Array;
  autoMeasuredGross: Float64Array;
}

export interface UserAcc extends ExtraArrays {
  gross: Float64Array;
  discount: Float64Array;
  net: Float64Array;
  credits: Float64Array;
  rows: Float64Array;
  input: Float64Array;
  output: Float64Array;
  cacheRead: Float64Array;
  cacheWrite: Float64Array;
  tier: Float64Array; // nU * 4, indexed by CATEGORIES
  estIn: Float64Array;
  estCr: Float64Array;
  estCw: Float64Array;
  estOut: Float64Array;
  firstDay: Int32Array;
  lastDay: Int32Array;
  org: Int32Array; // first non-blank org seen, -1 when none
  costCenter: Int32Array;
  orgMixed: Uint8Array;
  costCenterMixed: Uint8Array;
  quotaMax: Float32Array;
  recent: Float64Array; // gross in the final 7 days of the scope
  prior: Float64Array; // gross in the 7 days before that
  // day-grouped pass
  activeDays: Int32Array;
  peakDay: Float64Array;
  peakDayIdx: Int32Array;
  daysN: Int32Array;
  daysSum: Float64Array;
  daysSumSq: Float64Array;
}

export interface DaySeries extends Measures {
  activeUsers: Int32Array;
  anyUsers: Int32Array;
}

export type GroupedDim = 'model' | 'product' | 'org' | 'costCenter' | 'repo' | 'app';

export interface Aggregates {
  rowsIncluded: number;
  range: { start: number; end: number; length: number };
  /** First/last day that actually has rows in scope (NaN when empty). */
  firstDay: number;
  lastDay: number;
  totals: Totals;
  days: DaySeries;
  user: Measures;
  product: Measures;
  sku: Measures;
  model: Measures;
  org: Measures;
  app: Measures;
  repo: Measures;
  costCenter: Measures;
  file: Measures;
  selection: Measures; // [manual, auto]
  plan: Measures;
  dow: Measures;
  usersIn: Record<GroupedDim, Int32Array>;
  userAcc: UserAcc;
  modelExtra: ExtraArrays;
  /** nU × nM gross by user and model; null when too large. */
  userModel: Float32Array | null;
  nModels: number;
  /** nU × nMonths: largest monthly quota seen for the user within the month (credits). */
  monthQuota: Float32Array;
  /** nU × nMonths: gross spend per user and month. */
  userMonthGross: Float64Array;
  nMonths: number;
}

export interface AggregateOptions {
  /** A user counts as active on a day when their gross that day reaches this amount (USD). */
  activeThreshold: number;
  /** Detect "long context" premiums only when billed/list exceeds this ratio. */
  longRatio?: number;
}

class PairCounter {
  private dense: Uint8Array | null = null;
  private set: Set<number> | null = null;
  readonly counts: Int32Array;
  constructor(
    nU: number,
    private readonly nD: number,
  ) {
    this.counts = new Int32Array(nD);
    if (nU * nD <= 24_000_000) this.dense = new Uint8Array(nU * nD);
    else this.set = new Set();
  }
  add(u: number, d: number): void {
    const k = u * this.nD + d;
    if (this.dense) {
      if (this.dense[k] === 0) {
        this.dense[k] = 1;
        this.counts[d]++;
      }
    } else if (!this.set!.has(k)) {
      this.set!.add(k);
      this.counts[d]++;
    }
  }
}

function addRow(
  t: Measures,
  k: number,
  g: number,
  dsc: number,
  nt: number,
  q: number,
  tin: number,
  tout: number,
  tcr: number,
  tcw: number,
): void {
  t.rows[k]++;
  t.gross[k] += g;
  t.discount[k] += dsc;
  t.net[k] += nt;
  t.credits[k] += q;
  t.input[k] += tin;
  t.output[k] += tout;
  t.cacheRead[k] += tcr;
  t.cacheWrite[k] += tcw;
}

function makeExtra(n: number): ExtraArrays {
  return {
    listCost: new Float64Array(n),
    pricedGross: new Float64Array(n),
    longPremium: new Float64Array(n),
    autoGross: new Float64Array(n),
    autoList: new Float64Array(n),
    autoMeasuredGross: new Float64Array(n),
  };
}

export function emptyTotals(): Totals {
  return {
    rows: 0,
    gross: 0,
    discount: 0,
    net: 0,
    credits: 0,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    attributedGross: 0,
    unattributedGross: 0,
    users: 0,
    listCost: 0,
    pricedGross: 0,
    unpricedGross: 0,
    longPremium: 0,
    longPremiumRows: 0,
    autoGross: 0,
    autoList: 0,
    autoMeasuredGross: 0,
    est: { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 },
    tierGross: new Float64Array(CATEGORIES.length),
  };
}

/** An Auto row counts as measured when its billed amount is within this band of its original price; anything else points at a price-card mismatch. */
export const AUTO_MEASURE_BAND = { min: 0.5, max: 1.05 } as const;

export function aggregate(
  store: DataStore,
  prep: Prepared,
  models: ModelTable,
  mask: Uint8Array | null,
  range: { start: number; end: number },
  opts: AggregateOptions,
): Aggregates {
  const nU = store.dicts.user.values.length;
  const nP = store.dicts.product.values.length;
  const nS = store.dicts.sku.values.length;
  const nM = store.dicts.model.values.length;
  const nO = store.dicts.org.values.length;
  const nA = store.dicts.app.values.length;
  const nR = store.dicts.repo.values.length;
  const nC = store.dicts.costCenter.values.length;
  const nF = store.dicts.file.values.length;
  const nPlans = Math.max(1, prep.planLabels.length);
  const start = Math.max(range.start, store.minDay);
  const end = Math.min(range.end, store.maxDay);
  const nDays = Math.max(0, end - start + 1);
  const nMonths = Math.max(1, prep.nMonths);
  const longRatio = opts.longRatio ?? 1.02;

  const days = { ...makeMeasures(nDays), activeUsers: new Int32Array(nDays), anyUsers: new Int32Array(nDays) };
  const mUser = makeMeasures(nU);
  const mProduct = makeMeasures(nP);
  const mSku = makeMeasures(nS);
  const mModel = makeMeasures(nM);
  const mOrg = makeMeasures(nO);
  const mApp = makeMeasures(nA);
  const mRepo = makeMeasures(nR);
  const mCc = makeMeasures(nC);
  const mFile = makeMeasures(nF);
  const mSel = makeMeasures(2);
  const mPlan = makeMeasures(nPlans);
  const mDow = makeMeasures(7);
  const totals = emptyTotals();
  const modelExtra = makeExtra(nM);

  const ua: UserAcc = {
    ...makeExtra(nU),
    gross: mUser.gross,
    discount: mUser.discount,
    net: mUser.net,
    credits: mUser.credits,
    rows: mUser.rows,
    input: mUser.input,
    output: mUser.output,
    cacheRead: mUser.cacheRead,
    cacheWrite: mUser.cacheWrite,
    tier: new Float64Array(nU * CATEGORIES.length),
    estIn: new Float64Array(nU),
    estCr: new Float64Array(nU),
    estCw: new Float64Array(nU),
    estOut: new Float64Array(nU),
    firstDay: new Int32Array(nU).fill(2_000_000_000),
    lastDay: new Int32Array(nU).fill(-1),
    org: new Int32Array(nU).fill(-1),
    costCenter: new Int32Array(nU).fill(-1),
    orgMixed: new Uint8Array(nU),
    costCenterMixed: new Uint8Array(nU),
    quotaMax: new Float32Array(nU),
    recent: new Float64Array(nU),
    prior: new Float64Array(nU),
    activeDays: new Int32Array(nU),
    peakDay: new Float64Array(nU),
    peakDayIdx: new Int32Array(nU).fill(-1),
    daysN: new Int32Array(nU),
    daysSum: new Float64Array(nU),
    daysSumSq: new Float64Array(nU),
  };

  const keepUserModel = nU * nM <= 30_000_000;
  const userModel = keepUserModel ? new Float32Array(nU * nM) : null;
  const monthQuota = new Float32Array(nU * nMonths);
  const userMonthGross = new Float64Array(nU * nMonths);
  const pcModel = new PairCounter(nU, nM);
  const pcProduct = new PairCounter(nU, nP);
  const pcOrg = new PairCounter(nU, nO);
  const pcCc = new PairCounter(nU, nC);
  const pcRepo = new PairCounter(nU, nR);
  const pcApp = new PairCounter(nU, nA);
  const seenUser = new Uint8Array(nU);

  const {
    day: sDay,
    user: sUser,
    product: sProduct,
    sku: sSku,
    model: sModel,
    org: sOrg,
    app: sApp,
    repo: sRepo,
    costCenter: sCc,
    file: sFile,
    auto: sAuto,
    qty: sQty,
    gross: sGross,
    discount: sDisc,
    net: sNet,
    quota: sQuota,
    input: sIn,
    output: sOut,
    cacheRead: sCr,
    cacheWrite: sCw,
  } = store;
  const { priced, rIn, rCr, rCw, rOut, hasLong, longThr, lIn, lCr, lCw, lOut, cat } = models;
  const n = store.n;
  const minDay = store.minDay;
  const recentStart = end - 6;
  const priorStart = end - 13;
  let included = 0;
  let firstDay = Number.POSITIVE_INFINITY;
  let lastDay = Number.NEGATIVE_INFINITY;
  const tierN = CATEGORIES.length;

  for (let i = 0; i < n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = sDay[i];
    if (d < start || d > end) continue;
    included++;
    const u = sUser[i];
    const m = sModel[i];
    const di = d - start;
    const g = sGross[i];
    const dsc = sDisc[i];
    const nt = sNet[i];
    const q = sQty[i];
    const tin = sIn[i];
    const tout = sOut[i];
    const tcr = sCr[i];
    const tcw = sCw[i];
    const auto = sAuto[i];

    if (d < firstDay) firstDay = d;
    if (d > lastDay) lastDay = d;

    // Row-level list-cost estimate on the default tier.
    let D = 0;
    let cIn = 0;
    let cCr = 0;
    let cCw = 0;
    let cOut = 0;
    if (priced[m] === 1) {
      cIn = tin * rIn[m];
      cCr = tcr * rCr[m];
      cCw = tcw * rCw[m];
      cOut = tout * rOut[m];
      D = cIn + cCr + cCw + cOut;
    }
    let premium = 0;
    if (D > 0) {
      const ratio = g / D;
      totals.listCost += D;
      totals.pricedGross += g;
      modelExtra.listCost[m] += D;
      modelExtra.pricedGross[m] += g;
      ua.listCost[u] += D;
      ua.pricedGross[u] += g;
      const eIn = cIn * ratio;
      const eCr = cCr * ratio;
      const eCw = cCw * ratio;
      const eOut = cOut * ratio;
      totals.est.input += eIn;
      totals.est.cacheRead += eCr;
      totals.est.cacheWrite += eCw;
      totals.est.output += eOut;
      ua.estIn[u] += eIn;
      ua.estCr[u] += eCr;
      ua.estCw[u] += eCw;
      ua.estOut[u] += eOut;
      if (hasLong[m] === 1 && ratio > longRatio && tin + tcr + tcw > longThr[m]) {
        const L = tin * lIn[m] + tcr * lCr[m] + tcw * lCw[m] + tout * lOut[m];
        premium = Math.min(g, L) - D;
        if (premium < 0) premium = 0;
      }
    } else {
      totals.unpricedGross += g;
    }
    if (premium > 0) {
      totals.longPremium += premium;
      totals.longPremiumRows++;
      modelExtra.longPremium[m] += premium;
      ua.longPremium[u] += premium;
    }

    // Totals
    totals.rows++;
    totals.gross += g;
    totals.discount += dsc;
    totals.net += nt;
    totals.credits += q;
    totals.input += tin;
    totals.output += tout;
    totals.cacheRead += tcr;
    totals.cacheWrite += tcw;
    totals.tierGross[cat[m]] += g;
    if (u === BLANK_ID) totals.unattributedGross += g;
    else totals.attributedGross += g;
    if (auto === 1) {
      totals.autoGross += g;
      modelExtra.autoGross[m] += g;
      ua.autoGross[u] += g;
      // The original price is only measured where it is unambiguous: a priced model with token counts and a standard-tier request.
      // Long-context rows are left out because the tier they were billed on cannot be told from the file.
      if (D > 0 && premium === 0) {
        const r = g / D;
        if (r >= AUTO_MEASURE_BAND.min && r <= AUTO_MEASURE_BAND.max) {
          totals.autoList += D;
          totals.autoMeasuredGross += g;
          modelExtra.autoList[m] += D;
          modelExtra.autoMeasuredGross[m] += g;
          ua.autoList[u] += D;
          ua.autoMeasuredGross[u] += g;
        }
      }
    }

    // Per-dimension measures
    addRow(days, di, g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mUser, u, g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mProduct, sProduct[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mSku, sSku[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mModel, m, g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mOrg, sOrg[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mApp, sApp[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mRepo, sRepo[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mCc, sCc[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mFile, sFile[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mSel, auto, g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mPlan, prep.planOfRow[i], g, dsc, nt, q, tin, tout, tcr, tcw);
    addRow(mDow, prep.dowOfDay[d - minDay], g, dsc, nt, q, tin, tout, tcr, tcw);

    // Per-user detail
    ua.tier[u * tierN + cat[m]] += g;
    if (d < ua.firstDay[u]) ua.firstDay[u] = d;
    if (d > ua.lastDay[u]) ua.lastDay[u] = d;
    const org = sOrg[i];
    if (org !== BLANK_ID) {
      if (ua.org[u] === -1) ua.org[u] = org;
      else if (ua.org[u] !== org) ua.orgMixed[u] = 1;
    }
    const cc = sCc[i];
    if (cc !== BLANK_ID) {
      if (ua.costCenter[u] === -1) ua.costCenter[u] = cc;
      else if (ua.costCenter[u] !== cc) ua.costCenterMixed[u] = 1;
    }
    const qt = sQuota[i];
    if (qt > ua.quotaMax[u]) ua.quotaMax[u] = qt;
    const mk = u * nMonths + prep.monthOfDay[d - minDay];
    if (qt > monthQuota[mk]) monthQuota[mk] = qt;
    userMonthGross[mk] += g;
    if (d >= recentStart) ua.recent[u] += g;
    else if (d >= priorStart) ua.prior[u] += g;
    if (userModel) userModel[u * nM + m] += g;

    if (u !== BLANK_ID) {
      seenUser[u] = 1;
      pcModel.add(u, m);
      pcProduct.add(u, sProduct[i]);
      pcOrg.add(u, org);
      pcCc.add(u, cc);
      pcRepo.add(u, sRepo[i]);
      pcApp.add(u, sApp[i]);
    }
  }

  let users = 0;
  for (let u = 0; u < nU; u++) users += seenUser[u];
  totals.users = users;

  // Day-grouped pass: active days, peak days and per-day distinct users.
  if (included > 0 && nDays > 0) {
    const offsets = new Int32Array(nDays + 1);
    for (let i = 0; i < n; i++) {
      if (mask !== null && mask[i] === 0) continue;
      const d = sDay[i];
      if (d < start || d > end) continue;
      offsets[d - start + 1]++;
    }
    for (let k = 0; k < nDays; k++) offsets[k + 1] += offsets[k];
    const cursor = offsets.slice(0, nDays);
    const order = new Int32Array(included);
    for (let i = 0; i < n; i++) {
      if (mask !== null && mask[i] === 0) continue;
      const d = sDay[i];
      if (d < start || d > end) continue;
      order[cursor[d - start]++] = i;
    }
    const stamp = new Int32Array(nU).fill(-1);
    const dayG = new Float64Array(nU);
    const touched = new Int32Array(nU);
    const thr = opts.activeThreshold;
    for (let di = 0; di < nDays; di++) {
      const a = offsets[di];
      const b = offsets[di + 1];
      if (a === b) continue;
      let nt = 0;
      for (let k = a; k < b; k++) {
        const i = order[k];
        const u = sUser[i];
        if (u === BLANK_ID) continue;
        if (stamp[u] !== di) {
          stamp[u] = di;
          touched[nt++] = u;
        }
        dayG[u] += sGross[i];
      }
      days.anyUsers[di] = nt;
      let act = 0;
      for (let t = 0; t < nt; t++) {
        const u = touched[t];
        const g = dayG[u];
        dayG[u] = 0;
        if (g >= thr) {
          act++;
          ua.activeDays[u]++;
          ua.daysN[u]++;
          ua.daysSum[u] += g;
          ua.daysSumSq[u] += g * g;
        }
        if (g > ua.peakDay[u]) {
          ua.peakDay[u] = g;
          ua.peakDayIdx[u] = di + start;
        }
      }
      days.activeUsers[di] = act;
    }
  }

  const grouped = (c: PairCounter) => c.counts;
  return {
    rowsIncluded: included,
    range: { start, end, length: nDays },
    firstDay: included ? firstDay : Number.NaN,
    lastDay: included ? lastDay : Number.NaN,
    totals,
    days,
    user: mUser,
    product: mProduct,
    sku: mSku,
    model: mModel,
    org: mOrg,
    app: mApp,
    repo: mRepo,
    costCenter: mCc,
    file: mFile,
    selection: mSel,
    plan: mPlan,
    dow: mDow,
    usersIn: {
      model: grouped(pcModel),
      product: grouped(pcProduct),
      org: grouped(pcOrg),
      costCenter: grouped(pcCc),
      repo: grouped(pcRepo),
      app: grouped(pcApp),
    },
    userAcc: ua,
    modelExtra,
    userModel,
    nModels: nM,
    monthQuota,
    userMonthGross,
    nMonths,
  };
}

export interface QuickTotals {
  rows: number;
  gross: number;
  net: number;
  discount: number;
  credits: number;
  users: number;
}

/** Cheap totals-only pass, used for previous-period comparisons. */
export function quickTotals(store: DataStore, mask: Uint8Array | null, from: number, to: number): QuickTotals {
  const seen = new Uint8Array(store.dicts.user.values.length);
  const out: QuickTotals = { rows: 0, gross: 0, net: 0, discount: 0, credits: 0, users: 0 };
  const { day, user, gross, net, discount, qty } = store;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const d = day[i];
    if (d < from || d > to) continue;
    out.rows++;
    out.gross += gross[i];
    out.net += net[i];
    out.discount += discount[i];
    out.credits += qty[i];
    if (user[i] !== BLANK_ID) seen[user[i]] = 1;
  }
  for (let u = 0; u < seen.length; u++) out.users += seen[u];
  return out;
}

/** Sum a per-model measure into groups defined by a per-model group index (vendor / category). */
export function rollupModels(m: Measures, groupOf: Uint8Array, nGroups: number): Measures {
  const out = makeMeasures(nGroups);
  for (let k = 0; k < groupOf.length; k++) {
    const g = groupOf[k];
    for (const key of Object.keys(out) as (keyof Measures)[]) out[key][g] += m[key][k];
  }
  return out;
}

export const rollupByCategory = (models: ModelTable, m: Measures): Measures =>
  rollupModels(m, models.cat, CATEGORIES.length);
export const rollupByVendor = (models: ModelTable, m: Measures): Measures =>
  rollupModels(m, models.vendor, VENDORS.length);
