import { useMemo, type ReactNode } from 'react';
import { Card, DataTable, cx, type CalcRef, type Column } from '../../components/ui';
import { msg, t } from '../../i18n';
import type { FileInfo } from '../../lib/types';
import { isoDate } from '../../lib/utils/date';
import { fmtInt } from '../../lib/utils/format';
import { delimiterName, fmtBytes } from './text';

interface Row {
  f: FileInfo;
  i: number;
}

const LEGEND: { term: string; text: string }[] = [
  { term: msg('Rows read'), text: msg('Data rows in the file, not counting the header.') },
  { term: msg('Rows kept'), text: msg('Rows added to the dataset: rows read, minus duplicates dropped and rows with an unreadable date.') },
  {
    term: msg('Duplicates dropped'),
    text: msg(
      'Rows identical to a row already loaded from another file: same day, user, product, SKU, model, Auto flag, organization, app, repository, cost center, quantity, amounts and token counts. The seat size and the unit price are not compared. Only checked when several files are loaded; identical rows inside one file are kept.',
    ),
  },
  { term: msg('Bad dates'), text: msg('Rows skipped because their date could not be read.') },
  { term: msg('Bad numbers'), text: msg('Cells in number columns that are not numbers. Each counts as 0 and its row is kept.') },
  { term: msg('Balance mismatches'), text: msg('Rows where usage is not covered plus billed.') },
  { term: msg('Price mismatches'), text: msg('Rows where usage is not quantity × the unit price, normally $0.01 per AI credit.') },
  { term: msg('Negative rows'), text: msg('Rows with a usage, covered or billed amount below 0.') },
  { term: msg('Missing columns'), text: msg('Optional report columns the file does not have. The checks below explain what each one limits.') },
  { term: msg('Extra columns'), text: msg('Columns the app does not use. They are ignored.') },
  { term: msg('Delimiter'), text: msg('The separator the app found between fields.') },
];

function Chip({ tone, children, title, className }: { tone: 'warn' | 'info'; children: ReactNode; title?: string; className?: string }) {
  return (
    <span title={title} className={cx('rounded px-1.5 py-0.5 font-medium', tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-info-soft text-info', className)}>
      {children}
    </span>
  );
}

function Count({ n, tone }: { n: number; tone?: 'warn' | 'info' }) {
  if (n === 0 || !tone) return <span className={n === 0 ? 'text-fg-subtle' : undefined}>{fmtInt(n)}</span>;
  return <Chip tone={tone}>{fmtInt(n)}</Chip>;
}

function buildColumns(multi: boolean): Column<Row>[] {
  const total = (pick: (f: FileInfo) => number) => (multi ? (rows: Row[]) => fmtInt(rows.reduce((sum, r) => sum + pick(r.f), 0)) : undefined);
  const count = (key: string, header: string, hint: string, pick: (f: FileInfo) => number, calc: CalcRef, tone?: 'warn' | 'info'): Column<Row> => ({
    key,
    header,
    hint,
    calc,
    align: 'end',
    value: (r) => pick(r.f),
    render: (r) => <Count n={pick(r.f)} tone={tone} />,
    total: total(pick),
  });
  const day = (pick: (rows: Row[]) => number | null) => (multi ? (rows: Row[]) => {
    const d = pick(rows);
    return d === null ? '–' : isoDate(d);
  } : undefined);
  const withRows = (rows: Row[]) => rows.filter((r) => r.f.rowsKept > 0);

  return [
    {
      key: 'name',
      header: t('Name'),
      value: (r) => r.f.name,
      render: (r) => (
        <span className="block max-w-72 truncate font-medium" title={r.f.name}>
          {r.f.name}
        </span>
      ),
    },
    {
      key: 'size',
      header: t('File size'),
      hint: t('File size as the browser reports it.'),
      calc: 'data-file-size',
      align: 'end',
      value: (r) => r.f.size,
      render: (r) => fmtBytes(r.f.size),
      total: multi ? (rows) => fmtBytes(rows.reduce((sum, r) => sum + r.f.size, 0)) : undefined,
    },
    count('read', t('Rows read'), t('Data rows in the file, not counting the header.'), (f) => f.rowsRead, 'data-rows-read'),
    {
      ...count('kept', t('Rows kept'), t('Rows added to the dataset. A file that kept no rows added nothing.'), (f) => f.rowsKept, 'data-rows-kept'),
      render: (r) => (r.f.rowsKept === 0 ? <Chip tone="warn">0</Chip> : fmtInt(r.f.rowsKept)),
    },
    count('duplicates', t('Duplicates dropped'), t('Rows identical to a row already loaded from another file.'), (f) => f.duplicatesDropped, 'data-duplicates', 'info'),
    count('badDates', t('Bad dates'), t('Rows skipped because the date could not be read.'), (f) => f.badDateRows, 'data-bad-dates', 'warn'),
    count('badNumbers', t('Bad numbers'), t('Cells that are not numbers. They count as 0 and the row is kept.'), (f) => f.badNumberCells, 'data-bad-numbers', 'warn'),
    count('balance', t('Balance mismatches'), t('Rows where usage is not covered plus billed.'), (f) => f.balanceMismatchRows, 'data-balance-mismatches', 'warn'),
    count('price', t('Price mismatches'), t('Rows where usage is not quantity × the unit price.'), (f) => f.priceMismatchRows, 'data-price-mismatches', 'warn'),
    count('negative', t('Negative rows'), t('Rows with a usage, covered or billed amount below 0.'), (f) => f.negativeRows, 'data-negative-rows', 'info'),
    {
      key: 'first',
      header: t('First day'),
      calc: 'data-first-day',
      value: (r) => (r.f.rowsKept > 0 ? isoDate(r.f.minDay) : null),
      total: day((rows) => (withRows(rows).length ? Math.min(...withRows(rows).map((r) => r.f.minDay)) : null)),
    },
    {
      key: 'last',
      header: t('Last day'),
      calc: 'data-last-day',
      value: (r) => (r.f.rowsKept > 0 ? isoDate(r.f.maxDay) : null),
      total: day((rows) => (withRows(rows).length ? Math.max(...withRows(rows).map((r) => r.f.maxDay)) : null)),
    },
    {
      key: 'missing',
      header: t('Missing columns'),
      hint: t('Optional report columns this file does not have.'),
      calc: 'data-missing-columns',
      value: (r) => r.f.missingColumns.join(', '),
      render: (r) =>
        r.f.missingColumns.length ? (
          <Chip tone="warn" title={r.f.missingColumns.join(', ')} className="inline-block max-w-56 truncate align-middle">
            {r.f.missingColumns.join(', ')}
          </Chip>
        ) : (
          <span className="text-fg-subtle">{t('None')}</span>
        ),
    },
    {
      key: 'extra',
      header: t('Extra columns'),
      hint: t('Columns the app does not use. They are ignored.'),
      calc: 'data-extra-columns',
      value: (r) => r.f.extraColumns.join(', '),
      render: (r) =>
        r.f.extraColumns.length ? (
          <span className="block max-w-56 truncate text-fg-muted" title={r.f.extraColumns.join(', ')}>
            {r.f.extraColumns.join(', ')}
          </span>
        ) : (
          <span className="text-fg-subtle">{t('None')}</span>
        ),
    },
    {
      key: 'delimiter',
      header: t('Delimiter'),
      hint: t('The separator the app found between fields.'),
      calc: 'data-delimiter',
      value: (r) => delimiterName(r.f.delimiter),
    },
  ];
}

export function FilesCard({ files }: { files: FileInfo[] }) {
  const rows = useMemo<Row[]>(() => files.map((f, i) => ({ f, i })), [files]);
  const columns = useMemo(() => buildColumns(files.length > 1), [files.length]);

  return (
    <Card title={t('Files')} subtitle={t('One row per file you loaded. Amber counts are worth a look, blue ones are for information.')} calc="data-files">
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.i}
        exportName="github-copilot-files"
        pageSize={25}
        searchable={files.length > 10}
        searchPlaceholder={t('Search files…')}
        emptyText={t('No files.')}
      />
      <dl className="mt-4 grid gap-x-8 gap-y-2 border-t border-border-muted pt-3 text-xs sm:grid-cols-2">
        {LEGEND.map((item) => (
          <div key={item.term}>
            <dt className="inline font-medium text-fg">{t(item.term)}. </dt>
            <dd className="inline text-fg-muted">{t(item.text)}</dd>
          </div>
        ))}
        <p className="text-fg-muted sm:col-span-2">
          {t('Mismatch and negative counts are taken before duplicates are dropped, so a duplicate row can count in them too.')}
        </p>
      </dl>
    </Card>
  );
}
