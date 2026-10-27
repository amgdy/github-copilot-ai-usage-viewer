import { detectDelimiter } from '../csv/tokenizer';
import { readLogin } from './login';
import { MAX_SEATS } from './json';
import type { LicenseSeat } from './types';

export interface LoginList {
  seats: LicenseSeat[];
  /** Tokens that are not GitHub logins. */
  skipped: number;
  capped: boolean;
}

const SEPARATORS = /[\s,;]+/;

/** A comment line in a pasted list. */
export const isCommentLine = (line: string): boolean => line.startsWith('#') || line.startsWith('//');

/** Whether the first two lines have the same number (two or more) of cells: a table, not a list of logins. */
export function looksTabular(text: string): boolean {
  const delimiter = detectDelimiter(text);
  const widths: number[] = [];
  let from = 0;
  while (widths.length < 2 && from < text.length) {
    let to = text.indexOf('\n', from);
    if (to === -1) to = text.length;
    const line = text.slice(from, to).trim();
    from = to + 1;
    if (line !== '' && !isCommentLine(line)) widths.push(line.split(delimiter).length);
  }
  return widths.length === 2 && widths[0] >= 2 && widths[0] === widths[1];
}

/** The tokens of a pasted list: split by line breaks, commas, semicolons and spaces, without comment lines. */
export function listTokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r\n|\n|\r/)) {
    const line = raw.trim();
    if (line === '' || isCommentLine(line)) continue;
    for (const token of line.split(SEPARATORS)) if (token !== '') out.push(token);
  }
  return out;
}

/**
 * Reads a plain list of logins: one per line, or separated by commas, semicolons or spaces. A leading "@" and
 * quotes are dropped. Comment lines (# or //) are ignored. Anything else that is not a login counts as skipped.
 */
export function parseLoginList(text: string): LoginList {
  const out: LoginList = { seats: [], skipped: 0, capped: false };
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (const token of listTokens(body)) {
    const login = readLogin(token);
    if (login === null) {
      out.skipped++;
      continue;
    }
    if (out.seats.length >= MAX_SEATS) {
      out.capped = true;
      continue;
    }
    out.seats.push({ login, orgs: [], teams: [], source: 'list' });
  }
  return out;
}
