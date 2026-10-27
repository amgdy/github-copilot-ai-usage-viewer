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

export const makeMeasures = (size: number): Measures => ({
  rows: new Float64Array(size),
  gross: new Float64Array(size),
  discount: new Float64Array(size),
  net: new Float64Array(size),
  credits: new Float64Array(size),
  input: new Float64Array(size),
  output: new Float64Array(size),
  cacheRead: new Float64Array(size),
  cacheWrite: new Float64Array(size),
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
  private readonly nD: number;
  constructor(userCount: number, groupCount: number) {
    this.nD = groupCount;
    this.counts = new Int32Array(groupCount);
    if (userCount * groupCount <= 24_000_000) this.dense = new Uint8Array(userCount * groupCount);
    else this.set = new Set();
  }
  add(user: number, group: number): void {
    const pairKey = user * this.nD + group;
    if (this.dense) {
      if (this.dense[pairKey] === 0) {
        this.dense[pairKey] = 1;
        this.counts[group]++;
      }
    } else if (!this.set!.has(pairKey)) {
      this.set!.add(pairKey);
      this.counts[group]++;
    }
  }
}

function addRow(
  measures: Measures,
  index: number,
  gross: number,
  discount: number,
  net: number,
  credits: number,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
): void {
  measures.rows[index]++;
  measures.gross[index] += gross;
  measures.discount[index] += discount;
  measures.net[index] += net;
  measures.credits[index] += credits;
  measures.input[index] += inputTokens;
  measures.output[index] += outputTokens;
  measures.cacheRead[index] += cacheReadTokens;
  measures.cacheWrite[index] += cacheWriteTokens;
}

function makeExtra(size: number): ExtraArrays {
  return {
    listCost: new Float64Array(size),
    pricedGross: new Float64Array(size),
    longPremium: new Float64Array(size),
    autoGross: new Float64Array(size),
    autoList: new Float64Array(size),
    autoMeasuredGross: new Float64Array(size),
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
  prepared: Prepared,
  models: ModelTable,
  mask: Uint8Array | null,
  range: { start: number; end: number },
  options: AggregateOptions,
): Aggregates {
  const userCount = store.dicts.user.values.length;
  const productCount = store.dicts.product.values.length;
  const skuCount = store.dicts.sku.values.length;
  const modelCount = store.dicts.model.values.length;
  const orgCount = store.dicts.org.values.length;
  const appCount = store.dicts.app.values.length;
  const repoCount = store.dicts.repo.values.length;
  const costCenterCount = store.dicts.costCenter.values.length;
  const fileCount = store.dicts.file.values.length;
  const nPlans = Math.max(1, prepared.planLabels.length);
  const start = Math.max(range.start, store.minDay);
  const end = Math.min(range.end, store.maxDay);
  const nDays = Math.max(0, end - start + 1);
  const nMonths = Math.max(1, prepared.nMonths);
  const longRatio = options.longRatio ?? 1.02;

  const days = { ...makeMeasures(nDays), activeUsers: new Int32Array(nDays), anyUsers: new Int32Array(nDays) };
  const mUser = makeMeasures(userCount);
  const mProduct = makeMeasures(productCount);
  const skuMeasures = makeMeasures(skuCount);
  const mModel = makeMeasures(modelCount);
  const orgMeasures = makeMeasures(orgCount);
  const appMeasures = makeMeasures(appCount);
  const mRepo = makeMeasures(repoCount);
  const costCenterMeasures = makeMeasures(costCenterCount);
  const mFile = makeMeasures(fileCount);
  const selectionMeasures = makeMeasures(2);
  const mPlan = makeMeasures(nPlans);
  const dayOfWeekMeasures = makeMeasures(7);
  const totals = emptyTotals();
  const modelExtra = makeExtra(modelCount);

  const perUser: UserAcc = {
    ...makeExtra(userCount),
    gross: mUser.gross,
    discount: mUser.discount,
    net: mUser.net,
    credits: mUser.credits,
    rows: mUser.rows,
    input: mUser.input,
    output: mUser.output,
    cacheRead: mUser.cacheRead,
    cacheWrite: mUser.cacheWrite,
    tier: new Float64Array(userCount * CATEGORIES.length),
    estIn: new Float64Array(userCount),
    estCr: new Float64Array(userCount),
    estCw: new Float64Array(userCount),
    estOut: new Float64Array(userCount),
    firstDay: new Int32Array(userCount).fill(2_000_000_000),
    lastDay: new Int32Array(userCount).fill(-1),
    org: new Int32Array(userCount).fill(-1),
    costCenter: new Int32Array(userCount).fill(-1),
    orgMixed: new Uint8Array(userCount),
    costCenterMixed: new Uint8Array(userCount),
    quotaMax: new Float32Array(userCount),
    recent: new Float64Array(userCount),
    prior: new Float64Array(userCount),
    activeDays: new Int32Array(userCount),
    peakDay: new Float64Array(userCount),
    peakDayIdx: new Int32Array(userCount).fill(-1),
    daysN: new Int32Array(userCount),
    daysSum: new Float64Array(userCount),
    daysSumSq: new Float64Array(userCount),
  };

  const keepUserModel = userCount * modelCount <= 30_000_000;
  const userModel = keepUserModel ? new Float32Array(userCount * modelCount) : null;
  const monthQuota = new Float32Array(userCount * nMonths);
  const userMonthGross = new Float64Array(userCount * nMonths);
  const pcModel = new PairCounter(userCount, modelCount);
  const pcProduct = new PairCounter(userCount, productCount);
  const pcOrg = new PairCounter(userCount, orgCount);
  const costCenterUsers = new PairCounter(userCount, costCenterCount);
  const pcRepo = new PairCounter(userCount, repoCount);
  const pcApp = new PairCounter(userCount, appCount);
  const seenUser = new Uint8Array(userCount);

  const {
    day: dayOfRow,
    user: sUser,
    product: sProduct,
    sku: skuOfRow,
    model: sModel,
    org: orgOfRow,
    app: appOfRow,
    repo: sRepo,
    costCenter: costCenterOfRow,
    file: sFile,
    auto: sAuto,
    qty: creditsOfRow,
    gross: sGross,
    discount: sDisc,
    net: netOfRow,
    quota: sQuota,
    input: inputOfRow,
    output: outputOfRow,
    cacheRead: cacheReadOfRow,
    cacheWrite: cacheWriteOfRow,
  } = store;
  const { priced, rIn: inputRate, rCr: cacheReadRate, rCw: cacheWriteRate, rOut: outputRate, hasLong, longThr, lIn: longInputRate, lCr: longCacheReadRate, lCw: longCacheWriteRate, lOut: longOutputRate, cat: categoryOfModel } = models;
  const rowCount = store.n;
  const minDay = store.minDay;
  const recentStart = end - 6;
  const priorStart = end - 13;
  let included = 0;
  let firstDay = Number.POSITIVE_INFINITY;
  let lastDay = Number.NEGATIVE_INFINITY;
  const tierN = CATEGORIES.length;

  for (let i = 0; i < rowCount; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const day = dayOfRow[i];
    if (day < start || day > end) continue;
    included++;
    const user = sUser[i];
    const model = sModel[i];
    const dayIndex = day - start;
    const gross = sGross[i];
    const discount = sDisc[i];
    const net = netOfRow[i];
    const credits = creditsOfRow[i];
    const inputTokens = inputOfRow[i];
    const outputTokens = outputOfRow[i];
    const cacheReadTokens = cacheReadOfRow[i];
    const cacheWriteTokens = cacheWriteOfRow[i];
    const auto = sAuto[i];

    if (day < firstDay) firstDay = day;
    if (day > lastDay) lastDay = day;

    // Row-level list-cost estimate on the default tier.
    let listCost = 0;
    let inputCost = 0;
    let cacheReadCost = 0;
    let cacheWriteCost = 0;
    let outputCost = 0;
    if (priced[model] === 1) {
      inputCost = inputTokens * inputRate[model];
      cacheReadCost = cacheReadTokens * cacheReadRate[model];
      cacheWriteCost = cacheWriteTokens * cacheWriteRate[model];
      outputCost = outputTokens * outputRate[model];
      listCost = inputCost + cacheReadCost + cacheWriteCost + outputCost;
    }
    let premium = 0;
    if (listCost > 0) {
      const ratio = gross / listCost;
      totals.listCost += listCost;
      totals.pricedGross += gross;
      modelExtra.listCost[model] += listCost;
      modelExtra.pricedGross[model] += gross;
      perUser.listCost[user] += listCost;
      perUser.pricedGross[user] += gross;
      const estimatedInput = inputCost * ratio;
      const estimatedCacheRead = cacheReadCost * ratio;
      const estimatedCacheWrite = cacheWriteCost * ratio;
      const estimatedOutput = outputCost * ratio;
      totals.est.input += estimatedInput;
      totals.est.cacheRead += estimatedCacheRead;
      totals.est.cacheWrite += estimatedCacheWrite;
      totals.est.output += estimatedOutput;
      perUser.estIn[user] += estimatedInput;
      perUser.estCr[user] += estimatedCacheRead;
      perUser.estCw[user] += estimatedCacheWrite;
      perUser.estOut[user] += estimatedOutput;
      if (hasLong[model] === 1 && ratio > longRatio && inputTokens + cacheReadTokens + cacheWriteTokens > longThr[model]) {
        const longContextCost = inputTokens * longInputRate[model] + cacheReadTokens * longCacheReadRate[model] + cacheWriteTokens * longCacheWriteRate[model] + outputTokens * longOutputRate[model];
        premium = Math.min(gross, longContextCost) - listCost;
        if (premium < 0) premium = 0;
      }
    } else {
      totals.unpricedGross += gross;
    }
    if (premium > 0) {
      totals.longPremium += premium;
      totals.longPremiumRows++;
      modelExtra.longPremium[model] += premium;
      perUser.longPremium[user] += premium;
    }

    // Totals
    totals.rows++;
    totals.gross += gross;
    totals.discount += discount;
    totals.net += net;
    totals.credits += credits;
    totals.input += inputTokens;
    totals.output += outputTokens;
    totals.cacheRead += cacheReadTokens;
    totals.cacheWrite += cacheWriteTokens;
    totals.tierGross[categoryOfModel[model]] += gross;
    if (user === BLANK_ID) totals.unattributedGross += gross;
    else totals.attributedGross += gross;
    if (auto === 1) {
      totals.autoGross += gross;
      modelExtra.autoGross[model] += gross;
      perUser.autoGross[user] += gross;
      // The original price is only measured where it is unambiguous: a priced model with token counts and a standard-tier request.
      // Long-context rows are left out because the tier they were billed on cannot be told from the file.
      if (listCost > 0 && premium === 0) {
        const ratio = gross / listCost;
        if (ratio >= AUTO_MEASURE_BAND.min && ratio <= AUTO_MEASURE_BAND.max) {
          totals.autoList += listCost;
          totals.autoMeasuredGross += gross;
          modelExtra.autoList[model] += listCost;
          modelExtra.autoMeasuredGross[model] += gross;
          perUser.autoList[user] += listCost;
          perUser.autoMeasuredGross[user] += gross;
        }
      }
    }

    // Per-dimension measures
    addRow(days, dayIndex, gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(mUser, user, gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(mProduct, sProduct[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(skuMeasures, skuOfRow[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(mModel, model, gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(orgMeasures, orgOfRow[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(appMeasures, appOfRow[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(mRepo, sRepo[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(costCenterMeasures, costCenterOfRow[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(mFile, sFile[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(selectionMeasures, auto, gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(mPlan, prepared.planOfRow[i], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);
    addRow(dayOfWeekMeasures, prepared.dowOfDay[day - minDay], gross, discount, net, credits, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);

    // Per-user detail
    perUser.tier[user * tierN + categoryOfModel[model]] += gross;
    if (day < perUser.firstDay[user]) perUser.firstDay[user] = day;
    if (day > perUser.lastDay[user]) perUser.lastDay[user] = day;
    const org = orgOfRow[i];
    if (org !== BLANK_ID) {
      if (perUser.org[user] === -1) perUser.org[user] = org;
      else if (perUser.org[user] !== org) perUser.orgMixed[user] = 1;
    }
    const costCenter = costCenterOfRow[i];
    if (costCenter !== BLANK_ID) {
      if (perUser.costCenter[user] === -1) perUser.costCenter[user] = costCenter;
      else if (perUser.costCenter[user] !== costCenter) perUser.costCenterMixed[user] = 1;
    }
    const quota = sQuota[i];
    if (quota > perUser.quotaMax[user]) perUser.quotaMax[user] = quota;
    const userMonthIndex = user * nMonths + prepared.monthOfDay[day - minDay];
    if (quota > monthQuota[userMonthIndex]) monthQuota[userMonthIndex] = quota;
    userMonthGross[userMonthIndex] += gross;
    if (day >= recentStart) perUser.recent[user] += gross;
    else if (day >= priorStart) perUser.prior[user] += gross;
    if (userModel) userModel[user * modelCount + model] += gross;

    if (user !== BLANK_ID) {
      seenUser[user] = 1;
      pcModel.add(user, model);
      pcProduct.add(user, sProduct[i]);
      pcOrg.add(user, org);
      costCenterUsers.add(user, costCenter);
      pcRepo.add(user, sRepo[i]);
      pcApp.add(user, appOfRow[i]);
    }
  }

  let users = 0;
  for (let user = 0; user < userCount; user++) users += seenUser[user];
  totals.users = users;

  // Day-grouped pass: active days, peak days and per-day distinct users.
  if (included > 0 && nDays > 0) {
    const offsets = new Int32Array(nDays + 1);
    for (let i = 0; i < rowCount; i++) {
      if (mask !== null && mask[i] === 0) continue;
      const day = dayOfRow[i];
      if (day < start || day > end) continue;
      offsets[day - start + 1]++;
    }
    for (let k = 0; k < nDays; k++) offsets[k + 1] += offsets[k];
    const cursor = offsets.slice(0, nDays);
    const order = new Int32Array(included);
    for (let i = 0; i < rowCount; i++) {
      if (mask !== null && mask[i] === 0) continue;
      const day = dayOfRow[i];
      if (day < start || day > end) continue;
      order[cursor[day - start]++] = i;
    }
    const stamp = new Int32Array(userCount).fill(-1);
    const dayGross = new Float64Array(userCount);
    const touched = new Int32Array(userCount);
    const activeThreshold = options.activeThreshold;
    for (let dayIndex = 0; dayIndex < nDays; dayIndex++) {
      const dayStart = offsets[dayIndex];
      const dayEnd = offsets[dayIndex + 1];
      if (dayStart === dayEnd) continue;
      let touchedCount = 0;
      for (let k = dayStart; k < dayEnd; k++) {
        const rowIndex = order[k];
        const user = sUser[rowIndex];
        if (user === BLANK_ID) continue;
        if (stamp[user] !== dayIndex) {
          stamp[user] = dayIndex;
          touched[touchedCount++] = user;
        }
        dayGross[user] += sGross[rowIndex];
      }
      days.anyUsers[dayIndex] = touchedCount;
      let activeCount = 0;
      for (let index = 0; index < touchedCount; index++) {
        const user = touched[index];
        const gross = dayGross[user];
        dayGross[user] = 0;
        if (gross >= activeThreshold) {
          activeCount++;
          perUser.activeDays[user]++;
          perUser.daysN[user]++;
          perUser.daysSum[user] += gross;
          perUser.daysSumSq[user] += gross * gross;
        }
        if (gross > perUser.peakDay[user]) {
          perUser.peakDay[user] = gross;
          perUser.peakDayIdx[user] = dayIndex + start;
        }
      }
      days.activeUsers[dayIndex] = activeCount;
    }
  }

  const grouped = (counter: PairCounter) => counter.counts;
  return {
    rowsIncluded: included,
    range: { start, end, length: nDays },
    firstDay: included ? firstDay : Number.NaN,
    lastDay: included ? lastDay : Number.NaN,
    totals,
    days,
    user: mUser,
    product: mProduct,
    sku: skuMeasures,
    model: mModel,
    org: orgMeasures,
    app: appMeasures,
    repo: mRepo,
    costCenter: costCenterMeasures,
    file: mFile,
    selection: selectionMeasures,
    plan: mPlan,
    dow: dayOfWeekMeasures,
    usersIn: {
      model: grouped(pcModel),
      product: grouped(pcProduct),
      org: grouped(pcOrg),
      costCenter: grouped(costCenterUsers),
      repo: grouped(pcRepo),
      app: grouped(pcApp),
    },
    userAcc: perUser,
    modelExtra,
    userModel,
    nModels: modelCount,
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
  const { day, user, gross, net, discount, qty: credits } = store;
  for (let i = 0; i < store.n; i++) {
    if (mask !== null && mask[i] === 0) continue;
    const rowDay = day[i];
    if (rowDay < from || rowDay > to) continue;
    out.rows++;
    out.gross += gross[i];
    out.net += net[i];
    out.discount += discount[i];
    out.credits += credits[i];
    if (user[i] !== BLANK_ID) seen[user[i]] = 1;
  }
  for (let userId = 0; userId < seen.length; userId++) out.users += seen[userId];
  return out;
}

/** Sum a per-model measure into groups defined by a per-model group index (vendor / category). */
export function rollupModels(modelMeasures: Measures, groupOf: Uint8Array, nGroups: number): Measures {
  const out = makeMeasures(nGroups);
  for (let k = 0; k < groupOf.length; k++) {
    const group = groupOf[k];
    for (const key of Object.keys(out) as (keyof Measures)[]) out[key][group] += modelMeasures[key][k];
  }
  return out;
}

export const rollupByCategory = (models: ModelTable, modelMeasures: Measures): Measures =>
  rollupModels(modelMeasures, models.cat, CATEGORIES.length);
export const rollupByVendor = (models: ModelTable, modelMeasures: Measures): Measures =>
  rollupModels(modelMeasures, models.vendor, VENDORS.length);
