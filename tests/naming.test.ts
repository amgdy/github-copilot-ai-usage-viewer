import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The product is always called "GitHub Copilot", never just "Copilot". This scans the source, the docs and the
 * Arabic dictionaries. Identifiers such as GitHubCopilotIcon and lower-case ids or URLs such as /copilot/ are fine.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BARE = /(?<!GitHub\s)(?<![\w/.\-])Copilot\b/g;
const SCAN_EXT = /\.(ts|tsx|css|md|html)$/;

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (SCAN_EXT.test(name)) out.push(p);
  }
  return out;
}

const FILES = [
  ...walk(join(ROOT, 'src')),
  ...walk(join(ROOT, 'scripts')),
  ...walk(join(ROOT, 'docs')),
  ...['index.html', 'README.md', 'AGENTS.md', 'package.json'].map((f) => join(ROOT, f)).filter(existsSync),
];

describe('naming', () => {
  it('scans a reasonable number of files', () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  it('always says "GitHub Copilot", not just "Copilot"', () => {
    const bad: string[] = [];
    for (const file of FILES) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(BARE)) {
        const line = text.slice(0, m.index).split('\n').length;
        const lineText = text.split('\n')[line - 1].trim();
        bad.push(`${relative(ROOT, file)}:${line}: ${lineText.slice(0, 120)}`);
      }
    }
    expect(bad, `Write "GitHub Copilot" in:\n${bad.join('\n')}`).toEqual([]);
  });
});
