import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_FILE_NAME, generateDemo } from '../src/lib/demo/generate.ts';

const here = dirname(fileURLToPath(import.meta.url));
// Usage: npm run gen:demo [-- --seed 42 | --random]. Writes made-up data only.
const args = process.argv.slice(2);
const seedAt = args.indexOf('--seed');
const seed = args.includes('--random') ? Math.floor(Math.random() * 2 ** 31) : seedAt >= 0 ? Number(args[seedAt + 1]) : undefined;
const out = join(here, '..', 'demo-data', DEMO_FILE_NAME);
const demo = generateDemo(seed === undefined || !Number.isFinite(seed) ? {} : { seed });
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, demo.csv);
console.log(`Wrote ${out}: ${demo.rows} rows, ${demo.users} users, ${demo.start} to ${demo.end}`);
