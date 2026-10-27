import type { CalcRef } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { dataCoverage } from '../../lib/analytics/coverage';
import type { ModelTable } from '../../lib/pricing/models';
import { labelOf, type DataStore, type FileInfo } from '../../lib/types';
import { DOW_NAMES, dowOf, fmtDay, monthEndDay, monthIndexOf, monthLabel, monthStartDay, ymd } from '../../lib/utils/date';
import { fmtInt, fmtUSD } from '../../lib/utils/format';
import { topIds } from '../shared';
import type { StoreScan } from './scan';
import { fmtShare, listNames } from './text';

export type CheckStatus = 'pass' | 'warn' | 'info';

export interface Check {
  id: string;
  title: string;
  status: CheckStatus;
  result: string;
  action?: string;
  details?: string[];
  /** Ids of the explanations of what the check looks at. */
  calc?: CalcRef;
}

export interface GapRun {
  from: number;
  to: number;
  weekdays: number;
}

export interface Gaps {
  /** Runs of empty days that contain at least one weekday, trimmed of leading and trailing weekend days. */
  runs: GapRun[];
  missingWeekdays: number;
  missingWeekendDays: number;
}

export interface FileTotals {
  read: number;
  kept: number;
  duplicates: number;
  badDates: number;
  badNumbers: number;
  balance: number;
  price: number;
  negative: number;
  /** Rows with a readable date. The balance, price and negative counters are taken over these rows. */
  dated: number;
}

const TOKEN_COLUMNS = ['input', 'output', 'cache_read', 'cache_write'];
const COLUMN_ORDER = [
  'username',
  'product',
  'sku',
  'model',
  'gross_amount',
  'quantity',
  'applied_cost_per_quantity',
  'discount_amount',
  'net_amount',
  'total_monthly_quota',
  'organization',
  'repository',
  'cost_center_name',
];

const IMPACT: Record<string, string> = {
  username: msg('All usage is put in one unnamed group, so rankings, segments and seat findings do not apply.'),
  product: msg('Product views show a single group.'),
  sku: msg('SKU views show a single group.'),
  model: msg('Model comparison and model-based savings are not available.'),
  gross_amount: msg('Usage is worked out as AI credits × the unit price, so the unit price check has nothing to compare.'),
  quantity: msg('AI credits are worked out from usage and the unit price.'),
  applied_cost_per_quantity: msg('Each AI credit is taken to cost $0.01.'),
  discount_amount: msg('Covered is worked out as usage minus billed.'),
  net_amount: msg('Billed is worked out as usage minus covered.'),
  total_monthly_quota: msg('The size of the pool of included credits is unknown. Import your license list on the Licenses page.'),
  organization: msg('Organization views show a single group.'),
  repository: msg('Repository views show a single group.'),
  cost_center_name: msg('Cost center views show a single group.'),
};

const BILLING_IMPACT = msg(
  'The file does not say what was billed, so covered and billed amounts are left at $0 and overage, pool and seat findings are hidden.',
);

const lacks = (f: FileInfo, c: string): boolean => f.missingColumns.includes(c);
const noBilling = (f: FileInfo): boolean => lacks(f, 'discount_amount') && lacks(f, 'net_amount');

export function sumFiles(files: FileInfo[]): FileTotals {
  const t: FileTotals = { read: 0, kept: 0, duplicates: 0, badDates: 0, badNumbers: 0, balance: 0, price: 0, negative: 0, dated: 0 };
  for (const f of files) {
    t.read += f.rowsRead;
    t.kept += f.rowsKept;
    t.duplicates += f.duplicatesDropped;
    t.badDates += f.badDateRows;
    t.badNumbers += f.badNumberCells;
    t.balance += f.balanceMismatchRows;
    t.price += f.priceMismatchRows;
    t.negative += f.negativeRows;
  }
  t.dated = t.read - t.badDates;
  return t;
}

/** Runs of days without rows inside the date span. */
export function findGaps(store: DataStore, scan: StoreScan): Gaps {
  const span = scan.daysSeen.length;
  const runs: GapRun[] = [];
  let missingWeekdays = 0;
  let missingWeekendDays = 0;
  let k = 0;
  while (k < span) {
    if (scan.daysSeen[k]) {
      k++;
      continue;
    }
    let end = k;
    while (end + 1 < span && !scan.daysSeen[end + 1]) end++;
    let from = store.minDay + k;
    let to = store.minDay + end;
    let weekdays = 0;
    for (let d = from; d <= to; d++) {
      if (dowOf(d) < 5) weekdays++;
      else missingWeekendDays++;
    }
    missingWeekdays += weekdays;
    if (weekdays > 0) {
      while (dowOf(from) >= 5) from++;
      while (dowOf(to) >= 5) to--;
      runs.push({ from, to, weekdays });
    }
    k = end + 1;
  }
  return { runs, missingWeekdays, missingWeekendDays };
}

export function describeGap(run: GapRun, withYear: boolean): string {
  const from = fmtDay(run.from, withYear);
  if (run.from === run.to) return `${DOW_NAMES[dowOf(run.from)]} ${from}`;
  return tp(run.weekdays, '{from} to {to} ({n} weekday)', '{from} to {to} ({n} weekdays)', {
    from,
    to: fmtDay(run.to, withYear),
    n: fmtInt(run.weekdays),
  });
}

const share = (n: number, total: number): string => fmtShare(total > 0 ? n / total : 0);
const more = (n: number): string => tp(n, 'and {n} more', 'and {n} more', { n: fmtInt(n) });

function missingLines(files: FileInfo[]): string[] {
  const line = (column: string, n: number, impact: string): string =>
    files.length > 1
      ? t('{column} ({n} of {total} files): {impact}', { column, n: fmtInt(n), total: fmtInt(files.length), impact: t(impact) })
      : t('{column}: {impact}', { column, impact: t(impact) });
  const lines: string[] = [];
  for (const c of COLUMN_ORDER) {
    const n = files.filter((f) => lacks(f, c) && !(noBilling(f) && (c === 'discount_amount' || c === 'net_amount'))).length;
    if (n) lines.push(line(c, n, IMPACT[c]));
  }
  const billing = files.filter(noBilling).length;
  if (billing) lines.push(line(t('{a} and {b}', { a: 'discount_amount', b: 'net_amount' }), billing, BILLING_IMPACT));
  return lines;
}

function columnsCheck(files: FileInfo[], quotaKnown: boolean): Check {
  const title = t('Expected columns are present');
  const affected = files.filter((f) => f.missingColumns.some((c) => !TOKEN_COLUMNS.includes(c)));
  const quotaEmpty = !quotaKnown && files.every((f) => !lacks(f, 'total_monthly_quota'));
  if (!affected.length && !quotaEmpty) {
    return {
      id: 'columns',
      title,
      calc: ['data-missing-columns', 'data-coverage-flags'],
      status: 'pass',
      result: t('Every file has all the optional columns, apart from the token columns checked below.'),
    };
  }
  const missing = [...new Set(affected.flatMap((f) => f.missingColumns.filter((c) => !TOKEN_COLUMNS.includes(c))))].sort((a, b) => {
    const ia = COLUMN_ORDER.indexOf(a);
    const ib = COLUMN_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const details = missingLines(files);
  const result: string[] = [];
  if (affected.length) {
    const names = listNames(missing, 4);
    result.push(
      files.length === 1
        ? t('The file does not have: {names}.', { names })
        : tp(affected.length, '{n} of {total} files does not have: {names}.', '{n} of {total} files do not have: {names}.', {
            n: fmtInt(affected.length),
            total: fmtInt(files.length),
            names,
          }),
    );
  }
  if (quotaEmpty) {
    result.push(t('The total_monthly_quota column has no values.'));
    details.push(t('{column}: {impact}', { column: 'total_monthly_quota', impact: t(IMPACT.total_monthly_quota) }));
  }
  return {
    id: 'columns',
    title,
    calc: ['data-missing-columns', 'data-coverage-flags'],
    status: 'warn',
    result: result.join(' '),
    action: t('Export the report again with every column if you can. Otherwise the app works with what is there, within the limits listed.'),
    details,
  };
}

function datesCheck(tot: FileTotals): Check {
  const title = t('Dates can be read');
  if (tot.badDates === 0) return { id: 'dates', title, calc: 'data-bad-dates', status: 'pass', result: t('Every row has a readable date.') };
  return {
    id: 'dates',
    title,
    calc: 'data-bad-dates',
    status: 'warn',
    result: tp(
      tot.badDates,
      '{n} row ({share}) has a date the app cannot read and was skipped.',
      '{n} rows ({share}) have a date the app cannot read and were skipped.',
      { n: fmtInt(tot.badDates), share: share(tot.badDates, tot.read) },
    ),
    action: t('Dates such as 2026-03-05 or 3/5/2026 are read. Fix the date column in the file and load it again.'),
  };
}

function numbersCheck(tot: FileTotals): Check {
  const title = t('Numbers can be read');
  if (tot.badNumbers === 0) {
    return {
      id: 'numbers',
      title,
      calc: 'data-bad-numbers',
      status: 'pass',
      result: t('Every filled-in amount, quantity, token and seat-size cell is a number.'),
    };
  }
  return {
    id: 'numbers',
    title,
    calc: 'data-bad-numbers',
    status: 'warn',
    result: tp(
      tot.badNumbers,
      '{n} cell could not be read as a number and was counted as 0. The row is kept.',
      '{n} cells could not be read as a number and were counted as 0. The rows are kept.',
      { n: fmtInt(tot.badNumbers) },
    ),
    action: t('Numbers need a dot for decimals, and no thousands separators, currency signs or text such as N/A. Fix those cells and load the file again.'),
  };
}

function duplicatesCheck(files: FileInfo[], tot: FileTotals): Check {
  const title = t('Duplicate rows');
  if (files.length < 2) {
    return {
      id: 'duplicates',
      title,
      calc: 'data-duplicates',
      status: 'pass',
      result: t('One file loaded. Duplicates are only looked for between different files, so identical rows inside one file are kept.'),
    };
  }
  if (tot.duplicates === 0) {
    return {
      id: 'duplicates',
      title,
      calc: 'data-duplicates',
      status: 'pass',
      result: tp(files.length, 'No row appears in more than one file.', 'No row appears in more than one of the {n} files.', { n: fmtInt(files.length) }),
    };
  }
  const empty = files.filter((f) => f.rowsKept === 0 && f.duplicatesDropped > 0).map((f) => f.name);
  return {
    id: 'duplicates',
    title,
    calc: 'data-duplicates',
    status: 'info',
    result: tp(
      tot.duplicates,
      '{n} row ({share}) is identical to a row from another file and was dropped.',
      '{n} rows ({share}) are identical to a row from another file and were dropped.',
      { n: fmtInt(tot.duplicates), share: share(tot.duplicates, tot.dated) },
    ),
    action: t('This is expected when exports overlap or the same file is loaded twice. Nothing to do unless you meant those rows to count twice.'),
    details: empty.length
      ? [t('{names} added no rows. Every row with a readable date was already loaded from another file.', { names: listNames(empty) })]
      : undefined,
  };
}

function balanceCheck(files: FileInfo[], tot: FileTotals): Check {
  const title = t('Amounts add up (usage = covered + billed)');
  const checked = files.filter((f) => !noBilling(f));
  if (!checked.length) {
    return {
      id: 'balance',
      title,
      calc: 'data-balance-mismatches',
      status: 'info',
      result: t('Not checked. No file has discount_amount or net_amount.'),
      action: t('Export the report with both columns to see what was covered by the included credits and what was billed.'),
    };
  }
  const skipped = files.length - checked.length;
  const details = skipped
    ? [
        tp(
          skipped,
          '{n} file without discount_amount and net_amount columns is not checked.',
          '{n} files without discount_amount and net_amount columns are not checked.',
          { n: fmtInt(skipped) },
        ),
      ]
    : undefined;
  if (tot.balance === 0) {
    return { id: 'balance', title, calc: 'data-balance-mismatches', status: 'pass', result: t('Usage equals covered plus billed on every row.'), details };
  }
  return {
    id: 'balance',
    title,
    calc: 'data-balance-mismatches',
    status: 'warn',
    result: tp(tot.balance, '{n} row ({share}) has usage that is not covered plus billed.', '{n} rows ({share}) have usage that is not covered plus billed.', {
      n: fmtInt(tot.balance),
      share: share(tot.balance, tot.dated),
    }),
    action: t(
      'On those rows usage is not covered plus billed, so the three totals will not tie out. Check the source export, or treat the affected totals with care.',
    ),
    details,
  };
}

function priceCheck(files: FileInfo[], tot: FileTotals): Check {
  const title = t('Usage matches the unit price (usage = quantity × unit price)');
  if (files.every((f) => lacks(f, 'quantity'))) {
    return {
      id: 'price',
      title,
      calc: 'data-price-mismatches',
      status: 'info',
      result: t('Not checked. No file has a quantity column, so AI credits are worked out from usage.'),
    };
  }
  if (tot.price === 0) {
    return { id: 'price', title, calc: 'data-price-mismatches', status: 'pass', result: t('Usage equals quantity × the unit price on every row.') };
  }
  return {
    id: 'price',
    title,
    calc: 'data-price-mismatches',
    status: 'warn',
    result: tp(
      tot.price,
      '{n} row ({share}) has usage that differs from quantity × the unit price.',
      '{n} rows ({share}) have usage that differs from quantity × the unit price.',
      { n: fmtInt(tot.price), share: share(tot.price, tot.dated) },
    ),
    action: t('AI credit counts follow quantity and dollar amounts follow usage, so the two disagree on those rows. Check the source export.'),
  };
}

function usernameCheck(store: DataStore, scan: StoreScan): Check {
  const title = t('Rows have a username');
  const u = scan.dims.user;
  if (u.blankRows === 0) return { id: 'username', title, calc: 'data-no-username', status: 'pass', result: t('Every row has a username.') };
  if (u.blankRows === scan.rows) {
    return {
      id: 'username',
      title,
      calc: 'data-no-username',
      status: 'warn',
      result: t('No row has a username.'),
      action: t('Per-user views, segments and seat findings need it. Check that the username column is in the export and filled in.'),
    };
  }
  const products = topIds(scan.unattributedByProduct, 3).map(
    (id) => `${labelOf('product', store.dicts.product.values[id])} (${fmtShare(scan.unattributedByProduct[id] / u.blankGross)})`,
  );
  const result = [
    tp(u.blankRows, '{n} row ({share}) has no username.', '{n} rows ({share}) have no username.', {
      n: fmtInt(u.blankRows),
      share: share(u.blankRows, scan.rows),
    }),
    ...(scan.gross > 0 ? [t('That is {share} of usage.', { share: fmtShare(u.blankGross / scan.gross) })] : []),
  ];
  return {
    id: 'username',
    title,
    calc: 'data-no-username',
    status: 'info',
    result: result.join(' '),
    action: t('Normal for repository-level products such as code quality. This usage counts in the totals but cannot be linked to a person.'),
    details: products.length && u.blankGross > 0 ? [t('Mostly from {names}.', { names: listNames(products) })] : undefined,
  };
}

function modelsCheck(store: DataStore, scan: StoreScan, models: ModelTable): Check {
  const title = t('Models with prices');
  const m = scan.dims.model;
  const unpriced: number[] = [];
  let named = 0;
  let unpricedGross = 0;
  for (let id = 0; id < store.dicts.model.values.length; id++) {
    if (m.rows[id] === 0 || id === m.blankId) continue;
    named++;
    if (models.priced[id] === 0) {
      unpriced.push(id);
      unpricedGross += m.gross[id];
    }
  }
  if (named === 0) {
    return {
      id: 'models',
      title,
      calc: 'data-model-prices',
      status: 'info',
      result: t('No row has a model name, so there is nothing to price.'),
      action: t('Export the report with the model column to see the model mix and the cost by token type.'),
    };
  }
  if (!unpriced.length) {
    return {
      id: 'models',
      title,
      calc: 'data-model-prices',
      status: 'pass',
      result: tp(named, 'The model has a price on the price card.', 'All {n} models have a price on the price card.', { n: fmtInt(named) }),
    };
  }
  unpriced.sort((a, b) => m.gross[b] - m.gross[a]);
  const lines = unpriced.slice(0, 5).map((id) => `${labelOf('model', store.dicts.model.values[id])}: ${fmtUSD(m.gross[id], 2)}`);
  if (unpriced.length > 5) lines.push(more(unpriced.length - 5));
  const result = [
    named === 1
      ? t('The model has no price on the price card.')
      : tp(unpriced.length, '{n} of {total} models has no price on the price card.', '{n} of {total} models have no price on the price card.', {
          n: fmtInt(unpriced.length),
          total: fmtInt(named),
        }),
    ...(scan.gross > 0 ? [t('That is {share} of usage.', { share: fmtShare(unpricedGross / scan.gross) })] : []),
  ];
  return {
    id: 'models',
    title,
    calc: 'data-model-prices',
    status: 'warn',
    result: result.join(' '),
    action: t(
      'Their usage still counts in every total, but the cost by token type and the long-context premium skip them, and the Auto discount on their rows is estimated, not measured. Add their prices under Model pricing in Settings.',
    ),
    details: lines,
  };
}

function tokensCheck(store: DataStore, files: FileInfo[]): Check {
  const title = t('Token columns are present');
  if (!store.hasTokens) {
    return {
      id: 'tokens',
      title,
      calc: ['data-coverage-flags', 'token-coverage'],
      status: 'info',
      result: t('The data has no input or output token columns.'),
      action: t(
        'The cost by token type, the cache hit rate, the long-context premium and the measured Auto discount need them, so only credit totals are available. Export the report with token columns if your export offers them.',
      ),
    };
  }
  const lacking = files.filter((f) => TOKEN_COLUMNS.some((c) => lacks(f, c)));
  if (!lacking.length) {
    return {
      id: 'tokens',
      title,
      calc: ['data-coverage-flags', 'token-coverage'],
      status: 'pass',
      result: t('The input, output, cache read and cache write token columns are present in every file.'),
    };
  }
  const total = fmtInt(files.length);
  const details = TOKEN_COLUMNS.flatMap((column) => {
    const n = files.filter((f) => lacks(f, column)).length;
    return n ? [t('{column}: missing in {n} of {total} files.', { column, n: fmtInt(n), total })] : [];
  });
  return {
    id: 'tokens',
    title,
    calc: ['data-coverage-flags', 'token-coverage'],
    status: 'warn',
    result:
      files.length === 1
        ? t('Some token columns are missing in the file.')
        : t('Some token columns are missing in {n} of {total} files.', { n: fmtInt(lacking.length), total }),
    action: t(
      'Missing token columns read as 0, so token totals and the cache hit rate under-count the rows from those files, and the cost by token type is skewed. Rows from a file with no token columns cannot be priced at all, so token coverage is lower. Export those files again with all token columns.',
    ),
    details,
  };
}

function gapsCheck(store: DataStore, scan: StoreScan, gaps: Gaps): Check {
  const title = t('No gaps in the date range');
  if (scan.daysSeen.length <= 1) {
    return {
      id: 'gaps',
      title,
      calc: 'data-gaps',
      status: 'info',
      result: t('The data covers a single day.'),
      action: t('There is no range to check for gaps. Trends and month projections need more days.'),
    };
  }
  const withYear = ymd(store.minDay).y !== ymd(store.maxDay).y;
  const range = { from: fmtDay(store.minDay, withYear), to: fmtDay(store.maxDay, withYear) };
  if (gaps.missingWeekdays === 0 && gaps.missingWeekendDays === 0) {
    return { id: 'gaps', title, calc: 'data-gaps', status: 'pass', result: t('Every day from {from} to {to} has rows.', range) };
  }
  const weekend = (n: number) =>
    tp(n, '{n} weekend day has none, which is normal for most teams.', '{n} weekend days have none, which is normal for most teams.', { n: fmtInt(n) });
  if (gaps.missingWeekdays === 0) {
    return {
      id: 'gaps',
      title,
      calc: 'data-gaps',
      status: 'pass',
      result: `${t('Every weekday from {from} to {to} has rows.', range)} ${weekend(gaps.missingWeekendDays)}`,
    };
  }
  const details = gaps.runs.slice(0, 5).map((r) => describeGap(r, withYear));
  if (gaps.runs.length > 5) details.push(more(gaps.runs.length - 5));
  const result = [
    tp(gaps.missingWeekdays, '{n} weekday from {from} to {to} has no rows.', '{n} weekdays from {from} to {to} have no rows.', {
      n: fmtInt(gaps.missingWeekdays),
      ...range,
    }),
    ...(gaps.missingWeekendDays ? [weekend(gaps.missingWeekendDays)] : []),
  ];
  return {
    id: 'gaps',
    title,
    calc: 'data-gaps',
    status: 'warn',
    result: result.join(' '),
    action: t('Public holidays and quiet days are normal. If usage was expected, export the missing period and load it together with the other files.'),
    details,
  };
}

function monthsCheck(store: DataStore, scan: StoreScan): Check {
  const title = t('More than one month of data');
  const months = new Set<number>();
  for (let k = 0; k < scan.daysSeen.length; k++) if (scan.daysSeen[k]) months.add(monthIndexOf(store.minDay + k));
  const first = monthIndexOf(store.minDay);
  const last = monthIndexOf(store.maxDay);
  if (months.size <= 1) {
    return {
      id: 'months',
      title,
      calc: 'data-months',
      status: 'info',
      result: t('Only one month of data ({month}).', { month: monthLabel(first) }),
      action: t('Trends and pool projections are limited with one month. Load more months to compare them. Several files can be loaded together.'),
    };
  }
  return {
    id: 'months',
    title,
    calc: 'data-months',
    status: 'pass',
    result: tp(months.size, '{n} month of data, from {from} to {to}.', '{n} months of data, from {from} to {to}.', {
      n: fmtInt(months.size),
      from: monthLabel(first),
      to: monthLabel(last),
    }),
  };
}

function monthEndCheck(store: DataStore): Check {
  const title = t('The last month is complete');
  const last = monthIndexOf(store.maxDay);
  const end = monthEndDay(last);
  const firstStartsLate = store.minDay > monthStartDay(monthIndexOf(store.minDay));
  const details = firstStartsLate ? [t('The data starts on {date}, so the first month is partial too.', { date: fmtDay(store.minDay, true) })] : undefined;
  const date = fmtDay(store.maxDay, true);
  const month = monthLabel(last);
  if (store.maxDay >= end) {
    return {
      id: 'monthEnd',
      title,
      calc: 'data-month-end',
      status: 'pass',
      result: t('The data ends on {date}, the last day of {month}.', { date, month }),
      details,
    };
  }
  const n = end - store.maxDay;
  return {
    id: 'monthEnd',
    title,
    calc: 'data-month-end',
    status: 'info',
    result: tp(n, 'The data ends on {date}, {n} day before the end of {month}.', 'The data ends on {date}, {n} days before the end of {month}.', {
      date,
      month,
      n: fmtInt(n),
    }),
    action: t('The last month is projected from the days so far, so its month-end figures are estimates. Load the full month once it ends for final numbers.'),
    details,
  };
}

function negativesCheck(tot: FileTotals): Check {
  const title = t('Negative amounts');
  if (tot.negative === 0) return { id: 'negatives', title, calc: 'data-negative-rows', status: 'pass', result: t('No row has a negative amount.') };
  return {
    id: 'negatives',
    title,
    calc: 'data-negative-rows',
    status: 'info',
    result: tp(
      tot.negative,
      '{n} row ({share}) has a negative usage, covered or billed amount.',
      '{n} rows ({share}) have a negative usage, covered or billed amount.',
      { n: fmtInt(tot.negative), share: share(tot.negative, tot.dated) },
    ),
    action: t(
      'The app does not know why an amount is negative. A credit or a refund can look like this. The rows are included in every total, so totals can be lower than the sum of the positive rows.',
    ),
  };
}

export function buildChecks(store: DataStore, scan: StoreScan, models: ModelTable, gaps: Gaps): Check[] {
  const files = store.files;
  const totals = sumFiles(files);
  return [
    columnsCheck(files, dataCoverage(store).quota),
    datesCheck(totals),
    numbersCheck(totals),
    duplicatesCheck(files, totals),
    balanceCheck(files, totals),
    priceCheck(files, totals),
    usernameCheck(store, scan),
    modelsCheck(store, scan, models),
    tokensCheck(store, files),
    gapsCheck(store, scan, gaps),
    monthsCheck(store, scan),
    monthEndCheck(store),
    negativesCheck(totals),
  ];
}
