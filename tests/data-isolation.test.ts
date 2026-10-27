import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(name) ? [path] : [];
  });
}

const literals = (text: string): string[] => text.match(/(['"`])(?:\\.|(?!\1)[^\\\r\n])*\1/g) ?? [];

it('does not import or read customer files from the samples directory', () => {
  const files = ['src', 'scripts', 'tests'].flatMap((directory) => sourceFiles(join(ROOT, directory)));
  const violations: string[] = [];
  for (const path of files) {
    if (path.endsWith('data-isolation.test.ts')) continue;
    // Comments and documentation may warn about the directory; executable paths must not use it.
    // A bare 'samples' literal is a path segment too, as in join(dir, '..', 'samples').
    for (const literal of literals(readFileSync(path, 'utf8'))) {
      if (/(?:\.\.\/|\.\/|\/)samples(?:\/|['"`])/.test(literal) || /^['"`]samples(?:\/[^'"`]*)?['"`]$/.test(literal)) {
        violations.push(`${path.slice(ROOT.length)}: ${literal.slice(0, 100)}`);
      }
    }
  }
  expect(violations).toEqual([]);
});

/** The sample report button is the one way into the generator, and it downloads the generator only when clicked. */
const SAMPLE_LOADER = join('src', 'state', 'loadSample.ts');

it('keeps the made-up data generator behind the sample report button', () => {
  const demoDirectory = join(ROOT, 'src', 'lib', 'demo');
  const importers: string[] = [];
  for (const path of sourceFiles(join(ROOT, 'src'))) {
    if (path.startsWith(demoDirectory)) continue;
    if (literals(readFileSync(path, 'utf8')).some((literal) => /\/demo(?:\/|['"`])/.test(literal))) importers.push(path.slice(ROOT.length));
  }
  expect(importers).toEqual([SAMPLE_LOADER]);

  const loader = readFileSync(join(ROOT, SAMPLE_LOADER), 'utf8');
  expect(loader).toMatch(/await import\('\.\.\/lib\/demo\/generate'\)/);
  expect(loader).not.toMatch(/^\s*import\b[^;]*from\s+['"][^'"]*\/demo\//m);
});
