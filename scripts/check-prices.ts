/**
 * Compares the built-in price card (src/lib/pricing/card.ts) with the live GitHub Docs page
 * "Models and pricing for GitHub Copilot". Run: npm run check:prices
 * Exit code 0: the card matches. Exit code 1: something differs (the differences are printed).
 */
import { CARD_AS_OF, CARD_SOURCE } from '../src/lib/pricing/card.ts';
import { compareWithCard, fetchLivePriceCard } from '../src/lib/pricing/docsParser.ts';

const live = await fetchLivePriceCard();
const diffs = compareWithCard(live.models);

console.log(`Built-in card: ${CARD_AS_OF}. Live page: ${CARD_SOURCE}`);
console.log(`Models on the live page: ${live.models.length}`);
for (const w of live.warnings) console.log(`Warning: ${w}`);

if (diffs.length === 0) {
  console.log('The built-in card matches the live page.');
} else {
  for (const d of diffs) {
    if (d.kind === 'new') console.log(`New on GitHub Docs: ${d.name} ${JSON.stringify(d.live)}`);
    else if (d.kind === 'missing') console.log(`Not on GitHub Docs anymore: ${d.name}`);
    else console.log(`Changed: ${d.name} (${d.fields.join(', ')}) live ${JSON.stringify(d.live)}`);
  }
  console.log('Update src/lib/pricing/card.ts and CARD_AS_OF, then run the tests.');
  process.exitCode = 1;
}
