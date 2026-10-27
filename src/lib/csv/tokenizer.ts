/**
 * Minimal streaming CSV tokenizer (RFC 4180 + leniency).
 * Handles quoted fields, escaped quotes, CRLF/LF/CR line endings, and records split across chunks.
 * Blank lines are skipped.
 */
export class CsvTokenizer {
  private carry = '';
  private readonly delim: number;
  private readonly onRow: (fields: string[]) => void;

  constructor(delimiter: string, onRow: (fields: string[]) => void) {
    this.onRow = onRow;
    this.delim = delimiter.charCodeAt(0);
  }

  push(chunk: string): void {
    const text = this.carry ? this.carry + chunk : chunk;
    const consumed = this.parse(text, false);
    this.carry = consumed < text.length ? text.slice(consumed) : '';
  }

  end(): void {
    if (this.carry) {
      const text = this.carry;
      this.carry = '';
      this.parse(text, true);
    }
  }

  /** Parses complete rows from `s`; returns the index of the first unconsumed character. */
  private parse(text: string, atEnd: boolean): number {
    const length = text.length;
    const delimiter = this.delim;
    let position = 0;
    while (position < length) {
      const rowStart = position;
      const fields: string[] = [];
      let index = position;
      let rowDone = false;
      while (!rowDone) {
        let value: string;
        if (index < length && text.charCodeAt(index) === 34) {
          let searchFrom = index + 1;
          let segmentStart = searchFrom;
          let fieldText = '';
          let closed = false;
          for (;;) {
            const quoteIndex = text.indexOf('"', searchFrom);
            if (quoteIndex === -1) break;
            if (quoteIndex + 1 >= length && !atEnd) break; // cannot tell yet whether this is an escaped quote
            if (quoteIndex + 1 < length && text.charCodeAt(quoteIndex + 1) === 34) {
              fieldText += text.slice(segmentStart, quoteIndex + 1);
              searchFrom = quoteIndex + 2;
              segmentStart = searchFrom;
              continue;
            }
            fieldText += text.slice(segmentStart, quoteIndex);
            index = quoteIndex + 1;
            closed = true;
            break;
          }
          if (!closed) {
            if (!atEnd) return rowStart;
            fieldText += text.slice(segmentStart);
            index = length;
          }
          value = fieldText;
          while (index < length) {
            const charCode = text.charCodeAt(index);
            if (charCode === delimiter || charCode === 10 || charCode === 13) break;
            index++;
          }
        } else {
          let fieldEnd = index;
          while (fieldEnd < length) {
            const charCode = text.charCodeAt(fieldEnd);
            if (charCode === delimiter || charCode === 10 || charCode === 13) break;
            fieldEnd++;
          }
          value = text.slice(index, fieldEnd);
          index = fieldEnd;
        }

        if (index >= length) {
          if (!atEnd) return rowStart;
          fields.push(value);
          rowDone = true;
        } else {
          const charCode = text.charCodeAt(index);
          fields.push(value);
          if (charCode === delimiter) {
            index++;
          } else {
            index += charCode === 13 && index + 1 < length && text.charCodeAt(index + 1) === 10 ? 2 : 1;
            rowDone = true;
          }
        }
      }
      position = index;
      if (fields.length === 1 && fields[0] === '') continue;
      this.onRow(fields);
    }
    return length;
  }
}

export function detectDelimiter(text: string): string {
  const end = text.indexOf('\n');
  const line = end === -1 ? text : text.slice(0, end);
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const character = line[i];
    if (character === '"') inQuotes = !inQuotes;
    else if (!inQuotes && character in counts) counts[character]++;
  }
  let best = ',';
  let max = 0;
  for (const delimiter of Object.keys(counts)) {
    if (counts[delimiter] > max) {
      max = counts[delimiter];
      best = delimiter;
    }
  }
  return best;
}
