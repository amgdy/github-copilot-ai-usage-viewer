/**
 * Minimal streaming CSV tokenizer (RFC 4180 + leniency).
 * Handles quoted fields, escaped quotes, CRLF/LF/CR line endings, and records split across chunks.
 * Blank lines are skipped.
 */
export class CsvTokenizer {
  private carry = '';
  private readonly delim: number;

  constructor(
    delimiter: string,
    private readonly onRow: (fields: string[]) => void,
  ) {
    this.delim = delimiter.charCodeAt(0);
  }

  push(chunk: string): void {
    const s = this.carry ? this.carry + chunk : chunk;
    const consumed = this.parse(s, false);
    this.carry = consumed < s.length ? s.slice(consumed) : '';
  }

  end(): void {
    if (this.carry) {
      const s = this.carry;
      this.carry = '';
      this.parse(s, true);
    }
  }

  /** Parses complete rows from `s`; returns the index of the first unconsumed character. */
  private parse(s: string, atEnd: boolean): number {
    const n = s.length;
    const d = this.delim;
    let pos = 0;
    while (pos < n) {
      const rowStart = pos;
      const fields: string[] = [];
      let i = pos;
      let rowDone = false;
      while (!rowDone) {
        let value: string;
        if (i < n && s.charCodeAt(i) === 34) {
          let j = i + 1;
          let seg = j;
          let acc = '';
          let closed = false;
          for (;;) {
            const q = s.indexOf('"', j);
            if (q === -1) break;
            if (q + 1 >= n && !atEnd) break; // cannot tell yet whether this is an escaped quote
            if (q + 1 < n && s.charCodeAt(q + 1) === 34) {
              acc += s.slice(seg, q + 1);
              j = q + 2;
              seg = j;
              continue;
            }
            acc += s.slice(seg, q);
            i = q + 1;
            closed = true;
            break;
          }
          if (!closed) {
            if (!atEnd) return rowStart;
            acc += s.slice(seg);
            i = n;
          }
          value = acc;
          while (i < n) {
            const c = s.charCodeAt(i);
            if (c === d || c === 10 || c === 13) break;
            i++;
          }
        } else {
          let j = i;
          while (j < n) {
            const c = s.charCodeAt(j);
            if (c === d || c === 10 || c === 13) break;
            j++;
          }
          value = s.slice(i, j);
          i = j;
        }

        if (i >= n) {
          if (!atEnd) return rowStart;
          fields.push(value);
          rowDone = true;
        } else {
          const c = s.charCodeAt(i);
          fields.push(value);
          if (c === d) {
            i++;
          } else {
            i += c === 13 && i + 1 < n && s.charCodeAt(i + 1) === 10 ? 2 : 1;
            rowDone = true;
          }
        }
      }
      pos = i;
      if (fields.length === 1 && fields[0] === '') continue;
      this.onRow(fields);
    }
    return n;
  }
}

export function detectDelimiter(text: string): string {
  const end = text.indexOf('\n');
  const line = end === -1 ? text : text.slice(0, end);
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && c in counts) counts[c]++;
  }
  let best = ',';
  let max = 0;
  for (const k of Object.keys(counts)) {
    if (counts[k] > max) {
      max = counts[k];
      best = k;
    }
  }
  return best;
}
