import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { DEMO_FILE_NAME, generateDemo } from '../src/lib/demo/generate.ts';

// Usage: npm run gen:demo [-- --seed 42 | --random]. Writes made-up data only.
try {
  const { values: options } = parseArgs({ options: { seed: { type: 'string' }, random: { type: 'boolean' } } });
  const seed = options.random ? Math.floor(Math.random() * 2 ** 31) : options.seed === undefined ? undefined : Number(options.seed);
  if (seed !== undefined && !Number.isInteger(seed)) {
    throw new Error(`The seed must be a whole number, for example --seed 42. You gave "${options.seed}".`);
  }
  const demo = generateDemo(seed === undefined ? {} : { seed });
  const outputPath = join(import.meta.dirname, '..', 'demo-data', DEMO_FILE_NAME);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, demo.csv);
  // Temporal is built into Node 26. The range includes both the first and the last day.
  const dayCount = Temporal.PlainDate.from(demo.start).until(Temporal.PlainDate.from(demo.end)).days + 1;
  console.log(`Wrote ${outputPath}: ${demo.rows} rows, ${demo.users} users, ${dayCount} days from ${demo.start} to ${demo.end}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
