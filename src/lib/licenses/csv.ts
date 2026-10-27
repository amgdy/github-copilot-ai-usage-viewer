import { CsvTokenizer, detectDelimiter } from '../csv/tokenizer';
import { hasLoginColumn, isUsageHeader, mapColumns, normalizeHeader, type ColumnMap, type SeatField } from './columns';
import { laterDay, readDay } from './dates';
import { newReadStats, seatFromFields, type ReadStats } from './fields';
import { MAX_SEATS } from './json';
import type { LicenseSeat, SeatSource } from './types';

const CHUNK = 1 << 16;

export type CsvHeaderKind = 'seats' | 'usage' | 'no-login';

export interface CsvSeats {
  /** 'usage' when the header is a usage report's, 'no-login' when no column holds a login. */
  header: CsvHeaderKind;
  /** The header is the Activity report's (it has report_time or last_surface_used). */
  activityReport: boolean;
  /** Every valid row, before merging. */
  records: LicenseSeat[];
  skipped: number;
  stats: ReadStats;
  /** The latest report_time day. */
  reportDay?: string;
  capped: boolean;
}

/**
 * Reads seats from CSV text: the Activity report (report_time, login, last_authenticated_at, last_activity_at,
 * last_surface_used) or any CSV with a login column and optional plan, org, team, email and date columns.
 * Header names ignore case, spaces, quotes and a BOM. Never throws.
 */
export function parseSeatsCsv(text: string): CsvSeats {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const out: CsvSeats = { header: 'seats', activityReport: false, records: [], skipped: 0, stats: newReadStats(), capped: false };
  let names: string[] = [];
  let columns: ColumnMap | null = null;
  let source: SeatSource = 'list';
  let stopped = false;

  const tokenizer = new CsvTokenizer(detectDelimiter(body), (row) => {
    if (stopped) return;
    if (columns === null) {
      names = row.map(normalizeHeader);
      // A usage report always has several columns, so a one-column file is never refused as one.
      if (names.length > 1 && isUsageHeader(names)) {
        out.header = 'usage';
        stopped = true;
        return;
      }
      if (!hasLoginColumn(names)) {
        out.header = 'no-login';
        stopped = true;
        return;
      }
      columns = mapColumns(names);
      out.activityReport = columns.reportTime !== undefined || names.includes('last_surface_used');
      source = columns.activity !== undefined ? 'activity' : 'list';
      return;
    }
    const cols = columns;
    if (row.every((cell) => cell.trim() === '')) return;
    const loginAt = cols.login;
    // A header written again in the middle of the file (two exports joined together) is not a seat.
    if (loginAt !== undefined && normalizeHeader(row[loginAt] ?? '') === names[loginAt]) return;
    if (out.records.length >= MAX_SEATS) {
      out.capped = true;
      stopped = true;
      return;
    }
    const get = (field: SeatField): string | undefined => {
      const columnIndex = cols[field];
      if (columnIndex === undefined) return undefined;
      const value = row[columnIndex];
      return value === undefined || value === '' ? undefined : value;
    };
    const seat = seatFromFields(get, source, out.stats);
    if (seat === null) {
      out.skipped++;
      return;
    }
    out.records.push(seat);
    if (cols.reportTime !== undefined) {
      const day = readDay(row[cols.reportTime]);
      if (typeof day === 'string') out.reportDay = laterDay(out.reportDay, day);
    }
  });
  // Feeding the text in chunks lets a file with the wrong header (a large usage report) stop after the first chunk.
  for (let i = 0; i < body.length && !stopped; i += CHUNK) tokenizer.push(body.slice(i, i + CHUNK));
  if (!stopped) tokenizer.end();
  return out;
}
